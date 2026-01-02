import React, { useState, useEffect, useCallback } from 'react';
import { BaseEvaluationSection } from '../../evaluation/base/BaseEvaluationSection';
import { Card } from '../../ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ArrowLeft, ArrowRight, Edit, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { Tooltip } from '../../ui/tooltip';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';

export const PropertyValueSection = ({ evaluationData, orkgPaperData, onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();
  const [showDetails, setShowDetails] = useState(false);
  const [showMetrics, setShowMetrics] = useState(() => 
    evaluationState.propertyValues?.showMetrics ?? false
  );
  
  const [editMode, setEditMode] = useState(() => 
    !evaluationState.propertyValues?.showMetrics
  );
  
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [expandedProps, setExpandedProps] = useState({});
  const [systemAnalysisComments, setSystemAnalysisComments] = useState(
    evaluationState.propertyValues?.systemAnalysisComments || ''
  );
  
  const [assessment, setAssessment] = useState(() => 
    evaluationState.propertyValues?.assessment || {
      extractionAccuracy: { rating: 0, comments: '' },
      valueNormalization: { rating: 0, comments: '' },
      evidence: { rating: 0, comments: '' },
      overall: { rating: 0, comments: '' }
    }
  );

  const isComplete = Object.entries(assessment)
    .filter(([field]) => field !== 'overall')
    .every(([_, value]) => value.rating > 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newState = {
        assessment,
        showMetrics,
        editMode,
        isComplete,
        expandedProps,
        systemAnalysisComments,
        properties: evaluationData?.paperContent?.paperContent
      };

      if (JSON.stringify(evaluationState.propertyValues) !== JSON.stringify(newState)) {
        updateSection('propertyValues', newState);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assessment, showMetrics, editMode, isComplete, expandedProps, systemAnalysisComments, evaluationData]);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
    if (!showMetrics) {
      setShowMetrics(true);
    }
  }, [showMetrics]);
  const handleAssessmentChange = useCallback((newAssessment) => {
    setAssessment(newAssessment);
    if (!showMetrics && Object.entries(newAssessment)
        .filter(([field]) => field !== 'overall')
        .every(([_, value]) => value.rating > 0)) {
      setShowMetrics(true);
      setEditMode(false);
    }
  }, [showMetrics]);

  const toggleProperty = useCallback((propName) => {
    setExpandedProps(prev => ({
      ...prev,
      [propName]: !prev[propName]
    }));
  }, []);

  const checkTypeMatch = useCallback((value, expectedType) => {
    if (!value || !expectedType) return false;
    
    switch (expectedType) {
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'text':
        return typeof value === 'string';
      case 'resource':
        return typeof value === 'object';
      case 'date':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }, []);

  const calculatePropertyMetrics = useCallback(() => {
    try {
      const properties = evaluationData?.paperContent?.paperContent;
      const template = evaluationData?.templates?.available?.template;
      if (!properties || !template) {
        throw new Error('Missing properties or template data');
      }

      const templatePropsMap = template.properties.reduce((acc, prop) => {
        acc[prop.id] = prop;
        return acc;
      }, {});

      const evalProps = Object.entries(properties).map(([key, value]) => {
        const templateProp = templatePropsMap[key];
        const typeMatches = templateProp ? checkTypeMatch(value.value, templateProp.type) : false;

        return {
          name: value.label,
          value: value.value,
          confidence: value.confidence || 0,
          evidence: value.evidence || {},
          type: value.type,
          expectedType: templateProp?.type,
          typeMatches,
          hasValue: value.value !== null && value.value !== undefined,
          evidenceCount: value.evidence ? Object.keys(value.evidence).length : 0
        };
      });

      const totalProps = template.properties.length;
      const requiredProps = template.properties.filter(p => p.required).length;
      
      const propsWithValues = evalProps.filter(p => p.hasValue).length;
      const propsWithEvidence = evalProps.filter(p => p.evidenceCount > 0).length;
      const propsWithHighConfidence = evalProps.filter(p => p.confidence >= 0.7).length;
      const propsWithMatchingType = evalProps.filter(p => p.typeMatches).length;

      const valueScore = (propsWithValues / totalProps) * 100;
      const evidenceScore = (propsWithEvidence / totalProps) * 100;
      const confidenceScore = (propsWithHighConfidence / totalProps) * 100;
      const typeScore = (propsWithMatchingType / totalProps) * 100;

      const qualityScore = Math.round((valueScore + evidenceScore + confidenceScore + typeScore) / 4);

      return {
        qualityScore,
        accuracy: propsWithHighConfidence / totalProps,
        coverage: propsWithValues / totalProps,
        typeAccuracy: propsWithMatchingType / totalProps,
        properties: evalProps,
        summary: {
          total: totalProps,
          required: requiredProps,
          withValue: propsWithValues,
          withEvidence: propsWithEvidence,
          highConfidence: propsWithHighConfidence,
          matchingType: propsWithMatchingType
        }
      };
    } catch (error) {
      console.error('Error in calculatePropertyMetrics:', error);
      return null;
    }
  }, [evaluationData, checkTypeMatch]);
  const renderMetrics = () => {
    if (!showMetrics) return null;

    const metrics = calculatePropertyMetrics();

    if (!metrics) {
      return (
        <Card className="mt-6">
          <Alert>
            <AlertTitle>Data Unavailable</AlertTitle>
            <AlertDescription>Property data is not available for analysis.</AlertDescription>
          </Alert>
        </Card>
      );
    }

    const handleSystemAnalysisCommentsChange = (e) => {
      const comments = e.target.value;
      setSystemAnalysisComments(comments);
      updateSection('propertyValues', {
        ...evaluationState.propertyValues,
        systemAnalysisComments: comments
      });
    };

    return (
      <Card className="mt-6">
        <Alert className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Property Analysis</h4>
            <div className="flex items-center gap-2" onClick={() => setShowScoreInfo(!showScoreInfo)}>
             <button
                className="text-xs text-gray-600 underline hover:text-gray-900"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
              <Badge 
                className={metrics.qualityScore >= 70 ? "bg-green-500" : 
                  metrics.qualityScore >= 50 ? "bg-yellow-500" : "bg-red-500"}
              >
                Score: {metrics.qualityScore}%
              </Badge>
            </div>
          </div>

          {showScoreInfo && (
            <div className="mb-4 text-sm bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-2">Score Components:</p>
              <ul className="space-y-2">
                <li>
                  Value Coverage (25%): {(metrics.coverage * 100).toFixed(1)}%
                  <div className="text-gray-600 text-xs">
                    {metrics.summary.withValue} of {metrics.summary.total} properties have values
                  </div>
                </li>
                <li>
                  Evidence Support (25%): {(metrics.summary.withEvidence / metrics.summary.total * 100).toFixed(1)}%
                  <div className="text-gray-600 text-xs">
                    {metrics.summary.withEvidence} of {metrics.summary.total} properties have evidence
                  </div>
                </li>
                <li>
                  Confidence Level (25%): {(metrics.accuracy * 100).toFixed(1)}%
                  <div className="text-gray-600 text-xs">
                    {metrics.summary.highConfidence} of {metrics.summary.total} properties have high confidence
                  </div>
                </li>
                <li>
                  Type Accuracy (25%): {(metrics.typeAccuracy * 100).toFixed(1)}%
                  <div className="text-gray-600 text-xs">
                    {metrics.summary.matchingType} of {metrics.summary.total} properties match expected types
                  </div>
                </li>
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {metrics.properties.map((prop, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div 
                  className={`p-3 ${prop.confidence >= 0.7 ? 'bg-green-50' : 
                    prop.hasValue ? 'bg-yellow-50' : 'bg-red-50'} 
                    cursor-pointer`}
                  onClick={() => toggleProperty(prop.name)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium flex items-center gap-2">
                      {prop.name}
                      {expandedProps[prop.name] ? 
                        <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      }
                    </div>
                    <div className="text-sm">
                      Confidence: {(prop.confidence * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    <div className="flex gap-2">
                      <span>Type: {prop.expectedType}</span>
                      <span>•</span>
                      <span className={prop.typeMatches ? "text-green-600" : "text-red-600"}>
                        {prop.typeMatches ? "Type Matches ✓" : "Type Mismatch ✗"}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedProps[prop.name] && (
                  <>
                    {prop.hasValue && (
                      <div className="p-3 border-t bg-white">
                        <div className="font-medium text-sm text-gray-700 mb-1">Value:</div>
                        <div className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
                          {typeof prop.value === 'object' ? 
                            JSON.stringify(prop.value, null, 2) : 
                            String(prop.value)
                          }
                        </div>
                      </div>
                    )}
                    {prop.evidenceCount > 0 && (
                      <div className="p-3 border-t bg-white">
                        <div className="font-medium text-sm text-gray-700 mb-1">
                          Evidence ({Object.keys(prop.evidence).length}):
                        </div>
                        <div className="space-y-2">
                          {Object.entries(prop.evidence).map(([section, data], idx) => (
                            <div key={idx} className="text-sm">
                              <div className="font-medium text-gray-600">{section}:</div>
                              <div className="bg-gray-50 p-2 rounded mt-1">
                                {data.text}
                                {data.relevance && (
                                  <div className="text-gray-500 mt-1">
                                    Relevance: {data.relevance}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 mt-4">
            <Label>System Analysis Comments</Label>
            <Textarea
              value={systemAnalysisComments}
              onChange={handleSystemAnalysisCommentsChange}
              rows={4}
              placeholder="Add your observations about the property value analysis..."
            />
          </div>
        </Alert>
      </Card>
    );
  };
  const renderEvaluationResults = () => {
    const metrics = calculatePropertyMetrics();
    if (!metrics) return null;

    return (
      <Card className="mt-6">
        <Alert className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Properties vs Values Evaluation</h4>
            <Badge 
              className={metrics.qualityScore >= 70 ? "bg-green-500" : 
                metrics.qualityScore >= 50 ? "bg-yellow-500" : "bg-red-500"}
            >
              Overall Score: {metrics.qualityScore}%
            </Badge>
          </div>
          
          <div className="grid gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Properties Summary</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total Properties</div>
                  <div className="text-lg font-medium">{metrics.summary.total}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Required Properties</div>
                  <div className="text-lg font-medium">{metrics.summary.required}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Properties with Values</div>
                  <div className="text-lg font-medium">
                    {metrics.summary.withValue} 
                    <span className="text-sm text-gray-500">
                      ({(metrics.coverage * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Properties with Evidence</div>
                  <div className="text-lg font-medium">
                    {metrics.summary.withEvidence}
                    <span className="text-sm text-gray-500">
                      ({((metrics.summary.withEvidence / metrics.summary.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Quality Metrics</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Extraction Accuracy</div>
                  <div className="text-lg font-medium">
                    {(metrics.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Type Match Rate</div>
                  <div className="text-lg font-medium">
                    {(metrics.typeAccuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">High Confidence Values</div>
                  <div className="text-lg font-medium">
                    {metrics.summary.highConfidence}
                    <span className="text-sm text-gray-500">
                      ({((metrics.summary.highConfidence / metrics.summary.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Type-Matched Properties</div>
                  <div className="text-lg font-medium">
                    {metrics.summary.matchingType}
                    <span className="text-sm text-gray-500">
                      ({((metrics.summary.matchingType / metrics.summary.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Alert>
      </Card>
    );
  };
  const renderContent = () => {
    if (editMode) {
      return (
        <BaseEvaluationSection
          title="Property Value Extraction"
          description="Please evaluate the property value extraction before seeing the analysis."
          fields={[
            { 
              id: 'extractionAccuracy',
              label: 'Extraction Accuracy',
              help: 'How accurate are the extracted property values?'
            },
            {
              id: 'valueNormalization',
              label: 'Value Normalization',
              help: 'Are values appropriately normalized and standardized?'
            },
            {
              id: 'evidence',
              label: 'Evidence Support',
              help: 'Is there clear evidence in the text for extracted values?'
            }
          ]}
          data={assessment}
          onChange={handleAssessmentChange}
          onComplete={() => {
            setShowMetrics(true);
            setEditMode(false);
          }}
          isComplete={isComplete}
        />
      );
    }

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Property Value Analysis</h2>
          <p className="text-gray-600">
            Review the analysis of extracted property values and their evidence.
          </p>
        </div>
        {renderMetrics()}
      </>
    );
  };

  const renderNavigationButtons = () => (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md"
      >
        <ArrowLeft className="h-4 w-4" />
        Previous
      </Button>
      <Button
        onClick={onNext}
        disabled={!isComplete}
        className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
  const renderToggleButton = () => {
    if (!showMetrics) return null;

    const buttonContent = (
      <Button
        variant={editMode ? "ghost" : "ghost"}
        onClick={toggleEditMode}
        disabled={editMode && !isComplete}
        className={`mb-4 flex items-center gap-2 text-white p-2 rounded-md 
          ${editMode ? "!bg-[#E86161] hover:!bg-[#c54545]" : "!bg-[#E86161] hover:!bg-[#c54545]"}
          !outline-none !ring-0 !border-none
        `}
      >
        {editMode ? (
          <>
            <ArrowLeft className="h-4 w-4" />
            Back to Analysis
          </>
        ) : (
          <>
            <Edit className="h-4 w-4" />
            Edit Assessment
          </>
        )}
      </Button>
    );

    if (editMode && !isComplete) {
      return (
        <Tooltip content="Complete all questions to view the analysis">
          {buttonContent}
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <div className="space-y-4">
      {renderToggleButton()}
      {renderContent()}
      {showMetrics && renderEvaluationResults()}
      {renderNavigationButtons()}
    </div>
  );
};

export default PropertyValueSection;