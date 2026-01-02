// src/utils/qualityDataExtractors.js

/**
 * Quality Data Extractor Utilities
 * 
 * Functions to extract quality metrics from evaluation objects
 * for use in Data Quality View dashboard components.
 * 
 * Quality data is stored at: evaluation.evaluationMetrics.quality.[component]
 */

/**
 * Extract metadata quality from evaluation
 * Aggregates quality scores across all metadata fields
 * 
 * Handles both display names ("Authors Extraction") and internal names ("authors")
 * 
 * @param {Object} evaluation - Evaluation object
 * @returns {Object} Aggregated metadata quality scores
 */
export function extractMetadataQuality(evaluation) {
  const metadataQuality = evaluation?.evaluationMetrics?.quality?.metadata;
  if (!metadataQuality) return null;
  
  // Map internal field names to display names used in evaluation objects
  const fieldMapping = {
    'title': 'Title Extraction',
    'authors': 'Authors Extraction',
    'doi': 'DOI Extraction',
    'publication_year': 'Publication Date',
    'venue': 'Venue/Journal'
  };
  
  const fields = ['title', 'authors', 'doi', 'publication_year', 'venue'];
  const validFields = fields.filter(field => {
    const displayName = fieldMapping[field];
    return metadataQuality[displayName] || metadataQuality[field];
  });
  
  if (validFields.length === 0) return null;

  // Aggregate scores across fields
  const aggregated = validFields.reduce((acc, field) => {
    // Try display name first, fall back to internal name
    const displayName = fieldMapping[field];
    const fieldData = metadataQuality[displayName] || metadataQuality[field];
    const qualityData = fieldData.qualityData;
    
    if (qualityData) {
      // Extract dimension scores
      if (qualityData.fieldSpecificMetrics) {
        acc.completeness.push(qualityData.fieldSpecificMetrics.completeness?.score || 0);
        acc.consistency.push(qualityData.fieldSpecificMetrics.consistency?.score || 0);
        acc.validity.push(qualityData.fieldSpecificMetrics.validity?.score || 0);
      }
      
      // Extract overall score
      acc.overall.push(qualityData.overallScore || qualityData.automatedOverallScore || 0);
      
      // Extract final combined score (with user input)
      if (fieldData.scoreDetails?.finalScore !== undefined) {
        acc.finalScores.push(fieldData.scoreDetails.finalScore);
      }
      
      // Collect issues
      if (qualityData.fieldSpecificMetrics) {
        Object.values(qualityData.fieldSpecificMetrics).forEach(metric => {
          if (metric.issues && metric.issues.length > 0) {
            acc.issues.push(...metric.issues);
          }
        });
      }
    }
    
    return acc;
  }, { 
    completeness: [], 
    consistency: [], 
    validity: [], 
    overall: [], 
    finalScores: [],
    issues: [] 
  });

  return {
    completeness: avg(aggregated.completeness),
    consistency: avg(aggregated.consistency),
    validity: avg(aggregated.validity),
    automatedOverall: avg(aggregated.overall),
    finalOverall: avg(aggregated.finalScores),
    fieldCount: validFields.length,
    issueCount: aggregated.issues.length,
    issues: aggregated.issues
  };
}

/**
 * Extract research field quality from evaluation
 * 
 * @param {Object} evaluation - Evaluation object
 * @returns {Object} Research field quality scores
 */
export function extractFieldQuality(evaluation) {
  const fieldQuality = evaluation?.evaluationMetrics?.quality?.researchField;
  if (!fieldQuality) return null;
  
  const qualityData = fieldQuality.qualityData;
  const scoreDetails = fieldQuality.scoreDetails;
  
  if (!qualityData) return null;

  return {
    confidence: qualityData.fieldSpecificMetrics?.confidence?.score || 0,
    relevance: qualityData.fieldSpecificMetrics?.relevance?.score || 0,
    consistency: qualityData.fieldSpecificMetrics?.consistency?.score || 0,
    automatedOverall: qualityData.overallScore || qualityData.automatedOverallScore || 0,
    finalOverall: scoreDetails?.finalScore || 0,
    issues: extractAllIssues(qualityData.fieldSpecificMetrics)
  };
}

/**
 * Extract research problem quality from evaluation
 * 
 * @param {Object} evaluation - Evaluation object
 * @returns {Object} Research problem quality scores
 */
export function extractProblemQuality(evaluation) {
  const problemQuality = evaluation?.evaluationMetrics?.quality?.researchProblem;
  if (!problemQuality) return null;
  
  const qualityData = problemQuality.qualityData;
  const scoreDetails = problemQuality.scoreDetails;
  
  if (!qualityData || !qualityData.fieldSpecificMetrics) return null;

  const metrics = qualityData.fieldSpecificMetrics;
  
  return {
    titleQuality: metrics.titleQuality?.score || 0,
    descriptionQuality: metrics.descriptionQuality?.score || 0,
    relevance: metrics.relevance?.score || 0,
    evidenceQuality: metrics.evidenceQuality?.score || 0,
    automatedOverall: qualityData.overallScore || qualityData.automatedOverallScore || 0,
    finalOverall: scoreDetails?.finalScore || 0,
    issues: extractAllIssues(metrics)
  };
}

/**
 * Extract template quality from evaluation
 * 
 * @param {Object} evaluation - Evaluation object
 * @returns {Object} Template quality scores
 */
export function extractTemplateQuality(evaluation) {
  const templateQuality = evaluation?.evaluationMetrics?.quality?.template;
  if (!templateQuality) return null;
  
  const qualityData = templateQuality.qualityData;
  const scoreDetails = templateQuality.scoreDetails;
  
  if (!qualityData || !qualityData.fieldSpecificMetrics) return null;

  const metrics = qualityData.fieldSpecificMetrics;
  
  return {
    titleQuality: metrics.titleQuality?.score || 0,
    descriptionQuality: metrics.descriptionQuality?.score || 0,
    propertyCoverage: metrics.propertyCoverage?.score || 0,
    researchAlignment: metrics.researchAlignment?.score || 0,
    automatedOverall: qualityData.overallScore || qualityData.automatedOverallScore || 0,
    finalOverall: scoreDetails?.finalScore || 0,
    issues: extractAllIssues(metrics)
  };
}

/**
 * Extract content quality from evaluation
 * Aggregates quality across all properties
 * 
 * @param {Object} evaluation - Evaluation object
 * @returns {Object} Aggregated content quality scores
 */
export function extractContentQuality(evaluation) {
  const contentQuality = evaluation?.evaluationMetrics?.quality?.content;
  if (!contentQuality) return null;
  
  // Content quality is property-level
  const properties = Object.keys(contentQuality);
  
  if (properties.length === 0) return null;

  const aggregated = properties.reduce((acc, prop) => {
    const propQuality = contentQuality[prop];
    
    // Property-level quality dimensions
    acc.completeness.push(propQuality.completeness?.score || 0);
    acc.consistency.push(propQuality.consistency?.score || 0);
    acc.validity.push(propQuality.validity?.score || 0);
    acc.overall.push(propQuality.overallScore || 0);
    
    // Collect issues
    if (propQuality.completeness?.issues) {
      acc.issues.push(...propQuality.completeness.issues);
    }
    if (propQuality.consistency?.issues) {
      acc.issues.push(...propQuality.consistency.issues);
    }
    if (propQuality.validity?.issues) {
      acc.issues.push(...propQuality.validity.issues);
    }
    
    return acc;
  }, { 
    completeness: [], 
    consistency: [], 
    validity: [], 
    overall: [],
    issues: [] 
  });
  
  return {
    propertyCoverage: avg(aggregated.completeness),
    evidenceQuality: avg(aggregated.consistency),
    valueAccuracy: avg(aggregated.validity),
    overall: avg(aggregated.overall),
    propertyCount: properties.length,
    issueCount: aggregated.issues.length,
    issues: aggregated.issues
  };
}

/**
 * Extract field-level metadata quality details
 * Used for detailed field-by-field analysis
 * 
 * Handles both display names ("Authors Extraction") and internal names ("authors")
 * 
 * @param {Object} evaluation - Evaluation object
 * @returns {Object} Field-level quality details
 */
export function extractMetadataFieldQuality(evaluation) {
  const metadataQuality = evaluation?.evaluationMetrics?.quality?.metadata;
  if (!metadataQuality) return null;
  
  // Map internal field names to display names used in evaluation objects
  const fieldMapping = {
    'title': 'Title Extraction',
    'authors': 'Authors Extraction',
    'doi': 'DOI Extraction',
    'publication_year': 'Publication Date',
    'venue': 'Venue/Journal'
  };
  
  const fields = ['title', 'authors', 'doi', 'publication_year', 'venue'];
  
  return fields.reduce((acc, field) => {
    // Try display name first, fall back to internal name
    const displayName = fieldMapping[field];
    const fieldData = metadataQuality[displayName] || metadataQuality[field];
    
    if (fieldData && fieldData.qualityData) {
      const qualityData = fieldData.qualityData;
      const metrics = qualityData.fieldSpecificMetrics;
      
      acc[field] = {
        completeness: metrics?.completeness?.score || 0,
        consistency: metrics?.consistency?.score || 0,
        validity: metrics?.validity?.score || 0,
        overall: qualityData.overallScore || qualityData.automatedOverallScore || 0,
        finalScore: fieldData.scoreDetails?.finalScore || 0,
        rating: fieldData.rating,
        issues: {
          completeness: metrics?.completeness?.issues || [],
          consistency: metrics?.consistency?.issues || [],
          validity: metrics?.validity?.issues || []
        },
        explanation: qualityData.explanation || {}
      };
    } else {
      acc[field] = null;
    }
    return acc;
  }, {});
}

/**
 * Helper: Extract all issues from quality metrics
 * @param {Object} metrics - Field-specific metrics object
 * @returns {Array} Flat array of all issues
 */
function extractAllIssues(metrics) {
  if (!metrics) return [];
  
  return Object.values(metrics)
    .flatMap(metric => metric.issues || [])
    .filter(issue => issue); // Remove empty/null
}

/**
 * Helper: Calculate average of an array of numbers
 * @param {Array} values - Array of numbers
 * @returns {number} Average value or 0 if empty
 */
function avg(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}