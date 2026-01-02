import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BaseFieldAnalysis } from '../../base';
import TemplatePredictionsTable from './TemplatePredictionsTable';
import TemplateAccuracyMetrics from './TemplateAccuracyMetrics';
import TemplateQualityMetrics from './TemplateQualityMetrics';
import SystemConfidenceTable from '../../base/SystemConfidenceTable';
import AdvancedMetricsExplanation from '../../base/AdvancedMetricsExplanation';
import { TEMPLATE_CONFIG } from '../config/templateConfig';

const TemplateAnalysis = ({ 
  assessment, 
  orkgData, 
  evaluationData, 
  expertiseWeight, 
  expertiseMultiplier 
}) => {
  if (!assessment) return null;
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract data
  // For LLM Generated: evaluationData.templates.llm_template.template (title: name, description: description)
  // For ORKG Template: When .llm_template.template has no data
  const templateData = evaluationData?.templates?.llm_template?.template || null;
  
  // Determine the reference data - either ORKG template or research problem
  const referenceData = orkgData?.template || null;
  
  // Determine if we're in ORKG template scenario or LLM generated scenario
  const isOrkgScenario = !!referenceData; // True if ORKG template exists
  
  // Research problem data (needed for either scenario)
  const researchProblem = {
    title: evaluationData?.researchProblems?.researchProblem?.name || '',
    description: evaluationData?.researchProblems?.researchProblem?.description || '',
    field: evaluationData?.researchFields?.selectedField?.name || 
          evaluationData?.researchFields?.fields?.[0]?.name || ''
  };
  
  // Extract ratings from assessment
  const extractRating = (fieldId) => {
    // Check if it's a direct rating number
    if (typeof assessment[fieldId] === 'number') {
      return assessment[fieldId];
    }
    // Check if it's a direct rating object
    if (assessment[fieldId] && typeof assessment[fieldId] === 'object' && 'rating' in assessment[fieldId]) {
      return assessment[fieldId].rating;
    }
    // Check for field-specific rating
    if (assessment[`${fieldId}Rating`]) {
      return typeof assessment[`${fieldId}Rating`] === 'object' ? 
        assessment[`${fieldId}Rating`].rating : 
        assessment[`${fieldId}Rating`];
    }
    // Check if it's in the fields object
    if (assessment.fields && assessment.fields[fieldId]) {
      const field = assessment.fields[fieldId];
      return typeof field.rating === 'object' ? field.rating.rating : field.rating;
    }
    
    return 0;
  };

  // Get all ratings individually
  const titleAccuracyRating = extractRating('titleAccuracy');
  const descriptionQualityRating = extractRating('descriptionQuality');
  const propertyCoverageRating = extractRating('propertyCoverage');
  const researchAlignmentRating = extractRating('researchAlignment');
  
  // Create a unified ratings object for child components 
  const ratings = {
    titleAccuracy: titleAccuracyRating,
    descriptionQuality: descriptionQualityRating,
    propertyCoverage: propertyCoverageRating,
    researchAlignment: researchAlignmentRating
  };
  
  // Create fields object for BaseFieldAnalysis
  const fields = {
    template: {
      accuracyScore: assessment.accuracyMetrics?.overallAccuracy?.value || 0,
      qualityScore: assessment.qualityMetrics?.overallQuality?.value || 0,
      accuracyResults: {
        scoreDetails: { 
          finalScore: assessment.accuracyMetrics?.overallAccuracy?.value || 0
        }
      },
      qualityResults: {
        metricDetails: {
          finalScore: assessment.qualityMetrics?.overallQuality?.value || 0
        }
      }
    }
  };
  
  // Function to get field status
  const getFieldStatus = (field) => {
    const accuracyScore = field.accuracyScore || 0;
    const thresholds = TEMPLATE_CONFIG.scoreThresholds;
    if (accuracyScore >= thresholds.good) return 'good';
    if (accuracyScore >= thresholds.medium) return 'medium';
    return 'poor';
  };
  
  // Function to get field details
  const getFieldDetails = (id, originalField, data) => {
    return {
      originalValue: referenceData || researchProblem,
      evaluatedValue: templateData
    };
  };
  
  // Function to render field content
  const renderFieldContent = (field, fieldDetails, id) => {
    return (
      <div>
        <h5 className="font-medium mb-2">Template Comparison</h5>
        <TemplatePredictionsTable 
          templateData={fieldDetails.evaluatedValue}
          referenceData={fieldDetails.originalValue}
          selectedTemplate={isOrkgScenario ? referenceData?.id : null}
        />
      </div>
    );
  };

  // Function to render metric tabs
  const renderMetricTabs = (field, fieldId, activeTab, tabProps) => {
    if (activeTab === 'accuracy') {
      return (
        <TemplateAccuracyMetrics 
          metrics={assessment.accuracyMetrics}
          templateData={templateData}
          referenceData={isOrkgScenario ? referenceData : researchProblem}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          rating={titleAccuracyRating || 3}
          titleAccuracyRating={titleAccuracyRating}
        />
      );
    } else {
      return (
        <TemplateQualityMetrics 
          metrics={assessment.qualityMetrics}
          templateData={templateData}
          evaluationData={evaluationData}
          researchProblem={researchProblem}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          ratings={ratings}
        />
      );
    }
  };
  
  return (
    <>
      {/* Scoring Framework section */}
      <div className="mb-6 border rounded-lg overflow-hidden">
        <div 
          className="p-4 bg-gray-100 flex justify-between items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center">
            <h3 className="text-lg font-medium">Scoring Framework</h3>
            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="bg-white p-4">
            <AdvancedMetricsExplanation expertiseMultiplier={expertiseMultiplier} />
            <SystemConfidenceTable className="mt-3" />
          </div>
        )}
      </div>

      {/* Template Analysis */}
      <BaseFieldAnalysis
        fields={fields}
        referenceData={{ template: isOrkgScenario ? referenceData : researchProblem }}
        evaluationData={{ template: templateData }}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        getFieldLabel={() => isOrkgScenario ? 'ORKG Template Analysis' : 'AI Template Analysis'}
        getFieldDetails={getFieldDetails}
        renderFieldContent={renderFieldContent}
        renderMetricTabs={renderMetricTabs}
        getFieldStatus={getFieldStatus}
        statusColors={{
          good: 'bg-green-50',
          medium: 'bg-yellow-50', 
          poor: 'bg-red-50'
        }}
        scoreThresholds={TEMPLATE_CONFIG.scoreThresholds}
      />
    </>
  );
};

export default TemplateAnalysis;