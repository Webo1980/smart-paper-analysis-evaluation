import config from '../config/appConfig';
const staticSystemData = import.meta.glob('../data/evaluations/*.json', { eager: true });

/**
 * System Data Service
 * Manages system-generated analysis data (Data Source 1.2)
 * 
 * Purpose:
 * - Load system analysis results by token
 * - Parse and validate system data structure
 * - Identify data sources (LLM vs ORKG)
 * - Provide cross-reference utilities
 * 
 * File Location: src/data/evaluations/{token}.json
 * Documentation: System_Data_Structure_Documentation.md
 */

class SystemDataService {
  constructor() {
    // Use environment variables
    this.owner = import.meta.env.VITE_GITHUB_USERNAME || '';
    this.repo = import.meta.env.VITE_GITHUB_REPO || '';
    this.token = import.meta.env.VITE_GITHUB_TOKEN || '';
    this.basePath = 'src/data/evaluations';
    
    // Cache for loaded system data
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
    
    // Track loaded data
    this.loadedTokens = new Set();
    
    console.log('🔧 SystemDataService initialized:', {
      owner: this.owner,
      repo: this.repo,
      basePath: this.basePath,
      hasToken: !!this.token,
      tokenLength: this.token?.length
    });
  }

  /**
   * Load system data by token from GitHub
   * @param {string} token - Unique identifier (e.g., "eval_1738959189935_qdlsjv6nz")
   * @returns {Promise<Object|null>} System data object or null if not found
   */
  async loadSystemData(token) {
    if (!token) {
      console.error('❌ SystemDataService.loadSystemData: No token provided');
      return null;
    }

    console.log(`📥 Loading system data for token: ${token}`);

    // Check cache first
    const cached = this._getFromCache(token);
    if (cached) {
      console.log(`✓ Cache hit for token: ${token}`);
      return cached;
    }

    try {
      // Construct file path
      const filePath = `${this.basePath}/${token}.json`;
      console.log(`📂 File path: ${filePath}`);
      
      // Fetch from GitHub API
      const systemData = await this._fetchFromGitHub(filePath);
      
      if (!systemData) {
        console.warn(`⚠️ No system data found for token: ${token}`);
        return null;
      }

      // Validate structure
      const isValid = this._validateSystemData(systemData, token);
      
      if (!isValid) {
        console.error(`❌ Invalid system data structure for token: ${token}`);
        return null;
      }

      // Log data analysis
      this._analyzeSystemData(systemData, token);
      
      // Cache the result
      this._setCache(token, systemData);
      this.loadedTokens.add(token);
      
      console.log(`✓ Successfully loaded system data for token: ${token}`);
      return systemData;
      
    } catch (error) {
      console.error(`❌ Error loading system data for token ${token}:`, error);
      return null;
    }
  }

  /**
   * Load multiple system data files by tokens
   * @param {string[]} tokens - Array of tokens
   * @returns {Promise<Map<string, Object>>} Map of token to system data
   */
  async loadMultipleSystemData(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.warn('⚠️ loadMultipleSystemData: No tokens provided');
      return new Map();
    }

    console.log(`📥 Loading ${tokens.length} system data files...`);
    
    const startTime = Date.now();
    const results = await Promise.allSettled(
      tokens.map(token => this.loadSystemData(token))
    );

    const systemDataMap = new Map();
    let successCount = 0;
    let failCount = 0;

    results.forEach((result, index) => {
      const token = tokens[index];
      
      if (result.status === 'fulfilled' && result.value) {
        systemDataMap.set(token, result.value);
        successCount++;
      } else {
        failCount++;
        console.warn(`⚠️ Failed to load system data for token: ${token}`);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`✓ Loaded ${successCount}/${tokens.length} system data files in ${duration}ms`);
    
    if (failCount > 0) {
      console.warn(`⚠️ Failed to load ${failCount} system data files`);
    }

    return systemDataMap;
  }

  /**
   * Fetch file content from GitHub API
   * @param {string} filePath - Path to file in repository
   * @returns {Promise<Object|null>} Parsed JSON content
   * @private
   */
  async _fetchFromGitHub(filePath) {
    if (!config.isDemo && (!this.owner || !this.repo || !this.token)) {
      throw new Error('GitHub configuration missing...');
    }

    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}`;
    
    console.log(`🌐 Fetching from GitHub API: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      });

      if (response.status === 404) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const jsonText = await response.text();
      const data = JSON.parse(jsonText);
      
      console.log(`✓ Successfully fetched file: ${filePath}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Error fetching from GitHub:`, error);
      throw error;
    }
  }

  /**
   * Validate system data structure
   * @param {Object} data - System data to validate
   * @param {string} token - Token for logging
   * @returns {boolean} True if valid
   * @private
   */
  _validateSystemData(data, token) {
    if (!data || typeof data !== 'object') {
      console.error(`❌ System data is not an object for token: ${token}`);
      return false;
    }

    // Check required root properties
    const requiredProps = ['metadata', 'paperContent', 'researchFields', 'researchProblems', 'templates', 'timestamp', 'token'];
    const missingProps = requiredProps.filter(prop => !(prop in data));
    
    if (missingProps.length > 0) {
      console.error(`❌ Missing required properties for token ${token}:`, missingProps);
      return false;
    }

    // Validate token matches
    if (data.token !== token) {
      console.warn(`⚠️ Token mismatch: Expected ${token}, got ${data.token}`);
    }

    // Validate metadata has DOI
    if (!data.metadata?.doi) {
      console.warn(`⚠️ Missing DOI in metadata for token: ${token}`);
    }

    return true;
  }

  /**
   * Analyze and log system data details
   * @param {Object} data - System data
   * @param {string} token - Token for logging
   * @private
   */
  _analyzeSystemData(data, token) {
    console.log(`📊 System Data Analysis for token: ${token}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Metadata analysis
    console.log('📋 Metadata:');
    console.log(`  - DOI: ${data.metadata?.doi || 'N/A'}`);
    console.log(`  - Title: ${data.metadata?.title?.substring(0, 60)}${data.metadata?.title?.length > 60 ? '...' : ''}`);
    console.log(`  - Authors: ${data.metadata?.authors?.length || 0} authors`);
    console.log(`  - Venue: ${data.metadata?.venue || 'N/A'}`);
    console.log(`  - Publication Date: ${data.metadata?.publicationDate || 'N/A'}`);
    console.log(`  - Status: ${data.metadata?.status || 'N/A'}`);
    
    // Paper Content analysis
    const contentProps = Object.keys(data.paperContent?.paperContent || {});
    console.log(`📄 Paper Content:`);
    console.log(`  - Total properties: ${contentProps.length}`);
    if (contentProps.length > 0) {
      console.log(`  - Properties: ${contentProps.join(', ')}`);
    }
    
    // Research Fields analysis
    console.log(`🔬 Research Fields:`);
    const fields = data.researchFields?.fields || [];
    console.log(`  - Detected fields: ${fields.length}`);
    if (data.researchFields?.selectedField) {
      console.log(`  - Selected: ${data.researchFields.selectedField.name} (score: ${data.researchFields.selectedField.score?.toFixed(2)})`);
    }
    if (fields.length > 0) {
      console.log(`  - Top 3 fields:`);
      fields.slice(0, 3).forEach((field, idx) => {
        console.log(`    ${idx + 1}. ${field.name} (${field.score?.toFixed(2)})`);
      });
    }
    
    // Research Problems analysis
    const problemSource = this.getResearchProblemSource(data);
    console.log(`🎯 Research Problems:`);
    console.log(`  - Source: ${problemSource}`);
    
    if (problemSource === 'LLM') {
      const problem = data.researchProblems?.llm_problem;
      console.log(`  - LLM Problem:`);
      console.log(`    Title: ${problem?.title || 'N/A'}`);
      console.log(`    Description: ${problem?.description?.substring(0, 80)}${problem?.description?.length > 80 ? '...' : ''}`);
      console.log(`    Confidence: ${problem?.confidence || 'N/A'}`);
    } else if (problemSource === 'ORKG') {
      const problems = data.researchProblems?.orkg_problems || [];
      console.log(`  - ORKG Problems: ${problems.length}`);
      if (problems.length > 0) {
        console.log(`  - Available ORKG problems:`);
        problems.forEach((problem, idx) => {
          console.log(`    ${idx + 1}. ${problem?.title || 'N/A'} (ID: ${problem?.id || 'N/A'})`);
        });
      }
    }
    
    if (data.researchProblems?.selectedProblem) {
      console.log(`  - Selected Problem: ${data.researchProblems.selectedProblem.title}`);
      console.log(`    Is LLM Generated: ${data.researchProblems.selectedProblem.isLLMGenerated}`);
      console.log(`    Confidence: ${data.researchProblems.selectedProblem.confidence}`);
    }
    
    // Templates analysis
    const templateSource = this.getTemplateSource(data);
    console.log(`📐 Templates:`);
    console.log(`  - Source: ${templateSource}`);
    
    if (templateSource === 'LLM') {
      const template = data.templates?.llm_template?.template;
      console.log(`  - LLM Template:`);
      console.log(`    Name: ${template?.name || 'N/A'}`);
      console.log(`    ID: ${template?.id || 'N/A'}`);
      console.log(`    Properties: ${template?.properties?.length || 0}`);
    } else if (templateSource === 'ORKG') {
      const template = data.templates?.available?.template;
      console.log(`  - ORKG Template:`);
      console.log(`    Name: ${template?.name || 'N/A'}`);
      console.log(`    ID: ${template?.id || 'N/A'} (ORKG ID)`);
      console.log(`    Properties: ${template?.properties?.length || 0}`);
    }
    
    // Processing info
    console.log(`⏱️ Processing Info:`);
    console.log(`  - Timestamp: ${data.timestamp}`);
    console.log(`  - Token: ${data.token}`);
    
    if (data.templates?.processing_info) {
      console.log(`  - Template Processing: ${data.templates.processing_info.status} (${data.templates.processing_info.step})`);
    }
    
    if (data.researchProblems?.processing_info) {
      console.log(`  - Problem Processing: ${data.researchProblems.processing_info.status} (${data.researchProblems.processing_info.step})`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Get research problem data source (LLM or ORKG)
   * @param {Object} systemData - System data object
   * @returns {string} 'LLM', 'ORKG', or 'Unknown'
   */
  getResearchProblemSource(systemData) {
    if (!systemData?.researchProblems) {
      console.warn('⚠️ No researchProblems in system data');
      return 'Unknown';
    }

    const problems = systemData.researchProblems;
    
    // Check if LLM-generated
    if (problems.llm_problem !== null && problems.llm_problem !== undefined) {
      return 'LLM';
    }
    
    // Check if ORKG-based
    if (problems.orkg_problems && Array.isArray(problems.orkg_problems) && problems.orkg_problems.length > 0) {
      return 'ORKG';
    }
    
    return 'Unknown';
  }

  /**
   * Get template data source (LLM or ORKG)
   * @param {Object} systemData - System data object
   * @returns {string} 'LLM', 'ORKG', or 'Unknown'
   */
  getTemplateSource(systemData) {
    if (!systemData?.templates) {
      console.warn('⚠️ No templates in system data');
      return 'Unknown';
    }

    const templates = systemData.templates;
    
    // Check if LLM-generated
    if (templates.llm_template !== null && 
        templates.llm_template !== false && 
        templates.llm_template !== undefined) {
      return 'LLM';
    }
    
    // Check if ORKG-based
    const templateId = templates.available?.template?.id;
    if (templateId && typeof templateId === 'string' && templateId.startsWith('R')) {
      return 'ORKG';
    }
    
    return 'Unknown';
  }

  /**
   * Check if research problem is LLM-generated
   * @param {Object} systemData - System data object
   * @returns {boolean} True if LLM-generated
   */
  isLLMProblem(systemData) {
    return this.getResearchProblemSource(systemData) === 'LLM';
  }

  /**
   * Check if template is LLM-generated
   * @param {Object} systemData - System data object
   * @returns {boolean} True if LLM-generated
   */
  isLLMTemplate(systemData) {
    return this.getTemplateSource(systemData) === 'LLM';
  }

  /**
   * Extract DOI from system data metadata
   * @param {Object} systemData - System data object
   * @returns {string|null} DOI or null
   */
  extractDOI(systemData) {
    const doi = systemData?.metadata?.doi;
    
    if (!doi) {
      console.warn('⚠️ No DOI found in system data metadata');
      return null;
    }
    
    return doi;
  }

  /**
   * Extract title from system data metadata
   * @param {Object} systemData - System data object
   * @returns {string|null} Title or null
   */
  extractTitle(systemData) {
    const title = systemData?.metadata?.title;
    
    if (!title) {
      console.warn('⚠️ No title found in system data metadata');
      return null;
    }
    
    return title;
  }

  /**
   * Extract authors from system data metadata
   * @param {Object} systemData - System data object
   * @returns {string[]} Array of author names
   */
  extractAuthors(systemData) {
    const authors = systemData?.metadata?.authors;
    
    if (!authors || !Array.isArray(authors)) {
      console.warn('⚠️ No authors found in system data metadata');
      return [];
    }
    
    return authors;
  }

  /**
   * Get selected research field
   * @param {Object} systemData - System data object
   * @returns {Object|null} Selected field object or null
   */
  getSelectedResearchField(systemData) {
    const selectedField = systemData?.researchFields?.selectedField;
    
    if (!selectedField) {
      console.warn('⚠️ No selected research field in system data');
      return null;
    }
    
    return selectedField;
  }

  /**
   * Get all detected research fields
   * @param {Object} systemData - System data object
   * @returns {Array} Array of field objects
   */
  getAllResearchFields(systemData) {
    const fields = systemData?.researchFields?.fields;
    
    if (!fields || !Array.isArray(fields)) {
      console.warn('⚠️ No research fields found in system data');
      return [];
    }
    
    return fields;
  }

  /**
   * Get selected research problem
   * @param {Object} systemData - System data object
   * @returns {Object|null} Selected problem object or null
   */
  getSelectedResearchProblem(systemData) {
    const selectedProblem = systemData?.researchProblems?.selectedProblem;
    
    if (!selectedProblem) {
      console.warn('⚠️ No selected research problem in system data');
      return null;
    }
    
    return selectedProblem;
  }

  /**
   * Get selected template
   * @param {Object} systemData - System data object
   * @returns {Object|null} Selected template object or null
   */
  getSelectedTemplate(systemData) {
    const templates = systemData?.templates;
    
    if (!templates) {
      console.warn('⚠️ No templates in system data');
      return null;
    }
    
    // Try selectedTemplate first
    if (templates.selectedTemplate) {
      return templates.selectedTemplate;
    }
    
    // Fallback to available.template
    if (templates.available?.template) {
      return templates.available.template;
    }
    
    // Fallback to llm_template
    if (templates.llm_template?.template) {
      return templates.llm_template.template;
    }
    
    console.warn('⚠️ No selected template found in system data');
    return null;
  }

  /**
   * Get all content properties
   * @param {Object} systemData - System data object
   * @returns {Object} Object with property names as keys
   */
  getAllContentProperties(systemData) {
    const contentProperties = systemData?.paperContent?.paperContent;
    
    if (!contentProperties || typeof contentProperties !== 'object') {
      console.warn('⚠️ No content properties found in system data');
      return {};
    }
    
    return contentProperties;
  }

  /**
   * Get specific content property
   * @param {Object} systemData - System data object
   * @param {string} propertyName - Property name (e.g., 'model-architecture')
   * @returns {Object|null} Property object or null
   */
  getContentProperty(systemData, propertyName) {
    const properties = this.getAllContentProperties(systemData);
    
    if (!properties[propertyName]) {
      console.warn(`⚠️ Content property '${propertyName}' not found in system data`);
      return null;
    }
    
    return properties[propertyName];
  }

  /**
   * Get summary of system data
   * @param {Object} systemData - System data object
   * @returns {Object} Summary object
   */
  getSummary(systemData) {
    if (!systemData) {
      return {
        hasData: false,
        error: 'No system data provided'
      };
    }

    const contentProps = this.getAllContentProperties(systemData);
    const researchFields = this.getAllResearchFields(systemData);
    
    return {
      hasData: true,
      token: systemData.token,
      timestamp: systemData.timestamp,
      
      metadata: {
        doi: this.extractDOI(systemData),
        title: this.extractTitle(systemData),
        authorCount: this.extractAuthors(systemData).length,
        venue: systemData.metadata?.venue,
        publicationDate: systemData.metadata?.publicationDate
      },
      
      content: {
        propertyCount: Object.keys(contentProps).length,
        properties: Object.keys(contentProps)
      },
      
      researchField: {
        detectedCount: researchFields.length,
        selectedField: this.getSelectedResearchField(systemData)?.name
      },
      
      researchProblem: {
        source: this.getResearchProblemSource(systemData),
        isLLMGenerated: this.isLLMProblem(systemData),
        selectedProblem: this.getSelectedResearchProblem(systemData)?.title
      },
      
      template: {
        source: this.getTemplateSource(systemData),
        isLLMGenerated: this.isLLMTemplate(systemData),
        selectedTemplate: this.getSelectedTemplate(systemData)?.name,
        templateId: this.getSelectedTemplate(systemData)?.id
      }
    };
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      loadedTokens: Array.from(this.loadedTokens),
      loadedCount: this.loadedTokens.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.loadedTokens.clear();
    console.log(`🗑️ Cache cleared (removed ${previousSize} entries)`);
  }

  /**
   * Get from cache
   * @param {string} token - Token
   * @returns {Object|null} Cached data or null
   * @private
   */
  _getFromCache(token) {
    const cached = this.cache.get(token);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheExpiry) {
      console.log(`⏱️ Cache expired for token: ${token} (age: ${age}ms)`);
      this.cache.delete(token);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cache
   * @param {string} token - Token
   * @param {Object} data - Data to cache
   * @private
   */
  _setCache(token, data) {
    this.cache.set(token, {
      data,
      timestamp: Date.now()
    });
    
    console.log(`💾 Cached system data for token: ${token}`);
  }

  /**
   * Check if system data exists for token
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(token) {
    try {
      const data = await this.loadSystemData(token);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get system data info without loading full content
   * @param {string} token - Token
   * @returns {Promise<Object|null>} Basic info or null
   */
  async getSystemDataInfo(token) {
    try {
      const filePath = `${this.basePath}/${token}.json`;
      const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const fileInfo = await response.json();
      
      return {
        token: token,
        exists: true,
        size: fileInfo.size,
        sha: fileInfo.sha,
        url: fileInfo.html_url
      };
      
    } catch (error) {
      console.error(`❌ Error getting system data info for token ${token}:`, error);
      return null;
    }
  }
}

// Create and export singleton instance
const systemDataService = new SystemDataService();
export default systemDataService;