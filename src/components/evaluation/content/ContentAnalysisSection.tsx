import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { useForm } from '../../../context/FormContext';
import BaseAssessmentManager from '../base/BaseAssessmentManager';
import { NavigationButtons } from '../base';
import { expertiseToMultiplier } from '../base/utils/baseMetricsUtils';
import { storeFieldMetrics } from '../base/utils/storageUtils';
import { EVALUATION_FIELDS, CONTENT_CONFIG } from './config/contentConfig';
import ContentEvaluationForm from './components/ContentEvaluationForm';
import ContentEvaluationReport from './components/ContentEvaluationReport';
import { processContentMetrics } from './utils/contentMetrics';
import { 
  storeAllContentMetrics
} from './utils/contentMetricsStorage';

const ContentAnalysisSection = ({ userInfo, onNext, onPrevious }) => {
  const { evaluationState, updateSection } = useEvaluation();
  const { evaluationData } = useForm();
  
  // Use ref to track if we've already initialized
  const isInitializedRef = useRef(false);
  
  // Get the initial showComparison value from evaluationState
  const initialShowComparison = evaluationState?.content?.showComparison || false;
  const [showComparison, setShowComparison] = useState(initialShowComparison);
  
  // Extract relevant data from evaluationData
  const paperContent = useMemo(() => 
    evaluationData?.paperContent?.paperContent || {}, 
    [evaluationData?.paperContent?.paperContent]
  );
  console.log("in contentsection the evaluationData: ",evaluationData);
  const templateProperties = useMemo(() => {
  // Check if LLM template exists and is not null/false
  if (evaluationData?.templates?.llm_template && 
      evaluationData.templates.llm_template !== null && 
      evaluationData.templates.llm_template !== false) {
    // LLM-generated template
    return evaluationData.templates.llm_template.template?.properties || [];
  } else {
    // ORKG template - this is the fallback you're missing!
    return evaluationData?.templates?.selectedTemplate?.template?.properties || [];
  }
}, [evaluationData?.templates]);
  console.log("in contentsection the templateProperties: ",evaluationData?.templates?.selectedTemplate);
  
  const textSections = useMemo(() => 
    evaluationData?.paperContent?.text_sections || {}, 
    [evaluationData?.paperContent?.text_sections]
  );

  // Extract evaluationComparison from evaluationData once
  const extractedComparisonData = useMemo(() => 
    evaluationData?.paperContent?.evaluationComparison || null,
    [evaluationData?.paperContent?.evaluationComparison]
  );
  
  // Generate evaluation comparison data if not already available
  const evaluationComparison = useMemo(() => {
    if (extractedComparisonData) {
      return extractedComparisonData;
    }
    
    if (isInitializedRef.current && evaluationState?.content?.evaluationComparison) {
      return evaluationState.content.evaluationComparison;
    }
    
    const originalData = evaluationData?.paperContent;
    
    if (originalData && !isInitializedRef.current) {
      const comparisonData = {
        original_data: originalData,
        new_data: originalData,
        changes: {
          modified: [],
          added: [],
          removed: []
        }
      };
      
      isInitializedRef.current = true;
      return comparisonData;
    }
    
    return null;
  }, [extractedComparisonData, evaluationData?.paperContent]);
  
  // Calculate expertise multiplier using centralized utility
  const expertiseMultiplier = useMemo(() => {
    return expertiseToMultiplier(userInfo?.expertiseWeight || 5);
  }, [userInfo?.expertiseWeight]);
  
  // Sync showComparison with evaluationState changes
  useEffect(() => {
    const stateShowComparison = evaluationState?.content?.showComparison;
    if (stateShowComparison !== undefined && stateShowComparison !== showComparison) {
      setShowComparison(stateShowComparison);
    }
  }, [evaluationState?.content?.showComparison]);
  
  // Create normalized assessment structure
  const getNormalizedInitialData = useCallback(() => {
    const existing = evaluationState?.content?.userAssessment || {};
    const normalized = {};
    
    EVALUATION_FIELDS.forEach(field => {
      normalized[field.id] = { rating: 0, comments: '' };
      
      if (existing[field.id] && typeof existing[field.id] === 'object' && 'rating' in existing[field.id]) {
        normalized[field.id] = existing[field.id];
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
  }, [evaluationState?.content?.userAssessment]);
  
  // Generate metrics for content evaluation
  const metrics = useMemo(() => {
    try {
      if (paperContent && templateProperties?.length > 0) {
        return processContentMetrics(paperContent, templateProperties, textSections, evaluationComparison);
      }
      return null;
    } catch (error) {
      console.error("Error generating metrics:", error);
      return null;
    }
  }, [paperContent, templateProperties, textSections, evaluationComparison]);
  
  // Generate final assessment with expertise-weighted metrics
  const generateFinalAssessmentCallback = useCallback((userAssessment) => {
    if (!userAssessment) return null;
    
    console.log('Generating final assessment for content');
    
    // Calculate weighted metrics using user ratings
    const userRatings = {
      propertyCoverage: userAssessment.propertyCoverage?.rating || userAssessment.propertyCoverage || 0,
      evidenceQuality: userAssessment.evidenceQuality?.rating || userAssessment.evidenceQuality || 0,
      valueAccuracy: userAssessment.valueAccuracy?.rating || userAssessment.valueAccuracy || 0
    };
    
    // Process metrics with user ratings
    const enhancedMetrics = processContentMetrics(
      paperContent, 
      templateProperties, 
      textSections, 
      evaluationComparison,
      userRatings.valueAccuracy, // Pass user rating for value accuracy
      expertiseMultiplier
    );
    
    return {
      userAssessment,
      metrics: enhancedMetrics,
      expertiseMultiplier,
      userInfo,
      date: new Date().toISOString(),
      evaluationData: {
        paperContent,
        templateProperties,
        textSections,
        evaluationComparison
      }
    };
  }, [metrics, expertiseMultiplier, userInfo, paperContent, templateProperties, textSections, evaluationComparison]);
  
  // Handle showing the comparison view
  const handleShowComparison = useCallback((userAssessment) => {
    if (!userAssessment) {
      console.error("handleShowComparison called with undefined userAssessment");
      return;
    }
    
    try {
      console.log('Showing comparison view and saving metrics');
      const finalAssessment = generateFinalAssessmentCallback(userAssessment);
      
      // Store all content metrics to localStorage using the centralized storage
      storeAllContentMetrics({
        templateProperties: templateProperties,
        paperContent: paperContent,
        userRatings: {
          propertyCoverage: userAssessment.propertyCoverage?.rating || userAssessment.propertyCoverage || 0,
          evidenceQuality: userAssessment.evidenceQuality?.rating || userAssessment.evidenceQuality || 0,
          valueAccuracy: userAssessment.valueAccuracy?.rating || userAssessment.valueAccuracy || 0
        },
        expertiseMultiplier: expertiseMultiplier,
        evaluationData: evaluationData
      });
      
      // Create update object without circular references
      const updateData = {
        userAssessment,
        finalAssessment,
        showComparison: true,
        isComplete: true,
        paperContent
      };
      
      // Only include evaluationComparison if it doesn't already exist in state
      if (!evaluationState?.content?.evaluationComparison && evaluationComparison) {
        updateData.evaluationComparison = evaluationComparison;
      }
      
      updateSection('content', updateData);
    } catch (error) {
      console.error("Error generating final assessment:", error);
    }
  }, [generateFinalAssessmentCallback, updateSection, paperContent, evaluationComparison, evaluationState?.content?.evaluationComparison, templateProperties, expertiseMultiplier]);
  
  // Handle toggling between views
  const handleToggleView = useCallback((show) => {
    setShowComparison(show);
    
    if (evaluationState?.content?.showComparison !== show) {
      updateSection('content', { showComparison: show });
    }
  }, [updateSection, evaluationState?.content?.showComparison]);
  
  // Handle edit assessment
  const handleEditAssessment = useCallback(() => {
    handleToggleView(false);
  }, [handleToggleView]);
  
  // Prepare additional data
  const additionalData = useMemo(() => {
    return {
      paperContent,
      templateProperties,
      textSections,
      metrics,
      evaluationComparison: evaluationState?.content?.evaluationComparison || evaluationComparison
    };
  }, [paperContent, templateProperties, textSections, metrics, evaluationComparison, evaluationState?.content?.evaluationComparison]);
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 relative">
        <BaseAssessmentManager
          initialData={getNormalizedInitialData()}
          sectionKey="content"
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
            if (showComparison) {
              return (
                <ContentEvaluationReport
                  finalAssessment={finalAssessment}
                  paperContent={paperContent}
                  templateProperties={templateProperties}
                  textSections={textSections}
                  metrics={metrics}
                  orkgData={evaluationData?.orkgData}
                  userInfo={userInfo}
                  onEditAssessment={handleEditAssessment}
                  evaluationComparison={additionalData.evaluationComparison}
                />
              );
            }
            
            return (
              <ContentEvaluationForm
                userAssessment={userAssessment}
                handleAssessmentChange={handleAssessmentChange}
                isComplete={isComplete}
                onShowComparison={() => onShowComparison(userAssessment)}
                paperContent={paperContent}
                templateProperties={templateProperties}
                textSections={textSections}
                metrics={metrics}
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

export default ContentAnalysisSection;