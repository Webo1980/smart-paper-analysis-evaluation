import React from 'react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { EditAnalysisVisualization } from '../visualizations/ProblemComparisonVisualizations';
import { Info } from 'lucide-react';

const EditOperationAnalysis = ({ comparisonData, isExpanded, toggleExpanded }) => {
  // Check if data exists
  if (!comparisonData) return <div>No edit operation data available</div>;
  
  // Define formula and calculation
  const formula = `
Edit Percentage = Total Edits / Original Length
Edit Score = 1 - Edit Percentage (higher is better)
  `;
  
  const titleEdits = comparisonData?.title?.edits?.totalEdits || 0;
  const descEdits = comparisonData?.description?.edits?.totalEdits || 0;
  const overallEdits = comparisonData?.overall?.edits?.totalEdits || 0;
  const titleLength = comparisonData?.title?.levenshtein?.maxLength || 1;
  const descLength = comparisonData?.description?.levenshtein?.maxLength || 1;
  const overallLength = comparisonData?.overall?.levenshtein?.maxLength || 1;
  const titleEditPct = comparisonData?.title?.edits?.editPercentage || 0;
  const descEditPct = comparisonData?.description?.edits?.editPercentage || 0;
  const overallEditPct = comparisonData?.overall?.edits?.editPercentage || 0;
  
  const calculation = `
Title:
  Edit Percentage = ${titleEdits} / ${titleLength} = ${formatPercentage(titleEditPct)}
  Edit Score = 1 - ${formatPercentage(titleEditPct)} = ${formatPercentage(1 - titleEditPct)}
  
Description:
  Edit Percentage = ${descEdits} / ${descLength} = ${formatPercentage(descEditPct)}
  Edit Score = 1 - ${formatPercentage(descEditPct)} = ${formatPercentage(1 - descEditPct)}
  
Overall:
  Edit Percentage = ${overallEdits} / ${overallLength} = ${formatPercentage(overallEditPct)}
  Edit Score = 1 - ${formatPercentage(overallEditPct)} = ${formatPercentage(1 - overallEditPct)}
  `;
  
  // Calculate operation percentages
  const insertPct = comparisonData?.overall?.edits?.insertions / overallEdits || 0;
  const deletePct = comparisonData?.overall?.edits?.deletions / overallEdits || 0;
  const modifyPct = comparisonData?.overall?.edits?.modifications / overallEdits || 0;
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Edit Operation Analysis breaks down the types of changes (insertions, deletions, modifications) needed
            to transform the reference text to the extracted text. This helps understand the nature of differences
            between the two versions.
          </p>
          
          <div className="mt-1 bg-blue-50 p-2 rounded text-xs border-l-2 border-blue-200 pl-2 mb-4">
            <p className="font-medium">Formula:</p>
            <pre className="whitespace-pre-wrap">{formula}</pre>
            
            <p className="font-medium mt-2">Calculation:</p>
            <pre className="whitespace-pre-wrap">{calculation}</pre>
          </div>
          
          <EditAnalysisVisualization editData={comparisonData?.overall?.edits} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Operation Breakdown</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="p-2 bg-white rounded border">
                  <h5 className="text-xs font-medium mb-2">Edit Operations Distribution</h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-1 rounded bg-green-50 border border-green-100 text-center">
                      <p className="font-medium">Insertions</p>
                      <p className="text-lg font-semibold">{comparisonData?.overall?.edits?.insertions || 0}</p>
                      <p className="text-xs text-gray-600">{formatPercentage(insertPct)}</p>
                    </div>
                    <div className="p-1 rounded bg-red-50 border border-red-100 text-center">
                      <p className="font-medium">Deletions</p>
                      <p className="text-lg font-semibold">{comparisonData?.overall?.edits?.deletions || 0}</p>
                      <p className="text-xs text-gray-600">{formatPercentage(deletePct)}</p>
                    </div>
                    <div className="p-1 rounded bg-blue-50 border border-blue-100 text-center">
                      <p className="font-medium">Modifications</p>
                      <p className="text-lg font-semibold">{comparisonData?.overall?.edits?.modifications || 0}</p>
                      <p className="text-xs text-gray-600">{formatPercentage(modifyPct)}</p>
                    </div>
                  </div>
                  <div className="mt-2 p-1 rounded bg-purple-50 border border-purple-100 text-center">
                    <p className="font-medium">Total Edits</p>
                    <p className="text-lg font-semibold">{overallEdits} characters</p>
                    <p className="text-xs text-gray-600">Edit Percentage: {formatPercentage(overallEditPct)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded border">
                    <h5 className="text-xs font-medium mb-1">Title</h5>
                    <ul className="text-xs space-y-1 text-gray-700">
                      <li>• Insertions: {comparisonData?.title?.edits?.insertions || 0} chars</li>
                      <li>• Deletions: {comparisonData?.title?.edits?.deletions || 0} chars</li>
                      <li>• Modifications: {comparisonData?.title?.edits?.modifications || 0} chars</li>
                      <li>• Total edits: {titleEdits} chars</li>
                      <li>• Edit percentage: {formatPercentage(titleEditPct)}</li>
                      <li>• Edit score: {formatPercentage(1 - titleEditPct)}</li>
                    </ul>
                  </div>
                  
                  <div className="p-2 bg-white rounded border">
                    <h5 className="text-xs font-medium mb-1">Description</h5>
                    <ul className="text-xs space-y-1 text-gray-700">
                      <li>• Insertions: {comparisonData?.description?.edits?.insertions || 0} chars</li>
                      <li>• Deletions: {comparisonData?.description?.edits?.deletions || 0} chars</li>
                      <li>• Modifications: {comparisonData?.description?.edits?.modifications || 0} chars</li>
                      <li>• Total edits: {descEdits} chars</li>
                      <li>• Edit percentage: {formatPercentage(descEditPct)}</li>
                      <li>• Edit score: {formatPercentage(1 - descEditPct)}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <div className="flex items-center mb-2">
                <span className="font-medium">Interpretation</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {overallEditPct > 0.7 ? 
                  "The problem required extensive editing, with most of the original content being modified. This suggests significant differences between reference and extracted text." : 
                  overallEditPct > 0.4 ? 
                  "The problem required moderate editing, with partial preservation of original content. This indicates substantial reformulation." : 
                  "The problem required minimal editing, with good preservation of original content. This suggests high similarity between reference and extracted text."
                }
              </p>
              
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-1">Edit Operation Analysis:</p>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className={`p-1 rounded ${
                    insertPct > Math.max(deletePct, modifyPct) ? "bg-green-50 border border-green-100" :
                    deletePct > Math.max(insertPct, modifyPct) ? "bg-red-50 border border-red-100" :
                    "bg-blue-50 border border-blue-100"
                  }`}>
                    <p className="font-medium">
                      {insertPct > Math.max(deletePct, modifyPct) ? "Primarily Insertions" : 
                       deletePct > Math.max(insertPct, modifyPct) ? "Primarily Deletions" : 
                       "Primarily Modifications"}
                    </p>
                    <p className="mt-1 text-xs">
                      {insertPct > Math.max(deletePct, modifyPct) ? 
                        "The extracted text primarily adds new content to the reference. This suggests elaboration or expansion on the original content." : 
                        deletePct > Math.max(insertPct, modifyPct) ? 
                        "The extracted text primarily removes content from the reference. This suggests summarization or focusing on specific aspects." : 
                        "The extracted text primarily modifies existing content. This suggests reformulation while maintaining similar length."
                      }
                    </p>
                  </div>
                  
                  <div className="p-1 rounded bg-purple-50 border border-purple-100">
                    <p className="font-medium">Edit Score Assessment</p>
                    <div className="flex items-center mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          (1 - overallEditPct) > 0.7 ? "bg-green-500" :
                          (1 - overallEditPct) > 0.4 ? "bg-yellow-500" :
                          "bg-red-500"
                        }`} style={{ width: `${(1 - overallEditPct) * 100}%` }}></div>
                      </div>
                      <span className="ml-2 font-medium">{formatPercentage(1 - overallEditPct)}</span>
                    </div>
                    <p className="mt-2 text-xs">
                      {(1 - overallEditPct) > 0.7 ? 
                        "High edit score indicates excellent content preservation with minimal editing required." : 
                        (1 - overallEditPct) > 0.4 ? 
                        "Moderate edit score indicates partial content preservation with substantial editing." : 
                        "Low edit score indicates significant differences requiring extensive editing."
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

export default EditOperationAnalysis;