// src/components/EvaluationForm/sections/AdditionalObservationsSection.jsx
import React from 'react';
import { FormSection, TextArea } from '../FormComponents';

export const AdditionalObservationsSection = ({ data, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <FormSection title="10. Additional Observations">
      <TextArea
        label="Strengths"
        value={data.strengths}
        onChange={(value) => handleInputChange('strengths', value)}
      />
      <TextArea
        label="Weaknesses"
        value={data.weaknesses}
        onChange={(value) => handleInputChange('weaknesses', value)}
      />
      <TextArea
        label="Improvement Suggestions"
        value={data.improvementSuggestions}
        onChange={(value) => handleInputChange('improvementSuggestions', value)}
      />
    </FormSection>
  );
};