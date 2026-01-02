// src/components/evaluation/content/components/EvidenceAnalysisMatrix.jsx
import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';

const EvidenceAnalysisMatrix = ({ sourceText, evidenceText, semanticAnalysis }) => {
  if (!semanticAnalysis) return null;
  
  const {
    semanticSimilarity,
    contextualRelevance,
    tokenOverlap,
    structureMatch,
    overallScore
  } = semanticAnalysis;
  
  return (
    <div className="mb-3">
      <h6 className="text-xs font-medium mb-2">Evidence Analysis Matrix</h6>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="text-xs bg-gray-50 p-2 rounded border">
          <div className="font-medium mb-1">Semantic Similarity</div>
          <div className={`px-2 py-0.5 rounded text-xs inline-block ${getStatusBadgeColor(semanticSimilarity)}`}>
            {formatPercentage(semanticSimilarity)}
          </div>
        </div>
        <div className="text-xs bg-gray-50 p-2 rounded border">
          <div className="font-medium mb-1">Contextual Relevance</div>
          <div className={`px-2 py-0.5 rounded text-xs inline-block ${getStatusBadgeColor(contextualRelevance)}`}>
            {formatPercentage(contextualRelevance)}
          </div>
        </div>
        <div className="text-xs bg-gray-50 p-2 rounded border">
          <div className="font-medium mb-1">Token Overlap</div>
          <div className={`px-2 py-0.5 rounded text-xs inline-block ${getStatusBadgeColor(tokenOverlap)}`}>
            {formatPercentage(tokenOverlap)}
          </div>
        </div>
        <div className="text-xs bg-gray-50 p-2 rounded border">
          <div className="font-medium mb-1">Structure Match</div>
          <div className={`px-2 py-0.5 rounded text-xs inline-block ${getStatusBadgeColor(structureMatch)}`}>
            {formatPercentage(structureMatch)}
          </div>
        </div>
      </div>
      <div className="text-xs bg-gray-50 p-2 rounded border">
        <div className="font-medium mb-1">Overall Score</div>
        <div className={`px-2 py-0.5 rounded text-xs inline-block ${getStatusBadgeColor(overallScore)}`}>
          {formatPercentage(overallScore)}
        </div>
      </div>
    </div>
  );
};

export default EvidenceAnalysisMatrix;