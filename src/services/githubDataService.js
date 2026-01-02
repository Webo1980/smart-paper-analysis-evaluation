// src/services/githubDataService.js
import config from '../config/appConfig';
// Static data imports for demo mode
const staticEvaluations = import.meta.glob('../data/userEvaluations/evaluations/*.json', { eager: true });
import { processEvaluationData } from '../utils/dataProcessing';
import { calculateConfusionMatrices } from '../utils/confusionMatrixCalculator';
import { calculateStatistics } from '../utils/statisticalAnalysis';

class GitHubDataService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.owner = import.meta.env.VITE_GITHUB_USERNAME || '';
    this.repo = import.meta.env.VITE_GITHUB_REPO || '';
    this.token = import.meta.env.VITE_GITHUB_TOKEN || '';
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // localStorage keys for local evaluation data
    this.LOCAL_STORAGE_KEY = 'evaluation_metrics';  // PRIMARY: Has overall structure
    this.LOCAL_EVALUATIONS_KEY = 'evaluationData';   // DEPRECATED: Only has token
    
    console.log('GitHubDataService initialized:', {
      owner: this.owner,
      repo: this.repo,
      hasToken: !!this.token,
      tokenLength: this.token?.length,
      localStorageKey: this.LOCAL_STORAGE_KEY  // Show which key will be used
    });
  }

  // ============================================
  // NEW: LOCAL STORAGE METHODS FOR EVALUATION_METRICS
  // ============================================

  /**
   * Get evaluations from localStorage (evaluation_metrics key ONLY)
   * Returns array of evaluations for aggregation service
   * 
   * CRITICAL: This MUST load from evaluation_metrics which has the overall structure
   * NOT from evaluationData which only has token and basic metadata
   */
  getLocalEvaluations() {
    try {
      // ONLY load from evaluation_metrics (not evaluationData!)
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      
      if (!stored) {
        console.log('No evaluation data in localStorage key:', this.LOCAL_STORAGE_KEY);
        return [];
      }
      
      const data = JSON.parse(stored);
      
      // Verify it has the overall structure (this is critical!)
      if (!data.overall) {
        console.warn(`Data in ${this.LOCAL_STORAGE_KEY} does not have overall structure!`);
        console.warn('Keys found:', Object.keys(data));
        console.warn('This is wrong data - cannot use for aggregation');
        return [];
      }
      
      // If it's a single object with overall structure, wrap in array
      if (data && data.overall) {
        console.log(`✅ Loaded 1 evaluation from ${this.LOCAL_STORAGE_KEY}`);
        return [data];
      }
      
      // If it's an array of evaluations with overall structure
      if (Array.isArray(data)) {
        const validEvals = data.filter(e => e.overall);
        if (validEvals.length > 0) {
          console.log(`✅ Loaded ${validEvals.length} evaluations from ${this.LOCAL_STORAGE_KEY}`);
          return validEvals;
        } else {
          console.warn('Array found but no evaluations have overall structure');
          return [];
        }
      }
      
      console.warn('Data format not recognized in localStorage');
      return [];
      
    } catch (error) {
      console.error('Error loading evaluations from localStorage:', error);
      return [];
    }
  }

  /**
   * Get the main evaluation from localStorage (single object)
   */
  getLocalEvaluation() {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading main evaluation from localStorage:', error);
      return null;
    }
  }

  /**
   * Save evaluation to localStorage
   */
  saveLocalEvaluation(evaluation) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(evaluation));
      console.log('✅ Saved evaluation to localStorage');
      return true;
    } catch (error) {
      console.error('Error saving evaluation to localStorage:', error);
      return false;
    }
  }

  /**
   * Check if local evaluation data exists
   */
  hasLocalEvaluation() {
    return !!localStorage.getItem(this.LOCAL_STORAGE_KEY);
  }

  /**
   * Clear local evaluation data
   */
  clearLocalEvaluation() {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    console.log('🗑️ Cleared evaluation from localStorage');
  }

  /**
   * Get DOI from local evaluation
   */
  getLocalDOI() {
    const evaluation = this.getLocalEvaluation();
    if (!evaluation?.overall?.metadata?.doi) return null;
    
    const doiField = evaluation.overall.metadata.doi;
    
    // Handle object format
    if (typeof doiField === 'object') {
      return doiField.extractedValue || doiField.referenceValue || null;
    }
    
    // Handle string format
    return doiField;
  }

  /**
   * Get paper title from local evaluation
   */
  getLocalTitle() {
    const evaluation = this.getLocalEvaluation();
    if (!evaluation?.overall?.metadata?.title) return null;
    
    const titleField = evaluation.overall.metadata.title;
    
    // Handle object format
    if (typeof titleField === 'object') {
      return titleField.extractedValue || titleField.referenceValue || null;
    }
    
    // Handle string format
    return titleField;
  }

  /**
   * Unified method to get evaluations from both sources
   * Tries localStorage first, then GitHub
   */
  async getEvaluations() {
    // Try localStorage first
    const localEvals = this.getLocalEvaluations();
    if (localEvals.length > 0) {
      console.log('Using evaluations from localStorage');
      return localEvals;
    }

    // Fallback to GitHub
    console.log('No local evaluations, fetching from GitHub...');
    try {
      const result = await this.fetchAllEvaluations();
      return result.raw || [];
    } catch (error) {
      console.error('Error fetching from GitHub:', error);
      return [];
    }
  }

  // ============================================
  // EXISTING GITHUB METHODS (PRESERVED)
  // ============================================

  async fetchAllEvaluations() {
    console.log('fetchAllEvaluations called');

    // Demo mode: return static data
    if (config.isDemo) {
      console.log('📊 Demo mode: using static data');
      const evaluations = Object.values(staticEvaluations).map(m => m.default || m);
      return { success: true, data: evaluations };
    }
    
    const cacheKey = 'all_evaluations';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Returning cached data');
      return cached;
    }

    try {
      // Fetch the contents of the evaluations directory
      const path = 'src/data/userEvaluations/evaluations';
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`;
      
      console.log('Fetching from GitHub:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      console.log('GitHub response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API error response:', errorText);
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      const files = await response.json();
      console.log('Files found:', files);
      
      // Filter for JSON files
      const jsonFiles = files.filter(file => file.name.endsWith('.json'));
      console.log('JSON files found:', jsonFiles.length, jsonFiles.map(f => f.name));
      
      if (jsonFiles.length === 0) {
        console.warn('No JSON files found in evaluations directory');
        return this.getEmptyResult();
      }
      
      // Fetch content of each evaluation file
      console.log('Fetching content of', jsonFiles.length, 'files...');
      const evaluations = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            console.log('Fetching file:', file.name);
            // Use the GitHub API to fetch file content, not the raw URL
            const content = await this.fetchFileContentFromAPI(file.path);
            console.log('Fetched content for:', file.name, 'Keys:', Object.keys(content));
            return content;
          } catch (error) {
            console.error(`Error fetching ${file.name}:`, error);
            return null;
          }
        })
      );

      // Filter out nulls and process data
      const validEvaluations = evaluations.filter(e => e !== null);
      console.log('Valid evaluations:', validEvaluations.length);
      
      if (validEvaluations.length === 0) {
        console.warn('No valid evaluations after filtering');
        return this.getEmptyResult();
      }
      
      // Process the raw data using existing utilities
      console.log('Processing evaluation data...');
      let processedData;
      try {
        processedData = processEvaluationData(validEvaluations);
        console.log('Processed data:', processedData);
      } catch (error) {
        console.error('Error processing evaluation data:', error);
        throw new Error(`Failed to process evaluation data: ${error.message}`);
      }
      
      // Calculate confusion matrices
      console.log('Calculating confusion matrices...');
      let confusionMatrices;
      try {
        confusionMatrices = calculateConfusionMatrices(processedData);
        console.log('Confusion matrices:', confusionMatrices);
      } catch (error) {
        console.error('Error calculating confusion matrices:', error);
        confusionMatrices = this.getEmptyConfusionMatrices();
      }
      
      // Calculate statistics
      console.log('Calculating statistics...');
      let statistics;
      try {
        statistics = calculateStatistics(processedData);
        console.log('Statistics:', statistics);
      } catch (error) {
        console.error('Error calculating statistics:', error);
        console.error('Error details:', error.stack);
        statistics = this.getEmptyStatistics();
      }

      const result = {
        raw: validEvaluations,
        processed: processedData,
        confusionMatrices,
        statistics,
        fetchedAt: new Date().toISOString()
      };

      console.log('Final result structure:', {
        raw: result.raw.length,
        processed: result.processed.evaluations.length,
        confusionMatrices: Object.keys(result.confusionMatrices),
        statistics: Object.keys(result.statistics)
      });
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Fetch file content using GitHub API (not raw URL)
   * This properly handles authentication
   */
  async fetchFileContentFromAPI(path) {
    try {
      console.log('Fetching file content from API:', path);
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Decode base64 content
      const content = atob(data.content);
      const parsed = JSON.parse(content);
      
      console.log('File content fetched successfully');
      return parsed;
    } catch (error) {
      console.error('Error fetching file content from API:', error);
      throw error;
    }
  }

  async fetchEvaluationByToken(token) {
    const cacheKey = `evaluation_${token}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const path = `src/data/userEvaluations/evaluations/${token}.json`;
      const evaluation = await this.fetchFileContentFromAPI(path);

      this.setCache(cacheKey, evaluation);
      return evaluation;
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheExpiry) {
        console.log('Cache hit for:', key);
        return cached.data;
      }
      console.log('Cache expired for:', key);
      this.cache.delete(key);
    }
    return null;
  }

  setCache(key, data) {
    console.log('Caching data for:', key);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    console.log('Clearing cache');
    this.cache.clear();
  }

  // ============================================
  // DEBUG AND UTILITY METHODS
  // ============================================

  /**
   * Debug: Show what's in localStorage
   */
  debugLocalStorage() {
    console.log('🔍 DEBUG: localStorage contents');
    console.log('Storage key:', this.LOCAL_STORAGE_KEY);
    console.log('Has data:', this.hasLocalEvaluation());
    
    if (this.hasLocalEvaluation()) {
      const evaluation = this.getLocalEvaluation();
      console.log('Data structure:');
      console.log('  - Has overall:', !!evaluation.overall);
      console.log('  - Has overall.metadata:', !!evaluation.overall?.metadata);
      console.log('  - Has overall.metadata.doi:', !!evaluation.overall?.metadata?.doi);
      console.log('  - DOI value:', this.getLocalDOI());
      console.log('  - Title:', this.getLocalTitle());
      
      const evaluations = this.getLocalEvaluations();
      console.log('  - Returns array of:', evaluations.length);
    } else {
      console.log('No data in localStorage');
    }
  }

  /**
   * Get data source info
   */
  getDataSource() {
    if (this.hasLocalEvaluation()) {
      return {
        source: 'localStorage',
        key: this.LOCAL_STORAGE_KEY,
        hasData: true
      };
    } else if (this.owner && this.repo && this.token) {
      return {
        source: 'github',
        owner: this.owner,
        repo: this.repo,
        hasData: true
      };
    } else {
      return {
        source: 'none',
        hasData: false
      };
    }
  }

  // ============================================
  // HELPER METHODS (PRESERVED)
  // ============================================

  // Helper methods to return empty data structures
  getEmptyResult() {
    return {
      raw: [],
      processed: { 
        evaluations: [], 
        summary: {
          totalEvaluations: 0,
          avgExpertiseWeight: 0,
          avgCompleteness: 0,
          avgOverallScore: 0,
          roleDistribution: {},
          sectionStats: {}
        }
      },
      confusionMatrices: this.getEmptyConfusionMatrices(),
      statistics: this.getEmptyStatistics(),
      fetchedAt: new Date().toISOString()
    };
  }

  getEmptyConfusionMatrices() {
    return {
      overall: {
        truePositive: 0,
        trueNegative: 0,
        falsePositive: 0,
        falseNegative: 0,
        metrics: {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          specificity: 0
        }
      },
      bySection: {}
    };
  }

  getEmptyStatistics() {
    return {
      descriptive: {
        ratings: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
        expertise: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
        completeness: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
        scores: { mean: 0, median: 0, std: 0, min: 0, max: 0 }
      },
      correlations: {
        expertiseVsScore: 0,
        completenessVsScore: 0
      },
      trends: {
        overTime: []
      }
    };
  }
}

export default new GitHubDataService();