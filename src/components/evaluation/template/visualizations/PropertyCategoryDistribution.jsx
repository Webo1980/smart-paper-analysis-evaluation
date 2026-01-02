import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const PropertyCategoryDistribution = ({ categoryDistribution, height = 300 }) => {
  if (!categoryDistribution || Object.keys(categoryDistribution).length === 0) {
    return <div className="text-center text-gray-500">No category data available</div>;
  }
  
  // Calculate total for percentage calculations
  const total = Object.values(categoryDistribution).reduce((sum, value) => sum + value, 0);
  
  // Process data with pre-calculated percentages
  const data = Object.entries(categoryDistribution)
    .map(([name, value]) => ({ 
      name, 
      value,
      percent: total > 0 ? value / total : 0 // Pre-calculate percentage to avoid NaN
    }))
    .sort((a, b) => b.value - a.value);
  
  // Enhanced color palette with better contrast
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Render labels directly without connecting lines
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    // Only show labels for segments that are large enough (prevents clutter)
    if (percent < 0.05) return null;
    
    // Calculate position (further away from the pie to prevent line overlap)
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.25; // Position labels further out
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip formatter with fixed percentage calculation
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const itemPercent = item.payload.percent || 0; // Use pre-calculated percent
      
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">
            Count: <span className="font-medium">{item.value}</span>
          </p>
          <p className="text-sm">
            Percentage: <span className="font-medium">{(itemPercent * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart margin={{ top: 20, right: 40, left: 40, bottom: 2 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false} // Disable label lines completely
            outerRadius={70} // Slightly smaller pie to make room for labels
            innerRadius={0}
            paddingAngle={2}
            dataKey="value"
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            iconSize={10}
            iconType="circle"
            wrapperStyle={{
              paddingTop: 40,
              fontSize: 12
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};