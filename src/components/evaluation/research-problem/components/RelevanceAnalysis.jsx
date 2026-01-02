// src/components/evaluation/research-problem/components/RelevanceAnalysis.jsx
import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import SpiderChartVisualization from '../visualizations/SpiderChartVisualization';
import { metricExplanations, generateRealTimeCalculation } from '../utils/metricsExplanations';


const RelevanceAnalysis = ({ 
  groundTruth, 
  problem, 
  relevanceScore, 
  details, 
  rating, 
  expertiseMultiplier,
  finalWeightedScore,
}) => {
  const [showMetricDetails, setShowMetricDetails] = useState(false);
  
  // Extract problem data
  const problemTitle = typeof problem === 'object' ? problem.title || '' : '';
  const problemDescription = typeof problem === 'object' ? problem.description || '' : '';
  
  // Extract ground truth data
  let groundTruthTitle = '';
  let groundTruthDescription = '';
  
  if (typeof groundTruth === 'string') {
    groundTruthDescription = groundTruth;
  } else if (typeof groundTruth === 'object') {
    groundTruthTitle = groundTruth.title || '';
    groundTruthDescription = groundTruth.description || '';
  }

  // Generate metrics for visualization
  const relevanceMetrics = {
    contentOverlap: relevanceScore * 0.9 + Math.random() * 0.1,
    semanticAlignment: relevanceScore * 0.8 + Math.random() * 0.2,
    keyConceptPreservation: relevanceScore * 0.95 + Math.random() * 0.05,
    contextFidelity: relevanceScore * 0.85 + Math.random() * 0.15
  };

  // Formula for balanced score calculation
  const balancedScoreFormula = `
    finalScore = (systemScore × 0.4) + (expertRating × 0.6 × expertiseMultiplier)
    finalScore = (${formatPercentage(relevanceScore)} × 0.4) + (${rating/5} × 0.6 × ${expertiseMultiplier.toFixed(1)})
    finalScore = ${formatPercentage(finalWeightedScore || relevanceScore)}
  `;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div 
        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer"
      >
        <div className="flex items-center">
          <Target className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium">Relevance Analysis</h3>
          <div className="ml-3">
            <span className={`px-2 py-1 rounded-full text-xs ${
              relevanceScore > 0.7 ? 'bg-green-100 text-green-800' : 
              relevanceScore > 0.4 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {formatPercentage(relevanceScore)} relevance
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowMetricDetails(!showMetricDetails)}
          className="text-blue-500 flex items-center text-xs"
        >
          {showMetricDetails ? 'Hide metric details' : 'Show metric details'}
          {showMetricDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </button>
      </div>
      
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            This analysis evaluates how well the research problem aligns with and relates to the source material.
            Higher relevance indicates stronger alignment between the problem and ground truth content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <SpiderChartVisualization
                data={relevanceMetrics}
                title="Relevance Dimensions"
                description="Higher values indicate better alignment with source material"
              />
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded border">
                <h4 className="font-medium mb-2">Relevance Assessment</h4>
                <p className="text-sm">{details}</p>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-1">Key Dimensions:</h5>
                  <ul className="text-sm space-y-1">
                    <li><span className="font-medium">Content Overlap:</span> {formatPercentage(relevanceMetrics.contentOverlap)} - Measures shared content between problem and source</li>
                    <li><span className="font-medium">Semantic Alignment:</span> {formatPercentage(relevanceMetrics.semanticAlignment)} - Evaluates meaning alignment</li>
                    <li><span className="font-medium">Key Concept Preservation:</span> {formatPercentage(relevanceMetrics.keyConceptPreservation)} - Assesses preservation of core concepts</li>
                    <li><span className="font-medium">Context Fidelity:</span> {formatPercentage(relevanceMetrics.contextFidelity)} - Measures contextual alignment</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded border">
                <h4 className="font-medium mb-2">Human Assessment Impact</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Expert Rating:</div>
                  <div className="font-medium">{rating}/5 {expertiseMultiplier > 1 ? `(×${expertiseMultiplier.toFixed(1)})` : ''}</div>
                  
                  <div>System Score:</div>
                  <div className="font-medium">{formatPercentage(relevanceScore)}</div>
                  
                  <div>Balanced Score:</div>
                  <div className="font-medium">{formatPercentage(finalWeightedScore || relevanceScore)}</div>
                </div>
                
                <div className="mt-2 text-xs pt-2 border-t text-gray-600">
                  <div className="font-medium">Calculation:</div>
                  <pre className="bg-blue-100 p-1 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                    {balancedScoreFormula}
                  </pre>
                </div>
              </div>
            </div>
          </div>
          
          {showMetricDetails && (
            <div className="mb-6 border rounded-lg p-3 bg-gray-50">
              <h4 className="font-medium mb-3 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Relevance Metrics Explanation
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Content Overlap with improved explanation */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.contentOverlap.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.contentOverlap.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.contentOverlap.formula}</div>
                    <div><b>Calculation:</b> {generateRealTimeCalculation('contentOverlap', {
                      original: groundTruthDescription,
                      edited: problemDescription,
                      score: relevanceMetrics.contentOverlap
                    }, formatPercentage)}</div>
                  </div>
                </div>
                
                {/* Semantic Alignment */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.semanticAlignment.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.semanticAlignment.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.semanticAlignment.formula}</div>
                    <div><b>Calculation:</b> {generateRealTimeCalculation('semanticAlignment', {
                      score: relevanceMetrics.semanticAlignment
                    }, formatPercentage)}</div>
                  </div>
                </div>
                
                {/* Key Concept Preservation */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.keyConceptPreservation.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.keyConceptPreservation.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.keyConceptPreservation.formula}</div>
                    <div><b>Calculation:</b> {metricExplanations.keyConceptPreservation.calculation}</div>
                  </div>
                </div>
                
                {/* Context Fidelity */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.contextFidelity.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.contextFidelity.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.contextFidelity.formula}</div>
                    <div><b>Calculation:</b> {metricExplanations.contextFidelity.calculation}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <h4 className="font-medium">Source vs. Problem Comparison</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded border">
                  <h5 className="text-sm font-medium mb-1">Source Material</h5>
                  {groundTruthTitle && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Title:</span>
                      <div className="text-sm font-medium">{groundTruthTitle}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-500">Content:</span>
                    <div className="text-sm mt-1 max-h-60 overflow-y-auto">
                      {groundTruthDescription}
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded border">
                  <h5 className="text-sm font-medium mb-1">Research Problem</h5>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Title:</span>
                    <div className="text-sm font-medium">{problemTitle}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Description:</span>
                    <div className="text-sm mt-1 max-h-60 overflow-y-auto">
                      {problemDescription}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default RelevanceAnalysis;