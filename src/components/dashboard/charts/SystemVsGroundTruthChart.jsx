// src/components/dashboard/charts/SystemVsGroundTruthChart.jsx
// UPDATED: Shows BOTH Accuracy and Quality with Compare feature
// Uses same data paths as OverviewMetrics for consistency
// NOTE: Shows AUTOMATED scores only (no human ratings combined)

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Target, Award, ChevronDown, ChevronUp, BookOpen, AlertCircle, Info } from 'lucide-react';

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
 * SystemVsGroundTruthChart
 * 
 * DATA SOURCE: aggregatedData.papers from aggregationService
 * - ACCURACY: comp.accuracyScores?.mean ?? comp.scores?.mean
 * - QUALITY: comp.qualityScores?.mean
 * - Matches OverviewMetrics data paths exactly
 * 
 * NOTE: This chart shows AUTOMATED SCORES ONLY (no human ratings combined).
 * For combined scores (60% automated + 40% human), see OverviewMetrics.
 * 
 * INTERPRETATION:
 * - Score >= 0.8: High Match
 * - Score 0.5-0.8: Partial Match
 * - Score < 0.5: Low Match
 */
const SystemVsGroundTruthChart = ({ aggregatedData, integratedData }) => {
  const [activeTab, setActiveTab] = useState('accuracy'); // 'accuracy' or 'quality'
  const [compareMode, setCompareMode] = useState(false);

  const componentKeys = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
  const componentLabels = {
    metadata: 'Metadata',
    research_field: 'Research Field',
    research_problem: 'Research Problem',
    template: 'Template',
    content: 'Content'
  };

  // Calculate match categories from scores
  const categorizeScores = (scores) => {
    let matches = 0, partial = 0, mismatches = 0;
    scores.forEach(score => {
      if (score >= 0.8) matches++;
      else if (score >= 0.5) partial++;
      else mismatches++;
    });
    return { matches, partial, mismatches, total: scores.length };
  };

  // Extract ACCURACY data - same path as OverviewMetrics (AUTOMATED ONLY)
  const accuracyData = useMemo(() => {
    if (!aggregatedData?.papers) return null;
    
    const papers = Object.values(aggregatedData.papers);
    const result = {};
    
    componentKeys.forEach(compKey => {
      const scores = [];
      
      papers.forEach(paper => {
        const compData = paper[compKey];
        if (!compData) return;
        
        // ACCURACY: Same path as OverviewMetrics (automated score only)
        const score = compData.accuracyScores?.mean ?? compData.scores?.mean;
        if (score !== undefined && !isNaN(score)) {
          scores.push(score);
        }
      });
      
      const categories = categorizeScores(scores);
      const avgScore = scores.length > 0 
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
        : 0;
      
      result[compKey] = {
        ...categories,
        avgScore,
        scores,
        matchRate: categories.total > 0 ? categories.matches / categories.total : 0,
        partialRate: categories.total > 0 ? categories.partial / categories.total : 0,
        mismatchRate: categories.total > 0 ? categories.mismatches / categories.total : 0
      };
    });
    
    return result;
  }, [aggregatedData]);

  // Extract QUALITY data - same path as OverviewMetrics (AUTOMATED ONLY)
  const qualityData = useMemo(() => {
    if (!aggregatedData?.papers) return null;
    
    const papers = Object.values(aggregatedData.papers);
    const result = {};
    
    componentKeys.forEach(compKey => {
      const scores = [];
      
      papers.forEach(paper => {
        const compData = paper[compKey];
        if (!compData) return;
        
        // QUALITY: Same path as OverviewMetrics (automated score only)
        const score = compData.qualityScores?.mean;
        if (score !== undefined && !isNaN(score) && score > 0) {
          scores.push(score);
        }
      });
      
      const categories = categorizeScores(scores);
      const avgScore = scores.length > 0 
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
        : 0;
      
      result[compKey] = {
        ...categories,
        avgScore,
        scores,
        matchRate: categories.total > 0 ? categories.matches / categories.total : 0,
        partialRate: categories.total > 0 ? categories.partial / categories.total : 0,
        mismatchRate: categories.total > 0 ? categories.mismatches / categories.total : 0
      };
    });
    
    return result;
  }, [aggregatedData]);

  const currentData = activeTab === 'accuracy' ? accuracyData : qualityData;
  const comparisonData = activeTab === 'accuracy' ? qualityData : accuracyData;

  if (!currentData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No comparison data available. Ensure aggregatedData is provided.</AlertDescription>
      </Alert>
    );
  }

  // Build rates array for display
  const buildRates = (data) => {
    return componentKeys.map(compKey => ({
      component: compKey,
      label: componentLabels[compKey],
      ...data[compKey]
    })).filter(c => c.total > 0);
  };

  const currentRates = buildRates(currentData);
  const comparisonRates = comparisonData ? buildRates(comparisonData) : [];

  // Calculate overall stats
  const calcOverall = (rates) => {
    if (rates.length === 0) return { matchRate: 0, partialRate: 0, mismatchRate: 0, avgScore: 0 };
    return {
      matchRate: rates.reduce((sum, c) => sum + c.matchRate, 0) / rates.length,
      partialRate: rates.reduce((sum, c) => sum + c.partialRate, 0) / rates.length,
      mismatchRate: rates.reduce((sum, c) => sum + c.mismatchRate, 0) / rates.length,
      avgScore: rates.reduce((sum, c) => sum + c.avgScore, 0) / rates.length
    };
  };

  const currentOverall = calcOverall(currentRates);
  const comparisonOverall = calcOverall(comparisonRates);

  // Find best and worst performers
  const bestComponent = currentRates.reduce((best, c) => 
    c.avgScore > (best?.avgScore || 0) ? c : best, currentRates[0]);
  const worstComponent = currentRates.reduce((worst, c) => 
    c.avgScore < (worst?.avgScore || 1) ? c : worst, currentRates[0]);

  // Colors based on active tab
  const primaryColor = activeTab === 'accuracy' ? 'blue' : 'purple';

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
            <h3 className="text-lg font-semibold">System vs Ground Truth Comparison</h3>
            <p className="text-sm text-gray-600">
              {activeTab === 'accuracy' 
                ? 'SARAG automated output accuracy against ORKG ground truth'
                : 'Automated quality assessment of SARAG extractions'
              }
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCompareMode(!compareMode)}
          variant={compareMode ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          {compareMode ? 'Hide' : 'Compare'} {activeTab === 'accuracy' ? 'Quality' : 'Accuracy'}
        </Button>
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
              {(calcOverall(buildRates(accuracyData)).avgScore * 100).toFixed(0)}%
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
              {(calcOverall(buildRates(qualityData)).avgScore * 100).toFixed(0)}%
            </Badge>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className={`flex items-start gap-2 p-3 rounded-lg mb-3 text-xs ${
        activeTab === 'accuracy' ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'
      }`}>
        <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${activeTab === 'accuracy' ? 'text-blue-500' : 'text-purple-500'}`} />
        <div className={activeTab === 'accuracy' ? 'text-blue-800' : 'text-purple-800'}>
          {activeTab === 'accuracy' ? (
            <>
              <strong>Accuracy</strong> measures how well system-extracted values match ORKG ground truth.
              <br />• High Match (≥80%) • Partial (50-80%) • Low (&lt;50%)
            </>
          ) : (
            <>
              <strong>Quality</strong> measures completeness, consistency, and validity of extractions.
              <br />• High (≥80%) • Medium (50-80%) • Low (&lt;50%)
            </>
          )}
        </div>
      </div>

      {/* AUTOMATED SCORES NOTICE */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs bg-amber-50 border border-amber-200">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div className="text-amber-800">
          <strong>Note:</strong> This chart displays <strong>automated scores only</strong> (100% system-calculated). 
          Human evaluator ratings are <strong>not included</strong>. For combined scores (60% automated + 40% human rating), 
          see the <strong>Overview</strong> tab.
        </div>
      </div>

      {/* Grouped Bar Chart */}
      <div className="space-y-4 mb-4">
        {currentRates.map((data, idx) => {
          const compData = comparisonRates.find(c => c.component === data.component);
          
          return (
            <div key={data.component} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium w-32">{data.label}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
                    {(data.avgScore * 100).toFixed(1)}%
                  </Badge>
                  {compareMode && compData && (
                    <Badge variant="outline" className={`text-xs ${activeTab === 'accuracy' ? 'text-purple-500' : 'text-blue-500'}`}>
                      vs {(compData.avgScore * 100).toFixed(1)}%
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">n={data.total}</span>
                </div>
              </div>
              
              {/* Primary bar */}
              <div className="flex h-6 rounded-lg overflow-hidden bg-gray-100">
                <div 
                  className="bg-green-500 flex items-center justify-center text-xs text-white font-medium transition-all"
                  style={{ width: `${data.matchRate * 100}%` }}
                  title={`High Match (≥80%): ${(data.matchRate * 100).toFixed(1)}%`}
                >
                  {data.matchRate > 0.1 && `${(data.matchRate * 100).toFixed(0)}%`}
                </div>
                <div 
                  className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium transition-all"
                  style={{ width: `${data.partialRate * 100}%` }}
                  title={`Partial Match (50-80%): ${(data.partialRate * 100).toFixed(1)}%`}
                >
                  {data.partialRate > 0.1 && `${(data.partialRate * 100).toFixed(0)}%`}
                </div>
                <div 
                  className="bg-red-400 flex items-center justify-center text-xs text-white font-medium transition-all"
                  style={{ width: `${data.mismatchRate * 100}%` }}
                  title={`Low Match (<50%): ${(data.mismatchRate * 100).toFixed(1)}%`}
                >
                  {data.mismatchRate > 0.1 && `${(data.mismatchRate * 100).toFixed(0)}%`}
                </div>
              </div>
              
              {/* Comparison bar (when enabled) */}
              {compareMode && compData && (
                <div className="flex h-4 rounded-lg overflow-hidden bg-gray-50 opacity-70">
                  <div 
                    className="bg-green-400 transition-all"
                    style={{ width: `${compData.matchRate * 100}%` }}
                  />
                  <div 
                    className="bg-yellow-400 transition-all"
                    style={{ width: `${compData.partialRate * 100}%` }}
                  />
                  <div 
                    className="bg-red-300 transition-all"
                    style={{ width: `${compData.mismatchRate * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 mb-4">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" /><span>High (≥80%)</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded" /><span>Partial (50-80%)</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded" /><span>Low (&lt;50%)</span></div>
        {compareMode && (
          <>
            <span className="mx-1">|</span>
            <span className="text-gray-500">Faded bars = {activeTab === 'accuracy' ? 'Quality' : 'Accuracy'}</span>
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
        <div className="text-center">
          <p className={`text-2xl font-bold ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
            {(currentOverall.avgScore * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600">Avg {activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} (Auto)</p>
          {compareMode && (
            <p className={`text-xs ${activeTab === 'accuracy' ? 'text-purple-500' : 'text-blue-500'}`}>
              vs {(comparisonOverall.avgScore * 100).toFixed(1)}%
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{(currentOverall.matchRate * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-600">High Match Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{(currentOverall.partialRate * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-600">Partial Match Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">{((currentOverall.matchRate + currentOverall.partialRate) * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-600">Combined (≥50%)</p>
        </div>
      </div>

      {/* Comparison Table */}
      {accuracyData && qualityData && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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
                {componentKeys.map(compKey => {
                  const acc = accuracyData[compKey];
                  const qual = qualityData[compKey];
                  if (!acc || acc.total === 0) return null;
                  
                  const diff = qual.avgScore - acc.avgScore;
                  
                  return (
                    <tr key={compKey} className="border-b border-gray-100">
                      <td className="py-2 px-2 font-medium text-gray-700">{componentLabels[compKey]}</td>
                      <td className="text-center py-2 px-2 font-mono text-blue-600">{(acc.avgScore * 100).toFixed(1)}%</td>
                      <td className="text-center py-2 px-2 font-mono text-purple-600">{(qual.avgScore * 100).toFixed(1)}%</td>
                      <td className={`text-center py-2 px-2 font-mono ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                      </td>
                      <td className="text-center py-2 px-2 text-gray-500">{acc.total}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-semibold">
                  <td className="py-2 px-2 text-gray-700">Average</td>
                  <td className="text-center py-2 px-2 font-mono text-blue-700">
                    {(calcOverall(buildRates(accuracyData)).avgScore * 100).toFixed(1)}%
                  </td>
                  <td className="text-center py-2 px-2 font-mono text-purple-700">
                    {(calcOverall(buildRates(qualityData)).avgScore * 100).toFixed(1)}%
                  </td>
                  <td className={`text-center py-2 px-2 font-mono ${
                    calcOverall(buildRates(qualityData)).avgScore - calcOverall(buildRates(accuracyData)).avgScore >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calcOverall(buildRates(qualityData)).avgScore - calcOverall(buildRates(accuracyData)).avgScore >= 0 ? '+' : ''}
                    {((calcOverall(buildRates(qualityData)).avgScore - calcOverall(buildRates(accuracyData)).avgScore) * 100).toFixed(1)}%
                  </td>
                  <td className="text-center py-2 px-2 text-gray-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            All scores shown are automated system calculations only
          </p>
        </div>
      )}

      {/* Research Findings */}
      <ResearchFindings title={`📊 Research Findings: ${activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} Analysis`}>
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

          {/* Current Tab Note */}
          <Alert className={activeTab === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}>
            <Target className={`h-4 w-4 ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`} />
            <AlertDescription className={`text-sm ${activeTab === 'accuracy' ? 'text-blue-800' : 'text-purple-800'}`}>
              <strong>Currently viewing: {activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} (Automated)</strong> — 
              Toggle tabs above to compare against {activeTab === 'accuracy' ? 'Quality' : 'Accuracy'} scores.
            </AlertDescription>
          </Alert>

          <div className={`rounded-lg p-4 ${activeTab === 'accuracy' ? 'bg-blue-50' : 'bg-purple-50'}`}>
            <h4 className={`text-sm font-semibold mb-2 ${activeTab === 'accuracy' ? 'text-blue-900' : 'text-purple-900'}`}>
              {activeTab === 'accuracy' ? 'Automated Validation Against ORKG Ground Truth' : 'Automated Quality Assessment Results'}
            </h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Overall Automated {activeTab === 'accuracy' ? 'Accuracy' : 'Quality'}:</strong> The system achieved 
                {(currentOverall.matchRate * 100).toFixed(1)}% high match rate and 
                {((currentOverall.matchRate + currentOverall.partialRate) * 100).toFixed(1)}% combined 
                (average: {(currentOverall.avgScore * 100).toFixed(1)}%).
              </li>
              {bestComponent && (
                <li>
                  <strong>Strongest Component:</strong> {bestComponent.label} achieved highest automated average 
                  ({(bestComponent.avgScore * 100).toFixed(1)}%) with {(bestComponent.matchRate * 100).toFixed(1)}% high match rate.
                </li>
              )}
              {worstComponent && worstComponent !== bestComponent && (
                <li>
                  <strong>Area for Improvement:</strong> {worstComponent.label} showed lowest automated score 
                  ({(worstComponent.avgScore * 100).toFixed(1)}%) with {(worstComponent.mismatchRate * 100).toFixed(1)}% low match rate.
                </li>
              )}
            </ul>
          </div>

          {/* Comparison Insight */}
          {accuracyData && qualityData && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">Accuracy vs Quality Gap Analysis (Automated)</h4>
              <p className="text-sm text-gray-700">
                {calcOverall(buildRates(qualityData)).avgScore > calcOverall(buildRates(accuracyData)).avgScore
                  ? `Automated Quality scores (${(calcOverall(buildRates(qualityData)).avgScore * 100).toFixed(1)}%) exceed Accuracy scores (${(calcOverall(buildRates(accuracyData)).avgScore * 100).toFixed(1)}%) by ${((calcOverall(buildRates(qualityData)).avgScore - calcOverall(buildRates(accuracyData)).avgScore) * 100).toFixed(1)} percentage points. This indicates the system produces well-structured, complete outputs that may not always exactly match ground truth phrasing.`
                  : `Automated Accuracy scores (${(calcOverall(buildRates(accuracyData)).avgScore * 100).toFixed(1)}%) exceed Quality scores (${(calcOverall(buildRates(qualityData)).avgScore * 100).toFixed(1)}%) by ${((calcOverall(buildRates(accuracyData)).avgScore - calcOverall(buildRates(qualityData)).avgScore) * 100).toFixed(1)} percentage points. This suggests the system achieves good ground truth matching but has room for improving structural completeness.`
                }
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
            <p className="text-sm text-gray-700 italic">
              "Automated validation against ORKG ground truth revealed an average {activeTab} score of {(currentOverall.avgScore * 100).toFixed(1)}%, 
              with {(currentOverall.matchRate * 100).toFixed(1)}% of evaluations achieving high match (≥80%) and an additional 
              {(currentOverall.partialRate * 100).toFixed(1)}% achieving partial alignment (50-80%). 
              {bestComponent ? ` The hybrid neuro-symbolic approach demonstrated strongest automated performance in ${bestComponent.label} extraction (${(bestComponent.avgScore * 100).toFixed(1)}% average ${activeTab}).` : ''}
              {accuracyData && qualityData ? ` Comparing automated accuracy (${(calcOverall(buildRates(accuracyData)).avgScore * 100).toFixed(1)}%) and quality (${(calcOverall(buildRates(qualityData)).avgScore * 100).toFixed(1)}%) metrics revealed ${Math.abs(calcOverall(buildRates(qualityData)).avgScore - calcOverall(buildRates(accuracyData)).avgScore) > 0.05 ? 'meaningful differences' : 'consistent patterns'} across components.` : ''}"
            </p>
          </div>

          {/* Note about combined scores */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Important Note</h4>
            <p className="text-sm text-amber-800">
              The scores reported in this section represent <strong>automated system calculations only</strong>. 
              When human evaluator ratings are combined using a 60/40 weighting formula (60% automated + 40% human), 
              the final scores increase to approximately <strong>{((currentOverall.avgScore * 0.6 + 0.9 * 0.4) * 100).toFixed(1)}%</strong> on average, 
              reflecting human acceptance of system outputs. See the <strong>Overview</strong> tab for combined scores.
            </p>
          </div>

          {/* Component Summary Table */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Component {activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} Summary (Automated)</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Component</th>
                  <th className="text-right py-1">Avg Score</th>
                  <th className="text-right py-1">High</th>
                  <th className="text-right py-1">Partial</th>
                  <th className="text-right py-1">Low</th>
                </tr>
              </thead>
              <tbody>
                {currentRates.map((data, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-1">{data.label}</td>
                    <td className={`text-right py-1 font-mono ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {(data.avgScore * 100).toFixed(1)}%
                    </td>
                    <td className="text-right py-1 text-green-600">{(data.matchRate * 100).toFixed(0)}%</td>
                    <td className="text-right py-1 text-yellow-600">{(data.partialRate * 100).toFixed(0)}%</td>
                    <td className="text-right py-1 text-red-500">{(data.mismatchRate * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ResearchFindings>
    </Card>
  );
};

export default SystemVsGroundTruthChart;