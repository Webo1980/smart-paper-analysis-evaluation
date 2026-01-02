// src/components/dashboard/charts/EvaluationChartsCollection.jsx
// Combined view of all evaluation charts with research interpretations
// 
// DATA CONSISTENCY: All charts use aggregatedData from aggregationService
// - aggregatedData.papers: paper-level aggregated scores
// - aggregatedData.components: component-level aggregated metrics
// - aggregatedData.correlations: inter-component correlation matrix
// - aggregatedData.temporal: temporal trends data
// - aggregatedData.globalStats: global statistics
// - aggregatedData.evaluators: per-evaluator metrics

import React from 'react';
import { Alert, AlertDescription } from '../../ui/alert';
import { BarChart3, Info } from 'lucide-react';

// Import all charts - all use aggregatedData for consistency
import ScoreDistributionChart from './ScoreDistributionChart';
import SystemVsGroundTruthChart from './SystemVsGroundTruthChart';
import SourceCoverageChart from './SourceCoverageChart';
import ExpertiseWeightedImpactChart from './ExpertiseWeightedImpactChart';
import CorrelationHeatmap from './CorrelationHeatmap';
import SectionPerformanceRadar from './SectionPerformanceRadar';
import TemporalTrendsChart from './TemporalTrendsChart';

const EvaluationChartsCollection = ({ data, aggregatedData, integratedData }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Evaluation Analytics</h2>
          <p className="text-gray-600">Comprehensive analysis with research-ready insights</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Score Distribution - Full Width */}
        <ScoreDistributionChart 
          aggregatedData={aggregatedData} 
          integratedData={integratedData} 
        />

        {/* Correlation & Radar - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CorrelationHeatmap 
            data={data}
            aggregatedData={aggregatedData} 
          />
          <SectionPerformanceRadar 
            data={data}
            aggregatedData={aggregatedData} 
          />
        </div>

        {/* System Validation - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemVsGroundTruthChart 
            aggregatedData={aggregatedData} 
            integratedData={integratedData} 
          />
          <SourceCoverageChart 
            aggregatedData={aggregatedData} 
            integratedData={integratedData} 
          />
        </div>

        {/* Expertise Analysis - Full Width */}
        <ExpertiseWeightedImpactChart 
          aggregatedData={aggregatedData} 
          integratedData={integratedData} 
        />
      </div>
    </div>
  );
};

export default EvaluationChartsCollection;