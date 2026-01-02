// src/components/evaluation/metadata/MetadataAnalysisSection.jsx
import React from 'react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { useForm } from '../../../context/FormContext';
import { metadataFieldsData } from './constants/metadataFields';
import MetadataEvaluationView from './views/MetadataEvaluationView';
import MetadataReportView from './views/MetadataReportView';
import { FIELD_MAPPINGS } from './constants/metadataFields';
import { METADATA_CONFIG } from './config/metadataConfig';

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
 * Main component for metadata analysis section
 * Uses domain-specific configuration for consistent metrics
 */
const MetadataAnalysisSection = ({ onNext, onPrevious, userInfo }) => {
  const { evaluationState, updateSection } = useEvaluation();
  const { evaluationData, orkgData } = useForm();
  
  // Get the current state for this section
  const sectionState = evaluationState.metadata || {};
  
  // Prepare metadata data
  const metadataData = {
    evaluationData: evaluationData || {},
    orkgData: orkgData || {}
  };
  
  // Calculate the expertise multiplier using centralized utility
  const expertiseMultiplier = expertiseToMultiplier(userInfo?.expertiseWeight || 5);
  
  // Update METADATA_CONFIG with field mappings
  const metadataConfig = {
    ...METADATA_CONFIG,
    fieldMappings: FIELD_MAPPINGS
  };
  
  // Generate final assessment with expertise-weighted metrics using centralized function
  const generateMetadataAssessment = (userAssessment) => {
    return generateFinalAssessment(
      userAssessment,
      orkgData || {},
      evaluationData || {},
      metadataConfig,
      expertiseMultiplier,
      'metadata',
      metadataFieldsData
    );
  };
  
  // This function renders the appropriate view based on the showComparison state
  const renderView = (props) => {
    if (!props.showComparison) {
      return <MetadataEvaluationView {...props} />;
    } else {
      return (
        <MetadataReportView 
          {...props} 
          metadataConfig={metadataConfig} 
          expertiseMultiplier={expertiseMultiplier}
          evaluationFields={props.finalAssessment} // Pass the actual evaluation data
          fields={Object.keys(FIELD_MAPPINGS)}
        />
      );
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 relative">
        <BaseAssessmentManager
          initialData={{}}
          sectionKey="metadata"
          fieldDefinitions={metadataFieldsData}
          userInfo={{
            ...userInfo,
            expertiseMultiplier
          }}
          showComparison={sectionState.showComparison || false}
          setShowComparison={(show) => updateSection('metadata', { showComparison: show })}
          evaluationState={evaluationState}
          updateSection={updateSection}
          generateFinalAssessment={generateMetadataAssessment}
          renderView={(props) => renderView({ 
            ...props, 
            metadataData,
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

export default MetadataAnalysisSection;