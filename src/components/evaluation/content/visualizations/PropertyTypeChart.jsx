import React from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

/**
 * Chart component visualizing property type distributions
 */
const PropertyTypeChart = ({ templateProperties = [], paperContent = {} }) => {
  console.log(templateProperties, paperContent);
  // Extract type data
  const getTypeData = () => {
    const templateTypes = {};
    const contentTypes = {};
    const matchCounts = {};
    const mismatchCounts = {};
    
    // Convert templateProperties array to object keyed by id for easier lookup
    const templatePropsObj = {};
    if (Array.isArray(templateProperties)) {
      templateProperties.forEach(prop => {
        templatePropsObj[prop.id] = prop;
        
        // Count template property types
        const type = prop.type || 'unknown';
        templateTypes[type] = (templateTypes[type] || 0) + 1;
      });
    } else {
      console.error("templateProperties is not an array");
    }
    
    // Count content property types and track matches/mismatches
    if (paperContent && typeof paperContent === 'object') {
      Object.keys(paperContent).forEach(propId => {
        const paperProp = paperContent[propId];
        const templateProp = templatePropsObj[propId];
        
        if (paperProp) {
          const contentType = paperProp.type || 'unknown';
          contentTypes[contentType] = (contentTypes[contentType] || 0) + 1;
          
          // Track matches and mismatches
          if (templateProp) {
            const templateType = templateProp.type || 'unknown';
            if (contentType === templateType) {
              matchCounts[contentType] = (matchCounts[contentType] || 0) + 1;
            } else {
              mismatchCounts[contentType] = (mismatchCounts[contentType] || 0) + 1;
            }
          }
        }
      });
    }
    
    // Prepare combined data
    const allTypes = [...new Set([
      ...Object.keys(templateTypes),
      ...Object.keys(contentTypes)
    ])];
    
    return {
      typeData: allTypes.map(type => ({
        type,
        template: templateTypes[type] || 0,
        content: contentTypes[type] || 0,
        matched: matchCounts[type] || 0,
        mismatched: mismatchCounts[type] || 0
      })),
      matchTotal: Object.values(matchCounts).reduce((sum, count) => sum + count, 0),
      mismatchTotal: Object.values(mismatchCounts).reduce((sum, count) => sum + count, 0)
    };
  };
  
  const { typeData, matchTotal, mismatchTotal } = getTypeData();
  
  // Prepare match/mismatch data for pie chart
  const matchData = [
    { name: 'Matching Types', value: matchTotal, color: '#22c55e' },
    { name: 'Mismatched Types', value: mismatchTotal, color: '#ef4444' }
  ].filter(item => item.value > 0);
  
  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">Type: {payload[0].payload.type}</p>
          <p>Template Count: {payload[0].payload.template}</p>
          <p>Content Count: {payload[0].payload.content}</p>
          <p>Matched: {payload[0].payload.matched}</p>
          <p>Mismatched: {payload[0].payload.mismatched}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom pie chart label
  const renderCustomizedPieLabel = ({ name, percent, value }) => {
    return `${name}: ${value}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type Distribution Bar Chart */}
        <div className="bg-white p-3 rounded border h-64">
          <h6 className="text-xs font-medium mb-3 text-center">Property Type Distribution</h6>
          <div className="h-52">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
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
                    tickFormatter={(value) => Math.round(value)}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: 10 }} 
                    verticalAlign="bottom" 
                    height={36}
                  />
                  <Bar name="Template" dataKey="template" fill="#3b82f6" />
                  <Bar name="Content" dataKey="content" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-xs">No type distribution data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Match/Mismatch Pie Chart */}
        <div className="bg-white p-3 rounded border h-64">
          <h6 className="text-xs font-medium mb-3 text-center">Type Match Distribution</h6>
          <div className="h-52">
            {matchData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={180} minHeight={180}>
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Pie
                    data={matchData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="40%"
                    outerRadius={55}
                    labelLine={false}
                    label={renderCustomizedPieLabel}
                  >
                    {matchData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} properties`, 'Count']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    wrapperStyle={{ bottom: 0, paddingTop: 20 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-xs">No type match data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Type Match Summary */}
      <div className="bg-gray-50 p-3 rounded border text-xs">
        <h6 className="font-medium mb-2">Type Match Summary</h6>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded border border-green-100">
            <div className="font-medium text-green-800 mb-1">Matching Types</div>
            <div className="text-sm">{matchTotal}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(matchTotal / Math.max(1, matchTotal + mismatchTotal))} of total
            </div>
          </div>
          <div className="bg-white p-2 rounded border border-red-100">
            <div className="font-medium text-red-800 mb-1">Mismatched Types</div>
            <div className="text-sm">{mismatchTotal}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(mismatchTotal / Math.max(1, matchTotal + mismatchTotal))} of total
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
          <p className="font-medium text-blue-800 mb-1">Analysis:</p>
          <p className="text-gray-700">
            {matchTotal === 0 && mismatchTotal === 0 ? (
              "No property type data available for analysis."
            ) : mismatchTotal === 0 ? (
              "All property types match the template definitions. The content has excellent type consistency."
            ) : matchTotal === 0 ? (
              "All property types differ from template definitions. The content requires significant property type corrections."
            ) : matchTotal > mismatchTotal ? (
              `Most properties (${formatPercentage(matchTotal / (matchTotal + mismatchTotal))}) have correct types, but some need correction.`
            ) : (
              `Most properties (${formatPercentage(mismatchTotal / (matchTotal + mismatchTotal))}) have incorrect types. Significant type correction is needed.`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyTypeChart;