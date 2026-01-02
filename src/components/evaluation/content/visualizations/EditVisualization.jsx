import React from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

/**
 * Visualization for edit analysis metrics
 */
const EditVisualization = ({ 
  addedCount = 0, 
  removedCount = 0, 
  modifiedCount = 0, 
  unchangedCount = 0,
  totalOriginalProps = 0
}) => {
  const [chartType, setChartType] = React.useState('pie');
  
  // Data for pie chart
  const pieData = [
    { name: 'Added', value: addedCount, color: '#22c55e' },
    { name: 'Removed', value: removedCount, color: '#ef4444' },
    { name: 'Modified', value: modifiedCount, color: '#f59e0b' },
    { name: 'Unchanged', value: unchangedCount, color: '#9ca3af' }
  ].filter(item => item.value > 0);

  // Data for bar chart
  const barData = [
    { 
      name: 'Added', 
      count: addedCount, 
      percentage: totalOriginalProps > 0 ? (addedCount / totalOriginalProps) * 100 : 0
    },
    { 
      name: 'Removed', 
      count: removedCount, 
      percentage: totalOriginalProps > 0 ? (removedCount / totalOriginalProps) * 100 : 0
    },
    { 
      name: 'Modified', 
      count: modifiedCount, 
      percentage: totalOriginalProps > 0 ? (modifiedCount / totalOriginalProps) * 100 : 0
    },
    { 
      name: 'Unchanged', 
      count: unchangedCount, 
      percentage: totalOriginalProps > 0 ? (unchangedCount / totalOriginalProps) * 100 : 0
    }
  ];

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p>Count: {payload[0].payload.count}</p>
          <p>Percentage: {payload[0].payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  // Color map for bar chart
  const getBarColor = (name) => {
    switch (name) {
      case 'Added': return '#22c55e';
      case 'Removed': return '#ef4444';
      case 'Modified': return '#f59e0b';
      case 'Unchanged': return '#9ca3af';
      default: return '#888';
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chart Type Toggle */}
      <div className="flex justify-end mb-2">
        <div className="flex text-sm bg-gray-100 rounded-md p-0.5">
          <button
            className={`px-3 py-1 rounded-md transition-colors ${chartType === 'pie' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            onClick={() => setChartType('pie')}
          >
            Pie Chart
          </button>
          <button
            className={`px-3 py-1 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
        </div>
      </div>
      
      {/* Chart Visualization (Pie or Bar based on selected type) */}
      <div className="flex-grow bg-white rounded border">
        <h6 className="text-xs font-medium pt-2 text-center">
          {chartType === 'pie' ? 'Edit Distribution' : 'Edit Metrics by Percentage'}
        </h6>
        <div className="w-full h-[calc(100%-24px)]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} properties`, 'Count']}
                />
                <Legend />
              </PieChart>
            ) : (
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="percentage" 
                  radius={[4, 4, 0, 0]}
                >
                  {barData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry.name)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/**
 * Component for displaying edit metrics summary
 */
export const EditMetricsSummary = ({ 
  addedCount = 0, 
  removedCount = 0, 
  modifiedCount = 0, 
  unchangedCount = 0,
  totalOriginalProps = 0
}) => {
  return (
    <div className="mt-4">
      <h6 className="font-medium text-sm mb-3">Edit Metrics Summary</h6>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-green-100 text-center shadow-sm">
          <div className="font-medium text-green-800 mb-1">Added</div>
          <div className="text-xl font-bold">{addedCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatPercentage(totalOriginalProps > 0 ? addedCount / totalOriginalProps : 0)} of original
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-red-100 text-center shadow-sm">
          <div className="font-medium text-red-800 mb-1">Removed</div>
          <div className="text-xl font-bold">{removedCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatPercentage(totalOriginalProps > 0 ? removedCount / totalOriginalProps : 0)} of original
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-yellow-100 text-center shadow-sm">
          <div className="font-medium text-yellow-800 mb-1">Modified</div>
          <div className="text-xl font-bold">{modifiedCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatPercentage(totalOriginalProps > 0 ? modifiedCount / totalOriginalProps : 0)} of original
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-100 text-center shadow-sm">
          <div className="font-medium text-gray-800 mb-1">Unchanged</div>
          <div className="text-xl font-bold">{unchangedCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatPercentage(totalOriginalProps > 0 ? unchangedCount / totalOriginalProps : 0)} of original
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component for displaying calculation details
 */
export const CalculationDetails = ({ 
  addedCount = 0, 
  removedCount = 0, 
  modifiedCount = 0,
  totalOriginalProps = 0
}) => {
  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
      <p className="font-medium mb-1">Change Rate Calculation:</p>
      <div className="bg-white p-2 rounded">
        <code>
          Change Rate = (Added + Removed + Modified) / Total Original Properties<br/>
          = ({addedCount} + {removedCount} + {modifiedCount}) / {totalOriginalProps}<br/>
          = {((addedCount + removedCount + modifiedCount) / Math.max(1, totalOriginalProps)).toFixed(2)}
        </code>
      </div>
    </div>
  );
};

export default EditVisualization;