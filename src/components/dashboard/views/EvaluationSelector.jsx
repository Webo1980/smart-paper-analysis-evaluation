// File: src/components/dashboard/views/EvaluationSelector.jsx

import React from 'react';
import { Badge } from '../../ui/badge';
import { User, Clock, Award } from 'lucide-react';

/**
 * Evaluation Selector Component
 * Allows switching between multiple evaluations of the same paper
 * Reusable across accuracy, quality, and other views
 */
const EvaluationSelector = ({ evaluations, selectedIndex, onChange }) => {
  if (!evaluations || evaluations.length <= 1) {
    return null; // Don't show if only one evaluation
  }

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-purple-600" />
        <h4 className="text-sm font-semibold text-gray-900">
          Multiple Evaluations Available ({evaluations.length})
        </h4>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {evaluations.map((evaluation, index) => {
          const isSelected = index === selectedIndex;
          const evaluator = `${evaluation.userInfo?.firstName || 'Unknown'} ${evaluation.userInfo?.lastName || 'User'}`;
          const date = new Date(evaluation.timestamp).toLocaleDateString();
          const time = new Date(evaluation.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          return (
            <button
              key={evaluation.token || index}
              onClick={() => onChange(index)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'bg-blue-50 border-blue-500 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {evaluator}
                  </span>
                  {isSelected && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">Selected</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className={`h-3 w-3 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                    {date} at {time}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Evaluation Details */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>Note:</strong> Viewing evaluation by {`${evaluations[selectedIndex]?.userInfo?.firstName} ${evaluations[selectedIndex]?.userInfo?.lastName}`}. 
          Switch between evaluators to compare different assessments of the same paper.
        </div>
      </div>
    </div>
  );
};

export default EvaluationSelector;