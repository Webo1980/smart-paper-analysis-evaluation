// src/components/evaluation/base/utils/evaluationUtils.js
import { 
  calculateWeightsAndAgreement,
  calculateBalancedOverallScore,
  calculateQualityMetrics,
  expertiseToMultiplier
} from './baseMetricsUtils';

import {
  generateTextSimilarityData,
  generateGenericQualityData
} from './contentAnalysisUtils';

import {
  storeFieldMetrics,
  getFieldMetrics,
  storeOverallEvaluation
} from './storageUtils';

import { WEIGHTING_CONFIG } from '../config/evaluationConfig';

/**
 * Process field evaluation for accuracy metrics
 * Now completely domain-agnostic and configurable
 */
export const processAccuracyEvaluation = (
  fieldName,
  referenceValue,
  extractedValue,
  rating,
  expertiseMultiplier,
  domainPrefix = '',
  fieldType = '',
  domainConfig = {}
) => {
  try {
    // Use domain-specific weight config or default
    const weights = domainConfig.accuracyWeights || WEIGHTING_CONFIG.DEFAULT_ACCURACY_WEIGHTS;
    
    // Generate similarity data with field type for proper handling
    const similarityData = generateTextSimilarityData(
      referenceValue, 
      extractedValue, 
      fieldType,
      weights
    );
    
    if (!similarityData) {
      // Return fallback data structure based on domain config
      return createFallbackAccuracyData(rating, domainConfig.fallbackConfig);
    }
    
    // Calculate accuracy scores using centralized calculations
    const scoreDetails = calculateBalancedOverallScore(
      similarityData, 
      weights,
      rating,
      expertiseMultiplier
    );
    
    // Update similarity data with calculated scores for consistency
    similarityData.overallScore = scoreDetails.finalScore;
    similarityData.automatedOverallScore = scoreDetails.automatedScore;
    
    // Store data in the structured store
    storeFieldMetrics(
      fieldName, 
      'accuracy', 
      {
        similarityData,
        rating,
        expertiseMultiplier,
        scoreDetails
      }, 
      domainPrefix
    );
    
    return {
      similarityData,
      scoreDetails
    };
  } catch (error) {
    console.error(`Error processing accuracy evaluation for ${fieldName}:`, error);
    return createFallbackAccuracyData(rating, domainConfig.fallbackConfig);
  }
};

/**
 * Create fallback accuracy data when analysis fails
 * Configurable through domainConfig
 */
function createFallbackAccuracyData(rating, fallbackConfig = {}) {
  // Default scores for fallback
  const defaultScore = fallbackConfig?.defaultScore || 0.5;
  
  // Use provided fallback structure or create default
  return {
    similarityData: {
      levenshtein: { 
        score: fallbackConfig?.levenshtein?.score || defaultScore, 
        distance: 0, 
        maxLength: 1, 
        weightedScore: (fallbackConfig?.levenshtein?.score || defaultScore) * 0.5 
      },
      tokenMatching: { 
        originalTokens: [], 
        extractedTokens: [], 
        tokenMatchCount: 0, 
        score: fallbackConfig?.tokenMatching?.score || defaultScore, 
        weightedScore: (fallbackConfig?.tokenMatching?.score || defaultScore) * 0.3 
      },
      specialChar: { 
        originalSpecial: [], 
        extractedSpecial: [], 
        specialMatchCount: 0, 
        score: fallbackConfig?.specialChar?.score || defaultScore, 
        weightedScore: (fallbackConfig?.specialChar?.score || defaultScore) * 0.2 
      },
      overallScore: defaultScore,
      precisionScore: fallbackConfig?.precisionScore || defaultScore,
      recallScore: fallbackConfig?.recallScore || defaultScore,
      f1Score: fallbackConfig?.f1Score || defaultScore,
      automatedOverallScore: defaultScore
    },
    scoreDetails: {
      automatedScore: defaultScore,
      finalScore: defaultScore * (rating / 5),
      agreement: fallbackConfig?.agreement || 0.5
    }
  };
}

/**
 * Process field evaluation for quality metrics
 * Now completely domain-agnostic and configurable
 */
export const processQualityEvaluation = (
  fieldName,
  referenceValue,
  extractedValue,
  rating,
  expertiseMultiplier,
  domainConfig = {},
  domainPrefix = ''
) => {
  try {
    // Generate quality data with domain-specific dimensions
    const qualityData = generateGenericQualityData(
      referenceValue, 
      extractedValue, 
      {
        fieldType: domainConfig.fieldType || '',
        dimensions: domainConfig.dimensions || {}
      }
    );
    
    if (!qualityData) {
      // Return fallback data
      return createFallbackQualityData(rating, domainConfig.fallbackConfig);
    }
    
    // Calculate quality metrics using centralized calculation
    const metricDetails = calculateQualityMetrics(
      qualityData.fieldSpecificMetrics,
      qualityData.weights,
      rating,
      expertiseMultiplier
    );
    
    // Update quality data with calculated scores for consistency
    qualityData.overallScore = metricDetails.finalScore;
    qualityData.automatedOverallScore = metricDetails.automatedOverallScore;
    
    // Store data in structured store
    storeFieldMetrics(
      fieldName, 
      'quality', 
      {
        qualityData,
        rating,
        expertiseMultiplier,
        metricDetails
      }, 
      domainPrefix
    );
    
    return {
      qualityData,
      metricDetails
    };
  } catch (error) {
    console.error(`Error processing quality evaluation for ${fieldName}:`, error);
    return createFallbackQualityData(rating, domainConfig.fallbackConfig);
  }
};

/**
 * Create fallback quality data when analysis fails
 * Configurable through domainConfig
 */
function createFallbackQualityData(rating, fallbackConfig = {}) {
  // Default score for fallback
  const defaultScore = fallbackConfig?.defaultScore || 0.5;
  
  // Get dimensions from fallback config or use defaults
  const dimensions = fallbackConfig?.dimensions || ['completeness', 'consistency', 'validity'];
  const dimensionWeights = fallbackConfig?.dimensionWeights || {};
  
  // Build metrics structure dynamically based on dimensions
  const fieldSpecificMetrics = {};
  const weights = {};
  const explanation = {};
  
  dimensions.forEach(dim => {
    fieldSpecificMetrics[dim] = { 
      score: fallbackConfig?.[dim]?.score || defaultScore, 
      issues: [] 
    };
    weights[dim] = dimensionWeights[dim] || (1 / dimensions.length);
    explanation[dim] = fallbackConfig?.[dim]?.explanation || 'No data available';
  });
  
  return {
    qualityData: {
      fieldSpecificMetrics,
      weights,
      overallScore: defaultScore,
      automatedOverallScore: defaultScore,
      explanation
    },
    metricDetails: {
      automatedOverallScore: defaultScore,
      finalScore: defaultScore * (rating / 5),
      agreement: fallbackConfig?.agreement || 0.5
    }
  };
}

/**
 * Calculate overall field score from accuracy and quality scores
 * Configurable with domain-specific weights
 */
export const calculateOverallFieldScore = (
  accuracyScore,
  qualityScore,
  domainConfig = {}
) => {
  // Get field importance from config or default to 1.0
  const fieldImportance = domainConfig.fieldImportance || 1.0;
  
  // Get domain-specific weights or use defaults
  const weights = domainConfig.overallWeights || WEIGHTING_CONFIG.DEFAULT_OVERALL_WEIGHTS;
  
  // Calculate weighted average
  const overallScore = (
    (accuracyScore * weights.accuracy) + 
    (qualityScore * weights.quality)
  ) * fieldImportance;
  
  // Ensure score is between 0 and 1
  return Math.min(Math.max(overallScore, 0), 1);
};

/**
 * Process complete field evaluation (both accuracy and quality)
 * Fully configurable with domain-specific configurations
 */
export const processFieldEvaluation = (
  field,
  referenceValue,
  extractedValue,
  rating,
  expertiseMultiplier,
  fieldId,
  domainConfig = {},
  domainPrefix = ''
) => {
  try {
    // Determine field type from domain config or use fieldId
    const fieldType = domainConfig.getFieldType ? 
                     domainConfig.getFieldType(fieldId) : 
                     fieldId;
    
    // Process accuracy with domain-specific config
    const accuracyResults = processAccuracyEvaluation(
      field,
      referenceValue,
      extractedValue,
      rating,
      expertiseMultiplier,
      domainPrefix,
      fieldType,
      domainConfig
    );
    
    // Process quality with domain-specific config
    const qualityResults = processQualityEvaluation(
      field,
      referenceValue,
      extractedValue,
      rating,
      expertiseMultiplier,
      {
        fieldType,
        ...domainConfig
      },
      domainPrefix
    );
    
    // Extract scores
    const accuracyScore = accuracyResults?.scoreDetails?.finalScore || 0;
    const qualityScore = qualityResults?.metricDetails?.finalScore || 0;
    
    // Calculate overall field score with domain-specific config
    const overallScore = calculateOverallFieldScore(
      accuracyScore,
      qualityScore,
      domainConfig
    );
    
    // Return combined results
    return {
      field,
      accuracyResults,
      qualityResults,
      fieldType,
      overallScore,
      accuracyScore,
      qualityScore
    };
  } catch (error) {
    console.error(`Error in field evaluation for ${field}:`, error);
    
    // Return fallback data with domain-specific default
    return {
      field,
      fieldType: fieldId,
      overallScore: domainConfig.defaultScore || 0.5,
      accuracyScore: domainConfig.defaultAccuracyScore || 0.5,
      qualityScore: domainConfig.defaultQualityScore || 0.5,
      error: error.message
    };
  }
};

/**
 * Generate final assessment for any domain
 * Uses domain-specific configurations and processing
 * @param {Object} userAssessment - User's assessment data
 * @param {Object} referenceData - Reference data (e.g. ORKG data)
 * @param {Object} extractedData - Extracted data (e.g. evaluation data)
 * @param {Object} config - Domain configuration
 * @param {number} expertiseMultiplier - Expertise weight multiplier
 * @param {string} domainPrefix - Domain identifier for storage
 * @param {Object} fieldDefinitions - Field definitions for the domain
 * @returns {Object} Comprehensive assessment with scores
 */
export const generateFinalAssessment = (
  userAssessment,
  referenceData,
  extractedData,
  config,
  expertiseMultiplier,
  domainPrefix,
  fieldDefinitions = []
) => {
  try {
    // Initialize assessment object
    const assessment = {};
    
    // Convert field definitions to array if needed
    const fields = Array.isArray(fieldDefinitions) ? 
      fieldDefinitions : 
      Object.keys(userAssessment).filter(key => key !== 'overall' && key !== 'comments');
    
    // Process each field
    fields.forEach(field => {
      // Get field ID and name
      const fieldId = typeof field === 'object' ? field.id : field;
      const fieldName = typeof field === 'object' ? field.label : fieldId;
      
      // Get user rating for this field
      const rating = 
        userAssessment[fieldId]?.rating || 
        userAssessment[fieldId] || 
        userAssessment.rating || 
        0;
      
      // Get comments for this field
      const comments = 
        userAssessment[`${fieldId}Comments`] || // Look for field-specific comments
        userAssessment[fieldId]?.comments || 
        userAssessment.comments || 
        '';
      
      // Get reference and extracted values
      const referenceValue = getFieldValue(referenceData, fieldId, config);
      const extractedValue = getFieldValue(extractedData, fieldId, config);
      
      // For domain-specific fields that need special processing
      if (config.specialFields && config.specialFields[fieldId]) {
        // Use specialized processing for this field
        const specialHandler = config.specialFields[fieldId];
        const specialResult = specialHandler(
          fieldId,
          referenceData,
          extractedData,
          rating,
          expertiseMultiplier
        );
        
        assessment[fieldId] = {
          ...specialResult,
          field: fieldId,
          rating,
          comments
        };
      } else {
        // Use standard field evaluation
        const fieldEvaluation = processFieldEvaluation(
          fieldName,
          referenceValue,
          extractedValue,
          rating,
          expertiseMultiplier,
          fieldId,
          config,
          domainPrefix
        );
        
        // Store results
        assessment[fieldId] = {
          field: fieldId,
          rating,
          comments,
          referenceValue,
          extractedValue,
          accuracyScore: fieldEvaluation?.accuracyScore || 0,
          qualityScore: fieldEvaluation?.qualityScore || 0,
          overallScore: fieldEvaluation?.overallScore || 0,
          accuracyResults: fieldEvaluation?.accuracyResults,
          qualityResults: fieldEvaluation?.qualityResults
        };
      }
    });
    
    // Add overall assessment
    const overallScores = calculateOverallScores(assessment, config);
    assessment.overall = overallScores;
    
    // Store overall evaluation
    storeOverallEvaluation(assessment, domainPrefix);
    
    // Add original data references
    assessment.referenceData = referenceData;
    // assessment.extractedData = extractedData;
    assessment.expertiseMultiplier = expertiseMultiplier;
    
    return assessment;
  } catch (error) {
    console.error('Error generating final assessment:', error);
    // Return minimal assessment with error
    return {
      error: error.message,
      overall: {
        accuracyScore: 0.5,
        qualityScore: 0.5,
        overallScore: 0.5
      }
    };
  }
};

/**
 * Helper to get field value from data object
 * Handles different data structures and mapping
 */
function getFieldValue(data, fieldId, config) {
  if (!data) return null;
  
  // Use field mapping if available
  if (config.fieldMappings && config.fieldMappings[fieldId]) {
    const mapping = config.fieldMappings[fieldId];
    
    // If mapping specifies a key, use it
    if (mapping.key) {
      return data[mapping.key];
    }
    
    // If mapping specifies a path, follow it
    if (mapping.path) {
      return getValueByPath(data, mapping.path);
    }
    
    // If mapping is a string, use it as key
    if (typeof mapping === 'string') {
      return data[mapping];
    }
  }
  
  // Try direct field access
  if (data[fieldId] !== undefined) {
    return data[fieldId];
  }
  
  // For research field, handle special case
  if (fieldId === 'researchField' && data.field !== undefined) {
    return data.field;
  }
  
  // For nested metadata structures
  if (data.metadata && data.metadata[fieldId] !== undefined) {
    return data.metadata[fieldId];
  }
  
  return null;
}

/**
 * Helper to get value by path from an object
 * Handles dot notation paths (e.g. "metadata.title")
 */
function getValueByPath(obj, path) {
  if (!obj || !path) return null;
  
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === null || value === undefined) {
      return null;
    }
    value = value[part];
  }
  
  return value;
}

/**
 * Calculate overall scores from individual field scores
 */
function calculateOverallScores(assessment, config) {
  let totalAccuracy = 0;
  let totalQuality = 0;
  let totalFields = 0;
  
  // Sum up scores for all fields except 'overall'
  Object.keys(assessment).forEach(field => {
    if (field !== 'overall') {
      const fieldData = assessment[field];
      
      if (fieldData) {
        totalAccuracy += fieldData.accuracyScore || 0;
        totalQuality += fieldData.qualityScore || 0;
        totalFields++;
      }
    }
  });
  
  // Calculate averages
  const avgAccuracy = totalFields > 0 ? totalAccuracy / totalFields : 0;
  const avgQuality = totalFields > 0 ? totalQuality / totalFields : 0;
  
  // Apply domain-specific weights
  const weights = config.overallWeights || WEIGHTING_CONFIG.DEFAULT_OVERALL_WEIGHTS;
  const overallScore = (avgAccuracy * weights.accuracy) + (avgQuality * weights.quality);
  
  return {
    accuracyScore: avgAccuracy,
    qualityScore: avgQuality,
    overallScore,
    fields: totalFields
  };
}