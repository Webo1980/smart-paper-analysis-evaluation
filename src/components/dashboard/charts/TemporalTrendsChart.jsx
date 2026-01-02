// src/components/dashboard/charts/TemporalTrendsChart.jsx
// UPDATED: Uses aggregatedData.temporal from aggregationService for consistent data source

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Clock, ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react';

const ResearchFindings = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between hover:from-blue-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
      </button>
      {isOpen && <div className="p-4 bg-white border-t border-blue-100">{children}</div>}
    </div>
  );
};

/**
 * TemporalTrendsChart
 * 
 * DATA SOURCE: aggregatedData from aggregationService
 * - Uses aggregatedData.temporal.timeline for pre-calculated temporal data
 * - Uses aggregatedData.globalStats for overall statistics
 * - Uses aggregatedData.metadata for totals
 * - Consistent with other dashboard components
 */
const TemporalTrendsChart = ({ aggregatedData, integratedData }) => {
  const trendsData = useMemo(() => {
    // PRIMARY: Use aggregatedData.temporal which has pre-calculated timeline
    if (aggregatedData?.temporal?.timeline && aggregatedData.temporal.timeline.length > 0) {
      const timeline = aggregatedData.temporal.timeline;
      
      // Calculate cumulative data
      let cumulativeCount = 0;
      const enrichedTimeline = timeline.map(d => {
        cumulativeCount += d.count;
        return {
          ...d,
          cumulativeCount,
          uniqueEvaluators: 1 // Will be updated if we have evaluator data
        };
      });
      
      return enrichedTimeline;
    }
    
    // FALLBACK: Build from aggregatedData.papers if temporal not available
    if (aggregatedData?.papers) {
      const evaluationsByDate = {};
      
      Object.values(aggregatedData.papers).forEach(paper => {
        paper.evaluators?.forEach(evaluator => {
          const timestamp = evaluator.timestamp;
          if (!timestamp) return;
          
          const date = new Date(timestamp);
          const dateKey = date.toISOString().split('T')[0];
          
          if (!evaluationsByDate[dateKey]) {
            evaluationsByDate[dateKey] = { 
              date: dateKey, 
              count: 0, 
              scores: [], 
              evaluators: new Set() 
            };
          }
          
          evaluationsByDate[dateKey].count++;
          evaluationsByDate[dateKey].evaluators.add(evaluator.id);
        });
        
        // Add paper scores
        const avgScore = [
          paper.metadata?.scores?.mean,
          paper.research_field?.scores?.mean,
          paper.research_problem?.scores?.mean,
          paper.template?.scores?.mean,
          paper.content?.scores?.mean
        ].filter(s => s !== undefined && s !== null);
        
        if (avgScore.length > 0) {
          const paperScore = avgScore.reduce((sum, s) => sum + s, 0) / avgScore.length;
          paper.evaluators?.forEach(evaluator => {
            const dateKey = evaluator.timestamp ? new Date(evaluator.timestamp).toISOString().split('T')[0] : null;
            if (dateKey && evaluationsByDate[dateKey]) {
              evaluationsByDate[dateKey].scores.push(paperScore);
            }
          });
        }
      });
      
      const sortedDates = Object.values(evaluationsByDate)
        .map(d => ({
          ...d,
          avgScore: d.scores.length > 0 ? d.scores.reduce((sum, s) => sum + s, 0) / d.scores.length : 0,
          uniqueEvaluators: d.evaluators.size
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Calculate cumulative data
      let cumulativeCount = 0;
      sortedDates.forEach(d => {
        cumulativeCount += d.count;
        d.cumulativeCount = cumulativeCount;
      });
      
      return sortedDates;
    }
    
    return null;
  }, [aggregatedData]);

  // Get global stats from aggregatedData
  const globalStats = useMemo(() => {
    if (!aggregatedData?.globalStats || !aggregatedData?.metadata) return null;
    
    return {
      totalEvaluations: aggregatedData.metadata.totalEvaluations || 0,
      totalPapers: aggregatedData.metadata.totalPapers || 0,
      totalEvaluators: aggregatedData.metadata.totalEvaluators || 0,
      avgScore: aggregatedData.globalStats.scores?.mean || 0
    };
  }, [aggregatedData]);

  if (!trendsData || trendsData.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No temporal data available for trend analysis. Ensure aggregatedData.temporal is provided.</AlertDescription>
      </Alert>
    );
  }

  const maxCount = Math.max(...trendsData.map(d => d.count), 1);
  const maxCumulative = trendsData[trendsData.length - 1]?.cumulativeCount || 1;
  const chartHeight = 150;
  const chartWidth = Math.max(trendsData.length * 40, 400);

  // Statistics
  const totalEvaluations = globalStats?.totalEvaluations || trendsData.reduce((sum, d) => sum + d.count, 0);
  const totalDays = trendsData.length;
  const avgPerDay = totalDays > 0 ? totalEvaluations / totalDays : 0;
  const uniqueEvaluators = globalStats?.totalEvaluators || new Set(trendsData.flatMap(d => [...(d.evaluators || [])])).size;
  
  // Score trend analysis
  const halfPoint = Math.floor(trendsData.length / 2);
  const firstHalfScores = trendsData.slice(0, halfPoint).filter(d => d.avgScore > 0).map(d => d.avgScore);
  const secondHalfScores = trendsData.slice(halfPoint).filter(d => d.avgScore > 0).map(d => d.avgScore);
  const firstHalfAvg = firstHalfScores.length > 0 ? firstHalfScores.reduce((s, v) => s + v, 0) / firstHalfScores.length : 0;
  const secondHalfAvg = secondHalfScores.length > 0 ? secondHalfScores.reduce((s, v) => s + v, 0) / secondHalfScores.length : 0;
  const scoreTrend = secondHalfAvg - firstHalfAvg;

  const peakDay = trendsData.reduce((max, d) => d.count > max.count ? d : max, trendsData[0]);
  
  // Date range
  const startDate = trendsData[0]?.date;
  const endDate = trendsData[trendsData.length - 1]?.date;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <Clock className="h-5 w-5 text-cyan-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Evaluation Timeline</h3>
          <p className="text-sm text-gray-600">
            Temporal trends in evaluation activity
            {startDate && endDate && ` (${startDate} to ${endDate})`}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xl font-bold text-gray-800">{totalEvaluations}</p>
          <p className="text-xs text-gray-500">Total Evaluations</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xl font-bold text-gray-800">{totalDays}</p>
          <p className="text-xs text-gray-500">Days Active</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xl font-bold text-gray-800">{avgPerDay.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Avg/Day</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xl font-bold text-gray-800">{uniqueEvaluators}</p>
          <p className="text-xs text-gray-500">Evaluators</p>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="overflow-x-auto mb-4">
        <svg width={chartWidth} height={chartHeight + 40} className="min-w-full">
          {/* Background grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
            <line key={i} x1="40" y1={chartHeight - level * chartHeight + 10} x2={chartWidth} y2={chartHeight - level * chartHeight + 10} stroke="#e5e7eb" strokeWidth="1" />
          ))}
          
          {/* Bars */}
          {trendsData.map((d, i) => {
            const barHeight = (d.count / maxCount) * (chartHeight - 20);
            const x = 50 + i * 40;
            
            return (
              <g key={d.date}>
                <rect 
                  x={x} 
                  y={chartHeight - barHeight} 
                  width="30" 
                  height={barHeight} 
                  fill="#06b6d4" 
                  rx="2" 
                  className="hover:fill-cyan-400 transition-colors cursor-pointer"
                >
                  <title>{`${d.date}: ${d.count} evaluations${d.avgScore ? ` (avg: ${(d.avgScore * 100).toFixed(1)}%)` : ''}`}</title>
                </rect>
                <text x={x + 15} y={chartHeight + 25} textAnchor="middle" className="text-xs fill-gray-500" transform={`rotate(-45 ${x + 15} ${chartHeight + 25})`}>
                  {d.date.slice(5)}
                </text>
              </g>
            );
          })}
          
          {/* Cumulative line */}
          <path
            d={trendsData.map((d, i) => {
              const x = 65 + i * 40;
              const y = chartHeight - (d.cumulativeCount / maxCumulative) * (chartHeight - 20);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none" stroke="#f97316" strokeWidth="2"
          />
          
          {/* Legend */}
          <rect x="50" y="0" width="12" height="12" fill="#06b6d4" rx="2" />
          <text x="67" y="10" className="text-xs fill-gray-600">Daily Count</text>
          <rect x="150" y="0" width="12" height="12" fill="#f97316" rx="2" />
          <text x="167" y="10" className="text-xs fill-gray-600">Cumulative</text>
        </svg>
      </div>

      {/* Score Trend Indicator */}
      {(firstHalfAvg > 0 || secondHalfAvg > 0) && (
        <div className="flex items-center justify-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">First Half Avg</p>
            <p className="text-lg font-bold">{(firstHalfAvg * 100).toFixed(1)}%</p>
          </div>
          <div className={`text-center px-4 py-2 rounded-lg ${scoreTrend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="text-sm font-medium text-gray-600">Trend</p>
            <p className={`text-lg font-bold ${scoreTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scoreTrend >= 0 ? '↑' : '↓'} {Math.abs(scoreTrend * 100).toFixed(2)}pp
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Second Half Avg</p>
            <p className="text-lg font-bold">{(secondHalfAvg * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Research Findings */}
      <ResearchFindings title="📊 Research Findings: Evaluation Campaign Analysis">
        <div className="space-y-4">
          <div className="bg-cyan-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-cyan-900 mb-2">Temporal Pattern Observations</h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Evaluation Rate:</strong> {totalEvaluations} evaluations over {totalDays} days, 
                averaging {avgPerDay.toFixed(1)}/day from {uniqueEvaluators} evaluators.
              </li>
              <li>
                <strong>Score Trend:</strong> Scores {scoreTrend >= 0 ? 'improved' : 'declined'} by {Math.abs(scoreTrend * 100).toFixed(2)}pp 
                (from {(firstHalfAvg * 100).toFixed(1)}% to {(secondHalfAvg * 100).toFixed(1)}%).
                {Math.abs(scoreTrend) < 0.02 ? ' This stability suggests consistent criteria application.' : ''}
              </li>
              <li>
                <strong>Peak Activity:</strong> {peakDay.date} with {peakDay.count} evaluations.
              </li>
              {globalStats?.totalPapers && (
                <li>
                  <strong>Coverage:</strong> {globalStats.totalPapers} papers evaluated with an average of 
                  {' '}{(totalEvaluations / globalStats.totalPapers).toFixed(1)} evaluations per paper.
                </li>
              )}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
            <p className="text-sm text-gray-700 italic">
              "The user study was conducted over {totalDays} days ({startDate} to {endDate}), during which {uniqueEvaluators} evaluators 
              completed {totalEvaluations} assessments (M = {avgPerDay.toFixed(1)}/day). Temporal analysis 
              revealed {Math.abs(scoreTrend) < 0.02 ? 'stable' : scoreTrend > 0 ? 'improving' : 'declining'} score 
              trends ({scoreTrend >= 0 ? '+' : ''}{(scoreTrend * 100).toFixed(2)}pp), suggesting 
              {Math.abs(scoreTrend) < 0.02 ? 'consistent criteria application across the evaluation period.' : 'evaluator calibration effects over time.'}"
            </p>
          </div>
        </div>
      </ResearchFindings>
    </Card>
  );
};

export default TemporalTrendsChart;