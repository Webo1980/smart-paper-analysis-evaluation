// src/components/evaluation/research-problem/visualizations/SpiderChartVisualization.jsx
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

/**
 * Renders a spider chart (radar chart) for visualizing multi-dimensional metrics
 */
const SpiderChartVisualization = ({ 
  data, 
  height = 300, 
  title = 'Evaluation Metrics',
  description = 'Higher scores (further from center) indicate better performance'
}) => {
  // Format data for the radar chart
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    score: typeof value === 'number' ? value * 100 : 0,
    fullMark: 100
  }));

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-base font-medium text-center">{title}</h3>
      )}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.5}
            />
            <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Score']} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {description && (
        <p className="text-sm text-gray-500 text-center">{description}</p>
      )}
    </div>
  );
};

export default SpiderChartVisualization;