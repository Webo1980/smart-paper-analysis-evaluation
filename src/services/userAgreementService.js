// src/services/userAgreementService.js
// USER AGREEMENT ANALYSIS SERVICE
// Handles all inter-rater reliability and agreement calculations
// This service provides pre-calculated data to UI components

/**
 * UserAgreementService
 * 
 * Centralizes all agreement analysis calculations:
 * - Fleiss' Kappa (inter-rater reliability)
 * - Variance-based agreement
 * - Cross-paper consistency
 * - Expertise tier analysis
 * - ORKG experience impact
 * - Paper-level analysis
 * - Evaluator consistency
 * - Pairwise agreement matrix
 * - Rating distribution statistics
 */

const COMPONENT_KEYS = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
const COMPONENT_LABELS = {
  metadata: 'Metadata',
  research_field: 'Research Field',
  research_problem: 'Research Problem',
  template: 'Template',
  content: 'Content'
};

// Expertise tier definitions
const EXPERTISE_TIERS = {
  expert: { min: 4.0, max: 5.1, label: 'Expert' },
  senior: { min: 3.0, max: 4.0, label: 'Senior' },
  intermediate: { min: 2.0, max: 3.0, label: 'Intermediate' },
  junior: { min: 0, max: 2.0, label: 'Junior' }
};

class UserAgreementService {
  constructor() {
    this.cache = new Map();
  }

  // ============================================
  // MAIN AGGREGATION METHOD
  // ============================================
  
  /**
   * Calculate all agreement metrics from integrated and aggregated data
   * @param {Object} integratedData - Data from integratedDataService
   * @param {Object} aggregatedData - Data from aggregationService
   * @returns {Object} Comprehensive agreement analysis
   */
  calculateAgreementMetrics(integratedData, aggregatedData) {
    const papers = integratedData?.papers || [];
    const aggPaperIds = aggregatedData?.papers ? new Set(Object.keys(aggregatedData.papers)) : new Set();
    
    // Extract evaluators and paper evaluations
    const { evaluatorsData, paperEvaluations } = this.extractEvaluationData(papers, aggPaperIds);
    
    // Determine analysis mode
    const multiEvalPaperCount = paperEvaluations.filter(p => p.evaluations.length >= 2).length;
    const hasMultiEvaluatorData = multiEvalPaperCount >= 2;
    
    // Calculate all metrics
    const fleissKappa = this.calculateFleissKappa(paperEvaluations);
    const componentKappa = this.calculateComponentKappa(paperEvaluations);
    const varianceAgreement = this.calculateVarianceAgreement(paperEvaluations);
    const expertiseAgreement = this.calculateExpertiseAgreement(evaluatorsData, paperEvaluations);
    const orkgAgreement = this.calculateOrkgAgreement(evaluatorsData, paperEvaluations);
    const paperAnalysis = this.calculatePaperAnalysis(paperEvaluations);
    const evaluatorConsistency = this.calculateEvaluatorConsistency(evaluatorsData, paperEvaluations);
    const pairwiseAgreement = this.calculatePairwiseAgreement(evaluatorsData, paperEvaluations);
    const ratingDistribution = this.calculateRatingDistribution(paperEvaluations);
    const crossPaperConsistency = this.calculateCrossPaperConsistency(paperEvaluations);
    const overallStats = this.calculateOverallStats(papers, evaluatorsData, paperEvaluations);

    return {
      // Raw data
      evaluatorsData,
      paperEvaluations,
      
      // Analysis mode
      analysisMode: hasMultiEvaluatorData ? 'inter-rater' : 'cross-paper',
      hasMultiEvaluatorData,
      multiEvalPaperCount,
      
      // Metrics
      fleissKappa,
      componentKappa,
      varianceAgreement,
      expertiseAgreement,
      orkgAgreement,
      paperAnalysis,
      evaluatorConsistency,
      pairwiseAgreement,
      ratingDistribution,
      crossPaperConsistency,
      overallStats,
      
      // Constants for UI
      componentKeys: COMPONENT_KEYS,
      componentLabels: COMPONENT_LABELS,
      expertiseTiers: EXPERTISE_TIERS
    };
  }

  // ============================================
  // DATA EXTRACTION
  // ============================================
  
  /**
   * Extract evaluators and paper evaluations from integrated data
   */
  extractEvaluationData(papers, aggPaperIds) {
    const evaluatorMap = new Map();
    const paperEvalsMap = new Map(); // Keyed by DOI for proper grouping
    
    papers.forEach(paper => {
      const paperToken = paper.token;
      if (aggPaperIds.size > 0 && !aggPaperIds.has(paperToken)) return;
      
      // Use DOI as unique paper identifier
      const doi = paper.doi || paper.groundTruth?.doi || paper.systemData?.metadata?.doi;
      const paperId = doi || paperToken;
      
      // Get paper metadata
      const title = paper.groundTruth?.title || 
                   paper.systemData?.metadata?.title ||
                   paper.systemOutput?.metadata?.title ||
                   paperId;
      
      const orkgId = paper.groundTruth?.paper_id || null;
      
      if (!paperEvalsMap.has(paperId)) {
        paperEvalsMap.set(paperId, {
          paperId,
          doi: doi || null,
          token: paperToken,
          title,
          orkgId,
          evaluations: [],
          evaluatorIds: []
        });
      }
      
      paper.userEvaluations?.forEach(evaluation => {
        const userInfo = evaluation.userInfo;
        if (!userInfo) return;
        
        const id = `${userInfo.firstName}_${userInfo.lastName}`;
        
        if (!evaluatorMap.has(id)) {
          evaluatorMap.set(id, {
            id,
            name: `${userInfo.firstName} ${userInfo.lastName}`,
            profile: {
              role: userInfo.role || 'Unknown',
              domainExpertise: userInfo.domainExpertise || 'Unknown',
              orkgExperience: userInfo.orkgExperience || 'never',
              expertiseWeight: userInfo.expertiseWeight || 1
            },
            evaluations: [],
            papersEvaluated: [],
            scores: { accuracy: [], quality: [] }
          });
        }
        
        const evaluator = evaluatorMap.get(id);
        
        // Extract scores from evaluation
        const evalMetrics = evaluation.evaluationMetrics?.overall;
        if (evalMetrics) {
          const paperEval = paperEvalsMap.get(paperId);
          
          // Calculate component scores using FINAL weighted scores
          const compScores = this.extractComponentScores(evalMetrics);
          
          // Calculate overall accuracy (average of component final accuracy scores)
          const validAccScores = Object.values(compScores).filter(s => s.accuracy !== null).map(s => s.accuracy);
          const overallAcc = validAccScores.length > 0 ? validAccScores.reduce((a, b) => a + b, 0) / validAccScores.length : null;
          
          // Calculate overall quality (average of component final quality scores)
          const validQualScores = Object.values(compScores).filter(s => s.quality !== null).map(s => s.quality);
          const overallQual = validQualScores.length > 0 ? validQualScores.reduce((a, b) => a + b, 0) / validQualScores.length : overallAcc;
          
          // Calculate average automated and user rating scores for breakdown display
          const validAutomated = Object.values(compScores).filter(s => s.automated !== null).map(s => s.automated);
          const avgAutomated = validAutomated.length > 0 ? validAutomated.reduce((a, b) => a + b, 0) / validAutomated.length : null;
          
          // Calculate average quality automated scores
          const validQualAutomated = Object.values(compScores).filter(s => s.qualityAutomated !== null).map(s => s.qualityAutomated);
          const avgQualityAutomated = validQualAutomated.length > 0 ? validQualAutomated.reduce((a, b) => a + b, 0) / validQualAutomated.length : null;
          
          const validUserRatings = Object.values(compScores).filter(s => s.userRating !== null).map(s => s.userRating);
          const avgUserRating = validUserRatings.length > 0 ? validUserRatings.reduce((a, b) => a + b, 0) / validUserRatings.length : null;
          
          if (overallAcc !== null) {
            evaluator.scores.accuracy.push(overallAcc);
            evaluator.scores.quality.push(overallQual);
            
            paperEval.evaluations.push({
              evaluatorId: id,
              evaluatorName: evaluator.name,
              expertiseWeight: userInfo.expertiseWeight || 1,
              orkgExperience: userInfo.orkgExperience,
              // Overall scores (average of component final scores)
              overallScore: overallAcc,  // For backward compatibility
              overallAccuracy: overallAcc,
              overallQuality: overallQual,
              // Breakdown of automated vs user contribution (for accuracy mode)
              avgAutomated: avgAutomated,
              avgUserRating: avgUserRating,
              // Breakdown for quality mode
              avgQualityAutomated: avgQualityAutomated,
              // Per-component scores
              componentScores: compScores,
              timestamp: evaluation.timestamp
            });
            paperEval.evaluatorIds.push(id);
          }
        }
        
        if (!evaluator.papersEvaluated.includes(paperId)) {
          evaluator.papersEvaluated.push(paperId);
        }
      });
    });

    return {
      evaluatorsData: Array.from(evaluatorMap.values()),
      paperEvaluations: Array.from(paperEvalsMap.values())
    };
  }

  /**
   * Extract component scores from evaluation metrics
   * Returns both accuracy and quality scores separately, plus raw automated and user ratings
   * Matches the calculation logic in OverviewMetrics for consistency
   * 
   * Data paths discovered from debug:
   * ACCURACY:
   * - metadata: overall.accuracyScore, field ratings (title.rating, etc.)
   * - research_field: accuracyMetrics.automatedScore.value, accuracyMetrics.scoreDetails.normalizedRating
   * - research_problem: overall.research_problem.accuracy.overallAccuracy.automated/finalScore
   * - template: accuracyResults.similarityData.automatedOverallScore, accuracyResults.scoreDetails
   * - content: property.accuracyScore, property.finalScore
   * 
   * QUALITY:
   * - metadata: overall.qualityScore
   * - research_field: qualityMetrics.overallQuality.value
   * - research_problem: quality.overallQuality.finalScore (often null, fallback to field averages)
   * - template: qualityScore or qualityResults.qualityData.fieldSpecificMetrics averages
   * - content: property.qualityScore
   */
  extractComponentScores(evalMetrics) {
    const compScores = {};
    
    COMPONENT_KEYS.forEach(compKey => {
      const compData = evalMetrics[compKey];
      if (!compData) {
        compScores[compKey] = { 
          accuracy: null, 
          quality: null,
          automated: null,
          userRating: null,
          finalAccuracy: null,
          finalQuality: null
        };
        return;
      }
      
      let accAutomated = null;
      let accUserRating = null;
      let qualAutomated = null;
      let finalAccuracy = null;
      let finalQuality = null;
      
      if (compKey === 'metadata') {
        // ACCURACY
        accAutomated = compData.overall?.accuracyScore;
        finalAccuracy = compData.overall?.overallScore;
        
        // User ratings are per-field (title.rating, authors.rating, etc.)
        const fieldRatings = [];
        ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
          if (compData[field]?.rating !== undefined) {
            fieldRatings.push(compData[field].rating / 5); // Normalize to 0-1
          }
        });
        if (fieldRatings.length > 0) {
          accUserRating = fieldRatings.reduce((a, b) => a + b, 0) / fieldRatings.length;
        }
        
        // QUALITY: overall.qualityScore
        qualAutomated = compData.overall?.qualityScore;
        // Quality final = weighted with user rating
        if (qualAutomated !== null && accUserRating !== null) {
          finalQuality = qualAutomated * 0.6 + accUserRating * 0.4;
        } else {
          finalQuality = qualAutomated;
        }
      } 
      else if (compKey === 'research_field') {
        // ACCURACY
        accAutomated = compData.accuracyMetrics?.automatedScore?.value ?? 
                       compData.accuracyMetrics?.similarityData?.automatedOverallScore;
        accUserRating = compData.accuracyMetrics?.scoreDetails?.normalizedRating;
        finalAccuracy = compData.overallScore ?? compData.accuracyMetrics?.scoreDetails?.finalScore;
        
        // QUALITY: qualityMetrics.overallQuality.value
        qualAutomated = compData.qualityMetrics?.overallQuality?.value ?? 
                        compData.qualityMetrics?.qualityData?.overallScore;
        // Quality final = weighted with user rating (use same user rating)
        if (qualAutomated !== null && accUserRating !== null) {
          finalQuality = qualAutomated * 0.6 + accUserRating * 0.4;
        } else {
          finalQuality = qualAutomated ?? finalAccuracy; // Fallback to accuracy if no quality
        }
      } 
      else if (compKey === 'research_problem') {
        // ACCURACY
        const rpData = compData.overall?.research_problem;
        if (rpData) {
          accAutomated = rpData.accuracy?.overallAccuracy?.automated;
          finalAccuracy = rpData.accuracy?.overallAccuracy?.finalScore;
          
          // User rating from userRatings.overallRating (1-5 scale)
          if (rpData.userRatings?.overallRating !== undefined) {
            accUserRating = rpData.userRatings.overallRating / 5;
          }
          
          // QUALITY: quality.overallQuality.finalScore or average of field scores
          qualAutomated = rpData.quality?.overallQuality?.finalScore ?? 
                          rpData.quality?.overallQuality?.automated;
          
          // If quality is null, calculate from field-specific scores
          if (qualAutomated === null && rpData.quality) {
            const qualFields = ['problemTitle', 'problemDescription', 'relevance', 'evidenceQuality'];
            const qualScores = qualFields
              .map(f => rpData.quality[f]?.score)
              .filter(s => s !== undefined && s !== null);
            if (qualScores.length > 0) {
              qualAutomated = qualScores.reduce((a, b) => a + b, 0) / qualScores.length;
            }
          }
          
          // Quality final
          if (qualAutomated !== null && accUserRating !== null) {
            finalQuality = qualAutomated * 0.6 + accUserRating * 0.4;
          } else {
            finalQuality = qualAutomated ?? finalAccuracy;
          }
        }
      } 
      else if (compKey === 'template') {
        // ACCURACY
        accAutomated = compData.accuracyResults?.similarityData?.automatedOverallScore ?? 
                       compData.accuracyScore;
        accUserRating = compData.accuracyResults?.scoreDetails?.normalizedRating;
        finalAccuracy = compData.accuracyResults?.scoreDetails?.finalScore ?? compData.overallScore;
        
        // QUALITY: qualityScore or average of fieldSpecificMetrics
        qualAutomated = compData.qualityScore;
        
        // If qualityScore is 0 or null, try fieldSpecificMetrics
        if (!qualAutomated && compData.qualityResults?.qualityData?.fieldSpecificMetrics) {
          const metrics = compData.qualityResults.qualityData.fieldSpecificMetrics;
          const scores = Object.values(metrics)
            .map(m => m.score)
            .filter(s => s !== undefined && s !== null);
          if (scores.length > 0) {
            qualAutomated = scores.reduce((a, b) => a + b, 0) / scores.length;
          }
        }
        
        // Quality final
        if (qualAutomated !== null && accUserRating !== null) {
          finalQuality = qualAutomated * 0.6 + accUserRating * 0.4;
        } else {
          finalQuality = qualAutomated ?? finalAccuracy;
        }
      } 
      else if (compKey === 'content') {
        // Content has multiple properties, each with accuracyScore, qualityScore, finalScore
        const accScores = [];
        const qualScores = [];
        const finalScores = [];
        
        // Get user ratings from content.userRatings if it exists
        const userRatingsObj = compData.userRatings || {};
        const userRatings = [];
        
        Object.entries(compData).forEach(([propKey, prop]) => {
          // Skip non-property entries
          if (propKey === 'userRatings' || propKey === '_aggregate' || !prop || typeof prop !== 'object') return;
          
          if (prop.accuracyScore !== undefined && prop.accuracyScore !== null) {
            accScores.push(prop.accuracyScore);
          }
          if (prop.qualityScore !== undefined && prop.qualityScore !== null) {
            qualScores.push(prop.qualityScore);
          }
          if (prop.finalScore !== undefined && prop.finalScore !== null) {
            finalScores.push(prop.finalScore);
          }
          
          // Check for user rating in userRatings object
          if (userRatingsObj[propKey]?.rating !== undefined) {
            userRatings.push(userRatingsObj[propKey].rating / 5);
          }
        });
        
        if (accScores.length > 0) {
          accAutomated = accScores.reduce((a, b) => a + b, 0) / accScores.length;
        }
        if (qualScores.length > 0) {
          qualAutomated = qualScores.reduce((a, b) => a + b, 0) / qualScores.length;
        }
        if (finalScores.length > 0) {
          finalAccuracy = finalScores.reduce((a, b) => a + b, 0) / finalScores.length;
        }
        if (userRatings.length > 0) {
          accUserRating = userRatings.reduce((a, b) => a + b, 0) / userRatings.length;
        }
        
        // Quality final for content
        if (qualAutomated !== null && accUserRating !== null) {
          finalQuality = qualAutomated * 0.6 + accUserRating * 0.4;
        } else {
          finalQuality = qualAutomated ?? finalAccuracy;
        }
      }
      
      // If finalAccuracy wasn't set from data, calculate it
      if (finalAccuracy === null && accAutomated !== null) {
        if (accUserRating !== null) {
          finalAccuracy = accAutomated * 0.6 + accUserRating * 0.4;
        } else {
          finalAccuracy = accAutomated;
        }
      }
      
      compScores[compKey] = { 
        accuracy: finalAccuracy,  // Final weighted accuracy (or from data)
        quality: finalQuality ?? finalAccuracy,    // Final weighted quality (fallback to accuracy)
        automated: accAutomated,  // Raw automated score
        userRating: accUserRating, // Raw user rating (normalized 0-1)
        qualityAutomated: qualAutomated,
        finalAccuracy,
        finalQuality: finalQuality ?? finalAccuracy
      };
    });
    
    return compScores;
  }

  // ============================================
  // FLEISS' KAPPA CALCULATION
  // ============================================
  
  /**
   * Calculate Fleiss' Kappa for inter-rater reliability
   */
  calculateFleissKappa(paperEvaluations) {
    const multiEvalPapers = paperEvaluations.filter(p => p.evaluations.length >= 2);
    
    if (multiEvalPapers.length === 0) {
      return { kappa: null, interpretation: 'Insufficient data', n: 0, k: 0 };
    }

    const categorize = (score) => {
      if (score < 0.2) return 0;
      if (score < 0.4) return 1;
      if (score < 0.6) return 2;
      if (score < 0.8) return 3;
      return 4;
    };

    const numCategories = 5;
    const n = multiEvalPapers.length;
    
    // Build rating matrix
    const ratingMatrix = multiEvalPapers.map(paper => {
      const categories = new Array(numCategories).fill(0);
      paper.evaluations.forEach(evaluation => {
        const cat = categorize(evaluation.overallScore);
        categories[cat]++;
      });
      return { categories, raters: paper.evaluations.length };
    });

    const k = Math.min(...ratingMatrix.map(r => r.raters));
    
    if (k < 2) {
      return { kappa: null, interpretation: 'Need at least 2 raters per paper', n, k };
    }

    // Calculate P_i for each subject
    const P_i = ratingMatrix.map(row => {
      const ni = row.raters;
      let sum = 0;
      row.categories.forEach(nij => {
        sum += nij * (nij - 1);
      });
      return sum / (ni * (ni - 1));
    });

    // Calculate P̄ (mean of P_i)
    const P_bar = P_i.reduce((a, b) => a + b, 0) / n;

    // Calculate p_j (proportion of all assignments to category j)
    const totalAssignments = ratingMatrix.reduce((sum, row) => sum + row.raters, 0);
    const p_j = new Array(numCategories).fill(0);
    ratingMatrix.forEach(row => {
      row.categories.forEach((count, j) => {
        p_j[j] += count;
      });
    });
    p_j.forEach((_, j) => {
      p_j[j] /= totalAssignments;
    });

    // Calculate P̄_e (expected agreement by chance)
    const P_e = p_j.reduce((sum, pj) => sum + pj * pj, 0);

    // Calculate Fleiss' Kappa
    const kappa = P_e === 1 ? 1 : (P_bar - P_e) / (1 - P_e);

    // Interpretation
    let interpretation = 'Poor Agreement';
    if (kappa >= 0.8) interpretation = 'Almost Perfect Agreement';
    else if (kappa >= 0.6) interpretation = 'Substantial Agreement';
    else if (kappa >= 0.4) interpretation = 'Moderate Agreement';
    else if (kappa >= 0.2) interpretation = 'Fair Agreement';
    else if (kappa >= 0) interpretation = 'Slight Agreement';

    return {
      kappa,
      interpretation,
      P_bar,
      P_e,
      n,
      k,
      p_j,
      categoryLabels: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%']
    };
  }

  /**
   * Calculate component-level Kappa
   */
  calculateComponentKappa(paperEvaluations) {
    const result = {};
    
    COMPONENT_KEYS.forEach(compKey => {
      const multiEvalPapers = paperEvaluations.filter(p => 
        p.evaluations.length >= 2 && 
        p.evaluations.every(e => e.componentScores[compKey]?.accuracy !== null)
      );
      
      if (multiEvalPapers.length < 2) {
        result[compKey] = { kappa: null, n: 0 };
        return;
      }

      const categorize = (score) => {
        if (score < 0.2) return 0;
        if (score < 0.4) return 1;
        if (score < 0.6) return 2;
        if (score < 0.8) return 3;
        return 4;
      };

      const numCategories = 5;
      const n = multiEvalPapers.length;
      
      const ratingMatrix = multiEvalPapers.map(paper => {
        const categories = new Array(numCategories).fill(0);
        paper.evaluations.forEach(evaluation => {
          const score = evaluation.componentScores[compKey]?.accuracy || 0;
          const cat = categorize(score);
          categories[cat]++;
        });
        return { categories, raters: paper.evaluations.length };
      });

      const k = Math.min(...ratingMatrix.map(r => r.raters));
      if (k < 2) {
        result[compKey] = { kappa: null, n, k };
        return;
      }

      const P_i = ratingMatrix.map(row => {
        const ni = row.raters;
        let sum = 0;
        row.categories.forEach(nij => {
          sum += nij * (nij - 1);
        });
        return ni > 1 ? sum / (ni * (ni - 1)) : 0;
      });

      const P_bar = P_i.reduce((a, b) => a + b, 0) / n;

      const totalAssignments = ratingMatrix.reduce((sum, row) => sum + row.raters, 0);
      const p_j = new Array(numCategories).fill(0);
      ratingMatrix.forEach(row => {
        row.categories.forEach((count, j) => {
          p_j[j] += count;
        });
      });
      p_j.forEach((_, j) => {
        p_j[j] /= totalAssignments;
      });

      const P_e = p_j.reduce((sum, pj) => sum + pj * pj, 0);
      const kappa = P_e === 1 ? 1 : (P_bar - P_e) / (1 - P_e);

      result[compKey] = { kappa, n, k, P_bar, P_e };
    });

    return result;
  }

  // ============================================
  // VARIANCE-BASED AGREEMENT
  // ============================================
  
  /**
   * Calculate variance-based agreement metrics
   */
  calculateVarianceAgreement(paperEvaluations) {
    const multiEvalPapers = paperEvaluations.filter(p => p.evaluations.length >= 2);
    
    if (multiEvalPapers.length === 0) {
      return {
        overall: { agreement: 0, variance: 0, count: 0 },
        byComponent: {},
        consensus: { high: 0, medium: 0, low: 0, disagreement: 0 }
      };
    }

    const overallVariances = [];
    const componentVariances = {};
    COMPONENT_KEYS.forEach(k => { componentVariances[k] = []; });
    
    const consensus = { high: 0, medium: 0, low: 0, disagreement: 0 };

    multiEvalPapers.forEach(paper => {
      const scores = paper.evaluations.map(e => e.overallScore).filter(s => s > 0);
      
      if (scores.length >= 2) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
        overallVariances.push(variance);
        
        if (variance < 0.01) consensus.high++;
        else if (variance < 0.05) consensus.medium++;
        else if (variance < 0.1) consensus.low++;
        else consensus.disagreement++;
      }

      // Component-level variance
      COMPONENT_KEYS.forEach(compKey => {
        const compScores = paper.evaluations
          .map(e => e.componentScores[compKey]?.accuracy)
          .filter(s => s !== null && s !== undefined && s > 0);
        
        if (compScores.length >= 2) {
          const mean = compScores.reduce((a, b) => a + b, 0) / compScores.length;
          const variance = compScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / compScores.length;
          componentVariances[compKey].push(variance);
        }
      });
    });

    const avgVariance = overallVariances.length > 0 
      ? overallVariances.reduce((a, b) => a + b, 0) / overallVariances.length 
      : 0;

    const byComponent = {};
    COMPONENT_KEYS.forEach(compKey => {
      const variances = componentVariances[compKey];
      const avg = variances.length > 0 ? variances.reduce((a, b) => a + b, 0) / variances.length : 0;
      byComponent[compKey] = {
        avgVariance: avg,
        agreement: 1 - Math.min(avg * 10, 1),
        count: variances.length
      };
    });

    return {
      overall: {
        agreement: 1 - Math.min(avgVariance * 10, 1),
        variance: avgVariance,
        count: multiEvalPapers.length
      },
      byComponent,
      consensus
    };
  }

  // ============================================
  // EXPERTISE AGREEMENT
  // ============================================
  
  /**
   * Calculate agreement by expertise tier
   */
  calculateExpertiseAgreement(evaluatorsData, paperEvaluations) {
    const tiers = {
      expert: { ...EXPERTISE_TIERS.expert, evaluators: [], papers: new Set() },
      senior: { ...EXPERTISE_TIERS.senior, evaluators: [], papers: new Set() },
      intermediate: { ...EXPERTISE_TIERS.intermediate, evaluators: [], papers: new Set() },
      junior: { ...EXPERTISE_TIERS.junior, evaluators: [], papers: new Set() }
    };

    evaluatorsData.forEach(evaluator => {
      const weight = evaluator.profile?.expertiseWeight || 1;
      Object.entries(tiers).forEach(([tierName, tier]) => {
        if (weight >= tier.min && weight < tier.max) {
          tier.evaluators.push(evaluator);
          evaluator.papersEvaluated.forEach(p => tier.papers.add(p));
        }
      });
    });

    // Calculate within-tier agreement
    const withinTierAgreement = {};
    Object.entries(tiers).forEach(([tierName, tier]) => {
      const tierPapers = paperEvaluations.filter(p => 
        p.evaluations.filter(e => {
          const weight = e.expertiseWeight || 1;
          return weight >= tier.min && weight < tier.max;
        }).length >= 2
      );

      if (tierPapers.length === 0) {
        withinTierAgreement[tierName] = { agreement: null, count: 0, evaluators: tier.evaluators.length };
        return;
      }

      const variances = tierPapers.map(paper => {
        const tierScores = paper.evaluations
          .filter(e => {
            const weight = e.expertiseWeight || 1;
            return weight >= tier.min && weight < tier.max;
          })
          .map(e => e.overallScore)
          .filter(s => s > 0);
        
        if (tierScores.length < 2) return null;
        
        const mean = tierScores.reduce((a, b) => a + b, 0) / tierScores.length;
        return tierScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / tierScores.length;
      }).filter(v => v !== null);

      const avgVariance = variances.length > 0 ? variances.reduce((a, b) => a + b, 0) / variances.length : 0;
      
      withinTierAgreement[tierName] = {
        agreement: 1 - Math.min(avgVariance * 10, 1),
        variance: avgVariance,
        count: tierPapers.length,
        evaluators: tier.evaluators.length
      };
    });

    // Calculate cross-tier agreement (Expert vs Junior)
    const crossTierPapers = paperEvaluations.filter(p => {
      const hasExpert = p.evaluations.some(e => (e.expertiseWeight || 1) >= 4.0);
      const hasJunior = p.evaluations.some(e => (e.expertiseWeight || 1) < 2.0);
      return hasExpert && hasJunior;
    });

    let crossTierAgreement = null;
    if (crossTierPapers.length > 0) {
      const diffs = crossTierPapers.map(paper => {
        const expertScores = paper.evaluations
          .filter(e => (e.expertiseWeight || 1) >= 4.0)
          .map(e => e.overallScore);
        const juniorScores = paper.evaluations
          .filter(e => (e.expertiseWeight || 1) < 2.0)
          .map(e => e.overallScore);
        
        if (expertScores.length === 0 || juniorScores.length === 0) return null;
        
        const expertMean = expertScores.reduce((a, b) => a + b, 0) / expertScores.length;
        const juniorMean = juniorScores.reduce((a, b) => a + b, 0) / juniorScores.length;
        
        return Math.abs(expertMean - juniorMean);
      }).filter(d => d !== null);

      if (diffs.length > 0) {
        const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        crossTierAgreement = {
          avgDifference: avgDiff,
          agreement: 1 - Math.min(avgDiff, 1),
          paperCount: crossTierPapers.length
        };
      }
    }

    return {
      withinTier: withinTierAgreement,
      crossTier: crossTierAgreement,
      tiers
    };
  }

  // ============================================
  // ORKG EXPERIENCE IMPACT
  // ============================================
  
  /**
   * Calculate ORKG experience impact on ratings
   */
  calculateOrkgAgreement(evaluatorsData, paperEvaluations) {
    const withOrkg = evaluatorsData.filter(e => e.profile?.orkgExperience === 'used');
    const withoutOrkg = evaluatorsData.filter(e => e.profile?.orkgExperience !== 'used');

    const calcGroupAgreement = (evaluatorIds) => {
      const groupPapers = paperEvaluations.filter(p => 
        p.evaluations.filter(e => evaluatorIds.includes(e.evaluatorId)).length >= 2
      );

      if (groupPapers.length === 0) return { agreement: null, count: 0 };

      const variances = groupPapers.map(paper => {
        const scores = paper.evaluations
          .filter(e => evaluatorIds.includes(e.evaluatorId))
          .map(e => e.overallScore)
          .filter(s => s > 0);
        
        if (scores.length < 2) return null;
        
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        return scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
      }).filter(v => v !== null);

      const avgVariance = variances.length > 0 ? variances.reduce((a, b) => a + b, 0) / variances.length : 0;
      
      return {
        agreement: 1 - Math.min(avgVariance * 10, 1),
        variance: avgVariance,
        count: groupPapers.length
      };
    };

    return {
      withOrkg: {
        ...calcGroupAgreement(withOrkg.map(e => e.id)),
        evaluators: withOrkg.length
      },
      withoutOrkg: {
        ...calcGroupAgreement(withoutOrkg.map(e => e.id)),
        evaluators: withoutOrkg.length
      }
    };
  }

  // ============================================
  // PAPER-LEVEL ANALYSIS
  // ============================================
  
  /**
   * Calculate paper-level agreement analysis
   */
  calculatePaperAnalysis(paperEvaluations) {
    const analyzed = paperEvaluations
      .filter(p => p.evaluations.length >= 2)
      .map(paper => {
        const scores = paper.evaluations.map(e => e.overallScore).filter(s => s > 0);
        
        if (scores.length < 2) return null;
        
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
        const std = Math.sqrt(variance);
        const range = Math.max(...scores) - Math.min(...scores);
        
        return {
          paperId: paper.paperId,
          doi: paper.doi,
          title: paper.title,
          orkgId: paper.orkgId,
          evaluatorCount: paper.evaluations.length,
          meanScore: mean,
          variance,
          std,
          range,
          minScore: Math.min(...scores),
          maxScore: Math.max(...scores),
          agreement: 1 - Math.min(variance * 10, 1),
          evaluators: paper.evaluations.map(e => ({
            name: e.evaluatorName,
            score: e.overallScore,
            expertise: e.expertiseWeight
          }))
        };
      })
      .filter(p => p !== null)
      .sort((a, b) => a.variance - b.variance);

    return {
      highAgreement: analyzed.filter(p => p.variance < 0.01),
      mediumAgreement: analyzed.filter(p => p.variance >= 0.01 && p.variance < 0.05),
      lowAgreement: analyzed.filter(p => p.variance >= 0.05 && p.variance < 0.1),
      disagreement: analyzed.filter(p => p.variance >= 0.1),
      all: analyzed
    };
  }

  // ============================================
  // EVALUATOR CONSISTENCY
  // ============================================
  
  /**
   * Calculate evaluator consistency metrics
   */
  calculateEvaluatorConsistency(evaluatorsData, paperEvaluations) {
    return evaluatorsData
      .filter(e => e.scores.accuracy.length >= 2)
      .map(evaluator => {
        const scores = evaluator.scores.accuracy;
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
        const std = Math.sqrt(variance);
        
        // Calculate agreement with others
        const agreements = [];
        evaluator.papersEvaluated.forEach(paperId => {
          const paper = paperEvaluations.find(p => p.paperId === paperId);
          if (!paper) return;
          
          const myEval = paper.evaluations.find(e => e.evaluatorId === evaluator.id);
          const otherEvals = paper.evaluations.filter(e => e.evaluatorId !== evaluator.id);
          
          if (myEval && otherEvals.length > 0) {
            const otherMean = otherEvals.reduce((sum, e) => sum + e.overallScore, 0) / otherEvals.length;
            agreements.push(1 - Math.abs(myEval.overallScore - otherMean));
          }
        });
        
        const avgAgreement = agreements.length > 0 
          ? agreements.reduce((a, b) => a + b, 0) / agreements.length 
          : null;

        return {
          id: evaluator.id,
          name: evaluator.name,
          role: evaluator.profile?.role,
          expertise: evaluator.profile?.expertiseWeight || 1,
          orkgExperience: evaluator.profile?.orkgExperience === 'used',
          papersEvaluated: evaluator.papersEvaluated.length,
          meanScore: mean,
          std,
          variance,
          consistency: 1 - Math.min(variance, 1),
          agreementWithOthers: avgAgreement,
          scores
        };
      })
      .sort((a, b) => (b.agreementWithOthers || 0) - (a.agreementWithOthers || 0));
  }

  // ============================================
  // PAIRWISE AGREEMENT
  // ============================================
  
  /**
   * Calculate pairwise agreement matrix
   */
  calculatePairwiseAgreement(evaluatorsData, paperEvaluations) {
    const evaluatorIds = evaluatorsData.map(e => e.id);
    const matrix = {};

    evaluatorIds.forEach(id1 => {
      matrix[id1] = {};
      evaluatorIds.forEach(id2 => {
        if (id1 === id2) {
          matrix[id1][id2] = 1;
          return;
        }

        // Find papers evaluated by both
        const sharedPapers = paperEvaluations.filter(p => 
          p.evaluatorIds.includes(id1) && p.evaluatorIds.includes(id2)
        );

        if (sharedPapers.length === 0) {
          matrix[id1][id2] = null;
          return;
        }

        const agreements = sharedPapers.map(paper => {
          const score1 = paper.evaluations.find(e => e.evaluatorId === id1)?.overallScore;
          const score2 = paper.evaluations.find(e => e.evaluatorId === id2)?.overallScore;
          
          if (score1 === undefined || score2 === undefined) return null;
          
          return 1 - Math.abs(score1 - score2);
        }).filter(a => a !== null);

        matrix[id1][id2] = agreements.length > 0 
          ? agreements.reduce((a, b) => a + b, 0) / agreements.length 
          : null;
      });
    });

    return { matrix, evaluatorIds };
  }

  // ============================================
  // RATING DISTRIBUTION
  // ============================================
  
  /**
   * Calculate rating distribution statistics
   */
  calculateRatingDistribution(paperEvaluations) {
    const allScores = paperEvaluations.flatMap(p => 
      p.evaluations.map(e => e.overallScore)
    ).filter(s => s > 0);

    if (allScores.length === 0) return null;

    const bins = [
      { range: '0-20%', min: 0, max: 0.2, count: 0 },
      { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
      { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
      { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
      { range: '80-100%', min: 0.8, max: 1.01, count: 0 }
    ];

    allScores.forEach(score => {
      const bin = bins.find(b => score >= b.min && score < b.max);
      if (bin) bin.count++;
    });

    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allScores.length;
    const std = Math.sqrt(variance);
    
    // Skewness
    const skewness = allScores.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / allScores.length;
    
    // Kurtosis
    const kurtosis = allScores.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / allScores.length - 3;

    return {
      bins,
      stats: {
        mean,
        std,
        variance,
        skewness,
        kurtosis,
        min: Math.min(...allScores),
        max: Math.max(...allScores),
        count: allScores.length
      }
    };
  }

  // ============================================
  // CROSS-PAPER CONSISTENCY
  // ============================================
  
  /**
   * Calculate cross-paper consistency (alternative analysis for single-evaluator papers)
   */
  calculateCrossPaperConsistency(paperEvaluations) {
    const allScores = paperEvaluations.flatMap(p => 
      p.evaluations.map(e => e.overallScore)
    ).filter(s => s > 0);

    if (allScores.length < 2) return null;

    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allScores.length;
    const std = Math.sqrt(variance);
    const cv = mean > 0 ? (std / mean) * 100 : 0;

    // Component-level consistency
    const componentConsistency = {};
    COMPONENT_KEYS.forEach(compKey => {
      const scores = paperEvaluations.flatMap(p => 
        p.evaluations.map(e => e.componentScores[compKey]?.accuracy)
      ).filter(s => s !== null && s !== undefined && s > 0);

      if (scores.length >= 2) {
        const compMean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const compVariance = scores.reduce((sum, val) => sum + Math.pow(val - compMean, 2), 0) / scores.length;
        const compStd = Math.sqrt(compVariance);
        const compCv = compMean > 0 ? (compStd / compMean) * 100 : 0;

        componentConsistency[compKey] = {
          mean: compMean,
          std: compStd,
          variance: compVariance,
          cv: compCv,
          count: scores.length,
          consistency: 1 - Math.min(compCv / 100, 1)
        };
      }
    });

    // Expertise tier patterns
    const tierPatterns = {};
    Object.entries(EXPERTISE_TIERS).forEach(([tierName, tier]) => {
      const tierScores = paperEvaluations.flatMap(p => 
        p.evaluations
          .filter(e => (e.expertiseWeight || 1) >= tier.min && (e.expertiseWeight || 1) < tier.max)
          .map(e => e.overallScore)
      ).filter(s => s > 0);

      if (tierScores.length > 0) {
        const tierMean = tierScores.reduce((a, b) => a + b, 0) / tierScores.length;
        const tierVariance = tierScores.length > 1 
          ? tierScores.reduce((sum, val) => sum + Math.pow(val - tierMean, 2), 0) / tierScores.length 
          : 0;
        
        tierPatterns[tierName] = {
          mean: tierMean,
          std: Math.sqrt(tierVariance),
          count: tierScores.length
        };
      }
    });

    // ORKG experience patterns
    const orkgPatterns = {
      withOrkg: { scores: [], mean: 0, std: 0, count: 0 },
      withoutOrkg: { scores: [], mean: 0, std: 0, count: 0 }
    };

    paperEvaluations.forEach(p => {
      p.evaluations.forEach(e => {
        if (e.overallScore > 0) {
          if (e.orkgExperience === 'used') {
            orkgPatterns.withOrkg.scores.push(e.overallScore);
          } else {
            orkgPatterns.withoutOrkg.scores.push(e.overallScore);
          }
        }
      });
    });

    ['withOrkg', 'withoutOrkg'].forEach(key => {
      const scores = orkgPatterns[key].scores;
      if (scores.length > 0) {
        orkgPatterns[key].mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (scores.length > 1) {
          const patternVariance = scores.reduce((sum, val) => sum + Math.pow(val - orkgPatterns[key].mean, 2), 0) / scores.length;
          orkgPatterns[key].std = Math.sqrt(patternVariance);
        }
        orkgPatterns[key].count = scores.length;
      }
    });

    return {
      overall: { mean, std, variance, cv, count: allScores.length },
      byComponent: componentConsistency,
      byTier: tierPatterns,
      byOrkg: orkgPatterns,
      consistencyLevel: cv < 15 ? 'High' : cv < 25 ? 'Moderate' : cv < 35 ? 'Low' : 'Very Low',
      consistencyScore: 1 - Math.min(cv / 50, 1)
    };
  }

  // ============================================
  // OVERALL STATISTICS
  // ============================================
  
  /**
   * Calculate overall statistics
   */
  calculateOverallStats(papers, evaluatorsData, paperEvaluations) {
    let totalEvalsFromSource = 0;
    let uniqueEvaluatorsSet = new Set();
    let papersByDoi = new Map();
    
    papers.forEach(paper => {
      const evals = paper.userEvaluations || [];
      totalEvalsFromSource += evals.length;
      
      const doi = paper.doi || paper.groundTruth?.doi || paper.systemData?.metadata?.doi || paper.token;
      
      if (!papersByDoi.has(doi)) {
        papersByDoi.set(doi, []);
      }
      evals.forEach(e => {
        papersByDoi.get(doi).push(e);
        if (e.userInfo) {
          uniqueEvaluatorsSet.add(`${e.userInfo.firstName}_${e.userInfo.lastName}`);
        }
      });
    });

    const uniquePaperCount = papersByDoi.size;
    const totalEvalCount = totalEvalsFromSource || paperEvaluations.reduce((sum, p) => sum + p.evaluations.length, 0);
    
    let papersWithMultipleEvals = 0;
    papersByDoi.forEach((evals) => {
      if (evals.length >= 2) papersWithMultipleEvals++;
    });

    return {
      totalEvaluators: uniqueEvaluatorsSet.size || evaluatorsData.length,
      totalPapers: papers.length,
      uniquePapers: uniquePaperCount,
      papersWithMultipleEvals,
      totalEvaluations: totalEvalCount,
      avgEvalsPerPaper: uniquePaperCount > 0 ? totalEvalCount / uniquePaperCount : 0,
      papersByDoi
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  /**
   * Get interpretation for Kappa value
   */
  getKappaInterpretation(kappa) {
    if (kappa < 0) return { label: 'Poor', color: 'bg-red-500', desc: 'Less than chance agreement' };
    if (kappa < 0.2) return { label: 'Slight', color: 'bg-red-400', desc: 'Slight agreement' };
    if (kappa < 0.4) return { label: 'Fair', color: 'bg-orange-400', desc: 'Fair agreement' };
    if (kappa < 0.6) return { label: 'Moderate', color: 'bg-yellow-400', desc: 'Moderate agreement' };
    if (kappa < 0.8) return { label: 'Substantial', color: 'bg-green-400', desc: 'Substantial agreement' };
    return { label: 'Almost Perfect', color: 'bg-green-600', desc: 'Almost perfect agreement' };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const userAgreementService = new UserAgreementService();
export default userAgreementService;

// Also export the class for testing
export { UserAgreementService };