// src/components/evaluation/content/components/TokenOverlapAnalysis.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, BarChart2 } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import SimilarityScatterPlot from '../visualizations/SimilarityScatterPlot';
import SampleDataComparison from './SampleDataComparison';
import { SIMILARITY_METRIC_EXPLANATIONS } from '../config/contentConfig';

const TokenOverlapAnalysis = ({ score, weight, evidenceItems }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  
  const metricExplanation = SIMILARITY_METRIC_EXPLANATIONS.jaccardSimilarity;
  
  return (
    <div className="border rounded p-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center font-medium text-sm">
          <BarChart2 className="h-4 w-4 mr-2 text-yellow-600" />
          Token Overlap:
        </div>
        <div className="flex items-center">
          <span className={`mr-2 px-2 py-0.5 rounded text-xs ${getStatusBadgeColor(score)}`}>
            {formatPercentage(score)}
          </span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-3 space-y-3">
          <p className="text-xs">
            Token overlap measures the percentage of matching words between the evidence and source text. This provides 
            a straightforward measure of lexical similarity.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <span className="text-xs font-medium text-blue-800">How is token overlap calculated?</span>
                {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
              
              {showExplanation && (
                <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                  <p>Token overlap is calculated using the Jaccard similarity coefficient, which computes the intersection over union of the token sets from both texts.</p>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Formula:</div>
                    <div className="font-mono text-gray-700">{metricExplanation.formula}</div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Equation:</div>
                    <div className="font-mono text-gray-700">
                      J(A, B) = |A ∩ B| / |A ∪ B|
                    </div>
                    <div className="mt-1 text-gray-600">
                      where A and B are the token sets from both texts, |A ∩ B| is the size of their intersection,
                      and |A ∪ B| is the size of their union.
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Process:</div>
                    <ol className="list-decimal list-inside">
                      <li>Split text into tokens (words, punctuation)</li>
                      <li>Find common tokens (intersection)</li>
                      <li>Count total unique tokens (union)</li>
                      <li>Calculate ratio: intersection ÷ union</li>
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
                  metricName="tokenOverlap" 
                  threshold={0.4}
                  title="Token Overlap Example"
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
                    <div className="font-medium mb-1">Token Overlap Score</div>
                    <div className="flex justify-between">
                      <span>Raw Score:</span>
                      <span className="font-medium">{formatPercentage(score)}</span>
                    </div>
                    {evidenceItems && evidenceItems.length > 0 && (
                      <div className="flex justify-between">
                        <span>High Overlap:</span>
                        <span>{evidenceItems.filter(e => e.semanticAnalysis?.tokenOverlap >= 0.4).length} of {evidenceItems.length}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded border">
                    <div className="font-medium mb-1">Weighted Score</div>
                    <div className="flex justify-between">
                      <span>Weight:</span>
                      <span>{weight} ({formatPercentage(weight, false)})</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Weighted:</span>
                      <span className="font-medium">{formatPercentage(score * weight)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-2 rounded border">
                  <span className="font-medium">Impact: </span>
                  This score represents {formatPercentage(weight, false)} of the total Evidence Quality score.
                </div>
              </div>
            </div>
          </div>
          
          {evidenceItems && evidenceItems.length > 0 && (
            <div className="mt-4">
              <h6 className="text-xs font-medium mb-2">Token Overlap Distribution</h6>
              <SimilarityScatterPlot 
                evidenceItems={evidenceItems}
                metricName="tokenOverlap"
                threshold={0.4}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenOverlapAnalysis;