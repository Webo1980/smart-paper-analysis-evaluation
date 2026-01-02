// File: src/components/dashboard/shared/DetailedQualityMetrics.jsx

import React, { useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Info, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import MetricsExtractor from '../../../utils/metricsExtractor';

/**
 * DetailedQualityMetrics Component - v3
 * 
 * v3 CHANGES:
 * 1. Accepts pre-calculated `aggregatedMetrics` prop to avoid recalculation
 * 2. ALWAYS renders - shows helpful message when no data instead of hiding
 * 3. Better null handling for all metric types
 * 4. Proper rendering of completeness, consistency, validity
 */

const DetailedQualityMetrics = ({ componentName, papers, aggregatedMetrics }) => {
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
    
    return MetricsExtractor.aggregateMetrics(evaluations, componentName, null, 'quality');
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
    return stats && (stats.mean !== undefined || stats.score !== undefined || stats.count > 0);
  };

  // Get the score value from either mean or score property
  const getScore = (stats) => {
    if (!stats) return null;
    return stats.mean !== undefined ? stats.mean : stats.score;
  };

  // Render a quality metric card
  const QualityCard = ({ label, stats, icon: Icon }) => {
    const score = getScore(stats);
    if (score === null && score === undefined && !hasStats(stats)) return null;
    
    return (
      <div className={`p-3 rounded-lg ${getScoreBgColor(score)}`}>
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="h-3 w-3 text-gray-500" />}
          <span className="text-xs text-gray-600 uppercase">{label}</span>
        </div>
        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
          {formatPercent(score)}
        </div>
        {stats?.count > 1 && (
          <div className="text-xs text-gray-500 mt-1">
            <span>σ: {formatNumber(stats.std, 3)}</span>
            <span className="mx-1">|</span>
            <span>n={stats.count}</span>
          </div>
        )}
      </div>
    );
  };

  // Render issues list
  const IssuesList = ({ issues, label }) => {
    if (!issues || issues.length === 0) return null;
    
    return (
      <div className="mt-2">
        <div className="text-xs font-medium text-gray-600 mb-1">{label} Issues:</div>
        <div className="space-y-1">
          {issues.slice(0, 5).map((issue, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">
                {typeof issue === 'string' ? issue : issue.issue}
                {issue.count && issue.count > 1 && (
                  <Badge variant="outline" className="ml-1 text-xs">{issue.count}x</Badge>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Determine what content to show
  const renderContent = () => {
    if (!metrics) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>No quality metrics available for {componentName.replace(/_/g, ' ')}.</span>
        </div>
      );
    }

    // Check if there's any meaningful data - include new metric types
    const hasAnyData = hasStats(metrics.completeness) || hasStats(metrics.consistency) || 
                       hasStats(metrics.validity) || hasStats(metrics.relevance) ||
                       hasStats(metrics.confidence) || hasStats(metrics.problemTitle) ||
                       hasStats(metrics.problemDescription) || hasStats(metrics.evidenceQuality) ||
                       hasStats(metrics.final);

    if (!hasAnyData) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>Quality data being processed for {componentName.replace(/_/g, ' ')}.</span>
        </div>
      );
    }

    // Render component-specific quality metrics
    const renderMetrics = () => {
      switch (componentName) {
        case 'metadata':
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <QualityCard label="Completeness" stats={metrics.completeness} icon={CheckCircle} />
              <QualityCard label="Consistency" stats={metrics.consistency} icon={Shield} />
              <QualityCard label="Validity" stats={metrics.validity} icon={CheckCircle} />
            </div>
          );
        
        case 'research_field':
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {hasStats(metrics.confidence) && (
                <QualityCard label="Confidence" stats={metrics.confidence} icon={CheckCircle} />
              )}
              {hasStats(metrics.relevance) && (
                <QualityCard label="Relevance" stats={metrics.relevance} icon={CheckCircle} />
              )}
              {hasStats(metrics.consistency) && (
                <QualityCard label="Consistency" stats={metrics.consistency} icon={Shield} />
              )}
            </div>
          );
          
        case 'research_problem':
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {hasStats(metrics.problemTitle) && (
                <QualityCard label="Title Quality" stats={metrics.problemTitle} icon={CheckCircle} />
              )}
              {hasStats(metrics.problemDescription) && (
                <QualityCard label="Description" stats={metrics.problemDescription} icon={CheckCircle} />
              )}
              {hasStats(metrics.relevance) && (
                <QualityCard label="Relevance" stats={metrics.relevance} icon={CheckCircle} />
              )}
              {hasStats(metrics.evidenceQuality) && (
                <QualityCard label="Evidence" stats={metrics.evidenceQuality} icon={Shield} />
              )}
            </div>
          );
          
        case 'template':
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <QualityCard label="Completeness" stats={metrics.completeness} icon={CheckCircle} />
              <QualityCard label="Consistency" stats={metrics.consistency} icon={Shield} />
              <QualityCard label="Validity" stats={metrics.validity} icon={CheckCircle} />
            </div>
          );
          
        default:
          // Generic fallback - show whatever metrics are available
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {hasStats(metrics.completeness) && <QualityCard label="Completeness" stats={metrics.completeness} icon={CheckCircle} />}
              {hasStats(metrics.consistency) && <QualityCard label="Consistency" stats={metrics.consistency} icon={Shield} />}
              {hasStats(metrics.validity) && <QualityCard label="Validity" stats={metrics.validity} icon={CheckCircle} />}
              {hasStats(metrics.relevance) && <QualityCard label="Relevance" stats={metrics.relevance} icon={CheckCircle} />}
            </div>
          );
      }
    };

    return (
      <div className="space-y-4">
        {/* Component-specific quality dimensions */}
        {renderMetrics()}

        {/* Final Score if available */}
        {hasStats(metrics.final) && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Overall Quality Score</span>
              <div className={`text-lg font-bold ${getScoreColor(getScore(metrics.final))}`}>
                {formatPercent(getScore(metrics.final))}
              </div>
            </div>
          </div>
        )}

        {/* Issues Section */}
        {(metrics.completeness?.issues?.length > 0 || 
          metrics.consistency?.issues?.length > 0 || 
          metrics.validity?.issues?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {metrics.completeness?.issues?.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <IssuesList issues={metrics.completeness.issues} label="Completeness" />
              </div>
            )}
            {metrics.consistency?.issues?.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <IssuesList issues={metrics.consistency.issues} label="Consistency" />
              </div>
            )}
            {metrics.validity?.issues?.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <IssuesList issues={metrics.validity.issues} label="Validity" />
              </div>
            )}
          </div>
        )}

        {/* Component-specific additional metrics */}
        {componentName === 'research_problem' && renderResearchProblemExtras()}
        {componentName === 'content' && renderContentExtras()}
      </div>
    );
  };

  const renderResearchProblemExtras = () => {
    const hasExtras = hasStats(metrics.titleQuality) || hasStats(metrics.descriptionQuality) || 
                      hasStats(metrics.evidenceQuality);
    
    if (!hasExtras) return null;
    
    return (
      <div>
        <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase">Problem Quality</h5>
        <div className="grid grid-cols-3 gap-3">
          <QualityCard label="Title Quality" stats={metrics.titleQuality} />
          <QualityCard label="Description Quality" stats={metrics.descriptionQuality} />
          <QualityCard label="Evidence Quality" stats={metrics.evidenceQuality} />
        </div>
      </div>
    );
  };

  const renderContentExtras = () => {
    if (!metrics.properties || Object.keys(metrics.properties).length === 0) return null;
    
    return (
      <div>
        <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase">Quality by Property</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(metrics.properties).map(([prop, propMetrics]) => {
            const score = propMetrics?.final || propMetrics?.completeness;
            return (
              <div key={prop} className={`p-2 rounded ${getScoreBgColor(score)}`}>
                <div className="text-xs text-gray-600 truncate" title={prop}>{prop}</div>
                <div className={`text-sm font-bold ${getScoreColor(score)}`}>
                  {formatPercent(score)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Quality Metrics
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

export default DetailedQualityMetrics;