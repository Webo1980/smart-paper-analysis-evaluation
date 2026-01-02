// File: src/components/dashboard/shared/SourceIndicator.jsx

import React from 'react';
import { Badge } from '../../ui/badge';
import { Zap, Database } from 'lucide-react';

/**
 * SourceIndicator Component
 * 
 * Displays a badge indicating whether data came from LLM or ORKG source.
 * Used to show the source of research problems and templates.
 * 
 * @param {Object} props
 * @param {'LLM'|'ORKG'} props.source - The data source
 * @param {'problem'|'template'} props.type - The type of data
 * @param {'sm'|'md'|'lg'} props.size - Badge size
 * @param {boolean} props.showIcon - Whether to show the icon
 */
const SourceIndicator = ({ 
  source, 
  type = 'problem',
  size = 'sm',
  showIcon = true 
}) => {
  if (!source) return null;

  const isLLM = source === 'LLM' || source === 'llm';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (isLLM) {
    return (
      <Badge 
        className={`
          bg-blue-100 text-blue-700 hover:bg-blue-200 
          border border-blue-300
          ${sizeClasses[size]}
        `}
      >
        {showIcon && <Zap className={`${iconSizes[size]} mr-1`} />}
        <span className="font-medium">LLM</span>
      </Badge>
    );
  }

  return (
    <Badge 
      className={`
        bg-purple-100 text-purple-700 hover:bg-purple-200
        border border-purple-300
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Database className={`${iconSizes[size]} mr-1`} />}
      <span className="font-medium">ORKG</span>
    </Badge>
  );
};

/**
 * Helper function to determine the source from paper data
 * 
 * @param {Object} paper - Paper object from IntegratedDataService
 * @param {'problem'|'template'} type - The type to check
 * @returns {'LLM'|'ORKG'|null} The source or null if unknown
 */
export const getSourceFromPaper = (paper, type) => {
  if (!paper?.systemOutput) return null;

  if (type === 'problem') {
    const problems = paper.systemOutput.researchProblems;
    if (!problems) return null;

    const selectedProblem = problems.selectedProblem;
    if (!selectedProblem) return null;

    // Check if it's from LLM
    if (selectedProblem.isLLMGenerated || 
        (problems.llm_problem && 
         selectedProblem.title === problems.llm_problem.title)) {
      return 'LLM';
    }

    // Otherwise it's from ORKG
    return 'ORKG';
  }

  if (type === 'template') {
    const templates = paper.systemOutput.templates;
    if (!templates) return null;

    const selectedTemplate = templates.selectedTemplate;
    if (!selectedTemplate) return null;

    // Check if it's from LLM
    if (templates.llm_template && 
        selectedTemplate.id === templates.llm_template.template?.id) {
      return 'LLM';
    }

    // Otherwise it's from ORKG
    return 'ORKG';
  }

  return null;
};

/**
 * Dual source indicator - shows both problem and template sources
 */
export const DualSourceIndicator = ({ paper, size = 'sm', showLabels = false }) => {
  const problemSource = getSourceFromPaper(paper, 'problem');
  const templateSource = getSourceFromPaper(paper, 'template');

  if (!problemSource && !templateSource) return null;

  return (
    <div className="flex items-center gap-2">
      {problemSource && (
        <div className="flex items-center gap-1">
          {showLabels && <span className="text-xs text-gray-600">P:</span>}
          <SourceIndicator source={problemSource} type="problem" size={size} />
        </div>
      )}
      {templateSource && (
        <div className="flex items-center gap-1">
          {showLabels && <span className="text-xs text-gray-600">T:</span>}
          <SourceIndicator source={templateSource} type="template" size={size} />
        </div>
      )}
    </div>
  );
};

export default SourceIndicator;