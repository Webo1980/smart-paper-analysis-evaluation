// src\components\evaluation\research-problem\components\ResearchProblemPreview.jsx
import React, { useState } from 'react';
import { FileText, Lightbulb, BarChart2, ChevronUp, ChevronDown } from 'lucide-react';
import { extractProblemData } from '../utils/researchProblemMetrics';
import ResearchProblemComparisonView from './ResearchProblemComparisonView';

const ResearchProblemPreview = ({ groundTruth, problem, useAbstract = true, showComparison = true, originalProblem }) => {
  const [expandedAbstract, setExpandedAbstract] = useState(false);
  const [showDetailedComparison, setShowDetailedComparison] = useState(false);
  
  // Extract problem data
  const problemData = extractProblemData(problem);
  
  // Format ground truth based on type
  const gtData = React.useMemo(() => {
    if (typeof groundTruth === 'string') {
      return { title: 'Abstract', description: groundTruth };
    } else if (typeof groundTruth === 'object') {
      return {
        title: groundTruth.title || groundTruth.name || 'Research Problem',
        description: groundTruth.description || groundTruth.content || ''
      };
    }
    return { title: 'Ground Truth', description: '' };
  }, [groundTruth]);
  
  // Determine if abstract is long
  const isLongAbstract = gtData.description && gtData.description.length > 300;
  const abstractPreview = isLongAbstract && !expandedAbstract 
    ? gtData.description.substring(0, 300) + '...' 
    : gtData.description;
    
  // We use originalProblem parameter for comparison
  const showEditComparison = showComparison && originalProblem && problem && 
    JSON.stringify(originalProblem) !== JSON.stringify(problem);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-3 flex items-center justify-between">
          <div className="flex items-center">
            {useAbstract ? (
              <FileText className="mr-2 h-4 w-4 text-gray-600" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4 text-gray-600" />
            )}
            <h4 className="font-medium">
              {useAbstract ? 'Paper Abstract (Source for Problem Analysis)' : 'ORKG Research Problem'}
            </h4>
          </div>
          {isLongAbstract && (
            <button 
              onClick={() => setExpandedAbstract(!expandedAbstract)}
              className="text-blue-600 text-sm flex items-center"
            >
              {expandedAbstract ? (
                <>Show less <ChevronUp className="ml-1 h-3 w-3" /></>
              ) : (
                <>Show more <ChevronDown className="ml-1 h-3 w-3" /></>
              )}
            </button>
          )}
        </div>
        
        <div className="p-4 bg-gray-50">
          {gtData.title && gtData.title !== 'Abstract' && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 font-medium">Title:</div>
              <div className="font-medium">{gtData.title}</div>
            </div>
          )}
          
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">
              {gtData.title === 'Abstract' ? 'Content:' : 'Description:'}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-white p-3 border rounded-md">
              {abstractPreview}
            </div>
          </div>
          
          {useAbstract && (
            <div className="mt-3 text-xs text-gray-600 italic">
              The system analyzes this abstract to detect or generate an appropriate research problem
            </div>
          )}
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-blue-100 p-3 flex items-center">
          <Lightbulb className="mr-2 h-4 w-4 text-blue-600" />
          <h4 className="font-medium">
            {useAbstract ? 'Generated Research Problem' : 'LLM-Generated Research Problem'}
          </h4>
        </div>
        
        <div className="p-4 bg-blue-50">
          <div className="mb-3">
            <div className="text-xs text-gray-600 font-medium">Title:</div>
            <div className="font-medium bg-white p-2 border rounded-md">
              {problemData.title || 'No title available'}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-600 font-medium">Description:</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-white p-3 border rounded-md">
              {problemData.description || 'No description available'}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-600 italic">
            {useAbstract ? 
              'This research problem was extracted or generated based on the paper abstract' :
              'This research problem was generated when no matching ORKG problems were found'}
          </div>
        </div>
      </div>
      
      {/* Show Edit Comparison Option if both original and edited versions exist */}
      {showEditComparison && (
        <div className="border rounded-lg overflow-hidden">
          <div 
            className="bg-amber-100 p-3 flex items-center justify-between cursor-pointer"
            onClick={() => setShowDetailedComparison(!showDetailedComparison)}
          >
            <div className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4 text-amber-600" />
              <h4 className="font-medium">
                Original vs. Edited Problem Comparison
              </h4>
            </div>
            {showDetailedComparison ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4" />
            )}
          </div>
          
          {showDetailedComparison && (
            <div className="p-4 bg-white border-t">
              <ResearchProblemComparisonView 
                originalProblem={originalProblem} 
                editedProblem={problem}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResearchProblemPreview;