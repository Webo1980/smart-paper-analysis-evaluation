import React, { useCallback } from 'react';
import { Button } from '../../../ui/button';
import { FileText } from 'lucide-react';
import { BaseEvaluationSection } from '../../base/BaseEvaluationSection';
import ResearchFieldPredictionsTable from './ResearchFieldPredictionsTable';
import { EVALUATION_FIELDS } from '../config/researchFieldConfig';

const ResearchFieldEvaluationForm = ({
  userAssessment = {},
  handleAssessmentChange,
  isComplete,
  onShowComparison,
  orkgData,
  evaluationData
}) => {
  const groundTruth = orkgData?.research_field_name || '';
  const selectedField = evaluationData?.researchFields?.selectedField?.name || null;
  const predictions = evaluationData?.researchFields?.fields || [];
  
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

  const allFieldsRated = EVALUATION_FIELDS.every(
    field => formattedAssessment()[field.id]?.rating > 0
  );

  const handleButtonClick = (e) => {
    e.preventDefault();
    if (typeof onShowComparison === 'function') {
      onShowComparison();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Research Field Detection Assessment</h2>
      <p className="text-gray-600 mb-6">
        Please evaluate the research field detection based on your expertise.
      </p>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Ground Truth vs Predictions</h3>
        <ResearchFieldPredictionsTable 
          groundTruth={groundTruth}
          predictions={predictions}
          selectedResearchField={selectedField}
        />
      </div>
      
      <BaseEvaluationSection
        title="Research Field Evaluation"
        description="Rate each aspect of the research field detection"
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
            type="button" // Explicitly set type to prevent form submission
          >
            <FileText className="h-4 w-4" />
            View Assessment Report
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ResearchFieldEvaluationForm);