// src/components/evaluation/content/components/EvidenceQualityOverview.jsx

import React from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import EvidenceDistributionChart from '../visualizations/EvidenceDistributionChart';
import { EVIDENCE_QUALITY_WEIGHTS } from '../config/contentConfig';

const EvidenceQualityOverview = ({ metrics, evidenceItems, calculatedScores }) => {
  if (!metrics || !metrics.evidenceQuality) {
    return <div className="text-center text-gray-500">No evidence quality data available</div>;
  }

  const evidenceQuality = metrics.evidenceQuality;
  const details = evidenceQuality.details || {};
  
  const {
    semanticSimilarityScore,
    contextualRelevanceScore,
    tokenOverlapScore,
    structureMatchScore,
    citationCoverageScore,
  } = calculatedScores;

  return (
    <div className="space-y-6">
      {/* 
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded border">
          <div className="text-xs text-gray-500">Evidence Validation Rate</div>
          <div className="text-lg font-semibold">
            {formatPercentage(citationCoverageScore)}
          </div>
          <div className="text-xs mt-1">
            {details.validEvidenceCount} of {details.totalEvidenceCount} citations valid
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded border">
          <div className="text-xs text-gray-500">Overall Quality</div>
          <div className="text-lg font-semibold">{formatPercentage(combinedScore)}</div>
          <div className="text-xs mt-1">Combined score across all metrics</div>
        </div>
      </div>
      Top Cards */}
      {/* Component Contributions */}
      <div className="space-y-3">
        <h6 className="text-xs font-medium">Component Contributions</h6>
        {/*
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Citation Coverage ({(EVIDENCE_QUALITY_WEIGHTS.citationCoverage * 100)}%)</span>
            <span className="text-xs">{formatPercentage(citationCoverageScore)}</span>
          </div>
          <Progress value={citationCoverageScore * 100} className="h-2" />
        </div>
        */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Semantic Similarity ({(EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity * 100)}%)</span>
            <span className="text-xs">{formatPercentage(semanticSimilarityScore)}</span>
          </div>
          <Progress value={semanticSimilarityScore * 100} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Contextual Relevance ({(EVIDENCE_QUALITY_WEIGHTS.contextualRelevance * 100)}%)</span>
            <span className="text-xs">{formatPercentage(contextualRelevanceScore)}</span>
          </div>
          <Progress value={contextualRelevanceScore * 100} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Token Overlap ({(EVIDENCE_QUALITY_WEIGHTS.tokenOverlap * 100)}%)</span>
            <span className="text-xs">{formatPercentage(tokenOverlapScore)}</span>
          </div>
          <Progress value={tokenOverlapScore * 100} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Structure Match ({(EVIDENCE_QUALITY_WEIGHTS.structureMatch * 100)}%)</span>
            <span className="text-xs">{formatPercentage(structureMatchScore)}</span>
          </div>
          <Progress value={structureMatchScore * 100} className="h-2" />
        </div>
      </div>
      
      {/* Overall Calculation Table 
      <div className="p-3 bg-blue-50 rounded border border-blue-100">
        <h6 className="text-xs font-medium mb-2 text-blue-800">Overall Evidence Quality Score Calculation</h6>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="bg-white p-2 rounded border text-center">
            <div className="font-medium mb-1 text-blue-800">Citation Coverage</div>
            <div className="flex justify-between px-1">
              <span>{formatPercentage(citationCoverageScore)}</span>
              <span>× {EVIDENCE_QUALITY_WEIGHTS.citationCoverage}</span>
            </div>
            <div className="font-medium mt-1">{formatPercentage(weightedCitationScore)}</div>
          </div>
          
          <div className="bg-white p-2 rounded border text-center">
            <div className="font-medium mb-1 text-blue-800">Semantic</div>
            <div className="flex justify-between px-1">
              <span>{formatPercentage(semanticSimilarityScore)}</span>
              <span>× {EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity}</span>
            </div>
            <div className="font-medium mt-1">{formatPercentage(weightedSemanticScore)}</div>
          </div>
          
          <div className="bg-white p-2 rounded border text-center">
            <div className="font-medium mb-1 text-blue-800">Contextual</div>
            <div className="flex justify-between px-1">
              <span>{formatPercentage(contextualRelevanceScore)}</span>
              <span>× {EVIDENCE_QUALITY_WEIGHTS.contextualRelevance}</span>
            </div>
            <div className="font-medium mt-1">{formatPercentage(weightedContextScore)}</div>
          </div>
          
          <div className="bg-white p-2 rounded border text-center">
            <div className="font-medium mb-1 text-blue-800">Token</div>
            <div className="flex justify-between px-1">
              <span>{formatPercentage(tokenOverlapScore)}</span>
              <span>× {EVIDENCE_QUALITY_WEIGHTS.tokenOverlap}</span>
            </div>
            <div className="font-medium mt-1">{formatPercentage(weightedTokenScore)}</div>
          </div>
          
          <div className="bg-white p-2 rounded border text-center">
            <div className="font-medium mb-1 text-blue-800">Structure</div>
            <div className="flex justify-between px-1">
              <span>{formatPercentage(structureMatchScore)}</span>
              <span>× {EVIDENCE_QUALITY_WEIGHTS.structureMatch}</span>
            </div>
            <div className="font-medium mt-1">{formatPercentage(weightedStructureScore)}</div>
          </div>
        </div>
        
        <div className="mt-2 bg-white p-2 rounded border">
          <div className="flex justify-between items-center">
            <span className="font-medium">Combined Score: {formatPercentage(weightedSemanticScore)} + {formatPercentage(weightedContextScore)} + {formatPercentage(weightedTokenScore)} + {formatPercentage(weightedStructureScore)} + {formatPercentage(weightedCitationScore)}</span>
            <span className={`px-2 py-0.5 rounded font-bold ${getStatusBadgeColor(combinedScore)}`}>
              {formatPercentage(combinedScore)}
            </span>
          </div>
        </div>
      </div>
      */}
      {/* Evidence Distribution Charts */}
      {/*evidenceItems && evidenceItems.length > 0 && (
        <div>
          <h6 className="text-xs font-medium mb-2">Evidence Quality Distribution</h6>
          <EvidenceDistributionChart 
            validEvidenceCount={evidenceItems.filter(e => e.hasEvidence).length}
            invalidEvidenceCount={evidenceItems.filter(e => !e.hasEvidence).length}
            evidenceItems={evidenceItems}
          />
        </div>
      )*/}
    </div>
  );
};

export default EvidenceQualityOverview;