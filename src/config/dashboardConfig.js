// src/config/dashboardConfig.js
export const DASHBOARD_CONFIG = {
  sections: [
    { id: 'metadata', label: 'Metadata', color: '#3B82F6' },
    { id: 'researchField', label: 'Research Field', color: '#10B981' },
    { id: 'researchProblem', label: 'Research Problem', color: '#F59E0B' },
    { id: 'template', label: 'Template', color: '#8B5CF6' },
    { id: 'content', label: 'Content Analysis', color: '#EC4899' },
    { id: 'systemPerformance', label: 'System Performance', color: '#14B8A6' },
    { id: 'innovation', label: 'Innovation', color: '#F97316' },
    { id: 'comparativeAnalysis', label: 'Comparative Analysis', color: '#6366F1' },
    { id: 'ragHighlight', label: 'RAG Highlight', color: '#84CC16' }
  ],
  
  thresholds: {
    excellent: 0.8,
    good: 0.6,
    fair: 0.4,
    poor: 0.2
  },
  
  expertiseLevels: [
    { min: 0, max: 2, label: 'Low', color: '#FCA5A5' },
    { min: 2, max: 3.5, label: 'Medium', color: '#FDE68A' },
    { min: 3.5, max: 5, label: 'High', color: '#86EFAC' }
  ],
  
  chartColors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B',
    quaternary: '#8B5CF6',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6'
  }
};

export const METRIC_LABELS = {
  accuracy: 'Accuracy',
  precision: 'Precision',
  recall: 'Recall',
  f1Score: 'F1 Score',
  specificity: 'Specificity',
  truePositive: 'True Positive',
  trueNegative: 'True Negative',
  falsePositive: 'False Positive',
  falseNegative: 'False Negative'
};

export const ROLE_DISPLAY_NAMES = {
  'Professor': 'Professor',
  'PostDoc': 'Post-Doctoral Researcher',
  'Senior Researcher': 'Senior Researcher',
  'Researcher': 'Researcher',
  'PhD Student': 'PhD Student',
  'Research Assistant': 'Research Assistant',
  'Master Student': 'Master\'s Student',
  'Bachelor Student': 'Bachelor\'s Student',
  'Other': 'Other'
};