// src/components/evaluation/research-problem/components/ResearchProblemEvaluationReport.jsx
import React from 'react';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Edit } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import UnderstandingScoresBox from '../../base/UnderstandingScoresBox';
import ResearchProblemAnalysis from './ResearchProblemAnalysis';
import AssessmentSummaryTable from '../../base/AssessmentSummaryTable';
import { 
  RESEARCH_PROBLEM_CONFIG,
  EVALUATION_FIELDS
} from '../config/researchProblemConfig';
import { formatUserRating } from '../utils/researchProblemMetrics';

const ResearchProblemEvaluationReport = ({
  finalAssessment,
  evaluationData,
  userInfo,
  onEditAssessment,
  useAbstract = true
}) => {
  if (!finalAssessment) return null;

  // Calculate scores
  const accuracyScore = finalAssessment.accuracyMetrics?.overallAccuracy?.value || 0;
  const qualityScore = finalAssessment.qualityMetrics?.overallQuality?.value || 0;
  const overallScore = (accuracyScore * RESEARCH_PROBLEM_CONFIG.overallWeights.accuracy) + 
                       (qualityScore * RESEARCH_PROBLEM_CONFIG.overallWeights.quality);
  
  const scoreThresholds = RESEARCH_PROBLEM_CONFIG.scoreThresholds;

  // Format expert rating display
  const expertRatingDisplay = formatUserRating(
    finalAssessment.rating,
    userInfo?.expertiseMultiplier
  );

  // Prepare assessment data
  const getAssessmentData = () => {
    const assessmentData = {};
    
    EVALUATION_FIELDS.forEach(field => {
      const fieldKey = field.id;
      
      // Fix: The data structure is different than expected
      // For fields like problemTitle, the value is directly stored, not as an object
      assessmentData[fieldKey] = {
        rating: typeof finalAssessment[fieldKey] === 'number' 
          ? finalAssessment[fieldKey] 
          : finalAssessment[fieldKey + 'Rating'] || 0,
        comments: finalAssessment[fieldKey + 'Comments'] || ''
      };
    });
    
    assessmentData.overall = {
      comments: finalAssessment.comments || ''
    };
    
    return assessmentData;
  };

  // Generate fields list from EVALUATION_FIELDS config
  const getAssessmentFields = () => {
    return EVALUATION_FIELDS.map(field => ({
      id: field.id,
      label: field.label,
      ...getAssessmentData()[field.id]
    }));
  };

  // Handle edit click
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
        <h2 className="text-2xl font-bold">Research Problem Evaluation Report</h2>
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
        <h3 className="text-lg font-semibold mb-4">Research Problem Analysis Results</h3>
        
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
            <div className="text-gray-600 text-sm mb-1">Overall Score</div>
            <div className="text-2xl font-bold">{formatPercentage(overallScore)}</div>
          </div>
        </div>
        
        <AssessmentSummaryTable
          assessment={getAssessmentData()}
          userInfo={userInfo}
          fields={getAssessmentFields()}
          domainName="research problem"
          scoreThresholds={scoreThresholds}
          getFieldRating={(field) => field.rating || 0}
          getFieldComments={(field) => field.comments || 'No comments provided'}
        />
      </Card>
      <Card className="p-4">
        <ResearchProblemAnalysis 
          assessment={finalAssessment}
          evaluationData={evaluationData}
          expertiseWeight={userInfo?.expertiseWeight || 1}
          expertiseMultiplier={userInfo?.expertiseMultiplier || 1.0}
          useAbstract={useAbstract}
        />
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Expert Comments</h3>
        <Textarea
          className="w-full p-2 text-sm"
          placeholder="Add your expert observations about the research problem..."
          value={finalAssessment.comments || ''}
          readOnly
        />
      </Card>
      <UnderstandingScoresBox />
    </div>
  );
};

export default ResearchProblemEvaluationReport;