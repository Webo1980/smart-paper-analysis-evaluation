// src/components/dashboard/charts/SourceCoverageChart.jsx
// FIXED VERSION: Hybrid approach
// - Source Distribution: 15 unique papers (source type is paper-level)
// - Score Comparisons: 17 evaluations (all evaluation scores included)
// NOTE: Shows AUTOMATED scores only (no human ratings combined)

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Database, Zap, GitMerge, AlertCircle, ChevronDown, ChevronUp, 
  BookOpen, Download, Info, Target, Award
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
 * SourceCoverageChart
 * 
 * DATA SOURCES:
 * - integratedData.papers: Source detection (ORKG/LLM/Hybrid)
 * - aggregatedData.papers: Accuracy/Quality scores
 * - Links via: integratedData.token === aggregatedData.paperId
 * 
 * HYBRID APPROACH:
 * - Source Distribution (Donut): Counts unique papers (15) - source type is paper-level
 * - Score Comparisons: Uses all evaluations (17) - scores vary by evaluator
 * 
 * SCORES (same paths as OverviewMetrics):
 * - ACCURACY: comp.accuracyScores?.mean ?? comp.scores?.mean
 * - QUALITY: comp.qualityScores?.mean
 * 
 * NOTE: This chart shows AUTOMATED SCORES ONLY (no human ratings combined).
 */
const SourceCoverageChart = ({ aggregatedData, integratedData }) => {
  const [showScoreComparison, setShowScoreComparison] = useState(true);
  
  // Calculate source coverage with accuracy/quality scores
  const sourceStats = useMemo(() => {
    if (!integratedData?.papers || integratedData.papers.length === 0) {
      return null;
    }

    const papers = integratedData.papers;
    const totalEvaluations = papers.length;
    
    // Build lookup from aggregatedData by paperId/token
    const aggregatedLookup = {};
    if (aggregatedData?.papers) {
      Object.entries(aggregatedData.papers).forEach(([paperId, data]) => {
        aggregatedLookup[paperId] = data;
      });
    }
    
    // Count unique papers by DOI/token (for source distribution)
    const uniquePapersMap = new Map();
    papers.forEach(paper => {
      const key = paper.doi || paper.token;
      if (key && !uniquePapersMap.has(key)) {
        uniquePapersMap.set(key, paper);
      }
    });
    const uniquePapers = Array.from(uniquePapersMap.values());
    const totalUniquePapers = uniquePapers.length;

    // Initialize counters
    // - Distribution counts: unique papers only (source type is paper-level)
    // - Score arrays: all evaluations (scores vary by evaluator)
    const stats = {
      researchProblem: { 
        orkg: { count: 0, accScores: [], qualScores: [] }, 
        llm: { count: 0, accScores: [], qualScores: [] }, 
        hybrid: { count: 0, accScores: [], qualScores: [] }, 
        unknown: 0 
      },
      template: { 
        orkg: { count: 0, accScores: [], qualScores: [] }, 
        llm: { count: 0, accScores: [], qualScores: [] }, 
        hybrid: { count: 0, accScores: [], qualScores: [] }, 
        unknown: 0 
      },
      content: { 
        orkg: { count: 0, accScores: [], qualScores: [] }, 
        llm: { count: 0, accScores: [], qualScores: [] }, 
        hybrid: { count: 0, accScores: [], qualScores: [] }, 
        unknown: 0 
      }
    };

    // Track which DOIs we've counted for distribution (to avoid double-counting)
    const countedForDistribution = {
      researchProblem: new Set(),
      template: new Set(),
      content: new Set()
    };

    // Paper-level details for debugging
    const paperDetails = [];

    // Process ALL evaluations for scores, but unique papers for distribution
    papers.forEach(paper => {
      const systemOutput = paper.systemOutput || paper.systemData;
      const token = paper.token;
      const doi = paper.doi || token;
      
      // Get scores from aggregatedData
      const aggData = aggregatedLookup[token];
      
      // Get AUTOMATED scores only (no human ratings)
      const getScores = (componentKey) => {
        const compData = aggData?.[componentKey];
        if (!compData) return { acc: null, qual: null };
        
        // ACCURACY: Same path as OverviewMetrics (automated score only)
        const acc = compData.accuracyScores?.mean ?? compData.scores?.mean;
        // QUALITY: Same path as OverviewMetrics (automated score only)
        const qual = compData.qualityScores?.mean;
        
        return { 
          acc: acc !== undefined && !isNaN(acc) ? acc : null,
          qual: qual !== undefined && !isNaN(qual) && qual > 0 ? qual : null
        };
      };
      
      if (!systemOutput) {
        // Only count for distribution if not already counted
        if (!countedForDistribution.researchProblem.has(doi)) {
          stats.researchProblem.unknown++;
          countedForDistribution.researchProblem.add(doi);
        }
        if (!countedForDistribution.template.has(doi)) {
          stats.template.unknown++;
          countedForDistribution.template.add(doi);
        }
        if (!countedForDistribution.content.has(doi)) {
          stats.content.unknown++;
          countedForDistribution.content.add(doi);
        }
        return;
      }

      const detail = {
        doi: paper.doi,
        token,
        title: systemOutput.metadata?.title?.substring(0, 50)
      };

      // Helper to add scores (always) and count (only if not already counted)
      const addToStats = (component, sourceType, scores, doiKey) => {
        // Always add scores (all evaluations)
        if (scores.acc !== null) stats[component][sourceType].accScores.push(scores.acc);
        if (scores.qual !== null) stats[component][sourceType].qualScores.push(scores.qual);
        
        // Only count for distribution if this DOI hasn't been counted yet
        if (!countedForDistribution[component].has(doiKey)) {
          stats[component][sourceType].count++;
          countedForDistribution[component].add(doiKey);
        }
      };

      // ============================================
      // RESEARCH PROBLEM SOURCE DETECTION
      // ============================================
      const researchProblems = systemOutput.researchProblems;
      const hasLLMProblem = researchProblems?.llm_problem && 
        (researchProblems.llm_problem.title || researchProblems.llm_problem.description);
      const hasORKGProblems = researchProblems?.orkg_problems && 
        researchProblems.orkg_problems.length > 0;
      const selectedProblemIsLLM = researchProblems?.selectedProblem?.isLLMGenerated === true;
      
      const problemScores = getScores('research_problem');
      
      if (hasLLMProblem && hasORKGProblems) {
        if (selectedProblemIsLLM) {
          addToStats('researchProblem', 'llm', problemScores, doi);
          detail.problem = 'llm';
        } else {
          addToStats('researchProblem', 'hybrid', problemScores, doi);
          detail.problem = 'hybrid';
        }
      } else if (hasLLMProblem || selectedProblemIsLLM) {
        addToStats('researchProblem', 'llm', problemScores, doi);
        detail.problem = 'llm';
      } else if (hasORKGProblems) {
        addToStats('researchProblem', 'orkg', problemScores, doi);
        detail.problem = 'orkg';
      } else {
        if (!countedForDistribution.researchProblem.has(doi)) {
          stats.researchProblem.unknown++;
          countedForDistribution.researchProblem.add(doi);
        }
        detail.problem = 'unknown';
      }

      // ============================================
      // TEMPLATE SOURCE DETECTION
      // ============================================
      const templates = systemOutput.templates;
      const hasTemplateData = templates && 
        (templates.selectedTemplate || templates.llm_template || templates.available?.template);
      
      const templateScores = getScores('template');
      
      if (hasTemplateData) {
        if (detail.problem === 'llm') {
          addToStats('template', 'llm', templateScores, doi);
          detail.template = 'llm';
        } else if (detail.problem === 'orkg') {
          addToStats('template', 'orkg', templateScores, doi);
          detail.template = 'orkg';
        } else if (detail.problem === 'hybrid') {
          const selectedTemplateIsLLM = templates.selectedTemplate?.isLLMGenerated === true;
          if (selectedTemplateIsLLM) {
            addToStats('template', 'llm', templateScores, doi);
            detail.template = 'llm';
          } else {
            addToStats('template', 'hybrid', templateScores, doi);
            detail.template = 'hybrid';
          }
        } else {
          if (!countedForDistribution.template.has(doi)) {
            stats.template.unknown++;
            countedForDistribution.template.add(doi);
          }
          detail.template = 'unknown';
        }
      } else {
        if (!countedForDistribution.template.has(doi)) {
          stats.template.unknown++;
          countedForDistribution.template.add(doi);
        }
        detail.template = 'unknown';
      }

      // ============================================
      // CONTENT PROPERTIES SOURCE DETECTION
      // Content is ALWAYS LLM-extracted
      // ============================================
      const paperContent = systemOutput.paperContent?.paperContent || 
                          systemOutput.content?.properties ||
                          systemOutput.paperContent;
      
      const contentScores = getScores('content');
      
      if (paperContent && typeof paperContent === 'object' && Object.keys(paperContent).length > 0) {
        addToStats('content', 'llm', contentScores, doi);
        detail.content = 'llm';
      } else {
        if (!countedForDistribution.content.has(doi)) {
          stats.content.unknown++;
          countedForDistribution.content.add(doi);
        }
        detail.content = 'unknown';
      }

      paperDetails.push(detail);
    });

    // Calculate percentages and averages
    const calcStats = (sourceData) => {
      const total = sourceData.orkg.count + sourceData.llm.count + sourceData.hybrid.count;
      const calcAvg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      
      return {
        orkg: {
          count: sourceData.orkg.count,
          pct: total > 0 ? (sourceData.orkg.count / total * 100) : 0,
          avgAcc: calcAvg(sourceData.orkg.accScores),
          avgQual: calcAvg(sourceData.orkg.qualScores),
          n: sourceData.orkg.accScores.length  // Number of evaluations (not unique papers)
        },
        llm: {
          count: sourceData.llm.count,
          pct: total > 0 ? (sourceData.llm.count / total * 100) : 0,
          avgAcc: calcAvg(sourceData.llm.accScores),
          avgQual: calcAvg(sourceData.llm.qualScores),
          n: sourceData.llm.accScores.length
        },
        hybrid: {
          count: sourceData.hybrid.count,
          pct: total > 0 ? (sourceData.hybrid.count / total * 100) : 0,
          avgAcc: calcAvg(sourceData.hybrid.accScores),
          avgQual: calcAvg(sourceData.hybrid.qualScores),
          n: sourceData.hybrid.accScores.length
        },
        unknown: sourceData.unknown,
        total
      };
    };

    return {
      totalUniquePapers,
      totalEvaluations,
      researchProblem: calcStats(stats.researchProblem),
      template: calcStats(stats.template),
      content: calcStats(stats.content),
      paperDetails
    };
  }, [integratedData, aggregatedData]);

  if (!sourceStats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No integrated data available for source coverage analysis.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate overall stats (based on unique papers for distribution)
  const totalORKG = sourceStats.researchProblem.orkg.count + sourceStats.template.orkg.count + sourceStats.content.orkg.count;
  const totalLLM = sourceStats.researchProblem.llm.count + sourceStats.template.llm.count + sourceStats.content.llm.count;
  const totalHybrid = sourceStats.researchProblem.hybrid.count + sourceStats.template.hybrid.count + sourceStats.content.hybrid.count;
  const grandTotal = totalORKG + totalLLM + totalHybrid;
  
  const overallORKGPct = grandTotal > 0 ? (totalORKG / grandTotal * 100) : 0;
  const overallLLMPct = grandTotal > 0 ? (totalLLM / grandTotal * 100) : 0;
  const overallHybridPct = grandTotal > 0 ? (totalHybrid / grandTotal * 100) : 0;

  // Calculate overall accuracy/quality by source (using ALL evaluations)
  const calcOverallBySource = (sourceType) => {
    const accScores = [];
    const qualScores = [];
    
    ['researchProblem', 'template', 'content'].forEach(comp => {
      const data = sourceStats[comp][sourceType];
      if (data.avgAcc !== null) accScores.push(data.avgAcc);
      if (data.avgQual !== null) qualScores.push(data.avgQual);
    });
    
    return {
      avgAcc: accScores.length > 0 ? accScores.reduce((a, b) => a + b, 0) / accScores.length : null,
      avgQual: qualScores.length > 0 ? qualScores.reduce((a, b) => a + b, 0) / qualScores.length : null
    };
  };

  const orkgOverall = calcOverallBySource('orkg');
  const llmOverall = calcOverallBySource('llm');
  const hybridOverall = calcOverallBySource('hybrid');

  // Donut chart component
  const DonutChart = ({ orkgPct, llmPct, hybridPct, size = 120 }) => {
    const radius = size / 2 - 10;
    const circumference = 2 * Math.PI * radius;
    
    const orkgDash = (orkgPct / 100) * circumference;
    const llmDash = (llmPct / 100) * circumference;
    const hybridDash = (hybridPct / 100) * circumference;
    
    const orkgOffset = 0;
    const llmOffset = -orkgDash;
    const hybridOffset = -(orkgDash + llmDash);
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="20" />
        {orkgPct > 0 && (
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#9333ea" strokeWidth="20"
            strokeDasharray={`${orkgDash} ${circumference}`} strokeDashoffset={orkgOffset}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        )}
        {llmPct > 0 && (
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#3b82f6" strokeWidth="20"
            strokeDasharray={`${llmDash} ${circumference}`} strokeDashoffset={llmOffset}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        )}
        {hybridPct > 0 && (
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#14b8a6" strokeWidth="20"
            strokeDasharray={`${hybridDash} ${circumference}`} strokeDashoffset={hybridOffset}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        )}
        <text x={size/2} y={size/2 - 5} textAnchor="middle" className="text-lg font-bold fill-gray-800">
          {sourceStats.totalUniquePapers}
        </text>
        <text x={size/2} y={size/2 + 12} textAnchor="middle" className="text-xs fill-gray-500">
          Papers
        </text>
      </svg>
    );
  };

  const handleExport = () => {
    const exportData = {
      note: 'AUTOMATED SCORES ONLY - Human ratings not included in score comparisons',
      summary: { 
        totalUniquePapers: sourceStats.totalUniquePapers,
        totalEvaluations: sourceStats.totalEvaluations,
        overallORKGPct, 
        overallLLMPct, 
        overallHybridPct 
      },
      byComponent: {
        researchProblem: sourceStats.researchProblem,
        template: sourceStats.template,
        content: sourceStats.content
      },
      scoresBySource: { orkg: orkgOverall, llm: llmOverall, hybrid: hybridOverall },
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source_coverage_automated_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Database className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Source Coverage Analysis</h3>
            <p className="text-sm text-gray-600">
              {sourceStats.totalEvaluations} Evaluations across {sourceStats.totalUniquePapers} unique papers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowScoreComparison(!showScoreComparison)}
            variant={showScoreComparison ? "default" : "outline"}
            size="sm"
            className="text-xs"
          >
            {showScoreComparison ? 'Hide' : 'Show'} Score Comparison
          </Button>
          <button onClick={handleExport} className="p-2 hover:bg-gray-100 rounded-lg">
            <Download className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* AUTOMATED SCORES NOTICE */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs bg-amber-50 border border-amber-200">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div className="text-amber-800">
          <strong>Note:</strong> Source distribution shows <strong>{sourceStats.totalUniquePapers} unique papers</strong>. 
          Score comparisons use <strong>all {sourceStats.totalEvaluations} evaluations</strong> (automated scores only).
        </div>
      </div>

      {/* Main Donut Chart */}
      <div className="flex justify-center mb-6">
        <DonutChart orkgPct={overallORKGPct} llmPct={overallLLMPct} hybridPct={overallHybridPct} size={140} />
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Database className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-purple-700">{totalORKG}</p>
          <p className="text-xs text-purple-600">ORKG ({overallORKGPct.toFixed(0)}%)</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Zap className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-700">{totalLLM}</p>
          <p className="text-xs text-blue-600">LLM ({overallLLMPct.toFixed(0)}%)</p>
        </div>
        <div className="text-center p-3 bg-teal-50 rounded-lg">
          <GitMerge className="h-5 w-5 text-teal-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-teal-700">{totalHybrid}</p>
          <p className="text-xs text-teal-600">Hybrid ({overallHybridPct.toFixed(0)}%)</p>
        </div>
      </div>

      {/* Accuracy vs Quality by Source Type */}
      {showScoreComparison && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <Award className="h-4 w-4 text-purple-600" />
            Accuracy vs Quality by Source Type (Automated Scores)
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Based on {sourceStats.totalEvaluations} evaluations
          </p>
          <div className="grid grid-cols-3 gap-3">
            {/* ORKG Source */}
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">ORKG</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">Accuracy:</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {orkgOverall.avgAcc !== null ? `${(orkgOverall.avgAcc * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-600">Quality:</span>
                  <span className="font-mono font-semibold text-purple-700">
                    {orkgOverall.avgQual !== null ? `${(orkgOverall.avgQual * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                {orkgOverall.avgAcc !== null && orkgOverall.avgQual !== null && (
                  <div className="flex justify-between text-xs pt-1 border-t">
                    <span className="text-gray-500">Diff:</span>
                    <span className={`font-mono font-semibold ${orkgOverall.avgQual - orkgOverall.avgAcc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {orkgOverall.avgQual - orkgOverall.avgAcc >= 0 ? '+' : ''}{((orkgOverall.avgQual - orkgOverall.avgAcc) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* LLM Source */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">LLM</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">Accuracy:</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {llmOverall.avgAcc !== null ? `${(llmOverall.avgAcc * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-600">Quality:</span>
                  <span className="font-mono font-semibold text-purple-700">
                    {llmOverall.avgQual !== null ? `${(llmOverall.avgQual * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                {llmOverall.avgAcc !== null && llmOverall.avgQual !== null && (
                  <div className="flex justify-between text-xs pt-1 border-t">
                    <span className="text-gray-500">Diff:</span>
                    <span className={`font-mono font-semibold ${llmOverall.avgQual - llmOverall.avgAcc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {llmOverall.avgQual - llmOverall.avgAcc >= 0 ? '+' : ''}{((llmOverall.avgQual - llmOverall.avgAcc) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hybrid Source */}
            <div className="bg-white rounded-lg p-3 border border-teal-200">
              <div className="flex items-center gap-2 mb-2">
                <GitMerge className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">Hybrid</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">Accuracy:</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {hybridOverall.avgAcc !== null ? `${(hybridOverall.avgAcc * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-600">Quality:</span>
                  <span className="font-mono font-semibold text-purple-700">
                    {hybridOverall.avgQual !== null ? `${(hybridOverall.avgQual * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                {hybridOverall.avgAcc !== null && hybridOverall.avgQual !== null && (
                  <div className="flex justify-between text-xs pt-1 border-t">
                    <span className="text-gray-500">Diff:</span>
                    <span className={`font-mono font-semibold ${hybridOverall.avgQual - hybridOverall.avgAcc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {hybridOverall.avgQual - hybridOverall.avgAcc >= 0 ? '+' : ''}{((hybridOverall.avgQual - hybridOverall.avgAcc) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* By Component Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">By Component (Unique Papers)</h4>
        
        {/* Research Problem */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Research Problem</span>
            <div className="flex items-center gap-2">
              {showScoreComparison && sourceStats.researchProblem.llm.avgAcc !== null && (
                <Badge variant="outline" className="text-xs" title="Automated accuracy (all evaluations)">
                  Acc: {(sourceStats.researchProblem.llm.avgAcc * 100).toFixed(0)}% (n={sourceStats.researchProblem.llm.n})
                </Badge>
              )}
              <span className="text-xs text-gray-500">{sourceStats.researchProblem.total} papers</span>
            </div>
          </div>
          <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-gray-200">
            {sourceStats.researchProblem.orkg.pct > 0 && (
              <div className="bg-purple-500 transition-all" style={{ width: `${sourceStats.researchProblem.orkg.pct}%` }} />
            )}
            {sourceStats.researchProblem.llm.pct > 0 && (
              <div className="bg-blue-500 transition-all" style={{ width: `${sourceStats.researchProblem.llm.pct}%` }} />
            )}
            {sourceStats.researchProblem.hybrid.pct > 0 && (
              <div className="bg-teal-500 transition-all" style={{ width: `${sourceStats.researchProblem.hybrid.pct}%` }} />
            )}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span className="text-purple-600">{sourceStats.researchProblem.orkg.count}O</span>
            <span className="text-blue-600">{sourceStats.researchProblem.llm.count}L</span>
            <span className="text-teal-600">{sourceStats.researchProblem.hybrid.count}H</span>
          </div>
        </div>

        {/* Template */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Template</span>
            <div className="flex items-center gap-2">
              {showScoreComparison && sourceStats.template.llm.avgAcc !== null && (
                <Badge variant="outline" className="text-xs" title="Automated accuracy (all evaluations)">
                  Acc: {(sourceStats.template.llm.avgAcc * 100).toFixed(0)}% (n={sourceStats.template.llm.n})
                </Badge>
              )}
              <span className="text-xs text-gray-500">{sourceStats.template.total} papers</span>
            </div>
          </div>
          <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-gray-200">
            {sourceStats.template.orkg.pct > 0 && (
              <div className="bg-purple-500 transition-all" style={{ width: `${sourceStats.template.orkg.pct}%` }} />
            )}
            {sourceStats.template.llm.pct > 0 && (
              <div className="bg-blue-500 transition-all" style={{ width: `${sourceStats.template.llm.pct}%` }} />
            )}
            {sourceStats.template.hybrid.pct > 0 && (
              <div className="bg-teal-500 transition-all" style={{ width: `${sourceStats.template.hybrid.pct}%` }} />
            )}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span className="text-purple-600">{sourceStats.template.orkg.count}O</span>
            <span className="text-blue-600">{sourceStats.template.llm.count}L</span>
            <span className="text-teal-600">{sourceStats.template.hybrid.count}H</span>
          </div>
        </div>

        {/* Content Properties */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Content Properties</span>
            <div className="flex items-center gap-2">
              {showScoreComparison && sourceStats.content.llm.avgAcc !== null && (
                <Badge variant="outline" className="text-xs" title="Automated accuracy (all evaluations)">
                  Acc: {(sourceStats.content.llm.avgAcc * 100).toFixed(0)}% (n={sourceStats.content.llm.n})
                </Badge>
              )}
              <span className="text-xs text-gray-500">{sourceStats.content.total} papers</span>
            </div>
          </div>
          <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-gray-200">
            {sourceStats.content.orkg.pct > 0 && (
              <div className="bg-purple-500 transition-all" style={{ width: `${sourceStats.content.orkg.pct}%` }} />
            )}
            {sourceStats.content.llm.pct > 0 && (
              <div className="bg-blue-500 transition-all" style={{ width: `${sourceStats.content.llm.pct}%` }} />
            )}
            {sourceStats.content.hybrid.pct > 0 && (
              <div className="bg-teal-500 transition-all" style={{ width: `${sourceStats.content.hybrid.pct}%` }} />
            )}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span className="text-purple-600">{sourceStats.content.orkg.count}O</span>
            <span className="text-blue-600">{sourceStats.content.llm.count}L</span>
            <span className="text-teal-600">{sourceStats.content.hybrid.count}H</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-full" /><span>ORKG</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>LLM</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-teal-500 rounded-full" /><span>Hybrid</span></div>
      </div>

      {/* Detailed Comparison Table */}
      {showScoreComparison && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            📊 Detailed Score Comparison by Source & Component (All {sourceStats.totalEvaluations} Evaluations)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Component</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Source</th>
                  <th className="text-center py-2 px-2 font-medium text-blue-600">Accuracy</th>
                  <th className="text-center py-2 px-2 font-medium text-purple-600">Quality</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">Diff</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">n (evals)</th>
                </tr>
              </thead>
              <tbody>
                {['researchProblem', 'template', 'content'].map(comp => {
                  const compData = sourceStats[comp];
                  const compLabel = comp === 'researchProblem' ? 'Research Problem' : comp === 'template' ? 'Template' : 'Content';
                  
                  return ['orkg', 'llm', 'hybrid'].map((source, idx) => {
                    const data = compData[source];
                    if (data.count === 0) return null;
                    
                    const diff = data.avgQual !== null && data.avgAcc !== null ? data.avgQual - data.avgAcc : null;
                    
                    return (
                      <tr key={`${comp}-${source}`} className={`border-b border-gray-100 ${idx === 0 ? 'bg-gray-50' : ''}`}>
                        <td className="py-2 px-2 font-medium text-gray-700">{idx === 0 ? compLabel : ''}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className={`text-xs ${
                            source === 'orkg' ? 'text-purple-600 border-purple-300' :
                            source === 'llm' ? 'text-blue-600 border-blue-300' :
                            'text-teal-600 border-teal-300'
                          }`}>
                            {source.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="text-center py-2 px-2 font-mono text-blue-600">
                          {data.avgAcc !== null ? `${(data.avgAcc * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="text-center py-2 px-2 font-mono text-purple-600">
                          {data.avgQual !== null ? `${(data.avgQual * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className={`text-center py-2 px-2 font-mono ${
                          diff === null ? 'text-gray-400' : diff >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {diff !== null ? `${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="text-center py-2 px-2 text-gray-500">{data.n}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            All scores are automated system calculations. n = number of evaluations (not unique papers).
          </p>
        </div>
      )}

      {/* Info Alert */}
      <Alert className="mt-4 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <strong>Source Detection Logic:</strong>
          <ul className="mt-1 space-y-1 text-xs">
            <li>• <strong>ORKG:</strong> Data retrieved from Open Research Knowledge Graph</li>
            <li>• <strong>LLM:</strong> Generated by language model (isLLMGenerated=true)</li>
            <li>• <strong>Hybrid:</strong> Both sources available, system selected optimal</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Research Findings */}
      <ResearchFindings title="📊 Research Findings: Source Quality Analysis">
        <div className="space-y-4">
          {/* Automated Scores Notice for Research */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <strong>Important:</strong> All score comparisons in this section use <strong>automated system scores only</strong> 
                from <strong>{sourceStats.totalEvaluations} evaluations</strong> across {sourceStats.totalUniquePapers} unique papers.
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Source Distribution Analysis</h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Overall Distribution:</strong> {overallLLMPct.toFixed(1)}% LLM-generated, 
                {overallORKGPct.toFixed(1)}% ORKG-sourced, {overallHybridPct.toFixed(1)}% hybrid
                (across {sourceStats.totalUniquePapers} unique papers).
              </li>
              {llmOverall.avgAcc !== null && orkgOverall.avgAcc !== null && (
                <li>
                  <strong>Automated Accuracy Comparison:</strong> LLM-sourced extractions achieved 
                  {(llmOverall.avgAcc * 100).toFixed(1)}% accuracy vs ORKG-sourced at 
                  {(orkgOverall.avgAcc * 100).toFixed(1)}%.
                  {llmOverall.avgAcc > orkgOverall.avgAcc 
                    ? ' LLM generation shows higher automated accuracy, possibly due to better semantic understanding.'
                    : ' ORKG-sourced data shows higher automated accuracy, validating the value of curated knowledge.'}
                </li>
              )}
              {llmOverall.avgQual !== null && orkgOverall.avgQual !== null && (
                <li>
                  <strong>Automated Quality Comparison:</strong> LLM-sourced extractions achieved 
                  {(llmOverall.avgQual * 100).toFixed(1)}% quality vs ORKG-sourced at 
                  {(orkgOverall.avgQual * 100).toFixed(1)}%.
                </li>
              )}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
            <p className="text-sm text-gray-700 italic">
              "Source utilization analysis across {sourceStats.totalEvaluations} evaluations ({sourceStats.totalUniquePapers} unique papers) revealed 
              {overallLLMPct.toFixed(1)}% LLM-generated and {overallORKGPct.toFixed(1)}% ORKG-sourced extractions.
              {llmOverall.avgAcc !== null && orkgOverall.avgAcc !== null 
                ? ` Automated accuracy scores showed LLM-sourced extractions at ${(llmOverall.avgAcc * 100).toFixed(1)}% compared to ${(orkgOverall.avgAcc * 100).toFixed(1)}% for ORKG-sourced data.`
                : ''}
              {llmOverall.avgQual !== null && orkgOverall.avgQual !== null 
                ? ` Automated quality scores were ${(llmOverall.avgQual * 100).toFixed(1)}% (LLM) vs ${(orkgOverall.avgQual * 100).toFixed(1)}% (ORKG).`
                : ''}
              These findings demonstrate the hybrid approach effectively leverages both curated knowledge graph data 
              and LLM capabilities for comprehensive extraction."
            </p>
          </div>
        </div>
      </ResearchFindings>
    </Card>
  );
};

export default SourceCoverageChart;