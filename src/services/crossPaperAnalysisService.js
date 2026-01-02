// src/services/crossPaperAnalysisService.js
// CROSS-PAPER ANALYSIS SERVICE
// Handles all paper analysis calculations - pure data, no UI
// Provides pre-calculated data to CrossPaperAnalysis component
// 
// DATA PATHS (consistent with ScoreDistributionChart & aggregationService):
// - ACCURACY: comp.accuracyScores?.mean ?? comp.scores?.mean
// - QUALITY: comp.qualityScores?.mean
// - CONTENT: Uses contentEnrichmentService for proper extraction

import contentEnrichmentService from './contentEnrichmentService';

/**
 * CrossPaperAnalysisService
 * 
 * Centralizes all cross-paper analysis calculations:
 * - Paper processing and grouping by DOI
 * - Score extraction (accuracy vs quality) - SAME PATHS AS ScoreDistributionChart
 * - Inter-rater reliability (Fleiss' Kappa)
 * - Evaluator comparison matrices
 * - Disagreement detection
 * - Ground truth vs extracted comparison
 * - Research findings aggregation
 * - Temporal analysis
 * - Distribution statistics
 * - Quality vs Accuracy cross-comparison
 */

const COMPONENT_KEYS = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
const COMPONENT_LABELS = {
  metadata: 'Metadata',
  research_field: 'Research Field',
  research_problem: 'Research Problem',
  template: 'Template',
  content: 'Content'
};

// ORKG Base URLs for linking
const ORKG_BASE_URL = 'https://orkg.org';
const ORKG_PAPER_URL = `${ORKG_BASE_URL}/paper/`;
const ORKG_COMPARISON_URL = `${ORKG_BASE_URL}/comparison/`;
const DOI_BASE_URL = 'https://doi.org/';

// Score interpretation thresholds
const SCORE_THRESHOLDS = {
  excellent: 0.85,
  good: 0.70,
  moderate: 0.50,
  poor: 0.30
};

// Disagreement threshold (variance above this is flagged)
const DISAGREEMENT_THRESHOLD = 0.15;

// Expertise tiers
const EXPERTISE_TIERS = {
  expert: { min: 4.0, max: 5.1, label: 'Expert', color: 'emerald' },
  senior: { min: 3.0, max: 4.0, label: 'Senior', color: 'blue' },
  intermediate: { min: 2.0, max: 3.0, label: 'Intermediate', color: 'amber' },
  junior: { min: 0, max: 2.0, label: 'Junior', color: 'gray' }
};

class CrossPaperAnalysisService {
  constructor() {
    this.cache = new Map();
  }

  // ============================================
  // MAIN ANALYSIS METHOD
  // ============================================
  
  /**
   * Process all paper analysis data
   * @param {Object} integratedData - Data from integratedDataService
   * @param {Object} aggregatedData - Data from aggregationService
   * @returns {Object} Comprehensive analysis data
   */
  processAnalysisData(integratedData, aggregatedData) {
    // Use aggregatedData as PRIMARY source (same as Overview)
    // integratedData contains all papers with GT, aggregatedData contains only evaluated papers
    
    if (!aggregatedData?.papers || Object.keys(aggregatedData.papers).length === 0) {
      console.warn('[CrossPaperAnalysis] No aggregatedData available');
      return this.getEmptyState();
    }

    const papers = integratedData?.papers || [];
    
    console.log(`[CrossPaperAnalysis] Input: ${papers.length} integratedData papers, ${Object.keys(aggregatedData.papers).length} aggregatedData entries`);

    // STEP 1: Enrich content data using contentEnrichmentService
    const enrichedData = contentEnrichmentService.enrichAllPapersContent(integratedData);
    const contentGroupedScores = contentEnrichmentService.getGroupedContentScores(enrichedData);
    const contentOverallStats = contentEnrichmentService.getContentOverallStats(enrichedData);

    // Process papers grouped by DOI (this matches Overview's unique paper count)
    const processedPapers = this.processPapers(papers, aggregatedData);
    
    // Calculate stats FROM PROCESSED PAPERS (after DOI grouping - matches Overview)
    const totalPapers = processedPapers.length;
    const totalEvaluations = processedPapers.reduce((sum, p) => sum + p.evaluationCount, 0);
    const multiEvalPapers = processedPapers.filter(p => p.isMultiEvaluator).length;
    const papersWithGT = processedPapers.filter(p => p.hasGroundTruth).length;
    
    // Count unique evaluators from processed papers
    const evaluatorSet = new Set();
    processedPapers.forEach(paper => {
      paper.evaluators.forEach(e => evaluatorSet.add(e.id));
    });
    
    console.log(`[CrossPaperAnalysis] After DOI grouping: ${totalPapers} papers, ${totalEvaluations} evals, ${evaluatorSet.size} evaluators, ${multiEvalPapers} multi-eval, ${papersWithGT} with GT`);
    
    // Calculate all metrics - ACCURACY data
    const accuracyData = this.extractScoresByMode(processedPapers, aggregatedData, 'accuracy');
    
    // Calculate all metrics - QUALITY data
    const qualityData = this.extractScoresByMode(processedPapers, aggregatedData, 'quality');
    
    // Calculate other metrics
    const interRaterReliability = this.calculateInterRaterReliability(processedPapers);
    const qualityVsAccuracy = this.calculateQualityVsAccuracyComparison(processedPapers, aggregatedData);
    const scoreDistribution = this.calculateScoreDistribution(processedPapers, aggregatedData);
    const temporalAnalysis = this.calculateTemporalAnalysis(processedPapers);
    // Pass processed paper counts for consistency with Overview
    const overallStats = this.calculateOverallStats(processedPapers, aggregatedData, {
      totalPapers: totalPapers,
      totalEvaluations: totalEvaluations,
      uniqueEvaluators: evaluatorSet.size,
      multiEvalPapers: multiEvalPapers,
      papersWithGT: papersWithGT
    });
    const componentAnalysis = this.calculateComponentAnalysis(processedPapers, aggregatedData);
    const evaluatorMatrix = this.buildEvaluatorComparisonMatrix(processedPapers);
    const disagreementAnalysis = this.analyzeDisagreements(processedPapers);
    const groundTruthComparison = this.buildGroundTruthComparison(processedPapers);
    
    // Generate research findings with both accuracy and quality data
    const researchFindings = this.generateResearchFindings(
      processedPapers, 
      interRaterReliability, 
      qualityVsAccuracy,
      accuracyData,
      qualityData,
      aggregatedData
    );

    return {
      papers: processedPapers,
      overallStats,
      interRaterReliability,
      qualityVsAccuracy,
      researchFindings,
      scoreDistribution,
      temporalAnalysis,
      componentAnalysis,
      evaluatorMatrix,
      disagreementAnalysis,
      groundTruthComparison,
      // Separate accuracy and quality data for toggle
      accuracyData,
      qualityData,
      // Content enrichment data
      contentData: {
        groupedScores: contentGroupedScores,
        overallStats: contentOverallStats,
        enrichmentStats: enrichedData?.enrichmentStats?.content
      },
      // Constants for UI
      componentKeys: COMPONENT_KEYS,
      componentLabels: COMPONENT_LABELS,
      scoreThresholds: SCORE_THRESHOLDS,
      expertiseTiers: EXPERTISE_TIERS,
      disagreementThreshold: DISAGREEMENT_THRESHOLD,
      // URLs for linking
      orkgBaseUrl: ORKG_BASE_URL,
      orkgPaperUrl: ORKG_PAPER_URL,
      doiBaseUrl: DOI_BASE_URL
    };
  }

  // ============================================
  // SCORE EXTRACTION BY MODE (ACCURACY vs QUALITY)
  // Same paths as ScoreDistributionChart for consistency
  // ============================================

  /**
   * Extract scores by mode (accuracy or quality)
   * Uses SAME data paths as ScoreDistributionChart:
   * - ACCURACY: comp.accuracyScores?.mean ?? comp.scores?.mean
   * - QUALITY: comp.qualityScores?.mean
   */
  extractScoresByMode(papers, aggregatedData, mode = 'accuracy') {
    const componentStats = {};
    
    COMPONENT_KEYS.forEach(compName => {
      const scores = [];
      
      // Extract from aggregatedData (same as ScoreDistributionChart)
      if (aggregatedData?.papers) {
        Object.values(aggregatedData.papers).forEach(paper => {
          const comp = paper[compName] || paper[compName.replace('_', '')];
          if (!comp) return;
          
          let score = null;
          if (mode === 'accuracy') {
            // ACCURACY path - same as ScoreDistributionChart
            score = comp.accuracyScores?.mean ?? comp.scores?.mean;
          } else {
            // QUALITY path - same as ScoreDistributionChart
            score = comp.qualityScores?.mean;
          }
          
          if (score !== undefined && score !== null && !isNaN(score) && score > 0) {
            scores.push(score);
          }
        });
      }
      
      componentStats[compName] = this.calculateStats(scores);
    });
    
    // Calculate overall
    const allScores = Object.values(componentStats)
      .flatMap(c => c.values || [])
      .filter(s => s !== null && !isNaN(s));
    
    return {
      byComponent: componentStats,
      overall: this.calculateStats(allScores),
      mode
    };
  }

  // ============================================
  // PAPER PROCESSING
  // Only process papers that have evaluations (exist in aggregatedData)
  // ============================================

  processPapers(papers, aggregatedData) {
    // Get list of papers that have been evaluated (from aggregatedData)
    const evaluatedPaperIds = aggregatedData?.papers ? new Set(Object.keys(aggregatedData.papers)) : new Set();
    
    // Filter to only papers with evaluations
    const papersWithEvaluations = papers.filter(paper => {
      // Check if paper has userEvaluations
      if (paper.userEvaluations && paper.userEvaluations.length > 0) return true;
      if (paper.evaluation) return true;
      
      // Check if paper is in aggregatedData (by DOI or token)
      const doi = paper.doi || paper.groundTruth?.doi || paper.systemOutput?.metadata?.doi;
      if (doi) {
        const normalizedDOI = doi.toLowerCase().trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
        // Check if any aggregatedData key contains this DOI
        for (const key of evaluatedPaperIds) {
          if (key.includes(normalizedDOI) || normalizedDOI.includes(key)) return true;
        }
      }
      
      return false;
    });
    
    console.log(`[CrossPaperAnalysis] Processing ${papersWithEvaluations.length} evaluated papers (of ${papers.length} total)`);
    
    const doiGroups = new Map();
    
    papersWithEvaluations.forEach((paper, index) => {
      const doi = paper.doi || paper.groundTruth?.doi || paper.systemOutput?.metadata?.doi;
      const normalizedDOI = doi 
        ? doi.toLowerCase().trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '') 
        : null;
      
      const groupKey = normalizedDOI || `no-doi-${index}`;
      
      if (!doiGroups.has(groupKey)) {
        doiGroups.set(groupKey, { doi: normalizedDOI, papers: [], evaluations: [] });
      }
      
      const group = doiGroups.get(groupKey);
      group.papers.push(paper);
      
      if (paper.userEvaluations && Array.isArray(paper.userEvaluations)) {
        group.evaluations.push(...paper.userEvaluations);
      } else if (paper.evaluation) {
        group.evaluations.push(paper.evaluation);
      }
    });

    const processedPapers = [];
    
    doiGroups.forEach((group, groupKey) => {
      const primaryPaper = group.papers[0];
      const allEvaluations = group.evaluations;
      
      const title = this.extractPaperTitle(primaryPaper);
      const authors = this.extractAuthors(primaryPaper);
      const evaluatorData = this.processEvaluations(allEvaluations);
      const aggregatedScores = this.aggregateScores(evaluatorData);
      const disagreements = this.calculateDisagreements(evaluatorData);
      const groundTruthMatch = this.calculateGroundTruthMatch(primaryPaper, evaluatorData);
      const temporal = this.extractTemporalData(allEvaluations);
      
      // Extract ORKG paper ID for linking
      const orkgPaperId = primaryPaper.groundTruth?.paper_id || 
                          primaryPaper.groundTruth?.orkgId ||
                          primaryPaper.orkgPaperId ||
                          null;
      
      // FIX: More robust GT detection
      const hasGroundTruth = !!(primaryPaper.groundTruth && Object.keys(primaryPaper.groundTruth).length > 0);
      
      // Build links
      const links = {
        doi: group.doi ? `${DOI_BASE_URL}${group.doi}` : null,
        orkg: orkgPaperId ? `${ORKG_PAPER_URL}${orkgPaperId}` : null,
        orkgPaperId: orkgPaperId
      };

      processedPapers.push({
        id: groupKey,
        doi: group.doi,
        paperId: primaryPaper.groundTruth?.paper_id || primaryPaper.token || groupKey,
        tokens: allEvaluations.map(e => e.token).filter(Boolean),
        title,
        authors,
        venue: primaryPaper.groundTruth?.venue || primaryPaper.systemOutput?.metadata?.venue,
        publicationYear: primaryPaper.groundTruth?.publication_year || primaryPaper.systemOutput?.metadata?.publication_year,
        evaluationCount: allEvaluations.length,
        isMultiEvaluator: allEvaluations.length > 1,
        evaluators: evaluatorData,
        scores: aggregatedScores,
        disagreements,
        hasDisagreements: disagreements.hasSignificantDisagreement,
        groundTruth: primaryPaper.groundTruth,
        groundTruthMatch,
        hasGroundTruth: hasGroundTruth,
        systemOutput: primaryPaper.systemOutput,
        // Links for external resources
        links,
        sources: {
          hasOrkg: hasGroundTruth,
          hasSystem: !!primaryPaper.systemOutput,
          orkgFields: primaryPaper.groundTruth ? Object.keys(primaryPaper.groundTruth) : [],
          systemFields: primaryPaper.systemOutput ? Object.keys(primaryPaper.systemOutput) : []
        },
        temporal,
        _rawPaper: primaryPaper,
        _rawEvaluations: allEvaluations
      });
    });

    return processedPapers;
  }

  extractPaperTitle(paper) {
    if (paper.groundTruth?.title) return paper.groundTruth.title;
    if (paper.systemOutput?.metadata?.title) return paper.systemOutput.metadata.title;
    if (paper.userEvaluations?.[0]) {
      const firstEval = paper.userEvaluations[0];
      const evalTitle = firstEval.evaluationMetrics?.overall?.metadata?.title?.extractedValue 
        || firstEval.evaluationMetrics?.overall?.metadata?.title?.referenceValue;
      if (evalTitle) return evalTitle;
    }
    return paper.doi || 'Unknown Paper';
  }

  extractAuthors(paper) {
    const authors = paper.groundTruth?.authors || paper.systemOutput?.metadata?.authors || [];
    return authors.map(a => typeof a === 'string' ? { name: a } : { name: a.name || a.label || 'Unknown' });
  }

  extractTemporalData(evaluations) {
    if (!evaluations || evaluations.length === 0) return null;
    
    const timestamps = evaluations
      .map(e => e.timestamp || e.submissionDate)
      .filter(t => t)
      .map(t => new Date(t).getTime())
      .filter(t => !isNaN(t));
    
    if (timestamps.length === 0) return null;
    
    const first = Math.min(...timestamps);
    const last = Math.max(...timestamps);
    
    return {
      firstEvaluation: new Date(first).toISOString(),
      lastEvaluation: new Date(last).toISOString(),
      timeSpanMs: last - first,
      timeSpanDays: (last - first) / (1000 * 60 * 60 * 24),
      evaluationDates: timestamps.map(t => new Date(t).toISOString()).sort()
    };
  }

  // ============================================
  // EVALUATION PROCESSING
  // ============================================

  processEvaluations(evaluations) {
    return evaluations.map((evaluation, idx) => {
      const userInfo = evaluation.userInfo || {};
      const evalMetrics = evaluation.evaluationMetrics?.overall;
      const componentScores = this.extractComponentScores(evalMetrics);
      const overallAccuracy = this.calculateOverallScore(componentScores, 'accuracy');
      const overallQuality = this.calculateOverallScore(componentScores, 'quality');
      const automatedBreakdown = this.calculateAutomatedBreakdown(componentScores);
      
      return {
        id: `${userInfo.firstName || 'Unknown'}_${userInfo.lastName || idx}`,
        name: `${userInfo.firstName || 'Evaluator'} ${userInfo.lastName || idx + 1}`,
        token: evaluation.token,
        timestamp: evaluation.timestamp || evaluation.submissionDate,
        profile: {
          role: userInfo.role || 'Unknown',
          domainExpertise: userInfo.domainExpertise || 'Unknown',
          orkgExperience: userInfo.orkgExperience || 'never',
          expertiseWeight: userInfo.expertiseWeight || 1,
          expertiseTier: this.getExpertiseTier(userInfo.expertiseWeight || 1)
        },
        scores: {
          overallAccuracy,
          overallQuality,
          byComponent: componentScores,
          automated: automatedBreakdown.automated,
          userRating: automatedBreakdown.userRating
        }
      };
    });
  }

  extractComponentScores(evalMetrics) {
    if (!evalMetrics) return {};
    const compScores = {};
    
    COMPONENT_KEYS.forEach(compKey => {
      const compData = evalMetrics[compKey];
      if (!compData) {
        compScores[compKey] = this.getEmptyComponentScore();
        return;
      }
      compScores[compKey] = this.extractSingleComponentScore(compKey, compData);
    });
    
    return compScores;
  }

  extractSingleComponentScore(compKey, compData) {
    let accAutomated = null, accUserRating = null, qualAutomated = null;
    let finalAccuracy = null, finalQuality = null;
    let groundTruthValue = null, extractedValue = null, matchScore = null;

    if (compKey === 'metadata') {
      accAutomated = compData.overall?.accuracyScore;
      finalAccuracy = compData.overall?.overallScore;
      qualAutomated = compData.overall?.qualityScore;
      
      const fieldRatings = [];
      ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
        if (compData[field]?.rating !== undefined) fieldRatings.push(compData[field].rating / 5);
      });
      if (fieldRatings.length > 0) accUserRating = fieldRatings.reduce((a, b) => a + b, 0) / fieldRatings.length;
      
      groundTruthValue = compData.title?.referenceValue;
      extractedValue = compData.title?.extractedValue;
      matchScore = compData.title?.score;
    } 
    else if (compKey === 'research_field') {
      accAutomated = compData.accuracyMetrics?.automatedScore?.value ?? compData.accuracyMetrics?.similarityData?.automatedOverallScore;
      accUserRating = compData.accuracyMetrics?.scoreDetails?.normalizedRating;
      finalAccuracy = compData.overallScore ?? compData.accuracyMetrics?.scoreDetails?.finalScore;
      qualAutomated = compData.qualityMetrics?.overallQuality?.value ?? compData.qualityMetrics?.qualityData?.overallScore;
      groundTruthValue = compData.accuracyMetrics?.similarityData?.referenceValue || compData.groundTruth?.name;
      extractedValue = compData.accuracyMetrics?.similarityData?.extractedValue || compData.systemOutput?.name;
      matchScore = compData.accuracyMetrics?.similarityData?.maxSimilarity;
    } 
    else if (compKey === 'research_problem') {
      const rpData = compData.overall?.research_problem;
      if (rpData) {
        accAutomated = rpData.accuracy?.overallAccuracy?.automated;
        finalAccuracy = rpData.accuracy?.overallAccuracy?.finalScore;
        qualAutomated = rpData.quality?.overallQuality?.finalScore ?? rpData.quality?.overallQuality?.automated;
        if (rpData.userRatings?.overallRating !== undefined) accUserRating = rpData.userRatings.overallRating / 5;
        if (qualAutomated === null && rpData.quality) {
          const qualFields = ['problemTitle', 'problemDescription', 'relevance', 'evidenceQuality'];
          const qualScores = qualFields.map(f => rpData.quality[f]?.score).filter(s => s !== undefined && s !== null);
          if (qualScores.length > 0) qualAutomated = qualScores.reduce((a, b) => a + b, 0) / qualScores.length;
        }
        groundTruthValue = rpData.referenceValue || compData.groundTruth?.description;
        extractedValue = rpData.extractedValue || compData.systemOutput?.description;
      }
    } 
    else if (compKey === 'template') {
      accAutomated = compData.accuracyResults?.similarityData?.automatedOverallScore ?? compData.accuracyScore;
      accUserRating = compData.accuracyResults?.scoreDetails?.normalizedRating;
      finalAccuracy = compData.accuracyResults?.scoreDetails?.finalScore ?? compData.overallScore;
      qualAutomated = compData.qualityScore;
      if (!qualAutomated && compData.qualityResults?.qualityData?.fieldSpecificMetrics) {
        const metrics = compData.qualityResults.qualityData.fieldSpecificMetrics;
        const scores = Object.values(metrics).map(m => m.score).filter(s => s !== undefined && s !== null);
        if (scores.length > 0) qualAutomated = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
      groundTruthValue = compData.accuracyResults?.similarityData?.referenceValue || compData.groundTruth?.name;
      extractedValue = compData.accuracyResults?.similarityData?.extractedValue || compData.systemOutput?.name;
      matchScore = compData.accuracyResults?.similarityData?.maxSimilarity;
    } 
    else if (compKey === 'content') {
      const accScores = [], qualScores = [], userRatings = [];
      const userRatingsObj = compData.userRatings || {};
      
      Object.entries(compData).forEach(([propKey, prop]) => {
        if (propKey === 'userRatings' || propKey === '_aggregate' || !prop || typeof prop !== 'object') return;
        if (prop.accuracyScore !== undefined && prop.accuracyScore !== null) accScores.push(prop.accuracyScore);
        if (prop.qualityScore !== undefined && prop.qualityScore !== null) qualScores.push(prop.qualityScore);
        if (userRatingsObj[propKey]?.rating !== undefined) userRatings.push(userRatingsObj[propKey].rating / 5);
      });
      
      if (accScores.length > 0) accAutomated = accScores.reduce((a, b) => a + b, 0) / accScores.length;
      if (qualScores.length > 0) qualAutomated = qualScores.reduce((a, b) => a + b, 0) / qualScores.length;
      if (userRatings.length > 0) accUserRating = userRatings.reduce((a, b) => a + b, 0) / userRatings.length;
    }

    // Calculate final scores
    if (finalAccuracy === null && accAutomated !== null) {
      finalAccuracy = accUserRating !== null ? accAutomated * 0.6 + accUserRating * 0.4 : accAutomated;
    }
    
    if (qualAutomated !== null && accUserRating !== null) {
      finalQuality = qualAutomated * 0.6 + accUserRating * 0.4;
    } else {
      finalQuality = qualAutomated ?? finalAccuracy;
    }

    return {
      accuracy: { automated: accAutomated, userRating: accUserRating, final: finalAccuracy },
      quality: { automated: qualAutomated, userRating: accUserRating, final: finalQuality ?? finalAccuracy },
      groundTruthComparison: { groundTruthValue, extractedValue, matchScore, hasComparison: groundTruthValue !== null || extractedValue !== null }
    };
  }

  getEmptyComponentScore() {
    return {
      accuracy: { automated: null, userRating: null, final: null },
      quality: { automated: null, userRating: null, final: null },
      groundTruthComparison: { groundTruthValue: null, extractedValue: null, matchScore: null, hasComparison: false }
    };
  }

  calculateOverallScore(componentScores, mode) {
    const scores = Object.values(componentScores).map(c => c?.[mode]?.final).filter(s => s !== null && s !== undefined && !isNaN(s));
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  calculateAutomatedBreakdown(componentScores) {
    const automatedScores = [], userRatings = [];
    Object.values(componentScores).forEach(comp => {
      if (comp?.accuracy?.automated !== null) automatedScores.push(comp.accuracy.automated);
      if (comp?.accuracy?.userRating !== null) userRatings.push(comp.accuracy.userRating);
    });
    return {
      automated: automatedScores.length > 0 ? automatedScores.reduce((a, b) => a + b, 0) / automatedScores.length : null,
      userRating: userRatings.length > 0 ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : null
    };
  }

  getExpertiseTier(weight) {
    for (const [tierName, tier] of Object.entries(EXPERTISE_TIERS)) {
      if (weight >= tier.min && weight < tier.max) return { name: tierName, ...tier };
    }
    return { name: 'junior', ...EXPERTISE_TIERS.junior };
  }

  // ============================================
  // SCORE AGGREGATION
  // ============================================

  aggregateScores(evaluatorData) {
    if (evaluatorData.length === 0) return this.getEmptyAggregatedScores();

    const accuracyScores = evaluatorData.map(e => e.scores.overallAccuracy).filter(s => s !== null);
    const qualityScores = evaluatorData.map(e => e.scores.overallQuality).filter(s => s !== null);
    
    const componentStats = {};
    COMPONENT_KEYS.forEach(compKey => {
      const accScores = evaluatorData.map(e => e.scores.byComponent[compKey]?.accuracy?.final).filter(s => s !== null && s !== undefined);
      const qualScores = evaluatorData.map(e => e.scores.byComponent[compKey]?.quality?.final).filter(s => s !== null && s !== undefined);
      const autoScores = evaluatorData.map(e => e.scores.byComponent[compKey]?.accuracy?.automated).filter(s => s !== null && s !== undefined);
      const userScores = evaluatorData.map(e => e.scores.byComponent[compKey]?.accuracy?.userRating).filter(s => s !== null && s !== undefined);
      
      componentStats[compKey] = {
        accuracy: this.calculateStats(accScores),
        quality: this.calculateStats(qualScores),
        automated: this.calculateStats(autoScores),
        userRating: this.calculateStats(userScores),
        evaluationCount: accScores.length
      };
    });
    
    const automatedScores = evaluatorData.map(e => e.scores.automated).filter(s => s !== null);
    const userRatingScores = evaluatorData.map(e => e.scores.userRating).filter(s => s !== null);

    return {
      overall: { accuracy: this.calculateStats(accuracyScores), quality: this.calculateStats(qualityScores) },
      byComponent: componentStats,
      breakdown: { automated: this.calculateStats(automatedScores), userRating: this.calculateStats(userRatingScores) },
      evaluationCount: evaluatorData.length
    };
  }

  calculateStats(scores) {
    if (!scores || scores.length === 0) return { mean: null, std: null, min: null, max: null, median: null, count: 0, values: [] };
    
    const sorted = [...scores].sort((a, b) => a - b);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const std = Math.sqrt(variance);
    const median = scores.length % 2 === 0
      ? (sorted[scores.length / 2 - 1] + sorted[scores.length / 2]) / 2
      : sorted[Math.floor(scores.length / 2)];
    
    return { mean, std, variance, min: Math.min(...scores), max: Math.max(...scores), median, count: scores.length, values: scores };
  }

  getEmptyAggregatedScores() {
    const emptyStats = { mean: null, std: null, min: null, max: null, median: null, count: 0, values: [] };
    const emptyComponent = { accuracy: emptyStats, quality: emptyStats, automated: emptyStats, userRating: emptyStats, evaluationCount: 0 };
    return {
      overall: { accuracy: emptyStats, quality: emptyStats },
      byComponent: COMPONENT_KEYS.reduce((acc, key) => ({ ...acc, [key]: emptyComponent }), {}),
      breakdown: { automated: emptyStats, userRating: emptyStats },
      evaluationCount: 0
    };
  }

  // ============================================
  // DISAGREEMENT ANALYSIS
  // ============================================

  calculateDisagreements(evaluatorData) {
    if (evaluatorData.length < 2) {
      return { hasSignificantDisagreement: false, overallVariance: 0, componentDisagreements: {}, evaluatorPairs: [] };
    }

    const overallScores = evaluatorData.map(e => e.scores.overallAccuracy).filter(s => s !== null);
    const overallStats = this.calculateStats(overallScores);
    const hasOverallDisagreement = overallStats.std > DISAGREEMENT_THRESHOLD;
    
    const componentDisagreements = {};
    let hasAnyComponentDisagreement = false;
    
    COMPONENT_KEYS.forEach(compKey => {
      const scores = evaluatorData.map(e => e.scores.byComponent[compKey]?.accuracy?.final).filter(s => s !== null && s !== undefined);
      if (scores.length >= 2) {
        const stats = this.calculateStats(scores);
        const hasDisagreement = stats.std > DISAGREEMENT_THRESHOLD;
        componentDisagreements[compKey] = {
          hasDisagreement,
          variance: stats.variance,
          std: stats.std,
          range: stats.max - stats.min,
          scores: evaluatorData.map(e => ({ evaluatorId: e.id, evaluatorName: e.name, score: e.scores.byComponent[compKey]?.accuracy?.final }))
        };
        if (hasDisagreement) hasAnyComponentDisagreement = true;
      }
    });
    
    const evaluatorPairs = [];
    for (let i = 0; i < evaluatorData.length; i++) {
      for (let j = i + 1; j < evaluatorData.length; j++) {
        const e1 = evaluatorData[i], e2 = evaluatorData[j];
        const diff = Math.abs((e1.scores.overallAccuracy || 0) - (e2.scores.overallAccuracy || 0));
        evaluatorPairs.push({
          evaluator1: { id: e1.id, name: e1.name, score: e1.scores.overallAccuracy },
          evaluator2: { id: e2.id, name: e2.name, score: e2.scores.overallAccuracy },
          difference: diff,
          hasDisagreement: diff > DISAGREEMENT_THRESHOLD * 2
        });
      }
    }

    return {
      hasSignificantDisagreement: hasOverallDisagreement || hasAnyComponentDisagreement,
      overallVariance: overallStats.variance,
      overallStd: overallStats.std,
      componentDisagreements,
      evaluatorPairs
    };
  }

  analyzeDisagreements(papers) {
    const papersWithDisagreement = papers.filter(p => p.hasDisagreements);
    const multiEvalPapers = papers.filter(p => p.isMultiEvaluator);
    
    const componentDisputeCounts = {};
    COMPONENT_KEYS.forEach(key => { componentDisputeCounts[key] = 0; });
    
    papersWithDisagreement.forEach(paper => {
      Object.entries(paper.disagreements.componentDisagreements).forEach(([compKey, data]) => {
        if (data.hasDisagreement) componentDisputeCounts[compKey]++;
      });
    });
    
    const highestDisagreementPapers = [...papers]
      .filter(p => p.isMultiEvaluator)
      .sort((a, b) => (b.disagreements.overallStd || 0) - (a.disagreements.overallStd || 0))
      .slice(0, 5)
      .map(p => ({ paperId: p.id, title: p.title, variance: p.disagreements.overallVariance, std: p.disagreements.overallStd, evaluatorCount: p.evaluationCount }));

    return {
      totalWithDisagreement: papersWithDisagreement.length,
      totalMultiEval: multiEvalPapers.length,
      disagreementRate: multiEvalPapers.length > 0 ? papersWithDisagreement.length / multiEvalPapers.length : 0,
      componentDisputeCounts,
      mostDisputedComponent: Object.entries(componentDisputeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      highestDisagreementPapers
    };
  }

  // ============================================
  // GROUND TRUTH COMPARISON
  // ============================================

  calculateGroundTruthMatch(paper, evaluatorData) {
    if (!paper.groundTruth) return { hasGroundTruth: false, matches: {} };
    
    const matches = {};
    const gt = paper.groundTruth;
    const sys = paper.systemOutput;
    
    // Title
    if (gt.title && sys?.metadata?.title) {
      matches.title = {
        groundTruth: gt.title,
        extracted: sys.metadata.title,
        match: this.calculateStringSimilarity(gt.title, sys.metadata.title)
      };
    }
    
    // Research Field - also store extracted values for display
    if (gt.research_field_name || gt.research_field) {
      const gtField = gt.research_field_name || gt.research_field;
      const sysField = sys?.research_field?.name || 
                       sys?.research_field?.label || 
                       (Array.isArray(sys?.research_field?.extractedValue) 
                         ? sys.research_field.extractedValue[0] 
                         : sys?.research_field?.extractedValue);
      matches.researchField = {
        groundTruth: gtField,
        extracted: sysField || null,
        extractedAll: sys?.research_field?.extractedValue, // Full list for display
        match: sysField ? this.calculateStringSimilarity(gtField, sysField) : 0
      };
    }
    
    // Research Problem
    if (gt.research_problem || gt.research_problem_name) {
      const gtProblem = gt.research_problem || gt.research_problem_name;
      const sysProblem = sys?.research_problem?.name || 
                         sys?.research_problem?.label ||
                         sys?.research_problem?.extractedValue;
      const sysSource = sys?.research_problem?.source; // 'llm' or 'orkg'
      matches.researchProblem = {
        groundTruth: gtProblem,
        extracted: sysProblem || null,
        source: sysSource,
        match: sysProblem ? this.calculateStringSimilarity(gtProblem, sysProblem) : 0
      };
    }
    
    // Template
    if (gt.template_name || gt.template) {
      const gtTemplate = gt.template_name || gt.template;
      const sysTemplate = sys?.template?.name || 
                          sys?.template?.label ||
                          sys?.template?.extractedValue;
      const sysSource = sys?.template?.source; // 'llm' or 'orkg'
      matches.template = {
        groundTruth: gtTemplate,
        extracted: sysTemplate || null,
        source: sysSource,
        match: sysTemplate ? this.calculateStringSimilarity(gtTemplate, sysTemplate) : 0
      };
    }
    
    const matchScores = Object.values(matches).map(m => m.match).filter(m => m !== null && m !== undefined);
    const overallMatch = matchScores.length > 0 ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length : null;

    return { hasGroundTruth: true, matches, overallMatch, matchCount: matchScores.length };
  }

  buildGroundTruthComparison(papers) {
    const papersWithGT = papers.filter(p => p.hasGroundTruth);
    const papersWithoutGT = papers.filter(p => !p.hasGroundTruth);
    
    const fieldMatches = { title: [], researchField: [], template: [] };
    
    papersWithGT.forEach(paper => {
      if (paper.groundTruthMatch?.matches?.title?.match !== undefined) fieldMatches.title.push(paper.groundTruthMatch.matches.title.match);
      if (paper.groundTruthMatch?.matches?.researchField?.match !== undefined) fieldMatches.researchField.push(paper.groundTruthMatch.matches.researchField.match);
      if (paper.groundTruthMatch?.matches?.template?.match !== undefined) fieldMatches.template.push(paper.groundTruthMatch.matches.template.match);
    });
    
    const withGTScores = papersWithGT.map(p => p.scores.overall.accuracy.mean).filter(s => s !== null);
    const withoutGTScores = papersWithoutGT.map(p => p.scores.overall.accuracy.mean).filter(s => s !== null);

    return {
      totalWithGroundTruth: papersWithGT.length,
      totalWithoutGroundTruth: papersWithoutGT.length,
      coverage: papers.length > 0 ? papersWithGT.length / papers.length : 0,
      fieldMatchStats: {
        title: this.calculateStats(fieldMatches.title),
        researchField: this.calculateStats(fieldMatches.researchField),
        template: this.calculateStats(fieldMatches.template)
      },
      scoreComparison: {
        withGroundTruth: this.calculateStats(withGTScores),
        withoutGroundTruth: this.calculateStats(withoutGTScores),
        difference: withGTScores.length > 0 && withoutGTScores.length > 0
          ? (withGTScores.reduce((a, b) => a + b, 0) / withGTScores.length) - (withoutGTScores.reduce((a, b) => a + b, 0) / withoutGTScores.length)
          : null
      }
    };
  }

  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1;
    
    const longerChars = new Set(longer.split(''));
    const shorterChars = new Set(shorter.split(''));
    let overlap = 0;
    shorterChars.forEach(c => { if (longerChars.has(c)) overlap++; });
    
    return overlap / longerChars.size;
  }

  // ============================================
  // INTER-RATER RELIABILITY
  // ============================================

  calculateInterRaterReliability(papers) {
    const multiEvalPapers = papers.filter(p => p.isMultiEvaluator);
    
    if (multiEvalPapers.length === 0) {
      return { hasData: false, fleissKappa: null, interpretation: 'N/A', multiEvalCount: 0, totalPapers: papers.length, byComponent: {} };
    }

    const overallRatings = this.prepareRatingsForKappa(multiEvalPapers, 'overall');
    const overallKappa = this.calculateFleissKappa(overallRatings);
    
    const byComponent = {};
    COMPONENT_KEYS.forEach(compKey => {
      const compRatings = this.prepareRatingsForKappa(multiEvalPapers, compKey);
      if (compRatings.length > 0) byComponent[compKey] = this.calculateFleissKappa(compRatings);
    });
    
    const agreementScores = multiEvalPapers.map(paper => {
      if (paper.evaluators.length < 2) return null;
      const scores = paper.evaluators.map(e => e.scores.overallAccuracy).filter(s => s !== null);
      if (scores.length < 2) return null;
      const stats = this.calculateStats(scores);
      return 1 - Math.min(stats.std * 2, 1);
    }).filter(s => s !== null);

    return {
      hasData: true,
      fleissKappa: overallKappa.kappa,
      interpretation: overallKappa.interpretation,
      pBar: overallKappa.pBar,
      pBarE: overallKappa.pBarE,
      multiEvalCount: multiEvalPapers.length,
      totalPapers: papers.length,
      coverage: papers.length > 0 ? multiEvalPapers.length / papers.length : 0,
      byComponent,
      agreementStats: this.calculateStats(agreementScores)
    };
  }

  prepareRatingsForKappa(papers, componentKey) {
    const ratings = [];
    const categories = 5;
    
    papers.forEach(paper => {
      if (paper.evaluators.length < 2) return;
      
      const scores = paper.evaluators.map(e => {
        if (componentKey === 'overall') return e.scores.overallAccuracy;
        return e.scores.byComponent[componentKey]?.accuracy?.final;
      }).filter(s => s !== null && s !== undefined && !isNaN(s));
      
      if (scores.length >= 2) {
        const counts = new Array(categories).fill(0);
        scores.forEach(score => {
          const bin = Math.min(Math.floor(score * categories), categories - 1);
          counts[bin]++;
        });
        ratings.push(counts);
      }
    });
    
    return ratings;
  }

  calculateFleissKappa(ratings) {
    if (!ratings || ratings.length === 0) return { kappa: null, interpretation: 'N/A', pBar: null, pBarE: null };

    const N = ratings.length;
    const n = ratings[0].reduce((sum, count) => sum + count, 0);
    const k = ratings[0].length;

    if (n < 2) return { kappa: null, interpretation: 'Insufficient raters', pBar: null, pBarE: null };

    let pBar = 0;
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < k; j++) {
        const nij = ratings[i][j];
        sum += nij * (nij - 1);
      }
      pBar += sum / (n * (n - 1));
    }
    pBar = pBar / N;

    const pj = [];
    for (let j = 0; j < k; j++) {
      let sum = 0;
      for (let i = 0; i < N; i++) sum += ratings[i][j];
      pj.push(sum / (N * n));
    }
    const pBarE = pj.reduce((sum, p) => sum + p * p, 0);

    const kappa = pBarE === 1 ? 1 : (pBar - pBarE) / (1 - pBarE);

    return { kappa: isNaN(kappa) ? null : kappa, interpretation: this.interpretKappa(kappa), pBar, pBarE };
  }

  interpretKappa(kappa) {
    if (kappa === null || isNaN(kappa)) return 'N/A';
    if (kappa < 0) return 'Poor';
    if (kappa < 0.20) return 'Slight';
    if (kappa < 0.40) return 'Fair';
    if (kappa < 0.60) return 'Moderate';
    if (kappa < 0.80) return 'Substantial';
    return 'Almost Perfect';
  }

  // ============================================
  // QUALITY VS ACCURACY COMPARISON
  // Uses same data paths as ScoreDistributionChart
  // ============================================

  calculateQualityVsAccuracyComparison(papers, aggregatedData) {
    const accuracyScores = [], qualityScores = [], paired = [];
    
    // Build a lookup map from processed papers for quick access
    const paperLookup = new Map();
    papers.forEach(p => {
      // Index by multiple keys for better matching
      if (p.doi) paperLookup.set(p.doi.toLowerCase(), p);
      if (p.id) paperLookup.set(p.id, p);
      if (p.paperId) paperLookup.set(p.paperId, p);
      // Also index by tokens
      if (p.tokens) {
        p.tokens.forEach(t => paperLookup.set(t, p));
      }
    });
    
    // Extract from aggregatedData using same paths as ScoreDistributionChart
    if (aggregatedData?.papers) {
      Object.entries(aggregatedData.papers).forEach(([paperId, paperData]) => {
        // Find matching processed paper for title and links
        let matchedPaper = paperLookup.get(paperId);
        if (!matchedPaper && paperData.doi) {
          matchedPaper = paperLookup.get(paperData.doi.toLowerCase());
        }
        // Try to match by token in paperId
        if (!matchedPaper) {
          matchedPaper = paperLookup.get(paperId.toLowerCase());
        }
        
        // Calculate component averages using ScoreDistributionChart paths
        const compAccuracies = [];
        const compQualities = [];
        
        COMPONENT_KEYS.forEach(compName => {
          const comp = paperData[compName] || paperData[compName.replace('_', '')];
          if (!comp) return;
          
          // ACCURACY: Same path as ScoreDistributionChart
          const acc = comp.accuracyScores?.mean ?? comp.scores?.mean;
          if (acc !== undefined && !isNaN(acc)) compAccuracies.push(acc);
          
          // QUALITY: Same path as ScoreDistributionChart
          const qual = comp.qualityScores?.mean;
          if (qual !== undefined && !isNaN(qual) && qual > 0) compQualities.push(qual);
        });
        
        const paperAccuracy = compAccuracies.length > 0 
          ? compAccuracies.reduce((a, b) => a + b, 0) / compAccuracies.length 
          : null;
        const paperQuality = compQualities.length > 0 
          ? compQualities.reduce((a, b) => a + b, 0) / compQualities.length 
          : null;
        
        if (paperAccuracy !== null) accuracyScores.push(paperAccuracy);
        if (paperQuality !== null) qualityScores.push(paperQuality);
        
        if (paperAccuracy !== null && paperQuality !== null) {
          // Get the best title available - try multiple sources
          let title = matchedPaper?.title;
          if (!title || title === 'Unknown Paper' || title.startsWith('no-doi-')) {
            title = paperData.metadata?.title?.extractedValue ||
                    paperData.metadata?.title?.referenceValue ||
                    paperData.title ||
                    null;
          }
          // Final fallback - use a descriptive name with paperId
          if (!title) {
            title = `Paper ${paperId.substring(0, 40)}${paperId.length > 40 ? '...' : ''}`;
          }
          
          // Get DOI
          const doi = matchedPaper?.doi || 
                      paperData.doi || 
                      paperData.metadata?.doi?.extractedValue ||
                      paperData.metadata?.doi?.referenceValue ||
                      null;
          
          // Get ORKG ID
          const orkgId = matchedPaper?.links?.orkgPaperId || 
                         matchedPaper?.paperId ||
                         paperData.orkgPaperId || 
                         paperData.paper_id ||
                         paperData.groundTruth?.paper_id ||
                         null;
          
          paired.push({
            paperId: paperId,
            title: title,
            accuracy: paperAccuracy,
            quality: paperQuality,
            difference: paperQuality - paperAccuracy,
            percentDifference: paperAccuracy > 0 ? ((paperQuality - paperAccuracy) / paperAccuracy) * 100 : 0,
            // Build links properly
            doi: doi,
            orkgId: orkgId,
            links: {
              doi: doi ? `${DOI_BASE_URL}${doi}` : null,
              orkg: orkgId ? `${ORKG_PAPER_URL}${orkgId}` : null
            },
            hasGroundTruth: matchedPaper?.hasGroundTruth || !!paperData.groundTruth
          });
        }
      });
    }
    
    // By component comparison using aggregatedData
    const byComponent = {};
    COMPONENT_KEYS.forEach(compKey => {
      const compAcc = [], compQual = [], compPaired = [];
      
      if (aggregatedData?.papers) {
        Object.values(aggregatedData.papers).forEach(paperData => {
          const comp = paperData[compKey] || paperData[compKey.replace('_', '')];
          if (!comp) return;
          
          const acc = comp.accuracyScores?.mean ?? comp.scores?.mean;
          const qual = comp.qualityScores?.mean;
          
          if (acc !== undefined && !isNaN(acc)) compAcc.push(acc);
          if (qual !== undefined && !isNaN(qual) && qual > 0) compQual.push(qual);
          
          if (acc !== undefined && qual !== undefined && qual > 0) {
            compPaired.push({ accuracy: acc, quality: qual, difference: qual - acc });
          }
        });
      }
      
      byComponent[compKey] = {
        accuracy: this.calculateStats(compAcc),
        quality: this.calculateStats(compQual),
        pairedCount: compPaired.length,
        meanDifference: compPaired.length > 0 ? compPaired.reduce((sum, p) => sum + p.difference, 0) / compPaired.length : null,
        correlation: this.calculateCorrelation(compPaired.map(p => p.accuracy), compPaired.map(p => p.quality))
      };
    });
    
    const correlation = this.calculateCorrelation(paired.map(p => p.accuracy), paired.map(p => p.quality));
    
    // Identify outliers - papers where analysis shows largest quality vs accuracy gaps
    // NOTE: These are analysis gaps, NOT problems with the papers themselves
    const sortedByDiff = [...paired].sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    const analysisGaps = sortedByDiff.slice(0, 5).map(item => ({
      ...item,
      // Clarify this is about analysis, not the paper
      analysisNote: item.difference > 0 
        ? 'Analysis shows higher quality than accuracy - extracted content is well-structured but may not match ground truth exactly'
        : 'Analysis shows higher accuracy than quality - extraction matches ground truth but content structure could be improved'
    }));

    return {
      overall: {
        accuracy: this.calculateStats(accuracyScores),
        quality: this.calculateStats(qualityScores),
        pairedCount: paired.length,
        meanDifference: paired.length > 0 ? paired.reduce((sum, p) => sum + p.difference, 0) / paired.length : null,
        correlation
      },
      byComponent,
      paired,
      analysisGaps,
      interpretation: this.interpretQualityVsAccuracy(this.calculateStats(accuracyScores).mean, this.calculateStats(qualityScores).mean, correlation)
    };
  }

  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length < 2) return null;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  interpretQualityVsAccuracy(accMean, qualMean, correlation) {
    const findings = [];
    
    if (accMean !== null && qualMean !== null) {
      const diff = qualMean - accMean;
      if (Math.abs(diff) < 0.05) findings.push('Quality and accuracy scores are closely aligned');
      else if (diff > 0) findings.push(`Quality scores are ${(diff * 100).toFixed(1)}% higher than accuracy scores on average`);
      else findings.push(`Accuracy scores are ${(Math.abs(diff) * 100).toFixed(1)}% higher than quality scores on average`);
    }
    
    if (correlation !== null) {
      if (correlation > 0.8) findings.push('Strong positive correlation between quality and accuracy');
      else if (correlation > 0.5) findings.push('Moderate positive correlation between quality and accuracy');
      else if (correlation > 0.2) findings.push('Weak positive correlation between quality and accuracy');
      else findings.push('Little to no correlation between quality and accuracy scores');
    }
    
    return findings;
  }

  // ============================================
  // RESEARCH FINDINGS
  // Matches ScoreDistributionChart pattern with:
  // - Key Statistical Observations
  // - System Interpretation
  // ============================================

  generateResearchFindings(papers, irrData, qvData, accuracyData, qualityData, aggregatedData) {
    const findings = [];
    const totalPapers = papers.length;
    const totalEvaluations = papers.reduce((sum, p) => sum + p.evaluationCount, 0);
    
    // Get accuracy and quality averages from extracted data
    const accOverall = accuracyData?.overall?.mean;
    const qualOverall = qualityData?.overall?.mean;
    const accStd = accuracyData?.overall?.std;
    const qualStd = qualityData?.overall?.std;
    
    // Find best and worst components
    const componentRankings = {
      accuracy: this.rankComponents(accuracyData?.byComponent, 'accuracy'),
      quality: this.rankComponents(qualityData?.byComponent, 'quality')
    };

    // Finding 1: Overall Accuracy Performance
    if (accOverall !== null && accOverall !== undefined) {
      findings.push({
        id: 'overall_accuracy',
        category: 'Performance',
        title: 'Overall Accuracy',
        value: accOverall,
        valueFormatted: `${(accOverall * 100).toFixed(1)}%`,
        std: accStd,
        interpretation: accOverall >= 0.8 ? 'Excellent' : accOverall >= 0.6 ? 'Good' : accOverall >= 0.4 ? 'Moderate' : 'Needs Improvement',
        color: accOverall >= 0.8 ? 'emerald' : accOverall >= 0.6 ? 'blue' : accOverall >= 0.4 ? 'amber' : 'red',
        description: `System achieves ${(accOverall * 100).toFixed(1)}% mean accuracy (SD=${(accStd * 100).toFixed(1)}%) across ${totalPapers} papers.`,
        significance: 'high',
        mode: 'accuracy'
      });
    }
    
    // Finding 2: Overall Quality Performance
    if (qualOverall !== null && qualOverall !== undefined && qualOverall > 0) {
      findings.push({
        id: 'overall_quality',
        category: 'Performance',
        title: 'Overall Quality',
        value: qualOverall,
        valueFormatted: `${(qualOverall * 100).toFixed(1)}%`,
        std: qualStd,
        interpretation: qualOverall >= 0.8 ? 'Excellent' : qualOverall >= 0.6 ? 'Good' : qualOverall >= 0.4 ? 'Moderate' : 'Needs Improvement',
        color: qualOverall >= 0.8 ? 'emerald' : qualOverall >= 0.6 ? 'blue' : qualOverall >= 0.4 ? 'amber' : 'red',
        description: `System achieves ${(qualOverall * 100).toFixed(1)}% mean quality (SD=${((qualStd || 0) * 100).toFixed(1)}%) for extraction completeness and validity.`,
        significance: 'high',
        mode: 'quality'
      });
    }
    
    // Finding 3: Best Component (Accuracy)
    if (componentRankings.accuracy.best) {
      const best = componentRankings.accuracy.best;
      findings.push({
        id: 'best_accuracy_component',
        category: 'Components',
        title: 'Best Accuracy Component',
        value: best.mean,
        valueFormatted: `${(best.mean * 100).toFixed(1)}%`,
        interpretation: best.label,
        color: 'emerald',
        description: `${best.label} extraction achieves highest accuracy at ${(best.mean * 100).toFixed(1)}%.`,
        significance: 'medium',
        mode: 'accuracy'
      });
    }
    
    // Finding 4: Weakest Component (Accuracy)
    if (componentRankings.accuracy.worst && componentRankings.accuracy.worst.key !== componentRankings.accuracy.best?.key) {
      const worst = componentRankings.accuracy.worst;
      findings.push({
        id: 'worst_accuracy_component',
        category: 'Components',
        title: 'Area for Improvement',
        value: worst.mean,
        valueFormatted: `${(worst.mean * 100).toFixed(1)}%`,
        interpretation: worst.label,
        color: worst.mean < 0.5 ? 'red' : 'amber',
        description: `${worst.label} extraction shows lowest accuracy at ${(worst.mean * 100).toFixed(1)}%.`,
        significance: 'medium',
        mode: 'accuracy'
      });
    }
    
    // Finding 5: Inter-rater reliability
    if (irrData.hasData && irrData.fleissKappa !== null) {
      findings.push({
        id: 'irr',
        category: 'Reliability',
        title: 'Inter-Rater Reliability',
        value: irrData.fleissKappa,
        valueFormatted: irrData.fleissKappa.toFixed(3),
        interpretation: irrData.interpretation,
        color: irrData.fleissKappa >= 0.6 ? 'emerald' : irrData.fleissKappa >= 0.4 ? 'blue' : irrData.fleissKappa >= 0.2 ? 'amber' : 'red',
        description: `Fleiss' κ = ${irrData.fleissKappa.toFixed(3)} indicates ${irrData.interpretation.toLowerCase()} evaluator agreement.`,
        significance: 'high',
        mode: 'both'
      });
    }
    
    // Finding 6: Quality vs Accuracy gap
    if (accOverall && qualOverall && qualOverall > 0) {
      const diff = qualOverall - accOverall;
      findings.push({
        id: 'quality_accuracy_gap',
        category: 'Analysis',
        title: 'Quality vs Accuracy Gap',
        value: diff,
        valueFormatted: `${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}%`,
        interpretation: Math.abs(diff) < 0.05 ? 'Aligned' : diff > 0 ? 'Quality Higher' : 'Accuracy Higher',
        color: Math.abs(diff) < 0.05 ? 'blue' : diff > 0 ? 'emerald' : 'amber',
        description: Math.abs(diff) < 0.05 
          ? 'Quality and accuracy scores are well-aligned.'
          : `Quality scores are ${Math.abs(diff * 100).toFixed(1)}% ${diff > 0 ? 'higher' : 'lower'} than accuracy.`,
        significance: 'medium',
        mode: 'both'
      });
    }
    
    // Finding 7: Ground truth coverage
    const gtPapers = papers.filter(p => p.hasGroundTruth);
    findings.push({
      id: 'gt_coverage',
      category: 'Data Quality',
      title: 'Ground Truth Coverage',
      value: totalPapers > 0 ? gtPapers.length / totalPapers : 0,
      valueFormatted: `${gtPapers.length}/${totalPapers}`,
      interpretation: `${((gtPapers.length / totalPapers) * 100).toFixed(0)}%`,
      color: gtPapers.length / totalPapers >= 0.7 ? 'emerald' : gtPapers.length / totalPapers >= 0.4 ? 'blue' : 'amber',
      description: `${gtPapers.length} of ${totalPapers} papers have ORKG ground truth for validation.`,
      significance: 'medium',
      mode: 'both'
    });

    // Generate publication-ready text (matching ScoreDistributionChart pattern)
    const publicationText = this.generatePublicationText(
      totalPapers, 
      totalEvaluations,
      accOverall, 
      qualOverall, 
      accStd, 
      qualStd,
      componentRankings,
      irrData
    );
    
    // Key statistical observations (bullet points for UI)
    const keyObservations = this.generateKeyObservations(
      totalPapers,
      totalEvaluations,
      accOverall,
      qualOverall,
      accStd,
      qualStd,
      componentRankings,
      irrData,
      qvData
    );

    return {
      findings,
      summary: this.generateFindingsSummary(findings),
      byCategory: this.groupFindingsByCategory(findings),
      // Publication-ready content (matching ScoreDistributionChart)
      publication: {
        keyObservations,
        suggestedText: publicationText,
        accuracyObservations: this.generateModeObservations('accuracy', accOverall, accStd, componentRankings.accuracy, totalEvaluations),
        qualityObservations: this.generateModeObservations('quality', qualOverall, qualStd, componentRankings.quality, totalEvaluations)
      }
    };
  }

  /**
   * Rank components by mean score
   */
  rankComponents(byComponent, mode) {
    if (!byComponent) return { best: null, worst: null, ranked: [] };
    
    const ranked = Object.entries(byComponent)
      .filter(([_, stats]) => stats.mean !== null && stats.mean !== undefined)
      .map(([key, stats]) => ({
        key,
        label: COMPONENT_LABELS[key],
        mean: stats.mean,
        std: stats.std,
        count: stats.count
      }))
      .sort((a, b) => b.mean - a.mean);
    
    return {
      best: ranked[0] || null,
      worst: ranked[ranked.length - 1] || null,
      ranked
    };
  }

  /**
   * Generate key statistical observations (for bullet points)
   */
  generateKeyObservations(totalPapers, totalEvals, accMean, qualMean, accStd, qualStd, compRankings, irrData, qvData) {
    const observations = [];
    
    if (accMean !== null && accMean !== undefined) {
      observations.push(
        `Overall Accuracy: Across ${totalEvals} evaluations, the system achieved a mean accuracy of ${(accMean * 100).toFixed(1)}% with standard deviation of ${((accStd || 0) * 100).toFixed(1)}%.`
      );
    }
    
    if (compRankings.accuracy.best) {
      observations.push(
        `Best Performing: ${compRankings.accuracy.best.label} extraction achieved the highest accuracy (${(compRankings.accuracy.best.mean * 100).toFixed(1)}%).`
      );
    }
    
    if (compRankings.accuracy.worst && compRankings.accuracy.worst.key !== compRankings.accuracy.best?.key) {
      observations.push(
        `Needs Improvement: ${compRankings.accuracy.worst.label} extraction showed the lowest accuracy (${(compRankings.accuracy.worst.mean * 100).toFixed(1)}%).`
      );
    }
    
    if (qualMean !== null && qualMean !== undefined && qualMean > 0 && accMean !== null) {
      const diff = qualMean - accMean;
      const diffText = diff >= 0 
        ? `higher by ${(Math.abs(diff) * 100).toFixed(1)} percentage points`
        : `lower by ${(Math.abs(diff) * 100).toFixed(1)} percentage points`;
      observations.push(
        `Accuracy vs Quality Gap: Overall quality scores (${(qualMean * 100).toFixed(1)}%) are ${diffText} compared to accuracy scores (${(accMean * 100).toFixed(1)}%), ${diff >= 0 ? 'indicating well-structured outputs that may not always exactly match ground truth.' : 'indicating accurate extraction with room for improving structural quality.'}`
      );
    }
    
    if (irrData.hasData && irrData.fleissKappa !== null) {
      observations.push(
        `Inter-Rater Reliability: Fleiss' Kappa of ${irrData.fleissKappa.toFixed(3)} indicates ${irrData.interpretation.toLowerCase()} agreement among ${irrData.multiEvalCount} multi-evaluator papers.`
      );
    }
    
    return observations;
  }

  /**
   * Generate mode-specific observations
   */
  generateModeObservations(mode, mean, std, compRankings, totalEvals) {
    const observations = [];
    const modeLabel = mode === 'accuracy' ? 'Accuracy' : 'Quality';
    
    if (mean !== null && mean !== undefined && (mode === 'accuracy' || mean > 0)) {
      observations.push(
        `Overall ${modeLabel}: Across ${totalEvals} evaluations, the system achieved a mean ${mode} score of ${(mean * 100).toFixed(1)}% with standard deviation of ${((std || 0) * 100).toFixed(1)}%.`
      );
    }
    
    if (compRankings.best) {
      observations.push(
        `Best Performing: ${compRankings.best.label} achieved the highest mean (${(compRankings.best.mean * 100).toFixed(1)}%).`
      );
    }
    
    if (compRankings.worst && compRankings.worst.key !== compRankings.best?.key) {
      observations.push(
        `Needs Improvement: ${compRankings.worst.label} showed the lowest mean (${(compRankings.worst.mean * 100).toFixed(1)}%).`
      );
    }
    
    return observations;
  }

  /**
   * Generate publication-ready suggested text
   */
  generatePublicationText(totalPapers, totalEvals, accMean, qualMean, accStd, qualStd, compRankings, irrData) {
    const parts = [];
    
    // Opening
    parts.push(`The evaluation of ${totalEvals} paper analyses across ${totalPapers} papers revealed varying performance across the five extraction components.`);
    
    // Accuracy findings
    if (accMean !== null && accMean !== undefined && compRankings.accuracy.best) {
      parts.push(
        `${compRankings.accuracy.best.label} extraction demonstrated the highest accuracy reliability (M = ${(compRankings.accuracy.best.mean * 100).toFixed(1)}%, SD = ${((compRankings.accuracy.best.std || 0) * 100).toFixed(1)}%),` +
        ` while ${compRankings.accuracy.worst?.label || 'other components'} showed more variability (M = ${((compRankings.accuracy.worst?.mean || 0) * 100).toFixed(1)}%, SD = ${((compRankings.accuracy.worst?.std || 0) * 100).toFixed(1)}%).`
      );
    }
    
    // Quality vs Accuracy comparison
    if (qualMean !== null && qualMean !== undefined && qualMean > 0 && accMean !== null) {
      const diff = qualMean - accMean;
      parts.push(
        `Overall, quality scores (M = ${(qualMean * 100).toFixed(1)}%) ${diff >= 0 ? 'exceeded' : 'fell below'} accuracy scores (M = ${(accMean * 100).toFixed(1)}%) by ${Math.abs(diff * 100).toFixed(1)} percentage points.`
      );
    }
    
    // IRR
    if (irrData.hasData && irrData.fleissKappa !== null) {
      parts.push(
        `Inter-rater reliability analysis yielded a Fleiss' Kappa of ${irrData.fleissKappa.toFixed(3)}, indicating ${irrData.interpretation.toLowerCase()} agreement among evaluators.`
      );
    }
    
    return parts.join(' ');
  }

  generateFindingsSummary(findings) {
    const highSignificance = findings.filter(f => f.significance === 'high');
    return {
      keyInsights: highSignificance.map(f => f.description),
      totalFindings: findings.length,
      highPriority: highSignificance.length,
      overallAssessment: this.determineOverallAssessment(findings)
    };
  }

  determineOverallAssessment(findings) {
    const overallQuality = findings.find(f => f.id === 'overall_quality');
    const irr = findings.find(f => f.id === 'irr');
    
    let score = 0, factors = 0;
    if (overallQuality?.value) { score += overallQuality.value; factors++; }
    if (irr?.value && irr.value > 0) { score += (irr.value + 1) / 2; factors++; }
    
    const avgScore = factors > 0 ? score / factors : 0;
    
    if (avgScore >= 0.75) return { level: 'Excellent', color: 'emerald' };
    if (avgScore >= 0.6) return { level: 'Good', color: 'blue' };
    if (avgScore >= 0.4) return { level: 'Moderate', color: 'amber' };
    return { level: 'Needs Improvement', color: 'red' };
  }

  groupFindingsByCategory(findings) {
    const grouped = {};
    findings.forEach(finding => {
      if (!grouped[finding.category]) grouped[finding.category] = [];
      grouped[finding.category].push(finding);
    });
    return grouped;
  }

  // ============================================
  // EVALUATOR MATRIX
  // ============================================

  buildEvaluatorComparisonMatrix(papers) {
    const evaluatorMap = new Map();
    
    papers.forEach(paper => {
      paper.evaluators.forEach(evaluator => {
        if (!evaluatorMap.has(evaluator.id)) {
          evaluatorMap.set(evaluator.id, {
            id: evaluator.id, name: evaluator.name, profile: evaluator.profile,
            papersEvaluated: [], 
            scores: { 
              accuracy: [], // Overall accuracy per paper
              quality: [],  // Overall quality per paper
              allComponentScores: [] // All individual component scores for variance
            }
          });
        }
        
        const e = evaluatorMap.get(evaluator.id);
        e.papersEvaluated.push(paper.id);
        
        // Collect overall scores
        if (evaluator.scores.overallAccuracy !== null) {
          e.scores.accuracy.push(evaluator.scores.overallAccuracy);
        }
        if (evaluator.scores.overallQuality !== null) {
          e.scores.quality.push(evaluator.scores.overallQuality);
        }
        
        // Collect ALL component scores for better variance calculation
        // Try multiple paths since data structure varies
        if (evaluator.scores.byComponent) {
          Object.values(evaluator.scores.byComponent).forEach(comp => {
            if (!comp) return;
            
            // Try multiple paths for accuracy score
            const accScore = comp.accuracy?.final ?? 
                            comp.accuracy?.automated ?? 
                            comp.accuracy?.userRating ??
                            comp.finalScore ??
                            comp.score ??
                            null;
            
            if (accScore !== null && accScore !== undefined && !isNaN(accScore) && accScore > 0) {
              e.scores.allComponentScores.push(accScore);
            }
            
            // Also try quality scores
            const qualScore = comp.quality?.final ?? 
                             comp.quality?.automated ??
                             comp.qualityScore ??
                             null;
            
            if (qualScore !== null && qualScore !== undefined && !isNaN(qualScore) && qualScore > 0) {
              e.scores.allComponentScores.push(qualScore);
            }
          });
        }
      });
    });
    
    const evaluators = Array.from(evaluatorMap.values());
    evaluators.forEach(e => {
      // Use allComponentScores for variance if available, otherwise use accuracy
      const scoresForVariance = e.scores.allComponentScores.length > 1 
        ? e.scores.allComponentScores 
        : e.scores.accuracy;
      
      e.stats = {
        accuracy: this.calculateStats(e.scores.accuracy),
        quality: this.calculateStats(e.scores.quality),
        // Calculate variance from all component scores
        componentVariance: this.calculateStats(scoresForVariance),
        paperCount: e.papersEvaluated.length,
        totalScores: e.scores.allComponentScores.length
      };
    });
    
    const pairwiseMatrix = [];
    for (let i = 0; i < evaluators.length; i++) {
      for (let j = i + 1; j < evaluators.length; j++) {
        const e1 = evaluators[i], e2 = evaluators[j];
        const commonPapers = e1.papersEvaluated.filter(p => e2.papersEvaluated.includes(p));
        
        if (commonPapers.length > 0) {
          const agreements = commonPapers.map(paperId => {
            const paper = papers.find(p => p.id === paperId);
            if (!paper) return null;
            
            const e1Score = paper.evaluators.find(e => e.id === e1.id)?.scores.overallAccuracy;
            const e2Score = paper.evaluators.find(e => e.id === e2.id)?.scores.overallAccuracy;
            
            if (e1Score === null || e2Score === null) return null;
            return { e1Score, e2Score, difference: Math.abs(e1Score - e2Score), agreement: 1 - Math.abs(e1Score - e2Score) };
          }).filter(a => a !== null);
          
          pairwiseMatrix.push({
            evaluator1: { id: e1.id, name: e1.name },
            evaluator2: { id: e2.id, name: e2.name },
            commonPaperCount: commonPapers.length,
            agreements,
            averageAgreement: agreements.length > 0 ? agreements.reduce((sum, a) => sum + a.agreement, 0) / agreements.length : null,
            averageDifference: agreements.length > 0 ? agreements.reduce((sum, a) => sum + a.difference, 0) / agreements.length : null
          });
        }
      }
    }

    return {
      evaluators,
      evaluatorCount: evaluators.length,
      pairwiseMatrix,
      mostActiveEvaluators: [...evaluators].sort((a, b) => b.stats.paperCount - a.stats.paperCount).slice(0, 5),
      highestAgreementPairs: [...pairwiseMatrix].sort((a, b) => (b.averageAgreement || 0) - (a.averageAgreement || 0)).slice(0, 3),
      lowestAgreementPairs: [...pairwiseMatrix].sort((a, b) => (a.averageAgreement || 1) - (b.averageAgreement || 1)).slice(0, 3)
    };
  }

  // ============================================
  // SCORE DISTRIBUTION
  // Uses same paths as ScoreDistributionChart
  // ============================================

  calculateScoreDistribution(papers, aggregatedData) {
    // Use aggregatedData for consistency with ScoreDistributionChart
    const accuracyScores = [];
    const qualityScores = [];
    
    if (aggregatedData?.papers) {
      Object.values(aggregatedData.papers).forEach(paper => {
        // Collect all component scores
        COMPONENT_KEYS.forEach(compName => {
          const comp = paper[compName] || paper[compName.replace('_', '')];
          if (!comp) return;
          
          // ACCURACY path - same as ScoreDistributionChart
          const acc = comp.accuracyScores?.mean ?? comp.scores?.mean;
          if (acc !== undefined && !isNaN(acc)) accuracyScores.push(acc);
          
          // QUALITY path - same as ScoreDistributionChart
          const qual = comp.qualityScores?.mean;
          if (qual !== undefined && !isNaN(qual) && qual > 0) qualityScores.push(qual);
        });
      });
    }
    
    const bins = [
      { label: '0-20%', min: 0, max: 0.2 },
      { label: '20-40%', min: 0.2, max: 0.4 },
      { label: '40-60%', min: 0.4, max: 0.6 },
      { label: '60-80%', min: 0.6, max: 0.8 },
      { label: '80-100%', min: 0.8, max: 1.01 }
    ];
    
    // Component distributions using aggregatedData - for BOTH accuracy and quality
    const componentDistributions = { accuracy: {}, quality: {} };
    
    COMPONENT_KEYS.forEach(compKey => {
      const compAccScores = [];
      const compQualScores = [];
      
      if (aggregatedData?.papers) {
        Object.values(aggregatedData.papers).forEach(paper => {
          const comp = paper[compKey] || paper[compKey.replace('_', '')];
          if (!comp) return;
          
          const acc = comp.accuracyScores?.mean ?? comp.scores?.mean;
          if (acc !== undefined && !isNaN(acc)) compAccScores.push(acc);
          
          const qual = comp.qualityScores?.mean;
          if (qual !== undefined && !isNaN(qual) && qual > 0) compQualScores.push(qual);
        });
      }
      
      componentDistributions.accuracy[compKey] = this.createDistribution(compAccScores, bins);
      componentDistributions.quality[compKey] = this.createDistribution(compQualScores, bins);
    });

    return {
      accuracy: { distribution: this.createDistribution(accuracyScores, bins), stats: this.calculateStats(accuracyScores) },
      quality: { distribution: this.createDistribution(qualityScores, bins), stats: this.calculateStats(qualityScores) },
      byComponent: componentDistributions,
      bins
    };
  }

  createDistribution(scores, bins) {
    const distribution = bins.map(bin => ({ ...bin, count: 0, percentage: 0, papers: [] }));
    scores.forEach((score, idx) => {
      const bin = distribution.find(b => score >= b.min && score < b.max);
      if (bin) { bin.count++; bin.papers.push(idx); }
    });
    const total = scores.length;
    distribution.forEach(bin => { bin.percentage = total > 0 ? (bin.count / total) * 100 : 0; });
    return distribution;
  }

  // ============================================
  // TEMPORAL ANALYSIS
  // ============================================

  calculateTemporalAnalysis(papers) {
    const papersWithTime = papers.filter(p => p.temporal?.firstEvaluation);
    if (papersWithTime.length === 0) return { hasData: false };
    
    const sorted = [...papersWithTime].sort((a, b) => new Date(a.temporal.firstEvaluation) - new Date(b.temporal.firstEvaluation));
    
    const byDate = {};
    sorted.forEach(paper => {
      const date = paper.temporal.firstEvaluation.split('T')[0];
      if (!byDate[date]) byDate[date] = { papers: [], scores: [] };
      byDate[date].papers.push(paper);
      if (paper.scores.overall.accuracy.mean !== null) byDate[date].scores.push(paper.scores.overall.accuracy.mean);
    });
    
    const timeline = Object.entries(byDate).map(([date, data]) => ({
      date,
      paperCount: data.papers.length,
      avgScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : null
    }));
    
    const scoresOverTime = sorted.map((p, idx) => ({ x: idx, y: p.scores.overall.accuracy.mean })).filter(p => p.y !== null);
    const trend = this.calculateTrend(scoresOverTime);

    return {
      hasData: true,
      paperCount: papersWithTime.length,
      dateRange: { start: sorted[0].temporal.firstEvaluation, end: sorted[sorted.length - 1].temporal.firstEvaluation },
      timeline,
      trend,
      byDate
    };
  }

  calculateTrend(data) {
    if (data.length < 2) return { slope: 0, direction: 'stable' };
    
    const n = data.length;
    const sumX = data.reduce((sum, p) => sum + p.x, 0);
    const sumY = data.reduce((sum, p) => sum + p.y, 0);
    const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return {
      slope,
      direction: slope > 0.01 ? 'improving' : slope < -0.01 ? 'declining' : 'stable',
      interpretation: slope > 0.01 ? 'Scores are trending upward over time' : slope < -0.01 ? 'Scores are trending downward over time' : 'Scores remain relatively stable over time'
    };
  }

  // ============================================
  // COMPONENT ANALYSIS
  // Uses aggregatedData for score consistency
  // ============================================

  calculateComponentAnalysis(papers, aggregatedData) {
    const analysis = {};
    
    COMPONENT_KEYS.forEach(compKey => {
      const accScores = [];
      const qualScores = [];
      
      // Use aggregatedData for consistency
      if (aggregatedData?.papers) {
        Object.values(aggregatedData.papers).forEach(paper => {
          const comp = paper[compKey] || paper[compKey.replace('_', '')];
          if (!comp) return;
          
          const acc = comp.accuracyScores?.mean ?? comp.scores?.mean;
          if (acc !== undefined && !isNaN(acc)) accScores.push(acc);
          
          const qual = comp.qualityScores?.mean;
          if (qual !== undefined && !isNaN(qual) && qual > 0) qualScores.push(qual);
        });
      }
      
      analysis[compKey] = {
        label: COMPONENT_LABELS[compKey],
        paperCount: accScores.length,
        accuracy: this.calculateStats(accScores),
        quality: this.calculateStats(qualScores),
        ranking: accScores.length > 0 ? accScores.reduce((a, b) => a + b, 0) / accScores.length : 0
      };
    });
    
    const ranked = Object.entries(analysis).sort((a, b) => b[1].ranking - a[1].ranking).map(([key, data], idx) => ({ ...data, key, rank: idx + 1 }));

    return { byComponent: analysis, ranked, bestComponent: ranked[0], worstComponent: ranked[ranked.length - 1] };
  }

  // ============================================
  // OVERALL STATISTICS
  // Uses aggregatedData for score consistency
  // ============================================

  calculateOverallStats(papers, aggregatedData, aggregatedCounts = null) {
    // USE PROCESSED PAPER COUNTS (consistent with Overview after DOI grouping)
    
    let totalPapers, totalEvaluations, uniqueEvaluators, multiEvalPapers, papersWithGT;
    
    if (aggregatedCounts) {
      // Use pre-calculated counts from processedPapers
      totalPapers = aggregatedCounts.totalPapers;
      totalEvaluations = aggregatedCounts.totalEvaluations;
      uniqueEvaluators = aggregatedCounts.uniqueEvaluators;
      multiEvalPapers = aggregatedCounts.multiEvalPapers;
      papersWithGT = aggregatedCounts.papersWithGT;
    } else {
      // Fallback: calculate from papers directly
      totalPapers = papers.length;
      totalEvaluations = papers.reduce((sum, p) => sum + p.evaluationCount, 0);
      multiEvalPapers = papers.filter(p => p.isMultiEvaluator).length;
      papersWithGT = papers.filter(p => p.hasGroundTruth).length;
      
      const evaluatorSet = new Set();
      papers.forEach(paper => paper.evaluators.forEach(e => evaluatorSet.add(e.id)));
      uniqueEvaluators = evaluatorSet.size;
    }
    
    const papersWithDisagreement = papers.filter(p => p.hasDisagreements).length;
    
    // Calculate average scores from PROCESSED PAPERS (they already have calculated scores)
    // This matches Overview which uses the same calculated values
    const accuracyScores = papers
      .map(p => p.scores?.overall?.accuracy?.mean)
      .filter(s => s !== null && s !== undefined && !isNaN(s));
    
    const qualityScores = papers
      .map(p => p.scores?.overall?.quality?.mean)
      .filter(s => s !== null && s !== undefined && !isNaN(s));
    
    const accuracyMean = accuracyScores.length > 0 
      ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length 
      : null;
    
    const qualityMean = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : null;
    
    // Also collect component means for detailed breakdown
    const componentAccuracyMeans = [];
    const componentQualityMeans = [];
    
    COMPONENT_KEYS.forEach(compKey => {
      const compAccScores = papers
        .map(p => p.scores?.byComponent?.[compKey]?.accuracy?.mean)
        .filter(s => s !== null && s !== undefined && !isNaN(s));
      
      const compQualScores = papers
        .map(p => p.scores?.byComponent?.[compKey]?.quality?.mean)
        .filter(s => s !== null && s !== undefined && !isNaN(s));
      
      if (compAccScores.length > 0) {
        componentAccuracyMeans.push(compAccScores.reduce((a, b) => a + b, 0) / compAccScores.length);
      }
      if (compQualScores.length > 0) {
        componentQualityMeans.push(compQualScores.reduce((a, b) => a + b, 0) / compQualScores.length);
      }
    });
    
    console.log(`[CrossPaperAnalysis] Score calculation from ${papers.length} papers - Accuracy: ${accuracyMean ? (accuracyMean * 100).toFixed(1) : 'N/A'}%, Quality: ${qualityMean ? (qualityMean * 100).toFixed(1) : 'N/A'}%`);
    console.log(`[CrossPaperAnalysis] Component means - Acc: [${componentAccuracyMeans.map(m => (m*100).toFixed(0)).join(', ')}], Qual: [${componentQualityMeans.map(m => (m*100).toFixed(0)).join(', ')}]`);

    return {
      totalPapers, 
      totalEvaluations,
      uniqueEvaluators,
      multiEvaluatorPapers: multiEvalPapers,
      papersWithGroundTruth: papersWithGT,
      papersWithDisagreement,
      avgEvaluationsPerPaper: totalPapers > 0 ? totalEvaluations / totalPapers : 0,
      groundTruthCoverage: totalPapers > 0 ? papersWithGT / totalPapers : 0,
      multiEvalCoverage: totalPapers > 0 ? multiEvalPapers / totalPapers : 0,
      scores: { 
        accuracy: { mean: accuracyMean, componentMeans: componentAccuracyMeans },
        quality: { mean: qualityMean, componentMeans: componentQualityMeans }
      }
    };
  }

  // ============================================
  // UTILITY
  // ============================================

  getEmptyState() {
    return {
      papers: [],
      overallStats: {
        totalPapers: 0, totalEvaluations: 0, uniqueEvaluators: 0, multiEvaluatorPapers: 0,
        papersWithGroundTruth: 0, papersWithDisagreement: 0, avgEvaluationsPerPaper: 0,
        groundTruthCoverage: 0, multiEvalCoverage: 0, scores: { accuracy: null, quality: null }
      },
      interRaterReliability: { hasData: false },
      qualityVsAccuracy: { overall: { accuracy: null, quality: null } },
      researchFindings: { findings: [], summary: { keyInsights: [], totalFindings: 0 } },
      scoreDistribution: { accuracy: null, quality: null },
      temporalAnalysis: { hasData: false },
      componentAnalysis: { byComponent: {}, ranked: [] },
      evaluatorMatrix: { evaluators: [], evaluatorCount: 0, pairwiseMatrix: [] },
      disagreementAnalysis: { totalWithDisagreement: 0, totalMultiEval: 0 },
      groundTruthComparison: { totalWithGroundTruth: 0, totalWithoutGroundTruth: 0 },
      componentKeys: COMPONENT_KEYS,
      componentLabels: COMPONENT_LABELS,
      scoreThresholds: SCORE_THRESHOLDS,
      expertiseTiers: EXPERTISE_TIERS,
      disagreementThreshold: DISAGREEMENT_THRESHOLD
    };
  }

  clearCache() { this.cache.clear(); }
}

const crossPaperAnalysisService = new CrossPaperAnalysisService();
export default crossPaperAnalysisService;
export { CrossPaperAnalysisService };