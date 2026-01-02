// File: src/utils/dataAdapter.js

/**
 * Data Adapter Utility
 * Converts between aggregated and raw paper formats
 */

/**
 * Convert aggregated papers object to raw papers array
 * 
 * Input: { papers: { "id1": {...}, "id2": {...} } }
 * Output: [ {...}, {...} ]
 */
export function convertAggregatedToRawPapers(aggregatedData) {
  if (!aggregatedData) return [];
  
  // If already an array, return as-is
  if (Array.isArray(aggregatedData)) {
    return aggregatedData;
  }
  
  // If has papers property
  if (aggregatedData.papers) {
    // If papers is already an array
    if (Array.isArray(aggregatedData.papers)) {
      return aggregatedData.papers;
    }
    
    // If papers is an object, convert to array
    if (typeof aggregatedData.papers === 'object') {
      return Object.values(aggregatedData.papers);
    }
  }
  
  return [];
}

/**
 * Validate if papers array has required structure for MetadataAccuracyView
 */
export function validatePapersStructure(papers) {
  const validation = {
    isValid: false,
    isArray: false,
    hasData: false,
    hasEvaluations: false,
    hasMetadataAccuracy: false,
    hasSimilarityData: false,
    errors: [],
    warnings: []
  };
  
  // Check if array
  if (!Array.isArray(papers)) {
    validation.errors.push('Papers is not an array');
    return validation;
  }
  validation.isArray = true;
  
  // Check if has data
  if (papers.length === 0) {
    validation.errors.push('Papers array is empty');
    return validation;
  }
  validation.hasData = true;
  
  const firstPaper = papers[0];
  
  // Check if has userEvaluations
  if (!firstPaper.userEvaluations) {
    validation.errors.push('Papers missing userEvaluations property');
    return validation;
  }
  
  if (!Array.isArray(firstPaper.userEvaluations)) {
    validation.errors.push('userEvaluations is not an array');
    return validation;
  }
  
  if (firstPaper.userEvaluations.length === 0) {
    validation.errors.push('userEvaluations array is empty');
    return validation;
  }
  validation.hasEvaluations = true;
  
  // Check if has metadata accuracy
  const evaluation = firstPaper.userEvaluations[0];
  if (!evaluation.evaluationMetrics?.accuracy?.metadata) {
    validation.errors.push('Missing evaluationMetrics.accuracy.metadata');
    return validation;
  }
  validation.hasMetadataAccuracy = true;
  
  // Check if metadata has similarity data
  const metadata = evaluation.evaluationMetrics.accuracy.metadata;
  const fields = Object.keys(metadata);
  
  if (fields.length === 0) {
    validation.errors.push('Metadata object is empty');
    return validation;
  }
  
  // Check if any field has similarityData
  const hasSimilarity = fields.some(field => 
    metadata[field]?.similarityData
  );
  
  if (!hasSimilarity) {
    validation.errors.push('No field has similarityData');
    validation.warnings.push('Metadata fields: ' + fields.join(', '));
    return validation;
  }
  validation.hasSimilarityData = true;
  
  // All checks passed
  validation.isValid = true;
  
  // Add info warnings
  validation.warnings.push(`Found ${papers.length} papers`);
  validation.warnings.push(`Found ${fields.length} metadata fields: ${fields.join(', ')}`);
  
  return validation;
}

/**
 * Extract raw papers from various data formats
 * Handles multiple possible input formats
 */
export function extractRawPapers(data) {
  console.log('Extracting raw papers from data...');
  
  // Case 1: Already an array
  if (Array.isArray(data)) {
    console.log('✓ Data is already an array');
    return data;
  }
  
  // Case 2: Has papers property as array
  if (data?.papers && Array.isArray(data.papers)) {
    console.log('✓ Found papers as array in data.papers');
    return data.papers;
  }
  
  // Case 3: Has papers property as object (aggregated format)
  if (data?.papers && typeof data.papers === 'object') {
    console.log('✓ Found papers as object, converting to array');
    const papersArray = Object.values(data.papers);
    console.log(`  Converted ${papersArray.length} papers to array`);
    return papersArray;
  }
  
  // Case 4: Data itself might be papers object
  if (data && typeof data === 'object' && !data.papers && !data.components) {
    console.log('✓ Data appears to be papers object, converting to array');
    const papersArray = Object.values(data);
    console.log(`  Converted ${papersArray.length} items to array`);
    return papersArray;
  }
  
  console.warn('✗ Could not extract papers from data');
  return [];
}

/**
 * Log data structure for debugging
 */
export function logDataStructure(data, label = 'Data') {
  console.group(`📊 ${label} Structure`);
  
  console.log('Type:', Array.isArray(data) ? 'Array' : typeof data);
  
  if (Array.isArray(data)) {
    console.log('Length:', data.length);
    if (data.length > 0) {
      console.log('First item keys:', Object.keys(data[0]));
      console.log('First item sample:', data[0]);
    }
  } else if (typeof data === 'object' && data !== null) {
    console.log('Keys:', Object.keys(data));
    console.log('Sample:', data);
  }
  
  console.groupEnd();
}

/**
 * Create mock similarity data for testing when real data is missing
 */
export function createMockSimilarityData() {
  return {
    levenshtein: {
      score: 0.92,
      distance: 3,
      weightedScore: 0.46
    },
    tokenMatching: {
      score: 0.88,
      precision: 0.89,
      recall: 0.87,
      f1Score: 0.88,
      tokenMatchCount: 15,
      weightedScore: 0.264
    },
    specialChar: {
      score: 0.85
    },
    overallScore: 0.896
  };
}

/**
 * Add similarity data to papers if missing (for testing/demo)
 */
export function enrichPapersWithSimilarityData(papers) {
  if (!Array.isArray(papers)) return papers;
  
  return papers.map(paper => {
    if (!paper.userEvaluations) return paper;
    
    const enrichedEvaluations = paper.userEvaluations.map(evaluation => {
      if (!evaluation.evaluationMetrics?.accuracy?.metadata) return evaluation;
      
      const metadata = evaluation.evaluationMetrics.accuracy.metadata;
      const fields = ['Title Extraction', 'Authors Extraction', 'Extraction DOI', 'Venue/Journal'];
      
      const enrichedMetadata = {};
      
      fields.forEach(field => {
        if (metadata[field]) {
          enrichedMetadata[field] = {
            ...metadata[field],
            similarityData: metadata[field].similarityData || createMockSimilarityData()
          };
        }
      });
      
      return {
        ...evaluation,
        evaluationMetrics: {
          ...evaluation.evaluationMetrics,
          accuracy: {
            ...evaluation.evaluationMetrics.accuracy,
            metadata: enrichedMetadata
          }
        }
      };
    });
    
    return {
      ...paper,
      userEvaluations: enrichedEvaluations
    };
  });
}

export default {
  convertAggregatedToRawPapers,
  validatePapersStructure,
  extractRawPapers,
  logDataStructure,
  createMockSimilarityData,
  enrichPapersWithSimilarityData
};