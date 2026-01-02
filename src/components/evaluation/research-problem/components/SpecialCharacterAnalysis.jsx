import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { SpecialCharactersVisualization } from '../visualizations/ProblemComparisonVisualizations';
import { Info } from 'lucide-react';

const SpecialCharacterAnalysis = ({ comparisonData, isExpanded, toggleExpanded }) => {
  // Check if data exists
  if (!comparisonData) return <div>No special character data available</div>;
  
  // Define formula and calculation
  const formula = `
Special Character Ratio = Special Character Count / Total Character Count
Special Character Score = 1 - |Reference Ratio - Extracted Ratio|
  `;
  
  const titleRatio = comparisonData?.title?.specialCharacters?.ratio || 0;
  const descRatio = comparisonData?.description?.specialCharacters?.ratio || 0;
  const titleCount = comparisonData?.title?.specialCharacters?.count || 0;
  const descCount = comparisonData?.description?.specialCharacters?.count || 0;
  const titleLength = comparisonData?.title?.levenshtein?.maxLength || 1;
  const descLength = comparisonData?.description?.levenshtein?.maxLength || 1;
  
  const calculation = `
Title:
  Special Character Ratio = ${titleCount} / ${titleLength} = ${formatPercentage(titleRatio)}
  
Description:
  Special Character Ratio = ${descCount} / ${descLength} = ${formatPercentage(descRatio)}
  
Special Character Score is based on comparing these ratios to expected patterns.
  `;
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Special Character Analysis examines the frequency and distribution of special characters in the extracted problem.
            Special characters include punctuation, symbols, and non-alphanumeric characters. 
            This analysis helps identify potential formatting issues or content artifacts.
          </p>
          
          <div className="mt-1 bg-blue-50 p-2 rounded text-xs border-l-2 border-blue-200 pl-2 mb-4">
            <p className="font-medium">Formula:</p>
            <pre className="whitespace-pre-wrap">{formula}</pre>
            
            <p className="font-medium mt-2">Calculation:</p>
            <pre className="whitespace-pre-wrap">{calculation}</pre>
          </div>
          
          <SpecialCharactersVisualization specialCharsData={comparisonData?.description?.specialCharacters} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Distribution Analysis</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="p-2 bg-white rounded border">
                  <h5 className="text-xs font-medium mb-2 flex justify-between">
                    <span>Title Special Characters</span>
                    <span className={
                      titleRatio > 0.2 ? "text-red-600" : 
                      titleRatio > 0.1 ? "text-amber-600" : 
                      "text-green-600"
                    }>{formatPercentage(titleRatio)}</span>
                  </h5>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Special characters:</span>
                      <span className="font-medium">{titleCount} characters</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total length:</span>
                      <span className="font-medium">{titleLength} characters</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Most common:</span>
                      <span className="font-medium">{comparisonData?.title?.specialCharacters?.characters?.length > 0 ? 
                        comparisonData?.title?.specialCharacters?.characters.slice(0, 3).map(c => 
                          `'${c.character}' (${c.count})`).join(', ') : 'None'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-white rounded border">
                  <h5 className="text-xs font-medium mb-2 flex justify-between">
                    <span>Description Special Characters</span>
                    <span className={
                      descRatio > 0.2 ? "text-red-600" : 
                      descRatio > 0.1 ? "text-amber-600" : 
                      "text-green-600"
                    }>{formatPercentage(descRatio)}</span>
                  </h5>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Special characters:</span>
                      <span className="font-medium">{descCount} characters</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total length:</span>
                      <span className="font-medium">{descLength} characters</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Most common:</span>
                      <span className="font-medium">{comparisonData?.description?.specialCharacters?.characters?.length > 0 ? 
                        comparisonData?.description?.specialCharacters?.characters.slice(0, 3).map(c => 
                          `'${c.character}' (${c.count})`).join(', ') : 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Interpretation</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {descRatio > 0.2 ? 
                  "The problem contains a high proportion of special characters, which may indicate formatting issues, mathematical notation, or code snippets embedded in the text." : 
                  descRatio > 0.1 ? 
                  "The problem contains a moderate proportion of special characters, typical for properly punctuated academic text." : 
                  "The problem contains a low proportion of special characters, suggesting simplified text or minimal punctuation."
                }
              </p>
              
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-1">Special Character Assessment:</p>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className={`p-1 rounded ${descRatio > 0.2 ? "bg-red-50 border border-red-100" : descRatio > 0.1 ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"}`}>
                    <p className="font-medium">
                      {descRatio > 0.2 ? "High special character usage" : 
                       descRatio > 0.1 ? "Normal special character usage" : 
                       "Low special character usage"}
                    </p>
                    <p className="mt-1 text-xs">
                      {descRatio > 0.2 ? 
                        "This may indicate complex technical content, mathematical notation, or formatting issues. Check for any unusual characters or formatting artifacts." : 
                        descRatio > 0.1 ? 
                        "This indicates normal academic text with standard punctuation and special characters." : 
                        "This indicates simplified text or minimal punctuation usage."
                      }
                    </p>
                  </div>
                  
                  <div className="p-1 rounded bg-blue-50 border border-blue-100">
                    <p className="font-medium">Character Distribution</p>
                    <p className="mt-1 text-xs">
                      Most common special characters: {comparisonData?.description?.specialCharacters?.characters?.length > 0 ? 
                        comparisonData?.description?.specialCharacters?.characters.slice(0, 3).map(c => 
                          `'${c.character}' (${c.count})`).join(', ') : 'None'}
                    </p>
                    <p className="mt-1 text-xs">
                      {comparisonData?.description?.specialCharacters?.characters?.length > 0 &&
                       comparisonData?.description?.specialCharacters?.characters[0]?.character === '.' ?
                        "Primarily normal punctuation (periods, commas) indicating standard text." :
                        comparisonData?.description?.specialCharacters?.characters?.some(c => ['(', ')', '[', ']', '{', '}'].includes(c.character)) ?
                        "Contains parentheses and brackets, suggesting structured content or citations." :
                        comparisonData?.description?.specialCharacters?.characters?.some(c => ['+', '-', '*', '/', '=', '<', '>'].includes(c.character)) ?
                        "Contains mathematical operators, suggesting equations or formulas." :
                        "Contains a mix of special characters typical for academic text."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default SpecialCharacterAnalysis;