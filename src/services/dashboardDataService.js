// src/services/dashboardDataService.js
import githubDataService from './githubDataService';
import groundTruthService from './groundTruthService';
import { processEvaluationData } from '../utils/dataProcessing';
import { calculateConfusionMatrices } from '../utils/confusionMatrixCalculator';
import { calculateStatistics } from '../utils/statisticalAnalysis';

class DashboardDataService {
  constructor() {
    this.dataCache = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.groundTruthLoaded = false;
  }

  /**
   * Initialize ground truth data using environment variables
   */
  async initializeGroundTruth() {
    if (this.groundTruthLoaded) return;

    try {
      // Uses environment variables from groundTruthService
      await groundTruthService.loadFromGitHub();
      this.groundTruthLoaded = true;
      console.log('✓ Ground truth data initialized');
    } catch (error) {
      console.error('Failed to initialize ground truth:', error);
      throw error;
    }
  }

  /**
   * Get all evaluation data with processing and ground truth integration
   */
  async getAllEvaluationData(forceRefresh = false) {
    // Check cache
    if (!forceRefresh && this.dataCache && this.lastFetch) {
      const age = Date.now() - this.lastFetch;
      if (age < this.cacheTimeout) {
        return this.dataCache;
      }
    }

    try {
      // Initialize ground truth if not already loaded
      if (!this.groundTruthLoaded) {
        await this.initializeGroundTruth();
      }

      // Fetch from GitHub
      const result = await githubDataService.fetchAllEvaluations();
      
      // Update ground truth with evaluation counts
      if (result.processed?.evaluations) {
        groundTruthService.updateEvaluationCounts(result.processed.evaluations);
      }

      // Add ground truth statistics
      const groundTruthStats = groundTruthService.getStatistics();

      // Add additional processing
      const enhancedResult = {
        ...result,
        summary: this.calculateSummaryMetrics(result.processed),
        trends: this.calculateTrends(result.processed),
        insights: this.generateInsights(result),
        groundTruth: {
          stats: groundTruthStats,
          loaded: this.groundTruthLoaded
        }
      };

      // Update cache
      this.dataCache = enhancedResult;
      this.lastFetch = Date.now();

      return enhancedResult;
    } catch (error) {
      console.error('Error in dashboard data service:', error);
      throw error;
    }
  }

  /**
   * Get ground truth data with evaluation status
   */
  async getGroundTruthData(filters = {}) {
    if (!this.groundTruthLoaded) {
      await this.initializeGroundTruth();
    }

    // Get evaluation data to update counts
    const evaluationData = await this.getAllEvaluationData();

    // Get filtered papers with status
    const papers = groundTruthService.getFilteredPapers(filters);
    const stats = groundTruthService.getStatistics();

    return {
      papers,
      stats,
      filters: {
        researchFields: groundTruthService.getUniqueResearchFields(),
        templates: groundTruthService.getUniqueTemplates()
      }
    };
  }

  /**
   * Get paper evaluation details
   */
  async getPaperEvaluationDetails(paperId) {
    if (!this.groundTruthLoaded) {
      await this.initializeGroundTruth();
    }

    const paper = groundTruthService.getPaperById(paperId) || 
                  groundTruthService.getPaperByDoi(paperId);

    if (!paper) {
      return null;
    }

    // Get evaluations for this paper
    const allEvaluations = await this.getAllEvaluationData();
    const paperEvaluations = allEvaluations.processed?.evaluations?.filter(ev => {
      const evalPaperId = this._extractPaperIdFromEvaluation(ev);
      return evalPaperId === paperId || 
             evalPaperId === groundTruthService._normalizeDOI(paperId);
    }) || [];

    return {
      paper,
      evaluations: paperEvaluations,
      evaluationCount: paperEvaluations.length,
      evaluators: paperEvaluations.map(e => ({
        name: `${e.userInfo.firstName} ${e.userInfo.lastName}`,
        role: e.userInfo.role,
        expertise: e.expertiseWeight,
        timestamp: e.timestamp
      }))
    };
  }

  /**
   * Extract paper ID/DOI from evaluation
   * Based on Evaluation_Object_Data_Structure_Documentation.md
   */
  _extractPaperIdFromEvaluation(evaluation) {
    // Priority 1: overall.metadata.doi.referenceValue (primary location per documentation)
    if (evaluation.overall?.metadata?.doi?.referenceValue) {
      return groundTruthService._normalizeDOI(evaluation.overall.metadata.doi.referenceValue);
    }
    
    // Priority 2: overall.metadata.doi.extractedValue (system extracted value)
    if (evaluation.overall?.metadata?.doi?.extractedValue) {
      return groundTruthService._normalizeDOI(evaluation.overall.metadata.doi.extractedValue);
    }
    
    // Priority 3: evaluationState.metadata.extractedData.doi (legacy path)
    if (evaluation.evaluationState?.metadata?.extractedData?.doi) {
      return groundTruthService._normalizeDOI(evaluation.evaluationState.metadata.extractedData.doi);
    }

    // Priority 4: Direct doi field
    if (evaluation.doi) {
      return groundTruthService._normalizeDOI(evaluation.doi);
    }

    // Priority 5: Extract from token (format: doi_timestamp_random)
    if (evaluation.token) {
      const parts = evaluation.token.split('_');
      if (parts.length > 0) {
        return groundTruthService._normalizeDOI(parts[0]);
      }
    }

    return null;
  }

  /**
   * Calculate summary metrics with ground truth integration
   */
  calculateSummaryMetrics(processedData) {
    if (!processedData || !processedData.evaluations) {
      return null;
    }

    const { evaluations } = processedData;
    
    // Basic counts
    const totalEvaluations = evaluations.length;
    
    // Get unique papers evaluated
    const uniquePapers = new Set();
    evaluations.forEach(e => {
      const paperId = this._extractPaperIdFromEvaluation(e);
      if (paperId) uniquePapers.add(paperId);
    });

    // Role distribution
    const roleDistribution = evaluations.reduce((acc, e) => {
      const role = e.userInfo?.role;
      if (role) {
        acc[role] = (acc[role] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Expertise statistics
    const expertiseWeights = evaluations
      .map(e => e.expertiseWeight)
      .filter(w => w !== undefined && w !== null);
    
    const avgExpertiseWeight = expertiseWeights.length > 0 
      ? expertiseWeights.reduce((a, b) => a + b, 0) / expertiseWeights.length 
      : 0;
    const maxExpertiseWeight = expertiseWeights.length > 0 
      ? Math.max(...expertiseWeights) 
      : 0;
    const minExpertiseWeight = expertiseWeights.length > 0 
      ? Math.min(...expertiseWeights) 
      : 0;
    
    // Score statistics
    const overallScores = evaluations
      .map(e => e.overallScore)
      .filter(s => s !== undefined && s !== null);
    
    const avgOverallScore = overallScores.length > 0 
      ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length 
      : 0;
    
    // Completeness statistics
    const completenessValues = evaluations
      .map(e => e.completeness)
      .filter(c => c !== undefined && c !== null);
    
    const avgCompleteness = completenessValues.length > 0 
      ? completenessValues.reduce((a, b) => a + b, 0) / completenessValues.length 
      : 0;
    
    // Section-specific statistics
    const sectionStats = {};
    
    evaluations.forEach(evaluation => {
      const evalState = evaluation.evaluationState;
      if (!evalState) return;

      ['metadata', 'research_field', 'research_problem', 'template', 'content'].forEach(sectionId => {
        const sectionData = evalState[sectionId];
        if (!sectionData) return;

        if (!sectionStats[sectionId]) {
          sectionStats[sectionId] = {
            count: 0,
            totalRating: 0,
            totalFields: 0
          };
        }

        const userAssessment = sectionData.userAssessment;
        if (userAssessment) {
          const ratings = [];

          if (sectionId === 'metadata') {
            const fields = ['title', 'authors', 'doi', 'publication_year', 'venue'];
            fields.forEach(field => {
              const rating = userAssessment[field]?.rating;
              if (rating !== undefined && rating !== null) {
                ratings.push(rating);
              }
            });
          } else if (sectionId === 'research_field') {
            const criteria = ['primaryField', 'confidence', 'consistency', 'relevance'];
            criteria.forEach(criterion => {
              const rating = userAssessment[criterion];
              if (rating !== undefined && rating !== null) {
                ratings.push(rating);
              }
            });
          } else if (sectionId === 'research_problem') {
            const criteria = ['problemIdentification', 'problemClarity', 'problemRelevance', 'evidenceQuality'];
            criteria.forEach(criterion => {
              const rating = userAssessment[criterion];
              if (rating !== undefined && rating !== null) {
                ratings.push(rating);
              }
            });
          } else if (sectionId === 'template') {
            const criteria = ['titleAccuracy', 'descriptionQuality', 'propertyCoverage', 'researchAlignment'];
            criteria.forEach(criterion => {
              const rating = userAssessment[criterion];
              if (rating !== undefined && rating !== null) {
                ratings.push(rating);
              }
            });
          } else if (sectionId === 'content') {
            const criteria = ['propertyCoverage', 'evidenceQuality', 'valueAccuracy'];
            criteria.forEach(criterion => {
              const rating = userAssessment[criterion];
              if (rating !== undefined && rating !== null) {
                ratings.push(rating);
              }
            });
          }

          if (ratings.length > 0) {
            sectionStats[sectionId].count++;
            sectionStats[sectionId].totalRating += ratings.reduce((a, b) => a + b, 0) / ratings.length;
            sectionStats[sectionId].totalFields += ratings.length;
          }
        }
      });
    });
    
    // Calculate section averages
    Object.keys(sectionStats).forEach(section => {
      const stats = sectionStats[section];
      stats.avgRating = stats.count > 0 ? stats.totalRating / stats.count : 0;
      stats.avgFieldsPerEvaluation = stats.count > 0 ? stats.totalFields / stats.count : 0;
    });
    
    return {
      totalEvaluations,
      uniquePapersEvaluated: uniquePapers.size,
      roleDistribution,
      avgExpertiseWeight,
      maxExpertiseWeight,
      minExpertiseWeight,
      avgOverallScore,
      avgCompleteness,
      sectionStats
    };
  }

  /**
   * Calculate temporal trends
   */
  calculateTrends(processedData) {
    if (!processedData || !processedData.evaluations) {
      return null;
    }

    const { evaluations } = processedData;
    
    const sorted = [...evaluations].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    if (sorted.length < 2) {
      return null;
    }
    
    const windowSize = Math.min(5, Math.floor(sorted.length / 3));
    const rollingAverages = [];
    
    for (let i = windowSize - 1; i < sorted.length; i++) {
      const window = sorted.slice(i - windowSize + 1, i + 1);
      const avgScore = window.reduce((sum, e) => sum + (e.overallScore || 0), 0) / window.length;
      const avgExpertise = window.reduce((sum, e) => sum + (e.expertiseWeight || 0), 0) / window.length;
      const avgCompleteness = window.reduce((sum, e) => sum + (e.completeness || 0), 0) / window.length;
      
      rollingAverages.push({
        timestamp: sorted[i].timestamp,
        avgScore,
        avgExpertise,
        avgCompleteness
      });
    }
    
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    const firstHalfAvgScore = firstHalf.reduce((sum, e) => sum + (e.overallScore || 0), 0) / firstHalf.length;
    const secondHalfAvgScore = secondHalf.reduce((sum, e) => sum + (e.overallScore || 0), 0) / secondHalf.length;
    
    const trend = {
      direction: secondHalfAvgScore > firstHalfAvgScore ? 'improving' : 
                 secondHalfAvgScore < firstHalfAvgScore ? 'declining' : 'stable',
      change: firstHalfAvgScore > 0 
        ? ((secondHalfAvgScore - firstHalfAvgScore) / firstHalfAvgScore) * 100 
        : 0,
      rollingAverages
    };
    
    return trend;
  }

  /**
   * Generate insights from the data
   */
  generateInsights(data) {
    const insights = [];
    
    if (!data || !data.processed) {
      return insights;
    }
    
    const summary = this.calculateSummaryMetrics(data.processed);
    const { statistics, confusionMatrices } = data;
    
    if (!summary) {
      return insights;
    }

    // Ground truth coverage insight
    if (this.groundTruthLoaded) {
      const gtStats = groundTruthService.getStatistics();
      const coverage = parseFloat(gtStats.evaluationCoverage);
      
      if (coverage < 30) {
        insights.push({
          type: 'warning',
          category: 'coverage',
          message: `Only ${coverage}% of ground truth papers have been evaluated. Consider increasing evaluation coverage.`,
          priority: 'high'
        });
      } else if (coverage > 70) {
        insights.push({
          type: 'success',
          category: 'coverage',
          message: `Excellent coverage: ${coverage}% of ground truth papers have been evaluated.`,
          priority: 'medium'
        });
      }
    }
    
    // Expertise correlation insight
    if (statistics?.correlations?.expertiseVsScore) {
      const correlation = statistics.correlations.expertiseVsScore;
      if (Math.abs(correlation) > 0.5) {
        insights.push({
          type: correlation > 0 ? 'positive' : 'negative',
          category: 'expertise',
          message: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation (r=${correlation.toFixed(2)}) between expertise and performance`,
          priority: 'high'
        });
      }
    }
    
    // Accuracy insight
    if (confusionMatrices?.overall?.metrics?.accuracy) {
      const accuracy = confusionMatrices.overall.metrics.accuracy;
      if (accuracy < 0.6) {
        insights.push({
          type: 'warning',
          category: 'accuracy',
          message: `Overall system accuracy is ${(accuracy * 100).toFixed(1)}%, indicating potential issues with extraction quality`,
          priority: 'high'
        });
      } else if (accuracy > 0.8) {
        insights.push({
          type: 'success',
          category: 'accuracy',
          message: `Excellent system accuracy of ${(accuracy * 100).toFixed(1)}% demonstrates reliable extraction performance`,
          priority: 'medium'
        });
      }
    }
    
    // Completeness insight
    if (summary.avgCompleteness < 0.7) {
      insights.push({
        type: 'warning',
        category: 'completeness',
        message: `Average completeness is only ${(summary.avgCompleteness * 100).toFixed(1)}%. Consider providing more guidance to evaluators.`,
        priority: 'medium'
      });
    }
    
    // Section performance insights
    if (confusionMatrices?.sectionMetrics) {
      const sections = Object.entries(confusionMatrices.sectionMetrics);
      const worstSection = sections.reduce((worst, [id, data]) => {
        if (!worst || data.metrics.f1Score < worst.score) {
          return { id, score: data.metrics.f1Score, label: id };
        }
        return worst;
      }, null);
      
      if (worstSection && worstSection.score < 0.5) {
        insights.push({
          type: 'warning',
          category: 'section',
          message: `${worstSection.label} section has the lowest F1 score (${(worstSection.score * 100).toFixed(1)}%) and needs improvement`,
          priority: 'high'
        });
      }
    }
    
    // Participation insights
    const roleCount = Object.keys(summary.roleDistribution).length;
    if (roleCount < 3) {
      insights.push({
        type: 'info',
        category: 'diversity',
        message: `Limited role diversity (${roleCount} different roles). Consider involving more diverse evaluators.`,
        priority: 'low'
      });
    }
    
    // Trend insights
    const trends = this.calculateTrends(data.processed);
    if (trends && trends.direction === 'improving' && Math.abs(trends.change) > 10) {
      insights.push({
        type: 'success',
        category: 'trend',
        message: `Performance has improved by ${Math.abs(trends.change).toFixed(1)}% over time`,
        priority: 'medium'
      });
    } else if (trends && trends.direction === 'declining' && Math.abs(trends.change) > 10) {
      insights.push({
        type: 'warning',
        category: 'trend',
        message: `Performance has declined by ${Math.abs(trends.change).toFixed(1)}% over time`,
        priority: 'high'
      });
    }
    
    return insights;
  }

  /**
   * Get filtered data based on criteria
   */
  filterData(data, filters) {
    if (!data || !data.processed) {
      return data;
    }
    
    let filtered = [...data.processed.evaluations];
    
    if (filters.startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
    }
    
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(e => e.userInfo?.role === filters.role);
    }
    
    if (filters.expertiseLevel && filters.expertiseLevel !== 'all') {
      const level = filters.expertiseLevel;
      filtered = filtered.filter(e => {
        const weight = e.expertiseWeight || 0;
        if (level === 'high') return weight >= 3.5;
        if (level === 'medium') return weight >= 2 && weight < 3.5;
        if (level === 'low') return weight < 2;
        return true;
      });
    }
    
    if (filters.section && filters.section !== 'all') {
      filtered = filtered.filter(e => {
        const sectionData = e.evaluationState?.[filters.section];
        if (!sectionData) return false;
        
        const userAssessment = sectionData.userAssessment;
        if (!userAssessment) return false;
        
        return Object.keys(userAssessment).length > 0;
      });
    }
    
    const filteredData = {
      evaluations: filtered
    };
    
    return {
      ...data,
      processed: processEvaluationData(filtered),
      confusionMatrices: calculateConfusionMatrices(filteredData),
      statistics: calculateStatistics(filteredData)
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.dataCache = null;
    this.lastFetch = null;
    githubDataService.clearCache();
    groundTruthService.clear();
    this.groundTruthLoaded = false;
  }
}

export default new DashboardDataService();