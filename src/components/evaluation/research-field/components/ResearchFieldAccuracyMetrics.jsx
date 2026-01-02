// Start of ResearchFieldAccuracyMetrics.jsx 
import React from 'react';
import { Card } from '../../../ui/card';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { processResearchFieldAccuracy } from '../utils/researchFieldMetrics';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { Info } from 'lucide-react';
import ResearchFieldMetricsDisplay from './ResearchFieldMetricsDisplay';
import { formatUserRating } from '../utils/researchFieldMetrics';
import { TEXT_CONFIG } from '../config/researchFieldConfig'
const ResearchFieldAccuracyMetrics = ({
  metrics,
  orkgValue,
  predictedValues,
  rating,
  expertiseMultiplier,
  primaryFieldRating // New prop to match metadata pattern
}) => {
  // Debug the incoming props
  console.log("ResearchFieldAccuracyMetrics props:", {
    rating,
    primaryFieldRating,
    expertiseMultiplier
  });

  // Use primaryFieldRating if provided, otherwise fallback to rating
  const effectiveRating = primaryFieldRating || rating || 3;
  console.log("Using effective rating:", effectiveRating);
  console.log(orkgValue);
  const groundTruth = orkgValue || '';
  
  console.log("ResearchFieldAccuracyMetrics props:", {
    rating,
    primaryFieldRating,
    effectiveRating
  });

  const predictions = React.useMemo(() => {
    if (Array.isArray(predictedValues)) {
      return predictedValues.map(p => ({
        field: p.name || p.field || '',
        name: p.name || p.field || '',
        score: p.score || 0
      }));
    } else if (predictedValues?.fields && Array.isArray(predictedValues.fields)) {
      return predictedValues.fields.map(p => ({
        field: p.name || p.field || '',
        name: p.name || p.field || '',
        score: p.score || 0
      }));
    }
    return [];
  }, [predictedValues]);

  // Format the rating
  const ratingDisplay = formatUserRating(
    primaryFieldRating || rating || 3,
    expertiseMultiplier
  );
  
  const result = processResearchFieldAccuracy(
    'research_field',
    orkgValue,
    predictedValues,
    effectiveRating,
    expertiseMultiplier
  );
  
  const similarityData = result.similarityData;
  const scoreDetails = result.scoreDetails;

  const metricConfig = {
    accuracy: {
      primaryMetrics: ['precision', 'recall'],
      mainMetric: 'f1Score',
      displayName: 'Field Detection Accuracy'
    }
  };
  
  // Separate precision and recall in same order as metadata

  const metricDefinitions = {
    precision: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Exact Match Precision</strong></p>
        <p>Measures whether the top predicted field exactly matches the expected field.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>1.0 if the first prediction matches exactly</p>
          <p>0.0 if the first prediction doesn't match</p>
        </div>
      </div>
    `,
    recall: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Field Recall</strong></p>
        <p>Measures whether the expected field appears anywhere in the predictions.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>1.0 if the field appears in any prediction</p>
          <p>0.0 if the field is not found</p>
        </div>
      </div>
    `,
    f1Score: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>F1 Score</strong></p>
        <p>Balanced measure combining precision and recall.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>2 × (Precision × Recall) / (Precision + Recall)</p>
          <p class="mt-1">This score balances between exact match (precision) and field presence (recall).</p>
        </div>
      </div>
    `,
    topN: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Top-3 Presence</strong></p>
        <p>Measures whether the expected field appears in the top 3 predictions.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>1.0 if the field is in top 3 predictions</p>
          <p>0.0 if it's ranked 4th or lower</p>
        </div>
      </div>
    `
  };

      const renderMetricDetails = (metricType) => {
    if (!similarityData) return null;
    
    let explanation = {
      title: '',
      description: '',
      formula: '',
      calculation: '',
      example: ''
    };
    
    switch(metricType) {
      case 'precision':
        explanation = {
          title: 'Exact Match Precision',
          description: 'Measures whether the top predicted field exactly matches the expected field.',
          formula: '1.0 if top prediction matches, 0.0 otherwise',
          calculation: `Prediction: "${predictions[0]?.name || 'N/A'}" vs Expected: "${groundTruth}"\nResult: ${similarityData.exactMatch ? '1.0 (Match)' : '0.0 (No Match)'}`,
          example: `For this document, the system's top prediction is "<span class="text-green-600 font-medium">${predictions[0]?.name || 'N/A'}</span>" when the expected field is "<span class="text-red-600 font-medium">${groundTruth}</span>".`
        };
        break;
      case 'recall':
        explanation = {
          title: 'Field Recall',
          description: 'Measures whether the expected field appears anywhere in the predictions.',
          formula: '1.0 if field appears in any prediction, 0.0 otherwise',
          calculation: `Expected: "${groundTruth}"\nFound: ${similarityData.foundPosition ? `Yes, at position ${similarityData.foundPosition}` : 'No'}\nResult: ${similarityData.foundPosition ? '1.0' : '0.0'}`,
          example: `For this document, the system ${similarityData.foundPosition ? `found the expected field "<span class="text-red-600 font-medium">${groundTruth}</span>" at position ${similarityData.foundPosition}` : `did not find the expected field "<span class="text-red-600 font-medium">${groundTruth}</span>" in any prediction`}.`
        };
        break;
      case 'f1Score':
        explanation = {
          title: 'F1 Score',
          description: 'Balanced measure combining precision and recall.',
          formula: '2 × (Precision × Recall) / (Precision + Recall)',
          calculation: `Precision: ${formatPercentage(similarityData.exactMatch || 0)}\nRecall: ${formatPercentage(similarityData.recall || 0)}\nF1 = 2 × (${similarityData.exactMatch || 0} × ${similarityData.recall || 0}) / (${similarityData.exactMatch || 0} + ${similarityData.recall || 0})`,
          example: `For this document, the F1 score balances the exact match precision (${formatPercentage(similarityData.exactMatch || 0)}) with the recall (${formatPercentage(similarityData.recall || 0)}) between "<span class="text-green-600 font-medium">${predictions[0]?.name || 'N/A'}</span>" and "<span class="text-red-600 font-medium">${groundTruth}</span>".`
        };
        break;
      case 'topN':
        explanation = {
          title: 'Top-3 Presence',
          description: 'Measures whether the expected field appears in the top 3 predictions.',
          formula: '1.0 if field is in top 3 predictions, 0.0 otherwise',
          calculation: `Expected: "${groundTruth}"\nPosition: ${similarityData.foundPosition || 'Not found'}\nIs in top 3: ${similarityData.topN ? 'Yes' : 'No'}\nResult: ${formatPercentage(similarityData.topN || 0)}`,
          example: `For this document, the expected field "<span class="text-red-600 font-medium">${groundTruth}</span>" ${similarityData.foundPosition ? `appears at position ${similarityData.foundPosition}` : 'does not appear in the top predictions'}.`
        };
        break;
      default:
        return null;
    }
    
    const displayScore = scoreDetails?.finalScore || similarityData.overallScore || 0;
    
    return (
      <div className="p-2 bg-gray-50 rounded mb-2">
        <h6 className="text-xs font-medium mb-1">{explanation.title}</h6>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 p-2 bg-white rounded border">
            <p className="text-xs font-medium mb-1">Explanation:</p>
            <div className="border-t pt-1">
              <p className="text-xs" dangerouslySetInnerHTML={{__html: explanation.description}} />
              <div className="mt-1 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                <span className="font-medium">Formula: </span>
                <span className="whitespace-nowrap" dangerouslySetInnerHTML={{__html: explanation.formula}} />
              </div>
              
              {explanation.calculation && (
                <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                  <span className="font-medium">{metricType.charAt(0).toUpperCase() + metricType.slice(1)} Calculation: </span>
                  <pre className="text-xs whitespace-pre-wrap">{explanation.calculation}</pre>
                </div>
              )}
              
              <div className="mt-2 bg-green-50 p-1 rounded text-xs relative group">
                <div className="flex items-center">
                  <span className="font-medium">Score: </span>
                  <span className="ml-2 whitespace-nowrap">
                    {formatPercentage(metricType === 'precision' ? similarityData.exactMatch || 0 : 
                      metricType === 'recall' ? similarityData.recall || 0 : 
                      metricType === 'f1Score' ? similarityData.f1Score || 0 : 
                      similarityData.topN || 0)}
                  </span>
                  <div className="relative ml-2">
                    <Info 
                      size={14} 
                      className="text-blue-500 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="
                      absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 
                      bg-gray-800 text-white text-xs rounded py-1 px-2 
                      opacity-0 group-hover:opacity-100 
                      transition-opacity duration-300 
                      pointer-events-none
                      whitespace-nowrap
                    ">
                      Check the Weight Calculation Details section
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    
          <div className="flex-1 p-2 bg-white rounded border">
            <p className="text-xs font-medium mb-1">Current Document:</p>
            <div className="border-t pt-1">
              <p className="text-xs" dangerouslySetInnerHTML={{__html: explanation.example}} />
              
              <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                <span className="font-medium">Field Detection Details:</span>
                <div className="text-xs space-y-1">
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Expected Field:</span>
                    <span className="ml-2 text-red-600 font-medium">{groundTruth || 'None'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Top Prediction:</span>
                    <span className="ml-2 text-green-600 font-medium">{predictions[0]?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Found Position:</span>
                    <span className="ml-2">{similarityData.foundPosition || 'Not found'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Exact Match:</span>
                    <span className="ml-2">{formatPercentage(similarityData.exactMatch || 0)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Top-3 Presence:</span>
                    <span className="ml-2">{formatPercentage(similarityData.topN || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSimilarityTable = (data, showAnalysis, toggleAnalysis) => {
    if (!data || !showAnalysis) return null;
    
    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Metric</th>
              <th className="p-2 text-left border-b">Exact Match (40%)</th>
              <th className="p-2 text-left border-b">Top-3 (30%)</th>
              <th className="p-2 text-left border-b">Position (30%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
              <td className="p-2 border-r">
                <div className="whitespace-normal">
                  Checks if the top prediction exactly matches the expected field.
                  <div className="text-xs text-gray-500 mt-1 break-words">
                    Scores 1.0 for an exact match, 0.0 otherwise
                  </div>
                </div>
              </td>
              <td className="p-2 border-r">
                <div className="whitespace-normal">
                  Checks if the expected field appears in the top 3 predictions.
                  <div className="text-xs text-gray-500 mt-1 break-words">
                    Scores 1.0 if found in top 3, 0.0 otherwise
                  </div>
                </div>
              </td>
              <td className="p-2">
                <div className="whitespace-normal">
                  Scores based on the position of the expected field.
                  <div className="text-xs text-gray-500 mt-1 break-words">
                    1.0 (1st), 0.8 (2nd), 0.6 (3rd), 0.4 (4th), 0.2 (5th), 0.0 (not found)
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Raw Data</td>
              <td className="p-2 border-r align-top">
                <div className="grid grid-cols-2 gap-1">
                  <div>Expected:</div>
                  <div className="text-right text-red-600 font-medium">{groundTruth || 'N/A'}</div>
                  <div>Top Prediction:</div>
                  <div className="text-right text-green-600 font-medium">{predictions[0]?.name || 'N/A'}</div>
                  <div>Match:</div>
                  <div className="text-right">{data.exactMatch ? '✅ Yes' : '❌ No'}</div>
                </div>
              </td>
              <td className="p-2 border-r align-top">
                <div className="grid grid-cols-2 gap-1">
                  <div>Expected:</div>
                  <div className="text-right text-red-600 font-medium">{groundTruth || 'N/A'}</div>
                  <div>In Top 3:</div>
                  <div className="text-right">{data.topN ? '✅ Yes' : '❌ No'}</div>
                  <div>Position:</div>
                  <div className="text-right">{data.foundPosition || 'Not found'}</div>
                </div>
              </td>
              <td className="p-2 align-top">
                <div className="grid grid-cols-2 gap-1">
                  <div>Expected:</div>
                  <div className="text-right text-red-600 font-medium">{groundTruth || 'N/A'}</div>
                  <div>Position:</div>
                  <div className="text-right">{data.foundPosition ? `#${data.foundPosition}` : 'N/A'}</div>
                  <div>Score:</div>
                  <div className="text-right">{formatPercentage(data.positionScore || 0)}</div>
                </div>
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border-r font-medium">Component Score</td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(data.exactMatch || 0)}
              </td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(data.topN || 0)}
              </td>
              <td className="p-2 font-medium">
                {formatPercentage(data.positionScore || 0)}
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage((data.exactMatch || 0) * 0.4)}
              </td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage((data.topN || 0) * 0.3)}
              </td>
              <td className="p-2 text-blue-700 font-medium">
                {formatPercentage((data.positionScore || 0) * 0.3)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              AutomatedScore = (0.4 × {formatPercentage(data.exactMatch || 0)}) + 
              (0.3 × {formatPercentage(data.topN || 0)}) + 
              (0.3 × {formatPercentage(data.positionScore || 0)})<br/>
              = {formatPercentage((data.exactMatch || 0) * 0.4)} + 
              {formatPercentage((data.topN || 0) * 0.3)} + 
              {formatPercentage((data.positionScore || 0) * 0.3)}<br/>
              = {formatPercentage(data.automatedOverallScore || data.overallScore || 0)}
            </code>
          </div>
          <div className="mt-3">
            <ResearchFieldMetricsDisplay similarityData={data} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Research Field Detection Accuracy</h3>
      <p className="text-sm text-gray-600 mb-4">
        This evaluation measures how well the system identified the correct research field.
        Scores consider exact matches, ranking position, and human input (rating: {ratingDisplay}/5).
      </p>
      
      <BaseContentMetrics
        metrics={similarityData}
        referenceValue={groundTruth || ''}
        extractedValue={predictions.length > 0 ? predictions[0].name : ''}
        expertiseWeight={expertiseMultiplier}
        expertiseMultiplier={expertiseMultiplier}
        rating={primaryFieldRating || rating || 3}
        fieldName="Research Field"
        metricType="accuracy"
        textConfig={TEXT_CONFIG.accuracy}
        metricDefinitions={metricDefinitions}
        analysisData={similarityData}
        renderAnalysisComponent={renderSimilarityTable}
        renderMetricDetails={renderMetricDetails}
        scoreDetails={scoreDetails}
        metricConfig={metricConfig}
      />
    </Card>
  );
};

export default ResearchFieldAccuracyMetrics;