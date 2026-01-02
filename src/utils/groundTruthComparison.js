// src/utils/groundTruthComparison.js

import { generateTextSimilarityData } from '../components/evaluation/base/utils/contentAnalysisUtils';

/**
 * Calculate text similarity score
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score (0-1)
 */
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();
  
  if (str1 === str2) return 1;
  
  // Use Jaccard similarity for text comparison
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Compare metadata fields
 * @param {Object} orkgData - ORKG ground truth data
 * @param {Object} systemData - System analysis data
 * @returns {Object} Metadata comparison results
 */
export const compareMetadata = (orkgData, systemData) => {
  if (!orkgData || !systemData || !systemData.metadata) {
    return null;
  }
  
  const metadata = systemData.metadata;
  const results = {};
  
  // Compare title
  results.title = {
    groundTruth: orkgData.title,
    extracted: metadata.title,
    exactMatch: orkgData.title === metadata.title,
    similarity: calculateTextSimilarity(orkgData.title, metadata.title),
    status: null
  };
  results.title.status = results.title.exactMatch ? 'correct' : 
                         results.title.similarity > 0.8 ? 'partial' : 'incorrect';
  
  // Compare DOI
  const normalizeDOI = (doi) => doi ? doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '') : '';
  results.doi = {
    groundTruth: orkgData.doi,
    extracted: metadata.doi,
    exactMatch: normalizeDOI(orkgData.doi) === normalizeDOI(metadata.doi),
    similarity: normalizeDOI(orkgData.doi) === normalizeDOI(metadata.doi) ? 1 : 0,
    status: null
  };
  results.doi.status = results.doi.exactMatch ? 'correct' : 'incorrect';
  
  // Compare publication year
  const orkgYear = orkgData.publication_year?.toString();
  const systemYear = metadata.publicationDate ? new Date(metadata.publicationDate).getFullYear().toString() : null;
  results.publicationYear = {
    groundTruth: orkgYear,
    extracted: systemYear,
    exactMatch: orkgYear === systemYear,
    similarity: orkgYear === systemYear ? 1 : 0,
    status: null
  };
  results.publicationYear.status = results.publicationYear.exactMatch ? 'correct' : 'incorrect';
  
  // Compare venue
  results.venue = {
    groundTruth: orkgData.venue,
    extracted: metadata.venue,
    exactMatch: orkgData.venue === metadata.venue,
    similarity: calculateTextSimilarity(orkgData.venue, metadata.venue),
    status: null
  };
  results.venue.status = results.venue.exactMatch ? 'correct' : 
                        results.venue.similarity > 0.8 ? 'partial' : 'incorrect';
  
  // Compare authors
  const orkgAuthors = Object.keys(orkgData)
    .filter(key => key.startsWith('author'))
    .map(key => orkgData[key])
    .filter(Boolean);
  
  const systemAuthors = metadata.authors || [];
  
  results.authors = {
    groundTruth: orkgAuthors,
    extracted: systemAuthors,
    exactMatch: orkgAuthors.length === systemAuthors.length && 
                orkgAuthors.every((author, idx) => author === systemAuthors[idx]),
    similarity: calculateAuthorSimilarity(orkgAuthors, systemAuthors),
    status: null,
    details: {
      orkgCount: orkgAuthors.length,
      systemCount: systemAuthors.length,
      matchingAuthors: calculateMatchingAuthors(orkgAuthors, systemAuthors)
    }
  };
  results.authors.status = results.authors.exactMatch ? 'correct' : 
                          results.authors.similarity > 0.8 ? 'partial' : 'incorrect';
  
  // Calculate overall metadata accuracy
  const fields = ['title', 'doi', 'publicationYear', 'venue', 'authors'];
  const accuracyScores = fields.map(field => results[field].similarity);
  const overallAccuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;
  
  return {
    fields: results,
    overall: {
      accuracy: overallAccuracy,
      correctFields: fields.filter(field => results[field].status === 'correct').length,
      partialFields: fields.filter(field => results[field].status === 'partial').length,
      incorrectFields: fields.filter(field => results[field].status === 'incorrect').length,
      totalFields: fields.length
    }
  };
};

/**
 * Calculate author similarity
 * @param {Array} orkgAuthors - ORKG authors
 * @param {Array} systemAuthors - System authors
 * @returns {number} Similarity score
 */
const calculateAuthorSimilarity = (orkgAuthors, systemAuthors) => {
  if (orkgAuthors.length === 0 && systemAuthors.length === 0) return 1;
  if (orkgAuthors.length === 0 || systemAuthors.length === 0) return 0;
  
  let matchCount = 0;
  
  orkgAuthors.forEach(orkgAuthor => {
    const normalized = orkgAuthor.toLowerCase().trim();
    if (systemAuthors.some(sysAuthor => sysAuthor.toLowerCase().trim() === normalized)) {
      matchCount++;
    }
  });
  
  const precision = matchCount / systemAuthors.length;
  const recall = matchCount / orkgAuthors.length;
  
  return precision && recall ? (2 * precision * recall) / (precision + recall) : 0;
};

/**
 * Calculate matching authors count
 * @param {Array} orkgAuthors - ORKG authors
 * @param {Array} systemAuthors - System authors
 * @returns {number} Number of matching authors
 */
const calculateMatchingAuthors = (orkgAuthors, systemAuthors) => {
  let matchCount = 0;
  
  orkgAuthors.forEach(orkgAuthor => {
    const normalized = orkgAuthor.toLowerCase().trim();
    if (systemAuthors.some(sysAuthor => sysAuthor.toLowerCase().trim() === normalized)) {
      matchCount++;
    }
  });
  
  return matchCount;
};

/**
 * Compare research field
 * @param {Object} orkgData - ORKG ground truth data
 * @param {Object} systemData - System analysis data
 * @returns {Object} Research field comparison results
 */
export const compareResearchField = (orkgData, systemData) => {
  if (!orkgData || !systemData || !systemData.researchFields) {
    return null;
  }
  
  const fields = systemData.researchFields;
  const selectedField = fields.selectedField || fields.fields?.[0];
  
  // Check for exact ID match
  const exactMatch = selectedField?.id === orkgData.research_field_id;
  
  // Check if correct field is in top 5
  const top5 = fields.fields?.slice(0, 5) || [];
  const inTop5 = top5.some(field => field.id === orkgData.research_field_id);
  
  // Calculate name similarity
  const nameSimilarity = calculateTextSimilarity(
    orkgData.research_field_name,
    selectedField?.label || selectedField?.name || ''
  );
  
  return {
    groundTruth: {
      id: orkgData.research_field_id,
      name: orkgData.research_field_name
    },
    extracted: {
      id: selectedField?.id,
      name: selectedField?.label || selectedField?.name,
      score: selectedField?.score,
      confidence: selectedField?.confidence
    },
    exactMatch,
    inTop5,
    nameSimilarity,
    status: exactMatch ? 'correct' : inTop5 ? 'partial' : 'incorrect',
    allPredictions: top5.map(field => ({
      id: field.id,
      name: field.label || field.name,
      score: field.score,
      confidence: field.confidence
    }))
  };
};

/**
 * Compare research problem
 * @param {Object} orkgData - ORKG ground truth data
 * @param {Object} systemData - System analysis data
 * @returns {Object} Research problem comparison results
 */
export const compareResearchProblem = (orkgData, systemData) => {
  if (!orkgData || !systemData || !systemData.researchProblems) {
    return null;
  }
  
  const problems = systemData.researchProblems;
  const selectedProblem = problems.selectedProblem;
  
  const hasORKGProblem = orkgData.research_problem_id && orkgData.research_problem_id !== 'No Research Problem';
  
  // Case 1: ORKG has a problem
  if (hasORKGProblem) {
    // Check if system found ORKG problems
    const orkgProblems = problems.orkg_problems || [];
    const exactMatch = selectedProblem?.id === orkgData.research_problem_id;
    const foundInORKG = orkgProblems.some(p => p.id === orkgData.research_problem_id);
    
    // Calculate name similarity
    const nameSimilarity = calculateTextSimilarity(
      orkgData.research_problem_name,
      selectedProblem?.label || selectedProblem?.title || ''
    );
    
    return {
      groundTruth: {
        id: orkgData.research_problem_id,
        name: orkgData.research_problem_name
      },
      extracted: {
        source: selectedProblem?.source || 'unknown',
        id: selectedProblem?.id,
        name: selectedProblem?.label || selectedProblem?.title,
        description: selectedProblem?.description
      },
      exactMatch,
      foundInORKG,
      nameSimilarity,
      status: exactMatch ? 'correct' : foundInORKG ? 'partial' : 'incorrect',
      scenario: 'has_orkg_problem'
    };
  }
  
  // Case 2: ORKG has no problem
  else {
    // If system generated LLM problem, this is a TRUE POSITIVE
    const hasLLMProblem = selectedProblem?.source === 'llm' || problems.llm_problem;
    
    return {
      groundTruth: {
        id: null,
        name: 'No Research Problem'
      },
      extracted: {
        source: selectedProblem?.source || 'none',
        id: selectedProblem?.id,
        name: selectedProblem?.label || selectedProblem?.title,
        description: selectedProblem?.description
      },
      llmGenerated: hasLLMProblem,
      status: hasLLMProblem ? 'correct' : 'no_problem',
      scenario: 'no_orkg_problem',
      note: hasLLMProblem ? 'LLM correctly generated problem where ORKG has none' : 'No problem in either source'
    };
  }
};

/**
 * Compare template
 * @param {Object} orkgData - ORKG ground truth data
 * @param {Object} systemData - System analysis data
 * @returns {Object} Template comparison results
 */
export const compareTemplate = (orkgData, systemData) => {
  if (!orkgData || !systemData || !systemData.templates) {
    return null;
  }
  
  const templates = systemData.templates;
  const selectedTemplate = templates.selectedTemplate;
  
  // Check for exact ID match
  const exactMatch = selectedTemplate?.id === orkgData.template_id;
  
  // Calculate name similarity
  const nameSimilarity = calculateTextSimilarity(
    orkgData.template_name,
    selectedTemplate?.label || selectedTemplate?.name || ''
  );
  
  // Check if LLM template was used
  const usedLLMTemplate = selectedTemplate?.source === 'llm' || templates.llm_template;
  
  return {
    groundTruth: {
      id: orkgData.template_id,
      name: orkgData.template_name
    },
    extracted: {
      source: selectedTemplate?.source || 'unknown',
      id: selectedTemplate?.id,
      name: selectedTemplate?.label || selectedTemplate?.name,
      properties: selectedTemplate?.properties
    },
    exactMatch,
    nameSimilarity,
    usedLLMTemplate,
    status: exactMatch ? 'correct' : usedLLMTemplate ? 'llm_generated' : 'incorrect'
  };
};

/**
 * Calculate field accuracy for any field type
 * @param {*} orkgValue - ORKG ground truth value
 * @param {*} systemValue - System extracted value
 * @param {string} fieldType - Type of field
 * @returns {Object} Accuracy metrics
 */
export const calculateFieldAccuracy = (orkgValue, systemValue, fieldType = 'text') => {
  if (!orkgValue && !systemValue) {
    return { accuracy: 1, precision: 1, recall: 1, f1: 1, status: 'both_empty' };
  }
  
  if (!orkgValue) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, status: 'false_positive' };
  }
  
  if (!systemValue) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, status: 'false_negative' };
  }
  
  // Use text similarity for comparison
  const similarity = calculateTextSimilarity(
    String(orkgValue),
    String(systemValue)
  );
  
  // Calculate precision, recall, F1
  const precision = similarity;
  const recall = similarity;
  const f1 = precision && recall ? (2 * precision * recall) / (precision + recall) : 0;
  
  return {
    accuracy: similarity,
    precision,
    recall,
    f1,
    status: similarity === 1 ? 'correct' : similarity > 0.8 ? 'partial' : 'incorrect'
  };
};

/**
 * Generate comprehensive accuracy report
 * @param {Object} orkgData - ORKG ground truth data
 * @param {Object} systemData - System analysis data
 * @returns {Object} Complete accuracy report
 */
export const generateAccuracyReport = (orkgData, systemData) => {
  if (!orkgData || !systemData) {
    return null;
  }
  
  const metadata = compareMetadata(orkgData, systemData);
  const field = compareResearchField(orkgData, systemData);
  const problem = compareResearchProblem(orkgData, systemData);
  const template = compareTemplate(orkgData, systemData);
  
  // Calculate overall accuracy
  const accuracyScores = [
    metadata?.overall?.accuracy || 0,
    field?.exactMatch ? 1 : field?.inTop5 ? 0.5 : 0,
    problem?.exactMatch ? 1 : problem?.status === 'partial' ? 0.5 : 0,
    template?.exactMatch ? 1 : template?.status === 'llm_generated' ? 0.7 : 0
  ];
  
  const overallAccuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;
  
  return {
    metadata,
    researchField: field,
    researchProblem: problem,
    template,
    overall: {
      accuracy: overallAccuracy,
      status: overallAccuracy >= 0.9 ? 'excellent' :
              overallAccuracy >= 0.7 ? 'good' :
              overallAccuracy >= 0.5 ? 'fair' : 'poor'
    }
  };
};

/**
 * Calculate confusion matrix for a specific aspect
 * @param {Array} comparisons - Array of comparison results
 * @returns {Object} Confusion matrix
 */
export const calculateConfusionMatrix = (comparisons) => {
  const matrix = {
    TP: 0,  // True Positive: Correctly identified
    TN: 0,  // True Negative: Correctly identified as absent
    FP: 0,  // False Positive: Incorrectly identified
    FN: 0   // False Negative: Failed to identify
  };
  
  comparisons.forEach(comparison => {
    if (comparison.status === 'correct') {
      matrix.TP++;
    } else if (comparison.status === 'incorrect') {
      matrix.FP++;
    } else if (comparison.status === 'false_negative') {
      matrix.FN++;
    } else if (comparison.status === 'both_empty') {
      matrix.TN++;
    }
  });
  
  // Calculate metrics
  const precision = matrix.TP + matrix.FP > 0 ? matrix.TP / (matrix.TP + matrix.FP) : 0;
  const recall = matrix.TP + matrix.FN > 0 ? matrix.TP / (matrix.TP + matrix.FN) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = matrix.TP + matrix.TN + matrix.FP + matrix.FN > 0 ? 
                   (matrix.TP + matrix.TN) / (matrix.TP + matrix.TN + matrix.FP + matrix.FN) : 0;
  
  return {
    matrix,
    metrics: {
      precision,
      recall,
      f1,
      accuracy
    }
  };
};