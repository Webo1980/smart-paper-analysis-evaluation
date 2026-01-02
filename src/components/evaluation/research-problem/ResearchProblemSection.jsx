// src\components\evaluation\research-problem\ResearchProblemSection.jsx

// Export main components for research problem evaluation
import ResearchProblemAssessmentManager from './managers/ResearchProblemAssessmentManager';
export { default as ResearchProblemEvaluationForm } from './components/ResearchProblemEvaluationForm';
export { default as ResearchProblemEvaluationReport } from './components/ResearchProblemEvaluationReport';
export { default as ResearchProblemAnalysis } from './components/ResearchProblemAnalysis';
export { default as ResearchProblemAccuracyMetrics } from './components/ResearchProblemAccuracyMetrics';
export { default as ResearchProblemQualityMetrics } from './components/ResearchProblemQualityMetrics';
export { default as ResearchProblemPreview } from './components/ResearchProblemPreview';
export { default as ResearchProblemComparisonView } from './components/ResearchProblemComparisonView';

// Export visualization components
export { default as SpiderChartVisualization } from './visualizations/SpiderChartVisualization';

// Export configurations
export { 
  RESEARCH_PROBLEM_CONFIG,
  RESEARCH_PROBLEM_METRICS,
  EVALUATION_FIELDS,
  QUALITY_WEIGHTS,
  PROBLEM_ACCURACY_WEIGHTS
} from './config/researchProblemConfig';

// Export utility functions for external use
export {
  extractGroundTruth,
  extractProblemData,
  extractProblemFromEvalData,
  formatUserRating
} from './utils/researchProblemMetrics';

export { evaluateResearchProblem } from './utils/researchProblemEvaluation';
export { compareResearchProblems } from './utils/advancedContentAnalysisUtils';

// Default export for easy import
export default ResearchProblemAssessmentManager;