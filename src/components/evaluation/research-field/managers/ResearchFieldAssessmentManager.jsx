// src/components/evaluation/research-field/managers/ResearchFieldAssessmentManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { expertiseToMultiplier } from '../../base/utils/baseMetricsUtils';
import { storeOverallEvaluation } from '../../base/utils/storageUtils';

const ResearchFieldAssessmentManager = ({
  evaluationData,
  orkgData,
  userInfo,
  showComparison,
  setShowComparison,
  evaluationState,
  updateSection,
  renderView
}) => {
  // Initialize state with existing data or defaults
  const [userAssessment, setUserAssessment] = useState(
    evaluationState.research_field?.userAssessment || {
      primaryField: 0,
      primaryFieldComments: '',
      confidence: 0,
      confidenceComments: '',
      consistency: 0,
      consistencyComments: '',
      relevance: 0,
      relevanceComments: '',
      comments: ''
    }
  );

  const [finalAssessment, setFinalAssessment] = useState(
    evaluationState.research_field?.finalAssessment || {}
  );

  const [isComplete, setIsComplete] = useState(
    evaluationState.research_field?.isComplete || false
  );

  // Check if all required fields have been rated
  useEffect(() => {
    const { primaryField, confidence, consistency, relevance } = userAssessment;
    const complete = primaryField > 0 && confidence > 0 && consistency > 0 && relevance > 0;
    setIsComplete(complete);
  }, [userAssessment]);

  // Handle assessment changes
  const handleAssessmentChange = useCallback((changes) => {
    setUserAssessment(prev => ({
      ...prev,
      ...changes
    }));
  }, []);

  // ✅ CENTRALIZED generateFinalAssessment - called when showing comparison
  const generateFinalAssessment = useCallback((userAssessment, userInfo) => {
    console.log('🔵 Research Field: generateFinalAssessment called', {
      userAssessment,
      userInfo
    });

    // Calculate expertise multiplier
    const expertiseMultiplier = userInfo?.expertiseMultiplier || expertiseToMultiplier(userInfo?.expertiseWeight || 1);

    // Extract all field ratings and compile final assessment
    const finalAssessment = {
      // Preserve original assessment data
      ...userAssessment,
      
      // Store formatted ratings
      primaryFieldRating: userAssessment.primaryField,
      confidenceRating: userAssessment.confidence,
      relevanceRating: userAssessment.relevance,
      consistencyRating: userAssessment.consistency,
      
      // Comments in both formats
      comments: userAssessment.overall?.comments || userAssessment.comments || '',
      
      // Ground truth and predictions
      groundTruth: orkgData?.research_field_name || '',
      predictedFields: evaluationData?.researchFields?.fields || [],
      topPrediction: evaluationData?.researchFields?.fields?.[0] || {},
      
      // Expertise info
      expertiseMultiplier: expertiseMultiplier,
      expertiseWeight: userInfo?.expertiseWeight || 1,
      
      // Field-specific data
      fields: {
        primaryField: {
          rating: userAssessment.primaryField,
          comments: userAssessment.primaryFieldComments || '',
          accuracyScore: null,
          qualityScore: null
        },
        confidence: {
          rating: userAssessment.confidence,
          comments: userAssessment.confidenceComments || '',
          accuracyScore: null,
          qualityScore: null
        },
        consistency: {
          rating: userAssessment.consistency,
          comments: userAssessment.consistencyComments || '',
          accuracyScore: null,
          qualityScore: null
        },
        relevance: {
          rating: userAssessment.relevance,
          comments: userAssessment.relevanceComments || '',
          accuracyScore: null,
          qualityScore: null
        }
      },
      
      // Overall scores placeholder
      overall: {
        accuracyScore: null,
        qualityScore: null,
        overallScore: null
      },
      
      // Rating for report component
      rating: Math.max(
        userAssessment.primaryField || 0,
        userAssessment.confidence || 0,
        userAssessment.relevance || 0,
        userAssessment.consistency || 0
      ),
      
      // Timestamp
      timestamp: new Date().toISOString()
    };
    
    console.log('🔵 Research Field: Calling storeOverallEvaluation', {
      domain: 'research_field',
      hasData: !!finalAssessment,
      dataKeys: Object.keys(finalAssessment).slice(0, 10)
    });
    
    // ✅ CRITICAL: Save to evaluation_metrics.overall.research_field
    storeOverallEvaluation(finalAssessment, 'research_field');
    
    // ✅ CRITICAL: Also update evaluationState immediately
    if (typeof updateSection === 'function') {
      console.log('🔵 Research Field: Updating evaluationState');
      updateSection('research_field', {
        userAssessment,
        finalAssessment,
        isComplete: true,
        showComparison: true
      });
    }
    
    console.log('✅ Research field assessment saved successfully:', {
      evaluationState: 'research_field',
      evaluationMetrics: 'overall.research_field',
      timestamp: finalAssessment.timestamp
    });
    
    return finalAssessment;
  }, [orkgData, evaluationData, updateSection]);

  // Show comparison view
  const handleShowComparison = useCallback(() => {
    console.log('🔵 Research Field: handleShowComparison called');
    const assessment = generateFinalAssessment(userAssessment, userInfo);
    setFinalAssessment(assessment);
    setShowComparison(true);
  }, [generateFinalAssessment, userAssessment, userInfo, setShowComparison]);

  // ✅ Update evaluationState whenever state changes (but not finalAssessment)
  useEffect(() => {
    if (typeof updateSection === 'function') {
      updateSection('research_field', {
        userAssessment,
        finalAssessment,
        isComplete,
        showComparison
      });
    }
  }, [userAssessment, isComplete, showComparison, updateSection]);
  // Note: finalAssessment intentionally excluded to avoid infinite loop

  return renderView({
    userAssessment,
    handleAssessmentChange,
    isComplete,
    handleShowComparison,
    finalAssessment,
    setShowComparison,
    userInfo,
    orkgData,
    evaluationData
  });
};

export default ResearchFieldAssessmentManager;