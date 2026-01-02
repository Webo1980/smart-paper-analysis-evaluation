// src\components\evaluation\metadata\components\MetadataAccuracyMetrics.jsx
import React, { useState } from 'react';
import ContentMetricsBase from './ContentMetricsBase';
import AccuracyMetricsDisplay from './AccuracyMetricsDisplay';
import { Info } from 'lucide-react';
import { 
  processAccuracyEvaluation
} from '../../base/utils/evaluationUtils';
import {
  baseAccuracyMetricDefinitions,
  generateAccuracyConceptExplanation
} from '../../base/utils/metricsDefinitions';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const MetadataAccuracyMetrics = ({ 
  metrics, 
  orkgValue, 
  extractedValue, 
  expertiseWeight, 
  expertiseMultiplier,
  rating,
  fieldName,
  accuracyScoreDetails
}) => {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  
  const accuracyEvaluation = processAccuracyEvaluation(
    fieldName,
    orkgValue,
    extractedValue,
    rating,
    expertiseMultiplier,
    'metadata',
    fieldName.toLowerCase().includes('year') ? 'year' : ''
  );
  
  const similarityData = accuracyEvaluation?.similarityData;
  const calculatedScoreDetails = accuracyEvaluation?.scoreDetails;
  const scoreDetailsToUse = accuracyScoreDetails || calculatedScoreDetails;
  
  const textConfig = {
    titles: {
      overallScore: 'Overall Accuracy (Human-System Balanced)',
      automatedScore: 'Automated Accuracy Score',
      analysisTitle: 'Detailed Accuracy Analysis',
      hideAnalysis: 'Hide detailed analysis',
      showAnalysis: 'View detailed analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      accuracy: 'Combines automated analysis with human expertise, giving more weight to expert judgment while maintaining objective measurements.',
      quality: 'Balanced scoring combines automated metrics with expert assessment, weighted by expertise level and confidence.'
    },
    analysisLabels: {
      accuracy: {
        title: 'Text Similarity Analysis:',
        description: 'The automated score is calculated by combining three metrics:',
        metrics: [
          {name: 'Levenshtein similarity (50%):', description: 'Character-level comparison'},
          {name: 'Token matching (30%):', description: 'Word-level comparison'},
          {name: 'Special character preservation (20%):', description: 'Punctuation and symbols'}
        ]
      }
    }
  };

  const metricConfig = {
    accuracy: {
      primaryMetrics: ['precision', 'recall'],
      mainMetric: 'f1Score',
      displayName: 'Accuracy'
    }
  };

  const renderSimilarityTable = (data) => {
    if (!data) return null;
    
    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Metric</th>
              <th className="p-2 text-left border-b">Levenshtein (50%)</th>
              <th className="p-2 text-left border-b">Token Matching (30%)</th>
              <th className="p-2 text-left border-b">Special Chars (20%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
              <td className="p-2 border-r">
                Compares characters between texts to calculate how different they are. Lower distance means more similar content.
              </td>
              <td className="p-2 border-r">
                Compares individual words between texts. Works by breaking into words, counting matches, and dividing by total words.
              </td>
              <td className="p-2">
                Measures how well punctuation, mathematical symbols, and other non-alphanumeric characters are maintained.
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Raw Data</td>
              <td className="p-2 border-r align-top">
                <div className="grid grid-cols-2 gap-1">
                  <div>ORKG:</div>
                  <div className="text-right">{orkgValue?.length || 0} chars</div>
                  <div>Extracted:</div>
                  <div className="text-right">{extractedValue?.length || 0} chars</div>
                  <div>Distance:</div>
                  <div className="text-right">{data.levenshtein?.distance || 0}</div>
                </div>
              </td>
              <td className="p-2 border-r align-top">
                <div className="grid grid-cols-2 gap-1">
                  <div>ORKG:</div>
                  <div className="text-right">{data.tokenMatching?.originalTokens?.length || 0} words</div>
                  <div>Extracted:</div>
                  <div className="text-right">{data.tokenMatching?.extractedTokens?.length || 0} words</div>
                  <div>Matching:</div>
                  <div className="text-right">{data.tokenMatching?.tokenMatchCount || 0} words</div>
                </div>
              </td>
              <td className="p-2 align-top">
                <div className="grid grid-cols-2 gap-1">
                  <div>ORKG:</div>
                  <div className="text-right">{data.specialChar?.originalSpecial?.length || 0} chars</div>
                  <div>Extracted:</div>
                  <div className="text-right">{data.specialChar?.extractedSpecial?.length || 0} chars</div>
                  <div>Matching:</div>
                  <div className="text-right">{data.specialChar?.specialMatchCount || 0}</div>
                </div>
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border-r font-medium">Component Score</td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(data.levenshtein?.score || 0)}
              </td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(data.tokenMatching?.score || 0)}
              </td>
              <td className="p-2 font-medium">
                {formatPercentage(data.specialChar?.score || 0)}
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage(data.levenshtein?.weightedScore || 0)}
              </td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage(data.tokenMatching?.weightedScore || 0)}
              </td>
              <td className="p-2 text-blue-700 font-medium">
                {formatPercentage(data.specialChar?.weightedScore || 0)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              AutomatedScore = (0.5 × {formatPercentage(data.levenshtein?.score || 0)}) + 
              (0.3 × {formatPercentage(data.tokenMatching?.score || 0)}) + 
              (0.2 × {formatPercentage(data.specialChar?.score || 0)})<br/>
              = {formatPercentage(data.levenshtein?.weightedScore || 0)} + 
              {formatPercentage(data.tokenMatching?.weightedScore || 0)} + 
              {formatPercentage(data.specialChar?.weightedScore || 0)}<br/>
              = {formatPercentage(data.automatedOverallScore || data.overallScore || 0)}
            </code>
          </div>
          <div className="mt-3">
            <AccuracyMetricsDisplay similarityData={data} />
          </div>
        </div>
      </div>
    );
  };
  
  const renderMetricDetails = (metricType) => {
    if (!similarityData?.tokenMatching) return null;
    
    const explanation = generateAccuracyConceptExplanation(
      metricType, 
      similarityData.tokenMatching, 
      similarityData
    );
    
    if (!explanation) return null;
    
    const displayScore = scoreDetailsToUse?.finalScore || similarityData.overallScore || 0;
    
    return (
      <div className="p-2 bg-gray-50 rounded mb-2">
        <h6 className="text-xs font-medium mb-1">{explanation.title}</h6>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 p-2 bg-white rounded border">
            <p className="text-xs font-medium mb-1">Explanation:</p>
            <div className="border-t pt-1">
              <p className="text-xs">{explanation.description}</p>
              <div className="mt-1 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                <span className="font-medium">Formula: </span>
                <span className="whitespace-nowrap">{explanation.formula}</span>
              </div>
              
              {explanation.calculation && (
                <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                  <span className="font-medium">{metricType.charAt(0).toUpperCase() + metricType.slice(1)} Calculation: </span>
                  <pre className="text-xs whitespace-pre-wrap">{explanation.calculation}</pre>
                </div>
              )}
              
              <div className="mt-2 bg-green-50 p-1 rounded text-xs relative group">
                <div className="flex items-center">
                  <span className="font-medium">Score: </span>
                  <span className="ml-2 whitespace-nowrap">
                    {formatPercentage(displayScore)}
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
            <p className="text-xs font-medium mb-1">Current Document:</p>
            <div className="border-t pt-1">
              <p className="text-xs">{explanation.example}</p>
              
              <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                <span className="font-medium">Token Matching Details:</span>
                <div className="text-xs space-y-1">
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Original Tokens:</span>
                    <span className="ml-2">{similarityData.tokenMatching.originalTokens?.length || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Extracted Tokens:</span>
                    <span className="ml-2">{similarityData.tokenMatching.extractedTokens?.length || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Matching Tokens:</span>
                    <span className="ml-2">{similarityData.tokenMatching.tokenMatchCount || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Precision:</span>
                    <span className="ml-2">{formatPercentage(similarityData.precisionScore || 0)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="border-l-2 border-blue-200 pl-2">Recall:</span>
                    <span className="ml-2">{formatPercentage(similarityData.recallScore || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  console.log(metrics);
  return (
    <ContentMetricsBase
      metrics={metrics}
      referenceValue={orkgValue}
      extractedValue={extractedValue}
      expertiseWeight={expertiseWeight}
      expertiseMultiplier={expertiseMultiplier}
      rating={rating}
      fieldName={fieldName}
      metricType="accuracy"
      textConfig={textConfig}
      metricDefinitions={baseAccuracyMetricDefinitions}
      analysisData={similarityData}
      renderAnalysisComponent={renderSimilarityTable}
      renderMetricDetails={renderMetricDetails}
      scoreDetails={scoreDetailsToUse}
      metricConfig={metricConfig}
    />
  );
};

export default MetadataAccuracyMetrics;