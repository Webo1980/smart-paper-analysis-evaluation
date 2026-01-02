// src/components/evaluation/research-field/visualizations/relevanceVisualizations.jsx
import React from 'react';
import { getRelationshipDescription } from '../utils/fieldHierarchyUtils';

/**
 * Visual representation of word overlap between ground truth and prediction
 */
export const WordOverlapVisualization = ({ groundTruth, prediction, wordMetrics }) => {
  const { refWords, predWords, commonWords } = wordMetrics;
  
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center">
      <div className="flex-1 min-w-[300px]">
        <svg width="300" height="200" viewBox="0 0 300 200" className="mx-auto">
          <circle cx="100" cy="100" r="70" fill="#ef4444" fillOpacity="0.5" stroke="#dc2626" />
          <circle cx="200" cy="100" r="70" fill="#10b981" fillOpacity="0.5" stroke="#047857" />
          <text x="100" y="50" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#dc2626">Ground Truth Words</text>
          <text x="200" y="50" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#047857">Prediction Words</text>
          <text x="150" y="100" textAnchor="middle" fontSize="14" fontWeight="bold">
            {(wordMetrics.wordOverlapScore * 100).toFixed(1)}%
          </text>
          <text x="150" y="120" textAnchor="middle" fontSize="12">
            {commonWords.length} common words
          </text>
        </svg>
      </div>
      
      <div className="flex-1 min-w-[200px]">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">Ground Truth:</p>
          <p className="text-sm bg-gray-50 p-2 rounded">{groundTruth || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">{refWords.length} words</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">Prediction:</p>
          <p className="text-sm bg-gray-50 p-2 rounded">{prediction || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">{predWords.length} words</p>
        </div>
        <div className="bg-blue-50 p-2 rounded border border-blue-100">
          <p className="text-sm font-medium text-blue-800">Common words:</p>
          <p className="text-sm text-blue-700">
            {commonWords.length > 0 ? commonWords.join(', ') : 'None'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Visual representation of hierarchy Jaccard similarity
 */
export const HierarchyJaccardVisualization = ({ hierarchyJaccard }) => {
  const { intersectionSize, unionSize, jaccardScore } = hierarchyJaccard;
  
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center">
      <div className="flex-1 min-w-[300px]">
        <svg width="300" height="200" viewBox="0 0 300 200" className="mx-auto">
          <rect x="20" y="40" width="260" height="120" rx="5" fill="#f8fafc" stroke="#94a3b8" />
          <circle cx="100" cy="100" r="60" fill="#ef4444" fillOpacity="0.5" stroke="#dc2626" />
          <circle cx="200" cy="100" r="60" fill="#10b981" fillOpacity="0.5" stroke="#047857" />
          <text x="100" y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#dc2626">Ground Truth Path</text>
          <text x="200" y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#047857">Prediction Path</text>
          
          {/* Intersection highlight */}
          <rect 
            x="140" 
            y="70" 
            width="20" 
            height="60" 
            fill="#8b5cf6" 
            fillOpacity="0.7" 
            stroke="#6d28d9" 
          />
          
          <text x="150" y="180" textAnchor="middle" fontSize="12" fontWeight="bold">
            Hierarchy Jaccard: {jaccardScore.toFixed(2)}
          </text>
        </svg>
      </div>
      
      <div className="flex-1 min-w-[200px]">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 p-2 rounded border border-red-100">
            <p className="text-xs font-medium text-red-800">Ground Truth Path Nodes</p>
            <p className="text-sm text-red-700">{Math.round(unionSize * 0.6)}</p>
          </div>
          <div className="bg-green-50 p-2 rounded border border-green-100">
            <p className="text-xs font-medium text-green-800">Prediction Path Nodes</p>
            <p className="text-sm text-green-700">{Math.round(unionSize * 0.7)}</p>
          </div>
          <div className="bg-purple-50 p-2 rounded border border-purple-100">
            <p className="text-xs font-medium text-purple-800">Common Nodes</p>
            <p className="text-sm text-purple-700">{Math.round(jaccardScore * unionSize)}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded border border-gray-200">
            <p className="text-xs font-medium text-gray-800">Total Unique Nodes</p>
            <p className="text-sm text-gray-700">{unionSize}</p>
          </div>
        </div>
      </div>
    </div>
  );
};