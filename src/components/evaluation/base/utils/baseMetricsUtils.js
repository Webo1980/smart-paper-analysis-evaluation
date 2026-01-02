// src\components\evaluation\base\utils\baseMetricsUtils.js
import { WEIGHTING_CONFIG } from '../config/evaluationConfig';

/**
 * Format a number as a percentage
 */
export const formatPercentage = (value, decimalPlaces = 1) => {
  if (value === undefined || value === null) return '0%';
  const percentage = Math.max(0, Math.min(1, value)) * 100;
  return `${percentage.toFixed(decimalPlaces)}%`;
};

/**
 * Calculate confidence based on a U-shaped curve
 * Highest confidence at 50%, lowest at 0% and 100%
 */
export const calculateUShapedConfidence = (score) => {
  const normalizedScore = Math.max(0, Math.min(1, score));
  const distanceFromMiddle = Math.abs(normalizedScore - 0.5);
  return 1 - Math.pow(distanceFromMiddle * 2, 2);
};

/**
 * Ensure consistent metric values by normalizing to fixed precision
 */
export const ensureSameMetricValue = (metricObject) => {
  if (metricObject && typeof metricObject === 'object') {
    // Process all numeric properties to fixed precision
    Object.keys(metricObject).forEach(key => {
      if (typeof metricObject[key] === 'number') {
        // Round to 5 decimal places for internal calculations
        metricObject[key] = Math.round(metricObject[key] * 100000) / 100000;
      }
    });
    
    // Ensure finalScore is always set if missing but we have combinedScore and agreementBonus
    if (metricObject.finalScore === undefined && 
        metricObject.combinedScore !== undefined && 
        metricObject.agreementBonus !== undefined) {
      metricObject.finalScore = metricObject.combinedScore * (1 + metricObject.agreementBonus);
      metricObject.finalScore = Math.round(metricObject.finalScore * 100000) / 100000;
    }
  }
  return metricObject;
};

/**
 * Convert expertise weight to multiplier
 */
export const expertiseToMultiplier = (expertiseWeight, userInfoObj = null) => {
  if (userInfoObj && typeof userInfoObj === 'object' && 'expertiseMultiplier' in userInfoObj) {
    return userInfoObj.expertiseMultiplier;
  }
  
  if (!expertiseWeight) return 1.0;
  
  return 0.8 + (expertiseWeight - 1) * 0.2;
};

/**
 * Calculate agreement and bonus with detailed breakdown
 */
export const agreementCalculation = (automatedScore, userRating) => {
  const safeAutomatedScore = automatedScore !== undefined && automatedScore !== null ? automatedScore : 0;
  const safeUserRating = userRating !== undefined && userRating !== null ? userRating : 0;
  
  const difference = Math.abs(safeAutomatedScore - safeUserRating);
  const agreement = 1 - difference;
  const agreementBonus = agreement * WEIGHTING_CONFIG.AGREEMENT_BONUS_FACTOR;
  
  return {
    difference,
    agreement,
    agreementBonus,
    formula: `(1 - |Automated Score - User Rating|) × ${WEIGHTING_CONFIG.AGREEMENT_BONUS_FACTOR}`,
    calculation: `1 - |${safeAutomatedScore.toFixed(2)} - ${safeUserRating.toFixed(2)}| = ${agreement.toFixed(2)}`,
    bonusCalculation: `${agreement.toFixed(2)} × ${WEIGHTING_CONFIG.AGREEMENT_BONUS_FACTOR} = ${agreementBonus.toFixed(2)}`
  };
};

/**
 * Calculate weights and agreement based on expert rating and automated score
 */
export const calculateWeightsAndAgreement = (automatedScore, userRating, expertiseMultiplier) => {
  const safeAutomatedScore = automatedScore !== undefined && automatedScore !== null ? automatedScore : 0;
  const safeUserRating = userRating !== undefined && userRating !== null ? userRating : 0;
  const safeExpertiseMultiplier = expertiseMultiplier !== undefined && expertiseMultiplier !== null ? expertiseMultiplier : 1.0;
  
  const normalizedRating = safeUserRating / 5;
  const automaticConfidence = calculateUShapedConfidence(safeAutomatedScore);
  const agreement = 1 - Math.abs(safeAutomatedScore - normalizedRating);
  
  const rawAutomaticWeight = Math.max(WEIGHTING_CONFIG.MIN_AUTOMATED_WEIGHT, 
                                    WEIGHTING_CONFIG.AUTOMATED_WEIGHT_BASE * automaticConfidence);
  const rawUserWeight = WEIGHTING_CONFIG.USER_WEIGHT_BASE * safeExpertiseMultiplier;
  
  const totalWeight = rawAutomaticWeight + rawUserWeight;
  const automaticWeight = rawAutomaticWeight / totalWeight;
  const userWeight = rawUserWeight / totalWeight;
  
  const combinedScore = (automaticWeight * safeAutomatedScore) + (userWeight * normalizedRating);
  const agreementBonus = agreement * WEIGHTING_CONFIG.AGREEMENT_BONUS_FACTOR;
  let finalScore = combinedScore * (1 + agreementBonus);
  const isCapped = finalScore > 1;
  finalScore = Math.max(0, Math.min(1, finalScore));
  
  return ensureSameMetricValue({
    normalizedRating,
    automaticConfidence,
    automaticWeight,
    userWeight,
    agreement,
    agreementBonus,
    combinedScore,
    finalScore,
    rawAutomaticWeight,
    rawUserWeight,
    isCapped
  });
};

/**
 * Calculate balanced overall score from multiple components
 */
export const calculateBalancedOverallScore = (
  componentScores,
  componentWeights,
  userRating,
  expertiseMultiplier,
  agreementBonusFactor = WEIGHTING_CONFIG.AGREEMENT_BONUS_FACTOR,
  importanceFactor = 1.0
) => {
  let weightedAutomatedScore = 0;
  let totalComponentWeight = 0;
  
  Object.keys(componentWeights).forEach(component => {
    if (componentWeights[component] && componentScores[component]) {
      const score = componentScores[component].score || 0;
      const weight = componentWeights[component];
      
      weightedAutomatedScore += score * weight;
      totalComponentWeight += weight;
    }
  });
  
  const automatedScore = totalComponentWeight > 0 ? 
    weightedAutomatedScore / totalComponentWeight : 0;
  
  const weightCalculation = calculateWeightsAndAgreement(automatedScore, userRating, expertiseMultiplier);
  
  const finalScore = Math.max(0, Math.min(1, weightCalculation.finalScore * importanceFactor));
  
  return ensureSameMetricValue({
    automatedScore,
    normalizedRating: weightCalculation.normalizedRating,
    automaticWeight: weightCalculation.automaticWeight,
    userWeight: weightCalculation.userWeight,
    automaticConfidence: weightCalculation.automaticConfidence,
    agreement: weightCalculation.agreement,
    agreementBonus: weightCalculation.agreementBonus,
    importanceFactor,
    finalScore,
    weightedAutomatedScore,
    combinedScore: weightCalculation.combinedScore,
    rawCalculation: weightCalculation
  });
};

/**
 * Calculate quality metrics with dynamic components
 */
export const calculateQualityMetrics = (fieldMetrics, weights, rating, expertiseMultiplier) => {
  // Calculate automated overall score dynamically based on provided dimensions
  let automatedOverallScore = 0;
  let totalWeight = 0;
  
  // Process each dimension from the weights object
  Object.keys(weights).forEach(dimension => {
    if (fieldMetrics[dimension] && typeof fieldMetrics[dimension].score === 'number') {
      automatedOverallScore += fieldMetrics[dimension].score * weights[dimension];
      totalWeight += weights[dimension];
    }
  });
  
  // Normalize if needed
  if (totalWeight > 0 && totalWeight !== 1) {
    automatedOverallScore = automatedOverallScore / totalWeight;
  }
  
  const weightCalculation = calculateWeightsAndAgreement(
    automatedOverallScore,
    rating,
    expertiseMultiplier
  );
  
  return ensureSameMetricValue({
    automatedOverallScore,
    ...weightCalculation
  });
};

/**
 * Calculate F1 score from precision and recall
 */
export const calculateF1Score = (precision, recall) => {
  if (precision + recall <= 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
};

/**
 * Get automated score from various data structures consistently
 * Supports fully dynamic metric names and types
 */
export const getAutomatedScore = (metricName, metrics, analysisData, metricType, config = {}) => {
  try {
    // First check if we have a direct score in analysis data
    if (analysisData && typeof analysisData[metricName] === 'number') {
      return analysisData[metricName];
    }
    
    // Special handling for composite metrics
    if (metricType === 'accuracy' && metricName === 'f1Score' && analysisData) {
      // Direct f1Score
      if (analysisData.f1Score !== undefined) {
        return analysisData.f1Score;
      }
      
      // Try to calculate f1Score from precision and recall
      const precision = getAutomatedScore('precision', metrics, analysisData, metricType, config);
      const recall = getAutomatedScore('recall', metrics, analysisData, metricType, config);
      
      if (precision !== undefined && recall !== undefined) {
        return calculateF1Score(precision, recall);
      }
    }
    
    // If this is an "overall" type metric, try to calculate from components
    if (metricName === 'overallQuality' && analysisData?.fieldSpecificMetrics) {
      const fieldMetrics = analysisData.fieldSpecificMetrics;
      const weights = analysisData.weights || config.weights || {};
      
      let weightedSum = 0;
      let totalWeight = 0;
      
      // Use dynamic dimensions from weights
      Object.keys(weights).forEach(dimension => {
        if (fieldMetrics[dimension] && typeof fieldMetrics[dimension].score === 'number') {
          weightedSum += fieldMetrics[dimension].score * weights[dimension];
          totalWeight += weights[dimension];
        }
      });
      
      if (totalWeight > 0) {
        return weightedSum / totalWeight;
      }
    }
    
    // Check for metrics in tokenMatching structure (for accuracy metrics)
    if (metricType === 'accuracy' && analysisData?.tokenMatching) {
      if (metricName === 'precision' && 
          analysisData.tokenMatching.extractedTokens && 
          analysisData.tokenMatching.tokenMatchCount) {
        const extractedCount = analysisData.tokenMatching.extractedTokens.length || 1;
        const tokenMatchCount = analysisData.tokenMatching.tokenMatchCount;
        return tokenMatchCount / extractedCount;
      }
      
      if (metricName === 'recall' && 
          analysisData.tokenMatching.originalTokens && 
          analysisData.tokenMatching.tokenMatchCount) {
        const originalCount = analysisData.tokenMatching.originalTokens.length || 1;
        const tokenMatchCount = analysisData.tokenMatching.tokenMatchCount;
        return tokenMatchCount / originalCount;
      }
    }
    
    // Check for field-specific metrics
    if (analysisData?.fieldSpecificMetrics?.[metricName]?.score !== undefined) {
      return analysisData.fieldSpecificMetrics[metricName].score;
    }
    
    // Check for automatedOverallScore
    if ((metricName === 'overallQuality' || metricName === 'f1Score') && 
        analysisData?.automatedOverallScore !== undefined) {
      return analysisData.automatedOverallScore;
    }
    
    // Try from metrics object
    if (metrics?.[metricName]?.automatedValue !== undefined) {
      return metrics[metricName].automatedValue;
    }
    
    // Last resort - use default from config
    if (config.defaultValues && config.defaultValues[metricName] !== undefined) {
      return config.defaultValues[metricName];
    }
  } catch (error) {
    console.error(`Error getting automated score for ${metricName}:`, error);
  }
  
  // Nothing found or error occurred
  return 0;
};