import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { useForm } from '../../../context/FormContext';
import TemplateEvaluationForm from './components/TemplateEvaluationForm';
import TemplateEvaluationReport from './components/TemplateEvaluationReport';
import BaseAssessmentManager from '../base/BaseAssessmentManager';
import { EVALUATION_FIELDS, TEMPLATE_CONFIG } from './config/templateConfig';
import { NavigationButtons } from '../base';
import { expertiseToMultiplier } from '../base/utils/baseMetricsUtils';
import { 
  calculateTemplateQuality, 
  calculatePropertyMatch,
  processTemplateAccuracy,
  processTemplateQuality,
  storeTemplateUserRating  // ← ADDED THIS
} from './utils/templateMetrics';

// Function to safely get a rating value from user assessment, handling different formats
const getRatingValue = (assessmentObj, fieldName) => {
  if (!assessmentObj) return 0;
  
  // Format 1: { fieldName: 4 }
  if (typeof assessmentObj[fieldName] === 'number') {
    return assessmentObj[fieldName];
  }
  
  // Format 2: { fieldName: { rating: 4 } }
  if (assessmentObj[fieldName] && typeof assessmentObj[fieldName] === 'object' && 'rating' in assessmentObj[fieldName]) {
    return assessmentObj[fieldName].rating;
  }
  
  return 0;
};

// Function to safely get a comments value from user assessment, handling different formats
const getCommentsValue = (assessmentObj, fieldName) => {
  if (!assessmentObj) return '';
  
  // Format 1: { fieldNameComments: "comment" }
  if (typeof assessmentObj[`${fieldName}Comments`] === 'string') {
    return assessmentObj[`${fieldName}Comments`];
  }
  
  // Format 2: { fieldName: { comments: "comment" } }
  if (assessmentObj[fieldName] && typeof assessmentObj[fieldName] === 'object' && 'comments' in assessmentObj[fieldName]) {
    return assessmentObj[fieldName].comments;
  }
  
  return '';
};

// Function to generate template final assessment
const generateTemplateFinalAssessment = (userAssessment, orkgData, evaluationData, config, expertiseMultiplier, domainKey) => {
  // Ensure userAssessment is defined
  const safeUserAssessment = userAssessment || {};
  console.log("User assessment in generateTemplateFinalAssessment:", safeUserAssessment);
  
  // Extract template data
  const templateData = evaluationData?.templates?.llm_template?.template || null;
  const referenceData = orkgData?.template || null;
  const isOrkgScenario = !!referenceData;
  
  // Research problem data for context
  const researchProblem = {
    title: evaluationData?.researchProblems?.researchProblem?.name || '',
    description: evaluationData?.researchProblems?.researchProblem?.description || '',
    field: evaluationData?.researchFields?.selectedField?.name || 
           evaluationData?.researchFields?.fields?.[0]?.name || ''
  };
  
  // Calculate reference metrics
  const referenceForMetrics = isOrkgScenario ? referenceData : researchProblem;
  
  // Get all ratings from user assessment - safely access properties
  const titleAccuracyRating = getRatingValue(safeUserAssessment, 'titleAccuracy');
  const descriptionQualityRating = getRatingValue(safeUserAssessment, 'descriptionQuality');
  const propertyCoverageRating = getRatingValue(safeUserAssessment, 'propertyCoverage');
  const researchAlignmentRating = getRatingValue(safeUserAssessment, 'researchAlignment');
  
  // Get comments from user assessment
  const titleAccuracyComments = getCommentsValue(safeUserAssessment, 'titleAccuracy');
  const descriptionQualityComments = getCommentsValue(safeUserAssessment, 'descriptionQuality');
  const propertyCoverageComments = getCommentsValue(safeUserAssessment, 'propertyCoverage');
  const researchAlignmentComments = getCommentsValue(safeUserAssessment, 'researchAlignment');
  const overallComments = safeUserAssessment.overall?.comments || safeUserAssessment.comments || '';
  
  // Process accuracy metrics using centralized utility (this also stores to localStorage)
  console.log("Processing template accuracy with rating:", titleAccuracyRating);
  const accuracyResults = processTemplateAccuracy(
    'template',
    templateData,
    referenceForMetrics,
    titleAccuracyRating,
    expertiseMultiplier
  );
  
  // Process quality metrics using centralized utility (this also stores to localStorage)
  console.log("Processing template quality with rating:", researchAlignmentRating);
  const qualityResults = processTemplateQuality(
    'template',
    templateData,
    researchProblem,
    researchAlignmentRating,
    expertiseMultiplier
  );
  
  // ========== NEW: Store all user ratings in centralized location ==========
  // This groups all user ratings and comments under overall.template.userRating
  console.log("Storing user ratings to overall.template.userRating");
  storeTemplateUserRating({
    titleAccuracy: { 
      rating: titleAccuracyRating, 
      comments: titleAccuracyComments 
    },
    descriptionQuality: { 
      rating: descriptionQualityRating, 
      comments: descriptionQualityComments 
    },
    propertyCoverage: { 
      rating: propertyCoverageRating, 
      comments: propertyCoverageComments 
    },
    researchAlignment: { 
      rating: researchAlignmentRating, 
      comments: researchAlignmentComments 
    },
    overall: { 
      rating: safeUserAssessment.overall?.rating || 0, 
      comments: overallComments 
    },
    researchAlignmentComments  // Include any additional comments field
  }, expertiseMultiplier);
  // ========== END OF NEW SECTION ==========
  
  // Extract calculated scores from processed results
  const finalAccuracyScore = accuracyResults.scoreDetails?.finalScore || 0;
  const finalQualityScore = qualityResults.scoreDetails?.finalScore || 0;
  
  // Combine for overall score
  const finalOverallScore = (
    finalAccuracyScore * config.overallWeights.accuracy +
    finalQualityScore * config.overallWeights.quality
  );
  
  // Create the final assessment object matching the structure in evaluation-data-paths-reference.md
  const finalAssessment = {
    // Original assessment data
    ...safeUserAssessment,
    
    // User ratings - provide in both formats for compatibility
    titleAccuracy: titleAccuracyRating,
    descriptionQuality: descriptionQualityRating,
    propertyCoverage: propertyCoverageRating,
    researchAlignment: researchAlignmentRating,
    
    // Also in object format with comments
    titleAccuracyRating: { rating: titleAccuracyRating, comments: titleAccuracyComments },
    descriptionQualityRating: { rating: descriptionQualityRating, comments: descriptionQualityComments },
    propertyCoverageRating: { rating: propertyCoverageRating, comments: propertyCoverageComments },
    researchAlignmentRating: { rating: researchAlignmentRating, comments: researchAlignmentComments },
    
    comments: overallComments,
    
    // Calculated accuracy metrics from processTemplateAccuracy
    accuracyMetrics: {
      titleMatch: { value: accuracyResults.similarityData?.titleMatch || 0 },
      propertyMatch: { value: accuracyResults.similarityData?.propertyMatch || 0 },
      typeAccuracy: { value: accuracyResults.similarityData?.typeAccuracy || 0 },
      precision: { value: accuracyResults.similarityData?.precision || 0 },
      recall: { value: accuracyResults.similarityData?.recall || 0 },
      f1Score: { value: accuracyResults.similarityData?.f1Score || 0 },
      overallAccuracy: { value: finalAccuracyScore }
    },
    
    // Calculated quality metrics from processTemplateQuality
    qualityMetrics: {
      titleAccuracy: { value: qualityResults.qualityData?.fieldSpecificMetrics?.titleAccuracy?.score || 0 },
      descriptionQuality: { value: qualityResults.qualityData?.fieldSpecificMetrics?.descriptionQuality?.score || 0 },
      propertyCoverage: { value: qualityResults.qualityData?.fieldSpecificMetrics?.propertyCoverage?.score || 0 },
      researchAlignment: { value: qualityResults.qualityData?.fieldSpecificMetrics?.researchAlignment?.score || 0 },
      overallQuality: { value: finalQualityScore }
    },
    
    // Store complete results for later retrieval
    accuracyResults: {
      similarityData: accuracyResults.similarityData,
      scoreDetails: accuracyResults.scoreDetails
    },
    
    qualityResults: {
      qualityData: qualityResults.qualityData,
      scoreDetails: qualityResults.scoreDetails
    },
    
    // Overall evaluation
    overallScore: finalOverallScore,
    timestamp: new Date().toISOString(),
    expertiseWeight: expertiseMultiplier
  };
  
  // Store the overall template assessment to localStorage
  // This matches the pattern: overall.template
  try {
    const existingMetrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    
    if (!existingMetrics.overall) {
      existingMetrics.overall = {};
    }
    
    // Structure matching evaluation-data-paths-reference.md
    existingMetrics.overall.template = {
      // User ratings and comments
      titleAccuracy: titleAccuracyRating,
      descriptionQuality: descriptionQualityRating,
      propertyCoverage: propertyCoverageRating,
      researchAlignment: researchAlignmentRating,
      
      titleAccuracyComments,
      descriptionQualityComments,
      propertyCoverageComments,
      researchAlignmentComments,
      overallComments,
      
      // Processed results (matching metadata pattern)
      accuracyResults: finalAssessment.accuracyResults,
      qualityResults: finalAssessment.qualityResults,
      
      // Final scores
      accuracyScore: finalAccuracyScore,
      qualityScore: finalQualityScore,
      overallScore: finalOverallScore,
      
      // Metadata
      timestamp: finalAssessment.timestamp,
      expertiseWeight: expertiseMultiplier,
      
      // Template-specific data
      templateData: {
        title: templateData?.title || templateData?.name || '',
        description: templateData?.description || '',
        propertiesCount: templateData?.properties?.length || 0
      },
      
      // Reference information
      referenceType: isOrkgScenario ? 'orkg' : 'research_problem',
      isOrkgScenario
    };
    
    localStorage.setItem('evaluation_metrics', JSON.stringify(existingMetrics));
    console.log('Template assessment stored to localStorage:', existingMetrics.overall.template);
  } catch (error) {
    console.error('Error storing template assessment to localStorage:', error);
  }
  
  return finalAssessment;
};

const TemplateAnalysisSection = ({
  userInfo,
  onNext,
  onPrevious
}) => {
  const { evaluationState, updateSection } = useEvaluation();
  const { evaluationData, orkgData } = useForm();
  
  // Get the initial showComparison value from evaluationState
  const initialShowComparison = evaluationState?.template?.showComparison || false;
  const [showComparison, setShowComparison] = useState(initialShowComparison);

  // Calculate the expertise multiplier using centralized utility
  const expertiseMultiplier = useMemo(() => {
    return expertiseToMultiplier(userInfo?.expertiseWeight || 5);
  }, [userInfo?.expertiseWeight]);

  

  // Create normalized assessment structure
  const getNormalizedInitialData = useCallback(() => {
    const existing = evaluationState?.template?.userAssessment || {};
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
  }, [evaluationState?.template?.userAssessment]);

  // Generate final assessment with expertise-weighted metrics - memoize to prevent recreation on every render
  const generateFinalAssessmentCallback = useCallback((userAssessment) => {
    console.log("Generating final assessment with:", userAssessment);
    return generateTemplateFinalAssessment(
      userAssessment,
      orkgData || {},
      evaluationData || {},
      TEMPLATE_CONFIG,
      expertiseMultiplier,
      'template'
    );
  }, [orkgData, evaluationData, expertiseMultiplier]);

  // Handle showing the comparison view
  const handleShowComparison = useCallback((userAssessment) => {
    if (!userAssessment) {
      console.error("handleShowComparison called with undefined userAssessment");
      return;
    }
    
    try {
      console.log("Showing comparison with user assessment:", userAssessment);
      const finalAssessment = generateFinalAssessmentCallback(userAssessment);
      updateSection('template', {
        userAssessment,
        finalAssessment,
        showComparison: true,
        isComplete: true
      });
    } catch (error) {
      console.error("Error generating final assessment:", error, error.stack);
    }
  }, [generateFinalAssessmentCallback, updateSection]);

  // Handle toggling between views
  const handleToggleView = useCallback((show) => {
    setShowComparison(show);
    updateSection('template', { showComparison: show });
  }, [updateSection]);

  // Stable function for edit assessment
  const handleEditAssessment = useCallback(() => {
    handleToggleView(false);
  }, [handleToggleView]);

  // Extract data needed for components
  const templateData = evaluationData?.templates?.llm_template?.template || null;
  const templateName = orkgData?.template_name || null;

  // Prepare the additional data object - memoize to prevent recreation on each render
  const additionalData = useMemo(() => ({
    orkgData,
    evaluationData,
    templateData,
    templateName
  }), [orkgData, evaluationData, templateData, templateName]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 relative">
        <BaseAssessmentManager
          initialData={getNormalizedInitialData()}
          sectionKey="template"
          fieldDefinitions={EVALUATION_FIELDS}
          userInfo={{
            ...userInfo,
            expertiseMultiplier
          }}
          showComparison={showComparison}
          setShowComparison={handleToggleView}
          evaluationState={evaluationState}
          updateSection={updateSection}
          generateFinalAssessment={generateFinalAssessmentCallback}
          onShowComparison={handleShowComparison}
          additionalData={additionalData}
          renderView={({ 
            userAssessment, 
            handleAssessmentChange, 
            isComplete, 
            onShowComparison, 
            finalAssessment, 
            userInfo,
            additionalData
          }) => {
            // Only render the comparison view if we're in show comparison mode
            if (showComparison) {
              return (
                <TemplateEvaluationReport
                  finalAssessment={finalAssessment}
                  orkgData={additionalData.orkgData}
                  evaluationData={additionalData.evaluationData}
                  userInfo={userInfo}
                  onEditAssessment={handleEditAssessment}
                  templateName={additionalData.templateName}
                />
              );
            }
            
            // Otherwise render the form view
            return (
              <TemplateEvaluationForm
                userAssessment={userAssessment}
                handleAssessmentChange={handleAssessmentChange}
                isComplete={isComplete}
                onShowComparison={() => {
                  console.log("View report clicked with assessment:", userAssessment);
                  onShowComparison(userAssessment);
                }}
                orkgData={additionalData.orkgData}
                evaluationData={additionalData.evaluationData}
                templateName={additionalData.templateName}
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

export default TemplateAnalysisSection;