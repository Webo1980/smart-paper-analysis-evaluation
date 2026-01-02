import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Check,
  AlertCircle
} from 'lucide-react';
import { Progress } from '../../ui/progress';
import { calculateSimilarityScore, calculateTokenMetrics } from './utils/textDiffUtils';
import { formatPercentage } from './utils/baseMetricsUtils';
import { levenshteinDistance } from './utils/contentAnalysisUtils';

const SemanticTextComparison = ({ 
  sourceText,
  targetText,
  sourceLabel = "Source Text",
  targetLabel = "Target Text",
  similarityThreshold = 0.8,
  showDetailsInitially = false
}) => {
  const [showDetails, setShowDetails] = useState(showDetailsInitially);
  
  // Calculate similarity metrics
  const similarityScore = calculateSimilarityScore(sourceText, targetText);
  const isSimilar = similarityScore >= similarityThreshold;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(sourceText, targetText);
  const maxLength = Math.max(sourceText.length, targetText.length);
  const levenshteinSimilarity = maxLength > 0 ? 1 - (distance / maxLength) : 1;
  
  // Calculate token metrics
  const tokenMetrics = calculateTokenMetrics(sourceText, targetText);
  
  // Calculate Jaccard similarity
  const sourceWords = sourceText.toLowerCase().split(/\s+/).filter(Boolean);
  const targetWords = targetText.toLowerCase().split(/\s+/).filter(Boolean);
  const sourceSet = new Set(sourceWords);
  const targetSet = new Set(targetWords);
  
  let intersection = 0;
  sourceSet.forEach(token => {
    if (targetSet.has(token)) intersection++;
  });
  
  const union = sourceSet.size + targetSet.size - intersection;
  const jaccardSimilarity = union > 0 ? intersection / union : 0;
  
  // Split texts into lines for comparison and highlight matching words
  const sourceLines = sourceText.split('\n').filter(line => line.trim());
  const targetLines = targetText.split('\n').filter(line => line.trim());
  
  // Calculate line-by-line similarities
  const lineComparisons = sourceLines.map((sourceLine, i) => {
    const targetLine = i < targetLines.length ? targetLines[i] : '';
    const lineSimilarity = calculateSimilarityScore(sourceLine, targetLine);
    
    // Highlight matching words 
    const sourceWords = sourceLine.split(/\s+/);
    const targetWords = targetLine.split(/\s+/);
    const sourceSet = new Set(sourceWords.map(w => w.toLowerCase()));
    const targetSet = new Set(targetWords.map(w => w.toLowerCase()));
    
    const highlightedSource = highlightMatchingWords(sourceWords, targetSet);
    const highlightedTarget = highlightMatchingWords(targetWords, sourceSet);
    
    return {
      sourceLine,
      targetLine,
      similarity: lineSimilarity,
      isSimilar: lineSimilarity >= similarityThreshold,
      highlightedSource,
      highlightedTarget
    };
  });

  // Function to highlight matching words
  function highlightMatchingWords(words, otherSet) {
    return words.map(word => {
      const normalized = word.toLowerCase().replace(/[.,?!;()]/g, '');
      if (otherSet.has(normalized)) {
        return `<span class="bg-green-100 text-green-800 px-1 rounded">${word}</span>`;
      }
      return word;
    }).join(' ');
  }

  return (
    <div className="border rounded-lg overflow-hidden mt-3">
      <div 
        className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer border-b"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center">
          {isSimilar ? (
            <Check className="h-4 w-4 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
          )}
          <span className="font-medium">
            Semantic Similarity: {Math.round(similarityScore * 100)}%
          </span>
          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
            isSimilar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isSimilar ? 'Similar' : 'Partial Match'}
          </span>
        </div>
        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      
      {showDetails && (
        <div className="p-3 space-y-4">
          <div className="bg-white p-3 rounded border">
            <h4 className="text-sm font-medium mb-2">Similarity Analysis</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Overall Semantic Similarity</span>
                  <span>{Math.round(similarityScore * 100)}%</span>
                </div>
                <Progress 
                  value={similarityScore * 100} 
                  className={`h-2 ${isSimilar ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Threshold for match: {Math.round(similarityThreshold * 100)}%
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="text-xs font-medium">Levenshtein Distance</div>
                  <div className="text-lg">{distance}</div>
                  <div className="text-xs text-gray-500">Character-level edits</div>
                </div>
                
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="text-xs font-medium">Precision</div>
                  <div className="text-lg">{formatPercentage(tokenMetrics.precision)}</div>
                  <div className="text-xs text-gray-500">Target words in source</div>
                </div>
                
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="text-xs font-medium">Recall</div>
                  <div className="text-lg">{formatPercentage(tokenMetrics.recall)}</div>
                  <div className="text-xs text-gray-500">Source words in target</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="text-xs font-medium">Jaccard Similarity</div>
                  <div className="text-lg">{formatPercentage(jaccardSimilarity)}</div>
                  <div className="text-xs text-gray-500">Word-set overlap</div>
                </div>
                
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="text-xs font-medium">F1 Score</div>
                  <div className="text-lg">{formatPercentage(tokenMetrics.f1Score)}</div>
                  <div className="text-xs text-gray-500">Balance of precision/recall</div>
                </div>
              </div>
              
              {lineComparisons.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-xs font-medium mb-2">Line-by-Line Comparison</h5>
                  <div className="space-y-2">
                    {lineComparisons.map((line, i) => (
                      <div key={i} className="border rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">Line {i + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            line.isSimilar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {Math.round(line.similarity * 100)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="font-medium">Source:</div>
                            {line.sourceLine ? (
                              <div dangerouslySetInnerHTML={{ __html: line.highlightedSource }} />
                            ) : (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">Target:</div>
                            {line.targetLine ? (
                              <div dangerouslySetInnerHTML={{ __html: line.highlightedTarget }} />
                            ) : (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanticTextComparison;