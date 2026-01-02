// src\components\evaluation\base\MetricCalculationExplainer.jsx
import React, { useState } from 'react';
import { Calculator, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Component for explaining how metrics are calculated
 * Can be used across all evaluation modules
 */
const MetricCalculationExplainer = ({
  className,
  initialExpanded = false,
  domainName = "content"
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  return (
    <div className={`mb-4 p-2 bg-blue-50 rounded text-xs ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={14} className="text-blue-600" />
          <p className="font-medium">How are metrics calculated?</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <p className="mt-1">Every assessment combines system analysis with your expert rating:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>Automated Metrics</strong> are calculated objectively using algorithms for objective measurement</li>
            <li><strong>Your expert rating</strong> is weighted based on your expertise multiplier</li>
            <li><strong>The final score</strong> combines both inputs using a dynamic weighting system that considers system confidence and expertise level</li>
            <li><strong>Agreement bonus</strong> adds up to 10% when system and human assessments align closely</li>
          </ul>
          
          <div className="mt-2 p-2 bg-white rounded border">
            <h6 className="font-medium mb-2 text-xs">Score Calculation:</h6>
            
            <div className="mt-2 bg-blue-50 p-2 rounded">
              <p className="font-medium mb-1">Human-System Weighting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Human Expertise (60%):</strong> Expert judgment is prioritized since humans often catch nuances that automated systems miss</li>
                <li><strong>Automated Analysis (40%):</strong> Provides objective measurements based on algorithmic analysis</li>
                <li><strong>Agreement Bonus:</strong> When human and automated assessments align, confidence increases in the overall evaluation</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricCalculationExplainer;