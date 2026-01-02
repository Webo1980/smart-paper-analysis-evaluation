// src/components/evaluation/content/visualizations/SimilarityScatterPlot.jsx
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { formatMetricName } from '../utils/highlightUtils';

const SimilarityScatterPlot = ({ evidenceItems, metricName, threshold = 0.6 }) => {
  if (!evidenceItems || !Array.isArray(evidenceItems) || evidenceItems.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500 text-xs bg-gray-50 rounded border">
        No data available for visualization
      </div>
    );
  }

  // Extract data for the specific metric
  const data = evidenceItems.map((item, index) => {
    const semanticAnalysis = item.semanticAnalysis || {};
    const metricValue = semanticAnalysis[metricName] || 0;
    
    return {
      index: index + 1,
      id: item.id,
      property: item.propertyLabel || item.property,
      value: item.value,
      section: item.section,
      evidence: item.evidence,
      score: metricValue,
      valid: item.isValid
    };
  });

  // Custom tooltip with improved comparison layout
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-md text-xs max-w-xs">
          <h3 className="font-medium border-b pb-1 mb-2">{formatMetricName(metricName)}: {formatPercentage(item.score)}</h3>
          
          <div className="mb-2">
            <div className="font-medium text-gray-700">Property: {item.property}</div>
            <div className="text-gray-500 text-[10px] mb-1">Section: {item.section} | Status: 
              <span className={`ml-1 px-1.5 py-0.5 rounded ${item.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.valid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>
          
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="text-left p-1 bg-blue-50 text-blue-800 rounded-t border-b">Property Value</th>
                <th className="text-left p-1 bg-green-50 text-green-800 rounded-t border-b">Evidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1 align-top border-r border-gray-200 bg-blue-50 bg-opacity-20">
                  <div className="max-h-20 overflow-y-auto break-words">
                    {String(item.value).substring(0, 150)}{String(item.value).length > 150 ? '...' : ''}
                  </div>
                </td>
                <td className="p-1 align-top bg-green-50 bg-opacity-20">
                  <div className="max-h-20 overflow-y-auto break-words">
                    {item.evidence?.substring(0, 150)}{item.evidence?.length > 150 ? '...' : ''}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-3 rounded border">
      <div style={{ height: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="index" 
              name="Evidence" 
              label={{ value: 'Evidence Items', position: 'insideBottom', offset: -5, fill: '#666' }}
              domain={[0, data.length + 1]}
              ticks={[...Array(Math.min(10, data.length))].map((_, i) => Math.ceil((i + 1) * data.length / Math.min(10, data.length)))}
              padding={{ left: 30, right: 30 }}
            />
            <YAxis 
              type="number" 
              dataKey="score" 
              name={formatMetricName(metricName)}
              domain={[0, 1]} 
              allowDecimals={true}
              tickCount={6}
              tickFormatter={(val) => formatPercentage(val, false)}
              label={{ 
                value: formatMetricName(metricName), 
                angle: -90, 
                position: 'insideLeft', 
                offset: 10, 
                fill: '#666',
                style: { textAnchor: 'middle' }
              }}
              padding={{ top: 20, bottom: 20 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingTop: '10px' }}
            />
            <ReferenceLine y={threshold} stroke="red" strokeDasharray="3 3" label={{
              position: 'right',
              value: `Threshold: ${formatPercentage(threshold)}`,
              fill: 'red',
              fontSize: 10
            }} />
            <Scatter 
              name="Valid Evidence" 
              data={data.filter(d => d.valid)} 
              fill="#22c55e" 
              shape="circle"
              isAnimationActive={false}
            />
            <Scatter 
              name="Invalid Evidence" 
              data={data.filter(d => !d.valid)} 
              fill="#ef4444" 
              shape="diamond"
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-xs mt-2 text-gray-600 font-medium">
        Showing distribution of {formatPercentage(data.filter(d => d.valid).length / data.length)} valid evidence items
      </div>
    </div>
  );
};

export default SimilarityScatterPlot;