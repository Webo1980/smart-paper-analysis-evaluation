// src/components/evaluation/research-field/components/QualityMetricsDisplay.jsx
import React from 'react';
import { MetricsProgressDisplay } from '../../base';

const QualityMetricsDisplay = ({ qualityData }) => {
  if (!qualityData) return null;
  
  const data = {
    confidence: { score: qualityData.fieldSpecificMetrics?.confidence?.score || 0 },
    relevance: { score: qualityData.fieldSpecificMetrics?.relevance?.score || 0 },
    consistency: { score: qualityData.fieldSpecificMetrics?.consistency?.score || 0 }
  };
  
  const config = {
    metrics: {
      confidence: { label: 'Confidence', color: 'bg-blue-400' },
      relevance: { label: 'Relevance', color: 'bg-green-400' },
      consistency: { label: 'Consistency', color: 'bg-purple-400' }
    },
    weights: qualityData.weights || { confidence: 0.4, relevance: 0.3, consistency: 0.3 }
  };
  
  return <MetricsProgressDisplay data={data} config={config} overallScore={qualityData.overallScore} />;
};

export default QualityMetricsDisplay;