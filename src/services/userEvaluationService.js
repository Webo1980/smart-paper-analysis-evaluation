/**
 * User Evaluation Service
 * Handles loading and processing user evaluation JSON files
 */

class UserEvaluationService {
  constructor() {
    this.userEvaluations = new Map(); // Map of token -> evaluation data
  }

  /**
   * Load user evaluation from JSON file
   * @param {File} jsonFile - The JSON file to parse
   * @returns {Promise<Object>} Parsed evaluation data
   */
  async loadFromFile(jsonFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const evaluationData = JSON.parse(e.target.result);
          
          // Store by token
          if (evaluationData.token) {
            this.userEvaluations.set(evaluationData.token, evaluationData);
          }
          
          resolve(evaluationData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(jsonFile);
    });
  }

  /**
   * Load multiple user evaluation files
   * @param {FileList|Array<File>} files - Array of JSON files
   * @returns {Promise<Array<Object>>} Array of parsed evaluations
   */
  async loadMultipleFiles(files) {
    const promises = Array.from(files).map(file => this.loadFromFile(file));
    return Promise.all(promises);
  }

  /**
   * Get evaluation by token
   * @param {string} token - Evaluation token
   * @returns {Object|null} Evaluation data
   */
  getByToken(token) {
    return this.userEvaluations.get(token) || null;
  }

  /**
   * Get all evaluations
   * @returns {Array<Object>} All evaluations
   */
  getAllEvaluations() {
    return Array.from(this.userEvaluations.values());
  }

  /**
   * Extract user info from evaluation
   * @param {Object} evaluation - User evaluation data
   * @returns {Object} User information
   */
  extractUserInfo(evaluation) {
    return evaluation.userInfo || {};
  }

  /**
   * Extract metadata assessment
   * @param {Object} evaluation - User evaluation data
   * @returns {Object} Metadata assessment
   */
  extractMetadataAssessment(evaluation) {
    return evaluation.evaluationState?.metadata?.finalAssessment || {};
  }

  /**
   * Extract research field assessment
   * @param {Object} evaluation - User evaluation data
   * @returns {Object} Research field assessment
   */
  extractResearchFieldAssessment(evaluation) {
    return evaluation.evaluationState?.research_field?.finalAssessment || {};
  }

  /**
   * Extract research problem assessment
   * @param {Object} evaluation - User evaluation data
   * @returns {Object} Research problem assessment
   */
  extractResearchProblemAssessment(evaluation) {
    return evaluation.evaluationState?.problemAnalysis?.finalAssessment || {};
  }

  /**
   * Extract template assessment
   * @param {Object} evaluation - User evaluation data
   * @returns {Object} Template assessment
   */
  extractTemplateAssessment(evaluation) {
    return evaluation.evaluationState?.template?.finalAssessment || {};
  }

  /**
   * Extract content analysis assessment
   * @param {Object} evaluation - User evaluation data
   * @returns {Object} Content assessment
   */
  extractContentAssessment(evaluation) {
    return evaluation.evaluationState?.content?.finalAssessment || {};
  }

  /**
   * Get statistics about loaded evaluations
   * @returns {Object} Statistics
   */
  getStatistics() {
    const evaluations = this.getAllEvaluations();
    
    return {
      totalEvaluations: evaluations.length,
      completedEvaluations: evaluations.filter(
        e => e.evaluationState?.finalVerdict?.completed
      ).length,
      withMetadataAssessment: evaluations.filter(
        e => e.evaluationState?.metadata?.isComplete
      ).length,
      withFieldAssessment: evaluations.filter(
        e => e.evaluationState?.research_field?.isComplete
      ).length,
      withProblemAssessment: evaluations.filter(
        e => e.evaluationState?.problemAnalysis?.isComplete
      ).length,
      withTemplateAssessment: evaluations.filter(
        e => e.evaluationState?.template?.isComplete
      ).length,
      withContentAssessment: evaluations.filter(
        e => e.evaluationState?.content?.isComplete
      ).length,
      uniqueEvaluators: new Set(
        evaluations.map(e => e.userInfo?.email).filter(Boolean)
      ).size
    };
  }

  /**
   * Get evaluations by evaluator
   * @param {string} evaluatorEmail - Evaluator's email
   * @returns {Array<Object>} Evaluations by this evaluator
   */
  getByEvaluator(evaluatorEmail) {
    return this.getAllEvaluations().filter(
      e => e.userInfo?.email === evaluatorEmail
    );
  }

  /**
   * Check if any data is loaded
   * @returns {boolean} True if data is loaded
   */
  isLoaded() {
    return this.userEvaluations.size > 0;
  }

  /**
   * Clear all loaded data
   */
  clear() {
    this.userEvaluations.clear();
  }
}

// Export singleton instance
export default new UserEvaluationService();