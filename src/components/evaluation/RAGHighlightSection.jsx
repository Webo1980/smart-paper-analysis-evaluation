import React, { useState, useEffect, useCallback } from 'react';
import { BaseEvaluationSection } from './base/BaseEvaluationSection';
import { useEvaluation } from '../../context/EvaluationContext';
import { Card } from '../ui/card';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { NavigationButtons } from './base';
import { storeFieldMetrics, getFieldMetrics, getDomainMetrics } from './base/utils/storageUtils';

export const RAGHighlightSection = ({ evaluationData, onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();
  
  // Initialize with existing data from localStorage or defaults
  const [assessment, setAssessment] = useState(() => {
    // First, try to get from localStorage
    const storedMetrics = getDomainMetrics('ragHighlight', 'ragHighlight');
    
    // If we have stored data, use it
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      return storedMetrics;
    }
    
    // Otherwise, check evaluationState or use defaults
    return evaluationState.ragHighlight?.assessment || {
      highlightAccuracy: { rating: 0, comments: '' },
      navigationFunctionality: { rating: 0, comments: '' },
      manualHighlight: { rating: 0, comments: '' },
      contextPreservation: { rating: 0, comments: '' },
      visualClarity: { rating: 0, comments: '' },
      responseTime: { rating: 0, comments: '' },
      overall: { comments: '' }
    };
  });

  const [showMetrics, setShowMetrics] = useState(() => evaluationState.ragHighlight?.showMetrics ?? false);
  const [editMode, setEditMode] = useState(() => !evaluationState.ragHighlight?.showMetrics);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const isComplete = Object.entries(assessment)
    .filter(([field]) => field !== 'overall')
    .every(([_, value]) => value.rating > 0);

  // Function to save the complete assessment to localStorage
  const saveCompleteAssessment = (assessmentData) => {
    // Save each field
    Object.keys(assessmentData).forEach(fieldId => {
      storeFieldMetrics(
        fieldId,
        'ragHighlight',
        assessmentData[fieldId],
        'ragHighlight'
      );
    });
  };

  // Load metrics from localStorage on mount
  useEffect(() => {
    const storedMetrics = getDomainMetrics('ragHighlight', 'ragHighlight');
    
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      setAssessment(storedMetrics);
      
      // Check if we should show metrics
      const allFieldsRated = Object.entries(storedMetrics)
        .filter(([field]) => field !== 'overall')
        .every(([_, value]) => value.rating > 0);
      
      if (allFieldsRated) {
        setShowMetrics(true);
        setEditMode(false);
      }
    }
  }, []);

  // Update evaluationState with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      const newState = {
        assessment,
        showMetrics,
        editMode,
        isComplete
      };

      if (JSON.stringify(evaluationState.ragHighlight) !== JSON.stringify(newState)) {
        updateSection('ragHighlight', newState);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assessment, showMetrics, editMode, isComplete]);

  useEffect(() => {
    if (evaluationState.ragHighlight?.editMode !== undefined) {
      setEditMode(evaluationState.ragHighlight.editMode);
    }
  }, [evaluationState.ragHighlight?.editMode]);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
    setShowMetrics(prev => !prev);
  }, []);

  const handleAssessmentChange = useCallback((field, value) => {
    const newAssessment = { ...assessment, [field]: value };
    setAssessment(newAssessment);
    
    // Save individual field to localStorage immediately
    storeFieldMetrics(
      field,
      'ragHighlight',
      value,
      'ragHighlight'
    );
    
    // Also save the complete assessment
    saveCompleteAssessment(newAssessment);
  }, [assessment]);

  const handleSubmit = useCallback(() => {
    if (isComplete) {
      setShowMetrics(true);
      setEditMode(false);
      
      // Save the final state
      saveCompleteAssessment(assessment);
    }
  }, [isComplete, assessment]);

  const calculateHighlightMetrics = () => {
    const ratings = {
      highlightAccuracy: assessment.highlightAccuracy.rating || 0,
      navigationFunctionality: assessment.navigationFunctionality.rating || 0,
      manualHighlight: assessment.manualHighlight.rating || 0,
      contextPreservation: assessment.contextPreservation.rating || 0,
      visualClarity: assessment.visualClarity.rating || 0,
      responseTime: assessment.responseTime.rating || 0
    };

    const scores = {
      highlightAccuracy: (ratings.highlightAccuracy / 5) * 100,
      navigationFunctionality: (ratings.navigationFunctionality / 5) * 100,
      manualHighlight: (ratings.manualHighlight / 5) * 100,
      contextPreservation: (ratings.contextPreservation / 5) * 100,
      visualClarity: (ratings.visualClarity / 5) * 100,
      responseTime: (ratings.responseTime / 5) * 100
    };

    const overallScore = Math.round(
      (scores.highlightAccuracy * 0.25) +
      (scores.navigationFunctionality * 0.20) +
      (scores.manualHighlight * 0.15) +
      (scores.contextPreservation * 0.15) +
      (scores.visualClarity * 0.15) +
      (scores.responseTime * 0.10)
    );

    // Calculate and save weighted overall to localStorage
    const weightedOverallRating = Math.round(
      (ratings.highlightAccuracy * 0.25) +
      (ratings.navigationFunctionality * 0.20) +
      (ratings.manualHighlight * 0.15) +
      (ratings.contextPreservation * 0.15) +
      (ratings.visualClarity * 0.15) +
      (ratings.responseTime * 0.10)
    );

    // Save overall if changed
    if (weightedOverallRating !== assessment.overall?.rating) {
      const updatedOverall = {
        ...assessment.overall,
        rating: weightedOverallRating
      };
      
      storeFieldMetrics(
        'overall',
        'ragHighlight',
        updatedOverall,
        'ragHighlight'
      );
    }

    return { scores, overallScore, ratings };
  };

  const renderMetrics = () => {
    if (!showMetrics) return null;

    try {
      const metrics = calculateHighlightMetrics();

      return (
        <Card className="mt-6">
          <Alert className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Extension Highlight System Analysis</h4>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs text-gray-600 underline hover:text-gray-900"
                  onClick={() => setShowScoreInfo(!showScoreInfo)}
                >
                  {showScoreInfo ? 'Hide Score Info' : 'Show Score Info'}
                </button>
                <Badge 
                  className={metrics.overallScore >= 70 ? "bg-green-500" : 
                          metrics.overallScore >= 50 ? "bg-yellow-500" : "bg-red-500"}
                >
                  Score: {metrics.overallScore}%
                </Badge>
              </div>
            </div>
            
            {showScoreInfo && (
              <div className="mb-4 text-sm bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-2">Score Calculation (Weighted):</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>
                    <span className="font-medium">Highlight Accuracy (25%):</span>
                    <div className="text-gray-600">
                      Rating: {metrics.ratings.highlightAccuracy}/5 ({metrics.scores.highlightAccuracy.toFixed(1)}%)
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">Navigation Functionality (20%):</span>
                    <div className="text-gray-600">
                      Rating: {metrics.ratings.navigationFunctionality}/5 ({metrics.scores.navigationFunctionality.toFixed(1)}%)
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">Manual Highlight (15%):</span>
                    <div className="text-gray-600">
                      Rating: {metrics.ratings.manualHighlight}/5 ({metrics.scores.manualHighlight.toFixed(1)}%)
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">Context Preservation (15%):</span>
                    <div className="text-gray-600">
                      Rating: {metrics.ratings.contextPreservation}/5 ({metrics.scores.contextPreservation.toFixed(1)}%)
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">Visual Clarity (15%):</span>
                    <div className="text-gray-600">
                      Rating: {metrics.ratings.visualClarity}/5 ({metrics.scores.visualClarity.toFixed(1)}%)
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">Response Time (10%):</span>
                    <div className="text-gray-600">
                      Rating: {metrics.ratings.responseTime}/5 ({metrics.scores.responseTime.toFixed(1)}%)
                    </div>
                  </li>
                </ul>
                <div className="mt-3 pt-2 border-t text-gray-600">
                  Overall score is a weighted average based on importance of each component
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="font-medium text-sm mb-2">Performance Insights:</p>
              <div className="text-sm text-gray-700 space-y-1">
                {metrics.scores.highlightAccuracy < 60 && (
                  <p>⚠️ Highlight accuracy needs improvement</p>
                )}
                {metrics.scores.navigationFunctionality < 60 && (
                  <p>⚠️ Navigation functionality could be enhanced</p>
                )}
                {metrics.scores.manualHighlight < 60 && (
                  <p>⚠️ Manual highlighting feature needs attention</p>
                )}
                {metrics.overallScore >= 80 && (
                  <p>✅ Excellent Extension highlight system performance</p>
                )}
              </div>
            </div>
          </Alert>
        </Card>
      );
    } catch (error) {
      return (
        <Card className="mt-6">
          <Alert>
            <h4 className="font-medium">Error</h4>
            <p>An error occurred while analyzing Extension highlight system.</p>
          </Alert>
        </Card>
      );
    }
  };

  const renderContent = () => {
    if (editMode) {
      return (
        <>
          <BaseEvaluationSection
            title="Extension Highlight System Evaluation"
            description="Please evaluate the extension highlight system by rating the following aspects."
            fields={[
              { 
                id: 'highlightAccuracy',
                label: 'Highlight Accuracy',
                description: 'How accurately did the system identify and highlight relevant content from the retrieved documents?'
              },
              {
                id: 'navigationFunctionality',
                label: 'Navigation to Highlights',
                description: 'How easy was it to navigate between different highlighted sections?'
              },
              {
                id: 'manualHighlight',
                label: 'Manual Highlight Feature',
                description: 'How well did the manual highlighting feature work when you wanted to mark specific content?'
              },
              {
                id: 'contextPreservation',
                label: 'Context Preservation',
                description: 'Did the highlights maintain proper context around the relevant information?'
              },
              {
                id: 'visualClarity',
                label: 'Visual Clarity',
                description: 'How clear and distinguishable were the highlights from regular text?'
              },
              {
                id: 'responseTime',
                label: 'Response Time',
                description: 'How quickly did the system highlight content after your queries?'
              }
            ]}
            data={assessment}
            onChange={handleAssessmentChange}
            isComplete={isComplete}
          />
        </>
      );
    }

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Extension Highlight System Results</h2>
          <p className="text-gray-600">Review the extension highlight system analysis.</p>
          <button
            onClick={toggleEditMode}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            ← Edit Assessment
          </button>
        </div>
        {renderMetrics()}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {renderContent()}
      <NavigationButtons 
        onPrevious={onPrevious} 
        onNext={onNext} 
        nextDisabled={!isComplete}
      />
    </div>
  );
};

export default RAGHighlightSection;