// File: src/services/integratedDataService.js
import config from '../config/appConfig';
import groundTruthService from './groundTruthService';
import githubDataService from './githubDataService';
import systemAnalysisService from './SystemAnalysisService'; // ← NEW: Import system analysis service

/**
 * Integrated Data Service
 * Central service for loading and integrating all data sources
 */
class IntegratedDataService {
  constructor() {
    this.integratedData = null;
    this.isDataLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Load all data sources
   * @param {Object} options - Loading options
   * @param {boolean} [options.forceReload] - Force reload data
   * @returns {Promise<Object>} Integrated data with papers array
   */
  async loadAllData(options = {}) {
    // Return existing promise if already loading
    if (this.loadingPromise) {
      console.log('🔄 Data loading already in progress...');
      return this.loadingPromise;
    }

    // Return cached data if already loaded and not forcing reload
    if (this.isDataLoaded && !options.forceReload) {
      console.log('✓ Returning cached integrated data');
      return this.integratedData;
    }

    this.loadingPromise = this._performLoad(options);
    
    try {
      const result = await this.loadingPromise;
      this.isDataLoaded = true;
      return result;
    } catch (error) {
      console.error('❌ Error loading integrated data:', error);
      throw error;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Perform the actual data loading
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Integrated data
   * @private
   */
  async _performLoad(options) {
    try {
      console.log('📊 Loading integrated data sources...');

      // Step 1: Load Ground Truth from GitHub
      console.log('1️⃣ Loading Ground Truth from GitHub...');
      await groundTruthService.loadFromGitHub();
      const orkgPapers = groundTruthService.getAllPapers();
      console.log(`✓ Loaded ${orkgPapers.length} ORKG papers`);

      // Step 2: Load Evaluation Data from GitHub
      console.log('2️⃣ Loading Evaluation Data from GitHub...');
      const evaluationResult = await githubDataService.fetchAllEvaluations();
      const evaluations = evaluationResult.raw || [];
      console.log(`✓ Loaded ${evaluations.length} evaluations`);

      // Step 3: Load System Analysis Data ← NEW STEP
      console.log('3️⃣ Loading System Analysis Data...');
      const systemDataMap = await this._loadSystemAnalysisData(evaluations);
      console.log(`✓ Loaded ${systemDataMap.size} system analyses`);

      // Step 4: Update evaluation counts in ground truth service
      console.log('4️⃣ Updating evaluation counts...');
      groundTruthService.updateEvaluationCounts(evaluations);

      // Step 5: Build integrated data structure ← Updated to include systemDataMap
      console.log('5️⃣ Building integrated data structure...');
      this.integratedData = this._buildIntegratedData(orkgPapers, evaluations, systemDataMap);

      console.log(`✅ Integration complete: ${this.integratedData.papers.length} papers integrated`);
      console.log(`📈 Papers with ground truth: ${this.integratedData.papers.filter(p => p.groundTruth).length}`);
      console.log(`📈 Papers with system output: ${this.integratedData.papers.filter(p => p.systemOutput).length}`);
      console.log(`📈 Papers with evaluations: ${this.integratedData.papers.filter(p => p.userEvaluations.length > 0).length}`);

      return this.integratedData;
    } catch (error) {
      console.error('❌ Error in _performLoad:', error);
      throw error;
    }
  }

  /**
   * Load system analysis data for all evaluation tokens
   * @param {Array} evaluations - User evaluations with tokens
   * @returns {Promise<Map>} Map of token -> system analysis data
   * @private
   */
  async _loadSystemAnalysisData(evaluations) {
    const systemDataMap = new Map();
    
    // Extract unique tokens from evaluations
    const tokens = [...new Set(
      evaluations
        .map(e => e.token)
        .filter(t => t) // Filter out null/undefined
    )];
    
    console.log(`   Found ${tokens.length} unique tokens to load`);
    
    if (tokens.length === 0) {
      return systemDataMap;
    }

    // Load system data for each token
    const loadPromises = tokens.map(async (token) => {
      try {
        const systemData = await systemAnalysisService.loadSystemData(token);
        if (systemData) {
          systemDataMap.set(token, systemData);
        }
      } catch (error) {
        // Log but don't fail - some tokens might not have system data
        console.warn(`   ⚠️ Could not load system data for token ${token}:`, error.message);
      }
    });

    await Promise.all(loadPromises);
    
    console.log(`   Successfully loaded ${systemDataMap.size}/${tokens.length} system analyses`);
    
    return systemDataMap;
  }

  /**
   * Build integrated data structure
   * @param {Array} orkgPapers - Ground truth papers
   * @param {Array} evaluations - User evaluations
   * @param {Map} systemDataMap - Map of token -> system analysis data ← NEW PARAMETER
   * @returns {Object} Integrated data with papers array
   * @private
   */
  _buildIntegratedData(orkgPapers, evaluations, systemDataMap) {
    console.log('🔨 Building integrated data structure...');
    
    const papers = [];
    const matches = {}; // For backward compatibility

    // Create a map of evaluations by DOI
    const evaluationsByDoi = new Map();
    evaluations.forEach(evaluation => {
      const doi = this._extractDOIFromEvaluation(evaluation);
      if (doi) {
        if (!evaluationsByDoi.has(doi)) {
          evaluationsByDoi.set(doi, []);
        }
        evaluationsByDoi.get(doi).push(evaluation);
      }
    });

    // Create a map of system data by DOI (for matching with ground truth)
    const systemDataByDoi = new Map();
    systemDataMap.forEach((systemData, token) => {
      const doi = this._normalizeDOI(systemData.metadata?.doi);
      if (doi) {
        systemDataByDoi.set(doi, systemData);
      }
    });

    console.log(`📋 Mapped ${evaluationsByDoi.size} unique DOIs from evaluations`);
    console.log(`📋 Mapped ${systemDataByDoi.size} unique DOIs from system analyses`);

    // Process each ground truth paper
    orkgPapers.forEach(orkgPaper => {
      const doi = this._normalizeDOI(orkgPaper.doi);
      
      if (!doi) return; // Skip papers without DOI

      const paperEvaluations = evaluationsByDoi.get(doi) || [];
      
      // Get system output - try by DOI first, then by token from evaluations
      let systemOutput = systemDataByDoi.get(doi) || null;
      
      // If no system output by DOI, try to find via evaluation token
      if (!systemOutput && paperEvaluations.length > 0) {
        const token = paperEvaluations[0].token;
        if (token && systemDataMap.has(token)) {
          systemOutput = systemDataMap.get(token);
        }
      }

      const paper = {
        doi: doi,
        groundTruth: orkgPaper,
        systemOutput: systemOutput, // ← NOW PROPERLY POPULATED
        userEvaluations: paperEvaluations
      };

      papers.push(paper);
      matches[doi] = paper;
    });

    // Also add papers that have system output but no ground truth
    // (Papers analyzed but not in ORKG ground truth CSV)
    systemDataMap.forEach((systemData, token) => {
      const doi = this._normalizeDOI(systemData.metadata?.doi);
      if (doi && !matches[doi]) {
        const paper = {
          doi: doi,
          groundTruth: null,
          systemOutput: systemData,
          userEvaluations: evaluationsByDoi.get(doi) || []
        };
        papers.push(paper);
        matches[doi] = paper;
        console.log(`   Added paper from system output (no ground truth): ${doi}`);
      }
    });

    console.log(`✓ Built ${papers.length} integrated paper records`);
    console.log(`   - With systemOutput: ${papers.filter(p => p.systemOutput).length}`);
    console.log(`   - Without systemOutput: ${papers.filter(p => !p.systemOutput).length}`);

    return { 
      papers,
      matches // For backward compatibility
    };
  }

  /**
   * Extract DOI from evaluation object
   * @param {Object} evaluation - Evaluation object
   * @returns {string|null} Normalized DOI
   * @private
   */
  _extractDOIFromEvaluation(evaluation) {
    // Try multiple paths where DOI might be located
    const possiblePaths = [
      evaluation?.evaluationMetrics?.overall?.metadata?.doi?.referenceValue,
      evaluation?.overall?.metadata?.doi?.referenceValue,
      evaluation?.evaluationMetrics?.accuracy?.metadata?.doi?.referenceValue,
      evaluation?.metadata?.doi
    ];

    for (const path of possiblePaths) {
      if (path) {
        return this._normalizeDOI(path);
      }
    }

    return null;
  }

  /**
   * Normalize DOI for consistent lookup
   * @param {string} doi - DOI to normalize
   * @returns {string} Normalized DOI
   * @private
   */
  _normalizeDOI(doi) {
    if (!doi) return '';
    return doi.toLowerCase().trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  }

  /**
   * Get ground truth data
   * @returns {Array} Ground truth papers
   */
  getGroundTruth() {
    return groundTruthService.getAllPapers();
  }

  /**
   * Get user evaluations
   * @returns {Array} User evaluations
   */
  getUserEvaluations() {
    return githubDataService.getAllEvaluations?.() || [];
  }

  /**
   * Get three-way comparison for a specific paper
   * @param {string} identifier - Paper DOI or ID
   * @returns {Object|null} Three-way comparison data
   */
  getThreeWayComparison(identifier) {
    if (!this.integratedData || !this.integratedData.papers) return null;

    const normalizedId = this._normalizeDOI(identifier);

    return this.integratedData.papers.find(paper => {
      const doi = this._normalizeDOI(paper.doi);
      const paperId = paper.groundTruth?.paper_id?.toLowerCase();
      
      return doi === normalizedId || paperId === normalizedId.toLowerCase();
    }) || null;
  }

  /**
   * Get integrated data
   * @returns {Object|null} Integrated data with papers array
   */
  getIntegratedData() {
    return this.integratedData;
  }

  /**
   * Check if data is loaded
   * @returns {boolean} True if data is loaded
   */
  isLoaded() {
    return this.isDataLoaded;
  }

  /**
   * Get loading status
   * @returns {Object} Loading status information
   */
  getLoadingStatus() {
    return {
      isLoaded: this.isDataLoaded,
      isLoading: !!this.loadingPromise,
      paperCount: this.integratedData?.papers?.length || 0,
      papersWithSystemOutput: this.integratedData?.papers?.filter(p => p.systemOutput).length || 0,
      hasGroundTruth: groundTruthService.isLoaded(),
      hasUserEvals: true // Always true if we have evaluations
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.integratedData = null;
    this.isDataLoaded = false;
    groundTruthService.clear();
    systemAnalysisService.clear(); // ← NEW: Also clear system analysis cache
    console.log('✓ All integrated data cleared');
  }

  /**
   * Refresh data
   * @param {Object} options - Refresh options
   * @returns {Promise<Object>} Updated integrated data
   */
  async refresh(options = {}) {
    console.log('🔄 Refreshing integrated data...');
    githubDataService.clearCache?.();
    systemAnalysisService.clear(); // ← NEW: Clear system analysis cache on refresh
    return this.loadAllData({ ...options, forceReload: true });
  }

  /**
   * Get papers with filters
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered papers
   */
  getFilteredPapers(filters = {}) {
    if (!this.integratedData || !this.integratedData.papers) return [];

    let filtered = this.integratedData.papers;

    // Filter by data availability
    if (filters.hasGroundTruth !== undefined) {
      filtered = filtered.filter(p => !!p.groundTruth === filters.hasGroundTruth);
    }
    if (filters.hasSystemOutput !== undefined) {
      filtered = filtered.filter(p => !!p.systemOutput === filters.hasSystemOutput);
    }
    if (filters.hasUserEvals !== undefined) {
      filtered = filtered.filter(p => 
        (p.userEvaluations && p.userEvaluations.length > 0) === filters.hasUserEvals
      );
    }

    // Filter by research field
    if (filters.researchFieldId) {
      filtered = filtered.filter(p => 
        p.groundTruth?.research_field_id === filters.researchFieldId
      );
    }

    // Filter by template
    if (filters.templateId) {
      filtered = filtered.filter(p => 
        p.groundTruth?.template_id === filters.templateId
      );
    }

    // NEW: Filter by LLM vs ORKG source
    if (filters.problemSource) {
      filtered = filtered.filter(p => {
        if (!p.systemOutput?.researchProblems?.selectedProblem) return false;
        const isLLM = p.systemOutput.researchProblems.selectedProblem.isLLMGenerated;
        return filters.problemSource === 'LLM' ? isLLM : !isLLM;
      });
    }

    if (filters.templateSource) {
      filtered = filtered.filter(p => {
        if (!p.systemOutput?.templates) return false;
        const isLLM = systemAnalysisService.isLLMTemplate(p.systemOutput);
        return filters.templateSource === 'LLM' ? isLLM : !isLLM;
      });
    }

    return filtered;
  }

  /**
   * Get LLM vs ORKG statistics
   * @returns {Object} Statistics about LLM vs ORKG usage
   */
  getLLMvsORKGStats() {
    if (!this.integratedData?.papers) {
      return { problems: { llm: 0, orkg: 0 }, templates: { llm: 0, orkg: 0 } };
    }

    const stats = {
      problems: { llm: 0, orkg: 0, total: 0 },
      templates: { llm: 0, orkg: 0, total: 0 }
    };

    this.integratedData.papers.forEach(paper => {
      if (!paper.systemOutput) return;

      // Count research problem sources
      if (paper.systemOutput.researchProblems?.selectedProblem) {
        stats.problems.total++;
        if (paper.systemOutput.researchProblems.selectedProblem.isLLMGenerated) {
          stats.problems.llm++;
        } else {
          stats.problems.orkg++;
        }
      }

      // Count template sources
      if (paper.systemOutput.templates?.selectedTemplate) {
        stats.templates.total++;
        if (systemAnalysisService.isLLMTemplate(paper.systemOutput)) {
          stats.templates.llm++;
        } else {
          stats.templates.orkg++;
        }
      }
    });

    return stats;
  }
}

// Export singleton instance
export default new IntegratedDataService();