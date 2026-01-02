// File: src/components/dashboard/views/accuracy/ResearchProblemAccuracyView.jsx
// ENHANCED VERSION - Comprehensive logging and data verification for research problems

import React, { useMemo, useState } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Brain, Database, ChevronDown, ChevronUp, Info, TrendingUp,
  CheckCircle, AlertCircle, Zap, Target, FileText
} from 'lucide-react';

/**
 * Research Problem Accuracy View Component
 * ENHANCED: Comprehensive logging for debugging data extraction
 * 
 * Data Paths:
 * - LLM Problem: evaluation.systemData.researchProblems.llm_problem
 * - ORKG Problems: evaluation.systemData.researchProblems.orkg_problems
 * - Selected: evaluation.systemData.researchProblems.selectedProblem
 * - Source Flag: evaluation.systemData.researchProblems.selectedProblem.isLLMGenerated
 */
const ResearchProblemAccuracyView = ({ componentData, papers, aggregatedData }) => {
  console.log('Recieved Props',componentData, papers, aggregatedData);
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 ResearchProblemAccuracyView: INITIALIZATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Props received:', {
    hasComponentData: !!componentData,
    hasPapers: !!papers,
    papersLength: papers?.length,
    hasAggregatedData: !!aggregatedData,
    componentData,
    aggregatedData
  });
  
  const [expandedSections, setExpandedSections] = useState({
    sourceBreakdown: true,
    titleMetrics: true,
    descriptionMetrics: true,
    overallScores: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate or extract detailed research problem metrics
  const problemMetrics = useMemo(() => {
    console.log('───────────────────────────────────────────────────────');
    console.log('📊 ResearchProblemAccuracyView: CALCULATING METRICS');
    console.log('───────────────────────────────────────────────────────');
    console.log('Data sources available:', {
      hasComponentData: !!componentData,
      hasPapers: !!papers,
      papersLength: papers?.length,
      hasAggregatedData: !!aggregatedData,
      aggregatedDataHasPapers: !!aggregatedData?.papers
    });

    // CRITICAL FIX: Always prefer raw papers data because aggregated data 
    // doesn't include the isLLMGenerated flag needed for source distribution
    // Option 1: Calculate from raw papers with userEvaluations (PREFERRED FOR SOURCE INFO)
    if (papers && papers.length > 0) {
      console.log(`✓ Calculating metrics from ${papers.length} raw papers`);
      
      // Verify data structure before processing
      console.log('📋 First paper structure verification:');
      if (papers[0]) {
        const firstPaper = papers[0];
        console.log({
          doi: firstPaper.doi,
          hasGroundTruth: !!firstPaper.groundTruth,
          hasUserEvaluations: !!firstPaper.userEvaluations,
          evaluationsCount: firstPaper.userEvaluations?.length || 0
        });
        
        if (firstPaper.userEvaluations && firstPaper.userEvaluations.length > 0) {
          const firstEval = firstPaper.userEvaluations[0];
          console.log('📋 First evaluation structure:');
          console.log({
            token: firstEval.token,
            hasSystemData: !!firstEval.systemData,
            systemDataKeys: firstEval.systemData ? Object.keys(firstEval.systemData) : null,
            hasResearchProblems: !!firstEval.systemData?.researchProblems,
            researchProblemsKeys: firstEval.systemData?.researchProblems ? 
              Object.keys(firstEval.systemData.researchProblems) : null
          });
          
          if (firstEval.systemData?.researchProblems) {
            console.log('📋 Research Problems structure:');
            console.log({
              hasLLMProblem: !!firstEval.systemData.researchProblems.llm_problem,
              llmProblemTitle: firstEval.systemData.researchProblems.llm_problem?.title || 'N/A',
              hasORKGProblems: Array.isArray(firstEval.systemData.researchProblems.orkg_problems),
              orkgProblemsCount: firstEval.systemData.researchProblems.orkg_problems?.length || 0,
              hasSelectedProblem: !!firstEval.systemData.researchProblems.selectedProblem,
              selectedProblemTitle: firstEval.systemData.researchProblems.selectedProblem?.title || 'N/A',
              selectedProblemIsLLM: firstEval.systemData.researchProblems.selectedProblem?.isLLMGenerated
            });
          } else {
            console.error('✗ NO RESEARCH PROBLEMS STRUCTURE FOUND!');
          }
        }
      }
      
      return calculateDetailedProblemMetrics(papers);
    }

    // Option 2: Extract from aggregatedData.papers (pre-processed statistics)
    // NOTE: This path doesn't have isLLMGenerated, so source distribution will be wrong
    if (aggregatedData?.papers) {
      console.warn('⚠️ Using aggregated data approach - SOURCE DISTRIBUTION MAY BE INCORRECT');
      console.warn('⚠️ Aggregated data does not include isLLMGenerated flag');
      const papersObj = aggregatedData.papers;
      const paperIds = Object.keys(papersObj);
      
      if (paperIds.length === 0) {
        console.warn('⚠️ No papers in aggregated data');
        return null;
      }

      console.log(`✓ Extracting from ${paperIds.length} papers in aggregatedData`);
      return extractMetricsFromAggregatedData(papersObj);
    }

    console.error('✗ No usable data available for metrics calculation');
    return null;
  }, [papers, aggregatedData, componentData]);
  
  console.log('───────────────────────────────────────────────────────');
  console.log('📊 ResearchProblemAccuracyView: FINAL METRICS');
  console.log('───────────────────────────────────────────────────────');
  console.log('problemMetrics:', problemMetrics);
  console.log('═══════════════════════════════════════════════════════');
  
  // Show error if no data is available
  if (!componentData && !problemMetrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">No research problem accuracy data available</p>
            <p className="text-sm">
              This view requires either:
              <ul className="list-disc list-inside mt-1">
                <li>Raw papers with userEvaluations containing systemData.researchProblems</li>
                <li>Aggregated data with papers[].researchProblem statistics</li>
              </ul>
            </p>
            <div className="mt-3 p-3 bg-red-50 rounded text-xs">
              <p className="font-semibold mb-1">Debug Info:</p>
              <p>Papers: {papers?.length || 0}</p>
              <p>ComponentData: {componentData ? 'Present' : 'Missing'}</p>
              <p>AggregatedData: {aggregatedData ? 'Present' : 'Missing'}</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Source Type Distribution (ORKG vs LLM) */}
      {problemMetrics && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('sourceBreakdown')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              Problem Source Distribution
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
                  title="ORKG Problems"
                  count={problemMetrics.sourceDistribution.orkg}
                  percentage={problemMetrics.sourceDistribution.total > 0 
                    ? (problemMetrics.sourceDistribution.orkg / problemMetrics.sourceDistribution.total * 100).toFixed(1)
                    : 0}
                  color="blue"
                  description="From ORKG database"
                />
                <SourceCard
                  icon={Brain}
                  title="LLM Generated"
                  count={problemMetrics.sourceDistribution.llm}
                  percentage={problemMetrics.sourceDistribution.total > 0 
                    ? (problemMetrics.sourceDistribution.llm / problemMetrics.sourceDistribution.total * 100).toFixed(1)
                    : 0}
                  color="purple"
                  description="Generated by AI"
                />
                <SourceCard
                  icon={Target}
                  title="Total Evaluations"
                  count={problemMetrics.sourceDistribution.total}
                  percentage="100.0"
                  color="green"
                  description="All evaluated problems"
                />
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm">
                    <strong>Source Types:</strong> Research problems can be either retrieved from the ORKG database 
                    (existing problems) or generated by the LLM (new problems identified from paper content).
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </Card>
      )}

      {/* Title Accuracy Metrics */}
      {problemMetrics && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('titleMetrics')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Title Accuracy Metrics
            </h3>
            {expandedSections.titleMetrics ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.titleMetrics && (
            <div className="space-y-4">
              {/* Title Token Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Precision"
                  value={problemMetrics.title.tokenMetrics.precision}
                  description="Correctness of generated title words"
                  icon={CheckCircle}
                  color="green"
                />
                <MetricCard
                  title="Recall"
                  value={problemMetrics.title.tokenMetrics.recall}
                  description="Completeness of title coverage"
                  icon={Target}
                  color="blue"
                />
                <MetricCard
                  title="F1 Score"
                  value={problemMetrics.title.tokenMetrics.f1}
                  description="Balanced precision & recall"
                  icon={Zap}
                  color="purple"
                />
                <MetricCard
                  title="Token Accuracy"
                  value={problemMetrics.title.tokenMetrics.tokenAccuracy}
                  description="Overall token-level accuracy"
                  icon={Target}
                  color="indigo"
                />
              </div>

              {/* Title Alignment */}
              <div className="mt-4">
                <ScoreBar
                  label="Overall Title Alignment"
                  value={problemMetrics.title.alignment}
                  description="How well the title aligns with ground truth"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Description Accuracy Metrics */}
      {problemMetrics && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('descriptionMetrics')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Description Accuracy Metrics
            </h3>
            {expandedSections.descriptionMetrics ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.descriptionMetrics && (
            <div className="space-y-4">
              {/* Description Token Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Precision"
                  value={problemMetrics.description.tokenMetrics.precision}
                  description="Correctness of generated description words"
                  icon={CheckCircle}
                  color="green"
                />
                <MetricCard
                  title="Recall"
                  value={problemMetrics.description.tokenMetrics.recall}
                  description="Completeness of description coverage"
                  icon={Target}
                  color="blue"
                />
                <MetricCard
                  title="F1 Score"
                  value={problemMetrics.description.tokenMetrics.f1}
                  description="Balanced precision & recall"
                  icon={Zap}
                  color="purple"
                />
                <MetricCard
                  title="Token Accuracy"
                  value={problemMetrics.description.tokenMetrics.tokenAccuracy}
                  description="Overall token-level accuracy"
                  icon={Target}
                  color="indigo"
                />
              </div>

              {/* Content Quality Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <ScoreCard
                  label="Content Coverage"
                  value={problemMetrics.description.contentCoverage}
                  description="How much of ground truth content is covered"
                />
                <ScoreCard
                  label="Specificity"
                  value={problemMetrics.description.specificity}
                  description="How specific and well-defined the description is"
                />
                <ScoreCard
                  label="Structural Quality"
                  value={problemMetrics.description.structuralQuality}
                  description="Quality of description structure"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Overall Scores */}
      {problemMetrics && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('overallScores')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Overall Performance
            </h3>
            {expandedSections.overallScores ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.overallScores && problemMetrics.overall && (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Mean Score" value={problemMetrics.overall.mean} type="score" />
                <StatCard label="Std Dev" value={problemMetrics.overall.std} type="number" decimals={3} />
                <StatCard label="Min Score" value={problemMetrics.overall.min} type="score" />
                <StatCard label="Max Score" value={problemMetrics.overall.max} type="score" />
                <StatCard label="Median" value={problemMetrics.overall.median} type="score" />
              </div>

              {/* By Source Comparison */}
              {(problemMetrics.bySource.orkg || problemMetrics.bySource.llm) && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance by Source</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ORKG Stats */}
                    {problemMetrics.bySource.orkg && (
                      <Card className="p-4 bg-blue-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Database className="h-5 w-5 text-blue-600" />
                          <h5 className="font-semibold text-blue-900">ORKG Problems</h5>
                        </div>
                        <div className="space-y-2">
                          <StatRow label="Mean" value={problemMetrics.bySource.orkg.mean} type="score" />
                          <StatRow label="Std Dev" value={problemMetrics.bySource.orkg.std} type="number" />
                          <StatRow label="Count" value={problemMetrics.bySource.orkg.count} type="count" />
                        </div>
                      </Card>
                    )}

                    {/* LLM Stats */}
                    {problemMetrics.bySource.llm && (
                      <Card className="p-4 bg-purple-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-5 w-5 text-purple-600" />
                          <h5 className="font-semibold text-purple-900">LLM Generated</h5>
                        </div>
                        <div className="space-y-2">
                          <StatRow label="Mean" value={problemMetrics.bySource.llm.mean} type="score" />
                          <StatRow label="Std Dev" value={problemMetrics.bySource.llm.std} type="number" />
                          <StatRow label="Count" value={problemMetrics.bySource.llm.count} type="count" />
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

      {/* Score Calculation Breakdown */}
      {problemMetrics && problemMetrics.scoreDetails && (
        <ScoreCalculationBreakdown scoreDetails={problemMetrics.scoreDetails} />
      )}
    </div>
  );
};

// Score Calculation Breakdown Component
// Add this to ResearchProblemAccuracyView.jsx before the main component export

const ScoreCalculationBreakdown = ({ scoreDetails }) => {
  if (!scoreDetails) return null;

  const formatPercent = (val) => `${(val * 100).toFixed(1)}%`;
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Score Calculation Breakdown</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
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
                  {formatPercent(scoreDetails.combinedScore || 0)}
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
                  {formatPercent(scoreDetails.agreement || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-800">Agreement Bonus:</span>
                <span className="font-medium text-purple-900">
                  +{formatPercent(scoreDetails.agreementBonus || 0)}
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
                  {formatPercent(scoreDetails.automaticWeight || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800">User Weight:</span>
                <span className="font-medium text-green-900">
                  {formatPercent(scoreDetails.userWeight || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800">Automatic Confidence:</span>
                <span className="font-medium text-green-900">
                  {formatPercent(scoreDetails.automaticConfidence || 0)}
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
              {formatPercent(scoreDetails.finalScore || 0)}
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
          final_score = ({formatPercent(scoreDetails.combinedScore || 0)} × {formatPercent(scoreDetails.automaticWeight || 0)}) + 
          ({formatPercent(scoreDetails.normalizedRating || 0)} × {formatPercent(scoreDetails.userWeight || 0)}) + 
          {formatPercent(scoreDetails.agreementBonus || 0)} = 
          <span className="font-bold"> {formatPercent(scoreDetails.finalScore || 0)}</span>
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
    </Card>
  );
};
// ============================================================================
// DATA EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract metrics from pre-aggregated data
 */
function extractMetricsFromAggregatedData(papersObj) {
  console.log('📊 extractMetricsFromAggregatedData: Starting extraction...');
  
  const metrics = {
    sourceDistribution: { orkg: 0, llm: 0, total: 0 },
    title: {
      alignment: [],
      tokenMetrics: {
        precision: [],
        recall: [],
        f1: [],
        tokenAccuracy: []
      }
    },
    description: {
      tokenMetrics: {
        precision: [],
        recall: [],
        f1: [],
        tokenAccuracy: []
      },
      contentCoverage: [],
      specificity: [],
      structuralQuality: []
    },
    keyConceptsPreserved: [],
    bySource: {
      orkg: { scores: [] },
      llm: { scores: [] }
    },
    overall: { scores: [] }
  };

  const paperIds = Object.keys(papersObj);
  console.log(`Processing ${paperIds.length} papers from aggregated data`);

  paperIds.forEach(paperId => {
    const paper = papersObj[paperId];
    
    // Get research problem data
    const problemData = paper.researchProblem;
    if (!problemData) {
      console.warn(`Paper ${paperId} has no researchProblem data`);
      return;
    }

    console.log(`Paper ${paperId} research problem:`, problemData);

    // Determine source type
    // FIXED: Changed from problemData.isLLM to problemData.isLLMGenerated to match data structure
    const isLLM = problemData.isLLMGenerated || false;
    
    // Update distribution
    if (isLLM) {
      metrics.sourceDistribution.llm++;
    } else {
      metrics.sourceDistribution.orkg++;
    }
    metrics.sourceDistribution.total++;

    // Extract metrics from similarityData if available
    const sim = problemData.similarityData;
    if (sim) {
      // Title metrics
      if (sim.titleAlignment !== undefined) {
        metrics.title.alignment.push(sim.titleAlignment);
      }
      if (sim.titleTokenMetrics) {
        metrics.title.tokenMetrics.precision.push(sim.titleTokenMetrics.precision || 0);
        metrics.title.tokenMetrics.recall.push(sim.titleTokenMetrics.recall || 0);
        metrics.title.tokenMetrics.f1.push(sim.titleTokenMetrics.f1Score || 0);
        metrics.title.tokenMetrics.tokenAccuracy.push(sim.titleTokenMetrics.tokenAccuracy || 0);
      }

      // Description metrics
      if (sim.descriptionTokenMetrics) {
        metrics.description.tokenMetrics.precision.push(sim.descriptionTokenMetrics.precision || 0);
        metrics.description.tokenMetrics.recall.push(sim.descriptionTokenMetrics.recall || 0);
        metrics.description.tokenMetrics.f1.push(sim.descriptionTokenMetrics.f1Score || 0);
        metrics.description.tokenMetrics.tokenAccuracy.push(sim.descriptionTokenMetrics.tokenAccuracy || 0);
      }

      if (sim.contentCoverage !== undefined) {
        metrics.description.contentCoverage.push(sim.contentCoverage);
      }
      if (sim.specificity !== undefined) {
        metrics.description.specificity.push(sim.specificity);
      }
      if (sim.structuralQuality !== undefined) {
        metrics.description.structuralQuality.push(sim.structuralQuality);
      }
      if (sim.keyConceptsPreserved !== undefined) {
        metrics.keyConceptsPreserved.push(sim.keyConceptsPreserved);
      }
    }

    // Overall scores
    const overallScore = problemData.scores?.overallScore || 
                        problemData.scoreDetails?.finalScore ||
                        0;

    if (overallScore > 0) {
      metrics.overall.scores.push(overallScore);
      
      if (isLLM) {
        metrics.bySource.llm.scores.push(overallScore);
      } else {
        metrics.bySource.orkg.scores.push(overallScore);
      }
    }
  });

  // Calculate statistics
  const result = {
    sourceDistribution: metrics.sourceDistribution,
    title: {
      alignment: avg(metrics.title.alignment),
      tokenMetrics: {
        precision: avg(metrics.title.tokenMetrics.precision),
        recall: avg(metrics.title.tokenMetrics.recall),
        f1: avg(metrics.title.tokenMetrics.f1),
        tokenAccuracy: avg(metrics.title.tokenMetrics.tokenAccuracy)
      }
    },
    description: {
      tokenMetrics: {
        precision: avg(metrics.description.tokenMetrics.precision),
        recall: avg(metrics.description.tokenMetrics.recall),
        f1: avg(metrics.description.tokenMetrics.f1),
        tokenAccuracy: avg(metrics.description.tokenMetrics.tokenAccuracy)
      },
      contentCoverage: avg(metrics.description.contentCoverage),
      specificity: avg(metrics.description.specificity),
      structuralQuality: avg(metrics.description.structuralQuality)
    },
    keyConceptsPreserved: avg(metrics.keyConceptsPreserved),
    bySource: {
      orkg: metrics.bySource.orkg.scores.length > 0 ? calculateStats(metrics.bySource.orkg.scores) : null,
      llm: metrics.bySource.llm.scores.length > 0 ? calculateStats(metrics.bySource.llm.scores) : null
    },
    overall: calculateStats(metrics.overall.scores)
  };

  console.log('✅ Final extracted metrics:', result);
  return result;
}

/**
 * ENHANCED: Calculate detailed research problem metrics from raw papers
 * Properly handles systemData.researchProblems.llm_problem and orkg_problems
 */
function calculateDetailedProblemMetrics(papers) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 calculateDetailedProblemMetrics: STARTING');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Processing ${papers.length} papers...`);
  
  const metrics = {
    sourceDistribution: { orkg: 0, llm: 0, total: 0 },
    title: {
      alignment: [],
      tokenMetrics: {
        precision: [],
        recall: [],
        f1: [],
        tokenAccuracy: []
      }
    },
    description: {
      tokenMetrics: {
        precision: [],
        recall: [],
        f1: [],
        tokenAccuracy: []
      },
      contentCoverage: [],
      specificity: [],
      structuralQuality: []
    },
    keyConceptsPreserved: [],
    bySource: {
      orkg: { scores: [] },
      llm: { scores: [] }
    },
    overall: { scores: [] },
    scoreDetails: [],
  };

  papers.forEach((paper, paperIndex) => {
    console.log(`\n───────────────────────────────────────────────────────`);
    console.log(`📄 Processing Paper ${paperIndex + 1}/${papers.length}`);
    console.log(`───────────────────────────────────────────────────────`);
    console.log(`DOI: ${paper.doi}`);
    
    if (!paper.userEvaluations || paper.userEvaluations.length === 0) {
      console.warn(`⚠️ Paper ${paper.doi} has no user evaluations`);
      return;
    }

    console.log(`✓ Paper has ${paper.userEvaluations.length} user evaluation(s)`);

    paper.userEvaluations.forEach((evaluation, evalIndex) => {
      console.log(`\n  🔍 Evaluation ${evalIndex + 1}/${paper.userEvaluations.length}`);
      console.log(`  Token: ${evaluation.token}`);
      console.log(`  Has systemData: ${!!evaluation.systemData}`);
      console.log(`  SystemData keys: ${evaluation.systemData ? Object.keys(evaluation.systemData).join(', ') : 'N/A'}`);
      console.log(`  Has researchProblems: ${!!evaluation.systemData?.researchProblems}`);
      console.log(`  ResearchProblems keys: ${evaluation.systemData?.researchProblems ? 
        Object.keys(evaluation.systemData.researchProblems).join(', ') : 'N/A'}`);

      // CRITICAL: Determine source type from systemData.researchProblems
      const researchProblems = evaluation.systemData?.researchProblems;
      
      if (!researchProblems) {
        console.error(`  ✗ NO RESEARCH PROBLEMS STRUCTURE for token ${evaluation.token}!`);
        return;
      }

      const hasLLMProblem = researchProblems.llm_problem;
      const hasORKGProblems = researchProblems.orkg_problems && 
                             researchProblems.orkg_problems.length > 0;
      
      console.log(`  📊 Research Problems Data:`, {
        hasLLMProblem: !!hasLLMProblem,
        llmProblemTitle: hasLLMProblem?.title || 'N/A',
        hasORKGProblems: !!hasORKGProblems,
        orkgProblemsCount: researchProblems.orkg_problems?.length || 0,
        hasSelectedProblem: !!researchProblems.selectedProblem,
        selectedProblemTitle: researchProblems.selectedProblem?.title || 'N/A',
        selectedProblemIsLLM: researchProblems.selectedProblem?.isLLMGenerated
      });
      
      // Determine which source was actually used
      let isLLM = false;
      if (hasLLMProblem && !hasORKGProblems) {
        isLLM = true;
        console.log(`  ✓ Source: LLM (only LLM problem exists)`);
      } else if (!hasLLMProblem && hasORKGProblems) {
        isLLM = false;
        console.log(`  ✓ Source: ORKG (only ORKG problems exist)`);
      } else if (hasLLMProblem && hasORKGProblems) {
        // If both exist, check selectedProblem to see which was used
        isLLM = researchProblems.selectedProblem?.isLLMGenerated || false;
        console.log(`  ✓ Source: ${isLLM ? 'LLM' : 'ORKG'} (both exist, checked selectedProblem.isLLMGenerated)`);
      } else {
        console.warn(`  ⚠️ No valid research problem found`);
        return;
      }

      // Update source distribution
      if (isLLM) {
        metrics.sourceDistribution.llm++;
      } else {
        metrics.sourceDistribution.orkg++;
      }
      metrics.sourceDistribution.total++;

      console.log(`  ✓ Updated distribution - ORKG: ${metrics.sourceDistribution.orkg}, LLM: ${metrics.sourceDistribution.llm}, Total: ${metrics.sourceDistribution.total}`);

      // Get problem accuracy data from the correct path
      const accuracyData = evaluation.evaluationMetrics?.accuracy?.researchProblem;
      
      if (!accuracyData) {
        console.warn(`  ⚠️ No accuracy data in evaluation.evaluationMetrics.accuracy.researchProblem`);
        return;
      }

      console.log(`  ✓ Found accuracy data in evaluation.evaluationMetrics.accuracy.researchProblem`);
      console.log(`  📊 Available scores:`, {
        similarityDataFinalScore: accuracyData?.similarityData?.finalScore,
        scoreDetailsFinalScore: accuracyData?.scoreDetails?.finalScore,
        similarityDataOverallScore: accuracyData?.similarityData?.overallScore,
        similarityDataAutomatedOverallScore: accuracyData?.similarityData?.automatedOverallScore
      });

      
      if (accuracyData?.similarityData) {
        const sim = accuracyData.similarityData;
        console.log(`  ✓ Found similarity data:`, {
          hasTitleAlignment: sim.titleAlignment !== undefined,
          hasTitleTokenMetrics: !!sim.titleTokenMetrics,
          hasDescriptionTokenMetrics: !!sim.descriptionTokenMetrics,
          hasContentCoverage: sim.contentCoverage !== undefined
        });

        // Title metrics
        if (sim.titleAlignment !== undefined) {
          metrics.title.alignment.push(Math.min(sim.titleAlignment, 1.0));
        }
        if (sim.titleTokenMetrics) {
          metrics.title.tokenMetrics.precision.push(Math.min(sim.titleTokenMetrics.precision || 0, 1.0));
          metrics.title.tokenMetrics.recall.push(Math.min(sim.titleTokenMetrics.recall || 0, 1.0));
          metrics.title.tokenMetrics.f1.push(Math.min(sim.titleTokenMetrics.f1Score || 0, 1.0));
          metrics.title.tokenMetrics.tokenAccuracy.push(Math.min(sim.titleTokenMetrics.tokenAccuracy || 0, 1.0));
        }

        // Description metrics
        if (sim.descriptionTokenMetrics) {
          metrics.description.tokenMetrics.precision.push(Math.min(sim.descriptionTokenMetrics.precision || 0, 1.0));
          metrics.description.tokenMetrics.recall.push(Math.min(sim.descriptionTokenMetrics.recall || 0, 1.0));
          metrics.description.tokenMetrics.f1.push(Math.min(sim.descriptionTokenMetrics.f1Score || 0, 1.0));
          metrics.description.tokenMetrics.tokenAccuracy.push(Math.min(sim.descriptionTokenMetrics.tokenAccuracy || 0, 1.0));
        }

        if (sim.contentCoverage !== undefined) {
          metrics.description.contentCoverage.push(Math.min(sim.contentCoverage, 1.0));
        }
        if (sim.specificity !== undefined) {
          metrics.description.specificity.push(Math.min(sim.specificity, 1.0));
        }
        if (sim.structuralQuality !== undefined) {
          metrics.description.structuralQuality.push(Math.min(sim.structuralQuality, 1.0));
        }
        if (sim.keyConceptsPreserved !== undefined) {
          metrics.keyConceptsPreserved.push(Math.min(sim.keyConceptsPreserved, 1.0));
        }
      } else {
        console.warn(`  ⚠️ No similarity data found`);
      }

      // FIXED: Overall scores - extract from correct locations
      // Priority: scoreDetails.finalScore > similarityData.finalScore > similarityData.overallScore
      const overallScore = accuracyData?.scoreDetails?.finalScore || 
                          accuracyData?.similarityData?.finalScore || 
                          accuracyData?.similarityData?.overallScore ||
                          accuracyData?.similarityData?.automatedOverallScore ||
                          0;

      console.log(`  📊 Overall score: ${overallScore}`);

      // ALSO extract scoreDetails for calculation breakdown
      const scoreDetails = accuracyData?.scoreDetails;
      if (scoreDetails) {
        console.log(`  📊 Score calculation details:`, {
          normalizedRating: scoreDetails.normalizedRating,
          automaticConfidence: scoreDetails.automaticConfidence,
          automaticWeight: scoreDetails.automaticWeight,
          userWeight: scoreDetails.userWeight,
          agreement: scoreDetails.agreement,
          finalScore: scoreDetails.finalScore
        });
        
        // Store score details for this evaluation
        if (!metrics.scoreDetails) {
          metrics.scoreDetails = [];
        }
        metrics.scoreDetails.push(scoreDetails);
      }

      if (overallScore > 0) {
        metrics.overall.scores.push(overallScore);
        
        if (isLLM) {
          metrics.bySource.llm.scores.push(overallScore);
        } else {
          metrics.bySource.orkg.scores.push(overallScore);
        }
      }
    });
  });

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log('📊 calculateDetailedProblemMetrics: COMPLETE');
  console.log(`═══════════════════════════════════════════════════════`);
  console.log('Final raw metrics:', {
    sourceDistribution: metrics.sourceDistribution,
    totalTitleAlignments: metrics.title.alignment.length,
    totalDescriptionMetrics: metrics.description.tokenMetrics.precision.length,
    totalOverallScores: metrics.overall.scores.length,
    orkgScores: metrics.bySource.orkg.scores.length,
    llmScores: metrics.bySource.llm.scores.length
  });

  // Calculate statistics
  const result = {
    sourceDistribution: metrics.sourceDistribution,
    title: {
      alignment: avg(metrics.title.alignment),
      tokenMetrics: {
        precision: avg(metrics.title.tokenMetrics.precision),
        recall: avg(metrics.title.tokenMetrics.recall),
        f1: avg(metrics.title.tokenMetrics.f1),
        tokenAccuracy: avg(metrics.title.tokenMetrics.tokenAccuracy)
      }
    },
    description: {
      tokenMetrics: {
        precision: avg(metrics.description.tokenMetrics.precision),
        recall: avg(metrics.description.tokenMetrics.recall),
        f1: avg(metrics.description.tokenMetrics.f1),
        tokenAccuracy: avg(metrics.description.tokenMetrics.tokenAccuracy)
      },
      contentCoverage: avg(metrics.description.contentCoverage),
      specificity: avg(metrics.description.specificity),
      structuralQuality: avg(metrics.description.structuralQuality)
    },
    keyConceptsPreserved: avg(metrics.keyConceptsPreserved),
    bySource: {
      orkg: metrics.bySource.orkg.scores.length > 0 ? calculateStats(metrics.bySource.orkg.scores) : null,
      llm: metrics.bySource.llm.scores.length > 0 ? calculateStats(metrics.bySource.llm.scores) : null
    },
    overall: calculateStats(metrics.overall.scores),
    scoreDetails: metrics.scoreDetails.length > 0 ? metrics.scoreDetails[0] : null,
  };

  console.log('✅ Final calculated statistics:', result);
  console.log('═══════════════════════════════════════════════════════\n');
  
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

const MetricCard = ({ title, value, description, icon: Icon, color }) => {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      <div className={`text-2xl font-bold ${getScoreColor(value)} mb-1`}>
        {formatPercentage(value)}
      </div>
      <p className="text-xs text-gray-600">{description}</p>
    </Card>
  );
};

const ScoreCard = ({ label, value, description }) => (
  <Card className="p-4">
    <p className="text-xs font-medium text-gray-700 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${getScoreColor(value)} mb-1`}>
      {formatPercentage(value)}
    </p>
    <p className="text-xs text-gray-600">{description}</p>
  </Card>
);

const ScoreBar = ({ label, value, description }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className={`text-sm font-bold ${getScoreColor(value)}`}>
        {formatPercentage(value)}
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${getScoreBarColor(value)}`}
        style={{ width: `${value * 100}%` }}
      />
    </div>
    <p className="text-xs text-gray-600">{description}</p>
  </div>
);

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

function getScoreBarColor(score) {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.6) return 'bg-blue-500';
  if (score >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default ResearchProblemAccuracyView;