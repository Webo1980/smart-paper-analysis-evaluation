import React from 'react';
import { Card } from '../../../ui/card';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { processTemplateAccuracy, formatPercent, formatUserRating } from '../utils/templateMetrics';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { Info } from 'lucide-react';
import TemplateMetricsDisplay from './TemplateMetricsDisplay';
import { TEXT_CONFIG, METRIC_CONFIG, ACCURACY_WEIGHTS } from '../config/templateConfig';

const TemplateAccuracyMetrics = ({
  metrics,
  templateData,
  referenceData,
  rating,
  expertiseMultiplier,
  primaryFieldRating // Consistent with research field naming
}) => {
  // Use primaryFieldRating if provided, otherwise fallback to rating
  const effectiveRating = primaryFieldRating || rating || 3;
  
  // Process template data
  const template = templateData || {};
  const reference = referenceData || {};
  
  // Format ratings for display
  const ratingDisplay = formatUserRating(
    effectiveRating,
    expertiseMultiplier
  );
  
  // Process accuracy metrics
  const result = processTemplateAccuracy(
    'template',
    template,
    reference,
    effectiveRating,
    expertiseMultiplier
  );
  
  const similarityData = result.similarityData;
  const scoreDetails = result.scoreDetails;

  // Separate precision and recall in same order as metadata
  const metricDefinitions = {
    precision: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Precision</strong></p>
        <p>Measures what percentage of the template properties correctly match the reference.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Precision = Matched properties / Total template properties</p>
        </div>
      </div>
    `,
    recall: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Recall</strong></p>
        <p>Measures what percentage of reference properties were found in the template.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Recall = Matched properties / Total reference properties</p>
        </div>
      </div>
    `,
    f1Score: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>F1 Score</strong></p>
        <p>Balanced measure combining precision and recall.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>F1 Score = 2 × (Precision × Recall) / (Precision + Recall)</p>
        </div>
      </div>
    `,
    titleMatch: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Title Match</strong></p>
        <p>Measures how similar the template title is to the expected title.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Calculated using Jaccard similarity between title words</p>
        </div>
      </div>
    `
  };

  const renderMetricDetails = (metricType) => {
    if (!similarityData) return null;
    
    // Template and reference titles
    const templateTitle = template.title || template.name || "No title";
    const referenceTitle = reference.title || reference.name || "No title";
    
    let explanation = {
      title: '',
      description: '',
      formula: '',
      calculation: '',
      example: ''
    };
    
    switch(metricType) {
      case 'precision':
        explanation = {
          title: 'Precision',
          description: 'Measures what percentage of the template properties correctly match the reference.',
          formula: 'Precision = Matched properties / Total template properties',
          calculation: `Matched: ${(similarityData.exactMatches || 0) + (similarityData.semanticMatches || 0)}\nTotal Template: ${similarityData.totalTemplateProps || 0}\nPrecision = ${(similarityData.exactMatches || 0) + (similarityData.semanticMatches || 0)} / ${similarityData.totalTemplateProps || 0}`,
          example: `This template has a precision of ${formatPercentage(similarityData.precision || 0)}, meaning that percentage of its properties match the reference.`
        };
        break;
      case 'recall':
        explanation = {
          title: 'Recall',
          description: 'Measures what percentage of reference properties were found in the template.',
          formula: 'Recall = Matched properties / Total reference properties',
          calculation: `Matched: ${(similarityData.exactMatches || 0) + (similarityData.semanticMatches || 0)}\nTotal Reference: ${similarityData.totalReferenceProps || 0}\nRecall = ${(similarityData.exactMatches || 0) + (similarityData.semanticMatches || 0)} / ${similarityData.totalReferenceProps || 0}`,
          example: `This template has a recall of ${formatPercentage(similarityData.recall || 0)}, meaning it contains that percentage of the reference properties.`
        };
        break;
      case 'f1Score':
        explanation = {
          title: 'F1 Score',
          description: 'Balanced measure combining precision and recall.',
          formula: 'F1 Score = 2 × (Precision × Recall) / (Precision + Recall)',
          calculation: `Precision: ${formatPercentage(similarityData.precision || 0)}\nRecall: ${formatPercentage(similarityData.recall || 0)}\nF1 = 2 × (${similarityData.precision || 0} × ${similarityData.recall || 0}) / (${similarityData.precision || 0} + ${similarityData.recall || 0})`,
          example: `This template's properties have a precision of ${formatPercentage(similarityData.precision || 0)} and recall of ${formatPercentage(similarityData.recall || 0)}, resulting in an F1 score of ${formatPercentage(similarityData.f1Score || 0)}.`
        };
        break;
      case 'titleMatch':
        explanation = {
          title: 'Title Match',
          description: 'Measures how similar the template title is to the expected title.',
          formula: 'Calculated using Jaccard similarity between title words',
          calculation: `Template: "${templateTitle}"\nReference: "${referenceTitle}"\nResult: ${formatPercentage(similarityData.titleMatch || 0)}`,
          example: `For this template, the title "${templateTitle}" has a ${formatPercentage(similarityData.titleMatch || 0)} similarity with the reference title "${referenceTitle}".`
        };
        break;
      default:
        return null;
    }
    
    const displayScore = scoreDetails?.finalScore || similarityData.overallScore || 0;
    
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
                    {formatPercentage(
                      metricType === 'precision' ? similarityData.precision || 0 : 
                      metricType === 'recall' ? similarityData.recall || 0 : 
                      metricType === 'f1Score' ? similarityData.f1Score || 0 :
                      metricType === 'titleMatch' ? similarityData.titleMatch || 0 :
                      displayScore
                    )}
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
            <p className="text-xs font-medium mb-1">Current Template:</p>
            <div className="border-t pt-1">
              <p className="text-xs">{explanation.example}</p>
              
              <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                <span className="font-medium">Template Details:</span>
                {metricType === 'titleMatch' && (
                  <div className="text-xs space-y-1">
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Template Title:</span>
                      <span className="ml-2 text-green-600 font-medium">{templateTitle}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Reference Title:</span>
                      <span className="ml-2 text-red-600 font-medium">{referenceTitle}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Similarity:</span>
                      <span className="ml-2">{formatPercentage(similarityData.titleMatch || 0)}</span>
                    </div>
                  </div>
                )}
                
                {(metricType === 'precision' || metricType === 'recall' || metricType === 'f1Score') && (
                  <div className="text-xs space-y-1">
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Template Properties:</span>
                      <span className="ml-2">{similarityData.totalTemplateProps || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Reference Properties:</span>
                      <span className="ml-2">{similarityData.totalReferenceProps || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Exact Matches:</span>
                      <span className="ml-2">{similarityData.exactMatches || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Semantic Matches:</span>
                      <span className="ml-2">{similarityData.semanticMatches || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Precision:</span>
                      <span className="ml-2">{formatPercentage(similarityData.precision || 0)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="border-l-2 border-blue-200 pl-2">Recall:</span>
                      <span className="ml-2">{formatPercentage(similarityData.recall || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render similarity table for detailed analysis
  const renderSimilarityTable = (data, showAnalysis, toggleAnalysis) => {
    if (!data || !showAnalysis) return null;
    
    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        {/* Existing table code remains the same */}
        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              {/* Existing calculation code */}
            </code>
          </div>
          
          {/* Visualizations */}
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <h6 className="text-xs font-medium mb-2">Property Distribution</h6>
              <PropertyDistributionVisualization 
                llmTemplate={templateData} 
              />
            </div>
            <div>
              <h6 className="text-xs font-medium mb-2">Property Coverage</h6>
              <PropertyCoverageVisualization 
                llmTemplate={templateData}
                researchProblem={researchProblem}
                researchField={researchProblem.field}
              />
            </div>
          </div>
          
          <div className="mt-3">
            <TemplateMetricsDisplay similarityData={data} />
          </div>
        </div>
      </div>
    );
  };

  // Prepare metric config
  const metricConfig = {
    accuracy: {
      primaryMetrics: ['precision', 'recall', 'titleMatch'],
      mainMetric: 'f1Score',
      displayName: 'Template Structure Accuracy'
    }
  };

  // Prepare text config
  const textConfig = {
    titles: {
      overallScore: 'Overall Template Accuracy Score (Human-System Balanced)',
      automatedScore: 'Automated Template Accuracy Score',
      analysisTitle: 'Detailed Template Accuracy Analysis',
      hideAnalysis: 'Hide detailed analysis',
      showAnalysis: 'View detailed analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      accuracy: 'Combines automated analysis with human expertise, giving more weight to expert judgment while maintaining objective measurements.'
    },
    analysisLabels: {
      accuracy: {
        title: 'Template Accuracy Analysis:',
        description: 'The automated score is calculated by combining three metrics:',
        metrics: [
          {name: `Title Match (${ACCURACY_WEIGHTS.titleMatch * 100}%):`, description: 'How similar is the template title to the reference?'},
          {name: `F1 Score (${ACCURACY_WEIGHTS.f1Score * 100}%):`, description: 'Balanced measure of property precision and recall'},
          {name: `Type Accuracy (${ACCURACY_WEIGHTS.typeMatch * 100}%):`, description: 'Percentage of properties with correct data types'}
        ]
      }
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Template Accuracy Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        This evaluation measures how well the template matches the reference template.
        Scores consider title match, property matching, and type accuracy (rating: {ratingDisplay}/5).
      </p>
      
      <BaseContentMetrics
        metrics={similarityData}
        referenceValue={reference.title || reference.name || ''}
        extractedValue={template.title || template.name || ''}
        expertiseWeight={expertiseMultiplier}
        expertiseMultiplier={expertiseMultiplier}
        rating={effectiveRating}
        fieldName="Template"
        metricType="accuracy"
        textConfig={textConfig}
        metricDefinitions={metricDefinitions}
        analysisData={similarityData}
        renderAnalysisComponent={renderSimilarityTable}
        renderMetricDetails={renderMetricDetails}
        scoreDetails={scoreDetails}
        metricConfig={metricConfig}
      />
    </Card>
  );
};

export default TemplateAccuracyMetrics;