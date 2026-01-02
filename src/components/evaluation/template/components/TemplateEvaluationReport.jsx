import React from 'react';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Edit } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import UnderstandingScoresBox from '../../base/UnderstandingScoresBox';
import TemplateAnalysis from './TemplateAnalysis';
import AssessmentSummaryTable from '../../base/AssessmentSummaryTable';
import { 
  TEMPLATE_METRICS,
  TEMPLATE_CONFIG,
  EVALUATION_FIELDS
} from '../config/templateConfig';
import { formatUserRating } from '../utils/templateMetrics';

const TemplateEvaluationReport = ({
  finalAssessment,
  orkgData,
  evaluationData,
  userInfo,
  onEditAssessment
}) => {
  if (!finalAssessment) return null;

  // Normalize user assessment data
  const normalizeUserAssessment = (userAssessment) => {
    const normalizedAssessment = {};
    
    // Mapping based on EVALUATION_FIELDS
    EVALUATION_FIELDS.forEach(field => {
      // Handle different possible data structures
      const fieldValue = userAssessment[field.id] || {};
      normalizedAssessment[field.id] = {
        rating: fieldValue.rating !== undefined 
          ? fieldValue.rating 
          : (typeof fieldValue === 'number' ? fieldValue : 0),
        comments: fieldValue.comments || ''
      };
    });

    // Handle overall comments
    normalizedAssessment.overall = {
      comments: userAssessment.overall?.comments || ''
    };

    return normalizedAssessment;
  };

  // Normalize assessment data
  const userAssessment = normalizeUserAssessment(
    finalAssessment.userAssessment || finalAssessment
  );

  // Calculate scores
  const accuracyScore = finalAssessment.accuracyMetrics?.overallAccuracy?.value || 0;
  const qualityScore = finalAssessment.qualityMetrics?.overallQuality?.value || 0;
  const overallScore = (accuracyScore * TEMPLATE_CONFIG.overallWeights.accuracy) + 
                      (qualityScore * TEMPLATE_CONFIG.overallWeights.quality);
  
  const scoreThresholds = TEMPLATE_CONFIG.scoreThresholds;

  // Format expert rating for display
  const expertRatingDisplay = formatUserRating(
    finalAssessment.rating,
    userInfo?.expertiseMultiplier
  );

  // Prepare assessment data 
  const getAssessmentData = () => {
    const assessmentData = {};
    
    EVALUATION_FIELDS.forEach(field => {
      assessmentData[field.id] = {
        rating: userAssessment[field.id]?.rating || 0,
        comments: userAssessment[field.id]?.comments || ''
      };
    });
    
    assessmentData.overall = {
      comments: userAssessment.overall?.comments || ''
    };
    
    return assessmentData;
  };

  // Generate fields list for summary table
  const getAssessmentFields = () => {
    return EVALUATION_FIELDS.map(field => ({
      id: field.id,
      label: field.label,
      ...getAssessmentData()[field.id]
    }));
  };

  // Handle edit button click
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onEditAssessment === 'function') {
      onEditAssessment();
    }
  };

  // Determine reference mode
  const isOrkgMode = !!orkgData?.template;
  const referenceType = isOrkgMode ? "ORKG template" : "research problem context";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Template Evaluation Report</h2>
        <Button
          variant="outline"
          onClick={handleEditClick}
          className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-2 p-2 rounded-md"
          type="button"
        >
          <Edit className="h-4 w-4" />
          Edit Assessment
        </Button>
      </div>
      
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Template Analysis Results</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600 text-sm mb-1">Expert Rating</div>
            <div className="text-2xl font-bold">
              {expertRatingDisplay}/5
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg flex items-center">
            <div>
              <div className="text-gray-600 text-sm mb-1">Accuracy</div>
              <Badge className={getStatusBadgeColor(accuracyScore, scoreThresholds)}>
                {formatPercentage(accuracyScore)}
              </Badge>
            </div>
            <div className="ml-4">
              <div className="text-gray-600 text-sm mb-1">Quality</div>
              <Badge className={getStatusBadgeColor(qualityScore, scoreThresholds)}>
                {formatPercentage(qualityScore)}
              </Badge>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600 text-sm mb-1">Reference Type</div>
            <div className="text-sm font-medium capitalize">{referenceType}</div>
          </div>
        </div>
        
        <AssessmentSummaryTable
          assessment={getAssessmentData()}
          userInfo={userInfo}
          fields={getAssessmentFields()}
          domainName="template"
          scoreThresholds={scoreThresholds}
          getFieldRating={(field) => field.rating || 0}
          getFieldComments={(field) => field.comments || 'No comments provided'}
        />
      </Card>
      <Card className="p-4">
        <TemplateAnalysis 
          assessment={finalAssessment}
          orkgData={orkgData}
          evaluationData={evaluationData}
          expertiseWeight={userInfo?.expertiseWeight || 1}
          expertiseMultiplier={userInfo?.expertiseMultiplier || 1.0}
        />
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Expert Comments</h3>
        <Textarea
          className="w-full p-2 text-sm"
          placeholder="Add your expert observations about the template..."
          value={userAssessment.overall?.comments || ''}
          readOnly
        />
      </Card>
      <UnderstandingScoresBox />
    </div>
  );
};

export default TemplateEvaluationReport;