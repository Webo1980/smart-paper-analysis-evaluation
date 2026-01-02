// CrossPaperAnalysis V7 - FINAL VERSION
// 
// Features:
// 1. Shows FINAL scores (60% Automated + 40% User Rating) - matches Overview
// 2. Evaluator Analysis: Shows Mean Score
// 3. IRR (Fleiss Kappa): Uses userAgreementService.calculateFleissKappa
// 4. Multi-eval papers: Click evaluator to see their individual scores & ratings
// 5. Component Scores: Shows individual evaluator's Final scores + user ratings (★)
// 6. Detailed Field Ratings: Shows all field-level ratings per evaluator
// 7. "Show Aggregated" button to return to combined view
//
// Score Formula: Final = (Auto × 60%) + (UserRating × 40%)
//
// Data paths:
// - paper.evaluations[idx] = full paper object
// - paper.evaluations[idx].userEvaluations[0] = evaluation data
// - paper.evaluations[idx].userEvaluations[0].evaluationMetrics = metrics
//
// - Key Insights with user ratings note
// - Quality vs Accuracy distributions
// - Shows BOTH Accuracy AND Quality score modes
// - LLM Template shows name with badge
// - Uses WINDOW data priority over props

import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  ChevronDown, ChevronUp, ArrowUpDown, Users,
  BarChart3, Search, FileText, Target, X, Eye, Award, GitCompare,
  ClipboardList, PieChart, Shield, ExternalLink,
  Sparkles, BookOpen, Star, Cpu, User
} from 'lucide-react';
import userAgreementService from '../../../services/userAgreementService';

// ============================================
// CONSTANTS
// ============================================

const COMPONENT_KEYS = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
const COMPONENT_LABELS = {
  metadata: 'Metadata',
  research_field: 'Research Field',
  research_problem: 'Research Problem',
  template: 'Template',
  content: 'Content'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getScoreColor = (score) => {
  if (score === null || score === undefined || isNaN(score)) return 'text-gray-400';
  if (score >= 0.85) return 'text-emerald-600';
  if (score >= 0.70) return 'text-green-600';
  if (score >= 0.50) return 'text-blue-600';
  if (score >= 0.30) return 'text-amber-600';
  return 'text-red-600';
};

const getKappaColor = (kappa) => {
  if (kappa === null || kappa === undefined || isNaN(kappa)) return 'text-gray-600 bg-gray-50 border-gray-200';
  if (kappa < 0) return 'text-red-600 bg-red-50 border-red-200';
  if (kappa < 0.20) return 'text-orange-600 bg-orange-50 border-orange-200';
  if (kappa < 0.40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (kappa < 0.60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (kappa < 0.80) return 'text-green-600 bg-green-50 border-green-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
};

const getInterpretationLabel = (interpretation) => {
  if (!interpretation) return 'N/A';
  // Capitalize first letter
  return interpretation.charAt(0).toUpperCase() + interpretation.slice(1);
};

const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
};

const formatScore = (value, decimals = 3) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
};

const calculateMean = (values) => {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const calculateStd = (values) => {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length < 2) return null;
  const mean = calculateMean(valid);
  const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valid.length;
  return Math.sqrt(variance);
};

const getNestedValue = (obj, ...paths) => {
  for (const path of paths) {
    let value = obj;
    const keys = path.split('.');
    for (const key of keys) {
      if (value === null || value === undefined) break;
      value = value[key];
    }
    if (value !== null && value !== undefined) return value;
  }
  return null;
};

// ============================================
// SUB-COMPONENTS
// ============================================

const UserRatingNote = ({ className = '' }) => (
  <div className={`flex items-center gap-2 p-2 rounded-lg text-xs bg-amber-50 border border-amber-200 ${className}`}>
    <Star className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
    <span className="text-amber-800">
      <strong>Combined scores</strong> = 60% automated + 40% user ratings + agreement bonus
    </span>
  </div>
);

const CollapsibleSection = ({ title, icon, expanded, onToggle, badge, children }) => (
  <Card className="overflow-hidden">
    <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {badge}
      </div>
      {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
    </button>
    {expanded && <div className="p-4 border-t">{children}</div>}
  </Card>
);

const StatCard = ({ icon, label, value, subtitle, color = 'gray' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };
  
  return (
    <Card className={`p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="opacity-80">{icon}</div>
        <div>
          <p className="text-xs opacity-80">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
};

const ResearchFindingsCollapsible = ({ title, children, defaultOpen = false }) => {
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

// ============================================
// MAIN COMPONENT
// ============================================

const CrossPaperAnalysis = ({ aggregatedData: propAggregatedData, integratedData: propIntegratedData }) => {
  console.log('%c[V7] CrossPaperAnalysis MOUNTED - VERSION 7 FINAL', 'background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
  
  const [scoreMode, setScoreMode] = useState('accuracy');
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [selectedEvaluatorIdx, setSelectedEvaluatorIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedSections, setExpandedSections] = useState({
    findings: true, irr: true, qva: true, distribution: true, evaluators: false
  });
  const [showMultiEvalOnly, setShowMultiEvalOnly] = useState(false);

  // ============================================
  // DATA PROCESSING - WINDOW DATA PRIORITY
  // ============================================
  
  const processedData = useMemo(() => {
    console.log('%c[V7] Processing data (WINDOW PRIORITY)...', 'color: #8b5cf6; font-weight: bold;');
    
    // ALWAYS use window data first
    const aggregatedData = window.aggregatedData || propAggregatedData || {};
    const integratedPapers = window.integratedPapers || propIntegratedData?.papers || [];
    
    console.log('[V7] Data:', { integratedPapers: integratedPapers.length, aggPapers: Object.keys(aggregatedData.papers || {}).length });

    // ========== STEP 1: GROUP BY DOI ==========
    const papersByDoi = {};
    
    integratedPapers.forEach((evalItem) => {
      const doi = evalItem.doi;
      const token = evalItem.token;
      const key = doi || token;
      
      if (!papersByDoi[key]) {
        const title = getNestedValue(evalItem, 
          'systemOutput.metadata.title',
          'groundTruth.title',
          'summary.title'
        ) || `Paper ${token?.substring(0, 20)}...`;
        
        // Get LLM template info
        const llmTemplate = getNestedValue(evalItem, 'systemOutput.templates.llm_template.template');
        
        papersByDoi[key] = {
          doi,
          title,
          groundTruth: evalItem.groundTruth,
          systemOutput: evalItem.systemOutput,
          llmTemplate,
          evaluations: [],
          tokens: []
        };
      }
      
      papersByDoi[key].evaluations.push(evalItem);
      papersByDoi[key].tokens.push(token);
    });

    // ========== STEP 2: BUILD PAPER OBJECTS ==========
    const papers = [];
    
    Object.entries(papersByDoi).forEach(([key, paperData]) => {
      const { doi, title, groundTruth, systemOutput, llmTemplate, evaluations, tokens } = paperData;
      
      const scores = {
        overall: { accuracy: { mean: null, std: null }, quality: { mean: null, std: null } },
        byComponent: {}
      };
      
      const componentScores = {};
      COMPONENT_KEYS.forEach(k => {
        componentScores[k] = { accuracy: [], quality: [] };
      });
      
      // Collect scores from each token
      tokens.forEach(token => {
        const aggPaper = aggregatedData?.papers?.[token];
        if (aggPaper) {
          COMPONENT_KEYS.forEach(compKey => {
            const comp = aggPaper[compKey];
            if (comp) {
              // Get automated scores
              const autoAcc = comp.accuracyScores?.mean ?? 0;
              const autoQual = comp.qualityScores?.mean ?? 0;
              
              // Get user ratings (already normalized to 0-1 scale)
              const userRating = comp.userRatings?.mean ?? 0;
              
              // Calculate FINAL scores: 60% automated + 40% user rating
              const finalAcc = (autoAcc * 0.6) + (userRating * 0.4);
              const finalQual = (autoQual * 0.6) + (userRating * 0.4);
              
              if (finalAcc != null) {
                componentScores[compKey].accuracy.push(finalAcc);
              }
              if (finalQual != null) {
                componentScores[compKey].quality.push(finalQual);
              }
            }
          });
        }
      });
      
      // Aggregate scores
      const accOverall = [];
      const qualOverall = [];
      
      COMPONENT_KEYS.forEach(compKey => {
        const accScores = componentScores[compKey].accuracy;
        const qualScores = componentScores[compKey].quality;
        
        const accMean = calculateMean(accScores);
        const qualMean = calculateMean(qualScores);
        
        scores.byComponent[compKey] = {
          accuracy: { mean: accMean, std: calculateStd(accScores), count: accScores.length },
          quality: { mean: qualMean, std: calculateStd(qualScores), count: qualScores.length }
        };
        
        if (accMean != null) accOverall.push(accMean);
        if (qualMean != null) qualOverall.push(qualMean);
      });
      
      scores.overall.accuracy = { mean: calculateMean(accOverall), std: calculateStd(accOverall) };
      scores.overall.quality = { mean: calculateMean(qualOverall), std: calculateStd(qualOverall) };
      
      // Build evaluators list
      const evaluatorsList = evaluations.map(ev => {
        const userInfo = ev.evaluation?.userInfo || ev.userEvaluations?.[0]?.userInfo || {};
        return {
          id: userInfo.email || `${userInfo.firstName}_${userInfo.lastName}`,
          name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Unknown',
          profile: userInfo,
          token: ev.token
        };
      });
      
      const hasGroundTruth = groundTruth && Object.keys(groundTruth).length > 0;
      
      // Build ground truth match with LLM template fallback
      let groundTruthMatch = null;
      if (hasGroundTruth) {
        const selectedTemplate = getNestedValue(systemOutput, 'templates.selectedTemplate.label', 'templates.selectedTemplate.title');
        const llmTemplateName = llmTemplate?.name;
        
        groundTruthMatch = {
          researchField: {
            groundTruth: groundTruth.research_field_name,
            extracted: getNestedValue(systemOutput, 'researchFields.selectedField.name'),
            isLLM: false
          },
          researchProblem: {
            groundTruth: groundTruth.research_problem_name,
            extracted: getNestedValue(systemOutput, 'researchProblems.selectedProblem.label', 'researchProblems.selectedProblem.title'),
            isLLM: false
          },
          template: {
            groundTruth: groundTruth.template_name,
            extracted: selectedTemplate || llmTemplateName,
            isLLM: !selectedTemplate && !!llmTemplateName
          }
        };
      }
      
      papers.push({
        id: doi || key,
        doi,
        title,
        tokens,
        evaluations, // Include for IRR calculation
        evaluationCount: evaluations.length,
        isMultiEvaluator: evaluations.length > 1,
        hasGroundTruth,
        scores,
        evaluators: evaluatorsList,
        groundTruth,
        systemOutput,
        llmTemplate,
        groundTruthMatch,
        links: {
          doi: doi ? `https://doi.org/${doi}` : null,
          orkg: groundTruth?.paper_id ? `https://orkg.org/paper/${groundTruth.paper_id}` : null
        }
      });
    });

    // ========== STEP 3: CALCULATE STATS ==========
    const totalEvaluations = integratedPapers.length;
    const totalPapers = papers.length;
    const multiEvaluatorPapers = papers.filter(p => p.isMultiEvaluator).length;
    const papersWithGroundTruth = papers.filter(p => p.hasGroundTruth).length;
    
    console.log('[V7] Stats:', { totalEvaluations, totalPapers, multiEvaluatorPapers });
    
    // Get evaluators with stats
    const evaluators = Object.entries(aggregatedData?.evaluators || {}).map(([id, data]) => {
      const perf = data.performance || {};
      return {
        id,
        name: `${data.profile?.firstName || ''} ${data.profile?.lastName || ''}`.trim() || id,
        profile: data.profile || {},
        evaluationCount: data.evaluationCount || 0,
        stats: {
          mean: perf.meanScore ?? null,
          min: perf.minScore ?? null,
          max: perf.maxScore ?? null
        }
      };
    }).sort((a, b) => (b.stats.mean || 0) - (a.stats.mean || 0));

    // Calculate overall scores
    const allAccScores = papers.map(p => p.scores.overall.accuracy?.mean).filter(v => v != null);
    const allQualScores = papers.map(p => p.scores.overall.quality?.mean).filter(v => v != null);
    
    const overallStats = {
      totalEvaluations,
      totalPapers,
      uniqueEvaluators: evaluators.length,
      multiEvaluatorPapers,
      papersWithGroundTruth,
      groundTruthCoverage: totalPapers > 0 ? papersWithGroundTruth / totalPapers : 0,
      scores: {
        accuracy: { 
          mean: calculateMean(allAccScores), 
          std: calculateStd(allAccScores),
          min: allAccScores.length > 0 ? Math.min(...allAccScores) : null,
          max: allAccScores.length > 0 ? Math.max(...allAccScores) : null
        },
        quality: { 
          mean: calculateMean(allQualScores), 
          std: calculateStd(allQualScores),
          min: allQualScores.length > 0 ? Math.min(...allQualScores) : null,
          max: allQualScores.length > 0 ? Math.max(...allQualScores) : null
        }
      }
    };

    // ========== STEP 4: COMPONENT ANALYSIS ==========
    const qualityVsAccuracy = { overall: overallStats.scores, byComponent: {} };
    
    COMPONENT_KEYS.forEach(compKey => {
      const accScores = papers.map(p => p.scores.byComponent[compKey]?.accuracy?.mean).filter(v => v != null);
      const qualScores = papers.map(p => p.scores.byComponent[compKey]?.quality?.mean).filter(v => v != null);
      
      const accMean = calculateMean(accScores);
      const qualMean = calculateMean(qualScores);
      
      qualityVsAccuracy.byComponent[compKey] = {
        accuracy: { mean: accMean, std: calculateStd(accScores) },
        quality: { mean: qualMean, std: calculateStd(qualScores) },
        meanDifference: (accMean != null && qualMean != null) ? qualMean - accMean : null
      };
    });

    // ========== STEP 5: INTER-RATER RELIABILITY ==========
    // Transform data to format expected by userAgreementService.calculateAgreementMetrics
    // The service expects: { papers: [{ token, doi, userEvaluations: [{ userInfo, evaluationMetrics }] }] }
    const formattedForService = {
      papers: papers.map(paper => ({
        token: paper.id,
        doi: paper.doi,
        groundTruth: paper.groundTruth,
        systemData: paper.systemOutput,
        userEvaluations: (paper.evaluations || []).map(evalItem => {
          // Extract the actual evaluation data
          const userEval = evalItem.userEvaluations?.[0] || evalItem.evaluation || evalItem;
          return {
            userInfo: userEval?.userInfo || evalItem?.userInfo,
            evaluationMetrics: userEval?.evaluationMetrics || evalItem?.evaluationMetrics,
            timestamp: userEval?.timestamp || evalItem?.timestamp
          };
        }).filter(e => e.evaluationMetrics) // Only include evaluations with metrics
      }))
    };
    
    // Use the full service calculation
    const agreementMetrics = userAgreementService.calculateAgreementMetrics(formattedForService, {});
    
    const interRaterReliability = {
      hasData: multiEvaluatorPapers > 0,
      fleissKappa: agreementMetrics.fleissKappa?.kappa ?? null,
      interpretation: agreementMetrics.fleissKappa?.interpretation ?? 'N/A',
      observedAgreement: agreementMetrics.fleissKappa?.P_bar ?? null,
      expectedAgreement: agreementMetrics.fleissKappa?.P_e ?? null,
      multiEvalCount: multiEvaluatorPapers,
      totalPapers,
      coverage: totalPapers > 0 ? multiEvaluatorPapers / totalPapers : 0,
      evaluatorCount: agreementMetrics.fleissKappa?.k ?? 0,
      fieldsAnalyzed: agreementMetrics.fleissKappa?.n ?? 0
    };

    // ========== STEP 6: DISTRIBUTIONS ==========
    const buildDistribution = (scores) => {
      const bins = [
        { range: '0-20%', min: 0, max: 0.2, count: 0 },
        { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
        { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
        { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
        { range: '80-100%', min: 0.8, max: 1.01, count: 0 }
      ];
      scores.forEach(s => {
        if (s == null || isNaN(s)) return;
        for (const bin of bins) {
          if (s >= bin.min && s < bin.max) {
            bin.count++;
            break;
          }
        }
      });
      return bins;
    };

    const scoreDistribution = {
      accuracy: {
        distribution: buildDistribution(allAccScores),
        stats: { mean: overallStats.scores.accuracy.mean, std: overallStats.scores.accuracy.std, count: allAccScores.length }
      },
      quality: {
        distribution: buildDistribution(allQualScores),
        stats: { mean: overallStats.scores.quality.mean, std: overallStats.scores.quality.std, count: allQualScores.length }
      }
    };

    // ========== STEP 7: FINDINGS ==========
    const findings = [];
    const keyInsights = [];

    if (overallStats.scores.accuracy.mean != null) {
      keyInsights.push(`Mean accuracy: ${formatPercent(overallStats.scores.accuracy.mean)} across ${totalPapers} unique papers (${totalEvaluations} evaluations)`);
    }
    
    if (overallStats.scores.quality.mean != null) {
      keyInsights.push(`Mean quality: ${formatPercent(overallStats.scores.quality.mean)}`);
    }

    if (multiEvaluatorPapers > 0) {
      keyInsights.push(`${multiEvaluatorPapers} papers with multiple evaluators (Fleiss' κ = ${interRaterReliability.fleissKappa != null ? formatScore(interRaterReliability.fleissKappa) : 'N/A'})`);
    }
    
    keyInsights.push(`Note: These scores include user ratings (60% automated + 40% user ratings)`);

    COMPONENT_KEYS.forEach(compKey => {
      const compAcc = qualityVsAccuracy.byComponent[compKey]?.accuracy?.mean;
      if (compAcc != null) {
        findings.push({
          id: `comp-${compKey}`, category: 'Component', title: COMPONENT_LABELS[compKey],
          accuracy: compAcc,
          quality: qualityVsAccuracy.byComponent[compKey]?.quality?.mean
        });
      }
    });

    const researchFindings = {
      findings,
      summary: {
        keyInsights,
        overallAssessment: {
          level: overallStats.scores.accuracy.mean >= 0.7 ? 'Good' : overallStats.scores.accuracy.mean >= 0.5 ? 'Moderate' : 'Needs Improvement'
        },
        totalFindings: findings.length
      },
      publication: {
        keyObservations: [
          `Evaluation dataset: ${totalPapers} unique papers, ${totalEvaluations} evaluations, ${evaluators.length} evaluators`,
          `Mean accuracy: ${formatPercent(overallStats.scores.accuracy.mean)} | Mean quality: ${formatPercent(overallStats.scores.quality.mean)}`,
          multiEvaluatorPapers > 0 ? `Inter-rater reliability: Fleiss' κ = ${interRaterReliability.fleissKappa != null ? formatScore(interRaterReliability.fleissKappa) : 'N/A'} (${multiEvaluatorPapers} multi-eval papers)` : null
        ].filter(Boolean)
      }
    };

    return {
      papers,
      overallStats,
      evaluators,
      interRaterReliability,
      qualityVsAccuracy,
      researchFindings,
      scoreDistribution,
      componentLabels: COMPONENT_LABELS
    };
  }, [propAggregatedData, propIntegratedData]);

  const {
    papers, overallStats, evaluators, interRaterReliability, qualityVsAccuracy,
    researchFindings, scoreDistribution, componentLabels
  } = processedData;

  // Filter and sort
  const filteredPapers = useMemo(() => {
    let result = [...papers];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p => p.title?.toLowerCase().includes(search) || p.doi?.toLowerCase().includes(search));
    }
    
    if (showMultiEvalOnly) {
      result = result.filter(p => p.isMultiEvaluator);
    }
    
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'score':
          aVal = scoreMode === 'accuracy' ? a.scores.overall.accuracy?.mean : a.scores.overall.quality?.mean;
          bVal = scoreMode === 'accuracy' ? b.scores.overall.accuracy?.mean : b.scores.overall.quality?.mean;
          break;
        case 'evaluations':
          aVal = a.evaluationCount;
          bVal = b.evaluationCount;
          break;
        case 'title':
          return sortDirection === 'asc' ? (a.title || '').localeCompare(b.title || '') : (b.title || '').localeCompare(a.title || '');
        default:
          aVal = 0; bVal = 0;
      }
      aVal = aVal ?? -1; bVal = bVal ?? -1;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return result;
  }, [papers, searchTerm, showMultiEvalOnly, sortBy, sortDirection, scoreMode]);

  const selectedPaper = useMemo(() => selectedPaperId ? papers.find(p => p.id === selectedPaperId) : null, [papers, selectedPaperId]);

  const toggleSection = useCallback((section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })), []);
  const toggleSort = useCallback((field) => {
    if (sortBy === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDirection('desc'); }
  }, [sortBy]);

  if (papers.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Paper Data Available</h3>
          <p className="text-gray-500">Upload and evaluate papers to see cross-paper analysis</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-indigo-600" />
          Cross-Paper Analysis Dashboard
        </h2>
        <p className="text-gray-600 mt-1">
          Analysis of {overallStats.totalPapers} unique papers from {overallStats.totalEvaluations} evaluations
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setScoreMode('accuracy')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            scoreMode === 'accuracy' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Target className="h-4 w-4" /><span>Accuracy</span>
          {overallStats.scores?.accuracy?.mean != null && (
            <Badge variant="outline" className={`text-xs ${scoreMode === 'accuracy' ? 'bg-blue-50 text-blue-700' : ''}`}>
              {formatPercent(overallStats.scores.accuracy.mean, 0)}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setScoreMode('quality')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            scoreMode === 'quality' ? 'bg-white text-purple-700 shadow-sm border border-purple-200' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Award className="h-4 w-4" /><span>Quality</span>
          {overallStats.scores?.quality?.mean != null && (
            <Badge variant="outline" className={`text-xs ${scoreMode === 'quality' ? 'bg-purple-50 text-purple-700' : ''}`}>
              {formatPercent(overallStats.scores.quality.mean, 0)}
            </Badge>
          )}
        </button>
      </div>

      <UserRatingNote />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Evaluations" value={overallStats.totalEvaluations} color="blue" />
        <StatCard icon={<FileText className="h-5 w-5" />} label="Unique Papers" value={overallStats.totalPapers} color="indigo" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Evaluators" value={overallStats.uniqueEvaluators} color="green" />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label={scoreMode === 'accuracy' ? 'Avg Accuracy' : 'Avg Quality'}
          value={formatPercent(scoreMode === 'accuracy' ? overallStats.scores.accuracy?.mean : overallStats.scores.quality?.mean)}
          color={scoreMode === 'accuracy' ? 'blue' : 'purple'}
        />
        <StatCard icon={<Users className="h-5 w-5" />} label="Multi-Eval Papers" value={overallStats.multiEvaluatorPapers} color="amber" />
      </div>

      {/* Research Findings */}
      <CollapsibleSection title="Research Findings" icon={<Sparkles className="h-5 w-5 text-amber-500" />} expanded={expandedSections.findings} onToggle={() => toggleSection('findings')} badge={<Badge className="bg-blue-100 text-blue-700">{researchFindings.summary.overallAssessment.level}</Badge>}>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Key Insights</h4>
            <ul className="space-y-2">
              {researchFindings.summary.keyInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {researchFindings.findings.map(f => (
              <div key={f.id} className="p-3 rounded-lg border bg-gray-50">
                <span className="text-xs font-medium text-gray-500">{f.title}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-bold ${getScoreColor(f.accuracy)}`}>{formatPercent(f.accuracy, 0)}</span>
                  <span className="text-xs text-gray-400">acc</span>
                  <span className={`text-lg font-bold ${getScoreColor(f.quality)}`}>{formatPercent(f.quality, 0)}</span>
                  <span className="text-xs text-gray-400">qual</span>
                </div>
              </div>
            ))}
          </div>
          
          <ResearchFindingsCollapsible title="📊 Results" defaultOpen={false}>
            <div className="bg-blue-50 rounded-lg p-4">
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                {researchFindings.publication.keyObservations.map((obs, idx) => <li key={idx}>{obs}</li>)}
              </ul>
            </div>
          </ResearchFindingsCollapsible>
        </div>
      </CollapsibleSection>

      {/* Quality vs Accuracy */}
      <CollapsibleSection title="Quality vs Accuracy Analysis" icon={<GitCompare className="h-5 w-5 text-indigo-500" />} expanded={expandedSections.qva} onToggle={() => toggleSection('qva')}>
        <div className="space-y-6">
          <UserRatingNote />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">Mean Accuracy</p>
              <p className="text-3xl font-bold text-blue-700">{formatPercent(qualityVsAccuracy.overall.accuracy?.mean)}</p>
              <p className="text-xs text-blue-500 mt-1">σ = {formatPercent(qualityVsAccuracy.overall.accuracy?.std)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 mb-1">Mean Quality</p>
              <p className="text-3xl font-bold text-purple-700">{formatPercent(qualityVsAccuracy.overall.quality?.mean)}</p>
              <p className="text-xs text-purple-500 mt-1">σ = {formatPercent(qualityVsAccuracy.overall.quality?.std)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-1">Gap (Quality - Accuracy)</p>
              <p className={`text-3xl font-bold ${(qualityVsAccuracy.overall.quality?.mean || 0) - (qualityVsAccuracy.overall.accuracy?.mean || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {qualityVsAccuracy.overall.quality?.mean != null && qualityVsAccuracy.overall.accuracy?.mean != null 
                  ? `${(qualityVsAccuracy.overall.quality.mean - qualityVsAccuracy.overall.accuracy.mean) >= 0 ? '+' : ''}${formatPercent(qualityVsAccuracy.overall.quality.mean - qualityVsAccuracy.overall.accuracy.mean)}`
                  : 'N/A'}
              </p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 px-3">Component</th><th className="text-right py-2 px-3 text-blue-600">Accuracy</th><th className="text-right py-2 px-3 text-purple-600">Quality</th><th className="text-right py-2 px-3">Gap</th></tr></thead>
            <tbody>
              {Object.entries(qualityVsAccuracy.byComponent).map(([key, comp]) => (
                <tr key={key} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{componentLabels[key]}</td>
                  <td className="py-2 px-3 text-right"><span className={getScoreColor(comp.accuracy?.mean)}>{formatPercent(comp.accuracy?.mean)}</span></td>
                  <td className="py-2 px-3 text-right"><span className={getScoreColor(comp.quality?.mean)}>{formatPercent(comp.quality?.mean)}</span></td>
                  <td className="py-2 px-3 text-right">
                    <span className={comp.meanDifference != null ? (comp.meanDifference >= 0 ? 'text-green-600' : 'text-red-600') : ''}>
                      {comp.meanDifference != null ? `${comp.meanDifference >= 0 ? '+' : ''}${formatPercent(comp.meanDifference)}` : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Inter-Rater Reliability */}
      <CollapsibleSection title="Inter-Rater Reliability" icon={<Shield className="h-5 w-5 text-green-500" />} expanded={expandedSections.irr} onToggle={() => toggleSection('irr')} badge={interRaterReliability.hasData ? <Badge className="bg-purple-100 text-purple-700">{interRaterReliability.multiEvalCount} multi-eval papers</Badge> : null}>
        {!interRaterReliability.hasData ? (
          <div className="text-center py-8"><Users className="h-12 w-12 mx-auto text-gray-400 mb-3" /><p className="text-gray-600">No multi-evaluator data available</p></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-600 mb-1">Fleiss' Kappa</p>
                <p className="text-3xl font-bold text-indigo-700">{interRaterReliability.fleissKappa != null ? formatScore(interRaterReliability.fleissKappa) : 'N/A'}</p>
                <Badge className={`mt-2 ${getKappaColor(interRaterReliability.fleissKappa)}`}>{getInterpretationLabel(interRaterReliability.interpretation)}</Badge>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-1">Observed Agreement</p>
                <p className="text-2xl font-bold">{interRaterReliability.observedAgreement != null ? formatPercent(interRaterReliability.observedAgreement, 1) : 'N/A'}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-1">Multi-Eval Papers</p>
                <p className="text-2xl font-bold">{interRaterReliability.multiEvalCount}</p>
                <p className="text-xs text-gray-500">of {interRaterReliability.totalPapers} total</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-1">Fields Analyzed</p>
                <p className="text-2xl font-bold">{interRaterReliability.fieldsAnalyzed || 'N/A'}</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p><strong>Interpretation:</strong> Fleiss' Kappa measures agreement beyond chance among multiple raters.</p>
              <p className="mt-1">Values: &lt;0 (poor), 0-0.2 (slight), 0.2-0.4 (fair), 0.4-0.6 (moderate), 0.6-0.8 (substantial), &gt;0.8 (almost perfect)</p>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Score Distribution - BOTH */}
      <CollapsibleSection title="Score Distribution" icon={<PieChart className="h-5 w-5 text-blue-500" />} expanded={expandedSections.distribution} onToggle={() => toggleSection('distribution')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accuracy Distribution */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-700 mb-4">Accuracy Distribution</h4>
            <div className="flex items-end gap-2 h-32">
              {scoreDistribution.accuracy.distribution.map((bin, idx) => {
                const maxCount = Math.max(...scoreDistribution.accuracy.distribution.map(d => d.count), 1);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-xs text-blue-600 mb-1">{bin.count}</span>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${maxCount > 0 ? (bin.count / maxCount) * 100 : 0}%`, minHeight: bin.count > 0 ? '4px' : '0' }} />
                    <span className="text-xs text-blue-600 mt-2 whitespace-nowrap">{bin.range}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
              <div><p className="text-blue-500">Mean</p><p className="font-bold text-blue-700">{formatPercent(scoreDistribution.accuracy.stats?.mean)}</p></div>
              <div><p className="text-blue-500">Std</p><p className="font-bold text-blue-700">{formatPercent(scoreDistribution.accuracy.stats?.std)}</p></div>
              <div><p className="text-blue-500">Count</p><p className="font-bold text-blue-700">{scoreDistribution.accuracy.stats?.count || 0}</p></div>
            </div>
          </div>

          {/* Quality Distribution */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-700 mb-4">Quality Distribution</h4>
            <div className="flex items-end gap-2 h-32">
              {scoreDistribution.quality.distribution.map((bin, idx) => {
                const maxCount = Math.max(...scoreDistribution.quality.distribution.map(d => d.count), 1);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-xs text-purple-600 mb-1">{bin.count}</span>
                    <div className="w-full bg-purple-500 rounded-t" style={{ height: `${maxCount > 0 ? (bin.count / maxCount) * 100 : 0}%`, minHeight: bin.count > 0 ? '4px' : '0' }} />
                    <span className="text-xs text-purple-600 mt-2 whitespace-nowrap">{bin.range}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
              <div><p className="text-purple-500">Mean</p><p className="font-bold text-purple-700">{formatPercent(scoreDistribution.quality.stats?.mean)}</p></div>
              <div><p className="text-purple-500">Std</p><p className="font-bold text-purple-700">{formatPercent(scoreDistribution.quality.stats?.std)}</p></div>
              <div><p className="text-purple-500">Count</p><p className="font-bold text-purple-700">{scoreDistribution.quality.stats?.count || 0}</p></div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Evaluator Analysis */}
      <CollapsibleSection title="Evaluator Analysis" icon={<Users className="h-5 w-5 text-purple-500" />} expanded={expandedSections.evaluators} onToggle={() => toggleSection('evaluators')} badge={<Badge variant="outline">{evaluators.length} evaluators</Badge>}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-3">Evaluator</th>
              <th className="text-left py-2 px-3">Role</th>
              <th className="text-right py-2 px-3">Papers</th>
              <th className="text-right py-2 px-3">Mean Score</th>
            </tr>
          </thead>
          <tbody>
            {evaluators.map(ev => (
              <tr key={ev.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{ev.name}</td>
                <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{ev.profile?.role || 'Unknown'}</Badge></td>
                <td className="py-2 px-3 text-right">{ev.evaluationCount}</td>
                <td className="py-2 px-3 text-right"><span className={getScoreColor(ev.stats.mean)}>{formatPercent(ev.stats.mean)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>

      {/* Paper List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search papers by title or DOI..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowMultiEvalOnly(!showMultiEvalOnly)} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${showMultiEvalOnly ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                <Users className="h-4 w-4" />Multi-Eval Only
              </button>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {[{ key: 'score', label: 'Score' }, { key: 'evaluations', label: 'Evals' }, { key: 'title', label: 'Title' }].map(({ key, label }) => (
                  <button key={key} onClick={() => toggleSort(key)} className={`px-2 py-1 rounded text-xs font-medium ${sortBy === key ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}>
                    {label}{sortBy === key && <ArrowUpDown className="h-3 w-3 inline ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">Showing {filteredPapers.length} of {papers.length} papers</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x">
          <div className="lg:col-span-1 max-h-[600px] overflow-y-auto">
            {filteredPapers.length === 0 ? (
              <div className="p-8 text-center text-gray-500"><Search className="h-8 w-8 mx-auto mb-2 text-gray-400" /><p>No papers match</p></div>
            ) : (
              <div className="divide-y">
                {filteredPapers.map(paper => {
                  const score = scoreMode === 'accuracy' ? paper.scores.overall.accuracy?.mean : paper.scores.overall.quality?.mean;
                  return (
                    <button key={paper.id} onClick={() => { setSelectedPaperId(paper.id); setSelectedEvaluatorIdx(0); }} className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedPaperId === paper.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 line-clamp-2">{paper.title}</p>
                          {paper.doi && <p className="text-xs text-gray-500 font-mono mt-1 truncate">{paper.doi}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{paper.evaluationCount}</Badge>
                            {paper.isMultiEvaluator && <Badge className="bg-purple-100 text-purple-700 text-xs">Multi</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getScoreColor(score)}`}>{formatPercent(score, 0)}</p>
                          <p className="text-xs text-gray-500">{scoreMode}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-gray-50 min-h-[400px]">
            {selectedPaper ? (() => {
              // Compute displayed scores - individual evaluator or aggregated
              const showIndividual = selectedPaper.isMultiEvaluator && selectedPaper.evaluations?.[selectedEvaluatorIdx];
              const selectedEvaluator = showIndividual ? selectedPaper.evaluators?.[selectedEvaluatorIdx] : null;
              
              // console.log('[V7 Render Start] selectedEvaluatorIdx:', selectedEvaluatorIdx);
              // console.log('[V7 Render Start] isMultiEvaluator:', selectedPaper.isMultiEvaluator);
              // console.log('[V7 Render Start] evaluations.length:', selectedPaper.evaluations?.length);
              // console.log('[V7 Render Start] showIndividual:', showIndividual);
              // console.log('[V7 Render Start] selectedEvaluator:', selectedEvaluator);
              
              // Extract individual evaluator's scores if selected
              let displayScores = selectedPaper.scores; // Default to aggregated
              let individualRatings = {};
              
              if (showIndividual) {
                const evalData = selectedPaper.evaluations[selectedEvaluatorIdx];
                
                // console.log('[V7 Debug] evalData:', evalData);
                // console.log('[V7 Debug] evalData.userEvaluations:', evalData?.userEvaluations);
                // console.log('[V7 Debug] evalData.userEvaluations[0]:', evalData?.userEvaluations?.[0]);
                
                // The evalData is a FULL PAPER object, so userEvaluations[0] has the metrics
                const userEval = evalData?.userEvaluations?.[0];
                const metrics = userEval?.evaluationMetrics;
                
                // console.log('[V7 Debug] userEval:', userEval);
                // console.log('[V7 Debug] metrics:', metrics);
                // console.log('[V7 Debug] metrics.overall:', metrics?.overall);
                
                if (metrics?.overall) {
                  // Build individual scores from evaluationMetrics.overall
                  const compScores = {};
                  let overallAcc = null;
                  let overallQual = null;
                  const compAccScores = [];
                  const compQualScores = [];
                  
                  // Metadata
                  if (metrics.overall.metadata?.overall) {
                    const m = metrics.overall.metadata.overall;
                    compScores.metadata = {
                      accuracy: { mean: m.accuracyScore ?? m.overallScore },
                      quality: { mean: m.qualityScore ?? m.overallScore }
                    };
                    if (compScores.metadata.accuracy.mean != null) compAccScores.push(compScores.metadata.accuracy.mean);
                    if (compScores.metadata.quality.mean != null) compQualScores.push(compScores.metadata.quality.mean);
                  }
                  
                  // Research Field
                  if (metrics.overall.research_field) {
                    const rf = metrics.overall.research_field;
                    compScores.research_field = {
                      accuracy: { mean: rf.overallScore ?? rf.accuracyMetrics?.automatedScore?.value },
                      quality: { mean: rf.qualityMetrics?.overallQuality?.value ?? rf.overallScore }
                    };
                    if (compScores.research_field.accuracy.mean != null) compAccScores.push(compScores.research_field.accuracy.mean);
                    if (compScores.research_field.quality.mean != null) compQualScores.push(compScores.research_field.quality.mean);
                  }
                  
                  // Research Problem
                  if (metrics.overall.research_problem?.overall?.research_problem) {
                    const rp = metrics.overall.research_problem.overall.research_problem;
                    compScores.research_problem = {
                      accuracy: { mean: rp.accuracy?.overallAccuracy?.finalScore ?? rp.accuracy?.overallAccuracy?.automated },
                      quality: { mean: rp.quality?.overallQuality?.finalScore ?? rp.quality?.overallQuality?.automated }
                    };
                    if (compScores.research_problem.accuracy.mean != null) compAccScores.push(compScores.research_problem.accuracy.mean);
                    if (compScores.research_problem.quality.mean != null) compQualScores.push(compScores.research_problem.quality.mean);
                  }
                  
                  // Template
                  if (metrics.overall.template) {
                    const t = metrics.overall.template;
                    compScores.template = {
                      accuracy: { mean: t.overallScore ?? t.accuracyResults?.scoreDetails?.finalScore },
                      quality: { mean: t.qualityScore ?? t.overallScore }
                    };
                    if (compScores.template.accuracy.mean != null) compAccScores.push(compScores.template.accuracy.mean);
                    if (compScores.template.quality.mean != null) compQualScores.push(compScores.template.quality.mean);
                  }
                  
                  // Content
                  if (metrics.overall.content) {
                    const contentScores = [];
                    const contentQualScores = [];
                    Object.entries(metrics.overall.content).forEach(([k, v]) => {
                      if (v?.finalScore != null) contentScores.push(v.finalScore);
                      else if (v?.accuracyScore != null) contentScores.push(v.accuracyScore);
                      if (v?.qualityScore != null) contentQualScores.push(v.qualityScore);
                    });
                    if (contentScores.length > 0) {
                      const avgAcc = contentScores.reduce((a, b) => a + b, 0) / contentScores.length;
                      const avgQual = contentQualScores.length > 0 
                        ? contentQualScores.reduce((a, b) => a + b, 0) / contentQualScores.length 
                        : avgAcc;
                      compScores.content = { accuracy: { mean: avgAcc }, quality: { mean: avgQual } };
                      compAccScores.push(avgAcc);
                      compQualScores.push(avgQual);
                    }
                  }
                  
                  // Calculate overall from components
                  if (compAccScores.length > 0) {
                    overallAcc = compAccScores.reduce((a, b) => a + b, 0) / compAccScores.length;
                  }
                  if (compQualScores.length > 0) {
                    overallQual = compQualScores.reduce((a, b) => a + b, 0) / compQualScores.length;
                  }
                  
                  displayScores = {
                    overall: { accuracy: { mean: overallAcc }, quality: { mean: overallQual ?? overallAcc } },
                    byComponent: compScores
                  };
                }
                
                // Extract user ratings for display - properly keyed to match COMPONENT_KEYS
                // Check multiple paths for ratings
                
                // Metadata ratings (aggregate)
                const metadataRatings = [];
                if (metrics?.accuracy?.metadata) {
                  Object.entries(metrics.accuracy.metadata).forEach(([field, data]) => {
                    if (data?.rating) metadataRatings.push(data.rating);
                  });
                }
                if (metrics?.overall?.metadata) {
                  ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
                    if (metrics.overall.metadata[field]?.rating) metadataRatings.push(metrics.overall.metadata[field].rating);
                  });
                }
                if (metadataRatings.length > 0) {
                  individualRatings.metadata = Math.round(metadataRatings.reduce((a, b) => a + b, 0) / metadataRatings.length * 10) / 10;
                }
                
                // Research Field rating
                if (metrics?.accuracy?.researchField?.rating) {
                  individualRatings.research_field = metrics.accuracy.researchField.rating;
                } else if (metrics?.overall?.research_field?.userRating?.rating) {
                  individualRatings.research_field = metrics.overall.research_field.userRating.rating;
                }
                
                // Research Problem rating
                if (metrics?.accuracy?.researchProblem?.rating) {
                  individualRatings.research_problem = metrics.accuracy.researchProblem.rating;
                } else if (metrics?.overall?.research_problem?.overall?.research_problem?.userRatings?.overallRating) {
                  individualRatings.research_problem = metrics.overall.research_problem.overall.research_problem.userRatings.overallRating;
                }
                
                // Template rating
                if (metrics?.accuracy?.template?.rating) {
                  individualRatings.template = metrics.accuracy.template.rating;
                } else if (metrics?.overall?.template?.userRating?.rating) {
                  individualRatings.template = metrics.overall.template.userRating.rating;
                }
                
                // Content ratings (aggregate)
                const contentRatings = [];
                if (metrics?.overall?.content?.userRatings) {
                  Object.values(metrics.overall.content.userRatings).forEach(r => {
                    if (r?.rating) contentRatings.push(r.rating);
                  });
                }
                if (contentRatings.length > 0) {
                  individualRatings.content = Math.round(contentRatings.reduce((a, b) => a + b, 0) / contentRatings.length * 10) / 10;
                }
                
                // console.log('[V7 Ratings] Individual ratings extracted:', individualRatings);
              }
              
              return (
              <div className="p-6 space-y-6 overflow-y-auto max-h-[600px]">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="text-xl font-bold text-gray-900">{selectedPaper.title}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedPaper.doi && <a href={selectedPaper.links?.doi} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">{selectedPaper.doi}<ExternalLink className="h-3 w-3" /></a>}
                      {selectedPaper.isMultiEvaluator && <Badge className="bg-purple-100 text-purple-700">{selectedPaper.evaluationCount} evaluations</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPaperId(null)}><X className="h-4 w-4" /></Button>
                </div>

                {/* Indicator when viewing individual evaluator */}
                {showIndividual && selectedEvaluator && (
                  <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500 text-white p-2 rounded-full">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-base font-bold text-purple-800">Viewing: {selectedEvaluator.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="bg-purple-200 text-purple-700 text-xs">{selectedEvaluator.profile?.role || 'Evaluator'}</Badge>
                          <span className="text-xs text-purple-600">Eval #{selectedEvaluatorIdx + 1} of {selectedPaper.evaluations?.length}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-200" onClick={() => setSelectedEvaluatorIdx(-1)}>
                      Show Aggregated
                    </Button>
                  </div>
                )}

                <div className={`p-6 rounded-lg ${scoreMode === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${scoreMode === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
                        Overall {scoreMode === 'accuracy' ? 'Accuracy' : 'Quality'}
                        {showIndividual && <span className="text-xs ml-1">(Individual)</span>}
                      </p>
                      <p className={`text-4xl font-bold ${scoreMode === 'accuracy' ? 'text-blue-700' : 'text-purple-700'}`}>
                        {formatPercent(scoreMode === 'accuracy' ? displayScores.overall.accuracy?.mean : displayScores.overall.quality?.mean)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{showIndividual ? '1 eval' : `${selectedPaper.evaluationCount} eval${selectedPaper.evaluationCount !== 1 ? 's' : ''}`}</p>
                    </div>
                  </div>
                </div>

                <div key={`component-scores-${selectedEvaluatorIdx}`}>
                  <h4 className="font-medium text-gray-700 mb-3">
                    Component Scores
                    {showIndividual && Object.keys(individualRatings).length > 0 && (
                      <span className="text-xs text-amber-600 ml-2">(★ = {selectedEvaluator?.name}'s rating)</span>
                    )}
                  </h4>
                  <div className="space-y-3">
                    {COMPONENT_KEYS.map(key => {
                      const comp = displayScores.byComponent?.[key];
                      const compScore = scoreMode === 'accuracy' ? comp?.accuracy : comp?.quality;
                      const userRating = individualRatings[key];
                      
                      if (!comp) return null;
                      
                      return (
                        <div key={`${key}-${selectedEvaluatorIdx}-${userRating}`} className="flex items-center gap-3">
                          <span className="w-32 text-sm font-medium">{componentLabels[key]}</span>
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${scoreMode === 'accuracy' ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${(compScore?.mean || 0) * 100}%` }} />
                          </div>
                          <span className={`w-14 text-sm font-medium text-right ${getScoreColor(compScore?.mean)}`}>{formatPercent(compScore?.mean)}</span>
                          {showIndividual && (
                            <span className={`w-20 text-sm font-bold text-right px-2 py-0.5 rounded ${userRating ? 'bg-amber-100 text-amber-700' : 'text-gray-400'}`}>
                              {userRating ? `${userRating}/5 ★` : '—'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedPaper.evaluators?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">
                      Evaluators ({selectedPaper.evaluators.length})
                      {selectedPaper.isMultiEvaluator && <span className="text-xs text-purple-600 ml-2">(Click to view their evaluation)</span>}
                    </h4>
                    <div className="space-y-2">
                      {selectedPaper.evaluators.map((ev, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectedPaper.isMultiEvaluator && setSelectedEvaluatorIdx(idx)}
                          className={`w-full flex items-center justify-between p-2 rounded border transition-colors ${
                            selectedPaper.isMultiEvaluator && selectedEvaluatorIdx === idx
                              ? 'bg-purple-50 border-purple-300'
                              : 'bg-white hover:bg-gray-50'
                          } ${selectedPaper.isMultiEvaluator ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className="flex items-center gap-2">
                            {selectedPaper.isMultiEvaluator && selectedEvaluatorIdx === idx && (
                              <User className="h-4 w-4 text-purple-600" />
                            )}
                            <span className="text-sm font-medium">{ev.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{ev.profile?.role || 'Unknown'}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show detailed field ratings when viewing individual evaluator */}
                {showIndividual && (() => {
                  const evalData = selectedPaper.evaluations[selectedEvaluatorIdx];
                  // evalData is a FULL PAPER object - metrics are in userEvaluations[0]
                  const userEval = evalData?.userEvaluations?.[0];
                  const metrics = userEval?.evaluationMetrics;
                  const evaluatorName = userEval?.userInfo ? `${userEval.userInfo.firstName} ${userEval.userInfo.lastName}` : 'Unknown';
                  const evalToken = evalData?.token?.slice(-8) || '';
                  
                  if (!metrics) return null;
                  
                  // Extract all field-level ratings
                  const fieldRatings = [];
                  
                  // Metadata fields - check both paths
                  if (metrics.accuracy?.metadata) {
                    Object.entries(metrics.accuracy.metadata).forEach(([field, data]) => {
                      if (data?.rating) fieldRatings.push({ 
                        category: 'Metadata', 
                        field: field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(), 
                        rating: data.rating 
                      });
                    });
                  }
                  if (metrics.overall?.metadata) {
                    ['title', 'authors', 'doi', 'publication_year', 'venue'].forEach(field => {
                      const fieldData = metrics.overall.metadata[field];
                      if (fieldData?.rating && !fieldRatings.some(r => r.category === 'Metadata' && r.field.toLowerCase().includes(field.replace(/_/g, ' ')))) {
                        fieldRatings.push({ 
                          category: 'Metadata', 
                          field: field.replace(/_/g, ' '), 
                          rating: fieldData.rating 
                        });
                      }
                    });
                  }
                  
                  // Research Field
                  if (metrics.accuracy?.researchField?.rating) {
                    fieldRatings.push({ category: 'Research Field', field: 'Accuracy', rating: metrics.accuracy.researchField.rating });
                  }
                  if (metrics.overall?.research_field?.userRating?.rating) {
                    fieldRatings.push({ category: 'Research Field', field: 'Overall', rating: metrics.overall.research_field.userRating.rating });
                  }
                  
                  // Research Problem
                  if (metrics.accuracy?.researchProblem?.rating) {
                    fieldRatings.push({ category: 'Research Problem', field: 'Accuracy', rating: metrics.accuracy.researchProblem.rating });
                  }
                  if (metrics.overall?.research_problem?.overall?.research_problem?.userRatings?.overallRating) {
                    fieldRatings.push({ category: 'Research Problem', field: 'Overall', rating: metrics.overall.research_problem.overall.research_problem.userRatings.overallRating });
                  }
                  
                  // Template
                  if (metrics.accuracy?.template?.rating) {
                    fieldRatings.push({ category: 'Template', field: 'Accuracy', rating: metrics.accuracy.template.rating });
                  }
                  if (metrics.overall?.template?.userRating?.rating) {
                    fieldRatings.push({ category: 'Template', field: 'Overall', rating: metrics.overall.template.userRating.rating });
                  }
                  
                  if (fieldRatings.length === 0) return null;
                  
                  // Group by category
                  const grouped = fieldRatings.reduce((acc, r) => {
                    if (!acc[r.category]) acc[r.category] = [];
                    acc[r.category].push(r);
                    return acc;
                  }, {});
                  
                  return (
                    <div key={`detailed-ratings-${evalToken}`}>
                      <h4 className="font-medium text-gray-700 mb-3">
                        <Star className="h-4 w-4 inline mr-2 text-amber-500" />
                        {evaluatorName}'s Field Ratings
                      </h4>
                      <div className="bg-white rounded border p-3 space-y-3">
                        {Object.entries(grouped).map(([category, ratings]) => (
                          <div key={`${category}-${evalToken}`}>
                            <p className="text-xs text-gray-500 font-medium mb-1">{category}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {ratings.map((r, i) => (
                                <div key={`${i}-${r.rating}`} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 truncate capitalize">{r.field}</span>
                                  <span className="font-medium text-amber-600">{r.rating}/5</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {selectedPaper.hasGroundTruth && selectedPaper.groundTruthMatch && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Ground Truth Comparison</h4>
                    <div className="space-y-3">
                      {['researchField', 'researchProblem', 'template'].map(field => {
                        const match = selectedPaper.groundTruthMatch[field];
                        if (!match) return null;
                        return (
                          <div key={field} className="p-3 bg-white rounded-lg border">
                            <p className="text-xs text-gray-500 uppercase font-medium mb-2">{field.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div><p className="text-xs text-emerald-600 mb-1">ORKG Ground Truth</p><p className="text-sm font-medium">{match.groundTruth || 'N/A'}</p></div>
                              <div>
                                <p className="text-xs text-blue-600 mb-1">System Extracted</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm">{match.extracted || 'N/A'}</p>
                                  {match.isLLM && <Badge className="bg-amber-100 text-amber-700 text-xs flex items-center gap-1"><Cpu className="h-3 w-3" />LLM</Badge>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
            })() : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Select a paper to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CrossPaperAnalysis;