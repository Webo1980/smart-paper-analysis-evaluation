// src\components\evaluation\base\AssessmentSummaryTable.jsx
import React, { useState } from 'react';
import { Badge } from '../../ui/badge';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { formatPercentage } from './utils/baseMetricsUtils';
import { getStatusBadgeColor } from './utils/uiUtils';

/**
 * A reusable assessment summary table component that can work with different evaluation types.
 */
const AssessmentSummaryTable = ({
  assessment,
  userInfo,
  fields,
  getFieldLabel = (fieldId, fieldData) => {
    // Default implementation for getFieldLabel
    if (fieldData && fieldData.label) return fieldData.label;
    
    // Convert camelCase or snake_case to Title Case
    if (typeof fieldId === 'string') {
      return fieldId
        // Insert a space before all uppercase letters
        .replace(/([A-Z])/g, ' $1')
        // Replace underscores with spaces
        .replace(/_/g, ' ')
        // Capitalize the first letter of each word
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
    }
    
    return 'Unknown Field';
  },
  getFieldRating = (field) => field.rating || field.score || 0,
  getFieldComments = (field) => field.comments || 'No comments provided',
  calculateOverallScore,
  fieldLabelKey = "Assessment",
  domainName = "this assessment",
  formatPercentageOverride,
  scoreOptions = {},
  
  // Thresholds for score coloring
  scoreThresholds = {
    good: 0.9,
    medium: 0.7
  }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
  
  if (!assessment) return null;

  const toggleFieldDetails = (fieldId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };
  
  // Get expertise multiplier or default to 1
  const expertiseMultiplier = userInfo?.expertiseMultiplier || 1.0;
  
  // Determine field list - can be array of strings, array of objects, or function that returns fields
  const fieldsList = typeof fields === 'function' 
    ? fields(assessment)
    : Array.isArray(fields) 
      ? fields
      : Object.keys(assessment).filter(key => key !== 'overall');
  
  /**
   * Default overall score calculation
   */
  const defaultCalculateOverallScore = (assessmentData, expMultiplier) => {
    if (!assessmentData) return 0;
    
    let totalScore = 0;
    let validFields = 0;
    
    fieldsList.forEach(field => {
      const fieldId = typeof field === 'string' ? field : field.id;
      const fieldData = typeof field === 'object' ? field : assessmentData[fieldId];
      
      if (fieldData) {
        const rating = getFieldRating(fieldData, fieldId, assessmentData);
        if (rating > 0) {
          const score = Math.min((rating / 5) * expMultiplier, 1);
          totalScore += score;
          validFields++;
        }
      }
    });
    
    return validFields > 0 ? totalScore / validFields : 0;
  };
  
  // Use provided functions or defaults
  const formatPercentageFunc = formatPercentageOverride || formatPercentage;
  const calculateOverallScoreFunc = calculateOverallScore || defaultCalculateOverallScore;
  
  // Calculate overall score
  const overallScore = calculateOverallScoreFunc(assessment, expertiseMultiplier);
  
  return (
    <div className="mb-6 border rounded-lg overflow-hidden">
      <div 
        className="p-4 bg-gray-100 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <h3 className="text-lg font-medium">User Assessment</h3>
          {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm font-medium mr-2">Overall:</span>
            <Badge className={getStatusBadgeColor(overallScore, scoreThresholds)}>
              {formatPercentageFunc(overallScore)}
            </Badge>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{fieldLabelKey}</TableHead>
                <TableHead>Expert Rating</TableHead>
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead className="w-[200px]">Comments</TableHead>
                <TableHead className="w-[80px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldsList.map(field => {
                // Handle both string IDs and object fields
                const fieldId = typeof field === 'string' ? field : field.id;
                // Get the field data - either from the field object or from the assessment
                const fieldData = typeof field === 'object' ? field : assessment[fieldId];
                
                if (!fieldData) return null;
                
                // Get rating for this field
                const rating = getFieldRating(fieldData, fieldId, assessment);
                // Calculate score based on rating and expertise multiplier
                const baseScore = rating / 5;
                const calculatedScore = Math.min(baseScore * expertiseMultiplier, 1);
                const isExpanded = expandedDetails[fieldId] || false;
                
                return (
                  <React.Fragment key={fieldId}>
                    <TableRow className={isExpanded ? 'border-b-0' : ''}>
                      <TableCell className="font-medium">
                        {getFieldLabel(fieldId, fieldData)}
                      </TableCell>
                      <TableCell>
                        {rating}/5
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(calculatedScore, scoreThresholds)}>
                          {formatPercentageFunc(calculatedScore)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {getFieldComments(fieldData, fieldId, assessment)}
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFieldDetails(fieldId);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                          type="button"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 p-4">
                          <div className="text-sm">
                            <h6 className="font-medium mb-2">Explanation</h6>
                            {scoreOptions.explanationComponent ? (
                              <scoreOptions.explanationComponent 
                                fieldId={fieldId} 
                                fieldData={fieldData} 
                                label={getFieldLabel(fieldId, fieldData)} 
                              />
                            ) : (
                              <p>
                                This metric assesses the quality of {getFieldLabel(fieldId, fieldData).toLowerCase()} 
                                for {domainName}. The score is based on expert rating and adjusted 
                                by the evaluator's expertise level.
                              </p>
                            )}
                            
                            <div className="mt-4 bg-white p-3 rounded border">
                              <h6 className="font-medium mb-1">Score Calculation</h6>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Expert Rating:</div>
                                <div>
                                  {rating}/5 ({(rating/5*100).toFixed(1)}%)
                                </div>
                                
                                <div>Expertise Multiplier:</div>
                                <div>{expertiseMultiplier.toFixed(2)}×</div>
                                
                                <div className="font-medium">Final Score:</div>
                                <div className="font-medium">
                                  {formatPercentageFunc(calculatedScore)}
                                </div>
                                <div className="col-span-2 text-xs text-gray-500 mt-1">
                                  <p>Formula: (Rating/5) × Expertise Multiplier = Final Score (capped at 100%)</p>
                                  <p>
                                    {(() => {
                                      const baseScore = (rating/5);
                                      const withMultiplier = baseScore * expertiseMultiplier;
                                      const rawResult = withMultiplier;
                                      
                                      return (
                                        <>
                                          {baseScore.toFixed(2)} × {expertiseMultiplier.toFixed(2)} 
                                          = {(rawResult * 100).toFixed(1)}%
                                          {rawResult > 1 ? ` → Final Score: 100% (capped)` : ''}
                                        </>
                                      );
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AssessmentSummaryTable;