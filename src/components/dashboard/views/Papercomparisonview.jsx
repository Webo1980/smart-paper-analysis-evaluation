// src/components/dashboard/views/PaperComparisonView.jsx
import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Search, FileText, ChevronRight, Users, TrendingUp, 
  Target, Info, BarChart3, AlertTriangle
} from 'lucide-react';

/**
 * Paper Comparison View
 * Individual paper drill-down and detailed comparison
 * Now works with aggregatedData structure
 */
const PaperComparisonView = ({ aggregatedData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);

  if (!aggregatedData || !aggregatedData.papers) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No paper data available for comparison.
        </AlertDescription>
      </Alert>
    );
  }

  const papers = Object.entries(aggregatedData.papers).map(([paperId, paperData]) => ({
    id: paperId,
    ...paperData
  }));
  
  // Filter papers based on search
  const filteredPapers = papers.filter(paper => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const paperId = paper.id.toLowerCase();
    return paperId.includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paper Analysis</h2>
        <p className="text-gray-600 mt-1">
          Detailed breakdown of evaluation metrics by paper
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by DOI or paper ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Showing {filteredPapers.length} of {papers.length} papers
        </div>
      </Card>

      {/* Paper List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Papers</h3>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {filteredPapers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No papers found matching your search</p>
            </div>
          ) : (
            filteredPapers.map((paper) => (
              <PaperListItem
                key={paper.id}
                paper={paper}
                onClick={() => setSelectedPaper(paper)}
                isSelected={selectedPaper?.id === paper.id}
              />
            ))
          )}
        </div>
      </Card>

      {/* Selected Paper Details */}
      {selectedPaper && (
        <PaperDetails paper={selectedPaper} />
      )}

      {!selectedPaper && papers.length > 0 && (
        <Card className="p-12 text-center bg-gray-50">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a paper to view detailed analysis</p>
        </Card>
      )}
    </div>
  );
};

/**
 * Paper List Item
 */
const PaperListItem = ({ paper, onClick, isSelected }) => {
  const paperId = paper.id;
  const evaluationCount = paper.evaluationCount || 0;
  const evaluatorCount = (paper.evaluators || []).length;
  const overallScore = paper.overall?.score?.mean || 0;
  const scoreVariance = paper.overall?.score?.std || 0;

  // Determine quality badge
  const getQualityBadge = (score) => {
    if (score >= 0.8) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (score >= 0.6) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (score >= 0.4) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Needs Work', color: 'bg-red-100 text-red-700' };
  };

  const quality = getQualityBadge(overallScore);

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate font-mono text-sm">
            {paperId}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-xs text-gray-600 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {evaluationCount} eval{evaluationCount !== 1 ? 's' : ''} ({evaluatorCount} evaluator{evaluatorCount !== 1 ? 's' : ''})
            </div>
            <div className="text-xs text-gray-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Score: {overallScore.toFixed(3)}
            </div>
            {scoreVariance > 0.15 && (
              <div className="text-xs text-orange-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                High variance
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`${quality.color} text-xs`}>
              {quality.label}
            </Badge>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </div>
    </button>
  );
};

/**
 * Paper Details
 */
const PaperDetails = ({ paper }) => {
  const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Evaluations</p>
              <p className="text-2xl font-bold mt-1">{paper.evaluationCount || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Score</p>
              <p className="text-2xl font-bold mt-1">{(paper.overall?.score?.mean || 0).toFixed(3)}</p>
            </div>
            <Target className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Std Dev</p>
              <p className="text-2xl font-bold mt-1">{(paper.overall?.score?.std || 0).toFixed(3)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completeness</p>
              <p className="text-2xl font-bold mt-1">
                {((paper.overall?.completeness || 0) * 100).toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Paper ID */}
      <Card className="p-4">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">Paper ID</h4>
        <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">{paper.id}</p>
      </Card>

      {/* Component Scores */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Component Scores</h3>
        <div className="space-y-4">
          {components.map(component => {
            const compData = paper[component];
            if (!compData || compData.evaluationCount === 0) {
              return (
                <div key={component} className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium capitalize text-gray-400">
                    {component.replace(/_/g, ' ')}
                  </span>
                  <Badge className="bg-gray-100 text-gray-500">No Data</Badge>
                </div>
              );
            }

            const score = compData.score?.mean || 0;
            const std = compData.score?.std || 0;
            const count = compData.evaluationCount || 0;

            return (
              <div key={component} className="space-y-2">
                <div className="flex items-center justify-between">
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

      {/* Field-Level Details */}
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
                const score = fieldData.score?.mean || 0;
                const std = fieldData.score?.std || 0;
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

      {/* Evaluators */}
      {paper.evaluators && paper.evaluators.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Evaluators</h3>
          <div className="space-y-2">
            {paper.evaluators.map((evaluatorId, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-mono">{evaluatorId}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Difficulty Assessment */}
      {paper.difficulty && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Difficulty Assessment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Level</p>
              <Badge className={`mt-1 ${
                paper.difficulty.level === 'easy' ? 'bg-green-100 text-green-700' :
                paper.difficulty.level === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {paper.difficulty.level}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Score Variance</p>
              <p className="text-lg font-semibold mt-1">{paper.difficulty.scoreVariance?.toFixed(3) || 'N/A'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Temporal Data */}
      {paper.temporal && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Evaluation Timeline</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">First Evaluation</p>
              <p className="text-sm font-medium mt-1">
                {paper.temporal.firstEvaluation ? new Date(paper.temporal.firstEvaluation).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Evaluation</p>
              <p className="text-sm font-medium mt-1">
                {paper.temporal.lastEvaluation ? new Date(paper.temporal.lastEvaluation).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Span</p>
              <p className="text-sm font-medium mt-1">
                {paper.temporal.timeSpan ? `${Math.round(paper.temporal.timeSpan / (1000 * 60 * 60 * 24))} days` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaperComparisonView;