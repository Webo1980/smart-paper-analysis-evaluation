// src/components/evaluation/research-field/utils/confidenceMetricsUtils.js

/**
* Calculate confidence metrics from prediction data and ground truth
*/
export const calculateConfidenceMetrics = (params) => {
  const { predictedValues = [], groundTruth = '' } = params;
  
  // Process predictions to ensure consistent format
  const processedPredictions = predictedValues.map(pred => ({
    ...pred,
    score: Math.round((pred.score || 0) * 10)
  }));
 
  // Calculate if top prediction matches ground truth
  const topPrediction = processedPredictions[0]?.name || processedPredictions[0]?.field || '';
  const isTopMatch = topPrediction.toLowerCase() === (groundTruth || '').toLowerCase();
  
  // Find position of ground truth in predictions
  const groundTruthPosition = processedPredictions.findIndex(
    p => (p.name || p.field || '').toLowerCase() === (groundTruth || '').toLowerCase()
  );
  
  const confidenceAccuracy = isTopMatch ? 1 : 0;
  const calibrationScore = Math.abs(confidenceAccuracy - (processedPredictions[0]?.score / 100 || 0));
  const calibrationQuality = 1 - calibrationScore;
  const rankingQuality = groundTruthPosition === 0 ? 1 : 
                         groundTruthPosition >= 0 ? 1 / (groundTruthPosition + 1) : 0;
  const hierarchyMismatch = groundTruthPosition === 0 ? 0 : Math.min(groundTruthPosition, 3);
  const hierarchyQuality = 1 - Math.min(hierarchyMismatch / 3, 1);
  
  const confidenceQualityScore = (
    (calibrationQuality * 0.4) + 
    (rankingQuality * 0.4) + 
    (hierarchyQuality * 0.2)
  );
  
  return {
    metrics: {
      confidenceAccuracy,
      calibrationScore,
      calibrationQuality,
      rankingQuality,
      hierarchyMismatch,
      hierarchyQuality,
      confidenceQualityScore,
      isTopMatch,
      isInTop3: groundTruthPosition >= 0 && groundTruthPosition < 3,
      groundTruthPosition
    },
    details: {
      topPrediction,
      processedPredictions,
      groundTruth,
      weightedCalibration: calibrationQuality * 0.4,
      weightedRanking: rankingQuality * 0.4,
      weightedHierarchy: hierarchyQuality * 0.2
    }
  };
 };
 
 /**
 * Generate explanation for calibration score
 */
 export const generateCalibrationExplanation = (metrics) => {
  const { isTopMatch, calibrationQuality } = metrics;
  
  if (calibrationQuality >= 0.7) {
    return isTopMatch 
      ? "The system's high confidence correctly reflects that its top prediction is accurate."
      : "The system appropriately expressed low confidence in its incorrect top prediction.";
  } 
  
  if (calibrationQuality >= 0.4) {
    return isTopMatch
      ? "The system's moderate confidence somewhat reflects its correct prediction."
      : "The system's confidence is moderately calibrated for its incorrect prediction.";
  }
  
  return isTopMatch
    ? "The system's confidence is poorly calibrated - it made a correct prediction but with low confidence."
    : "The system's confidence is poorly calibrated - it made an incorrect prediction with high confidence.";
 };
 
 /**
 * Generate explanation for ranking score
 */
 export const generateRankingExplanation = (metrics) => {
  const { groundTruthPosition } = metrics;
  
  if (groundTruthPosition === 0) {
    return "Perfect ranking - the system correctly identified the field as its top prediction.";
  }
  
  if (groundTruthPosition > 0 && groundTruthPosition < 3) {
    return `Good ranking - the correct field appears in position ${groundTruthPosition + 1}, showing the system has identified relevant fields among its top predictions.`;
  }
  
  if (groundTruthPosition >= 3 && groundTruthPosition < 5) {
    return `Fair ranking - the correct field appears in position ${groundTruthPosition + 1}, indicating the system has some understanding of the relevant domain.`;
  }
  
  return "Poor ranking - the correct field does not appear among the top predictions, suggesting the system failed to identify the appropriate research domain.";
 };
 
 /**
 * Generate explanation for hierarchy score
 */
 export const generateHierarchyExplanation = (metrics) => {
  const { hierarchyMismatch } = metrics;
  
  const relationshipTypes = {
    0: "the predicted field is exactly the correct field",
    1: "the predicted field is closely related to the correct field, likely sharing a direct parent or child relationship",
    2: "the predicted field has some taxonomic relationship with the correct field, but they belong to different branches",
    3: "the predicted field is taxonomically distant from the correct field"
  };
 
  const relationshipDescription = relationshipTypes[hierarchyMismatch] || relationshipTypes[3];
  
  if (hierarchyMismatch === 0) {
    return "Perfect hierarchy match - " + relationshipDescription + ".";
  }
  
  if (hierarchyMismatch === 1) {
    return "Close hierarchy match - " + relationshipDescription + ".";
  }
  
  if (hierarchyMismatch === 2) {
    return "Moderate hierarchy match - " + relationshipDescription + ".";
  }
  
  return "Distant hierarchy match - " + relationshipDescription + ", suggesting a poor understanding of the research domain hierarchy.";
 };