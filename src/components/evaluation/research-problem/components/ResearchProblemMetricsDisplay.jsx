// src/components/evaluation/research-problem/components/ResearchProblemMetricsDisplay.jsx
import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const ResearchProblemMetricsDisplay = ({ similarityData }) => {
  if (!similarityData) return null;

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded border text-sm">
      <div className="flex items-center mb-2">
        <span className="font-medium">Key Findings</span>
      </div>
      <ul className="space-y-2 text-gray-700">
        <li className="flex items-start">
          <span className="mr-2">•</span>
          <span>
            <span className="font-medium">Precision:</span> {formatPercentage(similarityData.precision || 0)} - {
              similarityData.precision > 0.7 ? 'High accuracy' : 
              similarityData.precision > 0.4 ? 'Moderate accuracy' : 'Low accuracy'
            } in matching content
          </span>
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          <span>
            <span className="font-medium">Recall:</span> {formatPercentage(similarityData.recall || 0)} - {
              similarityData.recall > 0.7 ? 'Most content covered' : 
              similarityData.recall > 0.4 ? 'Partial content covered' : 'Minimal content covered'
            }
          </span>
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          <span>
            <span className="font-medium">F1 Score:</span> {formatPercentage(similarityData.f1Score || 0)} - {
              similarityData.f1Score > 0.7 ? 'Good balance' : 
              similarityData.f1Score > 0.4 ? 'Moderate balance' : 'Poor balance'
            } between precision and recall
          </span>
        </li>
        {similarityData.editDistanceDetails && (
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <span className="font-medium">Edit Distance:</span> {similarityData.editDistanceDetails.distance} operations ({formatPercentage(similarityData.editDistance || 0)} similarity) - {
                similarityData.editDistance > 0.7 ? 'Minor changes' : 
                similarityData.editDistance > 0.4 ? 'Moderate changes' : 'Significant changes'
              } from source
            </span>
          </li>
        )}
        {similarityData.tokenMatching && (
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <span className="font-medium">Token Matching:</span> {formatPercentage(similarityData.tokenMatching || 0)} - {
                similarityData.tokenMatching > 0.7 ? 'Excellent preservation' : 
                similarityData.tokenMatching > 0.4 ? 'Moderate preservation' : 'Poor preservation'
              } of original terms
            </span>
          </li>
        )}
      </ul>
      
      <div className="mt-3 pt-3 border-t">
        <p className="text-xs">
          <span className="font-medium">Overall assessment:</span> This problem formulation demonstrates {
            similarityData.automatedOverallScore > 0.8 ? 'excellent' :
            similarityData.automatedOverallScore > 0.6 ? 'good' :
            similarityData.automatedOverallScore > 0.4 ? 'moderate' :
            'limited'
          } similarity to the reference content with {
            similarityData.precision > similarityData.recall ? 'higher precision than recall' :
            similarityData.recall > similarityData.precision ? 'higher recall than precision' :
            'balanced precision and recall'
          }.
        </p>
      </div>
    </div>
  );
};

export default ResearchProblemMetricsDisplay;