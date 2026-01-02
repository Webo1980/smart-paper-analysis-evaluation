// File: src/components/dashboard/views/PaperListWithDrillDown.jsx
// v3: Fixed - Use evaluation.overall instead of evaluationMetrics.overall

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  ChevronDown, ChevronUp, FileText, Users, 
  ExternalLink, Info, CheckCircle, XCircle
} from 'lucide-react';

/**
 * Helper function to extract component score from evaluation
 * v3: Data is at evaluationMetrics.overall, evaluationMetrics.accuracy
 */
const getComponentScore = (evaluation, componentName) => {
  if (!evaluation?.evaluationMetrics) return null;
  
  // Data structure: evaluationMetrics.overall, evaluationMetrics.accuracy
  const overall = evaluation.evaluationMetrics.overall;
  const accuracy = evaluation.evaluationMetrics.accuracy;
  
  if (!overall && !accuracy) return null;

  switch (componentName) {
    case 'metadata':
      return overall?.metadata?.overall?.overallScore ?? 
             overall?.metadata?.overallScore ??
             accuracy?.metadata?.overallScore ?? 
             null;
      
    case 'research_field':
      return overall?.research_field?.overallScore ??
             overall?.research_field?.accuracyMetrics?.overallAccuracy?.value ??
             accuracy?.researchField?.overallScore ??
             accuracy?.research_field?.overallScore ??
             null;
      
    case 'research_problem':
      // Navigate the deeply nested structure
      const rp = overall?.research_problem?.overall?.research_problem;
      return rp?.accuracy?.scoreDetails?.finalScore ??
             rp?.accuracy?.overallAccuracy?.finalScore ??
             rp?.scores?.overallScore ??
             overall?.research_problem?.overallScore ??
             accuracy?.researchProblem?.overallScore ??
             null;
      
    case 'template':
      return overall?.template?.overallScore ??
             accuracy?.template?.overallScore ??
             null;
      
    case 'content':
      // Calculate average from property scores
      const content = overall?.content;
      if (!content || typeof content !== 'object') return null;
      
      const contentKeys = Object.keys(content).filter(k => 
        !['overallScore', 'timestamp', 'config', '_aggregate', 'userRatings'].includes(k)
      );
      
      if (contentKeys.length === 0) return null;
      
      const propScores = contentKeys
        .map(k => content[k]?.score ?? content[k]?.accuracyScore ?? null)
        .filter(s => s !== null && s !== undefined);
      
      if (propScores.length === 0) return null;
      
      return propScores.reduce((a, b) => a + b, 0) / propScores.length;
      
    default:
      return null;
  }
};

/**
 * PaperListWithDrillDown Component - v3.1
 * 
 * v3.1 FIXES:
 * - Corrected data path: evaluationMetrics.overall (NOT evaluation.overall)
 * 
 * v2 FIXES (kept):
 * - showDetailsButton prop to control Details button visibility
 * - Better null handling for scores
 * - Improved score extraction paths
 * - Hide papers with null scores instead of showing 0%
 * 
 * Props:
 * - papers: Array of integrated paper objects
 * - componentName: The component being analyzed
 * - onPaperClick: Optional callback when Details is clicked
 * - showDetailsButton: Whether to show the Details button (default: false)
 */
const PaperListWithDrillDown = ({ 
  papers, 
  componentName, 
  onPaperClick,
  showDetailsButton = false
}) => {
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');

  // Process and sort papers
  const processedPapers = useMemo(() => {
    if (!papers || papers.length === 0) return [];

    return papers.map(paper => {
      // Get evaluation(s) - handle both single evaluation and array of evaluations
      const evaluations = paper.userEvaluations || paper.evaluations || [paper.evaluation].filter(Boolean);
      
      if (evaluations.length === 0) return null;

      // Get all scores and filter out nulls
      const allScores = evaluations
        .map(e => getComponentScore(e, componentName))
        .filter(s => s !== null && s !== undefined);
      
      // Skip papers with no valid scores for this component
      if (allScores.length === 0) return null;
      
      const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      
      // Get component data for display
      const primaryEvaluation = evaluations[0];
      // Data is at evaluationMetrics.overall
      const overall = primaryEvaluation?.evaluationMetrics?.overall;
      let componentData = null;
      
      if (overall) {
        switch (componentName) {
          case 'metadata':
            componentData = overall.metadata;
            break;
          case 'research_field':
            componentData = overall.research_field;
            break;
          case 'research_problem':
            componentData = overall.research_problem?.overall?.research_problem || overall.research_problem;
            break;
          case 'template':
            componentData = overall.template;
            break;
          case 'content':
            componentData = overall.content;
            break;
          default:
            break;
        }
      }

      // Get paper metadata from various sources
      const title = paper.groundTruth?.title || 
                   paper.systemData?.metadata?.title ||
                   paper.systemOutput?.metadata?.title ||
                   'Untitled Paper';
      const doi = paper.doi || paper.groundTruth?.doi || paper.systemData?.metadata?.doi;
      const authors = paper.groundTruth?.authors || paper.systemData?.metadata?.authors || [];

      return {
        doi,
        title,
        authors,
        score: avgScore,
        evaluationCount: paper.evaluationCount || evaluations.length,
        evaluations,
        componentData,
        hasGroundTruth: !!paper.groundTruth,
        hasSystemData: !!(paper.systemData || paper.systemOutput),
        linked: paper.linked,
        summary: paper.summary,
        validScoreCount: allScores.length
      };
    }).filter(Boolean); // Remove null entries (papers without scores)
  }, [papers, componentName]);

  // Sort papers
  const sortedPapers = useMemo(() => {
    const sorted = [...processedPapers];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'evaluations':
          comparison = a.evaluationCount - b.evaluationCount;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [processedPapers, sortBy, sortOrder]);

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreBgColor = (score) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-blue-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!papers || papers.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No paper data available for analysis.
        </AlertDescription>
      </Alert>
    );
  }

  // v2: Show message if no papers have valid scores
  if (sortedPapers.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
        <Info className="h-4 w-4 inline mr-2" />
        No papers have evaluation data for the {componentName.replace(/_/g, ' ')} component.
        <div className="mt-2 text-xs">
          {papers.length} paper(s) were checked but none had valid scores for this component.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {sortedPapers.length} paper{sortedPapers.length !== 1 ? 's' : ''} with data
          {sortedPapers.length < papers.length && (
            <span className="text-gray-400 ml-1">
              (of {papers.length} total)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="score">Score</option>
            <option value="title">Title</option>
            <option value="evaluations">Evaluations</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Paper List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedPapers.map((paper, index) => {
          const isExpanded = expandedPaper === paper.doi;

          return (
            <Card 
              key={paper.doi || index} 
              className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Paper Header */}
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedPaper(isExpanded ? null : paper.doi)}
              >
                <div className="flex items-start gap-3">
                  {/* Score Badge */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center ${getScoreColor(paper.score)}`}>
                    <span className="text-lg font-bold">
                      {(paper.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Paper Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                      {paper.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="font-mono truncate max-w-48">{paper.doi}</span>
                      <span>•</span>
                      <Users className="h-3 w-3" />
                      <span>{paper.evaluationCount} eval{paper.evaluationCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {paper.hasGroundTruth && (
                        <Badge variant="outline" className="text-xs bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          GT
                        </Badge>
                      )}
                      {paper.hasSystemData && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          System
                        </Badge>
                      )}
                      {paper.linked?.evaluationToGroundTruth && (
                        <Badge variant="outline" className="text-xs bg-purple-50">
                          Linked
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t p-4 bg-gray-50 space-y-4">
                  {/* Score Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{componentName.replace(/_/g, ' ')} Score</span>
                      <span>{(paper.score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBgColor(paper.score)} transition-all`}
                        style={{ width: `${paper.score * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Authors */}
                  {paper.authors && paper.authors.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Authors</div>
                      <div className="text-sm text-gray-700">
                        {Array.isArray(paper.authors) 
                          ? paper.authors.map(a => typeof a === 'string' ? a : a.name || a.label).join(', ')
                          : paper.authors}
                      </div>
                    </div>
                  )}

                  {/* Summary Data */}
                  {paper.summary && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {paper.summary.gtField && (
                        <div>
                          <span className="text-gray-500">GT Field:</span>
                          <span className="ml-1 font-medium">{paper.summary.gtField}</span>
                        </div>
                      )}
                      {paper.summary.systemField && (
                        <div>
                          <span className="text-gray-500">System Field:</span>
                          <span className="ml-1 font-medium">{paper.summary.systemField}</span>
                        </div>
                      )}
                      {paper.summary.systemProblemSource && (
                        <div>
                          <span className="text-gray-500">Problem Source:</span>
                          <Badge variant="outline" className={`ml-1 text-xs ${
                            paper.summary.systemProblemSource === 'LLM' 
                              ? 'bg-orange-50 text-orange-700' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {paper.summary.systemProblemSource}
                          </Badge>
                        </div>
                      )}
                      {paper.summary.systemTemplateSource && (
                        <div>
                          <span className="text-gray-500">Template Source:</span>
                          <Badge variant="outline" className={`ml-1 text-xs ${
                            paper.summary.systemTemplateSource === 'LLM' 
                              ? 'bg-orange-50 text-orange-700' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {paper.summary.systemTemplateSource}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evaluations List */}
                  {paper.evaluations && paper.evaluations.length > 1 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Evaluations ({paper.evaluations.length})
                      </div>
                      <div className="space-y-1">
                        {paper.evaluations.map((evaluation, idx) => {
                          const evalScore = getComponentScore(evaluation, componentName);
                          
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
                              <span className="text-gray-600">
                                {evaluation?.userInfo?.role || 'Evaluator'} 
                                {evaluation?.userInfo?.expertiseWeight && (
                                  <span className="text-gray-400 ml-1">
                                    (weight: {evaluation.userInfo.expertiseWeight.toFixed(2)})
                                  </span>
                                )}
                              </span>
                              {evalScore !== null ? (
                                <Badge className={getScoreColor(evalScore)}>
                                  {(evalScore * 100).toFixed(0)}%
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    {paper.doi && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://doi.org/${paper.doi}`, '_blank');
                        }}
                        className="text-xs px-3 py-1.5 border rounded hover:bg-white flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Paper
                      </button>
                    )}
                    {/* v2: Only show Details button if explicitly enabled and callback provided */}
                    {showDetailsButton && onPaperClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPaperClick(paper.doi);
                        }}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Details
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PaperListWithDrillDown;