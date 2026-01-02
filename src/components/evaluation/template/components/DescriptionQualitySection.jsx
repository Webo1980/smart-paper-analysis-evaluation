
// src/components/evaluation/template/components/DescriptionQualitySection.jsx
import React from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const DescriptionQualitySection = ({ descriptionQuality, templateData, details }) => {
  if (!templateData) return null;
  
  const score = descriptionQuality?.score || 0;
  const description = templateData.description || '';
  const descLength = description.length;
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  const sentenceCount = description.split(/[.!?]+/).filter(Boolean).length;
  const hasStructure = description.includes(".") || description.includes(",");
  
  return (
    <div className="space-y-4">
      <h6 className="text-sm font-medium">Description Quality Analysis</h6>
      
      <div className="bg-white p-3 rounded border">
        <h6 className="text-xs font-medium mb-2">Template Description:</h6>
        <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
          {description || 'No description available'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Quality Factors</h6>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Description Length ({descLength} chars)</span>
                <span>{descLength >= 30 && descLength <= 500 ? '✓ Good' : '⚠ Needs Improvement'}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, (descLength >= 30 && descLength <= 500 ? 100 : 
                  descLength < 30 ? descLength * 3.33 : Math.max(0, 1000 - descLength) / 5)))} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 30-500 characters</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Word Count ({wordCount} words)</span>
                <span>{wordCount >= 5 && wordCount <= 100 ? '✓ Good' : '⚠ Needs Improvement'}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, (wordCount >= 5 && wordCount <= 100 ? 100 : 
                  wordCount < 5 ? wordCount * 20 : Math.max(0, 200 - wordCount))))} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 5-100 words</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Structure (Sentences: {sentenceCount})</span>
                <span>{hasStructure ? '✓ Good' : '⚠ Needs Improvement'}</span>
              </div>
              <Progress value={hasStructure ? 100 : 0} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Should have proper sentence structure</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Assessment</h6>
          <div className="p-3 bg-gray-50 rounded text-sm">
            <p className="font-medium">{details || 'No assessment available'}</p>
          </div>
          
          <div className="mt-4">
            <h6 className="text-xs font-medium mb-2">Issues</h6>
            {descriptionQuality?.issues && descriptionQuality.issues.length > 0 ? (
              <ul className="list-disc list-inside text-xs space-y-1">
                {descriptionQuality.issues.map((issue, i) => (
                  <li key={i} className="text-gray-700">{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-green-600">No issues detected</p>
            )}
          </div>
          
          <div className="mt-4">
            <h6 className="text-xs font-medium mb-2">Improvement Suggestions</h6>
            <ul className="list-disc list-inside text-xs space-y-1">
              {descLength < 30 && <li>Add more content to the description (at least 30 characters)</li>}
              {descLength > 500 && <li>Consider making the description more concise</li>}
              {wordCount < 5 && <li>Add more descriptive words to improve clarity</li>}
              {wordCount > 100 && <li>Consider summarizing for better readability</li>}
              {!hasStructure && <li>Add proper sentence structure with punctuation</li>}
              {sentenceCount < 1 && <li>Include at least one complete sentence</li>}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-blue-50 rounded border border-blue-100">
        <h6 className="text-xs font-medium text-blue-800 mb-2">Overall Description Quality Score</h6>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs">Score: {formatPercentage(score)}</span>
        </div>
        <Progress value={score * 100} className="h-3" />
      </div>
    </div>
  );
};

export default DescriptionQualitySection;