import React from 'react';
import { CheckCircle, XCircle, PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

/**
 * Component to display property comparison between template and paper content
 */
const PropertyComparisonTable = ({ templateProperties = [], paperContent = {} }) => {
  const getComparisonData = () => {
    const comparisonData = [];
    const paperContentKeys = Object.keys(paperContent);
    
    // Process template properties
    templateProperties.forEach(templateProp => {
      const propId = templateProp.id;
      const paperProp = paperContent[propId];
      
      const existsInPaper = !!paperProp;
      const hasValues = existsInPaper && paperProp.values && paperProp.values.length > 0;
      const typeMatch = existsInPaper && (paperProp.type === templateProp.type);
      
      comparisonData.push({
        id: propId,
        name: templateProp.label || propId,
        description: templateProp.description,
        templateType: templateProp.type || 'text',
        paperType: existsInPaper ? paperProp.type : null,
        required: templateProp.required || false,
        existsInPaper,
        hasValues,
        typeMatch,
        status: !existsInPaper ? 'missing' : 
               !typeMatch ? 'type-mismatch' :
               !hasValues ? 'empty' : 
               'match',
        source: 'template'
      });
    });
    
    // Find properties in paper that aren't in template
    paperContentKeys.forEach(propId => {
      const existsInTemplate = templateProperties.some(p => p.id === propId);
      if (!existsInTemplate) {
        const paperProp = paperContent[propId];
        const hasValues = paperProp.values && paperProp.values.length > 0;
        
        comparisonData.push({
          id: propId,
          name: paperProp.label || propId,
          description: null,
          templateType: null,
          paperType: paperProp.type || 'text',
          required: false,
          existsInPaper: true,
          hasValues,
          typeMatch: true,
          status: hasValues ? 'additional' : 'empty-additional',
          source: 'paper'
        });
      }
    });
    
    return comparisonData;
  };
  
  const comparisonData = getComparisonData();
  
  // Calculate comparison statistics
  const stats = {
    totalTemplate: templateProperties.length,
    totalPaper: Object.keys(paperContent).length,
    matched: comparisonData.filter(p => p.status === 'match').length,
    missing: comparisonData.filter(p => p.status === 'missing').length,
    empty: comparisonData.filter(p => p.status === 'empty').length,
    typeMismatch: comparisonData.filter(p => p.status === 'type-mismatch').length,
    additional: comparisonData.filter(p => p.status === 'additional').length,
    emptyAdditional: comparisonData.filter(p => p.status === 'empty-additional').length,
    missingRequired: comparisonData.filter(p => p.status === 'missing' && p.required).length
  };
  
  // Get status icon based on comparison status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'match':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missing':
        return <MinusCircle className="h-4 w-4 text-red-500" />;
      case 'empty':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'type-mismatch':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'additional':
        return <PlusCircle className="h-4 w-4 text-blue-500" />;
      case 'empty-additional':
        return <AlertTriangle className="h-4 w-4 text-blue-300" />;
      default:
        return null;
    }
  };
  
  // Get status label based on comparison status
  const getStatusLabel = (status, required) => {
    switch (status) {
      case 'match':
        return <span className="text-green-600">Match</span>;
      case 'missing':
        return required ? 
          <span className="text-red-600">Missing (Required)</span> : 
          <span className="text-gray-600">Missing</span>;
      case 'empty':
        return <span className="text-yellow-600">Empty</span>;
      case 'type-mismatch':
        return <span className="text-orange-600">Type Mismatch</span>;
      case 'additional':
        return <span className="text-blue-600">Additional</span>;
      case 'empty-additional':
        return <span className="text-blue-400">Empty Additional</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Property Comparison Table */}
      <div className="bg-white rounded border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template Type
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paper Type
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Values
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparisonData.map((property) => (
              <tr 
                key={property.id} 
                className={
                  property.status === 'missing' ? 'bg-red-50' : 
                  property.status === 'additional' ? 'bg-blue-50' :
                  property.status === 'empty' ? 'bg-yellow-50' :
                  property.status === 'type-mismatch' ? 'bg-orange-50' : ''
                }
              >
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <div className="font-medium text-gray-900">
                    {property.name}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">
                  {property.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {property.templateType || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {property.paperType || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {property.required ? (
                    <span className="text-red-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <div className="flex items-center">
                    {getStatusIcon(property.status)}
                    <span className="ml-1">
                      {getStatusLabel(property.status, property.required)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {property.existsInPaper && paperContent[property.id].values ? (
                    <div className="flex flex-col">
                      {paperContent[property.id].values.map((val, i) => (
                        <div key={i} className="truncate max-w-xs" title={val.value}>
                          {val.value}
                        </div>
                      ))}
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Comparison Statistics */}
      <div className="bg-gray-50 p-3 rounded border text-xs">
        <h6 className="font-medium mb-2">Property Comparison Summary</h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Template Properties</div>
            <div className="text-sm text-gray-700">{stats.totalTemplate}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Paper Properties</div>
            <div className="text-sm text-gray-700">{stats.totalPaper}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Matched Properties</div>
            <div className="text-sm text-green-600">{stats.matched}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(stats.matched / stats.totalTemplate)} of template
            </div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Missing Properties</div>
            <div className="text-sm text-red-600">{stats.missing}</div>
            <div className="text-xs text-gray-500">
              {formatPercentage(stats.missing / stats.totalTemplate)} of template
            </div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Empty Properties</div>
            <div className="text-sm text-yellow-600">{stats.empty}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Type Mismatches</div>
            <div className="text-sm text-orange-600">{stats.typeMismatch}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Additional Properties</div>
            <div className="text-sm text-blue-600">{stats.additional}</div>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Missing Required</div>
            <div className="text-sm text-red-600">{stats.missingRequired}</div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
          <p className="font-medium text-blue-800 mb-1">Analysis:</p>
          <p className="text-gray-700">
            {stats.missing === 0 && stats.empty === 0 && stats.typeMismatch === 0 ? (
              "All template properties are matched in the paper content with correct types and values."
            ) : stats.missingRequired > 0 ? (
              `${stats.missingRequired} required ${stats.missingRequired === 1 ? 'property is' : 'properties are'} missing from the paper content.`
            ) : stats.matched > stats.totalTemplate / 2 ? (
              `Most template properties (${formatPercentage(stats.matched / stats.totalTemplate)}) are matched in the paper content.`
            ) : (
              `Only ${formatPercentage(stats.matched / stats.totalTemplate)} of template properties are matched in the paper content.`
            )}
            {stats.additional > 0 && (
              <span> The paper contains {stats.additional} additional {stats.additional === 1 ? 'property' : 'properties'} not in the template.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyComparisonTable;