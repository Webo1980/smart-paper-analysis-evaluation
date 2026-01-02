// src/components/evaluation/template/visualizations/PropertyTypeDistribution.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const PropertyTypeDistribution = ({ typeDistribution, height = 300 }) => {
  if (!typeDistribution || Object.keys(typeDistribution).length === 0) {
    return <div className="text-center text-gray-500">No property type data available</div>;
  }
  
  const data = Object.entries(typeDistribution)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip formatter={(value, name) => [value, 'Count']} labelFormatter={(value) => `Type: ${value}`} />
          <Bar dataKey="count" name="Count" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};