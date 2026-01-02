// src/components/dashboard/views/quality/paper-detail/ResearchProblemQualityPaperDetail.jsx
// UI-ONLY: Imports ResearchProblemQualityMetrics component and maps evaluation data to its props
// UPDATED: Accepts both evaluation and selectedEvaluation props for compatibility with PaperCard

import React from 'react';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { AlertCircle } from 'lucide-react';
import ResearchProblemQualityMetrics from '../../../../evaluation/research-problem/components/ResearchProblemQualityMetrics';

/**
 * Research Problem Quality Paper Detail Component
 * Wrapper that extracts data from evaluation and passes to ResearchProblemQualityMetrics
 * 
 * Data path: evaluation.evaluationMetrics.overall.research_problem.overall.research_problem
 * 
 * UPDATED: Now accepts both prop naming conventions from PaperCard:
 * - evaluation / selectedEvaluation
 * - evaluationIndex / selectedEvaluationIndex
 */
const ResearchProblemQualityPaperDetail = ({ 
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

  console.log('ResearchProblemQualityPaperDetail - effectiveIndex:', effectiveIndex);
  console.log('ResearchProblemQualityPaperDetail - effectiveEvaluation:', effectiveEvaluation);

  // Extract research problem data from correct deep path
  const rpDeep = effectiveEvaluation?.evaluationMetrics?.overall?.research_problem?.overall?.research_problem;

  console.log('ResearchProblemQualityPaperDetail - rpDeep:', rpDeep);

  if (!rpDeep) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No research problem quality data available for this evaluation
        </AlertDescription>
      </Alert>
    );
  }

  // Extract ground truth (abstract text)
  const groundTruthText = rpDeep.groundTruth?.text || rpDeep.groundTruth || '';

  // Extract problem data from systemData (either from paperData or evaluation)
  const problemData = paperData?.systemData?.researchProblems?.llm_problem || 
                     effectiveEvaluation?.systemData?.researchProblems?.llm_problem ||
                     rpDeep.problemData || {};

  // Extract expertise info - prefer from userRatings as it's more accurate
  const userRatings = rpDeep.userRatings || {};
  const expertiseWeight = userRatings.expertiseWeight || effectiveEvaluation?.userInfo?.expertiseWeight || 1;
  const expertiseMultiplier = userRatings.expertiseMultiplier || effectiveEvaluation?.userInfo?.expertiseMultiplier || 1;

  // Extract ratings from userRatings
  const ratings = {
    problemTitle: userRatings.problemTitle?.rating ?? userRatings.problemTitle ?? 3,
    problemDescription: userRatings.problemDescription?.rating ?? userRatings.problemDescription ?? 3,
    relevance: userRatings.relevance?.rating ?? userRatings.relevance ?? 3,
    evidenceQuality: userRatings.evidenceQuality?.rating ?? userRatings.evidenceQuality ?? 3
  };

  // Extract LLM problem data for comparison
  // Original: What LLM generated initially (original_llm_problem)
  // Edited: What user modified it to (llm_problem)
  const originalLLMProblem = paperData?.systemData?.researchProblems?.original_llm_problem ||
                             effectiveEvaluation?.systemData?.researchProblems?.original_llm_problem;
  const editedLLMProblem = paperData?.systemData?.researchProblems?.llm_problem ||
                           effectiveEvaluation?.systemData?.researchProblems?.llm_problem;

  // Helper function to calculate basic comparison metrics
  const calculateComparisonMetrics = (original, edited) => {
    if (!original && !edited) {
      return {
        levenshtein: { distance: 0, similarityScore: 1, normalizedDistance: 0 },
        tokenMatching: { precision: 1, recall: 1, f1Score: 1, originalTokens: [], modifiedTokens: [], matchedTokens: [] },
        edits: { totalEdits: 0, insertions: 0, deletions: 0, modifications: 0 }
      };
    }
    
    if (original === edited) {
      // Identical - 100% similarity
      const tokens = (original || '').split(/\s+/).filter(t => t.length > 0);
      return {
        levenshtein: { distance: 0, similarityScore: 1, normalizedDistance: 0 },
        tokenMatching: { precision: 1, recall: 1, f1Score: 1, originalTokens: tokens, modifiedTokens: tokens, matchedTokens: tokens },
        edits: { totalEdits: 0, insertions: 0, deletions: 0, modifications: 0 }
      };
    }
    
    // Calculate basic metrics for different texts
    const origTokens = (original || '').split(/\s+/).filter(t => t.length > 0);
    const editTokens = (edited || '').split(/\s+/).filter(t => t.length > 0);
    const origSet = new Set(origTokens.map(t => t.toLowerCase()));
    const editSet = new Set(editTokens.map(t => t.toLowerCase()));
    
    const matched = [...editSet].filter(t => origSet.has(t));
    const precision = editTokens.length > 0 ? matched.length / editTokens.length : 0;
    const recall = origTokens.length > 0 ? matched.length / origTokens.length : 0;
    const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    
    // Simple Levenshtein approximation based on length difference
    const maxLen = Math.max((original || '').length, (edited || '').length);
    const minLen = Math.min((original || '').length, (edited || '').length);
    const lengthDiff = maxLen - minLen;
    const similarityScore = maxLen > 0 ? 1 - (lengthDiff / maxLen) : 1;
    
    return {
      levenshtein: { 
        distance: lengthDiff, 
        similarityScore: Math.max(0, similarityScore),
        normalizedDistance: maxLen > 0 ? lengthDiff / maxLen : 0
      },
      tokenMatching: { 
        precision, 
        recall, 
        f1Score,
        originalTokens: origTokens,
        modifiedTokens: editTokens,
        matchedTokens: matched
      },
      edits: { 
        totalEdits: lengthDiff,
        insertions: Math.max(0, (edited || '').length - (original || '').length),
        deletions: Math.max(0, (original || '').length - (edited || '').length),
        modifications: 0
      }
    };
  };

  // Build comparisonData from original vs edited LLM outputs with calculated metrics
  const origTitle = originalLLMProblem?.title || '';
  const editTitle = editedLLMProblem?.title || '';
  const origDesc = originalLLMProblem?.problem || originalLLMProblem?.description || '';
  const editDesc = editedLLMProblem?.problem || editedLLMProblem?.description || '';
  
  const titleMetrics = calculateComparisonMetrics(origTitle, editTitle);
  const descMetrics = calculateComparisonMetrics(origDesc, editDesc);

  const comparisonData = (originalLLMProblem || editedLLMProblem) ? {
    title: {
      original: origTitle,
      edited: editTitle,
      ...titleMetrics
    },
    description: {
      original: origDesc,
      edited: editDesc,
      ...descMetrics
    }
  } : null;

  // Extract quality data and analysis
  const qualityMetrics = rpDeep.quality;
  
  // Helper to extract score from nested value.score structure
  const getScore = (metric) => {
    if (!metric) return 0;
    // Structure is: { value: { score: 0.5 }, weight: 0.3, reason: '...' }
    if (metric.value?.score !== undefined) return metric.value.score;
    if (metric.score !== undefined) return metric.score;
    if (typeof metric.value === 'number') return metric.value;
    return 0;
  };

  // Extract individual scores
  const problemTitleScore = getScore(qualityMetrics?.problemTitle);
  const problemDescriptionScore = getScore(qualityMetrics?.problemDescription);
  const relevanceScore = getScore(qualityMetrics?.relevance);
  const evidenceQualityScore = getScore(qualityMetrics?.evidenceQuality);

  // Extract weights
  const weights = {
    problemTitle: qualityMetrics?.problemTitle?.weight || 0.3,
    problemDescription: qualityMetrics?.problemDescription?.weight || 0.3,
    relevance: qualityMetrics?.relevance?.weight || 0.2,
    evidenceQuality: qualityMetrics?.evidenceQuality?.weight || 0.2
  };

  // Calculate automated overall score
  const calculatedOverallScore = 
    (problemTitleScore * weights.problemTitle) +
    (problemDescriptionScore * weights.problemDescription) +
    (relevanceScore * weights.relevance) +
    (evidenceQualityScore * weights.evidenceQuality);
  
  // Helper function to build proper scoreDetails
  const buildScoreDetails = (automatedScore, userRating, expMultiplier) => {
    const normalizedRating = userRating / 5;
    
    // Calculate automatic confidence using U-shaped curve
    const automaticConfidence = 1 - Math.pow((automatedScore - 0.5) * 2, 2);
    
    // Calculate weights
    const rawAutomaticWeight = Math.max(0.1, 0.4 * automaticConfidence);
    const rawUserWeight = 0.6 * expMultiplier;
    const totalWeight = rawAutomaticWeight + rawUserWeight;
    const automaticWeight = rawAutomaticWeight / totalWeight;
    const userWeight = rawUserWeight / totalWeight;
    
    // Calculate combined score
    const adjustedUserRating = Math.min(1, normalizedRating * expMultiplier);
    const weightedAutomated = automatedScore * automaticWeight;
    const weightedUser = adjustedUserRating * userWeight;
    const combinedScore = weightedAutomated + weightedUser;
    
    // Calculate agreement bonus
    const agreement = 1 - Math.abs(automatedScore - normalizedRating);
    const agreementBonus = agreement * 0.1;
    
    // Final score with bonus
    const finalScore = Math.min(1, combinedScore * (1 + agreementBonus));
    
    return {
      automatedScore,
      normalizedRating,
      automaticConfidence,
      rawAutomaticWeight,
      rawUserWeight,
      automaticWeight,
      userWeight,
      agreement,
      agreementBonus,
      combinedScore,
      finalScore,
      isCapped: combinedScore * (1 + agreementBonus) > 1
    };
  };

  // Calculate final scores for each dimension (matching what the component displays)
  const problemTitleFinal = buildScoreDetails(problemTitleScore, ratings.problemTitle, expertiseMultiplier).finalScore;
  const problemDescriptionFinal = buildScoreDetails(problemDescriptionScore, ratings.problemDescription, expertiseMultiplier).finalScore;
  const relevanceFinal = buildScoreDetails(relevanceScore, ratings.relevance, expertiseMultiplier).finalScore;
  const evidenceQualityFinal = buildScoreDetails(evidenceQualityScore, ratings.evidenceQuality, expertiseMultiplier).finalScore;

  // Calculate weighted average of final dimension scores (this is what should be shown as "Automated Quality Score")
  const weightedDimensionAverage = 
    (problemTitleFinal * weights.problemTitle) +
    (problemDescriptionFinal * weights.problemDescription) +
    (relevanceFinal * weights.relevance) +
    (evidenceQualityFinal * weights.evidenceQuality);

  // Build overall scoreDetails using the overall rating
  const overallRating = userRatings?.overallRating ?? 3;
  const builtScoreDetails = buildScoreDetails(weightedDimensionAverage, overallRating, expertiseMultiplier);
  
  // Build qualityData structure expected by component
  // NOTE: fieldSpecificMetrics should contain FINAL scores (not raw automated scores)
  // because the component recalculates automatedOverallScore from these
  const qualityData = qualityMetrics ? {
    fieldSpecificMetrics: {
      problemTitle: { 
        score: problemTitleFinal,  // Use final score, not raw automated
        rawScore: problemTitleScore,
        issues: qualityMetrics.problemTitle?.value?.issues || []
      },
      problemDescription: { 
        score: problemDescriptionFinal,  // Use final score, not raw automated
        rawScore: problemDescriptionScore,
        issues: qualityMetrics.problemDescription?.value?.issues || []
      },
      relevance: { 
        score: relevanceFinal,  // Use final score, not raw automated
        rawScore: relevanceScore,
        issues: qualityMetrics.relevance?.value?.issues || []
      },
      evidenceQuality: { 
        score: evidenceQualityFinal,  // Use final score, not raw automated
        rawScore: evidenceQualityScore,
        issues: qualityMetrics.evidenceQuality?.value?.issues || []
      }
    },
    weights: weights,
    overallScore: builtScoreDetails.finalScore,
    // This is shown as "Automated Quality Score" - weighted average of dimension final scores
    automatedOverallScore: weightedDimensionAverage,
    scoreDetails: builtScoreDetails
  } : null;

  // Build qualityAnalysis structure with final scores for consistency
  const qualityAnalysis = qualityMetrics ? {
    problemTitle: problemTitleFinal,
    problemDescription: problemDescriptionFinal,
    relevance: relevanceFinal,
    evidenceQuality: evidenceQualityFinal,
    details: {
      problemTitleReason: qualityMetrics.problemTitle?.reason || qualityMetrics.problemTitle?.value?.reason || '',
      problemDescriptionReason: qualityMetrics.problemDescription?.reason || qualityMetrics.problemDescription?.value?.reason || '',
      relevanceReason: qualityMetrics.relevance?.reason || qualityMetrics.relevance?.value?.reason || '',
      evidenceQualityReason: qualityMetrics.evidenceQuality?.reason || qualityMetrics.evidenceQuality?.value?.reason || ''
    }
  } : null;

  console.log('ResearchProblemQualityPaperDetail - Mapped props:', {
    groundTruth: groundTruthText?.substring?.(0, 100) + '...',
    problemData,
    expertiseMultiplier,
    ratings,
    automatedScores: {
      problemTitle: problemTitleScore,
      problemDescription: problemDescriptionScore,
      relevance: relevanceScore,
      evidenceQuality: evidenceQualityScore,
      rawOverall: calculatedOverallScore
    },
    finalScores: {
      problemTitle: problemTitleFinal,
      problemDescription: problemDescriptionFinal,
      relevance: relevanceFinal,
      evidenceQuality: evidenceQualityFinal,
      weightedAverage: weightedDimensionAverage,
      overallFinal: builtScoreDetails.finalScore
    },
    hasComparisonData: !!comparisonData
  });

  return (
    <div className="space-y-4">
      <ResearchProblemQualityMetrics
        metrics={qualityMetrics}
        groundTruth={groundTruthText}
        problemData={problemData}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        ratings={ratings}
        comparisonData={comparisonData}
        qualityData={qualityData}
        qualityAnalysis={qualityAnalysis}
      />
    </div>
  );
};

export default ResearchProblemQualityPaperDetail;