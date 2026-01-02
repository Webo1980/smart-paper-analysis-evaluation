import React, { useState, useEffect } from 'react';
import { BaseEvaluationSection } from './base/BaseEvaluationSection';
import { useEvaluation } from '../../context/EvaluationContext';
import { NavigationButtons } from '../evaluation/base';
import { storeFieldMetrics, getFieldMetrics, getDomainMetrics } from './base/utils/storageUtils';

export const SystemPerformanceSection = ({ onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();
  
  // Initialize with existing data from localStorage or defaults
  const [localAssessment, setLocalAssessment] = useState(() => {
    // First, try to get from localStorage
    const storedMetrics = getDomainMetrics('systemPerformance', 'systemPerformance');
    
    // If we have stored data, use it
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      return storedMetrics;
    }
    
    // Otherwise, check evaluationState or use defaults
    return evaluationState.systemPerformance?.assessment || {
      responsiveness: { rating: 0, comments: '' },
      errors: { rating: 0, comments: '' },
      stability: { rating: 0, comments: '' },
      overall: { rating: 0, comments: '' }
    };
  });
  
  const [isComplete, setIsComplete] = useState(false);
  const [showMetrics, setShowMetrics] = useState(evaluationState.systemPerformance?.showMetrics || false);

  // Direct field change handler with explicit state update
  const handleFieldChange = (fieldId, changes) => {
    // Update local state directly and immediately
    const updatedAssessment = {
      ...localAssessment,
      [fieldId]: changes
    };
    
    setLocalAssessment(updatedAssessment);
    
    // Save individual field to localStorage immediately
    storeFieldMetrics(
      fieldId,
      'systemPerformance',
      changes,
      'systemPerformance'
    );
    
    // Also save the complete assessment
    saveCompleteAssessment(updatedAssessment);
  };

  // Function to save the complete assessment to localStorage
  const saveCompleteAssessment = (assessment) => {
    // Save each field
    Object.keys(assessment).forEach(fieldId => {
      storeFieldMetrics(
        fieldId,
        'systemPerformance',
        assessment[fieldId],
        'systemPerformance'
      );
    });
  };

  // Check completeness and save whenever assessment changes
  useEffect(() => {
    const allFieldsRated = ['responsiveness', 'errors', 'stability'].every(
      field => localAssessment[field]?.rating > 0
    );
    
    setIsComplete(allFieldsRated);
    
    if (allFieldsRated && !showMetrics) {
      setShowMetrics(true);
    }
    
    // Calculate overall score based on field ratings
    if (allFieldsRated) {
      const averageRating = ['responsiveness', 'errors', 'stability']
        .reduce((sum, field) => sum + localAssessment[field].rating, 0) / 3;
      
      const updatedOverall = {
        ...localAssessment.overall,
        rating: Math.round(averageRating)
      };
      
      if (updatedOverall.rating !== localAssessment.overall.rating) {
        const updatedAssessment = {
          ...localAssessment,
          overall: updatedOverall
        };
        
        setLocalAssessment(updatedAssessment);
        
        // Save overall to localStorage
        storeFieldMetrics(
          'overall',
          'systemPerformance',
          updatedOverall,
          'systemPerformance'
        );
      }
    }
    
    // Update global evaluationState (for backwards compatibility)
    updateSection('systemPerformance', { 
      assessment: localAssessment,
      showMetrics: allFieldsRated ? true : showMetrics,
      completed: allFieldsRated
    });
  }, [localAssessment, showMetrics, updateSection]);

  // Load metrics from localStorage on mount
  useEffect(() => {
    const storedMetrics = getDomainMetrics('systemPerformance', 'systemPerformance');
    
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      setLocalAssessment(storedMetrics);
      
      // Check if we should show metrics
      const allFieldsRated = ['responsiveness', 'errors', 'stability'].every(
        field => storedMetrics[field]?.rating > 0
      );
      
      if (allFieldsRated) {
        setShowMetrics(true);
        setIsComplete(true);
      }
    }
  }, []);

  return (
    <div className="space-y-4">
      <BaseEvaluationSection
        title="System Performance"
        description="Please evaluate the system performance by rating the following aspects."
        fields={[
          { 
            id: 'responsiveness',
            label: 'System Responsiveness',
            help: 'How responsive was the system during use?'
          },
          {
            id: 'errors',
            label: 'Error Handling',
            help: 'How well did the system handle errors and issues?'
          },
          {
            id: 'stability',
            label: 'System Stability',
            help: 'How stable was the system throughout the process?'
          }
        ]}
        data={localAssessment}
        onChange={handleFieldChange}
        isComplete={isComplete}
      />
      
      <NavigationButtons 
        onPrevious={onPrevious} 
        onNext={onNext} 
        nextDisabled={!isComplete}
      />
    </div>
  );
};

export default SystemPerformanceSection;