/**
 * Ground Truth Service
 * Loads and manages ORKG CSV data with evaluation tracking
 */

import Papa from 'papaparse';

class GroundTruthService {
  constructor() {
    // Use environment variables
    this.owner = import.meta.env.VITE_GITHUB_USERNAME || '';
    this.repo = import.meta.env.VITE_GITHUB_REPO || '';
    this.token = import.meta.env.VITE_GITHUB_TOKEN || '';
    this.csvPath = import.meta.env.VITE_ORKG_CSV_PATH || 'src/data/evaluations/orkg_papers_20250204_163723.csv';
    
    this.data = null;
    this.paperIndex = new Map();
    this.doiIndex = new Map();
    this.evaluationCount = new Map();
    this.loaded = false;
    this.csvUrl = null;
    this._hasLoggedStructure = false;
    
    console.log('GroundTruthService initialized:', {
      owner: this.owner,
      repo: this.repo,
      csvPath: this.csvPath,
      hasToken: !!this.token
    });
  }

  /**
   * Load ORKG CSV file from GitHub using GitHub API (not raw URLs)
   * Uses the same method as App.jsx for consistency
   * @returns {Promise<void>}
   */
  async loadFromGitHub() {
    if (!this.owner || !this.repo || !this.token) {
      throw new Error('GitHub configuration missing. Check your .env file for VITE_GITHUB_USERNAME, VITE_GITHUB_REPO, and VITE_GITHUB_TOKEN');
    }

    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.csvPath}`;
    
    try {
      console.log('Loading CSV from GitHub API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log('✓ Successfully loaded CSV from GitHub API');
      
      this.csvUrl = apiUrl;
      return this._parseCSV(csvText);
    } catch (error) {
      console.error('✗ Error loading CSV from GitHub API:', error);
      throw error;
    }
  }

  /**
   * Load ORKG CSV file from GitHub with custom parameters
   * @param {string} owner - GitHub repository owner
   * @param {string} repo - GitHub repository name
   * @param {string} path - Path to CSV file in repository
   * @returns {Promise<void>}
   */
  async loadFromGitHubCustom(owner, repo, path) {
    const csvUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    this.csvUrl = csvUrl;
    
    try {
      console.log('Loading CSV from:', csvUrl);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      return this._parseCSV(csvText);
    } catch (error) {
      console.error('✗ Error loading CSV from GitHub:', error);
      throw error;
    }
  }

  /**
   * Parse CSV text content
   * @param {string} csvText - CSV content as string
   * @returns {Promise<void>}
   * @private
   */
  _parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          this.data = results.data;
          this._buildIndexes();
          this.loaded = true;
          console.log(`✓ Loaded ${this.data.length} papers from ground truth`);
          resolve();
        },
        error: (error) => {
          console.error('✗ Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Build indexes for fast lookup
   * @private
   */
  _buildIndexes() {
    if (!this.data) return;

    this.paperIndex.clear();
    this.doiIndex.clear();

    this.data.forEach(paper => {
      if (paper.paper_id) {
        this.paperIndex.set(paper.paper_id, paper);
      }

      if (paper.doi) {
        const normalizedDoi = this._normalizeDOI(paper.doi);
        this.doiIndex.set(normalizedDoi, paper);
      }
    });

    console.log(`✓ Indexed ${this.paperIndex.size} papers by ID and ${this.doiIndex.size} by DOI`);
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
   * Update evaluation counts based on evaluation data
   * Matches evaluations to papers by DOI
   * @param {Array} evaluations - Array of evaluation objects
   */
  updateEvaluationCounts(evaluations) {
    if (!Array.isArray(evaluations)) {
      console.warn('updateEvaluationCounts: evaluations is not an array');
      return;
    }

    this.evaluationCount.clear();

    let matched = 0;
    let unmatched = 0;

    evaluations.forEach((evaluation, index) => {
      const paperId = this._extractPaperIdFromEvaluation(evaluation);
      
      if (paperId) {
        const currentCount = this.evaluationCount.get(paperId) || 0;
        this.evaluationCount.set(paperId, currentCount + 1);
        matched++;
        
        if (index < 3) {
          console.log(`Evaluation ${index + 1}: DOI = ${paperId}`);
        }
      } else {
        unmatched++;
        if (unmatched <= 3) {
          console.warn(`Evaluation ${index + 1}: Could not extract DOI`, {
            token: evaluation.token,
            hasOverall: !!evaluation.overall
          });
        }
      }
    });

    console.log(`✓ Evaluation count update: ${matched} matched, ${unmatched} unmatched`);
    console.log(`✓ Tracking ${this.evaluationCount.size} unique papers with evaluations`);
    
    // Show top evaluated papers
    const sortedCounts = Array.from(this.evaluationCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (sortedCounts.length > 0) {
      console.log('Top evaluated papers:');
      sortedCounts.forEach(([doi, count]) => {
        console.log(`  - ${doi}: ${count} evaluation(s)`);
      });
    }
  }

  /**
   * Extract paper ID/DOI from evaluation object
   * Based on Evaluation_Object_Data_Structure_Documentation.md
   * @param {Object} evaluation - Evaluation object
   * @returns {string|null} Paper ID/DOI
   * @private
   */
  _extractPaperIdFromEvaluation(evaluation) {
    if (evaluation?.evaluationMetrics?.overall?.metadata?.doi?.referenceValue) {
      const doi = this._normalizeDOI(evaluation?.evaluationMetrics?.overall?.metadata?.doi?.referenceValue);
      console.log('✓ Found DOI in overall.metadata.doi.referenceValue:', doi);
      return doi;
    }
    else{
        console.warn('❌ Could not extract DOI from evaluation:', {
          token: evaluation.token,
          hasOverall: !!evaluation.overall,
          hasMetadata: !!evaluation.overall?.metadata,
          metadataKeys: evaluation.overall?.metadata ? Object.keys(evaluation.overall.metadata) : []
        });
      return null;
    }
  }

  /**
   * Get paper by paper_id
   */
  getPaperById(paperId) {
    if (!this.loaded) {
      console.warn('Ground truth data not loaded yet');
      return null;
    }
    return this.paperIndex.get(paperId) || null;
  }

  /**
   * Get paper by DOI
   */
  getPaperByDoi(doi) {
    if (!this.loaded) {
      console.warn('Ground truth data not loaded yet');
      return null;
    }
    const normalizedDoi = this._normalizeDOI(doi);
    return this.doiIndex.get(normalizedDoi) || null;
  }

  /**
   * Get evaluation count for a paper
   */
  getEvaluationCount(paperId) {
    const normalizedId = this._normalizeDOI(paperId);
    return this.evaluationCount.get(normalizedId) || 0;
  }

  /**
   * Check if paper has been evaluated
   */
  isEvaluated(paperId) {
    const normalizedId = this._normalizeDOI(paperId);
    return this.evaluationCount.has(normalizedId) && this.evaluationCount.get(normalizedId) > 0;
  }

  /**
   * Get all papers with evaluation status
   */
  getAllPapersWithStatus() {
    if (!this.loaded) return [];

    return this.data.map(paper => {
      const paperId = paper.doi ? this._normalizeDOI(paper.doi) : paper.paper_id;
      const evaluationCount = this.getEvaluationCount(paperId);
      
      return {
        ...paper,
        evaluationCount,
        isEvaluated: evaluationCount > 0,
        status: evaluationCount > 0 ? 'evaluated' : 'pending'
      };
    });
  }

  /**
   * Get all papers
   */
  getAllPapers() {
    if (!this.loaded) return [];
    return this.data || [];
  }

  /**
   * Get papers with filters
   */
  getFilteredPapers(filters = {}) {
    if (!this.loaded) return [];

    let filtered = this.getAllPapersWithStatus();

    if (filters.evaluationStatus !== undefined) {
      if (filters.evaluationStatus === 'evaluated') {
        filtered = filtered.filter(p => p.isEvaluated);
      } else if (filters.evaluationStatus === 'pending') {
        filtered = filtered.filter(p => !p.isEvaluated);
      }
    }

    if (filters.minEvaluations !== undefined) {
      filtered = filtered.filter(p => p.evaluationCount >= filters.minEvaluations);
    }

    if (filters.researchFieldId) {
      filtered = filtered.filter(p => p.research_field_id === filters.researchFieldId);
    }

    if (filters.templateId) {
      filtered = filtered.filter(p => p.template_id === filters.templateId);
    }

    if (filters.yearFrom || filters.yearTo) {
      filtered = filtered.filter(p => {
        const year = p.publication_year;
        if (!year) return false;
        if (filters.yearFrom && year < filters.yearFrom) return false;
        if (filters.yearTo && year > filters.yearTo) return false;
        return true;
      });
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title && p.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  /**
   * Get unique research fields
   */
  getUniqueResearchFields() {
    if (!this.loaded) return [];

    const fieldsMap = new Map();
    this.data.forEach(paper => {
      if (paper.research_field_id && paper.research_field_name) {
        fieldsMap.set(paper.research_field_id, {
          id: paper.research_field_id,
          name: paper.research_field_name
        });
      }
    });

    return Array.from(fieldsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get unique templates
   */
  getUniqueTemplates() {
    if (!this.loaded) return [];

    const templatesMap = new Map();
    this.data.forEach(paper => {
      if (paper.template_id && paper.template_name) {
        templatesMap.set(paper.template_id, {
          id: paper.template_id,
          name: paper.template_name
        });
      }
    });

    return Array.from(templatesMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get statistics with evaluation info
   */
  getStatistics() {
    if (!this.loaded) {
      return {
        totalPapers: 0,
        evaluatedPapers: 0,
        pendingPapers: 0,
        totalEvaluations: 0,
        avgEvaluationsPerPaper: 0,
        uniqueFields: 0,
        uniqueTemplates: 0
      };
    }

    const papersWithStatus = this.getAllPapersWithStatus();
    const evaluatedPapers = papersWithStatus.filter(p => p.isEvaluated);
    const totalEvaluations = papersWithStatus.reduce((sum, p) => sum + p.evaluationCount, 0);

    return {
      totalPapers: this.data.length,
      evaluatedPapers: evaluatedPapers.length,
      pendingPapers: this.data.length - evaluatedPapers.length,
      totalEvaluations,
      avgEvaluationsPerPaper: evaluatedPapers.length > 0 
        ? (totalEvaluations / evaluatedPapers.length).toFixed(2) 
        : 0,
      uniqueFields: this.getUniqueResearchFields().length,
      uniqueTemplates: this.getUniqueTemplates().length,
      evaluationCoverage: ((evaluatedPapers.length / this.data.length) * 100).toFixed(1)
    };
  }

  /**
   * Export data as CSV with evaluation status
   */
  exportCSV() {
    if (!this.loaded) {
      throw new Error('Ground truth data not loaded');
    }

    const papersWithStatus = this.getAllPapersWithStatus();
    return Papa.unparse(papersWithStatus);
  }

  /**
   * Export filtered data as CSV
   */
  exportFilteredCSV(filters) {
    const filtered = this.getFilteredPapers(filters);
    return Papa.unparse(filtered);
  }

  /**
   * Check if data is loaded
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Clear all data
   */
  clear() {
    this.data = null;
    this.paperIndex.clear();
    this.doiIndex.clear();
    this.evaluationCount.clear();
    this.loaded = false;
    console.log('✓ Ground truth data cleared');
  }
}

const groundTruthService = new GroundTruthService();
export default groundTruthService;