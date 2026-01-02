import React from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

/**
 * Chart visualizing the distribution of property values
 */
export const PropertyDistributionChart = ({ paperContent = {}, granularityReport = {} }) => {
  // Analyze property value distributions
  const analyzePropertyValues = () => {
    // Count properties by type and value count
    const propertyValueCounts = {};
    const typeValueDistribution = {};
    let totalProperties = 0;
    let totalWithValues = 0;
    let totalEmpty = 0;
    
    // Analyze each property
    if (paperContent) {
      Object.keys(paperContent).forEach(propId => {
        const property = paperContent[propId];
        if (!property) return;
        
        totalProperties++;
        
        const type = property.type || 'unknown';
        const valueCount = property.values?.length || 0;
        
        // Track value count distribution
        propertyValueCounts[valueCount] = (propertyValueCounts[valueCount] || 0) + 1;
        
        // Track by type
        if (!typeValueDistribution[type]) {
          typeValueDistribution[type] = {
            type,
            withValues: 0,
            empty: 0,
            total: 0
          };
        }
        
        typeValueDistribution[type].total++;
        
        if (valueCount > 0) {
          totalWithValues++;
          typeValueDistribution[type].withValues++;
        } else {
          totalEmpty++;
          typeValueDistribution[type].empty++;
        }
      });
    }
    
    // Convert to arrays for charting
    const valueCountData = Object.keys(propertyValueCounts).map(count => ({
      count: parseInt(count, 10),
      properties: propertyValueCounts[count]
    })).sort((a, b) => a.count - b.count);
    
    const typeDistributionData = Object.values(typeValueDistribution).map(item => ({
      ...item,
      withValuesRate: item.total > 0 ? item.withValues / item.total : 0
    }));
    
    return {
      valueCountData,
      typeDistributionData,
      totalProperties,
      totalWithValues,
      totalEmpty
    };
  };
  
  const { 
    valueCountData, 
    typeDistributionData, 
    totalProperties,
    totalWithValues,
    totalEmpty
  } = analyzePropertyValues();
  
  // Prepare completion data for pie chart
  const completionData = [
    { name: 'Properties With Values', value: totalWithValues, color: '#22c55e' },
    { name: 'Empty Properties', value: totalEmpty, color: '#ef4444' }
  ].filter(item => item.value > 0);
  
  // Custom tooltip for bar chart
  const ValueCountTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">Value Count: {payload[0].payload.count}</p>
          <p>Properties: {payload[0].payload.properties}</p>
          <p>Percentage: {formatPercentage(payload[0].payload.properties / totalProperties)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for type distribution bar chart
  const TypeDistributionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">Type: {payload[0].payload.type}</p>
          <p>With Values: {payload[0].payload.withValues}</p>
          <p>Empty: {payload[0].payload.empty}</p>
          <p>Total: {payload[0].payload.total}</p>
          <p>With Values Rate: {formatPercentage(payload[0].payload.withValuesRate)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Property Completion Pie Chart */}
        <div className="bg-white p-3 rounded border" style={{ minHeight: "320px" }}>
          <h6 className="text-xs font-medium mb-3 text-center">Property Completion</h6>
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} properties`, 'Count']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Value Count Distribution Bar Chart */}
        <div className="bg-white p-3 rounded border" style={{ minHeight: "320px" }}>
          <h6 className="text-xs font-medium mb-3 text-center">Value Count Distribution</h6>
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={valueCountData}
                margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="count" 
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Number of values', position: 'bottom', offset: 0, fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `${value}`}
                  label={{ value: 'Number of properties', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <Tooltip content={<ValueCountTooltip />} />
                <Bar 
                  name="Properties" 
                  dataKey="properties" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Type Value Distribution */}
      <div className="bg-white p-3 rounded border" style={{ minHeight: "320px" }}>
        <h6 className="text-xs font-medium mb-3 text-center">Value Distribution by Type</h6>
        <div style={{ height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={typeDistributionData}
              margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="type" 
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<TypeDistributionTooltip />} />
              <Legend />
              <Bar name="With Values" dataKey="withValues" stackId="a" fill="#22c55e" />
              <Bar name="Empty" dataKey="empty" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 p-3 rounded border text-xs">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="bg-white p-2 rounded border border-blue-100">
            <div className="font-medium text-blue-800 mb-1">Total Properties</div>
            <div className="text-sm">{totalProperties}</div>
          </div>
          <div className="bg-white p-2 rounded border border-green-100">
            <div className="font-medium text-green-800 mb-1">Properties With Values</div>
            <div className="text-sm">{totalWithValues}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(totalWithValues / totalProperties)} of total
            </div>
          </div>
          <div className="bg-white p-2 rounded border border-red-100">
            <div className="font-medium text-red-800 mb-1">Empty Properties</div>
            <div className="text-sm">{totalEmpty}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(totalEmpty / totalProperties)} of total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDistributionChart;