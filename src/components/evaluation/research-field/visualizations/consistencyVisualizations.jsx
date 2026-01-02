// src/components/evaluation/research-field/visualizations/consistencyVisualizations.jsx
import React from 'react';
import { formatPercent } from '../utils/commonMetricsUtils';
import { getRelationshipDescription } from '../utils/fieldHierarchyUtils';

/**
 * Progress bar component for consistency scores
 */
export const ProgressBar = ({ value, label, description }) => (
  <div className="mb-2">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm font-medium text-gray-700">{formatPercent(value)}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${
          value >= 0.7 ? 'bg-green-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
        }`} 
        style={{ width: `${Math.max(value * 100, 2)}%` }}
      ></div>
    </div>
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);

/**
 * Visual representation of word consistency across fields
 */
export const WordConsistencyVisualization = ({ 
  visualizationItems, 
  wordPresence, 
  groundTruth 
}) => {
  // Calculate layout dimensions based on item count
  const itemCount = visualizationItems.length;
  const svgWidth = Math.max(1000, itemCount * 150); // Ensure minimum width
  const colWidth = Math.min(150, (svgWidth - 100) / itemCount);
  const padding = 60;
  const itemWidth = 120;
  
  return (
    <div className="my-6 overflow-x-auto">
      <svg width="100%" height="380" viewBox={`0 0 ${svgWidth} 380`} className="mx-auto">
        <rect x="50" y="100" width={svgWidth - 100} height="270" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" rx="5" />
        <text x={svgWidth / 2} y="70" fontSize="16" fontWeight="bold" textAnchor="middle">Word Consistency Across Research Fields</text>
        
        {visualizationItems.map((item, index) => {
          const itemName = typeof item === 'string' ? item : (item?.name || '');
          const isGroundTruth = itemName === groundTruth;
          const displayName = itemName.length > 15 ? itemName.substring(0, 15) + '...' : itemName;
          
          // Calculate column position
          const x = padding + ((svgWidth - (padding * 2)) / itemCount) * (index + 0.5);
          
          return (
            <g key={index}>
              <rect 
                x={x - (itemWidth / 2)} 
                y="150" 
                width={itemWidth} 
                height="180" 
                fill={isGroundTruth ? "#22c55e" : "#a78bfa"} 
                fillOpacity="0.1" 
                rx="4" 
                stroke={isGroundTruth ? "#22c55e" : "#a78bfa"} 
                strokeWidth="1" 
              />
              <text x={x} y="140" fontSize="14" textAnchor="middle" fontWeight="bold">
                {isGroundTruth ? "🟢 " : ""}{displayName}
              </text>
              {wordPresence.slice(0, 10).map((wordData, wordIdx) => {
                const y = 170 + (wordIdx * 15);
                const included = itemName.includes(wordData.word);
                return (
                  <React.Fragment key={wordIdx}>
                    <circle 
                      cx={x - 40} 
                      cy={y} 
                      r="4" 
                      fill={included ? "#22c55e" : "#ef4444"} 
                    />
                    <text 
                      x={x - 30} 
                      y={y + 4} 
                      fontSize="12"
                      fill="#4b5563"
                    >
                      {wordData.word}
                    </text>
                  </React.Fragment>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Word presence table visualization
 */
export const WordPresenceTable = ({ 
  visualizationItems, 
  wordPresence, 
  averagePresence, 
  groundTruth 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 text-left border-b">Word</th>
            {visualizationItems.map((name, i) => (
              <th key={i} className="p-2 text-center border-b">
                <div className="flex items-center justify-center">
                  {name === groundTruth && (
                    <span className="text-green-500 mr-1">●</span>
                  )}
                  {typeof name === 'string' ? name : 
                  name && typeof name === 'object' ? 
                  (name.name || name.field || 'Object') : 'N/A'}
                </div>
              </th>
            ))}
            <th className="p-2 text-center border-b">Presence</th>
          </tr>
        </thead>
        <tbody>
          {wordPresence.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{item.word}</td>
              {visualizationItems.map((name, j) => (
                <td key={j} className={`p-2 text-center ${name === groundTruth ? 'bg-yellow-100' : ''}`}>
                  {(typeof name === 'string' ? name : (name?.name || '')).includes(item.word) ? (
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      ✓
                    </span>
                  ) : (
                    <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                      ✗
                    </span>
                  )}
                </td>
              ))}
              <td className="p-2 text-center font-medium">
                {formatPercent(item.presenceRate)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td className="p-2 font-medium">Average</td>
            <td colSpan={visualizationItems.length}></td>
            <td className="p-2 text-center font-medium">
              {formatPercent(averagePresence)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};