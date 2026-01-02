// src/components/evaluation/template/visualizations/ResearchAlignmentRadar.jsx
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export const ResearchAlignmentRadar = ({ alignmentData, height = 300 }) => {
  if (!alignmentData) {
    return <div className="text-center text-gray-500">No alignment data available</div>;
  }
  
  // Convert object to array format for radar chart
  const data = [
    { name: 'Title Similarity', value: alignmentData.titleSimilarity * 100 },
    { name: 'Description Similarity', value: alignmentData.descriptionSimilarity * 100 },
    { name: 'Property Alignment', value: alignmentData.propertyAlignment * 100 },
    { name: 'Domain Relevance', value: alignmentData.domainRelevance * 100 }
  ];
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
          <Radar name="Alignment" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};