// src\components\evaluation\content\utils\contentEvaluationUtils.js
/**
 * Utility functions for content evaluation metrics
 */
import { 
    QUALITY_WEIGHTS, 
    PROPERTY_COVERAGE_WEIGHTS, 
    EVIDENCE_QUALITY_WEIGHTS,
    CONTENT_CONFIG 
  } from '../config/contentConfig';
  import { calculateStringSimilarity, calculateNormalizedSimilarity } from './stringUtils';
  
  /**
   * Generate content metrics from paper content and template properties
   * @param {Object} paperContent - Paper content with annotations
   * @param {Array} templateProperties - Template properties
   * @param {Object} textSections - Paper text sections
   * @param {Object} evaluationComparison - Comparison data for edit analysis
   * @returns {Object} Content metrics
   */
  export const generateContentMetrics = (paperContent, templateProperties, textSections, evaluationComparison = null) => {
    if (!paperContent || !templateProperties || !textSections) {
      return {
        propertyCoverage: { score: 0, issues: ['No content data available'] },
        evidenceQuality: { score: 0, issues: ['No content data available'] },
        valueAccuracy: { score: 0, issues: ['No content data available'] }
      };
    }
  
    try {
      // Calculate property coverage
      const propertyCoverage = calculateDetailedPropertyCoverage(paperContent, templateProperties);
      
      // Calculate evidence quality
      const evidenceQuality = calculateDetailedEvidenceQuality(paperContent, textSections);
      
      // Calculate value accuracy
      const valueAccuracy = calculateValueAccuracy(paperContent, evaluationComparison);
      
      // Calculate edit analysis if comparison data is available
      const editAnalysis = evaluationComparison ? 
        calculateEditAnalysis(evaluationComparison) : 
        { score: 1, issues: [], details: {} };
      
      // Calculate overall metrics
      const qualityMetrics = {
        overallQuality: {
          value: calculateOverallQualityScore(propertyCoverage, evidenceQuality, valueAccuracy),
          automated: calculateOverallQualityScore(propertyCoverage, evidenceQuality, valueAccuracy)
        }
      };
    
      return {
        propertyCoverage,
        evidenceQuality,
        valueAccuracy,
        editAnalysis,
        qualityMetrics
      };
    } catch (error) {
      console.error("Error in generateContentMetrics:", error);
      
      // Return defaults on error
      return {
        propertyCoverage: { score: 0, issues: ['Error calculating property coverage metrics'] },
        evidenceQuality: { score: 0, issues: ['Error calculating evidence quality metrics'] },
        valueAccuracy: { score: 0, issues: ['Error calculating value accuracy metrics'] },
        editAnalysis: { score: 0, issues: ['Error calculating edit analysis metrics'] },
        qualityMetrics: {
          overallQuality: { value: 0, automated: 0 }
        }
      };
    }
  };
  
  /**
   * Calculate detailed property coverage with component metrics
   * @param {Object} paperContent - Paper content with annotations
   * @param {Array} templateProperties - Template properties
   * @returns {Object} Property coverage metrics
   */
  const calculateDetailedPropertyCoverage = (paperContent, templateProperties) => {
    // Count annotated properties
    const annotatedPropertyIds = Object.keys(paperContent).filter(propId => 
      paperContent[propId] && paperContent[propId].values && paperContent[propId].values.length > 0
    );
    
    const templatePropertyIds = templateProperties.map(prop => prop.id);
    const annotatedCount = annotatedPropertyIds.length;
    const totalProperties = templatePropertyIds.length;
    const coverageRatio = totalProperties > 0 ? annotatedCount / totalProperties : 0;
    
    // Calculate data type match rate
    let dataTypeMatchCount = 0;
    let dataTypeIssues = [];
    
    annotatedPropertyIds.forEach(propId => {
      const templateProp = templateProperties.find(p => p.id === propId);
      const paperProp = paperContent[propId];
      
      if (templateProp && paperProp && paperProp.values) {
        const expectedType = templateProp.type || 'text';
        let typeMatches = true;
        
        paperProp.values.forEach(value => {
          // Check data type match based on expected type
          const actualValue = value.value;
          let actualType = typeof actualValue;
          
          if (actualValue === null || actualValue === undefined) {
            actualType = 'null';
          } else if (Array.isArray(actualValue)) {
            actualType = 'array';
          } else if (actualType === 'object' && typeof actualValue.toISOString === 'function') {
            actualType = 'date';
          }
          
          // Simple type checking
          const isTypeMatch = (
            (expectedType === 'text' && typeof actualValue === 'string') ||
            (expectedType === 'number' && typeof actualValue === 'number') ||
            (expectedType === 'boolean' && typeof actualValue === 'boolean') ||
            (expectedType === 'date' && (actualType === 'date' || (typeof actualValue === 'string' && !isNaN(Date.parse(actualValue))))) ||
            (expectedType === 'resource' && typeof actualValue === 'object')
          );
          
          if (!isTypeMatch) {
            typeMatches = false;
            dataTypeIssues.push({
              property: templateProp.label || propId,
              expectedType,
              actualType,
              value: String(actualValue).substring(0, 50)
            });
          }
        });
        
        if (typeMatches) {
          dataTypeMatchCount++;
        }
      }
    });
    
    const dataTypeMatchRate = annotatedCount > 0 ? dataTypeMatchCount / annotatedCount : 0;
    
    // Calculate granularity quality
    const granularityScores = [];
    annotatedPropertyIds.forEach(propId => {
      const paperProp = paperContent[propId];
      if (paperProp && paperProp.values) {
        paperProp.values.forEach(value => {
          // Estimate granularity score based on value complexity
          let granularityScore = 0;
          const actualValue = value.value;
          
          if (typeof actualValue === 'string') {
            // For strings, consider length and structure
            const wordCount = actualValue.split(/\s+/).filter(Boolean).length;
            if (wordCount > 10) {
              granularityScore = 1.0; // Detailed text
            } else if (wordCount > 3) {
              granularityScore = 0.8; // Phrase
            } else {
              granularityScore = 0.5; // Simple term
            }
          } else if (typeof actualValue === 'number') {
            granularityScore = 0.7; // Numbers have medium granularity
          } else if (typeof actualValue === 'boolean') {
            granularityScore = 0.3; // Booleans have low granularity
          } else if (actualValue && typeof actualValue === 'object') {
            // Complex objects have high granularity
            granularityScore = 0.9;
          }
          
          granularityScores.push(granularityScore);
        });
      }
    });
    
    const granularityQuality = granularityScores.length > 0 ? 
      granularityScores.reduce((sum, score) => sum + score, 0) / granularityScores.length : 0;
    
    // Calculate value completeness and evidence statistics
    let completeValueCount = 0;
    let propertiesWithEvidence = 0;
    let evidenceCitations = 0;
    
    annotatedPropertyIds.forEach(propId => {
      const paperProp = paperContent[propId];
      let hasEvidence = false;
      
      if (paperProp && paperProp.values) {
        let isComplete = paperProp.values.some(value => {
          const actualValue = value.value;
          
          // Check for non-empty values
          if (actualValue === null || actualValue === undefined || actualValue === '') {
            return false;
          }
          
          if (typeof actualValue === 'string' && actualValue.trim() === '') {
            return false;
          }
          
          // Count evidence citations
          if (value.evidence && Object.keys(value.evidence).length > 0) {
            hasEvidence = true;
            evidenceCitations += Object.keys(value.evidence).length;
            return true;
          }
          
          return true;
        });
        
        if (isComplete) {
          completeValueCount++;
        }
        
        if (hasEvidence) {
          propertiesWithEvidence++;
        }
      }
    });
    
    const valueCompleteness = annotatedCount > 0 ? completeValueCount / annotatedCount : 0;
    
    // Missing properties
    const missingPropertyIds = templatePropertyIds.filter(id => !annotatedPropertyIds.includes(id));
    const missingProperties = missingPropertyIds.map(id => {
      const prop = templateProperties.find(p => p.id === id);
      return prop ? (prop.label || id) : id;
    });
    
    // Calculate the overall property coverage score using component weights
    const overallScore = 
      (coverageRatio * 0.4) + 
      (dataTypeMatchRate * PROPERTY_COVERAGE_WEIGHTS.dataTypeMatch) + 
      (granularityQuality * PROPERTY_COVERAGE_WEIGHTS.granularityQuality) + 
      (valueCompleteness * PROPERTY_COVERAGE_WEIGHTS.valueCompleteness);
    
    // Generate issues
    const issues = [];
    if (missingProperties.length > 0) {
      issues.push(`${missingProperties.length} properties are missing annotations: ${missingProperties.join(', ')}`);
    }
    
    if (dataTypeIssues.length > 0) {
      issues.push(`${dataTypeIssues.length} properties have data type mismatches`);
    }
    
    if (valueCompleteness < 0.8) {
      issues.push('Some properties have incomplete values');
    }
    
    return {
      score: overallScore,
      details: {
        annotatedCount,
        totalProperties,
        coverageRatio,
        dataTypeMatchRate,
        dataTypeMatchCount,
        dataTypeIssues,
        granularityQuality,
        valueCompleteness,
        completeValueCount,
        missingProperties,
        propertiesWithEvidence,
        evidenceCitations,
        componentScores: {
          coverageRatio,
          dataTypeMatchRate,
          granularityQuality,
          valueCompleteness
        },
        componentWeights: {
          coverage: 0.4,
          ...PROPERTY_COVERAGE_WEIGHTS
        }
      },
      issues
    };
  };
  
  /**
   * Calculate detailed evidence quality with component metrics
   * @param {Object} paperContent - Paper content with annotations
   * @param {Object} textSections - Paper text sections
   * @returns {Object} Evidence quality metrics
   */
  const calculateDetailedEvidenceQuality = (paperContent, textSections) => {
    let totalEvidenceCount = 0;
    let validEvidenceCount = 0;
    const invalidEvidence = [];
    const validEvidence = [];
    
    // Component metrics
    let semanticSimilaritySum = 0;
    let contextualRelevanceSum = 0;
    let tokenOverlapSum = 0;
    let structureMatchSum = 0;
    
    // Analyze each property's evidence
    Object.keys(paperContent).forEach(propId => {
      const propData = paperContent[propId];
      if (!propData.values || !Array.isArray(propData.values)) return;
  
      propData.values.forEach(value => {
        if (!value.evidence) return;
        
        Object.keys(value.evidence).forEach(sectionName => {
          const evidence = value.evidence[sectionName];
          if (!evidence || !evidence.text) return;
          
          totalEvidenceCount++;
          
          // Get the section text
          const sectionText = textSections[sectionName];
          if (!sectionText) {
            invalidEvidence.push({
              property: propId,
              value: value.value,
              section: sectionName,
              evidence: evidence.text,
              issue: 'Section not found in paper',
              bestMatchScore: 0
            });
            return;
          }
          
          // Calculate semantic similarity
          const semanticSimilarity = calculateStringSimilarity(evidence.text, sectionText);
          semanticSimilaritySum += semanticSimilarity;
          
          // Calculate token overlap (Jaccard similarity)
          const evidenceTokens = evidence.text.toLowerCase().split(/\s+/).filter(Boolean);
          const sectionTokens = sectionText.toLowerCase().split(/\s+/).filter(Boolean);
          
          const evidenceTokenSet = new Set(evidenceTokens);
          const sectionTokenSet = new Set(sectionTokens);
          
          const intersection = new Set([...evidenceTokenSet].filter(x => sectionTokenSet.has(x)));
          const union = new Set([...evidenceTokenSet, ...sectionTokenSet]);
          
          const tokenOverlap = union.size > 0 ? intersection.size / union.size : 0;
          tokenOverlapSum += tokenOverlap;
          
          // Calculate Levenshtein-based similarity
          const normalizedSimilarity = calculateNormalizedSimilarity(evidence.text, sectionText);
          
          // Calculate contextual relevance
          const propertyName = propId;
          // Check if property name or value appears in context
          const valueInText = sectionText.toLowerCase().includes(String(value.value).toLowerCase());
          const propertyInText = sectionText.toLowerCase().includes(propertyName.toLowerCase());
          
          const contextualRelevance = (valueInText ? 0.7 : 0) + (propertyInText ? 0.3 : 0);
          contextualRelevanceSum += contextualRelevance;
          
          // Calculate structure match (simple check for now)
          const evidenceSentences = evidence.text.split(/[.!?]+/).filter(Boolean).length;
          const similarSentenceStructure = Math.abs(evidenceSentences - 1) <= 2 ? 0.8 : 0.4;
          structureMatchSum += similarSentenceStructure;
          
          // Combined evidence quality score for this evidence
          const evidenceScore = 
            (semanticSimilarity * EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity) +
            (contextualRelevance * EVIDENCE_QUALITY_WEIGHTS.contextualRelevance) +
            (tokenOverlap * EVIDENCE_QUALITY_WEIGHTS.tokenOverlap) +
            (similarSentenceStructure * EVIDENCE_QUALITY_WEIGHTS.structureMatch);
          
          // Consider evidence valid if combined score is above threshold
          if (evidenceScore >= CONTENT_CONFIG.textSimilarityThreshold) {
            validEvidenceCount++;
            validEvidence.push({
              property: propId,
              value: value.value,
              section: sectionName,
              evidence: evidence.text,
              similarityScore: evidenceScore,
              details: {
                semanticSimilarity,
                contextualRelevance,
                tokenOverlap,
                structureMatch: similarSentenceStructure
              }
            });
          } else {
            invalidEvidence.push({
              property: propId,
              value: value.value,
              section: sectionName,
              evidence: evidence.text,
              bestMatchScore: evidenceScore,
              issue: 'Evidence not sufficiently similar to section content',
              details: {
                semanticSimilarity,
                contextualRelevance,
                tokenOverlap,
                structureMatch: similarSentenceStructure
              }
            });
          }
        });
      });
    });
  
    // Calculate averages
    const averageSimilarity = totalEvidenceCount > 0 ? semanticSimilaritySum / totalEvidenceCount : 0;
    const contextualRelevance = totalEvidenceCount > 0 ? contextualRelevanceSum / totalEvidenceCount : 0;
    const tokenOverlap = totalEvidenceCount > 0 ? tokenOverlapSum / totalEvidenceCount : 0;
    const structureMatch = totalEvidenceCount > 0 ? structureMatchSum / totalEvidenceCount : 0;
    
    // Calculate overall evidence quality score
    const overallScore = totalEvidenceCount > 0 ? 
      (averageSimilarity * EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity) +
      (contextualRelevance * EVIDENCE_QUALITY_WEIGHTS.contextualRelevance) +
      (tokenOverlap * EVIDENCE_QUALITY_WEIGHTS.tokenOverlap) +
      (structureMatch * EVIDENCE_QUALITY_WEIGHTS.structureMatch) : 0;
    
    // Generate issues
    const issues = [];
    if (invalidEvidence.length > 0) {
      issues.push(`${invalidEvidence.length} out of ${totalEvidenceCount} evidence citations couldn't be verified`);
    }
    
    if (averageSimilarity < 0.5) {
      issues.push('Low semantic similarity between evidence and source text');
    }
    
    if (contextualRelevance < 0.4) {
      issues.push('Evidence lacks contextual relevance to properties');
    }
  
    return {
      score: overallScore,
      details: {
        validEvidenceCount,
        totalEvidenceCount,
        evidenceQualityScore: overallScore,
        averageSimilarity,
        contextualRelevance,
        tokenOverlap,
        structureMatch,
        validEvidence,
        invalidEvidence,
        componentScores: {
          semanticSimilarity: averageSimilarity,
          contextualRelevance,
          tokenOverlap,
          structureMatch
        },
        componentWeights: EVIDENCE_QUALITY_WEIGHTS
      },
      issues
    };
  };
  
  /**
   * Calculate value accuracy based on comparison data or direct evidence validation
   * @param {Object} paperContent - Paper content with annotations
   * @param {Object} evaluationComparison - Comparison data for evaluation
   * @returns {Object} Value accuracy metrics
   */
  const calculateValueAccuracy = (paperContent, evaluationComparison) => {
    let totalValues = 0;
    let accurateValues = 0;
    const inaccurateValues = [];
    
    // If we have comparison data, use it to determine accuracy
    if (evaluationComparison && evaluationComparison.changes) {
      const changes = evaluationComparison.changes;
      
      // Check each property in the paper content
      Object.keys(paperContent).forEach(propId => {
        const propData = paperContent[propId];
        if (!propData.values || !Array.isArray(propData.values)) return;
        
        propData.values.forEach(value => {
          totalValues++;
          
          // Check if this property was modified in the evaluation
          if (changes.modified_properties && changes.modified_properties[propId]) {
            const modifications = changes.modified_properties[propId];
            
            // Check if the value was preserved in the new values
            const valuePreserved = modifications.new_values && 
              modifications.new_values.some(v => 
                JSON.stringify(v.value) === JSON.stringify(value.value)
              );
            
            if (valuePreserved) {
              accurateValues++;
            } else {
              inaccurateValues.push({
                property: propId,
                value: value.value,
                confidence: value.confidence,
                issue: 'Value was modified during evaluation'
              });
            }
          } 
          // Check if the property was removed entirely
          else if (changes.removed_properties && changes.removed_properties.includes(propId)) {
            inaccurateValues.push({
              property: propId,
              value: value.value,
              confidence: value.confidence,
              issue: 'Property was removed during evaluation'
            });
          }
          // If not modified or removed, consider accurate
          else {
            accurateValues++;
          }
        });
      });
    } 
    // Otherwise, rely on evidence validation
    else {
      // Iterate through properties and check evidence validity
      Object.keys(paperContent).forEach(propId => {
        const propData = paperContent[propId];
        if (!propData.values || !Array.isArray(propData.values)) return;
    
        propData.values.forEach(value => {
          totalValues++;
          
          // Consider values with evidence as accurate
          if (value.evidence && Object.keys(value.evidence).length > 0) {
            accurateValues++;
          } else {
            inaccurateValues.push({
              property: propId,
              value: value.value,
              confidence: value.confidence,
              issue: 'No evidence provided'
            });
          }
        });
      });
    }
    
    const valueAccuracyScore = totalValues > 0 ? accurateValues / totalValues : 0;
    
    return {
      score: valueAccuracyScore,
      details: {
        accurateValues,
        totalValues,
        valueAccuracyScore,
        inaccurateValues
      },
      issues: inaccurateValues.length > 0 ? 
        [`${inaccurateValues.length} out of ${totalValues} values have accuracy issues`] : []
    };
  };
  
  /**
   * Calculate edit analysis based on comparison data
   * @param {Object} evaluationComparison - Comparison data for evaluation
   * @returns {Object} Edit analysis metrics
   */
  const calculateEditAnalysis = (comparisonData) => {
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
    
    // Calculate detailed modification analysis
    const modificationDetails = {};
    modifiedProps.forEach(propId => {
      const modData = changes.modified_properties[propId];
      modificationDetails[propId] = {
        oldValues: modData.old_values || [],
        newValues: modData.new_values || [],
        valueChanges: (modData.old_values || []).length - (modData.new_values || []).length
      };
    });
    
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
        modificationDetails,
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
  const calculateOverallQualityScore = (propertyCoverage, evidenceQuality, valueAccuracy) => {
    return (
      (propertyCoverage.score * QUALITY_WEIGHTS.propertyCoverage) +
      (evidenceQuality.score * QUALITY_WEIGHTS.evidenceQuality) +
      (valueAccuracy.score * QUALITY_WEIGHTS.valueAccuracy)
    );
  };
  
  /**
   * Apply user rating to metrics with expertise weighting
   * @param {Object} metrics - Automated metrics
   * @param {number} userRating - User rating (1-5)
   * @param {number} expertiseMultiplier - Expertise multiplier
   * @returns {Object} Updated metrics with user rating
   */
  export const applyUserRatingToMetrics = (metrics, userRating, expertiseMultiplier) => {
    // If no user rating, return original metrics
    if (!userRating || !metrics) {
      return metrics;
    }
    
    // Normalize user rating to 0-1 scale
    const normalizedRating = userRating / 5;
    
    // Apply expertise multiplier to user rating
    const weightedRating = normalizedRating * expertiseMultiplier;
    
    // Calculate final score as weighted average of automated and user scores
    // Use 40% automated, 60% user weight as a default
    const automatedScore = metrics.score || 0;
    const finalScore = (automatedScore * 0.4) + (weightedRating * 0.6);
    
    // Create new metrics object with updated score
    return {
      ...metrics,
      score: finalScore,
      details: {
        ...(metrics.details || {}),
        userRating,
        expertiseMultiplier,
        normalizedRating,
        weightedRating,
        automatedScore,
        finalScore
      }
    };
  };
  
  /**
   * Calculate confidence calibration score
   * @param {Object} paperContent - Paper content with annotations
   * @param {Object} evaluationComparison - Comparison data for evaluation
   * @returns {Object} Confidence calibration metrics
   */
  export const calculateConfidenceCalibration = (paperContent, evaluationComparison) => {
    // If no comparison data, return a default score
    if (!evaluationComparison || !evaluationComparison.changes) {
      return {
        score: 0.8,
        issues: [],
        details: {
          totalValues: 0,
          averageCalibrationError: 0.2,
          calibrationScore: 0.8,
          miscalibratedValues: []
        }
      };
    }
    
    const changes = evaluationComparison.changes || {};
    const modifiedProperties = changes.modified_properties || {};
    
    let totalValues = 0;
    let calibrationError = 0;
    const calibrationIssues = [];
    
    // Check each property's values
    Object.keys(paperContent).forEach(propId => {
      const property = paperContent[propId];
      if (!property?.values) return;
      
      property.values.forEach(value => {
        if (value.confidence === undefined) return;
        
        totalValues++;
        const confidence = value.confidence;
        
        // Check if this property was modified
        const wasModified = modifiedProperties[propId];
        if (!wasModified) {
          // If not modified, the confidence should ideally be high
          // Calculate calibration error as distance from 1.0
          const error = Math.abs(1.0 - confidence);
          calibrationError += error;
          
          if (confidence < 0.8) {
            calibrationIssues.push({
              property: property.label || property.property,
              value: value.value,
              confidence,
              issue: 'Low confidence for accurate value'
            });
          }
        } else {
          // If modified, the confidence should ideally be low
          // Calculate calibration error as distance from 0.0
          const error = confidence;
          calibrationError += error;
          
          if (confidence > 0.6) {
            calibrationIssues.push({
              property: property.label || property.property,
              value: value.value,
              confidence,
              issue: 'High confidence for inaccurate value'
            });
          }
        }
      });
    });
    
    // Calculate final calibration score (1 - average error)
    const calibrationScore = totalValues > 0 ? 1 - (calibrationError / totalValues) : 0;
    
    const issues = [];
    if (calibrationIssues.length > 0) {
      issues.push(`${calibrationIssues.length} property values had miscalibrated confidence scores`);
    }
    
    return {
      score: calibrationScore,
      issues,
      details: {
        totalValues,
        averageCalibrationError: totalValues > 0 ? calibrationError / totalValues : 0,
        calibrationScore,
        miscalibratedValues: calibrationIssues
      }
    };
  };
  
  /**
   * Apply semantic analysis to evidence text
   * @param {string} evidenceText - Evidence text to analyze
   * @param {string} sectionText - Section text to compare against
   * @returns {Object} Semantic analysis results
   */
  export const analyzeEvidenceSemantics = (evidenceText, sectionText) => {
    if (!evidenceText || !sectionText) {
      return {
        semanticSimilarity: 0,
        tokenOverlap: 0,
        contextualRelevance: 0,
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
    
    // Simple contextual relevance (placeholder - in production would be more sophisticated)
    const contextualRelevance = Math.min(1, (semanticSimilarity * 0.7) + (tokenOverlap * 0.3));
    
    // Structure match (simple approximation)
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
      tokenOverlap,
      contextualRelevance,
      structureMatch,
      overallScore
    };
  };
  
  /**
   * Get property metadata from template
   * @param {string} propertyId - Property ID to look up
   * @param {Array} templateProperties - Template properties
   * @returns {Object} Property metadata
   */
  export const getPropertyMetadata = (propertyId, templateProperties) => {
    if (!propertyId || !templateProperties || !Array.isArray(templateProperties)) {
      return { id: propertyId, label: propertyId, type: 'text' };
    }
    
    const property = templateProperties.find(p => p.id === propertyId);
    
    if (!property) {
      return { id: propertyId, label: propertyId, type: 'text' };
    }
    
    return {
      id: propertyId,
      label: property.label || propertyId,
      type: property.type || 'text',
      description: property.description || '',
      required: property.required || false
    };
  };