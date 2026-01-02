// src\components\evaluation\metadata\components\MetadataQualityMetrics.jsx
import React from 'react';
import ContentMetricsBase from './ContentMetricsBase';
import QualityMetricsDisplay from './QualityMetricsDisplay';
import FieldSpecificAnalysis from './FieldSpecificAnalysis';
import { Info } from 'lucide-react';
import { 
  processQualityEvaluation 
} from '../../base/utils/evaluationUtils';
import {
  baseQualityMetricDefinitions,
  generateQualityConceptExplanation
} from '../../base/utils/metricsDefinitions';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const MetadataQualityMetrics = ({ 
  metrics, 
  orkgValue, 
  extractedValue, 
  expertiseWeight, 
  expertiseMultiplier,
  rating,
  fieldName,
  qualityScoreDetails
}) => {
  const customQualityMetrics = {
    fieldType: fieldName.toLowerCase().includes('year') ? 'year' : 
               fieldName.toLowerCase().includes('doi') ? 'doi' : 
               fieldName.toLowerCase().includes('author') ? 'authors' : ''
  };
  
  const qualityEvaluation = processQualityEvaluation(
    fieldName,
    orkgValue,
    extractedValue,
    rating,
    expertiseMultiplier,
    customQualityMetrics,
    'metadata'
  );
  
  const qualityData = qualityEvaluation?.qualityData;
  const calculatedMetricDetails = qualityEvaluation?.metricDetails;
  const metricsToUse = qualityScoreDetails || calculatedMetricDetails;
  
  const textConfig = {
    titles: {
      overallScore: 'Overall Quality (Human-System Balanced)',
      automatedScore: 'Automated Quality Score',
      analysisTitle: 'Detailed Quality Analysis',
      hideAnalysis: 'Hide detailed analysis',
      showAnalysis: 'View detailed analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      quality: 'Balanced scoring combines automated metrics with expert assessment, weighted by expertise level and confidence.'
    },
    analysisLabels: {
      quality: {
        title: 'Component Quality Analysis:',
        description: 'The overall quality is calculated by combining three key dimensions:',
        metrics: [
          {name: 'Completeness (40%):', description: 'All required information is present'},
          {name: 'Consistency (30%):', description: 'Information follows a consistent format'},
          {name: 'Validity (30%):', description: 'Information conforms to expected standards'}
        ]
      }
    }
  };

  const metricConfig = {
    quality: {
      primaryMetrics: ['completeness', 'consistency', 'validity'],
      mainMetric: 'overallQuality',
      displayName: 'Quality'
    }
  };

  const renderQualityTable = (data) => {
    if (!data) return null;
    
    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Quality Dimension</th>
              <th className="p-2 text-left border-b">Completeness (40%)</th>
              <th className="p-2 text-left border-b">Consistency (30%)</th>
              <th className="p-2 text-left border-b">Validity (30%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
              <td className="p-2 border-r">
                Measures whether all required information is present in the extracted content compared to the reference.
              </td>
              <td className="p-2 border-r">
                Evaluates whether the extracted content follows a uniform structure and formatting throughout.
              </td>
              <td className="p-2">
                Checks if the extracted content conforms to expected formats and standards for this field type.
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Field Evaluation</td>
              <td className="p-2 border-r">
                <div className="grid grid-cols-1 gap-1">
                  <div className="bg-gray-50 p-1 rounded">
                    <p className="font-medium text-xs mb-1">For {fieldName}:</p>
                    <p className="text-xs">{data.explanation.completeness}</p>
                  </div>
                </div>
              </td>
              <td className="p-2 border-r">
                <div className="grid grid-cols-1 gap-1">
                  <div className="bg-gray-50 p-1 rounded">
                    <p className="font-medium text-xs mb-1">For {fieldName}:</p>
                    <p className="text-xs">{data.explanation.consistency}</p>
                  </div>
                </div>
              </td>
              <td className="p-2">
                <div className="grid grid-cols-1 gap-1">
                  <div className="bg-gray-50 p-1 rounded">
                    <p className="font-medium text-xs mb-1">For {fieldName}:</p>
                    <p className="text-xs">{data.explanation.validity}</p>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50 align-top">Field Analysis</td>
              <td className="p-2 border-r align-top" colSpan="3">
                <FieldSpecificAnalysis 
                  fieldName={fieldName}
                  orkgValue={orkgValue}
                  extractedValue={extractedValue}
                />
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border-r font-medium">Component Score</td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(data.fieldSpecificMetrics.completeness.score)}
              </td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(data.fieldSpecificMetrics.consistency.score)}
              </td>
              <td className="p-2 font-medium">
                {formatPercentage(data.fieldSpecificMetrics.validity.score)}
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage(data.fieldSpecificMetrics.completeness.score * data.weights.completeness)}
              </td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage(data.fieldSpecificMetrics.consistency.score * data.weights.consistency)}
              </td>
              <td className="p-2 text-blue-700 font-medium">
                {formatPercentage(data.fieldSpecificMetrics.validity.score * data.weights.validity)}
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Potential Issues</td>
              <td className="p-2 border-r">
                {data.fieldSpecificMetrics.completeness.issues.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {data.fieldSpecificMetrics.completeness.issues.map((issue, idx) => (
                      <li key={`comp-${idx}`}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-green-600">No completeness issues detected</span>
                )}
              </td>
              <td className="p-2 border-r">
                {data.fieldSpecificMetrics.consistency.issues.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {data.fieldSpecificMetrics.consistency.issues.map((issue, idx) => (
                      <li key={`cons-${idx}`}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-green-600">No consistency issues detected</span>
                )}
              </td>
              <td className="p-2">
                {data.fieldSpecificMetrics.validity.issues.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {data.fieldSpecificMetrics.validity.issues.map((issue, idx) => (
                      <li key={`val-${idx}`}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-green-600">No validity issues detected</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              OverallQuality = (Completeness × 0.4) + (Consistency × 0.3) + (Validity × 0.3)<br/>
              = ({formatPercentage(data.fieldSpecificMetrics.completeness.score)} × 0.4) + 
              ({formatPercentage(data.fieldSpecificMetrics.consistency.score)} × 0.3) + 
              ({formatPercentage(data.fieldSpecificMetrics.validity.score)} × 0.3)<br/>
              = {formatPercentage(data.fieldSpecificMetrics.completeness.score * data.weights.completeness)} + 
              {formatPercentage(data.fieldSpecificMetrics.consistency.score * data.weights.consistency)} + 
              {formatPercentage(data.fieldSpecificMetrics.validity.score * data.weights.validity)}<br/>
              = {formatPercentage(data.automatedOverallScore || data.overallScore || 0)}
            </code>
          </div>
          <div className="mt-3">
            <QualityMetricsDisplay qualityData={data} />
          </div>
        </div>
      </div>
    );
  };
  
  const renderMetricDetails = (metricType) => {
    const explanation = generateQualityConceptExplanation(metricType, qualityData);
    if (!explanation) return null;
    
    let displayScore;
    
    if (metricType === 'completeness' && qualityData?.fieldSpecificMetrics?.completeness) {
      displayScore = qualityData.fieldSpecificMetrics.completeness.score;
    } else if (metricType === 'consistency' && qualityData?.fieldSpecificMetrics?.consistency) {
      displayScore = qualityData.fieldSpecificMetrics.consistency.score;
    } else if (metricType === 'validity' && qualityData?.fieldSpecificMetrics?.validity) {
      displayScore = qualityData.fieldSpecificMetrics.validity.score;
    } else if (metricType === 'overallQuality') {
      displayScore = metricsToUse ? metricsToUse.finalScore : (qualityData?.overallScore || 0);
    } else {
      displayScore = explanation.score || 0;
    }
    
    return (
      <div className="p-2 bg-gray-50 rounded mb-2">
        <h6 className="text-xs font-medium mb-1">{explanation.title}</h6>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 p-2 bg-white rounded border">
            <p className="text-xs font-medium mb-1">Explanation:</p>
            <div className="border-t pt-1">
              <p className="text-xs">{explanation.description}</p>
              {explanation.issues && explanation.issues.length > 0 && (
                <div className="mt-1 bg-red-50 p-1 rounded text-xs">
                  <span className="font-medium">Potential Issues: </span>
                  <ul className="list-disc list-inside">
                    {explanation.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-2 bg-white rounded border">
            <p className="text-xs font-medium mb-1">Score Calculation:</p>
            <div className="border-t pt-1">
              <div className="bg-blue-50 p-1 rounded text-xs mt-1">
                <span className="font-medium">Formula: </span>
                <span className="whitespace-nowrap">{explanation.calculation}</span>
              </div>
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
      </div>
    );
  };
  
  return (
    <ContentMetricsBase
      metrics={metrics}
      referenceValue={orkgValue}
      extractedValue={extractedValue}
      expertiseWeight={expertiseWeight}
      expertiseMultiplier={expertiseMultiplier}
      rating={rating}
      fieldName={fieldName}
      metricType="quality"
      textConfig={textConfig}
      metricDefinitions={baseQualityMetricDefinitions}
      analysisData={qualityData}
      renderAnalysisComponent={renderQualityTable}
      renderMetricDetails={renderMetricDetails}
      scoreDetails={metricsToUse}
      metricConfig={metricConfig}
    />
  );
};

export default MetadataQualityMetrics;