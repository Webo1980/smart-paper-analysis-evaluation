// src/components/dashboard/views/quality/paper-detail/ResearchFieldQualityPaperDetail.jsx
// UI-ONLY: Imports ResearchFieldQualityMetrics component and maps evaluation data to its props
// UPDATED: Accepts both evaluation and selectedEvaluation props for compatibility with PaperCard
// UPDATED: Now calculates final scores consistently with dataEnrichment

import React from 'react';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { AlertCircle } from 'lucide-react';
import ResearchFieldQualityMetrics from '../../../../evaluation/research-field/components/ResearchFieldQualityMetrics';

/**
 * Helper function to calculate final score with expertise weighting
 * Same logic as dataEnrichment to ensure consistency
 */
const buildFinalScoreWithExpertise = (automatedScore, userRating, expertiseMultiplier = 1) => {
  const normalizedRating = userRating / 5;
  
  // U-shaped confidence curve
  const automaticConfidence = 1 - Math.pow((automatedScore - 0.5) * 2, 2);
  
  // Calculate weights
  const rawAutomaticWeight = Math.max(0.1, 0.4 * automaticConfidence);
  const rawUserWeight = 0.6 * expertiseMultiplier;
  const totalWeight = rawAutomaticWeight + rawUserWeight;
  const automaticWeight = rawAutomaticWeight / totalWeight;
  const userWeight = rawUserWeight / totalWeight;
  
  // Combine scores
  const adjustedUserRating = Math.min(1, normalizedRating * expertiseMultiplier);
  const weightedAutomated = automatedScore * automaticWeight;
  const weightedUser = adjustedUserRating * userWeight;
  const combinedScore = weightedAutomated + weightedUser;
  
  // Agreement bonus
  const agreement = 1 - Math.abs(automatedScore - normalizedRating);
  const agreementBonus = agreement * 0.1;
  
  return Math.min(1, combinedScore * (1 + agreementBonus));
};

/**
 * Helper to extract metric value from various formats
 */
const getMetricValue = (metric) => {
  if (metric === undefined || metric === null) return 0;
  if (typeof metric === 'number') return metric;
  if (metric.value !== undefined) return metric.value;
  if (metric.score !== undefined) return metric.score;
  return 0;
};

/**
 * Research Field Quality Paper Detail Component
 * Wrapper that extracts data from evaluation and passes to ResearchFieldQualityMetrics
 * 
 * Data path: evaluation.evaluationMetrics.overall.research_field
 * 
 * UPDATED: Now accepts both prop naming conventions from PaperCard:
 * - evaluation / selectedEvaluation
 * - evaluationIndex / selectedEvaluationIndex
 */
const ResearchFieldQualityPaperDetail = ({ 
  evaluation, 
  selectedEvaluation,
  evaluationIndex,
  selectedEvaluationIndex,
  paperData,
  groundTruth 
}) => {
  // Resolve the correct evaluation to use
  const effectiveEvaluation = selectedEvaluation || evaluation;
  const effectiveIndex = selectedEvaluationIndex ?? evaluationIndex ?? 0;

  console.log('ResearchFieldQualityPaperDetail - effectiveIndex:', effectiveIndex);
  console.log('ResearchFieldQualityPaperDetail - effectiveEvaluation:', effectiveEvaluation);

  // Extract research field data from correct path
  const rfOverall = effectiveEvaluation?.evaluationMetrics?.overall?.research_field;

  console.log('ResearchFieldQualityPaperDetail - rfOverall:', rfOverall);

  if (!rfOverall) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No research field quality data available for this evaluation
        </AlertDescription>
      </Alert>
    );
  }

  // Map data to ResearchFieldQualityMetrics props
  const orkgValue = rfOverall.groundTruth;
  const predictedValues = rfOverall.predictions || [];
  const expertiseMultiplier = rfOverall.expertiseWeight || effectiveEvaluation?.userInfo?.expertiseMultiplier || 1;
  
  // Extract ratings from dimension objects (ensure numeric values)
  const ratings = {
    primaryField: rfOverall.primaryField?.rating ?? rfOverall.primaryField ?? 3,
    confidence: rfOverall.confidence?.rating ?? rfOverall.confidence ?? 3,
    relevance: rfOverall.relevance?.rating ?? rfOverall.relevance ?? 3,
    consistency: rfOverall.consistency?.rating ?? rfOverall.consistency ?? 3
  };

  // Pass qualityMetrics as metrics prop
  const qualityMetrics = rfOverall.qualityMetrics;

  // Calculate final scores for each dimension (matching dataEnrichment logic)
  const primaryFieldAuto = getMetricValue(qualityMetrics?.primaryField);
  const confidenceAuto = getMetricValue(qualityMetrics?.confidence);
  const relevanceAuto = getMetricValue(qualityMetrics?.relevance);
  const consistencyAuto = getMetricValue(qualityMetrics?.consistency);

  // Calculate final dimension scores with user ratings
  const primaryFieldFinal = buildFinalScoreWithExpertise(primaryFieldAuto, ratings.primaryField, expertiseMultiplier);
  const confidenceFinal = buildFinalScoreWithExpertise(confidenceAuto, ratings.confidence, expertiseMultiplier);
  const relevanceFinal = buildFinalScoreWithExpertise(relevanceAuto, ratings.relevance, expertiseMultiplier);
  const consistencyFinal = buildFinalScoreWithExpertise(consistencyAuto, ratings.consistency, expertiseMultiplier);

  // Get weights
  const weights = qualityMetrics?.weights || {
    primaryField: 0.25,
    confidence: 0.25,
    relevance: 0.25,
    consistency: 0.25
  };

  // Calculate overall scores
  const automatedOverall = 
    (primaryFieldAuto * (weights.primaryField || 0.25)) +
    (confidenceAuto * (weights.confidence || 0.25)) +
    (relevanceAuto * (weights.relevance || 0.25)) +
    (consistencyAuto * (weights.consistency || 0.25));

  const finalOverall = 
    (primaryFieldFinal * (weights.primaryField || 0.25)) +
    (confidenceFinal * (weights.confidence || 0.25)) +
    (relevanceFinal * (weights.relevance || 0.25)) +
    (consistencyFinal * (weights.consistency || 0.25));

  // Build enriched metrics with calculated scores
  const enrichedMetrics = {
    ...qualityMetrics,
    // Add calculated final scores
    primaryField: {
      ...qualityMetrics?.primaryField,
      value: primaryFieldAuto,
      final: primaryFieldFinal
    },
    confidence: {
      ...qualityMetrics?.confidence,
      value: confidenceAuto,
      final: confidenceFinal
    },
    relevance: {
      ...qualityMetrics?.relevance,
      value: relevanceAuto,
      final: relevanceFinal
    },
    consistency: {
      ...qualityMetrics?.consistency,
      value: consistencyAuto,
      final: consistencyFinal
    },
    overallQuality: {
      automated: automatedOverall,
      final: qualityMetrics?.overallQuality?.value ?? qualityMetrics?.overallQuality?.final ?? finalOverall,
      value: qualityMetrics?.overallQuality?.value ?? qualityMetrics?.overallQuality?.final ?? finalOverall
    },
    scoreDetails: qualityMetrics?.scoreDetails || {
      finalScore: qualityMetrics?.overallQuality?.value ?? qualityMetrics?.overallQuality?.final ?? finalOverall,
      automatedScore: automatedOverall
    },
    weights: weights
  };

  console.log('ResearchFieldQualityPaperDetail - Mapped props:', {
    orkgValue,
    predictedValues,
    expertiseMultiplier,
    ratings,
    automatedScores: {
      primaryField: primaryFieldAuto,
      confidence: confidenceAuto,
      relevance: relevanceAuto,
      consistency: consistencyAuto,
      overall: automatedOverall
    },
    finalScores: {
      primaryField: primaryFieldFinal,
      confidence: confidenceFinal,
      relevance: relevanceFinal,
      consistency: consistencyFinal,
      overall: finalOverall
    }
  });

  return (
    <div className="space-y-4">
      <ResearchFieldQualityMetrics
        metrics={enrichedMetrics}
        orkgValue={orkgValue}
        predictedValues={predictedValues}
        expertiseMultiplier={expertiseMultiplier}
        ratings={ratings}
      />
    </div>
  );
};

export default ResearchFieldQualityPaperDetail;