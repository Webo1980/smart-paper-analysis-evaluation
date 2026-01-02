// src/components/evaluation/base/utils/textDiffUtils.js
import { diffWords } from 'diff';
import { levenshteinDistance } from '../utils/contentAnalysisUtils'
/**
 * Colors for text comparison highlighting
 */
export const textComparisonColors = {
  added: {
    class: 'diff-added',
    color: 'bg-green-100 text-green-800',
    description: 'Added content'
  },
  removed: {
    class: 'diff-removed',
    color: 'bg-red-100 text-red-800',
    description: 'Removed content'
  },
  preserved: {
    class: '',
    color: 'bg-blue-100 text-blue-800',
    description: 'Preserved content'
  },
  unchanged: {
    color: 'bg-gray-200',
    description: 'Unchanged content'
  },
  modified: {
    color: 'bg-amber-200',
    description: 'Modified content'
  }
};

/**
 * Word by word difference highlighter using diff package
 * Highlights differences between two text strings
 * @param {string} original - Original text
 * @param {string} edited - Edited text
 * @returns {Object} Object containing highlighted versions of both texts
 */
export const highlightDifferences = (original = '', edited = '') => {
  if (!original && !edited) {
    return {
      originalHighlighted: '',
      editedHighlighted: ''
    };
  }
  
  if (!original) {
    return {
      originalHighlighted: '',
      editedHighlighted: `<span class="diff-added">${edited}</span>`
    };
  }
  
  if (!edited) {
    return {
      originalHighlighted: `<span class="diff-removed">${original}</span>`,
      editedHighlighted: ''
    };
  }
  
  const diff = diffWords(original, edited);
    
  const originalHighlighted = diff
    .map(part => 
      part.added ? '' :
      part.removed ? `<span class="diff-removed">${part.value}</span>` :
      `<span>${part.value}</span>`
    )
    .join('');
    
  const editedHighlighted = diff
    .map(part => 
      part.removed ? '' :
      part.added ? `<span class="diff-added">${part.value}</span>` :
      `<span>${part.value}</span>`
    )
    .join('');
  
  return { originalHighlighted, editedHighlighted };
};

/**
 * Split text into tokens (words and whitespace)
 * @param {string} text - Text to split
 * @returns {Array} Array of tokens
 */
/**
 * Helper functions for diffing - keeping these around for potential 
 * customized diffing in the future if needed.
 * Currently using the 'diff' library's diffWords function instead.
 */

/**
 * Split text into tokens for custom diffing
 * @param {string} text - Text to split into tokens
 * @returns {Array} Array of tokens
 */
const splitIntoTokens = (text) => {
  // Regular expression to split on word boundaries, preserving whitespace
  return text.split(/(\s+|\b)/).filter(token => token !== '');
};

/**
 * Calculates the longest common subsequence between two arrays
 * This is useful for custom diffing algorithms
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Array of common elements with their positions
 */
const longestCommonSubsequence = (arr1, arr2) => {
  const m = arr1.length;
  const n = arr2.length;
  
  // Create a table to store lengths of LCS
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Build the dp table
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0 || j === 0) {
        dp[i][j] = 0;
      } else if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Reconstruct the LCS
  const lcs = [];
  let i = m, j = n;
  
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift({
        value: arr1[i - 1],
        originalIndex: i - 1,
        editedIndex: j - 1
      });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
};

/**
 * Alternative custom highlighting method (not currently used)
 * @param {Array} originalWords - Original text tokens
 * @param {Array} editedWords - Edited text tokens
 * @param {Array} lcs - Longest common subsequence
 * @returns {Object} Object with highlighted HTML for both texts
 */
const customHighlighting = (originalWords, editedWords, lcs) => {
  let originalHighlighted = '';
  let editedHighlighted = '';
  
  // Create maps for quick lookup of common tokens
  const originalCommonMap = new Map(lcs.map(item => [item.originalIndex, true]));
  const editedCommonMap = new Map(lcs.map(item => [item.editedIndex, true]));
  
  // Process original text
  let currentSpan = null;
  
  for (let i = 0; i < originalWords.length; i++) {
    const isCommon = originalCommonMap.has(i);
    const spanType = isCommon ? 'unchanged' : 'removed';
    
    if (currentSpan !== spanType) {
      // Close previous span if exists
      if (currentSpan !== null) {
        originalHighlighted += '</span>';
      }
      
      // Open new span
      originalHighlighted += `<span class="${textComparisonColors[spanType].color}">`;
      currentSpan = spanType;
    }
    
    originalHighlighted += escapeHtml(originalWords[i]);
  }
  
  // Close final span if needed
  if (currentSpan !== null) {
    originalHighlighted += '</span>';
  }
  
  // Process edited text
  currentSpan = null;
  
  for (let i = 0; i < editedWords.length; i++) {
    const isCommon = editedCommonMap.has(i);
    const spanType = isCommon ? 'unchanged' : 'added';
    
    if (currentSpan !== spanType) {
      // Close previous span if exists
      if (currentSpan !== null) {
        editedHighlighted += '</span>';
      }
      
      // Open new span
      editedHighlighted += `<span class="${textComparisonColors[spanType].color}">`;
      currentSpan = spanType;
    }
    
    editedHighlighted += escapeHtml(editedWords[i]);
  }
  
  // Close final span if needed
  if (currentSpan !== null) {
    editedHighlighted += '</span>';
  }
  
  return {
    originalHighlighted,
    editedHighlighted
  };
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeHtml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Create a diff-enabled version of comparison data for the given texts
 * @param {string} originalText - Original text to compare
 * @param {string} editedText - Edited text to compare against
 * @returns {Object} Object with diff data and analysis
 */
export const generateDiffComparisonData = (originalText, editedText) => {
  // Handle edge cases
  if (originalText === editedText) {
    return {
      original: originalText,
      edited: editedText,
      highlighted: {
        originalHighlighted: `<span>${escapeHtml(originalText || '')}</span>`,
        editedHighlighted: `<span>${escapeHtml(editedText || '')}</span>`
      },
      stats: {
        additions: 0,
        deletions: 0,
        preserved: originalText ? originalText.length : 0,
        changePercentage: 0
      }
    };
  }
  
  // Get the highlighted versions using diffWords
  const highlighted = highlightDifferences(originalText, editedText);
  
  // Calculate stats about the diff
  const diff = diffWords(originalText || '', editedText || '');
  
  let additions = 0;
  let deletions = 0;
  let preserved = 0;
  
  diff.forEach(part => {
    if (part.added) {
      additions += part.value.length;
    } else if (part.removed) {
      deletions += part.value.length;
    } else {
      preserved += part.value.length;
    }
  });
  
  const originalLength = (originalText || '').length;
  const changePercentage = originalLength > 0 ? 
    ((additions + deletions) / (originalLength + additions)) * 100 : 
    editedText ? 100 : 0;
  
  return {
    original: originalText,
    edited: editedText,
    highlighted,
    stats: {
      additions,
      deletions,
      preserved,
      changePercentage
    }
  };
};

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Levenshtein distance
 */

/**
 * Calculate similarity score between two strings based on Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
export const calculateSimilarityScore = (str1, str2) => {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  // Calculate similarity as 1 - normalized distance
  return maxLength > 0 ? 1 - (distance / maxLength) : 1;
};

/**
 * Calculate token-based similarity metrics between two texts
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {Object} Object with precision, recall, and F1 score
 */
export const calculateTokenMetrics = (str1, str2) => {
  if (!str1 && !str2) {
    return { precision: 1, recall: 1, f1Score: 1 };
  }
  
  if (!str1 || !str2) {
    return { precision: 0, recall: 0, f1Score: 0 };
  }
  
  // Tokenize to words
  const tokens1 = str1.toLowerCase().split(/\s+/).filter(Boolean);
  const tokens2 = str2.toLowerCase().split(/\s+/).filter(Boolean);
  
  // Create sets for faster lookup
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  // Find common tokens
  let common = 0;
  set1.forEach(token => {
    if (set2.has(token)) {
      common++;
    }
  });
  
  // Calculate precision, recall and F1
  const precision = set2.size > 0 ? common / set2.size : 0;
  const recall = set1.size > 0 ? common / set1.size : 0;
  const f1Score = (precision + recall) > 0 ? 
    (2 * precision * recall) / (precision + recall) : 0;
  
  return { precision, recall, f1Score };
};

/**
 * Generate comprehensive text comparison data
 * @param {string} originalText - Original text
 * @param {string} editedText - Edited text
 * @returns {Object} Comparison data with various metrics
 */
export const generateTextComparisonData = (originalText, editedText) => {
  // Handle edge cases
  if (originalText === editedText) {
    return {
      original: originalText,
      edited: editedText,
      levenshtein: {
        distance: 0,
        similarityScore: 1
      },
      tokenMatching: {
        precision: 1,
        recall: 1,
        f1Score: 1
      },
      edits: {
        modifications: 0,
        editPercentage: 0
      }
    };
  }
  
  // Calculate Levenshtein metrics
  const distance = levenshteinDistance(originalText || '', editedText || '');
  const similarityScore = calculateSimilarityScore(originalText, editedText);
  
  // Calculate token-based metrics
  const tokenMetrics = calculateTokenMetrics(originalText, editedText);
  
  // Calculate edit statistics
  const maxLength = Math.max(
    originalText ? originalText.length : 0,
    editedText ? editedText.length : 0
  );
  
  const editPercentage = maxLength > 0 ? distance / maxLength : 0;
  
  return {
    original: originalText,
    edited: editedText,
    levenshtein: {
      distance,
      similarityScore
    },
    tokenMatching: tokenMetrics,
    edits: {
      modifications: distance,
      editPercentage
    },
    highlighted: highlightDifferences(originalText, editedText)
  };
};