// src/components/evaluation/content/components/ContentAccuracyMetrics.jsx
import React, { useState } from 'react';
import { Card } from '../../../ui/card';
import { Progress } from '../../../ui/progress';
import { 
  CheckCircle, FileText, AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { 
  TEXT_CONFIG, 
  METRIC_CONFIG, 
  FORMULA_CONFIG, 
  METRIC_EXPLANATIONS, 
  CONTENT_CONFIG 
} from '../config/contentConfig';
import SemanticTextComparison from '../../base/SemanticTextComparison';
// import ValueAccuracyAnalysis from './ValueAccuracyAnalysis';

const CollapsibleSection = ({ title, icon: Icon, score, isExpanded, toggleExpanded, children }) => {
  const getScoreColor = (score) => {
    if (score >= CONTENT_CONFIG.scoreThresholds.excellent) return 'bg-green-100 text-green-800';
    if (score >= CONTENT_CONFIG.scoreThresholds.good) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="border rounded overflow-hidden mb-4">
      <div 
        className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 border-b"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          {Icon && <Icon className="h-4 w-4 mr-2 text-gray-700" />}
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        <div className="flex items-center">
          <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${getScoreColor(score)}`}>
            {formatPercentage(score)}
          </span>
          {isExpanded ? 
            <ChevronUp className="h-4 w-4 text-gray-500" /> : 
            <ChevronDown className="h-4 w-4 text-gray-500" />
          }
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const ContentAccuracyMetrics = ({
  metrics,
  paperContent,
  templateProperties,
  textSections,
  rating,
  expertiseMultiplier
}) => {
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    precision: false,
    recall: false,
    valueAccuracy: false,
    f1Score: false
  });
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Format ratings for display
  const ratingDisplay = rating ? `${rating}/5` : '0/5';
  
  // Prepare metric definitions
  const metricDefinitions = {
    precision: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>${METRIC_EXPLANATIONS.precision.title}</strong></p>
        <p>${METRIC_EXPLANATIONS.precision.description}</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>${FORMULA_CONFIG.precision}</p>
        </div>
      </div>
    `,
    recall: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>${METRIC_EXPLANATIONS.recall.title}</strong></p>
        <p>${METRIC_EXPLANATIONS.recall.description}</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>${FORMULA_CONFIG.recall}</p>
        </div>
      </div>
    `,
    valueAccuracy: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>${METRIC_EXPLANATIONS.valueAccuracy.title}</strong></p>
        <p>${METRIC_EXPLANATIONS.valueAccuracy.description}</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>${FORMULA_CONFIG.valueAccuracy}</p>
        </div>
      </div>
    `,
    f1Score: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>${METRIC_EXPLANATIONS.f1Score.title}</strong></p>
        <p>${METRIC_EXPLANATIONS.f1Score.description}</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>${FORMULA_CONFIG.f1Score}</p>
        </div>
      </div>
    `
  };

  // Render detailed metrics table
  const renderMetricsTable = (data, showAnalysis) => {
    if (!data || !showAnalysis) return null;
    
    // Calculate metrics
    const precision = metrics?.propertyRecall?.precision || 0; 
    const recall = metrics?.propertyRecall?.recall || 0;
    const valueAccuracy = metrics?.valueAccuracy?.score || 0;
    const f1Score = metrics?.propertyRecall?.f1Score || 0;
    
    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Metric</th>
              <th className="p-2 text-left border-b">Value</th>
              <th className="p-2 text-left border-b">Formula</th>
              <th className="p-2 text-left border-b">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium">{METRIC_EXPLANATIONS.precision.title}</td>
              <td className="p-2 border-r">{formatPercentage(precision)}</td>
              <td className="p-2 border-r">Accurate / Total</td>
              <td className="p-2">Percentage of annotated properties that are accurate</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium">{METRIC_EXPLANATIONS.recall.title}</td>
              <td className="p-2 border-r">{formatPercentage(recall)}</td>
              <td className="p-2 border-r">Annotated / Total</td>
              <td className="p-2">Percentage of template properties that were annotated</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium">{METRIC_EXPLANATIONS.valueAccuracy.title}</td>
              <td className="p-2 border-r">{formatPercentage(valueAccuracy)}</td>
              <td className="p-2 border-r">Accurate / Total</td>
              <td className="p-2">Percentage of property values that are accurate</td>
            </tr>
            <tr>
              <td className="p-2 border-r font-medium">{METRIC_EXPLANATIONS.f1Score.title}</td>
              <td className="p-2 border-r">{formatPercentage(f1Score)}</td>
              <td className="p-2 border-r">2 × (P × R) / (P + R)</td>
              <td className="p-2">Harmonic mean of precision and recall</td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              F1 Score = 2 × (Precision × Recall) / (Precision + Recall)<br/>
              = 2 × ({formatPercentage(precision)} × {formatPercentage(recall)}) / ({formatPercentage(precision)} + {formatPercentage(recall)})<br/>
              = {formatPercentage(f1Score)}
            </code>
          </div>
        </div>
      </div>
    );
  };

  // Function to render detailed metric explanation
  const renderMetricDetails = (metricType) => {
    if (!metrics) return null;
    
    // Get metrics from property recall data
    const precision = metrics?.propertyRecall?.precision || 0;
    const recall = metrics?.propertyRecall?.recall || 0;
    const valueAccuracy = metrics?.valueAccuracy?.score || 0;
    const f1Score = metrics?.propertyRecall?.f1Score || 0;
    
    // Prepare explanation based on metric type
    let explanation = {
      title: '',
      description: '',
      formula: '',
      calculation: '',
      value: 0
    };
    
    switch(metricType) {
      case 'precision':
        explanation = {
          title: METRIC_EXPLANATIONS.precision.title,
          description: METRIC_EXPLANATIONS.precision.description,
          formula: FORMULA_CONFIG.precision,
          calculation: `Matched properties: ${metrics.propertyRecall?.details?.matchedProperties || 0}
                       Total annotated properties: ${metrics.propertyRecall?.details?.totalAnnotatedProperties || 0}
                       Precision = ${metrics.propertyRecall?.details?.matchedProperties || 0} / ${metrics.propertyRecall?.details?.totalAnnotatedProperties || 0}`,
          value: precision
        };
        break;
      case 'recall':
        explanation = {
          title: METRIC_EXPLANATIONS.recall.title,
          description: METRIC_EXPLANATIONS.recall.description,
          formula: FORMULA_CONFIG.recall,
          calculation: `Matched properties: ${metrics.propertyRecall?.details?.matchedProperties || 0}
                       Total template properties: ${metrics.propertyRecall?.details?.totalTemplateProperties || 0}
                       Recall = ${metrics.propertyRecall?.details?.matchedProperties || 0} / ${metrics.propertyRecall?.details?.totalTemplateProperties || 0}`,
          value: recall
        };
        break;
      case 'valueAccuracy':
        explanation = {
          title: METRIC_EXPLANATIONS.valueAccuracy.title,
          description: METRIC_EXPLANATIONS.valueAccuracy.description,
          formula: FORMULA_CONFIG.valueAccuracy,
          calculation: `Accurate values: ${metrics.valueAccuracy?.details?.accurateValues || 0}
                       Total values: ${metrics.valueAccuracy?.details?.totalValues || 0}
                       Value Accuracy = ${metrics.valueAccuracy?.details?.accurateValues || 0} / ${metrics.valueAccuracy?.details?.totalValues || 0}`,
          value: valueAccuracy
        };
        break;
      case 'f1Score':
        explanation = {
          title: METRIC_EXPLANATIONS.f1Score.title,
          description: METRIC_EXPLANATIONS.f1Score.description,
          formula: FORMULA_CONFIG.f1Score,
          calculation: `Precision: ${formatPercentage(precision)}
                       Recall: ${formatPercentage(recall)}
                       F1 Score = 2 × (${precision.toFixed(3)} × ${recall.toFixed(3)}) / (${precision.toFixed(3)} + ${recall.toFixed(3)})`,
          value: f1Score
        };
        break;
      default:
        return null;
    }
    
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
              
              <div className="mt-2 bg-blue-50 p-1 rounded text-xs border-l-2 border-blue-200 pl-2">
                <span className="font-medium">Calculation: </span>
                <pre className="text-xs whitespace-pre-wrap">{explanation.calculation}</pre>
              </div>
              
              <div className="mt-2 bg-green-50 p-1 rounded text-xs">
                <div className="flex items-center">
                  <span className="font-medium">Result: </span>
                  <span className="ml-2 whitespace-nowrap">
                    {formatPercentage(explanation.value)}
                  </span>
                </div>
              </div>
            </div>
          </div>
    
          <div className="flex-1 p-2 bg-white rounded border">
            <p className="text-xs font-medium mb-1">Analysis:</p>
            <div className="border-t pt-1 text-xs space-y-2">
              {metricType === 'precision' && (
                <>
                  <p>
                    The precision of {formatPercentage(precision)} indicates that 
                    {precision >= CONTENT_CONFIG.scoreThresholds.excellent ? METRIC_EXPLANATIONS.precision.analysis.high : 
                     precision >= CONTENT_CONFIG.scoreThresholds.good ? METRIC_EXPLANATIONS.precision.analysis.medium : 
                     METRIC_EXPLANATIONS.precision.analysis.low}
                  </p>
                  {metrics.propertyRecall?.issues?.length > 0 && (
                    <div className="bg-yellow-50 p-1 rounded">
                      <p className="font-medium">Issues:</p>
                      <ul className="list-disc list-inside">
                        {metrics.propertyRecall.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              
              {metricType === 'recall' && (
                <>
                  <p>
                    The recall of {formatPercentage(recall)} indicates that 
                    {recall >= CONTENT_CONFIG.scoreThresholds.excellent ? METRIC_EXPLANATIONS.recall.analysis.high : 
                     recall >= CONTENT_CONFIG.scoreThresholds.good ? METRIC_EXPLANATIONS.recall.analysis.medium : 
                     METRIC_EXPLANATIONS.recall.analysis.low}
                  </p>
                  {metrics.propertyRecall?.issues?.length > 0 && (
                    <div className="bg-yellow-50 p-1 rounded">
                      <p className="font-medium">Issues:</p>
                      <ul className="list-disc list-inside">
                        {metrics.propertyRecall.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              
              {metricType === 'valueAccuracy' && (
                <>
                  <p>
                    The value accuracy of {formatPercentage(valueAccuracy)} indicates that 
                    {valueAccuracy >= CONTENT_CONFIG.scoreThresholds.excellent ? METRIC_EXPLANATIONS.valueAccuracy.analysis.high : 
                     valueAccuracy >= CONTENT_CONFIG.scoreThresholds.good ? METRIC_EXPLANATIONS.valueAccuracy.analysis.medium : 
                     METRIC_EXPLANATIONS.valueAccuracy.analysis.low}
                  </p>
                  {metrics.valueAccuracy?.issues?.length > 0 && (
                    <div className="bg-yellow-50 p-1 rounded">
                      <p className="font-medium">Issues:</p>
                      <ul className="list-disc list-inside">
                        {metrics.valueAccuracy.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              
              {metricType === 'f1Score' && (
                <>
                  <p>
                    The F1 score of {formatPercentage(f1Score)} represents the balanced assessment of both precision and recall.
                    {f1Score >= CONTENT_CONFIG.scoreThresholds.excellent ? METRIC_EXPLANATIONS.f1Score.analysis.high : 
                     f1Score >= CONTENT_CONFIG.scoreThresholds.good ? METRIC_EXPLANATIONS.f1Score.analysis.medium : 
                     METRIC_EXPLANATIONS.f1Score.analysis.low}
                  </p>
                  <p>
                    {precision > recall ? METRIC_EXPLANATIONS.f1Score.comparison.precisionHigher : 
                     precision < recall ? METRIC_EXPLANATIONS.f1Score.comparison.recallHigher : 
                     METRIC_EXPLANATIONS.f1Score.comparison.balanced}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render precision section contents
  const renderPrecisionSection = () => {
    const precisionData = metrics?.propertyRecall;
    if (!precisionData) return null;
    
    return (
      <div className="space-y-3">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Precision Calculation</h6>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs">
              <span className="font-medium">Accurate Properties: </span>
              <span>{precisionData.details?.matchedProperties || 0} of {precisionData.details?.totalAnnotatedProperties || 0}</span>
            </div>
            <div className="text-xs">
              <span className="font-medium">Precision: </span>
              <span>{formatPercentage(precisionData.precision)}</span>
            </div>
          </div>
          
          <Progress value={precisionData.precision * 100} className="h-2" />
          
          {precisionData.issues?.length > 0 && (
            <div className="mt-3 bg-yellow-50 p-2 rounded text-xs">
              <p className="font-medium mb-1">Issues:</p>
              <ul className="list-disc list-inside">
                {precisionData.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {precisionData.details?.inaccurateProperties?.length > 0 && (
          <div className="bg-white p-3 rounded border">
            <h6 className="text-xs font-medium mb-2">Inaccurate Properties</h6>
            <div className="space-y-2">
              {precisionData.details.inaccurateProperties.slice(0, 5).map((prop, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded text-xs">
                  <div className="flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
                    <span className="font-medium">{prop.property}: </span>
                    <span className="ml-1 truncate">{prop.value}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="font-medium">Issue: </span>
                    <span>{prop.issue}</span>
                  </div>
                </div>
              ))}
              
              {precisionData.details.inaccurateProperties.length > 5 && (
                <div className="text-xs text-center text-gray-500">
                  +{precisionData.details.inaccurateProperties.length - 5} more inaccurate properties
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render recall section contents
  const renderRecallSection = () => {
    const recallData = metrics?.propertyRecall;
    if (!recallData) return null;
    
    return (
      <div className="space-y-3">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Recall Calculation</h6>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs">
              <span className="font-medium">Annotated Properties: </span>
              <span>{recallData.details?.matchedProperties || 0} of {recallData.details?.totalTemplateProperties || 0}</span>
            </div>
            <div className="text-xs">
              <span className="font-medium">Recall: </span>
              <span>{formatPercentage(recallData.recall)}</span>
            </div>
          </div>
          
          <Progress value={recallData.recall * 100} className="h-2" />
          
          {recallData.issues?.length > 0 && (
            <div className="mt-3 bg-yellow-50 p-2 rounded text-xs">
              <p className="font-medium mb-1">Issues:</p>
              <ul className="list-disc list-inside">
                {recallData.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {recallData.details?.missingProperties?.length > 0 && (
          <div className="bg-white p-3 rounded border">
            <h6 className="text-xs font-medium mb-2">Missing Properties</h6>
            <ul className="list-disc list-inside text-xs">
              {recallData.details.missingProperties.map((prop, i) => (
                <li key={i}>{prop}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render value accuracy section contents (moved from quality to accuracy)
  const renderValueAccuracySection = () => {
    const accuracyData = metrics?.valueAccuracy;
    if (!accuracyData) return null;
    /*
    return (
      <ValueAccuracyAnalysis 
        accuracyData={accuracyData} 
        textSections={textSections} 
      />
    );*/
  };

  // Calculate property metrics for base content metrics
  const analysisData = {
    fieldSpecificMetrics: {
      precision: { score: metrics?.propertyRecall?.precision || 0 },
      recall: { score: metrics?.propertyRecall?.recall || 0 },
      valueAccuracy: { score: metrics?.valueAccuracy?.score || 0 },
      f1Score: { score: metrics?.propertyRecall?.f1Score || 0 }
    }
  };

  // Use BaseContentMetrics with custom data
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">{TEXT_CONFIG.accuracy.title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {TEXT_CONFIG.accuracy.description} (rating: {ratingDisplay})
      </p>
      
      <BaseContentMetrics
        metrics={metrics}
        referenceValue="Template Properties"
        extractedValue="Paper Annotations"
        expertiseWeight={expertiseMultiplier}
        expertiseMultiplier={expertiseMultiplier}
        rating={rating}
        fieldName="Content"
        metricType="accuracy"
        metricDefinitions={metricDefinitions}
        analysisData={analysisData}
        renderAnalysisComponent={renderMetricsTable}
        renderMetricDetails={renderMetricDetails}
        metricConfig={METRIC_CONFIG.accuracy}
      />
      
      <div className="mt-6 space-y-4">
        {/* F1 Score Section */}
        <CollapsibleSection
          title={TEXT_CONFIG.accuracy.sections.f1Score}
          icon={CheckCircle}
          score={metrics?.propertyRecall?.f1Score || 0}
          isExpanded={expandedSections.f1Score}
          toggleExpanded={() => toggleSection('f1Score')}
        >
          {renderMetricDetails('f1Score')}
        </CollapsibleSection>
        
        {/* Precision Section */}
        <CollapsibleSection
          title={TEXT_CONFIG.accuracy.sections.precision}
          icon={CheckCircle}
          score={metrics?.propertyRecall?.precision || 0}
          isExpanded={expandedSections.precision}
          toggleExpanded={() => toggleSection('precision')}
        >
          {renderPrecisionSection()}
        </CollapsibleSection>
        
        {/* Recall Section */}
        <CollapsibleSection
          title={TEXT_CONFIG.accuracy.sections.recall}
          icon={FileText}
          score={metrics?.propertyRecall?.recall || 0}
          isExpanded={expandedSections.recall}
          toggleExpanded={() => toggleSection('recall')}
        >
          {renderRecallSection()}
        </CollapsibleSection>
        
        {/* Value Accuracy Section - moved from quality 
        <CollapsibleSection
          title={TEXT_CONFIG.accuracy.sections.valueAccuracy}
          icon={CheckCircle}
          score={metrics?.valueAccuracy?.score || 0}
          isExpanded={expandedSections.valueAccuracy}
          toggleExpanded={() => toggleSection('valueAccuracy')}
        >
          {renderValueAccuracySection()}
        </CollapsibleSection>
        */}
      </div>
    </Card>
  );
};

export default ContentAccuracyMetrics;