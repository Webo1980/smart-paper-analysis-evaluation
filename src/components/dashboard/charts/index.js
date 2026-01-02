// src/components/dashboard/charts/index.js
// Export all chart components for easy importing
// 
// DATA CONSISTENCY: All charts use aggregatedData from aggregationService
// - aggregatedData.papers: paper-level aggregated scores
// - aggregatedData.components: component-level aggregated metrics
// - aggregatedData.correlations: inter-component correlation matrix
// - aggregatedData.temporal: temporal trends data
// - aggregatedData.globalStats: global statistics
// - aggregatedData.evaluators: per-evaluator metrics

// Core charts using aggregatedData.components and aggregatedData.correlations
export { default as CorrelationHeatmap } from './CorrelationHeatmap';
export { default as SectionPerformanceRadar } from './SectionPerformanceRadar';

// Research-ready charts using aggregatedData.papers and aggregatedData.components
export { default as ScoreDistributionChart } from './ScoreDistributionChart';
export { default as SystemVsGroundTruthChart } from './SystemVsGroundTruthChart';
export { default as SourceCoverageChart } from './SourceCoverageChart';
export { default as ExpertiseWeightedImpactChart } from './ExpertiseWeightedImpactChart';

// Combined collection component
export { default as EvaluationChartsCollection } from './EvaluationChartsCollection';