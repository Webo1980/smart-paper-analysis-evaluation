import React from 'react';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Edit } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import UnderstandingScoresBox from '../../base/UnderstandingScoresBox';
import ResearchFieldAnalysis from './ResearchFieldAnalysis';
import AssessmentSummaryTable from '../../base/AssessmentSummaryTable';
import { 
  RESEARCH_FIELD_CONFIG,
  RESEARCH_FIELD_METRICS,
  EVALUATION_FIELDS
} from '../config/researchFieldConfig';
import { formatUserRating } from '../utils/researchFieldMetrics';

const ResearchFieldEvaluationReport = ({
  finalAssessment,
  orkgData,
  evaluationData,
  userInfo,
  onEditAssessment
}) => {
  if (!finalAssessment) return null;

  // Calculate scores
  const accuracyScore = finalAssessment.accuracyMetrics?.overallAccuracy?.value || 0;
  const qualityScore = finalAssessment.qualityMetrics?.overallQuality?.value || 0;
  const overallScore = (accuracyScore * RESEARCH_FIELD_CONFIG.overallWeights.accuracy) + 
                      (qualityScore * RESEARCH_FIELD_CONFIG.overallWeights.quality);
  console.log(finalAssessment);
  const scoreThresholds = RESEARCH_FIELD_CONFIG.scoreThresholds;

  const expertRatingDisplay = formatUserRating(
    finalAssessment.rating,
    userInfo?.expertiseMultiplier
  );

  // Prepare assessment data using the actual structure from finalAssessment
  const getAssessmentData = () => {
    const assessmentData = {};
    
    Object.values(RESEARCH_FIELD_METRICS).forEach(metric => {
      const fieldKey = metric.key;
      const fieldAssessment = finalAssessment[fieldKey];
      
      assessmentData[fieldKey] = {
        rating: fieldAssessment?.rating || 0,
        comments: fieldAssessment?.comments || ''
      };
    });
    
    assessmentData.overall = {
      comments: finalAssessment.overallComments?.comments || finalAssessment.comments || ''
    };
    
    return assessmentData;
  };

  // Generate fields list from EVALUATION_FIELDS config
  const getAssessmentFields = () => {
    return EVALUATION_FIELDS.map(field => ({
      id: field.id,
      label: field.label,
      // Include the field data from assessment to ensure it's accessible
      ...getAssessmentData()[field.id]
    }));
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onEditAssessment === 'function') {
      onEditAssessment();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Research Field Evaluation Report</h2>
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
        <h3 className="text-lg font-semibold mb-4">Research Field Analysis Results</h3>
        
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
            <div className="text-gray-600 text-sm mb-1">Missing Fields</div>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>
        
        <AssessmentSummaryTable
          assessment={getAssessmentData()}
          userInfo={userInfo}
          fields={getAssessmentFields()}
          domainName="research field detection"
          scoreThresholds={scoreThresholds}
          // Explicitly tell the table how to get field data
          getFieldRating={(field) => field.rating || 0}
          getFieldComments={(field) => field.comments || 'No comments provided'}
        />
      </Card>
      <Card className="p-4">
        <ResearchFieldAnalysis 
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
          placeholder="Add your expert observations about the research field analysis..."
          value={finalAssessment.comments || ''}
          readOnly
        />
      </Card>
      <UnderstandingScoresBox />
    </div>
  );
};

export default ResearchFieldEvaluationReport;