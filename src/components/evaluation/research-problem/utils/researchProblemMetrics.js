// src/components/evaluation/research-problem/utils/researchProblemMetrics.js

import { calculateWeightsAndAgreement, formatPercentage } from '../../base/utils/baseMetricsUtils';
import { storeFieldMetrics } from '../../base/utils/storageUtils';
import { QUALITY_WEIGHTS, PROBLEM_ACCURACY_WEIGHTS } from '../config/researchProblemConfig';
import { calculateContentSimilarity } from './contentAnalysisUtils';

/**
 * Process research problem accuracy metrics with enhanced precision/recall
 */
export const processResearchProblemAccuracy = (
  fieldType,
  groundTruth,
  problemData,
  rating,
  expertiseMultiplier
) => {
  // Extract the problem data
  const { title, description } = extractProblemData(problemData);
  
  // Calculate similarity between problem and ground truth
  const similarityData = calculateContentSimilarity(groundTruth, { title, description });
  
  // Enhanced precision and recall calculation
  const useAbstract = typeof groundTruth === 'string';
  
  // Calculate precision - how much of the problem content is accurate 
  // (for abstract, this uses semantic matching; for ORKG, uses direct text matching)
  const precision = useAbstract ? 
    (similarityData.titleTokenMetrics.precision * 0.4) + (similarityData.descriptionTokenMetrics.precision * 0.6) :
    similarityData.descriptionTokenMetrics.precision;
    
  // Calculate recall - how much of the ground truth is covered
  const recall = useAbstract ?
    (similarityData.titleTokenMetrics.recall * 0.3) + (similarityData.descriptionTokenMetrics.recall * 0.7) :
    similarityData.descriptionTokenMetrics.recall;
    
  // Calculate F1 score
  const f1Score = precision + recall > 0 ? 
    (2 * precision * recall) / (precision + recall) : 0;
  
  // Update similarity data with precision, recall, and F1
  similarityData.precision = precision;
  similarityData.recall = recall;
  similarityData.f1Score = f1Score;
  
  // Calculate automated overall score using weights from config
  const automatedOverallScore = 
    (similarityData.titleAlignment * PROBLEM_ACCURACY_WEIGHTS.titleAlignment) +
    (similarityData.contentCoverage * PROBLEM_ACCURACY_WEIGHTS.contentCoverage) +
    (similarityData.specificity * PROBLEM_ACCURACY_WEIGHTS.specificity);
  
  // Update similarity data with overall score
  similarityData.automatedOverallScore = automatedOverallScore;
  similarityData.overallScore = automatedOverallScore;
  
  // Calculate score details with weights and agreement
  const scoreDetails = calculateWeightsAndAgreement(
    automatedOverallScore,
    rating,
    expertiseMultiplier
  );
  
  // Update similarity data with final balanced score
  similarityData.finalScore = scoreDetails.finalScore;
  
  // ✅ FIX: Store directly under researchProblem (no nested field key)
  // Structure: evaluation_metrics.accuracy.researchProblem.{data}
  const accuracyData = {
    similarityData,
    scoreDetails,
    rating,
    expertiseMultiplier
  };
  
  // Store using custom logic to avoid nested keys
  const store = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
  if (!store.accuracy) store.accuracy = {};
  store.accuracy.researchProblem = accuracyData;
  localStorage.setItem('evaluation_metrics', JSON.stringify(store));
  
  return {
    similarityData,
    scoreDetails
  };
};

/**
 * Process research problem quality evaluation
 */
export const processResearchProblemQuality = (
  fieldType,
  qualityAnalysis,
  rating,
  expertiseMultiplier,
  qualityWeights = QUALITY_WEIGHTS
) => {
  // Ensure qualityAnalysis has all required fields
  const validatedQualityAnalysis = {
    problemTitle: qualityAnalysis?.problemTitle || 0,
    problemDescription: qualityAnalysis?.problemDescription || 0,
    relevance: qualityAnalysis?.relevance || 0,
    evidenceQuality: qualityAnalysis?.evidenceQuality || 0,
    ...qualityAnalysis
  };
  
  // Calculate automated overall score
  const automatedOverallScore = (
    (validatedQualityAnalysis.problemTitle * qualityWeights.problemTitle) + 
    (validatedQualityAnalysis.problemDescription * qualityWeights.problemDescription) + 
    (validatedQualityAnalysis.relevance * qualityWeights.relevance) + 
    (validatedQualityAnalysis.evidenceQuality * qualityWeights.evidenceQuality)
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
      problemTitle: { 
        score: validatedQualityAnalysis.problemTitle,
        issues: validatedQualityAnalysis.problemTitle < 0.7 ? 
          ['Could improve title formulation'] : []
      },
      problemDescription: { 
        score: validatedQualityAnalysis.problemDescription,
        issues: validatedQualityAnalysis.problemDescription < 0.7 ? 
          ['Description could be more comprehensive'] : []
      },
      relevance: { 
        score: validatedQualityAnalysis.relevance,
        issues: validatedQualityAnalysis.relevance < 0.7 ? 
          ['Could better align with paper content'] : []
      },
      evidenceQuality: { 
        score: validatedQualityAnalysis.evidenceQuality,
        issues: validatedQualityAnalysis.evidenceQuality < 0.7 ? 
          ['Could include more supporting evidence'] : []
      }
    },
    weights: qualityWeights,
    overallScore: automatedOverallScore,
    automatedOverallScore,
    finalScore: scoreDetails.finalScore,
    details: validatedQualityAnalysis.details || {}
  };
  
  // ✅ FIX: Store directly under researchProblem (no nested field key)
  // Structure: evaluation_metrics.quality.researchProblem.{data}
  const qualityFullData = {
    qualityData,
    qualityAnalysis: validatedQualityAnalysis,
    weights: qualityWeights,
    rating,
    expertiseMultiplier,
    scoreDetails
  };
  
  // Store using custom logic to avoid nested keys
  const store = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
  if (!store.quality) store.quality = {};
  store.quality.researchProblem = qualityFullData;
  localStorage.setItem('evaluation_metrics', JSON.stringify(store));
  
  return {
    qualityData,
    scoreDetails
  };
};

// Rest of the functions remain the same...
export const extractProblemData = (problemData) => {
  if (!problemData) return { title: '', description: '' };
  
  // Handle case where problemData is already in the right format
  if (problemData.title !== undefined && (problemData.problem !== undefined || problemData.description !== undefined)) {
    return {
      title: problemData.title || '',
      description: problemData.problem || problemData.description || ''
    };
  }
  
  // Handle case where problemData is an LLM problem object
  if (problemData.problem_title !== undefined && problemData.problem_description !== undefined) {
    return {
      title: problemData.problem_title || '',
      description: problemData.problem_description || ''
    };
  }
  
  // Default fallback (try to extract from string or object)
  return {
    title: typeof problemData === 'object' ? 
      (problemData.title || problemData.name || '') : 
      (typeof problemData === 'string' ? problemData : ''),
    description: typeof problemData === 'object' ? 
      (problemData.description || problemData.content || problemData.problem || '') : 
      ''
  };
};

export const extractGroundTruth = (evaluationData, useAbstract = true) => {
  if (!evaluationData) return '';
  
  // Use abstract as ground truth if specified
  if (useAbstract && evaluationData.metadata?.abstract) {
    return evaluationData.metadata.abstract;
  }
  
  // If no abstract or useAbstract is false, try selected problem
  if (evaluationData.researchProblems?.selectedProblem) {
    return evaluationData.researchProblems.selectedProblem;
  }
  
  return '';
};

export const extractProblemFromEvalData = (evaluationData) => {
  if (!evaluationData || !evaluationData.researchProblems) return null;
  
  // First try to get edited problem
  if (evaluationData.researchProblems.llm_problem) {
    return evaluationData.researchProblems.llm_problem;
  }
  
  // Then try original problem
  if (evaluationData.researchProblems.original_llm_problem) {
    return evaluationData.researchProblems.original_llm_problem;
  }
  
  return null;
};

// Format helpers
export const formatUserRating = (rating, expertiseMultiplier = 1) => {
  // Format user rating with expertise indicator
  if (!rating) return '0';
  
  const formattedRating = typeof rating === 'number' ? rating.toFixed(1) : rating;
  
  // If expertise multiplier is significant, show it
  if (expertiseMultiplier > 1.05) {
    return `${formattedRating}×${expertiseMultiplier.toFixed(1)}`;
  }
  
  return formattedRating;
};