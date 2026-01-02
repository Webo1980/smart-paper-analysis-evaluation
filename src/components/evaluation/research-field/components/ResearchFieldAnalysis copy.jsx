// src/components/evaluation/research-field/components/ResearchFieldAnalysis.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BaseFieldAnalysis } from '../../base';
import ResearchFieldPredictionsTable from './ResearchFieldPredictionsTable';
import ResearchFieldAccuracyMetrics from './ResearchFieldAccuracyMetrics';
import ResearchFieldQualityMetrics from './ResearchFieldQualityMetrics';
import SystemConfidenceTable from '../../base/SystemConfidenceTable';
import AdvancedMetricsExplanation from '../../base/AdvancedMetricsExplanation';
import { RESEARCH_FIELD_METRICS } from '../config/researchFieldConfig';

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
  const predictions = evaluationData?.researchFields?.fields || evaluationData?.fields || [];
  
  const selectedField = evaluationData?.researchFields?.selectedField?.name || null;
  
  // Create fields object for BaseFieldAnalysis
  const fields = {
    research_field: {
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
    if (accuracyScore >= 0.9) return 'good';
    if (accuracyScore >= 0.7) return 'medium';
    return 'poor';
  };
  
  // Function to get field details
  const getFieldDetails = (id, originalField, data) => {
    return {
      originalValue: orkgValue,
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
    // Prepare all rating props
    const ratingProps = {
      [RESEARCH_FIELD_METRICS.PRIMARY_FIELD.ratingProp]: assessment.primaryField,
      [RESEARCH_FIELD_METRICS.CONFIDENCE.ratingProp]: assessment.confidence,
      [RESEARCH_FIELD_METRICS.CONSISTENCY.ratingProp]: assessment.consistency,
      [RESEARCH_FIELD_METRICS.RELEVANCE.ratingProp]: assessment.relevance
    };

    if (activeTab === 'accuracy') {
      return (
        <ResearchFieldAccuracyMetrics 
          metrics={assessment.accuracyMetrics}
          orkgData={orkgData}
          predictedValues={predictions}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          rating={assessment.rating}
          {...ratingProps}
        />
      );
    } else {
      return (
        <ResearchFieldQualityMetrics 
          metrics={assessment.qualityMetrics}
          orkgData={orkgData}
          predictedValues={predictions}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          rating={assessment.rating}
          {...ratingProps}
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
        referenceData={{ research_field: orkgValue }}
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
        scoreThresholds={{
          good: 0.9,
          medium: 0.7
        }}
      />
    </>
  );
};

export default ResearchFieldAnalysis;