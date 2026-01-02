export const defaultMetricConfig = {
    accuracy: {
      primaryMetrics: ['precision', 'recall'],
      mainMetric: 'f1Score',
      displayName: 'Accuracy'
    },
    quality: {
      primaryMetrics: ['completeness', 'consistency', 'validity'],
      mainMetric: 'overallQuality',
      displayName: 'Quality'
    },
    researchField: {
      accuracy: {
        primaryMetrics: ['precision', 'recall', 'hierarchicalF1'],
        mainMetric: 'hierarchicalF1',
        displayName: 'Field Detection Accuracy'
      },
      quality: {
        primaryMetrics: ['relevance', 'specificity', 'consistency'],
        mainMetric: 'overallQuality',
        displayName: 'Field Quality'
      }
    },
    metadata: {
      accuracy: {
        primaryMetrics: ['precision', 'recall'],
        mainMetric: 'f1Score',
        displayName: 'Metadata Accuracy'
      },
      quality: {
        primaryMetrics: ['completeness', 'consistency', 'validity'],
        mainMetric: 'overallQuality',
        displayName: 'Metadata Quality'
      }
    }
  };
  
  export default defaultMetricConfig;