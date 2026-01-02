// src/components/evaluation/template/components/PropertyCoverageSection.jsx
import React from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { PropertyTypeDistribution } from '../visualizations/PropertyTypeDistribution';
import { PropertyCategoryDistribution } from '../visualizations/PropertyCategoryDistribution';
import { ExpectedPropertyCoverage } from '../visualizations/ExpectedPropertyCoverage';
import { getPropertyCategory } from '../config/templateConfig';

const PropertyCoverageSection = ({ propertyCoverage, templateData, researchProblem, details }) => {
  if (!templateData || !templateData.properties) {
    return <div className="text-center text-gray-500">No property data available</div>;
  }
  
  const properties = templateData.properties;
  const score = propertyCoverage.score || 0;
  
  // Calculate property type distribution
  const typeDistribution = properties.reduce((acc, prop) => {
    acc[prop.type] = (acc[prop.type] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate property category distribution
  const categoryDistribution = properties.reduce((acc, prop) => {
    const category = getPropertyCategory(prop);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate required vs optional properties
  const requiredCount = properties.filter(p => p.required === true).length;
  const optionalCount = properties.length - requiredCount;
  
  // Get research field
  const researchField = researchProblem?.field || 'default';
  
  return (
    <div className="space-y-4">
      <h6 className="text-sm font-medium">Property Coverage Analysis</h6>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Property Metrics</h6>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Total Properties</span>
                <span>{properties.length}</span>
              </div>
              <Progress 
                value={Math.min(100, properties.length * 20)} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 3+ properties</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Required Properties</span>
                <span>{requiredCount} of {properties.length}</span>
              </div>
              <Progress 
                value={(requiredCount / properties.length) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: At least 1 required property</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Property Type Variety</span>
                <span>{Object.keys(typeDistribution).length} types</span>
              </div>
              <Progress 
                value={Math.min(100, Object.keys(typeDistribution).length * 33.3)} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: Multiple property types</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Assessment</h6>
          <div className="p-3 bg-gray-50 rounded text-sm">
            <p className="font-medium">{details || 'No assessment available'}</p>
          </div>
          
          <div className="mt-4">
            <h6 className="text-xs font-medium mb-2">Issues</h6>
            {propertyCoverage.issues && propertyCoverage.issues.length > 0 ? (
              <ul className="list-disc list-inside text-xs space-y-1">
                {propertyCoverage.issues.map((issue, i) => (
                  <li key={i} className="text-gray-700">{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-green-600">No issues detected</p>
            )}
          </div>
          
          <div className="mt-4">
            <h6 className="text-xs font-medium mb-2">Improvement Suggestions</h6>
            <ul className="list-disc list-inside text-xs space-y-1">
              {properties.length < 3 && <li>Add more properties (at least 3 recommended)</li>}
              {requiredCount === 0 && <li>Mark at least one property as required</li>}
              {Object.keys(typeDistribution).length < 2 && <li>Use a variety of property types</li>}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Property Type Distribution</h6>
          <PropertyTypeDistribution typeDistribution={typeDistribution} height={200} />
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Property Category Distribution</h6>
          <PropertyCategoryDistribution categoryDistribution={categoryDistribution} height={200} />
        </div>
      </div>
      
      <div className="bg-white p-3 rounded border">
        <h6 className="text-xs font-medium mb-2">Expected Property Coverage</h6>
        <ExpectedPropertyCoverage 
          categoryDistribution={categoryDistribution} 
          researchField={researchField} 
          height={250}
        />
      </div>
      
      <div className="p-3 bg-blue-50 rounded border border-blue-100">
        <h6 className="text-xs font-medium text-blue-800 mb-2">Overall Property Coverage Score</h6>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs">Score: {formatPercentage(score)}</span>
        </div>
        <Progress value={score * 100} className="h-3" />
      </div>
    </div>
  );
};

export default PropertyCoverageSection;