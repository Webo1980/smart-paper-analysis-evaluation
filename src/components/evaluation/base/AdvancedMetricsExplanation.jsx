// src/components/evaluation/base/AdvancedMetricsExplanation.jsx
import React, { useState } from 'react';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Component for displaying advanced metrics explanations
 * Can be used across all evaluation modules
 */
const AdvancedMetricsExplanation = ({
  expertiseMultiplier,
  className,
  initialExpanded = false
}) => {
  const [showExplanation, setShowExplanation] = useState(initialExpanded);
  
  return (
    <div className={`mt-3 p-2 bg-white border border-blue-100 rounded ${className || ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HelpCircle size={14} className="text-blue-600" />
          <h6 className="text-xs font-medium text-blue-700">Advanced Metrics Explained</h6>
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-blue-600"
        >
          {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      
      {showExplanation && (
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium">System Confidence (U-shaped):</span> Lower confidence for extreme scores (0% or 100%), higher confidence for middle range scores. This prevents the system from overriding expert opinion when it gives extreme ratings.
          </div>
          
          <div>
            <span className="font-medium">Automated Weight:</span> Determines how much the system's automated score impacts the final score. This weight is reduced for extreme scores where the system has lower confidence.
          </div>
          
          <div>
            <span className="font-medium">User Weight:</span> Determines how much your expert rating impacts the final score. This weight is amplified by your expertise multiplier ({expertiseMultiplier}×).
          </div>
          
          <div>
            <span className="font-medium">Agreement Level:</span> Measures how closely your rating aligns with the automated score. Higher agreement means the system and human opinions are similar.
          </div>
          
          <div>
            <span className="font-medium">Agreement Bonus:</span> Adds up to 10% bonus to the final score when system and human ratings are in close agreement. This rewards consensus between automated and human assessment.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedMetricsExplanation;