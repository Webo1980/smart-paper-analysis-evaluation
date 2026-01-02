import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BaseFieldAnalysis } from '../../base';
import PropertyAnnotationTable from './PropertyAnnotationTable';
import ContentAccuracyMetrics from './ContentAccuracyMetrics';
import ContentQualityMetrics from './ContentQualityMetrics';
import SystemConfidenceTable from '../../base/SystemConfidenceTable';
import AdvancedMetricsExplanation from '../../base/AdvancedMetricsExplanation';
import { CONTENT_CONFIG } from '../config/contentConfig';

const ContentAnalysis = ({ 
  assessment, 
  orkgData, 
  paperContent,
  templateProperties,
  textSections,
  metrics,
  expertiseWeight, 
  expertiseMultiplier,
  evaluationComparison  // Make sure we receive this prop
}) => {
  if (!assessment) return null;
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract ratings from assessment
  const extractRating = (fieldId) => {
    if (typeof assessment[fieldId] === 'number') {
      return assessment[fieldId];
    }
    if (assessment[fieldId] && typeof assessment[fieldId] === 'object' && 'rating' in assessment[fieldId]) {
      return assessment[fieldId].rating;
    }
    if (assessment[`${fieldId}Rating`]) {
      return typeof assessment[`${fieldId}Rating`] === 'object' ? 
        assessment[`${fieldId}Rating`].rating : 
        assessment[`${fieldId}Rating`];
    }
    if (assessment.fields && assessment.fields[fieldId]) {
      const field = assessment.fields[fieldId];
      return typeof field.rating === 'object' ? field.rating.rating : field.rating;
    }
    
    return 0;
  };

  // Get all ratings individually
  const valueAccuracyRating = extractRating('valueAccuracy');
  const evidenceQualityRating = extractRating('evidenceQuality');
  const propertyCoverageRating = extractRating('propertyCoverage');
  
  // Create a unified ratings object for child components 
  const ratings = {
    valueAccuracy: valueAccuracyRating,
    evidenceQuality: evidenceQualityRating,
    propertyCoverage: propertyCoverageRating
  };
  
  // Create fields object for BaseFieldAnalysis
  const fields = {
    content: {
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
    const thresholds = CONTENT_CONFIG.scoreThresholds;
    if (accuracyScore >= thresholds.excellent) return 'excellent';
    if (accuracyScore >= thresholds.good) return 'good';
    return 'poor';
  };
  
  // Function to get field details
  const getFieldDetails = (id, originalField, data) => {
    return {
      originalValue: templateProperties,
      evaluatedValue: paperContent
    };
  };
  
  // Function to render metric tabs
  const renderMetricTabs = (field, fieldId, activeTab, tabProps) => {
    if (activeTab === 'accuracy') {
      return (
        <ContentAccuracyMetrics 
          metrics={metrics}
          paperContent={paperContent}
          templateProperties={templateProperties}
          textSections={textSections}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          rating={valueAccuracyRating || 3}
        />
      );
    } else {
      return (
        <ContentQualityMetrics 
          metrics={metrics}
          paperContent={paperContent}
          templateProperties={templateProperties}
          textSections={textSections}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          ratings={ratings}
          rating={valueAccuracyRating || 3}
          evaluationComparison={evaluationComparison} // Pass the evaluation comparison data to ContentQualityMetrics
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

      {/* Content Analysis */}
      <BaseFieldAnalysis
        fields={fields}
        referenceData={{ content: templateProperties }}
        evaluationData={{ content: paperContent }}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        getFieldLabel={() => 'Content Analysis'}
        getFieldDetails={getFieldDetails}
        renderMetricTabs={renderMetricTabs}
        getFieldStatus={getFieldStatus}
        statusColors={CONTENT_CONFIG.statusColors}
        scoreThresholds={CONTENT_CONFIG.scoreThresholds}
      />
    </>
  );
};

export default ContentAnalysis;