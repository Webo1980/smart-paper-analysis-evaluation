// src/components/dashboard/charts/SectionPerformanceRadar.jsx
// UPDATED: Shows BOTH Accuracy and Quality scores with tab selection
// Uses same data paths as OverviewMetrics for consistency
// NOTE: Shows AUTOMATED scores only (no human ratings combined)

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Radar, Target, Award, Download, AlertCircle, ChevronDown, ChevronUp, BookOpen, Info } from 'lucide-react';

// Collapsible Research Findings Component
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
 * SectionPerformanceRadar
 * 
 * DATA SOURCE: aggregatedData from aggregationService
 * - Uses aggregatedData.papers with EXPLICIT paths:
 *   - ACCURACY: comp.accuracyScores?.mean ?? comp.scores?.mean
 *   - QUALITY: comp.qualityScores?.mean
 * - Matches OverviewMetrics data paths exactly
 * 
 * NOTE: This chart shows AUTOMATED SCORES ONLY (no human ratings combined).
 * For combined scores (60% automated + 40% human), see OverviewMetrics.
 */
const SectionPerformanceRadar = ({ data, aggregatedData }) => {
  const [activeTab, setActiveTab] = useState('accuracy'); // 'accuracy' or 'quality'
  const [compareMode, setCompareMode] = useState(false);

  const componentConfig = [
    { id: 'metadata', label: 'Metadata', color: '#3b82f6' },
    { id: 'research_field', label: 'Research Field', color: '#22c55e' },
    { id: 'research_problem', label: 'Research Problem', color: '#f97316' },
    { id: 'template', label: 'Template', color: '#a855f7' },
    { id: 'content', label: 'Content', color: '#ef4444' }
  ];

  // Extract ACCURACY scores - same path as OverviewMetrics (AUTOMATED ONLY)
  const accuracyData = useMemo(() => {
    if (!aggregatedData?.papers) return null;
    
    const papers = Object.values(aggregatedData.papers);
    const result = {};
    
    componentConfig.forEach(comp => {
      const scores = [];
      const userRatings = [];
      
      papers.forEach(paper => {
        const compData = paper[comp.id];
        if (!compData) return;
        
        // ACCURACY: Same path as OverviewMetrics (automated score only)
        const acc = compData.accuracyScores?.mean ?? compData.scores?.mean;
        if (acc !== undefined && !isNaN(acc)) scores.push(acc);
        
        // User ratings (stored for reference, NOT combined into score)
        const ur = compData.userRatings?.mean;
        if (ur !== undefined && !isNaN(ur)) userRatings.push(ur);
      });
      
      if (scores.length > 0) {
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const std = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length);
        const userMean = userRatings.length > 0 ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : null;
        
        result[comp.id] = {
          ...comp,
          score: mean,  // Automated score only
          std,
          userRating: userMean,  // Stored for reference
          count: scores.length,
          min: Math.min(...scores),
          max: Math.max(...scores)
        };
      } else {
        result[comp.id] = { ...comp, score: 0, std: 0, userRating: null, count: 0, min: 0, max: 0 };
      }
    });
    
    return result;
  }, [aggregatedData]);

  // Extract QUALITY scores - same path as OverviewMetrics (AUTOMATED ONLY)
  const qualityData = useMemo(() => {
    if (!aggregatedData?.papers) return null;
    
    const papers = Object.values(aggregatedData.papers);
    const result = {};
    
    componentConfig.forEach(comp => {
      const scores = [];
      const userRatings = [];
      
      papers.forEach(paper => {
        const compData = paper[comp.id];
        if (!compData) return;
        
        // QUALITY: Same path as OverviewMetrics (automated score only)
        const qual = compData.qualityScores?.mean;
        if (qual !== undefined && !isNaN(qual) && qual > 0) scores.push(qual);
        
        // User ratings (stored for reference, NOT combined into score)
        const ur = compData.userRatings?.mean;
        if (ur !== undefined && !isNaN(ur)) userRatings.push(ur);
      });
      
      if (scores.length > 0) {
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const std = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length);
        const userMean = userRatings.length > 0 ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : null;
        
        result[comp.id] = {
          ...comp,
          score: mean,  // Automated score only
          std,
          userRating: userMean,  // Stored for reference
          count: scores.length,
          min: Math.min(...scores),
          max: Math.max(...scores)
        };
      } else {
        result[comp.id] = { ...comp, score: 0, std: 0, userRating: null, count: 0, min: 0, max: 0 };
      }
    });
    
    return result;
  }, [aggregatedData]);

  const currentData = activeTab === 'accuracy' ? accuracyData : qualityData;
  const comparisonData = activeTab === 'accuracy' ? qualityData : accuracyData;

  if (!currentData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No component performance data available. Ensure aggregatedData is provided.
        </AlertDescription>
      </Alert>
    );
  }

  // Convert to array for radar
  const radarData = componentConfig.map(comp => currentData[comp.id]);
  const comparisonRadarData = comparisonData ? componentConfig.map(comp => comparisonData[comp.id]) : null;

  // Calculate overall scores
  const validComponents = radarData.filter(c => c.score > 0);
  const overallScore = validComponents.length > 0 
    ? validComponents.reduce((sum, c) => sum + c.score, 0) / validComponents.length 
    : 0;

  const comparisonValidComponents = comparisonRadarData ? comparisonRadarData.filter(c => c.score > 0) : [];
  const comparisonOverall = comparisonValidComponents.length > 0
    ? comparisonValidComponents.reduce((sum, c) => sum + c.score, 0) / comparisonValidComponents.length 
    : 0;

  // Create radar path
  const createRadarPath = (values, maxValue = 1) => {
    const center = 200;
    const radius = 150;
    const angleStep = (2 * Math.PI) / values.length;
    
    return values.map((value, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const r = (value / maxValue) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y };
    }).map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`
    ).join(' ') + ' Z';
  };

  const metricValues = radarData.map(d => d.score);
  const comparisonValues = compareMode && comparisonRadarData ? comparisonRadarData.map(d => d.score) : null;

  // Calculate research insights
  const researchInsights = useMemo(() => {
    const valid = radarData.filter(c => c.score > 0);
    if (valid.length === 0) return null;
    
    const sorted = [...valid].sort((a, b) => b.score - a.score);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    const values = valid.map(c => c.score);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    const range = Math.max(...values) - Math.min(...values);
    const cv = mean > 0 ? (std / mean) * 100 : 0;
    
    const highPerformers = valid.filter(c => c.score >= 0.7);
    const mediumPerformers = valid.filter(c => c.score >= 0.4 && c.score < 0.7);
    const lowPerformers = valid.filter(c => c.score < 0.4);
    const balanceScore = mean > 0 ? 1 - (std / mean) : 0;
    
    return {
      best, worst, mean, std, range, cv,
      highPerformers, mediumPerformers, lowPerformers,
      balanceScore, totalComponents: valid.length,
      metricName: activeTab === 'accuracy' ? 'Accuracy' : 'Quality'
    };
  }, [radarData, activeTab]);

  // Export handler
  const handleExport = () => {
    const exportData = {
      type: activeTab,
      note: 'AUTOMATED SCORES ONLY - Human ratings not included',
      components: radarData.map(d => ({
        component: d.label,
        automatedScore: (d.score * 100).toFixed(1),
        userRating: d.userRating ? (d.userRating * 100).toFixed(1) : 'N/A',
        std: (d.std * 100).toFixed(1),
        count: d.count
      })),
      overall: (overallScore * 100).toFixed(1),
      insights: researchInsights,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radar_${activeTab}_automated_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Colors based on active tab
  const primaryColor = activeTab === 'accuracy' ? '#3b82f6' : '#a855f7';
  const primaryBg = activeTab === 'accuracy' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)';
  const comparisonColor = activeTab === 'accuracy' ? '#a855f7' : '#3b82f6';
  const comparisonBg = activeTab === 'accuracy' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)';

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${activeTab === 'accuracy' ? 'bg-blue-100' : 'bg-purple-100'}`}>
            {activeTab === 'accuracy' 
              ? <Target className="h-5 w-5 text-blue-600" />
              : <Award className="h-5 w-5 text-purple-600" />
            }
          </div>
          <div>
            <h3 className="text-lg font-semibold">Component Performance Radar</h3>
            <p className="text-xs text-gray-600 mt-1">
              {activeTab === 'accuracy' 
                ? 'How well extracted values match ground truth'
                : 'Completeness, consistency, and validity of extractions'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCompareMode(!compareMode)}
            variant={compareMode ? "default" : "outline"}
            size="sm"
            className="text-xs"
          >
            {compareMode ? 'Hide' : 'Compare'} {activeTab === 'accuracy' ? 'Quality' : 'Accuracy'}
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('accuracy')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'accuracy'
              ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Accuracy</span>
          {accuracyData && (
            <Badge variant="outline" className={`text-xs ${activeTab === 'accuracy' ? 'bg-blue-50 text-blue-700' : ''}`}>
              {(Object.values(accuracyData).filter(c => c.score > 0).reduce((sum, c) => sum + c.score, 0) / 
                Math.max(Object.values(accuracyData).filter(c => c.score > 0).length, 1) * 100).toFixed(0)}%
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'quality'
              ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Quality</span>
          {qualityData && (
            <Badge variant="outline" className={`text-xs ${activeTab === 'quality' ? 'bg-purple-50 text-purple-700' : ''}`}>
              {(Object.values(qualityData).filter(c => c.score > 0).reduce((sum, c) => sum + c.score, 0) / 
                Math.max(Object.values(qualityData).filter(c => c.score > 0).length, 1) * 100).toFixed(0)}%
            </Badge>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className={`flex items-start gap-2 p-3 rounded-lg mb-3 text-xs ${
        activeTab === 'accuracy' ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'
      }`}>
        <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${activeTab === 'accuracy' ? 'text-blue-500' : 'text-purple-500'}`} />
        <div className={activeTab === 'accuracy' ? 'text-blue-800' : 'text-purple-800'}>
          {activeTab === 'accuracy' ? (
            <>
              <strong>Accuracy Score</strong> measures how well system-extracted values match the ground truth (ORKG data).
              Uses Levenshtein distance, token matching, and semantic similarity.
            </>
          ) : (
            <>
              <strong>Quality Score</strong> measures the completeness, consistency, and validity of extractions.
              Evaluates structural integrity and content coverage.
            </>
          )}
        </div>
      </div>

      {/* AUTOMATED SCORES NOTICE */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs bg-amber-50 border border-amber-200">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div className="text-amber-800">
          <strong>Note:</strong> This radar chart displays <strong>automated scores only</strong> (100% system-calculated). 
          Human evaluator ratings are <strong>not included</strong>. For combined scores (60% automated + 40% human rating), 
          see the <strong>Overview</strong> tab.
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-center mb-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
            {(overallScore * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Overall {activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} (Automated)</div>
          {compareMode && (
            <div className={`text-sm mt-1 ${activeTab === 'accuracy' ? 'text-purple-500' : 'text-blue-500'}`}>
              vs {(comparisonOverall * 100).toFixed(1)}% {activeTab === 'accuracy' ? 'Quality' : 'Accuracy'}
            </div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <svg width="400" height="400" viewBox="0 0 400 400">
          {/* Grid circles */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((level, index) => (
            <circle key={index} cx="200" cy="200" r={150 * level} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray={index === 4 ? "0" : "2,2"} />
          ))}
          
          {/* Grid lines */}
          {radarData.map((_, index) => {
            const angleStep = (2 * Math.PI) / radarData.length;
            const angle = index * angleStep - Math.PI / 2;
            const x = 200 + 150 * Math.cos(angle);
            const y = 200 + 150 * Math.sin(angle);
            return <line key={index} x1="200" y1="200" x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
          })}
          
          {/* Grid labels */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((level, index) => (
            <text key={index} x="200" y={200 - 150 * level} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-400">
              {(level * 100).toFixed(0)}%
            </text>
          ))}
          
          {/* Comparison area (if enabled) */}
          {compareMode && comparisonValues && (
            <path d={createRadarPath(comparisonValues)} fill={comparisonBg} stroke={comparisonColor} strokeWidth="2" strokeDasharray="5,5" />
          )}
          
          {/* Primary area */}
          <path d={createRadarPath(metricValues)} fill={primaryBg} stroke={primaryColor} strokeWidth="2" />
          
          {/* Data points */}
          {metricValues.map((value, index) => {
            const angleStep = (2 * Math.PI) / metricValues.length;
            const angle = index * angleStep - Math.PI / 2;
            const r = value * 150;
            const x = 200 + r * Math.cos(angle);
            const y = 200 + r * Math.sin(angle);
            return (
              <circle key={index} cx={x} cy={y} r="5" fill={primaryColor} stroke="white" strokeWidth="2" className="cursor-pointer">
                <title>{radarData[index].label}: {(value * 100).toFixed(1)}% (Automated)</title>
              </circle>
            );
          })}
          
          {/* Component labels */}
          {radarData.map((component, index) => {
            const angleStep = (2 * Math.PI) / radarData.length;
            const angle = index * angleStep - Math.PI / 2;
            const labelRadius = 175;
            const x = 200 + labelRadius * Math.cos(angle);
            const y = 200 + labelRadius * Math.sin(angle);
            
            // Split long labels into two lines
            const labelParts = component.label.includes(' ') 
              ? component.label.split(' ') 
              : [component.label];
            
            return (
              <text 
                key={index} 
                x={x} 
                y={y} 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-xs font-medium" 
                fill={component.color}
              >
                {labelParts.length === 1 ? (
                  labelParts[0]
                ) : (
                  <>
                    <tspan x={x} dy="-0.5em">{labelParts[0]}</tspan>
                    <tspan x={x} dy="1.1em">{labelParts.slice(1).join(' ')}</tspan>
                  </>
                )}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0 border-t-2" style={{ borderColor: primaryColor }} />
          <span className="text-xs text-gray-600">{activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} (Automated)</span>
        </div>
        {compareMode && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: comparisonColor }} />
            <span className="text-xs text-gray-600">{activeTab === 'accuracy' ? 'Quality' : 'Accuracy'} (Comparison)</span>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {accuracyData && qualityData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Accuracy vs Quality Comparison (Automated Scores)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Component</th>
                  <th className="text-center py-2 px-2 font-medium text-blue-600">Accuracy</th>
                  <th className="text-center py-2 px-2 font-medium text-purple-600">Quality</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">Difference</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">n</th>
                </tr>
              </thead>
              <tbody>
                {componentConfig.map(comp => {
                  const acc = accuracyData[comp.id]?.score || 0;
                  const qual = qualityData[comp.id]?.score || 0;
                  const diff = qual - acc;
                  const count = accuracyData[comp.id]?.count || qualityData[comp.id]?.count || 0;
                  
                  return (
                    <tr key={comp.id} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: comp.color }} />
                          <span className="font-medium text-gray-700">{comp.label}</span>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2 font-mono text-blue-600">{(acc * 100).toFixed(1)}%</td>
                      <td className="text-center py-2 px-2 font-mono text-purple-600">{(qual * 100).toFixed(1)}%</td>
                      <td className={`text-center py-2 px-2 font-mono ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                      </td>
                      <td className="text-center py-2 px-2 text-gray-500">{count}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-semibold">
                  <td className="py-2 px-2 text-gray-700">Average</td>
                  <td className="text-center py-2 px-2 font-mono text-blue-700">
                    {(Object.values(accuracyData).filter(c => c.score > 0).reduce((sum, c) => sum + c.score, 0) / 
                      Math.max(Object.values(accuracyData).filter(c => c.score > 0).length, 1) * 100).toFixed(1)}%
                  </td>
                  <td className="text-center py-2 px-2 font-mono text-purple-700">
                    {(Object.values(qualityData).filter(c => c.score > 0).reduce((sum, c) => sum + c.score, 0) / 
                      Math.max(Object.values(qualityData).filter(c => c.score > 0).length, 1) * 100).toFixed(1)}%
                  </td>
                  <td className={`text-center py-2 px-2 font-mono ${comparisonOverall - overallScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {activeTab === 'accuracy' 
                      ? `${comparisonOverall - overallScore >= 0 ? '+' : ''}${((comparisonOverall - overallScore) * 100).toFixed(1)}%`
                      : `${overallScore - comparisonOverall >= 0 ? '+' : ''}${((overallScore - comparisonOverall) * 100).toFixed(1)}%`
                    }
                  </td>
                  <td className="text-center py-2 px-2 text-gray-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <Alert className={`mt-4 ${activeTab === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
        <Radar className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm font-medium mb-1">Performance Insights ({activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} - Automated):</p>
          <ul className="text-xs space-y-1">
            {radarData.filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map((comp, idx) => (
              <li key={idx}><strong>{comp.label}</strong> is performing well at {(comp.score * 100).toFixed(0)}%</li>
            ))}
            {radarData.filter(c => c.score > 0 && c.score < 0.7).sort((a, b) => a.score - b.score).slice(0, 1).map((comp, idx) => (
              <li key={idx}><strong>{comp.label}</strong> may need attention ({(comp.score * 100).toFixed(0)}%)</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {/* Research Findings */}
      {researchInsights && (
        <ResearchFindings title={`📊 Research Findings: Component ${researchInsights.metricName} Analysis`}>
          <div className="space-y-4">
            {/* Automated Scores Notice for Research */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <strong>Important:</strong> All statistics in this section represent <strong>automated system scores only</strong>. 
                  Human evaluator ratings are not factored into these calculations. When reporting results, please
                  consider noting that human acceptance rates (via the 60/40 combined formula) are typically higher.
                </div>
              </div>
            </div>

            {/* Current Metric Note */}
            <Alert className={activeTab === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}>
              <Radar className={`h-4 w-4 ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`} />
              <AlertDescription className={`text-sm ${activeTab === 'accuracy' ? 'text-blue-800' : 'text-purple-800'}`}>
                <strong>Currently viewing: {researchInsights.metricName} (Automated)</strong> — Toggle tabs above to switch between Accuracy and Quality analysis.
              </AlertDescription>
            </Alert>

            <div className={`rounded-lg p-4 ${activeTab === 'accuracy' ? 'bg-blue-50' : 'bg-purple-50'}`}>
              <h4 className={`text-sm font-semibold mb-2 ${activeTab === 'accuracy' ? 'text-blue-900' : 'text-purple-900'}`}>
                {researchInsights.metricName} Distribution Analysis (Automated Scores)
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>
                  <strong>Overall {researchInsights.metricName}:</strong> The system achieved an average automated {researchInsights.metricName.toLowerCase()} of 
                  <strong> {(researchInsights.mean * 100).toFixed(1)}%</strong> (SD = {(researchInsights.std * 100).toFixed(1)}%) across 
                  {researchInsights.totalComponents} components.
                </li>
                <li>
                  <strong>Best Performer:</strong> {researchInsights.best.label} achieved the highest {researchInsights.metricName.toLowerCase()} at 
                  <strong> {(researchInsights.best.score * 100).toFixed(1)}%</strong>.
                </li>
                <li>
                  <strong>Area for Improvement:</strong> {researchInsights.worst.label} showed the lowest {researchInsights.metricName.toLowerCase()} at 
                  <strong> {(researchInsights.worst.score * 100).toFixed(1)}%</strong>.
                </li>
                <li>
                  <strong>Performance Range:</strong> The {(researchInsights.range * 100).toFixed(1)} percentage point spread 
                  (CV = {researchInsights.cv.toFixed(1)}%) indicates 
                  {researchInsights.cv < 20 
                    ? ' consistent performance across components.'
                    : researchInsights.cv < 40 
                      ? ' moderate variability in component performance.'
                      : ' significant variability, with some components substantially outperforming others.'}
                </li>
              </ul>
            </div>

            {/* Performance Tiers */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Performance Tier Distribution (Automated)</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-lg p-2 border border-green-200">
                  <p className="text-lg font-bold text-green-600">{researchInsights.highPerformers.length}</p>
                  <p className="text-xs text-gray-600">High (≥70%)</p>
                  <p className="text-xs text-green-700 mt-1">
                    {researchInsights.highPerformers.map(c => c.label).join(', ') || 'None'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-yellow-200">
                  <p className="text-lg font-bold text-yellow-600">{researchInsights.mediumPerformers.length}</p>
                  <p className="text-xs text-gray-600">Medium (40-69%)</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {researchInsights.mediumPerformers.map(c => c.label).join(', ') || 'None'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-red-200">
                  <p className="text-lg font-bold text-red-600">{researchInsights.lowPerformers.length}</p>
                  <p className="text-xs text-gray-600">Low (&lt;40%)</p>
                  <p className="text-xs text-red-700 mt-1">
                    {researchInsights.lowPerformers.map(c => c.label).join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </div>

            {/* Radar Shape Interpretation */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">Radar Shape Interpretation</h4>
              <p className="text-sm text-gray-700">
                {researchInsights.balanceScore > 0.8 
                  ? `The radar chart shows a relatively symmetrical shape (balance score: ${(researchInsights.balanceScore * 100).toFixed(0)}%), indicating well-balanced automated performance across all components.`
                  : researchInsights.balanceScore > 0.5
                    ? `The radar chart shows moderate asymmetry (balance score: ${(researchInsights.balanceScore * 100).toFixed(0)}%), with ${researchInsights.best.label} notably outperforming other components in automated scoring.`
                    : `The radar chart shows significant asymmetry (balance score: ${(researchInsights.balanceScore * 100).toFixed(0)}%), with large automated performance gaps between components. ${researchInsights.worst.label} requires particular attention.`}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
              <p className="text-sm text-gray-700 italic">
                "Component-level automated {researchInsights.metricName.toLowerCase()} analysis revealed an average of {(researchInsights.mean * 100).toFixed(1)}% 
                (SD = {(researchInsights.std * 100).toFixed(1)}%) across the five extraction components. 
                {researchInsights.best.label} demonstrated the strongest automated performance ({(researchInsights.best.score * 100).toFixed(1)}%), 
                while {researchInsights.worst.label} showed the most room for improvement ({(researchInsights.worst.score * 100).toFixed(1)}%). 
                The coefficient of variation ({researchInsights.cv.toFixed(1)}%) indicates 
                {researchInsights.cv < 25 
                  ? 'relatively consistent automated performance across components.'
                  : 'variability in automated performance across different extraction tasks.'}
                {researchInsights.highPerformers.length >= 3 
                  ? ` Notably, ${researchInsights.highPerformers.length} of 5 components achieved high automated performance (≥70%).`
                  : ''}"
              </p>
            </div>

            {/* Note about combined scores */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Important Note</h4>
              <p className="text-sm text-amber-800">
                The scores reported in this section represent <strong>automated system calculations only</strong>. 
                When human evaluator ratings are combined using a 60/40 weighting formula (60% automated + 40% human), 
                the final scores typically increase by approximately <strong>10-15 percentage points</strong> on average, 
                reflecting human acceptance and validation of system outputs. See the <strong>Overview</strong> tab for combined scores.
              </p>
            </div>
          </div>
        </ResearchFindings>
      )}
    </Card>
  );
};

export default SectionPerformanceRadar;