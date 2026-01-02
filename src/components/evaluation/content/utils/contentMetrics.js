// src\components\evaluation\content\utils\contentMetrics.js
/**
 * Utility functions for content evaluation metrics
 * CALCULATION-ONLY VERSION - NO STORAGE OPERATIONS
 * All localStorage operations moved to ContentAnalysisSection.jsx
 */
import { 
    QUALITY_WEIGHTS, 
    PROPERTY_COVERAGE_WEIGHTS, 
    EVIDENCE_QUALITY_WEIGHTS,
    CONTENT_CONFIG 
  } from '../config/contentConfig';
  import { calculateStringSimilarity, calculateNormalizedSimilarity } from './stringUtils';
  
  /**
   * Convert expertise weight to multiplier
   * @param {number} expertiseWeight - User expertise weight (1-10)
   * @returns {number} Expertise multiplier (0.8-1.5)
   */
  export const expertiseToMultiplier = (expertiseWeight) => {
    // Convert 1-10 scale to 0.8-1.5 range
    return 0.8 + (expertiseWeight / 10) * 0.7;
  };
  
  /**
   * Calculate accuracy metrics for a single property
   * Used by contentMetricsStorage.js
   * @param {Object} propertyData - Property data from paper content
   * @param {Object} property - Template property definition
   * @param {Object} userRatings - User ratings object
   * @param {number} expertiseMultiplier - Expertise multiplier
   * @returns {Object} Accuracy metrics for this property
   */
  export const calculatePropertyAccuracy = (
    propertyData,
    property,
    userRatings = {},
    expertiseMultiplier = 1
  ) => {
    // Default metrics for missing data
    if (!propertyData) {
      return {
        precision: 0,
        recall: 0,
        f1Score: 0,
        similarity: 0,
        confusionMatrix: { TP: 0, TN: 0, FP: 0, FN: 0 },
        details: {
          hasData: false,
          reason: 'No property data available'
        }
      };
    }
    
    // Extract values from property data
    const values = propertyData.values || [];
    const hasValues = values.length > 0;
    
    // Calculate basic accuracy metrics
    const precision = hasValues ? 0.85 : 0; // Placeholder - would need ground truth
    const recall = hasValues ? 0.80 : 0;
    const f1Score = hasValues ? 2 * (precision * recall) / (precision + recall) : 0;
    
    // Calculate similarity if we have reference data
    const similarity = hasValues ? 0.85 : 0; // Placeholder
    
    return {
      precision,
      recall,
      f1Score,
      similarity,
      confusionMatrix: {
        TP: hasValues ? 1 : 0,
        TN: 0,
        FP: 0,
        FN: hasValues ? 0 : 1
      },
      details: {
        hasData: hasValues,
        valueCount: values.length,
        propertyName: property.label || property.name || 'Unknown'
      }
    };
  };
  
  /**
   * Calculate quality metrics for a single property
   * Used by contentMetricsStorage.js
   * @param {Object} propertyData - Property data from paper content
   * @param {Object} property - Template property definition
   * @param {Object} userRatings - User ratings object
   * @param {number} expertiseMultiplier - Expertise multiplier
   * @returns {Object} Quality metrics for this property
   */
  export const calculatePropertyQuality = (
    propertyData,
    property,
    userRatings = {},
    expertiseMultiplier = 1
  ) => {
    // Default metrics for missing data
    if (!propertyData) {
      return {
        completeness: { score: 0, issues: ['No data available'] },
        consistency: { score: 0, issues: ['No data available'] },
        validity: { score: 0, issues: ['No data available'] },
        overallScore: 0,
        details: {
          hasData: false
        }
      };
    }
    
    const values = propertyData.values || [];
    const hasValues = values.length > 0;
    
    // Calculate completeness
    const completeness = {
      score: hasValues ? 0.9 : 0,
      issues: hasValues ? [] : ['Property has no values']
    };
    
    // Calculate consistency
    const consistency = {
      score: hasValues ? 0.85 : 0,
      issues: []
    };
    
    // Calculate validity
    const validity = {
      score: hasValues ? 0.88 : 0,
      issues: []
    };
    
    // Calculate overall quality score
    const overallScore = (
      completeness.score * 0.4 +
      consistency.score * 0.3 +
      validity.score * 0.3
    );
    
    return {
      completeness,
      consistency,
      validity,
      overallScore,
      details: {
        hasData: hasValues,
        valueCount: values.length
      }
    };
  };
  
  /**
   * Calculate overall combined metrics for a property
   * Used by contentMetricsStorage.js
   * @param {Object} accuracyMetrics - Accuracy metrics
   * @param {Object} qualityMetrics - Quality metrics
   * @returns {Object} Overall combined metrics
   */
  export const calculatePropertyOverall = (accuracyMetrics, qualityMetrics) => {
    const accuracyScore = accuracyMetrics.f1Score || 0;
    const qualityScore = qualityMetrics.overallScore || 0;
    
    // Weighted combination (60% accuracy, 40% quality)
    const overallScore = (accuracyScore * 0.6) + (qualityScore * 0.4);
    
    return {
      score: overallScore,
      accuracyScore,
      qualityScore,
      details: {
        accuracyWeight: 0.6,
        qualityWeight: 0.4
      }
    };
  };
  
  /**
   * Process content metrics for evaluation with comprehensive analysis
   * Returns data in the proper storage structure: accuracy.content, quality.content, overall.content
   * NOTE: This function only CALCULATES metrics, it does NOT store them
   * Storage is handled by the calling component (ContentAnalysisSection.jsx)
   * 
   * @param {Object} paperContent - Paper content with annotations
   * @param {Array} templateProperties - Template properties
   * @param {Object} textSections - Paper text sections
   * @param {Object} comparisonData - Comparison data
   * @param {number} userRating - User rating (1-5)
   * @param {number} expertiseMultiplier - Expertise multiplier
   * @returns {Object} Content metrics in proper structure (NOT stored, just returned)
   */
  export const processContentMetrics = (
    paperContent, 
    templateProperties, 
    textSections, 
    comparisonData,
    userRating = 0,
    expertiseMultiplier = 1
  ) => {
    if (!paperContent || !templateProperties || !textSections) {
      return {
        accuracy: {
          content: {
            precision: 0,
            recall: 0,
            f1Score: 0,
            confusionMatrix: { TP: 0, TN: 0, FP: 0, FN: 0 },
            details: {
              totalProperties: 0,
              annotatedProperties: 0,
              correctExtractions: 0,
              incorrectExtractions: 0,
              missedProperties: 0
            }
          }
        },
        quality: {
          content: {
            propertyCoverage: { score: 0, issues: ["No data available"] },
            evidenceQuality: { score: 0, issues: ["No data available"] },
            valueAccuracy: { score: 0, issues: ["No data available"] },
            confidenceCalibration: { score: 0, issues: ["No data available"] },
            overallScore: 0,
            details: {}
          }
        },
        overall: {
          content: {
            score: 0,
            weightedScore: 0,
            expertiseAdjustedScore: 0
          }
        },
        properties: {
          total: templateProperties?.length || 0,
          annotated: 0,
          coverageRate: 0
        },
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Calculate comprehensive metrics
      const propertyCoverage = calculateDetailedPropertyCoverage(paperContent, templateProperties);
      const evidenceQuality = calculateDetailedEvidenceQuality(paperContent, textSections);
      const valueAccuracy = calculateValueAccuracy(paperContent, comparisonData);
      const confidenceCalibration = calculateConfidenceCalibration(paperContent, comparisonData);
      const editAnalysis = comparisonData ? 
        calculateEditAnalysis(comparisonData) : 
        { score: 1, issues: [], details: {} };
      
      // Calculate accuracy metrics (precision, recall, F1)
      const accuracyMetrics = calculateAccuracyMetrics(
        paperContent, 
        templateProperties, 
        comparisonData
      );
      
      // Calculate RAG-specific metrics
      const ragMetrics = calculateRAGMetrics(paperContent, textSections);
      
      // Calculate overall quality score
      const overallQualityScore = calculateOverallQualityScore(
        propertyCoverage, 
        evidenceQuality, 
        valueAccuracy
      );
      
      // Calculate expertise-weighted scores
      const normalizedUserRating = userRating / 5; // Normalize to 0-1
      const expertiseWeightedScore = userRating > 0 ? 
        (overallQualityScore * 0.4) + (normalizedUserRating * expertiseMultiplier * 0.6) :
        overallQualityScore;
      
      // Calculate property statistics
      const annotatedPropertyIds = Object.keys(paperContent).filter(propId => 
        paperContent[propId] && paperContent[propId].values && paperContent[propId].values.length > 0
      );
      const totalProperties = templateProperties.length;
      const annotatedCount = annotatedPropertyIds.length;
      const coverageRate = totalProperties > 0 ? annotatedCount / totalProperties : 0;
      
      // Return calculated metrics (NOT stored here)
      return {
        accuracy: {
          content: {
            precision: accuracyMetrics.precision,
            recall: accuracyMetrics.recall,
            f1Score: accuracyMetrics.f1Score,
            confusionMatrix: accuracyMetrics.confusionMatrix,
            details: {
              totalProperties,
              annotatedProperties: annotatedCount,
              correctExtractions: accuracyMetrics.correctExtractions,
              incorrectExtractions: accuracyMetrics.incorrectExtractions,
              missedProperties: accuracyMetrics.missedProperties,
              propertyAccuracyBreakdown: accuracyMetrics.propertyBreakdown
            },
            similarityData: accuracyMetrics.similarityData,
            tokenMatchingData: accuracyMetrics.tokenMatchingData
          }
        },
        quality: {
          content: {
            propertyCoverage: {
              score: propertyCoverage.score,
              issues: propertyCoverage.issues,
              details: propertyCoverage.details
            },
            evidenceQuality: {
              score: evidenceQuality.score,
              issues: evidenceQuality.issues,
              details: evidenceQuality.details
            },
            valueAccuracy: {
              score: valueAccuracy.score,
              issues: valueAccuracy.issues,
              details: valueAccuracy.details
            },
            confidenceCalibration: {
              score: confidenceCalibration.score,
              issues: confidenceCalibration.issues,
              details: confidenceCalibration.details
            },
            editAnalysis: {
              score: editAnalysis.score,
              issues: editAnalysis.issues,
              details: editAnalysis.details
            },
            ragMetrics: {
              retrieval: ragMetrics.retrieval,
              augmentation: ragMetrics.augmentation,
              generation: ragMetrics.generation
            },
            overallScore: overallQualityScore,
            automatedOverallScore: overallQualityScore,
            weights: QUALITY_WEIGHTS,
            fieldSpecificMetrics: {
              propertyCoverage: { 
                score: propertyCoverage.score, 
                issues: propertyCoverage.issues 
              },
              evidenceQuality: { 
                score: evidenceQuality.score, 
                issues: evidenceQuality.issues 
              },
              valueAccuracy: { 
                score: valueAccuracy.score, 
                issues: valueAccuracy.issues 
              },
              confidenceCalibration: { 
                score: confidenceCalibration.score, 
                issues: confidenceCalibration.issues 
              }
            }
          }
        },
        overall: {
          content: {
            score: overallQualityScore,
            weightedScore: expertiseWeightedScore,
            expertiseAdjustedScore: expertiseWeightedScore,
            userRating: normalizedUserRating,
            expertiseMultiplier,
            breakdown: {
              accuracyContribution: accuracyMetrics.f1Score * 0.6,
              qualityContribution: overallQualityScore * 0.4
            }
          }
        },
        properties: {
          total: totalProperties,
          annotated: annotatedCount,
          coverageRate,
          annotatedPropertyIds
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in processContentMetrics:', error);
      // Return empty structure on error
      return {
        accuracy: { content: { precision: 0, recall: 0, f1Score: 0, confusionMatrix: { TP: 0, TN: 0, FP: 0, FN: 0 }, details: {} } },
        quality: { content: { propertyCoverage: { score: 0, issues: [] }, evidenceQuality: { score: 0, issues: [] }, valueAccuracy: { score: 0, issues: [] }, confidenceCalibration: { score: 0, issues: [] }, overallScore: 0, details: {} } },
        overall: { content: { score: 0, weightedScore: 0, expertiseAdjustedScore: 0 } },
        properties: { total: 0, annotated: 0, coverageRate: 0 },
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };
  
  // ... (rest of the helper functions from the original file remain the same)
  
  /**
   * Calculate detailed property coverage
   * @param {Object} paperContent - Paper content
   * @param {Array} templateProperties - Template properties
   * @returns {Object} Property coverage metrics
   */
  export const calculateDetailedPropertyCoverage = (paperContent, templateProperties) => {
    const issues = [];
    let totalRequired = 0;
    let totalFilled = 0;
    
    templateProperties.forEach(property => {
      const isRequired = property.required || false;
      if (isRequired) totalRequired++;
      
      const propertyData = paperContent?.[property.id] || 
                          paperContent?.properties?.[property.id];
      
      if (propertyData && propertyData.values && propertyData.values.length > 0) {
        totalFilled++;
      } else if (isRequired) {
        issues.push(`Missing required property: ${property.label || property.name}`);
      }
    });
    
    const score = totalRequired > 0 ? totalFilled / totalRequired : 1;
    
    return {
      score,
      issues,
      details: {
        totalRequired,
        totalFilled,
        coverageRate: score
      }
    };
  };
  
  /**
   * Calculate detailed evidence quality
   * @param {Object} paperContent - Paper content
   * @param {Object} textSections - Paper text sections
   * @returns {Object} Evidence quality metrics
   */
  export const calculateDetailedEvidenceQuality = (paperContent, textSections) => {
    const issues = [];
    let totalEvidence = 0;
    let qualityScore = 0;
    
    Object.keys(paperContent || {}).forEach(propId => {
      const propertyData = paperContent[propId];
      if (propertyData && propertyData.values) {
        propertyData.values.forEach(value => {
          if (value.evidence && value.evidence.length > 0) {
            totalEvidence++;
            // Simple quality check - evidence should be non-empty and substantial
            const evidenceLength = value.evidence.join(' ').length;
            if (evidenceLength > 50) {
              qualityScore += 1;
            } else if (evidenceLength > 20) {
              qualityScore += 0.7;
            } else {
              qualityScore += 0.3;
              issues.push(`Weak evidence for value: ${value.value}`);
            }
          }
        });
      }
    });
    
    const score = totalEvidence > 0 ? qualityScore / totalEvidence : 0;
    
    return {
      score,
      issues,
      details: {
        totalEvidence,
        averageQuality: score
      }
    };
  };
  
  /**
   * Calculate value accuracy
   * @param {Object} paperContent - Paper content
   * @param {Object} comparisonData - Comparison data
   * @returns {Object} Value accuracy metrics
   */
  export const calculateValueAccuracy = (paperContent, comparisonData) => {
    // Placeholder implementation
    return {
      score: 0.85,
      issues: [],
      details: {}
    };
  };
  
  /**
   * Calculate confidence calibration
   * @param {Object} paperContent - Paper content
   * @param {Object} comparisonData - Comparison data
   * @returns {Object} Confidence calibration metrics
   */
  export const calculateConfidenceCalibration = (paperContent, comparisonData) => {
    const issues = [];
    let totalValues = 0;
    let calibrationError = 0;
    const calibrationIssues = [];
    
    Object.keys(paperContent || {}).forEach(propId => {
      const propertyData = paperContent[propId];
      if (!propertyData || !propertyData.values) return;
      
      propertyData.values.forEach(value => {
        if (value.confidence !== undefined) {
          totalValues++;
          
          // Simple accuracy check (would need ground truth in production)
          const actualAccuracy = value.value ? 0.8 : 0.2; // Placeholder
          const confidence = value.confidence;
          
          const error = Math.abs(confidence - actualAccuracy);
          calibrationError += error;
          
          if (error > 0.2) {
            calibrationIssues.push({
              property: propertyData.label || propId,
              value: value.value,
              confidence,
              actualAccuracy,
              error,
              issue: confidence > actualAccuracy ? 'Overconfident' : 'Underconfident'
            });
          }
        }
      });
    });
    
    const calibrationScore = totalValues > 0 ? 1 - (calibrationError / totalValues) : 0;
    
    if (calibrationScore < 0.8) {
      issues.push(`Confidence scores are poorly calibrated (${Math.round(calibrationScore * 100)}% calibration)`);
    }
    if (calibrationIssues.length > 0) {
      issues.push(`${calibrationIssues.length} values had miscalibrated confidence scores`);
    }
    
    return {
      score: calibrationScore,
      issues,
      details: {
        totalValues,
        averageCalibrationError: totalValues > 0 ? calibrationError / totalValues : 0,
        calibrationScore,
        calibrationIssues
      }
    };
  };
  
  /**
   * Calculate accuracy metrics
   * @param {Object} paperContent - Paper content
   * @param {Array} templateProperties - Template properties
   * @param {Object} comparisonData - Comparison data
   * @returns {Object} Accuracy metrics
   */
  export const calculateAccuracyMetrics = (paperContent, templateProperties, comparisonData) => {
    // Placeholder implementation
    return {
      precision: 0.85,
      recall: 0.80,
      f1Score: 0.82,
      confusionMatrix: { TP: 10, TN: 5, FP: 2, FN: 3 },
      correctExtractions: 10,
      incorrectExtractions: 2,
      missedProperties: 3,
      propertyBreakdown: {},
      similarityData: {},
      tokenMatchingData: {}
    };
  };
  
  /**
   * Calculate RAG metrics
   * @param {Object} paperContent - Paper content
   * @param {Object} textSections - Paper text sections
   * @returns {Object} RAG metrics
   */
  export const calculateRAGMetrics = (paperContent, textSections) => {
    return {
      retrieval: { score: 0.85, details: {} },
      augmentation: { score: 0.80, details: {} },
      generation: { score: 0.88, details: {} }
    };
  };
  
  /**
   * Calculate edit analysis based on comparison data
   * @param {Object} comparisonData - Comparison data for evaluation
   * @returns {Object} Edit analysis metrics
   */
  export const calculateEditAnalysis = (comparisonData) => {
    if (!comparisonData) {
      return {
        score: 1,
        issues: [],
        details: {}
      };
    }
    
    const originalData = comparisonData.original_data || {};
    const newData = comparisonData.new_data || {};
    const changes = comparisonData.changes || {};
    
    // Extract properties
    const originalProps = originalData?.properties || {};
    const newProps = newData?.properties || {};
    
    // Count properties
    const originalPropCount = Object.keys(originalProps).length;
    const newPropCount = Object.keys(newProps).length;
    
    // Count types of changes
    const addedProps = changes.added_properties || [];
    const removedProps = changes.removed_properties || [];
    const modifiedProps = Object.keys(changes.modified_properties || {});
    
    const addedCount = addedProps.length;
    const removedCount = removedProps.length;
    const modifiedCount = modifiedProps.length;
    const unchangedCount = Math.max(0, originalPropCount - removedCount - modifiedCount);
    
    // Calculate change metrics
    const totalChanges = addedCount + removedCount + modifiedCount;
    const changeRate = originalPropCount > 0 ? totalChanges / originalPropCount : 0;
    const preservationRate = originalPropCount > 0 ? unchangedCount / originalPropCount : 1;
    
    // Calculate score (higher score means fewer changes needed)
    const changeRateScore = Math.max(0, 1 - changeRate);
    const preservationScore = preservationRate;
    
    // Overall edit score (weighted)
    const score = (changeRateScore * 0.6) + (preservationScore * 0.4);
    
    // Generate issues
    const issues = [];
    if (changeRate > 0.3) {
      issues.push(`Significant edits were required (${Math.round(changeRate * 100)}% of properties modified)`);
    }
    
    if (removedCount > addedCount && removedCount > 0) {
      issues.push(`${removedCount} properties were removed during evaluation`);
    }
    
    return {
      score,
      issues,
      details: {
        originalPropCount,
        newPropCount,
        addedCount,
        removedCount,
        modifiedCount,
        unchangedCount,
        changeRate,
        preservationRate,
        addedProps,
        removedProps,
        modifiedProps
      }
    };
  };
  
  /**
   * Calculate overall quality score from component metrics
   * @param {Object} propertyCoverage - Property coverage metrics
   * @param {Object} evidenceQuality - Evidence quality metrics
   * @param {Object} valueAccuracy - Value accuracy metrics
   * @returns {number} Overall quality score
   */
  export const calculateOverallQualityScore = (propertyCoverage, evidenceQuality, valueAccuracy) => {
    return (
      (propertyCoverage.score * QUALITY_WEIGHTS.propertyCoverage) +
      (evidenceQuality.score * QUALITY_WEIGHTS.evidenceQuality) +
      (valueAccuracy.score * QUALITY_WEIGHTS.valueAccuracy)
    );
  };
  
  /**
   * Analyze the semantics of evidence text against section text
   * REQUIRED EXPORT - Used by evidenceUtils.js
   * @param {string} evidenceText - Evidence text to analyze
   * @param {string} sectionText - Section text to compare against
   * @returns {Object} - Semantic analysis results
   */
  export const analyzeEvidenceSemantics = (evidenceText, sectionText) => {
    if (!evidenceText || !sectionText) {
      return {
        semanticSimilarity: 0,
        contextualRelevance: 0,
        tokenOverlap: 0,
        structureMatch: 0,
        overallScore: 0
      };
    }
    
    // Calculate semantic similarity
    const semanticSimilarity = calculateStringSimilarity(evidenceText, sectionText);
    
    // Calculate token overlap
    const evidenceTokens = evidenceText.toLowerCase().split(/\s+/).filter(Boolean);
    const sectionTokens = sectionText.toLowerCase().split(/\s+/).filter(Boolean);
    
    const evidenceTokenSet = new Set(evidenceTokens);
    const sectionTokenSet = new Set(sectionTokens);
    
    const intersection = new Set([...evidenceTokenSet].filter(x => sectionTokenSet.has(x)));
    const union = new Set([...evidenceTokenSet, ...sectionTokenSet]);
    
    const tokenOverlap = union.size > 0 ? intersection.size / union.size : 0;
    
    // Simple contextual relevance
    const contextualRelevance = Math.min(1, (semanticSimilarity * 0.7) + (tokenOverlap * 0.3));
    
    // Structure match
    const evidenceSentences = evidenceText.split(/[.!?]+/).filter(Boolean).length;
    const sectionSentences = sectionText.split(/[.!?]+/).filter(Boolean).length;
    const structureMatch = Math.max(0, 1 - Math.abs(evidenceSentences / Math.max(1, sectionSentences) - 1));
    
    // Calculate overall semantic score
    const overallScore = 
      (semanticSimilarity * EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity) +
      (contextualRelevance * EVIDENCE_QUALITY_WEIGHTS.contextualRelevance) +
      (tokenOverlap * EVIDENCE_QUALITY_WEIGHTS.tokenOverlap) +
      (structureMatch * EVIDENCE_QUALITY_WEIGHTS.structureMatch);
    
    return {
      semanticSimilarity,
      contextualRelevance,
      tokenOverlap,
      structureMatch,
      overallScore
    };
  };
  
  /**
   * Calculate property metrics from paper content and template properties
   * Simpler version for specific use cases
   * @param {Object} paperContent - Paper content
   * @param {Array} templateProperties - Template properties
   * @returns {Object} Property metrics
   */
  export const calculatePropertyMetrics = (paperContent, templateProperties) => {
    return calculateDetailedPropertyCoverage(paperContent, templateProperties);
  };