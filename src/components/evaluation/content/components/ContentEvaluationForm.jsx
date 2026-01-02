// src/components/evaluation/content/components/ContentEvaluationForm.jsx
import React, { useCallback } from 'react';
import { Button } from '../../../ui/button';
import { FileText } from 'lucide-react';
import { BaseEvaluationSection } from '../../base/BaseEvaluationSection';
import { EVALUATION_FIELDS } from '../config/contentConfig';

const ContentEvaluationForm = ({
  userAssessment = {},
  handleAssessmentChange,
  isComplete,
  onShowComparison,
  paperContent,
  templateProperties,
  textSections,
  metrics
}) => {
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
      comments: userAssessment.overallComments || userAssessment.overall?.comments || ''
    };
    
    return result;
  }, [userAssessment]);

  // Handle field changes - FIXED to match ResearchProblemEvaluationForm
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

  // Check if we have essential data
  if (!metrics || !paperContent || !templateProperties) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-2">Missing required data for content evaluation:</p>
        <ul className="text-left inline-block">
          {!paperContent && <li>• Paper content is missing</li>}
          {!templateProperties && <li>• Template properties are missing</li>}
          {!templateProperties?.length && <li>• Template properties array is empty</li>}
          {!textSections && <li>• Text sections are missing</li>}
          {!metrics && <li>• Metrics calculation failed</li>}
        </ul>
        <p className="mt-4">Available data:</p>
        <pre className="text-left text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify({
            paperContentKeys: paperContent ? Object.keys(paperContent) : null,
            templatePropertiesLength: templateProperties?.length,
            textSectionsKeys: textSections ? Object.keys(textSections) : null
          }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Content Annotation Evaluation</h2>
      <p className="text-gray-600 mb-6">
        Please evaluate how well the paper has been annotated based on the template properties.
      </p>
      
      <BaseEvaluationSection
        title="Content Evaluation"
        description="Rate each aspect of the content annotation quality and accuracy"
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

export default React.memo(ContentEvaluationForm);