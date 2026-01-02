//src\components\evaluation\research-field\components\ConsistencySection.jsx
import React, { useState } from 'react';
import { Info, Layers, Target, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import { formatPercent } from '../utils/commonMetricsUtils';
import { calculateConsistencyMetrics } from '../utils/consistencyMetricsUtils';
import { 
  ProgressBar, 
  WordConsistencyVisualization, 
  WordPresenceTable 
} from '../visualizations/consistencyVisualizations';
import { CollapsibleSectionHeader } from '../visualizations/commonVisualizations';

const ConsistencySection = ({ 
  groundTruth, 
  predictedValues, 
  predictions, 
  consistencyScore, 
  details,
  consistencyMetrics // Pre-calculated metrics 
}) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [wordPresenceExpanded, setWordPresenceExpanded] = useState(false);
  const [groundTruthExpanded, setGroundTruthExpanded] = useState(false);
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);
  const [calcDetailsExpanded, setCalcDetailsExpanded] = useState(false);
    
  // Toggle functions
  const toggleItem = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Use pre-calculated metrics if available, otherwise calculate them here
  const { metrics, details: metricDetails } = consistencyMetrics || 
    calculateConsistencyMetrics({
      groundTruth,
      predictedValues
    });

  const { 
    wordConsistencyAnalysis,
    wordPresence, 
    averagePresence, 
    visualizationItems 
  } = metricDetails;
  
  const filterVisualizationItems = (items) => {
    const seen = new Set();
    const filteredItems = [];
    
    // Process all items
    for (const item of items) {
      const itemName = typeof item === 'string' ? item : item?.name;
      
      // Skip if we've already seen this name
      if (!itemName || seen.has(itemName)) continue;
      
      seen.add(itemName);
      filteredItems.push(item);
    }
    
    return filteredItems;
  };

  const overallConsistencyScore = metrics.overallConsistencyScore;
  const predictionConsistencyScore = wordConsistencyAnalysis.avgPredictionConsistency || 0.2; // Fixed to use 0.2 as default

  return (
    <div className="space-y-4">
      {/* Overall Consistency Calculation - Moved to top */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <h5 className="font-medium mb-2 text-gray-800">Overall Consistency Score (Weight 30%)</h5>
        <p className="text-sm mb-3 text-gray-600">
          Consistency evaluates how well different predictions align with each other and with the ground truth,
          based on terminology overlap and shared vocabulary.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 p-2 bg-gray-50 rounded border">
            <p className="text-xs font-medium mb-1">Explanation:</p>
            <div className="border-t pt-1">
              <p className="text-xs">This measures how consistently terminology is used across predictions. Higher consistency indicates better agreement between terms used in different field classifications.</p>
              {overallConsistencyScore < 0.3 && (
                <div className="mt-1 bg-red-50 p-1 rounded text-xs">
                  <span className="font-medium">Potential Issues: </span>
                  <ul className="list-disc list-inside">
                    <li>Low term agreement across predictions</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-2 bg-gray-50 rounded border">
            <p className="text-xs font-medium mb-1">Score Calculation:</p>
            <div className="border-t pt-1 space-y-2">
              <div className="bg-green-50 p-2 rounded text-xs mt-1">
                <span className="font-medium">Formula Components: </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div className="bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="font-medium block text-center">Ground Truth Match</span>
                    <span className="block text-center">{formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)}</span>
                    <span className="block text-center text-xs">× 0.33</span>
                  </div>
                  <div className="bg-purple-50 p-2 rounded border border-purple-100">
                    <span className="font-medium block text-center">Prediction Consistency</span>
                    <span className="block text-center">{formatPercent(predictionConsistencyScore)}</span>
                    <span className="block text-center text-xs">× 0.33</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded border border-amber-100">
                    <span className="font-medium block text-center">Word Presence</span>
                    <span className="block text-center">{formatPercent(averagePresence)}</span>
                    <span className="block text-center text-xs">× 0.34</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded text-xs">
                <span className="font-medium">Calculated Score: </span>
                <div className="flex justify-between items-center mt-1">
                  <span className="whitespace-normal break-words">
                    ({formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)} × 0.33) + 
                    ({formatPercent(predictionConsistencyScore)} × 0.33) + 
                    ({formatPercent(averagePresence)} × 0.34)
                  </span>
                  <span className="font-medium">= {formatPercent(overallConsistencyScore)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Consistency Breakdown - Now Collapsible with Chevron */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <CollapsibleSectionHeader
          title="Consistency Analysis Methods"
          isExpanded={breakdownExpanded}
          toggleExpanded={() => setBreakdownExpanded(!breakdownExpanded)}
        />
        
        {breakdownExpanded && (
          <div className="mt-3 space-y-4">
            {/* Score Calculation Section */}
            <div className="p-3 bg-blue-50 rounded border border-blue-100">
              <div 
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => setCalcDetailsExpanded(!calcDetailsExpanded)}
              >
                <p className="text-sm font-medium text-blue-800">Final Consistency Score Calculation</p>
                <div className="flex items-center">
                  {calcDetailsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>
              
              {/* Calculation details in table view */}
              {calcDetailsExpanded && (
                <div className="mt-2 bg-white rounded border overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left w-1/6">Component</th>
                      <th className="p-2 text-left w-1/3">Formula</th>
                      <th className="p-2 text-left w-1/3">Calculation</th>
                      <th className="p-2 text-right w-1/6">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Ground Truth */}
                    <tr className="border-b">
                      <td className="p-2 font-medium">Ground Truth Match</td>
                      <td className="p-2">Shared words ÷ Total unique words</td>
                      <td className="p-2">
                        {wordConsistencyAnalysis.groundTruthWords.filter(word => wordConsistencyAnalysis.predictedValuesWords.includes(word)).length} ÷ {Math.max(wordConsistencyAnalysis.groundTruthWords.length, wordConsistencyAnalysis.predictedValuesWords.length)}
                      </td>
                      <td className="p-2 text-right">{formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)}</td>
                    </tr>

                    {/* Prediction Consistency (Grouped Prediction Rows) */}
                    <tr className="border-b">
                      <td rowSpan={wordConsistencyAnalysis.predictionConsistencies.length * 2} className="p-2 font-medium text-center align-middle">
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="transform -rotate-90 whitespace-nowrap text-xs p-2 font-medium">Predictions</span>
                        </div>
                      </td>

                      <td className="p-2 font-medium" colSpan={3}>Prediction: {wordConsistencyAnalysis.predictionConsistencies[0]?.name || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(Ground Truth match + All Words match) ÷ 2</td>
                      <td className="p-2">
                        ({formatPercent(wordConsistencyAnalysis.predictionConsistencies[0]?.groundTruthConsistency)}) + ({formatPercent(wordConsistencyAnalysis.predictionConsistencies[0]?.allWordsConsistency)}) ÷ 2
                      </td>
                      <td className="p-2 text-right">
                        {formatPercent(
                          (wordConsistencyAnalysis.predictionConsistencies[0]?.groundTruthConsistency + 
                          wordConsistencyAnalysis.predictionConsistencies[0]?.allWordsConsistency) / 2
                        )}
                      </td>
                    </tr>

                    {wordConsistencyAnalysis.predictionConsistencies.slice(1).map((pred, i) => {
                      const avgScore = (pred.groundTruthConsistency + pred.allWordsConsistency) / 2;
                      return (
                        <React.Fragment key={i}>
                          <tr className="border-b">
                            <td className="p-2 font-medium" colSpan={3}>Prediction: {pred.name}</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">(Ground Truth match + All Words match) ÷ 2</td>
                            <td className="p-2">
                              ({formatPercent(pred.groundTruthConsistency)}) + ({formatPercent(pred.allWordsConsistency)}) ÷ 2
                            </td>
                            <td className="p-2 text-right">{formatPercent(avgScore)}</td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Word Presence */}
                    <tr className="border-b align-top">
                      <td className="p-2 font-medium">Word Presence</td>

                      {/* Formula with steps */}
                      <td className="p-2 text-xs whitespace-normal leading-relaxed">
                        <div className="mb-1">
                          <strong>Step 1:</strong> Calculate presence rate for each word:
                          <br />
                          <code className="text-blue-600">Presence Rate = (Number of predictions containing the word) ÷ (Total predictions)</code>
                        </div>

                        <div className="mb-1">
                          <strong>Step 2:</strong> Average all the presence rates:
                          <br />
                          <code className="text-blue-600">Average Presence = (Sum of all presence rates) ÷ (Number of unique words)</code>
                        </div>
                      </td>

                      {/* Actual Calculation */}
                      <td className="p-2 text-xs leading-relaxed">
                        <div>
                          <strong>Sum of presence rates:</strong> 
                          <code className="text-blue-600">{wordPresence.reduce((sum, item) => sum + item.presenceRate, 0).toFixed(2)}</code>
                        </div>
                        <div>
                          <strong>Number of unique words:</strong> 
                          <code className="text-blue-600">{wordPresence.length}</code>
                        </div>

                        <div className="mt-1">
                          <strong>Final calculation:</strong>
                          <code className="text-blue-600">
                            {wordPresence.reduce((sum, item) => sum + item.presenceRate, 0).toFixed(2)} ÷ {wordPresence.length}
                          </code>
                        </div>
                        <div className="mt-1">
                          = <strong>{formatPercent(averagePresence)}</strong>
                        </div>
                      </td>

                      {/* Final Score */}
                      <td className="p-2 text-right">{formatPercent(averagePresence)}</td>
                    </tr>

                    {/* Final Score */}
                    <tr className="border-b">
                      <td className="p-2 font-medium">Final Score</td>
                      <td className="p-2">(Ground Truth Match + Avg. Prediction Score + Word Presence) ÷ 3</td>
                      <td className="p-2">
                        ({formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)} × 0.33) + 
                        ({formatPercent(predictionConsistencyScore)} × 0.33) + 
                        ({formatPercent(averagePresence)} × 0.34)
                      </td>
                      <td className="p-2 text-right font-medium">{formatPercent(overallConsistencyScore)}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              )}
            </div>

            {/* Consistency Metrics Explanation */}
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
              <p className="flex items-center mb-2">
                <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="font-medium">Understanding Consistency Metrics</span>
              </p>
              
              <div className="ml-6 mb-4">
                <p className="mb-2">Consistency measures how well different predictions align with each other and with the ground truth. Higher scores indicate better agreement between terms.</p>
                
                <table className="w-full text-xs border-collapse mt-3">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="p-2 text-left border">Metric Type</th>
                      <th className="p-2 text-left border">Description</th>
                      <th className="p-2 text-left border">Formula</th>
                      <th className="p-2 text-left border">Interpretation:</th>
                      <th className="p-2 text-left border">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border font-medium">Ground Truth Consistency</td>
                      <td className="p-2 border">Direct comparison between actual field and system's prediction. Measures how closely the predicted field terminology aligns with the ground truth field terminology.</td>
                      <td className="p-2 border">Shared words ÷ Total unique words</td>
                      <td className="p-2 border">
                      <p>
                        {wordConsistencyAnalysis.groundTruthPredictedValuesConsistency >= 0.7 ? 
                          'Strong terminology overlap between ground truth and prediction.' : 
                          wordConsistencyAnalysis.groundTruthPredictedValuesConsistency >= 0.4 ? 
                          'Moderate terminology overlap between ground truth and prediction.' :
                          'Limited terminology overlap between ground truth and prediction.'}
                      </p>
                      </td>
                      <td className="p-2 border">{formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-medium">Prediction Consistency</td>
                      <td className="p-2 border">How well an individual prediction matches both the ground truth and the collective vocabulary across all predictions. Balanced measure of accuracy and cohesion.</td>
                      <td className="p-2 border">(Ground Truth match + Vocabulary match) ÷ 2</td>
                      <td className="p-2 border">
                        <p>
                          {overallConsistencyScore >= 0.7 ? 
                            'High consistency across predictions, indicating reliable classification.' : 
                            overallConsistencyScore >= 0.4 ? 
                            'Moderate consistency across predictions, showing some variability.' :
                            'Low consistency across predictions, suggesting high uncertainty.'}
                        </p>
                      </td>
                      <td className="p-2 border">{formatPercent(overallConsistencyScore)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-medium">Word Presence</td>
                      <td className="p-2 border">Measures how frequently each word appears across different predictions. Higher values indicate more consistent terminology use across predictions.</td>
                      <td className="p-2 border">Sum of (occurrences ÷ total predictions) ÷ unique words</td>
                      <td className="p-2 border">
                        <p>
                          {averagePresence >= 0.7 ? 
                            'Strong vocabulary consistency, with most terms appearing across multiple predictions.' : 
                            averagePresence >= 0.4 ? 
                            'Moderate vocabulary consistency, with some terms appearing in multiple predictions.' :
                            'Low vocabulary consistency, with few terms shared across predictions.'}
                        </p>
                    </td>
                    <td className="p-2 border">{formatPercent(averagePresence)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* LLM Prediction Methodology */}
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
              <p className="flex items-center mb-2">
                <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="font-medium">LLM Prediction Methodology</span>
              </p>
              <p className="ml-6 mb-2">In large language model (LLM) research field predictions, the model generates potential field classifications based on the paper's abstract, keywords, and content. This process involves:</p>
              <ul className="list-disc list-inside ml-6 text-xs space-y-1">
                <li>Analyzing the semantic content of the paper</li>
                <li>Extracting key terminology and context</li>
                <li>Matching against known research field taxonomies</li>
                <li>Generating multiple potential field classifications</li>
              </ul>
              <p className="ml-6 mt-2 text-xs">The consistency analysis helps evaluate the reliability and precision of these predictions.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Ground Truth vs System Prediction - Separate section */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <CollapsibleSectionHeader
          title="Ground Truth vs System Prediction"
          icon={Info}
          score={wordConsistencyAnalysis.groundTruthPredictedValuesConsistency}
          isExpanded={groundTruthExpanded}
          toggleExpanded={() => setGroundTruthExpanded(!groundTruthExpanded)}
          badgeColor={getStatusBadgeColor(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)}
        />
        
        {groundTruthExpanded && (
          <div className="mt-3 space-y-4">
            <ProgressBar 
              value={wordConsistencyAnalysis.groundTruthPredictedValuesConsistency} 
              label="Direct Match Score" 
              description="Measures how closely the system's primary prediction matches the actual classification. Calculated by dividing shared words by the total unique words across both classifications."
            />
            <div className="bg-gray-50 p-2 rounded text-xs mt-2 mb-4">
              <p className="font-medium">Calculation Method:</p>
              <p className="mt-1">Common words between Ground Truth and Prediction ÷ Total unique words</p>
              <p className="mt-1">
                {wordConsistencyAnalysis.groundTruthWords.filter(word => wordConsistencyAnalysis.predictedValuesWords.includes(word)).length} shared words ÷ {Math.max(wordConsistencyAnalysis.groundTruthWords.length, wordConsistencyAnalysis.predictedValuesWords.length)} total words
              </p>
              <p className="mt-1">= {formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)}</p>
            </div>
            
            {/* Individual Predictions included within Ground Truth section */}
            <h6 className="text-sm font-medium text-gray-800 mb-2">Individual Prediction Analysis</h6>
            {wordConsistencyAnalysis.predictionConsistencies.map((pred, index) => {
              const avgScore = (pred.groundTruthConsistency + pred.allWordsConsistency) / 2;
              return (
                <div key={index} className="border rounded mb-3">
                  {/* Header with collapse toggle */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleItem(index)}
                  >
                    <span className="font-medium text-sm">{pred.name || 'Unnamed Prediction'}</span>
                    <div className="flex items-center">
                      <span className={`text-xs px-2 py-1 rounded-full mr-2 ${getStatusBadgeColor(avgScore)}`}>
                        {formatPercent(avgScore)}
                      </span>
                      {expandedItems[index] ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {/* Collapsible content */}
                  {expandedItems[index] && (
                    <div className="p-3 border-t">
                      <ProgressBar 
                        value={pred.groundTruthConsistency} 
                        label="Ground Truth Consistency" 
                        description="Measures word overlap with the ground truth classification. Higher scores indicate the prediction uses similar terminology to the correct classification."
                      />
                      
                      <ProgressBar 
                        value={pred.allWordsConsistency} 
                        label="Overall Vocabulary Consistency" 
                        description="Measures how well this prediction's terminology aligns with the collective vocabulary across all predictions. Higher scores indicate the prediction uses commonly shared terms."
                      />
                      
                      <div className="bg-gray-50 p-2 rounded text-xs mt-2">
                        <p className="font-medium">Calculation Details:</p>
                        <p><strong>Ground Truth Consistency:</strong> Words shared with ground truth ÷ Total unique words</p>
                        <p><strong>Vocabulary Consistency:</strong> Words present in collective vocabulary ÷ Total words</p>
                        <p><strong>Average Score:</strong> (Ground Truth Consistency + Vocabulary Consistency) ÷ 2</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Word Presence Analysis - Collapsible */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <CollapsibleSectionHeader
          title="Word Presence Analysis"
          icon={Layers}
          score={averagePresence}
          isExpanded={wordPresenceExpanded}
          toggleExpanded={() => setWordPresenceExpanded(!wordPresenceExpanded)}
          badgeColor={getStatusBadgeColor(averagePresence)}
        />
        
        {wordPresenceExpanded && (
          <div className="mt-2">
            <p className="text-sm mb-3 text-gray-600">
              Visualizes how frequently words appear across multiple field predictions.
            </p>
            
            {visualizationItems.length > 1 ? (
              <>
                <WordConsistencyVisualization
                  visualizationItems={filterVisualizationItems(visualizationItems)}
                  wordPresence={wordPresence}
                  groundTruth={groundTruth}
                />

                <WordPresenceTable
                  visualizationItems={filterVisualizationItems(visualizationItems)}
                  wordPresence={wordPresence}
                  averagePresence={averagePresence}
                  groundTruth={groundTruth}
                />

                <div className="mt-4">
                  <h6 className="text-sm font-medium mb-2 text-gray-700">Word Presence Calculation Method</h6>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-medium text-gray-800">Average Presence Calculation:</p>
                    <div className="bg-white p-2 rounded mt-2 border">
                      <p>For each word, we calculate a presence rate:</p>
                      <p className="px-2 mt-1">Presence Rate = (Number of predictions containing the word) ÷ (Total number of predictions)</p>
                      <p className="mt-2">Then we average these rates:</p>
                      <p className="px-2 mt-1">Average Presence = (Sum of all presence rates) ÷ (Number of unique words)</p>
                      <p className="px-2 mt-1">= {wordPresence.reduce((sum, item) => sum + item.presenceRate, 0).toFixed(2)} ÷ {wordPresence.length}</p>
                      <p className="font-medium mt-2">= {formatPercent(averagePresence)}</p>
                    </div>
                    <p className="text-xs mt-2 text-gray-500">
                      Higher values (closer to 1) indicate more consistent terminology across predictions. 
                      A value of 1.0 would mean every word appears in every prediction, while 0.0 would mean 
                      no words are shared between predictions.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-100 rounded text-center text-gray-600">
                <p>Not enough predictions to calculate consistency (need at least 2)</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Combined Consistency Explanation */}
      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <h5 className="font-medium mb-2 text-gray-800">Combined Consistency Score</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="bg-blue-50 p-2 rounded border border-blue-100">
            <p className="text-xs font-medium text-blue-800">Ground Truth Match</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">{formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency)}</p>
              <p className="text-xs text-blue-600">× 0.33</p>
            </div>
          </div>
          <div className="bg-purple-50 p-2 rounded border border-purple-100">
            <p className="text-xs font-medium text-purple-800">Prediction Consistency</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-purple-700">{formatPercent(predictionConsistencyScore)}</p>
              <p className="text-xs text-purple-600">× 0.33</p>
            </div>
          </div>
          <div className="bg-amber-50 p-2 rounded border border-amber-100">
            <p className="text-xs font-medium text-amber-800">Word Presence</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700">{formatPercent(averagePresence)}</p>
              <p className="text-xs text-amber-600">× 0.34</p>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-green-50 rounded border border-green-100">
          <p className="text-sm font-medium text-green-800">Final Consistency Score Calculation</p>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <span className="text-blue-700">{formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency * 0.33)}</span>
              <p className="text-xs text-gray-500">From Ground Truth Match</p>
            </div>
            <div className="text-center">
              <span className="text-purple-700">+ {formatPercent(predictionConsistencyScore * 0.33)}</span>
              <p className="text-xs text-gray-500">From Prediction Consistency</p>
            </div>
            <div className="text-center">
              <span className="text-amber-700">+ {formatPercent(averagePresence * 0.34)}</span>
              <p className="text-xs text-gray-500">From Word Presence</p>
            </div>
          </div>
          <div className="mt-2 p-2 bg-white rounded text-center font-medium text-green-800">
            {formatPercent(wordConsistencyAnalysis.groundTruthPredictedValuesConsistency * 0.33)} + {formatPercent(predictionConsistencyScore * 0.33)} + {formatPercent(averagePresence * 0.34)} = {formatPercent(overallConsistencyScore)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsistencySection;