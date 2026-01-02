import React, { useState, useEffect, useCallback } from 'react';
import { BaseEvaluationSection } from '../../evaluation/base/BaseEvaluationSection';
import { Card } from '../../ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { ArrowLeft, ArrowRight, Edit } from 'lucide-react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { Tooltip } from '../../ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

export const TemplateAnalysisSection = ({ evaluationData, orkgPaperData, onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();

  const [showMetrics, setShowMetrics] = useState(() => 
    evaluationState.templateAnalysis?.showMetrics ?? false
  );

  const [editMode, setEditMode] = useState(() => 
    !evaluationState.templateAnalysis?.showMetrics
  );

  const [showDetails, setShowDetails] = useState(false);

  const [assessment, setAssessment] = useState(() => 
    evaluationState.templateAnalysis?.assessment || {
      templateSelection: { rating: 0, comments: '' },
      propertyStructure: { rating: 0, comments: '' },
      adaptability: { rating: 0, comments: '' },
      overall: { rating: 0, comments: '' }
    }
  );

  const [systemAnalysisComments, setSystemAnalysisComments] = useState(
    evaluationState.templateAnalysis?.systemAnalysisComments || ''
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
        selectedTemplate: evaluationData?.templates?.available?.template?.name,
        systemAnalysisComments
      };

      if (JSON.stringify(evaluationState.templateAnalysis) !== JSON.stringify(newState)) {
        updateSection('templateAnalysis', newState);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assessment, showMetrics, editMode, isComplete, evaluationData, systemAnalysisComments]);

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

  const handleSystemAnalysisCommentsChange = (e) => {
    setSystemAnalysisComments(e.target.value);
  };

  const calculateTemplateMetrics = useCallback(() => {
    try {
      const isTemplateMatch = evaluationData?.templates?.available?.template?.id === 
        orkgPaperData?.template_id;

      if (isTemplateMatch) {
        return {
          overallScore: 100,
          isExactMatch: true,
          details: {
            templateName: evaluationData.templates.available.template.name,
            templateDescription: evaluationData.templates.available.template.description,
            properties: {
              total: evaluationData.templates.available.template.properties.length,
              required: evaluationData.templates.available.template.properties
                .filter(p => p.required).length,
              optional: evaluationData.templates.available.template.properties
                .filter(p => !p.required).length
            },
            propertyDetails: evaluationData.templates.available.template.properties
              .map(p => ({
                name: p.label,
                required: p.required,
                type: p.type
              }))
          },
          systemAnalysisComments
        };
      }

      const llmTemplate = evaluationData?.templates?.llm_template?.template;
      if (!llmTemplate) {
        throw new Error('No template available for analysis');
      }

      let score = 0;
      if (llmTemplate.name && llmTemplate.description) {
        score += 30;
      }

      const propertyCount = llmTemplate.properties.length;
      const propertyCoverageScore = propertyCount >= 5 ? 40 : (propertyCount / 5) * 40;
      score += propertyCoverageScore;

      const requiredProps = llmTemplate.properties.filter(p => p.required).length;
      const propertyQualityScore = Math.min((requiredProps / 5) * 30, 30);
      score += propertyQualityScore;

      return {
        overallScore: Math.round(score),
        isExactMatch: false,
        propertyScore: propertyCoverageScore,
        metadataScore: score >= 30 ? 30 : 0,
        propertyQualityScore,
        details: {
          templateName: llmTemplate.name,
          templateDescription: llmTemplate.description,
          generatedBy: 'LLM',
          properties: {
            total: propertyCount,
            required: requiredProps,
            optional: llmTemplate.properties.filter(p => !p.required).length
          },
          propertyDetails: llmTemplate.properties.map(p => ({
            name: p.label,
            required: p.required,
            type: p.type
          }))
        },
        systemAnalysisComments
      };
    } catch (error) {
      console.error('Error in calculateTemplateMetrics:', error);
      return null;
    }
  }, [evaluationData, orkgPaperData, systemAnalysisComments]);

  const renderMetrics = () => {
    if (!showMetrics) return null;

    const metrics = calculateTemplateMetrics();

    if (!metrics) {
      return (
        <Card className="mt-6">
          <Alert>
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>Unable to calculate template metrics.</AlertDescription>
          </Alert>
        </Card>
      );
    }

    return (
      <Card className="mt-6">
        <Alert className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Template Analysis</h4>
            <div className="flex items-center gap-2">
              <button
                className="text-xs text-gray-600 underline hover:text-gray-900"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Score Details' : 'Show Score Details'}
              </button>
              <Badge 
                className={metrics.overallScore >= 70 ? "bg-green-500" : 
                  metrics.overallScore >= 50 ? "bg-yellow-500" : "bg-red-500"}
              >
                Score: {metrics.overallScore}%
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {metrics.isExactMatch ? (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="font-medium text-green-800">
                  Exact Match with ORKG Template ✓
                </p>
              </div>
            ) : (
              <>
                <div>Template Metadata Score: {metrics.metadataScore}% (of 30%)</div>
                <div>Property Coverage Score: {metrics.propertyScore}% (of 40%)</div>
                <div>Property Quality Score: {metrics.propertyQualityScore}% (of 30%)</div>
              </>
            )}
          </div>
          {showDetails && (
            <div className="mt-4 space-y-4">
              <div>
                <h5 className="font-medium mb-2">Template Information</h5>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p><span className="font-medium">Name:</span> {metrics.details.templateName}</p>
                  <p><span className="font-medium">Description:</span> {metrics.details.templateDescription}</p>
                  {!metrics.isExactMatch && (
                    <p><span className="font-medium">Generated By:</span> {metrics.details.generatedBy}</p>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Property Analysis</h5>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.details.propertyDetails.map((prop, index) => (
                      <TableRow key={index}>
                        <TableCell>{prop.name}</TableCell>
                        <TableCell>{prop.type}</TableCell>
                        <TableCell>{prop.required ? '✓' : '−'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-2 text-sm text-gray-600">
                  Total Properties: {metrics.details.properties.total} 
                  ({metrics.details.properties.required} required, 
                  {metrics.details.properties.optional} optional)
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 mt-4">
            <Label>Template Analysis Comments</Label>
            <Textarea
              value={systemAnalysisComments}
              onChange={handleSystemAnalysisCommentsChange}
              rows={4}
              placeholder="Add your observations about the template analysis..."
            />
          </div>
        </Alert>
      </Card>
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
      {isComplete && (
        <Button
          onClick={onNext}
          className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const renderContent = () => {
    if (editMode) {
      return (
        <BaseEvaluationSection
          title="Template Analysis"
          description="Please evaluate the template selection and adaptation before seeing the metrics."
          fields={[
            { 
              id: 'templateSelection',
              label: 'Template Selection',
              help: 'Is the selected template appropriate for the paper?'
            },
            {
              id: 'propertyStructure',
              label: 'Property Structure',
              help: 'Are the properties well-organized and relevant?'
            },
            {
              id: 'adaptability',
              label: 'Template Adaptability',
              help: 'How well was the template adapted to this specific paper?'
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
          <h2 className="text-2xl font-bold mb-2">Template Analysis Results</h2>
          <p className="text-gray-600">
            Review the analysis of the selected template and its properties.
          </p>
        </div>
        {renderMetrics()}
      </>
    );
  };

  const renderToggleButton = () => {
    if (!showMetrics) return null;

    const buttonContent = (
      <Button
        variant={editMode ? "ghost" : "ghost"}
        onClick={toggleEditMode}
        disabled={editMode && !isComplete}
        className={`mb-4 flex items-center gap-2 text-white p-2 rounded-md 
          ${editMode ? "!bg-[#E86161] hover:!bg-[#c54545]" : "!bg-[#E86161] hover:!bg-[#c54545]"}`}
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
      {renderNavigationButtons()}
    </div>
  );
};

export default TemplateAnalysisSection;
