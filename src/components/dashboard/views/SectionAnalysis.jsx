// File: src/components/dashboard/views/SectionAnalysis.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  ChevronDown, ChevronUp, BarChart3, TrendingUp, 
  AlertCircle, CheckCircle, XCircle, Info, HelpCircle,
  Calculator, Star, BookOpen, FileText, Target, Layout, Database
} from 'lucide-react';

// Content Analysis Components
import ContentAnalysisDashboard from '../ContentAnalysisDashboard';
import { aggregateContentAnalysis } from '../../../services/contentAnalysisAggregator';

// Phase 1 & 2 Components
import DetailedAccuracyMetrics from '../shared/DetailedAccuracyMetrics';
import DetailedQualityMetrics from '../shared/DetailedQualityMetrics';
import PaperListWithDrillDown from './PaperListWithDrillDown';

// Import MetricsExtractor for consistent score extraction
import MetricsExtractor from '../../../utils/metricsExtractor';

/**
 * SectionAnalysis Component - v10.2 (Corrected Data Paths)
 * 
 * v10.2 FIXES:
 * - Reverted to correct path: evaluationMetrics.overall (NOT evaluation.overall)
 * - Confirmed data structure via diagnostic script
 * 
 * Data structure confirmed:
 * - evaluation.evaluationMetrics.overall.metadata.overall.overallScore
 * - evaluation.evaluationMetrics.accuracy.metadata
 * - evaluation.evaluationMetrics.quality.metadata
 * 
 * v10 ORIGINAL FIXES:
 * 1. Accuracy/Quality Metrics now ALWAYS show
 * 2. Paper-Level Analysis uses improved data detection
 * 3. Content tab shows correct unique papers vs evaluations count
 * 4. checkComponentHasData checks more data paths
 */

// Component metadata
const COMPONENT_METADATA = {
  metadata: {
    label: 'Metadata',
    color: '#3B82F6',
    icon: FileText,
    description: 'Paper metadata extraction accuracy',
    scorePath: 'evaluationMetrics.overall.metadata.overall.overallScore',
    metrics: ['Levenshtein similarity', 'Token matching', 'Special character preservation'],
    weights: { levenshtein: 0.4, tokenMatching: 0.4, specialChar: 0.2 }
  },
  research_field: {
    label: 'Research Field',
    color: '#10B981',
    icon: BookOpen,
    description: 'Research field identification accuracy',
    scorePath: 'evaluationMetrics.overall.research_field.overallScore',
    metrics: ['Exact match rate', 'Hierarchy alignment', 'Position score'],
    weights: { exactMatch: 0.3, hierarchyAlignment: 0.3, positionScore: 0.4 }
  },
  research_problem: {
    label: 'Research Problem',
    color: '#F59E0B',
    icon: Target,
    description: 'Research problem identification quality',
    scorePath: 'evaluationMetrics.overall.research_problem.overall.research_problem.accuracy.scoreDetails.finalScore',
    metrics: ['Title alignment', 'Content coverage', 'Semantic similarity'],
    weights: { titleAlignment: 0.3, contentCoverage: 0.4, semanticSimilarity: 0.3 }
  },
  template: {
    label: 'Template',
    color: '#8B5CF6',
    icon: Layout,
    description: 'Template selection appropriateness',
    scorePath: 'evaluationMetrics.overall.template.overallScore',
    metrics: ['Property overlap', 'Structural similarity', 'Title accuracy'],
    weights: { propertyOverlap: 0.4, structuralSimilarity: 0.3, titleAccuracy: 0.3 }
  },
  content: {
    label: 'Content',
    color: '#EF4444',
    icon: Database,
    description: 'Property value extraction quality',
    scorePath: 'Aggregated from contentAnalysisAggregator',
    metrics: ['Coverage rate', 'Evidence rate', 'Confidence', 'Granularity', 'User ratings'],
    weights: { coverage: 0.20, evidence: 0.15, confidence: 0.05, granularity: 0.10, edits: 0.10, userRating: 0.40 }
  }
};

// Metric labels for selector
const metricLabels = {
  mean: 'Mean Score',
  median: 'Median Score',
  std: 'Standard Deviation',
  min: 'Minimum Score',
  max: 'Maximum Score'
};

// Tooltip component for better UX
const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap max-w-xs">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
};

const SectionAnalysis = ({ data, aggregatedData, integratedData }) => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('mean');
  const [contentViewMode, setContentViewMode] = useState('analysis');
  const [showScoreExplanation, setShowScoreExplanation] = useState({});

  const toggleScoreExplanation = (componentId, e) => {
    e?.stopPropagation();
    setShowScoreExplanation(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  };

  // v10: Get evaluations from a paper (handles multiple formats)
  const getEvaluationsFromPaper = (paper) => {
    if (paper.userEvaluations && Array.isArray(paper.userEvaluations)) {
      return paper.userEvaluations;
    }
    if (paper.evaluations && Array.isArray(paper.evaluations)) {
      return paper.evaluations;
    }
    if (paper.evaluation) {
      return [paper.evaluation];
    }
    return [];
  };

  // v10: Calculate GLOBAL paper stats (for header display)
  const globalPaperStats = useMemo(() => {
    if (!integratedData?.papers) {
      return { uniquePapers: 0, totalEvaluations: 0, papersWithGT: 0, fullyLinked: 0 };
    }
    
    const papers = integratedData.papers;
    
    // Count unique DOIs
    const uniqueDOIs = new Set(papers.map(p => p.doi).filter(Boolean));
    
    // Count total evaluations across all papers
    let totalEvaluations = 0;
    papers.forEach(paper => {
      const evals = getEvaluationsFromPaper(paper);
      totalEvaluations += evals.length || 1;
    });
    
    // Count papers with ground truth
    let papersWithGT = 0;
    let fullyLinked = 0;
    papers.forEach(paper => {
      const gt = paper.groundTruth;
      if (gt) {
        const hasGT = gt.researchField || gt.researchProblem || gt.template || 
                      (gt.contributions && gt.contributions.length > 0);
        if (hasGT) papersWithGT++;
        
        const hasAll = gt.researchField && gt.researchProblem && gt.template && 
                       gt.contributions && gt.contributions.length > 0;
        if (hasAll) fullyLinked++;
      }
    });
    
    return {
      uniquePapers: uniqueDOIs.size || papers.length,
      totalEvaluations: Math.max(totalEvaluations, papers.length),
      papersWithGT,
      fullyLinked
    };
  }, [integratedData]);

  // Get unique papers from integrated data
  const uniqueIntegratedPapers = useMemo(() => {
    if (!integratedData?.papers) return [];
    
    const seenDOIs = new Set();
    return integratedData.papers.filter(paper => {
      if (!paper.doi) return true;
      if (seenDOIs.has(paper.doi)) return false;
      seenDOIs.add(paper.doi);
      return true;
    });
  }, [integratedData]);

  // v10.2: Improved check if an evaluation has data for a specific component
  // Data paths: evaluationMetrics.overall, evaluationMetrics.accuracy, evaluationMetrics.quality
  const checkComponentHasData = (evaluation, componentId) => {
    if (!evaluation?.evaluationMetrics) return false;
    
    const overall = evaluation.evaluationMetrics.overall;
    const accuracy = evaluation.evaluationMetrics.accuracy;
    const quality = evaluation.evaluationMetrics.quality;
    
    switch (componentId) {
      case 'metadata':
        // Check multiple possible paths
        return !!(
          overall?.metadata ||
          accuracy?.metadata ||
          quality?.metadata
        );
      case 'research_field':
        return !!(
          overall?.research_field ||
          accuracy?.researchField ||
          accuracy?.research_field ||
          quality?.researchField ||
          quality?.research_field
        );
      case 'research_problem':
        return !!(
          overall?.research_problem ||
          accuracy?.researchProblem ||
          accuracy?.research_problem ||
          quality?.researchProblem ||
          quality?.research_problem
        );
      case 'template':
        return !!(
          overall?.template ||
          accuracy?.template ||
          quality?.template
        );
      case 'content':
        // For content, check if there are any property evaluations
        const contentOverall = overall?.content;
        const contentAccuracy = accuracy?.content;
        const contentQuality = quality?.content;
        
        if (contentOverall && typeof contentOverall === 'object') {
          const keys = Object.keys(contentOverall).filter(k => 
            !['overallScore', 'timestamp', 'config', '_aggregate', 'userRatings'].includes(k)
          );
          if (keys.length > 0) return true;
        }
        if (contentAccuracy && typeof contentAccuracy === 'object' && Object.keys(contentAccuracy).length > 0) return true;
        if (contentQuality && typeof contentQuality === 'object' && Object.keys(contentQuality).length > 0) return true;
        return false;
      default:
        return false;
    }
  };

  // v10: Calculate component-specific paper and evaluation counts
  const getComponentCounts = (componentId, papers) => {
    let uniquePapers = 0;
    let totalEvaluations = 0;
    
    papers.forEach(paper => {
      const evaluations = getEvaluationsFromPaper(paper);
      
      let paperHasComponentData = false;
      let evalCount = 0;
      
      evaluations.forEach(evaluation => {
        const hasData = checkComponentHasData(evaluation, componentId);
        if (hasData) {
          paperHasComponentData = true;
          evalCount++;
        }
      });
      
      if (paperHasComponentData) {
        uniquePapers++;
        totalEvaluations += evalCount;
      }
    });
    
    return { uniquePapers, totalEvaluations };
  };

  // v10: Get filtered papers for a component (more lenient)
  const getFilteredPapers = (componentId) => {
    return uniqueIntegratedPapers.filter(paper => {
      const evaluations = getEvaluationsFromPaper(paper);
      // A paper has data if ANY of its evaluations have data for this component
      return evaluations.some(evaluation => checkComponentHasData(evaluation, componentId));
    });
  };

  // Content analysis stats with v10 fixes for paper/eval counting
  const contentAnalysisStats = useMemo(() => {
    if (!integratedData?.papers || integratedData.papers.length === 0) {
      console.log('📊 contentAnalysisStats: No integratedData or papers');
      return {
        finalScore: 0, std: 0, min: 0, max: 0, median: 0,
        automatedScore: 0, userRatingScore: null, hasUserRatings: false,
        qualityLevel: 'unknown', totalPapers: 0, totalEvaluations: 0, paperAnalysis: []
      };
    }
    
    const analysis = aggregateContentAnalysis(integratedData, { userWeight: 1.0 });
    
    // Store for debugging
    window.contentAnalysisResult = analysis;
    
    // v10: Calculate content-specific paper and evaluation counts
    const contentCounts = getComponentCounts('content', uniqueIntegratedPapers);
    
    const result = {
      finalScore: analysis.finalScore.weightedScore,
      std: analysis.finalScore.std || 0,
      min: analysis.finalScore.min || 0,
      max: analysis.finalScore.max || 0,
      median: analysis.finalScore.median || analysis.finalScore.weightedScore,
      automatedScore: analysis.finalScore.automatedScore || 0,
      userRatingScore: analysis.finalScore.userRatingScore,
      hasUserRatings: analysis.userRatings.available,
      userRatingAvg: analysis.userRatings.available ? analysis.userRatings.overall.mean : null,
      qualityLevel: analysis.finalScore.qualityLevel,
      // v10: Use component-specific counts
      totalPapers: contentCounts.uniquePapers || analysis.summary.totalPapers,
      totalEvaluations: contentCounts.totalEvaluations || globalPaperStats.totalEvaluations,
      breakdown: analysis.finalScore.breakdown,
      calculationMethod: analysis.finalScore.calculationMethod,
      paperAnalysis: analysis.paperAnalysis || [],
      automatedStats: {
        mean: analysis.finalScore.automatedScore || 0,
        std: analysis.coverage?.overall?.std || 0,
        min: analysis.coverage?.overall?.min || 0,
        max: analysis.coverage?.overall?.max || 1
      },
      userRatingStats: analysis.userRatings.available ? {
        mean: analysis.finalScore.userRatingScore || 0,
        std: analysis.userRatings.overall?.std || 0,
        min: analysis.userRatings.overall?.min || 0,
        max: analysis.userRatings.overall?.max || 1
      } : null,
      // v10: Add correlation data with proper null handling
      correlationData: analysis.correlations || null
    };
    
    console.log('📊 contentAnalysisStats result:', result);
    return result;
  }, [integratedData, uniqueIntegratedPapers, globalPaperStats.totalEvaluations]);

  const loadingIntegratedData = !integratedData;
  const useAggregatedData = aggregatedData && aggregatedData.components;

  if (!data && !aggregatedData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No section data available for analysis.</AlertDescription>
      </Alert>
    );
  }

  const sections = Object.entries(COMPONENT_METADATA).map(([id, meta]) => ({ id, ...meta }));

  // Extract component data
  const componentData = useMemo(() => {
    if (!useAggregatedData) return null;

    const components = aggregatedData.components;

    return sections.map(section => {
      const compData = components[section.id];
      if (!compData) return { ...section, available: false };

      let scores = compData.scores || {};
      
      // v10: Get component-specific counts
      const componentCounts = getComponentCounts(section.id, uniqueIntegratedPapers);
      let evaluationCount = componentCounts.totalEvaluations || compData.evaluationCount || scores.count || 0;
      let paperCount = componentCounts.uniquePapers || 0;
      
      // Extract userRatings from aggregatedData
      const aggregatedUserRatings = compData.userRatings || null;
      const hasUserRatings = aggregatedUserRatings && aggregatedUserRatings.count > 0 && aggregatedUserRatings.mean !== null;
      const userRatingScore = hasUserRatings ? aggregatedUserRatings.mean : null;
      const userRatingRaw = hasUserRatings ? aggregatedUserRatings.rawMean : null;
      
      const userRatingStats = hasUserRatings ? {
        mean: aggregatedUserRatings.mean || 0,
        std: aggregatedUserRatings.std || 0,
        min: aggregatedUserRatings.min || 0,
        max: aggregatedUserRatings.max || 1,
        count: aggregatedUserRatings.count || 0
      } : null;
      
      // For content, use contentAnalysisStats
      if (section.id === 'content') {
        scores = {
          mean: contentAnalysisStats.finalScore || 0,
          std: contentAnalysisStats.std || 0,
          min: contentAnalysisStats.min || 0,
          max: contentAnalysisStats.max || 0,
          median: contentAnalysisStats.median || contentAnalysisStats.finalScore
        };
        evaluationCount = contentAnalysisStats.totalEvaluations;
        paperCount = contentAnalysisStats.totalPapers;
      }

      // Extract detailed metrics - pass raw evaluations to MetricsExtractor
      const rawEvaluations = [];
      uniqueIntegratedPapers.forEach(paper => {
        const evals = getEvaluationsFromPaper(paper);
        rawEvaluations.push(...evals.filter(Boolean));
      });
      
      const accuracyMetrics = MetricsExtractor.aggregateMetrics(rawEvaluations, section.id, null, 'accuracy');
      const qualityMetrics = MetricsExtractor.aggregateMetrics(rawEvaluations, section.id, null, 'quality');

      const result = {
        ...section,
        available: true,
        evaluationCount,
        paperCount,
        scores,
        fields: compData.fields || {},
        byPaper: compData.byPaper || {},
        accuracyMetrics,
        qualityMetrics,
        hasUserRatings: section.id === 'content' ? contentAnalysisStats.hasUserRatings : hasUserRatings,
        userRatingScore: section.id === 'content' ? contentAnalysisStats.userRatingScore : userRatingScore,
        userRatingRaw: section.id === 'content' ? contentAnalysisStats.userRatingAvg : userRatingRaw,
        userRatingAvg: section.id === 'content' ? contentAnalysisStats.userRatingAvg : (userRatingRaw ? userRatingRaw * 5 : null),
        userRatingStats: section.id === 'content' ? contentAnalysisStats.userRatingStats : userRatingStats,
        automatedScore: section.id === 'content' ? contentAnalysisStats.automatedScore : (compData.scores?.mean || 0),
        automatedStats: section.id === 'content' ? contentAnalysisStats.automatedStats : {
          mean: compData.scores?.mean || 0,
          std: compData.scores?.std || 0,
          min: compData.scores?.min || 0,
          max: compData.scores?.max || 1
        },
        qualityLevel: section.id === 'content' ? contentAnalysisStats.qualityLevel : null,
        paperAnalysis: section.id === 'content' ? contentAnalysisStats.paperAnalysis : null
      };

      return result;
    });
  }, [aggregatedData, useAggregatedData, contentAnalysisStats, globalPaperStats, sections, uniqueIntegratedPapers]);

  // Helpers
  const getMetricColor = (value) => {
    if (value >= 0.8) return 'bg-green-100 text-green-800';
    if (value >= 0.6) return 'bg-yellow-100 text-yellow-800';
    if (value >= 0.4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (value) => {
    if (value >= 0.8) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (value >= 0.5) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getQualityLevelColor = (level) => {
    switch (level) {
      case 'excellent': return 'border-green-500 text-green-700 bg-green-50';
      case 'good': return 'border-blue-500 text-blue-700 bg-blue-50';
      case 'moderate': return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'poor': return 'border-red-500 text-red-700 bg-red-50';
      default: return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  const getQualityLevel = (score) => {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'moderate';
    return 'poor';
  };

  const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;
  const formatMetricValue = (value, metric) => {
    if (value === null || value === undefined) return '—';
    if (metric === 'std') return `±${value.toFixed(3)}`;
    return formatPercent(value);
  };

  // Section Card Component
  const SectionCard = ({ section }) => {
    const isExpanded = expandedSection === section.id;
    const scores = section.scores || {};
    const filteredPapers = getFilteredPapers(section.id);
    const isContentSection = section.id === 'content';
    const qualityLevel = section.qualityLevel || getQualityLevel(scores.mean || 0);
    const IconComponent = section.icon;

    return (
      <Card className="overflow-hidden">
        {/* Header */}
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedSection(isExpanded ? null : section.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${section.color}20` }}
              >
                <IconComponent className="h-4 w-4" style={{ color: section.color }} />
              </div>
              <div>
                <h3 className="font-semibold capitalize">{section.label}</h3>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
              
              <Badge className={getMetricColor(scores.mean || 0)}>
                {formatPercent(scores.mean || 0)}
              </Badge>
              
              <Badge variant="outline" className={`text-xs capitalize ${getQualityLevelColor(qualityLevel)}`}>
                {qualityLevel}
              </Badge>
              
              {/* v10: Show component-specific paper count and evaluation count */}
              <Badge variant="outline" className="text-xs">
                {section.paperCount} papers / {section.evaluationCount} evals
              </Badge>
              
              {section.hasUserRatings && (
                <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700">
                  <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                  User Rated
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(scores.mean || 0)}
              <span className="text-sm text-gray-600 font-mono">σ: {(scores.std || 0).toFixed(3)}</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          
          {!isExpanded && (
            <div className="mt-2 pl-11 text-xs text-gray-500 flex items-center gap-4">
              <span>Min: {formatPercent(scores.min || 0)}</span>
              <span>Max: {formatPercent(scores.max || 0)}</span>
              {section.hasUserRatings && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  User Rating: {section.userRatingAvg?.toFixed(1)}/5
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 border-t bg-gray-50 space-y-6">
            {/* Score Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Score Calculation
                  <Tooltip text="Final score = (Automated × 60%) + (User Rating × 40%)">
                    <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                  </Tooltip>
                </h4>
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  onClick={(e) => toggleScoreExplanation(section.id, e)}
                >
                  {showScoreExplanation[section.id] ? 'Hide' : 'Show'} Details
                </button>
              </div>
              
              {showScoreExplanation[section.id] && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                  <p className="font-semibold mb-2">How the final score is calculated:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Automated Score (60% weight):</strong> Based on similarity metrics, matching algorithms</li>
                    <li><strong>User Rating (40% weight):</strong> Expert evaluator ratings normalized from 1-5 scale</li>
                    <li>Formula: Final = (Automated × 0.6) + (UserRating × 0.4)</li>
                    {!section.hasUserRatings && (
                      <li className="text-amber-700">⚠️ No user ratings available - using automated score only</li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-6 gap-3 text-center">
                <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="text-xs text-blue-600 uppercase">Automated</div>
                  <div className="text-lg font-bold text-blue-700">
                    {formatPercent(section.automatedScore || 0)}
                  </div>
                  <div className="text-xs text-blue-500">60% weight</div>
                </div>
                
                <div className="text-center flex items-center justify-center text-gray-400">
                  <span className="text-lg">×</span>
                </div>
                
                <div className={`text-center p-2 rounded border ${
                  section.hasUserRatings ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-xs uppercase ${section.hasUserRatings ? 'text-yellow-600' : 'text-gray-400'}`}>
                    <Star className={`h-3 w-3 inline mr-1 ${section.hasUserRatings ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                    User
                  </div>
                  <div className={`text-lg font-bold ${section.hasUserRatings ? 'text-yellow-700' : 'text-gray-400'}`}>
                    {section.hasUserRatings ? formatPercent(section.userRatingScore || 0) : '—'}
                  </div>
                  <div className={`text-xs ${section.hasUserRatings ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {section.hasUserRatings ? '40% weight' : 'Not collected'}
                  </div>
                </div>
                
                <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                  <div className="text-xs text-green-600 uppercase">Final</div>
                  <div className="text-lg font-bold text-green-700">
                    {formatMetricValue(scores[selectedMetric], selectedMetric)}
                  </div>
                  <div className="text-xs text-green-500">Weighted</div>
                </div>
                
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-500 uppercase">Std Dev</div>
                  <div className="text-lg font-bold text-gray-600">±{(scores.std || 0).toFixed(3)}</div>
                </div>
                
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-500 uppercase">Range</div>
                  <div className="text-sm font-bold text-gray-600">
                    {formatPercent(scores.min || 0)} - {formatPercent(scores.max || 0)}
                  </div>
                </div>
              </div>
              
              {section.hasUserRatings && section.userRatingAvg && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span>Average User Rating:</span>
                    <span className="font-bold">{section.userRatingAvg.toFixed(2)}/5</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-3 w-3 ${
                          i <= Math.round(section.userRatingAvg) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-yellow-600">
                    → Normalized: {formatPercent(section.userRatingScore || 0)}
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            {isContentSection && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Content Analysis
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                      {contentAnalysisStats.totalPapers} papers / {contentAnalysisStats.totalEvaluations} evals
                    </Badge>
                  </h4>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setContentViewMode('analysis'); }}
                      className={`px-3 py-1 text-xs rounded ${
                        contentViewMode === 'analysis' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Full Analysis
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setContentViewMode('papers'); }}
                      className={`px-3 py-1 text-xs rounded ${
                        contentViewMode === 'papers' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Papers List
                    </button>
                  </div>
                </div>

                {contentViewMode === 'analysis' && !loadingIntegratedData && (
                  <ContentAnalysisDashboard integratedData={integratedData} />
                )}

                {contentViewMode === 'papers' && section.paperAnalysis?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Paper</th>
                          <th className="text-center p-2">Coverage</th>
                          <th className="text-center p-2">Evidence</th>
                          <th className="text-center p-2">
                            <Star className="h-3 w-3 text-yellow-500 inline mr-1" />User
                          </th>
                          <th className="text-center p-2">Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.paperAnalysis.map((paper, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="p-2 max-w-xs truncate" title={paper.paperTitle}>{paper.paperTitle}</td>
                            <td className="text-center p-2">
                              <Badge className={getMetricColor(paper.metrics.coverageRate)}>
                                {formatPercent(paper.metrics.coverageRate)}
                              </Badge>
                            </td>
                            <td className="text-center p-2">
                              <Badge className={getMetricColor(paper.metrics.evidenceRate)}>
                                {formatPercent(paper.metrics.evidenceRate)}
                              </Badge>
                            </td>
                            <td className="text-center p-2">
                              {paper.hasUserRating ? (
                                <span className="flex items-center justify-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  {paper.userRating?.toFixed(1)}/5
                                </span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="text-center p-2">
                              <Badge className={`${getMetricColor(paper.paperFinalScore)} font-bold`}>
                                {formatPercent(paper.paperFinalScore)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Non-Content Sections */}
            {!isContentSection && (
              <>
                {section.fields && Object.keys(section.fields).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Field Analysis</h4>
                    <div className="space-y-2">
                      {Object.entries(section.fields).slice(0, 10).map(([field, fieldData]) => (
                        <div key={field} className="flex items-center gap-3">
                          <span className="text-sm w-32 text-gray-600 truncate">{field.replace(/_/g, ' ')}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(fieldData.scores?.mean || 0) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium w-14">{formatPercent(fieldData.scores?.mean || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* v10: ALWAYS show Accuracy/Quality Metrics - components handle empty state internally */}
                <DetailedAccuracyMetrics 
                  componentName={section.id} 
                  papers={uniqueIntegratedPapers}
                  aggregatedMetrics={section.accuracyMetrics}
                />
                
                <DetailedQualityMetrics 
                  componentName={section.id} 
                  papers={uniqueIntegratedPapers}
                  aggregatedMetrics={section.qualityMetrics}
                />

                {/* v10: Paper-Level Analysis with improved filtering */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    Paper-Level Analysis
                    <Badge variant="outline" className="text-xs">
                      {filteredPapers.length} papers with data
                    </Badge>
                  </h4>
                  {filteredPapers.length > 0 ? (
                    <PaperListWithDrillDown
                      papers={filteredPapers}
                      componentName={section.id}
                      showDetailsButton={false}
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                      <Info className="h-4 w-4 inline mr-2" />
                      No papers with {section.label} evaluation data found.
                      <div className="mt-2 text-xs">
                        This could mean:
                        <ul className="list-disc list-inside mt-1">
                          <li>Evaluations don't include {section.label.toLowerCase()} component data</li>
                          <li>Data is stored in a different format</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    );
  };

  if (!useAggregatedData || !componentData || componentData.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No component data available for section analysis.</AlertDescription>
      </Alert>
    );
  }

  const comparativeData = [...componentData].sort((a, b) => {
    const aValue = a.scores?.[selectedMetric] || 0;
    const bValue = b.scores?.[selectedMetric] || 0;
    return bValue - aValue;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Component Analysis</h2>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Final Weighted Scores
          </Badge>
        </div>
        <p className="text-gray-600 mt-1">
          Detailed breakdown showing automated metrics, user ratings, and final weighted scores.
        </p>
        
        {integratedData && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <Badge variant="outline" className="bg-blue-50">{globalPaperStats.uniquePapers} unique papers</Badge>
            <Badge variant="outline">{globalPaperStats.totalEvaluations} total evaluations</Badge>
            {globalPaperStats.papersWithGT > 0 && (
              <Badge variant="outline" className="bg-green-50">{globalPaperStats.papersWithGT} with ground truth</Badge>
            )}
          </div>
        )}
      </div>

      {/* Component Comparison */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Component Comparison</h3>
            <p className="text-xs text-gray-500 mt-1">
              Compare automated vs user rating influence on final scores
            </p>
          </div>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(metricLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        {/* Column Headers */}
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-600">
          <div className="w-40">Component</div>
          <div className="w-40 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 rounded text-blue-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Automated
            </span>
            <span className="px-2 py-0.5 bg-yellow-100 rounded text-yellow-700 flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500" />
              User Rating
            </span>
          </div>
          <div className="flex-1 text-center">Score Distribution</div>
          <div className="w-20 text-center">Final</div>
          <div className="w-20 text-center">Quality</div>
        </div>
        
        <div className="space-y-3">
          {comparativeData.map((section, index) => {
            const value = section.scores?.[selectedMetric] || 0;
            const qualityLevel = section.qualityLevel || getQualityLevel(section.scores?.mean || 0);
            const IconComponent = section.icon;
            
            return (
              <div key={section.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-40">
                  <span className="text-sm font-medium text-gray-600 w-6">{index + 1}.</span>
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${section.color}20` }}
                  >
                    <IconComponent className="h-3 w-3" style={{ color: section.color }} />
                  </div>
                  <span className="text-sm truncate capitalize">{section.label}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs w-40">
                  <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-700 font-mono">
                    {formatPercent(section.automatedScore || 0)}
                  </span>
                  {section.hasUserRatings ? (
                    <span className="px-2 py-0.5 bg-yellow-50 rounded text-yellow-700 font-mono flex items-center gap-1">
                      <Star className="h-2 w-2 fill-yellow-500" />
                      {formatPercent(section.userRatingScore || 0)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-50 rounded text-gray-400 font-mono">—</span>
                  )}
                </div>
                
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${value * 100}%`,
                      backgroundColor: section.color
                    }}
                  />
                  {section.hasUserRatings && section.userRatingScore && (
                    <div 
                      className="absolute top-0 h-full w-1 bg-yellow-500 rounded"
                      style={{ left: `${(section.userRatingScore || 0) * 100}%` }}
                      title={`User Rating: ${formatPercent(section.userRatingScore)}`}
                    />
                  )}
                </div>
                
                <div className="w-20 text-right">
                  <Badge className={getMetricColor(value)}>
                    {formatMetricValue(value, selectedMetric)}
                  </Badge>
                </div>
                
                <div className="w-20 text-center">
                  <Badge variant="outline" className={`text-xs capitalize ${getQualityLevelColor(qualityLevel)}`}>
                    {qualityLevel}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Section Cards */}
      <div className="grid gap-4">
        {componentData.map(section => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
};

export default SectionAnalysis;