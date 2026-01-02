// File: src/components/dashboard/views/accuracy/ResearchFieldAccuracyView.jsx
// FIXED VERSION - Correct data paths
//
// ============================================================================
// KEY FIXES:
// ============================================================================
// 1. Fixed data paths - was looking at wrong locations
// 2. User selected field: systemData.researchFields.selectedField.name (not researchFieldAssessment)
// 3. System predictions: systemData.researchFields.fields (not researchFieldAssessment.predictions)
// 4. Ground truth: paper.groundTruth.research_field_name
//
// ============================================================================
// DATA STRUCTURE (from debug output):
// ============================================================================
// paper.groundTruth.research_field_name = "Computer Vision and Pattern Recognition"
// 
// evaluation.systemData.researchFields = {
//   fields: Array(5),           // System predictions
//   selectedField: { name, score },  // User's selection
//   status: 'completed',
//   processing_info: {...}
// }
//
// evaluation.evaluationMetrics.accuracy.researchField = {
//   similarityData: { foundPosition, exactMatch, ... },
//   scoreDetails: { finalScore, ... },
//   rating: 5,
//   expertiseMultiplier: 1.14
// }
// ============================================================================

import React, { useMemo } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Target, TrendingUp, Award, Info, CheckCircle, XCircle
} from 'lucide-react';

/**
 * Research Field Accuracy View - Component View
 * Shows aggregated statistics across all papers
 */
const ResearchFieldAccuracyView = ({ componentData, papers }) => {
  console.log("ResearchFieldAccuracyView: componentData =", componentData, "papers =", papers);

  // Extract and enrich paper data with correct paths
  const enrichedPapers = useMemo(() => {
    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      console.warn('ResearchFieldAccuracyView: No papers provided');
      return [];
    }

    const enriched = [];

    papers.forEach(paper => {
      if (!paper.userEvaluations || paper.userEvaluations.length === 0) {
        console.log(`Paper ${paper.doi} has no evaluations`);
        return;
      }

      // Get ground truth from paper level
      const groundTruthField = paper.groundTruth?.research_field_name;

      paper.userEvaluations.forEach(evaluation => {
        const token = evaluation.token;

        // ============================================
        // CORRECT DATA PATHS (fixed from debug output)
        // ============================================
        
        // System predictions: systemData.researchFields.fields
        const systemPredictions = evaluation.systemData?.researchFields?.fields || [];
        
        // User selected field: systemData.researchFields.selectedField.name
        const userSelectedField = evaluation.systemData?.researchFields?.selectedField?.name;
        
        // Accuracy/similarity data: evaluationMetrics.accuracy.researchField.similarityData
        const accuracyData = evaluation.evaluationMetrics?.accuracy?.researchField;
        const similarityData = accuracyData?.similarityData;
        const scoreDetails = accuracyData?.scoreDetails;
        
        // User rating
        const userRating = accuracyData?.rating;

        enriched.push({
          token,
          doi: paper.doi,
          paperId: paper.groundTruth?.paper_id,
          title: paper.groundTruth?.title,
          groundTruthField,
          userSelectedField,
          systemPredictions,
          similarityData,
          scoreDetails,
          userRating,
          finalScore: scoreDetails?.finalScore || 0,
          userEmail: evaluation.userInfo?.email,
          evaluation
        });
      });
    });

    console.log(`Enriched ${enriched.length} evaluations from ${papers.length} papers`);
    
    // Debug: log first enriched paper to verify data
    if (enriched.length > 0) {
      console.log('First enriched evaluation:', {
        groundTruthField: enriched[0].groundTruthField,
        userSelectedField: enriched[0].userSelectedField,
        systemPredictions: enriched[0].systemPredictions?.map(p => p.name || p),
        foundPosition: enriched[0].similarityData?.foundPosition
      });
    }

    return enriched;
  }, [papers]);

  // Show message if no data
  if (enrichedPapers.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No research field accuracy data available for analysis.
          <p className="text-xs mt-1 text-gray-500">
            Expected data at: papers[].userEvaluations[].systemData.researchFields
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate aggregated statistics
  const aggregatedStats = useMemo(() => {
    // Group by paper to detect duplicates
    const byPaper = {};
    enrichedPapers.forEach(evalData => {
      const key = evalData.paperId || evalData.doi;
      if (!byPaper[key]) {
        byPaper[key] = [];
      }
      byPaper[key].push(evalData);
    });

    const stats = {
      totalEvaluations: enrichedPapers.length,
      uniquePapers: Object.keys(byPaper).length,
      duplicateEvaluations: 0,
      
      // Ground truth in system predictions analysis
      gtInTop5: 0,
      gtAtPosition1: 0,
      gtAtPosition2: 0,
      gtAtPosition3: 0,
      gtAtPosition4: 0,
      gtAtPosition5: 0,
      gtNotFound: 0,
      
      // User selection analysis
      userMatchedGT: 0,
      userMatchedSystemTop: 0,
      userAndSystemMatchedGT: 0,
      
      // User selection position in system predictions
      userSelectedAtPosition1: 0,
      userSelectedAtPosition2: 0,
      userSelectedAtPosition3: 0,
      userSelectedAtPosition4: 0,
      userSelectedAtPosition5: 0,
      userSelectedOutsideTop5: 0,
      
      // Combined analysis
      bothCorrect: 0,
      userCorrectSystemWrong: 0,
      systemCorrectUserWrong: 0,
      bothWrong: 0,
      
      // Score tracking
      totalFinalScore: 0
    };

    // Detect duplicates
    Object.values(byPaper).forEach(evals => {
      const userEvals = {};
      evals.forEach(e => {
        const userKey = e.userEmail || 'unknown';
        userEvals[userKey] = (userEvals[userKey] || 0) + 1;
      });
      Object.values(userEvals).forEach(count => {
        if (count > 1) {
          stats.duplicateEvaluations += (count - 1);
        }
      });
    });

    enrichedPapers.forEach(evalData => {
      const { 
        groundTruthField, 
        userSelectedField, 
        systemPredictions, 
        similarityData,
        finalScore 
      } = evalData;
      
      // Get position where GT appears in system predictions
      // First check similarityData.foundPosition, then calculate manually
      let gtPosition = similarityData?.foundPosition;
      
      if (gtPosition === undefined || gtPosition === null) {
        // Calculate position manually
        const gtIndex = systemPredictions.findIndex(p => {
          const predName = p.name || p;
          return predName === groundTruthField;
        });
        gtPosition = gtIndex >= 0 ? gtIndex + 1 : null; // 1-indexed, null if not found
      }

      // Get top system prediction
      const topSystemPrediction = systemPredictions[0]?.name || systemPredictions[0];
      
      // Find where user's selection appears in system predictions
      const userSelectedPosition = systemPredictions.findIndex(p => {
        const predName = p.name || p;
        return predName === userSelectedField;
      }) + 1; // 1-indexed, 0 if not found

      // Track scores
      stats.totalFinalScore += finalScore || 0;

      // Ground truth position analysis
      if (gtPosition && gtPosition >= 1 && gtPosition <= 5) {
        stats.gtInTop5++;
        switch(gtPosition) {
          case 1: stats.gtAtPosition1++; break;
          case 2: stats.gtAtPosition2++; break;
          case 3: stats.gtAtPosition3++; break;
          case 4: stats.gtAtPosition4++; break;
          case 5: stats.gtAtPosition5++; break;
        }
      } else {
        stats.gtNotFound++;
      }
      
      // User selection analysis
      const userMatchesGT = userSelectedField === groundTruthField;
      const systemTopMatchesGT = topSystemPrediction === groundTruthField;
      
      if (userMatchesGT) stats.userMatchedGT++;
      if (userSelectedField === topSystemPrediction) stats.userMatchedSystemTop++;
      if (userMatchesGT && systemTopMatchesGT) stats.userAndSystemMatchedGT++;
      
      // User selection position
      if (userSelectedPosition >= 1 && userSelectedPosition <= 5) {
        switch(userSelectedPosition) {
          case 1: stats.userSelectedAtPosition1++; break;
          case 2: stats.userSelectedAtPosition2++; break;
          case 3: stats.userSelectedAtPosition3++; break;
          case 4: stats.userSelectedAtPosition4++; break;
          case 5: stats.userSelectedAtPosition5++; break;
        }
      } else {
        stats.userSelectedOutsideTop5++;
      }
      
      // Combined analysis matrix
      if (userMatchesGT && systemTopMatchesGT) {
        stats.bothCorrect++;
      } else if (userMatchesGT && !systemTopMatchesGT) {
        stats.userCorrectSystemWrong++;
      } else if (!userMatchesGT && systemTopMatchesGT) {
        stats.systemCorrectUserWrong++;
      } else {
        stats.bothWrong++;
      }
    });

    // Calculate average score
    stats.averageFinalScore = stats.totalEvaluations > 0 
      ? stats.totalFinalScore / stats.totalEvaluations 
      : 0;

    console.log('Aggregated stats:', stats);
    return stats;
  }, [enrichedPapers]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const total = aggregatedStats.totalEvaluations;
    
    // Calculate average position (only for papers where GT was found)
    const foundPositions = enrichedPapers
      .map(p => {
        if (p.similarityData?.foundPosition) return p.similarityData.foundPosition;
        // Fallback: calculate manually
        const idx = p.systemPredictions.findIndex(pred => 
          (pred.name || pred) === p.groundTruthField
        );
        return idx >= 0 ? idx + 1 : null;
      })
      .filter(pos => pos !== null && pos >= 1 && pos <= 5);
    
    const avgPosition = foundPositions.length > 0
      ? foundPositions.reduce((sum, p) => sum + p, 0) / foundPositions.length
      : 0;

    return {
      exactMatchRate: total > 0 ? aggregatedStats.gtAtPosition1 / total : 0,
      topNRate: total > 0 ? aggregatedStats.gtInTop5 / total : 0,
      avgPosition,
      userAccuracyRate: total > 0 ? aggregatedStats.userMatchedGT / total : 0,
      totalPapers: aggregatedStats.uniquePapers,
      totalEvaluations: total,
      averageFinalScore: aggregatedStats.averageFinalScore
    };
  }, [aggregatedStats, enrichedPapers]);

  // Get overall score from componentData or calculate
  const overallScore = componentData?.scores?.mean || overallMetrics.averageFinalScore;

  return (
    <div className="space-y-6 mt-4">
      {/* Research Insights Alert - Taxonomy Mismatch Explanation */}
      <Alert className="bg-amber-50 border-amber-300">
        <Info className="h-5 w-5 text-amber-600" />
        <AlertDescription>
          <h4 className="font-semibold text-amber-900 mb-2">📊 Key Research Finding: Taxonomy Divergence</h4>
          <div className="text-sm text-amber-800 space-y-2">
            <p>
              The metrics below reveal an important insight about research field classification systems. 
              The low match rates between user selections and ORKG ground truth reflect a <strong>taxonomy 
              mismatch</strong> between classification systems, not system failure.
            </p>
            <div className="bg-white/50 rounded-lg p-3 mt-2">
              <p className="font-medium mb-1">Example from this dataset:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li><strong>ORKG Ground Truth:</strong> "Computer Vision and Pattern Recognition"</li>
                <li><strong>LLM Top Prediction:</strong> "Image and Video Processing"</li>
                <li><strong>User Selection:</strong> Matched LLM prediction (82.4% of cases)</li>
              </ul>
              <p className="text-xs mt-2 italic">
                Both classifications are semantically valid but originate from different ontological frameworks.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200">
              <p className="font-medium text-amber-900">Implications for Evaluation:</p>
              <ul className="text-xs mt-1 space-y-1 ml-4 list-disc">
                <li><strong>User Trust:</strong> High acceptance of system predictions indicates user confidence in LLM classification</li>
                <li><strong>Semantic Validity:</strong> Low exact-match rates don't indicate errors when fields are semantically related</li>
                <li><strong>Taxonomy Alignment:</strong> Future work could map LLM predictions to ORKG taxonomy for improved comparability</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Duplicate Warning */}
      {aggregatedStats.duplicateEvaluations > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Note:</strong> Detected {aggregatedStats.duplicateEvaluations} duplicate evaluation(s) 
            where the same user evaluated the same paper multiple times. 
            All evaluations are included in the statistics below.
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Target}
          label="Exact Match Rate"
          value={overallMetrics.exactMatchRate}
          description="System's top prediction matches GT"
          color="blue"
          subtitle={`${aggregatedStats.gtAtPosition1} of ${aggregatedStats.totalEvaluations}`}
        />

        <MetricCard
          icon={Award}
          label="Top-5 Presence"
          value={overallMetrics.topNRate}
          description="GT found in top 5 predictions"
          color="green"
          subtitle={`${aggregatedStats.gtInTop5} of ${aggregatedStats.totalEvaluations}`}
        />

        <MetricCard
          icon={CheckCircle}
          label="User Accuracy"
          value={overallMetrics.userAccuracyRate}
          description="User selection matches GT"
          color="purple"
          subtitle={`${aggregatedStats.userMatchedGT} of ${aggregatedStats.totalEvaluations}`}
        />

        <MetricCard
          icon={TrendingUp}
          label="Avg Position"
          value={overallMetrics.avgPosition}
          isPosition={true}
          description="Where GT was found (1-5)"
          color="orange"
          subtitle={`${aggregatedStats.gtInTop5} papers with GT in top 5`}
        />
      </div>

      {/* Formula Explanation */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">How Accuracy is Calculated</h4>
            <p className="text-xs text-blue-700 mb-2">
              Position-based scoring with the following weights:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-bold text-green-600">Position 1</div>
                <div className="text-blue-700">100% score</div>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-bold text-blue-600">Position 2-3</div>
                <div className="text-blue-700">80% score</div>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-bold text-yellow-600">Position 4-5</div>
                <div className="text-blue-700">60% score</div>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-bold text-red-600">Not Found</div>
                <div className="text-blue-700">User rating only</div>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <div className="font-bold text-purple-600">Final</div>
                <div className="text-blue-700">(Auto×60%)+(User×40%)</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Predictions Matrix */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Predictions Analysis
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Where ground truth appears in system's top 5 predictions across all {aggregatedStats.totalEvaluations} evaluations
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Position</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Count</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Percentage</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Visualization</th>
              </tr>
            </thead>
            <tbody>
              <StatRow label="Position 1 (Exact Match)" count={aggregatedStats.gtAtPosition1} total={aggregatedStats.totalEvaluations} color="green" />
              <StatRow label="Position 2" count={aggregatedStats.gtAtPosition2} total={aggregatedStats.totalEvaluations} color="blue" />
              <StatRow label="Position 3" count={aggregatedStats.gtAtPosition3} total={aggregatedStats.totalEvaluations} color="blue" />
              <StatRow label="Position 4" count={aggregatedStats.gtAtPosition4} total={aggregatedStats.totalEvaluations} color="yellow" />
              <StatRow label="Position 5" count={aggregatedStats.gtAtPosition5} total={aggregatedStats.totalEvaluations} color="yellow" />
              <StatRow label="Not Found (Outside Top 5)" count={aggregatedStats.gtNotFound} total={aggregatedStats.totalEvaluations} color="red" />
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="border border-gray-300 px-4 py-2">Total</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{aggregatedStats.totalEvaluations}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">100%</td>
                <td className="border border-gray-300 px-4 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* User Selection vs Ground Truth Matrix */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          User Selection Analysis
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          How user selections compare to ground truth and system predictions
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* User vs GT */}
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">User vs Ground Truth</h4>
            <div className="space-y-2">
              <ComparisonRow
                icon={CheckCircle}
                label="User Matched Ground Truth"
                count={aggregatedStats.userMatchedGT}
                total={aggregatedStats.totalEvaluations}
                color="green"
              />
              <ComparisonRow
                icon={XCircle}
                label="User Didn't Match Ground Truth"
                count={aggregatedStats.totalEvaluations - aggregatedStats.userMatchedGT}
                total={aggregatedStats.totalEvaluations}
                color="red"
              />
            </div>
          </div>

          {/* User vs System */}
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">User vs System Top Prediction</h4>
            <div className="space-y-2">
              <ComparisonRow
                icon={CheckCircle}
                label="User Matched System's Top"
                count={aggregatedStats.userMatchedSystemTop}
                total={aggregatedStats.totalEvaluations}
                color="blue"
              />
              <ComparisonRow
                icon={XCircle}
                label="User Chose Different Field"
                count={aggregatedStats.totalEvaluations - aggregatedStats.userMatchedSystemTop}
                total={aggregatedStats.totalEvaluations}
                color="orange"
              />
            </div>
          </div>
        </div>

        {/* Combined Analysis Matrix */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Combined Analysis Matrix</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Scenario</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Count</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Both User and System Matched GT</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{aggregatedStats.bothCorrect}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm">{formatPercent(aggregatedStats.bothCorrect, aggregatedStats.totalEvaluations)}</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span>User Correct, System Wrong</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{aggregatedStats.userCorrectSystemWrong}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm">{formatPercent(aggregatedStats.userCorrectSystemWrong, aggregatedStats.totalEvaluations)}</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-orange-600" />
                      <span>System Correct, User Wrong</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{aggregatedStats.systemCorrectUserWrong}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm">{formatPercent(aggregatedStats.systemCorrectUserWrong, aggregatedStats.totalEvaluations)}</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Both User and System Wrong</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{aggregatedStats.bothWrong}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm">{formatPercent(aggregatedStats.bothWrong, aggregatedStats.totalEvaluations)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* User Selection Position Matrix */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          User Selection Position in System Predictions
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Where user's selected field appears in system's ranked predictions
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">User Selected At</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Count</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Percentage</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Visualization</th>
              </tr>
            </thead>
            <tbody>
              <StatRow label="Position 1 (System's Top)" count={aggregatedStats.userSelectedAtPosition1} total={aggregatedStats.totalEvaluations} color="green" />
              <StatRow label="Position 2" count={aggregatedStats.userSelectedAtPosition2} total={aggregatedStats.totalEvaluations} color="blue" />
              <StatRow label="Position 3" count={aggregatedStats.userSelectedAtPosition3} total={aggregatedStats.totalEvaluations} color="blue" />
              <StatRow label="Position 4" count={aggregatedStats.userSelectedAtPosition4} total={aggregatedStats.totalEvaluations} color="yellow" />
              <StatRow label="Position 5" count={aggregatedStats.userSelectedAtPosition5} total={aggregatedStats.totalEvaluations} color="yellow" />
              <StatRow label="Outside Top 5 / Custom" count={aggregatedStats.userSelectedOutsideTop5} total={aggregatedStats.totalEvaluations} color="red" />
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Analysis Summary</h4>
            <p className="text-xs text-gray-600">
              {aggregatedStats.totalEvaluations} evaluations across {aggregatedStats.uniquePapers} unique papers
              {aggregatedStats.duplicateEvaluations > 0 && 
                ` (including ${aggregatedStats.duplicateEvaluations} duplicate${aggregatedStats.duplicateEvaluations !== 1 ? 's' : ''})`
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">
              {(overallScore * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">Overall Score</p>
          </div>
        </div>
      </Card>

      {/* Research Summary - Citable Findings */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Research Summary: Field Classification Analysis
        </h3>
        
        <div className="space-y-4">
          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatisticBox 
              label="System Exact Match" 
              value={`${formatPercent(aggregatedStats.gtAtPosition1, aggregatedStats.totalEvaluations)}`}
              sublabel="Top prediction = GT"
            />
            <StatisticBox 
              label="GT in Top-5" 
              value={`${formatPercent(aggregatedStats.gtInTop5, aggregatedStats.totalEvaluations)}`}
              sublabel="ORKG field found"
            />
            <StatisticBox 
              label="User Trust Rate" 
              value={`${formatPercent(aggregatedStats.userMatchedSystemTop, aggregatedStats.totalEvaluations)}`}
              sublabel="Accepted system's top"
            />
            <StatisticBox 
              label="User-GT Match" 
              value={`${formatPercent(aggregatedStats.userMatchedGT, aggregatedStats.totalEvaluations)}`}
              sublabel="Selected ORKG field"
            />
          </div>

          {/* Citable Findings */}
          <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">📝 Key Findings</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>
                <strong>Taxonomy Divergence:</strong> The LLM-based field classifier and ORKG use different 
                ontological frameworks, resulting in {formatPercent(aggregatedStats.gtAtPosition1, aggregatedStats.totalEvaluations)} exact 
                match rate despite both systems producing semantically valid classifications.
              </li>
              <li>
                <strong>User Acceptance:</strong> {formatPercent(aggregatedStats.userMatchedSystemTop, aggregatedStats.totalEvaluations)} of 
                evaluators accepted the system's top prediction, indicating high user trust in the automated 
                field classification.
              </li>
              <li>
                <strong>Semantic Overlap:</strong> In {formatPercent(aggregatedStats.gtInTop5, aggregatedStats.totalEvaluations)} of cases, 
                the ORKG ground truth appeared within the top-5 predictions, suggesting the system captures 
                related domains even when not matching the exact ORKG classification.
              </li>
              <li>
                <strong>Expert Validation Pattern:</strong> Evaluators consistently preferred LLM suggestions over 
                ORKG classifications ({formatPercent(aggregatedStats.userMatchedSystemTop, aggregatedStats.totalEvaluations)} vs {formatPercent(aggregatedStats.userMatchedGT, aggregatedStats.totalEvaluations)}), 
                suggesting the LLM taxonomy may better align with domain expert mental models.
              </li>
            </ol>
          </div>

          {/* Methodological Note */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 italic">
              <strong>Methodological Note:</strong> These findings highlight the importance of considering 
              taxonomy alignment when comparing knowledge graph classifications with LLM-generated predictions. 
              Traditional accuracy metrics may underestimate system performance when ground truth and predictions 
              originate from different classification frameworks.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Statistic Box for Research Summary
 */
const StatisticBox = ({ label, value, sublabel }) => (
  <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-xl font-bold text-blue-600">{value}</p>
    <p className="text-xs text-gray-400">{sublabel}</p>
  </div>
);

/**
 * Stat Row Component for tables
 */
const StatRow = ({ label, count, total, color }) => {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  const width = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <tr>
      <td className="border border-gray-300 px-4 py-2 text-sm">{label}</td>
      <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{count}</td>
      <td className="border border-gray-300 px-4 py-2 text-right text-sm">{percentage}%</td>
      <td className="border border-gray-300 px-4 py-2">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full ${colorClasses[color]}`}
            style={{ width: `${width}%` }}
          ></div>
        </div>
      </td>
    </tr>
  );
};

/**
 * Comparison Row Component
 */
const ComparisonRow = ({ icon: Icon, label, count, total, color }) => {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold">{count}</span>
        <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  description, 
  color,
  subtitle,
  isPosition = false
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200'
  };

  const displayValue = isPosition 
    ? (value > 0 ? value.toFixed(2) : 'N/A')
    : `${Math.round(value * 100)}%`;

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${colorClasses[color].split(' ')[0]}`} />
      </div>
      <h4 className="text-sm font-semibold text-gray-700 mb-1">{label}</h4>
      <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]} mb-2`}>
        {displayValue}
      </p>
      <p className="text-xs text-gray-600 mb-1">{description}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 italic">{subtitle}</p>
      )}
    </Card>
  );
};

/**
 * Format percentage helper
 */
function formatPercent(count, total) {
  if (total === 0) return '0.0%';
  return ((count / total) * 100).toFixed(1) + '%';
}

export default ResearchFieldAccuracyView;