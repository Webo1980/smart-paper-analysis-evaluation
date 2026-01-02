// src/components/evaluation/content/components/SampleDataComparison.jsx
import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { highlightMatchingTokens } from '../utils/highlightUtils';
import { CONTENT_CONFIG } from '../config/contentConfig';

/**
 * Reusable component for showing evidence sample data with text comparison
 */
const SampleDataComparison = ({ 
  evidenceItems, 
  metricName = 'semanticSimilarity', 
  threshold = CONTENT_CONFIG.textSimilarityThreshold,
  title = "Sample Comparison"
}) => {
  if (!evidenceItems || !evidenceItems.length) {
    return (
      <div className="text-xs p-2 bg-gray-50 text-gray-500">
        No suitable example found in evidence data
      </div>
    );
  }
  
  // Find best example: a valid evidence with high score for the specified metric
  const bestExample = evidenceItems
    .filter(item => 
      item.isValid && 
      item.semanticAnalysis && 
      item.semanticAnalysis[metricName] > 0.6
    )
    .sort((a, b) => 
      (b.semanticAnalysis?.[metricName] || 0) - 
      (a.semanticAnalysis?.[metricName] || 0)
    )[0];
  
  // Fallback to any valid evidence if no high-scoring example found
  const example = bestExample || evidenceItems.find(item => item.isValid) || evidenceItems[0];
  
  if (!example || !example.semanticAnalysis) {
    return (
      <div className="text-xs p-2 bg-gray-50 text-gray-500">
        No suitable example found in evidence data
      </div>
    );
  }
  
  const score = example.semanticAnalysis[metricName] || 0;
  
  // Highlight matching tokens between value and evidence
  const { text1Highlighted, text2Highlighted } = highlightMatchingTokens(
    example.value?.toString() || '',
    example.evidence || ''
  );
  
  return (
    <div className="space-y-2 bg-gray-50 p-2 rounded border mt-2">
      <div className="text-xs font-medium mb-1">{title}:</div>
      
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="text-left p-1 bg-blue-50 text-blue-700 rounded-t border-b">Property Value</th>
            <th className="text-left p-1 bg-green-50 text-green-700 rounded-t border-b">Evidence ({example.section})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 align-top border-r border-gray-200 bg-blue-50 bg-opacity-20">
              <div className="max-h-24 overflow-y-auto break-words" dangerouslySetInnerHTML={{ __html: text1Highlighted }}></div>
            </td>
            <td className="p-2 align-top bg-green-50 bg-opacity-20">
              <div className="max-h-24 overflow-y-auto break-words" dangerouslySetInnerHTML={{ __html: text2Highlighted }}></div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div className="text-xs bg-white p-2 rounded border font-mono">
        <div className="font-medium mb-1">Analysis:</div>
        {formatPercentage(score)} {metricName} score<br/>
        Property: {example.propertyLabel || example.property}<br/>
        Section: {example.section}<br/>
        Status: {score >= threshold ? 'Valid' : 'Invalid'} (threshold: {formatPercentage(threshold)})
      </div>
      
      <div className="text-xs text-gray-600">
        <span className="font-medium">Note:</span> Highlighted words show matching tokens between texts. 
        <span className="bg-blue-100 rounded px-1 mx-1">Blue</span> for property value and 
        <span className="bg-green-100 rounded px-1 mx-1">green</span> for evidence.
      </div>
    </div>
  );
};

export default SampleDataComparison;