// src/components/evaluation/template/components/TitleQualitySection.jsx
import React from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

const TitleQualitySection = ({ titleQuality, templateData, details }) => {
  if (!templateData) return null;
  
  const score = titleQuality?.score || 0;
  const title = templateData.title || templateData.name || '';
  const titleLength = title.length;
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  const startsWithCapital = /^[A-Z]/.test(title);
  
  return (
    <div className="space-y-4">
      <h6 className="text-sm font-medium">Title Quality Analysis</h6>
      
      <div className="bg-white p-3 rounded border">
        <h6 className="text-xs font-medium mb-2">Template Title:</h6>
        <div className="p-3 bg-gray-50 rounded text-sm font-medium">
          {title || 'No title available'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Quality Factors</h6>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Title Length ({titleLength} chars)</span>
                <span>{titleLength >= 10 && titleLength <= 100 ? '✓ Good' : '⚠ Needs Improvement'}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, (titleLength >= 10 && titleLength <= 100 ? 100 : 
                  titleLength < 10 ? titleLength * 10 : Math.max(0, 200 - titleLength))))} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 10-100 characters</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Word Count ({wordCount} words)</span>
                <span>{wordCount >= 2 && wordCount <= 15 ? '✓ Good' : '⚠ Needs Improvement'}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, (wordCount >= 2 && wordCount <= 15 ? 100 : 
                  wordCount < 2 ? wordCount * 50 : Math.max(0, 30 - wordCount) * 7)))} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 2-15 words</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Capitalization</span>
                <span>{startsWithCapital ? '✓ Good' : '⚠ Needs Improvement'}</span>
              </div>
              <Progress value={startsWithCapital ? 100 : 0} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Should start with a capital letter</p>
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
            {titleQuality?.issues && titleQuality.issues.length > 0 ? (
              <ul className="list-disc list-inside text-xs space-y-1">
                {titleQuality.issues.map((issue, i) => (
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
              {titleLength < 10 && <li>Make the title longer (at least 10 characters)</li>}
              {titleLength > 100 && <li>Make the title more concise (under 100 characters)</li>}
              {wordCount < 2 && <li>Add more descriptive words to the title</li>}
              {wordCount > 15 && <li>Reduce the number of words to improve clarity</li>}
              {!startsWithCapital && <li>Start the title with a capital letter</li>}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-blue-50 rounded border border-blue-100">
        <h6 className="text-xs font-medium text-blue-800 mb-2">Overall Title Quality Score</h6>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs">Score: {formatPercentage(score)}</span>
        </div>
        <Progress value={score * 100} className="h-3" />
      </div>
    </div>
  );
};

export default TitleQualitySection;