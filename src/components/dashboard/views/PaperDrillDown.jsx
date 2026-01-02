// File: src/components/dashboard/views/PaperDrillDown.jsx

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Search, FileText, Users, BarChart3, ChevronRight,
  TrendingUp, Target, Clock, Info
} from 'lucide-react';

// Phase 2: Source Indicators
import { DualSourceIndicator } from '../shared/SourceIndicator';

const PaperDrillDown = ({ aggregatedData, integratedData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  if (!aggregatedData || !aggregatedData.papers) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No paper data available for analysis.
        </AlertDescription>
      </Alert>
    );
  }

  // Create paper map from integrated data for source lookup
  // KEY: Index by userEvaluations[].token since that's the evaluation ID used in aggregatedData
  const integratedPaperMap = useMemo(() => {
    if (!integratedData) return {};
    
    const map = {};
    
    // Method 1: Index by userEvaluations tokens (evaluation IDs)
    if (integratedData.papers) {
      integratedData.papers.forEach(paper => {
        // Map by DOI
        if (paper.doi) map[paper.doi] = paper;
        
        // Map by each userEvaluation token (this is the key link!)
        if (paper.userEvaluations) {
          paper.userEvaluations.forEach(evaluation => {
            if (evaluation.token) {
              map[evaluation.token] = paper;
            }
          });
        }
      });
    }
    
    // Method 2: Also check integratedData.matches (keyed by DOI)
    if (integratedData.matches) {
      Object.entries(integratedData.matches).forEach(([doi, matchData]) => {
        map[doi] = matchData;
        // Also index by userEvaluations tokens in matches
        if (matchData.userEvaluations) {
          matchData.userEvaluations.forEach(evaluation => {
            if (evaluation.token) {
              map[evaluation.token] = matchData;
            }
          });
        }
      });
    }
    
    return map;
  }, [integratedData]);

  // Helper function to find matching integrated paper
  // The map now includes tokens (evaluation IDs) as keys, so direct lookup should work
  const findIntegratedPaper = (paperId, paperData) => {
    // Direct lookup by paperId (which is actually an evaluation token)
    if (integratedPaperMap[paperId]) return integratedPaperMap[paperId];
    
    // Fallback: try by paperData.paperId if different
    if (paperData?.paperId && integratedPaperMap[paperData.paperId]) {
      return integratedPaperMap[paperData.paperId];
    }
    
    // Fallback: try by DOI if available
    if (paperData?.doi && integratedPaperMap[paperData.doi]) {
      return integratedPaperMap[paperData.doi];
    }
    
    return null;
  };

  const papers = Object.entries(aggregatedData.papers).map(([paperId, paperData]) => ({
    id: paperId,
    ...paperData,
    _integratedData: findIntegratedPaper(paperId, paperData)
  }));

  // Debug logging (can be removed in production)
  console.log('PaperDrillDown: Matched', papers.filter(p => p._integratedData).length, 'of', papers.length, 'papers with integrated data');

  const filteredPapers = useMemo(() => {
    if (!searchTerm) return papers;
    const search = searchTerm.toLowerCase();
    return papers.filter(paper => {
      // Search by ID
      if (paper.id.toLowerCase().includes(search)) return true;
      
      // Search by title - PRIORITY: groundTruth.title is the correct path
      const title = paper._integratedData?.groundTruth?.title
        || paper._integratedData?.title 
        || paper._integratedData?.metadata?.title
        || paper.title 
        || paper.metadata?.title;
      if (title && title.toLowerCase().includes(search)) return true;
      
      // Search by DOI - PRIORITY: groundTruth path
      const doi = paper._integratedData?.groundTruth?.doi
        || paper._integratedData?.doi 
        || paper._integratedData?.metadata?.doi
        || paper.doi 
        || paper.metadata?.doi;
      if (doi && doi.toLowerCase().includes(search)) return true;
      
      // Search by authors - PRIORITY: groundTruth path
      const authors = paper._integratedData?.groundTruth?.authors
        || paper._integratedData?.authors 
        || paper._integratedData?.metadata?.authors
        || paper.authors 
        || paper.metadata?.authors
        || [];
      if (Array.isArray(authors)) {
        const authorStr = authors.map(a => typeof a === 'string' ? a : a.name || a.label || '').join(' ').toLowerCase();
        if (authorStr.includes(search)) return true;
      }
      
      return false;
    });
  }, [papers, searchTerm]);

  const selectedPaper = selectedPaperId 
    ? papers.find(p => p.id === selectedPaperId)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paper Drill-Down</h2>
        <p className="text-gray-600 mt-1">
          Detailed analysis of individual papers and their evaluation metrics
        </p>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, DOI, or author..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredPapers.length} of {papers.length} papers
          {integratedData?.papers && (
            <span className="ml-2 text-blue-600">
              • {papers.filter(p => p._integratedData).length} matched with source data
            </span>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">Papers</h3>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredPapers.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>No papers found</p>
                </div>
              ) : (
                filteredPapers.map((paper) => (
                  <PaperListItem
                    key={paper.id}
                    paper={paper}
                    onClick={() => setSelectedPaperId(paper.id)}
                    isSelected={selectedPaperId === paper.id}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedPaper ? (
            <PaperDetails paper={selectedPaper} />
          ) : (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Paper Selected</h3>
              <p className="text-gray-600">
                Select a paper from the list to view detailed analysis
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const PaperListItem = ({ paper, onClick, isSelected }) => {
  const evaluationCount = paper.evaluationCount || 0;
  const evaluatorCount = (paper.evaluators || []).length;
  
  // Calculate overall score from component scores
  const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
  const componentScores = components.map(comp => paper[comp]?.scores?.mean || 0);
  const validScores = componentScores.filter(s => s > 0);
  const overallScore = validScores.length > 0 
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
    : 0;

  // Get title from various possible sources - check many common patterns
  // PRIORITY: integratedData.groundTruth.title is the correct path for our data structure
  const title = paper._integratedData?.groundTruth?.title
    || paper._integratedData?.title 
    || paper._integratedData?.metadata?.title
    || paper.title 
    || paper.metadata?.title
    // Check if stored in evaluation fields
    || paper.paperTitle
    || paper.paper?.title
    // Check ground truth or system output fields
    || paper.groundTruth?.title
    || paper.systemOutput?.title
    || paper.groundTruth?.metadata?.title
    || paper.systemOutput?.metadata?.title
    // Some structures store extracted metadata
    || paper.extractedMetadata?.title
    || paper.paperMetadata?.title
    || null;
  
  // Get DOI or other identifier for subtitle - PRIORITY: groundTruth path
  const doi = paper._integratedData?.groundTruth?.doi
    || paper._integratedData?.doi 
    || paper._integratedData?.metadata?.doi
    || paper.doi 
    || paper.metadata?.doi
    || paper.paperDoi
    || paper.paper?.doi
    || paper.groundTruth?.doi
    || paper.systemOutput?.doi
    || paper.paperId
    || paper.id;

  const getQualityColor = (score) => {
    if (score >= 0.8) return 'bg-green-100 text-green-700';
    if (score >= 0.6) return 'bg-blue-100 text-blue-700';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {title ? (
            <>
              <div className="font-medium text-sm text-gray-900 line-clamp-2">
                {title}
              </div>
              <div className="text-xs text-gray-500 truncate font-mono mt-1">
                {doi}
              </div>
            </>
          ) : (
            <div className="font-medium text-sm text-gray-900 truncate font-mono">
              {paper.id}
            </div>
          )}
          
          {paper._integratedData ? (
            <div className="mt-2">
              <DualSourceIndicator 
                paper={paper._integratedData} 
                size="sm"
                showLabels={true}
              />
            </div>
          ) : (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs text-gray-400">
                No source data
              </Badge>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <Users className="h-3 w-3" />
            <span>{evaluationCount} eval{evaluationCount !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{evaluatorCount} evaluator{evaluatorCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="mt-2">
            <Badge className={`${getQualityColor(overallScore)} text-xs`}>
              {(overallScore * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
        <ChevronRight className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </button>
  );
};

const PaperDetails = ({ paper }) => {
  const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];

  // Calculate overall score from component scores
  const componentScores = components.map(comp => paper[comp]?.scores?.mean || 0);
  const validScores = componentScores.filter(s => s > 0);
  const overallMean = validScores.length > 0 
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
    : 0;
  
  // Calculate std deviation across components
  const overallStd = validScores.length > 1
    ? Math.sqrt(validScores.reduce((sum, s) => sum + Math.pow(s - overallMean, 2), 0) / validScores.length)
    : 0;

  // Extract paper metadata from various sources - check many common patterns
  // PRIORITY: integratedData.groundTruth.title is the correct path for our data structure
  const title = paper._integratedData?.groundTruth?.title
    || paper._integratedData?.title 
    || paper._integratedData?.metadata?.title
    || paper.title 
    || paper.metadata?.title
    || paper.paperTitle
    || paper.paper?.title
    || paper.groundTruth?.title
    || paper.systemOutput?.title
    || paper.groundTruth?.metadata?.title
    || paper.systemOutput?.metadata?.title
    || paper.extractedMetadata?.title
    || paper.paperMetadata?.title
    || 'Untitled Paper';
  
  const authors = paper._integratedData?.groundTruth?.authors
    || paper._integratedData?.authors 
    || paper._integratedData?.metadata?.authors
    || paper.authors 
    || paper.metadata?.authors
    || paper.paper?.authors
    || paper.groundTruth?.authors
    || paper.systemOutput?.authors
    || paper.extractedMetadata?.authors
    || [];
  
  const doi = paper._integratedData?.groundTruth?.doi
    || paper._integratedData?.doi 
    || paper._integratedData?.metadata?.doi
    || paper.doi 
    || paper.metadata?.doi
    || paper.paper?.doi
    || paper.groundTruth?.doi
    || paper.systemOutput?.doi
    || paper.id;

  const venue = paper._integratedData?.groundTruth?.venue
    || paper._integratedData?.venue 
    || paper._integratedData?.metadata?.venue
    || paper.venue 
    || paper.metadata?.venue
    || paper.paper?.venue
    || paper.groundTruth?.venue
    || paper.systemOutput?.venue;

  const year = paper._integratedData?.groundTruth?.publication_year
    || paper._integratedData?.publication_year 
    || paper._integratedData?.metadata?.publication_year
    || paper.publication_year 
    || paper.metadata?.publication_year
    || paper.paper?.publication_year
    || paper.groundTruth?.publication_year
    || paper.systemOutput?.publication_year;

  return (
    <div className="space-y-6">
      {/* Paper Header with Title and Metadata */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
        
        {authors.length > 0 && (
          <p className="text-sm text-gray-600 mb-2">
            {Array.isArray(authors) 
              ? authors.map(a => typeof a === 'string' ? a : a.name || a.label).join(', ')
              : authors}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {venue && <Badge variant="outline">{venue}</Badge>}
          {year && <Badge variant="outline">{year}</Badge>}
          <Badge variant="outline" className="font-mono">{doi}</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Evaluations</p>
              <p className="text-xl font-bold mt-1">{paper.evaluationCount || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Overall Score</p>
              <p className="text-xl font-bold mt-1">{overallMean.toFixed(3)}</p>
            </div>
            <Target className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Std Dev</p>
              <p className="text-xl font-bold mt-1">{overallStd.toFixed(3)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Evaluators</p>
              <p className="text-xl font-bold mt-1">{(paper.evaluators || []).length}</p>
            </div>
            <Users className="h-8 w-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {paper._integratedData && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Data Sources</span>
            <Badge variant="outline" className="text-xs">Phase 2</Badge>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Research Problem</p>
              <DualSourceIndicator 
                paper={paper._integratedData} 
                size="md"
                showLabels={false}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Template</p>
              <DualSourceIndicator 
                paper={paper._integratedData} 
                size="md"
                showLabels={false}
              />
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Component Scores</h3>
        <div className="space-y-4">
          {components.map(component => {
            const compData = paper[component];
            if (!compData?.scores) return null;

            const score = compData.scores.mean || 0;
            const std = compData.scores.std || 0;
            const count = compData.evaluationCount || 0;

            return (
              <div key={component}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center flex-1">
                    <span className="text-sm font-medium capitalize w-48">
                      {component.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            score >= 0.8 ? 'bg-green-500' :
                            score >= 0.6 ? 'bg-blue-500' :
                            score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-16 text-right">
                      {score.toFixed(3)}
                    </span>
                    <Badge variant="outline" className="text-xs w-20 justify-center">
                      σ {std.toFixed(3)}
                    </Badge>
                    <Badge variant="outline" className="text-xs w-16 justify-center">
                      n={count}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {components.map(component => {
        const compData = paper[component];
        if (!compData?.fields || Object.keys(compData.fields).length === 0) return null;

        return (
          <Card key={component} className="p-6">
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {component.replace(/_/g, ' ')} - Field Details
            </h3>
            <div className="space-y-3">
              {Object.entries(compData.fields).map(([fieldName, fieldData]) => {
                const score = fieldData.scores?.mean || fieldData.score?.mean || 0;
                const std = fieldData.scores?.std || fieldData.score?.std || 0;
                const count = fieldData.evaluationCount || 0;

                return (
                  <div key={fieldName} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center flex-1">
                      <span className="text-sm text-gray-700 w-40">{fieldName}</span>
                      <div className="flex-1 mx-4">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              score >= 0.8 ? 'bg-green-400' :
                              score >= 0.6 ? 'bg-blue-400' :
                              score >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-16 text-right">{score.toFixed(3)}</span>
                      <span className="text-xs text-gray-500 w-16 text-right">±{std.toFixed(3)}</span>
                      <Badge variant="outline" className="text-xs w-12 justify-center">
                        {count}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {paper.evaluators && paper.evaluators.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Evaluators ({paper.evaluators.length})</h3>
          <div className="space-y-2">
            {paper.evaluators.map((evaluator, idx) => {
              const evaluatorId = typeof evaluator === 'string' 
                ? evaluator 
                : (evaluator?.id || evaluator?.email || 'Unknown');
              
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-mono">{evaluatorId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {paper.difficulty && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Difficulty Assessment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Level</p>
              <Badge className={`mt-1 ${
                String(paper.difficulty.level) === 'easy' ? 'bg-green-100 text-green-700' :
                String(paper.difficulty.level) === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {String(paper.difficulty.level || 'unknown')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Score Variance</p>
              <p className="text-lg font-semibold mt-1">
                {typeof paper.difficulty.scoreVariance === 'number' 
                  ? paper.difficulty.scoreVariance.toFixed(3) 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {paper.temporal && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Evaluation Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <span>First Evaluation</span>
              </div>
              <p className="text-sm font-medium">
                {paper.temporal.firstEvaluation 
                  ? new Date(paper.temporal.firstEvaluation).toLocaleString() 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <span>Last Evaluation</span>
              </div>
              <p className="text-sm font-medium">
                {paper.temporal.lastEvaluation 
                  ? new Date(paper.temporal.lastEvaluation).toLocaleString() 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Time Span</span>
              </div>
              <p className="text-sm font-medium">
                {paper.temporal.timeSpan 
                  ? `${Math.round(paper.temporal.timeSpan / (1000 * 60 * 60 * 24))} days` 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mean</p>
            <p className="text-lg font-semibold">{overallMean.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Median</p>
            <p className="text-lg font-semibold">
              {validScores.length > 0 
                ? validScores.sort((a, b) => a - b)[Math.floor(validScores.length / 2)].toFixed(3)
                : '0.000'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Min</p>
            <p className="text-lg font-semibold">
              {validScores.length > 0 ? Math.min(...validScores).toFixed(3) : '0.000'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Max</p>
            <p className="text-lg font-semibold">
              {validScores.length > 0 ? Math.max(...validScores).toFixed(3) : '0.000'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaperDrillDown;