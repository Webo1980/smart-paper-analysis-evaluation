import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BaseFieldAnalysis } from '../../base';
import ResearchFieldPredictionsTable from './ResearchFieldPredictionsTable';
import ResearchFieldAccuracyMetrics from './ResearchFieldAccuracyMetrics';
import ResearchFieldQualityMetrics from './ResearchFieldQualityMetrics';
import SystemConfidenceTable from '../../base/SystemConfidenceTable';
import AdvancedMetricsExplanation from '../../base/AdvancedMetricsExplanation';
import { RESEARCH_FIELD_CONFIG } from '../config/researchFieldConfig';

const ResearchFieldAnalysis = ({ 
  assessment, 
  orkgData, 
  evaluationData, 
  expertiseWeight, 
  expertiseMultiplier 
}) => {
  if (!assessment) return null;
  const [isExpanded, setIsExpanded] = useState(false);  

  // Get ORKG and evaluation values
  const orkgValue = orkgData?.research_field_name || '';
  
  // Get predictions from assessment (already saved) or fallback to evaluationData
  const predictions = assessment.predictions || 
                     evaluationData?.researchFields?.fields || 
                     evaluationData?.fields || [];
  
  const selectedField = assessment.selectedField || 
                       evaluationData?.researchFields?.selectedField?.name || 
                       null;
  
  // Extract the actual rating values from assessment - handle different formats
  const extractRating = (fieldId) => {
    // Check if it's a direct rating number
    if (typeof assessment[fieldId] === 'number') {
      return assessment[fieldId];
    }
    // Check if it's a direct rating object
    if (assessment[fieldId] && typeof assessment[fieldId] === 'object' && 'rating' in assessment[fieldId]) {
      return assessment[fieldId].rating;
    }
    // Check for field-specific rating (primaryFieldRating)
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
  const primaryFieldRating = extractRating('primaryField');
  const confidenceRating = extractRating('confidence');
  const consistencyRating = extractRating('consistency');
  const relevanceRating = extractRating('relevance');
  
  // Create a unified ratings object for child components 
  const ratings = {
    primaryField: primaryFieldRating,
    confidence: confidenceRating,
    consistency: consistencyRating,
    relevance: relevanceRating
  };
  
  // Get ground truth from assessment or orkgData
  const groundTruth = assessment.groundTruth || orkgValue;
  
  // Create fields object for BaseFieldAnalysis
  const fields = {
    research_field: {
      accuracyScore: assessment.accuracyMetrics?.overallAccuracy?.value || 0,
      qualityScore: assessment.qualityMetrics?.overallQuality?.value || 0,
      accuracyResults: {
        scoreDetails: { 
          finalScore: assessment.accuracyMetrics?.overallAccuracy?.value || 0,
          ...assessment.accuracyMetrics?.scoreDetails
        },
        similarityData: assessment.accuracyMetrics?.similarityData || {
          exactMatch: assessment.accuracyMetrics?.exactMatch?.value || 0,
          recall: assessment.accuracyMetrics?.recall?.value || 0,
          topN: assessment.accuracyMetrics?.topN?.value || 0,
          positionScore: assessment.accuracyMetrics?.positionScore?.value || 0,
          f1Score: assessment.accuracyMetrics?.f1Score?.value || 0,
          precision: assessment.accuracyMetrics?.precision?.value || 0,
          foundPosition: assessment.accuracyMetrics?.foundPosition || null
        }
      },
      qualityResults: {
        metricDetails: {
          finalScore: assessment.qualityMetrics?.overallQuality?.value || 0,
          ...assessment.qualityMetrics?.scoreDetails
        },
        qualityData: assessment.qualityMetrics?.qualityData || {
          fieldSpecificMetrics: {
            confidence: { score: assessment.qualityMetrics?.confidence?.value || 0 },
            relevance: { score: assessment.qualityMetrics?.relevance?.value || 0 },
            consistency: { score: assessment.qualityMetrics?.consistency?.value || 0 }
          },
          weights: assessment.qualityMetrics?.weights || { confidence: 0.4, relevance: 0.3, consistency: 0.3 }
        },
        qualityAnalysis: assessment.qualityMetrics?.qualityAnalysis
      }
    }
  };
  
  // Function to get field status
  const getFieldStatus = (field) => {
    const accuracyScore = field.accuracyScore || 0;
    const thresholds = RESEARCH_FIELD_CONFIG.scoreThresholds;
    if (accuracyScore >= thresholds.good) return 'good';
    if (accuracyScore >= thresholds.medium) return 'medium';
    return 'poor';
  };
  
  // Function to get field details
  const getFieldDetails = (id, originalField, data) => {
    return {
      originalValue: groundTruth,
      evaluatedValue: predictions && predictions.length > 0 ? predictions[0].name : ''
    };
  };
  
  // Function to render field content
  const renderFieldContent = (field, fieldDetails, id) => {
    // Render the predictions table
    return (
      <div>
        <h5 className="font-medium mb-2">Ground Truth vs Predictions</h5>
        <ResearchFieldPredictionsTable 
          groundTruth={fieldDetails.originalValue}
          predictions={predictions}
          selectedResearchField={selectedField}
        />
      </div>
    );
  };
  
  // Function to render metric tabs
  const renderMetricTabs = (field, fieldId, activeTab, tabProps) => {
    if (activeTab === 'accuracy') {
      return (
        <ResearchFieldAccuracyMetrics 
          metrics={assessment.accuracyMetrics}
          orkgValue={groundTruth}
          predictedValues={predictions}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          ratings={ratings}
          // Pass the already calculated similarity data
          similarityData={assessment.accuracyMetrics?.similarityData}
        />
      );
    } else {
      return (
        <ResearchFieldQualityMetrics 
          metrics={assessment.qualityMetrics}
          orkgValue={groundTruth}
          predictedValues={predictions}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          ratings={ratings}
          // Pass the already calculated quality data
          qualityData={assessment.qualityMetrics?.qualityData}
          qualityAnalysis={assessment.qualityMetrics?.qualityAnalysis}
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
      
      {/* Research Field Analysis */}
      <BaseFieldAnalysis
        fields={fields}
        referenceData={{ research_field: groundTruth }}
        evaluationData={{ research_field: predictions && predictions.length > 0 ? predictions[0].name : '' }}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        getFieldLabel={() => 'Research Field Analysis'}
        getFieldDetails={getFieldDetails}
        renderFieldContent={renderFieldContent}
        renderMetricTabs={renderMetricTabs}
        getFieldStatus={getFieldStatus}
        statusColors={{
          good: 'bg-green-50',
          medium: 'bg-yellow-50', 
          poor: 'bg-red-50'
        }}
        scoreThresholds={RESEARCH_FIELD_CONFIG.scoreThresholds}
      />
    </>
  );
};

export default ResearchFieldAnalysis;