// File: src/components/dashboard/utils/dataEnrichment.js
// FIXED VERSION - Correct paths for template and content scores

/**
 * Data Enrichment Utilities
 * Maps and enriches paper data with aggregated statistics
 * 
 * FIXES:
 * - Template score: metrics.template.template.scoreDetails.finalScore (NESTED!)
 * - Content score: Average of metrics.content[property].scoreDetails.finalScore
 * - Metadata: Handles both ARRAY and OBJECT formats
 */

// ============================================================================
// Content Data Enrichment (fixes null values issue)
// ============================================================================

/**
 * Enriches evaluation content data with values from system data
 */
export function enrichContentFromSystemData(evaluation, systemData) {
  if (!evaluation || !systemData) return evaluation;
  
  const evalContent = evaluation?.evaluationMetrics?.overall?.content;
  const systemContent = systemData?.paperContent?.paperContent;
  
  if (!evalContent || !systemContent) {
    return evaluation;
  }
  
  // Build mapping from safe key to system data
  const systemDataByLabel = {};
  
  Object.entries(systemContent).forEach(([sysKey, sysProp]) => {
    const label = sysProp.property || sysProp.label || sysProp.name;
    if (label) {
      const safeKey = label
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      systemDataByLabel[safeKey] = {
        originalKey: sysKey,
        property: label,
        value: sysProp.values?.[0]?.value || null,
        confidence: sysProp.values?.[0]?.confidence || null,
        evidence: sysProp.values?.[0]?.evidence || null,
        allValues: sysProp.values || []
      };
    }
  });
  
  // Enrich evaluation content with system values
  Object.entries(evalContent).forEach(([evalKey, evalProp]) => {
    if (['userRatings', 'overallScore', 'timestamp', 'config'].includes(evalKey)) {
      return;
    }
    
    const propertyData = evalProp?.metadata?.propertyData;
    
    if (propertyData && (propertyData.value === null || propertyData.value === undefined)) {
      const sysData = systemDataByLabel[evalKey];
      
      if (sysData && sysData.value) {
        propertyData.value = sysData.value;
        propertyData.confidence = sysData.confidence;
        propertyData.evidence = sysData.evidence;
        propertyData._enrichedFromSystem = true;
      }
    }
  });
  
  return evaluation;
}

/**
 * Enrich template quality data with calculated scores
 * Fills in null automatedOverallScore and overallScore values
 */
export function enrichTemplateQualityData(evaluation) {
  if (!evaluation) return evaluation;
  
  const templateOverall = evaluation?.evaluationMetrics?.overall?.template;
  if (!templateOverall) return evaluation;
  
  const qualityResults = templateOverall.qualityResults;
  if (!qualityResults?.qualityData) return evaluation;
  
  const qualityData = qualityResults.qualityData;
  const fieldSpecificMetrics = qualityData.fieldSpecificMetrics || {};
  
  // Helper function to calculate final score with expertise weighting
  const buildFinalScore = (automatedScore, userRating, expMult) => {
    const normalizedRating = userRating / 5;
    const automaticConfidence = 1 - Math.pow((automatedScore - 0.5) * 2, 2);
    const rawAutomaticWeight = Math.max(0.1, 0.4 * automaticConfidence);
    const rawUserWeight = 0.6 * expMult;
    const totalWeight = rawAutomaticWeight + rawUserWeight;
    const automaticWeight = rawAutomaticWeight / totalWeight;
    const userWeight = rawUserWeight / totalWeight;
    const adjustedUserRating = Math.min(1, normalizedRating * expMult);
    const weightedAutomated = automatedScore * automaticWeight;
    const weightedUser = adjustedUserRating * userWeight;
    const combinedScore = weightedAutomated + weightedUser;
    const agreement = 1 - Math.abs(automatedScore - normalizedRating);
    const agreementBonus = agreement * 0.1;
    return Math.min(1, combinedScore * (1 + agreementBonus));
  };
  
  // Get expertise multiplier
  const expertiseMultiplier = templateOverall.expertiseWeight || 1;
  
  // Get user ratings directly from templateOverall
  const titleRating = templateOverall.titleAccuracy ?? 3;
  const descRating = templateOverall.descriptionQuality ?? 3;
  const coverageRating = templateOverall.propertyCoverage ?? 3;
  const alignmentRating = templateOverall.researchAlignment ?? 3;
  
  // Get raw automated scores - note: data uses titleAccuracy key
  const titleAuto = fieldSpecificMetrics.titleAccuracy?.score ?? 
                    fieldSpecificMetrics.titleQuality?.score ?? 0;
  const descAuto = fieldSpecificMetrics.descriptionQuality?.score ?? 0;
  const coverageAuto = fieldSpecificMetrics.propertyCoverage?.score ?? 0;
  const alignmentAuto = fieldSpecificMetrics.researchAlignment?.score ?? 0;
  
  // Weights
  const weights = qualityData.weights || {
    titleQuality: 0.25,
    descriptionQuality: 0.25,
    propertyCoverage: 0.25,
    researchAlignment: 0.25
  };
  
  // Calculate raw automated overall score (weighted average of raw scores)
  const automatedOverall = 
    (titleAuto * weights.titleQuality) +
    (descAuto * weights.descriptionQuality) +
    (coverageAuto * weights.propertyCoverage) +
    (alignmentAuto * weights.researchAlignment);
  
  // Calculate FINAL scores for each dimension
  const titleFinal = buildFinalScore(titleAuto, titleRating, expertiseMultiplier);
  const descFinal = buildFinalScore(descAuto, descRating, expertiseMultiplier);
  const coverageFinal = buildFinalScore(coverageAuto, coverageRating, expertiseMultiplier);
  const alignmentFinal = buildFinalScore(alignmentAuto, alignmentRating, expertiseMultiplier);
  
  // Calculate weighted average of final dimension scores
  const weightedFinalAverage = 
    (titleFinal * weights.titleQuality) +
    (descFinal * weights.descriptionQuality) +
    (coverageFinal * weights.propertyCoverage) +
    (alignmentFinal * weights.researchAlignment);
  
  // Calculate overall final score
  const avgUserRating = (titleRating + descRating + coverageRating + alignmentRating) / 4;
  const overallFinal = buildFinalScore(weightedFinalAverage, avgUserRating, expertiseMultiplier);
  
  // Update qualityData with calculated values
  qualityData.automatedOverallScore = automatedOverall;
  qualityData.overallScore = overallFinal;
  
  // Add final scores to fieldSpecificMetrics for display
  if (fieldSpecificMetrics.titleAccuracy) {
    fieldSpecificMetrics.titleAccuracy.finalScore = titleFinal;
  }
  if (fieldSpecificMetrics.titleQuality) {
    fieldSpecificMetrics.titleQuality.finalScore = titleFinal;
  }
  if (fieldSpecificMetrics.descriptionQuality) {
    fieldSpecificMetrics.descriptionQuality.finalScore = descFinal;
  }
  if (fieldSpecificMetrics.propertyCoverage) {
    fieldSpecificMetrics.propertyCoverage.finalScore = coverageFinal;
  }
  if (fieldSpecificMetrics.researchAlignment) {
    fieldSpecificMetrics.researchAlignment.finalScore = alignmentFinal;
  }
  
  // Update scoreDetails
  if (!qualityResults.scoreDetails) {
    qualityResults.scoreDetails = {};
  }
  qualityResults.scoreDetails.automatedScore = automatedOverall;
  qualityResults.scoreDetails.finalScore = overallFinal;
  qualityResults.scoreDetails.normalizedRating = avgUserRating / 5;
  qualityResults.scoreDetails.expertiseMultiplier = expertiseMultiplier;
  
  // CRITICAL: Update templateOverall.qualityScore - this is what PaperCard reads!
  templateOverall.qualityScore = overallFinal;
  
  // Also update overallScore to be consistent (average of accuracy and quality)
  const accuracyScore = templateOverall.accuracyScore || 0;
  templateOverall.overallScore = (accuracyScore + overallFinal) / 2;
  
  // Mark as enriched
  qualityData._enriched = true;
  evaluation._templateQualityEnriched = true;
  
  return evaluation;
}

/**
 * Enrich all papers in integrated data structure
 */
export function enrichIntegratedDataContent(integratedData) {
  if (!integratedData?.papers) {
    return integratedData;
  }
  
  integratedData.papers.forEach((paper) => {
    const systemData = paper.systemOutput || paper.systemData;
    
    if (!systemData) return;
    
    if (paper.userEvaluations && Array.isArray(paper.userEvaluations)) {
      paper.userEvaluations.forEach(evaluation => {
        enrichContentFromSystemData(evaluation, systemData);
        enrichTemplateQualityData(evaluation);
      });
    }
    
    if (paper.evaluation) {
      enrichContentFromSystemData(paper.evaluation, systemData);
      enrichTemplateQualityData(paper.evaluation);
    }
  });
  
  return integratedData;
}

/**
 * Create property key mapping between system and evaluation formats
 */
export function createPropertyKeyMapping(systemContent, evalContent) {
  const mapping = {
    systemKeys: [],
    evalKeys: [],
    matched: [],
    systemOnly: [],
    evalOnly: []
  };
  
  if (!systemContent || !evalContent) return mapping;
  
  const systemNormalized = {};
  Object.entries(systemContent).forEach(([key, prop]) => {
    const label = prop.property || prop.label || prop.name || key;
    const normalized = label.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
    systemNormalized[normalized] = { originalKey: key, label };
    mapping.systemKeys.push({ key, label, normalized });
  });
  
  Object.keys(evalContent).forEach(key => {
    if (!['userRatings', 'overallScore', 'timestamp', 'config'].includes(key)) {
      mapping.evalKeys.push(key);
      
      if (systemNormalized[key]) {
        mapping.matched.push({
          evalKey: key,
          systemKey: systemNormalized[key].originalKey,
          label: systemNormalized[key].label
        });
      } else {
        mapping.evalOnly.push(key);
      }
    }
  });
  
  Object.entries(systemNormalized).forEach(([normalized, data]) => {
    if (!mapping.evalKeys.includes(normalized)) {
      mapping.systemOnly.push({
        systemKey: data.originalKey,
        normalizedKey: normalized,
        label: data.label
      });
    }
  });
  
  return mapping;
}

// ============================================================================
// Paper Grouping and Enrichment
// ============================================================================

/**
 * Group papers by DOI
 */
export function groupPapersByDoi(papers) {
  if (!papers || !Array.isArray(papers)) {
    return {};
  }

  const grouped = {};

  papers.forEach(paper => {
    const doi = paper.doi;
    
    if (!doi) return;

    if (!grouped[doi]) {
      grouped[doi] = {
        doi,
        groundTruth: paper.groundTruth,
        systemOutput: paper.systemOutput,
        userEvaluations: []
      };
    }

    if (paper.userEvaluations && Array.isArray(paper.userEvaluations)) {
      grouped[doi].userEvaluations.push(...paper.userEvaluations);
    }
  });

  return grouped;
}

/**
 * Map component data tokens to papers
 */
export function enrichPapersWithComponentData(componentData, papers, componentName = 'researchField') {
  if (!componentData?.byPaper || !papers) {
    return [];
  }

  const enrichedPapers = [];

  Object.entries(componentData.byPaper).forEach(([token, paperData]) => {
    const paper = papers.find(p => 
      p.userEvaluations?.some(e => e.token === token)
    );

    if (!paper) return;

    const evaluation = paper.userEvaluations.find(e => e.token === token);
    if (!evaluation) return;

    let componentSpecificData = {};
    
    if (componentName === 'researchField') {
      componentSpecificData = {
        groundTruthField: paper.groundTruth?.research_field_name,
        userSelectedField: evaluation.systemData?.researchFields?.selectedField?.name,
        systemPredictions: evaluation.systemData?.researchFields?.fields || [],
        similarityData: evaluation.evaluationMetrics?.accuracy?.researchField?.similarityData
      };
    } else if (componentName === 'metadata') {
      componentSpecificData = {
        fields: {
          title: {
            groundTruth: paper.groundTruth?.title,
            similarityData: evaluation.evaluationMetrics?.accuracy?.metadata?.['Title Extraction']?.similarityData
          },
          authors: {
            groundTruth: getAuthorsArray(paper.groundTruth),
            similarityData: evaluation.evaluationMetrics?.accuracy?.metadata?.['Authors Extraction']?.similarityData
          },
          doi: {
            groundTruth: paper.groundTruth?.doi,
            similarityData: evaluation.evaluationMetrics?.accuracy?.metadata?.['DOI Extraction']?.similarityData
          },
          venue: {
            groundTruth: paper.groundTruth?.venue,
            similarityData: evaluation.evaluationMetrics?.accuracy?.metadata?.['Venue/Journal']?.similarityData
          }
        }
      };
    }

    enrichedPapers.push({
      doi: paper.doi,
      title: paper.groundTruth?.title,
      groundTruth: paper.groundTruth,
      token,
      timestamp: evaluation.timestamp,
      userInfo: evaluation.userInfo,
      ...componentSpecificData,
      aggregatedScores: paperData,
      evaluation
    });
  });

  return enrichedPapers;
}

/**
 * Helper to extract authors array from ground truth
 */
function getAuthorsArray(groundTruth) {
  if (!groundTruth) return [];
  
  const authors = [];
  for (let i = 1; i <= 24; i++) {
    const author = groundTruth[`author${i}`];
    if (author) {
      authors.push(author);
    }
  }
  return authors;
}

// ============================================================================
// SCORE CALCULATION - FIXED PATHS
// ============================================================================

/**
 * Calculate overall score for a paper across all components
 * 
 * @param {Object} paperData - Paper data with userEvaluations array
 * @param {number|null} evaluationIndex - If provided, calculate for specific evaluation.
 *                                        If null/undefined, calculate AVERAGE across all evaluations.
 * @returns {number} Overall score (0-1)
 */
export function calculatePaperOverallScore(paperData, evaluationIndex = null, viewType = 'accuracy') {
  if (!paperData.userEvaluations || paperData.userEvaluations.length === 0) {
    return 0;
  }

  const componentScores = calculatePaperComponentScores(paperData, evaluationIndex, viewType);
  const scores = Object.values(componentScores).filter(s => s > 0);

  return scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
    : 0;
}

/**
 * Calculate component scores for a paper
 * 
 * FIXED DATA PATHS:
 * - Metadata: metrics.metadata is ARRAY with {id, scoreDetails.finalScore} OR OBJECT
 * - Research Field: metrics.researchField.scoreDetails.finalScore
 * - Research Problem: metrics.researchProblem.scoreDetails.finalScore  
 * - Template: metrics.template.template.scoreDetails.finalScore (NESTED!)
 * - Content: Average of metrics.content[property].scoreDetails.finalScore
 * 
 * @param {Object} paperData - Paper data with userEvaluations array
 * @param {number|null} evaluationIndex - If provided, calculate for specific evaluation.
 *                                        If null/undefined, calculate AVERAGE across all evaluations.
 * @returns {Object} Component scores {metadata, researchField, researchProblem, template, content}
 */
export function calculatePaperComponentScores(paperData, evaluationIndex = null, viewType = 'accuracy') {
  if (!paperData.userEvaluations || paperData.userEvaluations.length === 0) {
    return {
      metadata: 0,
      researchField: 0,
      researchProblem: 0,
      template: 0,
      content: 0
    };
  }

  // If specific evaluation index provided, calculate for that evaluation only
  if (evaluationIndex !== null && evaluationIndex !== undefined) {
    const evaluation = paperData.userEvaluations[evaluationIndex];
    if (!evaluation) {
      return { metadata: 0, researchField: 0, researchProblem: 0, template: 0, content: 0 };
    }
    return calculateSingleEvaluationScores(evaluation, viewType);
  }

  // Otherwise, calculate AVERAGE across all evaluations
  const allScores = paperData.userEvaluations.map(evaluation => 
    calculateSingleEvaluationScores(evaluation, viewType)
  );

  // Average each component across evaluations
  const avgScores = {
    metadata: 0,
    researchField: 0,
    researchProblem: 0,
    template: 0,
    content: 0
  };

  const components = ['metadata', 'researchField', 'researchProblem', 'template', 'content'];
  
  components.forEach(component => {
    const values = allScores.map(s => s[component]).filter(v => v > 0);
    avgScores[component] = values.length > 0 
      ? values.reduce((sum, v) => sum + v, 0) / values.length 
      : 0;
  });

  return avgScores;
}

/**
 * Calculate Research Problem quality score from deep evaluation path
 * Uses same formula as ResearchProblemQualityPaperDetail wrapper
 * @param {Object} rpDeep - Research problem data from overall.research_problem.overall.research_problem
 * @returns {number} Final quality score
 */
function calculateResearchProblemQualityScore(rpDeep) {
  if (!rpDeep?.quality) return 0;
  
  const qualityMetrics = rpDeep.quality;
  const userRatings = rpDeep.userRatings || {};
  const expertiseMultiplier = userRatings.expertiseMultiplier || 1;
  
  // Helper to extract score from nested structure
  const getScore = (metric) => {
    if (!metric) return 0;
    if (metric.value?.score !== undefined) return metric.value.score;
    if (metric.score !== undefined) return metric.score;
    if (typeof metric.value === 'number') return metric.value;
    return 0;
  };
  
  // Helper function to calculate final score
  const buildFinalScore = (automatedScore, userRating, expMult) => {
    const normalizedRating = userRating / 5;
    const automaticConfidence = 1 - Math.pow((automatedScore - 0.5) * 2, 2);
    const rawAutomaticWeight = Math.max(0.1, 0.4 * automaticConfidence);
    const rawUserWeight = 0.6 * expMult;
    const totalWeight = rawAutomaticWeight + rawUserWeight;
    const automaticWeight = rawAutomaticWeight / totalWeight;
    const userWeight = rawUserWeight / totalWeight;
    const adjustedUserRating = Math.min(1, normalizedRating * expMult);
    const weightedAutomated = automatedScore * automaticWeight;
    const weightedUser = adjustedUserRating * userWeight;
    const combinedScore = weightedAutomated + weightedUser;
    const agreement = 1 - Math.abs(automatedScore - normalizedRating);
    const agreementBonus = agreement * 0.1;
    return Math.min(1, combinedScore * (1 + agreementBonus));
  };
  
  // Weights
  const weights = {
    problemTitle: qualityMetrics.problemTitle?.weight || 0.3,
    problemDescription: qualityMetrics.problemDescription?.weight || 0.3,
    relevance: qualityMetrics.relevance?.weight || 0.2,
    evidenceQuality: qualityMetrics.evidenceQuality?.weight || 0.2
  };
  
  // Get automated scores
  const problemTitleScore = getScore(qualityMetrics.problemTitle);
  const problemDescriptionScore = getScore(qualityMetrics.problemDescription);
  const relevanceScore = getScore(qualityMetrics.relevance);
  const evidenceQualityScore = getScore(qualityMetrics.evidenceQuality);
  
  // Get user ratings
  const problemTitleRating = userRatings.problemTitle?.rating ?? 3;
  const problemDescriptionRating = userRatings.problemDescription?.rating ?? 3;
  const relevanceRating = userRatings.relevance?.rating ?? 3;
  const evidenceQualityRating = userRatings.evidenceQuality?.rating ?? 3;
  const overallRating = userRatings.overallRating ?? 3;
  
  // Calculate final scores for each dimension
  const problemTitleFinal = buildFinalScore(problemTitleScore, problemTitleRating, expertiseMultiplier);
  const problemDescriptionFinal = buildFinalScore(problemDescriptionScore, problemDescriptionRating, expertiseMultiplier);
  const relevanceFinal = buildFinalScore(relevanceScore, relevanceRating, expertiseMultiplier);
  const evidenceQualityFinal = buildFinalScore(evidenceQualityScore, evidenceQualityRating, expertiseMultiplier);
  
  // Calculate weighted average of dimension final scores
  const weightedDimensionAverage = 
    (problemTitleFinal * weights.problemTitle) +
    (problemDescriptionFinal * weights.problemDescription) +
    (relevanceFinal * weights.relevance) +
    (evidenceQualityFinal * weights.evidenceQuality);
  
  // Calculate overall final score
  return buildFinalScore(weightedDimensionAverage, overallRating, expertiseMultiplier);
}

/**
 * Helper function to calculate final score with expertise weighting
 * Uses U-shaped confidence curve and agreement bonus
 */
function buildFinalScoreWithExpertise(automatedScore, userRating, expertiseMultiplier = 1) {
  const normalizedRating = userRating / 5;
  
  // U-shaped confidence curve - highest confidence at 50%, lowest at extremes
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
  
  // Agreement bonus (up to 10% when system and user agree)
  const agreement = 1 - Math.abs(automatedScore - normalizedRating);
  const agreementBonus = agreement * 0.1;
  
  return Math.min(1, combinedScore * (1 + agreementBonus));
}

/**
 * Calculate Metadata quality score from evaluation
 * FIXED: Now reads from evaluationMetrics.quality.metadata (same path as MetadataQualityPaperDetail)
 * @param {Object} evaluation - Full evaluation object
 * @returns {number} Final quality score
 */
function calculateMetadataQualityScore(evaluation) {
  // PRIMARY PATH: evaluationMetrics.quality.metadata (object with display name keys)
  const qualityMetadata = evaluation?.evaluationMetrics?.quality?.metadata;
  
  if (qualityMetadata && typeof qualityMetadata === 'object' && !Array.isArray(qualityMetadata)) {
    const scores = [];
    
    // Handle object format with display name keys (e.g., 'Title Extraction', 'Authors Extraction')
    Object.entries(qualityMetadata).forEach(([displayName, fieldData]) => {
      if (!fieldData) return;
      
      // Primary: use metricDetails.finalScore (same as MetadataQualityPaperDetail)
      let finalScore = fieldData.metricDetails?.finalScore;
      
      // Fallback paths
      if (finalScore === undefined || finalScore === null) {
        finalScore = fieldData.scoreDetails?.finalScore;
      }
      if (finalScore === undefined || finalScore === null) {
        finalScore = fieldData.qualityData?.overallScore;
      }
      if (finalScore === undefined || finalScore === null) {
        finalScore = fieldData.qualityData?.automatedOverallScore;
      }
      
      if (finalScore !== undefined && finalScore !== null && !isNaN(finalScore)) {
        scores.push(finalScore);
      }
    });
    
    if (scores.length > 0) {
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    }
  }
  
  // FALLBACK PATH: evaluationMetrics.overall.metadata (array format for backward compatibility)
  const metadataOverall = evaluation?.evaluationMetrics?.overall?.metadata;
  
  if (metadataOverall && Array.isArray(metadataOverall)) {
    const scores = [];
    metadataOverall.forEach(field => {
      const finalScore = field.scoreDetails?.finalScore;
      if (finalScore !== undefined && finalScore !== null) {
        scores.push(finalScore);
      }
    });
    
    if (scores.length > 0) {
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    }
  }
  
  // FALLBACK: Try overall.metadata as object format
  if (metadataOverall && typeof metadataOverall === 'object' && !Array.isArray(metadataOverall)) {
    const scores = [];
    Object.entries(metadataOverall).forEach(([key, fieldData]) => {
      if (!fieldData || key.startsWith('_')) return;
      
      const finalScore = fieldData.scoreDetails?.finalScore ?? 
                        fieldData.metricDetails?.finalScore ??
                        fieldData.qualityData?.overallScore;
      
      if (finalScore !== undefined && finalScore !== null && !isNaN(finalScore)) {
        scores.push(finalScore);
      }
    });
    
    if (scores.length > 0) {
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    }
  }
  
  return 0;
}


/**
 * Calculate Research Field quality score from evaluation
 * 
 * CORRECTED based on actual data structure from debug:
 * - Path: evaluationMetrics.overall.research_field (NOT deeper)
 * - Pre-calculated: qualityMetrics.overallQuality.value (NOT .final)
 * - User ratings: rfOverall.primaryField.rating (NOT in userRatings object)
 * - Expertise: rfOverall.expertiseWeight
 * - Dimensions: confidence, relevance, consistency (primaryField may not have automated score)
 * - Weights: {confidence: 0.4, relevance: 0.3, consistency: 0.3}
 * 
 * @param {Object} evaluation - Full evaluation object
 * @returns {number} Final quality score
 */
function calculateResearchFieldQualityScore(evaluation) {
  // CORRECT PATH: evaluationMetrics.overall.research_field
  const rfOverall = evaluation?.evaluationMetrics?.overall?.research_field;
  if (!rfOverall) return 0;
  
  const qualityMetrics = rfOverall.qualityMetrics;
  
  // =========================================================================
  // PRIORITY 1: Use pre-calculated overall score if available
  // Data uses .value NOT .final
  // =========================================================================
  if (qualityMetrics?.overallQuality?.final !== undefined) {
    return qualityMetrics.overallQuality.final;
  }
  
  if (qualityMetrics?.overallQuality?.value !== undefined) {
    return qualityMetrics.overallQuality.value;
  }
  
  // =========================================================================
  // PRIORITY 2: Check qualityData for pre-calculated score
  // =========================================================================
  if (qualityMetrics?.qualityData?.overallScore !== undefined) {
    return qualityMetrics.qualityData.overallScore;
  }
  
  // =========================================================================
  // PRIORITY 3: Calculate from dimensions (fallback)
  // =========================================================================
  
  // Get expertise multiplier - it's directly on rfOverall, not in userRatings
  const expertiseMultiplier = rfOverall.expertiseWeight || 
                              evaluation?.userInfo?.expertiseMultiplier || 1;
  
  // Helper to extract metric value from various formats
  const getMetricValue = (metric) => {
    if (metric === undefined || metric === null) return null;
    if (typeof metric === 'number') return metric;
    if (metric.value !== undefined) return metric.value;
    if (metric.score !== undefined) return metric.score;
    return null;
  };
  
  // Get automated scores for each dimension
  const primaryFieldAuto = getMetricValue(qualityMetrics?.primaryField);
  const confidenceAuto = getMetricValue(qualityMetrics?.confidence);
  const relevanceAuto = getMetricValue(qualityMetrics?.relevance);
  const consistencyAuto = getMetricValue(qualityMetrics?.consistency);
  
  // Get weights from data (Research Field typically uses 3 dimensions)
  // Default: {confidence: 0.4, relevance: 0.3, consistency: 0.3}
  const weights = qualityMetrics?.weights || {
    confidence: 0.4,
    relevance: 0.3,
    consistency: 0.3
  };
  
  // Calculate automated overall using actual weights
  let automatedOverall = 0;
  let totalWeight = 0;
  
  if (primaryFieldAuto !== null && weights.primaryField) {
    automatedOverall += primaryFieldAuto * weights.primaryField;
    totalWeight += weights.primaryField;
  }
  if (confidenceAuto !== null) {
    const w = weights.confidence || 0.4;
    automatedOverall += confidenceAuto * w;
    totalWeight += w;
  }
  if (relevanceAuto !== null) {
    const w = weights.relevance || 0.3;
    automatedOverall += relevanceAuto * w;
    totalWeight += w;
  }
  if (consistencyAuto !== null) {
    const w = weights.consistency || 0.3;
    automatedOverall += consistencyAuto * w;
    totalWeight += w;
  }
  
  // Normalize if weights don't sum to 1
  if (totalWeight > 0 && totalWeight !== 1) {
    automatedOverall = automatedOverall / totalWeight;
  }
  
  // Get user ratings - they're directly on rfOverall (e.g., rfOverall.primaryField.rating)
  const getRating = (dimension) => {
    const dimData = rfOverall[dimension];
    if (dimData?.rating !== undefined) return dimData.rating;
    if (typeof dimData === 'number') return dimData;
    return 3; // default
  };
  
  const primaryFieldRating = getRating('primaryField');
  const confidenceRating = getRating('confidence');
  const relevanceRating = getRating('relevance');
  const consistencyRating = getRating('consistency');
  
  // Calculate average user rating using same weights as automated
  let avgRating = 0;
  let ratingWeight = 0;
  
  if (weights.primaryField) {
    avgRating += primaryFieldRating * weights.primaryField;
    ratingWeight += weights.primaryField;
  }
  if (weights.confidence) {
    avgRating += confidenceRating * (weights.confidence || 0.4);
    ratingWeight += (weights.confidence || 0.4);
  }
  if (weights.relevance) {
    avgRating += relevanceRating * (weights.relevance || 0.3);
    ratingWeight += (weights.relevance || 0.3);
  }
  if (weights.consistency) {
    avgRating += consistencyRating * (weights.consistency || 0.3);
    ratingWeight += (weights.consistency || 0.3);
  }
  
  if (ratingWeight > 0) {
    avgRating = avgRating / ratingWeight;
  } else {
    avgRating = (primaryFieldRating + confidenceRating + relevanceRating + consistencyRating) / 4;
  }
  
  // Apply expertise weighting formula
  return buildFinalScoreWithExpertise(automatedOverall, avgRating, expertiseMultiplier);
}

/**
 * Calculate Template quality score from deep evaluation path
 * @param {Object} evaluation - Full evaluation object
 * @returns {number} Final quality score
 */
export function calculateTemplateQualityScore(evaluation) {
  // Path: evaluationMetrics.overall.template (NOT template.template)
  const templateOverall = evaluation?.evaluationMetrics?.overall?.template;
  if (!templateOverall) return 0;
  
  // Check for pre-calculated scoreDetails.finalScore in qualityResults
  if (templateOverall.qualityResults?.scoreDetails?.finalScore !== undefined &&
      templateOverall.qualityResults?.scoreDetails?.finalScore !== null) {
    return templateOverall.qualityResults.scoreDetails.finalScore;
  }
  
  // Get quality metrics from qualityResults.qualityData
  const qualityData = templateOverall.qualityResults?.qualityData || {};
  const fieldSpecificMetrics = qualityData.fieldSpecificMetrics || {};
  
  // User ratings are directly on templateOverall
  const expertiseMultiplier = templateOverall.expertiseWeight || 1;
  
  // Get quality dimension scores
  const titleScore = fieldSpecificMetrics.titleAccuracy?.score ?? 
                     fieldSpecificMetrics.titleQuality?.score ?? 0;
  const descriptionScore = fieldSpecificMetrics.descriptionQuality?.score ?? 0;
  const coverageScore = fieldSpecificMetrics.propertyCoverage?.score ?? 0;
  const alignmentScore = fieldSpecificMetrics.researchAlignment?.score ?? 0;
  
  // Get user ratings directly from templateOverall
  const titleRating = templateOverall.titleAccuracy ?? 3;
  const descriptionRating = templateOverall.descriptionQuality ?? 3;
  const coverageRating = templateOverall.propertyCoverage ?? 3;
  const alignmentRating = templateOverall.researchAlignment ?? 3;
  
  // Weights
  const weights = qualityData.weights || { 
    titleQuality: 0.25, 
    descriptionQuality: 0.25, 
    propertyCoverage: 0.25, 
    researchAlignment: 0.25 
  };
  
  // Calculate final scores
  const titleFinal = buildFinalScoreWithExpertise(titleScore, titleRating, expertiseMultiplier);
  const descriptionFinal = buildFinalScoreWithExpertise(descriptionScore, descriptionRating, expertiseMultiplier);
  const coverageFinal = buildFinalScoreWithExpertise(coverageScore, coverageRating, expertiseMultiplier);
  const alignmentFinal = buildFinalScoreWithExpertise(alignmentScore, alignmentRating, expertiseMultiplier);
  
  // Calculate weighted average
  const weightedAverage = 
    (titleFinal * weights.titleQuality) +
    (descriptionFinal * weights.descriptionQuality) +
    (coverageFinal * weights.propertyCoverage) +
    (alignmentFinal * weights.researchAlignment);
  
  // Calculate overall rating average and final score
  const overallRating = (titleRating + descriptionRating + coverageRating + alignmentRating) / 4;
  return buildFinalScoreWithExpertise(weightedAverage, overallRating, expertiseMultiplier);
}

/**
 * Calculate Content quality score from deep evaluation path
 * @param {Object} evaluation - Full evaluation object
 * @returns {number} Final quality score
 */
function calculateContentQualityScore(evaluation) {
  // Path that ContentQualityPaperDetail uses
  const contentOverall = evaluation?.evaluationMetrics?.overall?.content;
  if (!contentOverall) return 0;
  
  // Check for aggregate score first (same as detail component)
  const aggregate = contentOverall._aggregate;
  if (aggregate?.mean !== undefined) {
    return aggregate.mean;
  }
  
  // Calculate from individual property scores
  const scores = [];
  
  Object.entries(contentOverall).forEach(([key, prop]) => {
    // Skip meta keys (same as detail component)
    if (key.startsWith('_') || key === 'userRatings' || key === 'config') return;
    if (!prop) return;
    
    // Primary: finalScore or score (same as detail component)
    const score = prop.finalScore ?? prop.score;
    
    if (score !== undefined && score !== null && !isNaN(score)) {
      scores.push(score);
    }
  });
  
  return scores.length > 0 
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
    : 0;
}

/**
 * Calculate scores for a single evaluation
 * @param {Object} evaluation - Single evaluation object
 * @param {string} viewType - 'accuracy' or 'quality'
 * @returns {Object} Component scores
 */
function calculateSingleEvaluationScores(evaluation, viewType = 'accuracy') {
  const metrics = evaluation?.evaluationMetrics?.accuracy;

  // For quality view, use quality score calculations
  if (viewType === 'quality') {
    return {
      metadata: calculateMetadataQualityScore(evaluation) || getAccuracyMetadataScore(metrics),
      researchField: calculateResearchFieldQualityScore(evaluation) || getAccuracyResearchFieldScore(metrics),
      researchProblem: calculateResearchProblemQualityScore(
        evaluation?.evaluationMetrics?.overall?.research_problem?.overall?.research_problem
      ) || getAccuracyResearchProblemScore(metrics),
      template: calculateTemplateQualityScore(evaluation) || getAccuracyTemplateScore(metrics),
      content: calculateContentQualityScore(evaluation) || getAccuracyContentScore(metrics)
    };
  }

  // For accuracy view, use accuracy paths
  if (!metrics) {
    return {
      metadata: 0,
      researchField: 0,
      researchProblem: 0,
      template: 0,
      content: 0
    };
  }

  return {
    metadata: getAccuracyMetadataScore(metrics),
    researchField: getAccuracyResearchFieldScore(metrics),
    researchProblem: getAccuracyResearchProblemScore(metrics),
    template: getAccuracyTemplateScore(metrics),
    content: getAccuracyContentScore(metrics)
  };
}

/**
 * Get metadata score from accuracy metrics
 */
function getAccuracyMetadataScore(metrics) {
  if (!metrics?.metadata) return 0;
  
  if (Array.isArray(metrics.metadata)) {
    const scores = metrics.metadata
      .map(field => field.scoreDetails?.finalScore ?? field.similarityData?.overallScore ?? null)
      .filter(s => s !== null && typeof s === 'number');
    return scores.length > 0 
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
      : 0;
  } else {
    const metadataFields = Object.values(metrics.metadata);
    if (metadataFields.length > 0) {
      const scores = metadataFields
        .map(field => field.scoreDetails?.finalScore ?? field.similarityData?.overallScore ?? null)
        .filter(s => s !== null && typeof s === 'number');
      return scores.length > 0 
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
        : 0;
    }
  }
  return 0;
}

/**
 * Get research field score from accuracy metrics
 */
function getAccuracyResearchFieldScore(metrics) {
  return metrics?.researchField?.scoreDetails?.finalScore ??
         metrics?.researchField?.similarityData?.overallScore ?? 
         0;
}

/**
 * Get research problem score from accuracy metrics
 */
function getAccuracyResearchProblemScore(metrics) {
  return metrics?.researchProblem?.scoreDetails?.finalScore ??
         metrics?.researchProblem?.similarityData?.overallScore ?? 
         0;
}

/**
 * Get template score from accuracy metrics
 */
function getAccuracyTemplateScore(metrics) {
  if (!metrics?.template) return 0;
  
  return metrics.template?.template?.scoreDetails?.finalScore ??
         metrics.template?.template?.similarityData?.overallScore ??
         metrics.template?.scoreDetails?.finalScore ??
         metrics.template?.similarityData?.overallScore ?? 
         0;
}

/**
 * Get content score from accuracy metrics
 */
function getAccuracyContentScore(metrics) {
  if (!metrics?.content) return 0;
  
  if (metrics.content._aggregate?.finalScore !== undefined) {
    return metrics.content._aggregate.finalScore;
  }
  
  const propertyScores = [];
  Object.entries(metrics.content).forEach(([key, value]) => {
    if (key.startsWith('_') || key === 'userRatings' || key === 'overallScore') return;
    
    const score = 
      value?.scoreDetails?.finalScore ??
      value?.similarityData?.overallScore ??
      value?.similarity ??
      null;
    
    if (score !== null && typeof score === 'number') {
      propertyScores.push(score);
    }
  });
  
  return propertyScores.length > 0 
    ? propertyScores.reduce((sum, s) => sum + s, 0) / propertyScores.length 
    : 0;
}

/**
 * Get evaluation summary for display
 */
export function getEvaluationSummary(evaluation) {
  return {
    evaluator: `${evaluation.userInfo?.firstName} ${evaluation.userInfo?.lastName}`,
    date: new Date(evaluation.timestamp).toLocaleDateString(),
    time: new Date(evaluation.timestamp).toLocaleTimeString(),
    token: evaluation.token
  };
}

// ============================================================================
// QUALITY AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Statistical helper functions
 */
export const calculateMean = (values) => {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

export const calculateStd = (values) => {
  if (!values || values.length === 0) return 0;
  const mean = calculateMean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

export const calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const calculateStats = (values) => {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = calculateMean(values);
  return {
    mean,
    median: calculateMedian(values),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    std: calculateStd(values),
    count: values.length
  };
};

/**
 * Calculate final research problem quality score
 */
export const calculateResearchProblemFinalScore = (automatedScore, userRating, automaticConfidence = 0) => {
  if (userRating === undefined || userRating === null) {
    return automatedScore;
  }
  const normalizedRating = (userRating - 1) / 4;
  const baseAutomaticWeight = 0.1;
  const automaticWeight = Math.min(baseAutomaticWeight * (1 + automaticConfidence), 0.4);
  const userWeight = 1 - automaticWeight;
  const combinedScore = (automatedScore * automaticWeight) + (normalizedRating * userWeight);
  const agreement = 1 - Math.abs(automatedScore - normalizedRating);
  const agreementBonus = agreement * 0.1;
  return Math.min(combinedScore + agreementBonus, 1);
};

/**
 * Field name mapping for metadata
 */
export const QUALITY_FIELD_NAME_MAPPING = {
  'Title Extraction': 'title',
  'Authors Extraction': 'authors',
  'DOI Extraction': 'doi',
  'Publication Year': 'publication_year',
  'Venue/Journal': 'venue'
};

/**
 * Transform papers for quality view
 * Handles both array and object formats of papers
 */
export function transformPapersForQuality(papers, extractors) {
  console.log('transformPapersForQuality - input papers:', papers);
  console.log('transformPapersForQuality - extractors:', extractors);
  
  if (!papers) {
    console.log('transformPapersForQuality - papers is null/undefined');
    return [];
  }
  
  const { extractMetadataQuality, extractFieldQuality, extractProblemQuality, extractTemplateQuality, extractContentQuality } = extractors || {};
  
  // Handle both array and object formats
  const papersArray = Array.isArray(papers) ? papers : Object.values(papers);
  
  console.log('transformPapersForQuality - papersArray length:', papersArray?.length);
  
  if (!papersArray || papersArray.length === 0) return [];
  
  const papersByDoi = {};
  
  papersArray.forEach((paper, index) => {
    if (!paper) return;
    
    const doi = paper.doi;
    if (!doi) {
      console.log(`transformPapersForQuality - paper ${index} has no doi:`, paper);
      return;
    }
    
    if (!papersByDoi[doi]) {
      papersByDoi[doi] = {
        doi: doi,
        groundTruth: paper.groundTruth,
        userEvaluations: []
      };
    }
    
    // Log first paper's evaluation structure
    if (index === 0) {
      console.log('transformPapersForQuality - first paper evaluation:', paper.evaluation);
      console.log('transformPapersForQuality - first paper evaluationMetrics:', paper.evaluation?.evaluationMetrics);
    }
    
    const transformedEvaluation = {
      ...paper.evaluation,
      token: paper.token,
      systemData: paper.systemData,
      qualityScores: {
        metadata: extractMetadataQuality?.(paper.evaluation),
        researchField: extractFieldQuality?.(paper.evaluation),
        researchProblem: extractProblemQuality?.(paper.evaluation),
        template: extractTemplateQuality?.(paper.evaluation),
        content: extractContentQuality?.(paper.evaluation)
      }
    };
    
    papersByDoi[doi].userEvaluations.push(transformedEvaluation);
  });
  
  const result = Object.values(papersByDoi);
  console.log('transformPapersForQuality - result:', result.length, 'papers');
  
  return result;
}

/**
 * Aggregate metadata quality from all papers
 * Calculates: Final = (Automated × 60%) + (UserRating × 40%)
 */
export function aggregateMetadataQuality(transformedPapers) {
  console.log('aggregateMetadataQuality - input:', transformedPapers?.length, 'papers');
  
  if (!transformedPapers || transformedPapers.length === 0) {
    console.log('aggregateMetadataQuality - no papers, returning null');
    return null;
  }
  
  // Log first paper structure
  if (transformedPapers[0]) {
    const firstPaper = transformedPapers[0];
    console.log('aggregateMetadataQuality - first paper:', firstPaper);
    console.log('aggregateMetadataQuality - first paper userEvaluations:', firstPaper.userEvaluations?.length);
    if (firstPaper.userEvaluations?.[0]) {
      const firstEval = firstPaper.userEvaluations[0];
      console.log('aggregateMetadataQuality - first eval evaluationMetrics:', firstEval.evaluationMetrics);
      console.log('aggregateMetadataQuality - first eval quality.metadata:', firstEval.evaluationMetrics?.quality?.metadata);
    }
  }
  
  const allFieldData = {};
  const dimensions = { completeness: [], consistency: [], validity: [] };
  const automatedScores = [];
  const userRatings = [];
  const calculatedFinalScores = [];
  let totalEvaluations = 0;
  
  transformedPapers.forEach(paper => {
    paper.userEvaluations?.forEach(evaluation => {
      const metadata = evaluation?.evaluationMetrics?.quality?.metadata;
      if (!metadata) {
        console.log('aggregateMetadataQuality - no metadata for evaluation');
        return;
      }
      
      totalEvaluations++;
      const fieldAutomated = [];
      const fieldRatings = [];
      
      Object.entries(metadata).forEach(([displayName, fieldData]) => {
        const fieldKey = QUALITY_FIELD_NAME_MAPPING[displayName] || 
          displayName.toLowerCase().replace(' extraction', '').replace('/', '_').replace(/\s+/g, '_');
        
        if (!allFieldData[fieldKey]) {
          allFieldData[fieldKey] = { completeness: [], consistency: [], validity: [], automated: [], ratings: [] };
        }
        
        // Extract dimension scores
        const metrics = fieldData?.qualityData?.fieldSpecificMetrics;
        if (metrics) {
          if (metrics.completeness?.score !== undefined) {
            allFieldData[fieldKey].completeness.push(metrics.completeness.score);
            dimensions.completeness.push(metrics.completeness.score);
          }
          if (metrics.consistency?.score !== undefined) {
            allFieldData[fieldKey].consistency.push(metrics.consistency.score);
            dimensions.consistency.push(metrics.consistency.score);
          }
          if (metrics.validity?.score !== undefined) {
            allFieldData[fieldKey].validity.push(metrics.validity.score);
            dimensions.validity.push(metrics.validity.score);
          }
        }
        
        // Get automated score
        const auto = fieldData?.qualityData?.automatedOverallScore ?? 
                    fieldData?.qualityData?.overallScore ??
                    fieldData?.scoreDetails?.automatedScore;
        // Get user rating (1-5 scale)
        const rating = fieldData?.rating;
        
        if (auto !== undefined && auto !== null) {
          allFieldData[fieldKey].automated.push(auto);
          fieldAutomated.push(auto);
        }
        if (rating !== undefined && rating !== null) {
          allFieldData[fieldKey].ratings.push(rating);
          fieldRatings.push(rating);
        }
      });
      
      // Calculate evaluation-level averages
      if (fieldAutomated.length > 0) {
        const avgAuto = calculateMean(fieldAutomated);
        automatedScores.push(avgAuto);
        
        // Calculate final: Auto × 60% + NormalizedRating × 40%
        if (fieldRatings.length > 0) {
          const avgRating = calculateMean(fieldRatings);
          userRatings.push(avgRating);
          const normalizedRating = (avgRating - 1) / 4;
          const final = (avgAuto * 0.6) + (normalizedRating * 0.4);
          calculatedFinalScores.push(final);
        } else {
          calculatedFinalScores.push(avgAuto);
        }
      }
    });
  });
  
  console.log('aggregateMetadataQuality - totalEvaluations:', totalEvaluations);
  console.log('aggregateMetadataQuality - automatedScores:', automatedScores.length, automatedScores);
  console.log('aggregateMetadataQuality - userRatings:', userRatings.length, userRatings);
  console.log('aggregateMetadataQuality - calculatedFinalScores:', calculatedFinalScores.length, calculatedFinalScores);
  
  const byField = {};
  Object.entries(allFieldData).forEach(([fieldKey, scores]) => {
    if (scores.automated.length > 0) {
      const avgAuto = calculateMean(scores.automated);
      const avgRating = scores.ratings.length > 0 ? calculateMean(scores.ratings) : null;
      const normalizedRating = avgRating ? (avgRating - 1) / 4 : avgAuto;
      const finalScore = (avgAuto * 0.6) + (normalizedRating * 0.4);
      byField[fieldKey] = {
        completeness: calculateMean(scores.completeness),
        consistency: calculateMean(scores.consistency),
        validity: calculateMean(scores.validity),
        automated: avgAuto,
        userRating: avgRating,
        final: finalScore,
        overall: finalScore  // MetadataQualityView expects 'overall'
      };
      console.log(`aggregateMetadataQuality - byField[${fieldKey}]:`, byField[fieldKey]);
    }
  });
  
  if (automatedScores.length === 0) {
    console.log('aggregateMetadataQuality - NO AUTOMATED SCORES FOUND, returning null');
    return null;
  }
  
  const result = {
    qualityScores: {
      mean: calculateMean(calculatedFinalScores),
      std: calculateStd(calculatedFinalScores),
      median: calculateMedian(calculatedFinalScores),
      min: Math.min(...calculatedFinalScores),
      max: Math.max(...calculatedFinalScores)
    },
    automatedScores: {
      mean: calculateMean(automatedScores),
      std: calculateStd(automatedScores)
    },
    userRatings: {
      mean: calculateMean(userRatings),
      normalized: calculateMean(userRatings.map(r => (r - 1) / 4))
    },
    byDimension: {
      completeness: { mean: calculateMean(dimensions.completeness), std: calculateStd(dimensions.completeness) },
      consistency: { mean: calculateMean(dimensions.consistency), std: calculateStd(dimensions.consistency) },
      validity: { mean: calculateMean(dimensions.validity), std: calculateStd(dimensions.validity) }
    },
    byField,
    evaluationCount: totalEvaluations
  };
  
  console.log('aggregateMetadataQuality - RETURNING RESULT:', result);
  return result;
}

/**
 * Aggregate research field quality from all papers
 * Calculates: Final = (Automated × 60%) + (UserRating × 40%)
 */
export function aggregateResearchFieldQuality(transformedPapers) {
  if (!transformedPapers || transformedPapers.length === 0) return null;
  
  // Track dimension scores - both automated and calculated final
  const dimensionsAutomated = { confidence: [], relevance: [], consistency: [] };
  const dimensionsFinal = { confidence: [], relevance: [], consistency: [] };
  const dimensionUserRatings = { confidence: [], relevance: [], consistency: [] };
  const automatedScores = [];
  const userRatings = [];
  const calculatedFinalScores = [];
  let totalEvaluations = 0;
  let ratingsCount = 0;
  
  transformedPapers.forEach(paper => {
    paper.userEvaluations?.forEach(evaluation => {
      const rfQuality = evaluation?.evaluationMetrics?.quality?.researchField;
      const rfOverall = evaluation?.evaluationMetrics?.overall?.research_field;
      const evalOverall = evaluation?.overall?.research_field;
      
      if (!rfQuality && !rfOverall) return;
      totalEvaluations++;
      
      // Extract automated dimension scores from fieldSpecificMetrics
      const fieldMetrics = rfQuality?.qualityData?.fieldSpecificMetrics;
      
      // Get dimension-level user ratings from evaluation.overall.research_field
      const confRating = evalOverall?.confidence?.rating ?? rfOverall?.confidence?.rating;
      const relRating = evalOverall?.relevance?.rating ?? rfOverall?.relevance?.rating;
      const consRating = evalOverall?.consistency?.rating ?? rfOverall?.consistency?.rating;
      
      if (fieldMetrics) {
        // Confidence dimension
        if (fieldMetrics.confidence?.score !== undefined) {
          const autoScore = fieldMetrics.confidence.score;
          dimensionsAutomated.confidence.push(autoScore);
          
          if (confRating !== undefined) {
            dimensionUserRatings.confidence.push(confRating);
            const normalizedRating = (confRating - 1) / 4;
            const finalScore = (autoScore * 0.6) + (normalizedRating * 0.4);
            dimensionsFinal.confidence.push(finalScore);
          } else {
            dimensionsFinal.confidence.push(autoScore);
          }
        }
        
        // Relevance dimension
        if (fieldMetrics.relevance?.score !== undefined) {
          const autoScore = fieldMetrics.relevance.score;
          dimensionsAutomated.relevance.push(autoScore);
          
          if (relRating !== undefined) {
            dimensionUserRatings.relevance.push(relRating);
            const normalizedRating = (relRating - 1) / 4;
            const finalScore = (autoScore * 0.6) + (normalizedRating * 0.4);
            dimensionsFinal.relevance.push(finalScore);
          } else {
            dimensionsFinal.relevance.push(autoScore);
          }
        }
        
        // Consistency dimension
        if (fieldMetrics.consistency?.score !== undefined) {
          const autoScore = fieldMetrics.consistency.score;
          dimensionsAutomated.consistency.push(autoScore);
          
          if (consRating !== undefined) {
            dimensionUserRatings.consistency.push(consRating);
            const normalizedRating = (consRating - 1) / 4;
            const finalScore = (autoScore * 0.6) + (normalizedRating * 0.4);
            dimensionsFinal.consistency.push(finalScore);
          } else {
            dimensionsFinal.consistency.push(autoScore);
          }
        }
      }
      
      // Get automated overall score
      const auto = rfQuality?.qualityData?.automatedOverallScore ?? 
                  rfQuality?.qualityData?.overallScore ??
                  rfOverall?.qualityMetrics?.overallQuality?.automated;
      // Get user rating (1-5 scale) - primary field rating
      const rating = rfQuality?.rating ?? evalOverall?.primaryField?.rating ?? rfOverall?.primaryField?.rating;
      
      if (auto !== undefined && auto !== null) {
        automatedScores.push(auto);
        
        if (rating !== undefined && rating !== null) {
          userRatings.push(rating);
          ratingsCount++;
          const normalizedRating = (rating - 1) / 4;
          const final = (auto * 0.6) + (normalizedRating * 0.4);
          calculatedFinalScores.push(final);
        } else {
          calculatedFinalScores.push(auto);
        }
      }
    });
  });
  
  if (automatedScores.length === 0) return null;
  
  // Helper to create stats object
  const createStats = (scores) => ({
    mean: calculateMean(scores),
    std: calculateStd(scores),
    median: calculateMedian(scores),
    min: scores.length > 0 ? Math.min(...scores) : 0,
    max: scores.length > 0 ? Math.max(...scores) : 0,
    count: scores.length
  });
  
  return {
    qualityScores: createStats(calculatedFinalScores),
    automatedScores: createStats(automatedScores),
    userRatings: {
      mean: calculateMean(userRatings),
      normalized: calculateMean(userRatings.map(r => (r - 1) / 4)),
      count: userRatings.length,
      // Add dimension-level user rating stats
      primaryField: createStats(userRatings),
      confidence: createStats(dimensionUserRatings.confidence),
      relevance: createStats(dimensionUserRatings.relevance),
      consistency: createStats(dimensionUserRatings.consistency)
    },
    byDimension: {
      confidence: {
        automated: createStats(dimensionsAutomated.confidence),
        final: createStats(dimensionsFinal.confidence)
      },
      relevance: {
        automated: createStats(dimensionsAutomated.relevance),
        final: createStats(dimensionsFinal.relevance)
      },
      consistency: {
        automated: createStats(dimensionsAutomated.consistency),
        final: createStats(dimensionsFinal.consistency)
      }
    },
    evaluationCount: totalEvaluations,
    ratingsCount: ratingsCount
  };
}

/**
 * Aggregate research problem quality from all papers
 * Calculates: Final = (Automated × 60%) + (UserRating × 40%)
 * Returns comprehensive structure for ResearchProblemQualityView
 */
export function aggregateResearchProblemQuality(transformedPapers) {
  if (!transformedPapers || transformedPapers.length === 0) return null;
  
  console.log('aggregateResearchProblemQuality - input:', transformedPapers?.length, 'papers');
  
  // Helper function to calculate final score (same as wrapper)
  const buildScoreDetails = (automatedScore, userRating, expertiseMultiplier) => {
    const normalizedRating = userRating / 5;
    
    // Calculate automatic confidence using U-shaped curve
    const automaticConfidence = 1 - Math.pow((automatedScore - 0.5) * 2, 2);
    
    // Calculate weights
    const rawAutomaticWeight = Math.max(0.1, 0.4 * automaticConfidence);
    const rawUserWeight = 0.6 * expertiseMultiplier;
    const totalWeight = rawAutomaticWeight + rawUserWeight;
    const automaticWeight = rawAutomaticWeight / totalWeight;
    const userWeight = rawUserWeight / totalWeight;
    
    // Calculate combined score
    const adjustedUserRating = Math.min(1, normalizedRating * expertiseMultiplier);
    const weightedAutomated = automatedScore * automaticWeight;
    const weightedUser = adjustedUserRating * userWeight;
    const combinedScore = weightedAutomated + weightedUser;
    
    // Calculate agreement bonus
    const agreement = 1 - Math.abs(automatedScore - normalizedRating);
    const agreementBonus = agreement * 0.1;
    
    // Final score with bonus
    const finalScore = Math.min(1, combinedScore * (1 + agreementBonus));
    
    return finalScore;
  };
  
  // Helper to extract score from nested structure
  const getScore = (metric) => {
    if (!metric) return 0;
    if (metric.value?.score !== undefined) return metric.value.score;
    if (metric.score !== undefined) return metric.score;
    if (typeof metric.value === 'number') return metric.value;
    return 0;
  };
  
  const metrics = {
    sourceDistribution: { orkg: 0, llm: 0, total: 0 },
    automatedScores: [],
    userRatings: [],
    calculatedFinalScores: [],
    // Track both automated and final for each dimension
    dimensionScores: {
      problemTitle: { automated: [], final: [] },
      problemDescription: { automated: [], final: [] },
      relevance: { automated: [], final: [] },
      completeness: { automated: [], final: [] },
      evidenceQuality: { automated: [], final: [] }
    },
    // User ratings per dimension
    userRatingsByDimension: {
      overallAssessment: [],
      problemTitle: [],
      problemDescription: [],
      relevance: [],
      completeness: [],
      evidenceQuality: []
    },
    bySource: { 
      orkg: { scores: [], dimensionScores: {} }, 
      llm: { scores: [], dimensionScores: {} } 
    }
  };
  
  // Weights for dimensions (same as config)
  const weights = {
    problemTitle: 0.3,
    problemDescription: 0.3,
    relevance: 0.2,
    evidenceQuality: 0.2
  };
  
  // Initialize dimension scores by source
  Object.keys(metrics.dimensionScores).forEach(key => {
    metrics.bySource.orkg.dimensionScores[key] = [];
    metrics.bySource.llm.dimensionScores[key] = [];
  });
  
  let hasAnyData = false;
  
  transformedPapers.forEach(paper => {
    paper.userEvaluations?.forEach(evaluation => {
      // Use paper.systemData.researchProblems, not evaluation.systemData
      const researchProblems = paper.systemData?.researchProblems;
      
      // Deep path: overall.research_problem.overall.research_problem
      const rpOverallDeep = evaluation.evaluationMetrics?.overall?.research_problem?.overall?.research_problem;
      
      if (!rpOverallDeep) return;

      // Determine source
      let isLLM = false;
      if (researchProblems) {
        const hasLLMProblem = !!researchProblems.llm_problem;
        const hasORKGProblems = researchProblems.orkg_problems?.length > 0;
        isLLM = hasLLMProblem && !hasORKGProblems ? true :
                (hasLLMProblem && hasORKGProblems ? (researchProblems.selectedProblem?.isLLMGenerated || false) : false);
      }

      if (isLLM) metrics.sourceDistribution.llm++;
      else metrics.sourceDistribution.orkg++;
      metrics.sourceDistribution.total++;

      // Get quality metrics from rpOverallDeep.quality
      const qualityMetrics = rpOverallDeep.quality;
      const userRatings = rpOverallDeep.userRatings || {};
      const expertiseMultiplier = userRatings.expertiseMultiplier || 1;
      
      // Get automated scores for each dimension
      const problemTitleScore = getScore(qualityMetrics?.problemTitle);
      const problemDescriptionScore = getScore(qualityMetrics?.problemDescription);
      const relevanceScore = getScore(qualityMetrics?.relevance);
      const evidenceQualityScore = getScore(qualityMetrics?.evidenceQuality);
      
      // Get user ratings for each dimension
      const problemTitleRating = userRatings.problemTitle?.rating ?? 3;
      const problemDescriptionRating = userRatings.problemDescription?.rating ?? 3;
      const relevanceRating = userRatings.relevance?.rating ?? 3;
      const evidenceQualityRating = userRatings.evidenceQuality?.rating ?? 3;
      const overallRating = userRatings.overallRating ?? 3;
      
      // Calculate final scores for each dimension using same formula as wrapper
      const problemTitleFinal = buildScoreDetails(problemTitleScore, problemTitleRating, expertiseMultiplier);
      const problemDescriptionFinal = buildScoreDetails(problemDescriptionScore, problemDescriptionRating, expertiseMultiplier);
      const relevanceFinal = buildScoreDetails(relevanceScore, relevanceRating, expertiseMultiplier);
      const evidenceQualityFinal = buildScoreDetails(evidenceQualityScore, evidenceQualityRating, expertiseMultiplier);
      
      // Store dimension scores
      metrics.dimensionScores.problemTitle.automated.push(problemTitleScore);
      metrics.dimensionScores.problemTitle.final.push(problemTitleFinal);
      metrics.dimensionScores.problemDescription.automated.push(problemDescriptionScore);
      metrics.dimensionScores.problemDescription.final.push(problemDescriptionFinal);
      metrics.dimensionScores.relevance.automated.push(relevanceScore);
      metrics.dimensionScores.relevance.final.push(relevanceFinal);
      metrics.dimensionScores.evidenceQuality.automated.push(evidenceQualityScore);
      metrics.dimensionScores.evidenceQuality.final.push(evidenceQualityFinal);
      
      // Track by source
      if (isLLM) {
        metrics.bySource.llm.dimensionScores.problemTitle.push(problemTitleFinal);
        metrics.bySource.llm.dimensionScores.problemDescription.push(problemDescriptionFinal);
        metrics.bySource.llm.dimensionScores.relevance.push(relevanceFinal);
        metrics.bySource.llm.dimensionScores.evidenceQuality.push(evidenceQualityFinal);
      } else {
        metrics.bySource.orkg.dimensionScores.problemTitle.push(problemTitleFinal);
        metrics.bySource.orkg.dimensionScores.problemDescription.push(problemDescriptionFinal);
        metrics.bySource.orkg.dimensionScores.relevance.push(relevanceFinal);
        metrics.bySource.orkg.dimensionScores.evidenceQuality.push(evidenceQualityFinal);
      }
      
      // Store user ratings
      metrics.userRatingsByDimension.problemTitle.push(problemTitleRating);
      metrics.userRatingsByDimension.problemDescription.push(problemDescriptionRating);
      metrics.userRatingsByDimension.relevance.push(relevanceRating);
      metrics.userRatingsByDimension.evidenceQuality.push(evidenceQualityRating);
      metrics.userRatingsByDimension.overallAssessment.push(overallRating);
      
      // Calculate weighted average of dimension final scores
      const weightedDimensionAverage = 
        (problemTitleFinal * weights.problemTitle) +
        (problemDescriptionFinal * weights.problemDescription) +
        (relevanceFinal * weights.relevance) +
        (evidenceQualityFinal * weights.evidenceQuality);
      
      // Calculate overall final score using the weighted average and overall rating
      const overallFinal = buildScoreDetails(weightedDimensionAverage, overallRating, expertiseMultiplier);
      
      // Calculate raw automated overall (for reference)
      const automatedOverall = 
        (problemTitleScore * weights.problemTitle) +
        (problemDescriptionScore * weights.problemDescription) +
        (relevanceScore * weights.relevance) +
        (evidenceQualityScore * weights.evidenceQuality);
      
      metrics.automatedScores.push(automatedOverall);
      metrics.userRatings.push(overallRating);
      metrics.calculatedFinalScores.push(overallFinal);
      
      if (isLLM) metrics.bySource.llm.scores.push(overallFinal);
      else metrics.bySource.orkg.scores.push(overallFinal);
      
      hasAnyData = true;
    });
  });

  console.log('aggregateResearchProblemQuality - automatedScores:', metrics.automatedScores.length, metrics.automatedScores);
  console.log('aggregateResearchProblemQuality - userRatings:', metrics.userRatings.length, metrics.userRatings);
  console.log('aggregateResearchProblemQuality - calculatedFinalScores:', metrics.calculatedFinalScores);

  if (!hasAnyData || metrics.calculatedFinalScores.length === 0) return null;

  // Helper to create full stats object
  const createStats = (scores) => {
    if (!scores || scores.length === 0) return null;
    return {
      mean: calculateMean(scores),
      std: calculateStd(scores),
      median: calculateMedian(scores),
      min: Math.min(...scores),
      max: Math.max(...scores),
      count: scores.length
    };
  };

  return {
    sourceDistribution: metrics.sourceDistribution,
    qualityScores: {
      overall: createStats(metrics.calculatedFinalScores),
      automated: createStats(metrics.automatedScores)
    },
    userRatings: Object.fromEntries(
      Object.entries(metrics.userRatingsByDimension).map(([key, ratings]) => [
        key, createStats(ratings)
      ])
    ),
    dimensionScores: Object.fromEntries(
      Object.entries(metrics.dimensionScores).map(([key, scores]) => [
        key, {
          final: createStats(scores.final),
          automated: createStats(scores.automated)
        }
      ])
    ),
    bySource: {
      orkg: {
        overall: createStats(metrics.bySource.orkg.scores),
        dimensions: Object.fromEntries(
          Object.entries(metrics.bySource.orkg.dimensionScores).map(([key, scores]) => [
            key, createStats(scores)
          ])
        )
      },
      llm: {
        overall: createStats(metrics.bySource.llm.scores),
        dimensions: Object.fromEntries(
          Object.entries(metrics.bySource.llm.dimensionScores).map(([key, scores]) => [
            key, createStats(scores)
          ])
        )
      }
    },
    evaluationCount: metrics.sourceDistribution.total
  };
}

/**
 * Aggregate template quality from all papers
 * Calculates: Final = (Automated × 60%) + (UserRating × 40%)
 */
export function aggregateTemplateQuality(transformedPapers) {
  if (!transformedPapers || transformedPapers.length === 0) return null;
  
  // Helper function to calculate final score with expertise weighting
  const buildFinalScore = (automatedScore, userRating, expMult = 1) => {
    const normalizedRating = userRating / 5;
    const automaticConfidence = 1 - Math.pow((automatedScore - 0.5) * 2, 2);
    const rawAutomaticWeight = Math.max(0.1, 0.4 * automaticConfidence);
    const rawUserWeight = 0.6 * expMult;
    const totalWeight = rawAutomaticWeight + rawUserWeight;
    const automaticWeight = rawAutomaticWeight / totalWeight;
    const userWeight = rawUserWeight / totalWeight;
    const adjustedUserRating = Math.min(1, normalizedRating * expMult);
    const weightedAutomated = automatedScore * automaticWeight;
    const weightedUser = adjustedUserRating * userWeight;
    const combinedScore = weightedAutomated + weightedUser;
    const agreement = 1 - Math.abs(automatedScore - normalizedRating);
    const agreementBonus = agreement * 0.1;
    return Math.min(1, combinedScore * (1 + agreementBonus));
  };
  
  const metrics = {
    sourceDistribution: { orkg: 0, llm: 0, total: 0 },
    templateDistribution: {},
    automatedScores: [],
    userRatings: [],
    calculatedFinalScores: [],
    dimensionScores: {
      titleQuality: { automated: [], final: [] },
      descriptionQuality: { automated: [], final: [] },
      propertyCoverage: { automated: [], final: [] },
      researchAlignment: { automated: [], final: [] }
    },
    // Per-dimension user ratings
    userRatingsByDimension: {
      titleAccuracy: [],
      descriptionQuality: [],
      propertyCoverage: [],
      researchAlignment: []
    },
    bySource: {
      orkg: { scores: [], templates: [] },
      llm: { scores: [], templates: [] }
    }
  };
  
  let hasAnyData = false;
  let processedCount = 0;
  
  // Weights for template quality dimensions
  const weights = {
    titleQuality: 0.25,
    descriptionQuality: 0.25,
    propertyCoverage: 0.25,
    researchAlignment: 0.25
  };
  
  transformedPapers.forEach(paper => {
    paper.userEvaluations?.forEach(evaluation => {
      // Template quality is at overall.template
      const templateOverall = evaluation.evaluationMetrics?.overall?.template;
      const templateQuality = templateOverall?.qualityResults;
      
      if (!templateQuality && !templateOverall) return;
      processedCount++;

      // Get template info
      const templateData = templateOverall?.templateData || {};
      const templateName = templateData.title || templateData.name || 'Unknown Template';
      
      // Determine source - check multiple paths
      let isLLM = false;
      
      if (templateOverall?.isOrkgScenario === true) {
        isLLM = false;
      } else if (templateOverall?.isOrkgScenario === false) {
        isLLM = true;
      } else if (templateData.isLLMGenerated === true) {
        isLLM = true;
      } else {
        const templatesData = paper.systemData?.templates;
        if (templatesData) {
          const selectedTemplate = templatesData.selectedTemplate;
          if (selectedTemplate?.isLLMGenerated === true || selectedTemplate?.source === 'llm') {
            isLLM = true;
          } else if (templatesData.llm_template && !selectedTemplate) {
            isLLM = true;
          }
        }
      }
      
      if (isLLM) {
        metrics.sourceDistribution.llm++;
        metrics.bySource.llm.templates.push(templateName);
      } else {
        metrics.sourceDistribution.orkg++;
        metrics.bySource.orkg.templates.push(templateName);
      }
      metrics.sourceDistribution.total++;
      metrics.templateDistribution[templateName] = (metrics.templateDistribution[templateName] || 0) + 1;
      hasAnyData = true;

      // Get expertise multiplier
      const expertiseMultiplier = templateOverall?.expertiseWeight || 
                                  evaluation?.userInfo?.expertiseMultiplier || 1;

      // Get dimension automated scores from qualityResults.qualityData.fieldSpecificMetrics
      const fieldMetrics = templateQuality?.qualityData?.fieldSpecificMetrics || {};
      
      // Get raw automated scores
      const titleAuto = fieldMetrics.titleAccuracy?.score ?? fieldMetrics.titleQuality?.score ?? 0;
      const descAuto = fieldMetrics.descriptionQuality?.score ?? 0;
      const coverageAuto = fieldMetrics.propertyCoverage?.score ?? 0;
      const alignmentAuto = fieldMetrics.researchAlignment?.score ?? 0;
      
      // Get user ratings from templateOverall (directly on the object, not nested)
      const titleRating = templateOverall?.titleAccuracy ?? 3;
      const descRating = templateOverall?.descriptionQuality ?? 3;
      const coverageRating = templateOverall?.propertyCoverage ?? 3;
      const alignmentRating = templateOverall?.researchAlignment ?? 3;
      
      // Store user ratings by dimension
      if (typeof titleRating === 'number') metrics.userRatingsByDimension.titleAccuracy.push(titleRating);
      if (typeof descRating === 'number') metrics.userRatingsByDimension.descriptionQuality.push(descRating);
      if (typeof coverageRating === 'number') metrics.userRatingsByDimension.propertyCoverage.push(coverageRating);
      if (typeof alignmentRating === 'number') metrics.userRatingsByDimension.researchAlignment.push(alignmentRating);
      
      // Calculate FINAL scores for each dimension using buildFinalScore
      const titleFinal = buildFinalScore(titleAuto, titleRating, expertiseMultiplier);
      const descFinal = buildFinalScore(descAuto, descRating, expertiseMultiplier);
      const coverageFinal = buildFinalScore(coverageAuto, coverageRating, expertiseMultiplier);
      const alignmentFinal = buildFinalScore(alignmentAuto, alignmentRating, expertiseMultiplier);
      
      // Store dimension scores (both automated and final)
      metrics.dimensionScores.titleQuality.automated.push(titleAuto);
      metrics.dimensionScores.titleQuality.final.push(titleFinal);
      metrics.dimensionScores.descriptionQuality.automated.push(descAuto);
      metrics.dimensionScores.descriptionQuality.final.push(descFinal);
      metrics.dimensionScores.propertyCoverage.automated.push(coverageAuto);
      metrics.dimensionScores.propertyCoverage.final.push(coverageFinal);
      metrics.dimensionScores.researchAlignment.automated.push(alignmentAuto);
      metrics.dimensionScores.researchAlignment.final.push(alignmentFinal);
      
      // Calculate raw automated overall score
      const automatedOverall = 
        (titleAuto * weights.titleQuality) +
        (descAuto * weights.descriptionQuality) +
        (coverageAuto * weights.propertyCoverage) +
        (alignmentAuto * weights.researchAlignment);
      
      // Calculate weighted average of final dimension scores
      const weightedFinalAverage = 
        (titleFinal * weights.titleQuality) +
        (descFinal * weights.descriptionQuality) +
        (coverageFinal * weights.propertyCoverage) +
        (alignmentFinal * weights.researchAlignment);
      
      // Calculate overall final score
      const avgUserRating = (titleRating + descRating + coverageRating + alignmentRating) / 4;
      const overallFinal = buildFinalScore(weightedFinalAverage, avgUserRating, expertiseMultiplier);
      
      metrics.automatedScores.push(automatedOverall);
      metrics.userRatings.push(avgUserRating);
      metrics.calculatedFinalScores.push(overallFinal);
      
      if (isLLM) metrics.bySource.llm.scores.push(overallFinal);
      else metrics.bySource.orkg.scores.push(overallFinal);
    });
  });

  if (!hasAnyData || metrics.calculatedFinalScores.length === 0) return null;

  // Helper to create full stats object
  const createStats = (scores) => {
    if (!scores || scores.length === 0) return null;
    return {
      mean: calculateMean(scores),
      std: calculateStd(scores),
      median: calculateMedian(scores),
      min: Math.min(...scores),
      max: Math.max(...scores),
      count: scores.length
    };
  };

  return {
    sourceDistribution: metrics.sourceDistribution,
    templateDistribution: metrics.templateDistribution,
    qualityScores: {
      overall: createStats(metrics.calculatedFinalScores),
      automated: createStats(metrics.automatedScores)
    },
    // Per-dimension user ratings with full stats
    userRatings: Object.fromEntries(
      Object.entries(metrics.userRatingsByDimension).map(([key, ratings]) => [
        key, createStats(ratings)
      ])
    ),
    dimensionScores: Object.fromEntries(
      Object.entries(metrics.dimensionScores).map(([key, scores]) => [
        key, { 
          automated: createStats(scores.automated),
          final: createStats(scores.final)
        }
      ])
    ),
    bySource: {
      orkg: { 
        overall: createStats(metrics.bySource.orkg.scores),
        templates: [...new Set(metrics.bySource.orkg.templates)] 
      },
      llm: { 
        overall: createStats(metrics.bySource.llm.scores),
        templates: [...new Set(metrics.bySource.llm.templates)] 
      }
    },
    evaluationCount: processedCount
  };
}

/**
 * Aggregate content quality from all papers
 * Uses property-level scores and user ratings
 */
export function aggregateContentQuality(transformedPapers) {
  if (!transformedPapers || transformedPapers.length === 0) return null;
  
  const metrics = {
    sourceDistribution: { orkg: 0, llm: 0, total: 0 },
    finalScores: [],
    automatedScores: [],
    userRatings: {
      propertyCoverage: [],
      evidenceQuality: [],
      valueAccuracy: []
    },
    dimensionScores: {
      extractionAccuracy: [],
      completeness: [],
      propertyQuality: []
    },
    extractionStats: {
      totalProperties: [],
      extractedProperties: [],
      extractionRate: []
    },
    bySource: { orkg: { scores: [] }, llm: { scores: [] } }
  };
  
  let hasAnyData = false;
  let processedCount = 0;
  
  transformedPapers.forEach(paper => {
    paper.userEvaluations?.forEach(evaluation => {
      // Content data can be at different paths
      const contentOverall = evaluation?.evaluationMetrics?.overall?.content;
      const contentAccuracy = evaluation?.evaluationMetrics?.accuracy?.content;
      
      if (!contentOverall && !contentAccuracy) return;
      
      // Determine source - check multiple paths
      // Path 1: paper.systemData.templates (main source)
      const templatesData = paper.systemData?.templates;
      // Path 2: templateOverall.isOrkgScenario
      const templateOverall = evaluation?.evaluationMetrics?.overall?.template;
      
      let source = 'unknown';
      
      // Check isOrkgScenario flag first (most reliable)
      if (templateOverall?.isOrkgScenario === true) {
        source = 'orkg';
      } else if (templateOverall?.isOrkgScenario === false) {
        source = 'llm';
      }
      // Fallback: check templates structure
      else if (templatesData) {
        const hasLLMTemplate = !!templatesData.llm_template;
        const hasORKGTemplates = templatesData.available?.orkg_templates?.length > 0 || 
                                  templatesData.orkg_templates?.length > 0;
        const selectedTemplate = templatesData.selectedTemplate;
        
        if (selectedTemplate?.isLLMGenerated === true || selectedTemplate?.source === 'llm') {
          source = 'llm';
        } else if (selectedTemplate?.source === 'orkg') {
          source = 'orkg';
        } else if (hasLLMTemplate && !selectedTemplate) {
          source = 'llm'; // LLM template used when no explicit selection
        } else if (hasORKGTemplates && !hasLLMTemplate) {
          source = 'orkg';
        }
      }
      
      if (source === 'orkg' || source === 'llm') metrics.sourceDistribution[source]++;
      metrics.sourceDistribution.total++;
      processedCount++;
      
      // Calculate property scores from content accuracy
      const propertyScores = [];
      let totalProperties = 0;
      let extractedProperties = 0;
      
      if (contentAccuracy) {
        Object.entries(contentAccuracy).forEach(([key, value]) => {
          if (key.startsWith('_') || key === 'userRatings') return;
          totalProperties++;
          
          // Get final score from scoreDetails
          const finalScore = value?.scoreDetails?.finalScore;
          const automatedScore = value?.similarityData?.overallScore ?? value?.similarity;
          
          if (finalScore !== undefined && finalScore !== null) {
            propertyScores.push(finalScore);
            extractedProperties++;
          } else if (automatedScore !== undefined && automatedScore !== null) {
            propertyScores.push(automatedScore);
            extractedProperties++;
          }
        });
      }
      
      // Also check contentOverall for scores
      if (contentOverall && propertyScores.length === 0) {
        Object.entries(contentOverall).forEach(([key, value]) => {
          if (key === 'userRatings') return;
          totalProperties++;
          
          const score = value?.score ?? value?.scoreDetails?.finalScore;
          if (score !== undefined && score !== null) {
            propertyScores.push(score);
            extractedProperties++;
          }
        });
      }
      
      if (propertyScores.length > 0) {
        const autoScore = calculateMean(propertyScores);
        hasAnyData = true;
        metrics.automatedScores.push(autoScore);
        
        // Get average user rating from content
        const userRatings = contentOverall?.userRatings;
        let avgUserRating = null;
        if (userRatings) {
          const ratingValues = [];
          if (userRatings.propertyCoverage !== undefined) ratingValues.push(userRatings.propertyCoverage);
          if (userRatings.evidenceQuality !== undefined) ratingValues.push(userRatings.evidenceQuality);
          if (userRatings.valueAccuracy !== undefined) ratingValues.push(userRatings.valueAccuracy);
          if (ratingValues.length > 0) avgUserRating = calculateMean(ratingValues);
        }
        
        // Calculate final: Auto × 60% + NormalizedRating × 40%
        if (avgUserRating !== null) {
          const normalizedRating = (avgUserRating - 1) / 4;
          const final = (autoScore * 0.6) + (normalizedRating * 0.4);
          metrics.finalScores.push(final);
        } else {
          metrics.finalScores.push(autoScore);
        }
        
        if (source === 'orkg' || source === 'llm') {
          metrics.bySource[source].scores.push(metrics.finalScores[metrics.finalScores.length - 1]);
        }
      }
      
      // User ratings from contentOverall (for dimension scores)
      const userRatings = contentOverall?.userRatings;
      if (userRatings) {
        // Map user ratings (1-5 scale) to normalized scores (0-1)
        if (userRatings.propertyCoverage !== undefined) {
          metrics.userRatings.propertyCoverage.push(userRatings.propertyCoverage);
          metrics.dimensionScores.completeness.push((userRatings.propertyCoverage - 1) / 4);
          hasAnyData = true;
        }
        if (userRatings.evidenceQuality !== undefined) {
          metrics.userRatings.evidenceQuality.push(userRatings.evidenceQuality);
          metrics.dimensionScores.propertyQuality.push((userRatings.evidenceQuality - 1) / 4);
          hasAnyData = true;
        }
        if (userRatings.valueAccuracy !== undefined) {
          metrics.userRatings.valueAccuracy.push(userRatings.valueAccuracy);
          metrics.dimensionScores.extractionAccuracy.push((userRatings.valueAccuracy - 1) / 4);
          hasAnyData = true;
        }
      }
      
      // Extraction stats
      if (totalProperties > 0) {
        const extractionRate = extractedProperties / totalProperties;
        metrics.extractionStats.totalProperties.push(totalProperties);
        metrics.extractionStats.extractedProperties.push(extractedProperties);
        metrics.extractionStats.extractionRate.push(extractionRate);
        hasAnyData = true;
      }
    });
  });
  
  if (!hasAnyData) return null;

  // Helper to create full stats object
  const createStats = (scores) => {
    if (!scores || scores.length === 0) return null;
    return {
      mean: calculateMean(scores),
      std: calculateStd(scores),
      median: calculateMedian(scores),
      min: Math.min(...scores),
      max: Math.max(...scores),
      count: scores.length
    };
  };

  return {
    sourceDistribution: metrics.sourceDistribution,
    qualityScores: {
      overall: createStats(metrics.finalScores),
      automated: createStats(metrics.automatedScores)
    },
    userRatings: {
      propertyCoverage: createStats(metrics.userRatings.propertyCoverage),
      evidenceQuality: createStats(metrics.userRatings.evidenceQuality),
      valueAccuracy: createStats(metrics.userRatings.valueAccuracy)
    },
    dimensionScores: {
      extractionAccuracy: { 
        automated: createStats(metrics.dimensionScores.extractionAccuracy),
        mean: calculateMean(metrics.dimensionScores.extractionAccuracy)
      },
      completeness: { 
        automated: createStats(metrics.dimensionScores.completeness),
        mean: calculateMean(metrics.dimensionScores.completeness)
      },
      propertyQuality: { 
        automated: createStats(metrics.dimensionScores.propertyQuality),
        mean: calculateMean(metrics.dimensionScores.propertyQuality)
      }
    },
    extractionStats: {
      totalProperties: createStats(metrics.extractionStats.totalProperties),
      extractedProperties: createStats(metrics.extractionStats.extractedProperties),
      extractionRate: createStats(metrics.extractionStats.extractionRate)
    },
    bySource: {
      orkg: { 
        overall: createStats(metrics.bySource.orkg.scores)
      },
      llm: { 
        overall: createStats(metrics.bySource.llm.scores)
      }
    },
    evaluationCount: processedCount
  };
}

/**
 * Calculate quality summary stats for overview cards
 * Reads from aggregatedData.papers (same source as Overview)
 * Uses formula: Final = (Automated × 60%) + (User Rating × 40%)
 */
export function calculateQualitySummaryStats(qualityData, systemEvaluationData, aggregatedData) {
  console.log('calculateQualitySummaryStats - CALLED');
  console.log('calculateQualitySummaryStats - aggregatedData:', aggregatedData);
  
  // If aggregatedData.papers is available, use the same calculation as Overview
  if (aggregatedData?.papers) {
    const papers = Object.values(aggregatedData.papers);
    const componentNames = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const result = {};
    
    console.log('calculateQualitySummaryStats - Processing', papers.length, 'papers from aggregatedData');
    
    componentNames.forEach(compName => {
      const scores = [];
      const userRatings = [];
      
      papers.forEach(paper => {
        const comp = paper[compName];
        if (!comp) return;
        
        // QUALITY: Get from qualityScores.mean (same as Overview)
        const qual = comp.qualityScores?.mean;
        if (qual !== undefined && qual !== null && !isNaN(qual) && qual > 0) {
          scores.push(qual);
        }
        
        // User rating: from userRatings.mean
        const ur = comp.userRatings?.mean;
        if (ur !== undefined && ur !== null && !isNaN(ur)) {
          userRatings.push(ur);
        }
      });
      
      if (scores.length > 0) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const std = scores.length > 1 
          ? Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length) 
          : 0;
        const userMean = userRatings.length > 0 
          ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length 
          : null;
        const finalScore = userMean !== null ? mean * 0.6 + userMean * 0.4 : mean;
        
        // Map component names for result
        const resultKey = compName === 'research_field' ? 'researchField' 
                       : compName === 'research_problem' ? 'researchProblem' 
                       : compName;
        
        result[resultKey] = {
          score: finalScore,
          final: finalScore,
          auto: mean,
          userRating: userMean, // Already 0-1 normalized
          evaluations: scores.length,
          std,
          min: Math.min(...scores),
          max: Math.max(...scores)
        };
      }
    });
    
    console.log('calculateQualitySummaryStats - Result from aggregatedData:', result);
    
    // Fill in missing components with zeros
    ['metadata', 'researchField', 'researchProblem', 'template', 'content'].forEach(key => {
      if (!result[key]) {
        result[key] = { score: 0, final: 0, auto: 0, userRating: 0, evaluations: 0 };
      }
    });
    
    return result;
  }
  
  // Fallback: use passed quality data from aggregation functions
  console.log('calculateQualitySummaryStats - Fallback to qualityData');
  
  const metadata = qualityData?.metadata || qualityData?.aggregatedMetadataQuality;
  const researchField = qualityData?.researchField || qualityData?.aggregatedResearchFieldQuality;
  const researchProblem = qualityData?.researchProblem || qualityData?.aggregatedResearchProblemQuality;
  const template = qualityData?.template || qualityData?.aggregatedTemplateQuality;
  const content = qualityData?.content || qualityData?.aggregatedContentQuality;
  
  return {
    metadata: {
      score: metadata?.qualityScores?.mean || 0,
      evaluations: metadata?.evaluationCount || 0,
      auto: metadata?.automatedScores?.mean || 0,
      userRating: metadata?.userRatings?.mean || 0,
      final: metadata?.qualityScores?.mean || 0
    },
    researchField: {
      score: researchField?.qualityScores?.mean || 0,
      evaluations: researchField?.evaluationCount || 0,
      auto: researchField?.automatedScores?.mean || 0,
      userRating: researchField?.userRatings?.mean || 0,
      final: researchField?.qualityScores?.mean || 0
    },
    researchProblem: {
      score: researchProblem?.qualityScores?.mean || 0,
      evaluations: researchProblem?.evaluationCount || 0,
      auto: researchProblem?.automatedScores?.mean || 0,
      userRating: researchProblem?.userRatings?.mean || 0,
      final: researchProblem?.qualityScores?.mean || 0
    },
    template: {
      score: template?.qualityScores?.mean || 0,
      evaluations: template?.evaluationCount || 0,
      auto: template?.automatedScores?.mean || 0,
      userRating: template?.userRatings?.mean || 0,
      final: template?.qualityScores?.mean || 0
    },
    content: {
      score: content?.qualityScores?.mean || 0,
      evaluations: content?.evaluationCount || 0,
      auto: content?.automatedScores?.mean || 0,
      userRating: content?.userRatings?.mean || 0,
      final: content?.qualityScores?.mean || 0
    }
  };
}

export default {
  // Content enrichment functions
  enrichContentFromSystemData,
  enrichIntegratedDataContent,
  enrichTemplateQualityData,
  createPropertyKeyMapping,
  // Paper functions
  groupPapersByDoi,
  enrichPapersWithComponentData,
  calculatePaperOverallScore,
  calculatePaperComponentScores,
  getEvaluationSummary,
  // Individual component score calculators
  calculateMetadataQualityScore,
  calculateResearchFieldQualityScore,
  calculateTemplateQualityScore,
  calculateResearchProblemFinalScore,
  calculateResearchProblemQualityScore,
  calculateContentQualityScore,
  buildFinalScoreWithExpertise,
  // Quality aggregation functions
  calculateMean,
  calculateStd,
  calculateMedian,
  calculateStats,
  QUALITY_FIELD_NAME_MAPPING,
  transformPapersForQuality,
  aggregateMetadataQuality,
  aggregateResearchFieldQuality,
  aggregateResearchProblemQuality,
  aggregateTemplateQuality,
  aggregateContentQuality,
  calculateQualitySummaryStats
};