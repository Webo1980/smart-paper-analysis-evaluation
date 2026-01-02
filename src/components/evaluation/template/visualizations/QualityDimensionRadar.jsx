// src/components/evaluation/template/visualizations/QualityDimensionRadar.jsx
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export const QualityDimensionRadar = ({ qualityData, height = 300 }) => {
  if (!qualityData || !qualityData.fieldSpecificMetrics) {
    return <div className="text-center text-gray-500">No quality data available</div>;
  }
  
  const metrics = qualityData.fieldSpecificMetrics;
  
  const data = [
    { name: 'Title Quality', value: (metrics.titleQuality?.score || 0) * 100 },
    { name: 'Description Quality', value: (metrics.descriptionQuality?.score || 0) * 100 },
    { name: 'Property Coverage', value: (metrics.propertyCoverage?.score || 0) * 100 },
    { name: 'Research Alignment', value: (metrics.researchAlignment?.score || 0) * 100 }
  ];
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
          <Radar name="Quality" dataKey="value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};