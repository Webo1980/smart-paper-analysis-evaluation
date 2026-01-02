/**
 * MetricsExtractor Utility - v2
 * 
 * v2 FIXES:
 * 1. Don't filter out zero values - they are valid scores
 * 2. Better fallback paths for all components
 * 3. More robust null/undefined handling
 * 4. Correct snake_case/camelCase path handling
 * 
 * Data Path Reference (from Evaluation_Object_Data_Structure_Documentation.md):
 * - Accuracy: evaluationMetrics.accuracy.[component]
 * - Quality: evaluationMetrics.quality.[component]  
 * - Overall: evaluationMetrics.overall.[component]
 */

class MetricsExtractor {
  /**
   * Extract all granular accuracy metrics from evaluation for a specific component
   */
  static extractAccuracyMetrics(evaluation, component, field = null) {
    if (!evaluation?.evaluationMetrics) return null;

    const accuracy = evaluation.evaluationMetrics.accuracy;
    // Data structure: evaluationMetrics.overall
    const overall = evaluation.evaluationMetrics.overall;
    
    if (!accuracy && !overall) return null;

    // For metadata, extract field-specific metrics
    if (component === 'metadata' && field) {
      const metadataAccuracy = accuracy?.metadata;
      if (!metadataAccuracy) return null;
      
      const fieldData = metadataAccuracy[field];
      if (!fieldData) return null;

      const similarity = fieldData.similarityData || {};
      const scoreDetails = fieldData.scoreDetails || {};

      return {
        levenshtein: similarity.levenshtein !== undefined ? {
          score: typeof similarity.levenshtein === 'number' ? similarity.levenshtein : (similarity.levenshtein?.score ?? 0),
          distance: similarity.levenshtein?.distance,
          weightedScore: similarity.levenshtein?.weightedScore,
          maxLength: similarity.levenshtein?.maxLength
        } : null,
        tokenMatching: similarity.tokenMatching !== undefined ? {
          score: typeof similarity.tokenMatching === 'number' ? similarity.tokenMatching : (similarity.tokenMatching?.score ?? 0),
          precision: similarity.tokenMatching?.precision ?? similarity.tokenDetails?.precision,
          recall: similarity.tokenMatching?.recall ?? similarity.tokenDetails?.recall,
          f1Score: similarity.tokenMatching?.f1Score ?? similarity.tokenDetails?.f1Score,
          commonTokens: similarity.tokenMatching?.commonTokens,
          totalTokens: similarity.tokenMatching?.totalTokens
        } : null,
        specialChar: similarity.specialChar !== undefined ? {
          score: typeof similarity.specialChar === 'number' ? similarity.specialChar : (similarity.specialChar?.score ?? 0),
          preserved: similarity.specialChar?.preserved,
          total: similarity.specialChar?.total
        } : null,
        automated: similarity.overallScore ?? similarity.automatedOverallScore ?? null,
        final: scoreDetails.finalScore ?? null,
        userRating: scoreDetails.normalizedRating,
        weights: {
          automatic: scoreDetails.automaticWeight,
          user: scoreDetails.userWeight
        }
      };
    }

    // For research_field
    if (component === 'research_field') {
      // Try multiple paths
      const rfAccuracy = accuracy?.researchField?.researchField || accuracy?.researchField || 
                         accuracy?.research_field?.research_field || accuracy?.research_field;
      const rfOverall = overall?.research_field;
      
      const accuracyMetrics = rfOverall?.accuracyMetrics || {};
      const similarity = rfAccuracy?.similarityData || {};
      const scoreDetails = rfOverall?.accuracyMetrics?.scoreDetails || rfAccuracy?.scoreDetails || {};

      return {
        exactMatch: accuracyMetrics.exactMatch?.value === 1 || rfOverall?.matchStatus === 'exact' || similarity.exactMatch || false,
        recall: accuracyMetrics.recall?.value ?? rfOverall?.recall ?? similarity.recall ?? null,
        topN: accuracyMetrics.topN?.value ?? similarity.topN ?? null,
        hierarchyAlignment: similarity.hierarchyAlignment ?? null,
        rankPosition: accuracyMetrics.foundPosition ?? rfOverall?.positionInResults ?? similarity.rankPosition,
        totalCandidates: similarity.totalCandidates,
        positionScore: accuracyMetrics.positionScore?.value ?? null,
        precision: accuracyMetrics.precision?.value ?? null,
        f1Score: accuracyMetrics.f1Score?.value ?? null,
        automated: accuracyMetrics.automatedScore?.value ?? similarity.automatedOverallScore ?? similarity.overallScore ?? null,
        final: accuracyMetrics.overallAccuracy?.value ?? scoreDetails.finalScore ?? rfOverall?.overallScore ?? null
      };
    }

    // For research_problem
    if (component === 'research_problem') {
      const rpNested = overall?.research_problem?.overall?.research_problem;
      const rpAccuracy = accuracy?.researchProblem?.researchProblem || accuracy?.researchProblem ||
                         accuracy?.research_problem?.research_problem || accuracy?.research_problem;
      
      const rpAccuracyData = rpNested?.accuracy || rpAccuracy || {};
      const similarityData = rpAccuracyData?.similarityData || {};
      const scoreDetails = rpAccuracyData?.scoreDetails || {};
      const overallAccuracy = rpAccuracyData?.overallAccuracy || {};
      const rpScores = rpNested?.scores || {};

      return {
        titleAlignment: similarityData.titleAlignment ?? null,
        contentCoverage: similarityData.contentCoverage ?? null,
        titleTokenMetrics: similarityData.titleTokenMetrics || {},
        descriptionTokenMetrics: similarityData.descriptionTokenMetrics || {},
        semanticSimilarity: similarityData.semanticSimilarity,
        precision: rpAccuracyData.precision?.value ?? similarityData.precision ?? null,
        recall: rpAccuracyData.recall?.value ?? similarityData.recall ?? null,
        f1Score: rpAccuracyData.f1Score?.value ?? similarityData.f1Score ?? null,
        final: overallAccuracy.finalScore ?? scoreDetails.finalScore ?? rpScores.overallScore ?? null,
        automated: overallAccuracy.automated ?? similarityData.automatedOverallScore ?? null
      };
    }

    // For template
    if (component === 'template') {
      const templateAccuracy = accuracy?.template?.template || accuracy?.template;
      const templateOverall = overall?.template;
      
      const similarity = templateAccuracy?.similarityData || templateOverall?.similarityData || {};
      const scoreDetails = templateAccuracy?.scoreDetails || {};

      return {
        propertyOverlap: similarity.propertyOverlap ?? null,
        structuralSimilarity: similarity.structuralSimilarity ?? null,
        matchedProperties: similarity.matchedProperties || [],
        missingProperties: similarity.missingProperties || [],
        extraProperties: similarity.extraProperties || [],
        titleAccuracy: templateOverall?.titleAccuracy ?? null,
        descriptionQuality: templateOverall?.descriptionQuality ?? null,
        propertyCoverage: templateOverall?.propertyCoverage ?? null,
        final: templateOverall?.overallScore ?? scoreDetails.finalScore ?? null,
        automated: similarity.automatedOverallScore ?? similarity.overallScore ?? null
      };
    }

    // For content
    if (component === 'content') {
      const contentAccuracy = accuracy?.content;
      const contentOverall = overall?.content;
      const contentMetrics = {};
      
      if (contentOverall && typeof contentOverall === 'object') {
        Object.keys(contentOverall).forEach(propertyName => {
          if (['overallScore', 'timestamp', 'config', '_aggregate', 'userRatings'].includes(propertyName)) return;
          
          const propData = contentOverall[propertyName];
          if (propData && typeof propData === 'object') {
            contentMetrics[propertyName] = {
              valueAccuracy: propData.accuracyScore ?? propData.score ?? null,
              score: propData.score ?? null,
              accuracyScore: propData.accuracyScore ?? null,
              qualityScore: propData.qualityScore ?? null,
              dataTypeMatch: propData.metadata?.templateProperty?.dataType ? true : false,
              completeness: propData.metadata?.evaluationContext?.evaluationDataAvailable ? 1 : 0,
              final: propData.score ?? propData.accuracyScore ?? null
            };
          }
        });
      }
      
      if (contentAccuracy && typeof contentAccuracy === 'object') {
        Object.keys(contentAccuracy).forEach(propertyName => {
          const propData = contentAccuracy[propertyName];
          if (propData) {
            if (!contentMetrics[propertyName]) {
              contentMetrics[propertyName] = {};
            }
            contentMetrics[propertyName].valueAccuracy = propData.similarityData?.valueAccuracy ?? propData.similarity ?? propData.f1Score ?? contentMetrics[propertyName]?.valueAccuracy ?? null;
            contentMetrics[propertyName].precision = propData.precision ?? null;
            contentMetrics[propertyName].recall = propData.recall ?? null;
            contentMetrics[propertyName].f1Score = propData.f1Score ?? null;
          }
        });
      }

      return Object.keys(contentMetrics).length > 0 ? contentMetrics : null;
    }

    return null;
  }

  /**
   * Extract all quality metrics from evaluation for a specific component
   */
  static extractQualityMetrics(evaluation, component, field = null) {
    if (!evaluation?.evaluationMetrics) return null;

    const quality = evaluation.evaluationMetrics.quality;
    // Data structure: evaluationMetrics.overall
    const overall = evaluation.evaluationMetrics.overall;
    
    if (!quality && !overall) return null;

    // For metadata fields
    if (component === 'metadata' && field) {
      const metadataQuality = quality?.metadata;
      if (!metadataQuality) return null;
      
      const fieldData = metadataQuality[field];
      if (!fieldData) return null;

      const qualityData = fieldData.qualityData || {};
      const metrics = qualityData.fieldSpecificMetrics || {};
      const scoreDetails = fieldData.scoreDetails || {};

      return {
        completeness: {
          score: metrics.completeness?.score ?? null,
          issues: metrics.completeness?.issues || [],
          details: metrics.completeness?.details
        },
        consistency: {
          score: metrics.consistency?.score ?? null,
          issues: metrics.consistency?.issues || [],
          details: metrics.consistency?.details
        },
        validity: {
          score: metrics.validity?.score ?? null,
          issues: metrics.validity?.issues || [],
          details: metrics.validity?.details
        },
        automated: qualityData.automatedOverallScore ?? qualityData.overallScore ?? null,
        final: scoreDetails.finalScore ?? qualityData.overallScore ?? null,
        userRating: scoreDetails.normalizedRating
      };
    }

    // For research_field
    if (component === 'research_field') {
      const rfQuality = quality?.researchField || quality?.research_field;
      const rfOverall = overall?.research_field;
      
      if (!rfQuality && !rfOverall) return null;
      
      const qualityData = rfQuality?.qualityData || rfQuality || {};
      const scoreDetails = rfQuality?.scoreDetails || rfOverall?.accuracyMetrics?.scoreDetails || {};

      return {
        completeness: {
          score: qualityData.completeness ?? qualityData.fieldSpecificMetrics?.completeness?.score ?? null,
          issues: qualityData.fieldSpecificMetrics?.completeness?.issues || []
        },
        consistency: {
          score: rfOverall?.consistency?.rating ? rfOverall.consistency.rating / 5 : (qualityData.consistency ?? null),
          issues: qualityData.fieldSpecificMetrics?.consistency?.issues || []
        },
        validity: {
          score: qualityData.validity ?? qualityData.fieldSpecificMetrics?.validity?.score ?? null,
          issues: qualityData.fieldSpecificMetrics?.validity?.issues || []
        },
        confidence: rfOverall?.confidence?.rating ? rfOverall.confidence.rating / 5 : (qualityData.confidence ?? null),
        relevance: {
          score: rfOverall?.relevance?.rating ? rfOverall.relevance.rating / 5 : (qualityData.relevance ?? null),
          issues: []
        },
        automated: qualityData.automatedOverallScore ?? qualityData.overallScore ?? null,
        final: scoreDetails.finalScore ?? rfOverall?.accuracyMetrics?.overallAccuracy?.value ?? qualityData.overallScore ?? null
      };
    }

    // For research_problem
    if (component === 'research_problem') {
      const rpNested = overall?.research_problem?.overall?.research_problem;
      const rpQuality = quality?.researchProblem || quality?.research_problem;
      
      const rpQualityData = rpNested?.quality || rpQuality?.qualityData || rpQuality || {};
      const userRatings = rpNested?.userRatings || {};
      const qualityAnalysis = rpNested?.qualityAnalysis || {};
      const scoreDetails = rpQualityData?.scoreDetails || rpNested?.quality?.scoreDetails || {};
      const rpScores = rpNested?.scores || {};
      
      const fieldMetrics = rpQualityData?.fieldSpecificMetrics || {};

      return {
        completeness: {
          score: userRatings.completeness?.rating ? userRatings.completeness.rating / 5 : 
                 (fieldMetrics.problemDescription?.score ?? qualityAnalysis.problemDescription?.score ?? null),
          issues: fieldMetrics.problemDescription?.issues || []
        },
        consistency: {
          score: fieldMetrics.problemTitle?.score ?? qualityAnalysis.problemTitle?.score ?? null,
          issues: fieldMetrics.problemTitle?.issues || []
        },
        validity: {
          score: fieldMetrics.relevance?.score ?? qualityAnalysis.relevance?.score ?? null,
          issues: fieldMetrics.relevance?.issues || []
        },
        relevance: {
          score: userRatings.relevance?.rating ? userRatings.relevance.rating / 5 :
                 (fieldMetrics.relevance?.score ?? qualityAnalysis.relevance?.score ?? null),
          issues: fieldMetrics.relevance?.issues || []
        },
        titleQuality: userRatings.problemTitle?.rating ? userRatings.problemTitle.rating / 5 :
                      (qualityAnalysis.problemTitle?.score ?? rpQualityData.problemTitle?.value?.score ?? null),
        descriptionQuality: userRatings.problemDescription?.rating ? userRatings.problemDescription.rating / 5 :
                           (qualityAnalysis.problemDescription?.score ?? rpQualityData.problemDescription?.value?.score ?? null),
        evidenceQuality: userRatings.evidenceQuality?.rating ? userRatings.evidenceQuality.rating / 5 :
                        (qualityAnalysis.evidenceQuality?.score ?? rpQualityData.evidenceQuality?.value?.score ?? null),
        automated: rpQualityData?.automatedOverallScore ?? rpQualityData?.qualityData?.automatedOverallScore ?? null,
        final: rpNested?.accuracy?.overallAccuracy?.finalScore ?? rpScores.qualityScore ?? scoreDetails.finalScore ?? null
      };
    }

    // For template
    if (component === 'template') {
      const templateQuality = quality?.template;
      const templateOverall = overall?.template;
      
      if (!templateQuality && !templateOverall) return null;
      
      const qualityData = templateQuality?.qualityData || templateQuality || {};
      const scoreDetails = templateQuality?.scoreDetails || {};

      return {
        completeness: {
          score: qualityData.completeness ?? qualityData.fieldSpecificMetrics?.completeness?.score ?? null,
          issues: qualityData.fieldSpecificMetrics?.completeness?.issues || []
        },
        consistency: {
          score: qualityData.consistency ?? qualityData.fieldSpecificMetrics?.consistency?.score ?? null,
          issues: qualityData.fieldSpecificMetrics?.consistency?.issues || []
        },
        validity: {
          score: qualityData.validity ?? qualityData.fieldSpecificMetrics?.validity?.score ?? null,
          issues: qualityData.fieldSpecificMetrics?.validity?.issues || []
        },
        relevance: qualityData.relevance ? {
          score: qualityData.relevance,
          issues: []
        } : null,
        automated: qualityData.automatedOverallScore ?? qualityData.overallScore ?? null,
        final: scoreDetails.finalScore ?? templateOverall?.overallScore ?? qualityData.overallScore ?? null
      };
    }

    // For content
    if (component === 'content') {
      const contentQuality = quality?.content;
      const contentOverall = overall?.content;
      
      const result = {
        completeness: { score: null, issues: [] },
        consistency: { score: null, issues: [] },
        validity: { score: null, issues: [] },
        properties: {},
        final: null
      };
      
      const allCompleteness = [];
      const allConsistency = [];
      const allValidity = [];
      const allFinal = [];
      
      if (contentQuality && typeof contentQuality === 'object') {
        Object.entries(contentQuality).forEach(([propertyName, propData]) => {
          if (['overallScore', 'timestamp', 'config', '_aggregate', 'userRatings'].includes(propertyName)) return;
          
          const qualityData = propData?.qualityData || propData || {};
          
          const comp = qualityData.completeness?.score ?? qualityData.completeness ?? null;
          const cons = qualityData.consistency?.score ?? qualityData.consistency ?? null;
          const val = qualityData.validity?.score ?? qualityData.validity ?? null;
          
          if (comp !== null) allCompleteness.push(comp);
          if (cons !== null) allConsistency.push(cons);
          if (val !== null) allValidity.push(val);
          
          const propFinal = propData?.scoreDetails?.finalScore ?? qualityData.overallScore ?? propData?.qualityScore ?? null;
          if (propFinal !== null) allFinal.push(propFinal);
          
          result.properties[propertyName] = {
            completeness: comp,
            consistency: cons,
            validity: val,
            final: propFinal,
            issues: qualityData.completeness?.issues || qualityData.issues || []
          };
        });
      }
      
      if (contentOverall && typeof contentOverall === 'object' && Object.keys(result.properties).length === 0) {
        Object.entries(contentOverall).forEach(([propertyName, propData]) => {
          if (['overallScore', 'timestamp', 'config', '_aggregate', 'userRatings'].includes(propertyName)) return;
          if (!propData || typeof propData !== 'object') return;
          
          const qualityScore = propData.qualityScore ?? null;
          if (qualityScore !== null) allFinal.push(qualityScore);
          
          result.properties[propertyName] = {
            completeness: null,
            consistency: null,
            validity: null,
            final: qualityScore,
            issues: []
          };
        });
      }
      
      // Calculate averages - only from non-null values
      if (allCompleteness.length > 0) {
        result.completeness.score = allCompleteness.reduce((a,b) => a+b, 0) / allCompleteness.length;
      }
      if (allConsistency.length > 0) {
        result.consistency.score = allConsistency.reduce((a,b) => a+b, 0) / allConsistency.length;
      }
      if (allValidity.length > 0) {
        result.validity.score = allValidity.reduce((a,b) => a+b, 0) / allValidity.length;
      }
      if (allFinal.length > 0) {
        result.final = allFinal.reduce((a,b) => a+b, 0) / allFinal.length;
      }

      return result;
    }

    return null;
  }

  /**
   * Aggregate metrics across multiple evaluations
   * v2: Fixed to not filter out zeros - they are valid scores
   */
  static aggregateMetrics(evaluations, component, field = null, metricType = 'accuracy') {
    if (!evaluations || evaluations.length === 0) {
      console.log(`MetricsExtractor: No evaluations provided for ${component}`);
      return null;
    }

    console.log(`MetricsExtractor: Aggregating ${metricType} for ${component}${field ? '.' + field : ''} (${evaluations.length} evaluations)`);

    const allMetrics = evaluations.map(evaluation => {
      if (metricType === 'accuracy') {
        return this.extractAccuracyMetrics(evaluation, component, field);
      } else {
        return this.extractQualityMetrics(evaluation, component, field);
      }
    }).filter(m => m !== null);

    console.log(`MetricsExtractor: Extracted ${allMetrics.length} valid metrics`);

    if (allMetrics.length === 0) return null;

    const result = {};

    // For accuracy metrics
    if (metricType === 'accuracy') {
      if (component === 'metadata' && field) {
        // v2: Don't filter out zeros - use isValidNumber helper
        result.levenshtein = this.calculateStats(allMetrics.map(m => m.levenshtein?.score).filter(this.isValidNumber));
        result.tokenMatching = this.calculateStats(allMetrics.map(m => m.tokenMatching?.score).filter(this.isValidNumber));
        result.specialChar = this.calculateStats(allMetrics.map(m => m.specialChar?.score).filter(this.isValidNumber));
        result.automated = this.calculateStats(allMetrics.map(m => m.automated).filter(this.isValidNumber));
        result.final = this.calculateStats(allMetrics.map(m => m.final).filter(this.isValidNumber));

        result.tokenDetails = {
          precision: this.calculateStats(allMetrics.map(m => m.tokenMatching?.precision).filter(this.isValidNumber)),
          recall: this.calculateStats(allMetrics.map(m => m.tokenMatching?.recall).filter(this.isValidNumber)),
          f1Score: this.calculateStats(allMetrics.map(m => m.tokenMatching?.f1Score).filter(this.isValidNumber))
        };

      } else if (component === 'research_field') {
        result.exactMatchRate = {
          count: allMetrics.filter(m => m.exactMatch === true).length,
          total: allMetrics.length,
          rate: allMetrics.filter(m => m.exactMatch === true).length / allMetrics.length
        };
        // v2: Include zeros in calculations
        result.recall = this.calculateStats(allMetrics.map(m => m.recall).filter(this.isValidNumber));
        result.hierarchyAlignment = this.calculateStats(allMetrics.map(m => m.hierarchyAlignment).filter(this.isValidNumber));
        result.final = this.calculateStats(allMetrics.map(m => m.final).filter(this.isValidNumber));

      } else if (component === 'research_problem') {
        // v2: Include zeros - they are valid scores
        result.titleAlignment = this.calculateStats(allMetrics.map(m => m.titleAlignment).filter(this.isValidNumber));
        result.contentCoverage = this.calculateStats(allMetrics.map(m => m.contentCoverage).filter(this.isValidNumber));
        result.precision = this.calculateStats(allMetrics.map(m => m.precision).filter(this.isValidNumber));
        result.recall = this.calculateStats(allMetrics.map(m => m.recall).filter(this.isValidNumber));
        result.f1Score = this.calculateStats(allMetrics.map(m => m.f1Score).filter(this.isValidNumber));
        result.final = this.calculateStats(allMetrics.map(m => m.final).filter(this.isValidNumber));

      } else if (component === 'template') {
        result.propertyOverlap = this.calculateStats(allMetrics.map(m => m.propertyOverlap).filter(this.isValidNumber));
        result.structuralSimilarity = this.calculateStats(allMetrics.map(m => m.structuralSimilarity).filter(this.isValidNumber));
        result.titleAccuracy = this.calculateStats(allMetrics.map(m => m.titleAccuracy).filter(this.isValidNumber));
        result.descriptionQuality = this.calculateStats(allMetrics.map(m => m.descriptionQuality).filter(this.isValidNumber));
        result.propertyCoverage = this.calculateStats(allMetrics.map(m => m.propertyCoverage).filter(this.isValidNumber));
        result.final = this.calculateStats(allMetrics.map(m => m.final).filter(this.isValidNumber));

      } else if (component === 'content') {
        const allProperties = new Set();
        allMetrics.forEach(m => {
          if (m && typeof m === 'object') {
            Object.keys(m).forEach(prop => allProperties.add(prop));
          }
        });

        result.properties = {};
        const allFinalScores = [];
        
        allProperties.forEach(prop => {
          const propValues = allMetrics
            .map(m => m?.[prop]?.valueAccuracy ?? m?.[prop]?.f1Score ?? m?.[prop]?.final ?? m?.[prop]?.overallScore)
            .filter(this.isValidNumber);
          
          if (propValues.length > 0) {
            result.properties[prop] = this.calculateStats(propValues);
            allFinalScores.push(...propValues);
          }
        });
        
        if (allFinalScores.length > 0) {
          result.final = this.calculateStats(allFinalScores);
        }
      }
    }

    // For quality metrics
    if (metricType === 'quality') {
      // v2: Include zeros in quality calculations
      result.completeness = this.calculateStats(allMetrics.map(m => m.completeness?.score).filter(this.isValidNumber));
      result.consistency = this.calculateStats(allMetrics.map(m => m.consistency?.score).filter(this.isValidNumber));
      result.validity = this.calculateStats(allMetrics.map(m => m.validity?.score).filter(this.isValidNumber));
      
      if (allMetrics.some(m => m.relevance)) {
        result.relevance = this.calculateStats(allMetrics.map(m => m.relevance?.score).filter(this.isValidNumber));
      }

      result.final = this.calculateStats(allMetrics.map(m => m.final).filter(this.isValidNumber));

      result.issues = {
        completeness: this.aggregateIssues(allMetrics.map(m => m.completeness?.issues || [])),
        consistency: this.aggregateIssues(allMetrics.map(m => m.consistency?.issues || [])),
        validity: this.aggregateIssues(allMetrics.map(m => m.validity?.issues || []))
      };
    }

    console.log(`MetricsExtractor: ${component} ${metricType} result:`, result);
    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * v2: Helper to check if a value is a valid number (including zero)
   */
  static isValidNumber(v) {
    return v !== undefined && v !== null && !isNaN(v) && isFinite(v);
  }

  /**
   * Calculate statistics for array of values
   */
  static calculateStats(values) {
    const valid = values.filter(v => this.isValidNumber(v));

    if (valid.length === 0) return null;

    const mean = valid.reduce((sum, v) => sum + v, 0) / valid.length;
    const sorted = [...valid].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[Math.floor(sorted.length / 2) - 1] + sorted[Math.floor(sorted.length / 2)]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valid.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      median,
      std,
      min: Math.min(...valid),
      max: Math.max(...valid),
      count: valid.length,
      distribution: this.createDistribution(valid)
    };
  }

  /**
   * Create distribution bins for values
   */
  static createDistribution(values) {
    const bins = {
      '0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0
    };

    values.forEach(val => {
      if (val < 0.2) bins['0-0.2']++;
      else if (val < 0.4) bins['0.2-0.4']++;
      else if (val < 0.6) bins['0.4-0.6']++;
      else if (val < 0.8) bins['0.6-0.8']++;
      else bins['0.8-1.0']++;
    });

    return bins;
  }

  /**
   * Aggregate issues from multiple evaluations
   */
  static aggregateIssues(issuesArrays) {
    const allIssues = issuesArrays.flat().filter(Boolean);
    const uniqueIssues = [...new Set(allIssues)];
    
    return uniqueIssues.map(issue => ({
      issue,
      count: allIssues.filter(i => i === issue).length,
      frequency: allIssues.filter(i => i === issue).length / issuesArrays.length
    }));
  }

  /**
   * Calculate LLM vs ORKG statistics from integrated papers
   */
  static calculateLLMvsORKGStats(integratedPapers) {
    const stats = {
      problems: { llm: 0, orkg: 0, total: 0 },
      templates: { llm: 0, orkg: 0, total: 0 }
    };

    if (!integratedPapers || integratedPapers.length === 0) return stats;

    integratedPapers.forEach(paper => {
      const systemOutput = paper.systemOutput || paper.systemData;
      if (!systemOutput) return;

      let isLLMProblem = false;

      if (systemOutput.researchProblems) {
        const selectedProblem = systemOutput.researchProblems.selectedProblem;
        const llmProblem = systemOutput.researchProblems.llm_problem;
        
        if (selectedProblem || llmProblem) {
          stats.problems.total++;
          
          if (selectedProblem?.isLLMGenerated === true) {
            isLLMProblem = true;
            stats.problems.llm++;
          } 
          else if (llmProblem && selectedProblem?.title === llmProblem.title) {
            isLLMProblem = true;
            stats.problems.llm++;
          }
          else if (llmProblem && (!systemOutput.researchProblems.orkg_problems || 
                                  systemOutput.researchProblems.orkg_problems.length === 0)) {
            isLLMProblem = true;
            stats.problems.llm++;
          }
          else {
            stats.problems.orkg++;
          }
        }
      }

      if (systemOutput.templates) {
        const selectedTemplate = systemOutput.templates.selectedTemplate;
        const llmTemplate = systemOutput.templates.llm_template;
        const orkgTemplate = systemOutput.templates.available?.template;
        
        if (selectedTemplate || llmTemplate || orkgTemplate) {
          stats.templates.total++;
          
          if (isLLMProblem) {
            stats.templates.llm++;
          } else {
            stats.templates.orkg++;
          }
        }
      }
    });

    stats.problems.llmPercentage = stats.problems.total > 0 
      ? (stats.problems.llm / stats.problems.total) * 100 
      : 0;
    stats.problems.orkgPercentage = stats.problems.total > 0 
      ? (stats.problems.orkg / stats.problems.total) * 100 
      : 0;

    stats.templates.llmPercentage = stats.templates.total > 0 
      ? (stats.templates.llm / stats.templates.total) * 100 
      : 0;
    stats.templates.orkgPercentage = stats.templates.total > 0 
      ? (stats.templates.orkg / stats.templates.total) * 100 
      : 0;

    return stats;
  }

  /**
   * Extract additional metrics (system performance, innovation, etc.)
   */
  static extractAdditionalMetrics(evaluation) {
    if (!evaluation?.evaluationMetrics) return null;

    const metrics = {};

    if (evaluation.evaluationMetrics.systemPerformance?.systemPerformance) {
      const perf = evaluation.evaluationMetrics.systemPerformance.systemPerformance;
      metrics.systemPerformance = {
        responsiveness: perf.responsiveness?.rating || 0,
        errors: perf.errors?.rating || 0,
        stability: perf.stability?.rating || 0,
        overall: perf.overall?.rating || 0,
        comments: {
          responsiveness: perf.responsiveness?.comments || '',
          errors: perf.errors?.comments || '',
          stability: perf.stability?.comments || '',
          overall: perf.overall?.comments || ''
        }
      };
    }

    if (evaluation.evaluationMetrics.innovation?.innovation) {
      const innov = evaluation.evaluationMetrics.innovation.innovation;
      metrics.innovation = {
        novelty: innov.novelty?.rating || 0,
        usability: innov.usability?.rating || 0,
        impact: innov.impact?.rating || 0,
        overall: innov.overall?.rating || 0,
        comments: {
          novelty: innov.novelty?.comments || '',
          usability: innov.usability?.comments || '',
          impact: innov.impact?.comments || '',
          overall: innov.overall?.comments || ''
        }
      };
    }

    if (evaluation.evaluationMetrics.comparativeAnalysis) {
      metrics.comparativeAnalysis = evaluation.evaluationMetrics.comparativeAnalysis;
    }

    if (evaluation.evaluationMetrics.ragHighlight) {
      metrics.ragHighlight = evaluation.evaluationMetrics.ragHighlight;
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  }

  /**
   * Aggregate additional metrics across evaluations
   */
  static aggregateAdditionalMetrics(evaluations) {
    if (!evaluations || evaluations.length === 0) return null;

    const allMetrics = evaluations
      .map(evaluation => this.extractAdditionalMetrics(evaluation))
      .filter(m => m !== null);

    if (allMetrics.length === 0) return null;

    const result = {};

    const perfMetrics = allMetrics.filter(m => m.systemPerformance);
    if (perfMetrics.length > 0) {
      result.systemPerformance = {
        responsiveness: this.calculateStats(perfMetrics.map(m => m.systemPerformance.responsiveness)),
        errors: this.calculateStats(perfMetrics.map(m => m.systemPerformance.errors)),
        stability: this.calculateStats(perfMetrics.map(m => m.systemPerformance.stability)),
        overall: this.calculateStats(perfMetrics.map(m => m.systemPerformance.overall))
      };
    }

    const innovMetrics = allMetrics.filter(m => m.innovation);
    if (innovMetrics.length > 0) {
      result.innovation = {
        novelty: this.calculateStats(innovMetrics.map(m => m.innovation.novelty)),
        usability: this.calculateStats(innovMetrics.map(m => m.innovation.usability)),
        impact: this.calculateStats(innovMetrics.map(m => m.innovation.impact)),
        overall: this.calculateStats(innovMetrics.map(m => m.innovation.overall))
      };
    }

    return Object.keys(result).length > 0 ? result : null;
  }
}

export default MetricsExtractor;