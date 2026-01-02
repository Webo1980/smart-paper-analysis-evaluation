// File: src/components/dashboard/views/accuracy/TemplateAccuracyView.jsx
// CORRECTED VERSION - Properly handles template evaluation data structure

import React, { useMemo, useState } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Layout, Database, ChevronDown, ChevronUp, Info, TrendingUp,
  CheckCircle, AlertCircle, Zap, Target, FileText, Brain, Star
} from 'lucide-react';

/**
 * Template Accuracy View Component
 * CORRECTED: Properly handles template evaluation data structure
 * 
 * CRITICAL DIFFERENCES FROM RESEARCH PROBLEM:
 * - Templates DON'T have similarityData with tokenMetrics
 * - Templates use simpler scoreDetails structure
 * - User ratings are at: evaluationMetrics.accuracy.template.template.rating
 * - Score details are at: evaluationMetrics.accuracy.template.template.scoreDetails
 * 
 * Data Paths:
 * - System Data: systemData.templates.llm_template / systemData.templates.available.template
 * - Evaluation: evaluationMetrics.accuracy.template.template
 * - User Rating: evaluationMetrics.accuracy.template.template.rating (1-5 scale)
 * - Score Details: evaluationMetrics.accuracy.template.template.scoreDetails
 */
const TemplateAccuracyView = ({ componentData, papers, aggregatedData }) => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TemplateAccuracyView: INITIALIZATION (CORRECTED VERSION)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Props received:', {
    hasComponentData: !!componentData,
    componentData: componentData,
    hasPapers: !!papers,
    papersLength: papers?.length,
    hasAggregatedData: !!aggregatedData
  });
  
  const [expandedSections, setExpandedSections] = useState({
    sourceBreakdown: true,
    userRatings: true,
    scoreDetails: true,
    overallStats: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate template metrics from papers
  const templateMetrics = useMemo(() => {
    console.log('───────────────────────────────────────────────────────');
    console.log('📊 TemplateAccuracyView: CALCULATING METRICS (CORRECTED)');
    console.log('───────────────────────────────────────────────────────');

    if (papers && papers.length > 0) {
      console.log(`✓ Calculating metrics from ${papers.length} raw papers`);
      return calculateTemplateMetrics(papers);
    }

    console.error('✗ No papers available for metrics calculation');
    return null;
  }, [papers]);
  
  console.log('───────────────────────────────────────────────────────');
  console.log('📊 TemplateAccuracyView: FINAL METRICS');
  console.log('templateMetrics:', templateMetrics);
  console.log('═══════════════════════════════════════════════════════');
  
  // Show error if no data is available
  if (!templateMetrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">No template accuracy data available</p>
            <p className="text-sm">
              This view requires raw papers with userEvaluations containing template evaluation data.
            </p>
            <div className="mt-3 p-3 bg-red-50 rounded text-xs">
              <p className="font-semibold mb-1">Debug Info:</p>
              <p>Papers: {papers?.length || 0}</p>
              <p>ComponentData: {componentData ? 'Present' : 'Missing'}</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Template Source Distribution */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('sourceBreakdown')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Template Source Distribution
          </h3>
          {expandedSections.sourceBreakdown ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.sourceBreakdown && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SourceCard
                icon={Database}
                title="ORKG Templates"
                count={templateMetrics.sourceDistribution.orkg}
                percentage={templateMetrics.sourceDistribution.total > 0 
                  ? (templateMetrics.sourceDistribution.orkg / templateMetrics.sourceDistribution.total * 100).toFixed(1)
                  : 0}
                color="blue"
                description="From ORKG database"
              />
              <SourceCard
                icon={Brain}
                title="LLM Generated"
                count={templateMetrics.sourceDistribution.llm}
                percentage={templateMetrics.sourceDistribution.total > 0 
                  ? (templateMetrics.sourceDistribution.llm / templateMetrics.sourceDistribution.total * 100).toFixed(1)
                  : 0}
                color="purple"
                description="Generated by AI"
              />
              <SourceCard
                icon={Target}
                title="Total Evaluations"
                count={templateMetrics.sourceDistribution.total}
                percentage="100.0"
                color="green"
                description="All evaluated templates"
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm">
                  <strong>Source Types:</strong> Templates can be either retrieved from the ORKG database 
                  (existing curated templates) or generated by the LLM (new templates created from methodology).
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </Card>

      {/* User Ratings Section */}
      {templateMetrics.userRatings && templateMetrics.userRatings.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('userRatings')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              User Ratings & Assessments
            </h3>
            {expandedSections.userRatings ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.userRatings && (
            <div className="space-y-4">
              {/* Average Rating Display */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Average User Rating</p>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl font-bold text-yellow-600">
                        {templateMetrics.averageRating.toFixed(2)}
                      </div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star}
                            className={`h-6 w-6 ${
                              star <= Math.round(templateMetrics.averageRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Out of 5.0 • {templateMetrics.userRatings.length} rating{templateMetrics.userRatings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700 mb-1">Rating Distribution</p>
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = templateMetrics.userRatings.filter(r => Math.round(r.rating) === rating).length;
                        const percentage = (count / templateMetrics.userRatings.length * 100).toFixed(0);
                        return (
                          <div key={rating} className="flex items-center gap-2 text-xs">
                            <span className="w-8">{rating}★</span>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-12 text-gray-600">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Ratings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Individual Ratings</h4>
                <div className="space-y-2">
                  {templateMetrics.userRatings.map((rating, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{rating.paperId.substring(0, 12)}...</Badge>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{rating.rating.toFixed(1)}</span>
                      </div>
                      {rating.expertiseMultiplier && (
                        <Badge variant="secondary">
                          Expertise: {rating.expertiseMultiplier.toFixed(2)}x
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Score Details Section */}
      {templateMetrics.scoreDetails && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('scoreDetails')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Score Calculation Details
            </h3>
            {expandedSections.scoreDetails ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.scoreDetails && (
            <ScoreCalculationBreakdown scoreDetails={templateMetrics.scoreDetails} />
          )}
        </Card>
      )}

      {/* Overall Statistics */}
      {templateMetrics.overall && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('overallStats')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Overall Performance
            </h3>
            {expandedSections.overallStats ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.overallStats && (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Mean Score" value={templateMetrics.overall.mean} type="score" />
                <StatCard label="Std Dev" value={templateMetrics.overall.std} type="number" decimals={3} />
                <StatCard label="Min Score" value={templateMetrics.overall.min} type="score" />
                <StatCard label="Max Score" value={templateMetrics.overall.max} type="score" />
                <StatCard label="Median" value={templateMetrics.overall.median} type="score" />
              </div>

              {/* By Source Comparison */}
              {(templateMetrics.bySource.orkg || templateMetrics.bySource.llm) && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance by Source</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ORKG Stats */}
                    {templateMetrics.bySource.orkg && (
                      <Card className="p-4 bg-blue-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Database className="h-5 w-5 text-blue-600" />
                          <h5 className="font-semibold text-blue-900">ORKG Templates</h5>
                        </div>
                        <div className="space-y-2">
                          <StatRow label="Mean" value={templateMetrics.bySource.orkg.mean} type="score" />
                          <StatRow label="Std Dev" value={templateMetrics.bySource.orkg.std} type="number" />
                          <StatRow label="Count" value={templateMetrics.bySource.orkg.count} type="count" />
                        </div>
                      </Card>
                    )}

                    {/* LLM Stats */}
                    {templateMetrics.bySource.llm && (
                      <Card className="p-4 bg-purple-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-5 w-5 text-purple-600" />
                          <h5 className="font-semibold text-purple-900">LLM Generated</h5>
                        </div>
                        <div className="space-y-2">
                          <StatRow label="Mean" value={templateMetrics.bySource.llm.mean} type="score" />
                          <StatRow label="Std Dev" value={templateMetrics.bySource.llm.std} type="number" />
                          <StatRow label="Count" value={templateMetrics.bySource.llm.count} type="count" />
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// SCORE CALCULATION BREAKDOWN COMPONENT
// ============================================================================

const ScoreCalculationBreakdown = ({ scoreDetails }) => {
  if (!scoreDetails) return null;

  const formatPercent = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        The final score combines automated accuracy analysis with expert human evaluation, weighted by the evaluator's domain expertise.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column - Inputs */}
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Input Scores</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800">Automated Score:</span>
                <span className="font-medium text-blue-900">
                  {formatPercent(scoreDetails.combinedScore)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">User Rating:</span>
                <span className="font-medium text-blue-900">
                  {scoreDetails.normalizedRating ? formatPercent(scoreDetails.normalizedRating) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Expertise Multiplier:</span>
                <span className="font-medium text-blue-900">
                  {((scoreDetails.rawUserWeight || 1) * 0.625).toFixed(2)}x
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Agreement Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-800">Agreement:</span>
                <span className="font-medium text-purple-900">
                  {formatPercent(scoreDetails.agreement)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-800">Agreement Bonus:</span>
                <span className="font-medium text-purple-900">
                  +{formatPercent(scoreDetails.agreementBonus)}
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-2">
                {scoreDetails.agreement > 0.7 ? 
                  'High agreement between automated and human evaluation' :
                  scoreDetails.agreement > 0.4 ?
                  'Moderate agreement - some divergence detected' :
                  'Low agreement - significant divergence between automated and human scores'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Weights & Final */}
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <h4 className="text-sm font-semibold text-green-900 mb-2">Weight Distribution</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-800">Automated Weight:</span>
                <span className="font-medium text-green-900">
                  {formatPercent(scoreDetails.automaticWeight)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800">User Weight:</span>
                <span className="font-medium text-green-900">
                  {formatPercent(scoreDetails.userWeight)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800">Automatic Confidence:</span>
                <span className="font-medium text-green-900">
                  {formatPercent(scoreDetails.automaticConfidence)}
                </span>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Weights adjust dynamically based on automatic confidence and user expertise
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded border-2 border-indigo-300">
            <h4 className="text-sm font-semibold text-indigo-900 mb-2">Final Combined Score</h4>
            <div className="text-4xl font-bold text-indigo-900 mb-2">
              {formatPercent(scoreDetails.finalScore)}
            </div>
            <div className="text-xs text-indigo-700 space-y-1">
              <p>= (Automated × Auto Weight) + (User × User Weight)</p>
              <p>+ Agreement Bonus</p>
              {scoreDetails.isCapped && (
                <p className="text-red-700 font-medium">⚠️ Score capped at 100%</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Formula */}
      <div className="mt-4 p-3 bg-gray-50 rounded border text-xs">
        <p className="font-medium mb-1">Calculation Formula:</p>
        <code className="text-gray-700">
          final_score = ({formatPercent(scoreDetails.combinedScore)} × {formatPercent(scoreDetails.automaticWeight)}) + 
          ({formatPercent(scoreDetails.normalizedRating)} × {formatPercent(scoreDetails.userWeight)}) + 
          {formatPercent(scoreDetails.agreementBonus)} = 
          <span className="font-bold"> {formatPercent(scoreDetails.finalScore)}</span>
        </code>
      </div>

      {/* Interpretation */}
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
        <p className="font-medium text-blue-900 mb-1">Interpretation:</p>
        <p className="text-blue-800">
          {scoreDetails.userWeight > 0.7 ?
            'This evaluation prioritizes expert human judgment due to high expertise weight.' :
            scoreDetails.automaticWeight > 0.7 ?
            'This evaluation prioritizes automated analysis due to high automatic confidence.' :
            'This evaluation balances both automated analysis and human judgment.'}
          {' '}
          {scoreDetails.agreement > 0.7 &&
            'The high agreement between automated and human scores strengthens confidence in the final result.'}
          {scoreDetails.agreement < 0.4 &&
            'The low agreement suggests different perspectives between automated and human evaluation.'}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// DATA CALCULATION FUNCTION (CORRECTED)
// ============================================================================

/**
 * Calculate template metrics from raw papers
 * CORRECTED: Uses correct data paths for template evaluations
 */
function calculateTemplateMetrics(papers) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 calculateTemplateMetrics: STARTING (CORRECTED VERSION)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Processing ${papers.length} papers...`);
  
  const metrics = {
    sourceDistribution: { orkg: 0, llm: 0, total: 0 },
    userRatings: [],
    bySource: {
      orkg: { scores: [] },
      llm: { scores: [] }
    },
    overall: { scores: [] },
    scoreDetails: null
  };

  papers.forEach((paper, paperIndex) => {
    console.log(`\n───────────────────────────────────────────────────────`);
    console.log(`📄 Processing Paper ${paperIndex + 1}/${papers.length}`);
    console.log(`DOI: ${paper.doi}`);
    
    if (!paper.userEvaluations || paper.userEvaluations.length === 0) {
      console.warn(`⚠️ Paper ${paper.doi} has no user evaluations`);
      return;
    }

    paper.userEvaluations.forEach((evaluation, evalIndex) => {
      console.log(`\n  🔍 Evaluation ${evalIndex + 1}/${paper.userEvaluations.length}`);
      console.log(`  Token: ${evaluation.token}`);

      // Determine source type from systemData.templates
      const templates = evaluation.systemData?.templates;
      
      if (!templates) {
        console.error(`  ✗ NO TEMPLATES STRUCTURE for token ${evaluation.token}!`);
        return;
      }

      // Determine if LLM or ORKG
      const isLLM = !!(templates.llm_template && templates.llm_template !== false);
      console.log(`  Template Source: ${isLLM ? 'LLM' : 'ORKG'}`);

      // Update source distribution
      if (isLLM) {
        metrics.sourceDistribution.llm++;
      } else {
        metrics.sourceDistribution.orkg++;
      }
      metrics.sourceDistribution.total++;

      // CORRECTED PATH: Get template evaluation data
      // Templates are at: evaluationMetrics.accuracy.template.template
      const templateEval = evaluation.evaluationMetrics?.accuracy?.template?.template;
      
      if (!templateEval) {
        console.warn(`  ⚠️ No template evaluation data at evaluationMetrics.accuracy.template.template`);
        return;
      }

      console.log(`  ✓ Found template evaluation data:`, {
        hasRating: !!templateEval.rating,
        rating: templateEval.rating,
        hasScoreDetails: !!templateEval.scoreDetails,
        finalScore: templateEval.scoreDetails?.finalScore,
        expertiseMultiplier: templateEval.expertiseMultiplier
      });

      // Extract user rating (1-5 scale)
      if (templateEval.rating !== undefined && templateEval.rating !== null) {
        metrics.userRatings.push({
          rating: templateEval.rating,
          paperId: paper.doi || evaluation.token,
          expertiseMultiplier: templateEval.expertiseMultiplier
        });
      }

      // Extract score details (use first one encountered)
      if (!metrics.scoreDetails && templateEval.scoreDetails) {
        metrics.scoreDetails = templateEval.scoreDetails;
      }

      // Extract final score
      const finalScore = templateEval.scoreDetails?.finalScore;

      if (finalScore !== undefined && finalScore !== null && !isNaN(finalScore)) {
        metrics.overall.scores.push(finalScore);
        
        if (isLLM) {
          metrics.bySource.llm.scores.push(finalScore);
        } else {
          metrics.bySource.orkg.scores.push(finalScore);
        }
        
        console.log(`  ✓ Extracted final score: ${finalScore}`);
      } else {
        console.warn(`  ⚠️ No valid final score found`);
      }
    });
  });

  // Calculate statistics
  const result = {
    sourceDistribution: metrics.sourceDistribution,
    userRatings: metrics.userRatings,
    averageRating: metrics.userRatings.length > 0 
      ? metrics.userRatings.reduce((sum, r) => sum + r.rating, 0) / metrics.userRatings.length
      : 0,
    bySource: {
      orkg: metrics.bySource.orkg.scores.length > 0 ? calculateStats(metrics.bySource.orkg.scores) : null,
      llm: metrics.bySource.llm.scores.length > 0 ? calculateStats(metrics.bySource.llm.scores) : null
    },
    overall: calculateStats(metrics.overall.scores),
    scoreDetails: metrics.scoreDetails
  };

  console.log('✅ Final calculated template metrics:', result);
  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStats(values) {
  if (!values || values.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, median: 0, count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = avg(values);
  const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

  return {
    mean,
    std,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    count: values.length
  };
}

function avg(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const SourceCard = ({ icon: Icon, title, count, percentage, color, description }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-6 w-6" />
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="text-3xl font-bold mb-1">{count}</div>
      <div className="text-2xl font-semibold mb-2">{percentage}%</div>
      <p className="text-xs opacity-80">{description}</p>
    </Card>
  );
};

const StatCard = ({ label, value, type, decimals = 2 }) => {
  const formatValue = () => {
    if (type === 'score') return formatPercentage(value);
    if (type === 'count') return value.toString();
    return value.toFixed(decimals);
  };

  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${type === 'score' ? getScoreColor(value) : 'text-gray-900'}`}>
        {formatValue()}
      </p>
    </Card>
  );
};

const StatRow = ({ label, value, type, decimals = 2 }) => {
  const formatValue = () => {
    if (type === 'score') return formatPercentage(value);
    if (type === 'count') return value.toString();
    return value.toFixed(decimals);
  };

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-700">{label}:</span>
      <span className={`font-semibold ${type === 'score' ? getScoreColor(value) : 'text-gray-900'}`}>
        {formatValue()}
      </span>
    </div>
  );
};

function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function getScoreColor(score) {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

export default TemplateAccuracyView;