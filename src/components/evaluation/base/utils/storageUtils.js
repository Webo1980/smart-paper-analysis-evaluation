// src\components\evaluation\base\utils\storageUtils.js
/**
 * Storage utility functions for evaluation metrics
 * Provides nested structure for organized data storage
 */

const METRICS_STORAGE_KEY = 'evaluation_metrics';

/**
 * Get the entire metrics store
 * @returns {Object} Complete metrics store object
 */
export const getMetricsStore = () => {
  try {
    const data = localStorage.getItem(METRICS_STORAGE_KEY);
    return data ? JSON.parse(data) : {
      accuracy: {},
      quality: {},
      overall: {}
    };
  } catch (error) {
    console.error('Error retrieving metrics store:', error);
    return {
      accuracy: {},
      quality: {},
      overall: {}
    };
  }
};

/**
 * Save the entire metrics store
 * @param {Object} store - Metrics store to save
 * @returns {boolean} Success status
 */
export const saveMetricsStore = (store) => {
  try {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (error) {
    console.error('Error saving metrics store:', error);
    return false;
  }
};

/**
 * Store field metrics in the nested structure
 * @param {string} field - Field name
 * @param {string} type - Metric type (accuracy, quality, etc)
 * @param {Object} data - Metric data to store
 * @param {string} domain - Domain name (metadata, research, etc)
 * @returns {boolean} Success status
 */
export const storeFieldMetrics = (field, type, data, domain = 'general') => {
  try {
    // Get current store
    const store = getMetricsStore();
    
    // Initialize nested structure if needed
    if (!store[type]) store[type] = {};
    if (!store[type][domain]) store[type][domain] = {};
    
    // Store data
    store[type][domain][field] = data;
    
    // Save store
    return saveMetricsStore(store);
  } catch (error) {
    console.error(`Error storing metrics for ${domain}.${type}.${field}:`, error);
    return false;
  }
};

/**
 * Get field metrics from the nested structure
 * @param {string} field - Field name
 * @param {string} type - Metric type (accuracy, quality, etc)
 * @param {string} domain - Domain name (metadata, research, etc)
 * @returns {Object} Field metrics
 */
export const getFieldMetrics = (field, type, domain = 'general') => {
  try {
    const store = getMetricsStore();
    
    // Navigate nested structure
    if (store[type] && store[type][domain] && store[type][domain][field]) {
      return store[type][domain][field];
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving metrics for ${domain}.${type}.${field}:`, error);
    return null;
  }
};

/**
 * Get all metrics for a specific domain and type
 * @param {string} type - Metric type (accuracy, quality, etc)
 * @param {string} domain - Domain name (metadata, research, etc)
 * @returns {Object} Domain metrics
 */
export const getDomainMetrics = (type, domain = 'general') => {
  try {
    const store = getMetricsStore();
    
    if (!store[type]) return {};
    if (!store[type][domain]) return {};
    
    return store[type][domain];
  } catch (error) {
    console.error(`Error retrieving ${type} metrics for ${domain}:`, error);
    return {};
  }
};

/**
 * Store overall evaluation data
 * @param {Object} data - Overall evaluation data
 * @param {string} domain - Domain name
 * @returns {boolean} Success status
 */
export const storeOverallEvaluation = (data, domain = 'general') => {
  try {
    const store = getMetricsStore();
    
    // Initialize nested structure if needed
    if (!store.overall) store.overall = {};
    
    // Store data
    store.overall[domain] = data;
    
    // Save store
    return saveMetricsStore(store);
  } catch (error) {
    console.error(`Error storing overall evaluation for ${domain}:`, error);
    return false;
  }
};

/**
 * Get overall evaluation data
 * @param {string} domain - Domain name
 * @returns {Object} Overall evaluation data
 */
export const getOverallEvaluation = (domain = 'general') => {
  try {
    const store = getMetricsStore();
    
    if (!store.overall) return null;
    
    return store.overall[domain] || null;
  } catch (error) {
    console.error(`Error retrieving overall evaluation for ${domain}:`, error);
    return null;
  }
};