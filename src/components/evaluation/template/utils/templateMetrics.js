// src\components\evaluation\template\utils\templateMetrics.js
import { calculateWeightsAndAgreement, formatPercentage } from '../../base/utils/baseMetricsUtils';
import { storeFieldMetrics } from '../../base/utils/storageUtils';
import { QUALITY_WEIGHTS, PROPERTY_ACCURACY_WEIGHTS } from '../config/templateConfig';

/**
 * Calculate similarity between two strings
 * @param {string} str1 First string
 * @param {string} str2 Second string
 * @returns {number} Similarity score (0-1)
 */
export const calculateStringSimilarity = (str1, str2) => {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;
  
  // Convert to lowercase for comparison
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Calculate Jaccard similarity
  const set1 = new Set(s1.split(/\s+/));
  const set2 = new Set(s2.split(/\s+/));
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calculate Jaccard similarity
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
};

/**
 * Calculate property match score
 * @param {Array} templateProperties Properties from template
 * @param {Array} referenceProperties Reference properties
 * @returns {Object} Match scores
 */
export const calculatePropertyMatch = (templateProperties, referenceProperties) => {
  if (!templateProperties || !referenceProperties) {
    return {
      exactMatch: 0,
      semanticMatch: 0,
      typeMatch: 0,
      precision: 0,
      recall: 0,
      f1Score: 0
    };
  }
  
  // Convert to arrays if needed
  const templateProps = Array.isArray(templateProperties) ? templateProperties : [];
  const referenceProps = Array.isArray(referenceProperties) ? referenceProperties : [];
  
  // Count exact matches
  let exactMatches = 0;
  let semanticMatches = 0;
  let typeMatches = 0;
  
  // For each template property, find best match in reference
  templateProps.forEach(tProp => {
    // Look for exact match
    const exactMatch = referenceProps.find(rProp => 
      rProp.label?.toLowerCase() === tProp.label?.toLowerCase()
    );
    
    if (exactMatch) {
      exactMatches++;
      
      // Check type match
      if (exactMatch.type === tProp.type) {
        typeMatches++;
      }
    } else {
      // Look for semantic match if no exact match
      const bestMatch = referenceProps.reduce((best, rProp) => {
        const similarity = calculateStringSimilarity(tProp.label, rProp.label);
        return similarity > best.similarity ? { prop: rProp, similarity } : best;
      }, { prop: null, similarity: 0 });
      
      // Count as semantic match if similarity is high enough
      if (bestMatch.similarity >= 0.5) {
        semanticMatches++;
        
        // Check type match
        if (bestMatch.prop.type === tProp.type) {
          typeMatches++;
        }
      }
    }
  });
  
  // Calculate precision, recall, and F1
  const precision = templateProps.length > 0 ? (exactMatches + semanticMatches) / templateProps.length : 0;
  const recall = referenceProps.length > 0 ? (exactMatches + semanticMatches) / referenceProps.length : 0;
  
  // Calculate F1 score
  let f1Score = 0;
  if (precision > 0 && recall > 0) {
    f1Score = 2 * (precision * recall) / (precision + recall);
  }
  
  // Calculate proportional scores
  const exactMatchScore = referenceProps.length > 0 ? exactMatches / referenceProps.length : 0;
  const semanticMatchScore = referenceProps.length > 0 ? semanticMatches / referenceProps.length : 0;
  const typeMatchScore = (exactMatches + semanticMatches) > 0 ? 
    typeMatches / (exactMatches + semanticMatches) : 0;
  
  return {
    exactMatch: exactMatchScore,
    semanticMatch: semanticMatchScore,
    typeMatch: typeMatchScore,
    precision,
    recall,
    f1Score,
    exactMatches,
    semanticMatches,
    typeMatches,
    totalTemplateProps: templateProps.length,
    totalReferenceProps: referenceProps.length
  };
};

/**
 * Process template accuracy metrics
 * @param {string} fieldType Field type for storage
 * @param {Object} templateData Template data
 * @param {Object} referenceData Reference data (ORKG or research problem)
 * @param {number} rating User rating
 * @param {number} expertiseMultiplier Expertise multiplier
 * @returns {Object} Processed accuracy metrics
 */
export const processTemplateAccuracy = (
  fieldType,
  templateData,
  referenceData,
  rating,
  expertiseMultiplier
) => {
  // Calculate title match
  const titleSimilarity = calculateStringSimilarity(
    templateData?.title || templateData?.name,
    referenceData?.title || referenceData?.name
  );
  
  // Calculate property matches
  const propertyMatchResults = calculatePropertyMatch(
    templateData?.properties || [],
    referenceData?.properties || []
  );
  
  // Calculate automated overall score using weights
  const automatedOverallScore = (
    (titleSimilarity * 0.2) +
    (propertyMatchResults.f1Score * 0.6) +
    (propertyMatchResults.typeMatch * 0.2)
  );
  
  // Create similarity data object
  const similarityData = {
    titleMatch: titleSimilarity,
    propertyMatch: propertyMatchResults.f1Score,
    typeAccuracy: propertyMatchResults.typeMatch,
    precision: propertyMatchResults.precision,
    recall: propertyMatchResults.recall,
    f1Score: propertyMatchResults.f1Score,
    exactMatches: propertyMatchResults.exactMatches,
    semanticMatches: propertyMatchResults.semanticMatches,
    typeMatches: propertyMatchResults.typeMatches,
    totalTemplateProps: propertyMatchResults.totalTemplateProps,
    totalReferenceProps: propertyMatchResults.totalReferenceProps,
    automatedOverallScore,
    overallScore: automatedOverallScore
  };
  
  // Calculate score details with weights and agreement
  const scoreDetails = calculateWeightsAndAgreement(
    automatedOverallScore,
    rating,
    expertiseMultiplier
  );
  
  // Store metrics for later reference
  // Note: rating and expertiseMultiplier are stored separately under overall.template.userRating
  storeFieldMetrics(
    fieldType,
    'accuracy',
    {
      similarityData,
      scoreDetails
    },
    'template'
  );
  
  return {
    similarityData,
    scoreDetails
  };
};

/**
 * Calculate template quality based on various dimensions
 * @param {Object} templateData Template data
 * @param {Object} researchProblem Research problem data for alignment check
 * @returns {Object} Quality metrics
 */
export const calculateTemplateQuality = (templateData, researchProblem) => {
  if (!templateData) {
    return {
      titleAccuracy: 0,
      descriptionQuality: 0,
      propertyCoverage: 0,
      researchAlignment: 0,
      details: {
        titleReason: "No template data provided",
        descriptionReason: "No template data provided",
        coverageReason: "No template data provided",
        alignmentReason: "No template data provided"
      }
    };
  }
  
  // Calculate title quality score (clarity and domain relevance)
  let titleAccuracy = 0;
  let titleReason = "Title quality could not be evaluated";
  
  if (templateData.title || templateData.name) {
    const title = templateData.title || templateData.name;
    const titleLength = title.length;
    const wordCount = title.split(/\s+/).length;
    
    // Title quality factors
    const hasGoodLength = titleLength >= 10 && titleLength <= 100;
    const hasGoodWordCount = wordCount >= 2 && wordCount <= 15;
    
    // Calculate title quality score
    titleAccuracy = (hasGoodLength ? 0.5 : 0.2) + (hasGoodWordCount ? 0.5 : 0.2);
    
    // Generate reason
    titleReason = hasGoodLength && hasGoodWordCount
      ? "Title has appropriate length and word count for a template"
      : !hasGoodLength
        ? "Title length is not optimal for a template (should be 10-100 characters)"
        : "Title word count is not optimal for a template (should be 2-15 words)";
  }
  
  // Calculate description quality score
  let descriptionQuality = 0;
  let descriptionReason = "Description quality could not be evaluated";
  
  if (templateData.description) {
    const description = templateData.description;
    const descLength = description.length;
    
    // Description quality factors
    const hasGoodLength = descLength >= 20 && descLength <= 500;
    const hasPunctuation = /[.!?]/.test(description);
    const hasDetailedInfo = descLength > 50;
    
    // Calculate description quality score
    descriptionQuality = (hasGoodLength ? 0.4 : 0.1) + 
                        (hasPunctuation ? 0.3 : 0.1) + 
                        (hasDetailedInfo ? 0.3 : 0.1);
    
    // Generate reason
    descriptionReason = hasGoodLength && hasPunctuation && hasDetailedInfo
      ? "Description is clear, well-structured, and detailed"
      : !hasGoodLength
        ? "Description length is not optimal (should be 20-500 characters)"
        : !hasPunctuation
          ? "Description lacks proper punctuation"
          : "Description lacks sufficient detail";
  }
  
  // Calculate property coverage score
  let propertyCoverage = 0;
  let coverageReason = "Property coverage could not be evaluated";
  
  if (templateData.properties) {
    const properties = templateData.properties;
    const propCount = properties.length;
    
    // Property coverage factors
    const hasMinProps = propCount >= 3;
    const hasMaxProps = propCount <= 20;
    const hasVariedTypes = new Set(properties.map(p => p.type)).size > 1;
    
    // Calculate property coverage score
    propertyCoverage = (hasMinProps ? 0.4 : 0.1) + 
                      (hasMaxProps ? 0.3 : 0.2) + 
                      (hasVariedTypes ? 0.3 : 0.1);
    
    // Generate reason
    coverageReason = hasMinProps && hasMaxProps && hasVariedTypes
      ? `Template has ${propCount} properties with good variety of types`
      : !hasMinProps
        ? `Template has too few properties (${propCount}, should be at least 3)`
        : !hasMaxProps
          ? `Template has too many properties (${propCount}, should be at most 20)`
          : "Template lacks variety in property types";
  }
  
  // Calculate research alignment score
  let researchAlignment = 0;
  let alignmentReason = "Research alignment could not be evaluated";
  
  if (researchProblem && templateData.properties) {
    // Check if template properties align with research problem
    const problemText = (researchProblem.title || '') + ' ' + (researchProblem.description || '');
    const problemWords = new Set(problemText.toLowerCase().split(/\s+/));
    
    // Count properties that have words matching the problem
    let matchingProps = 0;
    templateData.properties.forEach(prop => {
      const propWords = (prop.label || '').toLowerCase().split(/\s+/);
      if (propWords.some(word => problemWords.has(word))) {
        matchingProps++;
      }
    });
    
    // Calculate alignment score
    const alignmentRatio = templateData.properties.length > 0 
      ? matchingProps / templateData.properties.length 
      : 0;
    
    researchAlignment = alignmentRatio;
    
    // Generate reason
    alignmentReason = alignmentRatio > 0.5
      ? `${matchingProps} out of ${templateData.properties.length} properties align with research problem`
      : `Only ${matchingProps} out of ${templateData.properties.length} properties align with research problem`;
  }
  
  return {
    titleAccuracy,
    descriptionQuality, 
    propertyCoverage,
    researchAlignment,
    details: {
      titleReason,
      descriptionReason,
      coverageReason,
      alignmentReason
    }
  };
};

/**
 * Check domain-specific properties in template
 * @param {Array} properties Template properties
 * @param {string} domain Research domain
 * @returns {Object} Score and reason
 */
export const checkDomainSpecificProperties = (properties, domain) => {
  if (!properties || !domain) {
    return { score: 0, reason: "Missing properties or domain" };
  }
  
  // Domain-specific expected property types
  const domainPropertyTypesMap = {
    "Computer Science": ["method", "algorithm", "code", "dataset", "performance", "complexity"],
    "Biomedical": ["sample", "patient", "tissue", "gene", "protein", "treatment", "drug"],
    "Physics": ["measurement", "equation", "theory", "experiment", "model", "energy", "particle"],
    "Chemistry": ["compound", "reaction", "molecule", "element", "solution", "concentration"],
    "Psychology": ["participant", "survey", "questionnaire", "response", "behavior", "control"],
    "default": ["method", "result", "data", "analysis", "conclusion"]
  };
  
  // Get expected property types for domain
  const expectedTypes = domainPropertyTypesMap[domain] || domainPropertyTypesMap.default;
  
  // Count matching properties
  let matchCount = 0;
  
  properties.forEach(prop => {
    if (!prop.label) return;
    
    const propLabel = prop.label.toLowerCase();
    if (expectedTypes.some(type => propLabel.includes(type.toLowerCase()))) {
      matchCount++;
    }
  });
  
  // Calculate score
  const score = properties.length > 0 ? matchCount / Math.min(properties.length, expectedTypes.length) : 0;
  
  // Generate reason
  const reason = score > 0.7
    ? `Template contains ${matchCount} domain-specific properties (${domain})`
    : `Template is missing some expected ${domain} properties`;
  
  return { score, reason };
};

/**
 * Process template quality evaluation
 * @param {string} fieldType Field type for storage
 * @param {Object} templateData Template data
 * @param {Object} researchProblem Research problem data
 * @param {number} rating User rating
 * @param {number} expertiseMultiplier Expertise multiplier
 * @returns {Object} Processed quality metrics
 */
export const processTemplateQuality = (
  fieldType,
  templateData,
  researchProblem,
  rating,
  expertiseMultiplier
) => {
  // Calculate quality metrics
  const qualityMetrics = calculateTemplateQuality(templateData, researchProblem);
  
  // Calculate automated overall score
  const automatedOverallScore = (
    (qualityMetrics.titleAccuracy * QUALITY_WEIGHTS.titleAccuracy) +
    (qualityMetrics.descriptionQuality * QUALITY_WEIGHTS.descriptionQuality) +
    (qualityMetrics.propertyCoverage * QUALITY_WEIGHTS.propertyCoverage) +
    (qualityMetrics.researchAlignment * QUALITY_WEIGHTS.researchAlignment)
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
      titleAccuracy: { 
        score: qualityMetrics.titleAccuracy,
        issues: [qualityMetrics.details.titleReason]
      },
      descriptionQuality: { 
        score: qualityMetrics.descriptionQuality,
        issues: [qualityMetrics.details.descriptionReason]
      },
      propertyCoverage: { 
        score: qualityMetrics.propertyCoverage,
        issues: [qualityMetrics.details.coverageReason]
      },
      researchAlignment: { 
        score: qualityMetrics.researchAlignment,
        issues: [qualityMetrics.details.alignmentReason]
      }
    },
    weights: QUALITY_WEIGHTS,
    overallScore: automatedOverallScore,
    automatedOverallScore,
    details: qualityMetrics.details
  };
  
  // Store quality metrics for later reference
  // Note: rating and expertiseMultiplier are stored separately under overall.template.userRating
  storeFieldMetrics(
    fieldType,
    'quality',
    {
      qualityData,
      qualityMetrics,
      weights: QUALITY_WEIGHTS,
      scoreDetails
    },
    'template'
  );
  
  return {
    qualityData,
    scoreDetails
  };
};

/**
 * Store user rating and comments for template evaluation
 * This groups all user inputs under overall.template.userRating
 * @param {Object} userAssessment User assessment data
 * @param {number} expertiseMultiplier Expertise multiplier
 */
export const storeTemplateUserRating = (userAssessment, expertiseMultiplier) => {
  console.log('=== storeTemplateUserRating called ===');
  console.log('userAssessment received:', JSON.stringify(userAssessment, null, 2));
  console.log('expertiseMultiplier:', expertiseMultiplier);
  
  // Helper function to safely extract rating value
  const getRating = (field) => {
    if (!field) return 0;
    // If field is a number, return it directly
    if (typeof field === 'number') return field;
    // If field is an object with rating property, return rating
    if (typeof field === 'object' && 'rating' in field) return field.rating || 0;
    return 0;
  };
  
  // Helper function to safely extract comments value
  const getComments = (field, fieldName) => {
    if (!field) {
      // Check if there's a separate comments field like titleAccuracyComments
      return userAssessment[`${fieldName}Comments`] || '';
    }
    // If field is a string, return it
    if (typeof field === 'string') return field;
    // If field is an object with comments property, return comments
    if (typeof field === 'object' && 'comments' in field) return field.comments || '';
    // Check for separate comments field
    return userAssessment[`${fieldName}Comments`] || '';
  };
  
  const userRatingData = {
    // Accuracy ratings
    titleAccuracy: getRating(userAssessment.titleAccuracy),
    titleAccuracyComments: getComments(userAssessment.titleAccuracy, 'titleAccuracy'),
    
    // Quality ratings
    descriptionQuality: getRating(userAssessment.descriptionQuality),
    descriptionQualityComments: getComments(userAssessment.descriptionQuality, 'descriptionQuality'),
    
    propertyCoverage: getRating(userAssessment.propertyCoverage),
    propertyCoverageComments: getComments(userAssessment.propertyCoverage, 'propertyCoverage'),
    
    researchAlignment: getRating(userAssessment.researchAlignment),
    researchAlignmentComments: getComments(userAssessment.researchAlignment, 'researchAlignment'),
    
    // Overall rating
    overall: getRating(userAssessment.overall),
    overallComments: getComments(userAssessment.overall, 'overall'),
    
    // Metadata
    expertiseMultiplier,
    timestamp: new Date().toISOString()
  };
  
  console.log('userRatingData to store:', JSON.stringify(userRatingData, null, 2));
  
  // Store under overall.template.userRating using direct localStorage access
  try {
    const storageKey = 'evaluation_metrics';
    const existingMetrics = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Ensure nested structure exists
    if (!existingMetrics.overall) {
      existingMetrics.overall = {};
    }
    if (!existingMetrics.overall.template) {
      existingMetrics.overall.template = {};
    }
    
    // CRITICAL FIX: Only preserve specific nested objects, remove everything else
    const keysToPreserve = ['userRating', 'accuracy', 'quality'];
    const currentTemplate = existingMetrics.overall.template;
    
    // Create a clean template object with only the preserved keys
    const cleanedTemplate = {};
    keysToPreserve.forEach(key => {
      if (currentTemplate[key]) {
        cleanedTemplate[key] = currentTemplate[key];
      }
    });
    
    // Replace the entire template object with the cleaned version
    existingMetrics.overall.template = cleanedTemplate;
    
    // Now store user ratings under the userRating key
    existingMetrics.overall.template.userRating = userRatingData;
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(existingMetrics));
    
    console.log('=== User ratings stored to overall.template.userRating ===');
    console.log('Full template structure:', JSON.stringify(existingMetrics.overall.template, null, 2));
    
    // Verify the storage location
    const verification = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (verification?.overall?.template?.userRating) {
      console.log('✓ Verification successful: Data is at overall.template.userRating');
    } else {
      console.error('✗ Verification failed: Data is not at expected location');
    }
    
    // Check if data exists directly under overall.template (which would be wrong)
    const currentKeys = Object.keys(verification?.overall?.template || {});
    const wrongLocationKeys = currentKeys.filter(key => !keysToPreserve.includes(key));
    if (wrongLocationKeys.length > 0) {
      console.warn('⚠ Warning: Found unexpected keys at overall.template level:', wrongLocationKeys);
    } else {
      console.log('✓ No unexpected keys found at overall.template level');
    }
    
  } catch (error) {
    console.error('Error storing user ratings:', error);
  }
  
  return userRatingData;
};

// Helper format function
export const formatPercent = (value) => {
  return formatPercentage(value);
};

// Format user rating for display
export const formatUserRating = (rating, expertiseMultiplier = 1) => {
  if (!rating) return '0';
  return typeof rating === 'number' ? rating.toFixed(1) : rating;
};