// src/components/evaluation/content/components/ContextualRelevanceAnalysis.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, BarChart2 } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import SimilarityScatterPlot from '../visualizations/SimilarityScatterPlot';
import SampleDataComparison from './SampleDataComparison';
import { SIMILARITY_METRIC_EXPLANATIONS } from '../config/contentConfig';

const ContextualRelevanceAnalysis = ({ score, weight, evidenceItems }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  
  const metricExplanation = SIMILARITY_METRIC_EXPLANATIONS.contextualAnalysis;
  
  return (
    <div className="border rounded p-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center font-medium text-sm">
          <BarChart2 className="h-4 w-4 mr-2 text-green-600" />
          Contextual Relevance:
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
            Contextual relevance evaluates whether the evidence is relevant to the property it claims to support by analyzing 
            the surrounding context of both the evidence and source text.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <span className="text-xs font-medium text-blue-800">How is contextual relevance calculated?</span>
                {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
              
              {showExplanation && (
                <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                  <p>Contextual relevance examines how well the evidence fits within the surrounding context of the source text using discourse analysis and coherence metrics.</p>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Equation:</div>
                    <div className="font-mono text-gray-700">
                      CR = (W_pos × sim_pos + W_str × sim_str + W_disc × sim_disc) / (W_pos + W_str + W_disc)
                    </div>
                    <div className="mt-1 text-gray-600">
                      where sim_pos is positional similarity, sim_str is structural similarity, 
                      sim_disc is discourse similarity, and W are weights for each component.
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Process:</div>
                    <ol className="list-decimal list-inside">
                      <li>Extract key context markers from both texts</li>
                      <li>Compare contextual elements (section location, neighboring topics)</li>
                      <li>Analyze discourse relationship patterns</li>
                      <li>Calculate overall contextual match score</li>
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
                  metricName="contextualRelevance" 
                  threshold={0.6}
                  title="Contextual Relevance Example"
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
                    <div className="font-medium mb-1">Contextual Score</div>
                    <div className="flex justify-between">
                      <span>Raw Score:</span>
                      <span className="font-medium">{formatPercentage(score)}</span>
                    </div>
                    {evidenceItems && evidenceItems.length > 0 && (
                      <div className="flex justify-between">
                        <span>Valid Contexts:</span>
                        <span>{evidenceItems.filter(e => e.semanticAnalysis?.contextualRelevance >= 0.6).length} of {evidenceItems.length}</span>
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
              <h6 className="text-xs font-medium mb-2">Contextual Relevance Distribution</h6>
              <SimilarityScatterPlot 
                evidenceItems={evidenceItems}
                metricName="contextualRelevance"
                threshold={0.6}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContextualRelevanceAnalysis;