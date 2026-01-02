// src/components/evaluation/content/components/SemanticSimilarityAnalysis.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, BarChart2 } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import SimilarityScatterPlot from '../visualizations/SimilarityScatterPlot';
import SampleDataComparison from './SampleDataComparison';
import { CONTENT_CONFIG, SIMILARITY_METRIC_EXPLANATIONS } from '../config/contentConfig';

const SemanticSimilarityAnalysis = ({ score, weight, evidenceItems }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  
  const metricExplanation = SIMILARITY_METRIC_EXPLANATIONS.semanticSimilarity;
  
  return (
    <div className="border rounded p-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center font-medium text-sm">
          <BarChart2 className="h-4 w-4 mr-2 text-blue-600" />
          Semantic Similarity:
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
          {/* Description */}
          <p className="text-xs">
            {metricExplanation.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Explanation Section */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <span className="text-xs font-medium text-blue-800">How is semantic similarity calculated?</span>
                {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
              
              {showExplanation && (
                <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                  <p>Semantic similarity uses NLP techniques to measure how close the meaning of two texts are even when different words are used.</p>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Formula:</div>
                    <div className="font-mono text-gray-700">{metricExplanation.formula}</div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Equation:</div>
                    <div className="font-mono text-gray-700">
                      similarity(A, B) = cos(θ) = (A·B)/(||A||·||B||)
                    </div>
                    <div className="mt-1 text-gray-600">
                      where A and B are embedding vectors, A·B is their dot product, and ||A|| and ||B|| are their magnitudes.
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Process:</div>
                    <ol className="list-decimal list-inside">
                      <li>Convert texts to vector embeddings using neural networks</li>
                      <li>Calculate cosine similarity between vectors</li>
                      <li>Score ranges from 0 (completely different) to 1 (identical meaning)</li>
                    </ol>
                  </div>
                </div>
              )}
              
              {/* Sample Data Section */}
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
                  title="Semantic Similarity Example"
                />
              )}
            </div>
            
            {/* Calculation Details */}
            <div className="bg-white rounded border p-2">
              <div className="flex items-center mb-2">
                <Calculator className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-xs font-medium">Calculation Details</span>
              </div>
              
              <div className="text-xs">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-gray-50 p-2 rounded border">
                    <div className="font-medium mb-1">Semantic Score</div>
                    <div className="flex justify-between">
                      <span>Raw Score:</span>
                      <span className="font-medium">{formatPercentage(score)}</span>
                    </div>
                    {evidenceItems && evidenceItems.length > 0 && (
                      <div className="flex justify-between">
                        <span>Valid Evidence:</span>
                        <span>{evidenceItems.filter(e => e.semanticAnalysis?.semanticSimilarity >= CONTENT_CONFIG.textSimilarityThreshold).length} of {evidenceItems.length}</span>
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
          
          {/* Visualization */}
          {evidenceItems && evidenceItems.length > 0 && (
            <div className="mt-4">
              <h6 className="text-xs font-medium mb-2">Semantic Similarity Distribution</h6>
              <SimilarityScatterPlot 
                evidenceItems={evidenceItems}
                metricName="semanticSimilarity"
                threshold={CONTENT_CONFIG.textSimilarityThreshold}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SemanticSimilarityAnalysis;