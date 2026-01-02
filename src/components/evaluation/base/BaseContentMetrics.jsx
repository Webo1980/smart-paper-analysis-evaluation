// src\components\evaluation\base\BaseContentMetrics.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Badge } from '../../ui/badge';
import WeightCalculationDetails from './WeightCalculationDetails';

import { 
  formatPercentage, 
  ensureSameMetricValue,
  calculateWeightsAndAgreement,
  getAutomatedScore
} from './utils/baseMetricsUtils';

import { getStatusBadgeColor } from './utils/uiUtils';

const BaseContentMetrics = ({
  metrics,
  referenceValue,
  extractedValue,
  expertiseWeight,
  expertiseMultiplier,
  rating,
  fieldName,
  metricType,
  textConfig = {},
  metricDefinitions = {},
  analysisData,
  renderAnalysisComponent,
  renderMetricDetails,
  scoreDetails,
  metricConfig = {},
  AdvancedMetricsExplanationComponent = null,
  utils = null, // Optional utilities override
  scoreThresholds = {
    high: 0.9,
    medium: 0.7,
    low: 0
  }
}) => {
  const [showMetricInfo, setShowMetricInfo] = useState({});
  const [showAnalysisTable, setShowAnalysisTable] = useState(false);
  
  const typeConfig = metricConfig[metricType] || {};
  const metricTypeDisplayName = typeConfig.displayName || '';

  // Use custom getAutomatedScore if provided, or fall back to default
  const getScoreFunction = utils?.getAutomatedScore || getAutomatedScore;
  const toggleMetricInfo = (metricName) => {
    setShowMetricInfo(prev => ({...prev, [metricName]: !prev[metricName]}));
  };
  
  const toggleAnalysisTable = () => {
    setShowAnalysisTable(!showAnalysisTable);
  };
  
  const getMetricExplanation = (metricName) => {
    if (!metricDefinitions?.[metricName]) return textConfig.descriptions?.noExplanation;
    
    const referenceSpan = `<strong class="text-red-600">${
      typeof referenceValue === 'object' ? JSON.stringify(referenceValue) : 
      (referenceValue || "<empty>")
    }</strong>`;
    
    const extractedSpan = `<strong class="text-green-600">${
      typeof extractedValue === 'object' ? JSON.stringify(extractedValue) : 
      (extractedValue || "<empty>")
    }</strong>`;
    
    if (typeof metricDefinitions[metricName] === 'function') {
      return metricDefinitions[metricName](referenceSpan, extractedSpan, fieldName);
    }
    return metricDefinitions[metricName];
  };

  const getMainMetricName = () => {
    return typeConfig.mainMetric || '';
  };

  function formatMetricName(metricName) {
    // Split the text at capital letters, spaces or underscores
    const words = metricName.split(/(?=[A-Z])|[\s_]+/);
    
    // Capitalize first letter of each word
    const formattedWords = words.map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    
    // Join words with spaces
    return formattedWords.join(' ');
  }

  const renderMetricDisplay = (metricName, metricData) => {
    if (!metrics && !analysisData) return null;
    
    try {
      const automatedScore = getScoreFunction(metricName, metrics, analysisData, metricType);
      const balancedMetrics = ensureSameMetricValue(
        calculateWeightsAndAgreement(automatedScore, rating, expertiseMultiplier)
      );
      
      return (
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xs text-gray-600 capitalize">{formatMetricName(metricName)}</span>
              <button 
                onClick={() => toggleMetricInfo(metricName)} 
                type="button" 
                className="ml-1 text-gray-600 hover:text-gray-800"
              >
                {showMetricInfo[metricName] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            <div className="flex items-center">
              <Badge className={getStatusBadgeColor(balancedMetrics.finalScore, scoreThresholds)}>
                {formatPercentage(balancedMetrics.finalScore)}
                {balancedMetrics?.isCapped && <span className="ml-1 text-xs">(capped)</span>}
              </Badge>
              <button 
                onClick={() => toggleMetricInfo(`${metricName}AutomatedScore`)} 
                type="button" 
                className="ml-1 text-gray-600 hover:text-gray-800"
              >
                {showMetricInfo[`${metricName}AutomatedScore`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
          
          {showMetricInfo[metricName] && (
            <div className="mt-2 text-xs bg-white p-2 rounded border border-gray-200">
              <div dangerouslySetInnerHTML={{ __html: getMetricExplanation(metricName) }} />
              {renderMetricDetails && renderMetricDetails(metricName)}
            </div>
          )}
          
          {showMetricInfo[`${metricName}AutomatedScore`] && (
            <div className="mt-2 text-xs bg-white p-2 rounded border border-gray-200">
              <WeightCalculationDetails 
                metricData={balancedMetrics} 
                automatedScore={automatedScore} 
                expertiseMultiplier={expertiseMultiplier} 
              />
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error(`Error rendering metric display for ${metricName}:`, error);
      return (
        <div className="bg-red-50 p-3 rounded">
          <div className="text-red-600">Error rendering {metricName} metrics</div>
        </div>
      );
    }
  };
  
  const mainMetricName = getMainMetricName();
  let overallAutomatedScore = 0;
  let overallMetricsData = null;
  
  try {
    overallAutomatedScore = getScoreFunction(mainMetricName, metrics, analysisData, metricType);
    overallMetricsData = scoreDetails || ensureSameMetricValue(
      calculateWeightsAndAgreement(overallAutomatedScore, rating, expertiseMultiplier)
    );
  } catch (error) {
    console.error(`Error calculating overall metrics:`, error);
    overallAutomatedScore = 0.5;
    overallMetricsData = {
      finalScore: 0.5,
      agreement: 0.5,
      agreementBonus: 0.05
    };
  }

  return (
    <div className="space-y-2">
      <div className="bg-gray-100 p-3 rounded mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {textConfig.titles?.overallScore || 'Overall Score'}
            </span>
            <button 
              onClick={() => toggleMetricInfo(mainMetricName)}
              className="ml-1 text-gray-600 hover:text-gray-800"
              type="button"
            >
              {showMetricInfo[mainMetricName] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className="flex items-center">
            <Badge className={getStatusBadgeColor(overallMetricsData?.finalScore || 0, scoreThresholds)}>
              {formatPercentage(overallMetricsData?.finalScore || 0)}
              {overallMetricsData?.isCapped && <span className="ml-1 text-xs">(capped)</span>}
            </Badge>
          </div>
        </div>
        
        <p className="text-xs mt-1">
          {textConfig.descriptions?.[metricType] || 'Score for this metric.'}
        </p>
        
        {showMetricInfo[mainMetricName] && (
          <div className="mt-2 text-xs bg-white p-2 rounded border border-gray-200">
              <div dangerouslySetInnerHTML={{ __html: getMetricExplanation(mainMetricName) }} />
              {renderMetricDetails && renderMetricDetails(mainMetricName)}
              <WeightCalculationDetails 
                metricData={overallMetricsData} 
                automatedScore={overallAutomatedScore} 
                expertiseMultiplier={expertiseMultiplier} 
              />
          </div>
        )}
        
        <div className="bg-yellow-50 p-2 mt-2 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-800">
              {textConfig.titles?.automatedScore || 'Automated Score'}
            </span>
            <Badge className={getStatusBadgeColor(overallAutomatedScore, scoreThresholds)}>
              {formatPercentage(overallAutomatedScore)}
            </Badge>
          </div>
          {console.log(textConfig)}
          <div className="mt-2 p-1 rounded bg-blue-50">
            <p className="font-medium">{textConfig.analysisLabels?.[metricType]?.title || 'Analysis'}</p>
            <p className="mt-1 text-xs">
              {textConfig.analysisLabels?.[metricType]?.description || 'Metric analysis details.'}
            </p>
            <ul className="list-disc list-inside mt-1 text-xs">
              {textConfig.analysisLabels?.[metricType]?.metrics?.map((metric, index) => (
                <li key={index}>
                  <span className="font-medium">{metric.name}</span> {metric.description}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center">
              <button
                onClick={toggleAnalysisTable}
                className="bg-white border border-blue-300 text-blue-700 px-2 py-1 rounded text-xs flex items-center"
              >
                <Info size={12} className="mr-1" />
                {showAnalysisTable 
                  ? (textConfig.titles?.hideAnalysis || 'Hide detailed analysis')
                  : (textConfig.titles?.showAnalysis || 'Show detailed analysis')}
                {showAnalysisTable ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
              </button>
            </div>
          </div>
          
          {showAnalysisTable && renderAnalysisComponent && renderAnalysisComponent(analysisData, showAnalysisTable, toggleAnalysisTable)}
        </div>
      </div>
      
      {typeConfig.primaryMetrics?.map(metricName => (
        <div key={metricName}>
          {renderMetricDisplay(metricName, 
            calculateWeightsAndAgreement(
              getScoreFunction(metricName, metrics, analysisData, metricType), 
              rating, 
              expertiseMultiplier
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default BaseContentMetrics;