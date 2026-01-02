// src/components/dashboard/views/quality/paper-detail/TemplateQualityPaperDetail.jsx
// UI-ONLY: Prepares and transforms data for TemplateQualityMetrics component
// Calculates final scores since enrichment may not run during data loading
// UPDATED: Accepts both evaluation and selectedEvaluation props for compatibility with PaperCard

import React from 'react';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { AlertCircle } from 'lucide-react';
import TemplateQualityMetrics from '../../../../evaluation/template/components/TemplateQualityMetrics';

/**
 * Template Quality Paper Detail Component
 * Wrapper that extracts data from evaluation, calculates scores, and passes to TemplateQualityMetrics
 * 
 * Data paths:
 * - Template evaluation: evaluation.evaluationMetrics.overall.template
 * - System templates: paperData.systemData.templates
 * 
 * UPDATED: Now accepts both prop naming conventions from PaperCard:
 * - evaluation / selectedEvaluation
 * - evaluationIndex / selectedEvaluationIndex
 */
const TemplateQualityPaperDetail = ({ 
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

  console.log('TemplateQualityPaperDetail - effectiveIndex:', effectiveIndex);
  console.log('TemplateQualityPaperDetail - effectiveEvaluation:', effectiveEvaluation);

  // Extract template evaluation data from overall path
  const templateOverall = effectiveEvaluation?.evaluationMetrics?.overall?.template;

  if (!templateOverall) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No template quality data available for this evaluation
        </AlertDescription>
      </Alert>
    );
  }

  // Extract template data from systemData
  const systemTemplates = paperData?.systemData?.templates || effectiveEvaluation?.systemData?.templates;
  const availableTemplate = systemTemplates?.available?.template || {};
  const llmTemplate = systemTemplates?.llm_template?.template || {};

  // Build evaluationData structure expected by TemplateQualityMetrics
  const evaluationData = {
    templates: {
      available: { template: availableTemplate },
      llm_template: { template: llmTemplate }
    },
    researchProblems: paperData?.systemData?.researchProblems || effectiveEvaluation?.systemData?.researchProblems,
    researchFields: paperData?.systemData?.researchFields || effectiveEvaluation?.systemData?.researchFields
  };

  // Extract research problem for alignment analysis
  const researchProblem = {
    title: evaluationData.researchProblems?.llm_problem?.title || 
           evaluationData.researchProblems?.researchProblem?.name || '',
    description: evaluationData.researchProblems?.llm_problem?.description ||
                 evaluationData.researchProblems?.llm_problem?.problem ||
                 evaluationData.researchProblems?.researchProblem?.description || '',
    field: evaluationData.researchFields?.selectedField?.name || 
           evaluationData.researchFields?.fields?.[0]?.name || ''
  };

  // Extract user ratings - directly from templateOverall
  const ratings = {
    titleAccuracy: templateOverall.titleAccuracy ?? 3,
    descriptionQuality: templateOverall.descriptionQuality ?? 3,
    propertyCoverage: templateOverall.propertyCoverage ?? 3,
    researchAlignment: templateOverall.researchAlignment ?? 3
  };

  // Extract expertise multiplier
  const expertiseMultiplier = templateOverall.expertiseWeight || 
                              effectiveEvaluation?.userInfo?.expertiseMultiplier || 1;

  // Get original quality data
  const originalQualityData = templateOverall.qualityResults?.qualityData || {};
  const fieldSpecificMetrics = originalQualityData.fieldSpecificMetrics || {};
  
  // Get weights
  const weights = originalQualityData.weights || {
    titleQuality: 0.25,
    descriptionQuality: 0.25,
    propertyCoverage: 0.25,
    researchAlignment: 0.25
  };

  // Get raw automated scores - note: data uses titleAccuracy key
  const titleAuto = fieldSpecificMetrics.titleAccuracy?.score ?? 
                    fieldSpecificMetrics.titleQuality?.score ?? 0;
  const descAuto = fieldSpecificMetrics.descriptionQuality?.score ?? 0;
  const coverageAuto = fieldSpecificMetrics.propertyCoverage?.score ?? 0;
  const alignmentAuto = fieldSpecificMetrics.researchAlignment?.score ?? 0;

  // Calculate raw automated overall score (weighted average)
  const automatedOverallScore = 
    (titleAuto * weights.titleQuality) +
    (descAuto * weights.descriptionQuality) +
    (coverageAuto * weights.propertyCoverage) +
    (alignmentAuto * weights.researchAlignment);

  // Calculate average user rating
  const avgUserRating = (ratings.titleAccuracy + ratings.descriptionQuality + 
                         ratings.propertyCoverage + ratings.researchAlignment) / 4;

  // Build scoreDetails for the BaseContentMetrics component
  const normalizedRating = avgUserRating / 5;
  const automaticConfidence = 1 - Math.pow((automatedOverallScore - 0.5) * 2, 2);
  const rawAutomaticWeight = Math.max(0.1, 0.4 * automaticConfidence);
  const rawUserWeight = 0.6 * expertiseMultiplier;
  const totalWeight = rawAutomaticWeight + rawUserWeight;
  const automaticWeight = rawAutomaticWeight / totalWeight;
  const userWeight = rawUserWeight / totalWeight;
  const adjustedUserRating = Math.min(1, normalizedRating * expertiseMultiplier);
  const weightedAutomated = automatedOverallScore * automaticWeight;
  const weightedUser = adjustedUserRating * userWeight;
  const combinedScore = weightedAutomated + weightedUser;
  const agreement = 1 - Math.abs(automatedOverallScore - normalizedRating);
  const agreementBonus = agreement * 0.1;
  const finalScore = Math.min(1, combinedScore * (1 + agreementBonus));

  // Build enriched qualityData with calculated automatedOverallScore
  // This is what the component checks in hasPreCalculatedData
  const enrichedQualityData = {
    fieldSpecificMetrics: {
      // Use titleQuality key (component expects this)
      titleQuality: {
        score: titleAuto,
        issues: fieldSpecificMetrics.titleAccuracy?.issues || fieldSpecificMetrics.titleQuality?.issues || []
      },
      descriptionQuality: {
        score: descAuto,
        issues: fieldSpecificMetrics.descriptionQuality?.issues || []
      },
      propertyCoverage: {
        score: coverageAuto,
        issues: fieldSpecificMetrics.propertyCoverage?.issues || []
      },
      researchAlignment: {
        score: alignmentAuto,
        issues: fieldSpecificMetrics.researchAlignment?.issues || []
      },
      // Add overallQuality in case component looks for it here
      overallQuality: {
        score: automatedOverallScore,
        issues: []
      }
    },
    weights: weights,
    automatedOverallScore: automatedOverallScore,  // THIS IS THE KEY - component checks this
    overallScore: finalScore,
    details: originalQualityData.details || {},
    // Add scoreDetails for BaseContentMetrics
    scoreDetails: {
      automatedScore: automatedOverallScore,
      normalizedRating: normalizedRating,
      automaticConfidence: automaticConfidence,
      rawAutomaticWeight: rawAutomaticWeight,
      rawUserWeight: rawUserWeight,
      automaticWeight: automaticWeight,
      userWeight: userWeight,
      adjustedUserRating: adjustedUserRating,
      combinedScore: combinedScore,
      agreement: agreement,
      agreementBonus: agreementBonus,
      finalScore: finalScore,
      isCapped: finalScore >= 1
    }
  };

  // Build metrics object with enriched qualityData
  const metrics = {
    qualityData: enrichedQualityData,
    overallQuality: {
      value: finalScore,
      automated: automatedOverallScore
    },
    // Also add at top level in case component looks here
    automatedScore: automatedOverallScore,
    overallScore: finalScore
  };

  console.log('TemplateQualityPaperDetail - Mapped props:', {
    ratings,
    expertiseMultiplier,
    automatedOverallScore,
    finalScore,
    templateData: llmTemplate
  });

  return (
    <div className="space-y-4">
      <TemplateQualityMetrics
        metrics={metrics}
        templateData={llmTemplate}
        evaluationData={evaluationData}
        researchProblem={researchProblem}
        expertiseMultiplier={expertiseMultiplier}
        ratings={ratings}
      />
    </div>
  );
};

export default TemplateQualityPaperDetail;