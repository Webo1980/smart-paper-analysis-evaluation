// src/services/contentAnalysisAggregator.js

/**
 * Content Analysis Aggregator - v6
 * 
 * FIXES IN THIS VERSION (building on v5):
 * 1. CORRECT DATA PATHS discovered via browser console exploration:
 *    - User ratings: paper.userEvaluations[].evaluationMetrics.overall.content.userRatings
 *    - Edit data: paper.systemOutput.paperContent.evaluationComparison.changes
 * 2. Multi-evaluator support - aggregates ratings from ALL evaluators per paper
 * 3. Handle initial_state (papers with no edits get perfect scores)
 * 4. Use systemOutput (not systemData) for correct paths
 * 5. STD calculation from per-paper final scores
 * 
 * DATA STRUCTURE (verified via browser console):
 * paper = {
 *   doi: "...",
 *   systemOutput: {                    // NOT systemData!
 *     paperContent: {
 *       evaluationComparison: {
 *         type: 'initial_state',       // or 'modified'
 *         changes: null | {...},       // Edit data here
 *         original_data: {...}
 *       }
 *     }
 *   },
 *   userEvaluations: [                 // Array of evaluations
 *     {
 *       evaluationMetrics: {
 *         overall: {
 *           content: {
 *             userRatings: {           // User ratings here!
 *               propertyCoverage: 5,   // 1-5 scale (40%)
 *               evidenceQuality: 5,    // 1-5 scale (30%)
 *               valueAccuracy: 5,      // 1-5 scale (30%)
 *               confidenceCalibration: 0,
 *               expertiseMultiplier: 1.14
 *             }
 *           }
 *         }
 *       }
 *     }
 *   ]
 * }
 */

// Helper utilities
const mean = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const std = (arr) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length);
};
const median = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// ============================================
// METRIC EXPLANATIONS
// ============================================

export const AGGREGATION_EXPLANATIONS = {
  coverage: {
    title: 'Property Coverage',
    description: 'Measures the percentage of properties that have non-empty values.',
    formula: 'Coverage Rate = Properties with Values / Total Properties',
    interpretation: {
      high: '≥80%: Excellent coverage',
      medium: '50-80%: Moderate coverage',
      low: '<50%: Low coverage'
    }
  },
  granularity: {
    title: 'Value Granularity',
    description: 'Assesses the level of detail in property values.',
    formula: 'Granularity Score = Average(Value Complexity Scores)',
    scoring: {
      'Detailed text (>10 words)': 1.0,
      'Complex object': 0.9,
      'Array value': 0.85,
      'Medium text (3-10 words)': 0.8,
      'Resource URI': 0.75,
      'Numeric value': 0.7,
      'Simple text (1-3 words)': 0.5,
      'Boolean value': 0.3,
      'Empty value': 0
    },
    interpretation: {
      high: '≥0.8: High granularity',
      medium: '0.5-0.8: Moderate granularity',
      low: '<0.5: Low granularity'
    }
  },
  edits: {
    title: 'User Edit Analysis',
    description: 'Tracks how much users modified the LLM-generated content.',
    formula: 'Edit Score = 1 - (Added + Removed + Modified) / Total Original',
    metrics: {
      added: 'Properties added by user',
      removed: 'Properties removed by user',
      modified: 'Properties where values were changed',
      unchanged: 'Properties left as-is'
    },
    interpretation: {
      high: '≥80%: Minimal editing needed',
      medium: '60-80%: Moderate editing',
      low: '<60%: Significant editing required'
    }
  },
  evidence: {
    title: 'Evidence Quality',
    description: 'Evaluates how well property values are supported by evidence.',
    formula: 'Evidence Rate = Values with Evidence / Values with Data',
    components: {
      presence: 'Whether evidence citations exist',
      quality: 'Length and relevance of evidence',
      coverage: 'How many values have evidence'
    },
    interpretation: {
      high: '≥80%: Strong evidence support',
      medium: '50-80%: Moderate evidence',
      low: '<50%: Weak evidence'
    }
  },
  confidence: {
    title: 'Confidence Distribution',
    description: 'Analyzes the confidence scores assigned by the LLM.',
    formula: 'Average Confidence = Mean(All Confidence Scores)',
    levels: {
      high: '≥0.8: High confidence',
      moderate: '0.5-0.8: Moderate confidence',
      low: '<0.5: Low confidence'
    },
    interpretation: {
      high: 'High confidence suggests reliable extraction',
      medium: 'Moderate confidence needs verification',
      low: 'Low confidence requires review'
    }
  },
  valueTypes: {
    title: 'Value Types (Linked Data)',
    description: 'Categorizes values into Resources vs Literals.',
    formula: 'Resource Rate = Resource Values / Total Values',
    types: {
      resource: 'ORKG resources, URIs',
      literal: 'Plain text, numbers, booleans'
    },
    interpretation: {
      high: '≥30%: Good linked data usage',
      medium: '10-30%: Some linked data',
      low: '<10%: Low linked data usage'
    }
  },
  correlations: {
    title: 'Correlation Insights',
    description: 'Analyzes relationships between metrics.',
    analyses: {
      confidenceEvidence: 'Evidence vs Confidence relationship',
      confidenceEdit: 'Confidence vs Edit behavior',
      granularityConfidence: 'Granularity vs Confidence'
    },
    interpretation: {
      positive: 'Metrics reinforce each other',
      negative: 'May indicate issues',
      neutral: 'Metrics are independent'
    }
  },
  userRating: {
    title: 'User Ratings',
    description: 'Expert evaluator ratings for content quality (1-5 scale).',
    formula: 'Weighted Score = (PropertyCoverage×0.4 + EvidenceQuality×0.3 + ValueAccuracy×0.3)',
    interpretation: {
      high: '≥4: Excellent quality',
      medium: '3-4: Good quality',
      low: '<3: Needs improvement'
    }
  },
  finalScore: {
    title: 'Final Weighted Score',
    description: 'Combined score from automated metrics (60%) and user ratings (40%).',
    formula: 'Final = (Coverage×0.20 + Evidence×0.15 + Confidence×0.05 + Granularity×0.10 + Edits×0.10) + (UserRating×0.40)',
    components: {
      automated: '60% weight: Coverage, Evidence, Confidence, Granularity, Edit Score',
      user: '40% weight: User Rating (normalized from 1-5 scale)'
    },
    interpretation: {
      excellent: '≥80%: Excellent content quality',
      good: '60-80%: Good content quality',
      moderate: '40-60%: Moderate - needs improvement',
      poor: '<40%: Poor - significant issues'
    }
  }
};

// Quality metrics weights (from DataQualityView.jsx)
const QUALITY_WEIGHTS = {
  propertyCoverage: 0.4,   // 40%
  evidenceQuality: 0.3,    // 30%
  valueAccuracy: 0.3       // 30%
};

// ============================================
// DATA EXTRACTION FUNCTIONS
// ============================================

/**
 * Get paper content from various paths
 */
const getPaperContent = (paper) => {
  // v6: Check systemOutput first (correct path), then systemData as fallback
  const systemData = paper.systemOutput || paper.systemData;
  if (systemData?.paperContent?.paperContent) return systemData.paperContent.paperContent;
  if (systemData?.paperContent) return systemData.paperContent;
  if (paper.paperContent?.paperContent) return paper.paperContent.paperContent;
  return {};
};

/**
 * Get template properties
 */
const getTemplateProperties = (paper) => {
  const systemData = paper.systemOutput || paper.systemData;
  return systemData?.templates?.available?.template?.properties ||
         systemData?.templates?.selectedTemplate?.properties ||
         systemData?.templates?.llm_template?.properties || [];
};

/**
 * Extract USER RATINGS from evaluation data - v6 CORRECTED
 * 
 * CORRECT PATH (discovered via browser console):
 * paper.userEvaluations[].evaluationMetrics.overall.content.userRatings
 * 
 * USER RATING FIELDS (1-5 scale):
 * - propertyCoverage: 40% weight
 * - evidenceQuality: 30% weight
 * - valueAccuracy: 30% weight
 * - confidenceCalibration: confidence metric (0-1)
 * - expertiseMultiplier: multiplier for weighting
 * 
 * v6 CHANGES:
 * - Uses paper.userEvaluations array (not single evaluation)
 * - Aggregates ratings from ALL evaluators per paper
 * - Tracks evaluator count
 */
const extractUserRatings = (paper) => {
  const ratings = {
    available: false,
    propertyRatings: {},
    qualityMetrics: {},
    overallRating: null,
    overallAssessment: null,
    expertiseMultiplier: 1.0,
    expertiseWeight: 1.0,
    evaluatorCount: 0,
    source: null
  };
  
  // v6: Get userEvaluations array from paper
  const userEvaluations = paper?.userEvaluations;
  
  if (!userEvaluations || !Array.isArray(userEvaluations) || userEvaluations.length === 0) {
    // Fallback to old paths for backward compatibility
    const evaluation = paper.evaluation || paper;
    return extractUserRatingsFromSingleEvaluation(evaluation, ratings);
  }
  
  // v6: Aggregate ratings from ALL evaluators
  const allRatings = {
    propertyCoverage: [],
    evidenceQuality: [],
    valueAccuracy: [],
    confidenceCalibration: []
  };
  
  const expertiseMultipliers = [];
  let foundRatings = false;
  
  userEvaluations.forEach((evaluation, evalIndex) => {
    // PRIMARY PATH: evaluationMetrics.overall.content.userRatings
    const userRatingsObj = evaluation?.evaluationMetrics?.overall?.content?.userRatings;
    
    if (userRatingsObj && Object.keys(userRatingsObj).length > 0) {
      foundRatings = true;
      ratings.source = 'userEvaluations[].evaluationMetrics.overall.content.userRatings';
      
      // Extract each quality metric
      if (userRatingsObj.propertyCoverage && userRatingsObj.propertyCoverage > 0) {
        allRatings.propertyCoverage.push(userRatingsObj.propertyCoverage);
      }
      if (userRatingsObj.evidenceQuality && userRatingsObj.evidenceQuality > 0) {
        allRatings.evidenceQuality.push(userRatingsObj.evidenceQuality);
      }
      if (userRatingsObj.valueAccuracy && userRatingsObj.valueAccuracy > 0) {
        allRatings.valueAccuracy.push(userRatingsObj.valueAccuracy);
      }
      if (userRatingsObj.confidenceCalibration !== undefined && userRatingsObj.confidenceCalibration !== null) {
        allRatings.confidenceCalibration.push(userRatingsObj.confidenceCalibration);
      }
      
      // Get expertise multiplier
      const expMult = userRatingsObj.expertiseMultiplier || evaluation?.userInfo?.expertiseMultiplier || 1.0;
      expertiseMultipliers.push(expMult);
    }
  });
  
  if (!foundRatings) {
    return ratings;
  }
  
  ratings.available = true;
  ratings.evaluatorCount = Math.max(
    allRatings.propertyCoverage.length,
    allRatings.evidenceQuality.length,
    allRatings.valueAccuracy.length
  );
  ratings.expertiseMultiplier = expertiseMultipliers.length > 0 ? mean(expertiseMultipliers) : 1.0;
  
  // Calculate aggregated quality metrics
  Object.entries(QUALITY_WEIGHTS).forEach(([key, weight]) => {
    if (allRatings[key] && allRatings[key].length > 0) {
      const avgRating = mean(allRatings[key]);
      ratings.qualityMetrics[key] = {
        rating: avgRating,
        normalized: (avgRating - 1) / 4,  // 1-5 → 0-1
        weight: weight,
        count: allRatings[key].length,
        std: std(allRatings[key]),
        min: Math.min(...allRatings[key]),
        max: Math.max(...allRatings[key])
      };
      ratings.propertyRatings[key] = {
        rating: avgRating,
        normalized: (avgRating - 1) / 4
      };
    }
  });
  
  // Handle confidenceCalibration (can be 0-1 or 1-5)
  if (allRatings.confidenceCalibration.length > 0) {
    const avgConf = mean(allRatings.confidenceCalibration);
    const normalized = avgConf > 1 ? (avgConf - 1) / 4 : avgConf;
    ratings.qualityMetrics.confidenceCalibration = {
      rating: avgConf,
      normalized: normalized,
      count: allRatings.confidenceCalibration.length
    };
  }
  
  // Calculate weighted quality score using correct weights
  const calculateWeightedQualityScore = () => {
    let totalWeighted = 0;
    let totalWeight = 0;
    
    Object.entries(QUALITY_WEIGHTS).forEach(([key, weight]) => {
      if (ratings.qualityMetrics[key]) {
        totalWeighted += ratings.qualityMetrics[key].normalized * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  };
  
  // Calculate overall rating
  const weightedScore = calculateWeightedQualityScore();
  ratings.normalizedRating = weightedScore;
  ratings.overallRating = weightedScore * 4 + 1; // Convert back to 1-5 scale
  ratings.weightedQualityScore = weightedScore;
  ratings.ratingCount = Object.keys(ratings.propertyRatings).length;
  
  return ratings;
};

/**
 * Fallback for single evaluation structure (backward compatibility)
 */
const extractUserRatingsFromSingleEvaluation = (evaluation, ratings) => {
  // Get expertise info from userInfo
  if (evaluation?.userInfo) {
    ratings.expertiseMultiplier = evaluation.userInfo.expertiseMultiplier || 1.0;
    ratings.expertiseWeight = evaluation.userInfo.expertiseWeight || 1.0;
  }
  
  // Helper to extract rating value (can be number or object)
  const getRatingValue = (ratingData) => {
    if (ratingData === null || ratingData === undefined) return null;
    if (typeof ratingData === 'number') return ratingData;
    if (typeof ratingData === 'object') {
      return ratingData.rating ?? ratingData.value ?? ratingData.score ?? null;
    }
    return null;
  };
  
  // Try various paths
  const contentData = evaluation?.evaluationMetrics?.overall?.content;
  let userRatingsObj = contentData?.userRatings;
  
  if (userRatingsObj && Object.keys(userRatingsObj).length > 0) {
    ratings.source = 'evaluationMetrics.overall.content.userRatings';
  }
  
  // Fallback paths
  if (!userRatingsObj || Object.keys(userRatingsObj).length === 0) {
    userRatingsObj = evaluation?.overall?.content?.userRatings;
    if (userRatingsObj && Object.keys(userRatingsObj).length > 0) {
      ratings.source = 'overall.content.userRatings';
    }
  }
  
  if (!userRatingsObj || Object.keys(userRatingsObj).length === 0) {
    return ratings;
  }
  
  ratings.available = true;
  ratings.evaluatorCount = 1;
  
  // Process quality metrics
  Object.entries(QUALITY_WEIGHTS).forEach(([key, weight]) => {
    const ratingValue = getRatingValue(userRatingsObj[key]);
    if (ratingValue !== null && ratingValue > 0) {
      ratings.qualityMetrics[key] = {
        rating: ratingValue,
        normalized: (ratingValue - 1) / 4,
        weight: weight,
        count: 1
      };
      ratings.propertyRatings[key] = {
        rating: ratingValue,
        normalized: (ratingValue - 1) / 4
      };
    }
  });
  
  // Handle confidenceCalibration
  const confidenceCalibration = userRatingsObj.confidenceCalibration;
  if (confidenceCalibration !== undefined && confidenceCalibration !== null) {
    const normalized = confidenceCalibration > 1 
      ? (confidenceCalibration - 1) / 4 
      : confidenceCalibration;
    ratings.qualityMetrics.confidenceCalibration = {
      rating: confidenceCalibration,
      normalized: normalized
    };
  }
  
  // Calculate weighted quality score
  const calculateWeightedQualityScore = () => {
    let totalWeighted = 0;
    let totalWeight = 0;
    
    Object.entries(QUALITY_WEIGHTS).forEach(([key, weight]) => {
      if (ratings.qualityMetrics[key]) {
        totalWeighted += ratings.qualityMetrics[key].normalized * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  };
  
  if (Object.keys(ratings.qualityMetrics).length > 0) {
    const weightedScore = calculateWeightedQualityScore();
    ratings.normalizedRating = weightedScore;
    ratings.overallRating = weightedScore * 4 + 1;
    ratings.weightedQualityScore = weightedScore;
  }
  
  ratings.ratingCount = Object.keys(ratings.propertyRatings).length;
  
  return ratings;
};

/**
 * Extract EDIT DATA from evaluation data - v6 CORRECTED
 * 
 * CORRECT PATH (discovered via browser console):
 * paper.systemOutput.paperContent.evaluationComparison.changes
 * 
 * STRUCTURE:
 * evaluationComparison: {
 *   type: 'initial_state' | 'modified',
 *   changes: null | {
 *     added_properties: ['prop1'],
 *     removed_properties: ['prop2'],
 *     modified_properties: { 'prop3': { original: {...}, modified: {...} } }
 *   },
 *   original_data: {...},
 *   new_data: {...}
 * }
 * 
 * v6 CHANGES:
 * - Uses paper.systemOutput.paperContent.evaluationComparison (PRIMARY)
 * - Handles initial_state (no edits) - returns perfect scores
 * - Falls back to other paths for compatibility
 */
const extractEditData = (paper) => {
  const editData = {
    available: false,
    addedCount: 0,
    removedCount: 0,
    modifiedCount: 0,
    unchangedCount: 0,
    totalOriginalProps: 0,
    changeRate: 0,
    preservationRate: 1,
    editScore: 1,
    type: null,
    source: null
  };
  
  // v6 PRIMARY PATH: paper.systemOutput.paperContent.evaluationComparison
  let evaluationComparison = paper?.systemOutput?.paperContent?.evaluationComparison;
  let source = 'systemOutput.paperContent.evaluationComparison';
  
  // Fallback paths if primary not found
  if (!evaluationComparison) {
    const fallbackPaths = [
      { path: paper?.systemData?.paperContent?.evaluationComparison, name: 'systemData.paperContent.evaluationComparison' },
      { path: paper?.systemOutput?.evaluationData?.paperContent?.evaluationComparison, name: 'systemOutput.evaluationData.paperContent.evaluationComparison' },
      { path: paper?.systemData?.evaluationData?.paperContent?.evaluationComparison, name: 'systemData.evaluationData.paperContent.evaluationComparison' },
      { path: paper?.evaluation?.evaluationComparison, name: 'evaluation.evaluationComparison' },
      { path: paper?.userEvaluations?.[0]?.evaluationComparison, name: 'userEvaluations[0].evaluationComparison' }
    ];
    
    for (const { path, name } of fallbackPaths) {
      if (path) {
        evaluationComparison = path;
        source = name;
        break;
      }
    }
  }
  
  // If still no evaluationComparison found
  if (!evaluationComparison) {
    // Try to find changes data directly from older structure
    const evaluation = paper.evaluation || (paper.userEvaluations && paper.userEvaluations[0]);
    const changesData = evaluation?.systemData?.evaluationData?.paperContent?.changes;
    
    if (changesData) {
      return extractEditDataFromChanges(changesData, 'legacy.changes');
    }
    
    return editData;
  }
  
  // v6: Handle evaluationComparison structure
  editData.available = true;
  editData.type = evaluationComparison.type || 'unknown';
  editData.source = source;
  
  const changes = evaluationComparison.changes;
  
  // v6: Handle initial_state (no edits made)
  // Papers with type='initial_state' and changes=null are valid - user hasn't made edits yet
  // This should be treated as perfect score (no changes needed or not yet evaluated)
  if (!changes || changes === null) {
    // Get original property count if available
    const originalData = evaluationComparison.original_data || {};
    editData.totalOriginalProps = Object.keys(originalData).filter(k => k !== 'type').length;
    editData.unchangedCount = editData.totalOriginalProps;
    
    // Perfect scores for no changes
    editData.editScore = 1.0;
    editData.preservationRate = 1.0;
    editData.changeRate = 0;
    
    return editData;
  }
  
  return extractEditDataFromChanges(changes, source, evaluationComparison.original_data);
};

/**
 * Extract edit metrics from changes object
 */
const extractEditDataFromChanges = (changes, source, originalData = null) => {
  const editData = {
    available: true,
    addedCount: 0,
    removedCount: 0,
    modifiedCount: 0,
    unchangedCount: 0,
    totalOriginalProps: 0,
    changeRate: 0,
    preservationRate: 1,
    editScore: 1,
    type: 'modified',
    source: source
  };
  
  // Extract counts from changes object
  editData.addedCount = Array.isArray(changes.added_properties) 
    ? changes.added_properties.length : 0;
  editData.removedCount = Array.isArray(changes.removed_properties) 
    ? changes.removed_properties.length : 0;
  editData.modifiedCount = changes.modified_properties 
    ? Object.keys(changes.modified_properties).length : 0;
  
  // Get total original properties count
  if (originalData && typeof originalData === 'object') {
    editData.totalOriginalProps = Object.keys(originalData).filter(k => k !== 'type').length;
  } else if (changes.original_data && typeof changes.original_data === 'object') {
    editData.totalOriginalProps = Object.keys(changes.original_data).filter(k => k !== 'type').length;
  }
  
  // Fallback: estimate from changes if no original data
  if (editData.totalOriginalProps === 0) {
    editData.totalOriginalProps = Math.max(
      editData.removedCount + editData.modifiedCount + 1,
      editData.addedCount + editData.removedCount + editData.modifiedCount
    );
  }
  
  // Calculate metrics using same formulas as editAnalysisUtils.js
  editData.unchangedCount = Math.max(0, editData.totalOriginalProps - editData.removedCount - editData.modifiedCount);
  editData.changeRate = editData.totalOriginalProps > 0 
    ? (editData.addedCount + editData.removedCount + editData.modifiedCount) / editData.totalOriginalProps 
    : 0;
  editData.preservationRate = editData.totalOriginalProps > 0 
    ? editData.unchangedCount / editData.totalOriginalProps 
    : 1;
  editData.editScore = 1 - Math.min(1, editData.changeRate);
  
  return editData;
};

/**
 * Check if value is empty
 */
const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (value === '<empty>') return true;
  return false;
};

/**
 * Get value type classification
 */
const getValueType = (value) => {
  if (isEmptyValue(value)) return 'empty';
  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://') || 
        value.includes('orkg.org') || /^R\d+$/.test(value)) {
      return 'resource';
    }
    const wordCount = value.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 10) return 'detailed_text';
    if (wordCount > 3) return 'medium_text';
    return 'simple_text';
  }
  if (typeof value === 'number') return 'numeric';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'complex_object';
  return 'other';
};

/**
 * Calculate granularity score
 */
const getGranularityScore = (value) => {
  if (isEmptyValue(value)) return { score: 0, explanation: 'Empty value', isEmpty: true };
  
  if (typeof value === 'string') {
    const wordCount = value.split(/\s+/).filter(Boolean).length;
    if (wordCount > 10) return { score: 1.0, explanation: 'Detailed text', isEmpty: false };
    if (wordCount > 3) return { score: 0.8, explanation: 'Medium text', isEmpty: false };
    return { score: 0.5, explanation: 'Simple text', isEmpty: false };
  }
  if (typeof value === 'number') return { score: 0.7, explanation: 'Numeric', isEmpty: false };
  if (typeof value === 'boolean') return { score: 0.3, explanation: 'Boolean', isEmpty: false };
  if (Array.isArray(value)) return { score: 0.85, explanation: 'Array', isEmpty: value.length === 0 };
  if (typeof value === 'object') return { score: 0.9, explanation: 'Complex object', isEmpty: false };
  return { score: 0.5, explanation: 'Other', isEmpty: false };
};

/**
 * Calculate per-paper final score
 * Uses same formula as overall final score
 */
const calculatePaperFinalScore = (paperMetrics, userRating, editScore) => {
  // Weights: Automated (60%) + User Rating (40%)
  const automatedWeights = {
    coverage: 0.20,
    granularity: 0.10,
    edits: 0.10,
    evidence: 0.15,
    confidence: 0.05
  };
  
  const userRatingWeight = 0.40;
  
  // Automated scores for this paper
  const automatedScores = {
    coverage: paperMetrics.coverageRate || 0,
    granularity: paperMetrics.avgGranularity || 0,
    edits: editScore !== null ? editScore : 0.5,
    evidence: paperMetrics.evidenceRate || 0,
    confidence: paperMetrics.avgConfidence || 0
  };
  
  // Calculate automated component
  const automatedScore = Object.entries(automatedScores)
    .reduce((sum, [key, score]) => sum + score * automatedWeights[key], 0);
  
  // User rating component (normalized)
  const normalizedUserRating = userRating ? (userRating - 1) / 4 : null;
  
  // Combined score
  let finalScore;
  if (normalizedUserRating !== null) {
    finalScore = automatedScore + (normalizedUserRating * userRatingWeight);
  } else {
    // No user rating - normalize automated score
    finalScore = automatedScore / 0.6;
  }
  
  return {
    finalScore: Math.min(1, finalScore),
    automatedScore,
    userRatingScore: normalizedUserRating,
    hasUserRating: normalizedUserRating !== null
  };
};

/**
 * Extract comprehensive paper-level data - v6 ENHANCED
 */
const extractPaperData = (paper) => {
  const paperContent = getPaperContent(paper);
  const templateProps = getTemplateProperties(paper);
  const userRatings = extractUserRatings(paper);
  const editData = extractEditData(paper);
  
  const paperId = paper.doi || paper.token || `paper_${Math.random().toString(36).substr(2, 9)}`;
  const paperTitle = paper.groundTruth?.title || 
                     paper.systemData?.metadata?.title || 
                     paper.systemOutput?.metadata?.title ||
                     paperId;
  
  // Extract all property values
  const properties = [];
  const templatePropIds = new Set(templateProps.map(p => p.id));
  
  Object.entries(paperContent).forEach(([propId, propData]) => {
    if (!propData || propId === 'type' || propId === 'evaluationComparison') return;
    
    const values = propData.values || [];
    const isInTemplate = templatePropIds.has(propId);
    
    if (values.length === 0) {
      properties.push({
        propertyId: propId,
        propertyLabel: propData.property || propData.label || propId,
        hasValue: false,
        isEmpty: true,
        valueCount: 0,
        confidence: 0,
        hasEvidence: false,
        granularityScore: 0,
        isInTemplate,
        paperId
      });
    } else {
      values.forEach((valueObj, idx) => {
        const rawValue = valueObj?.value;
        const isEmpty = isEmptyValue(rawValue);
        const confidence = valueObj?.confidence || 0;
        const evidenceObj = valueObj?.evidence || {};
        const evidenceSections = Object.keys(evidenceObj).filter(k => 
          evidenceObj[k] && (evidenceObj[k].text || evidenceObj[k].relevance)
        );
        const hasEvidence = evidenceSections.length > 0;
        const evidenceLength = evidenceSections.reduce((sum, k) => 
          sum + (evidenceObj[k]?.text?.length || 0), 0);
        const granularity = getGranularityScore(rawValue);
        const valueType = getValueType(rawValue);
        
        properties.push({
          propertyId: propId,
          propertyLabel: propData.property || propData.label || propId,
          valueIndex: idx,
          hasValue: !isEmpty,
          isEmpty,
          confidence,
          hasEvidence,
          evidenceCount: evidenceSections.length,
          evidenceLength,
          evidenceSections,
          granularityScore: granularity.score,
          granularityExplanation: granularity.explanation,
          valueType,
          isResource: valueType === 'resource',
          isInTemplate,
          rawValue,
          paperId
        });
      });
    }
  });
  
  // Add missing template properties
  templateProps.forEach(tp => {
    if (!Object.keys(paperContent).includes(tp.id)) {
      properties.push({
        propertyId: tp.id,
        propertyLabel: tp.label || tp.id,
        hasValue: false,
        isEmpty: true,
        isMissing: true,
        confidence: 0,
        hasEvidence: false,
        granularityScore: 0,
        isInTemplate: true,
        templateRequired: tp.required,
        paperId
      });
    }
  });
  
  // Calculate paper-level metrics
  const propsWithValues = properties.filter(p => p.hasValue);
  const propsWithEvidence = propsWithValues.filter(p => p.hasEvidence);
  const confidences = propsWithValues.map(p => p.confidence).filter(c => c > 0);
  const granularities = propsWithValues.map(p => p.granularityScore);
  
  const metrics = {
    totalProperties: properties.length,
    propertiesWithValues: propsWithValues.length,
    coverageRate: properties.length > 0 ? propsWithValues.length / properties.length : 0,
    evidenceRate: propsWithValues.length > 0 ? propsWithEvidence.length / propsWithValues.length : 0,
    avgConfidence: mean(confidences),
    avgGranularity: mean(granularities),
    resourceCount: propsWithValues.filter(p => p.isResource).length,
    literalCount: propsWithValues.filter(p => !p.isResource).length
  };
  
  // Calculate per-paper final score
  const paperScore = calculatePaperFinalScore(
    metrics,
    userRatings.overallRating,
    editData.available ? editData.editScore : null
  );
  
  return {
    paperId,
    paperTitle,
    properties,
    metrics,
    userRatings,
    editData,
    paperScore,
    templateInfo: {
      totalTemplateProps: templateProps.length,
      foundProps: properties.filter(p => p.isInTemplate && p.hasValue).length,
      missingProps: properties.filter(p => p.isMissing).length
    }
  };
};

// ============================================
// MAIN AGGREGATION FUNCTION
// ============================================

/**
 * Aggregate content analysis across all papers
 */
export const aggregateContentAnalysis = (integratedData, options = {}) => {
  if (!integratedData?.papers || integratedData.papers.length === 0) {
    console.warn('[CONTENT AGG v6] No papers found');
    return getEmptyAggregation();
  }
  
  const { userWeight = 1.0 } = options;
  
  console.log(`📊 [CONTENT AGG v6] Starting analysis of ${integratedData.papers.length} papers...`);
  
  // Extract paper-level data
  const paperData = integratedData.papers.map(extractPaperData);
  
  // Flatten all property data
  const allProperties = paperData.flatMap(p => p.properties);
  
  // Debug info
  console.log(`📊 [CONTENT AGG v6] Extracted ${allProperties.length} properties from ${paperData.length} papers`);
  console.log(`📊 [CONTENT AGG v6] Papers with user ratings: ${paperData.filter(p => p.userRatings.available).length}`);
  console.log(`📊 [CONTENT AGG v6] Papers with edit data: ${paperData.filter(p => p.editData.available).length}`);
  
  // Debug first paper's data paths
  if (paperData.length > 0) {
    const firstPaper = paperData[0];
    console.log(`📊 [CONTENT AGG v6] First paper userRatings source: ${firstPaper.userRatings.source || 'N/A'}`);
    console.log(`📊 [CONTENT AGG v6] First paper editData source: ${firstPaper.editData.source || 'N/A'}`);
    console.log(`📊 [CONTENT AGG v6] First paper editData type: ${firstPaper.editData.type || 'N/A'}`);
    if (firstPaper.userRatings.available) {
      console.log(`📊 [CONTENT AGG v6] First paper user ratings:`, firstPaper.userRatings.qualityMetrics);
    }
    if (firstPaper.editData.available) {
      console.log(`📊 [CONTENT AGG v6] First paper edit score: ${(firstPaper.editData.editScore * 100).toFixed(1)}%`);
    }
  }
  
  // ============================================
  // 1. COVERAGE ANALYSIS
  // ============================================
  const coverage = aggregateCoverage(allProperties, paperData);
  
  // ============================================
  // 2. GRANULARITY ANALYSIS
  // ============================================
  const granularity = aggregateGranularity(allProperties);
  
  // ============================================
  // 3. EDIT ANALYSIS
  // ============================================
  const edits = aggregateEdits(paperData.filter(p => p.editData.available).map(p => ({
    paperId: p.paperId,
    ...p.editData
  })));
  
  // ============================================
  // 4. EVIDENCE ANALYSIS
  // ============================================
  const evidence = aggregateEvidence(allProperties);
  
  // ============================================
  // 5. CONFIDENCE ANALYSIS
  // ============================================
  const confidence = aggregateConfidence(allProperties);
  
  // ============================================
  // 6. VALUE TYPES
  // ============================================
  const valueTypes = aggregateValueTypes(allProperties);
  
  // ============================================
  // 7. USER RATINGS (v6 ENHANCED)
  // ============================================
  const userRatingsData = aggregateUserRatings(paperData);
  
  // ============================================
  // 8. CORRELATIONS
  // ============================================
  const correlations = analyzeCorrelations(allProperties, paperData);
  
  // ============================================
  // 9. PAPER-LEVEL ANALYSIS (v6 ENHANCED)
  // Includes per-paper final score and edit details
  // ============================================
  const paperAnalysis = paperData.map(p => ({
    paperId: p.paperId,
    paperTitle: p.paperTitle,
    metrics: p.metrics,
    // User rating data (v6: includes evaluator count)
    userRating: p.userRatings.overallRating,
    normalizedRating: p.userRatings.normalizedRating,
    expertiseMultiplier: p.userRatings.expertiseMultiplier,
    hasUserRating: p.userRatings.available,
    userRatingSource: p.userRatings.source,
    evaluatorCount: p.userRatings.evaluatorCount,
    qualityMetrics: p.userRatings.qualityMetrics,
    weightedQualityScore: p.userRatings.weightedQualityScore,
    // Edit data (v6: includes type)
    editScore: p.editData.available ? p.editData.editScore : null,
    hasEditData: p.editData.available,
    editSource: p.editData.source,
    editType: p.editData.type,
    preservationRate: p.editData.preservationRate,
    addedCount: p.editData.addedCount,
    removedCount: p.editData.removedCount,
    modifiedCount: p.editData.modifiedCount,
    // Per-paper final score
    paperFinalScore: p.paperScore.finalScore,
    paperAutomatedScore: p.paperScore.automatedScore,
    paperUserRatingScore: p.paperScore.userRatingScore
  }));
  
  // ============================================
  // 10. FINAL SCORE (with STD calculation)
  // ============================================
  const finalScore = calculateFinalScore({
    coverage,
    granularity,
    edits,
    evidence,
    confidence,
    valueTypes,
    userRatings: userRatingsData
  }, userWeight, paperAnalysis);
  
  // ============================================
  // 11. CHART DATA (v6 ENHANCED)
  // ============================================
  const chartData = prepareChartData(paperData, {
    coverage,
    granularity,
    evidence,
    confidence,
    userRatings: userRatingsData
  });
  
  const result = {
    coverage,
    granularity,
    edits,
    evidence,
    confidence,
    valueTypes,
    userRatings: userRatingsData,
    correlations,
    paperAnalysis,
    finalScore,
    chartData,
    explanations: AGGREGATION_EXPLANATIONS,
    summary: {
      totalPapers: integratedData.papers.length,
      totalPropertyValues: allProperties.length,
      uniqueProperties: new Set(allProperties.map(p => p.propertyLabel)).size,
      papersWithEditData: paperData.filter(p => p.editData.available).length,
      papersWithUserRatings: paperData.filter(p => p.userRatings.available).length,
      avgExpertiseMultiplier: mean(paperData.map(p => p.userRatings.expertiseMultiplier)),
      avgEvaluatorCount: mean(paperData.filter(p => p.userRatings.available).map(p => p.userRatings.evaluatorCount)),
      userWeight,
      timestamp: new Date().toISOString(),
      version: 'v6'
    }
  };
  
  console.log('✅ [CONTENT AGG v6] Analysis complete:', {
    papers: result.summary.totalPapers,
    properties: result.summary.totalPropertyValues,
    coverage: (result.coverage.overall.coverageRate * 100).toFixed(1) + '%',
    evidence: (result.evidence.overall.evidenceRate * 100).toFixed(1) + '%',
    finalScore: (result.finalScore.weightedScore * 100).toFixed(1) + '%',
    finalScoreStd: result.finalScore.std.toFixed(3),
    userRatingAvg: result.userRatings.overall.mean?.toFixed(2) || 'N/A',
    papersWithRatings: result.summary.papersWithUserRatings,
    papersWithEdits: result.summary.papersWithEditData,
    avgEvaluators: result.summary.avgEvaluatorCount?.toFixed(1) || 'N/A'
  });
  
  return result;
};

// ============================================
// AGGREGATION SUB-FUNCTIONS
// ============================================

/**
 * Coverage Analysis
 */
const aggregateCoverage = (allProperties, paperData) => {
  const withValues = allProperties.filter(p => p.hasValue);
  const withoutValues = allProperties.filter(p => !p.hasValue);
  const missingFromTemplate = allProperties.filter(p => p.isMissing);
  
  // Per-paper coverage
  const perPaperRates = paperData.map(p => p.metrics.coverageRate);
  
  // By property
  const propertyLabels = [...new Set(allProperties.map(p => p.propertyLabel))];
  const byProperty = propertyLabels.map(label => {
    const props = allProperties.filter(p => p.propertyLabel === label);
    const filled = props.filter(p => p.hasValue).length;
    return {
      property: label,
      total: props.length,
      filled,
      rate: props.length > 0 ? filled / props.length : 0
    };
  }).sort((a, b) => b.rate - a.rate);
  
  return {
    overall: {
      totalPropertyValues: allProperties.length,
      withValues: withValues.length,
      withoutValues: withoutValues.length,
      coverageRate: allProperties.length > 0 ? withValues.length / allProperties.length : 0
    },
    missingAnalysis: {
      missingFromTemplate: missingFromTemplate.length,
      emptyInPaperContent: withoutValues.length - missingFromTemplate.length,
      extraProperties: allProperties.filter(p => !p.isInTemplate).length
    },
    perPaper: {
      mean: mean(perPaperRates),
      std: std(perPaperRates),
      median: median(perPaperRates),
      min: perPaperRates.length > 0 ? Math.min(...perPaperRates) : 0,
      max: perPaperRates.length > 0 ? Math.max(...perPaperRates) : 0
    },
    byProperty: byProperty.slice(0, 20),
    explanation: AGGREGATION_EXPLANATIONS.coverage
  };
};

/**
 * Granularity Analysis
 */
const aggregateGranularity = (allProperties) => {
  const propsWithValues = allProperties.filter(p => p.hasValue);
  const scores = propsWithValues.map(p => p.granularityScore);
  
  // Type distribution
  const typeCounts = {};
  allProperties.forEach(p => {
    const type = p.isEmpty ? 'empty' : (p.valueType || 'unknown');
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  const typeDistribution = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type: type.replace(/_/g, ' '),
      count,
      percentage: allProperties.length > 0 ? count / allProperties.length : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    overall: {
      mean: mean(scores),
      std: std(scores),
      median: median(scores),
      count: propsWithValues.length,
      emptyCount: allProperties.length - propsWithValues.length
    },
    qualityTiers: {
      high: propsWithValues.filter(p => p.granularityScore >= 0.8).length,
      medium: propsWithValues.filter(p => p.granularityScore >= 0.5 && p.granularityScore < 0.8).length,
      low: propsWithValues.filter(p => p.granularityScore > 0 && p.granularityScore < 0.5).length,
      empty: allProperties.filter(p => !p.hasValue).length
    },
    typeDistribution,
    explanation: AGGREGATION_EXPLANATIONS.granularity
  };
};

/**
 * Edit Analysis - v6 ENHANCED
 * Now handles initial_state papers correctly
 */
const aggregateEdits = (editData) => {
  if (editData.length === 0) {
    return {
      available: false,
      message: 'No edit comparison data available.',
      explanation: AGGREGATION_EXPLANATIONS.edits
    };
  }
  
  const totals = editData.reduce((acc, p) => ({
    added: acc.added + (p.addedCount || 0),
    removed: acc.removed + (p.removedCount || 0),
    modified: acc.modified + (p.modifiedCount || 0),
    unchanged: acc.unchanged + (p.unchangedCount || 0),
    original: acc.original + (p.totalOriginalProps || 0)
  }), { added: 0, removed: 0, modified: 0, unchanged: 0, original: 0 });
  
  const editScores = editData.map(p => p.editScore).filter(s => s !== undefined && s !== null);
  const avgEditScore = mean(editScores);
  
  // v6: Track edit types
  const editTypes = {
    initial_state: editData.filter(p => p.type === 'initial_state').length,
    modified: editData.filter(p => p.type === 'modified').length,
    unknown: editData.filter(p => !p.type || p.type === 'unknown').length
  };
  
  return {
    available: true,
    papersAnalyzed: editData.length,
    totals,
    rates: {
      additionRate: totals.original > 0 ? totals.added / totals.original : 0,
      removalRate: totals.original > 0 ? totals.removed / totals.original : 0,
      modificationRate: totals.original > 0 ? totals.modified / totals.original : 0,
      preservationRate: totals.original > 0 ? totals.unchanged / totals.original : 0
    },
    editScores: {
      mean: avgEditScore,
      std: std(editScores),
      median: median(editScores),
      min: editScores.length > 0 ? Math.min(...editScores) : 0,
      max: editScores.length > 0 ? Math.max(...editScores) : 0
    },
    editBehavior: {
      noEdits: editData.filter(p => (p.modifiedCount + p.removedCount + p.addedCount) === 0).length,
      minorEdits: editData.filter(p => p.changeRate > 0 && p.changeRate < 0.2).length,
      moderateEdits: editData.filter(p => p.changeRate >= 0.2 && p.changeRate < 0.5).length,
      majorEdits: editData.filter(p => p.changeRate >= 0.5).length
    },
    editTypes, // v6: new field
    llmQualityIndicator: {
      score: avgEditScore,
      interpretation: avgEditScore >= 0.8 ? 'Excellent' : avgEditScore >= 0.6 ? 'Good' : avgEditScore >= 0.4 ? 'Moderate' : 'Needs Improvement',
      description: avgEditScore >= 0.8 ? 'Minimal editing needed' : 'Some editing required'
    },
    explanation: AGGREGATION_EXPLANATIONS.edits
  };
};

/**
 * Evidence Analysis
 */
const aggregateEvidence = (allProperties) => {
  const propsWithValues = allProperties.filter(p => p.hasValue);
  const propsWithEvidence = propsWithValues.filter(p => p.hasEvidence);
  const evidenceLengths = propsWithEvidence.map(p => p.evidenceLength || 0);
  
  // Section distribution
  const sectionCounts = {};
  propsWithEvidence.forEach(p => {
    (p.evidenceSections || []).forEach(section => {
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    });
  });
  
  const sectionDistribution = Object.entries(sectionCounts)
    .map(([section, count]) => ({
      section,
      count,
      percentage: propsWithEvidence.length > 0 ? count / propsWithEvidence.length : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    overall: {
      totalWithEvidence: propsWithEvidence.length,
      totalWithoutEvidence: propsWithValues.length - propsWithEvidence.length,
      totalWithValues: propsWithValues.length,
      evidenceRate: propsWithValues.length > 0 ? propsWithEvidence.length / propsWithValues.length : 0
    },
    evidenceLength: {
      mean: mean(evidenceLengths),
      std: std(evidenceLengths),
      max: evidenceLengths.length > 0 ? Math.max(...evidenceLengths) : 0
    },
    evidenceCount: {
      mean: mean(propsWithEvidence.map(p => p.evidenceCount)),
      max: propsWithEvidence.length > 0 ? Math.max(...propsWithEvidence.map(p => p.evidenceCount)) : 0
    },
    evidenceQuality: {
      substantial: propsWithEvidence.filter(p => p.evidenceLength > 200).length,
      moderate: propsWithEvidence.filter(p => p.evidenceLength >= 50 && p.evidenceLength <= 200).length,
      minimal: propsWithEvidence.filter(p => p.evidenceLength > 0 && p.evidenceLength < 50).length
    },
    sectionDistribution: sectionDistribution.slice(0, 10),
    totalUniqueSections: Object.keys(sectionCounts).length,
    explanation: AGGREGATION_EXPLANATIONS.evidence
  };
};

/**
 * Confidence Analysis
 */
const aggregateConfidence = (allProperties) => {
  const propsWithConfidence = allProperties.filter(p => p.hasValue && p.confidence > 0);
  const scores = propsWithConfidence.map(p => p.confidence);
  
  const withEvidence = propsWithConfidence.filter(p => p.hasEvidence);
  const withoutEvidence = propsWithConfidence.filter(p => !p.hasEvidence);
  
  return {
    overall: {
      mean: mean(scores),
      std: std(scores),
      median: median(scores),
      count: propsWithConfidence.length
    },
    distribution: {
      high: {
        count: propsWithConfidence.filter(p => p.confidence >= 0.8).length,
        percentage: propsWithConfidence.length > 0 ? 
          propsWithConfidence.filter(p => p.confidence >= 0.8).length / propsWithConfidence.length : 0,
        avgConfidence: mean(propsWithConfidence.filter(p => p.confidence >= 0.8).map(p => p.confidence))
      },
      moderate: {
        count: propsWithConfidence.filter(p => p.confidence >= 0.5 && p.confidence < 0.8).length,
        percentage: propsWithConfidence.length > 0 ?
          propsWithConfidence.filter(p => p.confidence >= 0.5 && p.confidence < 0.8).length / propsWithConfidence.length : 0,
        avgConfidence: mean(propsWithConfidence.filter(p => p.confidence >= 0.5 && p.confidence < 0.8).map(p => p.confidence))
      },
      low: {
        count: propsWithConfidence.filter(p => p.confidence < 0.5).length,
        percentage: propsWithConfidence.length > 0 ?
          propsWithConfidence.filter(p => p.confidence < 0.5).length / propsWithConfidence.length : 0,
        avgConfidence: mean(propsWithConfidence.filter(p => p.confidence < 0.5).map(p => p.confidence))
      }
    },
    byEvidence: {
      withEvidence: {
        avgConfidence: withEvidence.length > 0 ? mean(withEvidence.map(p => p.confidence)) : 0,
        count: withEvidence.length
      },
      withoutEvidence: {
        avgConfidence: withoutEvidence.length > 0 ? mean(withoutEvidence.map(p => p.confidence)) : 0,
        count: withoutEvidence.length
      }
    },
    explanation: AGGREGATION_EXPLANATIONS.confidence
  };
};

/**
 * Value Types Analysis
 */
const aggregateValueTypes = (allProperties) => {
  const propsWithValues = allProperties.filter(p => p.hasValue);
  const resources = propsWithValues.filter(p => p.isResource);
  const literals = propsWithValues.filter(p => !p.isResource);
  
  // Literal breakdown by type
  const literalTypes = {
    text: literals.filter(p => ['detailed_text', 'medium_text', 'simple_text'].includes(p.valueType)).length,
    numeric: literals.filter(p => p.valueType === 'numeric').length,
    boolean: literals.filter(p => p.valueType === 'boolean').length,
    complex: literals.filter(p => ['array', 'complex_object'].includes(p.valueType)).length,
    other: literals.filter(p => !['detailed_text', 'medium_text', 'simple_text', 'numeric', 'boolean', 'array', 'complex_object'].includes(p.valueType)).length
  };
  
  const resourceRate = propsWithValues.length > 0 ? resources.length / propsWithValues.length : 0;
  
  return {
    overall: {
      resources: resources.length,
      literals: literals.length,
      total: propsWithValues.length,
      resourceRate,
      literalRate: propsWithValues.length > 0 ? literals.length / propsWithValues.length : 0
    },
    literalBreakdown: literalTypes,
    linkedDataQuality: {
      score: resourceRate,
      interpretation: resourceRate >= 0.3 ? 'Good linked data usage' :
                     resourceRate >= 0.1 ? 'Moderate linked data usage' :
                     'Low linked data usage - consider using more ORKG resources'
    },
    explanation: AGGREGATION_EXPLANATIONS.valueTypes
  };
};

/**
 * User Ratings Analysis - v6 ENHANCED
 * Uses quality metrics: propertyCoverage (40%), evidenceQuality (30%), valueAccuracy (30%)
 * Now tracks evaluator count and aggregates across multiple evaluators
 */
const aggregateUserRatings = (paperData) => {
  const papersWithRatings = paperData.filter(p => p.userRatings.available);
  
  if (papersWithRatings.length === 0) {
    return {
      available: false,
      message: 'No user ratings available',
      overall: { mean: 0, std: 0, count: 0 },
      normalizedOverall: { mean: 0, std: 0 },
      qualityMetrics: {},
      explanation: AGGREGATION_EXPLANATIONS.userRating
    };
  }
  
  // Collect all ratings
  const allRatings = papersWithRatings
    .map(p => p.userRatings.overallRating)
    .filter(r => r && r > 0);
  
  const normalizedRatings = papersWithRatings
    .map(p => p.userRatings.normalizedRating)
    .filter(r => r !== undefined && r !== null);
  
  const expertiseMultipliers = papersWithRatings
    .map(p => p.userRatings.expertiseMultiplier)
    .filter(m => m > 0);
  
  const evaluatorCounts = papersWithRatings
    .map(p => p.userRatings.evaluatorCount)
    .filter(c => c > 0);
  
  // Aggregate quality metrics (propertyCoverage, evidenceQuality, valueAccuracy)
  const qualityMetricsAgg = {
    propertyCoverage: { ratings: [], weight: QUALITY_WEIGHTS.propertyCoverage },
    evidenceQuality: { ratings: [], weight: QUALITY_WEIGHTS.evidenceQuality },
    valueAccuracy: { ratings: [], weight: QUALITY_WEIGHTS.valueAccuracy }
  };
  
  papersWithRatings.forEach(p => {
    Object.entries(p.userRatings.qualityMetrics || {}).forEach(([key, data]) => {
      if (qualityMetricsAgg[key] && data.rating) {
        qualityMetricsAgg[key].ratings.push(data.rating);
      }
    });
  });
  
  // Calculate aggregated quality metrics
  const qualityMetricsSummary = {};
  Object.entries(qualityMetricsAgg).forEach(([key, data]) => {
    if (data.ratings.length > 0) {
      qualityMetricsSummary[key] = {
        mean: mean(data.ratings),
        std: std(data.ratings),
        min: Math.min(...data.ratings),
        max: Math.max(...data.ratings),
        count: data.ratings.length,
        weight: data.weight,
        normalized: mean(data.ratings.map(r => (r - 1) / 4))
      };
    }
  });
  
  // Distribution of ratings
  const distribution = {
    excellent: allRatings.filter(r => r >= 4.5).length,
    good: allRatings.filter(r => r >= 3.5 && r < 4.5).length,
    moderate: allRatings.filter(r => r >= 2.5 && r < 3.5).length,
    poor: allRatings.filter(r => r < 2.5).length
  };
  
  // Per-paper ratings for chart (v6: enhanced with more details)
  const byPaper = papersWithRatings.map(p => ({
    paperId: p.paperId,
    paperTitle: p.paperTitle,
    rating: p.userRatings.overallRating,
    normalizedRating: p.userRatings.normalizedRating,
    overallAssessment: p.userRatings.overallAssessment,
    expertiseMultiplier: p.userRatings.expertiseMultiplier,
    ratingCount: p.userRatings.ratingCount,
    evaluatorCount: p.userRatings.evaluatorCount,
    source: p.userRatings.source,
    qualityMetrics: p.userRatings.qualityMetrics,
    weightedQualityScore: p.userRatings.weightedQualityScore
  }));
  
  // Calculate expertise-weighted average
  const expertiseWeightedRating = papersWithRatings.length > 0 ?
    papersWithRatings.reduce((sum, p) => 
      sum + (p.userRatings.overallRating || 0) * (p.userRatings.expertiseMultiplier || 1), 0) /
    papersWithRatings.reduce((sum, p) => sum + (p.userRatings.expertiseMultiplier || 1), 0) : 0;
  
  return {
    available: true,
    papersWithRatings: papersWithRatings.length,
    overall: {
      mean: mean(allRatings),
      std: std(allRatings),
      median: median(allRatings),
      min: allRatings.length > 0 ? Math.min(...allRatings) : 0,
      max: allRatings.length > 0 ? Math.max(...allRatings) : 0,
      count: allRatings.length
    },
    normalizedOverall: {
      mean: mean(normalizedRatings),
      std: std(normalizedRatings)
    },
    expertiseWeighted: {
      avgExpertiseMultiplier: mean(expertiseMultipliers),
      weightedAvgRating: expertiseWeightedRating,
      avgEvaluatorCount: mean(evaluatorCounts),
      totalEvaluators: evaluatorCounts.reduce((sum, c) => sum + c, 0)
    },
    qualityMetrics: qualityMetricsSummary,
    distribution,
    byPaper,
    explanation: AGGREGATION_EXPLANATIONS.userRating
  };
};

/**
 * Correlation Analysis
 */
const analyzeCorrelations = (allProperties, paperData) => {
  const propsWithConfidence = allProperties.filter(p => p.hasValue && p.confidence > 0);
  
  // Confidence vs Evidence
  const withEvidence = propsWithConfidence.filter(p => p.hasEvidence);
  const withoutEvidence = propsWithConfidence.filter(p => !p.hasEvidence);
  
  const avgWithEvidence = withEvidence.length > 0 ? mean(withEvidence.map(p => p.confidence)) : null;
  const avgWithoutEvidence = withoutEvidence.length > 0 ? mean(withoutEvidence.map(p => p.confidence)) : null;
  
  let confidenceEvidenceInterpretation = 'Insufficient data to analyze';
  if (avgWithEvidence !== null && avgWithoutEvidence !== null) {
    confidenceEvidenceInterpretation = avgWithEvidence > avgWithoutEvidence + 0.05 
      ? 'Evidence presence correlates with higher confidence'
      : avgWithEvidence < avgWithoutEvidence - 0.05
        ? 'Unexpected: values without evidence have higher confidence'
        : 'No significant correlation';
  } else if (avgWithEvidence !== null && avgWithoutEvidence === null) {
    confidenceEvidenceInterpretation = `All ${withEvidence.length} values have evidence (100% evidence rate). Average confidence: ${avgWithEvidence.toFixed(3)}`;
  }
  
  // Granularity vs Confidence
  const highGranularity = propsWithConfidence.filter(p => p.granularityScore >= 0.8);
  const lowGranularity = propsWithConfidence.filter(p => p.granularityScore < 0.5);
  
  const avgHighGran = highGranularity.length > 0 ? mean(highGranularity.map(p => p.confidence)) : null;
  const avgLowGran = lowGranularity.length > 0 ? mean(lowGranularity.map(p => p.confidence)) : null;
  
  let granularityInterpretation = 'Insufficient data to analyze';
  if (avgHighGran !== null && avgLowGran !== null) {
    granularityInterpretation = avgHighGran > avgLowGran + 0.05
      ? 'Detailed values tend to have higher confidence'
      : avgHighGran < avgLowGran - 0.05
        ? 'Simple values tend to have higher confidence'
        : 'No significant correlation';
  } else if (avgHighGran !== null && avgLowGran === null) {
    granularityInterpretation = `Most values (${highGranularity.length}) have high granularity. Average confidence: ${avgHighGran.toFixed(3)}`;
  }
  
  return {
    confidenceEvidence: {
      withEvidenceAvgConfidence: avgWithEvidence || 0,
      withoutEvidenceAvgConfidence: avgWithoutEvidence || 0,
      withEvidenceCount: withEvidence.length,
      withoutEvidenceCount: withoutEvidence.length,
      interpretation: confidenceEvidenceInterpretation
    },
    granularityConfidence: {
      highGranularityAvgConfidence: avgHighGran || 0,
      lowGranularityAvgConfidence: avgLowGran || 0,
      highGranularityCount: highGranularity.length,
      lowGranularityCount: lowGranularity.length,
      interpretation: granularityInterpretation
    },
    confidenceEdit: paperData.some(p => p.editData.available) ? analyzeConfidenceEdit(paperData, allProperties) : null,
    explanation: AGGREGATION_EXPLANATIONS.correlations
  };
};

const analyzeConfidenceEdit = (paperData, allProperties) => {
  const papersWithEdit = paperData.filter(p => p.editData.available);
  if (papersWithEdit.length === 0) return null;
  
  const lowEditPapers = papersWithEdit.filter(p => p.editData.editScore >= 0.8).map(p => p.paperId);
  const highEditPapers = papersWithEdit.filter(p => p.editData.editScore < 0.8).map(p => p.paperId);
  
  const lowEditConfidences = allProperties
    .filter(p => lowEditPapers.includes(p.paperId) && p.confidence > 0)
    .map(p => p.confidence);
  const highEditConfidences = allProperties
    .filter(p => highEditPapers.includes(p.paperId) && p.confidence > 0)
    .map(p => p.confidence);
  
  return {
    lowEditAvgConfidence: mean(lowEditConfidences),
    highEditAvgConfidence: mean(highEditConfidences),
    interpretation: lowEditConfidences.length > 0 && highEditConfidences.length > 0
      ? (mean(lowEditConfidences) > mean(highEditConfidences) + 0.05
          ? 'Higher confidence correlates with fewer edits'
          : 'No significant correlation')
      : 'Insufficient data'
  };
};

/**
 * Calculate Final Score - v6 ENHANCED
 * Includes STD calculation from per-paper final scores
 */
const calculateFinalScore = (metrics, userWeight = 1.0, paperAnalysis = []) => {
  // Weights: Automated (60%) + User Rating (40%)
  const automatedWeights = {
    coverage: 0.20,
    granularity: 0.10,
    edits: 0.10,
    evidence: 0.15,
    confidence: 0.05
  };
  
  const userRatingWeight = 0.40;
  
  // Automated scores
  const automatedScores = {
    coverage: metrics.coverage.overall.coverageRate || 0,
    granularity: metrics.granularity.overall.mean || 0,
    edits: metrics.edits.available ? (metrics.edits.editScores.mean || 0.5) : 0.5,
    evidence: metrics.evidence.overall.evidenceRate || 0,
    confidence: metrics.confidence.overall.mean || 0
  };
  
  // Calculate automated component
  const automatedScore = Object.entries(automatedScores)
    .reduce((sum, [key, score]) => sum + score * automatedWeights[key], 0);
  
  // User rating component
  const userRatingScore = metrics.userRatings.available 
    ? (metrics.userRatings.normalizedOverall.mean || 0)
    : 0.5; // Default to middle if no ratings
  
  // Combined score
  const baseScore = metrics.userRatings.available
    ? automatedScore + (userRatingScore * userRatingWeight)
    : automatedScore / 0.6; // Normalize if no user ratings
  
  // Apply user weight (expertise)
  const weightedScore = Math.min(1, baseScore * userWeight);
  
  // Calculate STD from per-paper final scores
  const perPaperFinalScores = paperAnalysis
    .map(p => p.paperFinalScore)
    .filter(s => s !== undefined && s !== null);
  
  const finalScoreStd = std(perPaperFinalScores);
  
  // Quality level
  let qualityLevel = 'poor';
  let qualityDescription = '';
  
  if (weightedScore >= 0.8) {
    qualityLevel = 'excellent';
    qualityDescription = 'Excellent content quality across all dimensions';
  } else if (weightedScore >= 0.6) {
    qualityLevel = 'good';
    qualityDescription = 'Good content quality with minor areas for improvement';
  } else if (weightedScore >= 0.4) {
    qualityLevel = 'moderate';
    qualityDescription = 'Moderate content quality - several areas need attention';
  } else {
    qualityLevel = 'poor';
    qualityDescription = 'Content quality needs significant improvement';
  }
  
  return {
    automatedScores,
    automatedWeights,
    automatedScore,
    userRatingScore: metrics.userRatings.available ? userRatingScore : null,
    userRatingWeight: metrics.userRatings.available ? userRatingWeight : 0,
    baseScore,
    userWeight,
    weightedScore,
    std: finalScoreStd,
    min: perPaperFinalScores.length > 0 ? Math.min(...perPaperFinalScores) : weightedScore,
    max: perPaperFinalScores.length > 0 ? Math.max(...perPaperFinalScores) : weightedScore,
    median: median(perPaperFinalScores),
    perPaperScores: perPaperFinalScores,
    qualityLevel,
    qualityDescription,
    breakdown: [
      ...Object.entries(automatedScores).map(([metric, score]) => ({
        metric,
        score,
        weight: automatedWeights[metric],
        weighted: score * automatedWeights[metric],
        type: 'automated'
      })),
      ...(metrics.userRatings.available ? [{
        metric: 'userRating',
        score: userRatingScore,
        weight: userRatingWeight,
        weighted: userRatingScore * userRatingWeight,
        type: 'user',
        rawRating: metrics.userRatings.overall.mean
      }] : [])
    ],
    calculationMethod: metrics.userRatings.available 
      ? 'Combined: 60% Automated + 40% User Rating'
      : 'Automated only (no user ratings available)'
  };
};

/**
 * Prepare Chart Data - v6 ENHANCED
 * Now includes edit scores by paper and quality metrics radar
 */
const prepareChartData = (paperData, metrics) => {
  return {
    // Coverage per paper bar chart
    coverageByPaper: paperData.map(p => ({
      name: p.paperTitle.substring(0, 20) + '...',
      fullName: p.paperTitle,
      paperId: p.paperId,
      coverage: Math.round(p.metrics.coverageRate * 100),
      evidence: Math.round(p.metrics.evidenceRate * 100),
      confidence: Math.round(p.metrics.avgConfidence * 100)
    })),
    
    // Granularity distribution pie chart
    granularityPie: [
      { name: 'High (≥0.8)', value: metrics.granularity.qualityTiers.high, color: '#22c55e' },
      { name: 'Medium (0.5-0.8)', value: metrics.granularity.qualityTiers.medium, color: '#eab308' },
      { name: 'Low (<0.5)', value: metrics.granularity.qualityTiers.low, color: '#f97316' },
      { name: 'Empty', value: metrics.granularity.qualityTiers.empty, color: '#94a3b8' }
    ].filter(d => d.value > 0),
    
    // Confidence distribution pie chart
    confidencePie: [
      { name: 'High (≥0.8)', value: metrics.confidence.distribution.high.count, color: '#22c55e' },
      { name: 'Moderate (0.5-0.8)', value: metrics.confidence.distribution.moderate.count, color: '#eab308' },
      { name: 'Low (<0.5)', value: metrics.confidence.distribution.low.count, color: '#ef4444' }
    ].filter(d => d.value > 0),
    
    // User ratings per paper (v6: enhanced with quality metrics breakdown)
    userRatingsByPaper: metrics.userRatings.available ? metrics.userRatings.byPaper.map(p => ({
      name: p.paperTitle.substring(0, 20) + '...',
      fullName: p.paperTitle,
      paperId: p.paperId,
      rating: p.rating,
      overallAssessment: p.overallAssessment,
      normalizedRating: Math.round((p.normalizedRating || 0) * 100),
      expertiseMultiplier: p.expertiseMultiplier,
      evaluatorCount: p.evaluatorCount,
      weightedQualityScore: p.weightedQualityScore ? Math.round(p.weightedQualityScore * 100) : null,
      // Individual quality metrics (1-5 scale)
      propertyCoverage: p.qualityMetrics?.propertyCoverage?.rating,
      evidenceQuality: p.qualityMetrics?.evidenceQuality?.rating,
      valueAccuracy: p.qualityMetrics?.valueAccuracy?.rating
    })) : [],
    
    // v6: Quality metrics breakdown radar
    qualityMetricsRadar: metrics.userRatings.available && metrics.userRatings.qualityMetrics ? [
      { 
        metric: 'Property Coverage', 
        value: Math.round((metrics.userRatings.qualityMetrics.propertyCoverage?.mean || 0) / 5 * 100),
        rawValue: metrics.userRatings.qualityMetrics.propertyCoverage?.mean,
        weight: '40%',
        fullMark: 100 
      },
      { 
        metric: 'Evidence Quality', 
        value: Math.round((metrics.userRatings.qualityMetrics.evidenceQuality?.mean || 0) / 5 * 100),
        rawValue: metrics.userRatings.qualityMetrics.evidenceQuality?.mean,
        weight: '30%',
        fullMark: 100 
      },
      { 
        metric: 'Value Accuracy', 
        value: Math.round((metrics.userRatings.qualityMetrics.valueAccuracy?.mean || 0) / 5 * 100),
        rawValue: metrics.userRatings.qualityMetrics.valueAccuracy?.mean,
        weight: '30%',
        fullMark: 100 
      }
    ] : [],
    
    // v6: Edit scores by paper
    editScoresByPaper: paperData.filter(p => p.editData.available).map(p => ({
      name: p.paperTitle.substring(0, 20) + '...',
      fullName: p.paperTitle,
      paperId: p.paperId,
      editScore: Math.round(p.editData.editScore * 100),
      preservationRate: Math.round(p.editData.preservationRate * 100),
      editType: p.editData.type,
      added: p.editData.addedCount,
      removed: p.editData.removedCount,
      modified: p.editData.modifiedCount
    })),
    
    // Score breakdown radar chart
    scoreRadar: [
      { metric: 'Coverage', value: Math.round(metrics.coverage.overall.coverageRate * 100), fullMark: 100 },
      { metric: 'Evidence', value: Math.round(metrics.evidence.overall.evidenceRate * 100), fullMark: 100 },
      { metric: 'Confidence', value: Math.round(metrics.confidence.overall.mean * 100), fullMark: 100 },
      { metric: 'Granularity', value: Math.round(metrics.granularity.overall.mean * 100), fullMark: 100 },
      ...(metrics.userRatings.available ? [{ 
        metric: 'User Rating', 
        value: Math.round(metrics.userRatings.normalizedOverall.mean * 100), 
        fullMark: 100 
      }] : [])
    ],
    
    // Evidence by section
    evidenceBySectionBar: metrics.evidence.sectionDistribution.slice(0, 8).map(s => ({
      name: s.section.substring(0, 15) + (s.section.length > 15 ? '...' : ''),
      fullName: s.section,
      count: s.count,
      percentage: Math.round(s.percentage * 100)
    }))
  };
};

/**
 * Empty aggregation structure
 */
const getEmptyAggregation = () => ({
  coverage: { overall: { coverageRate: 0 }, perPaper: { mean: 0, std: 0 }, byProperty: [], explanation: AGGREGATION_EXPLANATIONS.coverage },
  granularity: { overall: { mean: 0, std: 0 }, qualityTiers: { high: 0, medium: 0, low: 0, empty: 0 }, typeDistribution: [], explanation: AGGREGATION_EXPLANATIONS.granularity },
  edits: { available: false, message: 'No data', explanation: AGGREGATION_EXPLANATIONS.edits },
  evidence: { overall: { evidenceRate: 0 }, sectionDistribution: [], explanation: AGGREGATION_EXPLANATIONS.evidence },
  confidence: { overall: { mean: 0, std: 0 }, distribution: { high: { count: 0 }, moderate: { count: 0 }, low: { count: 0 } }, explanation: AGGREGATION_EXPLANATIONS.confidence },
  valueTypes: { overall: { resources: 0, literals: 0, resourceRate: 0 }, explanation: AGGREGATION_EXPLANATIONS.valueTypes },
  userRatings: { available: false, overall: { mean: 0, std: 0 }, normalizedOverall: { mean: 0, std: 0 }, explanation: AGGREGATION_EXPLANATIONS.userRating },
  correlations: { explanation: AGGREGATION_EXPLANATIONS.correlations },
  paperAnalysis: [],
  finalScore: { weightedScore: 0, std: 0, qualityLevel: 'unknown', breakdown: [] },
  chartData: {},
  explanations: AGGREGATION_EXPLANATIONS,
  summary: { totalPapers: 0, totalPropertyValues: 0, papersWithUserRatings: 0, papersWithEditData: 0, version: 'v6' }
});

export default aggregateContentAnalysis;