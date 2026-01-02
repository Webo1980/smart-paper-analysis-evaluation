// src/components/evaluation/research-field/views/ResearchFieldReportView.jsx
import React from 'react';
import ResearchFieldEvaluationReport from '../components/ResearchFieldEvaluationReport';

const ResearchFieldReportView = ({
  finalAssessment,
  onEditAssessment,
  orkgData,
  evaluationData,
  userInfo,
  config
}) => {
  return (
    <ResearchFieldEvaluationReport
      finalAssessment={finalAssessment}
      orkgData={orkgData}
      evaluationData={evaluationData}
      userInfo={userInfo}
      onEditAssessment={onEditAssessment}
      config={config}
    />
  );
};

export default ResearchFieldReportView;