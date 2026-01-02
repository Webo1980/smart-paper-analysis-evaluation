import React, { useCallback } from 'react';
import { Button } from '../../../ui/button';
import { FileText } from 'lucide-react';
import { BaseEvaluationSection } from '../../base/BaseEvaluationSection';
import { metadataFieldsData } from '../constants/metadataFields';

const MetadataEvaluationView = ({
  userAssessment,
  handleAssessmentChange,
  isComplete,
  onShowComparison // Change from handleShowComparison to onShowComparison
}) => {
  // Create enhanced fields with tooltips and help content
  const evaluationFields = metadataFieldsData.map(field => ({
    ...field,
    label: field.label,
    description: field.description,
    id: field.id
  }));

  // Wrap handleAssessmentChange to work with BaseEvaluationSection
  const handleFieldChange = useCallback((fieldId, fieldValue) => {
    handleAssessmentChange({
      [fieldId]: {
        ...userAssessment[fieldId],
        ...fieldValue
      }
    });
  }, [handleAssessmentChange, userAssessment]);

  // Handle button click with proper event handling
  const handleButtonClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onShowComparison(); // Use onShowComparison instead
  }, [onShowComparison]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Metadata Quality Assessment</h2>
      <p className="text-gray-600 mb-6">
        Please evaluate each metadata field extraction based on your expertise.
      </p>
      
      <BaseEvaluationSection
        title="Metadata Extraction Quality"
        description="Rate the quality of metadata extraction for each field"
        fields={evaluationFields}
        data={userAssessment}
        onChange={handleFieldChange}
        isComplete={isComplete}
      />
      
      {isComplete && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleButtonClick}
            className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none"
            data-testid="view-report-button"
          >
            <FileText className="h-4 w-4" />
            View Assessment Report
          </Button>
        </div>
      )}
    </div>
  );
};

export default MetadataEvaluationView;