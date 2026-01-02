// src/context/EvaluationContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const EvaluationContext = createContext();
const initialMetadataState = {
  comparisonComments: '',
  isComplete: false,
  showMetrics: false,
  editMode: true
};

export const EvaluationProvider = ({ children }) => {
  const [evaluationState, setEvaluationState] = useState(() => {
    const savedState = localStorage.getItem('evaluationState');
    return savedState ? JSON.parse(savedState) : {
      metadata: initialMetadataState,
      research_field: {},
      research_problem: {},
      templateAnalysis: {},
      propertyValues: {},
      systemPerformance: {},
      finalVerdict: {}
    };
  });

  // ✅ FIX: Use a ref to track if we're in the initial load
  const isInitialMount = useRef(true);
  
  // ✅ FIX: Use a timeout ref for debouncing
  const saveTimeoutRef = useRef(null);

  // ✅ FIX: Debounced save - only save after 500ms of no changes
  useEffect(() => {
    // Skip save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout to save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('evaluationState', JSON.stringify(evaluationState));
      console.log('💾 Saved evaluationState to localStorage');
    }, 500);
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [evaluationState]);

  const updateSection = (section, data) => {
    setEvaluationState(prev => {
      // ✅ FIX: Only update if data actually changed
      const currentSection = prev[section] || {};
      const hasChanges = JSON.stringify(currentSection) !== JSON.stringify({...currentSection, ...data});
      
      if (!hasChanges) {
        return prev; // No changes, return previous state
      }
      
      return {
        ...prev,
        [section]: {
          ...currentSection,
          ...data
        }
      };
    });
  };

  const resetSection = (section) => {
    setEvaluationState(prev => ({
      ...prev,
      [section]: {}
    }));
  };

  const clearAllData = () => {
    localStorage.removeItem('evaluationState');
    setEvaluationState({
      metadata: {
        assessment: null,
        comparisonComments: '',
        isComplete: false
      },
      researchField: {},
      problemAnalysis: {},
      templateAnalysis: {},
      propertyValues: {},
      systemPerformance: {},
      finalVerdict: {}
    });
  };

  return (
    <EvaluationContext.Provider 
      value={{ 
        evaluationState, 
        updateSection,
        resetSection,
        clearAllData
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
};

export default EvaluationProvider;