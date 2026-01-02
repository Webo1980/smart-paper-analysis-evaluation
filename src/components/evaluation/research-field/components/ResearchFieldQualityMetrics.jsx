// src/components/evaluation/research-field/components/ResearchFieldQualityMetrics.jsx
// FIXED: Uses pre-calculated values from metrics prop when available
// Only recalculates when no pre-calculated values exist OR during live rating changes

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../ui/card';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { formatPercentage, getAutomatedScore } from '../../base/utils/baseMetricsUtils';
import { formatPercent } from '../utils/commonMetricsUtils';
import { processResearchFieldQuality } from '../utils/researchFieldMetrics';
import { evaluateResearchFieldQuality } from '../utils/researchFieldEvaluation';
import { loadResearchFieldHierarchy } from '../services/fieldHierarchyService';
import { calculateConfidenceMetrics } from '../utils/confidenceMetricsUtils';
import { calculateRelevanceMetrics } from '../utils/relevanceMetricsUtils';
import { calculateConsistencyMetrics } from '../utils/consistencyMetricsUtils';
import ConfidenceSection from './ConfidenceSection';
import RelevanceSection from './RelevanceSection';
import ConsistencySection from './ConsistencySection';
import QualityMetricsDisplay from './QualityMetricsDisplay';
import { 
  TEXT_CONFIG, 
  METRIC_CONFIG, 
  QUALITY_WEIGHTS, 
  DEFAULT_RATINGS 
} from '../config/researchFieldConfig';

const ResearchFieldQualityMetrics = ({
  metrics,
  orkgValue,
  predictedValues,
  expertiseMultiplier,
  ratings
}) => {
  console.log("ResearchFieldQualityMetrics: Received metrics =", metrics);
  console.log("ResearchFieldQualityMetrics: Received orkgValue =", orkgValue);
  console.log("ResearchFieldQualityMetrics: Received predictedValues =", predictedValues);
  console.log("ResearchFieldQualityMetrics: Received expertiseMultiplier =", expertiseMultiplier);
  console.log("ResearchFieldQualityMetrics: Received ratings =", ratings);  

  const { 
    confidence: confidenceRating = DEFAULT_RATINGS.confidence, 
    consistency: consistencyRating = DEFAULT_RATINGS.consistency, 
    relevance: relevanceRating = DEFAULT_RATINGS.relevance 
  } = ratings || {};

  // =========================================================================
  // HELPER: Extract pre-calculated values from metrics prop
  // =========================================================================
  const getPreCalculatedValues = () => {
    if (!metrics) return null;
    
    // Check for dimension scores
    const getMetricValue = (metric) => {
      if (metric === undefined || metric === null) return null;
      if (typeof metric === 'number') return metric;
      if (metric.value !== undefined) return metric.value;
      if (metric.score !== undefined) return metric.score;
      return null;
    };
    
    const confidence = getMetricValue(metrics.confidence);
    const relevance = getMetricValue(metrics.relevance);
    const consistency = getMetricValue(metrics.consistency);
    
    // Check for overall score
    const overallScore = metrics.overallQuality?.value ?? 
                         metrics.overallQuality?.final ?? 
                         metrics.automatedScore?.value ??
                         metrics.automatedOverallScore;
    
    // Check for scoreDetails (final score with user ratings applied)
    const finalScore = metrics.scoreDetails?.finalScore ??
                       metrics.overallQuality?.value ??
                       metrics.overallQuality?.final;
    
    // Only return if we have at least the dimension scores
    if (confidence !== null && relevance !== null && consistency !== null) {
      return {
        confidence,
        relevance,
        consistency,
        overallScore: overallScore ?? (
          confidence * (metrics.weights?.confidence || QUALITY_WEIGHTS.confidence) +
          relevance * (metrics.weights?.relevance || QUALITY_WEIGHTS.relevance) +
          consistency * (metrics.weights?.consistency || QUALITY_WEIGHTS.consistency)
        ),
        finalScore,
        weights: metrics.weights || QUALITY_WEIGHTS,
        scoreDetails: metrics.scoreDetails
      };
    }
    
    return null;
  };

  // Get pre-calculated values (if any)
  const preCalculated = getPreCalculatedValues();
  
  // Track if we're in "view mode" (pre-calculated) or "edit mode" (recalculating)
  const [isViewMode, setIsViewMode] = useState(!!preCalculated);

  // =========================================================================
  // STATE: Initialize from pre-calculated values OR defaults
  // =========================================================================
  const [qualityAnalysis, setQualityAnalysis] = useState(() => {
    if (preCalculated) {
      return {
        confidence: preCalculated.confidence,
        relevance: preCalculated.relevance,
        consistency: preCalculated.consistency,
        details: {
          confidenceReason: "Pre-calculated from evaluation",
          relevanceReason: "Pre-calculated from evaluation",
          consistencyReason: "Pre-calculated from evaluation"
        }
      };
    }
    return {
      confidence: 0.5,
      relevance: 0.5,
      consistency: 0.5,
      details: {
        confidenceReason: "Loading analysis...",
        relevanceReason: "Loading analysis...",
        consistencyReason: "Loading analysis..."
      }
    };
  });

  const [hierarchyAnalysis, setHierarchyAnalysis] = useState(null);
  const [researchFieldsTree, setResearchFieldsTree] = useState(null);
  const [loading, setLoading] = useState(!preCalculated); // Don't show loading if we have pre-calculated
  
  const [metricResults, setMetricResults] = useState({
    confidence: null,
    relevance: null,
    consistency: null
  });
  
  const [qualityResults, setQualityResults] = useState(() => {
    if (preCalculated) {
      // Build qualityResults from pre-calculated values
      return {
        qualityData: {
          fieldSpecificMetrics: {
            confidence: { score: preCalculated.confidence, issues: [] },
            relevance: { score: preCalculated.relevance, issues: [] },
            consistency: { score: preCalculated.consistency, issues: [] }
          },
          weights: preCalculated.weights,
          overallScore: preCalculated.overallScore,
          automatedOverallScore: preCalculated.overallScore
        },
        scoreDetails: preCalculated.scoreDetails || {
          finalScore: preCalculated.finalScore || preCalculated.overallScore,
          automatedScore: preCalculated.overallScore
        }
      };
    }
    return null;
  });

  const getResearchFieldScore = (metricName, metrics, analysisData, metricType) => {
    if (analysisData?.fieldSpecificMetrics && 
        (metricName === 'confidence' || metricName === 'relevance' || metricName === 'consistency')) {
      return analysisData.fieldSpecificMetrics[metricName].score;
    }
    
    if (metricName === 'overallQuality' && analysisData) {
      return analysisData.automatedOverallScore || analysisData.overallScore || 0;
    }
    
    return getAutomatedScore(metricName, metrics, analysisData, metricType);
  };

  // Track if we've done initial load with pre-calculated values
  const hasInitializedRef = useRef(false);
  const prevRatingsRef = useRef({ confidenceRating, relevanceRating, consistencyRating });

  // =========================================================================
  // EFFECT: Load analysis - but respect pre-calculated values
  // =========================================================================
  useEffect(() => {
    // Check if ratings have changed (user is actively editing)
    const ratingsChanged = 
      prevRatingsRef.current.confidenceRating !== confidenceRating ||
      prevRatingsRef.current.relevanceRating !== relevanceRating ||
      prevRatingsRef.current.consistencyRating !== consistencyRating;
    
    // Update previous ratings ref
    prevRatingsRef.current = { confidenceRating, relevanceRating, consistencyRating };
    
    // CASE 1: First mount with pre-calculated values - skip recalculation entirely
    if (!hasInitializedRef.current && preCalculated) {
      console.log("ResearchFieldQualityMetrics: Using pre-calculated values from metrics prop");
      console.log("  Pre-calculated scores:", {
        confidence: preCalculated.confidence,
        relevance: preCalculated.relevance,
        consistency: preCalculated.consistency,
        finalScore: preCalculated.finalScore
      });
      hasInitializedRef.current = true;
      setLoading(false);
      
      // Still load hierarchy for display purposes (but don't recalculate scores)
      loadResearchFieldHierarchy().then(dataHierarchy => {
        setResearchFieldsTree(dataHierarchy);
      }).catch(err => console.error("Failed to load hierarchy:", err));
      
      return;
    }
    
    // CASE 2: Already initialized with pre-calc AND ratings haven't changed - skip
    if (hasInitializedRef.current && preCalculated && !ratingsChanged && isViewMode) {
      console.log("ResearchFieldQualityMetrics: Skipping recalculation (view mode, no rating changes)");
      return;
    }
    
    // CASE 3: Ratings changed - need to recalculate
    if (ratingsChanged) {
      console.log("ResearchFieldQualityMetrics: Ratings changed, recalculating...");
      setIsViewMode(false);
    }
    
    // Mark as initialized
    hasInitializedRef.current = true;

    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const groundTruth = orkgValue || '';
        const dataHierarchy = await loadResearchFieldHierarchy();
        
        const hierarchyEval = await evaluateResearchFieldQuality(
          { fields: predictedValues || [] },
          { 
            research_field_name: groundTruth,
            research_field: {}
          }
        );

        if (hierarchyEval.success) {
          const confidenceScore = hierarchyEval.metrics.confidence;
          const relevanceScore = hierarchyEval.metrics.relevance;
          const consistencyScore = hierarchyEval.metrics.consistency;
  
          const weightedConfidence = confidenceScore * QUALITY_WEIGHTS.confidence;
          const weightedRelevance = relevanceScore * QUALITY_WEIGHTS.relevance;
          const weightedConsistency = consistencyScore * QUALITY_WEIGHTS.consistency;
          
          const automatedOverallScore = weightedConfidence + 
                                         weightedRelevance + 
                                         weightedConsistency;
  
          const processedQuality = processResearchFieldQuality(
            'research_field',
            {
              confidence: confidenceScore,
              relevance: relevanceScore,
              consistency: consistencyScore,
              details: hierarchyEval.details
            },
            relevanceRating,
            expertiseMultiplier,
            QUALITY_WEIGHTS
          );
  
          const finalQualityData = {
            ...processedQuality.qualityData,
            fieldSpecificMetrics: {
              confidence: { 
                score: confidenceScore,
                weightedScore: weightedConfidence,
                issues: []
              },
              relevance: { 
                score: relevanceScore,
                weightedScore: weightedRelevance,
                issues: []
              },
              consistency: { 
                score: consistencyScore,
                weightedScore: weightedConsistency,
                issues: []
              }
            },
            weights: QUALITY_WEIGHTS,
            overallScore: automatedOverallScore,
            automatedOverallScore: automatedOverallScore
          };
  
          setResearchFieldsTree(dataHierarchy);
          setHierarchyAnalysis(hierarchyEval);
          setQualityAnalysis({
            confidence: confidenceScore,
            relevance: relevanceScore,
            consistency: consistencyScore,
            details: hierarchyEval.details
          });
          
          setQualityResults({
            ...processedQuality,
            qualityData: finalQualityData
          });
  
          setMetricResults({
            confidence: calculateConfidenceMetrics({ predictedValues, groundTruth }),
            relevance: calculateRelevanceMetrics({ 
              groundTruth, 
              prediction: predictedValues?.[0]?.name || '', 
              researchFieldsTree: dataHierarchy 
            }),
            consistency: calculateConsistencyMetrics({ groundTruth, predictedValues })
          });
        }
      } catch (error) {
        console.error("Analysis loading error:", error);
      } finally {
        setLoading(false);
      }
    };
  
    loadAnalysis();
  }, [
    orkgValue, 
    JSON.stringify(predictedValues), 
    expertiseMultiplier, 
    relevanceRating,
    confidenceRating,
    consistencyRating,
    // Don't include preCalculated or isViewMode to avoid loops
  ]);

  const groundTruth = orkgValue || '';
  
  const actualPredictions = Array.isArray(predictedValues) 
    ? predictedValues.slice(0, 5).map(p => p.name || p.field || '')
    : [];

  const renderQualityTable = (data, showAnalysis, toggleAnalysis) => {
    const overallScore = (
      qualityAnalysis.confidence * QUALITY_WEIGHTS.confidence +
      qualityAnalysis.relevance * QUALITY_WEIGHTS.relevance +
      qualityAnalysis.consistency * QUALITY_WEIGHTS.consistency
    );

    return (
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded">
          <h6 className="font-medium mb-2">Ground Truth vs Top 5 Predictions:</h6>
          <div className="space-y-2">
            <div>
              <strong className="text-xs">Reference (ORKG):</strong>
              <div className="text-sm bg-white p-2 rounded border mt-1">{groundTruth}</div>
            </div>
            <div>
              <strong className="text-xs">System Predictions:</strong>
              <ol className="list-decimal list-inside text-sm bg-white p-2 rounded border mt-1 space-y-1">
                {actualPredictions.map((pred, idx) => (
                  <li key={idx} className={idx === 0 ? 'font-medium text-blue-700' : ''}>
                    {pred}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left border-r">Component</th>
                <th className="p-2 text-left border-r">Confidence ({QUALITY_WEIGHTS.confidence})</th>
                <th className="p-2 text-left border-r">Relevance ({QUALITY_WEIGHTS.relevance})</th>
                <th className="p-2 text-left">Consistency ({QUALITY_WEIGHTS.consistency})</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="p-2 border-r font-medium">Component Score</td>
                <td className="p-2 border-r font-medium">
                  {formatPercent(qualityAnalysis.confidence)}
                </td>
                <td className="p-2 border-r font-medium">
                  {formatPercent(qualityAnalysis.relevance)}
                </td>
                <td className="p-2 font-medium">
                  {formatPercent(qualityAnalysis.consistency)}
                </td>
              </tr>
              <tr>
                <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
                <td className="p-2 border-r text-blue-700 font-medium">
                  {formatPercent(qualityAnalysis.confidence * QUALITY_WEIGHTS.confidence)}
                </td>
                <td className="p-2 border-r text-blue-700 font-medium">
                  {formatPercent(qualityAnalysis.relevance * QUALITY_WEIGHTS.relevance)}
                </td>
                <td className="p-2 text-blue-700 font-medium">
                  {formatPercent(qualityAnalysis.consistency * QUALITY_WEIGHTS.consistency)}
                </td>
              </tr>
              <tr>
                <td className="p-2 border-r font-medium bg-gray-50">Potential Issues</td>
                <td className="p-2 border-r">
                  {hierarchyAnalysis?.metrics?.exactMatch === false ? (
                    <ul className="list-disc list-inside">
                      <li>No exact match found in hierarchy</li>
                    </ul>
                  ) : (
                    <span className="text-green-600">No confidence issues detected</span>
                  )}
                </td>
                <td className="p-2 border-r">
                  {metricResults.relevance && (metricResults.relevance.metrics.wordOverlapScore < 0.3 || metricResults.relevance.metrics.jaccardScore < 0.3) ? (
                    <ul className="list-disc list-inside">
                      {metricResults.relevance.metrics.wordOverlapScore < 0.3 && <li>Low word overlap with reference</li>}
                      {metricResults.relevance.metrics.jaccardScore < 0.3 && <li>Low Jaccard similarity with reference</li>}
                    </ul>
                  ) : (
                    <span className="text-green-600">No relevance issues detected</span>
                  )}
                </td>
                <td className="p-2">
                  {metricResults.consistency && metricResults.consistency.details.visualizationItems.length < 2 ? (
                    <ul className="list-disc list-inside">
                      <li>Not enough predictions to assess consistency</li>
                    </ul>
                  ) : (
                    <span className="text-green-600">No consistency issues detected</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="p-2 bg-blue-50">
            <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
            <div>
              <code className="block bg-gray-50 p-2 rounded text-xs">
                OverallQuality = (Confidence × {QUALITY_WEIGHTS.confidence}) + (Relevance × {QUALITY_WEIGHTS.relevance}) + (Consistency × {QUALITY_WEIGHTS.consistency})<br/>
                = ({formatPercent(qualityAnalysis.confidence)} × {QUALITY_WEIGHTS.confidence}) + 
                ({formatPercent(qualityAnalysis.relevance)} × {QUALITY_WEIGHTS.relevance}) + 
                ({formatPercent(qualityAnalysis.consistency)} × {QUALITY_WEIGHTS.consistency})<br/>
                = {formatPercent(qualityAnalysis.confidence * QUALITY_WEIGHTS.confidence)} + 
                {formatPercent(qualityAnalysis.relevance * QUALITY_WEIGHTS.relevance)} + 
                {formatPercent(qualityAnalysis.consistency * QUALITY_WEIGHTS.consistency)}<br/>
                = {formatPercent(overallScore)}
              </code>
            </div>
            <div className="mt-3">
              <QualityMetricsDisplay qualityData={data} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMetricDetails = (metricType) => {
    if (!qualityResults) return null;
    
    const finalWeightedScore = qualityResults.scoreDetails?.finalScore || 
                                qualityResults.qualityData?.overallScore || 0;
    
    switch(metricType) {
      case 'confidence':
        return (
          <ConfidenceSection 
            loading={loading}
            hierarchyAnalysis={hierarchyAnalysis}
            confidenceScore={qualityAnalysis.confidence}
            details={qualityAnalysis.details.confidenceReason}
            groundTruth={groundTruth}
            predictedValues={predictedValues}
            confidenceMetrics={metricResults.confidence}
            rating={confidenceRating}
            finalWeightedScore={finalWeightedScore}
          />
        );
      case 'relevance':
        return (
          <RelevanceSection
            groundTruth={groundTruth}
            prediction={actualPredictions[0]}
            hierarchyAnalysis={hierarchyAnalysis}
            researchFieldsTree={researchFieldsTree}
            predictedValues={predictedValues}
            relevanceMetrics={metricResults.relevance}
            relevanceScore={qualityAnalysis.relevance}
            details={qualityAnalysis.details.relevanceReason}
            rating={relevanceRating}
            finalWeightedScore={finalWeightedScore}
          />
        );
      case 'consistency':
        return (
          <ConsistencySection
            groundTruth={groundTruth}
            predictedValues={predictedValues}
            predictions={actualPredictions}
            consistencyScore={qualityAnalysis.consistency}
            details={qualityAnalysis.details.consistencyReason}
            hierarchyAnalysis={hierarchyAnalysis}
            consistencyMetrics={metricResults.consistency}
            rating={consistencyRating}
            finalWeightedScore={finalWeightedScore}
          />
        );
      default:
        return null;
    }
  };

  const calculatedOverallScore = (
    qualityAnalysis.confidence * QUALITY_WEIGHTS.confidence +
    qualityAnalysis.relevance * QUALITY_WEIGHTS.relevance +
    qualityAnalysis.consistency * QUALITY_WEIGHTS.consistency
  );

  const fallbackQualityData = {
    fieldSpecificMetrics: {
      confidence: { 
        score: qualityAnalysis.confidence,
        issues: []
      },
      relevance: { 
        score: qualityAnalysis.relevance,
        issues: []
      },
      consistency: { 
        score: qualityAnalysis.consistency,
        issues: []
      }
    },
    weights: QUALITY_WEIGHTS,
    overallScore: calculatedOverallScore,
    automatedOverallScore: calculatedOverallScore,
    explanation: {
      confidence: qualityAnalysis.details.confidenceReason,
      relevance: qualityAnalysis.details.relevanceReason,
      consistency: qualityAnalysis.details.consistencyReason
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Research Field Quality Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        This evaluation assesses the quality of research field identification across multiple dimensions:
        confidence, relevance, and consistency.
      </p>
      <BaseContentMetrics
        metrics={metrics}
        referenceValue={groundTruth}
        extractedValue={
          Array.isArray(predictedValues) && predictedValues.length > 0 ? 
            predictedValues[0].name || predictedValues[0].field : 
            'No prediction'
        }
        expertiseWeight={expertiseMultiplier}
        expertiseMultiplier={expertiseMultiplier}
        rating={relevanceRating}
        fieldName="Research Field"
        metricType="quality"
        textConfig={TEXT_CONFIG.quality}
        analysisData={qualityResults?.qualityData || fallbackQualityData}
        renderAnalysisComponent={renderQualityTable}
        renderMetricDetails={renderMetricDetails}
        metricConfig={METRIC_CONFIG}
        scoreDetails={qualityResults?.scoreDetails}
        utils={{ getAutomatedScore: getResearchFieldScore }}
      />
    </Card>
  );
};

export default ResearchFieldQualityMetrics;