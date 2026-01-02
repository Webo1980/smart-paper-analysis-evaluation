//src\components\evaluation\metadata\utils\contentMetricsUtils.js
import { generateTextSimilarityData, calculateOverallQuality } from '../../base/utils/contentAnalysisUtils';
import { formatPercentage, agreementCalculation, calculateWeightsAndAgreement } from '../../base/utils/baseMetricsUtils';
import { storeMetrics } from '../../base/utils/storageUtils';

// Calculate F1 score from precision and recall
const calculateF1Score = (precision, recall) => {
  if (precision + recall <= 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
};

export const getAccuracyData = (fieldName, orkgValue, extractedValue) => {
  return generateTextSimilarityData(orkgValue, extractedValue);
};

export const getQualityData = (fieldName, orkgValue, extractedValue) => {
  // Skip processing if values are missing
  if (!orkgValue && !extractedValue) return null;
  
  // Calculate actual field metrics
  const completenessScore = !orkgValue ? 1.0 : 
    !extractedValue ? 0.1 :
    Math.min(extractedValue.length / Math.max(orkgValue.length, 1), 1.0);
    
  const consistencyScore = !orkgValue || !extractedValue ? 0.5 :
    orkgValue.toLowerCase() === extractedValue.toLowerCase() ? 1.0 : 0.7;
    
  // Field-specific validity checks
  let validityScore = 1.0;
  const issues = [];
  
  const fieldLower = fieldName?.toLowerCase() || '';
  if (fieldLower.includes('doi')) {
    const doiRegex = /^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/;
    validityScore = extractedValue && doiRegex.test(String(extractedValue)) ? 1.0 : 0.5;
    if (validityScore < 1.0) issues.push('DOI format is incorrect');
  } else if (fieldLower.includes('year')) {
    const yearRegex = /^\d{4}$/;
    validityScore = extractedValue && yearRegex.test(String(extractedValue)) ? 1.0 : 0.6;
    if (validityScore < 1.0) issues.push('Year format is not 4 digits');
  }
  
  const fieldMetrics = {
    completeness: { 
      score: completenessScore, 
      issues: completenessScore < 0.8 ? ['Content may be incomplete'] : [] 
    },
    consistency: { 
      score: consistencyScore, 
      issues: consistencyScore < 0.9 ? ['Format inconsistencies detected'] : [] 
    },
    validity: { 
      score: validityScore, 
      issues: validityScore < 0.9 ? issues.length ? issues : ['Value may not be valid'] : [] 
    }
  };
  
  const weights = { completeness: 0.4, consistency: 0.3, validity: 0.3 };
  const overallScore = (fieldMetrics.completeness.score * weights.completeness) +
                       (fieldMetrics.consistency.score * weights.consistency) +
                       (fieldMetrics.validity.score * weights.validity);
  
  return {
    fieldSpecificMetrics: fieldMetrics,
    weights,
    overallScore,
    explanation: {
      completeness: fieldMetrics.completeness.issues.length ? fieldMetrics.completeness.issues[0] : 'All required content present',
      consistency: fieldMetrics.consistency.issues.length ? fieldMetrics.consistency.issues[0] : 'Consistent formatting throughout',
      validity: fieldMetrics.validity.issues.length ? fieldMetrics.validity.issues[0] : 'Conforms to expected format'
    }
  };
};

// Metric definitions for different types
export const accuracyMetricDefinitions = {
  precision: (orkgSpan, extractedSpan) => `
    Shows how accurate the extracted value ${extractedSpan} is compared to the ORKG value ${orkgSpan}. 
    Precision measures what percentage of the extracted content is correct.
  `,
  recall: (orkgSpan, extractedSpan) => `
    Measures if all parts of ${orkgSpan} were found in ${extractedSpan}. 
    Recall indicates what percentage of the original content was successfully extracted.
  `,
  f1Score: (orkgSpan, extractedSpan) => `
    Combined measure of accuracy (precision) and completeness (recall) between ${orkgSpan} and ${extractedSpan}. 
    F1 score balances both metrics to provide a single evaluation metric.
  `
};

export const qualityMetricDefinitions = {
  completeness: (orkgSpan, extractedSpan, fieldName) => `
    <p>Completeness measures whether all required information is present in the extracted value, compared to the reference value.</p>
    <p class="mt-1">For ${fieldName}, this evaluates whether ${extractedSpan} contains all the necessary information that should be present in ${orkgSpan}.</p>
    <p class="mt-1 font-medium">Examples of completeness issues:</p>
    <ul class="list-disc list-inside mt-1">
      <li>Missing author names in a multi-author paper</li>
      <li>Truncated title</li>
      <li>Partial DOI string</li>
      <li>Missing volume/issue numbers in venue information</li>
    </ul>
  `,
  consistency: (orkgSpan, extractedSpan, fieldName) => `
    <p>Consistency evaluates the uniform formatting and structure in the extracted value.</p>
    <p class="mt-1">For ${fieldName}, this measures whether ${extractedSpan} maintains consistent formatting that matches standard conventions.</p>
    <p class="mt-1 font-medium">Examples of consistency issues:</p>
    <ul class="list-disc list-inside mt-1">
      <li>Mixed date formats (e.g., "2023-01-15" vs "Jan 15, 2023")</li>
      <li>Inconsistent author name formats (e.g., "Smith, J." vs "J. Smith")</li>
      <li>Irregular spacing or delimiters</li>
      <li>Mixing of abbreviations and full names</li>
    </ul>
  `,
  validity: (orkgSpan, extractedSpan, fieldName) => `
    <p>Validity checks if the extracted value conforms to the expected format and range for this field type.</p>
    <p class="mt-1">For ${fieldName}, this evaluates whether ${extractedSpan} follows the proper format expected for this type of metadata.</p>
    <p class="mt-1 font-medium">Examples of validity issues:</p>
    <ul class="list-disc list-inside mt-1">
      <li>DOI not following the 10.xxxx/yyyy format</li>
      <li>Publication year outside reasonable range</li>
      <li>Author names with invalid characters</li>
      <li>Venue information containing non-publication data</li>
    </ul>
  `,
  overallQuality: (orkgSpan, extractedSpan) => `
    <p>Overall Quality combines multiple quality dimensions to provide a comprehensive quality assessment.</p>
    <p class="mt-1">This evaluates the overall usability and reliability of the extracted metadata by considering completeness, consistency, and validity together.</p>
    <p class="mt-1">High overall quality means the metadata is complete, consistently formatted, and valid according to field standards.</p>
  `
};

// Helper functions for rendering concept explanations
export const renderAccuracyConceptExplanation = (metricType, tokenData, analysisData) => {
  if (!tokenData) return null;
  
  // Calculate metrics directly from token data and update analysisData
  if (tokenData) {
    const precisionScore = tokenData.tokenMatchCount / (tokenData.extractedTokens.length || 1);
    const recallScore = tokenData.tokenMatchCount / (tokenData.originalTokens.length || 1);
    const f1Score = calculateF1Score(precisionScore, recallScore);
    
    // Store calculated scores in analysisData to ensure consistency
    if (analysisData && typeof analysisData === 'object') {
      analysisData.precisionScore = precisionScore;
      analysisData.recallScore = recallScore;
      analysisData.f1Score = f1Score;
    }
  }
  
  if (metricType === 'precision') {
    return {
      title: 'Understanding Precision:',
      description: 'Precision measures the accuracy of extracted content.',
      formula: 'Precision = (True Positives) / (True Positives + False Positives)',
      example: tokenData ? 
        `Current extraction contains ${tokenData.tokenMatchCount} matching words out of ${tokenData.extractedTokens.length} total words.` : 
        'No data available for current document.',
      calculation: tokenData ? 
        `Precision = ${tokenData.tokenMatchCount} / ${tokenData.extractedTokens.length} = ${formatPercentage(tokenData.tokenMatchCount / (tokenData.extractedTokens.length || 1))}` :
        ''
    };
  } else if (metricType === 'recall') {
    return {
      title: 'Understanding Recall:',
      description: 'Recall measures how much of the original content was successfully extracted.',
      formula: 'Recall = (True Positives) / (True Positives + False Negatives)',
      example: tokenData ? 
        `Current extraction contains ${tokenData.tokenMatchCount} matching words out of ${tokenData.originalTokens.length} reference words.` : 
        'No data available for current document.',
      calculation: tokenData ? 
        `Recall = ${tokenData.tokenMatchCount} / ${tokenData.originalTokens.length} = ${formatPercentage(tokenData.tokenMatchCount / (tokenData.originalTokens.length || 1))}` :
        ''
    };
  } else if (metricType === 'f1Score') {
    // Use centralized calculation
    const precision = tokenData ? tokenData.tokenMatchCount / (tokenData.extractedTokens.length || 1) : 0;
    const recall = tokenData ? tokenData.tokenMatchCount / (tokenData.originalTokens.length || 1) : 0;
    const f1 = calculateF1Score(precision, recall);
    
    return {
      title: 'Understanding F1 Score:',
      description: 'F1 Score is the harmonic mean of precision and recall.',
      formula: 'F1 Score = 2 × (Precision × Recall) / (Precision + Recall)',
      example: tokenData ?
        `With Precision ${formatPercentage(precision)} and Recall ${formatPercentage(recall)}, F1 = 2 × (${precision.toFixed(2)} × ${recall.toFixed(2)}) / (${precision.toFixed(2)} + ${recall.toFixed(2)}) = ${f1.toFixed(2)} = ${formatPercentage(f1)}` :
        'If Precision is 60% and Recall is 80%, F1 = 2 × (0.6 × 0.8) / (0.6 + 0.8) = 0.69 = 69%',
      calculation: 'The F1 score balances precision and recall to provide a single metric that works well even when the classes are imbalanced.'
    };
  }
  return null;
};

export const renderQualityConceptExplanation = (metricType, qualityData) => {
  if (!qualityData) return null;
  
  if (metricType === 'completeness') {
    return {
      title: 'Understanding Completeness:',
      description: 'Completeness measures if all required information is present in the extracted value.',
      score: qualityData.fieldSpecificMetrics.completeness.score,
      issues: qualityData.fieldSpecificMetrics.completeness.issues,
      calculation: 'Completeness Score = field-specific evaluation based on content analysis'
    };
  } else if (metricType === 'consistency') {
    return {
      title: 'Understanding Consistency:',
      description: 'Consistency measures if information follows a uniform format throughout.',
      score: qualityData.fieldSpecificMetrics.consistency.score,
      issues: qualityData.fieldSpecificMetrics.consistency.issues,
      calculation: 'Consistency Score = field-specific evaluation based on format analysis'
    };
  } else if (metricType === 'validity') {
    return {
      title: 'Understanding Validity:',
      description: 'Validity measures if information conforms to expected formats and reasonable values.',
      score: qualityData.fieldSpecificMetrics.validity.score,
      issues: qualityData.fieldSpecificMetrics.validity.issues,
      calculation: 'Validity Score = field-specific evaluation based on standard conformance'
    };
  } else if (metricType === 'overallQuality') {
    return {
      title: 'Understanding Overall Quality:',
      description: 'Overall Quality combines completeness, consistency, and validity into a single metric.',
      calculation: `OverallQuality = (Completeness × 0.4) + (Consistency × 0.3) + (Validity × 0.3) = ${formatPercentage(qualityData.overallScore)}`
    };
  }
  return null;
};