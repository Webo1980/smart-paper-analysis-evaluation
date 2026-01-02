// src/utils/confusionMatrixCalculator.js

/**
 * Calculate confusion matrices from evaluation data
 * Updated to use correct data paths from evaluation-data-paths-reference.md
 */

export const calculateConfusionMatrices = (processedData) => {
  if (!processedData || !processedData.evaluations) {
    return {
      overall: createEmptyMatrix(),
      bySection: {}
    };
  }

  const matrices = {
    overall: createEmptyMatrix(),
    bySection: {}
  };

  processedData.evaluations.forEach(evaluation => {
    // Process metadata section
    const metadataAssessment = evaluation.evaluationState?.metadata?.finalAssessment;
    if (metadataAssessment) {
      if (!matrices.bySection.metadata) {
        matrices.bySection.metadata = createEmptyMatrix();
      }
      
      // Process each metadata field
      ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
        const fieldAssessment = metadataAssessment[field];
        if (fieldAssessment && fieldAssessment.rating) {
          updateMatrix(matrices.overall, fieldAssessment.rating, fieldAssessment.accuracyScore);
          updateMatrix(matrices.bySection.metadata, fieldAssessment.rating, fieldAssessment.accuracyScore);
        }
      });
    }

    // Process research field section
    const fieldAssessment = evaluation.evaluationState?.research_field?.finalAssessment;
    if (fieldAssessment) {
      if (!matrices.bySection.research_field) {
        matrices.bySection.research_field = createEmptyMatrix();
      }
      
      // Process primary field assessment
      if (fieldAssessment.primaryField) {
        updateMatrix(matrices.overall, fieldAssessment.primaryField.rating, fieldAssessment.primaryField.accuracyScore);
        updateMatrix(matrices.bySection.research_field, fieldAssessment.primaryField.rating, fieldAssessment.primaryField.accuracyScore);
      }
      
      // Process overall field assessment
      if (fieldAssessment.overall) {
        updateMatrix(matrices.overall, fieldAssessment.overall.rating, fieldAssessment.overall.accuracyScore);
        updateMatrix(matrices.bySection.research_field, fieldAssessment.overall.rating, fieldAssessment.overall.accuracyScore);
      }
    }

    // Process research problem section
    const problemAssessment = evaluation.evaluationState?.research_problem?.finalAssessment;
    if (problemAssessment) {
      if (!matrices.bySection.research_problem) {
        matrices.bySection.research_problem = createEmptyMatrix();
      }
      
      // Process problem identification
      if (problemAssessment.problemIdentification) {
        updateMatrix(matrices.overall, problemAssessment.problemIdentification.rating, problemAssessment.problemIdentification.accuracyScore);
        updateMatrix(matrices.bySection.research_problem, problemAssessment.problemIdentification.rating, problemAssessment.problemIdentification.accuracyScore);
      }
      
      // Process problem clarity
      if (problemAssessment.problemClarity) {
        updateMatrix(matrices.overall, problemAssessment.problemClarity.rating, problemAssessment.problemClarity.accuracyScore);
        updateMatrix(matrices.bySection.research_problem, problemAssessment.problemClarity.rating, problemAssessment.problemClarity.accuracyScore);
      }
      
      // Process overall problem assessment
      if (problemAssessment.overall) {
        updateMatrix(matrices.overall, problemAssessment.overall.rating, problemAssessment.overall.accuracyScore);
        updateMatrix(matrices.bySection.research_problem, problemAssessment.overall.rating, problemAssessment.overall.accuracyScore);
      }
    }

    // Process template section
    const templateAssessment = evaluation.evaluationState?.template?.finalAssessment;
    if (templateAssessment) {
      if (!matrices.bySection.template) {
        matrices.bySection.template = createEmptyMatrix();
      }
      
      // Process template fields
      ['titleAccuracy', 'descriptionQuality', 'propertyCoverage', 'researchAlignment'].forEach(field => {
        if (templateAssessment[field] !== undefined) {
          const rating = templateAssessment[field];
          const accuracyScore = templateAssessment.accuracyMetrics?.[field];
          updateMatrix(matrices.overall, rating, accuracyScore);
          updateMatrix(matrices.bySection.template, rating, accuracyScore);
        }
      });
      
      // Process overall template score
      if (templateAssessment.overallScore !== undefined) {
        updateMatrix(matrices.overall, templateAssessment.overallScore * 5, templateAssessment.overallScore);
        updateMatrix(matrices.bySection.template, templateAssessment.overallScore * 5, templateAssessment.overallScore);
      }
    }

    // Process content section
    const contentAssessment = evaluation.evaluationState?.content?.finalAssessment;
    if (contentAssessment) {
      if (!matrices.bySection.content) {
        matrices.bySection.content = createEmptyMatrix();
      }
      
      // Process content metrics
      const metrics = contentAssessment.metrics;
      if (metrics) {
        Object.keys(metrics).forEach(metricKey => {
          const metric = metrics[metricKey];
          if (metric && metric.score !== undefined) {
            updateMatrix(matrices.overall, metric.score * 5, metric.score);
            updateMatrix(matrices.bySection.content, metric.score * 5, metric.score);
          }
        });
      }
    }

    // Process system performance section
    const systemPerformance = evaluation.evaluationState?.systemPerformance?.assessment;
    if (systemPerformance) {
      if (!matrices.bySection.system_performance) {
        matrices.bySection.system_performance = createEmptyMatrix();
      }
      
      ['responsiveness', 'errors', 'stability', 'overall'].forEach(field => {
        if (systemPerformance[field] !== undefined) {
          updateMatrix(matrices.overall, systemPerformance[field]);
          updateMatrix(matrices.bySection.system_performance, systemPerformance[field]);
        }
      });
    }
  });

  // Calculate metrics for all matrices
  matrices.overall.metrics = calculateMetrics(matrices.overall);
  Object.keys(matrices.bySection).forEach(section => {
    matrices.bySection[section].metrics = calculateMetrics(matrices.bySection[section]);
  });

  return matrices;
};

const createEmptyMatrix = () => ({
  truePositive: 0,
  trueNegative: 0,
  falsePositive: 0,
  falseNegative: 0,
  metrics: null
});

const updateMatrix = (matrix, rating, accuracyScore = null) => {
  // If we have an accuracy score, use that to determine TP/TN/FP/FN
  if (accuracyScore !== null && accuracyScore !== undefined) {
    // High accuracy score (>0.8) = True Positive or True Negative depending on rating
    if (accuracyScore >= 0.8) {
      if (rating >= 4) {
        matrix.truePositive++;
      } else {
        matrix.trueNegative++;
      }
    } else if (accuracyScore >= 0.5) {
      // Medium accuracy - split between correct and incorrect
      if (rating >= 4) {
        matrix.truePositive += 0.5;
        matrix.falsePositive += 0.5;
      } else {
        matrix.trueNegative += 0.5;
        matrix.falseNegative += 0.5;
      }
    } else {
      // Low accuracy = False Positive or False Negative
      if (rating >= 4) {
        matrix.falsePositive++;
      } else {
        matrix.falseNegative++;
      }
    }
  } else {
    // Fall back to rating-based classification
    // Ratings 4-5 are considered positive, 1-2 negative, 3 neutral
    if (rating >= 4) {
      matrix.truePositive++;
    } else if (rating <= 2) {
      matrix.trueNegative++;
    } else if (rating === 3) {
      // Split neutral ratings
      matrix.truePositive += 0.5;
      matrix.trueNegative += 0.5;
    }
  }
};

const calculateMetrics = (matrix) => {
  const total = matrix.truePositive + matrix.trueNegative + 
                matrix.falsePositive + matrix.falseNegative;
  
  if (total === 0) {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      specificity: 0
    };
  }

  const accuracy = (matrix.truePositive + matrix.trueNegative) / total;
  const precision = matrix.truePositive / (matrix.truePositive + matrix.falsePositive) || 0;
  const recall = matrix.truePositive / (matrix.truePositive + matrix.falseNegative) || 0;
  const f1Score = precision + recall > 0 
    ? 2 * (precision * recall) / (precision + recall) 
    : 0;
  const specificity = matrix.trueNegative / (matrix.trueNegative + matrix.falsePositive) || 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    specificity
  };
};

/**
 * Get confusion matrix for a specific section
 * @param {Object} processedData - Processed evaluation data
 * @param {string} section - Section name (metadata, research_field, research_problem, template, content)
 * @returns {Object} Confusion matrix for the section
 */
export const getConfusionMatrixForSection = (processedData, section) => {
  const matrices = calculateConfusionMatrices(processedData);
  return matrices.bySection[section] || createEmptyMatrix();
};

/**
 * Get overall confusion matrix
 * @param {Object} processedData - Processed evaluation data
 * @returns {Object} Overall confusion matrix
 */
export const getOverallConfusionMatrix = (processedData) => {
  const matrices = calculateConfusionMatrices(processedData);
  return matrices.overall;
};