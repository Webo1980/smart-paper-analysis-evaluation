import React, { useState, useEffect } from 'react';
import { BaseEvaluationSection } from './base/BaseEvaluationSection';
import { useEvaluation } from '../../context/EvaluationContext';
import { Card } from '../ui/card';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { storeFieldMetrics, getFieldMetrics, getDomainMetrics } from './base/utils/storageUtils';

export const ComparativeAnalysisSection = ({ onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();
  
  // Initialize with existing data from localStorage or defaults
  const [localAssessment, setLocalAssessment] = useState(() => {
    // First, try to get from localStorage
    const storedMetrics = getDomainMetrics('comparativeAnalysis', 'comparativeAnalysis');
    
    // If we have stored data, use it
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      return storedMetrics;
    }
    
    // Otherwise, check evaluationState or use defaults
    return evaluationState.comparativeAnalysis?.assessment || {
      efficiency: { rating: 0, comments: '' },
      quality: { rating: 0, comments: '' },
      completeness: { rating: 0, comments: '' },
      overall: { rating: 0, comments: '' }
    };
  });
  
  const [isComplete, setIsComplete] = useState(false);
  const [showMetrics, setShowMetrics] = useState(
    evaluationState.comparativeAnalysis?.showMetrics || false
  );

  // Handle field changes directly with proper state preservation
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
      'comparativeAnalysis',
      changes,
      'comparativeAnalysis'
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
        'comparativeAnalysis',
        assessment[fieldId],
        'comparativeAnalysis'
      );
    });
  };

  // Check completeness and save whenever assessment changes
  useEffect(() => {
    // Check if all ratings are complete (excluding overall)
    const allFieldsRated = ['efficiency', 'quality', 'completeness'].every(
      field => localAssessment[field]?.rating > 0
    );
    
    setIsComplete(allFieldsRated);
    
    // If all required fields are rated, show metrics
    if (allFieldsRated && !showMetrics) {
      setShowMetrics(true);
    }
    
    // Calculate overall score based on field ratings
    if (allFieldsRated) {
      const averageRating = ['efficiency', 'quality', 'completeness']
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
          'comparativeAnalysis',
          updatedOverall,
          'comparativeAnalysis'
        );
      }
    }
    
    // Update global evaluationState (for backwards compatibility)
    updateSection('comparativeAnalysis', {
      assessment: localAssessment,
      showMetrics: allFieldsRated ? true : showMetrics,
      completed: allFieldsRated
    });
  }, [localAssessment, showMetrics, updateSection]);

  // Load metrics from localStorage on mount
  useEffect(() => {
    const storedMetrics = getDomainMetrics('comparativeAnalysis', 'comparativeAnalysis');
    
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      setLocalAssessment(storedMetrics);
      
      // Check if we should show metrics
      const allFieldsRated = ['efficiency', 'quality', 'completeness'].every(
        field => storedMetrics[field]?.rating > 0
      );
      
      if (allFieldsRated) {
        setShowMetrics(true);
        setIsComplete(true);
      }
    }
  }, []);

  // Calculate comparison metrics
  const calculateComparisonMetrics = () => {
    const ratings = {
      efficiency: localAssessment.efficiency.rating || 0,
      quality: localAssessment.quality.rating || 0,
      completeness: localAssessment.completeness.rating || 0
    };

    const scores = {
      efficiency: (ratings.efficiency / 5) * 100,
      quality: (ratings.quality / 5) * 100,
      completeness: (ratings.completeness / 5) * 100
    };

    const overallScore = Math.round(
      Object.values(scores).reduce((sum, score) => sum + score, 0) / 3
    );

    // Calculate improvement percentage (vs traditional ORKG = baseline 3/5)
    const baseline = 3;
    const improvements = {
      efficiency: ((ratings.efficiency - baseline) / baseline) * 100,
      quality: ((ratings.quality - baseline) / baseline) * 100,
      completeness: ((ratings.completeness - baseline) / baseline) * 100
    };

    return { scores, overallScore, ratings, improvements };
  };

  return (
    <div className="space-y-4">
      <BaseEvaluationSection
        title="Comparative Analysis"
        description="Compare with traditional ORKG workflow."
        fields={[
          { id: 'efficiency', label: 'Time Efficiency', help: 'How much time is saved compared to manual work?' },
          { id: 'quality', label: 'Output Quality', help: 'How does the output quality compare?' },
          { id: 'completeness', label: 'Completeness', help: 'How complete is the extraction compared to manual work?' }
        ]}
        data={localAssessment}
        onChange={handleFieldChange}
        isComplete={isComplete}
      />
      
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
    </div>
  );
};

export default ComparativeAnalysisSection;