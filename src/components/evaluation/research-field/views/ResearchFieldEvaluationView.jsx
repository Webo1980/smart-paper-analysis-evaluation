// src/components/evaluation/research-field/views/ResearchFieldEvaluationView.jsx
import React from 'react';
import ResearchFieldEvaluationForm from '../components/ResearchFieldEvaluationForm';

const ResearchFieldEvaluationView = ({
  userAssessment,
  handleAssessmentChange,
  isComplete,
  onShowComparison,
  orkgData,
  evaluationData
}) => {
  
  return (
    <ResearchFieldEvaluationForm
      userAssessment={userAssessment}
      handleAssessmentChange={handleAssessmentChange}
      isComplete={isComplete}
      onShowComparison={onShowComparison}
      orkgData={orkgData}
      evaluationData={evaluationData}
    />
  );
};

export default ResearchFieldEvaluationView;