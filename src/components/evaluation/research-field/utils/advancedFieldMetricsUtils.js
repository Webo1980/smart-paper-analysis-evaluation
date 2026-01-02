// src/components/evaluation/research-field/utils/advancedFieldMetricsUtils.js

import { calculateWordMetrics } from './relevanceMetricsUtils';

/**
 * Calculate Semantic Similarity using word-level and hierarchy metrics
 * @param {string} groundTruth - Original research field name
 * @param {string} prediction - Predicted research field name
 * @param {Object} [researchFieldsTree] - Optional research field hierarchy
 * @returns {Object} Semantic similarity metrics
 */
export const calculateSemanticSimilarity = (groundTruth, prediction, researchFieldsTree = null) => {
  // Word-level metrics
  const wordMetrics = calculateWordMetrics(groundTruth, prediction);
  
  // Default to word-level metrics if no hierarchy is available
  if (!researchFieldsTree) {
    return {
      wordOverlapScore: wordMetrics.wordOverlapScore,
      jaccardScore: wordMetrics.jaccardScore,
      semanticSimilarity: (wordMetrics.wordOverlapScore + wordMetrics.jaccardScore) / 2
    };
  }
  
  // TODO: Enhance with hierarchy-based semantic similarity if needed
  // This would involve using the research field hierarchy to improve semantic scoring
  
  return {
    wordOverlapScore: wordMetrics.wordOverlapScore,
    jaccardScore: wordMetrics.jaccardScore,
    semanticSimilarity: (wordMetrics.wordOverlapScore + wordMetrics.jaccardScore) / 2
  };
};

/**
 * Calculate Token-level Accuracy
 * @param {string} groundTruth - Original research field name
 * @param {string} prediction - Predicted research field name
 * @returns {Object} Token-level accuracy metrics
 */
export const calculateTokenAccuracy = (groundTruth, prediction) => {
  const refTokens = (groundTruth || '').toLowerCase().split(/\s+/).filter(Boolean);
  const predTokens = (prediction || '').toLowerCase().split(/\s+/).filter(Boolean);
  
  // Exact match tokens
  const matchedTokens = refTokens.filter(token => 
    predTokens.includes(token)
  );
  
  // Calculate token-level metrics
  const precision = refTokens.length > 0 
    ? matchedTokens.length / refTokens.length 
    : 0;
  
  const recall = predTokens.length > 0
    ? matchedTokens.length / predTokens.length
    : 0;
  
  const f1Score = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;
  
  return {
    tokens: {
      reference: refTokens,
      predicted: predTokens,
      matched: matchedTokens
    },
    precision,
    recall,
    f1Score,
    tokenAccuracy: matchedTokens.length / Math.max(refTokens.length, predTokens.length)
  };
};

/**
 * Enhanced research field metric calculation
 * @param {string} groundTruth - Original research field name
 * @param {string} prediction - Predicted research field name
 * @param {Object} [researchFieldsTree] - Optional research field hierarchy
 * @returns {Object} Comprehensive field metrics
 */
export const calculateFieldMetrics = (groundTruth, prediction, researchFieldsTree = null) => {
  const tokenMetrics = calculateTokenAccuracy(groundTruth, prediction);
  const semanticMetrics = calculateSemanticSimilarity(groundTruth, prediction, researchFieldsTree);
  
  return {
    ...tokenMetrics,
    ...semanticMetrics,
    overallScore: (
      tokenMetrics.f1Score * 0.4 + 
      semanticMetrics.semanticSimilarity * 0.4 + 
      tokenMetrics.tokenAccuracy * 0.2
    )
  };
};