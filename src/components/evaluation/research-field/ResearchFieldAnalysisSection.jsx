import React, { useState, useCallback, useEffect } from 'react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { useForm } from '../../../context/FormContext';
import ResearchFieldEvaluationForm from './components/ResearchFieldEvaluationForm';
import ResearchFieldEvaluationReport from './components/ResearchFieldEvaluationReport';
import BaseAssessmentManager from '../base/BaseAssessmentManager';
import { storeOverallEvaluation } from '../base/utils/storageUtils';

import { 
  EVALUATION_FIELDS, 
  RESEARCH_FIELD_CONFIG,
  RESEARCH_FIELD_METRICS,
  QUALITY_WEIGHTS,
  calculateConfidenceDropRate,
  getOrkgFieldPosition
} from './config/researchFieldConfig';
import { NavigationButtons } from '../base';

// Import centralized utilities
import { 
  expertiseToMultiplier
} from '../base/utils/baseMetricsUtils';

// Import research field specific calculation functions
import { 
  processResearchFieldAccuracy, 
  processResearchFieldQuality 
} from './utils/researchFieldMetrics';

/**
 * Generate complete research field final assessment with all detailed metrics
 */
const generateResearchFieldFinalAssessment = (
  userAssessment,
  orkgData,
  evaluationData,
  expertiseMultiplier
) => {
  // Ensure userAssessment is defined
  const safeUserAssessment = userAssessment || {};
  
  // Extract data for calculations
  const orkgValue = orkgData?.research_field_name || '';
  const predictions = evaluationData?.researchFields?.fields || [];
  const selectedField = evaluationData?.researchFields?.selectedField?.name || null;
  
  // Extract user ratings - handle different formats
  const getRating = (fieldId) => {
    if (safeUserAssessment[fieldId]) {
      if (typeof safeUserAssessment[fieldId] === 'number') {
        return safeUserAssessment[fieldId];
      }
      if (typeof safeUserAssessment[fieldId] === 'object' && 'rating' in safeUserAssessment[fieldId]) {
        return safeUserAssessment[fieldId].rating;
      }
    }
    return 0;
  };
  
  const getComments = (fieldId) => {
    if (safeUserAssessment[fieldId]) {
      if (typeof safeUserAssessment[fieldId] === 'object' && 'comments' in safeUserAssessment[fieldId]) {
        return safeUserAssessment[fieldId].comments;
      }
    }
    if (safeUserAssessment[`${fieldId}Comments`]) {
      return safeUserAssessment[`${fieldId}Comments`];
    }
    return '';
  };
  
  const primaryFieldRating = getRating('primaryField');
  const confidenceRating = getRating('confidence');
  const consistencyRating = getRating('consistency');
  const relevanceRating = getRating('relevance');
  
  const primaryFieldComments = getComments('primaryField');
  const confidenceComments = getComments('confidence');
  const consistencyComments = getComments('consistency');
  const relevanceComments = getComments('relevance');
  const overallComments = safeUserAssessment.overall?.comments || safeUserAssessment.comments || '';
  
  // Calculate accuracy metrics using existing function
  const accuracyResults = processResearchFieldAccuracy(
    'research_field',
    orkgValue,
    predictions,
    primaryFieldRating,
    expertiseMultiplier
  );
  
  // Calculate quality analysis components
  const confidenceDropRate = calculateConfidenceDropRate(predictions);
  const orkgPosition = getOrkgFieldPosition(orkgValue, predictions);
  
  // Calculate relevance based on position and confidence
  let relevanceScore = 0.5; // default
  if (orkgPosition === 0) {
    relevanceScore = 1.0;
  } else if (orkgPosition > 0 && orkgPosition < 3) {
    relevanceScore = 0.8 - (orkgPosition * 0.1);
  } else if (orkgPosition >= 3) {
    relevanceScore = 0.5;
  }
  
  // Calculate consistency based on confidence drop rate
  // Lower drop rate = higher consistency
  const consistencyScore = 1.0 - confidenceDropRate;
  
  // Prepare quality analysis object
  const qualityAnalysis = {
    confidence: confidenceDropRate,
    relevance: relevanceScore,
    consistency: consistencyScore,
    details: {
      topPredictions: predictions.slice(0, 3).map(p => ({
        name: p.name,
        score: p.score,
        confidence: p.score / 100
      })),
      orkgPosition: orkgPosition >= 0 ? orkgPosition + 1 : null,
      totalPredictions: predictions.length
    }
  };
  
  // Calculate quality metrics using existing function
  const qualityResults = processResearchFieldQuality(
    'research_field',
    qualityAnalysis,
    relevanceRating,
    expertiseMultiplier,
    QUALITY_WEIGHTS
  );
  
  // Calculate final weighted scores
  const finalAccuracyScore = accuracyResults.scoreDetails.finalScore;
  const finalQualityScore = qualityResults.scoreDetails.finalScore;
  
  // Calculate overall score with config weights
  const finalOverallScore = (
    (finalAccuracyScore * RESEARCH_FIELD_CONFIG.overallWeights.accuracy) +
    (finalQualityScore * RESEARCH_FIELD_CONFIG.overallWeights.quality)
  );
  
  // Build complete final assessment object
  const finalAssessment =  {
    // User ratings in standardized format
    primaryField: { 
      rating: primaryFieldRating, 
      comments: primaryFieldComments 
    },
    confidence: { 
      rating: confidenceRating, 
      comments: confidenceComments 
    },
    consistency: { 
      rating: consistencyRating, 
      comments: consistencyComments 
    },
    relevance: { 
      rating: relevanceRating, 
      comments: relevanceComments 
    },
    comments: overallComments,
    
    // Detailed accuracy metrics with all components
    accuracyMetrics: {
      // Individual metrics
      exactMatch: { value: accuracyResults.similarityData.exactMatch },
      recall: { value: accuracyResults.similarityData.recall },
      topN: { value: accuracyResults.similarityData.topN },
      positionScore: { value: accuracyResults.similarityData.positionScore },
      f1Score: { value: accuracyResults.similarityData.f1Score },
      precision: { value: accuracyResults.similarityData.precision },
      
      // Position information
      foundPosition: accuracyResults.similarityData.foundPosition,
      
      // Overall accuracy
      automatedScore: { value: accuracyResults.similarityData.automatedOverallScore },
      overallAccuracy: { value: finalAccuracyScore },
      
      // Score details with weights
      scoreDetails: accuracyResults.scoreDetails,
      
      // Similarity data for reference
      similarityData: accuracyResults.similarityData
    },
    
    // Detailed quality metrics with all components
    qualityMetrics: {
      // Individual quality dimensions
      confidence: { 
        value: qualityResults.qualityData.fieldSpecificMetrics.confidence.score,
        details: qualityAnalysis.details
      },
      relevance: { 
        value: qualityResults.qualityData.fieldSpecificMetrics.relevance.score 
      },
      consistency: { 
        value: qualityResults.qualityData.fieldSpecificMetrics.consistency.score 
      },
      
      // Overall quality
      automatedScore: { value: qualityResults.qualityData.automatedOverallScore },
      overallQuality: { value: finalQualityScore },
      
      // Score details with weights
      scoreDetails: qualityResults.scoreDetails,
      
      // Quality data for reference
      qualityData: qualityResults.qualityData,
      qualityAnalysis: qualityAnalysis,
      
      // Weights used
      weights: QUALITY_WEIGHTS
    },
    
    // Prediction details for display
    predictions: predictions.map((p, index) => ({
      name: p.name,
      score: p.score,
      position: index + 1,
      confidence: p.score / 100,
      isOrkg: p.name.toLowerCase() === orkgValue.toLowerCase(),
      isSelected: p.name === selectedField
    })),
    
    // Ground truth and selection info
    groundTruth: orkgValue,
    selectedField: selectedField,
    orkgPosition: orkgPosition >= 0 ? orkgPosition + 1 : null,
    
    // Overall evaluation
    overallScore: finalOverallScore,
    
    // Metadata
    timestamp: new Date().toISOString(),
    expertiseWeight: expertiseMultiplier,
    
    // Config used
    config: {
      accuracyWeights: accuracyResults.similarityData,
      qualityWeights: QUALITY_WEIGHTS,
      overallWeights: RESEARCH_FIELD_CONFIG.overallWeights
    }
  };
  
  // ✅ ADD THIS LINE - Save to evaluation_metrics.overall.research_field
  storeOverallEvaluation(finalAssessment, 'research_field');
  
  return finalAssessment;
};

const ResearchFieldAnalysisSection = ({
  userInfo,
  onNext,
  onPrevious
}) => {
  const { evaluationState, updateSection } = useEvaluation();
  const { evaluationData, orkgData } = useForm();
  
  // Get the initial showComparison value from evaluationState
  const initialShowComparison = evaluationState?.research_field?.showComparison || false;
  const [showComparison, setShowComparison] = useState(initialShowComparison);

  // Calculate the expertise multiplier using centralized utility
  const expertiseMultiplier = expertiseToMultiplier(userInfo?.expertiseWeight || 5);

  // Sync showComparison with evaluationState changes
  useEffect(() => {
    if (evaluationState?.research_field) {
      setShowComparison(evaluationState.research_field.showComparison || false);
    }
  }, [evaluationState?.research_field?.showComparison]);

  // Create normalized assessment structure
  const getNormalizedInitialData = useCallback(() => {
    const existing = evaluationState?.research_field?.userAssessment || {};
    const normalized = {};
    
    EVALUATION_FIELDS.forEach(field => {
      normalized[field.id] = { rating: 0, comments: '' };
      
      if (existing[field.id] && typeof existing[field.id] === 'object' && 'rating' in existing[field.id]) {
        normalized[field.id] = existing[field.id];
      }
      else if (existing[`${field.id}Rating`] && typeof existing[`${field.id}Rating`] === 'object') {
        normalized[field.id] = existing[`${field.id}Rating`];
      }
      else if (typeof existing[field.id] === 'number') {
        normalized[field.id] = {
          rating: existing[field.id],
          comments: existing[`${field.id}Comments`] || ''
        };
      }
    });
    
    normalized.overall = { 
      comments: existing.overall?.comments || existing.comments || '' 
    };
    
    return normalized;
  }, [evaluationState]);

  // Generate final assessment with all detailed metrics
  const generateFinalAssessment = useCallback((userAssessment) => {
    return generateResearchFieldFinalAssessment(
      userAssessment,
      orkgData || {},
      evaluationData || {},
      expertiseMultiplier
    );
  }, [orkgData, evaluationData, expertiseMultiplier]);

  // Handle showing the comparison view
  const handleShowComparison = useCallback((userAssessment) => {
    const finalAssessment = generateFinalAssessment(userAssessment);
    updateSection('research_field', {
      finalAssessment,
      showComparison: true,
      isComplete: true
    });
  }, [generateFinalAssessment, updateSection]);

  // Handle toggling between views
  const handleToggleView = useCallback((show) => {
    setShowComparison(show);
    updateSection('research_field', { showComparison: show });
  }, [updateSection]);

  // Stable function for edit assessment
  const handleEditAssessment = useCallback(() => {
    handleToggleView(false);
  }, [handleToggleView]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 relative">
        <BaseAssessmentManager
          initialData={getNormalizedInitialData()}
          sectionKey="research_field"
          fieldDefinitions={EVALUATION_FIELDS}
          userInfo={{
            ...userInfo,
            expertiseMultiplier
          }}
          showComparison={showComparison}
          setShowComparison={handleToggleView}
          evaluationState={evaluationState}
          updateSection={updateSection}
          generateFinalAssessment={generateFinalAssessment}
          onShowComparison={handleShowComparison}
          additionalData={{ orkgData, evaluationData }}
          renderView={({ 
            userAssessment, 
            handleAssessmentChange, 
            isComplete, 
            onShowComparison, 
            finalAssessment, 
            userInfo,
            additionalData
          }) => {
            return showComparison ? (
              <ResearchFieldEvaluationReport
                finalAssessment={finalAssessment}
                orkgData={additionalData.orkgData}
                evaluationData={additionalData.evaluationData}
                userInfo={userInfo}
                onEditAssessment={handleEditAssessment}
                config={RESEARCH_FIELD_CONFIG}
              />
            ) : (
              <ResearchFieldEvaluationForm
                userAssessment={userAssessment}
                handleAssessmentChange={handleAssessmentChange}
                isComplete={isComplete}
                onShowComparison={onShowComparison}
                orkgData={additionalData.orkgData}
                evaluationData={additionalData.evaluationData}
              />
            );
          }}
        />
      </div>
      
      <NavigationButtons 
        onPrevious={onPrevious} 
        onNext={onNext} 
        showNext={showComparison} 
      />
    </div>
  );
};

export default ResearchFieldAnalysisSection;