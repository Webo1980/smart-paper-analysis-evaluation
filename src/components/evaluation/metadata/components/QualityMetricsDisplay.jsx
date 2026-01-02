// src/components/evaluation/metadata/components/QualityMetricsDisplay.jsx
import React from 'react';
import { MetricsProgressDisplay } from '../../base';

const QualityMetricsDisplay = ({ qualityData }) => {
  if (!qualityData) return null;
  
  const data = {
    completeness: { score: qualityData.fieldSpecificMetrics?.completeness?.score || 0 },
    consistency: { score: qualityData.fieldSpecificMetrics?.consistency?.score || 0 },
    validity: { score: qualityData.fieldSpecificMetrics?.validity?.score || 0 }
  };
  
  const config = {
    metrics: {
      completeness: { label: 'Completeness', color: 'bg-blue-400' },
      consistency: { label: 'Consistency', color: 'bg-green-400' },
      validity: { label: 'Validity', color: 'bg-purple-400' }
    },
    weights: qualityData.weights || { completeness: 0.4, consistency: 0.3, validity: 0.3 }
  };
  
  return <MetricsProgressDisplay data={data} config={config} overallScore={qualityData.overallScore} />;
};

export default QualityMetricsDisplay;