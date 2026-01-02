// src/utils/userAgreementCalculation.js

/**
 * User Agreement Calculation Utilities
 * Updated to use correct data paths from evaluation-data-paths-reference.md
 */

import { calculateWeightsAndAgreement, expertiseToMultiplier } from '../components/evaluation/base/utils/baseMetricsUtils';

/**
 * Calculate agreement between user rating and system confidence
 * @param {number} userRating - User rating (1-5)
 * @param {number} systemConfidence - System confidence (0-1)
 * @param {number} expertiseWeight - Expertise weight
 * @returns {Object} Agreement metrics
 */
export const calculateFieldAgreement = (userRating, systemConfidence, expertiseWeight) => {
  if (userRating === undefined || systemConfidence === undefined) {
    return null;
  }
  
  // Use centralized calculation
  const expertiseMultiplier = expertiseToMultiplier(expertiseWeight);
  const result = calculateWeightsAndAgreement(systemConfidence, userRating, expertiseMultiplier);
  
  // Normalize agreement to 0-1 scale
  const normalizedAgreement = result.agreement;
  
  // Categorize agreement level
  let agreementLevel;
  if (normalizedAgreement >= 0.9) {
    agreementLevel = 'high';
  } else if (normalizedAgreement >= 0.7) {
    agreementLevel = 'medium';
  } else if (normalizedAgreement >= 0.5) {
    agreementLevel = 'low';
  } else {
    agreementLevel = 'disagreement';
  }
  
  return {
    userRating,
    systemConfidence,
    expertiseWeight,
    expertiseMultiplier,
    agreement: normalizedAgreement,
    weightedAgreement: result.finalScore,
    agreementBonus: result.agreementBonus,
    agreementLevel,
    details: result
  };
};

/**
 * Aggregate user agreement across multiple fields
 * @param {Object} userEvaluation - User evaluation data
 * @param {Object} systemData - System analysis data
 * @returns {Object} Aggregated agreement metrics
 */
export const aggregateUserAgreement = (userEvaluation, systemData) => {
  if (!userEvaluation || !systemData) {
    return null;
  }
  
  const expertiseWeight = userEvaluation.userInfo?.expertiseWeight || 5;
  const agreements = {
    metadata: [],
    researchField: null,
    researchProblem: null,
    template: null,
    content: null
  };
  
  // Metadata field agreements
  const metadataAssessment = userEvaluation.evaluationState?.metadata?.finalAssessment;
  if (metadataAssessment && systemData.metadata) {
    ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(fieldId => {
      const assessment = metadataAssessment[fieldId];
      if (assessment && assessment.rating) {
        // Get system confidence - use accuracy score as proxy if available
        const systemConfidence = assessment.accuracyScore || 0.8;
        
        const agreement = calculateFieldAgreement(
          assessment.rating,
          systemConfidence,
          expertiseWeight
        );
        
        if (agreement) {
          agreements.metadata.push({
            field: fieldId,
            ...agreement
          });
        }
      }
    });
  }
  
  // Research field agreement
  const fieldAssessment = userEvaluation.evaluationState?.research_field?.finalAssessment;
  if (fieldAssessment && systemData.researchFields) {
    const selectedField = systemData.researchFields.selectedField || systemData.researchFields.fields?.[0];
    const systemConfidence = selectedField?.score || selectedField?.confidence || 0.8;
    
    // Use overall rating if available, otherwise primary field rating
    const rating = fieldAssessment.overall?.rating || fieldAssessment.primaryField?.rating;
    
    if (rating) {
      agreements.researchField = calculateFieldAgreement(
        rating,
        systemConfidence,
        expertiseWeight
      );
    }
  }
  
  // Research problem agreement
  const problemAssessment = userEvaluation.evaluationState?.research_problem?.finalAssessment;
  if (problemAssessment && systemData.researchProblems) {
    const selectedProblem = systemData.researchProblems.selectedProblem;
    const systemConfidence = selectedProblem?.confidence || selectedProblem?.similarity || 0.8;
    
    // Use overall rating if available, otherwise problem identification rating
    const rating = problemAssessment.overall?.rating || problemAssessment.problemIdentification?.rating;
    
    if (rating) {
      agreements.researchProblem = calculateFieldAgreement(
        rating,
        systemConfidence,
        expertiseWeight
      );
    }
  }
  
  // Template agreement
  const templateAssessment = userEvaluation.evaluationState?.template?.finalAssessment;
  if (templateAssessment && systemData.templates) {
    const selectedTemplate = systemData.templates.selectedTemplate;
    const systemConfidence = selectedTemplate?.confidence || 0.8;
    
    // Use overall score (convert from 0-1 to 1-5 scale)
    const overallScore = templateAssessment.overallScore;
    if (overallScore !== undefined) {
      agreements.template = calculateFieldAgreement(
        overallScore * 5, // Convert to 1-5 scale
        systemConfidence,
        expertiseWeight
      );
    }
  }
  
  // Content agreement
  const contentAssessment = userEvaluation.evaluationState?.content?.finalAssessment;
  if (contentAssessment?.metrics && systemData.content) {
    // Calculate average content score
    const metricScores = Object.values(contentAssessment.metrics)
      .filter(m => m && m.score !== undefined)
      .map(m => m.score);
    
    if (metricScores.length > 0) {
      const avgScore = metricScores.reduce((sum, s) => sum + s, 0) / metricScores.length;
      const systemConfidence = 0.8; // Default confidence for content
      
      agreements.content = calculateFieldAgreement(
        avgScore * 5, // Convert to 1-5 scale
        systemConfidence,
        expertiseWeight
      );
    }
  }
  
  // Calculate overall agreement
  const allAgreements = [
    ...agreements.metadata.map(a => a.agreement),
    agreements.researchField?.agreement,
    agreements.researchProblem?.agreement,
    agreements.template?.agreement,
    agreements.content?.agreement
  ].filter(a => a !== undefined && a !== null);
  
  const overallAgreement = allAgreements.length > 0 ?
    allAgreements.reduce((sum, a) => sum + a, 0) / allAgreements.length : 0;
  
  return {
    ...agreements,
    overall: {
      agreement: overallAgreement,
      agreementLevel: overallAgreement >= 0.9 ? 'high' :
                     overallAgreement >= 0.7 ? 'medium' :
                     overallAgreement >= 0.5 ? 'low' : 'disagreement',
      totalFields: allAgreements.length
    }
  };
};

/**
 * Calculate consensus across multiple user evaluations
 * @param {Array} userEvaluations - Array of user evaluations
 * @returns {Object} Consensus metrics
 */
export const calculateConsensus = (userEvaluations) => {
  if (!userEvaluations || userEvaluations.length === 0) {
    return null;
  }
  
  if (userEvaluations.length === 1) {
    return {
      evaluatorCount: 1,
      consensusLevel: 'single_evaluator',
      note: 'Only one evaluator, no consensus calculation possible'
    };
  }
  
  // Collect all ratings by field across all sections
  const ratingsByField = {};
  
  userEvaluations.forEach(evaluation => {
    // Metadata ratings
    const metadataAssessment = evaluation.evaluationState?.metadata?.finalAssessment;
    if (metadataAssessment) {
      ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(fieldId => {
        const key = `metadata.${fieldId}`;
        if (!ratingsByField[key]) {
          ratingsByField[key] = [];
        }
        const rating = metadataAssessment[fieldId]?.rating;
        if (rating) {
          ratingsByField[key].push({
            rating,
            expertiseWeight: evaluation.userInfo?.expertiseWeight || 5,
            evaluatorId: evaluation.userInfo?.email || 'anonymous'
          });
        }
      });
    }
    
    // Research field ratings
    const fieldAssessment = evaluation.evaluationState?.research_field?.finalAssessment;
    if (fieldAssessment) {
      const key = 'research_field.overall';
      if (!ratingsByField[key]) {
        ratingsByField[key] = [];
      }
      const rating = fieldAssessment.overall?.rating || fieldAssessment.primaryField?.rating;
      if (rating) {
        ratingsByField[key].push({
          rating,
          expertiseWeight: evaluation.userInfo?.expertiseWeight || 5,
          evaluatorId: evaluation.userInfo?.email || 'anonymous'
        });
      }
    }
    
    // Research problem ratings
    const problemAssessment = evaluation.evaluationState?.research_problem?.finalAssessment;
    if (problemAssessment) {
      const key = 'research_problem.overall';
      if (!ratingsByField[key]) {
        ratingsByField[key] = [];
      }
      const rating = problemAssessment.overall?.rating || problemAssessment.problemIdentification?.rating;
      if (rating) {
        ratingsByField[key].push({
          rating,
          expertiseWeight: evaluation.userInfo?.expertiseWeight || 5,
          evaluatorId: evaluation.userInfo?.email || 'anonymous'
        });
      }
    }
    
    // Template ratings (convert 0-1 to 1-5)
    const templateAssessment = evaluation.evaluationState?.template?.finalAssessment;
    if (templateAssessment?.overallScore !== undefined) {
      const key = 'template.overall';
      if (!ratingsByField[key]) {
        ratingsByField[key] = [];
      }
      ratingsByField[key].push({
        rating: templateAssessment.overallScore * 5,
        expertiseWeight: evaluation.userInfo?.expertiseWeight || 5,
        evaluatorId: evaluation.userInfo?.email || 'anonymous'
      });
    }
  });
  
  // Calculate consensus for each field
  const fieldConsensus = {};
  Object.keys(ratingsByField).forEach(fieldId => {
    const ratings = ratingsByField[fieldId];
    
    // Calculate weighted average
    const weightedSum = ratings.reduce((sum, r) => 
      sum + (r.rating * expertiseToMultiplier(r.expertiseWeight)), 0
    );
    const weightSum = ratings.reduce((sum, r) => 
      sum + expertiseToMultiplier(r.expertiseWeight), 0
    );
    const weightedAverage = weightSum > 0 ? weightedSum / weightSum : 0;
    
    // Calculate variance
    const variance = ratings.reduce((sum, r) => 
      sum + Math.pow(r.rating - weightedAverage, 2), 0
    ) / ratings.length;
    
    const stdDev = Math.sqrt(variance);
    
    // Calculate agreement percentage (ratings within 1 point of weighted average)
    const agreementCount = ratings.filter(r => 
      Math.abs(r.rating - weightedAverage) <= 1
    ).length;
    const agreementPercentage = (agreementCount / ratings.length) * 100;
    
    fieldConsensus[fieldId] = {
      ratingCount: ratings.length,
      weightedAverage,
      variance,
      standardDeviation: stdDev,
      agreementPercentage,
      consensusLevel: agreementPercentage >= 80 ? 'high' :
                     agreementPercentage >= 60 ? 'medium' : 'low'
    };
  });
  
  // Calculate overall consensus
  const allAgreementPercentages = Object.values(fieldConsensus).map(c => c.agreementPercentage);
  const overallAgreement = allAgreementPercentages.length > 0 ?
    allAgreementPercentages.reduce((sum, p) => sum + p, 0) / allAgreementPercentages.length : 0;
  
  // Calculate Fleiss' Kappa (inter-rater reliability)
  const fleissKappa = calculateFleissKappa(ratingsByField);
  
  return {
    evaluatorCount: userEvaluations.length,
    fieldConsensus,
    overall: {
      agreementPercentage: overallAgreement,
      consensusLevel: overallAgreement >= 80 ? 'high' :
                     overallAgreement >= 60 ? 'medium' : 'low',
      fleissKappa
    }
  };
};

/**
 * Calculate Fleiss' Kappa for inter-rater reliability
 * @param {Object} ratingsByField - Ratings organized by field
 * @returns {number} Fleiss' Kappa value
 */
const calculateFleissKappa = (ratingsByField) => {
  const fields = Object.keys(ratingsByField);
  if (fields.length === 0) return 0;
  
  const n = ratingsByField[fields[0]].length; // number of raters
  const N = fields.length; // number of subjects (fields)
  const k = 5; // number of categories (ratings 1-5)
  
  // Calculate proportion of all assignments in each category
  const p = new Array(k).fill(0);
  fields.forEach(fieldId => {
    ratingsByField[fieldId].forEach(r => {
      p[r.rating - 1]++;
    });
  });
  
  const totalAssignments = n * N;
  for (let i = 0; i < k; i++) {
    p[i] = p[i] / totalAssignments;
  }
  
  // Calculate Pe (expected agreement)
  let Pe = 0;
  for (let i = 0; i < k; i++) {
    Pe += p[i] * p[i];
  }
  
  // Calculate P (observed agreement)
  let P = 0;
  fields.forEach(fieldId => {
    const ratings = ratingsByField[fieldId];
    const n_i = new Array(k).fill(0);
    
    ratings.forEach(r => {
      n_i[r.rating - 1]++;
    });
    
    let sum = 0;
    for (let j = 0; j < k; j++) {
      sum += n_i[j] * n_i[j];
    }
    
    P += (sum - n) / (n * (n - 1));
  });
  
  P = P / N;
  
  // Calculate Kappa
  const kappa = (P - Pe) / (1 - Pe);
  
  return kappa;
};

/**
 * Analyze disagreement patterns
 * @param {Array} userEvaluations - Array of user evaluations
 * @param {Object} systemData - System analysis data
 * @returns {Object} Disagreement analysis
 */
export const analyzeDisagreementPatterns = (userEvaluations, systemData) => {
  if (!userEvaluations || userEvaluations.length === 0) {
    return null;
  }
  
  const patterns = {
    highDisagreementFields: [],
    systemOverconfident: [],
    systemUnderconfident: [],
    expertiseDifferences: []
  };
  
  // Collect ratings by field across all sections
  const ratingsByField = {};
  
  userEvaluations.forEach(evaluation => {
    // Metadata ratings
    const metadataAssessment = evaluation.evaluationState?.metadata?.finalAssessment;
    if (metadataAssessment) {
      ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(fieldId => {
        const key = `metadata.${fieldId}`;
        if (!ratingsByField[key]) {
          ratingsByField[key] = [];
        }
        const rating = metadataAssessment[fieldId]?.rating;
        if (rating) {
          ratingsByField[key].push({
            rating,
            expertiseWeight: evaluation.userInfo?.expertiseWeight || 5,
            evaluatorId: evaluation.userInfo?.email || 'anonymous'
          });
        }
      });
    }
    
    // Research field ratings
    const fieldAssessment = evaluation.evaluationState?.research_field?.finalAssessment;
    if (fieldAssessment) {
      const key = 'research_field.overall';
      if (!ratingsByField[key]) {
        ratingsByField[key] = [];
      }
      const rating = fieldAssessment.overall?.rating || fieldAssessment.primaryField?.rating;
      if (rating) {
        ratingsByField[key].push({
          rating,
          expertiseWeight: evaluation.userInfo?.expertiseWeight || 5,
          evaluatorId: evaluation.userInfo?.email || 'anonymous'
        });
      }
    }
    
    // Research problem ratings
    const problemAssessment = evaluation.evaluationState?.research_problem?.finalAssessment;
    if (problemAssessment) {
      const key = 'research_problem.overall';
      if (!ratingsByField[key]) {
        ratingsByField[key] = [];
      }
      const rating = problemAssessment.overall?.rating || problemAssessment.problemIdentification?.rating;
      if (rating) {
        ratingsByField[key].push({
          rating,
          expertiseWeight: evaluation.userInfo?.expertiseWeight || 5,
          evaluatorId: evaluation.userInfo?.email || 'anonymous'
        });
      }
    }
  });
  
  // Analyze each field
  Object.keys(ratingsByField).forEach(fieldId => {
    const ratings = ratingsByField[fieldId];
    
    // Calculate variance
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => 
      sum + Math.pow(r.rating - avg, 2), 0
    ) / ratings.length;
    
    // High disagreement (high variance)
    if (variance > 1.5) {
      patterns.highDisagreementFields.push({
        field: fieldId,
        variance,
        averageRating: avg,
        ratings: ratings.map(r => r.rating)
      });
    }
    
    // Check expertise differences
    const highExpertise = ratings.filter(r => r.expertiseWeight >= 4);
    const lowExpertise = ratings.filter(r => r.expertiseWeight < 4);
    
    if (highExpertise.length > 0 && lowExpertise.length > 0) {
      const highAvg = highExpertise.reduce((sum, r) => sum + r.rating, 0) / highExpertise.length;
      const lowAvg = lowExpertise.reduce((sum, r) => sum + r.rating, 0) / lowExpertise.length;
      
      if (Math.abs(highAvg - lowAvg) > 1) {
        patterns.expertiseDifferences.push({
          field: fieldId,
          highExpertiseAvg: highAvg,
          lowExpertiseAvg: lowAvg,
          difference: Math.abs(highAvg - lowAvg)
        });
      }
    }
  });
  
  return patterns;
};

/**
 * Calculate inter-rater reliability metrics
 * @param {Array} userEvaluations - Array of user evaluations
 * @returns {Object} Reliability metrics
 */
export const calculateInterRaterReliability = (userEvaluations) => {
  if (!userEvaluations || userEvaluations.length < 2) {
    return null;
  }
  
  // Collect ratings by field across all sections
  const ratingsByField = {};
  
  userEvaluations.forEach(evaluation => {
    // Metadata ratings
    const metadataAssessment = evaluation.evaluationState?.metadata?.finalAssessment;
    if (metadataAssessment) {
      ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(fieldId => {
        const key = `metadata.${fieldId}`;
        if (!ratingsByField[key]) {
          ratingsByField[key] = [];
        }
        const rating = metadataAssessment[fieldId]?.rating;
        if (rating) {
          ratingsByField[key].push(rating);
        }
      });
    }
    
    // Research field ratings
    const fieldAssessment = evaluation.evaluationState?.research_field?.finalAssessment;
    if (fieldAssessment) {
      const key = 'research_field.overall';
      if (!ratingsByField[key]) {
        ratingsByField[key] = [];
      }
      const rating = fieldAssessment.overall?.rating || fieldAssessment.primaryField?.rating;
      if (rating) {
        ratingsByField[key].push(rating);
      }
    }
    
    // Research problem ratings
    const problemAssessment = evaluation.evaluationState?.research_problem?.finalAssessment;
    if (problemAssessment) {
      const key = 'research_problem.overall';
      if (!ratingsByField[key]) {
        ratingsByField[key] = [];
      }
      const rating = problemAssessment.overall?.rating || problemAssessment.problemIdentification?.rating;
      if (rating) {
        ratingsByField[key].push(rating);
      }
    }
  });
  
  // Calculate agreement percentage
  let totalAgreement = 0;
  let fieldCount = 0;
  
  Object.values(ratingsByField).forEach(ratings => {
    if (ratings.length >= 2) {
      // Calculate percentage of ratings within 1 point of each other
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const withinOne = ratings.filter(r => Math.abs(r - avg) <= 1).length;
      const agreementPct = (withinOne / ratings.length) * 100;
      
      totalAgreement += agreementPct;
      fieldCount++;
    }
  });
  
  const overallAgreement = fieldCount > 0 ? totalAgreement / fieldCount : 0;
  
  // Calculate Fleiss' Kappa
  const fleissKappa = calculateFleissKappa(ratingsByField);
  
  // Interpret Kappa
  let kappaInterpretation;
  if (fleissKappa < 0) kappaInterpretation = 'poor';
  else if (fleissKappa < 0.20) kappaInterpretation = 'slight';
  else if (fleissKappa < 0.40) kappaInterpretation = 'fair';
  else if (fleissKappa < 0.60) kappaInterpretation = 'moderate';
  else if (fleissKappa < 0.80) kappaInterpretation = 'substantial';
  else kappaInterpretation = 'almost perfect';
  
  return {
    evaluatorCount: userEvaluations.length,
    overallAgreement,
    fleissKappa,
    kappaInterpretation,
    fieldsAnalyzed: fieldCount
  };
};