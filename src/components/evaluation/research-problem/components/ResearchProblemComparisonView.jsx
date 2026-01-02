// src/components/evaluation/research-problem/components/ResearchProblemComparisonView.jsx
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { compareResearchProblems } from '../utils/advancedContentAnalysisUtils';

// Import all the smaller components
import OverviewSummary from './OverviewSummary';
import UserSatisfactionEstimate from './UserSatisfactionEstimate';
import EditOperationAnalysis from './EditOperationAnalysis';

const ResearchProblemComparisonView = ({ originalProblem, editedProblem }) => {
  console.log(originalProblem, editedProblem);
  const [expandedSections, setExpandedSections] = useState({
    titleComparison: false,
    descriptionComparison: false,
    editDistance: false,
    tokenMatching: false,
    specialCharacters: false,
    editAnalysis: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Compare problems
  const comparisonData = React.useMemo(() => 
    compareResearchProblems(originalProblem, editedProblem), 
    [originalProblem, editedProblem]
  );

  if (!comparisonData) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-center text-amber-700">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Insufficient data for comparison. Both original and edited problems are required.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Summary */}
      <OverviewSummary comparisonData={comparisonData} />
      {/* Satisfaction Gauge */}
      <UserSatisfactionEstimate satisfactionEstimate={comparisonData.overall.satisfactionEstimate} />
    </div>
  );
};

export default ResearchProblemComparisonView;