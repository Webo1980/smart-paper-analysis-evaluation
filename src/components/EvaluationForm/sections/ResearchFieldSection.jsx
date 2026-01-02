import React, { useState, useEffect, useCallback } from 'react';
import { BaseEvaluationSection } from '../../evaluation/base/BaseEvaluationSection';
import { Card } from '../../ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { Tooltip } from '../../ui/tooltip';

export const ResearchFieldSection = ({ evaluationData, orkgPaperData, onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();
  const [showMetrics, setShowMetrics] = useState(() => evaluationState.researchField?.showMetrics ?? false);
  const [editMode, setEditMode] = useState(() => !evaluationState.researchField?.showMetrics);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [analysisComments, setAnalysisComments] = useState(
    evaluationState.researchField?.analysisComments || ''
  );
  
  const [assessment, setAssessment] = useState(() => 
    evaluationState.researchField?.assessment || {
      fieldClassification: { rating: 0, comments: '' },
      confidenceScores: { rating: 0, comments: '' },
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
        analysisComments,
        predictions: evaluationData?.researchFields?.fields || [],
        selectedField: orkgPaperData?.research_field_name
      };

      if (JSON.stringify(evaluationState.researchField) !== JSON.stringify(newState)) {
        updateSection('researchField', newState);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assessment, showMetrics, editMode, isComplete, analysisComments, evaluationData, orkgPaperData]);

  useEffect(() => {
    if (evaluationState.researchField?.editMode !== undefined) {
      setEditMode(evaluationState.researchField.editMode);
    }
  }, [evaluationState.researchField?.editMode]);

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

  const handleCommentChange = useCallback((comments) => {
    setAnalysisComments(comments);
  }, []);

  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        {isComplete && (
          <Button
            onClick={onNext}
            className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderMetrics = () => {
    if (!showMetrics) return null;
    
    if (!evaluationData?.researchFields || !orkgPaperData?.research_field_name) {
      return (
        <Card className="mt-6">
          <Alert>
            <AlertTitle>Data Unavailable</AlertTitle>
            <AlertDescription>Research field data is not available for comparison.</AlertDescription>
          </Alert>
        </Card>
      );
    }

    try {
      const predictions = evaluationData.researchFields.fields.map(field => ({
        field: field.name,
        confidence: parseFloat((field.score * 10).toFixed(1)),
        correct: field.name === orkgPaperData.research_field_name
      }));

      const correctIndex = predictions.findIndex(p => p.correct);
      const positionScore = correctIndex === -1 ? 0 : (5 - correctIndex) * 20;
      const confidenceScore = predictions[correctIndex]?.confidence || 0;
      const score = Math.round((positionScore + confidenceScore) / 2);

      return (
        <Card className="mt-6">
          <Alert className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Classification Analysis</h4>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs text-gray-600 underline hover:text-gray-900"
                  onClick={() => setShowScoreInfo(!showScoreInfo)}
                >
                  {showScoreInfo ? 'Hide Score Info' : 'Show Score Info'}
                </button>
                <Badge className={score >= 70 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"}>
                  Score: {score}%
                </Badge>
              </div>
            </div>
            
            {showScoreInfo && (
              <div className="mb-4 text-sm bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-1">Score Calculation:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Position points: {positionScore}% (1st=100%, 2nd=80%, 3rd=60%, etc.)</li>
                  <li>Confidence points: {confidenceScore}% (actual confidence of correct prediction)</li>
                  <li>Final score: Average of position and confidence points</li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div>Top Prediction: {predictions[0].field}</div>
              <div>Confidence: {predictions[0].confidence}%</div>
              <div>Exact Match: {predictions[0].field === orkgPaperData.research_field_name ? '✓' : '✗'}</div>
              <div>In Top 5: {predictions.some(p => p.field === orkgPaperData.research_field_name) ? '✓' : '✗'}</div>
              {predictions.map((pred, i) => (
                <div key={i} className={pred.correct ? 'text-green-600' : 'text-gray-600'}>
                  {i + 1}. {pred.field} ({pred.confidence}%)
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label htmlFor="analysis-comments" className="block text-sm font-medium text-gray-700 mb-2">
                Comments on Research Field Analysis
              </label>
              <textarea
                id="analysis-comments"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Add your observations about the research field classification..."
                value={analysisComments}
                onChange={(e) => handleCommentChange(e.target.value)}
              />
            </div>
          </Alert>
        </Card>
      );
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return (
        <Card className="mt-6">
          <Alert>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>An error occurred while analyzing the research fields.</AlertDescription>
          </Alert>
        </Card>
      );
    }
  };

  const renderContent = () => {
    if (editMode) {
      return (
        <BaseEvaluationSection
          title="Research Field Classification"
          description="Please assess the research field classification before seeing the automatic analysis."
          fields={[
            { 
              id: 'fieldClassification',
              label: 'Field Classification Accuracy',
              help: 'How accurate is the top predicted research field?'
            },
            {
              id: 'confidenceScores',
              label: 'Confidence Scores',
              help: 'Are the confidence scores reasonable and well-calibrated?'
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
          <h2 className="text-2xl font-bold mb-2">Research Field Analysis Results</h2>
          <p className="text-gray-600">Review the analysis of research field classification.</p>
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
            Edit Assessment
          </>
        )}
      </Button>
    );

    if (editMode && !isComplete) {
      return (
        <Tooltip 
          content="The automatic analysis will be ready when all questions are answered"
        >
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

export default ResearchFieldSection;