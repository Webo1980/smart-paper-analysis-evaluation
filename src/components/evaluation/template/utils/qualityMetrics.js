// src/components/evaluation/template/utils/qualityMetrics.js
// COMPLETE IMPLEMENTATION - Template Quality Metrics Calculator

import { calculateStringSimilarity } from './stringUtils';
import { QUALITY_WEIGHTS, QUALITY_CRITERIA, getPropertyCategory } from '../config/templateConfig';

/**
 * Calculate Title Quality
 * Assesses the quality of the template title based on multiple factors
 */
export const calculateTitleQuality = (templateData, researchProblem) => {
  if (!templateData) return { score: 0, issues: ['No template data provided'], details: {} };
  
  const title = templateData.title || templateData.name || '';
  const titleLength = title.length;
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  
  const criteria = QUALITY_CRITERIA.title;
  
  // Check length (10-100 characters recommended)
  const hasGoodLength = titleLength >= criteria.lengthRange.min && titleLength <= criteria.lengthRange.max;
  
  // Check word count (2-15 words recommended)
  const hasGoodWordCount = wordCount >= criteria.wordCountRange.min && wordCount <= criteria.wordCountRange.max;
  
  // Check capitalization
  const startsWithCapital = /^[A-Z]/.test(title);
  
  // Calculate domain relevance if research problem is available
  let domainRelevance = 0;
  if (researchProblem?.title) {
    domainRelevance = calculateStringSimilarity(title, researchProblem.title);
  }
  
  // Calculate component scores
  const lengthScore = hasGoodLength ? 0.25 : (titleLength < criteria.lengthRange.min ? titleLength / criteria.lengthRange.min * 0.25 : 0.1);
  const wordCountScore = hasGoodWordCount ? 0.25 : (wordCount < criteria.wordCountRange.min ? wordCount / criteria.wordCountRange.min * 0.25 : 0.1);
  const capitalScore = startsWithCapital ? 0.10 : 0;
  const relevanceScore = domainRelevance * 0.4;
  
  const score = lengthScore + wordCountScore + capitalScore + relevanceScore;
  
  // Collect issues
  const issues = [];
  if (!hasGoodLength) {
    issues.push(`Title length (${titleLength} chars) is outside recommended range (${criteria.lengthRange.min}-${criteria.lengthRange.max} chars)`);
  }
  if (!hasGoodWordCount) {
    issues.push(`Title word count (${wordCount}) is outside recommended range (${criteria.wordCountRange.min}-${criteria.wordCountRange.max} words)`);
  }
  if (!startsWithCapital) {
    issues.push('Title should start with a capital letter');
  }
  if (domainRelevance < criteria.minDomainRelevance) {
    issues.push('Title has limited relevance to the research problem');
  }
  
  return {
    score,
    issues,
    details: {
      length: titleLength,
      wordCount,
      startsWithCapital,
      domainRelevance,
      hasGoodLength,
      hasGoodWordCount,
      componentScores: {
        lengthScore,
        wordCountScore,
        capitalScore,
        relevanceScore
      },
      titleReason: generateTitleReason(score, titleLength, wordCount, domainRelevance, hasGoodLength, hasGoodWordCount)
    }
  };
};

/**
 * Generate human-readable reason for title quality score
 */
const generateTitleReason = (score, length, wordCount, domainRelevance, hasGoodLength, hasGoodWordCount) => {
  if (score > 0.8) {
    return `High quality title with good length (${length} chars), appropriate word count (${wordCount}), and strong domain relevance (${Math.round(domainRelevance * 100)}%)`;
  } else if (score > 0.6) {
    return `Good quality title with ${hasGoodLength ? 'appropriate length' : 'length needs adjustment'} and ${hasGoodWordCount ? 'good word count' : 'word count could be improved'}`;
  } else if (score > 0.4) {
    return `Moderate quality title with some strengths but room for improvement in ${!hasGoodLength ? 'length, ' : ''}${!hasGoodWordCount ? 'word count, ' : ''}and domain relevance`;
  } else {
    return `Low quality title that needs significant improvement in structure, length, and domain relevance (${Math.round(domainRelevance * 100)}%)`;
  }
};

/**
 * Calculate Description Quality
 * Assesses the quality of the template description
 */
export const calculateDescriptionQuality = (templateData, researchProblem) => {
  if (!templateData) return { score: 0, issues: ['No template data provided'], details: {} };
  
  const description = templateData.description || '';
  const descLength = description.length;
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  const sentenceCount = description.split(/[.!?]+/).filter(Boolean).length;
  
  const criteria = QUALITY_CRITERIA.description;
  
  // Check length (30-500 characters recommended)
  const hasGoodLength = descLength >= criteria.lengthRange.min && descLength <= criteria.lengthRange.max;
  
  // Check word count (5-100 words recommended)
  const hasGoodWordCount = wordCount >= criteria.wordCountRange.min && wordCount <= criteria.wordCountRange.max;
  
  // Check structure (should have punctuation)
  const hasStructure = description.includes(".") || description.includes(",") || description.includes("!");
  
  // Check minimum sentences
  const hasSufficientSentences = sentenceCount >= criteria.minSentences;
  
  // Calculate domain relevance if research problem is available
  let domainRelevance = 0;
  if (researchProblem?.description) {
    domainRelevance = calculateStringSimilarity(description, researchProblem.description);
  }
  
  // Check for key information (mentions methodology, results, etc.)
  const hasMethodologyMention = /method|approach|technique|procedure/i.test(description);
  const hasContextMention = /research|study|problem|domain|field/i.test(description);
  const informationRichness = (hasMethodologyMention ? 0.5 : 0) + (hasContextMention ? 0.5 : 0);
  
  // Calculate component scores
  const lengthScore = hasGoodLength ? 0.20 : (descLength < criteria.lengthRange.min ? descLength / criteria.lengthRange.min * 0.20 : 0.10);
  const wordCountScore = hasGoodWordCount ? 0.15 : (wordCount < criteria.wordCountRange.min ? wordCount / criteria.wordCountRange.min * 0.15 : 0.08);
  const structureScore = (hasStructure ? 0.10 : 0) + (hasSufficientSentences ? 0.10 : 0);
  const relevanceScore = domainRelevance * 0.25;
  const richnessScore = informationRichness * 0.20;
  
  const score = lengthScore + wordCountScore + structureScore + relevanceScore + richnessScore;
  
  // Collect issues
  const issues = [];
  if (!hasGoodLength) {
    issues.push(`Description length (${descLength} chars) is outside recommended range (${criteria.lengthRange.min}-${criteria.lengthRange.max} chars)`);
  }
  if (!hasGoodWordCount) {
    issues.push(`Description word count (${wordCount}) is outside recommended range (${criteria.wordCountRange.min}-${criteria.wordCountRange.max} words)`);
  }
  if (!hasStructure) {
    issues.push('Description should have proper sentence structure with punctuation');
  }
  if (!hasSufficientSentences) {
    issues.push('Description should include at least one complete sentence');
  }
  if (domainRelevance < 0.3) {
    issues.push('Description has limited relevance to the research problem');
  }
  if (!hasMethodologyMention && !hasContextMention) {
    issues.push('Description should mention methodology or research context');
  }
  
  return {
    score,
    issues,
    details: {
      length: descLength,
      wordCount,
      sentenceCount,
      hasStructure,
      hasSufficientSentences,
      domainRelevance,
      informationRichness,
      hasMethodologyMention,
      hasContextMention,
      hasGoodLength,
      hasGoodWordCount,
      componentScores: {
        lengthScore,
        wordCountScore,
        structureScore,
        relevanceScore,
        richnessScore
      },
      descriptionReason: generateDescriptionReason(score, descLength, wordCount, domainRelevance, hasStructure)
    }
  };
};

/**
 * Generate human-readable reason for description quality score
 */
const generateDescriptionReason = (score, length, wordCount, domainRelevance, hasStructure) => {
  if (score > 0.8) {
    return `High quality description with appropriate length (${length} chars), good word count (${wordCount}), proper structure, and strong domain relevance (${Math.round(domainRelevance * 100)}%)`;
  } else if (score > 0.6) {
    return `Good quality description with ${hasStructure ? 'proper structure' : 'structure needs improvement'} and moderate domain relevance`;
  } else if (score > 0.4) {
    return `Moderate quality description that could benefit from better structure, more detail, and stronger domain relevance`;
  } else {
    return `Low quality description needing significant improvement in length, structure, detail, and domain relevance (${Math.round(domainRelevance * 100)}%)`;
  }
};

/**
 * Calculate Property Coverage
 * Assesses the completeness and appropriateness of template properties
 */
export const calculatePropertyCoverage = (templateData, researchProblem) => {
  if (!templateData || !templateData.properties) {
    return { score: 0, issues: ['No template properties provided'], details: {} };
  }
  
  const properties = templateData.properties;
  const propertyCount = properties.length;
  const criteria = QUALITY_CRITERIA.properties;
  
  // Check minimum property count
  const hasSufficientProperties = propertyCount >= criteria.minProperties;
  
  // Count required vs optional properties
  const requiredCount = properties.filter(p => p.required === true).length;
  const optionalCount = propertyCount - requiredCount;
  const hasRequiredProperties = requiredCount > 0;
  
  // Check property type variety
  const propertyTypes = new Set(properties.map(p => p.type).filter(Boolean));
  const typeVariety = propertyTypes.size;
  const hasVariedTypes = typeVariety >= 2;
  
  // Calculate property category distribution
  const categoryDistribution = properties.reduce((acc, prop) => {
    const category = getPropertyCategory(prop);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  const categoryCount = Object.keys(categoryDistribution).length;
  const hasBalancedCategories = categoryCount >= 3;
  
  // Check domain-specific property coverage
  const researchField = researchProblem?.field || 'default';
  const expectedProperties = criteria.expectedPropertyTypes[researchField] || criteria.expectedPropertyTypes.default;
  
  let domainPropertyMatches = 0;
  properties.forEach(prop => {
    const label = (prop.label || '').toLowerCase();
    if (expectedProperties.some(expected => label.includes(expected.toLowerCase()))) {
      domainPropertyMatches++;
    }
  });
  
  const domainCoverage = propertyCount > 0 ? domainPropertyMatches / propertyCount : 0;
  
  // Calculate component scores
  const countScore = hasSufficientProperties ? 0.25 : (propertyCount / criteria.minProperties * 0.25);
  const requiredScore = hasRequiredProperties ? 0.20 : 0;
  const varietyScore = hasVariedTypes ? 0.20 : (typeVariety / 2 * 0.20);
  const categoryScore = hasBalancedCategories ? 0.15 : (categoryCount / 3 * 0.15);
  const domainScore = domainCoverage * 0.20;
  
  const score = countScore + requiredScore + varietyScore + categoryScore + domainScore;
  
  // Collect issues
  const issues = [];
  if (!hasSufficientProperties) {
    issues.push(`Template has only ${propertyCount} properties, recommend at least ${criteria.minProperties}`);
  }
  if (!hasRequiredProperties) {
    issues.push('Template should have at least one required property');
  }
  if (!hasVariedTypes) {
    issues.push(`Template uses only ${typeVariety} property type(s), recommend variety`);
  }
  if (!hasBalancedCategories) {
    issues.push('Template properties lack category diversity (methodology, results, parameters, etc.)');
  }
  if (domainCoverage < 0.3) {
    issues.push(`Only ${Math.round(domainCoverage * 100)}% of properties are domain-specific for ${researchField}`);
  }
  
  return {
    score,
    issues,
    details: {
      propertyCount,
      requiredCount,
      optionalCount,
      typeVariety,
      categoryCount,
      categoryDistribution,
      domainCoverage,
      domainPropertyMatches,
      expectedProperties,
      hasSufficientProperties,
      hasRequiredProperties,
      hasVariedTypes,
      hasBalancedCategories,
      componentScores: {
        countScore,
        requiredScore,
        varietyScore,
        categoryScore,
        domainScore
      },
      coverageReason: generateCoverageReason(score, propertyCount, requiredCount, typeVariety, domainCoverage, researchField)
    }
  };
};

/**
 * Generate human-readable reason for property coverage score
 */
const generateCoverageReason = (score, propertyCount, requiredCount, typeVariety, domainCoverage, researchField) => {
  if (score > 0.8) {
    return `Excellent property coverage with ${propertyCount} properties (${requiredCount} required), ${typeVariety} distinct types, and strong domain-specific coverage (${Math.round(domainCoverage * 100)}%) for ${researchField}`;
  } else if (score > 0.6) {
    return `Good property coverage with ${propertyCount} properties and ${typeVariety} types, but could include more domain-specific properties for ${researchField}`;
  } else if (score > 0.4) {
    return `Moderate property coverage that needs more properties, better type variety, and stronger domain alignment for ${researchField}`;
  } else {
    return `Limited property coverage (${propertyCount} properties) needs significant expansion with more required fields, type variety, and domain-specific properties for ${researchField}`;
  }
};

/**
 * Calculate Research Alignment
 * Assesses how well the template aligns with the research problem
 */
export const calculateResearchAlignment = (templateData, researchProblem) => {
  if (!templateData || !researchProblem) {
    return { score: 0, issues: ['Missing template or research problem data'], details: {} };
  }
  
  // Calculate title similarity
  const templateTitle = templateData.title || templateData.name || '';
  const problemTitle = researchProblem.title || '';
  const titleSimilarity = calculateStringSimilarity(templateTitle, problemTitle);
  
  // Calculate description similarity
  const templateDescription = templateData.description || '';
  const problemDescription = researchProblem.description || '';
  const descriptionSimilarity = calculateStringSimilarity(templateDescription, problemDescription);
  
  // Calculate property alignment
  const properties = templateData.properties || [];
  const propertyNames = properties.map(p => (p.label || '').toLowerCase());
  
  // Extract keywords from research problem
  const problemText = `${problemTitle} ${problemDescription}`.toLowerCase();
  const problemWords = problemText.split(/\s+/).filter(word => word.length > 3);
  
  let propertyAlignment = 0;
  if (propertyNames.length > 0 && problemWords.length > 0) {
    let matchCount = 0;
    propertyNames.forEach(propName => {
      problemWords.forEach(word => {
        if (propName.includes(word) || word.includes(propName)) {
          matchCount++;
        }
      });
    });
    propertyAlignment = Math.min(1.0, matchCount / propertyNames.length);
  }
  
  // Calculate domain/field relevance
  const researchField = researchProblem.field || '';
  const fieldRelevance = researchField ? 
    calculateStringSimilarity(templateTitle, researchField) : 0;
  
  // Check for methodology alignment
  const methodologyKeywords = ['method', 'approach', 'technique', 'algorithm', 'model', 'framework'];
  const hasMethodologyAlignment = methodologyKeywords.some(keyword => 
    templateTitle.toLowerCase().includes(keyword) || 
    templateDescription.toLowerCase().includes(keyword)
  );
  
  // Check for topic coverage (does template mention key problem topics?)
  const topicKeywords = problemWords.filter(word => word.length > 4).slice(0, 10);
  let topicCoverage = 0;
  if (topicKeywords.length > 0) {
    const templateText = `${templateTitle} ${templateDescription} ${propertyNames.join(' ')}`.toLowerCase();
    const coveredTopics = topicKeywords.filter(keyword => templateText.includes(keyword));
    topicCoverage = coveredTopics.length / topicKeywords.length;
  }
  
  // Calculate component scores
  const titleScore = titleSimilarity * 0.25;
  const descriptionScore = descriptionSimilarity * 0.20;
  const propertyScore = propertyAlignment * 0.20;
  const fieldScore = fieldRelevance * 0.15;
  const methodologyScore = hasMethodologyAlignment ? 0.10 : 0;
  const topicScore = topicCoverage * 0.10;
  
  const score = titleScore + descriptionScore + propertyScore + fieldScore + methodologyScore + topicScore;
  
  // Collect issues
  const issues = [];
  if (titleSimilarity < 0.3) {
    issues.push('Template title shows limited alignment with research problem title');
  }
  if (descriptionSimilarity < 0.3) {
    issues.push('Template description does not align well with research problem description');
  }
  if (propertyAlignment < 0.2) {
    issues.push('Template properties do not reflect key concepts from the research problem');
  }
  if (fieldRelevance < 0.3 && researchField) {
    issues.push(`Template shows limited relevance to research field: ${researchField}`);
  }
  if (!hasMethodologyAlignment) {
    issues.push('Template does not clearly indicate methodology or approach alignment');
  }
  if (topicCoverage < 0.3) {
    issues.push('Template covers few key topics from the research problem');
  }
  
  return {
    score,
    issues,
    details: {
      titleSimilarity,
      descriptionSimilarity,
      propertyAlignment,
      fieldRelevance,
      hasMethodologyAlignment,
      topicCoverage,
      topicKeywords,
      componentScores: {
        titleScore,
        descriptionScore,
        propertyScore,
        fieldScore,
        methodologyScore,
        topicScore
      },
      alignmentReason: generateAlignmentReason(score, titleSimilarity, descriptionSimilarity, propertyAlignment, topicCoverage)
    }
  };
};

/**
 * Generate human-readable reason for research alignment score
 */
const generateAlignmentReason = (score, titleSim, descSim, propAlign, topicCov) => {
  if (score > 0.8) {
    return `Excellent alignment with strong title similarity (${Math.round(titleSim * 100)}%), description alignment (${Math.round(descSim * 100)}%), property relevance (${Math.round(propAlign * 100)}%), and topic coverage (${Math.round(topicCov * 100)}%)`;
  } else if (score > 0.6) {
    return `Good alignment with moderate title similarity (${Math.round(titleSim * 100)}%) and reasonable property alignment, but could improve topic coverage`;
  } else if (score > 0.4) {
    return `Moderate alignment showing some relevance but needs improvement in title/description similarity and property-problem alignment`;
  } else {
    return `Limited alignment with low similarity scores (title: ${Math.round(titleSim * 100)}%, description: ${Math.round(descSim * 100)}%) and weak property-problem correspondence`;
  }
};

/**
 * Process Complete Template Quality Metrics
 * Main function that combines all quality dimensions
 */
export const processTemplateQualityMetrics = (templateData, researchProblem) => {
  if (!templateData) {
    return {
      qualityData: null,
      titleQuality: null,
      descriptionQuality: null,
      propertyCoverage: null,
      researchAlignment: null,
      error: 'No template data provided'
    };
  }
  
  // Calculate individual quality dimensions
  const titleQuality = calculateTitleQuality(templateData, researchProblem);
  const descriptionQuality = calculateDescriptionQuality(templateData, researchProblem);
  const propertyCoverage = calculatePropertyCoverage(templateData, researchProblem);
  const researchAlignment = calculateResearchAlignment(templateData, researchProblem);
  
  // Calculate weighted overall score
  const automatedOverallScore = (
    (titleQuality.score * QUALITY_WEIGHTS.titleQuality) +
    (descriptionQuality.score * QUALITY_WEIGHTS.descriptionQuality) +
    (propertyCoverage.score * QUALITY_WEIGHTS.propertyCoverage) +
    (researchAlignment.score * QUALITY_WEIGHTS.researchAlignment)
  );
  
  // Combine all issues
  const allIssues = [
    ...titleQuality.issues,
    ...descriptionQuality.issues,
    ...propertyCoverage.issues,
    ...researchAlignment.issues
  ];
  
  // Generate overall assessment
  const overallAssessment = generateOverallAssessment(
    automatedOverallScore,
    titleQuality.score,
    descriptionQuality.score,
    propertyCoverage.score,
    researchAlignment.score
  );
  
  return {
    qualityData: {
      fieldSpecificMetrics: {
        titleQuality: { 
          score: titleQuality.score, 
          issues: titleQuality.issues,
          details: titleQuality.details
        },
        descriptionQuality: { 
          score: descriptionQuality.score, 
          issues: descriptionQuality.issues,
          details: descriptionQuality.details
        },
        propertyCoverage: { 
          score: propertyCoverage.score, 
          issues: propertyCoverage.issues,
          details: propertyCoverage.details
        },
        researchAlignment: { 
          score: researchAlignment.score, 
          issues: researchAlignment.issues,
          details: researchAlignment.details
        }
      },
      weights: QUALITY_WEIGHTS,
      overallScore: automatedOverallScore,
      automatedOverallScore,
      allIssues,
      overallAssessment,
      details: {
        titleReason: titleQuality.details?.titleReason,
        descriptionReason: descriptionQuality.details?.descriptionReason,
        coverageReason: propertyCoverage.details?.coverageReason,
        alignmentReason: researchAlignment.details?.alignmentReason
      }
    },
    titleQuality,
    descriptionQuality,
    propertyCoverage,
    researchAlignment
  };
};

/**
 * Generate overall quality assessment
 */
const generateOverallAssessment = (overallScore, titleScore, descScore, propScore, alignScore) => {
  const scores = { titleScore, descScore, propScore, alignScore };
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const strengths = sortedScores.slice(0, 2).map(s => s[0]);
  const weaknesses = sortedScores.slice(2).map(s => s[0]);
  
  let assessment = '';
  
  if (overallScore > 0.8) {
    assessment = `Excellent template quality (${Math.round(overallScore * 100)}%). `;
    assessment += `Particularly strong in ${formatDimensionName(strengths[0])} and ${formatDimensionName(strengths[1])}. `;
  } else if (overallScore > 0.6) {
    assessment = `Good template quality (${Math.round(overallScore * 100)}%). `;
    assessment += `Shows strength in ${formatDimensionName(strengths[0])}. `;
    assessment += `Consider improving ${formatDimensionName(weaknesses[0])}.`;
  } else if (overallScore > 0.4) {
    assessment = `Moderate template quality (${Math.round(overallScore * 100)}%). `;
    assessment += `Needs improvement in ${formatDimensionName(weaknesses[0])} and ${formatDimensionName(weaknesses[1])}.`;
  } else {
    assessment = `Template quality needs significant improvement (${Math.round(overallScore * 100)}%). `;
    assessment += `Focus on enhancing all dimensions, especially ${formatDimensionName(weaknesses[0])}.`;
  }
  
  return assessment;
};

/**
 * Format dimension names for display
 */
const formatDimensionName = (key) => {
  const names = {
    titleScore: 'title quality',
    descScore: 'description quality',
    propScore: 'property coverage',
    alignScore: 'research alignment'
  };
  return names[key] || key;
};