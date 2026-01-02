// src/components/evaluation/template/components/ResearchAlignmentSection.jsx
import React from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { ResearchAlignmentRadar } from '../visualizations/ResearchAlignmentRadar';
import { calculateStringSimilarity } from '../utils/stringUtils';

const ResearchAlignmentSection = ({ researchAlignment, templateData, researchProblem, details }) => {
  if (!templateData || !researchProblem) {
    return <div className="text-center text-gray-500">No alignment data available</div>;
  }
  
  const score = researchAlignment.score || 0;
  
  // Calculate alignment metrics
  const titleSimilarity = calculateStringSimilarity(
    templateData.title || templateData.name || '',
    researchProblem.title || ''
  );
  
  const descriptionSimilarity = calculateStringSimilarity(
    templateData.description || '',
    researchProblem.description || ''
  );
  
  // Calculate property alignment (check if property names align with research problem)
  const propertyNames = templateData.properties?.map(p => p.label || '') || [];
  const problemWords = (researchProblem.title || '').split(/\s+/).concat(
    (researchProblem.description || '').split(/\s+/)
  );
  
  let propertyAlignment = 0;
  if (propertyNames.length > 0 && problemWords.length > 0) {
    let matchCount = 0;
    propertyNames.forEach(propName => {
      problemWords.forEach(word => {
        if (word.length > 3 && propName.toLowerCase().includes(word.toLowerCase())) {
          matchCount++;
          return;
        }
      });
    });
    propertyAlignment = matchCount / propertyNames.length;
  }
  
  // Calculate domain relevance
  const domainRelevance = researchProblem.field ? 
    calculateStringSimilarity(templateData.title || templateData.name || '', researchProblem.field) : 0;
  
  // Prepare data for radar chart
  const alignmentData = {
    titleSimilarity,
    descriptionSimilarity,
    propertyAlignment,
    domainRelevance
  };
  
  return (
    <div className="space-y-4">
      <h6 className="text-sm font-medium">Research Alignment Analysis</h6>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Alignment Metrics</h6>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Title Similarity</span>
                <span>{formatPercentage(titleSimilarity)}</span>
              </div>
              <Progress value={titleSimilarity * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Similarity between template and research problem titles</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Description Similarity</span>
                <span>{formatPercentage(descriptionSimilarity)}</span>
              </div>
              <Progress value={descriptionSimilarity * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Similarity between template and research problem descriptions</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Property Alignment</span>
                <span>{formatPercentage(propertyAlignment)}</span>
              </div>
              <Progress value={propertyAlignment * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">How well properties align with research problem</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Domain Relevance</span>
                <span>{formatPercentage(domainRelevance)}</span>
              </div>
              <Progress value={domainRelevance * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Relevance to research field</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Alignment Radar</h6>
          <ResearchAlignmentRadar alignmentData={alignmentData} height={200} />
        </div>
      </div>
      
      <div className="bg-white p-3 rounded border">
        <h6 className="text-xs font-medium mb-2">Assessment</h6>
        <div className="p-3 bg-gray-50 rounded text-sm">
          <p className="font-medium">{details || 'No assessment available'}</p>
        </div>
        
        <div className="mt-4">
          <h6 className="text-xs font-medium mb-2">Issues</h6>
          {researchAlignment.issues && researchAlignment.issues.length > 0 ? (
            <ul className="list-disc list-inside text-xs space-y-1">
              {researchAlignment.issues.map((issue, i) => (
                <li key={i} className="text-gray-700">{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-green-600">No issues detected</p>
          )}
        </div>
        
        <div className="mt-4">
          <h6 className="text-xs font-medium mb-2">Improvement Suggestions</h6>
          <ul className="list-disc list-inside text-xs space-y-1">
            {titleSimilarity < 0.3 && <li>Make the template title more relevant to the research problem</li>}
            {descriptionSimilarity < 0.3 && <li>Enhance the description to better reflect the research problem</li>}
            {propertyAlignment < 0.3 && <li>Add properties that are specific to the research domain</li>}
            {domainRelevance < 0.3 && <li>Include more domain-specific terminology in the template</li>}
          </ul>
        </div>
      </div>
      
      <div className="p-3 bg-blue-50 rounded border border-blue-100">
        <h6 className="text-xs font-medium text-blue-800 mb-2">Overall Research Alignment Score</h6>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs">Score: {formatPercentage(score)}</span>
        </div>
        <Progress value={score * 100} className="h-3" />
      </div>
    </div>
  );
};

export default ResearchAlignmentSection;