import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { TokenMatchingVisualization } from '../visualizations/ProblemComparisonVisualizations';
import { Info } from 'lucide-react';

const TokenMatchingAnalysis = ({ comparisonData, isExpanded, toggleExpanded }) => {
  // Check if data exists
  if (!comparisonData) return <div>No token matching data available</div>;
  
  // Define formula and calculation
  const formula = `
Token Precision = Matched Tokens / Modified Tokens
Token Recall = Matched Tokens / Original Tokens
Token F1 Score = 2 × (Precision × Recall) / (Precision + Recall)
  `;
  
  const titlePrecision = comparisonData?.title?.tokenMatching?.precision || 0;
  const titleRecall = comparisonData?.title?.tokenMatching?.recall || 0;
  const descPrecision = comparisonData?.description?.tokenMatching?.precision || 0;
  const descRecall = comparisonData?.description?.tokenMatching?.recall || 0;
  const overallPrecision = comparisonData?.overall?.tokenMatching?.precision || 0;
  const overallRecall = comparisonData?.overall?.tokenMatching?.recall || 0;
  
  const calculation = `
Title:
  Precision = ${comparisonData?.title?.tokenMatching?.matchedTokens?.length || 0} / ${comparisonData?.title?.tokenMatching?.modifiedTokens?.length || 1} = ${formatPercentage(titlePrecision)}
  Recall = ${comparisonData?.title?.tokenMatching?.matchedTokens?.length || 0} / ${comparisonData?.title?.tokenMatching?.originalTokens?.length || 1} = ${formatPercentage(titleRecall)}

Description:
  Precision = ${comparisonData?.description?.tokenMatching?.matchedTokens?.length || 0} / ${comparisonData?.description?.tokenMatching?.modifiedTokens?.length || 1} = ${formatPercentage(descPrecision)}
  Recall = ${comparisonData?.description?.tokenMatching?.matchedTokens?.length || 0} / ${comparisonData?.description?.tokenMatching?.originalTokens?.length || 1} = ${formatPercentage(descRecall)}

Overall:
  Precision = ${comparisonData?.overall?.tokenMatching?.matchedTokens?.length || 0} / ${comparisonData?.overall?.tokenMatching?.modifiedTokens?.length || 1} = ${formatPercentage(overallPrecision)}
  Recall = ${comparisonData?.overall?.tokenMatching?.matchedTokens?.length || 0} / ${comparisonData?.overall?.tokenMatching?.originalTokens?.length || 1} = ${formatPercentage(overallRecall)}
  `;
  
  // Calculate F1 scores
  const titleF1 = titlePrecision && titleRecall ? 
    2 * (titlePrecision * titleRecall) / (titlePrecision + titleRecall) : 0;
  
  const descF1 = descPrecision && descRecall ? 
    2 * (descPrecision * descRecall) / (descPrecision + descRecall) : 0;
  
  const overallF1 = overallPrecision && overallRecall ? 
    2 * (overallPrecision * overallRecall) / (overallPrecision + overallRecall) : 0;
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Token Matching analyzes how well individual words (tokens) from the original text were preserved in the extracted version.
            Higher precision means more words in the extracted text came from the original, while higher recall means more original words were kept.
          </p>
          
          <div className="mt-1 bg-blue-50 p-2 rounded text-xs border-l-2 border-blue-200 pl-2 mb-4">
            <p className="font-medium">Formula:</p>
            <pre className="whitespace-pre-wrap">{formula}</pre>
            
            <p className="font-medium mt-2">Calculation:</p>
            <pre className="whitespace-pre-wrap">{calculation}</pre>
          </div>
          
          <TokenMatchingVisualization comparisonData={comparisonData} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Token Statistics</span>
              </div>
              <div className="space-y-3">
                <div className="p-2 bg-white rounded border">
                  <h5 className="text-xs font-medium mb-1">Overall Token Analysis</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 p-1 rounded">
                      <span className="font-medium">Original:</span> {comparisonData?.overall?.tokenMatching?.originalTokens?.length || 0} tokens
                    </div>
                    <div className="bg-green-50 p-1 rounded">
                      <span className="font-medium">Extracted:</span> {comparisonData?.overall?.tokenMatching?.modifiedTokens?.length || 0} tokens
                    </div>
                    <div className="bg-purple-50 p-1 rounded">
                      <span className="font-medium">Preserved:</span> {comparisonData?.overall?.tokenMatching?.matchedTokens?.length || 0} tokens
                    </div>
                    <div className="bg-yellow-50 p-1 rounded">
                      <span className="font-medium">New tokens:</span> {
                        (comparisonData?.overall?.tokenMatching?.modifiedTokens?.length || 0) - 
                        (comparisonData?.overall?.tokenMatching?.matchedTokens?.length || 0)
                      } tokens
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div className="bg-blue-50 p-1 rounded text-center">
                      <div className="font-medium">Precision</div>
                      <div className="text-lg font-semibold">{formatPercentage(overallPrecision)}</div>
                    </div>
                    <div className="bg-green-50 p-1 rounded text-center">
                      <div className="font-medium">Recall</div>
                      <div className="text-lg font-semibold">{formatPercentage(overallRecall)}</div>
                    </div>
                    <div className="bg-purple-50 p-1 rounded text-center">
                      <div className="font-medium">F1 Score</div>
                      <div className="text-lg font-semibold">{formatPercentage(overallF1)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded border">
                    <h5 className="text-xs font-medium mb-1">Title</h5>
                    <ul className="text-xs space-y-1 text-gray-700">
                      <li>• Original: {comparisonData?.title?.tokenMatching?.originalTokens?.length || 0} tokens</li>
                      <li>• Extracted: {comparisonData?.title?.tokenMatching?.modifiedTokens?.length || 0} tokens</li>
                      <li>• Preserved: {comparisonData?.title?.tokenMatching?.matchedTokens?.length || 0} tokens</li>
                      <li>• Precision: {formatPercentage(titlePrecision)}</li>
                      <li>• Recall: {formatPercentage(titleRecall)}</li>
                      <li>• F1 Score: {formatPercentage(titleF1)}</li>
                    </ul>
                  </div>
                  
                  <div className="p-2 bg-white rounded border">
                    <h5 className="text-xs font-medium mb-1">Description</h5>
                    <ul className="text-xs space-y-1 text-gray-700">
                      <li>• Original: {comparisonData?.description?.tokenMatching?.originalTokens?.length || 0} tokens</li>
                      <li>• Extracted: {comparisonData?.description?.tokenMatching?.modifiedTokens?.length || 0} tokens</li>
                      <li>• Preserved: {comparisonData?.description?.tokenMatching?.matchedTokens?.length || 0} tokens</li>
                      <li>• Precision: {formatPercentage(descPrecision)}</li>
                      <li>• Recall: {formatPercentage(descRecall)}</li>
                      <li>• F1 Score: {formatPercentage(descF1)}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Interpretation</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {overallPrecision > overallRecall ? 
                  "The extracted problem uses more words from the original text than it preserves all original words. This suggests selective content preservation with refinement." :
                  overallRecall > overallPrecision ?
                  "The extracted problem preserves more original words than it exclusively uses original words. This indicates comprehensive coverage with new additions." :
                  "The extracted problem shows balanced precision and recall, indicating proportional content preservation."
                }
              </p>
              
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-1">Token Matching Quality Scale:</p>
                <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                  <li><span className="font-medium">High precision (80-100%):</span> Most extracted content comes from original</li>
                  <li><span className="font-medium">High recall (80-100%):</span> Most original content preserved</li>
                  <li><span className="font-medium">High F1 (80-100%):</span> Balanced and strong content preservation</li>
                  <li><span className="font-medium">Low scores (0-40%):</span> Limited content relation between versions</li>
                </ul>
                
                <p className="text-xs font-medium text-blue-800 mt-3 mb-1">Content Assessment:</p>
                <p className="text-xs text-blue-700">
                  {overallF1 > 0.8 ? 
                    "Excellent content preservation with high fidelity to original text." :
                    overallF1 > 0.6 ?
                    "Good content preservation with moderate modifications." :
                    overallF1 > 0.4 ?
                    "Partial content preservation with significant reformulation." :
                    "Limited content preservation with substantial rewording or new content."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default TokenMatchingAnalysis;