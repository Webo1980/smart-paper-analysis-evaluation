import React, { useState, useEffect } from 'react';
import { BaseEvaluationSection } from './base/BaseEvaluationSection';
import { useEvaluation } from '../../context/EvaluationContext';
import { Card } from '../ui/card';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { NavigationButtons } from '../evaluation/base';
import { storeFieldMetrics, getFieldMetrics, getDomainMetrics } from './base/utils/storageUtils';

export const InnovationSection = ({ onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();
  
  // Initialize with existing data from localStorage or defaults
  const [localAssessment, setLocalAssessment] = useState(() => {
    // First, try to get from localStorage
    const storedMetrics = getDomainMetrics('innovation', 'innovation');
    
    // If we have stored data, use it
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      return storedMetrics;
    }
    
    // Otherwise, check evaluationState or use defaults
    return evaluationState.innovation?.assessment || {
      novelty: { rating: 0, comments: '' },
      usability: { rating: 0, comments: '' },
      impact: { rating: 0, comments: '' },
      overall: { rating: 0, comments: '' }
    };
  });
  
  const [isComplete, setIsComplete] = useState(false);
  const [showMetrics, setShowMetrics] = useState(evaluationState.innovation?.showMetrics || false);

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
      'innovation',
      changes,
      'innovation'
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
        'innovation',
        assessment[fieldId],
        'innovation'
      );
    });
  };

  // Check completeness and save whenever assessment changes
  useEffect(() => {
    const allFieldsRated = ['novelty', 'usability', 'impact'].every(
      field => localAssessment[field]?.rating > 0
    );
    
    setIsComplete(allFieldsRated);
    
    if (allFieldsRated && !showMetrics) {
      setShowMetrics(true);
    }
    
    // Calculate overall score based on field ratings
    if (allFieldsRated) {
      const averageRating = ['novelty', 'usability', 'impact']
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
          'innovation',
          updatedOverall,
          'innovation'
        );
      }
    }
    
    // Update global evaluationState (for backwards compatibility)
    updateSection('innovation', { 
      assessment: localAssessment,
      showMetrics: allFieldsRated ? true : showMetrics,
      completed: allFieldsRated
    });
  }, [localAssessment, showMetrics, updateSection]);

  // Load metrics from localStorage on mount
  useEffect(() => {
    const storedMetrics = getDomainMetrics('innovation', 'innovation');
    
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      setLocalAssessment(storedMetrics);
      
      // Check if we should show metrics
      const allFieldsRated = ['novelty', 'usability', 'impact'].every(
        field => storedMetrics[field]?.rating > 0
      );
      
      if (allFieldsRated) {
        setShowMetrics(true);
        setIsComplete(true);
      }
    }
  }, []);

  // Rating calculation and metrics rendering logic
  const calculateInnovationMetrics = () => {
    const ratings = {
      novelty: localAssessment.novelty.rating || 0,
      usability: localAssessment.usability.rating || 0,
      impact: localAssessment.impact.rating || 0
    };

    const scores = {
      novelty: (ratings.novelty / 5) * 100,
      usability: (ratings.usability / 5) * 100,
      impact: (ratings.impact / 5) * 100
    };

    const overallScore = Math.round(
      Object.values(scores).reduce((sum, score) => sum + score, 0) / 3
    );

    return { scores, overallScore, ratings };
  };

  return (
    <div className="space-y-4">
      <BaseEvaluationSection
        title="Innovation Assessment"
        description="Evaluate the innovative aspects and potential impact."
        fields={[
          { id: 'novelty', label: 'Novelty', help: 'How novel is the approach compared to existing solutions?' },
          { id: 'usability', label: 'Usability', help: 'How user-friendly and practical is the system?' },
          { id: 'impact', label: 'Research Impact', help: 'What is the potential impact on research workflows?' }
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

export default InnovationSection;