// src\context\FormContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateSection } from '../utils/validation';

const FormContext = createContext();

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error('useForm must be used within a FormProvider');
  return context;
};

export const FormProvider = ({ children }) => {
  const [formData, setFormData] = useState(() => (
    JSON.parse(localStorage.getItem('formData')) || {
      metadata: {},
      researchField: {},
      template: {},
      property: {},
      system: {},
      innovation: {},
      comparativeAnalysis: {},
      final: {}
    }
  ));

  const [errors, setErrors] = useState({});
  const [completedSteps, setCompletedSteps] = useState(() => (
    JSON.parse(localStorage.getItem('completedSteps')) || []
  ));

  const [metricsData, setMetricsData] = useState(() => (
    JSON.parse(localStorage.getItem('metricsData')) || {
      predictions: {},
      groundTruth: {}
    }
  ));

  const [evaluationData, setEvaluationData] = useState(() => (
    JSON.parse(localStorage.getItem('evaluationData')) || null
  ));

  const [orkgData, setOrkgData] = useState(() => (
    JSON.parse(localStorage.getItem('orkgData')) || null
  ));

  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(formData));
    localStorage.setItem('completedSteps', JSON.stringify(completedSteps));
    localStorage.setItem('metricsData', JSON.stringify(metricsData));
    localStorage.setItem('evaluationData', JSON.stringify(evaluationData));
    localStorage.setItem('orkgData', JSON.stringify(orkgData));
  }, [formData, completedSteps, metricsData, evaluationData, orkgData]);

  const updateFormData = (section, data) => {
    const { isValid, errors: sectionErrors } = validateSection(section, data);
    setFormData(prev => ({ ...prev, [section]: data }));
    setErrors(prev => ({ ...prev, [section]: sectionErrors }));
    return isValid;
  };

  const value = {
    formData,
    errors,
    completedSteps,
    metricsData,
    evaluationData,
    orkgData,
    setEvaluationData,
    setOrkgData,
    updateFormData,
    markStepComplete: (step) => {
      if (!completedSteps.includes(step)) {
        setCompletedSteps(prev => [...prev, step]);
      }
    },
    resetForm: () => {
      setFormData({});
      setErrors({});
      setCompletedSteps([]);
      setMetricsData({ predictions: {}, groundTruth: {} });
      localStorage.clear();
    }
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};