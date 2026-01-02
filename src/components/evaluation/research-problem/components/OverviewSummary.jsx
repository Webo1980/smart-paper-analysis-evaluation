// src/components/evaluation/research-problem/components/OverviewSummary.jsx
import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const OverviewSummary = ({ comparisonData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm font-medium text-gray-500 mb-1">Text Similarity</div>
        <div className="text-2xl font-bold">{formatPercentage(comparisonData?.overall.levenshtein.similarityScore)}</div>
        <div className="mt-2 flex items-center text-xs">
          <span className={`${
            comparisonData?.overall.levenshtein.similarityScore > 0.7 ? 'text-green-600' : 
            comparisonData?.overall.levenshtein.similarityScore > 0.4 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {comparisonData?.overall.levenshtein.similarityScore > 0.7 ? 'Minor Changes' : 
             comparisonData?.overall.levenshtein.similarityScore > 0.4 ? 'Moderate Changes' : 'Major Changes'}
          </span>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm font-medium text-gray-500 mb-1">Edit Percentage</div>
        <div className="text-2xl font-bold">{formatPercentage(comparisonData?.overall.edits.editPercentage)}</div>
        <div className="mt-2 flex items-center text-xs">
          <span className={`${
            comparisonData?.overall.edits.editPercentage < 0.3 ? 'text-green-600' : 
            comparisonData?.overall.edits.editPercentage < 0.6 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {comparisonData?.overall.edits.editPercentage < 0.3 ? 'Minimal Editing' : 
             comparisonData?.overall.edits.editPercentage < 0.6 ? 'Partial Rewrite' : 'Significant Rewrite'}
          </span>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm font-medium text-gray-500 mb-1">User Satisfaction</div>
        <div className="text-2xl font-bold">{formatPercentage(comparisonData?.overall.satisfactionEstimate)}</div>
        <div className="mt-2 flex items-center text-xs">
          <span className={`${
            comparisonData?.overall.satisfactionEstimate > 0.7 ? 'text-green-600' : 
            comparisonData?.overall.satisfactionEstimate > 0.4 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {comparisonData?.overall.satisfactionEstimate > 0.7 ? 'High Acceptance' : 
             comparisonData?.overall.satisfactionEstimate > 0.4 ? 'Partial Acceptance' : 'Low Acceptance'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverviewSummary;