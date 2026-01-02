// src\components\evaluation\base\BaseAssessmentManager.jsx
import React, { useState, useEffect, useCallback } from 'react';

const BaseAssessmentManager = ({
  initialData = {},
  sectionKey,
  fieldDefinitions = [],
  userInfo = {},
  showComparison = false,
  setShowComparison = () => {},
  evaluationState = {},
  updateSection = () => {},
  generateFinalAssessment = (userAssessment, userInfo) => userAssessment,
  renderView = () => null,
  onShowComparison = () => {},
  additionalData = {}
}) => {
  // Initialize state with existing data or defaults
  const [userAssessment, setUserAssessment] = useState(() => {
    const existingAssessment = evaluationState[sectionKey]?.userAssessment;
    return existingAssessment || initialData || {};
  });
  
  const [finalAssessment, setFinalAssessment] = useState(
    evaluationState[sectionKey]?.finalAssessment || {}
  );
  
  const [isComplete, setIsComplete] = useState(
    evaluationState[sectionKey]?.isComplete || false
  );

  // Check if all fields have been rated
  // In BaseAssessmentManager.jsx
useEffect(() => {
  const fieldsToCheck = fieldDefinitions.map(field => field.id);
  
  const allFieldsComplete = fieldsToCheck.every(field => 
    userAssessment[field]?.rating > 0
  );
  
  setIsComplete(allFieldsComplete);
}, [userAssessment, fieldDefinitions]);

  // Save state whenever it changes
  useEffect(() => {
    updateSection(sectionKey, {
      // userAssessment,
      finalAssessment,
      isComplete,
      showComparison
    });
  }, [userAssessment, finalAssessment, isComplete, showComparison, updateSection, sectionKey]);

  // Handle individual field assessment changes
  const handleAssessmentChange = useCallback((changes) => {
    setUserAssessment(prev => ({
      ...prev,
      ...changes
    }));
  }, []);

  // Show comparison view
  const handleShowComparison = useCallback(() => {
    const generatedAssessment = generateFinalAssessment(userAssessment, userInfo);
    setFinalAssessment(generatedAssessment);
    setShowComparison(true);
    onShowComparison(userAssessment);
  }, [generateFinalAssessment, userAssessment, userInfo, setShowComparison, onShowComparison]);

  // Render current view based on props
  return renderView({
    userAssessment,
    handleAssessmentChange,
    isComplete,
    onShowComparison: handleShowComparison,
    finalAssessment,
    setShowComparison,
    userInfo,
    additionalData
  });
};

export default BaseAssessmentManager;