// src/components/evaluation/research-problem/components/ResearchProblemAccuracyMetrics.jsx
import React from 'react';
import { Card } from '../../../ui/card';
import { Info } from 'lucide-react';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { 
  ACCURACY_CONFIG, 
  ACCURACY_EXPLANATIONS,
  ACCURACY_WEIGHTS,
  ANALYSIS_COMPONENTS
} from '../config/researchProblemConfig';
import ResearchProblemMetricsDisplay from './ResearchProblemMetricsDisplay';
import EditDistanceAnalysis from './EditDistanceAnalysis';
import TokenMatchingAnalysis from './TokenMatchingAnalysis';
import SpecialCharacterAnalysis from './SpecialCharacterAnalysis';
import EditOperationAnalysis from './EditOperationAnalysis';
import { processResearchProblemAccuracy } from '../utils/researchProblemMetrics';

const ResearchProblemAccuracyMetrics = ({
  metrics,
  groundTruth,
  problemData,
  expertiseWeight,
  expertiseMultiplier,
  rating,
  completenessRating,
  comparisonData
}) => {
  // Process accuracy metrics
  const effectiveRating = completenessRating || rating || 3;
  
  const result = processResearchProblemAccuracy(
    'research_problem',
    groundTruth,
    problemData,
    effectiveRating,
    expertiseMultiplier
  );
  
  const similarityData = result.similarityData;
  const scoreDetails = result.scoreDetails;

  // Custom render function for metric details
  const renderMetricDetails = (metricType) => {
    if (!similarityData) return null;
    
    // For advanced analysis types, return the specialized component
    switch(metricType) {
      case 'editDistance':
        return (
          <EditDistanceAnalysis 
            comparisonData={comparisonData} 
            scoreDetails={scoreDetails}
            similarityData={similarityData}
          />
        );
      case 'tokenMatching':
        return (
          <TokenMatchingAnalysis 
            comparisonData={comparisonData} 
            scoreDetails={scoreDetails}
            similarityData={similarityData}
          />
        );
      case 'specialCharacters':
        return (
          <SpecialCharacterAnalysis 
            comparisonData={comparisonData} 
            scoreDetails={scoreDetails}
            similarityData={similarityData}
          />
        );
      case 'editOperations':
        return (
          <EditOperationAnalysis 
            comparisonData={comparisonData} 
            scoreDetails={scoreDetails}
            similarityData={similarityData}
          />
        );
      // For basic metrics, use the standard detailed display
      case 'precision':
      case 'recall':
      case 'f1Score':
      default:
        const explanation = ACCURACY_EXPLANATIONS[metricType] || {};
        
        return (
          <div className="p-2 bg-gray-50 rounded mb-2">
            <h6 className="text-xs font-medium mb-1">{ANALYSIS_COMPONENTS[metricType]?.title || metricType}</h6>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 p-2 bg-white rounded border">
                <p className="text-xs font-medium mb-1">Explanation:</p>
                <div className="border-t pt-1">
                  <p className="text-xs">{explanation.long || explanation.short || 'No explanation available'}</p>
                  
                  {explanation.formula && (
                    <div className="mt-1 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                      <span className="font-medium">Formula: </span>
                      <span className="whitespace-nowrap">{explanation.formula}</span>
                    </div>
                  )}
                  
                  {explanation.calculation && (
                    <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                      <span className="font-medium">{ANALYSIS_COMPONENTS[metricType]?.title || metricType} Calculation: </span>
                      <pre className="text-xs whitespace-pre-wrap">{explanation.calculation(problemData, groundTruth, similarityData)}</pre>
                    </div>
                  )}
                  
                  <div className="mt-2 bg-green-50 p-1 rounded text-xs relative group">
                    <div className="flex items-center">
                      <span className="font-medium">Score: </span>
                      <span className="ml-2 whitespace-nowrap">
                        {formatPercentage(similarityData[metricType] || 0)}
                      </span>
                      <div className="relative ml-2">
                        <Info 
                          size={14} 
                          className="text-blue-500 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="
                          absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 
                          bg-gray-800 text-white text-xs rounded py-1 px-2 
                          opacity-0 group-hover:opacity-100 
                          transition-opacity duration-300 
                          pointer-events-none
                          whitespace-nowrap
                        ">
                          Check the Weight Calculation Details section
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        
              <div className="flex-1 p-2 bg-white rounded border">
                <p className="text-xs font-medium mb-1">Current Analysis:</p>
                <div className="border-t pt-1">
                  <p className="text-xs">{explanation.example ? explanation.example(problemData, groundTruth, similarityData) : 'No example available'}</p>
                  
                  <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                    <span className="font-medium">Analysis Details:</span>
                    {similarityData[`${metricType}Details`] && Object.entries(similarityData[`${metricType}Details`]).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="border-l-2 border-blue-200 pl-2">{ANALYSIS_COMPONENTS[key]?.title || key}:</span>
                        <span className="ml-2">{typeof value === 'number' ? formatPercentage(value) : value}</span>
                      </div>
                    ))}
                    {!similarityData[`${metricType}Details`] && (
                      <div className="text-xs">
                        <span className="border-l-2 border-blue-200 pl-2">Score:</span>
                        <span className="ml-2">{formatPercentage(similarityData[metricType] || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Custom render function for accuracy analysis
  const renderAccuracyTable = (data, showAnalysis, toggleAnalysis) => {
    if (!data || !showAnalysis) return null;
    
    // Get all metrics from ANALYSIS_COMPONENTS
    const allMetrics = Object.entries(ANALYSIS_COMPONENTS).map(([key, component]) => ({
      key,
      title: component.title,
      description: component.description,
      weight: component.weight,
      type: component.type || 'basic'
    }));
    
    // Split into basic and advanced metrics
    const basicMetrics = allMetrics.filter(m => m.type === 'basic');
    const advancedMetrics = allMetrics.filter(m => m.type === 'advanced');

    // Calculate the overall weighted score
    const overallScore = [...basicMetrics, ...advancedMetrics].reduce((total, metric) => {
      return total + (data[metric.key] || 0) * metric.weight;
    }, 0);

    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        {/* Overall Weighted Score Explanation */}
        <div className="p-3 bg-blue-50 border-b">
          <h4 className="font-medium mb-2">Overall Weighted Score Calculation</h4>
          <p className="text-xs mb-2">
            The overall accuracy score combines all metrics weighted by their importance:
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-2 rounded border">
              <h5 className="font-medium mb-1">Basic Metrics (70%)</h5>
              <ul className="space-y-1">
                {basicMetrics.map(metric => (
                  <li key={metric.key} className="flex justify-between">
                    <span>{metric.title} ({(metric.weight * 100).toFixed(0)}%):</span>
                    <span className="font-medium">{formatPercentage((data[metric.key] || 0) * metric.weight)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-2 rounded border">
              <h5 className="font-medium mb-1">Advanced Metrics (30%)</h5>
              <ul className="space-y-1">
                {advancedMetrics.map(metric => (
                  <li key={metric.key} className="flex justify-between">
                    <span>{metric.title} ({(metric.weight * 100).toFixed(0)}%):</span>
                    <span className="font-medium">{formatPercentage((data[metric.key] || 0) * metric.weight)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-2 bg-green-50 p-2 rounded border border-green-100 text-center">
            <p className="font-medium">Final Automated Score: {formatPercentage(overallScore)}</p>
            <p className="text-xs text-gray-600 mt-1">
              Note: The system has highest confidence in scores near 50% and lowest confidence
              in extreme scores (0% or 100%) using a U-shaped confidence curve.
            </p>
          </div>
        </div>

        {/* Basic Metrics Table */}
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Basic Metrics</th>
              {basicMetrics.map(metric => (
                <th key={metric.key} className="p-2 text-left border-b">
                  {metric.title} ({(metric.weight * 100).toFixed(0)}%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
              {basicMetrics.map(metric => (
                <td key={`${metric.key}-explanation`} className="p-2 border-r">
                  {metric.description}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Raw Data</td>
              {basicMetrics.map(metric => (
                <td key={`${metric.key}-raw`} className="p-2 border-r">
                  <div className="grid grid-cols-2 gap-1">
                    <div>Score:</div>
                    <div className="text-right">
                      {formatPercentage(data[metric.key] || 0)}
                    </div>
                    {data[`${metric.key}Details`] && Object.entries(data[`${metric.key}Details`]).map(([detailKey, detailValue]) => (
                      <React.Fragment key={detailKey}>
                        <div>{ANALYSIS_COMPONENTS[detailKey]?.title || detailKey}:</div>
                        <div className="text-right">
                          {typeof detailValue === 'number' 
                            ? formatPercentage(detailValue)
                            : detailValue}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border-r font-medium">Component Score</td>
              {basicMetrics.map(metric => (
                <td key={`${metric.key}-score`} className="p-2 border-r font-medium">
                  {formatPercentage(data[metric.key] || 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
              {basicMetrics.map(metric => (
                <td key={`${metric.key}-weighted`} className="p-2 border-r text-blue-700 font-medium">
                  {formatPercentage((data[metric.key] || 0) * metric.weight)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Advanced Analyses Section */}
        <div className="p-3 bg-gray-50 border-t">
          <h4 className="font-medium">Advanced Analyses</h4>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Metric</th>
              {advancedMetrics.map(metric => (
                <th key={metric.key} className="p-2 text-left border-b">
                  {metric.title} ({(metric.weight * 100).toFixed(0)}%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
              {advancedMetrics.map(metric => (
                <td key={`${metric.key}-explanation`} className="p-2 border-r">
                  {metric.description}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Raw Data</td>
              {advancedMetrics.map(metric => (
                <td key={`${metric.key}-raw`} className="p-2 border-r">
                  <div className="grid grid-cols-2 gap-1">
                    <div>Score:</div>
                    <div className="text-right">
                      {formatPercentage(data[metric.key] || 0)}
                    </div>
                    {data[`${metric.key}Details`] && Object.entries(data[`${metric.key}Details`]).map(([detailKey, detailValue]) => (
                      <React.Fragment key={detailKey}>
                        <div>{ANALYSIS_COMPONENTS[detailKey]?.title || detailKey}:</div>
                        <div className="text-right">
                          {typeof detailValue === 'number' 
                            ? formatPercentage(detailValue)
                            : detailValue}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border-r font-medium">Component Score</td>
              {advancedMetrics.map(metric => (
                <td key={`${metric.key}-score`} className="p-2 border-r font-medium">
                  {formatPercentage(data[metric.key] || 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
              {advancedMetrics.map(metric => (
                <td key={`${metric.key}-weighted`} className="p-2 border-r text-blue-700 font-medium">
                  {formatPercentage((data[metric.key] || 0) * metric.weight)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              {ACCURACY_EXPLANATIONS.overallAccuracy?.formula || 'Weighted sum of all component metrics'}<br/>
              {[...basicMetrics, ...advancedMetrics].map(metric => (
                `+ (${formatPercentage(data[metric.key] || 0)} × ${metric.weight}) `
              )).join('\n')}<br/>
              {[...basicMetrics, ...advancedMetrics].map(metric => (
                `+ ${formatPercentage((data[metric.key] || 0) * metric.weight)} `
              )).join('\n')}<br/>
              = {formatPercentage(overallScore)}
            </code>
          </div>
          <div className="mt-3">
            <ResearchProblemMetricsDisplay similarityData={data} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Research Problem Accuracy Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        This evaluation measures how accurately the problem formulation aligns with and covers the source material.
        The score combines multiple metrics to provide a comprehensive assessment of the research problem accuracy.
      </p>
      
      <BaseContentMetrics
        metrics={similarityData}
        referenceValue={typeof groundTruth === 'string' ? groundTruth : JSON.stringify(groundTruth)}
        extractedValue={typeof problemData === 'string' ? problemData : JSON.stringify(problemData)}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        rating={effectiveRating}
        fieldName="Research Problem"
        metricType="accuracy"
        textConfig={ACCURACY_CONFIG.textConfig}
        analysisData={similarityData}
        renderAnalysisComponent={renderAccuracyTable}
        renderMetricDetails={renderMetricDetails}
        scoreDetails={scoreDetails}
        metricConfig={ACCURACY_CONFIG.metricConfig}
      />
    </Card>
  );
};

export default ResearchProblemAccuracyMetrics;