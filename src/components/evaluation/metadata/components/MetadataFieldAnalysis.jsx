// src\components\evaluation\metadata\components\MetadataFieldAnalysis.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BaseFieldAnalysis } from '../../base';
import { formatDisplayValue } from '../utils/metadataMetrics';
import { FIELD_MAPPINGS } from '../constants/metadataFields';
import MetadataAccuracyMetrics from './MetadataAccuracyMetrics.jsx';
import MetadataQualityMetrics from './MetadataQualityMetrics';
import { metadataFieldsData } from '../constants/metadataFields';

// Import centralized utilities
import { 
  processFieldEvaluation 
} from '../../base/utils/evaluationUtils';

import { 
  getFieldMetrics 
} from '../../base/utils/storageUtils';

/**
 * Component for analyzing and displaying metadata fields
 * Uses the centralized calculation system for consistent metrics
 */
const MetadataFieldAnalysis = ({ 
  fields, 
  orkgData, 
  evaluationData, 
  expertiseWeight, 
  expertiseMultiplier 
}) => {
  console.log(fields);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get field label (unchanged)
  const getFieldLabel = (id) => {
    const labels = {
      'title': 'Title',
      'authors': 'Authors',
      'doi': 'DOI',
      'publication_year': 'Publication Year',
      'venue': 'Venue/Journal'
    };
    return labels[id] || id;
  };
  
  // Get field details from evaluation data (unchanged)
  const getFieldDetails = (id, field, data) => {
    const { referenceData, evaluationData } = data;
    const mapping = FIELD_MAPPINGS[id] || {};
    
    return {
      originalValue: referenceData && mapping.orkgKey ? referenceData[mapping.orkgKey] : '',
      evaluatedValue: evaluationData?.metadata && mapping.evalKey ? evaluationData.metadata[mapping.evalKey] : ''
    };
  };
  
  // Calculate field scores using centralized utility
  const calculateFieldScores = (field, fieldId) => {
    if (!field) return { accuracyScore: 0, qualityScore: 0 };
    
    try {
      const fieldLabel = getFieldLabel(fieldId);
      
      // Get field values for evaluation
      const mapping = FIELD_MAPPINGS[fieldId] || {};
      const orkgValue = orkgData && mapping.orkgKey ? orkgData[mapping.orkgKey] : null;
      let extractedValue = evaluationData?.metadata && mapping.evalKey ? 
                           evaluationData.metadata[mapping.evalKey] : null;
      
      // Special handling for publication year - centralized date handling
      if (fieldId === 'publication_year') {
        // Handle date conversion in the centralized utility
        // The field type 'year' will trigger special handling in processFieldEvaluation
      }
      
      // Process field evaluation using centralized utility
      const fieldEvaluation = processFieldEvaluation(
        fieldLabel,
        orkgValue,
        extractedValue,
        field.rating,
        expertiseMultiplier,
        fieldId,
        {  // Custom quality metrics based on field type
          fieldType: fieldId === 'publication_year' ? 'year' : 
                    fieldId === 'doi' ? 'doi' : 
                    fieldId === 'authors' ? 'authors' : ''
        },
        'metadata'
      );
      
      // Get stored metrics for more details
      const accuracyData = getFieldMetrics(fieldLabel, 'accuracy', 'metadata');
      const qualityData = getFieldMetrics(fieldLabel, 'quality', 'metadata');
      
      return {
        accuracyScore: fieldEvaluation?.accuracyScore || 0,
        qualityScore: fieldEvaluation?.qualityScore || 0,
        accuracyScoreDetails: accuracyData?.scoreDetails,
        qualityScoreDetails: qualityData?.metricDetails,
        autoAccuracyScore: accuracyData?.similarityData?.overallScore || 0,
        autoQualityScore: qualityData?.qualityData?.overallScore || 0
      };
    } catch (error) {
      console.error(`Error calculating field scores for ${fieldId}:`, error);
      return {
        accuracyScore: 0.5, // Fallback value
        qualityScore: 0.5,  // Fallback value
        accuracyScoreDetails: null,
        qualityScoreDetails: null,
        autoAccuracyScore: 0.5,
        autoQualityScore: 0.5
      };
    }
  };
  
  // Render field content with original and evaluated values (unchanged)
  const renderFieldContent = (field, fieldDetails, fieldId) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 border rounded bg-red-50">
          <h5 className="font-medium mb-2 text-red-700">ORKG Value</h5>
          <p className="break-words">{formatDisplayValue(fieldDetails.originalValue, getFieldLabel(fieldId))}</p>
        </div>
        <div className="p-3 border rounded bg-green-50">
          <h5 className="font-medium mb-2 text-green-700">Extracted Value</h5>
          <p className="break-words">{formatDisplayValue(fieldDetails.evaluatedValue, getFieldLabel(fieldId))}</p>
        </div>
      </div>
    );
  };
  
  // Render metric tabs for accuracy and quality (improved with consistent prop handling)
  const renderMetricTabs = (field, fieldId, activeTab, data) => {
    const { originalValue, evaluatedValue } = data;
    
    return activeTab === 'accuracy' ? (
      <MetadataAccuracyMetrics 
        metrics={field.accuracyMetrics}
        orkgValue={originalValue}
        extractedValue={evaluatedValue}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        rating={field.rating}
        fieldName={getFieldLabel(fieldId)}
        accuracyScoreDetails={field.accuracyScoreDetails}
        automatedScore={field.autoAccuracyScore}
      />
    ) : (
      <MetadataQualityMetrics 
        metrics={field.qualityMetrics}
        orkgValue={originalValue}
        extractedValue={evaluatedValue}
        expertiseWeight={expertiseWeight}
        expertiseMultiplier={expertiseMultiplier}
        rating={field.rating}
        fieldName={getFieldLabel(fieldId)}
        qualityScoreDetails={field.qualityScoreDetails}
        automatedScore={field.autoQualityScore}
      />
    );
  };

  // Enhance fields with scores from centralized system
  const enhancedFields = metadataFieldsData.reduce((acc, fieldDef) => {
    const id = fieldDef.id;
    const field = fields[id];
    
    if (field) {
      try {
        // Calculate scores using the centralized utility
        const scores = calculateFieldScores(field, id);
        acc[id] = {
          ...fieldDef,  // Use fieldDef instead of field
          ...field,
          ...scores
        };
      } catch (error) {
        console.error(`Error enhancing field ${id}:`, error);
        // Fallback values with explicit error handling
        acc[id] = {
          ...fieldDef,
          ...field,
          accuracyScore: 0.5,
          qualityScore: 0.5,
          error: error.message
        };
      }
    }
    return acc;
  }, {});
  
  return (
    <div className="mb-6 border rounded-lg overflow-hidden">
      <div 
        className="p-4 bg-gray-100 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <h3 className="text-lg font-medium">Field Analysis</h3>
          {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-white p-4">
          <BaseFieldAnalysis
            fields={enhancedFields}
            referenceData={orkgData}
            evaluationData={evaluationData}
            expertiseWeight={expertiseWeight}
            expertiseMultiplier={expertiseMultiplier}
            getFieldLabel={getFieldLabel}
            getFieldDetails={getFieldDetails}
            formatDisplayValue={formatDisplayValue}
            renderFieldContent={renderFieldContent}
            renderMetricTabs={renderMetricTabs}
          />
        </div>
      )}
    </div>
  );
};

export default MetadataFieldAnalysis;