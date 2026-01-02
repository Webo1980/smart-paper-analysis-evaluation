// src\components\evaluation\base\BaseFieldAnalysis.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { formatPercentage } from './utils/baseMetricsUtils';
import { getStatusBadgeColor, getStatusBackground } from './utils/uiUtils';

/**
 * Helper to safely extract scores with fallbacks
 */
const getFieldScore = (field, scoreType) => {
  try {
    if (!field) return 0;

    // Check for scoreDetails structure first
    if (scoreType === 'accuracy') {
      // Try all possible paths to get the score
      if (field.accuracyScoreDetails?.finalScore !== undefined) {
        return field.accuracyScoreDetails.finalScore;
      } else if (field.accuracyResults?.scoreDetails?.finalScore !== undefined) {
        return field.accuracyResults.scoreDetails.finalScore;
      } else if (field.accuracyScore !== undefined) {
        return field.accuracyScore;
      } else {
        return 0;
      }
    } else {
      // Quality score
      if (field.qualityScoreDetails?.finalScore !== undefined) {
        return field.qualityScoreDetails.finalScore;
      } else if (field.qualityResults?.metricDetails?.finalScore !== undefined) {
        return field.qualityResults.metricDetails.finalScore;
      } else if (field.qualityScore !== undefined) {
        return field.qualityScore;
      } else {
        return 0;
      }
    }
  } catch (error) {
    console.error(`Error extracting ${scoreType} score:`, error);
    return 0;
  }
};

/**
 * Generic field analysis component for displaying expandable field details
 * Now domain-agnostic with full configuration through props
 */
const BaseFieldAnalysis = ({
  fields = {},
  referenceData = {},
  evaluationData = {},
  expertiseWeight = 3,
  expertiseMultiplier = 1.0,
  
  // Customization functions
  getFieldLabel = (id) => id,
  getFieldDetails = (id, originalField, data) => ({
    originalValue: data.referenceData[id] || '',
    evaluatedValue: data.evaluationData[id] || ''
  }),
  formatDisplayValue = (value, fieldType) => String(value || ''),
  renderFieldContent = (field, fieldDetails) => null,
  renderMetricTabs = (field, fieldId) => null,
  
  // Field status and scoring configuration
  getFieldStatus = (field) => {
    const score = getFieldScore(field, 'accuracy');
    if (score >= 0.9) return 'good';
    if (score >= 0.7) return 'medium';
    return 'poor';
  },
  
  // Status colors for customizing UI
  statusColors = {
    good: 'bg-green-50',
    medium: 'bg-yellow-50',
    poor: 'bg-red-50'
  },
  
  // Custom score thresholds
  scoreThresholds = {
    good: 0.9,
    medium: 0.7
  }
}) => {
  const [expandedFields, setExpandedFields] = useState({});
  const [activeMetricTab, setActiveMetricTab] = useState('accuracy');
  
  const toggleField = (fieldId) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };
  
  const handleTabChange = (e, tab) => {
    e.stopPropagation();
    setActiveMetricTab(tab);
  };
  
  // Get all field IDs
  const fieldIds = Object.keys(fields).filter(k => k !== 'overall');
  
  return (
    <div className="space-y-">
      {fieldIds.map((id) => {
        const isExpanded = expandedFields[id] || false;
        const fieldAssessment = fields[id];
        
        if (!fieldAssessment) {
          return null;
        }
        
        // Get field details from data
        const fieldDetails = getFieldDetails(id, fieldAssessment, {
          referenceData,
          evaluationData
        });
        
        // Get values for display
        const displayOriginalValue = formatDisplayValue(fieldDetails.originalValue, getFieldLabel(id));
        const displayEvaluatedValue = formatDisplayValue(fieldDetails.evaluatedValue, getFieldLabel(id));
        
        // Get scores safely with fallbacks
        const accuracyScore = getFieldScore(fieldAssessment, 'accuracy');
        const qualityScore = getFieldScore(fieldAssessment, 'quality');
        
        // Get field status
        const fieldStatus = getFieldStatus(fieldAssessment);
        const statusColor = getStatusBackground(fieldStatus, statusColors);

        return (
          <div key={id} className="border rounded-lg overflow-hidden mb-2">
            {/* Field header */}
            <div 
              className={`p-4 ${statusColor} cursor-pointer flex justify-between items-center`}
              onClick={() => toggleField(id)}
            >
              {/* Header content */}
              <div className="flex items-center">
                <div className="font-medium">{getFieldLabel(id)}</div>
                {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">Accuracy: </span>
                  <Badge className={getStatusBadgeColor(accuracyScore, scoreThresholds)}>
                    {formatPercentage(accuracyScore)}
                  </Badge>
                </div>
                
                {/* Quality Score */}
                <div className="flex items-center space-x-1">
                  <span className="text-sm">Quality: </span>
                  <Badge className={getStatusBadgeColor(qualityScore, scoreThresholds)}>
                    {formatPercentage(qualityScore)}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Field details when expanded */}
            {isExpanded && (
              <div className="p-4 bg-white">
                {/* Custom field content */}
                {renderFieldContent(fieldAssessment, fieldDetails, id)}
                
                {/* Metric tabs and content */}
                <div className="mt-4 border rounded p-3">
                  <h5 className="font-medium mb-3">Field Metrics</h5>
                  
                  {/* Tabs for different metrics */}
                  <div className="mt-4">
                    <div className="flex space-x-4 mb-4">
                      <button
                        className={`px-4 py-2 rounded-lg flex-1 ${activeMetricTab === 'accuracy' ? 'bg-[#E86161] text-white' : 'bg-gray-100'}`}
                        onClick={(e) => handleTabChange(e, 'accuracy')}
                        type="button"
                      >
                        Accuracy Metrics
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg flex-1 ${activeMetricTab === 'quality' ? 'bg-[#E86161] text-white' : 'bg-gray-100'}`}
                        onClick={(e) => handleTabChange(e, 'quality')}
                        type="button"
                      >
                        Quality Metrics
                      </button>
                    </div>
                    
                    <div className="mt-4">
                      {renderMetricTabs(fieldAssessment, id, activeMetricTab, {
                        originalValue: fieldDetails.originalValue,
                        evaluatedValue: fieldDetails.evaluatedValue,
                        displayOriginalValue,
                        displayEvaluatedValue,
                        expertiseWeight,
                        expertiseMultiplier
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Export the component and the utility function
export default BaseFieldAnalysis;
export { getFieldScore };