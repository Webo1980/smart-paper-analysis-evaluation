// File: src/components/dashboard/shared/DetailedAccuracyMetrics.jsx

import React, { useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Info, Target, CheckCircle, AlertCircle } from 'lucide-react';
import MetricsExtractor from '../../../utils/metricsExtractor';

/**
 * DetailedAccuracyMetrics Component - v3
 * 
 * v3 CHANGES:
 * 1. Accepts pre-calculated `aggregatedMetrics` prop to avoid recalculation
 * 2. ALWAYS renders - shows helpful message when no data instead of hiding
 * 3. Better null handling for all metric types
 * 4. Proper rendering of all available metrics
 */

const DetailedAccuracyMetrics = ({ componentName, papers, aggregatedMetrics }) => {
  // Use passed aggregatedMetrics or calculate if not provided
  const metrics = useMemo(() => {
    if (aggregatedMetrics) return aggregatedMetrics;
    
    if (!papers || papers.length === 0) return null;
    
    // Extract evaluations from papers
    const evaluations = [];
    papers.forEach(paper => {
      if (paper.userEvaluations && Array.isArray(paper.userEvaluations)) {
        evaluations.push(...paper.userEvaluations);
      } else if (paper.evaluations && Array.isArray(paper.evaluations)) {
        evaluations.push(...paper.evaluations);
      } else if (paper.evaluation) {
        evaluations.push(paper.evaluation);
      }
    });
    
    return MetricsExtractor.aggregateMetrics(evaluations, componentName, null, 'accuracy');
  }, [papers, componentName, aggregatedMetrics]);

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '—';
    return value.toFixed(decimals);
  };

  const getScoreColor = (value) => {
    if (value === null || value === undefined) return 'text-gray-400';
    if (value >= 0.8) return 'text-green-600';
    if (value >= 0.6) return 'text-yellow-600';
    if (value >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (value) => {
    if (value === null || value === undefined) return 'bg-gray-100';
    if (value >= 0.8) return 'bg-green-100';
    if (value >= 0.6) return 'bg-yellow-100';
    if (value >= 0.4) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Helper to check if stats object has meaningful data
  const hasStats = (stats) => {
    return stats && (stats.mean !== undefined || stats.count > 0);
  };

  // Render a metric card
  const MetricCard = ({ label, stats, showDistribution = false }) => {
    if (!hasStats(stats)) return null;
    
    return (
      <div className={`p-3 rounded-lg ${getScoreBgColor(stats.mean)}`}>
        <div className="text-xs text-gray-600 uppercase mb-1">{label}</div>
        <div className={`text-lg font-bold ${getScoreColor(stats.mean)}`}>
          {formatPercent(stats.mean)}
        </div>
        {stats.count > 1 && (
          <div className="text-xs text-gray-500 mt-1">
            <span>σ: {formatNumber(stats.std, 3)}</span>
            <span className="mx-1">|</span>
            <span>n={stats.count}</span>
          </div>
        )}
        {showDistribution && stats.distribution && (
          <div className="mt-2 flex gap-0.5">
            {Object.entries(stats.distribution).map(([range, count]) => (
              <div
                key={range}
                className="flex-1 bg-gray-300 rounded-sm overflow-hidden"
                style={{ height: '20px' }}
                title={`${range}: ${count} evaluations`}
              >
                <div
                  className="bg-blue-500 h-full"
                  style={{ 
                    height: `${stats.count > 0 ? (count / stats.count) * 100 : 0}%` 
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Determine what content to show based on component type
  const renderContent = () => {
    if (!metrics) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>No accuracy metrics available for {componentName.replace(/_/g, ' ')}.</span>
        </div>
      );
    }

    // Check if there's any meaningful data
    const hasAnyData = metrics.final || metrics.automated || metrics.levenshtein || 
                       metrics.tokenMatching || metrics.exactMatchRate || 
                       metrics.titleAlignment || metrics.propertyOverlap ||
                       (metrics.properties && Object.keys(metrics.properties).length > 0);

    if (!hasAnyData) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>Accuracy data being processed for {componentName.replace(/_/g, ' ')}.</span>
        </div>
      );
    }

    switch (componentName) {
      case 'metadata':
        return renderMetadataMetrics();
      case 'research_field':
        return renderResearchFieldMetrics();
      case 'research_problem':
        return renderResearchProblemMetrics();
      case 'template':
        return renderTemplateMetrics();
      case 'content':
        return renderContentMetrics();
      default:
        return renderGenericMetrics();
    }
  };

  const renderMetadataMetrics = () => (
    <div className="space-y-4">
      {/* Main Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Final Score" stats={metrics.final} />
        <MetricCard label="Automated" stats={metrics.automated} />
        <MetricCard label="Levenshtein" stats={metrics.levenshtein} />
        <MetricCard label="Token Matching" stats={metrics.tokenMatching} />
      </div>
      
      {/* Token Details */}
      {metrics.tokenDetails && (hasStats(metrics.tokenDetails.precision) || 
         hasStats(metrics.tokenDetails.recall) || hasStats(metrics.tokenDetails.f1Score)) && (
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase">Token Matching Details</h5>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Precision" stats={metrics.tokenDetails.precision} />
            <MetricCard label="Recall" stats={metrics.tokenDetails.recall} />
            <MetricCard label="F1 Score" stats={metrics.tokenDetails.f1Score} />
          </div>
        </div>
      )}
      
      {/* Special Char if available */}
      {hasStats(metrics.specialChar) && (
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase">Special Character Handling</h5>
          <MetricCard label="Special Char Score" stats={metrics.specialChar} />
        </div>
      )}
    </div>
  );

  const renderResearchFieldMetrics = () => (
    <div className="space-y-4">
      {/* Exact Match Rate */}
      {metrics.exactMatchRate && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Exact Match Rate</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-blue-900">
                {metrics.exactMatchRate.count} / {metrics.exactMatchRate.total}
              </span>
              <Badge className="bg-blue-100 text-blue-800">
                {formatPercent(metrics.exactMatchRate.rate)}
              </Badge>
            </div>
          </div>
        </div>
      )}
      
      {/* Other Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Final Score" stats={metrics.final} />
        <MetricCard label="Recall" stats={metrics.recall} />
        <MetricCard label="Hierarchy" stats={metrics.hierarchyAlignment} />
        <MetricCard label="Automated" stats={metrics.automated} />
      </div>
    </div>
  );

  const renderResearchProblemMetrics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Final Score" stats={metrics.final} />
        <MetricCard label="Title Alignment" stats={metrics.titleAlignment} />
        <MetricCard label="Content Coverage" stats={metrics.contentCoverage} />
        <MetricCard label="Automated" stats={metrics.automated} />
      </div>
      
      {/* Precision/Recall/F1 */}
      {(hasStats(metrics.precision) || hasStats(metrics.recall) || hasStats(metrics.f1Score)) && (
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase">Matching Metrics</h5>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Precision" stats={metrics.precision} />
            <MetricCard label="Recall" stats={metrics.recall} />
            <MetricCard label="F1 Score" stats={metrics.f1Score} />
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplateMetrics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Final Score" stats={metrics.final} />
        <MetricCard label="Property Overlap" stats={metrics.propertyOverlap} />
        <MetricCard label="Structural Similarity" stats={metrics.structuralSimilarity} />
        <MetricCard label="Automated" stats={metrics.automated} />
      </div>
      
      {/* Additional Template Metrics */}
      {(hasStats(metrics.titleAccuracy) || hasStats(metrics.descriptionQuality) || hasStats(metrics.propertyCoverage)) && (
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase">Template Quality</h5>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Title Accuracy" stats={metrics.titleAccuracy} />
            <MetricCard label="Description Quality" stats={metrics.descriptionQuality} />
            <MetricCard label="Property Coverage" stats={metrics.propertyCoverage} />
          </div>
        </div>
      )}
    </div>
  );

  const renderContentMetrics = () => {
    if (!metrics.properties || Object.keys(metrics.properties).length === 0) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>Content accuracy is calculated at the property level. Expand individual papers for details.</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {metrics.final && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Overall Content Accuracy" stats={metrics.final} />
          </div>
        )}
        
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase">By Property</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(metrics.properties).map(([prop, stats]) => (
              <div key={prop} className={`p-2 rounded ${getScoreBgColor(stats?.mean)}`}>
                <div className="text-xs text-gray-600 truncate" title={prop}>{prop}</div>
                <div className={`text-sm font-bold ${getScoreColor(stats?.mean)}`}>
                  {formatPercent(stats?.mean)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGenericMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Final Score" stats={metrics.final} />
      <MetricCard label="Automated" stats={metrics.automated} />
    </div>
  );

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Target className="h-4 w-4" />
        Accuracy Metrics
        {metrics && metrics.final?.count && (
          <Badge variant="outline" className="text-xs">
            {metrics.final.count} evaluations
          </Badge>
        )}
      </h4>
      {renderContent()}
    </div>
  );
};

export default DetailedAccuracyMetrics;