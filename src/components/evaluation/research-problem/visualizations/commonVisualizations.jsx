// src/components/evaluation/research-field/visualizations/commonVisualizations.jsx
import React from 'react';

/**
 * Common component for section headers with toggle
 */
export const CollapsibleSectionHeader = ({ 
  title, 
  score, 
  isExpanded, 
  toggleExpanded, 
  icon: Icon, 
  badgeColor 
}) => {
  return (
    <div 
      className="flex items-center justify-between cursor-pointer"
      onClick={toggleExpanded}
    >
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="h-5 w-5 text-gray-500" />}
        <h5 className="font-medium text-gray-800">{title}</h5>
      </div>
      <div className="flex items-center">
        {score !== undefined && (
          <span className={`text-xs px-2 py-1 rounded-full mr-2 ${badgeColor}`}>
            {typeof score === 'number' ? `${(score * 100).toFixed(1)}%` : score}
          </span>
        )}
        {isExpanded ? (
          <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  );
};

/**
 * Component for displaying score calculation box
 */
export const ScoreCalculationBox = ({ 
  components, 
  weights, 
  totalScore, 
  formula 
}) => {
  return (
    <div className="bg-gray-50 p-3 rounded border">
      <p className="text-xs font-medium mb-1">Score Calculation:</p>
      <div className="border-t pt-1 space-y-2">
        <div className="bg-green-50 p-2 rounded text-xs mt-1">
          <span className="font-medium">Formula Components: </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            {Object.keys(components).map((key, index) => (
              <div key={index} className={`bg-${components[key].color}-50 p-2 rounded border border-${components[key].color}-100`}>
                <span className="font-medium block text-center">{components[key].label}</span>
                <span className="block text-center">{(components[key].value * 100).toFixed(1)}%</span>
                <span className="block text-center text-xs">× {weights[key]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded text-xs">
          <span className="font-medium">Calculated Score: </span>
          <div className="flex justify-between items-center mt-1">
            <span className="whitespace-normal break-words">
              {formula || Object.keys(components).map(key => 
                `(${(components[key].value * 100).toFixed(1)}% × ${weights[key]})`
              ).join(' + ')}
            </span>
            <span className="font-medium">= {(totalScore * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};