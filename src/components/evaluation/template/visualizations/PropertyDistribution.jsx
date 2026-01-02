// src\components\evaluation\template\visualizations\PropertyDistribution.jsx
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TEMPLATE_CONFIG } from '../config/templateConfig';

/**
 * Type distribution pie chart
 */
export const TypeDistributionPie = ({ typeData }) => {
  const COLORS = TEMPLATE_CONFIG.colors.secondary;
  
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={typeData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {typeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} properties`, 'Count']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Required vs. Optional bar chart
 */
export const RequiredOptionalChart = ({ requiredCount, optionalCount }) => {
  const data = [
    { name: 'Required', value: requiredCount },
    { name: 'Optional', value: optionalCount }
  ];
  
  const colors = [TEMPLATE_CONFIG.colors.secondary[0], TEMPLATE_CONFIG.colors.secondary[1]];
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value} properties`, 'Count']} />
          <Bar dataKey="value" barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Type distribution table
 */
export const TypeDistributionTable = ({ typeData }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Count</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {typeData.map((item, index) => {
            const totalCount = typeData.reduce((sum, item) => sum + item.value, 0);
            const percentage = totalCount > 0 ? (item.value / totalCount) * 100 : 0;
            
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">{item.value}</td>
                <td className="px-3 py-2 text-center">{percentage.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Property type suggestions
 */
export const PropertyTypeSuggestions = ({ typeData }) => {
  // Generate suggestions based on property types
  const generateSuggestions = () => {
    const types = typeData.map(item => item.name);
    const totalCount = typeData.reduce((sum, item) => sum + item.value, 0);
    
    const suggestions = [];
    
    // Check for resource type
    if (!types.includes('resource')) {
      suggestions.push({
        type: 'resource',
        description: 'Consider adding resource properties to enable linking to external entities or ontologies'
      });
    }
    
    // Check for text type balance
    const textCount = typeData.find(item => item.name === 'text')?.value || 0;
    if (textCount / totalCount > 0.7) {
      suggestions.push({
        type: 'text',
        description: 'High proportion of text properties - consider adding more structured property types'
      });
    }
    
    // Common types to include
    const recommendedTypes = ['boolean', 'date', 'number'];
    recommendedTypes.forEach(type => {
      if (!types.includes(type)) {
        suggestions.push({
          type,
          description: `Consider adding ${type} properties for more structured data capture`
        });
      }
    });
    
    return suggestions;
  };
  
  const suggestions = generateSuggestions();
  
  if (suggestions.length === 0) return null;
  
  return (
    <div className="bg-blue-50 p-3 rounded border border-blue-100">
      <h5 className="text-sm font-medium text-blue-800 mb-2">Property Type Suggestions</h5>
      <ul className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            <div>
              <span className="font-medium">{suggestion.type}: </span>
              <span className="text-sm text-blue-700">{suggestion.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Comprehensive property distribution visualization
 */
export const PropertyDistributionVisualization = ({ llmTemplate }) => {
  // Calculate property type distribution
  const calculateTypeDistribution = () => {
    const types = {};
    llmTemplate?.properties?.forEach(prop => {
      const type = prop.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    
    // Convert to array for charts
    return Object.entries(types).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Count required vs optional properties
  const countRequiredOptional = () => {
    if (!llmTemplate?.properties) return { required: 0, optional: 0 };
    
    const required = llmTemplate.properties.filter(p => p.required).length;
    const optional = llmTemplate.properties.length - required;
    
    return { required, optional };
  };
  
  const typeData = calculateTypeDistribution();
  const { required, optional } = countRequiredOptional();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-3">Property Type Distribution</h4>
          <TypeDistributionPie typeData={typeData} />
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-3">Required vs. Optional Properties</h4>
          <RequiredOptionalChart
            requiredCount={required}
            optionalCount={optional}
          />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="text-sm font-medium mb-3">Property Type Details</h4>
        <TypeDistributionTable typeData={typeData} />
        
        <div className="mt-4">
          <PropertyTypeSuggestions typeData={typeData} />
        </div>
      </div>
    </div>
  );
};