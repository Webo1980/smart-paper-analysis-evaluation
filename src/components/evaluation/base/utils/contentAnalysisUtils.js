// src\components\evaluation\base\utils\contentAnalysisUtils.js
import { WEIGHTING_CONFIG } from '../config/evaluationConfig';

/**
 * Convert any value to a comparable string format
 * Handles different value types and field-specific formatting
 */
export const convertToComparableString = (value, fieldType = '') => {
  if (value === null || value === undefined) return '';
  
  // Special handling for dates/years if field type is provided
  if (fieldType && (fieldType.toLowerCase().includes('year') || fieldType.toLowerCase().includes('date'))) {
    // Handle ISO date strings
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return value.substring(0, 4); // Extract year only
    }
    // Handle Date objects
    if (value instanceof Date) {
      return value.getFullYear().toString();
    }
    // If it's already a 4-digit year string, return as is
    if (typeof value === 'string' && value.match(/^\d{4}$/)) {
      return value;
    }
  }
  
  // If it's an array, join with commas
  if (Array.isArray(value)) {
    return value.map(item => String(item || '')).join(', ');
  }
  
  // If it's an object but not a Date, convert to JSON
  if (typeof value === 'object' && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  
  // Convert to string for everything else
  return String(value);
};

/**
 * Calculate Levenshtein distance between two strings
 */
export const levenshteinDistance = (a, b) => {
  if (!a || !b) return 0;
  const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }
  
  return matrix[b.length][a.length];
};

/**
 * Calculate token matching between two strings
 */
export const calculateTokenMatching = (original, extracted) => {
  const originalTokens = original.split(/\s+/).filter(w => w.trim());
  const extractedTokens = extracted.split(/\s+/).filter(w => w.trim());
  const originalSet = new Set(originalTokens);
  
  let tokenMatchCount = 0;
  extractedTokens.forEach(token => {
    if (originalSet.has(token)) tokenMatchCount++;
  });
  
  return {
    originalTokens,
    extractedTokens,
    originalSet,
    tokenMatchCount,
    score: Math.min(
      Math.max(originalTokens.length, extractedTokens.length) > 0 ? 
        tokenMatchCount / Math.max(originalTokens.length, extractedTokens.length) : 1,
      1
    )
  };
};

/**
 * Calculate special character matching between two strings
 */
export const calculateSpecialCharMatching = (original, extracted) => {
  const originalSpecial = (original.match(/[^\w\s]/g) || []);
  const extractedSpecial = (extracted.match(/[^\w\s]/g) || []);
  const originalSpecialSet = new Set(originalSpecial);
  
  let specialMatchCount = 0;
  extractedSpecial.forEach(char => {
    if (originalSpecialSet.has(char)) specialMatchCount++;
  });
  
  return {
    originalSpecial,
    extractedSpecial,
    originalSpecialSet,
    specialMatchCount,
    score: Math.min(
      Math.max(originalSpecial.length, extractedSpecial.length) > 0 ?
        specialMatchCount / Math.max(originalSpecial.length, extractedSpecial.length) : 1,
      1
    )
  };
};

/**
 * Generate text similarity data between reference and extracted values
 * Domain-agnostic with configurable weights
 */
export const generateTextSimilarityData = (referenceValue, extractedValue, fieldType = '', weightConfig = null) => {
  // Skip processing if values are missing
  if (!referenceValue && !extractedValue) return null;
  
  // Convert values to strings for comparison
  const safeReferenceValue = convertToComparableString(referenceValue, fieldType);
  const safeExtractedValue = convertToComparableString(extractedValue, fieldType);
  
  // Return early if either value is empty after conversion
  if (!safeReferenceValue || !safeExtractedValue) return null;
  
  // Use provided weights or default weights
  const weights = weightConfig || WEIGHTING_CONFIG.DEFAULT_ACCURACY_WEIGHTS;
  
  // Calculate Levenshtein distance and score
  const distance = levenshteinDistance(safeReferenceValue, safeExtractedValue);
  const maxLength = Math.max(safeReferenceValue.length, safeExtractedValue.length);
  const levenshteinScore = maxLength > 0 ? 1 - (distance / maxLength) : 1;
  
  // Calculate token matching
  const tokenMatching = calculateTokenMatching(safeReferenceValue, safeExtractedValue);
  
  // Calculate special character matching
  const specialCharMatching = calculateSpecialCharMatching(safeReferenceValue, safeExtractedValue);
  
  // Calculate weighted scores
  const weightedLevenshtein = levenshteinScore * weights.levenshtein;
  const weightedTokenMatching = tokenMatching.score * weights.tokenMatching;
  const weightedSpecialChar = specialCharMatching.score * weights.specialChar;
  
  // Calculate combined score
  const combinedScore = Math.min(weightedLevenshtein + weightedTokenMatching + weightedSpecialChar, 1.0);
  
  // Calculate precision and recall for consistency
  const precision = tokenMatching.tokenMatchCount / (tokenMatching.extractedTokens.length || 1);
  const recall = tokenMatching.tokenMatchCount / (tokenMatching.originalTokens.length || 1);
  
  // Calculate F1 score
  const f1Score = precision + recall > 0 
    ? 2 * (precision * recall) / (precision + recall) 
    : 0;
  
  return {
    levenshtein: {
      score: levenshteinScore,
      distance,
      maxLength,
      weightedScore: weightedLevenshtein
    },
    tokenMatching: {
      ...tokenMatching,
      weightedScore: weightedTokenMatching
    },
    specialChar: {
      ...specialCharMatching,
      weightedScore: weightedSpecialChar
    },
    overallScore: combinedScore,
    precisionScore: precision,
    recallScore: recall,
    f1Score: f1Score,
    automatedOverallScore: combinedScore
  };
};

/**
 * Generate generic quality data for any field type
 * Domain-agnostic with fully configurable dimensions
 */
export const generateGenericQualityData = (referenceValue, extractedValue, options = {}) => {
  // Skip processing if values are missing
  if (!referenceValue && !extractedValue) return null;
  
  // Get field type for proper conversion
  const fieldType = options.fieldType || '';
  
  // Convert values to strings for comparison
  const safeReferenceValue = convertToComparableString(referenceValue, fieldType);
  const safeExtractedValue = convertToComparableString(extractedValue, fieldType);
  
  // Get dimensions configuration from options or use defaults
  const dimensionsConfig = options.dimensions || {};
  
  // Default dimension weights
  const defaultWeights = WEIGHTING_CONFIG.DEFAULT_QUALITY_WEIGHTS;
  
  // If no dimensions provided, use default dimensions
  const dimensions = Object.keys(dimensionsConfig).length > 0 ? 
    dimensionsConfig : 
    {
      completeness: {
        calculate: (ref, ext) => ref && ext ? Math.min(ext.length / Math.max(ref.length, 1), 1.0) : ref ? 0.1 : 1.0,
        detectIssues: (ref, ext, score) => score < 0.8 ? ['Content may be incomplete'] : [],
        weight: defaultWeights.completeness || 0.4
      },
      consistency: {
        calculate: (ref, ext) => ref && ext ? (ref.toLowerCase() === ext.toLowerCase() ? 1.0 : 0.7) : 0.5,
        detectIssues: (ref, ext, score) => score < 0.9 ? ['Format inconsistencies detected'] : [],
        weight: defaultWeights.consistency || 0.3
      },
      validity: {
        calculate: (ref, ext, type) => {
          if (!ext) return 0.3;
          if (type === 'doi') return /^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/.test(String(ext)) ? 1.0 : 0.5;
          if (type === 'year') return /^\d{4}$/.test(String(ext)) ? 1.0 : 0.6;
          return 1.0;
        },
        detectIssues: (ref, ext, score, type) => {
          if (score < 0.9) {
            if (type === 'doi') return ['DOI format is incorrect'];
            if (type === 'year') return ['Year format is not 4 digits'];
            return ['Value may not be valid'];
          }
          return [];
        },
        weight: defaultWeights.validity || 0.3
      }
    };
  
  // Create field metrics by executing dimension calculation functions
  const fieldMetrics = {};
  const weights = {};
  const dimensionNames = Object.keys(dimensions);
  
  dimensionNames.forEach(dimName => {
    const dimension = dimensions[dimName];
    
    // Use dimension's calculation function or default
    const calculateFunc = dimension.calculate || (() => 0.5);
    
    // Calculate score
    const score = calculateFunc(
      safeReferenceValue, 
      safeExtractedValue, 
      fieldType,
      options
    );
    
    // Use dimension's issue detection function or default
    const detectIssuesFunc = dimension.detectIssues || (() => []);
    
    // Detect issues
    const issues = detectIssuesFunc(
      safeReferenceValue, 
      safeExtractedValue, 
      score, 
      fieldType,
      options
    );
    
    // Store dimensions
    fieldMetrics[dimName] = { score, issues };
    weights[dimName] = dimension.weight || (1 / dimensionNames.length);
  });
  
  // Calculate overall score with weights
  let overallScore = 0;
  let totalWeight = 0;
  
  dimensionNames.forEach(dim => {
    overallScore += fieldMetrics[dim].score * weights[dim];
    totalWeight += weights[dim];
  });
  
  // Normalize if total weight is not 1
  if (totalWeight !== 1 && totalWeight > 0) {
    overallScore = overallScore / totalWeight;
  }
  
  // Generate explanations
  const explanation = {};
  dimensionNames.forEach(dim => {
    explanation[dim] = fieldMetrics[dim].issues.length ? 
      fieldMetrics[dim].issues[0] : 
      `Good ${dim}`;
  });
  
  return {
    fieldSpecificMetrics: fieldMetrics,
    weights,
    overallScore,
    automatedOverallScore: overallScore,
    explanation
  };
};

/**
 * Calculate overall quality from component metrics
 * Generic implementation that works with different dimension configurations
 */
export const calculateOverallQuality = (fieldMetrics, weights, userRating = 0, expertiseMultiplier = 1) => {
  if (!fieldMetrics || !weights) return 0;
  
  // Get metric dimensions
  const dimensions = Object.keys(weights);
  
  // Calculate automated score from components
  let automatedScore = 0;
  let totalWeight = 0;
  
  dimensions.forEach(dim => {
    if (fieldMetrics[dim] && typeof fieldMetrics[dim].score === 'number') {
      automatedScore += fieldMetrics[dim].score * weights[dim];
      totalWeight += weights[dim];
    }
  });
  
  // Normalize if total weight is not 1
  if (totalWeight !== 1 && totalWeight > 0) {
    automatedScore = automatedScore / totalWeight;
  }
  
  // If no user rating, just return automated score
  if (!userRating) return automatedScore;
  
  // Otherwise calculate combined score with expertise weight
  const normalizedRating = userRating / 5;
  const weightedUserRating = normalizedRating * expertiseMultiplier;
  
  // Apply standard weight distribution
  const combinedScore = (automatedScore * WEIGHTING_CONFIG.AUTOMATED_WEIGHT_BASE) + 
                       (weightedUserRating * WEIGHTING_CONFIG.USER_WEIGHT_BASE);
  
  return Math.min(combinedScore, 1.0);
};
