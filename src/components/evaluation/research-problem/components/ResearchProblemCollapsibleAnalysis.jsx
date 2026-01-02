// src/components/evaluation/research-problem/components/ResearchProblemCollapsibleAnalysis.jsx
import React from 'react';
import OverviewSummary from './OverviewSummary';
import UserSatisfactionEstimate from './UserSatisfactionEstimate';
import ResearchProblemAccuracyMetrics from './ResearchProblemAccuracyMetrics';
import ResearchProblemQualityMetrics from './ResearchProblemQualityMetrics';

const ResearchProblemCollapsibleAnalysis = ({
  assessment,
  evaluationData,
  expertiseWeight,
  expertiseMultiplier,
  useAbstract = true
}) => {
  const [activeTab, setActiveTab] = React.useState('accuracy');

  // Extract ground truth and problem data
  const groundTruth = typeof evaluationData.groundTruth === 'object' ? 
    evaluationData.groundTruth : useAbstract ? evaluationData.abstract : '';
  
  const problemData = typeof evaluationData.problem === 'object' ?
    evaluationData.problem : { title: '', description: '' };

  // Extract comparison data if available
  const comparisonData = evaluationData.comparisonData || {};
  
  return (
    <div className="space-y-6">
      {/* Overview and Satisfaction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OverviewSummary comparisonData={comparisonData} />
        <UserSatisfactionEstimate satisfactionEstimate={comparisonData?.overall?.satisfactionEstimate || 0.7} />
      </div>
      
      {/* Tabs for Accuracy and Quality */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'accuracy' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('accuracy')}
          >
            Accuracy Analysis
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'quality' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('quality')}
          >
            Quality Analysis
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'accuracy' ? (
            <ResearchProblemAccuracyMetrics
              metrics={assessment.accuracyMetrics}
              groundTruth={groundTruth}
              problemData={problemData}
              expertiseWeight={expertiseWeight}
              expertiseMultiplier={expertiseMultiplier}
              rating={assessment.problemTitleRating}
              completenessRating={assessment.completenessRating}
            />
          ) : (
            <ResearchProblemQualityMetrics
              metrics={assessment.qualityMetrics}
              groundTruth={groundTruth}
              problemData={problemData}
              expertiseWeight={expertiseWeight}
              expertiseMultiplier={expertiseMultiplier}
              ratings={{
                problemTitle: assessment.problemTitleRating,
                problemDescription: assessment.problemDescriptionRating,
                relevance: assessment.relevanceRating,
                evidenceQuality: assessment.evidenceQualityRating
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchProblemCollapsibleAnalysis;