// src/components/evaluation/research-field/utils/commonMetricsUtils.js

/**
 * Normalize predictions from different formats into standard format
 * @param {Array|Object} predictedValues - Array of predictions or object with fields
 * @returns {Array} - Normalized predictions
 */
export const normalizePredictions = (predictedValues) => {
  if (Array.isArray(predictedValues)) {
    return predictedValues.map(p => ({
      field: p.name || p.field || '',
      name: p.name || p.field || '',
      score: p.score || 0
    }));
  } 
  else if (predictedValues && predictedValues.fields && Array.isArray(predictedValues.fields)) {
    return predictedValues.fields.map(p => ({
      field: p.name || p.field || '',
      name: p.name || p.field || '',
      score: p.score || 0
    }));
  }
  return [];
};

/**
 * Find position of ground truth in predictions
 * @param {string} groundTruth - Ground truth field name
 * @param {Array} predictions - Array of prediction objects
 * @returns {number} - Position (0-based) or -1 if not found
 */
export const findGroundTruthPosition = (groundTruth, predictions) => {
  if (!groundTruth || !Array.isArray(predictions)) return -1;
  
  const safeGroundTruth = String(groundTruth).toLowerCase().trim();
  
  return predictions.findIndex(p => {
    const fieldName = String(p.field || p.name || '').toLowerCase().trim();
    return fieldName === safeGroundTruth;
  });
};

/**
 * Calculate confidence drop rate between predictions
 * @param {Array} predictions - Array of prediction objects
 * @returns {number} - Drop rate (0-1)
 */
export const calculateConfidenceDropRate = (predictions) => {
  if (!Array.isArray(predictions) || predictions.length < 2) return 0.5;
  
  const topN = Math.min(predictions.length, 3);
  const confidences = predictions
    .slice(0, topN)
    .map(field => field.score / 100);
  
  let totalDrop = 0;
  for (let i = 1; i < confidences.length; i++) {
    totalDrop += Math.max(0, confidences[i-1] - confidences[i]);
  }
  
  const avgDrop = totalDrop / (confidences.length - 1);
  return Math.min(avgDrop * 2, 1.0);
};

// Re-export formatPercent from base utilities for backward compatibility
export { formatPercentage as formatPercent } from '../../base/utils/baseMetricsUtils';