import React from 'react';
import { CheckCircle, Target, HelpCircle } from 'lucide-react';

const ResearchFieldPredictionsTable = ({ 
  groundTruth, 
  predictions, 
  className, 
  selectedResearchField,
  fieldsWithDistances,
  onResearchFieldSelect
}) => {
  const normalizedGroundTruth = groundTruth?.toLowerCase() || '';
  const showDistance = fieldsWithDistances && fieldsWithDistances.length > 0;
  const isClickable = !!onResearchFieldSelect;

  // Merge predictions with distance data if available
  const predictionsWithDistances = predictions.map(pred => {
    const distanceData = fieldsWithDistances?.find(field => field.name === pred.name);
    return {
      ...pred,
      pathDistance: distanceData?.pathDistance,
      commonAncestors: distanceData?.commonAncestors
    };
  });

  return (
    <div className={`overflow-hidden ${className || ''}`}>
      <div className="mt-2 overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Research Field</th>
              {showDistance && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
              )}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ground Truth</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Selection</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {predictionsWithDistances && predictionsWithDistances.map((pred, index) => {
              const normalizedPredName = pred.name?.toLowerCase() || '';
              const isExactMatch = normalizedPredName === normalizedGroundTruth;
              const isPartialMatch = !isExactMatch && normalizedGroundTruth && normalizedPredName && (
                normalizedPredName.includes(normalizedGroundTruth) || 
                normalizedGroundTruth.includes(normalizedPredName)
              );
              
              const isSelected = selectedResearchField === pred.name;
              const isGroundTruth = groundTruth === pred.name;
              
              const rowClass = `${isClickable ? 'cursor-pointer' : ''} ${
                isSelected ? 'bg-blue-50 font-semibold' : 
                isGroundTruth ? 'bg-green-50' : 
                isPartialMatch ? 'bg-yellow-50' : ''
              } ${isClickable ? 'hover:bg-gray-100' : ''} transition-colors`;
              
              const confidence = Math.round(pred.score * 10);
              const confidenceColor = confidence >= 80 ? 'text-green-600' : 
                                    confidence >= 50 ? 'text-yellow-600' : 'text-red-600';

              // Path distance coloring
              const distanceClass = 
                pred.pathDistance === 0 ? 'text-green-600 font-medium' :
                pred.pathDistance <= 2 ? 'text-yellow-600' :
                'text-red-600';

              return (
                <tr 
                  key={index} 
                  className={rowClass}
                  onClick={isClickable ? () => onResearchFieldSelect(pred.name) : undefined}
                >
                  <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>{pred.name}</span>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                      {isGroundTruth && (
                        <Target className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </td>
                  {showDistance && (
                    <td className={`px-4 py-2 text-sm ${distanceClass}`}>
                      <div className="flex items-center space-x-1">
                        <span>{typeof pred.pathDistance === 'number' ? pred.pathDistance : 'N/A'}</span>
                        {pred.commonAncestors > 0 && 
                          <span className="text-xs text-gray-500 ml-1">
                            ({pred.commonAncestors} common)
                          </span>
                        }
                        <div className="group relative">
                          <HelpCircle size={12} className="text-gray-400" />
                          <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-20">
                            <p>Distance shows how many steps separate this field from the ground truth in the taxonomy hierarchy after their common ancestor.</p>
                            <p className="mt-1">Example path: <span className="font-mono">Root Research Field > Engineering > Computational Engineering</span></p>
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className={`px-4 py-2 text-sm ${confidenceColor} font-medium`}>
                    {confidence}%
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {isGroundTruth && (
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4 text-green-500" />
                        <span>Ground Truth</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {isSelected && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Selected</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {(!predictionsWithDistances || predictionsWithDistances.length === 0) && (
              <tr>
                <td colSpan={showDistance ? 6 : 5} className="px-4 py-4 text-center text-gray-500">
                  No predictions available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResearchFieldPredictionsTable;