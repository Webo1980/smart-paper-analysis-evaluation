// src/components/evaluation/content/utils/highlightUtils.js
/**
 * Utility functions for highlighting and comparing text
 */

/**
 * Highlight matching tokens between two texts
 * @param {string} text1 - First text to compare
 * @param {string} text2 - Second text to compare 
 * @returns {Object} Object with highlighted versions of both texts
 */
export const highlightMatchingTokens = (text1, text2) => {
    if (!text1 || !text2) {
      return { 
        text1Highlighted: text1 || '', 
        text2Highlighted: text2 || '' 
      };
    }
    
    // Tokenize both texts
    const tokens1 = text1.toLowerCase().split(/\s+/);
    const tokens2 = text2.toLowerCase().split(/\s+/);
    
    // Find matching tokens
    const matchingTokens = new Set(tokens1.filter(token => 
      tokens2.includes(token) && token.length > 2
    ));
    
    // Add HTML highlighting to matching tokens in text1
    const text1Highlighted = text1.split(/\s+/).map(token => {
      if (matchingTokens.has(token.toLowerCase())) {
        return `<span class="bg-blue-100 rounded px-1">${token}</span>`;
      }
      return token;
    }).join(' ');
    
    // Add HTML highlighting to matching tokens in text2
    const text2Highlighted = text2.split(/\s+/).map(token => {
      if (matchingTokens.has(token.toLowerCase())) {
        return `<span class="bg-green-100 rounded px-1">${token}</span>`;
      }
      return token;
    }).join(' ');
    
    return { text1Highlighted, text2Highlighted };
  };
  
  /**
   * Format metric name for display (convert camelCase to Title Case)
   * @param {string} name - Metric name in camelCase
   * @returns {string} Formatted name in Title Case
   */
  export const formatMetricName = (name) => {
    if (!name) return '';
    
    // Split camelCase into separate words
    const formattedName = name.replace(/([A-Z])/g, ' $1')
      // Capitalize first letter
      .replace(/^./, (str) => str.toUpperCase());
    
    return formattedName;
  };