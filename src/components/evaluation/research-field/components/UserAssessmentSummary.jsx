import React from 'react';
import AssessmentSummaryTable from '../../base/AssessmentSummaryTable';
import { RESEARCH_FIELD_METRICS } from '../config/researchFieldConfig';

const UserAssessmentSummary = ({ 
  assessment, 
  userInfo 
}) => {
  if (!assessment) return null;
  console.log(assessment, 
    userInfo );
  // Custom fields function to work with AssessmentSummaryTable
  const getFields = () => {
    // Map metrics to fields format needed by AssessmentSummaryTable
    return Object.values(RESEARCH_FIELD_METRICS).map(metric => {
      // Check both possible data structures
      let rating = 0;
      let comments = '';
      
      // Check if data is in the root level
      if (assessment[metric.key] !== undefined) {
        rating = assessment[metric.key].rating || 0;
        comments = assessment[metric.key].comments || '';
      } 
      // Check if data is in a nested format
      else if (assessment[metric.ratingProp] !== undefined) {
        rating = assessment[metric.ratingProp];
        comments = assessment[metric.commentsProp] || '';
      }
      // Fallback to field notation
      else if (assessment.fields && assessment.fields[metric.key]) {
        const field = assessment.fields[metric.key];
        rating = field.rating || 0;
        comments = field.comments || '';
      }
      
      return {
        id: metric.key,
        label: metric.label,
        rating: Number(rating),
        score: Number(rating) / 5,
        comments
      };
    }).filter(field => field.rating > 0);
  };
  
  const fields = getFields();
  
  return (
    <AssessmentSummaryTable
      assessment={assessment}
      userInfo={userInfo}
      fields={fields}
      fieldLabelKey="Research Field Metric"
      domainName="research field assessment"
      scoreThresholds={{ good: 0.9, medium: 0.7 }}
    />
  );
};

export default UserAssessmentSummary;