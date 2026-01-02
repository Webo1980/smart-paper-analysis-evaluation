import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BaseFieldAnalysis } from '../../base';
import ResearchProblemPreview from './ResearchProblemPreview';
import ResearchProblemAccuracyMetrics from './ResearchProblemAccuracyMetrics';
import ResearchProblemQualityMetrics from './ResearchProblemQualityMetrics';
import SystemConfidenceTable from '../../base/SystemConfidenceTable';
import AdvancedMetricsExplanation from '../../base/AdvancedMetricsExplanation';
import OverviewSummary from './OverviewSummary';
import UserSatisfactionEstimate from './UserSatisfactionEstimate';
import { RESEARCH_PROBLEM_CONFIG } from '../config/researchProblemConfig';
import { extractGroundTruth, extractProblemFromEvalData } from '../utils/researchProblemMetrics';
import { compareResearchProblems } from '../utils/advancedContentAnalysisUtils';

const ResearchProblemAnalysis = ({ 
  assessment, 
  evaluationData, 
  expertiseWeight, 
  expertiseMultiplier,
  useAbstract = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('accuracy');  

  // Extract ground truth (abstract or ORKG problem)
  const groundTruth = extractGroundTruth(evaluationData, useAbstract);
  
  // Extract problem data
  const problemData = extractProblemFromEvalData(evaluationData);
  
  const comparisonData = React.useMemo(() => {
    const originalLLM = evaluationData.researchProblems?.original_llm_problem;
    const editedLLM = evaluationData.researchProblems?.llm_problem;
    
    if (!originalLLM || !editedLLM) return null;
    
    const original = {
      title: originalLLM.title || '',
      description: originalLLM.problem || originalLLM.description || ''
    };
    
    const edited = {
      title: editedLLM.title || '',
      description: editedLLM.problem || editedLLM.description || ''
    };
    
    return compareResearchProblems(original, edited);
  }, [evaluationData]);

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
  const problemTitleRating = extractRating('problemTitle');
  const problemDescriptionRating = extractRating('problemDescription');
  const relevanceRating = extractRating('relevance');
  const completenessRating = extractRating('completeness');
  const evidenceQualityRating = extractRating('evidenceQuality');
  
  // Create fields object for BaseFieldAnalysis
  const fields = {
    research_problem: {
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
    const thresholds = RESEARCH_PROBLEM_CONFIG.scoreThresholds;
    if (accuracyScore >= thresholds.good) return 'good';
    if (accuracyScore >= thresholds.medium) return 'medium';
    return 'poor';
  };
  
  // Function to get field details
  const getFieldDetails = (id, originalField, data) => {
    let originalValue = '';
    if (useAbstract && typeof groundTruth === 'string') {
      originalValue = groundTruth;
    } else if (typeof groundTruth === 'object') {
      originalValue = `${groundTruth.title || ''}\n${groundTruth.description || ''}`;
    }
    
    const problem = problemData || {};
    const evaluatedValue = `${problem.title || problem.problem_title || ''}\n${problem.description || problem.problem_description || ''}`;
    
    return {
      originalValue,
      evaluatedValue,
      groundTruth,
      problem
    };
  };
  
  // Function to render field content
  const renderFieldContent = (field, fieldDetails, id) => {
    return (
      <div>
        <h5 className="font-medium mb-2">Research Problem Preview</h5>
        <ResearchProblemPreview 
            groundTruth={groundTruth}
            problem={evaluationData.researchProblems?.llm_problem}
            originalProblem={evaluationData.researchProblems?.original_llm_problem}
            useAbstract={useAbstract}
        />
      </div>
    );
  };

  // Function to render metric tabs
  const renderMetricTabs = (field, fieldId, activeTab, tabProps) => {
    if (activeTab === 'accuracy') {
      return (
        <ResearchProblemAccuracyMetrics 
          metrics={assessment.accuracyMetrics}
          groundTruth={groundTruth}
          problemData={problemData}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          rating={problemTitleRating}
          completenessRating={completenessRating}
          comparisonData={comparisonData}
        />
      );
    } else {
      return (
        <ResearchProblemQualityMetrics 
          metrics={assessment.qualityMetrics}
          groundTruth={groundTruth}
          problemData={problemData}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          ratings={{
            problemTitle: problemTitleRating,
            problemDescription: problemDescriptionRating,
            relevance: relevanceRating,
            evidenceQuality: evidenceQualityRating
          }}
          comparisonData={comparisonData}
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
      
      {/* Additional components specific to Research Problem Analysis */}
      <div className="mt-6 space-y-6">
        <OverviewSummary comparisonData={comparisonData} />
        <UserSatisfactionEstimate satisfactionEstimate={comparisonData?.overall?.satisfactionEstimate} />
      </div>

      {/* Research Problem Analysis */}
      <div className="mt-6 space-y-6">
        <BaseFieldAnalysis
          fields={fields}
          referenceData={{ research_problem: groundTruth }}
          evaluationData={{ research_problem: problemData }}
          expertiseWeight={expertiseWeight}
          expertiseMultiplier={expertiseMultiplier}
          getFieldLabel={() => 'Research Problem Analysis'}
          getFieldDetails={getFieldDetails}
          renderFieldContent={renderFieldContent}
          renderMetricTabs={renderMetricTabs}
          getFieldStatus={getFieldStatus}
          statusColors={{
            good: 'bg-green-50',
            medium: 'bg-yellow-50', 
            poor: 'bg-red-50'
          }}
          scoreThresholds={RESEARCH_PROBLEM_CONFIG.scoreThresholds}
        />
      </div>
      
    </>
  );
};

export default ResearchProblemAnalysis;