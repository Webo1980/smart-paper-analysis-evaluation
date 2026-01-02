  // src/components/evaluation/research-field/components/ConfidenceSection.jsx
  import React, { useState } from 'react';
  import { Gauge, BarChart, Target, Info, ChevronDown, ChevronUp } from 'lucide-react';
  import { Card } from '../../../ui/card';
  import { formatPercent } from '../utils/commonMetricsUtils';
  import { getStatusBadgeColor } from '../../base/utils/uiUtils';
  import { 
    calculateConfidenceMetrics,
    generateCalibrationExplanation,
    generateRankingExplanation,
    generateHierarchyExplanation
  } from '../utils/confidenceMetricsUtils';
  import { 
    GaugeChart, 
    ConfidenceDistributionChart, 
    HierarchyVisualization 
  } from '../visualizations/confidenceVisualizations';

  const ConfidenceSection = ({ 
    loading, 
    hierarchyAnalysis, 
    confidenceScore,
    details,
    groundTruth,
    predictedValues = [],
    confidenceMetrics // Pre-calculated metrics
  }) => {
    const [expandedSections, setExpandedSections] = useState({
      calibration: false,
      hierarchy: false,
      ranking: false,
      formula: false
    });

    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    // Use pre-calculated metrics if available, otherwise calculate them here
    const { metrics, details: metricDetails } = confidenceMetrics || 
      calculateConfidenceMetrics({
        predictedValues,
        groundTruth
      });

    // Generate explanations
    const calibrationExplanation = generateCalibrationExplanation(metrics);
    const rankingExplanation = generateRankingExplanation(metrics);
    const hierarchyExplanation = generateHierarchyExplanation(metrics);

    return (
      <Card className="p-4 space-y-4">
        <h3 className="text-lg font-medium mb-2 text-gray-800">Confidence Quality Analysis</h3>
        <p className="text-sm mb-3 text-gray-600">
          Evaluates the reliability of confidence scores from the research field classifier by comparing model confidence with actual prediction accuracy.
        </p>

        {/* Overview Card - Improved UI */}
        <div className="bg-white p-4 rounded border border-gray-200">
          <h5 className="font-medium mb-2 text-gray-800">Overall Confidence Quality Score</h5>
          
          {/* Improved Explanation Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded border">
              <p className="text-sm font-medium mb-2">Explanation</p>
              <p className="text-sm text-gray-700">
                Confidence quality measures how well the model's confidence scores reflect actual prediction accuracy across multiple dimensions.
              </p>
              
              <div className="mt-3 pt-2 border-t">
                <p className="text-xs font-medium mb-1 text-gray-700">Key Components:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-blue-50 text-xs px-2 py-1 rounded border border-blue-100">
                    Calibration: {formatPercent(metrics.calibrationQuality)}
                  </span>
                  <span className="bg-purple-50 text-xs px-2 py-1 rounded border border-purple-100">
                    Ranking: {formatPercent(metrics.rankingQuality)}
                  </span>
                  <span className="bg-amber-50 text-xs px-2 py-1 rounded border border-amber-100">
                    Hierarchy: {formatPercent(metrics.hierarchyQuality)}
                  </span>
                </div>
              </div>
            </div>

            {/* Improved Score Calculation Box */}
            <div className="bg-gray-50 p-3 rounded border">
              <p className="text-sm font-medium mb-2">Score Calculation</p>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center">
                  <p className="text-xs font-medium text-blue-800">Calibration</p>
                  <p className="text-sm">{formatPercent(metrics.calibrationQuality)}</p>
                  <p className="text-xs text-blue-600">× 0.4</p>
                  <p className="text-xs font-medium mt-1">{formatPercent(metricDetails.weightedCalibration)}</p>
                </div>
                
                <div className="bg-purple-50 p-2 rounded border border-purple-100 text-center">
                  <p className="text-xs font-medium text-purple-800">Ranking</p>
                  <p className="text-sm">{formatPercent(metrics.rankingQuality)}</p>
                  <p className="text-xs text-purple-600">× 0.4</p>
                  <p className="text-xs font-medium mt-1">{formatPercent(metricDetails.weightedRanking)}</p>
                </div>
                
                <div className="bg-amber-50 p-2 rounded border border-amber-100 text-center">
                  <p className="text-xs font-medium text-amber-800">Hierarchy</p>
                  <p className="text-sm">{formatPercent(metrics.hierarchyQuality)}</p>
                  <p className="text-xs text-amber-600">× 0.2</p>
                  <p className="text-xs font-medium mt-1">{formatPercent(metricDetails.weightedHierarchy)}</p>
                </div>
              </div>
              
              <div className="bg-white p-2 rounded border text-center">
                <p className="text-xs text-gray-700 mb-1">Final Score</p>
                <p className="text-lg font-medium text-gray-800">
                  {formatPercent(metrics.confidenceQualityScore)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {metricDetails.weightedCalibration.toFixed(2)} + {metricDetails.weightedRanking.toFixed(2)} + {metricDetails.weightedHierarchy.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Formula Interpretation Toggle */}
          <div className="border border-blue-200 rounded bg-white">
          {/* Toggle Header */}
          <div 
            className="bg-blue-50 p-3 rounded-t text-sm cursor-pointer flex justify-between items-center hover:bg-blue-100 transition-colors"
            onClick={() => toggleSection('formula')}
          >
            <div className="flex items-center">
              <Info className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">Detailed Formula Interpretation</span>
            </div>
            {expandedSections.formula ? (
              <ChevronUp className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            )}
          </div>

          {/* Expandable Content */}
            {expandedSections.formula && (
              <div className="p-3 pt-0 overflow-x-auto rounded-b">
                <div className="mt-3">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="p-2 text-left border">Metric</th>
                        <th className="p-2 text-left border">Formula</th>
                        <th className="p-2 text-left border w-1/3">Interpretation</th>
                        <th className="p-2 text-left border">Calculation Details</th>
                        <th className="p-2 text-left border">Score Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Calibration Quality */}
                      <tr>
                        <td className="p-2 border font-medium">Calibration Quality</td>
                        <td className="p-2 border">
                          <code className="text-xs font-mono">1 - |Truth - Confidence|</code>
                        </td>
                        <td className="p-2 border text-xs text-gray-700">
                          <div className="space-y-1">
                            <p className="font-semibold">Model Confidence Alignment</p>
                            <p>Measures alignment between confidence and actual accuracy</p>
                            <ul className="list-disc list-inside">
                              <li>1.0: Perfect alignment</li>
                              <li>0.0: Complete mismatch</li>
                            </ul>
                          </div>
                        </td>
                        <td className="p-2 border text-xs">
                          <div className="space-y-1">
                            <p>Truth: {metrics.isTopMatch ? '1.0 (Correct)' : '0.0 (Incorrect)'}</p>
                            <p>Confidence: {(metricDetails.processedPredictions[0]?.score / 100).toFixed(2)}</p>
                            <p className="font-semibold mt-1">
                              = 1 - |{metrics.isTopMatch ? '1.0' : '0.0'} - {(metricDetails.processedPredictions[0]?.score / 100).toFixed(2)}|
                            </p>
                            <p>= {formatPercent(metrics.calibrationQuality)}</p>
                          </div>
                        </td>
                        <td className="p-2 border text-xs">
                          <div className="space-y-1">
                            <span className={`font-medium ${
                              metrics.calibrationQuality > 0.7 ? "text-green-600" : 
                              metrics.calibrationQuality > 0.4 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {formatPercent(metrics.calibrationQuality)}
                            </span>
                            <p className="mt-1">
                              {metrics.calibrationQuality > 0.7 ? "Highly reliable confidence" : 
                              metrics.calibrationQuality > 0.4 ? "Moderate confidence reliability" : 
                              "Low confidence reliability"}
                            </p>
                          </div>
                        </td>
                      </tr>

                      {/* Ranking Quality */}
                      <tr>
                        <td className="p-2 border font-medium">Ranking Quality</td>
                        <td className="p-2 border">
                          <code className="text-xs font-mono">1 / (Position + 1)</code>
                        </td>
                        <td className="p-2 border text-xs text-gray-700">
                          <div className="space-y-1">
                            <p className="font-semibold">Ground Truth Position Reward</p>
                            <p>Rewards higher-ranked correct predictions</p>
                            <ul className="list-disc list-inside">
                              <li>Position 1: Score 1.0</li>
                              <li>Position 2: Score 0.5</li>
                              <li>Position 3: Score 0.33</li>
                              <li>Not found: Score 0.0</li>
                            </ul>
                          </div>
                        </td>
                        <td className="p-2 border text-xs">
                          <div className="space-y-1">
                            <p>Position: {
                              metrics.groundTruthPosition >= 0 
                                ? metrics.groundTruthPosition + 1 
                                : 'Not Found'
                            }</p>
                            <p className="font-semibold mt-1">
                              = 1 / ({metrics.groundTruthPosition >= 0 ? metrics.groundTruthPosition + 1 : '∞'})
                            </p>
                            <p>= {formatPercent(metrics.rankingQuality)}</p>
                          </div>
                        </td>
                        <td className="p-2 border text-xs">
                          <div className="space-y-1">
                            <span className={`font-medium ${
                              metrics.rankingQuality > 0.7 ? "text-green-600" : 
                              metrics.rankingQuality > 0.3 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {formatPercent(metrics.rankingQuality)}
                            </span>
                            <p className="mt-1">
                              {metrics.groundTruthPosition === 0 ? "Top-ranked prediction" : 
                              metrics.groundTruthPosition > 0 ? `Ranked ${metrics.groundTruthPosition + 1}` : 
                              "Not in top predictions"}
                            </p>
                          </div>
                        </td>
                      </tr>

                      {/* Hierarchy Quality */}
                      <tr>
                        <td className="p-2 border font-medium">Hierarchy Quality</td>
                        <td className="p-2 border">
                          <code className="text-xs font-mono">1 - min(Dist / 3, 1)</code>
                        </td>
                        <td className="p-2 border text-xs text-gray-700">
                          <div className="space-y-1">
                            <p className="font-semibold">Taxonomic Distance Measurement</p>
                            <p>Measures relatedness between predictions and truth</p>
                            <ul className="list-disc list-inside">
                              <li>Distance 0: Score 1.0</li>
                              <li>Distance 1: Score 0.67</li>
                              <li>Distance 2: Score 0.33</li>
                              <li>Distance 3+: Score 0.0</li>
                            </ul>
                          </div>
                        </td>
                        <td className="p-2 border text-xs">
                          <div className="space-y-1">
                            <p>Hierarchical Distance: {metrics.hierarchyMismatch}</p>
                            <p className="font-semibold mt-1">= 1 - min({metrics.hierarchyMismatch} / 3, 1)</p>
                            <p>= {formatPercent(metrics.hierarchyQuality)}</p>
                          </div>
                        </td>
                        <td className="p-2 border text-xs">
                          <div className="space-y-1">
                            <span className={`font-medium ${
                              metrics.hierarchyQuality > 0.7 ? "text-green-600" : 
                              metrics.hierarchyQuality > 0.4 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {formatPercent(metrics.hierarchyQuality)}
                            </span>
                            <p className="mt-1">
                              {metrics.hierarchyMismatch === 0 ? "Exact field match" : 
                              metrics.hierarchyMismatch === 1 ? "Closely related fields" : 
                              metrics.hierarchyMismatch === 2 ? "Moderately related fields" : 
                              "Distantly related fields"}
                            </p>
                          </div>
                        </td>
                      </tr>
                  </tbody>
                  </table>
                </div>
            </div>
          )}
        </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Prediction Confidence - Improved UI */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div 
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => toggleSection('calibration')}
            >
              <div className="flex items-center space-x-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                <h5 className="font-medium text-gray-800">Top Prediction Confidence</h5>
              </div>
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded-full mr-2 ${getStatusBadgeColor(metrics.calibrationQuality)}`}>
                  {formatPercent(metrics.calibrationQuality)}
                </span>
                {expandedSections.calibration ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center mt-3">
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-sm font-medium text-gray-700">
                  {metricDetails.topPrediction}
                </div>
              </div>
              
              {/* Using the GaugeChart component */}
              <GaugeChart 
                value={metricDetails.processedPredictions[0]?.score || 0}
                isCorrect={metrics.isTopMatch}
              />
              
              <div className="mt-2 text-sm text-center">
                <span className="font-medium">{groundTruth}</span>
                <span className="text-gray-500 text-xs block">Ground Truth Field</span>
              </div>
            </div>
            
            {expandedSections.calibration && (
              <div className="mt-3 bg-gray-50 p-3 rounded border text-xs">
                <p className="font-medium mb-1 text-gray-800">Calibration Analysis</p>
                <p className="text-gray-600 mb-2">
                  The model predicted "{metricDetails.topPrediction}" with {metricDetails.processedPredictions[0]?.score || 0}% confidence.
                  {metrics.groundTruthPosition === 0 
                    ? " This prediction is correct." 
                    : metrics.groundTruthPosition > 0
                      ? ` The ground truth is at position ${metrics.groundTruthPosition + 1}.`
                      : " The ground truth is not in the predictions."}
                </p>
                
                {/* Improved Calibration Explanation */}
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                  <p className="font-medium text-blue-800 mb-1">Calibration Assessment:</p>
                  <p className="text-blue-700">{calibrationExplanation}</p>
                  
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-800 mb-1">What makes good calibration?</p>
                    <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                      <li>High confidence (80-100%) for correct predictions</li>
                      <li>Moderate confidence (40-70%) for uncertain cases</li>
                      <li>Low confidence (0-40%) for incorrect predictions</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confidence Distribution - Improved UI */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <div 
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => toggleSection('ranking')}
            >
              <div className="flex items-center space-x-2">
                <BarChart className="h-5 w-5 text-blue-600" />
                <h5 className="font-medium text-gray-800">Confidence Distribution</h5>
              </div>
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded-full mr-2 ${getStatusBadgeColor(metrics.rankingQuality)}`}>
                  {formatPercent(metrics.rankingQuality)}
                </span>
                {expandedSections.ranking ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {/* Using the ConfidenceDistributionChart component */}
            <ConfidenceDistributionChart 
              predictions={metricDetails.processedPredictions}
              groundTruth={groundTruth}
            />
            
            {expandedSections.ranking && (
              <div className="mt-3 bg-gray-50 p-3 rounded border text-xs">
                <p className="font-medium mb-1 text-gray-800">Ranking Analysis</p>
                <p className="text-gray-600 mb-2">
                  The ground truth field "{groundTruth}" is {metrics.groundTruthPosition === -1 
                    ? "not in the top predictions" 
                    : `ranked at position ${metrics.groundTruthPosition + 1} with ${metricDetails.processedPredictions[metrics.groundTruthPosition]?.score}% confidence`}.
                </p>
                
                {/* Improved Ranking Explanation */}
                <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-100">
                  <p className="font-medium text-purple-800 mb-1">Ranking Assessment:</p>
                  <p className="text-purple-700">{rankingExplanation}</p>
                  
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <p className="text-xs text-purple-800 mb-1">Ranking Quality Implications:</p>
                    <ul className="list-disc list-inside text-xs text-purple-700 space-y-1">
                      <li>Top position: Model correctly identified the primary field</li>
                      <li>Top 3: Model recognized the correct domain area</li>
                      <li>Outside top 5: Model struggled to identify the research domain</li>
                      <li>Score impact: Position 1 (100%), Position 2 (50%), Position 3 (33%), etc.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hierarchy Quality Section - Improved UI */}
        <div className="bg-white p-4 rounded border border-gray-200">
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleSection('hierarchy')}
          >
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-indigo-600" />
              <h5 className="font-medium text-gray-800">Hierarchy Analysis</h5>
            </div>
            <div className="flex items-center">
              <span className={`text-xs px-2 py-1 rounded-full mr-2 ${getStatusBadgeColor(metrics.hierarchyQuality)}`}>
                {formatPercent(metrics.hierarchyQuality)}
              </span>
              {expandedSections.hierarchy ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
          
          {/* Using the HierarchyVisualization component */}
          <HierarchyVisualization 
            groundTruthPosition={metrics.groundTruthPosition} 
            hierarchyMismatch={metrics.hierarchyMismatch}
          />
          
          {expandedSections.hierarchy && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
              <h5 className="text-xs font-semibold mb-2 text-gray-800">Hierarchical Distance Analysis</h5>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span>Top prediction:</span>
                  <span className="font-medium">{metricDetails.topPrediction}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ground truth:</span>
                  <span className="font-medium">{groundTruth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hierarchical distance:</span>
                  <span className="font-medium">{metrics.hierarchyMismatch}</span>
                </div>
                
                {/* Improved Hierarchy Explanation */}
                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-100">
                  <p className="font-medium text-amber-800 mb-1">Hierarchy Assessment:</p>
                  <p className="text-amber-700">{hierarchyExplanation}</p>
                  
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs text-amber-800 mb-1">Understanding Hierarchical Relationships:</p>
                    <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                      <li><span className="font-medium">Exact match (0):</span> Identical research field</li>
                      <li><span className="font-medium">Close (1):</span> Parent-child or sibling relationship</li>
                      <li><span className="font-medium">Moderate (2):</span> Share a common ancestor nearby</li>
                      <li><span className="font-medium">Distant (3+):</span> Different branches of taxonomy</li>
                    </ul>
                    </div>
                </div>
                
                <div className="flex justify-between">
                  <span>Hierarchy quality:</span>
                  <span className={`font-medium ${
                    metrics.hierarchyQuality > 0.7 ? "text-green-600" : 
                    metrics.hierarchyQuality > 0.4 ? "text-yellow-600" : "text-red-600"
                  }`}>{formatPercent(metrics.hierarchyQuality)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  export default ConfidenceSection;