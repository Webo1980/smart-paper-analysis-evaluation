import React, { useState, useCallback, useEffect } from 'react';
import TemplateEvaluationForm from './components/TemplateEvaluationForm';
import TemplateEvaluationReport from './components/TemplateEvaluationReport';
import { calculateTemplateQuality, calculatePropertyMatch } from './utils/templateMetrics';
import { TEMPLATE_CONFIG, QUALITY_WEIGHTS } from './config/templateConfig'; 

const TemplateEvaluationSection = ({ 
  userInfo, 
  evaluationData, 
  orkgData,
  onComplete
}) => {
  const [mode, setMode] = useState('form'); // 'form' or 'report'
  const [userAssessment, setUserAssessment] = useState({});
  const [finalAssessment, setFinalAssessment] = useState(null);
  
  // Determine if we have ORKG template reference or using research problem
  const referenceData = orkgData?.template || null;
  const isOrkgScenario = !!referenceData;
  
  // Get template data
  const templateData = evaluationData?.templates?.llm_template?.template || null;
  
  // Research problem for context (needed when no ORKG reference)
  const researchProblem = {
    title: evaluationData?.researchProblems?.researchProblem?.name || '',
    description: evaluationData?.researchProblems?.researchProblem?.description || '',
    field: evaluationData?.researchFields?.selectedField?.name || 
          evaluationData?.researchFields?.fields?.[0]?.name || ''
  };

  // Generate initial assessment data for accuracy metrics
  useEffect(() => {
    if (!templateData) return;
    
    // Calculate metrics based on scenario
    const referenceForMetrics = isOrkgScenario ? referenceData : researchProblem;
    
    try {
      // Calculate property match scores
      const propertyMatchResults = calculatePropertyMatch(
        templateData.properties || [], 
        referenceForMetrics.properties || []
      );
      
      // Calculate title similarity
      const titleSimilarity = templateData.title === referenceForMetrics.title ? 1.0 : 0.5;
      
      // Calculate automated accuracy score
      const automatedAccuracyScore = (
        (titleSimilarity * 0.2) +
        (propertyMatchResults.f1Score * 0.6) +
        (propertyMatchResults.typeMatch * 0.2)
      );
      
      // Calculate quality metrics
      const qualityMetrics = calculateTemplateQuality(templateData, researchProblem);
      
      // Calculate automated quality score
      const automatedQualityScore = (
        (qualityMetrics.titleAccuracy * QUALITY_WEIGHTS.titleAccuracy) +
        (qualityMetrics.descriptionQuality * QUALITY_WEIGHTS.descriptionQuality) +
        (qualityMetrics.propertyCoverage * QUALITY_WEIGHTS.propertyCoverage) +
        (qualityMetrics.researchAlignment * QUALITY_WEIGHTS.researchAlignment)
      );
      
      // Initial assessment with automated metrics
      setUserAssessment(prev => ({
        ...prev,
        accuracyMetrics: {
          titleMatch: { value: titleSimilarity },
          propertyMatch: { value: propertyMatchResults.f1Score },
          typeAccuracy: { value: propertyMatchResults.typeMatch },
          overallAccuracy: { value: automatedAccuracyScore }
        },
        qualityMetrics: {
          titleAccuracy: { value: qualityMetrics.titleAccuracy },
          descriptionQuality: { value: qualityMetrics.descriptionQuality },
          propertyCoverage: { value: qualityMetrics.propertyCoverage },
          researchAlignment: { value: qualityMetrics.researchAlignment },
          overallQuality: { value: automatedQualityScore }
        }
      }));
    } catch (error) {
      console.error("Error calculating initial metrics:", error);
    }
  }, [templateData, referenceData, isOrkgScenario, researchProblem]);

  // Handle form assessment changes
  const handleAssessmentChange = useCallback((changes) => {
    setUserAssessment(prev => ({
      ...prev,
      ...changes
    }));
  }, []);

  // Handle switching to report view
  const handleShowComparison = useCallback(() => {
    setFinalAssessment({
      ...userAssessment,
      timestamp: new Date().toISOString(),
      expertiseWeight: userInfo?.expertiseWeight || 1,
      expertiseMultiplier: userInfo?.expertiseMultiplier || 1
    });
    setMode('report');
    
    // Call onComplete if provided
    if (typeof onComplete === 'function') {
      onComplete({
        ...userAssessment,
        timestamp: new Date().toISOString(),
        expertiseWeight: userInfo?.expertiseWeight || 1,
        expertiseMultiplier: userInfo?.expertiseMultiplier || 1
      });
    }
  }, [userAssessment, userInfo, onComplete]);

  // Handle switching back to form view
  const handleEditAssessment = useCallback(() => {
    setMode('form');
  }, []);

  // Check if the form is complete enough to submit
  const isFormComplete = Object.keys(userAssessment).length > 0;

  return (
    <div className="pb-10">
      {mode === 'form' ? (
        <TemplateEvaluationForm
          userAssessment={userAssessment}
          handleAssessmentChange={handleAssessmentChange}
          isComplete={isFormComplete}
          onShowComparison={handleShowComparison}
          orkgData={orkgData}
          evaluationData={evaluationData}
        />
      ) : (
        <TemplateEvaluationReport
          finalAssessment={finalAssessment}
          orkgData={orkgData}
          evaluationData={evaluationData}
          userInfo={userInfo}
          onEditAssessment={handleEditAssessment}
        />
      )}
    </div>
  );
};

export default TemplateEvaluationSection;