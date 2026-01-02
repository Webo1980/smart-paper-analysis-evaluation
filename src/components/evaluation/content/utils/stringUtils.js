// src\components\evaluation\content\utils\stringUtils.js
/**
 * Utility functions for string comparison and similarity analysis
 */

/**
 * Calculate string similarity using Jaccard similarity of word tokens
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Similarity score between 0 and 1
 */
export const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1.0;
    
    // Convert to lowercase and split into words
    const words1 = str1.toLowerCase().split(/\s+/).filter(Boolean);
    const words2 = str2.toLowerCase().split(/\s+/).filter(Boolean);
    
    // Calculate Jaccard similarity
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  };
  
  /**
   * Calculate Levenshtein distance between strings
   * @param {string} str1 - First string to compare
   * @param {string} str2 - Second string to compare
   * @returns {number} Edit distance between strings
   */
  export const calculateLevenshteinDistance = (str1, str2) => {
    if (!str1) return str2 ? str2.length : 0;
    if (!str2) return str1.length;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };
  
  /**
   * Calculate normalized similarity based on Levenshtein distance
   * @param {string} str1 - First string to compare
   * @param {string} str2 - Second string to compare
   * @returns {number} Normalized similarity score between 0 and 1
   */
  export const calculateNormalizedSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1.0;
    
    const distance = calculateLevenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    return 1 - (distance / maxLength);
  };
  
  /**
   * Highlight differences between two strings
   * @param {string} originalText - Original text
   * @param {string} editedText - Edited text
   * @returns {Object} Object containing highlighted versions of both texts
   */
  export const highlightDifferences = (originalText, editedText) => {
    if (!originalText && !editedText) {
      return { originalHighlighted: '', editedHighlighted: '' };
    }
    
    if (!originalText) {
      return { 
        originalHighlighted: '', 
        editedHighlighted: `<span class="bg-green-100">${editedText}</span>` 
      };
    }
    
    if (!editedText) {
      return { 
        originalHighlighted: `<span class="bg-red-100">${originalText}</span>`, 
        editedHighlighted: '' 
      };
    }
    
    // For identical texts, return without highlighting
    if (originalText === editedText) {
      return { originalHighlighted: originalText, editedHighlighted: editedText };
    }
    
    // Split into words for comparison
    const originalWords = originalText.split(/(\s+)/).filter(word => word);
    const editedWords = editedText.split(/(\s+)/).filter(word => word);
    
    // Track which words were matched
    const originalMatched = new Array(originalWords.length).fill(false);
    const editedMatched = new Array(editedWords.length).fill(false);
    
    // Find exact matches
    for (let i = 0; i < originalWords.length; i++) {
      for (let j = 0; j < editedWords.length; j++) {
        if (!editedMatched[j] && originalWords[i] === editedWords[j]) {
          originalMatched[i] = true;
          editedMatched[j] = true;
          break;
        }
      }
    }
    
    // Create highlighted versions
    let originalHighlighted = '';
    let editedHighlighted = '';
    
    // Original text highlighting
    let inHighlight = false;
    for (let i = 0; i < originalWords.length; i++) {
      if (!originalMatched[i] && !inHighlight) {
        originalHighlighted += '<span class="bg-red-100">';
        inHighlight = true;
      } else if (originalMatched[i] && inHighlight) {
        originalHighlighted += '</span>';
        inHighlight = false;
      }
      originalHighlighted += originalWords[i];
    }
    if (inHighlight) {
      originalHighlighted += '</span>';
    }
    
    // Edited text highlighting
    inHighlight = false;
    for (let j = 0; j < editedWords.length; j++) {
      if (!editedMatched[j] && !inHighlight) {
        editedHighlighted += '<span class="bg-green-100">';
        inHighlight = true;
      } else if (editedMatched[j] && inHighlight) {
        editedHighlighted += '</span>';
        inHighlight = false;
      }
      editedHighlighted += editedWords[j];
    }
    if (inHighlight) {
      editedHighlighted += '</span>';
    }
    
    return { originalHighlighted, editedHighlighted };
  };
  
  /**
   * Get predefined colors for text comparison
   */
  export const textComparisonColors = {
    added: {
      color: 'bg-green-100',
      description: 'Added content'
    },
    removed: {
      color: 'bg-red-100',
      description: 'Removed content'
    },
    unchanged: {
      color: 'bg-gray-100',
      description: 'Unchanged content'
    },
    modified: {
      color: 'bg-yellow-100',
      description: 'Modified content'
    }
  };
  
  /**
   * Calculate semantic similarity between texts using cosine similarity of word embeddings
   * This is a simplified implementation - in a production system, this would use actual word embeddings
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Semantic similarity score
   */
  export const calculateSemanticSimilarity = (text1, text2) => {
    // In a real implementation, this would use word embeddings and proper semantic analysis
    // For this demo, we'll combine Jaccard similarity with a length similarity factor
    
    const jaccardSimilarity = calculateStringSimilarity(text1, text2);
    const normalizedSimilarity = calculateNormalizedSimilarity(text1, text2);
    
    // Combine the two metrics
    return (jaccardSimilarity * 0.6) + (normalizedSimilarity * 0.4);
  };
  
  /**
   * Analyze similarity between two texts with multiple metrics
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Object} Comprehensive similarity analysis
   */
  export const analyzeSimilarity = (text1, text2) => {
    if (!text1 || !text2) {
      return {
        levenshtein: { distance: 0, similarityScore: 0 },
        tokenMatching: { overlap: 0, precision: 0, recall: 0, f1Score: 0 },
        edits: { modifications: 0, editPercentage: 0 },
        semantic: { similarityScore: 0 }
      };
    }
    
    // Levenshtein distance
    const distance = calculateLevenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    const similarityScore = 1 - (distance / maxLength);
    
    // Token overlap metrics
    const words1 = text1.toLowerCase().split(/\s+/).filter(Boolean);
    const words2 = text2.toLowerCase().split(/\s+/).filter(Boolean);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    const overlap = intersection.size / Math.max(set1.size, set2.size);
    const precision = set1.size > 0 ? intersection.size / set1.size : 0;
    const recall = set2.size > 0 ? intersection.size / set2.size : 0;
    
    let f1Score = 0;
    if (precision > 0 || recall > 0) {
      f1Score = (precision + recall) > 0 ? 
        (2 * precision * recall) / (precision + recall) : 0;
    }
    
    // Edit metrics
    const modifications = distance;
    const editPercentage = maxLength > 0 ? distance / maxLength : 0;
    
    // Semantic similarity
    const semanticSimilarity = calculateSemanticSimilarity(text1, text2);
    
    return {
      levenshtein: { distance, similarityScore },
      tokenMatching: { overlap, precision, recall, f1Score },
      edits: { modifications, editPercentage },
      semantic: { similarityScore: semanticSimilarity }
    };
  };