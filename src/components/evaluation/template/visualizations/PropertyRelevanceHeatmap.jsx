// src\components\evaluation\template\visualizations\PropertyRelevanceHeatmap.jsx
import React, { useState } from 'react';
import { RelevanceIndicator } from './CommonVisualizations';
import { TEMPLATE_CONFIG } from '../config/templateConfig';
import { getPropertyCategory } from '../config/templateConfig';

/**
 * Property relevance heatmap
 */
export const PropertyRelevanceHeatmap = ({ properties = [], researchProblem }) => {
  const [sortBy, setSortBy] = useState('relevance');
  const [filterType, setFilterType] = useState('all');
  
  // Calculate relevance score for each property
  const calculateRelevanceScores = () => {
    if (!properties || !researchProblem) return [];
    
    // Extract keywords from research problem
    const problemText = `${researchProblem.title} ${researchProblem.description} ${researchProblem.field}`.toLowerCase();
    
    return properties.map(prop => {
      const propertyText = `${prop.label} ${prop.description || ''}`.toLowerCase();
      
      // Calculate relevance based on keyword matches
      let relevance = 0;
      
      // Direct match in property name
      if (problemText.includes(prop.label.toLowerCase())) {
        relevance += 0.4;
      }
      
      // Check for partial matches
      const keywords = extractKeywords(problemText);
      const matchCount = keywords.filter(keyword => propertyText.includes(keyword)).length;
      const matchRatio = keywords.length > 0 ? matchCount / Math.min(keywords.length, 10) : 0;
      
      relevance += matchRatio * 0.4;
      
      // Boost for required properties
      if (prop.required) {
        relevance += 0.2;
      }
      
      // Cap at 1.0
      relevance = Math.min(relevance, 1.0);
      
      return {
        ...prop,
        relevance,
        category: getPropertyCategory(prop)
      };
    });
  };
  
  // Extract keywords from text
  const extractKeywords = (text) => {
    if (!text) return [];
    
    // Simple keyword extraction
    const words = text.split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => w.replace(/[^\w]/g, '').toLowerCase())
      .filter(w => !commonWords.includes(w));
      
    // Remove duplicates and return
    return [...new Set(words)];
  };
  
  // Common words to filter out
  const commonWords = ['with', 'this', 'that', 'from', 'have', 'more', 'will', 'using'];
  
  // Calculate and sort properties
  const getPropertiesWithRelevance = () => {
    const propertiesWithRelevance = calculateRelevanceScores();
    
    // Filter by type if needed
    const filteredProperties = filterType === 'all' 
      ? propertiesWithRelevance 
      : propertiesWithRelevance.filter(p => p.category === filterType);
    
    // Sort properties
    return filteredProperties.sort((a, b) => {
      if (sortBy === 'relevance') {
        return b.relevance - a.relevance;
      } else if (sortBy === 'alphabetical') {
        return a.label.localeCompare(b.label);
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });
  };

  const relevantProperties = getPropertiesWithRelevance();
  
  // Get list of unique categories
  const categories = ['all', ...new Set(relevantProperties.map(p => p.category))];
  
  // Get thresholds from config
  const thresholds = TEMPLATE_CONFIG.heatmap.thresholds;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="sort-by" className="block text-xs font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              id="sort-by"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filter-type" className="block text-xs font-medium text-gray-700 mb-1">
              Filter by category
            </label>
            <select
              id="filter-type"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>High Relevance</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
            <span>Medium Relevance</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span>Low Relevance</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Required</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Relevance</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {relevantProperties.map((prop, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{prop.label}</td>
                <td className="px-3 py-2 capitalize">{prop.category}</td>
                <td className="px-3 py-2 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {prop.type || 'unknown'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {prop.required ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Optional
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <RelevanceIndicator score={prop.relevance} size="md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 p-3 rounded border text-sm">
        <h5 className="font-medium text-gray-700 mb-1">Relevance Analysis</h5>
        <p className="text-gray-600 mb-2">
          Properties are analyzed for relevance to the research problem "{researchProblem?.title}". 
          Relevance is calculated based on keyword matches, property importance, and research context.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="bg-green-50 p-2 rounded border border-green-100">
            <span className="font-medium text-green-800">High Relevance ({relevantProperties.filter(p => p.relevance >= thresholds.high).length}): </span>
            <span className="text-sm text-green-700">
              Directly addresses research problem
            </span>
          </div>
          
          <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
            <span className="font-medium text-yellow-800">Medium Relevance ({relevantProperties.filter(p => p.relevance >= thresholds.medium && p.relevance < thresholds.high).length}): </span>
            <span className="text-sm text-yellow-700">
              Related to research context
            </span>
          </div>
          
          <div className="bg-red-50 p-2 rounded border border-red-100">
            <span className="font-medium text-red-800">Low Relevance ({relevantProperties.filter(p => p.relevance < thresholds.medium).length}): </span>
            <span className="text-sm text-red-700">
              Limited connection to research
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Category distribution for relevance analysis
 */
export const CategoryRelevanceAnalysis = ({ properties = [], researchProblem }) => {
  // Calculate relevance by category
  const calculateCategoryRelevance = () => {
    if (!properties || !researchProblem) return {};
    
    // First, assign relevance to properties
    const propertiesWithRelevance = properties.map(prop => ({
      ...prop,
      category: getPropertyCategory(prop),
      relevance: calculatePropertyRelevance(prop, researchProblem)
    }));
    
    // Group by category
    const categories = {};
    propertiesWithRelevance.forEach(prop => {
      if (!categories[prop.category]) {
        categories[prop.category] = {
          count: 0,
          totalRelevance: 0,
          properties: []
        };
      }
      
      categories[prop.category].count++;
      categories[prop.category].totalRelevance += prop.relevance;
      categories[prop.category].properties.push(prop);
    });
    
    // Calculate average relevance
    Object.keys(categories).forEach(category => {
      categories[category].avgRelevance = 
        categories[category].count > 0 ? 
        categories[category].totalRelevance / categories[category].count : 0;
    });
    
    return categories;
  };
  
  // Calculate relevance for a single property
  const calculatePropertyRelevance = (prop, researchProblem) => {
    const problemText = `${researchProblem.title} ${researchProblem.description} ${researchProblem.field}`.toLowerCase();
    const propertyText = `${prop.label} ${prop.description || ''}`.toLowerCase();
    
    // Calculate relevance based on keyword matches
    let relevance = 0;
    
    // Direct match in property name
    if (problemText.includes(prop.label.toLowerCase())) {
      relevance += 0.4;
    }
    
    // Check for partial matches
    const keywords = extractKeywords(problemText);
    const matchCount = keywords.filter(keyword => propertyText.includes(keyword)).length;
    const matchRatio = keywords.length > 0 ? matchCount / Math.min(keywords.length, 10) : 0;
    
    relevance += matchRatio * 0.4;
    
    // Boost for required properties
    if (prop.required) {
      relevance += 0.2;
    }
    
    // Cap at 1.0
    return Math.min(relevance, 1.0);
  };
  
  // Extract keywords from text
  const extractKeywords = (text) => {
    if (!text) return [];
    
    // Simple keyword extraction
    const words = text.split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => w.replace(/[^\w]/g, '').toLowerCase())
      .filter(w => !commonWords.includes(w));
      
    // Remove duplicates and return
    return [...new Set(words)];
  };
  
  // Common words to filter out
  const commonWords = ['with', 'this', 'that', 'from', 'have', 'more', 'will', 'using', 'research', 'study'];
  
  const categoryRelevance = calculateCategoryRelevance();
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Category Relevance Analysis</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(categoryRelevance).map(([category, data]) => (
          <div key={category} className="bg-white p-3 rounded-lg border shadow-sm">
            <h5 className="text-sm font-medium mb-1 capitalize">{category}</h5>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">{data.count} properties</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                data.avgRelevance >= 0.7 ? 'bg-green-100 text-green-800' :
                data.avgRelevance >= 0.4 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {(data.avgRelevance * 100).toFixed(0)}% relevance
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${
                  data.avgRelevance >= 0.7 ? 'bg-green-500' :
                  data.avgRelevance >= 0.4 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(data.avgRelevance * 100, 100)}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-gray-600">
              <span className="font-medium">Top property: </span>
              {data.properties.sort((a, b) => b.relevance - a.relevance)[0]?.label || 'None'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Research problem keyword visualization
 */
export const ResearchKeywordAnalysis = ({ researchProblem }) => {
  // Extract keywords from research problem
  const extractKeywords = () => {
    if (!researchProblem) return [];
    
    const problemText = `${researchProblem.title} ${researchProblem.description}`.toLowerCase();
    
    // Simple keyword extraction
    const words = problemText.split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => w.replace(/[^\w]/g, '').toLowerCase())
      .filter(w => !commonWords.includes(w));
      
    // Count occurrences
    const counts = {};
    words.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });
    
    // Sort by frequency
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word, count]) => ({ word, count }));
  };
  
  // Common words to filter out
  const commonWords = ['with', 'this', 'that', 'from', 'have', 'more', 'will', 'using', 'research', 'study'];
  
  const keywords = extractKeywords();
  
  if (keywords.length === 0) return null;
  
  // Max count for scaling
  const maxCount = Math.max(...keywords.map(k => k.count));
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Research Problem Key Concepts</h4>
      <p className="text-xs text-gray-600">
        Key concepts extracted from the research problem. Template properties should ideally cover these concepts.
      </p>
      
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, i) => {
          // Scale font size based on count
          const fontSize = 12 + ((keyword.count / maxCount) * 10);
          
          return (
            <div 
              key={i}
              className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full"
              style={{ fontSize: `${fontSize}px` }}
            >
              {keyword.word}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Comprehensive property relevance visualization
 */
export const PropertyRelevanceVisualization = ({ llmTemplate, researchProblem }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded border">
        <ResearchKeywordAnalysis researchProblem={researchProblem} />
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <CategoryRelevanceAnalysis 
          properties={llmTemplate?.properties || []} 
          researchProblem={researchProblem}
        />
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="text-sm font-medium mb-3">Property Relevance Heatmap</h4>
        <PropertyRelevanceHeatmap 
          properties={llmTemplate?.properties || []} 
          researchProblem={researchProblem}
        />
      </div>
    </div>
  );
};