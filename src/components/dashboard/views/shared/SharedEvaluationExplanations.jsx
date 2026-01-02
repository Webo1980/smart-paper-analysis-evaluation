// File: src/components/dashboard/views/accuracy/paper-detail/SharedEvaluationExplanations.jsx
// Shared component for Advanced Metrics and System Confidence explanations
// This should be displayed once at the top level, not repeated for each component

import React, { useState } from 'react';
import { Card } from '../../../ui/card';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import AdvancedMetricsExplanation from '../../../evaluation/base/AdvancedMetricsExplanation';
import SystemConfidenceTable from '../../../evaluation/base/SystemConfidenceTable';

/**
 * Shared Evaluation Explanations Component
 * Contains Advanced Metrics Explanation and System Confidence Table
 * Should be displayed once at the top of the paper detail view
 */
const SharedEvaluationExplanations = ({ expertiseMultiplier, className = '' }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-gradient-to-r from-purple-50 to-blue-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-purple-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              Understanding the Evaluation Metrics
            </h4>
          </div>
          <button 
            className="p-2 rounded hover:bg-white/50 transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
        
        {!expanded && (
          <p className="text-xs text-gray-600 mt-2">
            Click to learn how accuracy scores are calculated using expertise-weighted 
            evaluation and U-shaped confidence curves
          </p>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t">
          {/* Overview Section */}
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h5 className="text-sm font-semibold text-blue-900 mb-2">
              Evaluation Methodology Overview
            </h5>
            <p className="text-xs text-blue-700 leading-relaxed">
              Our evaluation system combines automated similarity metrics with expert human 
              assessments to produce balanced accuracy scores. The final scores are weighted 
              dynamically based on system confidence and evaluator expertise, ensuring that 
              both algorithmic precision and human judgment contribute appropriately to the 
              overall assessment.
            </p>
          </div>

          {/* Advanced Metrics Explanation */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">
              Advanced Metrics: Expertise-Weighted Evaluation
            </h5>
            <AdvancedMetricsExplanation 
              expertiseMultiplier={expertiseMultiplier}
              initialExpanded={true}
            />
          </div>

          {/* System Confidence Table */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">
              System Confidence: U-Shaped Curve
            </h5>
            <SystemConfidenceTable initialExpanded={true} />
          </div>

          {/* Key Principles */}
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <h5 className="text-sm font-semibold text-green-900 mb-2">
              Key Evaluation Principles
            </h5>
            <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Dynamic Weighting:</strong> System and user weights adjust based on 
                confidence and expertise levels
              </li>
              <li>
                <strong>Consensus Bonus:</strong> Agreement between system and expert receives 
                up to 10% bonus
              </li>
              <li>
                <strong>Expertise Multiplier:</strong> Expert evaluations carry more weight 
                (1.0× to 2.0×) based on role and experience
              </li>
              <li>
                <strong>U-Shaped Confidence:</strong> System confidence is highest at 50% 
                (uncertain) and lowest at extremes (0% or 100%)
              </li>
              <li>
                <strong>Balanced Assessment:</strong> Final scores reflect both algorithmic 
                precision and human expert judgment
              </li>
            </ul>
          </div>

          {/* Formula Reference */}
          <div className="p-3 bg-gray-50 rounded border">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">
              General Score Calculation Formula
            </h5>
            <div className="space-y-2">
              <code className="text-xs block bg-white p-2 rounded border">
                Final Score = (Automated Score × Auto Weight) + (User Rating × User Weight) + Agreement Bonus
              </code>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Where:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>Auto Weight = f(System Confidence, Expertise Multiplier)</li>
                  <li>User Weight = f(Expertise Multiplier, System Confidence)</li>
                  <li>Agreement Bonus = (1 - |Automated - User|) × 0.1</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current User's Expertise */}
          {expertiseMultiplier && (
            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-purple-900 mb-1">
                    Your Expertise Multiplier
                  </h5>
                  <p className="text-xs text-purple-700">
                    Your evaluations are weighted with this multiplier based on your role, 
                    domain expertise, and evaluation experience.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">
                    {expertiseMultiplier.toFixed(2)}×
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SharedEvaluationExplanations;