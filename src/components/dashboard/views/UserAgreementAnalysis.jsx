// src/components/dashboard/views/UserAgreementAnalysis.jsx
// REFACTORED - Pure UI Component
// All calculations moved to userAgreementService.js
// Consistent with OverviewMetrics data structure

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Users, AlertTriangle, Info, CheckCircle, XCircle, 
  BarChart3, Target, Award, Scale, GitCompare, Database,
  BookOpen, ChevronDown, ChevronUp, Lightbulb, Calculator,
  FileText, Layers, Activity,
  ArrowUpRight, ArrowDownRight, Percent, HelpCircle
} from 'lucide-react';

// Import the service for calculations
import userAgreementService from '../../../services/userAgreementService';

// ============ HELPER COMPONENTS ============

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

// Interpretation Box Component
const InterpretationBox = ({ children, type = 'info', title }) => {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    insight: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  };
  
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${colors[type]}`}>
      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        {title && <strong className="block mb-1">{title}</strong>}
        {children}
      </div>
    </div>
  );
};

// Kappa Interpretation Scale Component
const KappaScale = ({ value }) => {
  const position = Math.min(Math.max((value + 0.1) / 1.1 * 100, 0), 100);
  
  return (
    <div className="mt-3">
      <div className="relative h-4 rounded-full overflow-hidden flex">
        <div className="flex-1 bg-red-500" />
        <div className="flex-1 bg-red-400" />
        <div className="flex-1 bg-orange-400" />
        <div className="flex-1 bg-yellow-400" />
        <div className="flex-1 bg-green-400" />
        <div className="flex-1 bg-green-600" />
      </div>
      <div className="relative h-6">
        <div 
          className="absolute transform -translate-x-1/2"
          style={{ left: `${position}%` }}
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-gray-800 mx-auto" />
          <span className="text-xs font-bold">{value.toFixed(3)}</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Poor</span>
        <span>Slight</span>
        <span>Fair</span>
        <span>Moderate</span>
        <span>Substantial</span>
        <span>Perfect</span>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============

const UserAgreementAnalysis = ({ aggregatedData, integratedData }) => {
  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreMode, setScoreMode] = useState('accuracy'); // 'accuracy' or 'quality'

  // Calculate agreement metrics using the service
  useEffect(() => {
    const calculateMetrics = () => {
      setLoading(true);
      try {
        const intSource = integratedData?.papers || window.threeWayIntegratedDataDebug?.papers || [];
        
        if (intSource.length === 0 && !aggregatedData) {
          setAgreementData(null);
          return;
        }
        
        const metrics = userAgreementService.calculateAgreementMetrics(
          { papers: intSource },
          aggregatedData
        );
        
        setAgreementData(metrics);
      } catch (error) {
        console.error('Error calculating agreement metrics:', error);
        setAgreementData(null);
      } finally {
        setLoading(false);
      }
    };
    
    calculateMetrics();
  }, [integratedData, aggregatedData]);

  // ============ RENDER LOADING STATE ============
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Calculating agreement metrics...</span>
        </div>
      </Card>
    );
  }

  // ============ RENDER NO DATA STATE ============
  if (!agreementData || (agreementData.evaluatorsData.length === 0 && agreementData.paperEvaluations.length === 0)) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No evaluation data available for agreement analysis.
        </AlertDescription>
      </Alert>
    );
  }

  // Destructure data from service
  const {
    evaluatorsData,
    paperEvaluations,
    analysisMode,
    hasMultiEvaluatorData,
    multiEvalPaperCount,
    fleissKappa,
    componentKappa,
    varianceAgreement,
    expertiseAgreement,
    orkgAgreement,
    paperAnalysis,
    evaluatorConsistency,
    pairwiseAgreement,
    ratingDistribution,
    crossPaperConsistency,
    overallStats,
    componentKeys,
    componentLabels
  } = agreementData;

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Agreement Analysis</h2>
          <p className="text-gray-600 mt-1">
            {analysisMode === 'inter-rater' 
              ? 'Comprehensive inter-rater reliability and consensus analysis'
              : 'Cross-paper consistency and rating pattern analysis'}
          </p>
        </div>
        {hasMultiEvaluatorData ? (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 border border-green-300">
            <Scale className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Inter-Rater Agreement Analysis</span>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-green-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Analyzes agreement between multiple evaluators rating the same papers using Fleiss' Kappa and variance-based metrics.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-300">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Cross-Paper Consistency Analysis</span>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-blue-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Analyzes how consistently evaluators rate system performance across different papers.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Evaluator Notice */}
      {multiEvalPaperCount > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="font-medium text-green-800">Multi-Evaluator Data Available</p>
            <p className="text-sm text-green-700 mt-1">
              {multiEvalPaperCount} of {paperEvaluations.length} papers have multiple evaluators
              {hasMultiEvaluatorData 
                ? ', enabling full inter-rater agreement analysis.'
                : '. Need 2+ shared papers for full inter-rater analysis; showing cross-paper consistency instead.'}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Evaluators</p>
              <p className="text-2xl font-bold text-blue-600">{overallStats.totalEvaluators}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Unique Papers</p>
              <p className="text-2xl font-bold text-green-600">{paperEvaluations.length}</p>
            </div>
            <FileText className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Evaluations</p>
              <p className="text-2xl font-bold text-purple-600">
                {paperEvaluations.reduce((sum, p) => sum + p.evaluations.length, 0)}
              </p>
            </div>
            <Layers className="h-8 w-8 text-purple-400" />
          </div>
        </Card>

        <Card className={`p-4 border-l-4 ${multiEvalPaperCount > 0 ? 'border-l-pink-500 bg-pink-50' : 'border-l-gray-400'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Shared Papers</p>
              <p className={`text-2xl font-bold ${multiEvalPaperCount > 0 ? 'text-pink-600' : 'text-gray-400'}`}>
                {multiEvalPaperCount}
              </p>
              <p className="text-xs text-gray-500">multi-evaluator</p>
            </div>
            <GitCompare className={`h-8 w-8 ${multiEvalPaperCount > 0 ? 'text-pink-400' : 'text-gray-300'}`} />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">
                {hasMultiEvaluatorData ? "Fleiss' Kappa" : 'Consistency'}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {hasMultiEvaluatorData 
                  ? (fleissKappa.kappa !== null ? fleissKappa.kappa.toFixed(3) : 'N/A')
                  : `${((crossPaperConsistency?.consistencyScore || 0) * 100).toFixed(0)}%`}
              </p>
              <p className="text-xs text-gray-500">
                {hasMultiEvaluatorData 
                  ? fleissKappa.interpretation
                  : crossPaperConsistency?.consistencyLevel || 'N/A'}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-orange-400" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">
                {hasMultiEvaluatorData ? 'Variance Agreement' : 'CV (Variability)'}
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {hasMultiEvaluatorData 
                  ? `${((varianceAgreement?.overall?.agreement || 0) * 100).toFixed(1)}%`
                  : `${(crossPaperConsistency?.overall?.cv || 0).toFixed(1)}%`}
              </p>
            </div>
            <Percent className="h-8 w-8 text-indigo-400" />
          </div>
        </Card>
      </div>

      {/* ============ CONDITIONAL SECTIONS BASED ON ANALYSIS MODE ============ */}
      
      {hasMultiEvaluatorData ? (
        // INTER-RATER MODE
        <>
          {/* Fleiss' Kappa Section */}
          <Card className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calculator className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-900">Fleiss' Kappa - Inter-Rater Reliability</h3>
                <p className="text-sm text-orange-700">Standard statistical measure for multiple raters</p>
              </div>
              <Badge className="ml-auto bg-orange-500 text-white">Academic Standard</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-orange-600">
                    κ = {fleissKappa.kappa !== null ? fleissKappa.kappa.toFixed(3) : 'N/A'}
                  </span>
                  <Badge className={`${
                    fleissKappa.kappa >= 0.6 ? 'bg-green-500' : 
                    fleissKappa.kappa >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  } text-white`}>
                    {fleissKappa.interpretation}
                  </Badge>
                </div>
                
                {fleissKappa.kappa !== null && <KappaScale value={fleissKappa.kappa} />}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <p className="text-xs text-gray-500">Observed Agreement (P̄)</p>
                  <p className="text-xl font-bold text-gray-800">
                    {fleissKappa.P_bar?.toFixed(4) || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <p className="text-xs text-gray-500">Expected Agreement (P̄e)</p>
                  <p className="text-xl font-bold text-gray-800">
                    {fleissKappa.P_e?.toFixed(4) || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <p className="text-xs text-gray-500">Papers × Raters</p>
                  <p className="text-xl font-bold text-gray-800">
                    {fleissKappa.n} × {fleissKappa.k}+
                  </p>
                </div>
              </div>
            </div>

            <InterpretationBox type="insight" title="Interpretation">
              <ul className="space-y-1 text-xs">
                <li>• <strong>Fleiss' Kappa</strong> measures agreement beyond chance among multiple raters.</li>
                <li>• A κ of <strong>{fleissKappa.kappa?.toFixed(3)}</strong> indicates <strong>{fleissKappa.interpretation?.toLowerCase()}</strong>.</li>
                <li>• Values: &lt;0.2 (slight), 0.2-0.4 (fair), 0.4-0.6 (moderate), 0.6-0.8 (substantial), &gt;0.8 (almost perfect).</li>
              </ul>
            </InterpretationBox>
          </Card>

          {/* Paper-Level Agreement */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Paper-Level Agreement Analysis</h3>
                  <p className="text-sm text-gray-600">Compare evaluator scores for shared papers</p>
                </div>
              </div>
              
              {/* Toggle Button for Accuracy vs Quality */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setScoreMode('accuracy')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    scoreMode === 'accuracy' 
                      ? 'bg-blue-500 text-white shadow' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Target className="h-4 w-4" />
                  Accuracy
                </button>
                <button
                  onClick={() => setScoreMode('quality')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    scoreMode === 'quality' 
                      ? 'bg-purple-500 text-white shadow' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  Quality
                </button>
              </div>
            </div>

            {/* Score Explanation Box */}
            <div className={`mb-4 p-3 rounded-lg border ${scoreMode === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold mb-1">
                    {scoreMode === 'accuracy' ? 'Accuracy Score' : 'Quality Score'} - How it's calculated:
                  </p>
                  <p className="mb-2">
                    <strong>Final Score = (Automated × 60%) + (User Rating × 40%)</strong>
                  </p>
                  <ul className="space-y-1 text-gray-700">
                    {scoreMode === 'accuracy' ? (
                      <>
                        <li>• <strong>Accuracy</strong> measures how well extracted values match the ground truth (ORKG reference data)</li>
                        <li>• <strong>Automated Score:</strong> Calculated using Levenshtein distance, token matching, and field-specific metrics</li>
                        <li>• <strong>User Rating:</strong> Evaluator's assessment of extraction correctness (normalized to 0-1 scale)</li>
                      </>
                    ) : (
                      <>
                        <li>• <strong>Quality</strong> measures completeness, consistency, and validity of extracted data</li>
                        <li>• <strong>Automated Score:</strong> Checks for missing fields, format consistency, and data validity</li>
                        <li>• <strong>User Rating:</strong> Evaluator's assessment of output quality (normalized to 0-1 scale)</li>
                      </>
                    )}
                  </ul>
                  <p className="mt-2 text-gray-500 italic">
                    These scores are identical to those shown in the Overview tab for consistency.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Distribution */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{paperAnalysis.highAgreement.length}</p>
                <p className="text-xs text-gray-600">High Agreement</p>
                <p className="text-xs text-green-600">Variance &lt; 0.01</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{paperAnalysis.mediumAgreement.length}</p>
                <p className="text-xs text-gray-600">Medium Agreement</p>
                <p className="text-xs text-blue-600">Variance 0.01-0.05</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{paperAnalysis.lowAgreement.length}</p>
                <p className="text-xs text-gray-600">Low Agreement</p>
                <p className="text-xs text-yellow-600">Variance 0.05-0.1</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{paperAnalysis.disagreement.length}</p>
                <p className="text-xs text-gray-600">Disagreement</p>
                <p className="text-xs text-red-600">Variance &gt; 0.1</p>
              </div>
            </div>

            {/* Shared Paper Score Comparison */}
            <div className="mb-6">
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${scoreMode === 'accuracy' ? 'text-blue-700' : 'text-purple-700'}`}>
                <Users className="h-4 w-4" />
                Shared Paper {scoreMode === 'accuracy' ? 'Accuracy' : 'Quality'} Score Comparison
              </h4>
              <div className="space-y-4">
                {paperEvaluations
                  .filter(p => p.evaluations.length >= 2)
                  .map((paper, idx) => {
                    // Get scores based on current mode
                    const getScore = (e) => scoreMode === 'accuracy' 
                      ? (e.overallAccuracy ?? e.overallScore) 
                      : (e.overallQuality ?? e.overallScore);
                    
                    const scores = paper.evaluations.map(e => getScore(e)).filter(s => s > 0);
                    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                    const variance = scores.length > 1 
                      ? scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length 
                      : 0;
                    
                    // Determine agreement level for styling
                    const agreementLevel = variance < 0.01 ? 'high' : variance < 0.05 ? 'medium' : variance < 0.1 ? 'low' : 'disagreement';
                    const borderColors = {
                      high: 'border-green-300 bg-green-50',
                      medium: 'border-blue-300 bg-blue-50',
                      low: 'border-yellow-300 bg-yellow-50',
                      disagreement: 'border-red-300 bg-red-50'
                    };
                    
                    return (
                      <div 
                        key={paper.paperId} 
                        className={`p-4 rounded-lg border-2 ${borderColors[agreementLevel]}`}
                      >
                        {/* Paper Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">{paper.title}</p>
                            <div className="flex gap-3 mt-1 text-xs">
                              {paper.doi && (
                                <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  DOI↗
                                </a>
                              )}
                              {paper.orkgId && (
                                <a href={`https://orkg.org/paper/${paper.orkgId}`} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'rgb(232, 97, 97)' }}>
                                  ORKG ({paper.orkgId})↗
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-lg font-bold ${scoreMode === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
                              {(avgScore * 100).toFixed(1)}%
                            </div>
                            <p className="text-xs text-gray-500">avg {scoreMode}</p>
                          </div>
                        </div>
                        
                        {/* Evaluator Scores Table */}
                        <div className="bg-white rounded-lg border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Evaluator</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-600">Expertise</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-500">Automated</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-500">User Rating</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-600">
                                  Final {scoreMode === 'accuracy' ? 'Acc.' : 'Qual.'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {paper.evaluations.map((evalItem, eIdx) => {
                                const finalScore = getScore(evalItem);
                                // Use quality automated in quality mode, accuracy automated in accuracy mode
                                const automatedScore = scoreMode === 'quality' 
                                  ? (evalItem.avgQualityAutomated ?? evalItem.avgAutomated)
                                  : evalItem.avgAutomated;
                                const userRating = evalItem.avgUserRating;
                                
                                return (
                                  <tr key={eIdx} className={eIdx % 2 === 1 ? 'bg-gray-50' : ''}>
                                    <td className="py-2 px-3">
                                      <span className="font-medium text-gray-800">{evalItem.evaluatorName}</span>
                                    </td>
                                    <td className="text-center py-2 px-2">
                                      <Badge variant="outline" className="text-xs">
                                        {(evalItem.expertiseWeight || 1).toFixed(1)}×
                                      </Badge>
                                    </td>
                                    <td className="text-center py-2 px-2 font-mono text-gray-500">
                                      {automatedScore !== null && !isNaN(automatedScore) ? `${(automatedScore * 100).toFixed(0)}%` : '—'}
                                    </td>
                                    <td className="text-center py-2 px-2 font-mono text-gray-500">
                                      {userRating !== null && !isNaN(userRating) ? (
                                        <span>
                                          {(userRating * 100).toFixed(0)}%
                                          <span className="text-gray-400 ml-1">({(userRating * 5).toFixed(1)}/5)</span>
                                        </span>
                                      ) : '—'}
                                    </td>
                                    <td className="text-center py-2 px-2">
                                      <span className={`font-mono font-bold ${
                                        finalScore >= 0.8 ? 'text-green-600' : 
                                        finalScore >= 0.6 ? (scoreMode === 'accuracy' ? 'text-blue-600' : 'text-purple-600') : 
                                        finalScore >= 0.4 ? 'text-amber-600' : 'text-red-600'
                                      }`}>
                                        {(finalScore * 100).toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Score Calculation Note */}
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          <span>Final = (Auto × 60%) + (User × 40%) | Variance: {variance.toFixed(4)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* No shared papers message */}
            {paperEvaluations.filter(p => p.evaluations.length >= 2).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <GitCompare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No papers with multiple evaluators found.</p>
                <p className="text-sm mt-1">Inter-rater comparison requires at least 2 evaluators per paper.</p>
              </div>
            )}

            <InterpretationBox type="insight" title="Understanding Agreement Levels">
              <ul className="space-y-1 text-xs">
                <li>• <strong>High Agreement (Variance &lt; 0.01):</strong> Evaluators gave very similar scores - high reliability.</li>
                <li>• <strong>Medium Agreement (0.01-0.05):</strong> Minor differences in evaluator scores - acceptable reliability.</li>
                <li>• <strong>Low Agreement (0.05-0.1):</strong> Noticeable differences - may need review or calibration.</li>
                <li>• <strong>Disagreement (&gt; 0.1):</strong> Significant scoring differences - requires investigation.</li>
                <li className="mt-2">• <strong>Tip:</strong> Use the Accuracy/Quality toggle to compare how evaluators agree on different aspects of the evaluation.</li>
              </ul>
            </InterpretationBox>
          </Card>
        </>
      ) : (
        // CROSS-PAPER MODE
        <>
          {/* Cross-Paper Consistency */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Cross-Paper Rating Consistency</h3>
                <p className="text-sm text-blue-700">How consistently do evaluators rate across different papers?</p>
              </div>
              <Badge className="ml-auto bg-blue-500 text-white">Alternative Metric</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-bold text-blue-600">
                    {crossPaperConsistency?.consistencyLevel || 'N/A'}
                  </span>
                  <span className="text-2xl text-gray-500">Consistency</span>
                  <Badge className={`${
                    crossPaperConsistency?.consistencyLevel === 'High' ? 'bg-green-500' :
                    crossPaperConsistency?.consistencyLevel === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'
                  } text-white`}>
                    CV = {(crossPaperConsistency?.overall?.cv || 0).toFixed(1)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-500">Mean Score</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((crossPaperConsistency?.overall?.mean || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-500">Std Deviation</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ±{((crossPaperConsistency?.overall?.std || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-500">Coefficient of Variation</p>
                  <p className="text-xl font-bold text-gray-800">
                    {(crossPaperConsistency?.overall?.cv || 0).toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-500">Evaluations Analyzed</p>
                  <p className="text-xl font-bold text-gray-800">
                    {crossPaperConsistency?.overall?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            <InterpretationBox type="insight" title="What is Cross-Paper Consistency?">
              <ul className="space-y-1 text-xs">
                <li>• <strong>Coefficient of Variation (CV)</strong> measures relative variability.</li>
                <li>• CV &lt; 15% = High consistency, CV 15-25% = Moderate, CV &gt; 25% = Low</li>
                <li>• Your CV of <strong>{(crossPaperConsistency?.overall?.cv || 0).toFixed(1)}%</strong> indicates <strong>{crossPaperConsistency?.consistencyLevel?.toLowerCase()}</strong> consistency.</li>
              </ul>
            </InterpretationBox>
          </Card>

          {/* Expertise Tier Patterns */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Scale className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Rating Patterns by Expertise Level</h3>
                <p className="text-sm text-gray-600">Do experts and juniors rate similarly on average?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(crossPaperConsistency?.byTier || {}).map(([tier, data]) => {
                const colors = {
                  expert: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500' },
                  senior: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
                  intermediate: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-500' },
                  junior: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', bar: 'bg-gray-500' }
                };
                const c = colors[tier] || colors.junior;
                
                return (
                  <div key={tier} className={`p-4 rounded-lg border ${c.bg} ${c.border}`}>
                    <p className={`text-sm font-semibold capitalize ${c.text} mb-2`}>{tier}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(data.mean * 100).toFixed(1)}%
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${data.mean * 100}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ±{(data.std * 100).toFixed(1)}% • {data.count} evals
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ORKG Experience Impact */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(232, 97, 97, 0.1)' }}>
                <Database className="h-5 w-5" style={{ color: 'rgb(232, 97, 97)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">ORKG Experience Impact on Ratings</h3>
                <p className="text-sm text-gray-600">Do evaluators with ORKG experience rate differently?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* With ORKG */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(232, 97, 97, 0.05)', borderColor: 'rgba(232, 97, 97, 0.3)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" style={{ color: 'rgb(232, 97, 97)' }} />
                    <span className="font-semibold" style={{ color: 'rgb(180, 60, 60)' }}>With ORKG Experience</span>
                  </div>
                  <Badge style={{ backgroundColor: 'rgb(232, 97, 97)', color: 'white' }}>
                    {crossPaperConsistency?.byOrkg?.withOrkg?.count || 0} evals
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-2">
                  {crossPaperConsistency?.byOrkg?.withOrkg?.mean 
                    ? `${(crossPaperConsistency.byOrkg.withOrkg.mean * 100).toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>

              {/* Without ORKG */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-gray-500" />
                    <span className="font-semibold text-gray-700">Without ORKG Experience</span>
                  </div>
                  <Badge variant="secondary">
                    {crossPaperConsistency?.byOrkg?.withoutOrkg?.count || 0} evals
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-2">
                  {crossPaperConsistency?.byOrkg?.withoutOrkg?.mean 
                    ? `${(crossPaperConsistency.byOrkg.withoutOrkg.mean * 100).toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          {/* Component Consistency */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Component-Level Rating Consistency</h3>
                <p className="text-sm text-gray-600">Which components show most consistent ratings?</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Component</th>
                    <th className="text-center py-3 px-3 font-semibold text-blue-600">Mean Score</th>
                    <th className="text-center py-3 px-3 font-semibold text-purple-600">Std Dev</th>
                    <th className="text-center py-3 px-3 font-semibold text-orange-600">CV %</th>
                    <th className="text-center py-3 px-3 font-semibold text-green-600">Consistency</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-600">Evals</th>
                  </tr>
                </thead>
                <tbody>
                  {componentKeys.map((compKey, idx) => {
                    const data = crossPaperConsistency?.byComponent?.[compKey];
                    if (!data) return null;
                    
                    const consistencyLevel = data.cv < 15 ? 'High' : data.cv < 25 ? 'Moderate' : 'Low';
                    const consistencyColor = data.cv < 15 ? 'bg-green-100 text-green-700' : 
                                            data.cv < 25 ? 'bg-yellow-100 text-yellow-700' : 
                                            'bg-red-100 text-red-700';
                    
                    return (
                      <tr key={compKey} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-3 px-3 font-medium">{componentLabels[compKey]}</td>
                        <td className="text-center py-3 px-3 font-mono font-semibold text-blue-600">
                          {(data.mean * 100).toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-3 font-mono text-purple-600">
                          ±{(data.std * 100).toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-3 font-mono text-orange-600">
                          {data.cv.toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-3">
                          <Badge className={`text-xs ${consistencyColor}`}>{consistencyLevel}</Badge>
                        </td>
                        <td className="text-center py-3 px-3 text-gray-600">{data.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============ RATING DISTRIBUTION (BOTH MODES) ============ */}
      {ratingDistribution && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Rating Distribution Analysis</h3>
              <p className="text-sm text-gray-600">How are ratings distributed across evaluations?</p>
            </div>
          </div>

          {/* Histogram */}
          <div className="mb-6">
            <div className="flex items-end justify-between h-40 gap-2">
              {ratingDistribution.bins.map((bin, idx) => {
                const maxCount = Math.max(...ratingDistribution.bins.map(b => b.count), 1);
                const height = (bin.count / maxCount) * 100;
                const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600'];
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <span className="text-xs font-medium mb-1">{bin.count}</span>
                    <div 
                      className={`w-full ${colors[idx]} rounded-t transition-all`}
                      style={{ height: `${height}%`, minHeight: bin.count > 0 ? '8px' : '0px' }}
                    />
                    <span className="text-xs text-gray-600 mt-2">{bin.range}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Mean</p>
              <p className="text-xl font-bold text-gray-800">{((ratingDistribution?.stats?.mean || 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Std Dev</p>
              <p className="text-xl font-bold text-gray-800">{((ratingDistribution?.stats?.std || 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Skewness</p>
              <p className="text-xl font-bold text-gray-800">{(ratingDistribution?.stats?.skewness || 0).toFixed(3)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Kurtosis</p>
              <p className="text-xl font-bold text-gray-800">{(ratingDistribution?.stats?.kurtosis || 0).toFixed(3)}</p>
            </div>
          </div>

          <InterpretationBox type="info" title="Distribution Interpretation">
            <ul className="space-y-1 text-xs">
              <li>• <strong>Skewness:</strong> {
                (ratingDistribution?.stats?.skewness || 0) > 0.5 ? 'Right-skewed - tendency toward lower ratings.' :
                (ratingDistribution?.stats?.skewness || 0) < -0.5 ? 'Left-skewed - tendency toward higher ratings.' :
                'Approximately symmetric distribution.'
              }</li>
              <li>• <strong>Range:</strong> {((ratingDistribution?.stats?.min || 0) * 100).toFixed(1)}% to {((ratingDistribution?.stats?.max || 0) * 100).toFixed(1)}% across {ratingDistribution?.stats?.count || 0} evaluations.</li>
            </ul>
          </InterpretationBox>
        </Card>
      )}

      {/* ============ EVALUATOR TABLE (BOTH MODES) ============ */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {hasMultiEvaluatorData ? 'Evaluator Consistency Analysis' : 'Evaluator Profile Summary'}
              </h3>
              <p className="text-sm text-gray-600">
                {hasMultiEvaluatorData 
                  ? 'Individual evaluator reliability and agreement patterns'
                  : 'Overview of evaluator characteristics and their ratings'}
              </p>
            </div>
          </div>
          
          {/* Toggle Button for Accuracy vs Quality */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setScoreMode('accuracy')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                scoreMode === 'accuracy' 
                  ? 'bg-blue-500 text-white shadow' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Target className="h-4 w-4" />
              Accuracy
            </button>
            <button
              onClick={() => setScoreMode('quality')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                scoreMode === 'quality' 
                  ? 'bg-purple-500 text-white shadow' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Award className="h-4 w-4" />
              Quality
            </button>
          </div>
        </div>

        {/* Score Mode Explanation */}
        <div className={`mb-4 p-3 rounded-lg border ${scoreMode === 'accuracy' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold mb-1">
                Showing {scoreMode === 'accuracy' ? 'Accuracy' : 'Quality'} Scores
              </p>
              <p>
                {scoreMode === 'accuracy' 
                  ? 'Accuracy measures how well extracted values match the ground truth (ORKG reference data).'
                  : 'Quality measures completeness, consistency, and validity of extracted data.'}
              </p>
              <p className="mt-1 text-gray-500">
                Formula: <strong>Final = (Automated × 60%) + (User Rating × 40%)</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {(() => {
            // Build comprehensive paper info map from paperEvaluations (already grouped by DOI)
            const paperInfoMap = new Map();
            const evaluatorToPapers = new Map();
            const sharedPaperGroups = []; // Papers with 2+ evaluators
            
            paperEvaluations.forEach(paper => {
              const doi = paper.doi || paper.paperId;
              const title = paper.title || 'Untitled Paper';
              const orkgId = paper.orkgId || null;
              
              paperInfoMap.set(doi, { 
                doi, 
                title, 
                orkgId,
                evaluatorCount: paper.evaluations.length,
                evaluatorNames: paper.evaluations.map(e => e.evaluatorName)
              });
              
              // Track which papers each evaluator assessed - include both accuracy and quality scores
              paper.evaluations.forEach(evalItem => {
                if (!evaluatorToPapers.has(evalItem.evaluatorId)) {
                  evaluatorToPapers.set(evalItem.evaluatorId, []);
                }
                evaluatorToPapers.get(evalItem.evaluatorId).push({
                  doi,
                  title: title.substring(0, 35) + (title.length > 35 ? '...' : ''),
                  orkgId,
                  // Store both scores for mode switching
                  accuracyScore: evalItem.overallAccuracy ?? evalItem.overallScore,
                  qualityScore: evalItem.overallQuality ?? evalItem.overallScore,
                  score: evalItem.overallScore, // backward compatibility
                  partners: paper.evaluations.filter(e => e.evaluatorId !== evalItem.evaluatorId).map(e => e.evaluatorName)
                });
              });
              
              // Track shared papers (2+ evaluators)
              if (paper.evaluations.length >= 2) {
                sharedPaperGroups.push({
                  doi,
                  title: title.substring(0, 30) + (title.length > 30 ? '...' : ''),
                  evaluators: paper.evaluations.map(e => e.evaluatorName)
                });
              }
            });

            // Color coding for shared paper groups
            const sharedPaperColors = [
              'bg-purple-100 border-purple-300 text-purple-800', 
              'bg-cyan-100 border-cyan-300 text-cyan-800', 
              'bg-pink-100 border-pink-300 text-pink-800',
              'bg-amber-100 border-amber-300 text-amber-800'
            ];
            const doiColorMap = new Map(sharedPaperGroups.map((p, i) => [p.doi, sharedPaperColors[i % sharedPaperColors.length]]));

            return (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left py-2 px-2 font-semibold">Evaluator</th>
                    <th className="text-center py-2 px-2 font-semibold">Role</th>
                    <th className="text-center py-2 px-2 font-semibold">Expertise</th>
                    <th className="text-center py-2 px-2 font-semibold">ORKG Exp.</th>
                    <th className="text-left py-2 px-2 font-semibold">Paper(s) Evaluated</th>
                    <th className={`text-center py-2 px-2 font-semibold ${scoreMode === 'accuracy' ? 'text-blue-700' : 'text-purple-700'}`}>
                      {scoreMode === 'accuracy' ? 'Accuracy' : 'Quality'}
                    </th>
                    <th className="text-center py-2 px-2 font-semibold">Another Evaluater</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluatorsData.slice(0, 20).map((evaluator, idx) => {
                    const evalName = evaluator.name || 'Unknown';
                    const papers = evaluatorToPapers.get(evaluator.id) || [];
                    
                    // Calculate mean score based on selected mode
                    const scores = scoreMode === 'accuracy' 
                      ? (evaluator.scores?.accuracy || [])
                      : (evaluator.scores?.quality || []);
                    const meanScore = scores.length > 0 
                      ? scores.reduce((a, b) => a + b, 0) / scores.length 
                      : 0;
                    
                    // Check if evaluator has shared papers
                    const sharedPapers = papers.filter(p => p.partners.length > 0);
                    const hasSharedPaper = sharedPapers.length > 0;
                    
                    // Get row highlight color if evaluator shares papers
                    const rowHighlight = hasSharedPaper ? doiColorMap.get(sharedPapers[0].doi) : '';
                    
                    return (
                      <tr 
                        key={evaluator.id} 
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${hasSharedPaper ? 'border-l-4 ' + (rowHighlight?.split(' ')[1] || 'border-purple-300') : ''}`}
                      >
                        <td className="py-2 px-2 font-medium">
                          <div className="flex items-center gap-1">
                            {evalName}
                            {hasSharedPaper && (
                              <span className="text-purple-600 text-xs font-bold" title="Evaluated shared paper">★</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-2 px-2 text-xs">
                          {evaluator.profile?.role || 'N/A'}
                        </td>
                        <td className="text-center py-2 px-2">
                          <Badge variant="outline" className="text-xs">
                            {(evaluator.profile?.expertiseWeight || 1).toFixed(2)}
                          </Badge>
                        </td>
                        <td className="text-center py-2 px-2">
                          {evaluator.profile?.orkgExperience === 'used' ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-2 px-2 max-w-xs">
                          {papers.length === 0 ? (
                            <span className="text-gray-400 text-xs">No papers</span>
                          ) : (
                            <div className="space-y-1">
                              {papers.slice(0, 2).map((paper, pIdx) => {
                                // Get score based on current mode
                                const paperScore = scoreMode === 'accuracy' 
                                  ? (paper.accuracyScore ?? paper.score)
                                  : (paper.qualityScore ?? paper.score);
                                
                                return (
                                  <div key={pIdx} className={`text-xs p-1 rounded ${paper.partners.length > 0 ? doiColorMap.get(paper.doi)?.split(' ')[0] || 'bg-purple-50' : 'bg-gray-50'}`}>
                                    <div className="font-medium text-gray-800 truncate" title={paper.title}>
                                      {paper.title}
                                    </div>
                                    <div className="flex gap-2 mt-0.5">
                                      {paper.doi && (
                                        <a 
                                          href={`https://doi.org/${paper.doi}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          DOI↗
                                        </a>
                                      )}
                                      {paper.orkgId && (
                                        <a 
                                          href={`https://orkg.org/paper/${paper.orkgId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:underline"
                                          style={{ color: 'rgb(232, 97, 97)' }}
                                        >
                                          ORKG↗
                                        </a>
                                      )}
                                      <span className={`${scoreMode === 'accuracy' ? 'text-blue-600' : 'text-purple-600'}`}>
                                        ({paperScore && !isNaN(paperScore) ? (paperScore * 100).toFixed(0) : '—'}%)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {papers.length > 2 && (
                                <div className="text-xs text-gray-500">+{papers.length - 2} more</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-2 px-2 font-mono font-medium">
                          <span className={`${
                            meanScore >= 0.8 ? 'text-green-600' : 
                            meanScore >= 0.6 ? (scoreMode === 'accuracy' ? 'text-blue-600' : 'text-purple-600') : 
                            meanScore >= 0.4 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {(meanScore * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-2 px-2">
                          {hasSharedPaper ? (
                            <div className="group relative">
                              <Badge className={`text-xs cursor-help ${doiColorMap.get(sharedPapers[0].doi)?.split(' ').slice(0, 2).join(' ') || 'bg-purple-100 text-purple-700'}`}>
                                {sharedPapers[0].partners.join(', ').substring(0, 15)}
                                {sharedPapers[0].partners.join(', ').length > 15 ? '...' : ''}
                              </Badge>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-20 w-64">
                                <p className="font-semibold mb-1">Shared Evaluations:</p>
                                {sharedPapers.map((sp, i) => (
                                  <div key={i} className="mb-1 pb-1 border-b border-gray-700 last:border-0">
                                    <p className="text-gray-300 truncate">{sp.title}</p>
                                    <p>Partners: <span className="text-yellow-300">{sp.partners.join(', ')}</span></p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>

        <InterpretationBox type="info" title="Understanding the Evaluator Table">
          <ul className="space-y-1 text-xs">
            <li>• <strong>Paper(s) Evaluated:</strong> Shows the paper title, with links to DOI and ORKG. The score in parentheses shows the {scoreMode === 'accuracy' ? 'accuracy' : 'quality'} score this evaluator gave.</li>
            <li>• <strong>{scoreMode === 'accuracy' ? 'Accuracy' : 'Quality'} Column:</strong> Average {scoreMode} score across all papers evaluated by this evaluator.</li>
            <li>• <strong>Score Calculation:</strong> Final = (Automated × 60%) + (User Rating × 40%)</li>
            <li>• <strong>Shared With:</strong> Shows other evaluators who rated the same paper - enables inter-rater comparison.</li>
            <li>• <strong>★ Star:</strong> Marks evaluators who share at least one paper with another evaluator.</li>
            <li>• <strong>Color highlighting:</strong> Evaluators who share papers are highlighted with matching colors for easy identification.</li>
            <li>• <strong>Toggle:</strong> Use the Accuracy/Quality buttons to switch between score types.</li>
          </ul>
        </InterpretationBox>
      </Card>

      {/* ============ RESEARCH FINDINGS (BOTH MODES) ============ */}
      <ResearchFindings 
        title={`📊 Research Findings: ${hasMultiEvaluatorData ? 'Inter-Rater Agreement' : 'Evaluation Consistency'} Analysis`} 
        defaultOpen={false}
      >
        <div className="space-y-4">
          {hasMultiEvaluatorData ? (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">Inter-Rater Reliability (Fleiss' Kappa)</h4>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li><strong>Overall Kappa:</strong> κ = {fleissKappa.kappa?.toFixed(3) || 'N/A'} ({fleissKappa.interpretation})</li>
                <li><strong>Papers × Raters:</strong> {fleissKappa.n} × {fleissKappa.k}+</li>
                <li><strong>Observed Agreement:</strong> {(fleissKappa.P_bar * 100)?.toFixed(1)}%</li>
              </ul>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Cross-Paper Consistency</h4>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li><strong>Mean Score:</strong> {((crossPaperConsistency?.overall?.mean || 0) * 100).toFixed(1)}%</li>
                <li><strong>CV:</strong> {(crossPaperConsistency?.overall?.cv || 0).toFixed(1)}% ({crossPaperConsistency?.consistencyLevel})</li>
                <li><strong>Evaluations:</strong> {crossPaperConsistency?.overall?.count || 0}</li>
              </ul>
            </div>
          )}

          {/* System Interpretation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
            <p className="text-sm text-gray-700 italic leading-relaxed">
              {hasMultiEvaluatorData ? (
                `"Inter-rater reliability was assessed using Fleiss' Kappa for ${fleissKappa.n || 0} papers evaluated by ${fleissKappa.k || 0}+ raters. The analysis revealed ${fleissKappa.interpretation?.toLowerCase() || 'N/A'} (κ = ${fleissKappa.kappa?.toFixed(3) || 'N/A'})."`
              ) : (
                `"The evaluation study involved ${evaluatorsData.length} domain experts assessing system performance across ${paperEvaluations.length} unique papers. Cross-paper consistency analysis revealed ${crossPaperConsistency?.consistencyLevel?.toLowerCase() || 'N/A'} consistency (CV = ${(crossPaperConsistency?.overall?.cv || 0).toFixed(1)}%, M = ${((crossPaperConsistency?.overall?.mean || 0) * 100).toFixed(1)}%)."`
              )}
            </p>
          </div>
        </div>
      </ResearchFindings>
    </div>
  );
};

export default UserAgreementAnalysis;