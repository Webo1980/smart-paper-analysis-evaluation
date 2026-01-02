// src/components/evaluation/content/utils/propertyCoverageUtils.js
/**
 * Utility functions for property coverage analysis
 */
import { PROPERTY_COVERAGE_WEIGHTS, PROPERTY_COVERAGE_EXPLANATIONS } from '../config/contentConfig';

/**
 * Analyze template properties and identified properties
 * @param {Object} paperContent - Paper content with annotations
 * @param {Array} templateProperties - Template properties
 * @returns {Object} Analysis results with counts and issues
 */
export const analyzeProperties = (paperContent, templateProperties) => {
  if (!templateProperties || !paperContent) {
    return {
      templateCount: 0,
      identifiedCount: 0,
      correctTypeCount: 0,
      incompleteCount: 0,
      missingProperties: [],
      typeErrorProperties: []
    };
  }

  const templateCount = Object.keys(templateProperties).length;
  const identifiedCount = Object.keys(paperContent).length;
  
  // Calculate properties with correct types
  const correctTypeCount = Object.keys(paperContent).filter(propId => {
    const paperProp = paperContent[propId];
    const templateProp = templateProperties[propId];
    return templateProp && paperProp && paperProp.type === templateProp.type;
  }).length;
  
  // Check if a property has valid values (not empty, null, undefined)
  const hasValidValues = (prop) => {
    return prop && 
           prop.values && 
           prop.values.length > 0 && 
           prop.values.some(v => v.value !== null && v.value !== undefined && v.value !== '');
  };
  
  // Calculate properties with incomplete values (properly check values array)
  const incompleteCount = Object.keys(paperContent).filter(propId => {
    const paperProp = paperContent[propId];
    return !hasValidValues(paperProp);
  }).length;
  
  // Find truly missing properties - not in paper content OR has no valid values
  const missingProperties = Object.keys(templateProperties).filter(propId => {
    const paperProp = paperContent[propId];
    return !paperProp || !hasValidValues(paperProp);
  });
  
  // Find properties with type errors (but only if they have values)
  const typeErrorProperties = Object.keys(paperContent).filter(propId => {
    const paperProp = paperContent[propId];
    const templateProp = templateProperties[propId];
    return templateProp && 
           paperProp && 
           hasValidValues(paperProp) &&
           paperProp.type !== templateProp.type;
  });
  
  return {
    templateCount,
    identifiedCount,
    correctTypeCount,
    incompleteCount,
    missingProperties,
    typeErrorProperties
  };
};

/**
 * Analyze value granularity for a given value
 * @param {any} value - The value to analyze
 * @returns {Object} Granularity analysis result with score and explanation
 */
export const analyzeValueGranularity = (value) => {
  let score = 0;
  let explanation = '';
  
  if (value === null || value === undefined || value === '') {
    return { score: 0, explanation: 'Empty value' };
  }
  
  if (typeof value === 'string') {
    const wordCount = value.split(/\s+/).filter(Boolean).length;
    if (wordCount > 10) {
      score = 1.0;
      explanation = 'Detailed text (>10 words)';
    } else if (wordCount > 3) {
      score = 0.8;
      explanation = 'Medium text (3-10 words)';
    } else {
      score = 0.5;
      explanation = 'Simple text (1-3 words)';
    }
  } else if (typeof value === 'number') {
    score = 0.7;
    explanation = 'Numeric value';
  } else if (typeof value === 'boolean') {
    score = 0.3;
    explanation = 'Boolean value';
  } else if (Array.isArray(value)) {
    score = 0.85;
    explanation = 'Array value';
  } else if (typeof value === 'object') {
    score = 0.9;
    explanation = 'Complex object';
  }
  
  return { score, explanation };
};

/**
 * Calculate property coverage scores from metrics
 * @param {Object} metrics - Property coverage metrics 
 * @returns {Object} Coverage scores and metrics
 */
export const calculatePropertyCoverageScores = (metrics) => {
  if (!metrics || !metrics.propertyCoverage) {
    return {
      dataTypeScore: 0,
      granularityScore: 0,
      completenessScore: 0,
      weightedDataTypeScore: 0,
      weightedGranularityScore: 0,
      weightedCompletenessScore: 0,
      combinedScore: 0
    };
  }

  const details = metrics.propertyCoverage.details || {};

  // Get scores from metrics
  const dataTypeScore = details.dataTypeMatchRate || 0;
  const granularityScore = details.granularityQuality || 0;
  const completenessScore = details.valueCompleteness || 0;
  
  // Apply weights from config
  const weightedDataTypeScore = dataTypeScore * PROPERTY_COVERAGE_WEIGHTS.dataTypeMatch;
  const weightedGranularityScore = granularityScore * PROPERTY_COVERAGE_WEIGHTS.granularityQuality;
  const weightedCompletenessScore = completenessScore * PROPERTY_COVERAGE_WEIGHTS.valueCompleteness;
  
  // Combined weighted score
  const combinedScore = 
    weightedDataTypeScore + 
    weightedGranularityScore + 
    weightedCompletenessScore;
  
  return {
    dataTypeScore,
    granularityScore,
    completenessScore,
    weightedDataTypeScore,
    weightedGranularityScore,
    weightedCompletenessScore,
    combinedScore
  };
};

/**
 * Get property coverage explanation for a specific component
 * @param {string} component - Component name (dataTypeMatch, granularityQuality, etc.)
 * @returns {Object} Explanation with description, formula, and example
 */
export const getPropertyCoverageExplanation = (component) => {
  // Return default explanation if component not found
  if (!PROPERTY_COVERAGE_EXPLANATIONS[component]) {
    return {
      description: "No explanation available for this component",
      formula: "N/A",
      example: "N/A"
    };
  }
  
  return PROPERTY_COVERAGE_EXPLANATIONS[component];
};

/**
 * Generate detailed data type analysis report
 * @param {Object} paperContent - Paper content properties
 * @param {Object} templateProperties - Template properties
 * @returns {Object} Detailed type mismatch report
 */
export const generateTypeMatchReport = (paperContent, templateProperties) => {
  if (!paperContent || !templateProperties) {
    return { 
      mismatches: [], 
      totalProperties: 0, 
      matchedProperties: 0,
      matchRate: 1
    };
  }
  
  const mismatches = [];
  let totalChecked = 0;
  let matchedCount = 0;
  
  // Check only properties that exist in both paperContent and templateProperties
  Object.keys(paperContent).forEach(propId => {
    const paperProp = paperContent[propId];
    const templateProp = templateProperties[propId];
    
    // Skip if either property doesn't exist or paper property has no values
    if (!templateProp || !paperProp || !paperProp.values || paperProp.values.length === 0) {
      return;
    }
    
    totalChecked++;
    const expectedType = templateProp.type || 'text';
    let hasTypeMismatch = false;
    
    const valueTypeIssues = [];
    
    paperProp.values.forEach((value, index) => {
      const actualValue = value.value;
      let actualType = typeof actualValue;
      
      // Normalize type names for better comparison
      if (actualValue === null || actualValue === undefined) {
        actualType = 'null';
      } else if (Array.isArray(actualValue)) {
        actualType = 'array';
      } else if (actualType === 'object' && typeof actualValue.toISOString === 'function') {
        actualType = 'date';
      }
      
      // Check type match with improved type checking
      const isTypeMatch = (
        (expectedType === 'text' && typeof actualValue === 'string') ||
        (expectedType === 'number' && typeof actualValue === 'number') ||
        (expectedType === 'boolean' && typeof actualValue === 'boolean') ||
        (expectedType === 'date' && (actualType === 'date' || (typeof actualValue === 'string' && !isNaN(Date.parse(actualValue))))) ||
        (expectedType === 'resource' && (typeof actualValue === 'object' || typeof actualValue === 'string'))
      );
      
      if (!isTypeMatch) {
        hasTypeMismatch = true;
        
        // Add detailed issue info
        valueTypeIssues.push({
          valueIndex: index,
          expectedType,
          actualType,
          displayValue: String(actualValue).substring(0, 50) + (String(actualValue).length > 50 ? '...' : '')
        });
      }
    });
    
    if (hasTypeMismatch) {
      mismatches.push({
        property: propId,
        propertyLabel: templateProp.label || propId,
        expectedType,
        valueCount: paperProp.values.length,
        issues: valueTypeIssues,
        severity: valueTypeIssues.length === paperProp.values.length ? 'high' : 'medium'
      });
    } else {
      matchedCount++;
    }
  });
  
  return {
    mismatches,
    totalProperties: totalChecked,
    matchedProperties: matchedCount,
    matchRate: totalChecked > 0 ? matchedCount / totalChecked : 1
  };
};

/**
 * Generate detailed granularity analysis report
 * @param {Object} paperContent - Paper content properties
 * @returns {Object} Detailed granularity analysis
 */
export const generateGranularityReport = (paperContent) => {
  if (!paperContent) {
    return { 
      propertyAnalysis: [], 
      valueTypes: {}, 
      averageScore: 0,
      valueCount: 0,
      typeDistribution: []
    };
  }
  
  const propertyAnalysis = [];
  const valueTypes = {
    'Detailed text': 0,
    'Medium text': 0,
    'Simple text': 0,
    'Numeric value': 0,
    'Boolean value': 0,
    'Complex object': 0,
    'Array value': 0,
    'Empty value': 0
  };
  
  let totalScore = 0;
  let valueCount = 0;
  
  Object.keys(paperContent).forEach(propId => {
    const property = paperContent[propId];
    if (!property?.values) return;
    
    const values = property.values;
    let propertyScore = 0;
    const valueAnalysis = [];
    
    // Skip empty arrays
    if (values.length === 0) return;
    
    values.forEach(value => {
      // Check for null/undefined/empty values
      if (!value || value.value === null || value.value === undefined || value.value === '') {
        valueTypes['Empty value'] = (valueTypes['Empty value'] || 0) + 1;
        valueAnalysis.push({ score: 0, explanation: 'Empty value' });
        valueCount++;
        return;
      }
      
      const analysis = analyzeValueGranularity(value.value);
      valueAnalysis.push(analysis);
      propertyScore += analysis.score;
      valueTypes[analysis.explanation] = (valueTypes[analysis.explanation] || 0) + 1;
      totalScore += analysis.score;
      valueCount++;
    });
    
    const avgPropertyScore = values.length > 0 ? propertyScore / values.length : 0;
    
    propertyAnalysis.push({
      property: propId,
      propertyLabel: property.label || property.property || propId,
      valueCount: values.length,
      averageScore: avgPropertyScore,
      valueAnalysis,
      qualityRating: avgPropertyScore >= 0.8 ? 'high' : avgPropertyScore >= 0.5 ? 'medium' : 'low'
    });
  });
  
  const averageScore = valueCount > 0 ? totalScore / valueCount : 0;
  
  return {
    propertyAnalysis: propertyAnalysis.sort((a, b) => b.averageScore - a.averageScore),
    valueTypes,
    averageScore,
    valueCount,
    typeDistribution: Object.entries(valueTypes)
      .filter(([_, count]) => count > 0) // Only include types that have values
      .map(([type, count]) => ({
        type,
        count,
        percentage: valueCount > 0 ? count / valueCount : 0
      }))
      .sort((a, b) => b.count - a.count)
  };
};