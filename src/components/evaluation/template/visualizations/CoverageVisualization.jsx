// src/components/evaluation/template/visualizations/CoverageVisualization.jsx
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TEMPLATE_CONFIG } from '../config/templateConfig';
import { RelevanceIndicator } from './CommonVisualizations';

/**
 * Heatmap visualization for property coverage
 */
export const PropertyCoverageHeatmap = ({ properties = [], researchField = '' }) => {
  // Get expected properties for research domain
  const getExpectedPropertiesByDomain = () => {
    // This would normally be pulled from a database or API
    // Using a simple example for demonstration
    const domainProperties = {
      'Computer Vision': ['Dataset', 'Model Architecture', 'Training Method', 'Accuracy'],
      'Natural Language Processing': ['Corpus', 'Model Architecture', 'Tokenization Method', 'Evaluation Metrics'],
      'Medical Physics': ['Imaging Modality', 'Patient Cohort', 'Algorithm', 'Sensitivity', 'Specificity'],
      'Machine Learning': ['Algorithm', 'Dataset', 'Features', 'Evaluation Method', 'Performance Metrics']
    };
    
    // If research field is known, return its expected properties
    if (researchField && domainProperties[researchField]) {
      return domainProperties[researchField];
    }
    
    // Default set of common research properties
    return [
      'Method', 'Results', 'Dataset', 'Implementation', 'Evaluation', 
      'Parameters', 'Performance', 'Algorithm'
    ];
  };

  // Calculate coverage score for each property
  const calculateCoverageScores = () => {
    const expectedProperties = getExpectedPropertiesByDomain();
    const propLabels = properties.map(p => p.label.toLowerCase());
    
    return expectedProperties.map(expected => {
      // Check if there's a matching or similar property in the template
      const matchingProps = propLabels.filter(label => 
        label.includes(expected.toLowerCase()) || 
        expected.toLowerCase().includes(label)
      );
      
      // Calculate coverage score based on matches
      const score = matchingProps.length ? 
        (matchingProps.length === 1 ? 0.9 : 0.7) : 0.2;
      
      return {
        name: expected,
        coverage: score,
        status: score >= 0.8 ? 'Covered' : score >= 0.5 ? 'Partially Covered' : 'Missing'
      };
    });
  };

  const coverageData = calculateCoverageScores();

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Expected Property Coverage</h4>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected Property</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Coverage Level</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coverageData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">
                  <RelevanceIndicator score={item.coverage} size="sm" />
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'Covered' ? 'bg-green-100 text-green-800' :
                    item.status === 'Partially Covered' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Bar chart for property category distribution
 */
export const CategoryDistributionChart = ({ categoryData = [], expectedCounts = {} }) => {
  const colors = TEMPLATE_CONFIG.colors.primary;
  
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={categoryData}
          margin={VISUALIZATION_CONFIG.bar.margin}
          barSize={VISUALIZATION_CONFIG.bar.barSize}
          barGap={VISUALIZATION_CONFIG.bar.barGap}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value}`, 'Count']} />
          <Legend />
          <Bar dataKey="count" fill={colors[0]} name="Current" />
          <Bar dataKey="expected" fill={colors[1]} name="Expected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Comprehensive property coverage visualization
 */
export const PropertyCoverageVisualization = ({ 
  llmTemplate, 
  researchProblem,
  researchField
}) => {
  // Helper to get property category
  const getPropertyCategory = (property) => {
    if (!property || !property.label) return 'other';
    
    const label = property.label.toLowerCase();
    if (label.includes('method') || label.includes('approach') || label.includes('technique')) {
      return 'methodology';
    } else if (label.includes('result') || label.includes('performance') || label.includes('evaluation')) {
      return 'results';
    } else if (label.includes('parameter') || label.includes('config') || label.includes('setting')) {
      return 'parameters';
    } else if (label.includes('implementation') || label.includes('code') || label.includes('tool')) {
      return 'implementation';
    } else if (label.includes('data') || label.includes('dataset')) {
      return 'data';
    }
    return 'other';
  };

  // Get expected counts for research domain
  const getExpectedCounts = () => {
    const field = researchField || researchProblem?.field || '';
    
    // Get expected counts from config if available for this field
    const expectedCounts = VISUALIZATION_CONFIG.expectedPropertyCounts?.[field] || 
                          VISUALIZATION_CONFIG.expectedPropertyCounts?.default || {
      methodology: 3,
      results: 3,
      parameters: 2,
      implementation: 1,
      data: 2,
      other: 1
    };
    
    return expectedCounts;
  };

  // Calculate category counts
  const calculateCategoryCounts = () => {
    // Count properties by category
    const categories = {
      methodology: 0,
      results: 0,
      parameters: 0,
      implementation: 0,
      data: 0,
      other: 0
    };
    
    llmTemplate?.properties?.forEach(prop => {
      const category = getPropertyCategory(prop);
      categories[category]++;
    });
    
    // Get expected counts
    const expected = getExpectedCounts();
    
    // Convert to array for charts
    return Object.entries(categories).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      expected: expected[name] || 0
    }));
  };

  const categoryData = calculateCategoryCounts();
  
  // Calculate overall coverage score
  const calculateOverallCoverage = () => {
    if (!llmTemplate?.properties?.length) return 0;
    
    const expected = getExpectedCounts();
    const actual = categoryData.reduce((acc, item) => {
      acc[item.name.toLowerCase()] = item.count;
      return acc;
    }, {});
    
    // Calculate coverage ratio for each category
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(expected).forEach(([category, expectedCount]) => {
      if (expectedCount > 0) {
        const actualCount = actual[category] || 0;
        const ratio = Math.min(actualCount / expectedCount, 1.5); // Cap at 150%
        
        // Weight important categories higher
        const weight = category === 'methodology' || category === 'results' ? 2 :
                      category === 'data' ? 1.5 : 1;
        
        totalScore += ratio * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const overallCoverage = calculateOverallCoverage();

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded border">
        <h4 className="text-sm font-medium mb-2">Overall Property Coverage</h4>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-3 mr-4">
            <div
              className={`h-3 rounded-full ${
                overallCoverage >= 0.8 ? 'bg-green-500' :
                overallCoverage >= 0.6 ? 'bg-green-400' :
                overallCoverage >= 0.4 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(overallCoverage * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-lg font-bold min-w-[80px] text-right">
            {(overallCoverage * 100).toFixed(0)}%
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Based on expected property distribution for{' '}
          <span className="font-medium">{researchField || researchProblem?.field || 'research templates'}</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-3">Category Distribution</h4>
          <CategoryDistributionChart 
            categoryData={categoryData} 
            expectedCounts={getExpectedCounts()}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <PropertyCoverageHeatmap 
            properties={llmTemplate?.properties || []} 
            researchField={researchField || researchProblem?.field}
          />
        </div>
      </div>
    </div>
  );
};