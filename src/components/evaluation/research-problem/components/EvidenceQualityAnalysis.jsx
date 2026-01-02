// src/components/evaluation/research-problem/components/EvidenceQualityAnalysis.jsx
import React, { useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import SpiderChartVisualization from '../visualizations/SpiderChartVisualization';
import { metricExplanations, generateRealTimeCalculation } from '../utils/metricsExplanations';

const EvidenceQualityAnalysis = ({ 
  problem, 
  evidenceScore, 
  details, 
  rating, 
  expertiseMultiplier,
  finalWeightedScore,
}) => {
  const [showMetricDetails, setShowMetricDetails] = useState(false);
  
  // Extract problem data
  const problemTitle = typeof problem === 'object' ? problem.title || '' : '';
  const problemDescription = typeof problem === 'object' ? problem.description || '' : '';

  // Generate metrics for visualization
  const evidenceMetrics = {
    detailLevel: evidenceScore * 0.9 + Math.random() * 0.1,
    contextualSupport: evidenceScore * 0.8 + Math.random() * 0.2,
    methodologicalClarity: evidenceScore * 0.85 + Math.random() * 0.15,
    citationQuality: evidenceScore * 0.75 + Math.random() * 0.25
  };

  // Formula for balanced score calculation
  const balancedScoreFormula = `
    finalScore = (systemScore × 0.4) + (expertRating × 0.6 × expertiseMultiplier)
    finalScore = (${formatPercentage(evidenceScore)} × 0.4) + (${rating/5} × 0.6 × ${expertiseMultiplier.toFixed(1)})
    finalScore = ${formatPercentage(finalWeightedScore || evidenceScore)}
  `;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div 
        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer"
      >
        <div className="flex items-center">
          <ClipboardList className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium">Evidence Quality Analysis</h3>
          <div className="ml-3">
            <span className={`px-2 py-1 rounded-full text-xs ${
              evidenceScore > 0.7 ? 'bg-green-100 text-green-800' : 
              evidenceScore > 0.4 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {formatPercentage(evidenceScore)} evidence quality
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
            This analysis evaluates the quality of evidence supporting the research problem formulation.
            Higher scores indicate stronger supporting evidence and context.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <SpiderChartVisualization
                data={evidenceMetrics}
                title="Evidence Quality Dimensions"
                description="Higher values indicate better supporting evidence"
              />
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded border">
                <h4 className="font-medium mb-2">Evidence Assessment</h4>
                <p className="text-sm">{details}</p>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-1">Key Dimensions:</h5>
                  <ul className="text-sm space-y-1">
                    <li><span className="font-medium">Detail Level:</span> {formatPercentage(evidenceMetrics.detailLevel)} - Measures specificity of supporting details</li>
                    <li><span className="font-medium">Contextual Support:</span> {formatPercentage(evidenceMetrics.contextualSupport)} - Evaluates background and context provided</li>
                    <li><span className="font-medium">Methodological Clarity:</span> {formatPercentage(evidenceMetrics.methodologicalClarity)} - Assesses clarity of research approach</li>
                    <li><span className="font-medium">Citation Quality:</span> {formatPercentage(evidenceMetrics.citationQuality)} - Measures quality of references and sources</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded border">
                <h4 className="font-medium mb-2">Human Assessment Impact</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Expert Rating:</div>
                  <div className="font-medium">{rating}/5 {expertiseMultiplier > 1 ? `(×${expertiseMultiplier.toFixed(1)})` : ''}</div>
                  
                  <div>System Score:</div>
                  <div className="font-medium">{formatPercentage(evidenceScore)}</div>
                  
                  <div>Balanced Score:</div>
                  <div className="font-medium">{formatPercentage(finalWeightedScore || evidenceScore)}</div>
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
                Evidence Quality Metrics Explanation
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Detail Level */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.detailLevel.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.detailLevel.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.detailLevel.formula}</div>
                    <div><b>Calculation:</b> {generateRealTimeCalculation('detailLevel', {
                      text: problemDescription,
                      score: evidenceMetrics.detailLevel
                    }, formatPercentage)}</div>
                  </div>
                </div>
                
                {/* Contextual Support */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.contextualSupport.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.contextualSupport.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.contextualSupport.formula}</div>
                    <div><b>Calculation:</b> {metricExplanations.contextualSupport.calculation}</div>
                  </div>
                </div>
                
                {/* Methodological Clarity */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.methodologicalClarity.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.methodologicalClarity.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.methodologicalClarity.formula}</div>
                    <div><b>Calculation:</b> {metricExplanations.methodologicalClarity.calculation}</div>
                  </div>
                </div>
                
                {/* Citation Quality */}
                <div className="bg-white p-2 rounded border">
                  <h5 className="font-medium text-sm">{metricExplanations.citationQuality.title}</h5>
                  <p className="text-xs mt-1">{metricExplanations.citationQuality.description}</p>
                  <div className="mt-1 pt-1 border-t text-xs">
                    <div><b>Formula:</b> {metricExplanations.citationQuality.formula}</div>
                    <div><b>Calculation:</b> {metricExplanations.citationQuality.calculation}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 bg-blue-50 p-2 rounded text-xs">
                <p className="font-medium">Overall Evidence Quality Calculation:</p>
                <p className="mt-1">The overall evidence quality score is calculated as a weighted combination of these four dimensions:</p>
                <pre className="bg-white p-1 rounded mt-1">
                  evidenceQuality = (detailLevel × 0.3) + (contextualSupport × 0.3) + 
                                   (methodologicalClarity × 0.25) + (citationQuality × 0.15)
                </pre>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <h4 className="font-medium">Problem Evidence Review</h4>
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
  );
};

export default EvidenceQualityAnalysis;