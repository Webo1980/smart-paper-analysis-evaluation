import React from 'react';
import { 
  ArrowRight, 
  Check, 
  Info
} from 'lucide-react';

/**
 * Table for displaying template vs reference comparison
 */
const TemplatePredictionsTable = ({ 
  templateData, 
  referenceData, 
  selectedTemplate
}) => {
  const template = templateData || {};
  
  // Handle the two scenarios:
  // 1. LLM generated: Just show the template without comparison
  // 2. ORKG template selected: Compare between selected and ORKG template
  const isOrkgScenario = referenceData?.template_name || referenceData?.id;
  const reference = referenceData || {};
  
  // Helper to render property count
  const renderPropertyCount = (properties = []) => {
    if (!properties.length) return "0 properties";
    
    const requiredCount = properties.filter(p => p.required).length;
    return (
      <span>
        {properties.length} {properties.length === 1 ? 'property' : 'properties'}
        {requiredCount > 0 && (
          <span className="text-gray-600"> ({requiredCount} required)</span>
        )}
      </span>
    );
  };
  
  // Helper to get property types distribution
  const getPropertyTypes = (properties = []) => {
    const types = {};
    properties.forEach(prop => {
      const type = prop.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // Just show top 3 types
      .map(([type, count]) => (
        <span key={type} className="inline-flex items-center mr-2 text-xs">
          <span className="inline-block bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-1">
            {type}
          </span>
          <span className="text-gray-600">{count}</span>
        </span>
      ));
  };
  
  // Check if we have a match when comparing templates
  const isSelected = () => {
    if (!templateData || !isOrkgScenario) return false;
    
    // Check if the selected template ID matches reference ID
    if (referenceData.id && selectedTemplate === referenceData.id) return true;
    
    // Check if template_name matches
    if (referenceData.template_name === (templateData.title || templateData.name)) return true;
    
    // Then check if titles match
    return (templateData.title || templateData.name) === (referenceData.title || referenceData.name);
  };
  
  return (
    <div className="border rounded-lg overflow-hidden mb-6">
      <div className="bg-blue-50 px-4 py-2 border-b flex items-center">
        <div className="flex-1">
          <h4 className="text-sm font-medium">
            {isOrkgScenario ? "Template Comparison" : "Generated Template"}
          </h4>
          <p className="text-xs text-gray-600">
            {isOrkgScenario 
              ? "Comparing generated template against ORKG template" 
              : "AI-generated template based on research problem"}
          </p>
        </div>
        {isOrkgScenario && isSelected() && (
          <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            <Check className="h-3 w-3 mr-1" />
            Match
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-2 px-4 text-xs font-medium text-left text-gray-500 uppercase">Field</th>
              <th className="py-2 px-4 text-xs font-medium text-left text-gray-500 uppercase">
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mr-2">
                    {isOrkgScenario ? "Generated" : "AI Generated"}
                  </span>
                  Template
                </div>
              </th>
              {isOrkgScenario && (
                <>
                  <th className="py-2 px-4 text-xs font-medium text-center text-gray-500">&nbsp;</th>
                  <th className="py-2 px-4 text-xs font-medium text-left text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mr-2">ORKG</span>
                      Template
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Title Row */}
            <tr className="border-b">
              <td className="py-3 px-4 text-sm font-medium">Title</td>
              <td className="py-3 px-4">
                <div className="font-medium text-sm">{template.title || template.name || "No title"}</div>
              </td>
              {isOrkgScenario && (
                <>
                  <td className="py-3 px-4 text-center">
                    <ArrowRight className="h-4 w-4 text-gray-400 inline-block" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-sm">{reference.title || reference.name || reference.template_name || "No title"}</div>
                  </td>
                </>
              )}
            </tr>
            
            {/* Description Row */}
            <tr className="border-b">
              <td className="py-3 px-4 text-sm font-medium">Description</td>
              <td className="py-3 px-4">
                <div className="text-sm">
                  {template.description 
                    ? template.description.length > 100 
                      ? template.description.substring(0, 100) + "..." 
                      : template.description
                    : "No description"}
                </div>
              </td>
              {isOrkgScenario && (
                <>
                  <td className="py-3 px-4 text-center">
                    <ArrowRight className="h-4 w-4 text-gray-400 inline-block" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {reference.description 
                        ? reference.description.length > 100 
                          ? reference.description.substring(0, 100) + "..." 
                          : reference.description
                        : "No description"}
                    </div>
                  </td>
                </>
              )}
            </tr>
            
            {/* Properties Row */}
            <tr className="border-b">
              <td className="py-3 px-4 text-sm font-medium">Properties</td>
              <td className="py-3 px-4">
                <div className="text-sm">
                  {renderPropertyCount(template.properties)}
                </div>
                <div className="mt-1">
                  {getPropertyTypes(template.properties)}
                </div>
              </td>
              {isOrkgScenario && (
                <>
                  <td className="py-3 px-4 text-center">
                    <ArrowRight className="h-4 w-4 text-gray-400 inline-block" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {renderPropertyCount(reference.properties)}
                    </div>
                    <div className="mt-1">
                      {getPropertyTypes(reference.properties)}
                    </div>
                  </td>
                </>
              )}
            </tr>
            
            
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 px-4 py-2 border-t flex items-center text-xs text-gray-500">
        <Info className="h-3 w-3 mr-1" />
        <span>
          {isOrkgScenario 
            ? "Comparing generated template against ORKG template from the knowledge graph."
            : "AI-generated template based on research problem context."}
        </span>
      </div>
    </div>
  );
};

export default TemplatePredictionsTable;