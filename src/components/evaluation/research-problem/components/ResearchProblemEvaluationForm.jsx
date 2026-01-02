// src\components\evaluation\research-problem\components\ResearchProblemEvaluationForm.jsx
import React, { useCallback } from 'react';
import { Button } from '../../../ui/button';
import { FileText } from 'lucide-react';
import { BaseEvaluationSection } from '../../base/BaseEvaluationSection';
import ResearchProblemPreview from './ResearchProblemPreview';
import { EVALUATION_FIELDS } from '../config/researchProblemConfig';
import { extractGroundTruth, extractProblemFromEvalData } from '../utils/researchProblemMetrics';

const ResearchProblemEvaluationForm = ({
  userAssessment = {},
  handleAssessmentChange,
  isComplete,
  onShowComparison,
  evaluationData,
  useAbstract = true
}) => {
  // Extract ground truth and problem data
  const groundTruth = extractGroundTruth(evaluationData, useAbstract);
  const problemData = extractProblemFromEvalData(evaluationData);
  
  // Format assessment for the form
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
      comments: userAssessment.overallComments || userAssessment.comments || ''
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

  // For debugging
  const formattedData = formattedAssessment();
  console.log("Current assessment data:", formattedData);
  
  // Check each field's rating
  const fieldStatuses = EVALUATION_FIELDS.map(field => ({
    id: field.id,
    label: field.label,
    hasRating: formattedData[field.id]?.rating > 0,
    ratingValue: formattedData[field.id]?.rating
  }));
  
  console.log("Field rating statuses:", fieldStatuses);
  
  // Check if all fields are rated
  const allFieldsRated = EVALUATION_FIELDS.every(
    field => formattedData[field.id]?.rating > 0
  );
  
  console.log("All fields rated:", allFieldsRated);

  // Handle button click
  const handleButtonClick = (e) => {
    e.preventDefault();
    console.log("View Assessment button clicked");
    if (typeof onShowComparison === 'function') {
      onShowComparison();
    } else {
      console.error("onShowComparison is not a function");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Research Problem Assessment</h2>
      <p className="text-gray-600 mb-6">
        Please evaluate the research problem formulation based on your expertise.
      </p>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Research Problem Preview</h3>
        <ResearchProblemPreview 
          groundTruth={groundTruth}
          problem={problemData}
          useAbstract={useAbstract}
        />
      </div>
      
      <BaseEvaluationSection
        title="Research Problem Evaluation"
        description="Rate each aspect of the research problem formulation"
        fields={EVALUATION_FIELDS}
        data={formattedAssessment()}
        onChange={handleFieldChange}
        isComplete={isComplete}
      />

      <div className="mt-6 flex justify-end">
        {/* Always show button for debugging */}
        <Button
          onClick={handleButtonClick}
          className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-2 p-2 rounded-md"
          data-testid="view-report-button"
          type="button"
        >
          <FileText className="h-4 w-4" />
          View Assessment Report
        </Button>
      </div>
    </div>
  );
};

export default React.memo(ResearchProblemEvaluationForm);