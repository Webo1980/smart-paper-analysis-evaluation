// src/components/evaluation/research-problem/utils/researchProblemEvaluation.js

import { extractProblemData, extractGroundTruth, extractProblemFromEvalData } from './researchProblemMetrics';
import { calculateQualityMetrics } from './advancedProblemMetricsUtils';
import { calculateContentSimilarity } from './contentAnalysisUtils';
import { calculateTokenAccuracy } from './advancedProblemMetricsUtils';

/**
 * Evaluate research problem against ground truth
 * @param {Object} evaluationData - Complete evaluation data
 * @param {boolean} useAbstract - Whether to use abstract as ground truth
 * @returns {Object} - Evaluation results
 */
export const evaluateResearchProblem = async (evaluationData, useAbstract = true) => {
  try {
    // Extract ground truth
    const groundTruth = extractGroundTruth(evaluationData, useAbstract);
    
    // Extract problem (edited if available, otherwise original)
    const problemData = extractProblemFromEvalData(evaluationData);
    
    // If no problem data, return empty result
    if (!problemData) {
      return {
        success: false,
        error: 'No research problem found in evaluation data',
        metrics: {
          accuracy: 0.5,
          titleAlignment: 0.5,
          contentCoverage: 0.5, 
          specificity: 0.5,
          precision: 0.5,
          recall: 0.5,
          f1Score: 0.5,
          quality: {
            overallQuality: 0.5,
            relevance: 0.5,
            completeness: 0.5,
            evidenceQuality: 0.5
          }
        }
      };
    }
    
    // Normalize problem data
    const problem = extractProblemData(problemData);
    
    // Calculate content similarity metrics
    const similarityData = calculateContentSimilarity(groundTruth, problem);
    
    // Calculate precision, recall and F1 with enhanced accuracy
    // Use different approaches for abstract vs. ORKG
    let precision, recall, f1Score;
    
    if (useAbstract) {
      const titleAccuracy = calculateTokenAccuracy(
        typeof groundTruth === 'string' ? groundTruth.split('.')[0] : groundTruth.title || '',
        problem.title
      );
      
      const descriptionAccuracy = calculateTokenAccuracy(
        typeof groundTruth === 'string' ? groundTruth : groundTruth.description || '',
        problem.description
      );
      
      // Combine accuracy scores with weights
      precision = (titleAccuracy.precision * 0.4) + (descriptionAccuracy.precision * 0.6);
      recall = (titleAccuracy.recall * 0.3) + (descriptionAccuracy.recall * 0.7);
    } else {
      // Direct comparison for ORKG problems
      const combinedAccuracy = calculateTokenAccuracy(
        `${typeof groundTruth === 'object' ? groundTruth.title || '' : ''} ${typeof groundTruth === 'object' ? groundTruth.description || '' : ''}`,
        `${problem.title} ${problem.description}`
      );
      
      precision = combinedAccuracy.precision;
      recall = combinedAccuracy.recall;
    }
    
    // Calculate F1 score
    f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
    // Add precision, recall, and F1 to similarity data
    similarityData.precision = precision;
    similarityData.recall = recall;
    similarityData.f1Score = f1Score;
    
    // Calculate quality metrics if we have an abstract
    let qualityMetrics = {
      relevance: 0.5,
      completeness: 0.5,
      evidenceQuality: 0.5,
      details: {
        relevanceReason: 'No abstract available',
        completenessReason: 'No abstract available',
        evidenceQualityReason: 'No abstract available'
      }
    };
    
    if (useAbstract && evaluationData.metadata && evaluationData.metadata.abstract) {
      qualityMetrics = calculateQualityMetrics(problem, evaluationData.metadata.abstract);
    } else if (typeof groundTruth === 'object') {
      // Use ORKG problem text as ground truth for quality
      qualityMetrics = calculateQualityMetrics(problem, groundTruth.description || '');
    }
    
    // Calculate overall accuracy score
    const accuracyScore = (
      (similarityData.titleAlignment * 0.4) + 
      (similarityData.contentCoverage * 0.4) + 
      (similarityData.specificity * 0.2)
    );
    
    // Calculate overall quality score
    const qualityScore = (
      (qualityMetrics.relevance * 0.35) + 
      (qualityMetrics.completeness * 0.35) + 
      (qualityMetrics.evidenceQuality * 0.3)
    );
    
    return {
      success: true,
      metrics: {
        accuracy: accuracyScore,
        titleAlignment: similarityData.titleAlignment,
        contentCoverage: similarityData.contentCoverage,
        specificity: similarityData.specificity,
        precision,
        recall,
        f1Score,
        quality: {
          overallQuality: qualityScore,
          relevance: qualityMetrics.relevance,
          completeness: qualityMetrics.completeness,
          evidenceQuality: qualityMetrics.evidenceQuality
        }
      },
      details: {
        similarityData,
        qualityDetails: qualityMetrics.details,
        groundTruth: typeof groundTruth === 'string' ? 
          { text: groundTruth } : groundTruth,
        problem
      }
    };
  } catch (error) {
    console.error('Error evaluating research problem:', error);
    return {
      success: false,
      error: error.message,
      metrics: {
        accuracy: 0.5,
        precision: 0.5,
        recall: 0.5,
        f1Score: 0.5,
        quality: {
          overallQuality: 0.5,
          relevance: 0.5,
          completeness: 0.5,
          evidenceQuality: 0.5
        }
      }
    };
  }
};