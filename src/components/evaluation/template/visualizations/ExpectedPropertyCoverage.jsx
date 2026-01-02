
// src/components/evaluation/template/visualizations/ExpectedPropertyCoverage.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TEMPLATE_CONFIG } from '../config/templateConfig';

export const ExpectedPropertyCoverage = ({ categoryDistribution, researchField = 'default', height = 300 }) => {
  if (!categoryDistribution || Object.keys(categoryDistribution).length === 0) {
    return <div className="text-center text-gray-500">No category data available</div>;
  }
  
  // Get expected counts for the research field
  const expectedCounts = TEMPLATE_CONFIG.expectedPropertyCounts[researchField] || 
                          TEMPLATE_CONFIG.expectedPropertyCounts.default;
  
  // Prepare data for comparison
  const data = Object.keys(expectedCounts).map(category => ({
    name: category,
    actual: categoryDistribution[category] || 0,
    expected: expectedCounts[category]
  }));
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value, name) => [value, name === 'actual' ? 'Actual Count' : 'Expected Count']} />
          <Legend />
          <Bar dataKey="actual" fill="#8884d8" name="Actual" />
          <Bar dataKey="expected" fill="#82ca9d" name="Expected" />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-center mt-2 text-gray-600">
        Based on the expected property counts for {researchField !== 'default' ? `${researchField} research` : 'research templates'}
      </div>
    </div>
  );
};