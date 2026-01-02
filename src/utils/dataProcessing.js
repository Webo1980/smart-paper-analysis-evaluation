// src/utils/dataProcessing.js
// CORRECTED VERSION - All paths updated to match evaluation-data-paths-reference.md

export const processEvaluationData = (evaluations) => {
  if (!evaluations || evaluations.length === 0) {
    return {
      evaluations: [],
      summary: {
        totalEvaluations: 0,
        avgExpertiseWeight: 0,
        avgCompleteness: 0,
        avgOverallScore: 0,
        roleDistribution: {},
        sectionStats: {}
      }
    };
  }

  console.log('Processing evaluations:', evaluations.length);
  console.log('Sample evaluation:', evaluations[0]);

  // Calculate summary statistics
  const summary = {
    totalEvaluations: evaluations.length,
    avgExpertiseWeight: 0,
    avgCompleteness: 0,
    avgOverallScore: 0,
    roleDistribution: {},
    sectionStats: {}
  };

  let totalExpertise = 0;
  let totalCompleteness = 0;
  let totalScore = 0;

  evaluations.forEach(evaluation => {
    // CORRECTED: Extract user info with fallbacks
    const userInfo = evaluation.userInfo || {};
    const role = userInfo.role || 'Unknown';
    
    // CORRECTED: Get expertise weight from userInfo ONLY (not from root level)
    // OLD: const expertiseWeight = evaluation.expertiseWeight || userInfo.expertiseWeight || 0;
    // NEW: Only one correct location
    const expertiseWeight = userInfo.expertiseWeight || 0;
    
    // Count roles
    summary.roleDistribution[role] = (summary.roleDistribution[role] || 0) + 1;

    // Sum up metrics
    totalExpertise += expertiseWeight;
    totalCompleteness += calculateCompleteness(evaluation);
    totalScore += calculateOverallScore(evaluation);

    // CORRECTED: Process section statistics through evaluationState
    // OLD: const sections = evaluation.sections || {};
    // NEW: Access through evaluationState
    const evaluationState = evaluation.evaluationState || {};
    
    // CORRECTED: Use explicit section keys instead of Object.keys
    const sectionKeys = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    
    sectionKeys.forEach(sectionKey => {
      if (!summary.sectionStats[sectionKey]) {
        summary.sectionStats[sectionKey] = {
          count: 0,
          avgRating: 0,
          totalRating: 0
        };
      }
      
      // CORRECTED: Access section through evaluationState
      const section = evaluationState[sectionKey];
      if (section && section.userAssessment) {
        const ratings = extractRatings(section.userAssessment);
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;
        
        summary.sectionStats[sectionKey].count++;
        summary.sectionStats[sectionKey].totalRating += avgRating;
      }
    });
  });

  // Calculate averages
  summary.avgExpertiseWeight = evaluations.length > 0 ? totalExpertise / evaluations.length : 0;
  summary.avgCompleteness = evaluations.length > 0 ? totalCompleteness / evaluations.length : 0;
  summary.avgOverallScore = evaluations.length > 0 ? totalScore / evaluations.length : 0;

  // Calculate average ratings for sections
  Object.keys(summary.sectionStats).forEach(section => {
    const stats = summary.sectionStats[section];
    if (stats.count > 0) {
      stats.avgRating = stats.totalRating / stats.count;
    }
  });

  const processedEvaluations = evaluations.map(e => {
    const userInfo = e.userInfo || {};
    
    // CORRECTED: Get expertise weight from userInfo only
    // OLD: const expertiseWeight = e.expertiseWeight || userInfo.expertiseWeight || 0;
    // NEW: Only one correct location
    const expertiseWeight = userInfo.expertiseWeight || 0;
    
    // CORRECTED: Build processed evaluation object
    return {
      ...e,
      // REMOVED: Don't add expertiseWeight at root level - it should only be in userInfo
      // OLD: expertiseWeight, // This was wrong!
      
      // Add calculated metrics
      completeness: calculateCompleteness(e),
      overallScore: calculateOverallScore(e),
      assessments: extractAssessments(e),
      
      // CORRECTED: Timestamp from root level only
      // OLD: timestamp: e.timestamp || e.date || e.createdAt || new Date().toISOString()
      // NEW: Simple fallback (date and createdAt don't exist)
      timestamp: e.timestamp || new Date().toISOString(),
      
      // Add paper metadata for convenience
      paperDoi: e.metadata?.paperDoi,
      paperTitle: e.metadata?.paperTitle
    };
  });

  console.log('Processed evaluations sample:', processedEvaluations[0]);

  return {
    evaluations: processedEvaluations,
    summary
  };
};

/**
 * Calculate completeness based on evaluationState sections
 * CORRECTED: Use evaluationState instead of sections
 */
const calculateCompleteness = (evaluation) => {
  // CORRECTED: Access evaluationState, not sections
  // OLD: const sections = evaluation.sections || {};
  // NEW: Correct path
  const evaluationState = evaluation.evaluationState || {};
  
  let totalFields = 0;
  let completedFields = 0;

  // CORRECTED: Use explicit section keys
  const sectionKeys = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
  
  sectionKeys.forEach(sectionKey => {
    // CORRECTED: Access section through evaluationState
    const section = evaluationState[sectionKey];
    
    if (section && section.userAssessment) {
      Object.entries(section.userAssessment).forEach(([key, value]) => {
        if (key !== 'overall' && key !== 'comments') {
          totalFields++;
          if (value && typeof value === 'object' && value.rating > 0) {
            completedFields++;
          } else if (typeof value === 'number' && value > 0) {
            completedFields++;
          }
        }
      });
    }
  });

  return totalFields > 0 ? completedFields / totalFields : 0;
};

/**
 * Calculate overall score from all sections
 * CORRECTED: Use evaluationState instead of sections
 */
const calculateOverallScore = (evaluation) => {
  // CORRECTED: Access evaluationState, not sections
  // OLD: const sections = evaluation.sections || {};
  // NEW: Correct path
  const evaluationState = evaluation.evaluationState || {};
  
  const scores = [];
  
  // CORRECTED: Use explicit section keys
  const sectionKeys = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
  
  sectionKeys.forEach(sectionKey => {
    // CORRECTED: Access section through evaluationState
    const section = evaluationState[sectionKey];
    
    if (section && section.userAssessment) {
      const ratings = extractRatings(section.userAssessment);
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        scores.push(avgRating);
      }
    }
  });

  // CORRECTED: Also check finalVerdict if available
  if (evaluationState.finalVerdict?.assessment?.overallScore?.rating) {
    scores.push(evaluationState.finalVerdict.assessment.overallScore.rating);
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
};

/**
 * Extract ratings from user assessment
 * No changes needed - this function works correctly
 */
const extractRatings = (assessment) => {
  const ratings = [];
  
  Object.entries(assessment).forEach(([key, value]) => {
    if (key !== 'overall' && key !== 'comments') {
      if (value && typeof value === 'object' && typeof value.rating === 'number') {
        ratings.push(value.rating);
      } else if (typeof value === 'number') {
        ratings.push(value);
      }
    }
  });

  return ratings;
};

/**
 * Extract assessments from all sections
 * CORRECTED: Use evaluationState instead of sections
 */
const extractAssessments = (evaluation) => {
  const assessments = {};
  
  // CORRECTED: Access evaluationState, not sections
  // OLD: const sections = evaluation.sections || {};
  // NEW: Correct path
  const evaluationState = evaluation.evaluationState || {};
  
  // CORRECTED: Use explicit section keys (including additional sections)
  const sectionKeys = ['metadata', 'research_field', 'research_problem', 'template', 'content', 'systemPerformance', 'finalVerdict'];
  
  sectionKeys.forEach(sectionKey => {
    // CORRECTED: Access section through evaluationState
    const section = evaluationState[sectionKey];
    
    if (section && section.userAssessment) {
      assessments[sectionKey] = {
        ratings: {},
        comments: {}
      };

      Object.entries(section.userAssessment).forEach(([field, value]) => {
        if (field !== 'overall' && field !== 'comments') {
          if (value && typeof value === 'object') {
            assessments[sectionKey].ratings[field] = value.rating || 0;
            assessments[sectionKey].comments[field] = value.comments || '';
          } else if (typeof value === 'number') {
            assessments[sectionKey].ratings[field] = value;
          }
        }
      });
    }
  });

  return assessments;
};

// ADDED: New helper functions for accessing specific data

/**
 * Get metadata field assessment
 * Path: evaluationState.metadata.finalAssessment.{field}
 */
export const getMetadataFieldAssessment = (evaluation, fieldName) => {
  return evaluation?.evaluationState?.metadata?.finalAssessment?.[fieldName];
};

/**
 * Get research field assessment
 * Path: evaluationState.research_field.finalAssessment
 */
export const getResearchFieldAssessment = (evaluation) => {
  return evaluation?.evaluationState?.research_field?.finalAssessment;
};

/**
 * Get research problem assessment
 * Path: evaluationState.research_problem.finalAssessment
 */
export const getResearchProblemAssessment = (evaluation) => {
  return evaluation?.evaluationState?.research_problem?.finalAssessment;
};

/**
 * Get template assessment
 * Path: evaluationState.template.finalAssessment
 */
export const getTemplateAssessment = (evaluation) => {
  return evaluation?.evaluationState?.template?.finalAssessment;
};

/**
 * Get content assessment
 * Path: evaluationState.content.finalAssessment
 */
export const getContentAssessment = (evaluation) => {
  return evaluation?.evaluationState?.content?.finalAssessment;
};

/**
 * Get user information
 * Path: userInfo at root level
 */
export const getUserInfo = (evaluation) => {
  return evaluation?.userInfo;
};

/**
 * Get expertise weight
 * Path: userInfo.expertiseWeight
 */
export const getExpertiseWeight = (evaluation) => {
  return evaluation?.userInfo?.expertiseWeight || 0;
};

/**
 * Get expertise multiplier
 * Path: userInfo.expertiseMultiplier
 */
export const getExpertiseMultiplier = (evaluation) => {
  return evaluation?.userInfo?.expertiseMultiplier || 1;
};

/**
 * Get paper metadata
 * Path: metadata at root level
 */
export const getPaperMetadata = (evaluation) => {
  return {
    doi: evaluation?.metadata?.paperDoi,
    title: evaluation?.metadata?.paperTitle,
    evaluatorName: evaluation?.metadata?.evaluatorName,
    evaluatorRole: evaluation?.metadata?.evaluatorRole
  };
};

/**
 * Check if evaluation is complete
 * Path: evaluationState.finalVerdict.completed
 */
export const isEvaluationComplete = (evaluation) => {
  return evaluation?.evaluationState?.finalVerdict?.completed === true;
};

/**
 * Get final verdict
 * Path: evaluationState.finalVerdict
 */
export const getFinalVerdict = (evaluation) => {
  return evaluation?.evaluationState?.finalVerdict;
};