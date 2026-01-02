// src/components/evaluation/research-field/components/ResearchFieldMetricsDisplay.jsx
import React from 'react';
import { MetricsProgressDisplay } from '../../base';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const ResearchFieldMetricsDisplay = ({ similarityData }) => {
  if (!similarityData) return null;
  
  const data = {
    exactMatch: { score: similarityData.exactMatch || 0 },
    topN: { score: similarityData.topN || 0 },
    positionScore: { score: similarityData.positionScore || 0 }
  };
  
  const config = {
    metrics: {
      exactMatch: { label: 'Exact Match', color: 'bg-blue-400' },
      topN: { label: 'Top-3 Presence', color: 'bg-green-400' },
      positionScore: { label: 'Position Score', color: 'bg-yellow-400' }
    },
    weights: { exactMatch: 0.4, topN: 0.3, positionScore: 0.3 }
  };
  
  // Use finalScore if available, fall back to overallScore
  const displayScore = similarityData.finalScore || similarityData.overallScore || 0;
  
  return <MetricsProgressDisplay 
    data={data} 
    config={config} 
    overallScore={displayScore}
    formatPercentage={formatPercentage}
  />;
};

export default ResearchFieldMetricsDisplay;