// src/utils/statisticalAnalysis.js

/**
 * Calculate statistical metrics from evaluation data
 * Updated to use correct data paths from evaluation-data-paths-reference.md
 */

export const calculateStatistics = (processedData) => {
  if (!processedData || !processedData.evaluations || processedData.evaluations.length === 0) {
    return {
      descriptive: {
        ratings: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
        expertise: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
        completeness: { mean: 0, median: 0, std: 0, min: 0, max: 0 },
        scores: { mean: 0, median: 0, std: 0, min: 0, max: 0 }
      },
      correlations: {
        expertiseVsScore: 0,
        completenessVsScore: 0
      },
      trends: {
        overTime: []
      }
    };
  }

  const evaluations = processedData.evaluations;

  // Extract all ratings, scores, and metrics
  const allRatings = [];
  const expertiseWeights = [];
  const completenessScores = [];
  const overallScores = [];
  const metadataScores = [];
  const fieldScores = [];
  const problemScores = [];
  const templateScores = [];

  evaluations.forEach(evaluation => {
    // Extract expertise weight
    expertiseWeights.push(evaluation.userInfo?.expertiseWeight || 0);

    // Extract metadata completeness
    const metadataCompleteness = evaluation.evaluationState?.metadata?.completeness;
    if (metadataCompleteness !== undefined) {
      completenessScores.push(metadataCompleteness);
    }

    // Calculate overall score from final verdict
    const finalVerdict = evaluation.evaluationState?.finalVerdict;
    if (finalVerdict?.assessment?.overallScore?.rating) {
      overallScores.push(finalVerdict.assessment.overallScore.rating);
    }

    // Extract metadata ratings and scores
    const metadataAssessment = evaluation.evaluationState?.metadata?.finalAssessment;
    if (metadataAssessment) {
      ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
        const fieldAssessment = metadataAssessment[field];
        if (fieldAssessment) {
          if (fieldAssessment.rating) allRatings.push(fieldAssessment.rating);
          if (fieldAssessment.overallScore) metadataScores.push(fieldAssessment.overallScore);
        }
      });
      
      // Overall metadata score
      if (metadataAssessment.overall?.overallScore) {
        metadataScores.push(metadataAssessment.overall.overallScore);
      }
    }

    // Extract research field ratings and scores
    const fieldAssessment = evaluation.evaluationState?.research_field?.finalAssessment;
    if (fieldAssessment) {
      if (fieldAssessment.primaryField?.rating) {
        allRatings.push(fieldAssessment.primaryField.rating);
      }
      if (fieldAssessment.overall?.overallScore) {
        fieldScores.push(fieldAssessment.overall.overallScore);
      }
    }

    // Extract research problem ratings and scores
    const problemAssessment = evaluation.evaluationState?.research_problem?.finalAssessment;
    if (problemAssessment) {
      if (problemAssessment.problemIdentification?.rating) {
        allRatings.push(problemAssessment.problemIdentification.rating);
      }
      if (problemAssessment.problemClarity?.rating) {
        allRatings.push(problemAssessment.problemClarity.rating);
      }
      if (problemAssessment.overall?.overallScore) {
        problemScores.push(problemAssessment.overall.overallScore);
      }
    }

    // Extract template ratings and scores
    const templateAssessment = evaluation.evaluationState?.template?.finalAssessment;
    if (templateAssessment) {
      ['titleAccuracy', 'descriptionQuality', 'propertyCoverage', 'researchAlignment'].forEach(field => {
        if (templateAssessment[field] !== undefined) {
          // Convert 0-1 scores to 1-5 ratings for consistency
          allRatings.push(templateAssessment[field] * 5);
        }
      });
      
      if (templateAssessment.overallScore) {
        templateScores.push(templateAssessment.overallScore);
      }
    }

    // Extract content ratings and scores
    const contentAssessment = evaluation.evaluationState?.content?.finalAssessment;
    if (contentAssessment?.metrics) {
      Object.values(contentAssessment.metrics).forEach(metric => {
        if (metric?.score !== undefined) {
          // Convert 0-1 scores to 1-5 ratings for consistency
          allRatings.push(metric.score * 5);
        }
      });
    }
  });

  // Calculate descriptive statistics
  const descriptive = {
    ratings: calculateDescriptiveStats(allRatings),
    expertise: calculateDescriptiveStats(expertiseWeights),
    completeness: calculateDescriptiveStats(completenessScores),
    scores: calculateDescriptiveStats(overallScores),
    bySection: {
      metadata: calculateDescriptiveStats(metadataScores),
      researchField: calculateDescriptiveStats(fieldScores),
      researchProblem: calculateDescriptiveStats(problemScores),
      template: calculateDescriptiveStats(templateScores)
    }
  };

  // Calculate correlations
  const correlations = {
    expertiseVsScore: calculateCorrelation(expertiseWeights, overallScores),
    completenessVsScore: calculateCorrelation(completenessScores, overallScores),
    expertiseVsMetadata: calculateCorrelation(expertiseWeights, metadataScores),
    expertiseVsField: calculateCorrelation(expertiseWeights, fieldScores),
    expertiseVsProblem: calculateCorrelation(expertiseWeights, problemScores),
    expertiseVsTemplate: calculateCorrelation(expertiseWeights, templateScores)
  };

  // Calculate trends over time
  const trends = {
    overTime: calculateTimeTrends(evaluations),
    bySection: {
      metadata: calculateSectionTrends(evaluations, 'metadata'),
      researchField: calculateSectionTrends(evaluations, 'research_field'),
      researchProblem: calculateSectionTrends(evaluations, 'research_problem'),
      template: calculateSectionTrends(evaluations, 'template')
    }
  };

  return {
    descriptive,
    correlations,
    trends,
    sampleSize: evaluations.length
  };
};

const calculateDescriptiveStats = (values) => {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = values.length % 2 === 0
    ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
    : sorted[Math.floor(values.length / 2)];
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  return {
    mean,
    median,
    std,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: values.length
  };
};

const calculateCorrelation = (x, y) => {
  if (!x || !y || x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

const calculateTimeTrends = (evaluations) => {
  // Group by date
  const byDate = {};
  
  evaluations.forEach(evaluation => {
    try {
      // Handle different timestamp formats
      let timestamp = evaluation.timestamp || evaluation.date || evaluation.createdAt;
      
      if (!timestamp) {
        console.warn('Evaluation has no timestamp:', evaluation);
        return; // Skip this evaluation
      }

      // Try to parse the date
      let date;
      if (typeof timestamp === 'number') {
        // Unix timestamp (milliseconds or seconds)
        date = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        // ISO string or other date string
        date = new Date(timestamp);
      } else {
        console.warn('Invalid timestamp type:', typeof timestamp, timestamp);
        return;
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for evaluation:', timestamp);
        return; // Skip invalid dates
      }

      const dateStr = date.toISOString().split('T')[0];
      
      if (!byDate[dateStr]) {
        byDate[dateStr] = {
          date: dateStr,
          count: 0,
          avgScore: 0,
          totalScore: 0,
          avgExpertise: 0,
          totalExpertise: 0
        };
      }
      
      byDate[dateStr].count++;
      
      // Add overall score from final verdict
      const overallScore = evaluation.evaluationState?.finalVerdict?.assessment?.overallScore?.rating || 0;
      byDate[dateStr].totalScore += overallScore;
      
      // Add expertise weight
      const expertiseWeight = evaluation.userInfo?.expertiseWeight || 0;
      byDate[dateStr].totalExpertise += expertiseWeight;
    } catch (error) {
      console.error('Error processing timestamp for evaluation:', error, evaluation);
    }
  });

  // Calculate averages
  const trends = Object.values(byDate).map(day => ({
    date: day.date,
    count: day.count,
    avgScore: day.count > 0 ? day.totalScore / day.count : 0,
    avgExpertise: day.count > 0 ? day.totalExpertise / day.count : 0
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  console.log('Calculated time trends:', trends);
  return trends;
};

const calculateSectionTrends = (evaluations, section) => {
  const byDate = {};
  
  evaluations.forEach(evaluation => {
    try {
      let timestamp = evaluation.timestamp || evaluation.date || evaluation.createdAt;
      if (!timestamp) return;

      let date;
      if (typeof timestamp === 'number') {
        date = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) return;

      const dateStr = date.toISOString().split('T')[0];
      
      if (!byDate[dateStr]) {
        byDate[dateStr] = {
          date: dateStr,
          count: 0,
          totalScore: 0
        };
      }
      
      // Extract section-specific score
      let sectionScore = 0;
      switch(section) {
        case 'metadata':
          sectionScore = evaluation.evaluationState?.metadata?.finalAssessment?.overall?.overallScore || 0;
          break;
        case 'research_field':
          sectionScore = evaluation.evaluationState?.research_field?.finalAssessment?.overall?.overallScore || 0;
          break;
        case 'research_problem':
          sectionScore = evaluation.evaluationState?.research_problem?.finalAssessment?.overall?.overallScore || 0;
          break;
        case 'template':
          sectionScore = evaluation.evaluationState?.template?.finalAssessment?.overallScore || 0;
          break;
      }
      
      if (sectionScore > 0) {
        byDate[dateStr].count++;
        byDate[dateStr].totalScore += sectionScore;
      }
    } catch (error) {
      console.error('Error processing section trends:', error);
    }
  });

  return Object.values(byDate).map(day => ({
    date: day.date,
    count: day.count,
    avgScore: day.count > 0 ? day.totalScore / day.count : 0
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Calculate inter-rater reliability (Cronbach's Alpha)
 * @param {Array} evaluations - Array of evaluations
 * @returns {number} Cronbach's Alpha value
 */
export const calculateCronbachAlpha = (evaluations) => {
  if (!evaluations || evaluations.length < 2) {
    return null;
  }

  // Collect ratings by field across all evaluators
  const fieldRatings = {};
  
  evaluations.forEach(evaluation => {
    const metadataAssessment = evaluation.evaluationState?.metadata?.finalAssessment;
    if (metadataAssessment) {
      ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
        if (!fieldRatings[field]) fieldRatings[field] = [];
        const rating = metadataAssessment[field]?.rating;
        if (rating) fieldRatings[field].push(rating);
      });
    }
  });

  // Calculate Cronbach's Alpha
  const fields = Object.keys(fieldRatings);
  const k = fields.length; // number of items
  
  if (k < 2) return null;

  // Calculate variance for each item
  const itemVariances = fields.map(field => {
    const ratings = fieldRatings[field];
    const stats = calculateDescriptiveStats(ratings);
    return stats.std * stats.std;
  });

  // Calculate total score variance
  const totalScores = evaluations.map(evaluation => {
    let total = 0;
    fields.forEach(field => {
      const rating = evaluation.evaluationState?.metadata?.finalAssessment?.[field]?.rating || 0;
      total += rating;
    });
    return total;
  });

  const totalStats = calculateDescriptiveStats(totalScores);
  const totalVariance = totalStats.std * totalStats.std;

  // Cronbach's Alpha formula
  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);
  const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);

  return alpha;
};

/**
 * Calculate Cohen's Kappa for two raters
 * @param {Object} evaluation1 - First evaluation
 * @param {Object} evaluation2 - Second evaluation
 * @returns {number} Cohen's Kappa value
 */
export const calculateCohenKappa = (evaluation1, evaluation2) => {
  if (!evaluation1 || !evaluation2) {
    return null;
  }

  const ratings1 = [];
  const ratings2 = [];

  // Extract metadata ratings
  ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
    const rating1 = evaluation1.evaluationState?.metadata?.finalAssessment?.[field]?.rating;
    const rating2 = evaluation2.evaluationState?.metadata?.finalAssessment?.[field]?.rating;
    
    if (rating1 && rating2) {
      ratings1.push(rating1);
      ratings2.push(rating2);
    }
  });

  if (ratings1.length === 0) return null;

  // Calculate observed agreement
  let observed = 0;
  for (let i = 0; i < ratings1.length; i++) {
    if (ratings1[i] === ratings2[i]) observed++;
  }
  const po = observed / ratings1.length;

  // Calculate expected agreement
  const categories = [1, 2, 3, 4, 5];
  let pe = 0;
  
  categories.forEach(category => {
    const p1 = ratings1.filter(r => r === category).length / ratings1.length;
    const p2 = ratings2.filter(r => r === category).length / ratings2.length;
    pe += p1 * p2;
  });

  // Cohen's Kappa
  const kappa = (po - pe) / (1 - pe);
  
  return kappa;
};