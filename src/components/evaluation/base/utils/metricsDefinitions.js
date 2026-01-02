// src\components\evaluation\base\utils\metricsDefinitions.js
/**
 * Standard definitions for metrics across all evaluation types
 * Provides consistent explanations and descriptions
 */

/**
 * Base accuracy metric definitions
 * Can be extended for specific evaluation types
 */
export const baseAccuracyMetricDefinitions = {
  precision: (refSpan, extractedSpan) => `
    Shows how accurate the extracted value ${extractedSpan} is compared to the reference value ${refSpan}. 
    Precision measures what percentage of the extracted content is correct.
  `,
  recall: (refSpan, extractedSpan) => `
    Measures if all parts of ${refSpan} were found in ${extractedSpan}. 
    Recall indicates what percentage of the original content was successfully extracted.
  `,
  f1Score: (refSpan, extractedSpan) => `
    Combined measure of accuracy (precision) and completeness (recall) between ${refSpan} and ${extractedSpan}. 
    F1 score balances both metrics to provide a single evaluation metric.
  `
};

/**
 * Base quality metric definitions
 * Can be extended for specific evaluation types
 */
export const baseQualityMetricDefinitions = {
  completeness: (refSpan, extractedSpan, fieldName) => `
    <p>Completeness measures whether all required information is present in the extracted value, compared to the reference value.</p>
    <p class="mt-1">For ${fieldName}, this evaluates whether ${extractedSpan} contains all the necessary information that should be present in ${refSpan}.</p>
    <p class="mt-1 font-medium">Examples of completeness issues:</p>
    <ul class="list-disc list-inside mt-1">
      <li>Missing required fields</li>
      <li>Truncated information</li>
      <li>Partial data extraction</li>
      <li>Incomplete field values</li>
    </ul>
  `,
  consistency: (refSpan, extractedSpan, fieldName) => `
    <p>Consistency evaluates the uniform formatting and structure in the extracted value.</p>
    <p class="mt-1">For ${fieldName}, this measures whether ${extractedSpan} maintains consistent formatting that matches standard conventions.</p>
    <p class="mt-1 font-medium">Examples of consistency issues:</p>
    <ul class="list-disc list-inside mt-1">
      <li>Mixed date formats</li>
      <li>Inconsistent naming conventions</li>
      <li>Irregular spacing or delimiters</li>
      <li>Mixing of abbreviations and full names</li>
    </ul>
  `,
  validity: (refSpan, extractedSpan, fieldName) => `
    <p>Validity checks if the extracted value conforms to the expected format and range for this field type.</p>
    <p class="mt-1">For ${fieldName}, this evaluates whether ${extractedSpan} follows the proper format expected for this type of data.</p>
    <p class="mt-1 font-medium">Examples of validity issues:</p>
    <ul class="list-disc list-inside mt-1">
      <li>Values outside expected ranges</li>
      <li>Incorrect data types</li>
      <li>Invalid format patterns</li>
      <li>Nonsensical or unrealistic values</li>
    </ul>
  `,
  overallQuality: (refSpan, extractedSpan) => `
    <p>Overall Quality combines multiple quality dimensions to provide a comprehensive quality assessment.</p>
    <p class="mt-1">This evaluates the overall usability and reliability of the extracted data by considering completeness, consistency, and validity together.</p>
    <p class="mt-1">High overall quality means the data is complete, consistently formatted, and valid according to field standards.</p>
  `
};

/**
 * Generate standard accuracy concept explanation
 */
export const generateAccuracyConceptExplanation = (metricType, tokenData, analysisData) => {
  if (!tokenData) return null;
  
  // Import calculateF1Score from baseMetricsUtils without creating circular dependency
  const calculateF1 = (precision, recall) => {
    if (precision + recall <= 0) return 0;
    return 2 * (precision * recall) / (precision + recall);
  };
  
  // Calculate metrics directly from token data
  const precisionScore = tokenData.tokenMatchCount / (tokenData.extractedTokens?.length || 1);
  const recallScore = tokenData.tokenMatchCount / (tokenData.originalTokens?.length || 1);
  const f1Score = calculateF1(precisionScore, recallScore);
  
  // Update analysis data with calculated scores
  if (analysisData && typeof analysisData === 'object') {
    analysisData.precisionScore = precisionScore;
    analysisData.recallScore = recallScore;
    analysisData.f1Score = f1Score;
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
        `Precision = ${tokenData.tokenMatchCount} / ${tokenData.extractedTokens.length} = ${(tokenData.tokenMatchCount / (tokenData.extractedTokens.length || 1)).toFixed(2)}` :
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
        `Recall = ${tokenData.tokenMatchCount} / ${tokenData.originalTokens.length} = ${(tokenData.tokenMatchCount / (tokenData.originalTokens.length || 1)).toFixed(2)}` :
        ''
    };
  } else if (metricType === 'f1Score') {
    return {
      title: 'Understanding F1 Score:',
      description: 'F1 Score is the harmonic mean of precision and recall.',
      formula: 'F1 Score = 2 × (Precision × Recall) / (Precision + Recall)',
      example: tokenData ?
        `With Precision ${precisionScore.toFixed(2)} and Recall ${recallScore.toFixed(2)}, F1 = 2 × (${precisionScore.toFixed(2)} × ${recallScore.toFixed(2)}) / (${precisionScore.toFixed(2)} + ${recallScore.toFixed(2)}) = ${f1Score.toFixed(2)}` :
        'If Precision is 60% and Recall is 80%, F1 = 2 × (0.6 × 0.8) / (0.6 + 0.8) = 0.69 = 69%',
      calculation: 'The F1 score balances precision and recall to provide a single metric that works well even when the classes are imbalanced.'
    };
  }
  return null;
};

/**
 * Generate standard quality concept explanation
 */
export const generateQualityConceptExplanation = (metricType, qualityData) => {
  if (!qualityData) return null;
  
  if (metricType === 'completeness') {
    return {
      title: 'Understanding Completeness:',
      description: 'Completeness measures if all required information is present in the extracted value.',
      score: qualityData.fieldSpecificMetrics?.completeness?.score,
      issues: qualityData.fieldSpecificMetrics?.completeness?.issues,
      calculation: 'Completeness Score = field-specific evaluation based on content analysis'
    };
  } else if (metricType === 'consistency') {
    return {
      title: 'Understanding Consistency:',
      description: 'Consistency measures if information follows a uniform format throughout.',
      score: qualityData.fieldSpecificMetrics?.consistency?.score,
      issues: qualityData.fieldSpecificMetrics?.consistency?.issues,
      calculation: 'Consistency Score = field-specific evaluation based on format analysis'
    };
  } else if (metricType === 'validity') {
    return {
      title: 'Understanding Validity:',
      description: 'Validity measures if information conforms to expected formats and reasonable values.',
      score: qualityData.fieldSpecificMetrics?.validity?.score,
      issues: qualityData.fieldSpecificMetrics?.validity?.issues,
      calculation: 'Validity Score = field-specific evaluation based on standard conformance'
    };
  } else if (metricType === 'overallQuality') {
    const formatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    
    const completenessWeight = qualityData.weights?.completeness || 0.4;
    const consistencyWeight = qualityData.weights?.consistency || 0.3;
    const validityWeight = qualityData.weights?.validity || 0.3;
    
    const completenessScore = qualityData.fieldSpecificMetrics?.completeness?.score || 0;
    const consistencyScore = qualityData.fieldSpecificMetrics?.consistency?.score || 0;
    const validityScore = qualityData.fieldSpecificMetrics?.validity?.score || 0;
    
    return {
      title: 'Understanding Overall Quality:',
      description: 'Overall Quality combines completeness, consistency, and validity into a single metric.',
      calculation: `OverallQuality = (Completeness × ${formatter.format(completenessWeight)}) + (Consistency × ${formatter.format(consistencyWeight)}) + (Validity × ${formatter.format(validityWeight)}) = ${formatter.format(qualityData.overallScore || 0)}`
    };
  }
  return null;
};