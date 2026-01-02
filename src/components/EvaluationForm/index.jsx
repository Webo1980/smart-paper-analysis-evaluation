import React, { useState } from 'react';
import { MetadataQualitySection } from '../evaluation/metadata/MetadataQualitySection'
import { ResearchFieldSection } from '../evaluation/research-field/ResearchFieldSection'
import { ResearchProblemSection } from '../evaluation/research-problem/ResearchProblemSection'
import { InnovationSection } from '../evaluation/InnovationSection'
import { FinalVerdictSection } from '../evaluation/FinalVerdictSection'

import {
  TemplateAnalysisSection,
  PropertyValueSection,
  SystemPerformanceSection,
  ComparativeAnalysisSection
} from './sections';

const steps = [
  { id: 'userInfo', label: 'User Info' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'researchField', label: 'Research Field' },
  { id: 'template', label: 'Template' },
  { id: 'property', label: 'Properties' },
  { id: 'system', label: 'System' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'final', label: 'Final' }
];

const EvaluationForm = ({ evaluationData, currentStep, onStepChange }) => {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('evaluationFormData');
    return saved ? JSON.parse(saved) : {
      metadata: {},
      researchField: {},
      template: {},
      property: {},
      system: {},
      innovation: {},
      comparison: {},
      final: {}
    };
  });

  const handleSectionChange = (section, data) => {
    setFormData(prev => {
      const updated = { ...prev, [section]: data };
      localStorage.setItem('evaluationFormData', JSON.stringify(updated));
      return updated;
    });
  };

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  const handleNavigation = (direction) => {
    const currentIndex = getCurrentStepIndex();
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < steps.length) {
      onStepChange(steps[newIndex].id);
    }
  };

  const renderSection = () => {
    const props = {
      data: formData[currentStep] || {},
      onChange: (data) => handleSectionChange(currentStep, data),
      evaluationData
    };
    switch (currentStep) {
      case 'metadata':
        return <MetadataQualitySection {...props} />;
      case 'researchField':
        return <ResearchFieldSection {...props} />;
      case 'template':
        return <TemplateAnalysisSection {...props} />;
      case 'property':
        return <PropertyValueSection {...props} />;
      case 'system':
        return <SystemPerformanceSection {...props} />;
      case 'innovation':
        return <InnovationSection {...props} />;
      case 'comparison':
        return <ComparativeAnalysisSection {...props} />;
      case 'final':
        return <FinalVerdictSection {...props} />;
      default:
        return null;
    }
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="space-y-6">
      {renderSection()}
      
      <div className="flex justify-between mt-6">
        <button
          onClick={() => handleNavigation('prev')}
          disabled={currentIndex === 0}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => handleNavigation('next')}
          disabled={currentIndex === steps.length - 1}
          className="px-6 py-2 bg-[#E86161] text-white rounded-lg hover:bg-[#c54545] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentIndex === steps.length - 2 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default EvaluationForm;