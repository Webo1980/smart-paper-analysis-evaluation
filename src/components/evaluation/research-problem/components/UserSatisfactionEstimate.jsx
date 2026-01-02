// src/components/evaluation/research-problem/components/UserSatisfactionEstimate.jsx
import React from 'react';
import { SatisfactionGaugeVisualization } from '../visualizations/ProblemComparisonVisualizations';

const UserSatisfactionEstimate = ({ satisfactionEstimate }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="text-lg font-medium mb-2">User Satisfaction Estimate</h3>
      <p className="text-sm text-gray-600 mb-4">
        Based on edit analysis, we estimate the user's satisfaction with the initial AI-generated problem.
        Lower edit percentages generally indicate higher satisfaction with the initial suggestion.
      </p>
      <SatisfactionGaugeVisualization satisfactionScore={satisfactionEstimate} />
    </div>
  );
};

export default UserSatisfactionEstimate;