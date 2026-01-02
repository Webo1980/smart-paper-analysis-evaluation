// src/components/evaluation/content/components/CitationCoverageAnalysis.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, BarChart2 } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import SampleDataComparison from './SampleDataComparison';
import { CONTENT_CONFIG } from '../config/contentConfig';

const CitationCoverageAnalysis = ({ score, weight, evidenceItems, validCount, totalCount }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  
  // Calculate the actual coverage score from the evidence items if validCount appears incorrect
  const actualValidCount = evidenceItems?.filter(item => item.isValid)?.length || validCount || 0;
  const actualTotalCount = evidenceItems?.length || totalCount || 1;
  const actualScore = actualValidCount / Math.max(1, actualTotalCount);
  
  // Use the more reliable score
  const displayScore = isNaN(score) || score === 0 ? actualScore : score;
  
  return (
    <div className="border rounded p-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center font-medium text-sm">
          <BarChart2 className="h-4 w-4 mr-2 text-orange-600" />
          Citation Coverage:
        </div>
        <div className="flex items-center">
          <span className={`mr-2 px-2 py-0.5 rounded text-xs ${getStatusBadgeColor(displayScore)}`}>
            {formatPercentage(displayScore)}
          </span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-3 space-y-3">
          <p className="text-xs">
            Citation coverage measures the percentage of property values that have valid evidence citations from the paper.
            A high score indicates that most annotations are properly supported by text from the paper.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <span className="text-xs font-medium text-blue-800">How is citation coverage calculated?</span>
                {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
              
              {showExplanation && (
                <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                  <p>Citation coverage is calculated as the ratio of valid citations to total citations across all property values.</p>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Formula:</div>
                    <div className="font-mono text-gray-700">Coverage = Valid Citations / Total Citations</div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Equation:</div>
                    <div className="font-mono text-gray-700">
                      CC = count(citations where similarity ≥ threshold) / count(all citations)
                    </div>
                    <div className="mt-1 text-gray-600">
                      where similarity is the overall semantic similarity score and threshold is the minimum 
                      similarity required (currently {formatPercentage(CONTENT_CONFIG.textSimilarityThreshold)}).
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Process:</div>
                    <ol className="list-decimal list-inside">
                      <li>Count total number of citations across all properties</li>
                      <li>Count citations with similarity score above threshold ({formatPercentage(CONTENT_CONFIG.textSimilarityThreshold)})</li>
                      <li>Calculate ratio of valid to total citations</li>
                    </ol>
                  </div>
                </div>
              )}
              
              <div 
                className="flex items-center justify-between cursor-pointer bg-green-50 p-2 rounded border border-green-100 mt-3"
                onClick={() => setShowSampleData(!showSampleData)}
              >
                <span className="text-xs font-medium text-green-800">Sample data from your evidence</span>
                {showSampleData ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
              
              {showSampleData && (
                <SampleDataComparison 
                  evidenceItems={evidenceItems} 
                  metricName="semanticSimilarity"
                  threshold={CONTENT_CONFIG.textSimilarityThreshold}
                  title="Citation Coverage Example"
                />
              )}
            </div>
            
            <div className="bg-white rounded border p-2">
              <div className="flex items-center mb-2">
                <Calculator className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-xs font-medium">Calculation Details</span>
              </div>
              
              <div className="text-xs">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-gray-50 p-2 rounded border">
                    <div className="font-medium mb-1">Citation Counts</div>
                    <div className="flex justify-between">
                      <span>Valid Citations:</span>
                      <span className="font-medium">{actualValidCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Citations:</span>
                      <span className="font-medium">{actualTotalCount}</span>
                    </div>
                    <div className="flex justify-between mt-1 pt-1 border-t">
                      <span>Coverage:</span>
                      <span className="font-medium">{formatPercentage(displayScore)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded border">
                    <div className="font-medium mb-1">Weighted Score</div>
                    <div className="flex justify-between">
                      <span>Weight:</span>
                      <span>{weight} ({formatPercentage(weight, false)})</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Weighted:</span>
                      <span className="font-medium">{formatPercentage(displayScore * weight)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-2 rounded border">
                  <span className="font-medium">Impact: </span>
                  This score represents {formatPercentage(weight, false)} of the total Evidence Quality score and reflects how well property values are supported by evidence from the paper.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitationCoverageAnalysis;