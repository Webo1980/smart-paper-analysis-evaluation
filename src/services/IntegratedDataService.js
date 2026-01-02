// File: src/services/IntegratedDataService.js
import config from '../config/appConfig';

// Static data imports - MUST be at module level
const staticEvaluations = import.meta.glob('../../data/userEvaluations/evaluations/*.json', { eager: true });
const staticSystemData = import.meta.glob('../../data/evaluations/*.json', { eager: true });

import groundTruthService from './groundTruthService';

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
      evaluation?.evaluationMetrics?.accuracy?.metadata?.['DOI Extraction']?.similarityData?.extractedDOI,
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
   * Load all data sources
   * @param {Object} options - Loading options
   * @param {boolean} [options.forceReload] - Force reload data
   * @returns {Promise<Object>} Integrated data with papers array
   */
  async loadAllData(options = {}) {
    // Demo mode: use static data
    if (config.isDemo) {
      console.log('📊 Demo mode: IntegratedDataService loading static data');
      
      if (this.isDataLoaded && !options.forceReload) {
        console.log('✓ Returning cached integrated data (demo mode)');
        return this.integratedData;
      }
      
      try {
        // Load evaluations from static imports
        const evaluations = Object.values(staticEvaluations).map(m => m.default || m);
        const systemDataArray = Object.values(staticSystemData)
          .map(m => m.default || m)
          .filter(item => item && typeof item === 'object' && !Array.isArray(item));
        
        console.log(`📊 Raw loaded: ${evaluations.length} evaluations, ${systemDataArray.length} system data files`);
        
        // Load ground truth via groundTruthService (parses CSV)
        await groundTruthService.loadFromGitHub();
        const groundTruthPapers = groundTruthService.getAllPapers();
        
        console.log(`📊 Ground truth loaded: ${groundTruthPapers.length} papers`);
        
        // Build DOI -> ground truth map
        const groundTruthByDOI = new Map();
        groundTruthPapers.forEach(paper => {
          if (paper.doi) {
            const normalizedDoi = this._normalizeDOI(paper.doi);
            groundTruthByDOI.set(normalizedDoi, paper);
          }
        });
        
        // Build token -> system data map
        const systemDataByToken = new Map();
        systemDataArray.forEach(sd => {
          // Try to extract token from filename or data
          if (sd.token) {
            systemDataByToken.set(sd.token, sd);
          }
        });
        
        // Group evaluations by DOI
        const evaluationsByDOI = new Map();
        evaluations.forEach(evaluation => {
          const doi = this._extractDOIFromEvaluation(evaluation);
          if (doi) {
            if (!evaluationsByDOI.has(doi)) {
              evaluationsByDOI.set(doi, []);
            }
            evaluationsByDOI.get(doi).push(evaluation);
          }
        });
        
        console.log(`📊 Mapped ${evaluationsByDOI.size} unique DOIs from evaluations`);
        
        // Build integrated papers structure
        const papers = [];
        const matches = {};
        
        // Process ground truth papers first
        groundTruthPapers.forEach(gtPaper => {
          const doi = this._normalizeDOI(gtPaper.doi);
          if (!doi) return;
          
          const userEvaluations = evaluationsByDOI.get(doi) || [];
          
          // Try to find system data by token from evaluations
          let systemOutput = null;
          if (userEvaluations.length > 0 && userEvaluations[0].token) {
            systemOutput = systemDataByToken.get(userEvaluations[0].token) || null;
          }
          
          // FIX: Get token from systemOutput or first evaluation for aggregatedData alignment
          const token = systemOutput?.token || userEvaluations[0]?.token || null;
          
          const paper = {
            doi: doi,
            token: token, // FIX: Add token for aggregatedData alignment
            groundTruth: gtPaper,
            systemOutput: systemOutput,
            userEvaluations: userEvaluations
          };
          
          papers.push(paper);
          matches[doi] = paper;
        });
        
        // Add papers that have evaluations but no ground truth
        evaluationsByDOI.forEach((evals, doi) => {
          if (!matches[doi]) {
            // FIX: Get token from evaluations
            const token = evals[0]?.token || null;
            
            const paper = {
              doi: doi,
              token: token, // FIX: Add token for aggregatedData alignment
              groundTruth: null,
              systemOutput: systemDataByToken.get(token) || null,
              userEvaluations: evals
            };
            papers.push(paper);
            matches[doi] = paper;
          }
        });
        
        console.log(`📊 Built ${papers.length} integrated papers`);
        console.log(`   - With ground truth: ${papers.filter(p => p.groundTruth).length}`);
        console.log(`   - With evaluations: ${papers.filter(p => p.userEvaluations.length > 0).length}`);
        console.log(`   - With system output: ${papers.filter(p => p.systemOutput).length}`);
        console.log(`   - With token: ${papers.filter(p => p.token).length}`); // FIX: Log token count
        
        this.integratedData = {
          papers: papers,
          groundTruth: groundTruthPapers,
          systemData: systemDataArray,
          matches: matches,
          timestamp: new Date().toISOString()
        };
        
        this.isDataLoaded = true;
        return this.integratedData;
      } catch (error) {
        console.error('❌ Error loading static data:', error);
        throw error;
      }
    }

    // Full mode: use GitHub API
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
   * Perform the actual data loading (full mode)
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Integrated data
   * @private
   */
  async _performLoad(options) {
    try {
      console.log('📊 Loading integrated data sources (full mode)...');

      // Import services dynamically to avoid circular dependencies
      const githubDataService = (await import('./githubDataService')).default;
      const systemAnalysisService = (await import('./SystemAnalysisService')).default;

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

      // Step 3: Load System Analysis Data
      console.log('3️⃣ Loading System Analysis Data...');
      const systemDataMap = await this._loadSystemAnalysisData(evaluations, systemAnalysisService);
      console.log(`✓ Loaded ${systemDataMap.size} system analyses`);

      // Step 4: Update evaluation counts in ground truth service
      console.log('4️⃣ Updating evaluation counts...');
      groundTruthService.updateEvaluationCounts(evaluations);

      // Step 5: Build integrated data structure
      console.log('5️⃣ Building integrated data structure...');
      this.integratedData = this._buildIntegratedData(orkgPapers, evaluations, systemDataMap);

      console.log(`✅ Integration complete: ${this.integratedData.papers.length} papers integrated`);

      return this.integratedData;
    } catch (error) {
      console.error('❌ Error in _performLoad:', error);
      throw error;
    }
  }

  /**
   * Load system analysis data for all evaluation tokens
   * @param {Array} evaluations - User evaluations with tokens
   * @param {Object} systemAnalysisService - System analysis service instance
   * @returns {Promise<Map>} Map of token -> system analysis data
   * @private
   */
  async _loadSystemAnalysisData(evaluations, systemAnalysisService) {
    const systemDataMap = new Map();
    
    // Extract unique tokens from evaluations
    const tokens = [...new Set(
      evaluations
        .map(e => e.token)
        .filter(t => t)
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
        console.warn(`   ⚠️ Could not load system data for token ${token}:`, error.message);
      }
    });

    await Promise.all(loadPromises);
    
    return systemDataMap;
  }

  /**
   * Build integrated data structure
   * @param {Array} orkgPapers - Ground truth papers
   * @param {Array} evaluations - User evaluations
   * @param {Map} systemDataMap - Map of token -> system analysis data
   * @returns {Object} Integrated data with papers array
   * @private
   */
  _buildIntegratedData(orkgPapers, evaluations, systemDataMap) {
    const papers = [];
    const matches = {};

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

    // Create a map of system data by DOI
    const systemDataByDoi = new Map();
    systemDataMap.forEach((systemData, token) => {
      const doi = this._normalizeDOI(systemData.metadata?.doi);
      if (doi) {
        systemDataByDoi.set(doi, systemData);
      }
    });

    // Process each ground truth paper
    orkgPapers.forEach(orkgPaper => {
      const doi = this._normalizeDOI(orkgPaper.doi);
      if (!doi) return;

      const paperEvaluations = evaluationsByDoi.get(doi) || [];
      let systemOutput = systemDataByDoi.get(doi) || null;
      
      // If no system output by DOI, try via evaluation token
      if (!systemOutput && paperEvaluations.length > 0) {
        const token = paperEvaluations[0].token;
        if (token && systemDataMap.has(token)) {
          systemOutput = systemDataMap.get(token);
        }
      }

      // FIX: Get token from systemOutput or first evaluation for aggregatedData alignment
      const token = systemOutput?.token || paperEvaluations[0]?.token || null;

      const paper = {
        doi: doi,
        token: token, // FIX: Add token for aggregatedData alignment
        groundTruth: orkgPaper,
        systemOutput: systemOutput,
        userEvaluations: paperEvaluations
      };

      papers.push(paper);
      matches[doi] = paper;
    });

    // Add papers with system output but no ground truth
    systemDataMap.forEach((systemData, token) => {
      const doi = this._normalizeDOI(systemData.metadata?.doi);
      if (doi && !matches[doi]) {
        const paper = {
          doi: doi,
          token: token, // FIX: Add token for aggregatedData alignment
          groundTruth: null,
          systemOutput: systemData,
          userEvaluations: evaluationsByDoi.get(doi) || []
        };
        papers.push(paper);
        matches[doi] = paper;
      }
    });

    return { 
      papers,
      matches
    };
  }

  /**
   * Get ground truth data
   * @returns {Array} Ground truth papers
   */
  getGroundTruth() {
    return groundTruthService.getAllPapers();
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
      papersWithGroundTruth: this.integratedData?.papers?.filter(p => p.groundTruth).length || 0,
      papersWithEvaluations: this.integratedData?.papers?.filter(p => p.userEvaluations?.length > 0).length || 0,
      papersWithToken: this.integratedData?.papers?.filter(p => p.token).length || 0, // FIX: Add token count
      hasGroundTruth: groundTruthService.isLoaded()
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.integratedData = null;
    this.isDataLoaded = false;
    groundTruthService.clear();
    console.log('✓ All integrated data cleared');
  }

  /**
   * Refresh data
   * @param {Object} options - Refresh options
   * @returns {Promise<Object>} Updated integrated data
   */
  async refresh(options = {}) {
    console.log('🔄 Refreshing integrated data...');
    return this.loadAllData({ ...options, forceReload: true });
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
}

// Export singleton instance
export default new IntegratedDataService();