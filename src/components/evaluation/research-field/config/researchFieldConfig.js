// src/components/evaluation/research-field/config/researchFieldConfig.js

export const RESEARCH_FIELD_METRICS = {
  PRIMARY_FIELD: {
    key: 'primaryField',
    label: 'Primary Field Detection',
    description: 'Evaluate how accurately the system identified the main research field.',
    type: 'accuracy'
  },
  CONFIDENCE: {
    key: 'confidence',
    label: 'Confidence Scores',
    description: 'Assess the appropriateness of confidence scores.',
    type: 'confidence'
  },
  CONSISTENCY: {
    key: 'consistency',
    label: 'Overall Consistency',
    description: 'Assess whether the suggested fields are consistent with one another and with the paper\'s main topic.',
    type: 'accuracy'
  },
  RELEVANCE: {
    key: 'relevance',
    label: 'Overall Relevance',
    description: 'Assess how well all suggested fields match the paper content.',
    type: 'quality'
  }
};

// Evaluation fields for form
export const EVALUATION_FIELDS = [
  { 
    id: 'primaryField', 
    label: 'Primary Field Detection', 
    description: 'Evaluate accuracy of main research field identification' 
  },
  { 
    id: 'confidence', 
    label: 'Confidence Scores', 
    description: 'Assess appropriateness of confidence scores' 
  },
  { 
    id: 'consistency', 
    label: 'Overall Consistency', 
    description: 'Evaluate consistency between suggested fields' 
  },
  { 
    id: 'relevance', 
    label: 'Overall Relevance', 
    description: 'Assess match between fields and paper content' 
  }
];

// Metric definitions for text displays
export const ACCURACY_METRIC_DEFINITIONS = {
  precision: (refSpan, extractedSpan) => `
    <div class="space-y-2">
      <p><strong>Exact Match Precision</strong></p>
      <p>Measures whether the top predicted field exactly matches the expected field.</p>
      <div class="bg-gray-50 p-2 rounded mt-2">
        <p class="font-medium">Formula:</p>
        <p>1.0 if the first prediction matches exactly</p>
        <p>0.0 if the first prediction doesn't match</p>
      </div>
    </div>
  `,
  recall: (refSpan, extractedSpan) => `
    <div class="space-y-2">
      <p><strong>Field Recall</strong></p>
      <p>Measures whether the expected field appears anywhere in the predictions.</p>
      <div class="bg-gray-50 p-2 rounded mt-2">
        <p class="font-medium">Formula:</p>
        <p>1.0 if the field appears in any prediction</p>
        <p>0.0 if the field is not found</p>
      </div>
    </div>
  `,
  f1Score: (refSpan, extractedSpan) => `
    <div class="space-y-2">
      <p><strong>F1 Score</strong></p>
      <p>Balanced measure combining precision and recall.</p>
      <div class="bg-gray-50 p-2 rounded mt-2">
        <p class="font-medium">Formula:</p>
        <p>2 × (Precision × Recall) / (Precision + Recall)</p>
        <p class="mt-1">This score balances between exact match (precision) and field presence (recall).</p>
      </div>
    </div>
  `,
  topN: (refSpan, extractedSpan) => `
    <div class="space-y-2">
      <p><strong>Top-3 Presence</strong></p>
      <p>Measures whether the expected field appears in the top 3 predictions.</p>
      <div class="bg-gray-50 p-2 rounded mt-2">
        <p class="font-medium">Formula:</p>
        <p>1.0 if the field is in top 3 predictions</p>
        <p>0.0 if it's ranked 4th or lower</p>
      </div>
    </div>
  `
};

// Text configurations for components
export const TEXT_CONFIG = {
  accuracy: {
    titles: {
      overallScore: 'Overall Field Detection Score (Human-System Balanced)',
      automatedScore: 'Automated Field Detection Score',
      analysisTitle: 'Detailed Field Detection Analysis',
      hideAnalysis: 'Hide detailed analysis',
      showAnalysis: 'View detailed analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      accuracy: 'Combines automated analysis with human expertise, giving more weight to expert judgment while maintaining objective measurements.'
    },
    analysisLabels: {
      accuracy: {
        title: 'Field Detection Analysis:',
        description: 'The automated score is calculated by combining three metrics:',
        metrics: [
          {name: 'Exact Match (40%):', description: 'Does the top prediction exactly match the expected field?'},
          {name: 'Top-3 Presence (30%):', description: 'Does the expected field appear in the top 3 predictions?'},
          {name: 'Position Score (30%):', description: 'How high does the expected field appear in the predictions?'}
        ]
      }
    }
  },
  quality: {
    titles: {
      overallScore: 'Overall Quality (Human-System Balanced)',
      automatedScore: 'Automated Quality Score: is calculated based on the Quality Dimension	Confidence (40%)	Relevance (30%)	Consistency (30%)',
      analysisTitle: 'Detailed Quality Analysis',
      hideAnalysis: 'Hide detailed analysis',
      showAnalysis: 'View detailed analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      quality: 'Balanced scoring combines automated metrics with expert assessment, weighted by expertise level and confidence.'
    },
    analysisLabels: {
      title: 'Component Quality Analysis:',
      description: 'The overall quality is calculated by combining three key dimensions:',
      metrics: [
        {name: 'Confidence (40%):', description: 'Prediction confidence based on hierarchy position'},
        {name: 'Relevance (30%):', description: 'Semantic alignment in taxonomy'},
        {name: 'Consistency (30%):', description: 'Coherence between multiple predictions'}
      ]
    }
  }
};

// Metric explanation templates for different metric types
export const METRIC_EXPLANATIONS = {
  precision: (groundTruth, predictions, similarityData) => ({
    title: 'Exact Match Precision',
    description: 'Measures whether the top predicted field exactly matches the expected field.',
    formula: '1.0 if top prediction matches, 0.0 otherwise',
    calculation: `Prediction: "${predictions[0]?.name || 'N/A'}" vs Expected: "${groundTruth}"
Result: ${similarityData.exactMatch ? '1.0 (Match)' : '0.0 (No Match)'}`,
    example: `For this document, the system's top prediction is "<span class="text-green-600 font-medium">${predictions[0]?.name || 'N/A'}</span>" when the expected field is "<span class="text-red-600 font-medium">${groundTruth}</span>".`
  }),
  
  recall: (groundTruth, predictions, similarityData) => ({
    title: 'Field Recall',
    description: 'Measures whether the expected field appears anywhere in the predictions.',
    formula: '1.0 if field appears in any prediction, 0.0 otherwise',
    calculation: `Expected: "${groundTruth}"
Found: ${similarityData.foundPosition ? `Yes, at position ${similarityData.foundPosition}` : 'No'}
Result: ${similarityData.foundPosition ? '1.0' : '0.0'}`,
    example: `For this document, the system ${similarityData.foundPosition ? `found the expected field "<span class="text-red-600 font-medium">${groundTruth}</span>" at position ${similarityData.foundPosition}` : `did not find the expected field "<span class="text-red-600 font-medium">${groundTruth}</span>" in any prediction`}.`
  }),
  
  f1Score: (groundTruth, predictions, similarityData, formatPercentage) => ({
    title: 'F1 Score',
    description: 'Balanced measure combining precision and recall.',
    formula: '2 × (Precision × Recall) / (Precision + Recall)',
    calculation: `Precision: ${formatPercentage(similarityData.exactMatch || 0)}
Recall: ${formatPercentage(similarityData.recall || 0)}
F1 = 2 × (${similarityData.exactMatch || 0} × ${similarityData.recall || 0}) / (${similarityData.exactMatch || 0} + ${similarityData.recall || 0})`,
    example: `For this document, the F1 score balances the exact match precision (${formatPercentage(similarityData.exactMatch || 0)}) with the recall (${formatPercentage(similarityData.recall || 0)}) between "<span class="text-green-600 font-medium">${predictions[0]?.name || 'N/A'}</span>" and "<span class="text-red-600 font-medium">${groundTruth}</span>".`
  }),
  
  topN: (groundTruth, predictions, similarityData, formatPercentage) => ({
    title: 'Top-3 Presence',
    description: 'Measures whether the expected field appears in the top 3 predictions.',
    formula: '1.0 if field is in top 3 predictions, 0.0 otherwise',
    calculation: `Expected: "${groundTruth}"
Position: ${similarityData.foundPosition || 'Not found'}
Is in top 3: ${similarityData.topN ? 'Yes' : 'No'}
Result: ${formatPercentage(similarityData.topN || 0)}`,
    example: `For this document, the expected field "<span class="text-red-600 font-medium">${groundTruth}</span>" ${similarityData.foundPosition ? `appears at position ${similarityData.foundPosition}` : 'does not appear in the top predictions'}.`
  })
};

// Component weights for the similarity table
export const FIELD_ACCURACY_WEIGHTS = {
  exactMatch: 0.4,
  topN: 0.3,
  positionScore: 0.3
};

// For the similarity table column headers
export const SIMILARITY_TABLE_COLUMNS = [
  { key: 'exactMatch', label: 'Exact Match', weight: 0.4 },
  { key: 'topN', label: 'Top-3', weight: 0.3 },
  { key: 'positionScore', label: 'Position', weight: 0.3 }
];


// Metric configurations
export const METRIC_CONFIG = {
  accuracy: {
    primaryMetrics: ['precision', 'recall'],
    mainMetric: 'f1Score',
    displayName: 'Field Detection Accuracy'
  },
  quality: {
    primaryMetrics: ['confidence', 'relevance', 'consistency'],
    mainMetric: 'overallQuality',
    displayName: 'Quality'
  }
};

// Quality component weights
export const QUALITY_WEIGHTS = {
  confidence: 0.4,
  relevance: 0.3,
  consistency: 0.3
};

// Preserve original configuration and helper functions
export const RESEARCH_FIELD_CONFIG = {
  // Overall weights (accuracy vs quality)
  overallWeights: {
    accuracy: 0.6,
    quality: 0.4
  },
  
  // Score thresholds for visual indicators
  scoreThresholds: {
    good: 0.9,
    medium: 0.7
  }
};

// Helper function to get ORKG field position in predictions
export const getOrkgFieldPosition = (orkgValue, predictedValues) => {
  if (!orkgValue || !predictedValues || !predictedValues.length) {
    return -1;
  }
  
  return predictedValues.findIndex(
    field => field.name.toLowerCase() === orkgValue.toLowerCase()
  );
};

// Helper to calculate confidence drop rate
export const calculateConfidenceDropRate = (predictedValues) => {
  if (!predictedValues || predictedValues.length < 2) {
    return 0.5;
  }
  
  const topN = Math.min(predictedValues.length, 3);
  const confidences = predictedValues
    .slice(0, topN)
    .map(field => field.score / 100);
  
  let totalDrop = 0;
  for (let i = 1; i < confidences.length; i++) {
    totalDrop += (confidences[i-1] - confidences[i]);
  }
  
  const avgDrop = totalDrop / (confidences.length - 1);
  return Math.min(avgDrop * 2, 1.0);
};

// Default rating values
export const DEFAULT_RATINGS = {
  primaryField: 3,
  confidence: 3,
  consistency: 3,
  relevance: 3
};