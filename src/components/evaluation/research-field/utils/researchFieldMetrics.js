// src/components/evaluation/research-field/utils/researchFieldMetrics.js
import { calculateWeightsAndAgreement, formatPercentage } from '../../base/utils/baseMetricsUtils';
import { storeFieldMetrics, storeOverallEvaluation } from '../../base/utils/storageUtils';
import { QUALITY_WEIGHTS, FIELD_ACCURACY_WEIGHTS } from '../config/researchFieldConfig';

/**
 * Process research field accuracy metrics
 */
export const processResearchFieldAccuracy = (
  fieldType,
  orkgValue,
  predictedValues,
  rating,
  expertiseMultiplier
) => {
  // Extract the necessary data
  const groundTruth = orkgValue || '';
  
  // Normalize predictions
  const predictions = Array.isArray(predictedValues) 
    ? predictedValues.map(p => ({
        field: p.name || p.field || '',
        name: p.name || p.field || '',
        score: p.score || 0
      }))
    : (predictedValues?.fields && Array.isArray(predictedValues.fields))
      ? predictedValues.fields.map(p => ({
          field: p.name || p.field || '',
          name: p.name || p.field || '',
          score: p.score || 0
        }))
      : [];

  // Find position of ground truth in predictions
  const groundTruthPosition = predictions.findIndex(
    p => p.name.toLowerCase() === groundTruth.toLowerCase()
  );

  // Calculate individual scores
  const exactMatch = groundTruthPosition === 0 ? 1.0 : 0.0;
  const recall = groundTruthPosition !== -1 ? 1.0 : 0.0;
  const topN = groundTruthPosition >= 0 && groundTruthPosition < 3 ? 1.0 : 0.0;
  
  // Calculate position score
  let positionScore = 0;
  if (groundTruthPosition === 0) positionScore = 1.0;
  else if (groundTruthPosition === 1) positionScore = 0.8;
  else if (groundTruthPosition === 2) positionScore = 0.6;
  else if (groundTruthPosition === 3) positionScore = 0.4;
  else if (groundTruthPosition === 4) positionScore = 0.2;
  
  // Calculate F1 score (ensure it's 0 when no match)
  let f1Score = 0;
  if (exactMatch > 0 && recall > 0) {
    f1Score = 2 * (exactMatch * recall) / (exactMatch + recall);
  }
  
  // Calculate automated overall score using weights from config
  const automatedOverallScore = 
    (exactMatch * FIELD_ACCURACY_WEIGHTS.exactMatch) +
    (topN * FIELD_ACCURACY_WEIGHTS.topN) +
    (positionScore * FIELD_ACCURACY_WEIGHTS.positionScore);
  
  // Create similarity data object
  const similarityData = {
    exactMatch,
    recall,
    topN,
    positionScore,
    foundPosition: groundTruthPosition >= 0 ? groundTruthPosition + 1 : null,
    f1Score,
    automatedOverallScore,
    overallScore: automatedOverallScore,
    totalPredictions: predictions.length,
    precision: exactMatch // Precision = exactMatch
  };
  
  // Calculate score details with weights and agreement
  const scoreDetails = calculateWeightsAndAgreement(
    automatedOverallScore,
    rating,
    expertiseMultiplier
  );
  
  // ✅ FIX: Store directly under researchField (no nested field key)
  // Structure: evaluation_metrics.accuracy.researchField.{data}
  const accuracyData = {
    similarityData,
    scoreDetails,
    rating,
    expertiseMultiplier
  };
  
  // Store using custom logic to avoid nested keys
  const store = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
  if (!store.accuracy) store.accuracy = {};
  store.accuracy.researchField = accuracyData;
  localStorage.setItem('evaluation_metrics', JSON.stringify(store));
  
  return {
    similarityData,
    scoreDetails
  };
};

/**
 * Process research field quality evaluation
 */
export const processResearchFieldQuality = (
  fieldType,
  qualityAnalysis,
  rating,
  expertiseMultiplier,
  qualityWeights = QUALITY_WEIGHTS // Use config as default
) => {
  // Ensure qualityAnalysis has all required fields
  const validatedQualityAnalysis = {
    confidence: qualityAnalysis?.confidence || 0,
    relevance: qualityAnalysis?.relevance || 0,
    consistency: qualityAnalysis?.consistency || 0,
    ...qualityAnalysis
  };
  
  // Calculate automated overall score
  const automatedOverallScore = (
    (validatedQualityAnalysis.confidence * qualityWeights.confidence) + 
    (validatedQualityAnalysis.relevance * qualityWeights.relevance) + 
    (validatedQualityAnalysis.consistency * qualityWeights.consistency)
  );
  
  // Calculate score details using base util
  const scoreDetails = calculateWeightsAndAgreement(
    automatedOverallScore,
    rating,
    expertiseMultiplier
  );
  
  // Prepare qualityData with consistent structure
  const qualityData = {
    fieldSpecificMetrics: {
      confidence: { score: validatedQualityAnalysis.confidence },
      relevance: { score: validatedQualityAnalysis.relevance },
      consistency: { score: validatedQualityAnalysis.consistency }
    },
    weights: qualityWeights,
    overallScore: automatedOverallScore,
    automatedOverallScore,
    details: validatedQualityAnalysis.details || {}
  };
  
  // ✅ FIX: Store directly under researchField (no nested field key)
  // Structure: evaluation_metrics.quality.researchField.{data}
  const qualityFullData = {
    qualityData,
    qualityAnalysis: validatedQualityAnalysis,
    weights: qualityWeights,
    rating,
    expertiseMultiplier,
    scoreDetails
  };
  
  // Store using custom logic to avoid nested keys
  const store = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
  if (!store.quality) store.quality = {};
  store.quality.researchField = qualityFullData;
  localStorage.setItem('evaluation_metrics', JSON.stringify(store));
  
  return {
    qualityData,
    scoreDetails
  };
};

// Helper format function
export const formatPercent = (value) => {
  return formatPercentage(value);
};

// Export formatUserRating for consistency
export { formatPercentage as formatUserRating } from '../../base/utils/baseMetricsUtils';