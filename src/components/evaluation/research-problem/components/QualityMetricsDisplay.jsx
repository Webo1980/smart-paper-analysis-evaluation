// src/components/evaluation/research-problem/components/QualityMetricsDisplay.jsx
import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const QualityMetricsDisplay = ({ qualityData }) => {
  if (!qualityData) return null;
  
  const { fieldSpecificMetrics, weights, overallScore, automatedOverallScore } = qualityData;
  
  // Extract scores from fieldSpecificMetrics
  const titleScore = fieldSpecificMetrics.problemTitle?.score || 0;
  const descriptionScore = fieldSpecificMetrics.problemDescription?.score || 0;
  const relevanceScore = fieldSpecificMetrics.relevance?.score || 0;
  const evidenceScore = fieldSpecificMetrics.evidenceQuality?.score || 0;
  
  // Calculate weighted scores
  const weightedTitleScore = titleScore * weights.problemTitle;
  const weightedDescriptionScore = descriptionScore * weights.problemDescription;
  const weightedRelevanceScore = relevanceScore * weights.relevance;
  const weightedEvidenceScore = evidenceScore * weights.evidenceQuality;
  
  // Format scores for display
  const formattedScores = {
    title: formatPercentage(titleScore),
    description: formatPercentage(descriptionScore),
    relevance: formatPercentage(relevanceScore),
    evidence: formatPercentage(evidenceScore),
    weightedTitle: formatPercentage(weightedTitleScore),
    weightedDescription: formatPercentage(weightedDescriptionScore),
    weightedRelevance: formatPercentage(weightedRelevanceScore),
    weightedEvidence: formatPercentage(weightedEvidenceScore),
    overall: formatPercentage(overallScore || automatedOverallScore || 0)
  };
  
  return (
    <div className="bg-white p-3 rounded border">
      <h6 className="text-xs font-medium mb-2">Quality Metrics Summary</h6>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="p-2 rounded bg-gray-50">
            <div className="text-xs text-gray-500">Title Quality</div>
            <div className="flex justify-between items-end">
              <div className="font-medium">{formattedScores.title}</div>
              // src/components/evaluation/research-problem/components/QualityMetricsDisplay.jsx (continued)
              <div className="text-xs text-gray-500">({weights.problemTitle * 100}%)</div>
            </div>
            <div className="text-xs mt-1">Weighted: {formattedScores.weightedTitle}</div>
          </div>
          
          <div className="p-2 rounded bg-gray-50">
            <div className="text-xs text-gray-500">Description Quality</div>
            <div className="flex justify-between items-end">
              <div className="font-medium">{formattedScores.description}</div>
              <div className="text-xs text-gray-500">({weights.problemDescription * 100}%)</div>
            </div>
            <div className="text-xs mt-1">Weighted: {formattedScores.weightedDescription}</div>
          </div>
          
          <div className="p-2 rounded bg-gray-50">
            <div className="text-xs text-gray-500">Relevance</div>
            <div className="flex justify-between items-end">
              <div className="font-medium">{formattedScores.relevance}</div>
              <div className="text-xs text-gray-500">({weights.relevance * 100}%)</div>
            </div>
            <div className="text-xs mt-1">Weighted: {formattedScores.weightedRelevance}</div>
          </div>
          
          <div className="p-2 rounded bg-gray-50">
            <div className="text-xs text-gray-500">Evidence Quality</div>
            <div className="flex justify-between items-end">
              <div className="font-medium">{formattedScores.evidence}</div>
              <div className="text-xs text-gray-500">({weights.evidenceQuality * 100}%)</div>
            </div>
            <div className="text-xs mt-1">Weighted: {formattedScores.weightedEvidence}</div>
          </div>
        </div>
        
        <div className="p-2 rounded bg-blue-50 border border-blue-200">
          <div className="text-xs text-gray-600">Overall Quality Score</div>
          <div className="font-medium text-lg">{formattedScores.overall}</div>
          <div className="text-xs mt-1">
            Calculated as weighted sum of all quality dimensions
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityMetricsDisplay;