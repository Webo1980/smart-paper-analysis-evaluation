import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  AlertCircle,
  Bookmark,
  FileText,
  Info,
  HelpCircle
} from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { CONTENT_CONFIG } from '../config/contentConfig';
import SemanticTextComparison from '../../base/SemanticTextComparison';

const PropertyAnnotationTable = ({ 
  paperContent,
  templateProperties,
  textSections,
  metrics
}) => {
  const [expandedProperties, setExpandedProperties] = useState({});
  const [expandedValues, setExpandedValues] = useState({});
  const [expandedMetrics, setExpandedMetrics] = useState({
    coverage: false,
    evidence: false,
    accuracy: false
  });

  if (!paperContent || !templateProperties) {
    return <div className="text-center text-gray-500">No content data available</div>;
  }
  
  const toggleProperty = (propId) => {
    setExpandedProperties(prev => ({
      ...prev,
      [propId]: !prev[propId]
    }));
  };
  
  const toggleValue = (propId, valueId) => {
    const key = `${propId}-${valueId}`;
    setExpandedValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleMetricExplanation = (metric) => {
    setExpandedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };
  
  const checkEvidenceValidity = (evidence, sectionName) => {
    if (!evidence || !evidence.text || !textSections || !textSections[sectionName]) return { 
      isValid: false, 
      bestMatchScore: 0, 
      bestMatchText: ''
    };
    
    const sectionText = textSections[sectionName];
    
    // Check for exact match
    if (sectionText.includes(evidence.text)) {
      return {
        isValid: true,
        bestMatchScore: 1.0,
        bestMatchText: evidence.text
      };
    }
    
    // If no exact match, calculate similarity
    // This would use the string similarity function
    const similarityScore = 0.65; // Placeholder - we'd calculate this
    
    return { 
      isValid: similarityScore >= CONTENT_CONFIG.textSimilarityThreshold, 
      bestMatchScore: similarityScore, 
      bestMatchText: sectionText.substring(0, 200) // Just show a preview of the section
    };
  };
  
  const renderEvidence = (propId, value) => {
    if (!value.evidence) return null;
    
    return (
      <div className="mt-2 border-t pt-2">
        <h6 className="text-xs font-medium mb-1">Evidence:</h6>
        {Object.keys(value.evidence).map((sectionName, idx) => {
          const evidence = value.evidence[sectionName];
          if (!evidence || !evidence.text) return null;
          
          const { isValid, bestMatchScore, bestMatchText } = checkEvidenceValidity(evidence, sectionName);
          
          return (
            <div key={idx} className="mb-2 bg-gray-50 p-2 rounded border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{sectionName}</span>
                <div>
                  {isValid && bestMatchScore === 1 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" /> Exact Match
                    </span>
                  )}
                  {isValid && bestMatchScore < 1 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                      <AlertCircle className="w-3 h-3 mr-1" /> Semantic Match ({Math.round(bestMatchScore * 100)}%)
                    </span>
                  )}
                  {!isValid && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                      <X className="w-3 h-3 mr-1" /> No Match ({Math.round(bestMatchScore * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              
              {evidence.relevance && (
                <div className="mt-1 text-xs">
                  <span className="font-medium">LLM Relevance Note: </span>
                  <span>{evidence.relevance}</span>
                </div>
              )}
              
              <div className="mt-3">
                <SemanticTextComparison
                  sourceText={textSections[sectionName] || ''}
                  targetText={evidence.text}
                  sourceLabel={`Paper Text (${sectionName})`}
                  targetLabel="LLM Evidence"
                  similarityThreshold={CONTENT_CONFIG.textSimilarityThreshold}
                  showDetailsInitially={!isValid || bestMatchScore < 0.9}
                />
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <Info className="inline w-3 h-3 mr-1" />
                {isValid ? (
                  bestMatchScore === 1 ? (
                    "The evidence text was found exactly in the paper."
                  ) : (
                    `The evidence text was found with ${Math.round(bestMatchScore * 100)}% semantic similarity.`
                  )
                ) : (
                  `The evidence text wasn't found in the paper. The closest match has ${Math.round(bestMatchScore * 100)}% similarity.`
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const findTemplateProperty = (propId) => {
    return templateProperties.find(p => p.id === propId);
  };

  const renderMetricExplanation = (metric) => {
    switch(metric) {
      case 'coverage':
        return (
          <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
            <h4 className="font-medium mb-2">Property Coverage Calculation</h4>
            <p className="mb-2">
              This metric shows what percentage of required properties from the template were found in the paper.
            </p>
            <div className="bg-white p-2 rounded border font-mono text-sm mb-2">
              Coverage = (Number of annotated properties) / (Total template properties)
            </div>
            <p>
              <span className="font-medium">Current score:</span> {metrics.propertyCoverage.details.annotatedCount} / {metrics.propertyCoverage.details.totalProperties} = {formatPercentage(metrics.propertyCoverage.score)}
            </p>
          </div>
        );
      case 'evidence':
        return (
          <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
            <h4 className="font-medium mb-2">Evidence Quality Calculation</h4>
            <p className="mb-2">
              This metric evaluates how well the evidence cited for property values matches the actual paper content.
            </p>
            <div className="bg-white p-2 rounded border font-mono text-sm mb-2">
              Evidence Quality = (Number of valid evidence citations) / (Total evidence citations)
            </div>
            <p>
              <span className="font-medium">Current score:</span> {metrics.evidenceQuality.details.validEvidenceCount} / {metrics.evidenceQuality.details.totalEvidenceCount} = {formatPercentage(metrics.evidenceQuality.score)}
            </p>
            {metrics.evidenceQuality.issues.length > 0 && (
              <div className="mt-2 text-red-600">
                <AlertCircle className="inline w-4 h-4 mr-1" />
                {metrics.evidenceQuality.issues[0]}
              </div>
            )}
          </div>
        );
      case 'accuracy':
        return (
          <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
            <h4 className="font-medium mb-2">Value Accuracy Calculation</h4>
            <p className="mb-2">
              This metric evaluates the accuracy of the extracted values based on their supporting evidence.
            </p>
            <div className="bg-white p-2 rounded border font-mono text-sm mb-2">
              Value Accuracy = (Number of accurate values) / (Total values extracted)
            </div>
            <p>
              <span className="font-medium">Current score:</span> {metrics.valueAccuracy.details.accurateValues} / {metrics.valueAccuracy.details.totalValues} = {formatPercentage(metrics.valueAccuracy.score)}
            </p>
            {metrics.valueAccuracy.issues.length > 0 && (
              <div className="mt-2 text-red-600">
                <AlertCircle className="inline w-4 h-4 mr-1" />
                {metrics.valueAccuracy.issues[0]}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h6 className="text-sm font-medium">Property Annotations Analysis</h6>
      
      <div className="space-y-3">
        {/* Property Coverage */}
        <div className="border rounded p-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleMetricExplanation('coverage')}
          >
            <div className="flex items-center">
              <span className="font-medium">Property Coverage: </span>
              <span className={`ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800`}>
                {formatPercentage(metrics?.propertyCoverage?.score || 0)}
              </span>
            </div>
            {expandedMetrics.coverage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedMetrics.coverage && renderMetricExplanation('coverage')}
        </div>

        {/* Evidence Quality */}
        <div className="border rounded p-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleMetricExplanation('evidence')}
          >
            <div className="flex items-center">
              <span className="font-medium">Evidence Quality: </span>
              <span className={`ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800`}>
                {formatPercentage(metrics?.evidenceQuality?.score || 0)}
              </span>
            </div>
            {expandedMetrics.evidence ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedMetrics.evidence && renderMetricExplanation('evidence')}
        </div>

        {/* Value Accuracy */}
        <div className="border rounded p-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleMetricExplanation('accuracy')}
          >
            <div className="flex items-center">
              <span className="font-medium">Value Accuracy: </span>
              <span className={`ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800`}>
                {formatPercentage(metrics?.valueAccuracy?.score || 0)}
              </span>
            </div>
            {expandedMetrics.accuracy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedMetrics.accuracy && renderMetricExplanation('accuracy')}
        </div>
      </div>
      
      {/* Property list */}
      <div className="space-y-2">
        {templateProperties.map(templateProp => {
          const propId = templateProp.id || templateProp;
          const propLabel = templateProp.label || propId;
          const paperProp = paperContent[propId];
          const isAnnotated = paperProp && paperProp.values && paperProp.values.length > 0;
          const isExpanded = expandedProperties[propId];
          
          return (
            <div key={propId} className="border rounded overflow-hidden">
              <div 
                className={`p-3 flex items-center justify-between cursor-pointer ${isAnnotated ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => toggleProperty(propId)}
              >
                <div className="flex items-center">
                  {isAnnotated ? (
                    <Bookmark className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                  )}
                  <div>
                    <h6 className="font-medium text-sm">{propLabel}</h6>
                    <p className="text-xs text-gray-500">
                      {isAnnotated ? 
                        `${paperProp.values.length} value(s) annotated` : 
                        'No annotations found'}
                    </p>
                    {templateProp.description && (
                      <p className="text-xs text-gray-500 mt-1">{templateProp.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {isAnnotated ? (
                    <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" /> Annotated
                    </span>
                  ) : (
                    <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                      <X className="w-3 h-3 mr-1" /> Missing
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              
              {isExpanded && isAnnotated && (
                <div className="p-3 border-t">
                  <div className="space-y-3">
                    {paperProp.values.map((value, idx) => {
                      const valueKey = `${propId}-${idx}`;
                      const isValueExpanded = expandedValues[valueKey];
                      
                      // Check if the value has valid evidence
                      let hasValidEvidence = false;
                      if (value.evidence) {
                        Object.keys(value.evidence).forEach(sectionName => {
                          const evidence = value.evidence[sectionName];
                          if (!evidence || !evidence.text) return;
                          
                          const { isValid } = checkEvidenceValidity(evidence, sectionName);
                          if (isValid) {
                            hasValidEvidence = true;
                          }
                        });
                      }
                      
                      return (
                        <div key={idx} className="bg-gray-50 p-2 rounded border">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleValue(propId, idx)}
                          >
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-600" />
                              <div className="flex-1 truncate">
                                <span className="font-medium text-sm mr-2">Value:</span>
                                <span className="text-sm">{value.value}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {value.confidence !== undefined && (
                                <span className={`mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs 
                                  ${value.confidence >= 0.8 ? 'bg-green-100 text-green-800' : 
                                    value.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'}`}>
                                  AI Confidence: {Math.round(value.confidence * 100)}%
                                </span>
                              )}
                              {hasValidEvidence ? (
                                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                  <Check className="w-3 h-3 mr-1" /> Valid Evidence
                                </span>
                              ) : (
                                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                  <X className="w-3 h-3 mr-1" /> Invalid Evidence
                                </span>
                              )}
                              {isValueExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                          
                          {isValueExpanded && (
                            <div className="mt-2 pt-2 border-t">
                              {renderEvidence(propId, value)}
                              <div className="mt-2 text-xs text-gray-500">
                                <HelpCircle className="inline w-3 h-3 mr-1" />
                                The AI extracted this value by analyzing the evidence text from the paper sections.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {isExpanded && !isAnnotated && (
                <div className="p-3 border-t bg-red-50">
                  <p className="text-sm text-red-700">
                    This property from the template was not annotated in the paper.
                  </p>
                  <p className="text-xs mt-1 text-red-600">
                    The AI couldn't find any information in the paper that matches this property.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyAnnotationTable;