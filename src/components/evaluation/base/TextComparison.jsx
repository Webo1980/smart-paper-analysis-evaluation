// src\components\evaluation\base\TextComparison.jsx
import React, { useState } from 'react';
import { PencilRuler, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import { formatPercentage } from './utils/baseMetricsUtils';
import { highlightDifferences, textComparisonColors } from './utils/textDiffUtils';
import { Progress } from '../../ui/progress';

const TextComparison = ({ 
  comparisonData = {}, 
  fieldName = 'Text',
  originalLabel = 'Original',
  editedLabel = 'Edited',
  maxLengthForColumns = 100,
  metricsExplanations = {},
  qualityAnalysis = null,
  showQualitySection = false
}) => {
  const [showMetricDetails, setShowMetricDetails] = useState(false);
  const [showQualityDetails, setShowQualityDetails] = useState(showQualitySection);
  
  // Safely extract text with defaults
  const originalText = comparisonData?.original || '';
  const editedText = comparisonData?.edited || '';
  
  // Calculate highlighted text differences
  const { originalHighlighted, editedHighlighted } = React.useMemo(() => 
    highlightDifferences(originalText, editedText),
    [originalText, editedText]
  );

  // Determine layout based on content length
  const shouldUseColumns = Math.max(originalText.length, editedText.length) <= maxLengthForColumns;

  // Extract key analysis metrics with null checks
  const similarityScore = comparisonData?.levenshtein?.similarityScore || 0;
  const editPercentage = comparisonData?.edits?.editPercentage || 0;
  const levenshteinDistance = comparisonData?.levenshtein?.distance || 0;
  const tokenF1Score = comparisonData?.tokenMatching?.f1Score || 0;
  const precision = comparisonData?.tokenMatching?.precision || 0;
  const recall = comparisonData?.tokenMatching?.recall || 0;
  const modifications = comparisonData?.edits?.modifications || 0;
  const lengthChange = editedText.length - originalText.length;
  const lengthChangePercentage = originalText.length ? 
    (((editedText.length / originalText.length) - 1) * 100).toFixed(1) : 
    '0.0';

  // Values for real-time calculations
  const calcValues = {
    distance: levenshteinDistance,
    maxLength: Math.max(originalText.length, editedText.length),
    precision,
    recall,
    original: originalText,
    edited: editedText
  };

  // Helper function to generate real-time calculations
  const generateRealTimeCalculation = (metricKey, values) => {
    const metric = metricsExplanations?.[metricKey];
    if (!metric) return "Calculation not available";
    
    switch(metricKey) {
      case 'similarityScore':
        return metric.calculation?.(
          values.distance, 
          values.maxLength,
          formatPercentage(values.maxLength ? 1 - values.distance/values.maxLength : 1)
        ) || "Calculation not available";
      case 'tokenF1Score':
        return metric.calculation?.(
          values.precision,
          values.recall,
          formatPercentage(values.precision),
          formatPercentage(values.recall),
          formatPercentage((values.precision + values.recall) > 0 ? 
            (2 * values.precision * values.recall) / (values.precision + values.recall) : 0)
        ) || "Calculation not available";
      default:
        return metric.calculation?.(values.original, values.edited, values.distance) || "Calculation not available";
    }
  };

  // Quality analysis section
  const renderQualityAnalysis = () => {
    if (!qualityAnalysis) return null;
    
    const textLength = editedText.length;
    const wordCount = editedText.split(/\s+/).filter(Boolean).length;
    const startsWithCapital = /^[A-Z]/.test(editedText);
    const score = qualityAnalysis.score || 0;
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-gray-600 mr-2" />
            <span className="font-medium">{fieldName} Quality Analysis</span>
          </div>
          <button 
            onClick={() => setShowQualityDetails(!showQualityDetails)}
            className="text-blue-500 flex items-center text-xs"
          >
            {showQualityDetails ? 'Hide details' : 'Show details'}
            {showQualityDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </button>
        </div>
        
        {showQualityDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border">
                <h6 className="text-xs font-medium mb-2">Quality Factors</h6>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Text Length ({textLength} chars)</span>
                      <span>{textLength >= 10 && textLength <= 500 ? '✓ Good' : '⚠ Needs Improvement'}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, (textLength >= 10 && textLength <= 500 ? 100 : 
                        textLength < 10 ? textLength * 10 : Math.max(0, 1000 - textLength) / 5)))} 
                      className="h-2" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 10-500 characters</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Word Count ({wordCount} words)</span>
                      <span>{wordCount >= 2 && wordCount <= 100 ? '✓ Good' : '⚠ Needs Improvement'}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, (wordCount >= 2 && wordCount <= 100 ? 100 : 
                        wordCount < 2 ? wordCount * 50 : Math.max(0, 200 - wordCount))))} 
                      className="h-2" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 2-100 words</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Capitalization</span>
                      <span>{startsWithCapital ? '✓ Good' : '⚠ Needs Improvement'}</span>
                    </div>
                    <Progress value={startsWithCapital ? 100 : 0} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Should start with a capital letter</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <h6 className="text-xs font-medium mb-2">Assessment</h6>
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{qualityAnalysis.details || 'No assessment available'}</p>
                </div>
                
                <div className="mt-4">
                  <h6 className="text-xs font-medium mb-2">Issues</h6>
                  {qualityAnalysis.issues && qualityAnalysis.issues.length > 0 ? (
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {qualityAnalysis.issues.map((issue, i) => (
                        <li key={i} className="text-gray-700">{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-green-600">No issues detected</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <h6 className="text-xs font-medium mb-2">Improvement Suggestions</h6>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {textLength < 10 && <li>Make the text longer (at least 10 characters)</li>}
                    {textLength > 500 && <li>Make the text more concise (under 500 characters)</li>}
                    {wordCount < 2 && <li>Add more descriptive words</li>}
                    {wordCount > 100 && <li>Reduce the number of words to improve clarity</li>}
                    {!startsWithCapital && <li>Start the text with a capital letter</li>}
                    {qualityAnalysis.suggestions && qualityAnalysis.suggestions.map((suggestion, i) => (
                      <li key={`suggestion-${i}`} className="text-gray-700">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded border border-blue-100">
              <h6 className="text-xs font-medium text-blue-800 mb-2">Overall Quality Score</h6>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs">Score: {formatPercentage(score)}</span>
              </div>
              <Progress value={score * 100} className="h-3" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4">
        {/* Improved heading section */}
        <div className="mb-4 border-b pb-3">
          <h3 className="text-sm font-medium text-gray-800">{fieldName} Comparison</h3>
          <p className="text-xs text-gray-500 mt-1">
            Compare the {originalLabel.toLowerCase()} and {editedLabel.toLowerCase()} versions of the {fieldName.toLowerCase()}
          </p>
        </div>

        {/* Color code legend - Moved to top for better visibility */}
        <div className="mb-4 flex flex-wrap gap-3 text-xs bg-gray-50 p-2 rounded">
          <span className="font-medium mr-1">Legend:</span>
          {Object.entries(textComparisonColors).map(([key, {color, description}]) => (
            <div key={key} className="flex items-center">
              <div className={`h-3 w-3 rounded-full ${color} mr-1`}></div>
              <span>{description}</span>
            </div>
          ))}
        </div>

        {/* Text comparison display - Improved visualization */}
        <div className={`mb-6 grid ${shouldUseColumns ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
              <h4 className="font-medium text-blue-700">{originalLabel} {fieldName}</h4>
            </div>
            <div className="p-4 bg-blue-50 rounded border border-blue-200 whitespace-pre-wrap min-h-24">
              {originalText.length > 0 ? (
                <div dangerouslySetInnerHTML={{ __html: originalHighlighted }} />
              ) : (
                <span className="text-gray-400 italic">No content available</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
              <h4 className="font-medium text-green-700">{editedLabel} {fieldName}</h4>
            </div>
            <div className="p-4 bg-green-50 rounded border border-green-200 whitespace-pre-wrap min-h-24">
              {editedText.length > 0 ? (
                <div dangerouslySetInnerHTML={{ __html: editedHighlighted }} />
              ) : (
                <span className="text-gray-400 italic">No content available</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Metrics analysis - Improved with cards and visual indicators */}
        <div className="mt-6 rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
            <div className="flex items-center">
              <PencilRuler className="h-4 w-4 text-gray-600 mr-2" />
              <span className="font-medium">{fieldName} Change Analysis</span>
            </div>
            <button 
              onClick={() => setShowMetricDetails(!showMetricDetails)}
              className="text-blue-600 flex items-center text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
            >
              {showMetricDetails ? 'Hide details' : 'Show details'}
              {showMetricDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </button>
          </div>
          
          <div className="p-3">
            {/* Improved metrics display with cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Similarity Score</div>
                <div className="text-lg font-semibold">{formatPercentage(similarityScore)}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Token F1 Score</div>
                <div className="text-lg font-semibold">{formatPercentage(tokenF1Score)}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Levenshtein Distance</div>
                <div className="text-lg font-semibold">{levenshteinDistance}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Modifications</div>
                <div className="text-lg font-semibold">{modifications}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Length Change</div>
                <div className="text-lg font-semibold flex items-center">
                  {lengthChange > 0 ? (
                    <>+{lengthChange} <span className="text-xs ml-1 text-green-600">({lengthChangePercentage}%)</span></>
                  ) : lengthChange < 0 ? (
                    <>{lengthChange} <span className="text-xs ml-1 text-red-600">({lengthChangePercentage}%)</span></>
                  ) : (
                    <>0 <span className="text-xs ml-1 text-gray-500">(0%)</span></>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {showMetricDetails && metricsExplanations && (
            <div className="p-3 border-t bg-gray-50">
              <h4 className="font-medium text-xs mb-3 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Metrics Explanation
              </h4>
              
              <div className="space-y-3">
                {Object.entries(metricsExplanations)
                  .filter(([key]) => ['levenshteinDistance', 'similarityScore', 'tokenF1Score'].includes(key))
                  .map(([key, metric]) => (
                    <div key={key} className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-sm">{metric.title || key}</h5>
                      <p className="text-xs text-gray-600 mt-1">{metric.description || ''}</p>
                      <div className="mt-2 pt-2 border-t space-y-1">
                        <div className="text-xs"><span className="font-medium">Formula:</span> {metric.formula || 'N/A'}</div>
                        <div className="text-xs"><span className="font-medium">Example:</span> {metric.example || 'N/A'}</div>
                        <div className="text-xs bg-blue-50 p-1 rounded mt-1">
                          <span className="font-medium">Current calculation:</span> {generateRealTimeCalculation(key, calcValues)}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
        
        {/* Quality analysis section */}
        {renderQualityAnalysis()}
      </div>
    </div>
  );
};

export default TextComparison;