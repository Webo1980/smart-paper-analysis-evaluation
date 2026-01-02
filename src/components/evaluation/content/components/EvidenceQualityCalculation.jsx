// src/components/evaluation/content/components/EvidenceQualityCalculation.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, BarChart2, PieChart, List, CheckCircle, XCircle } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import { EVIDENCE_QUALITY_WEIGHTS, METRIC_EXPLANATIONS } from '../config/contentConfig';
import EvidenceQualityOverview from './EvidenceQualityOverview';

const EvidenceQualityCalculation = ({ 
  score, 
  componentScores,
  weightedScores,
  metrics,
  evidenceItems
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const metricExplanation = METRIC_EXPLANATIONS.evidenceQuality.components?.overallQuality;
  
  return (
    <div className="space-y-4">
      
      {/* Calculation Section */}
      <div className="border rounded p-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center font-medium text-sm">
            <BarChart2 className="h-4 w-4 mr-2 text-indigo-600" />
            Overall Evidence Quality:
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
            {/* Overview Section */}
            <EvidenceQualityOverview 
                metrics={metrics} 
                evidenceItems={evidenceItems} 
                calculatedScores={componentScores}
            />
            <p className="text-xs">
              The overall evidence quality score combines all individual metrics, weighted by their importance,
              to provide a comprehensive assessment of how well properties are supported by evidence from the paper.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <span className="text-xs font-medium text-blue-800">How is overall evidence quality calculated?</span>
                  {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </div>
                
                {showExplanation && (
                  <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                    <p>The overall evidence quality score is a weighted sum of all component metrics.</p>
                    
                    <div className="bg-white p-2 rounded border">
                      <div className="font-medium mb-1">Formula:</div>
                      <div className="font-mono text-gray-700">{metricExplanation?.formula}</div>
                    </div>
                    
                    <div className="bg-white p-2 rounded border">
                      <div className="font-medium mb-1">Equation:</div>
                      <div className="font-mono text-gray-700">
                        EQ = (CC × {EVIDENCE_QUALITY_WEIGHTS.citationCoverage}) + 
                             (SS × {EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity}) + 
                             (CR × {EVIDENCE_QUALITY_WEIGHTS.contextualRelevance}) + 
                             (TO × {EVIDENCE_QUALITY_WEIGHTS.tokenOverlap}) + 
                             (SM × {EVIDENCE_QUALITY_WEIGHTS.structureMatch})
                      </div>
                      <div className="mt-1 text-gray-600">
                        {metricExplanation?.explanation}
                      </div>
                    </div>
                    
                    <div className="bg-white p-2 rounded border">
                      <div className="font-medium mb-1">Process:</div>
                      <ol className="list-decimal list-inside">
                        <li>Calculate individual component metrics</li>
                        <li>Apply appropriate weight to each component</li>
                        <li>Sum all weighted components for final score</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded border p-2">
                <div className="flex items-center mb-2">
                  <Calculator className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-xs font-medium">Calculation Details</span>
                </div>
                
                <div className="text-xs">
                  <div className="bg-gray-50 p-2 rounded border mb-2">
                    <div className="font-medium mb-1">Component Scores</div>
                    <table className="w-full text-xs">
                      <thead className="text-left">
                        <tr>
                          <th className="pr-2">Component</th>
                          <th className="pr-2">Raw Score</th>
                          <th className="pr-2">Weight</th>
                          <th>Weighted</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="pr-2">Semantic Similarity</td>
                          <td className="pr-2">{formatPercentage(componentScores.semanticSimilarityScore)}</td>
                          <td className="pr-2">{EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity}</td>
                          <td>{formatPercentage(weightedScores.weightedSemanticScore)}</td>
                        </tr>
                        <tr>
                          <td className="pr-2">Contextual Relevance</td>
                          <td className="pr-2">{formatPercentage(componentScores.contextualRelevanceScore)}</td>
                          <td className="pr-2">{EVIDENCE_QUALITY_WEIGHTS.contextualRelevance}</td>
                          <td>{formatPercentage(weightedScores.weightedContextScore)}</td>
                        </tr>
                        <tr>
                          <td className="pr-2">Token Overlap</td>
                          <td className="pr-2">{formatPercentage(componentScores.tokenOverlapScore)}</td>
                          <td className="pr-2">{EVIDENCE_QUALITY_WEIGHTS.tokenOverlap}</td>
                          <td>{formatPercentage(weightedScores.weightedTokenScore)}</td>
                        </tr>
                        <tr>
                          <td className="pr-2">Structure Match</td>
                          <td className="pr-2">{formatPercentage(componentScores.structureMatchScore)}</td>
                          <td className="pr-2">{EVIDENCE_QUALITY_WEIGHTS.structureMatch}</td>
                          <td>{formatPercentage(weightedScores.weightedStructureScore)}</td>
                        </tr>
                        <tr className="font-medium border-t">
                          <td className="pr-2 pt-1">Combined Score</td>
                          <td className="pr-2 pt-1" colSpan={3}>{formatPercentage(score)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-blue-50 p-2 rounded border">
                    <span className="font-medium">Assessment: </span>
                    {score >= 0.8 ? (
                      "Evidence quality is excellent, with strong support for most property values."
                    ) : score >= 0.6 ? (
                      "Evidence quality is good, with adequate support for most property values."
                    ) : score >= 0.4 ? (
                      "Evidence quality is moderate, with some property values lacking strong support."
                    ) : (
                      "Evidence quality needs improvement, with many property values lacking proper support."
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceQualityCalculation;