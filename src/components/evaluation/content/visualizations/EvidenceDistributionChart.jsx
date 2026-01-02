// src/components/evaluation/content/visualizations/EvidenceDistributionChart.jsx
import React from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { processEvidenceData } from '../utils/evidenceUtils';

/**
 * Visualization component for evidence quality distribution 
 */
const EvidenceDistributionChart = ({ 
  validEvidenceCount = 0, 
  invalidEvidenceCount = 0,
  evidenceItems = []
}) => {
  // Process evidence items to ensure we get accurate counts
  const { 
    propertyData, 
    sectionData,
    directValidCount,
    directInvalidCount,
    totalEvidence
  } = processEvidenceData(evidenceItems);
  
  // Use either directly calculated counts or provided counts
  const validCount = directValidCount !== 0 ? directValidCount : validEvidenceCount;
  const invalidCount = directInvalidCount !== 0 ? directInvalidCount : invalidEvidenceCount;
  const total = validCount + invalidCount;
  
  // Data for pie chart
  const pieData = [
    { name: 'Valid Evidence', value: validCount, color: '#22c55e' },
    { name: 'Invalid Evidence', value: invalidCount, color: '#ef4444' },
  ].filter(item => item.value > 0);
  
  // Calculate height for property chart
  const propertyChartHeight = Math.max(220, propertyData.length * 30); // 30px per bar
  
  // Calculate height for section chart
  const sectionChartHeight = Math.max(220, sectionData.length * 35); // 35px per bar
  
  // Custom tooltip for property bar charts
  const CustomPropertyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">{data.propertyName}</p>
          <p>Valid: {data.valid}</p>
          <p>Invalid: {data.invalid}</p>
          <p>Total: {data.total}</p>
          <p>Valid Rate: {formatPercentage(data.validRate)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for section bar charts
  const CustomSectionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">{data.section}</p>
          <p>Valid: {data.valid}</p>
          <p>Invalid: {data.invalid}</p>
          <p>Total: {data.total}</p>
          <p>Valid Rate: {formatPercentage(data.validRate)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom pie chart label
  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only display percent for segments over 15%
    if (percent < 0.15) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded border">
        <h6 className="text-xs font-medium mb-2 text-center">Evidence Validation Distribution</h6>
        <div style={{ height: '220px' }}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={renderCustomizedPieLabel}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} (${(value / total * 100).toFixed(0)}%)`, 
                    name
                  ]}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500 text-xs">
              No evidence data available
            </div>
          )}
        </div>
      </div>
      
      {/* Evidence by Property - Using vertical bars with fixed height */}
      <div className="bg-white p-2 rounded border">
        <h6 className="text-xs font-medium mb-2 text-center">
          Evidence by Property ({propertyData.length} items)
        </h6>
        <div className="overflow-y-auto" style={{ height: `${Math.min(propertyChartHeight, 350)}px` }}>
          {propertyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={propertyChartHeight}>
              <BarChart
                data={propertyData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis 
                  type="category"
                  dataKey="shortName"
                  tick={{ fontSize: 10 }}
                  width={120}
                />
                <Tooltip content={<CustomPropertyTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="top" 
                  align="center"
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Bar name="Valid" dataKey="valid" stackId="a" fill="#22c55e" />
                <Bar name="Invalid" dataKey="invalid" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500 text-xs">
              No property data available
            </div>
          )}
        </div>
      </div>
      
      {/* Evidence by Section - Using vertical bars with fixed height */}
      <div className="bg-white p-2 rounded border">
        <h6 className="text-xs font-medium mb-2 text-center">
          Evidence by Section ({sectionData.length} items)
        </h6>
        <div className="overflow-y-auto" style={{ height: `${Math.min(sectionChartHeight, 400)}px` }}>
          {sectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={sectionChartHeight}>
              <BarChart
                data={sectionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis 
                  type="category"
                  dataKey="shortName"
                  tick={{ fontSize: 10 }}
                  width={150}
                />
                <Tooltip content={<CustomSectionTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="top" 
                  align="center"
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Bar name="Valid" dataKey="valid" stackId="a" fill="#22c55e" />
                <Bar name="Invalid" dataKey="invalid" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500 text-xs">
              No section data available
            </div>
          )}
        </div>
      </div>
      
      {/* Evidence Quality Summary */}
      <div className="bg-gray-50 p-3 rounded border text-xs">
        <h6 className="font-medium mb-2">Evidence Quality Summary</h6>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded border border-green-100">
            <div className="font-medium text-green-800 mb-1">Valid Evidence</div>
            <div className="text-sm">{validCount}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(validCount / Math.max(1, total))} of total
            </div>
          </div>
          <div className="bg-white p-2 rounded border border-red-100">
            <div className="font-medium text-red-800 mb-1">Invalid Evidence</div>
            <div className="text-sm">{invalidCount}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(invalidCount / Math.max(1, total))} of total
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
          <p className="font-medium text-blue-800 mb-1">Analysis:</p>
          <p className="text-gray-700">
            {total === 0 ? (
              "No evidence citations were found for analysis."
            ) : validCount === 0 ? (
              "All evidence citations are invalid. The content requires significant improvement in evidence quality."
            ) : invalidCount === 0 ? (
              "All evidence citations are valid. The content has excellent evidence quality."
            ) : validCount > invalidCount ? (
              `Most evidence citations (${formatPercentage(validCount / total)}) are valid, but some require improvement.`
            ) : (
              `Most evidence citations (${formatPercentage(invalidCount / total)}) are invalid. Significant improvement is needed.`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDistributionChart;