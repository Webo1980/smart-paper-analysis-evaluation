// src/components/evaluation/research-problem/components/ResearchProblemQualityMetrics.jsx
import React, { useState } from 'react';
import { Card } from '../../../ui/card';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import TextComparison from '../../base/TextComparison';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { metricExplanations } from '../utils/metricsExplanations';

import { 
  QUALITY_CONFIG, 
  QUALITY_WEIGHTS, 
  QUALITY_EXPLANATIONS 
} from '../config/researchProblemConfig';
import RelevanceAnalysis from './RelevanceAnalysis';
import EvidenceQualityAnalysis from './EvidenceQualityAnalysis';

const ResearchProblemQualityMetrics = ({
  metrics,
  groundTruth,
  problemData,
  expertiseWeight,
  expertiseMultiplier,
  ratings = {},
  comparisonData,
  // NEW: Accept pre-calculated data from assessment
  qualityData,
  qualityAnalysis
}) => {
  const { 
    problemTitle: problemTitleRating = 3, 
    problemDescription: problemDescriptionRating = 3, 
    relevance: relevanceRating = 3,
    evidenceQuality: evidenceQualityRating = 3
  } = ratings;

  const [expandedAnalyses, setExpandedAnalyses] = useState({
    title: false,
    description: false,
    relevance: false,
    evidenceQuality: false
  });

  // Use saved quality data if available, otherwise use empty state
  // (should always be available from assessment)
  const displayQualityAnalysis = qualityAnalysis || {
    problemTitle: 0.5,
    problemDescription: 0.5,
    relevance: 0.5,
    evidenceQuality: 0.5,
    details: {
      problemTitleReason: "Loading analysis...",
      problemDescriptionReason: "Loading analysis...",
      relevanceReason: "Loading analysis...",
      evidenceQualityReason: "Loading analysis..."
    }
  };

  // Use saved quality data if available
  const displayQualityData = qualityData || {
    fieldSpecificMetrics: {
      problemTitle: { score: 0.5, issues: [] },
      problemDescription: { score: 0.5, issues: [] },
      relevance: { score: 0.5, issues: [] },
      evidenceQuality: { score: 0.5, issues: [] }
    },
    weights: QUALITY_WEIGHTS,
    overallScore: 0.5,
    automatedOverallScore: 0.5
  };

  // Use saved score details if available
  const scoreDetails = qualityData?.scoreDetails || {
    finalScore: displayQualityData.overallScore || 0.5
  };

  const toggleAnalysis = (analysis) => {
    setExpandedAnalyses(prev => ({
      ...prev,
      [analysis]: !prev[analysis]
    }));
  };

  const renderQualityTable = (data, showAnalysis, toggleAnalysis) => {
    if (!data || !showAnalysis) return null;
    
    const qualityMetrics = [
      { key: 'problemTitle', weight: QUALITY_WEIGHTS.problemTitle },
      { key: 'problemDescription', weight: QUALITY_WEIGHTS.problemDescription },
      { key: 'relevance', weight: QUALITY_WEIGHTS.relevance },
      { key: 'evidenceQuality', weight: QUALITY_WEIGHTS.evidenceQuality }
    ];

    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Quality Dimension</th>
              {qualityMetrics.map(metric => (
                <th key={metric.key} className="p-2 text-left border-b">
                  {QUALITY_EXPLANATIONS[metric.key]?.title} ({metric.weight * 100}%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
              {qualityMetrics.map(metric => (
                <td key={`${metric.key}-explanation`} className="p-2 border-r">
                  {QUALITY_EXPLANATIONS[metric.key]?.short}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Raw Data</td>
              {qualityMetrics.map(metric => (
                <td key={`${metric.key}-raw`} className="p-2 border-r">
                  <div className="grid grid-cols-2 gap-1">
                    {metric.key === 'problemTitle' && (
                      <>
                        <div>Title:</div>
                        <div className="text-right">{problemData?.title || 'N/A'}</div>
                      </>
                    )}
                    {metric.key === 'problemDescription' && (
                      <>
                        <div>Description:</div>
                        <div className="text-right">{problemData?.description?.length || 0} chars</div>
                      </>
                    )}
                    {['relevance', 'evidenceQuality'].includes(metric.key) && (
                      <>
                        <div>Rating:</div>
                        <div className="text-right">{ratings[metric.key] || 3}/5</div>
                      </>
                    )}
                    <div>Score:</div>
                    <div className="text-right">{formatPercentage(displayQualityAnalysis[metric.key] || 0)}</div>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border-r font-medium">Component Score</td>
              {qualityMetrics.map(metric => (
                <td key={`${metric.key}-score`} className="p-2 border-r font-medium">
                  {formatPercentage(displayQualityAnalysis[metric.key] || 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
              {qualityMetrics.map(metric => (
                <td key={`${metric.key}-weighted`} className="p-2 border-r text-blue-700 font-medium">
                  {formatPercentage((displayQualityAnalysis[metric.key] || 0) * metric.weight)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              {QUALITY_EXPLANATIONS.overallQuality.formula}<br/>
              {qualityMetrics.map(metric => (
                `+ (${formatPercentage(displayQualityAnalysis[metric.key] || 0)} × ${metric.weight}) `
              )).join('\n')}<br/>
              {qualityMetrics.map(metric => (
                `+ ${formatPercentage((displayQualityAnalysis[metric.key] || 0) * metric.weight)} `
              )).join('\n')}<br/>
              = {formatPercentage(data.automatedOverallScore || data.overallScore || 0)}
            </code>
          </div>
        </div>
      </div>
    );
  };

  const renderMetricDetails = (metricType) => {
    if (!displayQualityAnalysis) return null;
    
    switch(metricType) {
      case 'problemTitle':
        return (
          <TextComparison
            comparisonData={comparisonData?.title}
            fieldName="title"
            qualityAnalysis=''
            showQualitySection={false}
            metricsExplanations={metricExplanations}
          />
        );
      case 'problemDescription':
        return (
          <TextComparison
            comparisonData={comparisonData?.description}
            fieldName="Description"
            qualityAnalysis=''
            showQualitySection={false}
            metricsExplanations={metricExplanations}
          />
        );
      case 'relevance':
        return (
          <RelevanceAnalysis 
            groundTruth={groundTruth}
            problem={problemData}
            relevanceScore={displayQualityAnalysis.relevance}
            details={displayQualityAnalysis.details?.relevanceReason || displayQualityAnalysis.details?.relevanceDetails}
            rating={relevanceRating}
            expertiseMultiplier={expertiseMultiplier}
          />
        );
      case 'evidenceQuality':
        return (
          <EvidenceQualityAnalysis
            problem={problemData}
            evidenceScore={displayQualityAnalysis.evidenceQuality}
            details={displayQualityAnalysis.details?.evidenceQualityReason || displayQualityAnalysis.details?.evidenceQualityDetails}
            rating={evidenceQualityRating}
            expertiseMultiplier={expertiseMultiplier}
            finalWeightedScore={scoreDetails.finalScore}
          />
        );
      default:
        const explanation = QUALITY_EXPLANATIONS[metricType];
        if (!explanation) return null;
        
        const currentScore = displayQualityAnalysis[metricType] || 0;
        const currentRating = ratings[metricType] || 3;
        
        return (
          <div className="p-2 bg-gray-50 rounded mb-2">
            <h6 className="text-xs font-medium mb-1">{explanation.title}</h6>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 p-2 bg-white rounded border">
                <p className="text-xs font-medium mb-1">Explanation:</p>
                <div className="border-t pt-1">
                  <p className="text-xs">{explanation.long}</p>
                  <div className="mt-1 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                    <span className="font-medium">Method: </span>
                    <span className="whitespace-nowrap">{explanation.method}</span>
                  </div>
                  <div className="mt-1 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                    <span className="font-medium">Formula: </span>
                    <span className="whitespace-nowrap">{explanation.formula}</span>
                  </div>
                  {explanation.calculation && (
                    <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                      <span className="font-medium">Calculation: </span>
                      <pre className="text-xs whitespace-pre-wrap">
                        {typeof explanation.calculation === 'function' 
                          ? explanation.calculation(problemData, groundTruth, displayQualityAnalysis)
                          : explanation.calculation}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 p-2 bg-white rounded border">
                <p className="text-xs font-medium mb-1">Current Problem:</p>
                <div className="border-t pt-1">
                  <p className="text-xs" dangerouslySetInnerHTML={{
                    __html: typeof explanation.example === 'function'
                      ? explanation.example(problemData, groundTruth, displayQualityAnalysis)
                      : explanation.example
                  }} />
                  <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                    <span className="font-medium">Details:</span>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center">
                        <span className="border-l-2 border-blue-200 pl-2">Score:</span>
                        <span className="ml-2">{formatPercentage(currentScore)}</span>
                      </div>
                      {['relevance', 'evidenceQuality'].includes(metricType) && (
                        <div className="flex items-center">
                          <span className="border-l-2 border-blue-200 pl-2">Expert Rating:</span>
                          <span className="ml-2">{currentRating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Research Problem Quality Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        This evaluation assesses the quality of research problem formulation across multiple dimensions.
      </p>
      
      <BaseContentMetrics
        metrics={displayQualityData}
        referenceValue={typeof groundTruth === 'string' ? groundTruth : 
          typeof groundTruth === 'object' ? `${groundTruth.title || ''}\n${groundTruth.description || ''}` : ''}
        extractedValue={typeof problemData === 'string' ? problemData : 
          typeof problemData === 'object' ? `${problemData.title || ''}\n${problemData.description || ''}` : ''}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        rating={relevanceRating}
        fieldName="Research Problem"
        metricType="quality"
        textConfig={QUALITY_CONFIG.textConfig}
        analysisData={displayQualityData}
        renderAnalysisComponent={renderQualityTable}
        renderMetricDetails={renderMetricDetails}
        scoreDetails={scoreDetails}
        metricConfig={QUALITY_CONFIG.metricConfig}
      />
    </Card>
  );
};

export default ResearchProblemQualityMetrics;