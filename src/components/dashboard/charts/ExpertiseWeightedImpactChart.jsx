// src/components/dashboard/charts/ExpertiseWeightedImpactChart.jsx
// UPDATED: Handles n=1 scenario where within-paper weighting has no effect
// Offers alternative: cross-paper weighting analysis

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Scale, Target, Award, ChevronDown, ChevronUp, BookOpen, AlertCircle, Info, Users } from 'lucide-react';

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
 * ExpertiseWeightedImpactChart
 * 
 * Shows TWO types of expertise weighting analysis:
 * 
 * 1. WITHIN-PAPER WEIGHTING (Original):
 *    - When multiple evaluators rate the same paper, weight by expertise
 *    - Only effective when papers have n > 1 evaluations
 *    - If n=1 for all papers, this shows no effect (correctly)
 * 
 * 2. CROSS-PAPER WEIGHTING (Alternative):
 *    - Weight papers by their evaluator's expertise when calculating overall averages
 *    - Papers evaluated by experts contribute more to global statistics
 *    - Always effective when evaluators have different expertise levels
 */
const ExpertiseWeightedImpactChart = ({ aggregatedData, integratedData }) => {
  const [activeTab, setActiveTab] = useState('accuracy');
  const [compareMode, setCompareMode] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('cross-paper'); // 'within-paper' or 'cross-paper'

  const componentKeys = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
  const componentLabels = {
    metadata: 'Metadata',
    research_field: 'Research Field',
    research_problem: 'Research Problem',
    template: 'Template',
    content: 'Content'
  };

  // ============================================
  // WITHIN-PAPER WEIGHTING (Original approach)
  // Uses pre-calculated weighted_mean from aggregatedData
  // ============================================
  const calculateWithinPaperImpact = (scoreType) => {
    if (!aggregatedData?.papers) return null;
    
    const result = {};
    const papers = Object.values(aggregatedData.papers);
    let hasMultipleEvaluations = false;
    
    componentKeys.forEach(compKey => {
      const allRaw = [];
      const allWeighted = [];
      let totalCount = 0;
      let papersWithMultiple = 0;
      
      papers.forEach(paper => {
        const compData = paper[compKey];
        if (!compData) return;
        
        const scoreObj = scoreType === 'accuracy'
          ? (compData.accuracyScores ?? compData.scores)
          : compData.qualityScores;
          
        if (!scoreObj) return;
        
        // Use snake_case as per actual data structure
        const rawMean = scoreObj.mean;
        const weightedMean = scoreObj.weighted_mean ?? scoreObj.mean;
        const count = scoreObj.count || 1;
        
        if (count > 1) {
          papersWithMultiple++;
          hasMultipleEvaluations = true;
        }
        totalCount += count;
        
        const includeScore = scoreType === 'accuracy'
          ? (rawMean !== undefined && !isNaN(rawMean))
          : (rawMean !== undefined && !isNaN(rawMean) && rawMean > 0);
        
        if (includeScore) {
          allRaw.push(rawMean);
          allWeighted.push(weightedMean);
        }
      });
      
      if (allRaw.length === 0) {
        result[compKey] = { rawAvg: 0, weightedAvg: 0, difference: 0, count: 0, papersWithMultiple: 0 };
        return;
      }
      
      const rawAvg = allRaw.reduce((sum, v) => sum + v, 0) / allRaw.length;
      const weightedAvg = allWeighted.reduce((sum, v) => sum + v, 0) / allWeighted.length;
      
      result[compKey] = {
        rawAvg,
        weightedAvg,
        difference: weightedAvg - rawAvg,
        count: allRaw.length,
        totalEvaluations: totalCount,
        papersWithMultiple
      };
    });
    
    result._hasMultipleEvaluations = hasMultipleEvaluations;
    return result;
  };

  // ============================================
  // CROSS-PAPER WEIGHTING (Alternative approach)
  // Weight papers by their evaluator's expertise
  // ============================================
  const calculateCrossPaperImpact = (scoreType) => {
    if (!aggregatedData?.papers || !integratedData?.papers) return null;
    
    // Build expertise weight lookup by paper token
    const expertiseByPaper = {};
    integratedData.papers.forEach(paper => {
      const token = paper.token;
      // Get average expertise weight if multiple evaluations
      const weights = paper.userEvaluations?.map(e => e.userInfo?.expertiseWeight).filter(w => w != null) || [];
      if (weights.length > 0) {
        expertiseByPaper[token] = weights.reduce((a, b) => a + b, 0) / weights.length;
      }
    });
    
    const result = {};
    const papers = Object.entries(aggregatedData.papers);
    
    componentKeys.forEach(compKey => {
      const scores = [];
      const weights = [];
      
      papers.forEach(([paperId, paper]) => {
        const compData = paper[compKey];
        if (!compData) return;
        
        const scoreObj = scoreType === 'accuracy'
          ? (compData.accuracyScores ?? compData.scores)
          : compData.qualityScores;
          
        if (!scoreObj || scoreObj.mean === undefined) return;
        
        const score = scoreObj.mean;
        const weight = expertiseByPaper[paperId] || 1;
        
        const includeScore = scoreType === 'accuracy'
          ? !isNaN(score)
          : (!isNaN(score) && score > 0);
        
        if (includeScore) {
          scores.push(score);
          weights.push(weight);
        }
      });
      
      if (scores.length === 0) {
        result[compKey] = { rawAvg: 0, weightedAvg: 0, difference: 0, count: 0 };
        return;
      }
      
      // Simple average (all papers equal)
      const rawAvg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
      
      // Weighted average (expert-evaluated papers count more)
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const weightedAvg = scores.reduce((sum, score, i) => sum + score * weights[i], 0) / totalWeight;
      
      result[compKey] = {
        rawAvg,
        weightedAvg,
        difference: weightedAvg - rawAvg,
        count: scores.length
      };
    });
    
    return result;
  };

  const withinPaperAccuracy = useMemo(() => calculateWithinPaperImpact('accuracy'), [aggregatedData]);
  const withinPaperQuality = useMemo(() => calculateWithinPaperImpact('quality'), [aggregatedData]);
  const crossPaperAccuracy = useMemo(() => calculateCrossPaperImpact('accuracy'), [aggregatedData, integratedData]);
  const crossPaperQuality = useMemo(() => calculateCrossPaperImpact('quality'), [aggregatedData, integratedData]);

  // Select current data based on analysis mode and active tab
  const getCurrentImpact = () => {
    if (analysisMode === 'within-paper') {
      return activeTab === 'accuracy' ? withinPaperAccuracy : withinPaperQuality;
    } else {
      return activeTab === 'accuracy' ? crossPaperAccuracy : crossPaperQuality;
    }
  };
  
  const currentImpact = getCurrentImpact();

  // Calculate expertise stats
  const expertiseStats = useMemo(() => {
    if (!integratedData?.papers) return null;
    
    const allWeights = [];
    const evaluatorSet = new Set();
    
    integratedData.papers.forEach(paper => {
      paper.userEvaluations?.forEach(evaluation => {
        const weight = evaluation.userInfo?.expertiseWeight;
        if (weight !== undefined && weight !== null) {
          allWeights.push(weight);
          const evaluatorId = `${evaluation.userInfo?.firstName}_${evaluation.userInfo?.lastName}`;
          evaluatorSet.add(evaluatorId);
        }
      });
    });
    
    if (allWeights.length === 0) return null;
    
    const mean = allWeights.reduce((sum, w) => sum + w, 0) / allWeights.length;
    const variance = allWeights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / allWeights.length;
    const std = Math.sqrt(variance);
    const uniqueWeights = [...new Set(allWeights.map(w => w.toFixed(2)))];
    
    return {
      mean,
      std,
      min: Math.min(...allWeights),
      max: Math.max(...allWeights),
      totalEvaluators: evaluatorSet.size,
      totalEvaluations: allWeights.length,
      uniqueWeightCount: uniqueWeights.length
    };
  }, [integratedData]);

  if (!currentImpact) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No expertise weighting data available.</AlertDescription>
      </Alert>
    );
  }

  const validComponents = componentKeys.filter(c => currentImpact[c]?.count > 0);
  
  const calcOverall = (impact) => {
    if (!impact) return { rawAvg: 0, weightedAvg: 0, difference: 0 };
    const valid = componentKeys.filter(c => impact[c]?.count > 0);
    if (valid.length === 0) return { rawAvg: 0, weightedAvg: 0, difference: 0 };
    return {
      rawAvg: valid.reduce((sum, c) => sum + impact[c].rawAvg, 0) / valid.length,
      weightedAvg: valid.reduce((sum, c) => sum + impact[c].weightedAvg, 0) / valid.length,
      difference: valid.reduce((sum, c) => sum + impact[c].difference, 0) / valid.length
    };
  };

  const currentOverall = calcOverall(currentImpact);
  const withinPaperHasEffect = withinPaperAccuracy?._hasMultipleEvaluations;

  const maxScore = Math.max(
    ...componentKeys.map(c => Math.max(currentImpact[c]?.rawAvg || 0, currentImpact[c]?.weightedAvg || 0)),
    0.01
  );

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${activeTab === 'accuracy' ? 'bg-blue-100' : 'bg-purple-100'}`}>
            <Scale className={`h-5 w-5 ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Expertise-Weighted Impact</h3>
            <p className="text-sm text-gray-600">
              How evaluator expertise affects {activeTab} score aggregation
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

      {/* Analysis Mode Toggle */}
      <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setAnalysisMode('cross-paper')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            analysisMode === 'cross-paper'
              ? 'bg-white text-orange-700 shadow-sm border border-orange-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Users className="h-3 w-3" />
          <span>Cross-Paper Weighting</span>
          <Badge variant="outline" className={`text-xs ${analysisMode === 'cross-paper' ? 'bg-orange-50' : ''}`}>
            Recommended
          </Badge>
        </button>
        <button
          onClick={() => setAnalysisMode('within-paper')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            analysisMode === 'within-paper'
              ? 'bg-white text-gray-700 shadow-sm border border-gray-300'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Scale className="h-3 w-3" />
          <span>Within-Paper Weighting</span>
        </button>
      </div>

      {/* Accuracy/Quality Tab Selector */}
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
        </button>
      </div>

      {/* Explanation Box */}
      <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 text-xs ${
        analysisMode === 'cross-paper' 
          ? 'bg-orange-50 border border-orange-200' 
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
          analysisMode === 'cross-paper' ? 'text-orange-500' : 'text-gray-500'
        }`} />
        <div className={analysisMode === 'cross-paper' ? 'text-orange-800' : 'text-gray-700'}>
          {analysisMode === 'cross-paper' ? (
            <>
              <strong>Cross-Paper Weighting:</strong> Papers evaluated by domain experts (higher expertise weight) 
              contribute more to overall averages. This analysis compares equal-weight vs expertise-weighted 
              aggregation across all {Object.keys(aggregatedData?.papers || {}).length} papers.
            </>
          ) : (
            <>
              <strong>Within-Paper Weighting:</strong> When multiple evaluators rate the same paper, 
              expert opinions receive more weight in calculating that paper's score. 
              Effect depends on having multiple evaluations per paper with varying expertise levels.
            </>
          )}
        </div>
      </div>

      {/* Warning for within-paper mode when effect is minimal */}
      {analysisMode === 'within-paper' && Math.abs(calcOverall(withinPaperAccuracy).difference) < 0.0001 && (
        <Alert className="mb-4 bg-amber-50 border-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Minimal Effect Detected:</strong> Within-paper weighting shows no significant difference. 
            This can happen when: (1) most papers have only 1 evaluation, (2) evaluators for the same paper 
            have similar expertise weights, or (3) the weighted_mean calculation in aggregationService 
            produces values identical to mean. Try <strong>Cross-Paper Weighting</strong> for an alternative analysis.
          </AlertDescription>
        </Alert>
      )}

      {/* Expertise Distribution Summary */}
      {expertiseStats && (
        <div className="grid grid-cols-5 gap-2 mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
          <div className="text-center">
            <p className="text-lg font-bold text-orange-700">{expertiseStats.mean.toFixed(2)}</p>
            <p className="text-xs text-gray-600">Avg Weight</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-700">{expertiseStats.std.toFixed(2)}</p>
            <p className="text-xs text-gray-600">Std Dev</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-700">{expertiseStats.min.toFixed(1)}-{expertiseStats.max.toFixed(1)}</p>
            <p className="text-xs text-gray-600">Range</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-700">{expertiseStats.totalEvaluators}</p>
            <p className="text-xs text-gray-600">Evaluators</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-700">{expertiseStats.uniqueWeightCount}</p>
            <p className="text-xs text-gray-600">Unique Weights</p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">{(currentOverall.rawAvg * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-500">
            {analysisMode === 'cross-paper' ? 'Equal Weight Avg' : 'Raw Average'}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${
            Math.abs(currentOverall.difference) > 0.001 ? 'text-green-600' : 'text-gray-400'
          }`}>
            {currentOverall.difference >= 0 ? '+' : ''}{(currentOverall.difference * 100).toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500">
            Impact {Math.abs(currentOverall.difference) < 0.001 && '(minimal)'}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${activeTab === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
            {(currentOverall.weightedAvg * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Expertise-Weighted Avg</p>
        </div>
      </div>

      {/* Component Bars */}
      <div className="space-y-3 mb-4">
        {componentKeys.map(compKey => {
          const data = currentImpact[compKey];
          if (!data || data.count === 0) return null;
          
          const rawWidth = (data.rawAvg / maxScore) * 100;
          const weightedWidth = (data.weightedAvg / maxScore) * 100;
          const hasEffect = Math.abs(data.difference) > 0.0001;
          
          return (
            <div key={compKey} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium w-32">{componentLabels[compKey]}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${
                    hasEffect 
                      ? (data.difference >= 0 ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300')
                      : 'text-gray-400 border-gray-200'
                  }`}>
                    {data.difference >= 0 ? '+' : ''}{(data.difference * 100).toFixed(2)}%
                  </Badge>
                  <span className="text-xs text-gray-500">n={data.count}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">
                    {analysisMode === 'cross-paper' ? 'Equal' : 'Raw'}
                  </span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-gray-400 rounded" style={{ width: `${rawWidth}%` }} />
                  </div>
                  <span className="text-xs w-14 text-right">{(data.rawAvg * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Weighted</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div 
                      className={`h-full rounded ${
                        hasEffect
                          ? (data.difference >= 0 ? 'bg-green-500' : 'bg-red-400')
                          : 'bg-orange-400'
                      }`} 
                      style={{ width: `${weightedWidth}%` }} 
                    />
                  </div>
                  <span className="text-xs w-14 text-right">{(data.weightedAvg * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interpretation */}
      {analysisMode === 'cross-paper' && Math.abs(currentOverall.difference) > 0.001 && (
        <Alert className={`mb-4 ${currentOverall.difference >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <Info className={`h-4 w-4 ${currentOverall.difference >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={`text-sm ${currentOverall.difference >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {currentOverall.difference >= 0 ? (
              <>
                <strong>Positive Impact:</strong> Papers evaluated by domain experts tend to have 
                higher {activeTab} scores. Expert-weighted average is {(Math.abs(currentOverall.difference) * 100).toFixed(2)}% 
                higher than equal-weight average.
              </>
            ) : (
              <>
                <strong>Negative Impact:</strong> Papers evaluated by domain experts tend to have 
                lower {activeTab} scores. This may indicate experts are more critical in their assessments.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Automated Scores Notice */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs bg-amber-50 border border-amber-200">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div className="text-amber-800">
          <strong>Note:</strong> This analysis uses <strong>automated scores only</strong>. 
          The expertise weighting affects how scores are aggregated, not the 60/40 human rating combination. 
          See <strong>Overview</strong> tab for combined scores.
        </div>
      </div>

      {/* Research Findings */}
      <ResearchFindings title={`📊 Research Findings: Expertise Weighting Analysis`}>
        <div className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-900 mb-2">
              {analysisMode === 'cross-paper' ? 'Cross-Paper' : 'Within-Paper'} Weighting Analysis
            </h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Expertise Distribution:</strong> {expertiseStats?.totalEvaluators} evaluators 
                with expertise weights ranging from {expertiseStats?.min?.toFixed(1)} to {expertiseStats?.max?.toFixed(1)} 
                (mean: {expertiseStats?.mean?.toFixed(2)}, SD: {expertiseStats?.std?.toFixed(2)}).
              </li>
              <li>
                <strong>Overall Impact:</strong> Expertise weighting 
                {Math.abs(currentOverall.difference) < 0.001 
                  ? ' had minimal effect on aggregated scores'
                  : ` adjusted overall ${activeTab} by ${currentOverall.difference >= 0 ? '+' : ''}${(currentOverall.difference * 100).toFixed(2)} percentage points`
                }.
              </li>
              {analysisMode === 'cross-paper' && (
                <li>
                  <strong>Interpretation:</strong> {currentOverall.difference >= 0 
                    ? 'Papers evaluated by domain experts achieved higher automated scores on average.'
                    : 'Papers evaluated by domain experts received lower automated scores, suggesting more critical assessment.'
                  }
                </li>
              )}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
            <p className="text-sm text-gray-700 italic">
              "Expertise-weighted analysis across {Object.keys(aggregatedData?.papers || {}).length} papers 
              with {expertiseStats?.totalEvaluators} domain experts revealed 
              {Math.abs(currentOverall.difference) < 0.001 
                ? 'minimal impact of expertise weighting on aggregated scores'
                : `a ${currentOverall.difference >= 0 ? 'positive' : 'negative'} ${(Math.abs(currentOverall.difference) * 100).toFixed(2)} percentage point adjustment when weighting by evaluator expertise`
              }. 
              Expertise weights ranged from {expertiseStats?.min?.toFixed(1)} to {expertiseStats?.max?.toFixed(1)} 
              (M = {expertiseStats?.mean?.toFixed(2)}, SD = {expertiseStats?.std?.toFixed(2)}), 
              reflecting the diverse backgrounds of participating evaluators."
            </p>
          </div>
        </div>
      </ResearchFindings>
    </Card>
  );
};

export default ExpertiseWeightedImpactChart;