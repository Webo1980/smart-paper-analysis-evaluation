// src/components/dashboard/GroupedContentScores.jsx

import React, { useMemo } from 'react';
import { getGroupedContentScores, getContentOverallStats } from '../../services/contentEnrichmentService';

/**
 * GroupedContentScores Component
 * 
 * Displays content analysis results grouped by property with aggregated statistics.
 * 
 * Example output:
 *   primary_dataset         1.000   σ 0.000 | n=7
 *   preprocessing_pipeline  0.950   σ 0.020 | n=2
 *   training_framework      0.925   σ 0.015 | n=2
 */

const GroupedContentScores = ({ integratedData, showOverall = true }) => {
  // Get grouped scores
  const groupedScores = useMemo(() => {
    return getGroupedContentScores(integratedData);
  }, [integratedData]);
  
  // Get overall stats
  const overallStats = useMemo(() => {
    return getContentOverallStats(integratedData);
  }, [integratedData]);
  
  const propertyCount = Object.keys(groupedScores).length;
  
  if (propertyCount === 0) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No content properties found. Run content enrichment first.
      </div>
    );
  }
  
  // Color coding based on score
  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getScoreBg = (score) => {
    if (score >= 0.8) return 'bg-green-50';
    if (score >= 0.6) return 'bg-yellow-50';
    if (score >= 0.4) return 'bg-orange-50';
    return 'bg-red-50';
  };
  
  return (
    <div className="space-y-4">
      {/* Overall Stats Header */}
      {showOverall && overallStats.count > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Content Analysis
              </h3>
              <p className="text-sm text-gray-500">
                {propertyCount} unique properties across {overallStats.count} evaluations
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(overallStats.mean)}`}>
                {(overallStats.mean * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                σ {overallStats.std.toFixed(3)} | 
                Range: {(overallStats.min * 100).toFixed(0)}-{(overallStats.max * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Property List */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 px-2">
          Property Scores
        </div>
        
        {Object.entries(groupedScores).map(([key, data]) => (
          <div 
            key={key}
            className={`flex items-center justify-between px-3 py-2 rounded ${getScoreBg(data.mean)} hover:opacity-90 transition-opacity`}
          >
            {/* Property Name */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate block">
                {data.label || key.replace(/_/g, ' ')}
              </span>
            </div>
            
            {/* Score */}
            <div className="flex items-center gap-4 ml-4">
              <span className={`text-lg font-bold tabular-nums ${getScoreColor(data.mean)}`}>
                {data.mean.toFixed(3)}
              </span>
              
              {/* Stats */}
              <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                σ {data.std.toFixed(3)} | n={data.count}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Footer */}
      <div className="border-t pt-3 mt-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total unique properties:</span>
          <span className="font-medium">{propertyCount}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total evaluations:</span>
          <span className="font-medium">{overallStats.count}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version for sidebar or card display
 */
export const GroupedContentScoresCompact = ({ integratedData, maxItems = 5 }) => {
  const groupedScores = useMemo(() => {
    return getGroupedContentScores(integratedData);
  }, [integratedData]);
  
  const entries = Object.entries(groupedScores).slice(0, maxItems);
  const remaining = Object.keys(groupedScores).length - maxItems;
  
  if (entries.length === 0) {
    return <div className="text-gray-400 text-xs">No content data</div>;
  }
  
  return (
    <div className="space-y-1 text-xs">
      {entries.map(([key, data]) => (
        <div key={key} className="flex justify-between items-center">
          <span className="truncate text-gray-600 max-w-[140px]">
            {key.replace(/_/g, ' ')}
          </span>
          <span className="font-mono font-medium">
            {data.mean.toFixed(2)}
          </span>
        </div>
      ))}
      {remaining > 0 && (
        <div className="text-gray-400 text-center">
          +{remaining} more...
        </div>
      )}
    </div>
  );
};

/**
 * Table version for detailed view
 */
export const GroupedContentScoresTable = ({ integratedData }) => {
  const groupedScores = useMemo(() => {
    return getGroupedContentScores(integratedData);
  }, [integratedData]);
  
  const overallStats = useMemo(() => {
    return getContentOverallStats(integratedData);
  }, [integratedData]);
  
  if (Object.keys(groupedScores).length === 0) {
    return <div className="text-gray-500 p-4">No content data available</div>;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-2 px-3 font-medium">Property</th>
            <th className="text-right py-2 px-3 font-medium">Mean</th>
            <th className="text-right py-2 px-3 font-medium">Std Dev</th>
            <th className="text-right py-2 px-3 font-medium">Min</th>
            <th className="text-right py-2 px-3 font-medium">Max</th>
            <th className="text-right py-2 px-3 font-medium">Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedScores).map(([key, data]) => (
            <tr key={key} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3">
                <span className="font-medium">{data.label || key}</span>
                <span className="text-gray-400 text-xs ml-2">({key})</span>
              </td>
              <td className="text-right py-2 px-3 font-mono">
                {data.mean.toFixed(3)}
              </td>
              <td className="text-right py-2 px-3 font-mono text-gray-500">
                {data.std.toFixed(3)}
              </td>
              <td className="text-right py-2 px-3 font-mono text-gray-500">
                {data.min.toFixed(3)}
              </td>
              <td className="text-right py-2 px-3 font-mono text-gray-500">
                {data.max.toFixed(3)}
              </td>
              <td className="text-right py-2 px-3 font-mono">
                {data.count}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-medium">
            <td className="py-2 px-3">Overall</td>
            <td className="text-right py-2 px-3 font-mono">
              {overallStats.mean.toFixed(3)}
            </td>
            <td className="text-right py-2 px-3 font-mono">
              {overallStats.std.toFixed(3)}
            </td>
            <td className="text-right py-2 px-3 font-mono">
              {overallStats.min.toFixed(3)}
            </td>
            <td className="text-right py-2 px-3 font-mono">
              {overallStats.max.toFixed(3)}
            </td>
            <td className="text-right py-2 px-3 font-mono">
              {overallStats.count}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default GroupedContentScores;