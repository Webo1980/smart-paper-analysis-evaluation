/**
 * System Analysis Service
 * Handles loading and processing system analysis JSON files from GitHub
 */

class SystemAnalysisService {
  constructor() {
    this.systemAnalyses = new Map(); // Map of token -> analysis data
    this.githubConfig = {
      owner: import.meta.env.VITE_GITHUB_USERNAME, // Replace with your GitHub username/org
      repo:  import.meta.env.VITE_GITHUB_REPO,     // Replace with your repository name
      token: import.meta.env.VITE_GITHUB_TOKEN  // Replace with your GitHub token (or use environment variable)
    };
  }

  /**
   * Configure GitHub repository settings
   * @param {Object} config - GitHub configuration
   * @param {string} config.owner - Repository owner
   * @param {string} config.repo - Repository name
   * @param {string} config.token - GitHub access token
   */
  configure(config) {
    this.githubConfig = { ...this.githubConfig, ...config };
  }

  /**
   * Load system analysis from GitHub by token
   * @param {string} token - Evaluation token
   * @returns {Promise<Object>} Parsed analysis data
   */
  async loadSystemData(token) {
    try {
      // Check if already loaded
      if (this.systemAnalyses.has(token)) {
        return this.systemAnalyses.get(token);
      }

      // Construct GitHub file path
      const filePath = `src/data/evaluations/${token}.json`;
      const url = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/${filePath}`;

      // Fetch from GitHub
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.githubConfig.token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load system data from GitHub: ${response.status} ${response.statusText}`);
      }

      // Parse JSON
      const analysisData = await response.json();

      // Validate that it has a token
      if (!analysisData.token) {
        throw new Error('System data missing required token field');
      }

      // Store in cache
      this.systemAnalyses.set(token, analysisData);

      return analysisData;
    } catch (error) {
      throw new Error(`Failed to load system data for token ${token}: ${error.message}`);
    }
  }

  /**
   * Load multiple system analysis files by tokens
   * @param {Array<string>} tokens - Array of evaluation tokens
   * @returns {Promise<Map<string, Object>>} Map of token -> analysis data
   */
  async loadMultipleSystemData(tokens) {
    const promises = tokens.map(token => 
      this.loadSystemData(token).catch(error => {
        console.error(`Error loading token ${token}:`, error);
        return null; // Return null for failed loads
      })
    );

    const results = await Promise.all(promises);
    
    // Create map of successful loads
    const systemDataMap = new Map();
    tokens.forEach((token, index) => {
      if (results[index]) {
        systemDataMap.set(token, results[index]);
      }
    });

    return systemDataMap;
  }

  /**
   * Load system analysis from a File object (for file uploads)
   * @param {File} jsonFile - The JSON file to parse
   * @returns {Promise<Object>} Parsed analysis data
   */
  async loadFromFile(jsonFile) {
    return new Promise((resolve, reject) => {
      // Validate input is a File or Blob
      if (!(jsonFile instanceof File) && !(jsonFile instanceof Blob)) {
        reject(new Error('Input must be a File or Blob object'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonText = e.target.result;
          let analysisData;
          
          // Handle both string and object formats
          if (jsonText.startsWith('"') && jsonText.endsWith('"')) {
            // It's a JSON-encoded string
            const parsed = JSON.parse(jsonText);
            analysisData = JSON.parse(parsed);
          } else {
            // It's a direct JSON object
            analysisData = JSON.parse(jsonText);
          }
          
          // Store by token
          if (analysisData.token) {
            this.systemAnalyses.set(analysisData.token, analysisData);
          }
          
          resolve(analysisData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(jsonFile);
    });
  }

  /**
   * Load multiple system analysis files from File objects
   * @param {FileList|Array<File>} files - Array of JSON files
   * @returns {Promise<Array<Object>>} Array of parsed analyses
   */
  async loadMultipleFiles(files) {
    const promises = Array.from(files).map(file => this.loadFromFile(file));
    return Promise.all(promises);
  }

  /**
   * Get analysis by token
   * @param {string} token - Evaluation token
   * @returns {Object|null} Analysis data
   */
  getByToken(token) {
    return this.systemAnalyses.get(token) || null;
  }

  /**
   * Get analysis by DOI
   * @param {string} doi - Paper DOI
   * @returns {Object|null} Analysis data
   */
  getByDOI(doi) {
    if (!doi) return null;
    
    const normalizedDoi = doi.toLowerCase();
    for (const [token, analysis] of this.systemAnalyses) {
      if (analysis.metadata?.doi?.toLowerCase() === normalizedDoi) {
        return analysis;
      }
    }
    return null;
  }

  /**
   * Get all system analyses
   * @returns {Array<Object>} All analyses
   */
  getAllAnalyses() {
    return Array.from(this.systemAnalyses.values());
  }

  /**
   * Extract DOI from system data
   * @param {Object} analysis - System analysis data
   * @returns {string|null} DOI
   */
  extractDOI(analysis) {
    return analysis?.metadata?.doi || null;
  }

  /**
   * Extract metadata from analysis
   * @param {Object} analysis - System analysis data
   * @returns {Object} Extracted metadata
   */
  extractMetadata(analysis) {
    return {
      title: analysis.metadata?.title || null,
      authors: analysis.metadata?.authors || [],
      doi: analysis.metadata?.doi || null,
      publicationDate: analysis.metadata?.publicationDate || null,
      venue: analysis.metadata?.venue || null,
      abstract: analysis.metadata?.abstract || null
    };
  }

  /**
   * Extract research field from analysis
   * @param {Object} analysis - System analysis data
   * @returns {Object} Research field data
   */
  extractResearchField(analysis) {
    return {
      selectedField: analysis.researchFields?.selectedField || null,
      allFields: analysis.researchFields?.fields || [],
      confidence: analysis.researchFields?.selectedField?.score || 0
    };
  }

  /**
   * Determine if research problem is LLM-generated
   * @param {Object} analysis - System analysis data
   * @returns {boolean} True if LLM-generated
   */
  isLLMProblem(analysis) {
    return analysis.researchProblems?.llm_problem !== null && 
           analysis.researchProblems?.llm_problem !== undefined;
  }

  /**
   * Determine if template is LLM-generated
   * @param {Object} analysis - System analysis data
   * @returns {boolean} True if LLM-generated
   */
  isLLMTemplate(analysis) {
    return analysis.templates?.llm_template !== null && 
           analysis.templates?.llm_template !== false &&
           analysis.templates?.llm_template !== undefined;
  }

  /**
   * Get research problem source (LLM or ORKG)
   * @param {Object} analysis - System analysis data
   * @returns {string} 'LLM' or 'ORKG'
   */
  getResearchProblemSource(analysis) {
    return this.isLLMProblem(analysis) ? 'LLM' : 'ORKG';
  }

  /**
   * Get template source (LLM or ORKG)
   * @param {Object} analysis - System analysis data
   * @returns {string} 'LLM' or 'ORKG'
   */
  getTemplateSource(analysis) {
    return this.isLLMTemplate(analysis) ? 'LLM' : 'ORKG';
  }

  /**
   * Extract research problem from analysis
   * @param {Object} analysis - System analysis data
   * @returns {Object} Research problem data
   */
  extractResearchProblem(analysis) {
    const selectedProblem = analysis.researchProblems?.selectedProblem;
    
    return {
      isLLMGenerated: this.isLLMProblem(analysis),
      title: selectedProblem?.title || null,
      description: selectedProblem?.description || null,
      confidence: selectedProblem?.confidence || 0,
      orkgProblems: analysis.researchProblems?.orkg_problems || [],
      llmProblem: analysis.researchProblems?.llm_problem || null
    };
  }

  /**
   * Extract template from analysis
   * @param {Object} analysis - System analysis data
   * @returns {Object} Template data
   */
  extractTemplate(analysis) {
    const selectedTemplate = analysis.templates?.selectedTemplate;
    const llmTemplate = analysis.templates?.llm_template?.template;
    const orkgTemplate = analysis.templates?.available?.template;
    
    return {
      selectedTemplate: selectedTemplate || null,
      llmTemplate: llmTemplate || null,
      orkgTemplate: orkgTemplate || null,
      isLLMGenerated: this.isLLMTemplate(analysis)
    };
  }

  /**
   * Get summary of system data
   * @param {Object} analysis - System analysis data
   * @returns {Object} Summary object
   */
  getSummary(analysis) {
    return {
      token: analysis.token,
      doi: this.extractDOI(analysis),
      title: analysis.metadata?.title,
      researchField: analysis.researchFields?.selectedField?.name,
      problemSource: this.getResearchProblemSource(analysis),
      templateSource: this.getTemplateSource(analysis),
      timestamp: analysis.timestamp
    };
  }

  /**
   * Get statistics about loaded analyses
   * @returns {Object} Statistics
   */
  getStatistics() {
    const analyses = this.getAllAnalyses();
    
    return {
      totalAnalyses: analyses.length,
      withMetadata: analyses.filter(a => a.metadata?.doi).length,
      withResearchField: analyses.filter(a => a.researchFields?.selectedField).length,
      withResearchProblem: analyses.filter(a => a.researchProblems?.selectedProblem).length,
      withTemplate: analyses.filter(a => a.templates?.selectedTemplate || a.templates?.llm_template).length,
      llmGeneratedProblems: analyses.filter(a => this.isLLMProblem(a)).length,
      llmGeneratedTemplates: analyses.filter(a => this.isLLMTemplate(a)).length
    };
  }

  /**
   * Check if any data is loaded
   * @returns {boolean} True if data is loaded
   */
  isLoaded() {
    return this.systemAnalyses.size > 0;
  }

  /**
   * Clear all loaded data
   */
  clear() {
    this.systemAnalyses.clear();
  }
}

// Export singleton instance
export default new SystemAnalysisService();