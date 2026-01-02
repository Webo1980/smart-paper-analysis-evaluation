// src/components/dashboard/charts/CorrelationHeatmap.jsx
// UPDATED: Shows BOTH Accuracy and Quality correlations with Compare feature
// Calculates Pearson correlation directly from paper data for consistency
// NOTE: Shows AUTOMATED scores only (no human ratings combined)

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { 
  Grid3X3, Download, AlertCircle, ChevronDown, ChevronUp, BookOpen, Info, Target, Award, Calculator
} from 'lucide-react';

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
 * CorrelationHeatmap
 * 
 * DATA SOURCE: aggregatedData.papers from aggregationService
 * CALCULATION: Pearson correlation coefficient
 * - ACCURACY correlations: Using comp.accuracyScores?.mean ?? comp.scores?.mean
 * - QUALITY correlations: Using comp.qualityScores?.mean
 * - Matches OverviewMetrics data paths exactly
 * 
 * NOTE: This chart shows AUTOMATED SCORES ONLY (no human ratings combined).
 * Correlations are calculated between automated system scores only.
 * For combined scores (60% automated + 40% human), see OverviewMetrics.
 * 
 * FORMULA: r = Σ(xi - x̄)(yi - ȳ) / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
 */
const CorrelationHeatmap = ({ data, aggregatedData }) => {
  const [activeTab, setActiveTab] = useState('accuracy'); // 'accuracy' or 'quality'
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showFormula, setShowFormula] = useState(false);

  const components = [
    { id: 'metadata', label: 'Metadata', short: 'Meta' },
    { id: 'research_field', label: 'Research Field', short: 'Field' },
    { id: 'research_problem', label: 'Research Problem', short: 'Problem' },
    { id: 'template', label: 'Template', short: 'Template' },
    { id: 'content', label: 'Content', short: 'Content' }
  ];

  // Calculate Pearson correlation coefficient
  const calculatePearsonCorrelation = (x, y) => {
    if (x.length !== y.length || x.length < 2) return null;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    return numerator / denominator;
  };

  // Extract scores and calculate correlation matrix for ACCURACY (AUTOMATED ONLY)
  const accuracyCorrelations = useMemo(() => {
    if (!aggregatedData?.papers) return null;
    
    const papers = Object.values(aggregatedData.papers);
    const matrix = {};
    const sampleSize = papers.length;
    
    // Extract accuracy scores for each component (automated scores only)
    const componentScores = {};
    components.forEach(comp => {
      componentScores[comp.id] = papers
        .map(paper => {
          const compData = paper[comp.id];
          // ACCURACY: Same path as OverviewMetrics (automated score only)
          return compData?.accuracyScores?.mean ?? compData?.scores?.mean;
        })
        .filter(score => score !== undefined && !isNaN(score));
    });
    
    // Calculate correlation for each pair
    const pairSampleSizes = {};
    components.forEach(comp1 => {
      components.forEach(comp2 => {
        const key = `${comp1.id}-${comp2.id}`;
        if (comp1.id === comp2.id) {
          matrix[key] = 1;
          pairSampleSizes[key] = sampleSize;
        } else {
          // Get paired scores (only where both exist)
          // NOTE: For accuracy, we include 0 values as they are valid scores
          const paired = papers
            .map(paper => ({
              x: paper[comp1.id]?.accuracyScores?.mean ?? paper[comp1.id]?.scores?.mean,
              y: paper[comp2.id]?.accuracyScores?.mean ?? paper[comp2.id]?.scores?.mean
            }))
            .filter(p => p.x !== undefined && p.y !== undefined && !isNaN(p.x) && !isNaN(p.y));
          
          pairSampleSizes[key] = paired.length;
          
          if (paired.length >= 2) {
            matrix[key] = calculatePearsonCorrelation(
              paired.map(p => p.x),
              paired.map(p => p.y)
            );
          } else {
            matrix[key] = null;
          }
        }
      });
    });
    
    return { matrix, sampleSize, componentScores, pairSampleSizes };
  }, [aggregatedData]);

  // Extract scores and calculate correlation matrix for QUALITY (AUTOMATED ONLY)
  const qualityCorrelations = useMemo(() => {
    if (!aggregatedData?.papers) return null;
    
    const papers = Object.values(aggregatedData.papers);
    const matrix = {};
    const sampleSize = papers.length;
    
    // Extract quality scores for each component (automated scores only)
    const componentScores = {};
    components.forEach(comp => {
      componentScores[comp.id] = papers
        .map(paper => {
          const compData = paper[comp.id];
          // QUALITY: Same path as OverviewMetrics (automated score only)
          return compData?.qualityScores?.mean;
        })
        .filter(score => score !== undefined && !isNaN(score) && score > 0);
    });
    
    // Calculate correlation for each pair
    const pairSampleSizes = {};
    components.forEach(comp1 => {
      components.forEach(comp2 => {
        const key = `${comp1.id}-${comp2.id}`;
        if (comp1.id === comp2.id) {
          matrix[key] = 1;
          pairSampleSizes[key] = sampleSize;
        } else {
          // Get paired scores (only where both exist and > 0 for quality)
          const paired = papers
            .map(paper => ({
              x: paper[comp1.id]?.qualityScores?.mean,
              y: paper[comp2.id]?.qualityScores?.mean
            }))
            .filter(p => p.x !== undefined && p.y !== undefined && !isNaN(p.x) && !isNaN(p.y) && p.x > 0 && p.y > 0);
          
          pairSampleSizes[key] = paired.length;
          
          if (paired.length >= 2) {
            matrix[key] = calculatePearsonCorrelation(
              paired.map(p => p.x),
              paired.map(p => p.y)
            );
          } else {
            matrix[key] = null;
          }
        }
      });
    });
    
    return { matrix, sampleSize, componentScores, pairSampleSizes };
  }, [aggregatedData]);

  const currentCorrelations = activeTab === 'accuracy' ? accuracyCorrelations : qualityCorrelations;
  const comparisonCorrelations = activeTab === 'accuracy' ? qualityCorrelations : accuracyCorrelations;

  if (!currentCorrelations) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No correlation data available. Ensure aggregatedData.papers is provided.
        </AlertDescription>
      </Alert>
    );
  }

  // Get color for correlation value
  const getCorrelationColor = (value, isComparison = false) => {
    if (value === null || value === undefined) return 'bg-gray-100';
    
    const absValue = Math.abs(value);
    const opacity = isComparison ? ' opacity-60' : '';
    
    if (value > 0) {
      if (absValue > 0.7) return `bg-green-600 text-white${opacity}`;
      if (absValue > 0.5) return `bg-green-500 text-white${opacity}`;
      if (absValue > 0.3) return `bg-green-400${opacity}`;
      if (absValue > 0.1) return `bg-green-200${opacity}`;
      return `bg-green-100${opacity}`;
    } else {
      if (absValue > 0.7) return `bg-red-600 text-white${opacity}`;
      if (absValue > 0.5) return `bg-red-500 text-white${opacity}`;
      if (absValue > 0.3) return `bg-red-400${opacity}`;
      if (absValue > 0.1) return `bg-red-200${opacity}`;
      return `bg-red-100${opacity}`;
    }
  };

  // Get interpretation for correlation strength
  const getCorrelationStrength = (value) => {
    if (value === null) return 'N/A';
    const absValue = Math.abs(value);
    if (absValue > 0.7) return 'Strong';
    if (absValue > 0.5) return 'Moderate';
    if (absValue > 0.3) return 'Weak';
    return 'Very Weak';
  };

  // Calculate research insights
  const researchInsights = useMemo(() => {
    const matrix = currentCorrelations.matrix;
    const allCorrelations = [];
    const positiveStrong = [];
    const negativeStrong = [];
    
    // Extract all unique correlations (upper triangle)
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const key = `${components[i].id}-${components[j].id}`;
        const value = matrix[key];
        if (value !== null && value !== undefined && !isNaN(value)) {
          const pair = {
            comp1: components[i].label,
            comp2: components[j].label,
            comp1Id: components[i].id,
            comp2Id: components[j].id,
            value: value,
            strength: getCorrelationStrength(value)
          };
          allCorrelations.push(pair);
          
          if (value > 0.5) positiveStrong.push(pair);
          if (value < -0.3) negativeStrong.push(pair);
        }
      }
    }
    
    // Sort by absolute value
    allCorrelations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    // Calculate average correlation
    const avgCorrelation = allCorrelations.length > 0
      ? allCorrelations.reduce((sum, c) => sum + c.value, 0) / allCorrelations.length
      : 0;
    
    const strongest = allCorrelations[0];
    const weakest = allCorrelations[allCorrelations.length - 1];
    
    return {
      allCorrelations,
      positiveStrong,
      negativeStrong,
      avgCorrelation,
      strongest,
      weakest,
      totalPairs: allCorrelations.length,
      sampleSize: currentCorrelations.sampleSize
    };
  }, [currentCorrelations]);

  // Build comparison data
  const comparisonData = useMemo(() => {
    if (!accuracyCorrelations || !qualityCorrelations) return null;
    
    const pairs = [];
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const key = `${components[i].id}-${components[j].id}`;
        const accValue = accuracyCorrelations.matrix[key];
        const qualValue = qualityCorrelations.matrix[key];
        const accN = accuracyCorrelations.pairSampleSizes?.[key] || 0;
        const qualN = qualityCorrelations.pairSampleSizes?.[key] || 0;
        
        if (accValue !== null && qualValue !== null) {
          pairs.push({
            comp1: components[i].short,
            comp2: components[j].short,
            accuracy: accValue,
            quality: qualValue,
            difference: qualValue - accValue,
            accN,
            qualN
          });
        }
      }
    }
    
    // Calculate averages
    const avgAcc = pairs.reduce((sum, p) => sum + p.accuracy, 0) / pairs.length;
    const avgQual = pairs.reduce((sum, p) => sum + p.quality, 0) / pairs.length;
    
    return { pairs, avgAcc, avgQual };
  }, [accuracyCorrelations, qualityCorrelations]);

  const handleExport = () => {
    const exportData = {
      type: activeTab,
      note: 'AUTOMATED SCORES ONLY - Human ratings not included in correlation calculations',
      correlationMatrix: currentCorrelations.matrix,
      sampleSize: currentCorrelations.sampleSize,
      insights: researchInsights,
      comparison: comparisonData,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correlation_${activeTab}_automated_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
            <h3 className="text-lg font-semibold">Component Correlation Analysis</h3>
            <p className="text-sm text-gray-600">
              Pearson correlation between automated {activeTab} scores (n={currentCorrelations.sampleSize})
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
          <Button onClick={() => setShowFormula(!showFormula)} variant="outline" size="sm">
            <Calculator className="h-4 w-4" />
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
          <span>Accuracy Correlations</span>
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
          <span>Quality Correlations</span>
        </button>
      </div>

      {/* Formula Display */}
      {showFormula && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <Calculator className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Pearson Correlation Coefficient</h4>
              <div className="font-mono text-sm bg-white p-3 rounded border mb-2 overflow-x-auto">
                r = Σ(xᵢ - x̄)(yᵢ - ȳ) / √[Σ(xᵢ - x̄)² × Σ(yᵢ - ȳ)²]
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><strong>Data Source:</strong> {activeTab === 'accuracy' 
                  ? 'comp.accuracyScores?.mean ?? comp.scores?.mean (automated only)' 
                  : 'comp.qualityScores?.mean (automated only)'}</li>
                <li><strong>Sample Size:</strong> n = {currentCorrelations.sampleSize} papers</li>
                <li><strong>Note:</strong> Human evaluator ratings are NOT included in these correlations</li>
                <li><strong>Interpretation:</strong> r = -1 (perfect negative) to +1 (perfect positive), 0 = no correlation</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className={`flex items-start gap-2 p-3 rounded-lg mb-3 text-xs ${
        activeTab === 'accuracy' ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'
      }`}>
        <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${activeTab === 'accuracy' ? 'text-blue-500' : 'text-purple-500'}`} />
        <div className={activeTab === 'accuracy' ? 'text-blue-800' : 'text-purple-800'}>
          {activeTab === 'accuracy' ? (
            <>
              <strong>Accuracy Correlations</strong> measure relationships between component accuracy scores.
              High correlation suggests that accurate extraction in one component predicts accuracy in another.
            </>
          ) : (
            <>
              <strong>Quality Correlations</strong> measure relationships between component quality scores.
              High correlation suggests that quality in one component predicts quality in another.
            </>
          )}
        </div>
      </div>

      {/* AUTOMATED SCORES NOTICE */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs bg-amber-50 border border-amber-200">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div className="text-amber-800">
          <strong>Note:</strong> Correlations are calculated using <strong>automated scores only</strong> (100% system-calculated). 
          Human evaluator ratings are <strong>not included</strong> in these correlation calculations. 
          For combined scores (60% automated + 40% human rating), see the <strong>Overview</strong> tab.
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs font-medium text-gray-500"></th>
              {components.map(comp => (
                <th key={comp.id} className="p-2 text-xs font-medium text-gray-700 text-center">
                  {comp.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {components.map((rowComp, rowIdx) => (
              <tr key={rowComp.id}>
                <td className="p-2 text-xs font-medium text-gray-700">
                  {rowComp.short}
                </td>
                {components.map((colComp, colIdx) => {
                  const key = `${rowComp.id}-${colComp.id}`;
                  const value = currentCorrelations.matrix[key];
                  const compValue = comparisonCorrelations?.matrix[key];
                  const pairN = currentCorrelations.pairSampleSizes?.[key] || 0;
                  const isSelected = selectedCell?.key === key;
                  const isDiagonal = rowIdx === colIdx;
                  const isLowN = pairN < 10 && !isDiagonal;
                  
                  return (
                    <td
                      key={colComp.id}
                      className={`p-1 text-center cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => !isDiagonal && setSelectedCell({ 
                        key, 
                        value, 
                        compValue,
                        comp1: rowComp.label, 
                        comp2: colComp.label,
                        n: pairN
                      })}
                    >
                      <div className={`p-2 rounded ${getCorrelationColor(value)} ${isDiagonal ? 'opacity-50' : ''} ${isLowN ? 'ring-1 ring-orange-400' : ''} relative`}>
                        <span className="text-xs font-medium">
                          {value !== null ? value.toFixed(2) : '-'}
                        </span>
                        {/* Sample size indicator for low n */}
                        {isLowN && (
                          <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[8px] px-1 rounded">
                            n={pairN}
                          </div>
                        )}
                        {/* Comparison indicator */}
                        {compareMode && !isDiagonal && compValue !== null && (
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full text-[8px] flex items-center justify-center ${
                            activeTab === 'accuracy' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                          }`} title={`${activeTab === 'accuracy' ? 'Quality' : 'Accuracy'}: ${compValue.toFixed(2)}`}>
                            {compValue > value ? '↑' : compValue < value ? '↓' : '='}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
        <span className="text-gray-600">Negative</span>
        <div className="flex gap-1">
          <div className="w-6 h-4 bg-red-600 rounded" title="-0.7 to -1.0" />
          <div className="w-6 h-4 bg-red-400 rounded" title="-0.3 to -0.7" />
          <div className="w-6 h-4 bg-red-200 rounded" title="-0.1 to -0.3" />
          <div className="w-6 h-4 bg-gray-100 rounded" title="~0" />
          <div className="w-6 h-4 bg-green-200 rounded" title="0.1 to 0.3" />
          <div className="w-6 h-4 bg-green-400 rounded" title="0.3 to 0.7" />
          <div className="w-6 h-4 bg-green-600 rounded" title="0.7 to 1.0" />
        </div>
        <span className="text-gray-600">Positive</span>
        <span className="mx-1">|</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-200 rounded ring-1 ring-orange-400" />
          <span className="text-orange-600">Low n (&lt;10)</span>
        </div>
        {compareMode && (
          <>
            <span className="mx-1">|</span>
            <div className={`w-3 h-3 rounded-full ${activeTab === 'accuracy' ? 'bg-purple-500' : 'bg-blue-500'}`} />
            <span className="text-gray-600">{activeTab === 'accuracy' ? 'Quality' : 'Accuracy'} indicator</span>
          </>
        )}
      </div>

      {/* Selected Cell Details */}
      {selectedCell && selectedCell.value !== null && (
        <Alert className={`mt-4 ${activeTab === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
          <Info className={`h-4 w-4 ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`} />
          <AlertDescription>
            <div className="flex flex-wrap items-center gap-2">
              <strong>{selectedCell.comp1}</strong> ↔ <strong>{selectedCell.comp2}</strong>
              <span className="font-mono ml-2">{activeTab} (auto): r = {selectedCell.value.toFixed(3)}</span>
              <Badge variant="outline">{getCorrelationStrength(selectedCell.value)}</Badge>
              <Badge variant="secondary" className="text-xs">n={selectedCell.n}</Badge>
              {selectedCell.n < 10 && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">⚠️ Low sample size</Badge>
              )}
              {compareMode && selectedCell.compValue !== null && (
                <>
                  <span className="mx-1">|</span>
                  <span className={`font-mono ${activeTab === 'accuracy' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {activeTab === 'accuracy' ? 'Quality' : 'Accuracy'} (auto): r = {selectedCell.compValue.toFixed(3)}
                  </span>
                  <span className={`text-xs ${selectedCell.compValue > selectedCell.value ? 'text-green-600' : 'text-red-600'}`}>
                    ({selectedCell.compValue > selectedCell.value ? '+' : ''}{(selectedCell.compValue - selectedCell.value).toFixed(3)})
                  </span>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className={`text-lg font-bold ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
            {researchInsights.totalPairs}
          </p>
          <p className="text-xs text-gray-500">Total Pairs</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{researchInsights.positiveStrong.length}</p>
          <p className="text-xs text-gray-500">Strong Positive</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-600">{researchInsights.negativeStrong.length}</p>
          <p className="text-xs text-gray-500">Strong Negative</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-600">{researchInsights.avgCorrelation.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Avg Correlation</p>
        </div>
      </div>

      {/* Accuracy vs Quality Comparison Table */}
      {comparisonData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Accuracy vs Quality Correlation Comparison (Automated Scores)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Component Pair</th>
                  <th className="text-center py-2 px-2 font-medium text-blue-600">Accuracy r</th>
                  <th className="text-center py-2 px-2 font-medium text-blue-400">n</th>
                  <th className="text-center py-2 px-2 font-medium text-purple-600">Quality r</th>
                  <th className="text-center py-2 px-2 font-medium text-purple-400">n</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">Difference</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.pairs.slice(0, 10).map((pair, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${pair.accN < 10 ? 'bg-orange-50' : ''}`}>
                    <td className="py-2 px-2 font-medium text-gray-700">{pair.comp1} ↔ {pair.comp2}</td>
                    <td className="text-center py-2 px-2 font-mono text-blue-600">{pair.accuracy.toFixed(3)}</td>
                    <td className={`text-center py-2 px-2 text-xs ${pair.accN < 10 ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                      {pair.accN}
                    </td>
                    <td className="text-center py-2 px-2 font-mono text-purple-600">{pair.quality.toFixed(3)}</td>
                    <td className={`text-center py-2 px-2 text-xs ${pair.qualN < 10 ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                      {pair.qualN}
                    </td>
                    <td className={`text-center py-2 px-2 font-mono ${pair.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pair.difference >= 0 ? '+' : ''}{pair.difference.toFixed(3)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="py-2 px-2 text-gray-700">Average</td>
                  <td className="text-center py-2 px-2 font-mono text-blue-700">{comparisonData.avgAcc.toFixed(3)}</td>
                  <td className="text-center py-2 px-2 text-gray-400">—</td>
                  <td className="text-center py-2 px-2 font-mono text-purple-700">{comparisonData.avgQual.toFixed(3)}</td>
                  <td className="text-center py-2 px-2 text-gray-400">—</td>
                  <td className={`text-center py-2 px-2 font-mono ${comparisonData.avgQual - comparisonData.avgAcc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparisonData.avgQual - comparisonData.avgAcc >= 0 ? '+' : ''}{(comparisonData.avgQual - comparisonData.avgAcc).toFixed(3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-orange-600 mt-2">⚠️ Rows highlighted in orange have low sample size (n &lt; 10) for accuracy correlations</p>
        </div>
      )}

      {/* Research Findings */}
      <ResearchFindings title={`📊 Research Findings: ${activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} Correlation Analysis`}>
        <div className="space-y-4">
          {/* Automated Scores Notice for Research */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <strong>Important:</strong> All correlations in this section are calculated using <strong>automated system scores only</strong>. 
                Human evaluator ratings are not factored into these correlation calculations. When reporting, 
                note that these correlations represent system-generated score relationships.
              </div>
            </div>
          </div>

          {/* Current Tab Note */}
          <Alert className={activeTab === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}>
            <Grid3X3 className={`h-4 w-4 ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`} />
            <AlertDescription className={`text-sm ${activeTab === 'accuracy' ? 'text-blue-800' : 'text-purple-800'}`}>
              <strong>Currently viewing: {activeTab === 'accuracy' ? 'Accuracy' : 'Quality'} Correlations (Automated)</strong> — 
              Toggle tabs above to compare correlation patterns between Accuracy and Quality scores.
            </AlertDescription>
          </Alert>

          <div className={`rounded-lg p-4 ${activeTab === 'accuracy' ? 'bg-blue-50' : 'bg-purple-50'}`}>
            <h4 className={`text-sm font-semibold mb-2 ${activeTab === 'accuracy' ? 'text-blue-900' : 'text-purple-900'}`}>
              Correlation Pattern Analysis (Automated Scores)
            </h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Overall Pattern:</strong> Average inter-component correlation 
                of <strong>{researchInsights.avgCorrelation.toFixed(3)}</strong> indicates 
                {researchInsights.avgCorrelation > 0.3 
                  ? ' moderate interdependency between evaluation dimensions.'
                  : researchInsights.avgCorrelation > 0.1 
                    ? ' weak interdependency, indicating relatively independent assessment.'
                    : ' minimal interdependency, suggesting distinct quality aspects.'}
              </li>
              {researchInsights.strongest && (
                <li>
                  <strong>Strongest Correlation:</strong> {researchInsights.strongest.comp1} and {researchInsights.strongest.comp2} 
                  (r = {researchInsights.strongest.value.toFixed(3)}) showed {researchInsights.strongest.strength.toLowerCase()} correlation.
                </li>
              )}
              {researchInsights.weakest && (
                <li>
                  <strong>Most Independent:</strong> {researchInsights.weakest.comp1} and {researchInsights.weakest.comp2} 
                  (r = {researchInsights.weakest.value.toFixed(3)}) showed the weakest relationship.
                </li>
              )}
            </ul>
          </div>

          {/* Comparison Insight */}
          {comparisonData && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">Accuracy vs Quality Correlation Patterns (Automated)</h4>
              <p className="text-sm text-gray-700">
                {comparisonData.avgQual > comparisonData.avgAcc 
                  ? `Quality scores show higher average inter-component correlation (r = ${comparisonData.avgQual.toFixed(3)}) compared to Accuracy scores (r = ${comparisonData.avgAcc.toFixed(3)}). This suggests the automated quality assessment is more holistically interconnected, while accuracy assessments are more component-specific.`
                  : `Accuracy scores show higher average inter-component correlation (r = ${comparisonData.avgAcc.toFixed(3)}) compared to Quality scores (r = ${comparisonData.avgQual.toFixed(3)}). This suggests automated accuracy assessments are more interconnected across components.`}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
            <p className="text-sm text-gray-700 italic">
              "Pearson correlation analysis of automated {activeTab} scores across the five evaluation components (n = {currentCorrelations.sampleSize}) 
              revealed {researchInsights.avgCorrelation > 0.3 ? 'moderate' : researchInsights.avgCorrelation > 0.1 ? 'weak' : 'minimal'} average 
              inter-component correlation (M = {researchInsights.avgCorrelation.toFixed(3)}). 
              {researchInsights.strongest ? `The strongest relationship emerged between ${researchInsights.strongest.comp1} and ${researchInsights.strongest.comp2} (r = ${researchInsights.strongest.value.toFixed(2)}). ` : ''}
              {comparisonData ? `Comparing automated Accuracy (M = ${comparisonData.avgAcc.toFixed(3)}) and Quality (M = ${comparisonData.avgQual.toFixed(3)}) correlation patterns revealed ${Math.abs(comparisonData.avgQual - comparisonData.avgAcc) > 0.1 ? 'meaningful differences' : 'similar patterns'} in how these score types interrelate across components.` : ''}"
            </p>
          </div>

          {/* Note about automated vs combined scores */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Important Note</h4>
            <p className="text-sm text-amber-800">
              The correlations reported in this section are calculated using <strong>automated system scores only</strong>. 
              Human evaluator ratings are collected separately and combined using a 60/40 weighting formula in the Overview tab. 
              Correlation patterns may differ when analyzing combined scores that incorporate human judgment.
            </p>
          </div>
        </div>
      </ResearchFindings>
    </Card>
  );
};

export default CorrelationHeatmap;