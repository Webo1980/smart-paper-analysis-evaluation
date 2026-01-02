import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import { formatPercent } from '../utils/commonMetricsUtils';
import { calculateRelevanceMetrics } from '../utils/relevanceMetricsUtils'; 
import { WordOverlapVisualization, HierarchyJaccardVisualization } from '../visualizations/relevanceVisualizations';
import { CollapsibleSectionHeader, ScoreCalculationBox } from '../visualizations/commonVisualizations';
import ResearchFieldTree from './ResearchFieldTree';

const RelevanceSection = ({
  groundTruth,
  prediction,
  relevanceScore,
  details,
  hierarchyAnalysis,
  researchFieldsTree,
  predictedValues,
  relevanceMetrics // Pre-calculated metrics
}) => {
  // State for collapsible sections
  const [hierarchyExpanded, setHierarchyExpanded] = useState(false);
  const [jaccardExpanded, setJaccardExpanded] = useState(false);
  const [textSimilarityExpanded, setTextSimilarityExpanded] = useState(false);
  
  // Toggle functions
  const toggleHierarchy = () => setHierarchyExpanded(!hierarchyExpanded);
  const toggleJaccard = () => setJaccardExpanded(!jaccardExpanded);
  const toggleTextSimilarity = () => setTextSimilarityExpanded(!textSimilarityExpanded);

  // Use pre-calculated metrics if available, otherwise calculate them here
  const { metrics, details: metricDetails } = relevanceMetrics || 
    calculateRelevanceMetrics({
      groundTruth,
      prediction,
      researchFieldsTree
    });

  // Recalculate final score using consistent weights
  const calculatedRelevanceScore = (
    (metrics.hierarchyScore * 0.4) + 
    (metrics.wordOverlapScore * 0.4) + 
    (metrics.jaccardScore * 0.2)
  );

  // Make sure the displayed relevance score is the recalculated one for consistency
  const displayMetrics = {
    ...metrics,
    relevanceScore: calculatedRelevanceScore
  };

  return (
    <div className="p-4 space-y-4">
      {/* Overall Relevance Score Section */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <h5 className="font-medium mb-2 text-gray-800">Overall Relevance Score (Weight 30%)</h5>
        <p className="text-sm mb-3 text-gray-600">
          Relevance quantifies the semantic alignment between predicted and ground truth research fields using multiple dimensions. It evaluates taxonomic relationships (hierarchy position), linguistic similarity (word overlap), and shared vocabulary distribution (Jaccard similarity) to provide a holistic assessment of field classification accuracy. The score shown is {formatPercent(displayMetrics.relevanceScore)}.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 p-2 bg-gray-50 rounded border">
            <p className="text-xs font-medium mb-1">Explanation:</p>
            <div className="border-t pt-1">
              <p className="text-xs">
                Relevance measures how well the system's prediction matches the ground truth field in the taxonomy. 
                It combines three key metrics with weights:
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="bg-blue-50 p-2 rounded border border-blue-100">
                  Hierarchy: 40%
                </span>
                <span className="bg-purple-50 p-2 rounded border border-purple-100">
                  Word Overlap: 40%
                </span>
                <span className="bg-amber-50 p-2 rounded border border-amber-100">
                  Jaccard: 20%
                </span>
              </div>
              <p className="text-xs mt-2">
                <span className="font-medium">Hierarchy Score:</span> Measures taxonomic relationship between fields in the research hierarchy.
                <br />
                <span className="font-medium">Word Overlap:</span> Evaluates linguistic similarity between field names.
                <br />
                <span className="font-medium">Jaccard Similarity:</span> Assesses shared vocabulary relative to total terms.
              </p>
              {(displayMetrics.wordOverlapScore < 0.3 || displayMetrics.jaccardScore < 0.3) && (
                <div className="mt-2 bg-red-50 p-2 rounded text-xs">
                  <span className="font-medium text-red-700">Detected Issues: </span>
                  <ul className="list-disc list-inside mt-1">
                    {displayMetrics.wordOverlapScore < 0.3 && (
                      <li className="text-red-700">
                        <span className="font-medium">Low linguistic similarity</span> ({formatPercent(displayMetrics.wordOverlapScore)} word overlap) - fields use different terminology
                      </li>
                    )}
                    {displayMetrics.jaccardScore < 0.3 && (
                      <li className="text-red-700">
                        <span className="font-medium">Limited taxonomic alignment</span> ({formatPercent(displayMetrics.jaccardScore)} Jaccard similarity) - fields are in distant branches
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-2 bg-gray-50 rounded border">
            <p className="text-xs font-medium mb-1">Score Calculation:</p>
            <div className="border-t pt-1 space-y-2">
              <div className="bg-green-50 p-2 rounded text-xs mt-1">
                <span className="font-medium">Formula Components: </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div className="bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="font-medium block text-center">Hierarchy</span>
                    <span className="block text-center">{formatPercent(displayMetrics.hierarchyScore)}</span>
                    <span className="block text-center text-xs">× 0.4</span>
                  </div>
                  <div className="bg-purple-50 p-2 rounded border border-purple-100">
                    <span className="font-medium block text-center">Word Overlap</span>
                    <span className="block text-center">{formatPercent(displayMetrics.wordOverlapScore)}</span>
                    <span className="block text-center text-xs">× 0.4</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded border border-amber-100">
                    <span className="font-medium block text-center">Jaccard</span>
                    <span className="block text-center">{formatPercent(displayMetrics.jaccardScore)}</span>
                    <span className="block text-center text-xs">× 0.2</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded text-xs">
                <span className="font-medium">Calculated Score: </span>
                <div className="flex justify-between items-center mt-1">
                  <span className="whitespace-normal break-words">
                    ({formatPercent(displayMetrics.hierarchyScore)} × 0.4) + ({formatPercent(displayMetrics.wordOverlapScore)} × 0.4) + ({formatPercent(displayMetrics.jaccardScore)} × 0.2)
                  </span>
                  <span className="font-medium">= {formatPercent(displayMetrics.relevanceScore)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note about score calculation */}
      <div className="bg-amber-50 p-4 rounded border border-amber-200">
        <h5 className="font-medium mb-1 text-amber-800">Important Note</h5>
        <p className="text-sm text-amber-700">
          All relevance scores shown here are fixed and calculated between Ground Truth (<strong>{groundTruth}</strong>) and 
          the original Prediction (<strong>{prediction}</strong>). 
          The visualization below allows you to explore different field selections, but this does not change the relevance scores.
        </p>
      </div>

      {/* Hierarchical Tree Visualization - Now Collapsible */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <CollapsibleSectionHeader
          title="Research Field Hierarchy"
          score={displayMetrics.hierarchyScore}
          isExpanded={hierarchyExpanded}
          toggleExpanded={toggleHierarchy}
          badgeColor={getStatusBadgeColor(displayMetrics.hierarchyScore)}
        />
        
        {hierarchyExpanded && (
          <div className="mt-3">
            <ResearchFieldTree
              groundTruth={groundTruth}
              prediction={prediction}
              hierarchyAnalysis={researchFieldsTree}
              predictedValues={predictedValues}
              fixedRelevanceData={displayMetrics}
            />
          </div>
        )}
      </div>
      
      {/* Hierarchy-based Jaccard Similarity - Now Collapsible */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <CollapsibleSectionHeader
          title="Hierarchy Jaccard Similarity"
          score={displayMetrics.jaccardScore}
          isExpanded={jaccardExpanded}
          toggleExpanded={toggleJaccard}
          badgeColor={getStatusBadgeColor(displayMetrics.jaccardScore)}
        />
        
        {jaccardExpanded && (
          <div className="mt-3">
            <p className="text-sm mb-3 text-gray-600">
              Measures similarity between fields based on their positions in the research taxonomy,
              not just their names. Higher scores indicate greater semantic relevance.
            </p>
            
            <HierarchyJaccardVisualization 
              hierarchyJaccard={metricDetails.hierarchyJaccard} 
            />

            <div className="mt-4">
              <h6 className="text-sm font-medium mb-2 text-gray-700">Calculation</h6>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium text-gray-800">Hierarchy Jaccard =</p>
                <p>(Number of shared nodes in hierarchy paths) / (Total unique nodes in both paths)</p>
                <p>= {metricDetails.hierarchyJaccard.intersectionSize} / {metricDetails.hierarchyJaccard.unionSize}</p>
                <p className="font-medium mt-2">= {formatPercent(displayMetrics.jaccardScore, 2)}</p>
                <p className="text-xs mt-2 text-gray-500">
                  Range: 0 (completely different paths) to 1 (identical paths)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Word Overlap - LLM Context - Now Collapsible */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <CollapsibleSectionHeader
          title="Text Similarity (Word Overlap)"
          score={displayMetrics.wordOverlapScore}
          isExpanded={textSimilarityExpanded}
          toggleExpanded={toggleTextSimilarity}
          badgeColor={getStatusBadgeColor(displayMetrics.wordOverlapScore)}
        />
        
        {textSimilarityExpanded && (
          <div className="mt-3">
            <p className="text-sm mb-3 text-gray-600">
              Measures linguistic similarity between field names. This can reflect how language models
              might classify text when analyzing research abstracts.
            </p>
            
            <WordOverlapVisualization 
              groundTruth={groundTruth}
              prediction={prediction}
              wordMetrics={metricDetails.wordMetrics}
            />

            <div className="mt-4 bg-amber-50 p-3 rounded border border-amber-100">
              <h6 className="text-sm font-medium mb-2 text-amber-800">LLM Classification Context</h6>
              <p className="text-sm text-amber-700">
                Language models often use word-level similarities when classifying research abstracts into fields.
                This measure helps understand why an LLM might predict a specific field based on textual overlap,
                even when the hierarchical position differs.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                In this case, the word overlap is {formatPercent(displayMetrics.wordOverlapScore)}, which is 
                {displayMetrics.wordOverlapScore > 0.7 ? ' high, suggesting strong linguistic similarity.' : 
                 displayMetrics.wordOverlapScore > 0.3 ? ' moderate, suggesting partial linguistic similarity.' : 
                 ' low, suggesting minimal linguistic similarity.'} (Score: {formatPercent(displayMetrics.wordOverlapScore)})
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Combined Relevance Explanation */}
      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <h5 className="font-medium mb-2 text-gray-800">Combined Relevance Score</h5>
        <p className="text-xs text-gray-600 mb-2">
          <strong className="text-blue-600">Note:</strong> This score is based on the comparison between Ground Truth (<strong>{groundTruth}</strong>) and 
          the original Prediction (<strong>{prediction}</strong>). Calculated score: <strong>{formatPercent(displayMetrics.relevanceScore)}</strong>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="bg-blue-50 p-2 rounded border border-blue-100">
            <p className="text-xs font-medium text-blue-800">Hierarchy Score</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">{formatPercent(displayMetrics.hierarchyScore)}</p>
              <p className="text-xs text-blue-600">× 0.4</p>
            </div>
          </div>
          <div className="bg-purple-50 p-2 rounded border border-purple-100">
            <p className="text-xs font-medium text-purple-800">Word Overlap Score</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-purple-700">{formatPercent(displayMetrics.wordOverlapScore)}</p>
              <p className="text-xs text-purple-600">× 0.4</p>
            </div>
          </div>
          <div className="bg-amber-50 p-2 rounded border border-amber-100">
            <p className="text-xs font-medium text-amber-800">Jaccard Similarity</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700">{formatPercent(displayMetrics.jaccardScore)}</p>
              <p className="text-xs text-amber-600">× 0.2</p>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-green-50 rounded border border-green-100">
          <p className="text-sm font-medium text-green-800">Final Relevance Score Calculation</p>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <span className="text-blue-700">{formatPercent(displayMetrics.hierarchyScore * 0.4)}</span>
              <p className="text-xs text-gray-500">From hierarchy</p>
            </div>
            <div className="text-center">
              <span className="text-purple-700">+ {formatPercent(displayMetrics.wordOverlapScore * 0.4)}</span>
              <p className="text-xs text-gray-500">From word overlap</p>
            </div>
            <div className="text-center">
              <span className="text-amber-700">+ {formatPercent(displayMetrics.jaccardScore * 0.2)}</span>
              <p className="text-xs text-gray-500">From Jaccard similarity</p>
            </div>
          </div>
          <div className="mt-2 p-2 bg-white rounded text-center font-medium text-green-800">
            {formatPercent(displayMetrics.hierarchyScore * 0.4)} + {formatPercent(displayMetrics.wordOverlapScore * 0.4)} + {formatPercent(displayMetrics.jaccardScore * 0.2)} = {formatPercent(displayMetrics.relevanceScore)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelevanceSection;