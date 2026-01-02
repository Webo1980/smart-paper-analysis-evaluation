import React, { useCallback } from 'react';
import { Button } from '../../../ui/button';
import { FileText } from 'lucide-react';
import { BaseEvaluationSection } from '../../base/BaseEvaluationSection';
import TemplatePredictionsTable from './TemplatePredictionsTable';
import { EVALUATION_FIELDS } from '../config/templateConfig';

const TemplateEvaluationForm = ({
  userAssessment = {},
  handleAssessmentChange,
  isComplete,
  onShowComparison,
  orkgData,
  evaluationData
}) => {
  // Determine if we have ORKG template reference or using research problem
  const referenceData = orkgData?.template || null;
  const isOrkgScenario = !!referenceData;
  
  // Get template data
  const templateData = evaluationData?.templates?.llm_template?.template || null;
  
  // Research problem for context (needed when no ORKG reference)
  const researchProblem = {
    title: evaluationData?.researchProblems?.researchProblem?.name || '',
    description: evaluationData?.researchProblems?.researchProblem?.description || '',
    field: evaluationData?.researchFields?.selectedField?.name || 
          evaluationData?.researchFields?.fields?.[0]?.name || ''
  };
  
  // Format the assessment data for form display
  const formattedAssessment = useCallback(() => {
    const result = {};
    
    EVALUATION_FIELDS.forEach(field => {
      if (typeof userAssessment[field.id] === 'number') {
        result[field.id] = {
          rating: userAssessment[field.id],
          comments: userAssessment[`${field.id}Comments`] || ''
        };
      } 
      else if (userAssessment[field.id] && typeof userAssessment[field.id] === 'object') {
        result[field.id] = userAssessment[field.id];
      }
      else {
        result[field.id] = { rating: 0, comments: '' };
      }
    });
    
    result.overall = {
      comments: userAssessment.overallComments || ''
    };
    
    return result;
  }, [userAssessment]);

  // Handle field changes
  const handleFieldChange = useCallback((fieldId, changes) => {
    if (fieldId === 'overall') {
      handleAssessmentChange({
        overallComments: changes.comments
      });
    } else {
      handleAssessmentChange({
        [fieldId]: changes.rating,
        [`${fieldId}Comments`]: changes.comments
      });
    }
  }, [handleAssessmentChange]);

  // Check if all fields are rated
  const allFieldsRated = EVALUATION_FIELDS.every(
    field => formattedAssessment()[field.id]?.rating > 0
  );

  // Handle view report button click
  const handleButtonClick = (e) => {
    e.preventDefault();
    if (typeof onShowComparison === 'function') {
      onShowComparison();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Template Evaluation Assessment</h2>
      <p className="text-gray-600 mb-6">
        Please evaluate the template quality and accuracy based on your expertise.
      </p>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Template Comparison</h3>
        <TemplatePredictionsTable 
          templateData={templateData}
          referenceData={isOrkgScenario ? referenceData : researchProblem}
          selectedTemplate={isOrkgScenario ? referenceData?.id : null}
        />
      </div>
      
      <BaseEvaluationSection
        title="Template Evaluation"
        description={`Rate each aspect of the template ${isOrkgScenario ? 'compared to the ORKG reference' : 'based on the research problem'}`}
        fields={EVALUATION_FIELDS}
        data={formattedAssessment()}
        onChange={handleFieldChange}
        isComplete={isComplete}
      />

      <div className="mt-6 flex justify-end">
        {allFieldsRated && (
          <Button
            onClick={handleButtonClick}
            className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-2 p-2 rounded-md"
            data-testid="view-report-button"
            type="button"
          >
            <FileText className="h-4 w-4" />
            View Assessment Report
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TemplateEvaluationForm);