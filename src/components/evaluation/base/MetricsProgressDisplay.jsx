// src/components/evaluation/base/MetricsProgressDisplay.jsx
import React from 'react';

const MetricsProgressDisplay = ({ 
  data, 
  config, 
  overallScore,
  formatPercentage = (value) => `${Math.round(value * 100)}%`
}) => {
  if (!data || !config) return null;
  
  // Calculate contribution to total score for the progress bar
  const contributions = {};
  let totalContribution = 0;
  
  // Process each metric
  Object.keys(config.metrics).forEach(key => {
    const metricValue = data[key]?.score || 0;
    const weight = config.weights[key] || 0;
    contributions[key] = metricValue * weight;
    totalContribution += contributions[key];
  });
  
  return (
    <div className="space-y-2 mt-2">
      {Object.keys(config.metrics).map(key => (
        <div key={key} className="flex items-center justify-between">
          <div className="flex items-center">
            <div 
              className={`w-3 h-3 rounded-full mr-2 ${config.metrics[key].color}`}
            ></div>
            <span className="text-xs">
              {config.metrics[key].label} ({(config.weights[key] * 100).toFixed(0)}%)
            </span>
          </div>
          <span className="text-xs font-medium">
            {formatPercentage(data[key]?.score || 0)}
          </span>
        </div>
      ))}
      
      {/* Progress bar showing relative contributions */}
      <div className="h-2 w-full bg-gray-200 rounded overflow-hidden mt-2">
        <div className="flex h-full">
          {Object.keys(config.metrics).map(key => (
            <div 
              key={key}
              className={`${config.metrics[key].color} h-full`} 
              style={{ 
                width: totalContribution > 0 ? 
                  `${(contributions[key] / totalContribution) * 100}%` : 
                  '0%'
              }}
              title={`${config.metrics[key].label}: ${formatPercentage(contributions[key])}`}
            ></div>
          ))}
        </div>
      </div>
      
      <div className="text-center text-xs font-medium mt-1">
        Overall Score: {formatPercentage(totalContribution)}
      </div>
    </div>
  );
};

export default MetricsProgressDisplay;