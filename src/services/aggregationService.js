// src/services/aggregationService.js

/**
 * AggregationService
 * 
 * Aggregates evaluation data from multiple users across multiple papers
 * for comprehensive multi-user, multi-paper analysis.
 * 
 * Takes input from githubDataService and processes it for:
 * - Cross-paper comparison
 * - Cross-evaluator analysis
 * - Inter-rater reliability
 * - Expertise-weighted consensus
 * 
 * FIXED: Research Problem extraction - uses accuracy.scoreDetails.finalScore
 * FIXED: Content extraction - aggregates from property-level scores
 * FIXED: Chart rendering - naming convention, distributions, temporal, correlations
 * FIXED: Expertise weight - now uses pre-calculated userInfo.expertiseWeight instead of recalculating
 * FIXED: Content enrichment - integrates with contentEnrichmentService for proper score calculation
 * 
 * NEW FIX: userRating extraction for ALL components (metadata, research_field, research_problem, template, content)
 * - userRatings are now extracted at the aggregation layer and passed to all consuming components
 * - This replaces the previous approach of extracting userRatings in individual UI components
 * 
 * v2 FIX: qualityScore extraction for ALL components (was only extracted for metadata before)
 * - Now extracts from evaluationMetrics.quality.[component] for all 5 components
 */

// Import content enrichment service for enriching content data from systemData
import contentEnrichmentService from './contentEnrichmentService';

class AggregationService {
  constructor() {
    this.cache = new Map();
    this.enrichmentApplied = false;
  }

  // ============================================
  // CONTENT ENRICHMENT INTEGRATION
  // ============================================

  /**
   * Enrich evaluations with content data from systemData
   * This bridges the gap between systemData and evaluation metrics
   * 
   * @param {Array} evaluations - Array of evaluation objects
   * @param {Object} systemDataMap - Map of paperId -> systemData (optional)
   * @returns {Array} Enriched evaluations
   */
  enrichEvaluationsContent(evaluations, systemDataMap = null) {
    if (!evaluations || evaluations.length === 0) return evaluations;

    let enrichedCount = 0;
    
    evaluations.forEach(evaluation => {
      // Try to get systemData from multiple sources
      let systemData = null;
      
      // Source 1: Passed in systemDataMap
      if (systemDataMap) {
        const paperId = this.extractPaperId(evaluation);
        systemData = systemDataMap[paperId];
      }
      
      // Source 2: Attached to evaluation itself
      if (!systemData && evaluation.systemData) {
        systemData = evaluation.systemData;
      }
      
      // Source 3: Nested in evaluation object
      if (!systemData && evaluation.systemOutput) {
        systemData = evaluation.systemOutput;
      }
      
      if (systemData) {
        const result = contentEnrichmentService.enrichEvaluationContent(
          evaluation, 
          systemData, 
          evaluation.groundTruth || null
        );
        
        if (result.enriched) {
          enrichedCount++;
          console.log(`✓ [AGG] Enriched content for evaluation: ${result.enrichedCount} properties`);
        }
      }
    });

    if (enrichedCount > 0) {
      console.log(`📊 [AGG] Content enrichment complete: ${enrichedCount}/${evaluations.length} evaluations enriched`);
      this.enrichmentApplied = true;
    }

    return evaluations;
  }

  /**
   * Enrich integrated data structure (papers with evaluations and systemData)
   * Use this when you have the full three-way integrated data
   * 
   * @param {Object} integratedData - Object with papers array containing evaluations and systemData
   * @returns {Object} Enriched integrated data
   */
  enrichIntegratedData(integratedData) {
    if (!integratedData?.papers) {
      console.log('⚠️ [AGG] No papers in integrated data to enrich');
      return integratedData;
    }

    // Use the batch enrichment from contentEnrichmentService
    const enrichedData = contentEnrichmentService.enrichAllPapersContent(integratedData);
    this.enrichmentApplied = true;
    
    return enrichedData;
  }

  /**
   * Get content scores using enrichment service
   * Fallback method when direct extraction fails
   * 
   * @param {Object} evaluation - Single evaluation object
   * @returns {Object} Content scores {finalScore, accuracy, propertyCount}
   */
  getContentScoresFromEnrichment(evaluation) {
    return contentEnrichmentService.getContentScores(evaluation);
  }

  /**
   * Get grouped content statistics across all evaluations
   * 
   * @param {Object} integratedData - Integrated data structure
   * @returns {Object} Grouped content scores by property
   */
  getGroupedContentScores(integratedData) {
    return contentEnrichmentService.getGroupedContentScores(integratedData);
  }

  /**
   * Get overall content statistics
   * 
   * @param {Object} integratedData - Integrated data structure
   * @returns {Object} Overall content stats {mean, std, count, min, max}
   */
  getContentOverallStats(integratedData) {
    return contentEnrichmentService.getContentOverallStats(integratedData);
  }

  /**
   * Main aggregation function
   * Takes raw evaluation data and creates multi-dimensional aggregated view
   * 
   * @param {Array} evaluations - Array of evaluation objects from githubDataService
   * @param {Object} options - Optional configuration
   * @param {Object} options.systemDataMap - Map of paperId -> systemData for content enrichment
   * @param {Object} options.integratedData - Full integrated data structure (alternative to evaluations)
   * @returns {Object} Aggregated data structure
   */
  aggregateAll(evaluations, options = {}) {
    if (!evaluations || evaluations.length === 0) {
      return this.getEmptyAggregation();
    }

    // CONTENT ENRICHMENT: Enrich content data from systemData if available
    if (options.systemDataMap || evaluations.some(e => e.systemData || e.systemOutput)) {
      console.log('🔄 [AGG] Applying content enrichment...');
      evaluations = this.enrichEvaluationsContent(evaluations, options.systemDataMap);
    }

    // Store for reference
    this.cache.set('totalEvaluations', evaluations.length);

    const cacheKey = `aggregation_${evaluations.length}_${Date.now()}`;
    
    // Group data
    const byPaper = this.groupByPaper(evaluations);
    const byEvaluator = this.groupByEvaluator(evaluations);
    const byComponent = this.groupByComponent(evaluations);

    // Calculate aggregates
    const paperAggregates = this.aggregatePaperMetrics(byPaper);
    const evaluatorAggregates = this.aggregateEvaluatorMetrics(byEvaluator);
    const componentAggregates = this.aggregateComponentMetrics(byComponent, evaluations);
    const globalStats = this.calculateGlobalStats(evaluations);
    
    // CHART FIX: Add temporal data
    const temporal = this.buildTemporalData(evaluations);
    
    // CHART FIX: Add correlations
    const correlations = this.calculateCorrelations(paperAggregates);

    const result = {
      papers: paperAggregates,
      evaluators: evaluatorAggregates,
      components: componentAggregates,
      globalStats,
      temporal,
      correlations,
      metadata: {
        totalEvaluations: evaluations.length,
        totalPapers: Object.keys(byPaper).length,
        totalEvaluators: Object.keys(byEvaluator).length,
        timestamp: new Date().toISOString()
      }
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Group evaluations by paper (DOI/paper ID)
   */
  groupByPaper(evaluations) {
    const grouped = {};

    evaluations.forEach(evaluation => {
      const paperId = this.extractPaperId(evaluation);
      
      if (!grouped[paperId]) {
        grouped[paperId] = {
          paperId,
          metadata: this.extractPaperMetadata(evaluation),
          evaluations: []
        };
      }

      grouped[paperId].evaluations.push(evaluation);
    });

    return grouped;
  }

  /**
   * Group evaluations by evaluator
   */
  groupByEvaluator(evaluations) {
    const grouped = {};

    evaluations.forEach(evaluation => {
      const evaluatorId = this.extractEvaluatorId(evaluation);
      
      if (!grouped[evaluatorId]) {
        grouped[evaluatorId] = {
          evaluatorId,
          profile: evaluation.userInfo || {},
          evaluations: []
        };
      }

      grouped[evaluatorId].evaluations.push(evaluation);
    });

    return grouped;
  }

  /**
   * Group evaluations by component
   * CHART FIX: Changed to snake_case naming
   */
  groupByComponent(evaluations) {
    // FIXED: Use snake_case for consistency with charts
    const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const grouped = {};

    components.forEach(component => {
      grouped[component] = {
        component,
        evaluations: evaluations.filter(e => this.hasComponent(e, component))
      };
    });

    return grouped;
  }

  /**
   * Aggregate metrics for each paper
   */
  aggregatePaperMetrics(byPaper) {
    const paperAggregates = {};

    Object.entries(byPaper).forEach(([paperId, paperData]) => {
      const { evaluations, metadata } = paperData;

      console.log(`📄 Aggregating paper: ${paperId}`);
      console.log(`   - Number of evaluations: ${evaluations.length}`);
      console.log(`   - Evaluators:`, evaluations.map(e => this.extractEvaluatorId(e)));

      // Extract overall scores using the new helper
      const overallScores = evaluations
        .map(e => this.extractOverallScore(e))
        .filter(s => s > 0);

      console.log(`   - Overall scores:`, overallScores);
      console.log(`   - Mean score: ${this.mean(overallScores).toFixed(3)}`);

      paperAggregates[paperId] = {
        paperId,
        metadata,
        evaluationCount: evaluations.length,
        
        // Use overall scores for difficulty calculation
        difficulty: this.calculatePaperDifficulty(evaluations, overallScores),
        
        // CHART FIX: Aggregate each component with snake_case names
        // NEW FIX: Now includes userRatings for each component
        metadata: this.aggregateComponentForPaper(evaluations, 'metadata'),
        research_field: this.aggregateComponentForPaper(evaluations, 'research_field'),
        research_problem: this.aggregateComponentForPaper(evaluations, 'research_problem'),
        template: this.aggregateComponentForPaper(evaluations, 'template'),
        content: this.aggregateComponentForPaper(evaluations, 'content'),
        
        interRaterReliability: this.calculateIRRForPaper(evaluations),
        
        evaluators: evaluations.map(e => ({
          id: this.extractEvaluatorId(e),
          expertise: this.getExpertiseWeight(e.userInfo),  // FIXED: Use getter instead of recalculating
          timestamp: e.timestamp
        }))
      };

      console.log(`   - IRR:`, paperAggregates[paperId].interRaterReliability);
    });

    return paperAggregates;
  }

  /**
   * Aggregate component metrics for a specific paper
   * FIXED: Now properly handles research_problem and content with 0 scores
   * NEW FIX: Now extracts and aggregates userRatings for all components
   * BUG FIX: Weights array now stays aligned with scores array (was causing weighted_mean = mean)
   */
  aggregateComponentForPaper(evaluations, component) {
    // BUG FIX: Build component data WITH corresponding weights together
    // This ensures arrays stay aligned after filtering
    const dataWithWeights = evaluations
      .map(e => ({
        componentData: this.extractComponentData(e, component),
        weight: this.getExpertiseWeight(e.userInfo)
      }))
      .filter(item => item.componentData !== null);

    if (dataWithWeights.length === 0) {
      return null;
    }

    // Determine if we should include 0 scores
    const includeZeros = (component === 'research_problem' || component === 'content');
    
    // BUG FIX: Build parallel arrays that stay aligned
    const scores = [];
    const accuracyScores = [];
    const qualityScores = [];
    const userRatings = [];
    const normalizedRatings = [];
    const weightsForScores = [];
    const weightsForAccuracy = [];
    const weightsForQuality = [];
    const weightsForUserRatings = [];
    
    dataWithWeights.forEach(item => {
      const d = item.componentData;
      const weight = item.weight;
      
      // Overall scores
      const score = d.overallScore || 0;
      if (includeZeros || score > 0) {
        scores.push(score);
        weightsForScores.push(weight);
      }
      
      // Accuracy scores
      const accScore = d.accuracyScore || 0;
      if (includeZeros || accScore > 0) {
        accuracyScores.push(accScore);
        weightsForAccuracy.push(weight);
      }
      
      // Quality scores
      const qualScore = d.qualityScore || 0;
      if (includeZeros || qualScore > 0) {
        qualityScores.push(qualScore);
        weightsForQuality.push(weight);
      }
      
      // User ratings
      if (d.userRating !== null && d.userRating !== undefined) {
        userRatings.push(d.userRating);
        weightsForUserRatings.push(weight);
      }
      
      // Normalized ratings
      if (d.normalizedRating !== null && d.normalizedRating !== undefined && d.normalizedRating >= 0) {
        normalizedRatings.push(d.normalizedRating);
      }
    });
    
    // Extract componentData array for field-level aggregation
    const componentData = dataWithWeights.map(item => item.componentData);

    const result = {
      // BUG FIX: Each calculateStats call now gets matching scores and weights arrays
      scores: this.calculateStats(scores, weightsForScores),
      accuracyScores: this.calculateStats(accuracyScores, weightsForAccuracy),
      qualityScores: this.calculateStats(qualityScores, weightsForQuality),
      
      // userRatings with aligned weights
      userRatings: this.calculateStats(
        normalizedRatings.length > 0 ? normalizedRatings : userRatings.map(r => r / 5), 
        weightsForUserRatings
      ),
      
      // Raw user ratings (1-5 scale) for display
      rawUserRatings: this.calculateStats(userRatings, weightsForUserRatings),
      
      // Field-level breakdown (if applicable)
      byField: this.aggregateFieldLevelData(componentData, component),
      
      // Distribution (uses unweighted scores)
      distribution: this.calculateDistribution(scores),
      
      // Outliers
      outliers: this.detectOutliers(scores, evaluations),
      
      // Detailed userRating breakdown per field
      userRatingDetails: this.aggregateUserRatingDetails(componentData, component)
    };
    
    // Debug logging to verify fix
    if (scores.length > 1) {
      console.log(`📊 [AGG] ${component} weighted calculation:`, {
        scoresCount: scores.length,
        weightsCount: weightsForScores.length,
        weights: weightsForScores,
        mean: result.accuracyScores?.mean,
        weighted_mean: result.accuracyScores?.weighted_mean,
        difference: (result.accuracyScores?.weighted_mean - result.accuracyScores?.mean).toFixed(6)
      });
    }
    
    return result;
  }

  /**
   * NEW: Aggregate detailed userRating breakdown for components with multiple rating dimensions
   * @param {Array} componentData - Array of component data objects
   * @param {string} component - Component name
   * @returns {Object|null} Detailed userRating breakdown
   */
  aggregateUserRatingDetails(componentData, component) {
    if (!componentData || componentData.length === 0) return null;
    
    // Each component has different rating dimensions
    const ratingDimensions = {
      metadata: ['title', 'authors', 'doi', 'publication_year', 'venue'],
      research_field: ['primaryField', 'confidence', 'consistency', 'relevance'],
      research_problem: ['problemTitle', 'problemDescription', 'relevance', 'completeness', 'evidenceQuality'],
      template: ['titleAccuracy', 'descriptionQuality', 'propertyCoverage', 'researchAlignment'],
      content: ['propertyCoverage', 'evidenceQuality', 'valueAccuracy', 'confidenceCalibration']
    };
    
    const dimensions = ratingDimensions[component];
    if (!dimensions) return null;
    
    const result = {};
    
    dimensions.forEach(dim => {
      const dimRatings = componentData
        .map(d => {
          // Try different paths to find the rating
          if (d.userRatingDetails?.[dim]?.rating !== undefined) {
            return d.userRatingDetails[dim].rating;
          }
          if (d.userRatingDetails?.[dim] !== undefined && typeof d.userRatingDetails[dim] === 'number') {
            return d.userRatingDetails[dim];
          }
          if (d[dim]?.rating !== undefined) {
            return d[dim].rating;
          }
          if (d[dim]?.userRating !== undefined) {
            return d[dim].userRating;
          }
          // For metadata fields, check the field-level data
          if (component === 'metadata' && d[dim]?.scoreDetails?.normalizedRating !== undefined) {
            return d[dim].scoreDetails.normalizedRating * 5; // Convert back to 1-5 scale
          }
          return null;
        })
        .filter(r => r !== null && r !== undefined);
      
      if (dimRatings.length > 0) {
        result[dim] = {
          mean: this.mean(dimRatings),
          std: this.standardDeviation(dimRatings),
          count: dimRatings.length,
          min: Math.min(...dimRatings),
          max: Math.max(...dimRatings),
          // Normalized to 0-1 scale
          normalizedMean: this.mean(dimRatings) / 5
        };
      }
    });
    
    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Aggregate field-level data for components
   * CHART FIX: Updated to use snake_case
   */
  aggregateFieldLevelData(componentData, component) {
    if (component === 'metadata') {
      return this.aggregateMetadataFields(componentData);
    } else if (component === 'research_field') {
      return this.aggregateResearchFieldData(componentData);
    } else if (component === 'research_problem') {
      return this.aggregateResearchProblemData(componentData);
    } else if (component === 'template') {
      return this.aggregateTemplateData(componentData);
    } else if (component === 'content') {
      return this.aggregateContentData(componentData);
    }
    
    return null;
  }

  /**
   * Aggregate metadata fields (title, authors, doi, etc.)
   * UPDATED: Now includes userRatings per field
   */
  aggregateMetadataFields(componentData) {
    const fields = ['title', 'authors', 'doi', 'publication_year', 'venue'];
    const aggregated = {};

    fields.forEach(field => {
      const fieldScores = componentData
        .map(d => d[field]?.overallScore || d[field]?.accuracyScore || 0)
        .filter(s => s > 0);
      
      // NEW: Extract user ratings for each field
      const fieldUserRatings = componentData
        .map(d => {
          // Try different paths
          if (d[field]?.rating !== undefined) return d[field].rating;
          if (d[field]?.scoreDetails?.normalizedRating !== undefined) {
            return d[field].scoreDetails.normalizedRating * 5;
          }
          return null;
        })
        .filter(r => r !== null);

      if (fieldScores.length > 0 || fieldUserRatings.length > 0) {
        aggregated[field] = {
          mean: this.mean(fieldScores),
          std: this.standardDeviation(fieldScores),
          min: fieldScores.length > 0 ? Math.min(...fieldScores) : null,
          max: fieldScores.length > 0 ? Math.max(...fieldScores) : null,
          count: fieldScores.length,
          // NEW: Add userRating stats
          userRating: fieldUserRatings.length > 0 ? {
            mean: this.mean(fieldUserRatings),
            std: this.standardDeviation(fieldUserRatings),
            count: fieldUserRatings.length,
            normalizedMean: this.mean(fieldUserRatings) / 5
          } : null
        };
      }
    });

    return aggregated;
  }

  /**
   * Aggregate research field data
   */
  aggregateResearchFieldData(componentData) {
    const similarities = componentData
      .map(d => d.similarityData)
      .filter(s => s !== null);
    
    // NEW: Extract user ratings
    const userRatings = componentData
      .map(d => d.userRating)
      .filter(r => r !== null && r !== undefined);

    if (similarities.length === 0 && userRatings.length === 0) return null;

    return {
      averageSimilarity: this.mean(similarities.map(s => s.similarity || 0)),
      count: similarities.length,
      // NEW: Add userRating stats
      userRating: userRatings.length > 0 ? {
        mean: this.mean(userRatings),
        std: this.standardDeviation(userRatings),
        count: userRatings.length,
        normalizedMean: this.mean(userRatings) / 5
      } : null
    };
  }

  /**
   * Aggregate research problem data
   */
  aggregateResearchProblemData(componentData) {
    const classifications = componentData
      .map(d => d.classificationAccuracy)
      .filter(c => c !== null && c >= 0); // Changed: allow 0 values
    
    // NEW: Extract user ratings
    const userRatings = componentData
      .map(d => d.userRating)
      .filter(r => r !== null && r !== undefined);

    if (classifications.length === 0 && userRatings.length === 0) return null;

    return {
      averageClassificationAccuracy: this.mean(classifications),
      count: classifications.length,
      // NEW: Add userRating stats
      userRating: userRatings.length > 0 ? {
        mean: this.mean(userRatings),
        std: this.standardDeviation(userRatings),
        count: userRatings.length,
        normalizedMean: this.mean(userRatings) / 5
      } : null
    };
  }

  /**
   * Aggregate template data
   */
  aggregateTemplateData(componentData) {
    const ratings = componentData
      .map(d => d.userRating)
      .filter(r => r !== null);

    if (ratings.length === 0) return null;

    return {
      averageRating: this.mean(ratings),
      count: ratings.length,
      // NEW: Add normalized stats
      userRating: {
        mean: this.mean(ratings),
        std: this.standardDeviation(ratings),
        count: ratings.length,
        normalizedMean: this.mean(ratings) / 5
      }
    };
  }

  /**
   * Aggregate content data
   * IMPROVED: Uses enrichment service for better property-level aggregation
   */
  aggregateContentData(componentData) {
    // Try to get enriched scores from component data
    const enrichedScores = [];
    const propertyStats = {};
    
    // NEW: Extract user ratings
    const userRatings = componentData
      .map(d => d.userRating)
      .filter(r => r !== null && r !== undefined);
    
    componentData.forEach(d => {
      // Check for enriched properties
      if (d && typeof d === 'object') {
        // Get overall score
        const overallScore = d.overallScore || d.accuracyScore || 0;
        if (overallScore > 0) {
          enrichedScores.push(overallScore);
        }
        
        // Collect per-property stats
        const excludeKeys = ['overallScore', 'accuracyScore', 'timestamp', 'userRating', 'normalizedRating', 
                            'userRatingDetails', '_aggregate', '_enrichedFromService', 'qualityScore'];
        Object.keys(d).forEach(key => {
          if (excludeKeys.includes(key)) return;
          if (typeof d[key] === 'object' && d[key]?.score !== undefined) {
            if (!propertyStats[key]) {
              propertyStats[key] = { scores: [], label: key };
            }
            propertyStats[key].scores.push(d[key].score);
          }
        });
      }
    });
    
    // Calculate aggregated property stats
    const aggregatedProperties = {};
    Object.entries(propertyStats).forEach(([key, data]) => {
      if (data.scores.length > 0) {
        aggregatedProperties[key] = {
          mean: this.mean(data.scores),
          std: this.standardDeviation(data.scores),
          count: data.scores.length,
          label: data.label
        };
      }
    });

    if (enrichedScores.length === 0 && Object.keys(aggregatedProperties).length === 0 && userRatings.length === 0) {
      return null;
    }

    return {
      averageScore: enrichedScores.length > 0 ? this.mean(enrichedScores) : 0,
      count: enrichedScores.length,
      properties: aggregatedProperties,
      propertyCount: Object.keys(aggregatedProperties).length,
      _enriched: true,
      // NEW: Add userRating stats
      userRating: userRatings.length > 0 ? {
        mean: this.mean(userRatings),
        std: this.standardDeviation(userRatings),
        count: userRatings.length,
        normalizedMean: this.mean(userRatings) / 5
      } : null
    };
  }

  /**
   * Calculate paper difficulty based on evaluations
   */
  calculatePaperDifficulty(evaluations, overallScores) {
    if (overallScores.length === 0) {
      return {
        level: 'unknown',
        score: 0,
        reasoning: 'No scores available'
      };
    }

    const mean = this.mean(overallScores);
    const std = this.standardDeviation(overallScores);

    let level = 'medium';
    if (mean < 0.4) level = 'hard';
    else if (mean > 0.7) level = 'easy';

    return {
      level,
      score: mean,
      std,
      reasoning: `Based on ${overallScores.length} evaluation(s) with mean score ${mean.toFixed(2)}`
    };
  }

  /**
   * Calculate Inter-Rater Reliability for a paper
   */
  calculateIRRForPaper(evaluations) {
    if (evaluations.length < 2) {
      return {
        icc: null,
        agreement: null,
        reasoning: 'Need at least 2 evaluators'
      };
    }

    // Extract overall scores from all evaluators
    const scores = evaluations.map(e => this.extractOverallScore(e));

    // Calculate ICC (simplified version)
    const mean = this.mean(scores);
    const variance = this.variance(scores);
    const icc = variance > 0 ? 1 - (variance / (mean * (1 - mean))) : 1;

    // Calculate agreement percentage
    const threshold = 0.1; // 10% difference threshold
    let agreements = 0;
    let comparisons = 0;

    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        comparisons++;
        if (Math.abs(scores[i] - scores[j]) <= threshold) {
          agreements++;
        }
      }
    }

    const agreement = comparisons > 0 ? agreements / comparisons : 0;

    return {
      icc: Math.max(0, Math.min(1, icc)),
      agreement,
      reasoning: `Based on ${evaluations.length} evaluators with ${(agreement * 100).toFixed(1)}% agreement`
    };
  }

  /**
   * Aggregate evaluator metrics
   * FIXED: Now uses getExpertiseWeight to get the pre-calculated weight
   */
  aggregateEvaluatorMetrics(byEvaluator) {
    const evaluatorAggregates = {};

    Object.entries(byEvaluator).forEach(([evaluatorId, evaluatorData]) => {
      const { profile, evaluations } = evaluatorData;

      // Extract scores
      const scores = evaluations.map(e => this.extractOverallScore(e)).filter(s => s > 0);
      const completeness = evaluations.map(e => this.extractCompleteness(e));

      // FIXED: Use the pre-calculated expertise weight from profile
      const expertiseWeight = this.getExpertiseWeight(profile);

      evaluatorAggregates[evaluatorId] = {
        evaluatorId,
        profile: {
          ...profile,
          expertiseWeight,  // This now uses the actual stored value
          weightComponents: profile.weightComponents || this.getWeightComponents(profile),
          expertiseMultiplier: profile.expertiseMultiplier || this.calculateExpertiseMultiplier(profile)
        },
        evaluationCount: evaluations.length,
        performance: {
          meanScore: this.mean(scores),
          stdScore: this.standardDeviation(scores),
          meanCompleteness: this.mean(completeness)
        },
        consistency: this.calculateEvaluatorConsistency(evaluations),
        papersEvaluated: [...new Set(evaluations.map(e => this.extractPaperId(e)))]
      };
    });

    return evaluatorAggregates;
  }

  /**
   * Calculate evaluator consistency
   */
  calculateEvaluatorConsistency(evaluations) {
    if (evaluations.length < 2) {
      return {
        consistency: null,
        reasoning: 'Need multiple evaluations'
      };
    }

    const scores = evaluations.map(e => this.extractOverallScore(e));
    const std = this.standardDeviation(scores);
    const mean = this.mean(scores);

    // Coefficient of variation (lower is more consistent)
    const cv = mean > 0 ? std / mean : 0;

    return {
      consistency: 1 - Math.min(1, cv),
      std,
      cv,
      reasoning: `CV: ${cv.toFixed(2)}, STD: ${std.toFixed(2)}`
    };
  }

  /**
   * FIXED: Get expertise weight from profile - uses pre-calculated value
   * This is the primary method to get expertise weight
   * 
   * @param {Object} profile - User profile/userInfo object
   * @returns {number} Expertise weight (uses stored value, falls back to calculation)
   */
  getExpertiseWeight(profile) {
    if (!profile) return 1;

    // PRIORITY 1: Use the pre-calculated expertiseWeight if available
    if (profile.expertiseWeight !== undefined && profile.expertiseWeight !== null) {
      return profile.expertiseWeight;
    }

    // PRIORITY 2: Use weightComponents.finalWeight if available
    if (profile.weightComponents?.finalWeight !== undefined) {
      return profile.weightComponents.finalWeight;
    }

    // PRIORITY 3: Fall back to calculating (only if no pre-calculated value exists)
    console.warn('No pre-calculated expertiseWeight found, falling back to calculation');
    return this.calculateExpertiseWeight(profile);
  }

  /**
   * Calculate expertise weight (fallback only - prefer getExpertiseWeight)
   * This should only be used when no pre-calculated weight exists
   */
  calculateExpertiseWeight(profile) {
    if (!profile) return 1;

    let weight = 1;

    // Role weight (0.5 - 2.0)
    const roleWeights = {
      'PhD Student': 1,
      'Postdoc': 1.5,
      'PostDoc': 1.5,
      'Junior Researcher': 1.5,
      'Senior Researcher': 2,
      'Researcher': 1.5,
      'Professor': 2,
      'Master Student': 0.8,
      'Research Assistant': 1,
      'Other': 0.5
    };
    weight *= roleWeights[profile.role] || 1;

    // Domain expertise multiplier (0.5 - 2.0)
    const domainWeights = {
      'Novice': 0.5,
      'Basic': 0.6,
      'Beginner': 0.75,
      'Intermediate': 1,
      'Advanced': 1.5,
      'Expert': 2
    };
    weight *= domainWeights[profile.domainExpertise] || 1;

    // Experience multiplier (0.9 - 1.2)
    const expWeights = {
      'None': 0.9,
      'Limited': 0.95,
      'Moderate': 1,
      'Extensive': 1.1,
      'Expert': 1.2
    };
    weight *= expWeights[profile.evaluationExperience] || 1;

    // ORKG experience bonus (+0.1)
    if (profile.orkgExperience === 'used') {
      weight += 0.1;
    }

    return Math.round(weight * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get weight components breakdown
   */
  getWeightComponents(profile) {
    if (!profile) return null;

    // If already has weightComponents, return them
    if (profile.weightComponents) {
      return profile.weightComponents;
    }

    const roleWeights = {
      'PhD Student': 1,
      'Postdoc': 1.5,
      'PostDoc': 1.5,
      'Junior Researcher': 1.5,
      'Senior Researcher': 2,
      'Researcher': 1.5,
      'Professor': 2,
      'Master Student': 0.8,
      'Research Assistant': 1,
      'Other': 0.5
    };

    const domainWeights = {
      'Novice': 0.5,
      'Basic': 0.6,
      'Beginner': 0.75,
      'Intermediate': 1,
      'Advanced': 1.5,
      'Expert': 2
    };

    const expWeights = {
      'None': 0.9,
      'Limited': 0.95,
      'Moderate': 1,
      'Extensive': 1.1,
      'Expert': 1.2
    };

    const roleWeight = roleWeights[profile.role] || 1;
    const domainMultiplier = domainWeights[profile.domainExpertise] || 1;
    const experienceMultiplier = expWeights[profile.evaluationExperience] || 1;
    const orkgBonus = profile.orkgExperience === 'used' ? 0.1 : 0;

    return {
      roleWeight,
      domainMultiplier,
      experienceMultiplier,
      orkgBonus,
      finalWeight: Math.round((roleWeight * domainMultiplier * experienceMultiplier + orkgBonus) * 100) / 100
    };
  }

  /**
   * Calculate expertise multiplier
   */
  calculateExpertiseMultiplier(profile) {
    if (!profile) return 1;

    // If already has expertiseMultiplier, return it
    if (profile.expertiseMultiplier !== undefined) {
      return profile.expertiseMultiplier;
    }

    const domainWeights = {
      'Novice': 0.5,
      'Basic': 0.6,
      'Beginner': 0.75,
      'Intermediate': 1,
      'Advanced': 1.5,
      'Expert': 2
    };

    const expWeights = {
      'None': 0.9,
      'Limited': 0.95,
      'Moderate': 1,
      'Extensive': 1.1,
      'Expert': 1.2
    };

    const domainMult = domainWeights[profile.domainExpertise] || 1;
    const expMult = expWeights[profile.evaluationExperience] || 1;

    return Math.round((domainMult * expMult) * 100) / 100;
  }

  /**
   * Aggregate component metrics across all papers
   * CHART FIX: Added evaluations parameter for temporal data
   */
  aggregateComponentMetrics(byComponent, evaluations) {
    const componentAggregates = {};

    Object.entries(byComponent).forEach(([component, componentData]) => {
      const componentEvals = componentData.evaluations;

      if (componentEvals.length === 0) {
        componentAggregates[component] = null;
        return;
      }

      // Extract component scores
      const scores = componentEvals
        .map(e => this.extractComponentScore(e, component))
        .filter(s => s !== null && s >= 0); // Changed: allow 0 for research_problem/content
      
      // NEW: Extract userRatings for this component across all evaluations
      const userRatings = componentEvals
        .map(e => {
          const data = this.extractComponentData(e, component);
          return data?.userRating;
        })
        .filter(r => r !== null && r !== undefined);
      
      const normalizedRatings = componentEvals
        .map(e => {
          const data = this.extractComponentData(e, component);
          return data?.normalizedRating;
        })
        .filter(r => r !== null && r !== undefined && r >= 0);

      componentAggregates[component] = {
        evaluationCount: componentEvals.length,
        scores: {
          mean: this.mean(scores),
          std: this.standardDeviation(scores),
          median: this.median(scores),
          min: scores.length > 0 ? Math.min(...scores) : null,
          max: scores.length > 0 ? Math.max(...scores) : null,
          // CHART FIX: Add distribution to component scores
          distribution: this.calculateDistribution(scores)
        },
        // NEW: Add userRatings to component aggregates
        userRatings: {
          mean: normalizedRatings.length > 0 ? this.mean(normalizedRatings) : (userRatings.length > 0 ? this.mean(userRatings) / 5 : null),
          std: normalizedRatings.length > 0 ? this.standardDeviation(normalizedRatings) : (userRatings.length > 0 ? this.standardDeviation(userRatings.map(r => r / 5)) : null),
          count: normalizedRatings.length || userRatings.length,
          rawMean: userRatings.length > 0 ? this.mean(userRatings) : null,
          distribution: this.calculateDistribution(normalizedRatings.length > 0 ? normalizedRatings : userRatings.map(r => r / 5))
        },
        byPaper: this.calculateComponentByPaper(componentEvals, component)
      };
    });

    return componentAggregates;
  }

  /**
   * Calculate component metrics by paper
   * FIXED: Now properly handles research_problem and content with 0 scores
   * CHART FIX: Updated to use snake_case
   */
  calculateComponentByPaper(evaluations, component) {
    const byPaper = {};

    evaluations.forEach(evaluation => {
      const paperId = this.extractPaperId(evaluation);
      const score = this.extractComponentScore(evaluation, component);
      
      // NEW: Extract userRating for this evaluation
      const componentData = this.extractComponentData(evaluation, component);
      const userRating = componentData?.userRating;
      const normalizedRating = componentData?.normalizedRating;

      if (!byPaper[paperId]) {
        byPaper[paperId] = {
          paperId,
          scores: [],
          userRatings: [],
          normalizedRatings: [],
          evaluatorCount: 0
        };
      }

      // Special handling for research_problem and content which may have 0 scores
      // but should still be counted if the component was evaluated
      if (component === 'research_problem' || component === 'content') {
        if (componentData !== null) {
          // Component was evaluated, include the score even if 0
          byPaper[paperId].scores.push(score !== null ? score : 0);
          byPaper[paperId].evaluatorCount++;
          console.log(`✓ ${component} score for ${paperId}: ${score}`);
        }
      } else {
        // For other components, only include positive scores
        if (score !== null && score > 0) {
          byPaper[paperId].scores.push(score);
          byPaper[paperId].evaluatorCount++;
        }
      }
      
      // NEW: Add userRatings
      if (userRating !== null && userRating !== undefined) {
        byPaper[paperId].userRatings.push(userRating);
      }
      if (normalizedRating !== null && normalizedRating !== undefined) {
        byPaper[paperId].normalizedRatings.push(normalizedRating);
      }
    });

    // Calculate stats for each paper
    Object.values(byPaper).forEach(paper => {
      paper.mean = this.mean(paper.scores);
      paper.std = this.standardDeviation(paper.scores);
      // NEW: Add userRating stats
      paper.userRatingMean = paper.normalizedRatings.length > 0 
        ? this.mean(paper.normalizedRatings)
        : (paper.userRatings.length > 0 ? this.mean(paper.userRatings) / 5 : null);
      paper.userRatingRawMean = paper.userRatings.length > 0 ? this.mean(paper.userRatings) : null;
    });

    return byPaper;
  }

  /**
   * Calculate distribution
   * CHART FIX: Enhanced distribution calculation
   */
  calculateDistribution(scores) {
    if (!scores || scores.length === 0) return null;

    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const distribution = {
      '0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0
    };

    scores.forEach(score => {
      if (score <= 0.2) distribution['0-0.2']++;
      else if (score <= 0.4) distribution['0.2-0.4']++;
      else if (score <= 0.6) distribution['0.4-0.6']++;
      else if (score <= 0.8) distribution['0.6-0.8']++;
      else distribution['0.8-1.0']++;
    });

    return distribution;
  }

  /**
   * CHART FIX: Build temporal data for TimeSeriesChart
   */
  buildTemporalData(evaluations) {
    const byDate = {};
    
    evaluations.forEach(evals => {
      const date = new Date(evals.timestamp).toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { scores: [], count: 0 };
      }
      
      const overallScore = this.extractOverallScore(evals);
      if (overallScore > 0) {
        byDate[date].scores.push(overallScore);
        byDate[date].count++;
      }
    });
    
    const timeline = Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgScore: data.scores.length > 0 ? this.mean(data.scores) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return { timeline };
  }

  /**
   * CHART FIX: Calculate correlations for CorrelationHeatmap
   */
  calculateCorrelations(papers) {
    const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const correlations = {};
    
    // Extract score arrays for each component
    const scoreArrays = {};
    components.forEach(comp => {
      scoreArrays[comp] = [];
      Object.values(papers).forEach(paper => {
        if (paper[comp]?.scores?.mean !== undefined && paper[comp].scores.mean !== null) {
          scoreArrays[comp].push(paper[comp].scores.mean);
        }
      });
    });
    
    // Calculate pairwise correlations
    for (let i = 0; i < components.length; i++) {
      for (let j = i; j < components.length; j++) {
        const comp1 = components[i];
        const comp2 = components[j];
        const key = `${comp1}-${comp2}`;
        
        if (i === j) {
          correlations[key] = 1.0; // Perfect correlation with self
        } else {
          correlations[key] = this.pearsonCorrelation(
            scoreArrays[comp1],
            scoreArrays[comp2]
          );
        }
      }
    }
    
    return correlations;
  }

  /**
   * CHART FIX: Calculate Pearson correlation coefficient
   */
  pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);
    
    const sum_x = xSlice.reduce((a, b) => a + b, 0);
    const sum_y = ySlice.reduce((a, b) => a + b, 0);
    const sum_xy = xSlice.reduce((sum, xi, i) => sum + xi * ySlice[i], 0);
    const sum_x2 = xSlice.reduce((sum, xi) => sum + xi * xi, 0);
    const sum_y2 = ySlice.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sum_xy - sum_x * sum_y;
    const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Detect outliers using IQR method
   */
  detectOutliers(scores, evaluations) {
    if (scores.length < 3) return [];

    const sorted = [...scores].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = [];
    scores.forEach((score, index) => {
      if (score < lowerBound || score > upperBound) {
        outliers.push({
          score,
          evaluatorId: this.extractEvaluatorId(evaluations[index]),
          type: score < lowerBound ? 'low' : 'high'
        });
      }
    });

    return outliers;
  }

  /**
   * Calculate global statistics
   * FIXED: Now uses getExpertiseWeight to get pre-calculated weights
   * NEW: Includes global userRating statistics
   */
  calculateGlobalStats(evaluations) {
    // Extract all scores
    const allScores = evaluations
      .map(e => this.extractOverallScore(e))
      .filter(s => s > 0);

    // Extract completeness
    const completeness = evaluations.map(e => this.extractCompleteness(e));

    // FIXED: Extract expertise weights using getExpertiseWeight (uses pre-calculated values)
    // FIXED: Extract expertise weights AND multipliers
    const expertiseWeights = evaluations
      .map(e => this.getExpertiseWeight(e.userInfo))
      .filter(w => w > 0);

    // NEW: Also extract expertise multipliers (the 1.0-2.0 scale value)
    const expertiseMultipliers = evaluations
      .map(e => e.userInfo?.expertiseMultiplier)
      .filter(m => m !== undefined && m !== null && m > 0);


    console.log('📊 Global Stats - Expertise weights:', expertiseWeights);
    console.log('📊 Global Stats - Expertise mean:', this.mean(expertiseWeights));

    // Component coverage - CHART FIX: Use snake_case
    const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const coverageByComponent = {};
    
    // NEW: Track userRatings by component for global stats
    const userRatingsByComponent = {};

    components.forEach(component => {
      const count = evaluations.filter(e => this.hasComponent(e, component)).length;
      coverageByComponent[component] = {
        count,
        rate: evaluations.length > 0 ? count / evaluations.length : 0
      };
      
      // NEW: Collect userRatings for each component
      const componentUserRatings = evaluations
        .map(e => {
          const data = this.extractComponentData(e, component);
          return data?.normalizedRating ?? (data?.userRating ? data.userRating / 5 : null);
        })
        .filter(r => r !== null && r !== undefined);
      
      userRatingsByComponent[component] = {
        mean: componentUserRatings.length > 0 ? this.mean(componentUserRatings) : null,
        std: componentUserRatings.length > 0 ? this.standardDeviation(componentUserRatings) : null,
        count: componentUserRatings.length
      };
    });

    // Expertise distribution
    const roleDistribution = {};
    const levelDistribution = {
      junior: 0,
      intermediate: 0,
      senior: 0,
      expert: 0
    };

    evaluations.forEach(e => {
      const role = e.userInfo?.role || 'Unknown';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;

      const domain = e.userInfo?.domainExpertise || 'Intermediate';
      if (['Novice', 'Basic', 'Beginner'].includes(domain)) levelDistribution.junior++;
      else if (domain === 'Intermediate') levelDistribution.intermediate++;
      else if (domain === 'Advanced') levelDistribution.senior++;
      else if (domain === 'Expert') levelDistribution.expert++;
    });

    return {
      totalEvaluations: evaluations.length,
      totalPapers: new Set(evaluations.map(e => this.extractPaperId(e))).size,
      totalEvaluators: new Set(evaluations.map(e => this.extractEvaluatorId(e))).size,
      
      scores: {
        mean: this.mean(allScores),
        std: this.standardDeviation(allScores),
        median: this.median(allScores),
        min: allScores.length > 0 ? Math.min(...allScores) : 0,
        max: allScores.length > 0 ? Math.max(...allScores) : 0,
        // CHART FIX: Add distribution to globalStats
        distribution: this.calculateDistribution(allScores)
      },
      
      completeness: {
        mean: this.mean(completeness),
        std: this.standardDeviation(completeness)
      },
      
      expertise: {
        mean: this.mean(expertiseMultipliers),  // Changed from expertiseWeights
        std: this.standardDeviation(expertiseMultipliers),  // Changed from expertiseWeights
        // Keep weight stats available if needed
        weightMean: this.mean(expertiseWeights),
        weightStd: this.standardDeviation(expertiseWeights),
        distribution: {
          byRole: roleDistribution,
          byLevel: levelDistribution
        }
      },
      
      coverageByComponent,
      
      // NEW: Add userRatings by component to global stats
      userRatingsByComponent,
      
      // Content enrichment status
      enrichment: {
        applied: this.enrichmentApplied,
        contentScoresAvailable: coverageByComponent.content?.count > 0,
        timestamp: this.enrichmentApplied ? new Date().toISOString() : null
      }
    };
  }

  /**
   * Calculate statistics with optional weights
   */
  calculateStats(values, weights = null) {
    if (values.length === 0) {
      return {
        mean: 0,
        weighted_mean: 0,
        std: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
        distribution: null
      };
    }

    return {
      mean: this.mean(values),
      weighted_mean: weights ? this.weightedMean(values, weights) : this.mean(values),
      std: this.standardDeviation(values),
      median: this.median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      distribution: this.calculateDistribution(values)
    };
  }

  // ============================================
  // EXTRACTION HELPERS
  // ============================================

  /**
   * Extract paper ID from evaluation
   */
  extractPaperId(evaluation) {
    return evaluation.token || evaluation.paperId || 'unknown';
  }

  /**
   * Extract evaluator ID from evaluation
   */
  extractEvaluatorId(evaluation) {
    return evaluation.userInfo?.email || evaluation.evaluatorId || 'unknown';
  }

  /**
   * Extract paper metadata from evaluation
   */
  extractPaperMetadata(evaluation) {
    // Access the overall section which has aggregated metadata
    // The overall section is nested inside evaluationMetrics
    const overall = evaluation.evaluationMetrics?.overall;
    if (!overall) return null;

    const metadata = overall.metadata;
    if (!metadata) return null;

    return {
      title: metadata.title?.extractedValue || metadata.title?.referenceValue || null,
      authors: metadata.authors?.extractedValue || metadata.authors?.referenceValue || null,
      doi: metadata.doi?.extractedValue || metadata.doi?.referenceValue || null,
      publication_year: metadata.publication_year?.extractedValue || metadata.publication_year?.referenceValue || null,
      venue: metadata.venue?.extractedValue || metadata.venue?.referenceValue || null
    };
  }

  /**
   * Check if evaluation has a specific component
   * CHART FIX: Updated to use snake_case
   */
  hasComponent(evaluation, component) {
    // Check in the overall section where aggregated scores are
    // The overall section is nested inside evaluationMetrics
    const overall = evaluation.evaluationMetrics?.overall;
    if (!overall) return false;
    
    if (component === 'metadata') {
      return !!(overall.metadata);
    } else if (component === 'research_field') {
      return !!(overall.research_field);
    } else if (component === 'research_problem') {
      return !!(overall.research_problem);
    } else if (component === 'template') {
      return !!(overall.template);
    } else if (component === 'content') {
      return !!(overall.content);
    }
    
    return false;
  }

  /**
   * Extract component data from evaluation
   * Handles the actual nested structure
   * Structure: evaluation.evaluationMetrics.overall.[component] for scores
   * 
   * FIXED: Correct paths for research_problem and content
   * - research_problem: overall.research_problem.overall.research_problem.accuracy.scoreDetails.finalScore
   * - content: aggregates from overall.content.[propertyName].score
   * 
   * NEW FIX: Now extracts userRating and normalizedRating for ALL components
   * 
   * v2 FIX: Now extracts qualityScore for ALL components (was only metadata before)
   */
  extractComponentData(evaluation, component) {
    // Use the overall section which has aggregated scores
    // The overall section is nested inside evaluationMetrics
    const overall = evaluation.evaluationMetrics?.overall;
    const accuracy = evaluation.evaluationMetrics?.accuracy;
    const quality = evaluation.evaluationMetrics?.quality;
    
    if (!overall && !accuracy) return null;
    
    if (component === 'metadata') {
      // Structure: evaluation.evaluationMetrics.overall.metadata with field-level scores
      const metadata = overall?.metadata;
      const metadataAccuracy = accuracy?.metadata;
      if (!metadata && !metadataAccuracy) return null;
      
      // Extract field-level userRatings
      const fieldUserRatings = {};
      const metadataFields = ['Title Extraction', 'Authors Extraction', 'DOI Extraction', 'Publication Year', 'Venue/Journal'];
      const fieldMapping = {
        'Title Extraction': 'title',
        'Authors Extraction': 'authors', 
        'DOI Extraction': 'doi',
        'Publication Year': 'publication_year',
        'Venue/Journal': 'venue'
      };
      
      // Calculate overall userRating from field-level ratings
      const fieldRatings = [];
      const normalizedFieldRatings = [];
      
      metadataFields.forEach(fieldKey => {
        const field = metadataAccuracy?.[fieldKey];
        if (field) {
          const mappedKey = fieldMapping[fieldKey];
          fieldUserRatings[mappedKey] = {
            rating: field.rating,
            normalizedRating: field.scoreDetails?.normalizedRating,
            expertiseMultiplier: field.expertiseMultiplier
          };
          if (field.rating !== undefined) fieldRatings.push(field.rating);
          if (field.scoreDetails?.normalizedRating !== undefined) {
            normalizedFieldRatings.push(field.scoreDetails.normalizedRating);
          }
        }
      });
      
      // Calculate aggregate userRating for metadata
      const avgUserRating = fieldRatings.length > 0 ? this.mean(fieldRatings) : null;
      const avgNormalizedRating = normalizedFieldRatings.length > 0 ? this.mean(normalizedFieldRatings) : null;
      
      // v2 FIX: Extract quality score from evaluationMetrics.quality.metadata
      const metadataQuality = quality?.metadata;
      let qualityScore = metadata?.overall?.qualityScore ?? 0;
      
      // If no overall quality, aggregate from field-level quality
      if (qualityScore === 0 && metadataQuality && typeof metadataQuality === 'object') {
        const fieldQualityScores = [];
        Object.keys(metadataQuality).forEach(key => {
          const fieldData = metadataQuality[key];
          if (fieldData) {
            const fieldScore = fieldData?.scoreDetails?.finalScore ??
                               fieldData?.qualityData?.overallScore ??
                               fieldData?.qualityScore ?? null;
            if (fieldScore !== null && fieldScore !== undefined) {
              fieldQualityScores.push(fieldScore);
            }
          }
        });
        if (fieldQualityScores.length > 0) {
          qualityScore = fieldQualityScores.reduce((a, b) => a + b, 0) / fieldQualityScores.length;
        }
      }
      
      return {
        ...metadata,
        overallScore: metadata?.overall?.overallScore || 0,
        accuracyScore: metadata?.overall?.accuracyScore || 0,
        qualityScore: qualityScore,  // v2 FIX: Now extracted from quality path
        // NEW: Add userRating data
        userRating: avgUserRating,
        normalizedRating: avgNormalizedRating,
        userRatingDetails: fieldUserRatings,
        // Include individual field scores
        title: metadata?.title || metadataAccuracy?.['Title Extraction'],
        authors: metadata?.authors || metadataAccuracy?.['Authors Extraction'],
        doi: metadata?.doi || metadataAccuracy?.['DOI Extraction'],
        publication_year: metadata?.publication_year || metadataAccuracy?.['Publication Year'],
        venue: metadata?.venue || metadataAccuracy?.['Venue/Journal']
      };
      
    } else if (component === 'research_field') {
      // Structure: evaluation.evaluationMetrics.overall.research_field
      const field = overall?.research_field;
      const fieldAccuracy = accuracy?.researchField;
      if (!field && !fieldAccuracy) return null;
      
      // Extract userRating from the research_field data
      // Paths: overall.research_field has rating fields, accuracy.researchField has rating and scoreDetails
      const userRating = fieldAccuracy?.rating ?? field?.primaryField?.rating ?? null;
      const normalizedRating = fieldAccuracy?.scoreDetails?.normalizedRating ?? 
                               field?.accuracyMetrics?.scoreDetails?.normalizedRating ?? null;
      
      // v2 FIX: Extract quality score from evaluationMetrics.quality.researchField
      const rfQuality = quality?.researchField || quality?.research_field;
      const qualityScore = rfQuality?.scoreDetails?.finalScore ??
                           rfQuality?.qualityData?.overallScore ??
                           rfQuality?.overallScore ??
                           field?.qualityScore ?? 0;
      
      return {
        overallScore: field?.overallScore || field?.accuracyMetrics?.overallAccuracy?.value || 0,
        accuracyScore: field?.accuracyScore || field?.accuracyMetrics?.automatedScore?.value || 0,
        qualityScore: qualityScore,  // v2 FIX: Now extracted from quality path
        similarityData: field?.similarityData || fieldAccuracy?.similarityData || null,
        // NEW: Add userRating data
        userRating: userRating,
        normalizedRating: normalizedRating,
        userRatingDetails: {
          primaryField: field?.primaryField?.rating,
          confidence: field?.confidence?.rating,
          consistency: field?.consistency?.rating,
          relevance: field?.relevance?.rating
        }
      };
      
    } else if (component === 'research_problem') {
      // FIXED: Multiple paths to find research_problem score
      const problem = overall?.research_problem;
      console.log('🔍 [AGG] Research Problem - Keys:', problem ? Object.keys(problem) : 'null');
      if (!problem) return null;
      
      let overallScore = 0;
      let accuracyScore = 0;
      let userRating = null;
      let normalizedRating = null;
      let userRatingDetails = null;
      
      // PATH 1: Nested structure - overall.research_problem.overall.research_problem
      const nestedProblem = problem.overall?.research_problem;
      if (nestedProblem) {
        console.log('🔍 [AGG] Found nested research_problem, keys:', Object.keys(nestedProblem));
        
        // Extract userRatings from nested structure
        if (nestedProblem.userRatings) {
          userRatingDetails = {
            problemTitle: nestedProblem.userRatings.problemTitle?.rating,
            problemDescription: nestedProblem.userRatings.problemDescription?.rating,
            relevance: nestedProblem.userRatings.relevance?.rating,
            completeness: nestedProblem.userRatings.completeness?.rating,
            evidenceQuality: nestedProblem.userRatings.evidenceQuality?.rating
          };
          userRating = nestedProblem.userRatings.overallRating ?? null;
          
          // Calculate normalized rating from individual ratings if overall not available
          if (userRating === null) {
            const ratings = Object.values(userRatingDetails).filter(r => r !== null && r !== undefined);
            userRating = ratings.length > 0 ? this.mean(ratings) : null;
          }
          normalizedRating = userRating ? userRating / 5 : null;
        }
        
        const accur = nestedProblem.accuracy;
        if (accur) {
          console.log('🔍 [AGG] Found accuracy, keys:', Object.keys(accur));
          // Try all possible score locations
          accuracyScore = accur.scoreDetails?.finalScore 
                       ?? accur.overallAccuracy?.finalScore 
                       ?? accur.finalScore
                       ?? accur.score
                       ?? 0;
          overallScore = accuracyScore;
          console.log(`🔍 [AGG] Path 1 - accuracy score: ${accuracyScore}`);
        }
        
        // Also check for direct score on nested
        if (overallScore === 0) {
          overallScore = nestedProblem.overallScore ?? nestedProblem.score ?? 0;
          accuracyScore = (accuracyScore || nestedProblem.accuracyScore) ?? 0;
          console.log(`🔍 [AGG] Path 1b - nested direct score: ${overallScore}`);
        }
      }
      
      // PATH 2: Direct accuracy on problem level
      if (overallScore === 0 && problem.accuracy) {
        const accur = problem.accuracy;
        accuracyScore = accur.scoreDetails?.finalScore 
                     ?? accur.overallAccuracy?.finalScore 
                     ?? accur.finalScore
                     ?? accur.score
                     ?? 0;
        overallScore = accuracyScore;
        console.log(`🔍 [AGG] Path 2 - direct accuracy: ${accuracyScore}`);
      }
      
      // PATH 3: Direct properties on problem
      if (overallScore === 0) {
        overallScore = problem.overallScore ?? problem.score ?? 0;
        accuracyScore = (accuracyScore || problem.accuracyScore) ?? 0;
        console.log(`🔍 [AGG] Path 3 - direct props: ${overallScore}`);
      }
      
      // PATH 4: Scores sub-object
      if (overallScore === 0 && problem.scores) {
        overallScore = problem.scores.overallScore ?? problem.scores.finalScore ?? 0;
        accuracyScore = (accuracyScore || problem.scores.accuracyScore) ?? 0;
        console.log(`🔍 [AGG] Path 4 - scores object: ${overallScore}`);
      }
      
      // PATH 5: Deep search for any 'finalScore' or 'score' property
      if (overallScore === 0) {
        const findScore = (obj, depth = 0) => {
          if (depth > 4 || !obj || typeof obj !== 'object') return 0;
          if (obj.finalScore !== undefined) return obj.finalScore;
          if (obj.score !== undefined && typeof obj.score === 'number') return obj.score;
          for (const key of Object.keys(obj)) {
            const found = findScore(obj[key], depth + 1);
            if (found > 0) return found;
          }
          return 0;
        };
        overallScore = findScore(problem);
        accuracyScore = accuracyScore || overallScore;
        console.log(`🔍 [AGG] Path 5 - deep search: ${overallScore}`);
      }
      
      // Also try to get userRating from accuracy path if not found
      if (userRating === null && accuracy?.researchProblem) {
        userRating = accuracy.researchProblem.rating ?? null;
        normalizedRating = accuracy.researchProblem.scoreDetails?.normalizedRating ?? null;
      }
      
      // v2 FIX: Extract quality score from evaluationMetrics.quality.researchProblem
      const rpQuality = quality?.researchProblem || quality?.research_problem;
      let qualityScore = rpQuality?.scoreDetails?.finalScore ??
                         rpQuality?.qualityData?.overallScore ??
                         rpQuality?.overallScore ??
                         nestedProblem?.quality?.overallScore ?? 0;
      // Fallback to overallScore if quality still 0
      if (qualityScore === 0) qualityScore = overallScore;
      
      const result = {
        overallScore: overallScore,
        accuracyScore: accuracyScore,
        qualityScore: qualityScore,  // v2 FIX: Now extracted from quality path
        classificationAccuracy: accuracyScore || 0,
        // NEW: Add userRating data
        userRating: userRating,
        normalizedRating: normalizedRating,
        userRatingDetails: userRatingDetails
      };
      
      console.log('🔍 [AGG] Research Problem FINAL result:', result);
      return result;
      
    } else if (component === 'template') {
      // Structure: evaluation.evaluationMetrics.overall.template (with userRating)
      const template = overall?.template;
      const templateAccuracy = accuracy?.template?.template;
      if (!template && !templateAccuracy) return null;
      
      // Extract userRatings from template
      // Paths: overall.template has titleAccuracy, descriptionQuality, propertyCoverage, researchAlignment
      const userRatingDetails = {
        titleAccuracy: template?.titleAccuracy,
        descriptionQuality: template?.descriptionQuality,
        propertyCoverage: template?.propertyCoverage,
        researchAlignment: template?.researchAlignment
      };
      
      // Calculate overall userRating from individual ratings
      const ratings = Object.values(userRatingDetails).filter(r => r !== null && r !== undefined && typeof r === 'number');
      const userRating = ratings.length > 0 ? this.mean(ratings) : null;
      const normalizedRating = templateAccuracy?.scoreDetails?.normalizedRating ?? (userRating ? userRating / 5 : null);
      
      // v2 FIX: Extract quality score from evaluationMetrics.quality.template
      const templateQuality = quality?.template;
      let qualityScore = templateQuality?.scoreDetails?.finalScore ??
                         templateQuality?.qualityData?.overallScore ??
                         templateQuality?.overallScore ??
                         template?.qualityScore ?? 0;
      // Fallback to overallScore if quality still 0
      const overallScore = template?.overallScore || templateAccuracy?.scoreDetails?.finalScore || 0;
      if (qualityScore === 0) qualityScore = overallScore;
      
      return {
        overallScore: overallScore,
        accuracyScore: template?.accuracyScore || templateAccuracy?.scoreDetails?.automatedScore || 0,
        qualityScore: qualityScore,  // v2 FIX: Now extracted from quality path
        // NEW: Add userRating data  
        userRating: userRating,
        normalizedRating: normalizedRating,
        userRatingDetails: userRatingDetails
      };
      
    } else if (component === 'content') {
      // FIXED: Multiple paths to find content scores
      const content = overall?.content;
      console.log('🔍 [AGG] Content - Keys:', content ? Object.keys(content) : 'null');
      if (!content) return null;
      
      let overallScore = 0;
      let accuracyScore = 0;
      let userRating = null;
      let normalizedRating = null;
      let userRatingDetails = null;
      
      // Extract userRatings from content
      // Path: overall.content.userRatings
      if (content.userRatings) {
        userRatingDetails = {
          propertyCoverage: content.userRatings.propertyCoverage,
          evidenceQuality: content.userRatings.evidenceQuality,
          valueAccuracy: content.userRatings.valueAccuracy,
          confidenceCalibration: content.userRatings.confidenceCalibration
        };
        
        // Calculate overall userRating from individual ratings
        const ratings = Object.values(userRatingDetails).filter(r => r !== null && r !== undefined && typeof r === 'number' && r > 0);
        userRating = ratings.length > 0 ? this.mean(ratings) : null;
        normalizedRating = userRating ? userRating / 5 : null;
      }
      
      // PATH 1: Aggregate from property-level scores (primary approach)
      const excludeKeys = ['overallScore', 'accuracyScore', 'timestamp', 'config', 'scores', 'userRatings', 'overall'];
      const propertyKeys = Object.keys(content).filter(k => !excludeKeys.includes(k) && typeof content[k] === 'object');
      
      console.log('🔍 [AGG] Content property keys:', propertyKeys);
      
      if (propertyKeys.length > 0) {
        const propertyScores = [];
        
        propertyKeys.forEach(key => {
          const prop = content[key];
          if (!prop || typeof prop !== 'object') return;
          
          // Try multiple score locations within each property
          let score = null;
          
          // Direct score fields
          if (prop.score !== undefined && prop.score !== null) score = prop.score;
          else if (prop.accuracyScore !== undefined) score = prop.accuracyScore;
          else if (prop.overallScore !== undefined) score = prop.overallScore;
          else if (prop.finalScore !== undefined) score = prop.finalScore;
          
          // Nested in accuracy object
          if (score === null && prop.accuracy) {
            score = prop.accuracy.score ?? prop.accuracy.finalScore ?? prop.accuracy.overallScore ?? null;
          }
          
          // Nested in scores object
          if (score === null && prop.scores) {
            score = prop.scores.score ?? prop.scores.finalScore ?? prop.scores.overallScore ?? null;
          }
          
          console.log(`   [AGG] Property "${key}": score = ${score}`);
          
          if (score !== null && score !== undefined && typeof score === 'number') {
            propertyScores.push(score);
          }
        });
        
        console.log('🔍 [AGG] Content property scores collected:', propertyScores);
        
        if (propertyScores.length > 0) {
          overallScore = propertyScores.reduce((a, b) => a + b, 0) / propertyScores.length;
          accuracyScore = overallScore;
          console.log(`🔍 [AGG] Path 1 - aggregated: ${overallScore} from ${propertyScores.length} props`);
        }
      }
      
      // PATH 2: Direct overallScore/accuracyScore on content
      if (overallScore === 0) {
        overallScore = content.overallScore ?? content.score ?? 0;
        accuracyScore = content.accuracyScore ?? overallScore;
        console.log(`🔍 [AGG] Path 2 - direct: ${overallScore}`);
      }
      
      // PATH 3: Nested scores object
      if (overallScore === 0 && content.scores) {
        overallScore = content.scores.overallScore ?? content.scores.finalScore ?? 0;
        accuracyScore = content.scores.accuracyScore ?? overallScore;
        console.log(`🔍 [AGG] Path 3 - scores object: ${overallScore}`);
      }
      
      // PATH 4: Nested overall object
      if (overallScore === 0 && content.overall) {
        overallScore = content.overall.overallScore ?? content.overall.score ?? 0;
        accuracyScore = content.overall.accuracyScore ?? overallScore;
        console.log(`🔍 [AGG] Path 4 - overall object: ${overallScore}`);
      }
      
      // PATH 5: Deep search for scores
      if (overallScore === 0) {
        const allScores = [];
        const collectScores = (obj, depth = 0) => {
          if (depth > 3 || !obj || typeof obj !== 'object') return;
          if (obj.score !== undefined && typeof obj.score === 'number') allScores.push(obj.score);
          if (obj.finalScore !== undefined && typeof obj.finalScore === 'number') allScores.push(obj.finalScore);
          for (const key of Object.keys(obj)) {
            if (!excludeKeys.includes(key)) {
              collectScores(obj[key], depth + 1);
            }
          }
        };
        collectScores(content);
        if (allScores.length > 0) {
          overallScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
          accuracyScore = overallScore;
          console.log(`🔍 [AGG] Path 5 - deep search: ${overallScore} from ${allScores.length} scores`);
        }
      }
      
      // PATH 6: ENRICHMENT SERVICE FALLBACK
      // If still no score, try the enrichment service (handles _aggregate and enriched data)
      if (overallScore === 0) {
        // Check for _aggregate from enrichment
        if (content._aggregate?.mean !== undefined) {
          overallScore = content._aggregate.mean;
          accuracyScore = overallScore;
          console.log(`🔍 [AGG] Path 6a - enrichment _aggregate: ${overallScore}`);
        } else {
          // Try the enrichment service helper
          const enrichedScores = this.getContentScoresFromEnrichment(evaluation);
          if (enrichedScores.finalScore > 0) {
            overallScore = enrichedScores.finalScore;
            accuracyScore = enrichedScores.accuracy;
            console.log(`🔍 [AGG] Path 6b - enrichment service: ${overallScore}`);
          }
        }
      }
      
      // v2 FIX: Extract quality score from evaluationMetrics.quality.content
      const contentQuality = quality?.content;
      let qualityScore = 0;
      
      // For content, aggregate quality from property-level if available
      if (contentQuality && typeof contentQuality === 'object') {
        const propQualityScores = [];
        Object.keys(contentQuality).forEach(key => {
          if (['overallScore', 'timestamp', 'config', '_aggregate'].includes(key)) return;
          const propData = contentQuality[key];
          if (propData) {
            const propScore = propData?.scoreDetails?.finalScore ??
                              propData?.qualityData?.overallScore ??
                              propData?.qualityScore ?? null;
            if (propScore !== null && propScore !== undefined) {
              propQualityScores.push(propScore);
            }
          }
        });
        if (propQualityScores.length > 0) {
          qualityScore = propQualityScores.reduce((a, b) => a + b, 0) / propQualityScores.length;
        }
      }
      // Fallback to overallScore if quality still 0
      if (qualityScore === 0) qualityScore = overallScore;
      
      const result = {
        overallScore: overallScore,
        accuracyScore: accuracyScore,
        qualityScore: qualityScore,  // v2 FIX: Now extracted from quality path
        // NEW: Add userRating data
        userRating: userRating,
        normalizedRating: normalizedRating,
        userRatingDetails: userRatingDetails,
        _enrichedFromService: overallScore > 0 && this.enrichmentApplied
      };
      
      console.log('🔍 [AGG] Content FINAL result:', result);
      return result;
    }
    
    return null;
  }

  /**
   * Extract component score from evaluation
   * Based on actual nested data structure
   * CHART FIX: Updated to use snake_case
   */
  extractComponentScore(evaluation, component) {
    const data = this.extractComponentData(evaluation, component);
    if (!data) return null;

    // For metadata, calculate average across fields if overall not available
    if (component === 'metadata' && (!data.overallScore || data.overallScore === 0)) {
      const fields = ['title', 'authors', 'doi', 'publication_year', 'venue'];
      const fieldScores = [];
      
      fields.forEach(field => {
        if (data[field]) {
          const score = data[field].overallScore || 
                       data[field].accuracyScore || 
                       0;
          if (score > 0) {
            fieldScores.push(score);
          }
        }
      });
      
      if (fieldScores.length > 0) {
        return this.mean(fieldScores);
      }
    }
    
    // Return the overallScore if available (including 0 for research_problem/content)
    // For research_problem and content, 0 is a valid score
    if (component === 'research_problem' || component === 'content') {
      if (data.overallScore !== undefined && data.overallScore !== null) {
        return data.overallScore;
      }
      if (data.accuracyScore !== undefined && data.accuracyScore !== null) {
        return data.accuracyScore;
      }
      return 0; // Return 0 as valid score for these components
    }
    
    // For other components, only return positive scores
    if (data.overallScore !== undefined && data.overallScore !== null && data.overallScore > 0) {
      return data.overallScore;
    }
    
    if (data.accuracyScore !== undefined && data.accuracyScore !== null && data.accuracyScore > 0) {
      return data.accuracyScore;
    }

    return null;
  }

  /**
   * Extract overall score from evaluation
   * Calculate from all available components in the overall section
   * CHART FIX: Updated to use snake_case
   */
  extractOverallScore(evaluation) {
    // Access the overall section which has component scores
    // The overall section is nested inside evaluationMetrics
    const overall = evaluation.evaluationMetrics?.overall;
    if (!overall) return 0;
    
    // CHART FIX: Use snake_case component names
    const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const componentScores = [];
    
    components.forEach(c => {
      const score = this.extractComponentScore(evaluation, c);
      // For research_problem and content, include 0 scores
      if (c === 'research_problem' || c === 'content') {
        if (score !== null) {
          componentScores.push(score);
        }
      } else {
        // For other components, only include positive scores
        if (score !== null && score > 0) {
          componentScores.push(score);
        }
      }
    });
    
    if (componentScores.length > 0) {
      return this.mean(componentScores);
    }
    
    // Also check for additional sections (these are at evaluationMetrics level)
    const additionalScores = [];
    
    // System Performance (rating out of 5, normalize to 0-1)
    if (evaluation.evaluationMetrics?.systemPerformance?.systemPerformance?.overall?.rating) {
      additionalScores.push(evaluation.evaluationMetrics.systemPerformance.systemPerformance.overall.rating / 5);
    }
    
    // Innovation (rating out of 5, normalize to 0-1)
    if (evaluation.evaluationMetrics?.innovation?.innovation?.overall?.rating) {
      additionalScores.push(evaluation.evaluationMetrics.innovation.innovation.overall.rating / 5);
    }
    
    // Comparative Analysis (rating out of 5, normalize to 0-1)
    if (evaluation.evaluationMetrics?.comparativeAnalysis?.comparativeAnalysis?.overall?.rating) {
      additionalScores.push(evaluation.evaluationMetrics.comparativeAnalysis.comparativeAnalysis.overall.rating / 5);
    }
    
    // RAG Highlight (rating out of 5, normalize to 0-1)
    if (evaluation.evaluationMetrics?.ragHighlight?.ragHighlight?.overall?.rating) {
      additionalScores.push(evaluation.evaluationMetrics.ragHighlight.ragHighlight.overall.rating / 5);
    }
    
    if (additionalScores.length > 0) {
      return this.mean([...componentScores, ...additionalScores]);
    }
    
    return 0;
  }

  /**
   * Extract completeness from evaluation
   * CHART FIX: Updated to use snake_case
   */
  extractCompleteness(evaluation) {
    // Access the overall section which has component data
    // The overall section is nested inside evaluationMetrics
    const overall = evaluation.evaluationMetrics?.overall;
    if (!overall) return 0;
    
    // Calculate based on available components - CHART FIX: Use snake_case
    const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const available = components.filter(c => this.hasComponent(evaluation, c)).length;
    
    // Also check additional sections (these are at evaluationMetrics level)
    const additionalSections = [
      evaluation.evaluationMetrics?.systemPerformance?.systemPerformance?.overall?.rating,
      evaluation.evaluationMetrics?.innovation?.innovation?.overall?.rating,
      evaluation.evaluationMetrics?.comparativeAnalysis?.comparativeAnalysis?.overall?.rating,
      evaluation.evaluationMetrics?.ragHighlight?.ragHighlight?.overall?.rating
    ].filter(s => s !== undefined && s !== null).length;
    
    const totalAvailable = available + additionalSections;
    const totalPossible = components.length + 4; // 5 core components + 4 additional sections
    
    return totalAvailable / totalPossible;
  }

  // ============================================
  // STATISTICAL FUNCTIONS
  // ============================================

  mean(values) {
    if (!values || values.length === 0) return 0;
    const validValues = values.filter(v => !isNaN(v) && v !== null && v !== undefined);
    if (validValues.length === 0) return 0;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  weightedMean(values, weights) {
    if (!values || values.length === 0 || values.length !== weights.length) return 0;
    
    const validPairs = values.map((v, i) => ({ v, w: weights[i] }))
      .filter(pair => !isNaN(pair.v) && pair.v !== null && pair.v !== undefined);
    
    if (validPairs.length === 0) return 0;
    
    const weightedSum = validPairs.reduce((sum, pair) => sum + pair.v * pair.w, 0);
    const weightSum = validPairs.reduce((sum, pair) => sum + pair.w, 0);
    
    if (weightSum === 0) return 0;
    return weightedSum / weightSum;
  }

  median(values) {
    if (!values || values.length === 0) return 0;
    
    const validValues = values.filter(v => !isNaN(v) && v !== null && v !== undefined);
    if (validValues.length === 0) return 0;
    
    const sorted = [...validValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  variance(values) {
    if (!values || values.length === 0) return 0;
    
    const validValues = values.filter(v => !isNaN(v) && v !== null && v !== undefined);
    if (validValues.length === 0) return 0;
    
    const mean = this.mean(validValues);
    return validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
  }

  standardDeviation(values) {
    return Math.sqrt(this.variance(values));
  }

  medianAbsoluteDeviation(values, median) {
    if (!values || values.length === 0) return 0;
    
    const validValues = values.filter(v => !isNaN(v) && v !== null && v !== undefined);
    if (validValues.length === 0) return 0;
    
    const deviations = validValues.map(val => Math.abs(val - median));
    return this.median(deviations);
  }

  /**
   * Get empty aggregation structure
   */
  getEmptyAggregation() {
    return {
      papers: {},
      evaluators: {},
      components: {},
      globalStats: {
        totalEvaluations: 0,
        totalPapers: 0,
        totalEvaluators: 0,
        scores: { mean: 0, std: 0, min: 0, max: 0, median: 0, distribution: null },
        expertise: { mean: 0, std: 0, distribution: { byRole: {}, byLevel: {} } },
        completeness: { mean: 0, std: 0 },
        coverageByComponent: {},
        userRatingsByComponent: {}
      },
      temporal: { timeline: [] },
      correlations: {},
      metadata: {
        totalEvaluations: 0,
        totalPapers: 0,
        totalEvaluators: 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default new AggregationService();