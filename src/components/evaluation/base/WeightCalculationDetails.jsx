// src\components\evaluation\base\WeightCalculationDetails.jsx
import React from 'react';
import { Calculator } from 'lucide-react';

// Import centralized utilities
import { 
  formatPercentage, 
  agreementCalculation 
} from './utils/baseMetricsUtils';

/**
 * Component to display the weight calculation details
 * Ensures consistent calculation display across all evaluation types
 */
const WeightCalculationDetails = ({ 
  metricData, 
  automatedScore, 
  expertiseMultiplier, 
  className 
}) => {
  if (!metricData) return null;
  console.log({metricData, 
    automatedScore, 
    expertiseMultiplier,className });
  try {
    // Determine the raw user rating (assuming normalized value of 1 came from a 5/5 rating)
    const rawUserRating = metricData.normalizedRating * 5;
    
    // Use the exact same metricData object that was passed to us
    // Don't recalculate anything to maintain consistency
    const weightCalculation = metricData;
    
    // Calculate agreement details with the utility function
    const agreementDetails = agreementCalculation(automatedScore, metricData.normalizedRating);

    // Weighted Automated Score with detailed breakdown
    const weightedAutomatedScore = {
      value: automatedScore * weightCalculation.automaticWeight,
      breakdown: [
        `Raw Automated Score: ${formatPercentage(automatedScore)}`,
        `Automated Confidence: ${formatPercentage(weightCalculation.automaticConfidence)}`,
        `Raw Automated Weight: ${formatPercentage(weightCalculation.rawAutomaticWeight)}`
      ]
    };

    // Weighted User Score with detailed breakdown
    const weightedUserScore = {
      value: weightCalculation.normalizedRating * weightCalculation.userWeight,
      breakdown: [
        `Raw User Rating: ${rawUserRating.toFixed(1)}/5 (normalized: ${formatPercentage(weightCalculation.normalizedRating)})`,
        `Expertise Multiplier: ${expertiseMultiplier.toFixed(2)}×`,
        `Adjusted User Rating: ${formatPercentage(weightCalculation.normalizedRating * expertiseMultiplier)}`,
        `Raw User Weight: ${formatPercentage(weightCalculation.rawUserWeight)}`
      ]
    };

    const combinedScore = {
      value: weightCalculation.combinedScore,
      breakdown: [
        `Weighted Automated Score: ${formatPercentage(weightedAutomatedScore.value)}`,
        `Weighted User Score: ${formatPercentage(weightedUserScore.value)}`,
        `Before Agreement Bonus: ${formatPercentage(weightCalculation.combinedScore)}`
      ]
    };

    const finalScoreWithBonus = {
      value: weightCalculation.finalScore,
      breakdown: [
        `Base Combined Score: ${formatPercentage(weightCalculation.combinedScore)}`,
        `Agreement: ${formatPercentage(weightCalculation.agreement)}`,
        `Agreement Formula: ${agreementDetails.formula}`,
        `Agreement Calculation: ${agreementDetails.calculation}`,
        `Agreement Bonus Calculation: ${agreementDetails.bonusCalculation}`,
        `Final Bonus Multiplier: 1 + ${formatPercentage(weightCalculation.agreementBonus)}`
      ]
    };

    // Helper function to render breakdown items with better formatting
    const renderBreakdown = (items) => (
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="border-l-2 border-blue-200 pl-2">
            {item}
          </div>
        ))}
      </div>
    );

    // Helper function to render formulas with better formatting
    const renderFormula = (formulas) => (
      <div className="space-y-1.5 bg-gray-50 p-1.5 rounded">
        {formulas.map((formula, index) => (
          <div key={index} className="font-mono text-xs text-gray-700">
            {formula}
          </div>
        ))}
      </div>
    );

    return (
      <div className={`p-2 bg-white border border-blue-100 rounded ${className || ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calculator size={14} className="text-blue-600" />
            <h6 className="text-xs font-medium text-blue-700">Weight Calculation Details</h6>
          </div>
        </div>
        
        <div className="p-2 bg-yellow-50 rounded text-xs mb-3">
          <p className="font-medium mb-1">Input Values:</p>
          <ul className="space-y-1">
            <li><strong>User Rating:</strong> {rawUserRating.toFixed(1)}/5 (normalized: {formatPercentage(weightCalculation.normalizedRating)})</li>
            <li><strong>Automated Score:</strong> {formatPercentage(automatedScore)}</li>
            <li><strong>Expertise Multiplier:</strong> {expertiseMultiplier.toFixed(2)}×</li>
          </ul>
        </div>
        
        <div className="p-2 mb-3 bg-blue-50 rounded text-xs">
          <p className="font-medium mb-1">Why we use these weights:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Human Expertise (60%):</strong> Expert judgment is prioritized</li>
            <li><strong>Automated Analysis (40%):</strong> Provides objective measurements</li>
            <li><strong>Agreement Bonus:</strong> Increases confidence when assessments align</li>
          </ul>
        </div>
        
        <div className="mt-2 p-1 border-t pt-2">
          <h6 className="font-medium mb-1 text-xs">Calculation Steps:</h6>
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-1 border text-left">Step</th>
                <th className="p-1 border text-left">Breakdown</th>
                <th className="p-1 border text-left">Formula</th>
                <th className="p-1 border text-center">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1 border font-medium bg-gray-50">1. Weighted Automated Score</td>
                <td className="p-1 border">
                  {renderBreakdown(weightedAutomatedScore.breakdown)}
                </td>
                <td className="p-1 border">
                  {renderFormula([
                    "Confidence = 1 - ((Score - 0.5) × 2)²",
                    "Weight = max(0.1, 0.4 × Confidence)",
                    "Weighted = Score × (Weight ÷ Total)"
                  ])}
                </td>
                <td className="p-1 border text-center font-medium">
                  {formatPercentage(weightedAutomatedScore.value)}
                </td>
              </tr>
              <tr>
                <td className="p-1 border font-medium bg-gray-50">2. Weighted User Score</td>
                <td className="p-1 border">
                  {renderBreakdown(weightedUserScore.breakdown)}
                </td>
                <td className="p-1 border">
                  {renderFormula([
                    "Adjusted = Rating × Expertise",
                    "User Weight = 0.6 × Expertise",
                    "Weighted = Adjusted × (Weight ÷ Total)"
                  ])}
                </td>
                <td className="p-1 border text-center font-medium">
                  {formatPercentage(weightedUserScore.value)}
                </td>
              </tr>
              <tr>
                <td className="p-1 border font-medium bg-gray-50">3. Combined Score</td>
                <td className="p-1 border">
                  {renderBreakdown(combinedScore.breakdown)}
                </td>
                <td className="p-1 border">
                  {renderFormula([
                    "Combined = Weighted Auto + Weighted User"
                  ])}
                </td>
                <td className="p-1 border text-center font-medium">
                  {formatPercentage(combinedScore.value)}
                </td>
              </tr>
              <tr>
                <td className="p-1 border font-medium bg-gray-50">4. Final Score with Bonus</td>
                <td className="p-1 border">
                  {renderBreakdown(finalScoreWithBonus.breakdown)}
                </td>
                <td className="p-1 border">
                  {renderFormula([
                    "Agreement = 1 - |Auto - User|",
                    "Bonus = Agreement × 0.1",
                    "Final = Combined × (1 + Bonus)"
                  ])}
                </td>
                <td className="p-1 border text-center font-medium">
                  {formatPercentage(finalScoreWithBonus.value)} 
                  {weightCalculation.isCapped ? "(capped at 100%)" : ""}
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-3 bg-gray-50 p-2 rounded text-xs">
            <h6 className="font-medium mb-1">Final Score Interpretation:</h6>
            <p>The final score of {formatPercentage(weightCalculation.finalScore)} reflects:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>An automated analysis contribution of {formatPercentage(weightedAutomatedScore.value)}</li>
              <li>A human expertise contribution of {formatPercentage(weightedUserScore.value)}</li>
              <li>An agreement bonus of {formatPercentage(weightCalculation.agreementBonus)}</li>
              <li>Your expertise level ({expertiseMultiplier.toFixed(2)}×) elevated the importance of your assessment</li>
            </ul>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering weight calculation details:', error);
    
    // Fallback minimal display
    return (
      <div className={`p-2 bg-white border border-blue-100 rounded ${className || ''}`}>
        <div className="flex items-center gap-2">
          <Calculator size={14} className="text-blue-600" />
          <h6 className="text-xs font-medium text-blue-700">Weight Calculation Details</h6>
        </div>
        <div className="p-2 mt-2 bg-yellow-50 rounded text-xs">
          <p>User Rating: {(metricData?.normalizedRating || 0) * 5}/5</p>
          <p>Automated Score: {formatPercentage(automatedScore || 0)}</p>
          <p>Expertise Multiplier: {expertiseMultiplier.toFixed(2)}×</p>
          <p>Final Score: {formatPercentage(metricData?.finalScore || 0)}</p>
        </div>
      </div>
    );
  }
};

export default WeightCalculationDetails;