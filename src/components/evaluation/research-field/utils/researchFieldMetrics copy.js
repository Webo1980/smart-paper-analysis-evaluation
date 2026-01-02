// src/components/evaluation/research-field/utils/researchFieldMetrics.js
import {
  processAccuracyEvaluation,
  processQualityEvaluation
} from '../../base/utils/evaluationUtils';

import { WEIGHTING_CONFIG } from '../../base/config/evaluationConfig';
import { getFieldMetrics, storeFieldMetrics, storeOverallEvaluation } from '../../base/utils/storageUtils';
import { RESEARCH_FIELD_CONFIG } from '../config/researchFieldConfig';

/**
 * Format user rating consistently with expertise multiplier
 */
export const formatUserRating = (rating, expertiseMultiplier = 1.0) => {
  // Ensure rating is between 1 and 5
  const clampedRating = Math.min(Math.max(rating || 3, 1), 5);
  // Apply expertise multiplier (defaults to no change if not provided)
  const adjustedRating = clampedRating * expertiseMultiplier;
  // Format to one decimal place
  return adjustedRating.toFixed(1);
};

/**
 * Calculate hierarchical similarity between predicted and actual research fields
 */
export const calculateHierarchicalSimilarity = (prediction, groundTruth, fieldTaxonomy = {}) => {
  // Handle empty inputs
  if (!prediction || !groundTruth) return 0;
  
  // Exact match is perfect score
  if (prediction === groundTruth) return 1.0;
  
  // If taxonomy is not available, use string similarity as fallback
  if (!fieldTaxonomy || Object.keys(fieldTaxonomy).length === 0) {
    return calculateStringSimilarity(prediction, groundTruth);
  }
  
  // Get the paths in the taxonomy
  const predictionPath = getFieldPath(prediction, fieldTaxonomy);
  const groundTruthPath = getFieldPath(groundTruth, fieldTaxonomy);
  
  if (!predictionPath.length || !groundTruthPath.length) {
    return calculateStringSimilarity(prediction, groundTruth);
  }
  
  // Find common ancestry
  const commonPathLength = findCommonPathLength(predictionPath, groundTruthPath);
  
  // Calculate similarity based on common path
  const maxPathLength = Math.max(predictionPath.length, groundTruthPath.length);
  return commonPathLength / maxPathLength;
};

// Normalize predictions for consistent field property names
function normalizePredictions(predictions) {
  if (!predictions) return [];
  
  const result = Array.isArray(predictions) 
    ? predictions.map(p => ({
        field: p.field || p.name || '',
        name: p.name || p.field || '',
        score: p.score || 0
      }))
    : [{
        field: predictions.field || predictions.name || '',
        name: predictions.name || predictions.field || '',
        score: predictions.score || 0
      }];
      
  return result;
}

// Helper function for string similarity
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = String(str1).toLowerCase();
  const s2 = String(str2).toLowerCase();
  
  if (s1 === s2) return 1.0;
  
  const words1 = s1.split(/\s+/).filter(w => w.trim());
  const words2 = s2.split(/\s+/).filter(w => w.trim());
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const intersection = words1.filter(w => words2.includes(w)).length;
  const union = words1.length + words2.length - intersection;
  
  return intersection / (union || 1);
}

function getFieldPath(field, taxonomy) {
  if (!taxonomy || !field) return [];
  if (!taxonomy[field]) return [field];
  
  let path = [field];
  let current = field;
  
  while (taxonomy[current]?.parent) {
    current = taxonomy[current].parent;
    path.unshift(current);
  }
  
  return path;
}

function findCommonPathLength(path1, path2) {
  let common = 0;
  const minLength = Math.min(path1.length, path2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (path1[i] === path2[i]) {
      common++;
    } else {
      break;
    }
  }
  
  return common;
}

// Calculate token matching between fields
function calculateFieldTokenMatching(field1, field2) {
  if (!field1 || !field2) return { score: 0, tokenMatchCount: 0, originalTokens: [], extractedTokens: [] };
  
  // Split into tokens
  const originalTokens = String(field1).split(/\s+/).filter(t => t.trim());
  const extractedTokens = String(field2).split(/\s+/).filter(t => t.trim());
  
  // Count matching tokens
  let tokenMatchCount = 0;
  const originalSet = new Set(originalTokens.map(t => t.toLowerCase()));
  
  extractedTokens.forEach(token => {
    if (originalSet.has(token.toLowerCase())) tokenMatchCount++;
  });
  
  return {
    score: Math.min(tokenMatchCount / Math.max(originalTokens.length, extractedTokens.length, 1), 1),
    tokenMatchCount,
    originalTokens,
    extractedTokens
  };
}

/**
 * Process research field accuracy with complete metrics
 * THIS FUNCTION SHOULD REMAIN IN THE RESEARCH-FIELD MODULE
 */
export const processResearchFieldAccuracy = (
  fieldName,
  groundTruth,
  predictions,
  rating = 3,
  expertiseMultiplier = 1.0
) => {
  try {
    // Normalize inputs
    const normalizedPredictions = normalizePredictions(predictions);
    const safeGroundTruth = String(groundTruth || '').toLowerCase().trim();
    
    // Find if and where the ground truth appears in predictions
    let foundIndex = -1;
    normalizedPredictions.forEach((p, index) => {
      const predField = String(p.field || p.name || '').toLowerCase().trim();
      if (predField === safeGroundTruth && foundIndex === -1) {
        foundIndex = index;
      }
    });
  
    // Calculate core metrics
    const exactMatch = foundIndex === 0 ? 1.0 : 0.0;
    const recall = foundIndex >= 0 ? 1.0 : 0.0;
    const topN = foundIndex >= 0 && foundIndex < 3 ? 1.0 : 0.0;
    const positionScore = foundIndex >= 0 ? Math.max(0, 1 - (foundIndex * 0.2)) : 0.0;
    
    // Calculate F1 score
    const precision = exactMatch;
    const f1Score = precision + recall > 0 ? 
      (2 * precision * recall) / (precision + recall) : 0;
  
    // Calculate overall score
    const overallScore = (exactMatch * 0.4) + (topN * 0.3) + (positionScore * 0.3);
  
    const similarityData = {
      precision,
      recall,
      f1Score,
      topN,
      positionScore,
      exactMatch,
      foundPosition: foundIndex >= 0 ? foundIndex + 1 : null,
      overallScore,
      automatedOverallScore: overallScore,
      totalPredictions: normalizedPredictions.length
    };
  
    // Calculate score details
    const normalizedRating = rating / 5;
    const agreement = 1 - Math.abs(overallScore - normalizedRating);
    
    const scoreDetails = {
      automatedScore: overallScore,
      finalScore: overallScore,
      normalizedRating,
      automaticConfidence: 0.8,
      automaticWeight: 0.4,
      userWeight: 0.6,
      agreement,
      agreementBonus: agreement * 0.1,
      combinedScore: (0.4 * overallScore) + (0.6 * normalizedRating),
      isCapped: false
    };
  
    // Apply agreement bonus
    scoreDetails.finalScore = Math.min(1, scoreDetails.combinedScore * (1 + scoreDetails.agreementBonus));
  
    // Store the evaluation for later reference
    storeFieldMetrics(
      fieldName,
      'accuracy',
      {
        similarityData,
        scoreDetails,
        rating,
        expertiseMultiplier
      },
      'researchField'
    );
  
    return {
      similarityData,
      scoreDetails,
      metrics: similarityData
    };
  } catch (error) {
    console.error(`Error processing research field accuracy for ${fieldName}:`, error);
    return {
      similarityData: {
        precision: 0,
        recall: 0,
        f1Score: 0,
        topN: 0,
        positionScore: 0,
        exactMatch: 0,
        foundPosition: null,
        overallScore: 0.5,
        automatedOverallScore: 0.5
      },
      scoreDetails: {
        finalScore: 0.5,
        automatedScore: 0.5
      }
    };
  }
};

/**
 * Research field quality dimensions for the base quality evaluation system
 */
export const getResearchFieldQualityDimensions = (predictions, groundTruth, fieldTaxonomy) => {
  return {
    relevance: {
      calculate: () => {
        if (!predictions) return 0.5;
        const predArray = Array.isArray(predictions) ? predictions : [predictions];
        
        if (!predArray.length) return 0;
        
        // Weight by position in results
        let score = 0;
        let totalWeight = 0;
        
        predArray.forEach((pred, i) => {
          const weight = 1 / (i + 1);
          const similarity = calculateHierarchicalSimilarity(
            pred.field, groundTruth, fieldTaxonomy
          );
          score += similarity * weight;
          totalWeight += weight;
        });
        
        return score / totalWeight;
      },
      weight: 0.4
    },
    specificity: {
      calculate: () => {
        if (!predictions) return 0.5;
        const predArray = Array.isArray(predictions) ? predictions : [predictions];
        
        if (!predArray.length) return 0;
        
        const optimalDepth = 3;
        let score = 0;
        
        predArray.forEach((pred, i) => {
          const path = getFieldPath(pred.field, fieldTaxonomy);
          const depth = path.length;
          const depthScore = 1 - (Math.abs(depth - optimalDepth) / Math.max(5, optimalDepth * 2));
          score += depthScore * (1 / (i + 1));
        });
        
        return score;
      },
      weight: 0.3
    },
    consistency: {
      calculate: () => {
        if (!predictions) return 1;
        const predArray = Array.isArray(predictions) ? predictions : [predictions];
        
        if (predArray.length < 2) return 1;
        
        let totalSimilarity = 0;
        let pairCount = 0;
        
        for (let i = 0; i < predArray.length - 1; i++) {
          for (let j = i + 1; j < predArray.length; j++) {
            totalSimilarity += calculateHierarchicalSimilarity(
              predArray[i].field, predArray[j].field, fieldTaxonomy
            );
            pairCount++;
          }
        }
        
        return totalSimilarity / pairCount;
      },
      weight: 0.3
    }
  };
};

/**
 * Process quality metrics for research field using base system
 */
export const processResearchFieldQuality = (
  fieldName,
  groundTruth,
  predictions,
  rating,
  expertiseMultiplier,
  fieldTaxonomy = {}
) => {
  // Safely handle predictions
  const safePredict = predictions || [];
  const topPrediction = Array.isArray(safePredict) && safePredict.length > 0 ? 
    safePredict[0].field || '' : 
    (typeof safePredict === 'object' && safePredict !== null ? safePredict.field || '' : '');
  
  // Create dimensions with calculation functions
  const dimensions = getResearchFieldQualityDimensions(safePredict, groundTruth || '', fieldTaxonomy);
  
  // Use base quality evaluation
  return processQualityEvaluation(
    fieldName,
    groundTruth || '',
    topPrediction,
    rating,
    expertiseMultiplier,
    { 
      dimensions,
      fieldType: 'field'
    },
    'researchField'
  );
};

/**
 * Complete research field assessment that handles all aspects
 * - Preserves all field ratings and comments
 * - Calculates all metrics
 * - Stores results in the storage system
 */
export const generateResearchFieldAssessment = (
  userAssessment,
  orkgData,
  evaluationData,
  expertiseMultiplier
) => {
  try {
    // Ensure all comment fields exist
    const completeAssessment = {
      primaryField: 0,
      primaryFieldComments: '',
      confidence: 0,
      confidenceComments: '',
      alternatives: 0,
      alternativesComments: '',
      relevance: 0,
      relevanceComments: '',
      comments: '',
      ...userAssessment
    };
    // Extract main values
    const groundTruth = orkgData?.field || orkgData?.research_field_name || '';
    const predictedFields = evaluationData?.researchField?.fields || 
                            evaluationData?.researchFields?.fields || [];
    
    // Get all user ratings
    const primaryFieldRating = userAssessment.primaryField || 0;
    const confidenceRating = userAssessment.confidence || 0;
    const alternativesRating = userAssessment.alternatives || 0;
    const relevanceRating = userAssessment.relevance || 0;
    
    // Get all comments
    const primaryFieldComments = userAssessment.primaryFieldComments || '';
    const confidenceComments = userAssessment.confidenceComments || '';
    const alternativesComments = userAssessment.alternativesComments || '';
    const relevanceComments = userAssessment.relevanceComments || '';
    const generalComments = userAssessment.comments || '';
    
    // Initialize assessment
    const assessment = {
      // User input data
      primaryFieldRating,
      confidenceRating,
      alternativesRating,
      relevanceRating,
      primaryFieldComments,
      confidenceComments,
      alternativesComments,
      relevanceComments,
      comments: generalComments,
      
      // Reference data
      groundTruth,
      predictedFields,
      topPrediction: predictedFields.length > 0 ? predictedFields[0] : null,
      
      // Fields for the assessment table
      fields: {}
    };
    
    // Calculate metrics for individual aspects
    
    // 1. Primary field detection (precision)
    const precisionResult = processResearchFieldAccuracy(
      'precision',
      groundTruth,
      predictedFields,
      primaryFieldRating,
      expertiseMultiplier
    );
    
    assessment.fields.precision = {
      field: 'precision',
      label: 'Exact Match Precision',
      rating: primaryFieldRating,
      comments: primaryFieldComments,
      score: precisionResult.similarityData.exactMatch,
      weightedScore: precisionResult.scoreDetails.finalScore,
      similarityData: precisionResult.similarityData,
      scoreDetails: precisionResult.scoreDetails
    };
    
    // 2. Field recall
    const recallResult = processResearchFieldAccuracy(
      'recall',
      groundTruth,
      predictedFields,
      primaryFieldRating, // Same rating as precision since they're related
      expertiseMultiplier
    );
    
    assessment.fields.recall = {
      field: 'recall',
      label: 'Field Recall',
      rating: primaryFieldRating,
      comments: primaryFieldComments,
      score: recallResult.similarityData.recall,
      weightedScore: recallResult.scoreDetails.finalScore,
      similarityData: recallResult.similarityData,
      scoreDetails: recallResult.scoreDetails
    };
    
    // 3. Top-N presence
    const topNResult = processResearchFieldAccuracy(
      'topN',
      groundTruth,
      predictedFields,
      alternativesRating, // Alternatives rating is appropriate for top-N
      expertiseMultiplier
    );
    
    assessment.fields.topN = {
      field: 'topN',
      label: 'Top-3 Presence',
      rating: alternativesRating,
      comments: alternativesComments,
      score: topNResult.similarityData.topN,
      weightedScore: topNResult.scoreDetails.finalScore,
      similarityData: topNResult.similarityData,
      scoreDetails: topNResult.scoreDetails
    };
    
    // 4. Quality metrics
    const qualityResult = processResearchFieldQuality(
      'quality',
      groundTruth,
      predictedFields,
      relevanceRating,
      expertiseMultiplier
    );
    
    assessment.fields.quality = {
      field: 'quality',
      label: 'Field Quality',
      rating: relevanceRating,
      comments: relevanceComments,
      score: qualityResult.qualityData.overallScore,
      weightedScore: qualityResult.metricDetails.finalScore,
      qualityData: qualityResult.qualityData,
      metricDetails: qualityResult.metricDetails
    };
    
    // 5. Confidence assessment
    assessment.fields.confidence = {
      field: 'confidence',
      label: 'Confidence Scores',
      rating: confidenceRating,
      comments: confidenceComments,
      score: confidenceRating / 5,
      weightedScore: (confidenceRating / 5) * expertiseMultiplier
    };
    
    // Calculate overall scores
    const overallAccuracyScore = (
      (assessment.fields.precision.weightedScore * 0.4) +
      (assessment.fields.recall.weightedScore * 0.3) +
      (assessment.fields.topN.weightedScore * 0.3)
    );
    
    const overallQualityScore = assessment.fields.quality.weightedScore;
    
    // Apply domain-specific weights from config
    const weights = RESEARCH_FIELD_CONFIG.overallWeights;
    const overallScore = (
      (overallAccuracyScore * weights.accuracy) +
      (overallQualityScore * weights.quality)
    );
    
    // Add overall scores
    assessment.overall = {
      accuracyScore: overallAccuracyScore,
      qualityScore: overallQualityScore,
      overallScore: overallScore
    };
    
    // Store in the storage system
    storeOverallEvaluation(assessment, 'researchField');
    
    return assessment;
  } catch (error) {
    console.error('Error generating research field assessment:', error);
    return {
      error: error.message,
      fields: {},
      overall: {
        accuracyScore: 0.5,
        qualityScore: 0.5,
        overallScore: 0.5
      },
      primaryFieldComments: '',
      confidenceComments: '',
      alternativesComments: '',
      relevanceComments: '',
      comments: ''
    };
  }
};