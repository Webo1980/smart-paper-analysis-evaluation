import React, { useState } from 'react';
import { FileText, PencilRuler, Info } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { highlightDifferences, textComparisonColors } from '../../base/utils/textDiffUtils';
import { metricExplanations, generateRealTimeCalculation } from '../utils/metricsExplanations';

const DescriptionComparison = ({ comparisonData }) => {
  const [showMetricDetails, setShowMetricDetails] = useState(false);
  
  // Calculate highlighted text differences
  const { originalHighlighted, editedHighlighted } = React.useMemo(() => 
    highlightDifferences(comparisonData.description.original, comparisonData.description.edited),
    [comparisonData]
  );

  // Extract key analysis metrics
  const descriptionSimilarity = comparisonData.description.levenshtein.similarityScore;
  const descriptionEditPercentage = comparisonData.description.edits.editPercentage;
  const levenshteinDistance = comparisonData.description.levenshtein.distance;
  const tokenF1Score = comparisonData.description.tokenMatching.f1Score;
  const precision = comparisonData.description.tokenMatching.precision;
  const recall = comparisonData.description.tokenMatching.recall;

  // Values for real-time calculations
  const calcValues = {
    distance: levenshteinDistance,
    maxLength: Math.max(
      (comparisonData.description.original || '').length, 
      (comparisonData.description.edited || '').length
    ),
    precision,
    recall,
    original: comparisonData.description.original,
    edited: comparisonData.description.edited
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      
        <div className="p-4">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                <h4 className="font-medium">Original Description</h4>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200 whitespace-pre-wrap">
                <div dangerouslySetInnerHTML={{ __html: originalHighlighted }} />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <h4 className="font-medium">Edited Description</h4>
              </div>
              <div className="p-3 bg-green-50 rounded border border-green-200 whitespace-pre-wrap">
                <div dangerouslySetInnerHTML={{ __html: editedHighlighted }} />
              </div>
            </div>
          </div>
          
          {/* Color code legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            {Object.entries(textComparisonColors).map(([key, {color, description}]) => (
              <div key={key} className="flex items-center">
                <div className={`h-3 w-3 rounded-full ${color} mr-1`}></div>
                <span>{description}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded border text-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <PencilRuler className="h-4 w-4 text-gray-600 mr-2" />
                <span className="font-medium">Description Change Analysis</span>
              </div>
              <button 
                onClick={() => setShowMetricDetails(!showMetricDetails)}
                className="text-blue-500 flex items-center text-xs"
              >
                {showMetricDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>
            <ul className="space-y-1 text-gray-700">
              <li>• Levenshtein Distance: {comparisonData.description.levenshtein.distance} character operations</li>
              <li>• Similarity Score: {formatPercentage(comparisonData.description.levenshtein.similarityScore)}</li>
              <li>• Token F1 Score: {formatPercentage(comparisonData.description.tokenMatching.f1Score)}</li>
              <li>• Modifications: {comparisonData.description.edits.modifications} characters changed</li>
              <li>• Length Change: {comparisonData.description.edited.length - comparisonData.description.original.length} characters ({(((comparisonData.description.edited.length / comparisonData.description.original.length) - 1) * 100).toFixed(1)}%)</li>
            </ul>
            
            {showMetricDetails && (
              <div className="mt-4 border-t pt-3">
                <h4 className="font-medium text-xs mb-2 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Metrics Explanation
                </h4>
                
                <div className="space-y-3">
                  {/* Levenshtein Distance */}
                  <div className="bg-white p-2 rounded border">
                    <h5 className="font-medium text-xs">{metricExplanations.levenshteinDistance.title}</h5>
                    <p className="text-xs">{metricExplanations.levenshteinDistance.description}</p>
                    <div className="mt-1 pt-1 border-t text-xs">
                      <div><b>Formula:</b> {metricExplanations.levenshteinDistance.formula}</div>
                      <div><b>Example:</b> {metricExplanations.levenshteinDistance.example}</div>
                      <div><b>Current calculation:</b> {generateRealTimeCalculation('levenshteinDistance', calcValues)}</div>
                    </div>
                  </div>
                  
                  {/* Similarity Score */}
                  <div className="bg-white p-2 rounded border">
                    <h5 className="font-medium text-xs">{metricExplanations.similarityScore.title}</h5>
                    <p className="text-xs">{metricExplanations.similarityScore.description}</p>
                    <div className="mt-1 pt-1 border-t text-xs">
                      <div><b>Formula:</b> {metricExplanations.similarityScore.formula}</div>
                      <div><b>Example:</b> {metricExplanations.similarityScore.example}</div>
                      <div><b>Current calculation:</b> {generateRealTimeCalculation('similarityScore', calcValues)}</div>
                    </div>
                  </div>
                  
                  {/* Token F1 Score */}
                  <div className="bg-white p-2 rounded border">
                    <h5 className="font-medium text-xs">{metricExplanations.tokenF1Score.title}</h5>
                    <p className="text-xs">{metricExplanations.tokenF1Score.description}</p>
                    <div className="mt-1 pt-1 border-t text-xs">
                      <div><b>Formula:</b> {metricExplanations.tokenF1Score.formula}</div>
                      <div><b>Example:</b> {metricExplanations.tokenF1Score.example}</div>
                      <div><b>Current calculation:</b> {generateRealTimeCalculation('tokenF1Score', calcValues)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default DescriptionComparison;