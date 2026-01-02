// src/components/evaluation/content/components/StructureMatchAnalysis.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, BarChart2 } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import SimilarityScatterPlot from '../visualizations/SimilarityScatterPlot';
import SampleDataComparison from './SampleDataComparison';

const StructureMatchAnalysis = ({ score, weight, evidenceItems }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  
  return (
    <div className="border rounded p-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center font-medium text-sm">
          <BarChart2 className="h-4 w-4 mr-2 text-purple-600" />
          Structure Match:
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
            Structure match assesses whether the evidence maintains the correct structure and relationships of the source text.
            This ensures the evidence doesn't alter the meaning through structural changes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <span className="text-xs font-medium text-blue-800">How is structure match calculated?</span>
                {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
              
              {showExplanation && (
                <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                  <p>Structure match evaluates how well the evidence preserves key syntactic structures and relationships between concepts from the source text.</p>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Equation:</div>
                    <div className="font-mono text-gray-700">
                      SM = (W_dep × sim_dep + W_syn × sim_syn + W_rel × sim_rel) / (W_dep + W_syn + W_rel)
                    </div>
                    <div className="mt-1 text-gray-600">
                      where sim_dep is dependency structure similarity, sim_syn is syntactic pattern similarity, 
                      sim_rel is entity relationship similarity, and W are weights for each component.
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium mb-1">Process:</div>
                    <ol className="list-decimal list-inside">
                      <li>Parse syntactic structure of both texts</li>
                      <li>Compare dependency relationships between key entities</li>
                      <li>Evaluate preservation of sentence structures</li>
                      <li>Calculate structure similarity score</li>
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
                  metricName="structureMatch" 
                  threshold={0.5}
                  title="Structure Match Example"
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
                    <div className="font-medium mb-1">Structure Score</div>
                    <div className="flex justify-between">
                      <span>Raw Score:</span>
                      <span className="font-medium">{formatPercentage(score)}</span>
                    </div>
                    {evidenceItems && evidenceItems.length > 0 && (
                      <div className="flex justify-between">
                        <span>Good Structure:</span>
                        <span>{evidenceItems.filter(e => e.semanticAnalysis?.structureMatch >= 0.5).length} of {evidenceItems.length}</span>
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
              <h6 className="text-xs font-medium mb-2">Structure Match Distribution</h6>
              <SimilarityScatterPlot 
                evidenceItems={evidenceItems}
                metricName="structureMatch"
                threshold={0.5}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StructureMatchAnalysis;