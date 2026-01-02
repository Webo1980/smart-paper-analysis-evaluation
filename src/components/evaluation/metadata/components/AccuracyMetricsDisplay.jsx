// src/components/evaluation/metadata/components/AccuracyMetricsDisplay.jsx
import React from 'react';
import { MetricsProgressDisplay } from '../../base';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const AccuracyMetricsDisplay = ({ similarityData }) => {
  if (!similarityData) return null;
  
  const data = {
    levenshtein: { score: similarityData.levenshtein?.score || 0 },
    tokenMatching: { score: similarityData.tokenMatching?.score || 0 },
    specialChar: { score: similarityData.specialChar?.score || 0 }
  };
  
  const config = {
    metrics: {
      levenshtein: { label: 'Levenshtein', color: 'bg-red-400' },
      tokenMatching: { label: 'Token Matching', color: 'bg-blue-400' },
      specialChar: { label: 'Special Characters', color: 'bg-green-400' }
    },
    weights: { levenshtein: 0.5, tokenMatching: 0.3, specialChar: 0.2 }
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

export default AccuracyMetricsDisplay;