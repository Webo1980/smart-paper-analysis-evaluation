import React, { useState } from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { EditDistanceVisualization } from '../visualizations/ProblemComparisonVisualizations';
import { Info } from 'lucide-react';

const EditDistanceAnalysis = ({ comparisonData, isExpanded, toggleExpanded }) => {
  // Extract key analysis metrics
  const titleSimilarity = comparisonData?.title?.levenshtein?.similarityScore || 0;
  const descriptionSimilarity = comparisonData?.description?.levenshtein?.similarityScore || 0;
  const overallSimilarity = comparisonData?.overall?.levenshtein?.similarityScore || 0;
  
  // Get formula and calculation explanation
  const formula = `Normalized Edit Distance = 1 - (Levenshtein Distance / Max Length)`;
  const calculation = `
Title: 1 - (${comparisonData?.title?.levenshtein?.distance || 0} / ${comparisonData?.title?.levenshtein?.maxLength || 1})
= ${formatPercentage(titleSimilarity)}

Description: 1 - (${comparisonData?.description?.levenshtein?.distance || 0} / ${comparisonData?.description?.levenshtein?.maxLength || 1})
= ${formatPercentage(descriptionSimilarity)}

Overall: 1 - (${comparisonData?.overall?.levenshtein?.distance || 0} / ${comparisonData?.overall?.levenshtein?.maxLength || 1})
= ${formatPercentage(overallSimilarity)}
  `;
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Edit Distance measures the minimum number of operations (insertions, deletions, substitutions) needed to transform one text into another.
            Lower distance means greater similarity between texts. The score is normalized to a 0-1 scale where 1 means identical texts.
          </p>
          
          <div className="mt-1 bg-blue-50 p-2 rounded text-xs border-l-2 border-blue-200 pl-2 mb-4">
            <p className="font-medium">Formula:</p>
            <p className="whitespace-pre-wrap">{formula}</p>
            
            <p className="font-medium mt-2">Calculation:</p>
            <pre className="whitespace-pre-wrap">{calculation}</pre>
          </div>
          
          <EditDistanceVisualization comparisonData={comparisonData} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Detailed Metrics</span>
              </div>
              <ul className="space-y-1 text-gray-700">
                <li>• <span className="font-medium">Title similarity:</span> {formatPercentage(titleSimilarity)} - {
                  titleSimilarity > 0.7 ? 'Minor adjustments only' : 
                  titleSimilarity > 0.4 ? 'Moderate changes made' : 'Significant rewriting'
                }</li>
                <li>• <span className="font-medium">Description similarity:</span> {formatPercentage(descriptionSimilarity)} - {
                  descriptionSimilarity > 0.7 ? 'Core content preserved' : 
                  descriptionSimilarity > 0.4 ? 'Partial content preserved' : 'Mostly rewritten'
                }</li>
                <li>• <span className="font-medium">Overall similarity:</span> {formatPercentage(overallSimilarity)} - {
                  overallSimilarity > 0.7 ? 'AI output was mostly accepted' : 
                  overallSimilarity > 0.4 ? 'AI output was partially accepted' : 'AI output required significant revisions'
                }</li>
                <li>• <span className="font-medium">Total edit operations needed:</span> {comparisonData?.overall?.levenshtein?.distance || 0}</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Interpretation</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {overallSimilarity > 0.8 ? 
                  "The problem formulation is nearly identical to the reference text, with minimal edit operations needed. This indicates excellent content alignment." :
                  overallSimilarity > 0.6 ?
                  "The problem formulation preserves most of the reference text with moderate changes. Content is well-aligned with some modifications." :
                  overallSimilarity > 0.4 ?
                  "The problem formulation has undergone substantial edits but retains core concepts from the reference. Significant reformulation occurred." :
                  "The problem formulation shows major differences from the reference, suggesting the content was heavily rewritten or replaced."
                }
              </p>
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-1">Edit Distance Quality Scale:</p>
                <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                  <li><span className="font-medium">High (80-100%):</span> Excellent content alignment</li>
                  <li><span className="font-medium">Good (60-80%):</span> Good content alignment with minor changes</li>
                  <li><span className="font-medium">Moderate (40-60%):</span> Partial content preservation</li>
                  <li><span className="font-medium">Low (0-40%):</span> Significant content differences</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default EditDistanceAnalysis;