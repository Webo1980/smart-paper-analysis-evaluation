// src/components/evaluation/researchField/ResearchFieldAnalysisSection.jsx
import React from 'react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { useForm } from '../../../context/FormContext';
import { RESEARCH_FIELD_CONFIG } from './config/researchFieldConfig';
import ResearchFieldEvaluationView from './views/ResearchFieldEvaluationView';
import ResearchFieldReportView from './views/ResearchFieldReportView';
import  RESEARCH_FIELD_METRICS  from './config/researchFieldConfig';

// Import centralized utilities
import { 
  expertiseToMultiplier
} from '../base/utils/baseMetricsUtils';

import {
  generateFinalAssessment
} from '../base/utils/evaluationUtils';

import { 
  BaseAssessmentManager, 
  NavigationButtons 
} from '../base';

/**
 * Main component for research field analysis section
 * Uses domain-specific configuration for consistent metrics
 */
const ResearchFieldAnalysisSection = ({ onNext, onPrevious, userInfo }) => {
  const { evaluationState, updateSection } = useEvaluation();
  const { evaluationData, orkgData } = useForm();
  
  // Get the current state for this section
  const sectionState = evaluationState.research_field || {};
  
  // Calculate the expertise multiplier using centralized utility
  const expertiseMultiplier = expertiseToMultiplier(userInfo?.expertiseWeight || 5);
  
  // Convert RESEARCH_FIELD_METRICS object to array for BaseAssessmentManager
  const fieldDefinitionsArray = Object.values(RESEARCH_FIELD_METRICS);
  
  // Generate final assessment with expertise-weighted metrics using centralized function
  const generateResearchFieldAssessment = (userAssessment) => {
    return generateFinalAssessment(
      userAssessment,
      orkgData || {},
      evaluationData || {},
      RESEARCH_FIELD_CONFIG,
      expertiseMultiplier,
      'research_field',
      RESEARCH_FIELD_METRICS
    );
  };
  
  // Handle showing the comparison view
  const handleShowComparison = (userAssessment) => {
    const finalAssessment = generateResearchFieldAssessment(userAssessment);
    updateSection('research_field', {
      finalAssessment,
      showComparison: true,
      isComplete: true
    });
  };
  
  // This function renders the appropriate view based on the showComparison state
  const renderView = (props) => {
    if (!props.showComparison) {
      return <ResearchFieldEvaluationView {...props} />;
    } else {
      return <ResearchFieldReportView {...props} config={RESEARCH_FIELD_CONFIG} />;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 relative">
        <BaseAssessmentManager
          initialData={{}}
          sectionKey="research_field"
          fieldDefinitions={fieldDefinitionsArray}
          userInfo={{
            ...userInfo,
            expertiseMultiplier
          }}
          showComparison={sectionState.showComparison || false}
          setShowComparison={(show) => updateSection('research_field', { showComparison: show })}
          evaluationState={evaluationState}
          updateSection={updateSection}
          generateFinalAssessment={generateResearchFieldAssessment}
          onShowComparison={handleShowComparison}
          renderView={(props) => renderView({ 
            ...props, 
            orkgData: orkgData || {},
            evaluationData: evaluationData || {},
            showComparison: sectionState.showComparison || false
          })}
        />
      </div>
      
      <NavigationButtons 
        onPrevious={onPrevious} 
        onNext={onNext} 
        showNext={sectionState.showComparison} 
      />
    </div>
  );
};

export default ResearchFieldAnalysisSection;