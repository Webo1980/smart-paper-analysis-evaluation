// File: src/components/dashboard/views/GroundTruthTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Database, CheckCircle, Clock, AlertCircle, TrendingUp,
  BarChart3, PieChart, FileText, Users, Target, Info,
  GitCompare, Layers, Zap, ChevronDown, ChevronUp,
  ExternalLink, Filter, Download, RefreshCw, Search,
  Award, Calendar, Hash
} from 'lucide-react';
import integratedDataService from '../../../services/IntegratedDataService';

// Components to display (excluding 'content')
const VISIBLE_COMPONENTS = ['metadata', 'research_field', 'research_problem', 'template'];

// Component display names for better readability
const COMPONENT_DISPLAY_NAMES = {
  metadata: 'Metadata',
  research_field: 'Research Field',
  research_problem: 'Research Problem',
  template: 'Template',
  content: 'Content'
};

// Map component keys to evaluation metric keys (snake_case to camelCase)
const COMPONENT_TO_METRIC_KEY = {
  metadata: 'metadata',
  research_field: 'researchField',
  research_problem: 'researchProblem',
  template: 'template',
  content: 'content'
};

const GroundTruthTab = () => {
  const [loading, setLoading] = useState(true);
  const [integratedData, setIntegratedData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    llmVsOrkg: true,
    distributions: true,
    mostEvaluatedPapers: true
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await integratedDataService.loadAllData();
      setIntegratedData(data);
    } catch (error) {
      console.error('Error loading integrated data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const statistics = useMemo(() => {
    if (!integratedData || !integratedData.papers) {
      return null;
    }

    const papers = integratedData.papers;
    const totalPapers = papers.length;
    
    // Coverage statistics
    const evaluatedPapers = papers.filter(p => 
      p.userEvaluations && p.userEvaluations.length > 0
    ).length;
    const coverage = totalPapers > 0 ? (evaluatedPapers / totalPapers) * 100 : 0;

    // Field distribution
    const fieldDistribution = {};
    papers.forEach(paper => {
      const field = paper.groundTruth?.research_field_name || 'Unknown';
      fieldDistribution[field] = (fieldDistribution[field] || 0) + 1;
    });

    // Template distribution
    const templateDistribution = {};
    papers.forEach(paper => {
      const template = paper.groundTruth?.template_name || 'Unknown';
      templateDistribution[template] = (templateDistribution[template] || 0) + 1;
    });

    // Year distribution
    const yearDistribution = {};
    papers.forEach(paper => {
      const year = paper.groundTruth?.publication_year || 'Unknown';
      yearDistribution[year] = (yearDistribution[year] || 0) + 1;
    });

    // Source statistics (LLM vs ORKG usage)
    const sourceStats = calculateSourceStatistics(papers);

    // Component coverage statistics
    const componentCoverage = calculateComponentCoverage(papers);

    // Evaluation statistics (count-based, not evaluator-based since tokens are unique per session)
    const evaluationStats = calculateEvaluationStatistics(papers);

    // Most evaluated papers
    const mostEvaluatedPapers = calculateMostEvaluatedPapers(papers);

    // Evaluation quality metrics
    const qualityMetrics = calculateQualityMetrics(papers);

    // Multi-evaluation statistics
    const multiEvalStats = calculateMultiEvaluationStats(papers);

    return {
      totalPapers,
      evaluatedPapers,
      pendingPapers: totalPapers - evaluatedPapers,
      coverage,
      fieldDistribution,
      templateDistribution,
      yearDistribution,
      sourceStats,
      componentCoverage,
      evaluationStats,
      mostEvaluatedPapers,
      qualityMetrics,
      multiEvalStats
    };
  }, [integratedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ground truth data...</p>
        </div>
      </div>
    );
  }

  if (!integratedData || !statistics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No ground truth data available. Please ensure the ground truth repository is accessible.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ground Truth Analysis</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive reference data statistics, coverage analysis, and evaluation metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* About this Analysis - Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium text-sm">About this Analysis</p>
          <p className="text-sm mt-1">
            This tab provides an overview of the ground truth data including coverage statistics, 
            evaluation metrics, and data distributions across research fields, templates, and years.
            For detailed accuracy metrics and system performance analysis, please refer to the 
            System Accuracy Analysis section.
          </p>
        </AlertDescription>
      </Alert>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Database}
          label="Total Papers"
          value={statistics.totalPapers}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Evaluated"
          value={statistics.evaluatedPapers}
          subValue={`${statistics.coverage.toFixed(1)}% coverage`}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={statistics.pendingPapers}
          color="orange"
        />
        <StatCard
          icon={FileText}
          label="Research Fields"
          value={Object.keys(statistics.fieldDistribution).length}
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Total Evaluations"
          value={statistics.evaluationStats.totalEvaluations}
          subValue={`${statistics.evaluationStats.avgEvaluationsPerPaper.toFixed(2)} avg/paper`}
          color="blue"
        />
        <StatCard
          icon={GitCompare}
          label="Multi-Evaluated"
          value={statistics.multiEvalStats.papersWithMultiple}
          subValue={`${statistics.multiEvalStats.percentageMultiple.toFixed(1)}% of evaluated`}
          color="purple"
        />
      </div>

      {/* Coverage Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Evaluation Coverage
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-blue-600">
                {statistics.evaluatedPapers} / {statistics.totalPapers}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${statistics.coverage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">0%</span>
              <span className="text-xs font-medium text-blue-600">{statistics.coverage.toFixed(1)}%</span>
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Evaluated</p>
                <p className="text-lg font-bold text-gray-900">{statistics.evaluatedPapers}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-bold text-gray-900">{statistics.pendingPapers}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Evals/Paper</p>
                <p className="text-lg font-bold text-gray-900">
                  {statistics.evaluationStats.avgEvaluationsPerPaper.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Evaluations</p>
                <p className="text-lg font-bold text-gray-900">
                  {statistics.evaluationStats.totalEvaluations}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Component Coverage Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-green-600" />
          Component Coverage
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Coverage of ground truth data across different evaluation components
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {VISIBLE_COMPONENTS.map(component => {
            const coverage = statistics.componentCoverage[component];
            if (!coverage) return null;
            
            return (
              <Card key={component} className="p-4 bg-gray-50 border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {COMPONENT_DISPLAY_NAMES[component]}
                  </h4>
                  <Badge variant={coverage.percentage > 50 ? 'success' : coverage.percentage > 25 ? 'warning' : 'secondary'}>
                    {coverage.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {coverage.evaluated}
                </p>
                <p className="text-xs text-gray-500">
                  of {coverage.total} papers with this component
                </p>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      coverage.percentage > 50 ? 'bg-green-500' : 
                      coverage.percentage > 25 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(coverage.percentage, 100)}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Most Evaluated Papers */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('mostEvaluatedPapers')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Multi-Evaluated Papers
          </h3>
          {expandedSections.mostEvaluatedPapers ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.mostEvaluatedPapers && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Papers that have been evaluated by multiple evaluators (2+ evaluations)
            </p>
            
            {statistics.mostEvaluatedPapers.length > 0 ? (
              <div className="space-y-3">
                {statistics.mostEvaluatedPapers.slice(0, 10).map((paper, index) => (
                  <div 
                    key={paper.paperId || paper.doi || index} 
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2" title={paper.title}>
                        {paper.title || 'Untitled Paper'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            DOI: {paper.doi}
                          </a>
                        )}
                        {paper.paperId && (
                          <a
                            href={`https://orkg.org/paper/${paper.paperId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            ORKG
                          </a>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {paper.evaluationCount} evaluation{paper.evaluationCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No papers with multiple evaluations yet</p>
            )}
          </div>
        )}
      </Card>

      {/* Distribution Analysis */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('distributions')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Data Distributions
          </h3>
          {expandedSections.distributions ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.distributions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Research Fields */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Research Fields
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(statistics.fieldDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([field, count]) => {
                    const percentage = (count / statistics.totalPapers) * 100;
                    return (
                      <div key={field} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate" title={field}>
                            {field}
                          </span>
                          <span className="text-gray-600 font-medium ml-2">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              {Object.keys(statistics.fieldDistribution).length > 10 && (
                <p className="text-xs text-gray-500 mt-2">
                  + {Object.keys(statistics.fieldDistribution).length - 10} more fields
                </p>
              )}
            </div>

            {/* Templates */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Templates
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(statistics.templateDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([template, count]) => {
                    const percentage = (count / statistics.totalPapers) * 100;
                    return (
                      <div key={template} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate" title={template}>
                            {template}
                          </span>
                          <span className="text-gray-600 font-medium ml-2">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              {Object.keys(statistics.templateDistribution).length > 10 && (
                <p className="text-xs text-gray-500 mt-2">
                  + {Object.keys(statistics.templateDistribution).length - 10} more templates
                </p>
              )}
            </div>

            {/* Publication Years */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Publication Years
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(statistics.yearDistribution)
                  .sort((a, b) => b[0] - a[0])
                  .slice(0, 10)
                  .map(([year, count]) => {
                    const percentage = (count / statistics.totalPapers) * 100;
                    return (
                      <div key={year} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">
                            {year}
                          </span>
                          <span className="text-gray-600 font-medium">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Quality Metrics Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-600" />
          Evaluation Quality Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">Papers with 2+ Evaluations</h4>
            <p className="text-3xl font-bold text-green-900">{statistics.multiEvalStats.papersWithMultiple}</p>
            <p className="text-xs text-green-700 mt-1">
              {statistics.multiEvalStats.percentageMultiple.toFixed(1)}% of evaluated papers
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Papers with 3+ Evaluations</h4>
            <p className="text-3xl font-bold text-blue-900">{statistics.multiEvalStats.papersWithThreeOrMore}</p>
            <p className="text-xs text-blue-700 mt-1">
              Ideal for inter-rater reliability
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Max Evaluations</h4>
            <p className="text-3xl font-bold text-purple-900">{statistics.multiEvalStats.maxEvaluations}</p>
            <p className="text-xs text-purple-700 mt-1">
              Highest number per paper
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, subValue, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
      </div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subValue && (
        <p className="text-xs text-gray-600 mt-1">{subValue}</p>
      )}
    </Card>
  );
};

// Helper Functions
function calculateSourceStatistics(papers) {
  const stats = {
    llm: { count: 0, percentage: 0 },
    orkg: { count: 0, percentage: 0 },
    byComponent: {
      metadata: { llm: { count: 0, percentage: 0 }, orkg: { count: 0, percentage: 0 } },
      research_field: { llm: { count: 0, percentage: 0 }, orkg: { count: 0, percentage: 0 } },
      research_problem: { llm: { count: 0, percentage: 0 }, orkg: { count: 0, percentage: 0 } },
      template: { llm: { count: 0, percentage: 0 }, orkg: { count: 0, percentage: 0 } },
      content: { llm: { count: 0, percentage: 0 }, orkg: { count: 0, percentage: 0 } }
    },
    byField: {}
  };

  let totalCount = 0;
  const componentCounts = {};
  const fieldCounts = {};

  papers.forEach(paper => {
    if (!paper.groundTruth) return;

    // Overall counts
    const source = paper.groundTruth.source || 'orkg';
    if (source === 'llm') {
      stats.llm.count++;
    } else {
      stats.orkg.count++;
    }
    totalCount++;

    // Component counts
    ['metadata', 'research_field', 'research_problem', 'template', 'content'].forEach(component => {
      if (!componentCounts[component]) {
        componentCounts[component] = { llm: 0, orkg: 0, total: 0 };
      }
      
      // Check if component has data - FIXED: use correct field names
      let hasComponentData = false;
      
      if (component === 'metadata') {
        hasComponentData = paper.groundTruth.title || paper.groundTruth.authors;
      } else if (component === 'research_field') {
        hasComponentData = paper.groundTruth.research_field_name || paper.groundTruth.research_field;
      } else if (component === 'research_problem') {
        // FIXED: Check both possible field names
        hasComponentData = paper.groundTruth.research_problem_name || paper.groundTruth.research_problem;
      } else if (component === 'template') {
        hasComponentData = paper.groundTruth.template_name || paper.groundTruth.template;
      } else if (component === 'content') {
        hasComponentData = paper.groundTruth.content;
      }

      if (hasComponentData) {
        if (source === 'llm') {
          componentCounts[component].llm++;
        } else {
          componentCounts[component].orkg++;
        }
        componentCounts[component].total++;
      }
    });

    // Field counts (for metadata)
    if (paper.groundTruth.title || paper.groundTruth.authors || paper.groundTruth.doi) {
      ['title', 'authors', 'doi', 'venue', 'publication_year'].forEach(field => {
        if (!fieldCounts[field]) {
          fieldCounts[field] = { llm: 0, orkg: 0, total: 0 };
        }
        
        if (paper.groundTruth[field]) {
          if (source === 'llm') {
            fieldCounts[field].llm++;
          } else {
            fieldCounts[field].orkg++;
          }
          fieldCounts[field].total++;
        }
      });
    }
  });

  // Calculate percentages
  stats.llm.percentage = totalCount > 0 ? (stats.llm.count / totalCount) * 100 : 0;
  stats.orkg.percentage = totalCount > 0 ? (stats.orkg.count / totalCount) * 100 : 0;

  // Component percentages
  Object.keys(stats.byComponent).forEach(component => {
    const counts = componentCounts[component];
    if (counts && counts.total > 0) {
      stats.byComponent[component].llm.count = counts.llm;
      stats.byComponent[component].orkg.count = counts.orkg;
      stats.byComponent[component].llm.percentage = (counts.llm / counts.total) * 100;
      stats.byComponent[component].orkg.percentage = (counts.orkg / counts.total) * 100;
    }
  });

  // Field percentages
  Object.keys(fieldCounts).forEach(field => {
    const counts = fieldCounts[field];
    if (counts.total > 0) {
      stats.byField[field] = {
        llm: {
          count: counts.llm,
          percentage: (counts.llm / counts.total) * 100
        },
        orkg: {
          count: counts.orkg,
          percentage: (counts.orkg / counts.total) * 100
        }
      };
    }
  });

  return stats;
}

function calculateComponentCoverage(papers) {
  const coverage = {
    metadata: { total: 0, evaluated: 0, percentage: 0 },
    research_field: { total: 0, evaluated: 0, percentage: 0 },
    research_problem: { total: 0, evaluated: 0, percentage: 0 },
    template: { total: 0, evaluated: 0, percentage: 0 },
    content: { total: 0, evaluated: 0, percentage: 0 }
  };

  papers.forEach(paper => {
    if (!paper.groundTruth) return;

    // Check each component - FIXED: use correct field names
    const components = {
      metadata: paper.groundTruth.title || paper.groundTruth.authors,
      research_field: paper.groundTruth.research_field_name || paper.groundTruth.research_field,
      research_problem: paper.groundTruth.research_problem_name || paper.groundTruth.research_problem,
      template: paper.groundTruth.template_name || paper.groundTruth.template,
      content: paper.groundTruth.content
    };

    Object.keys(components).forEach(component => {
      if (components[component]) {
        coverage[component].total++;
        
        // Check if evaluated - FIXED: use proper key mapping
        if (paper.userEvaluations && paper.userEvaluations.length > 0) {
          const evaluation = paper.userEvaluations[0];
          
          // Use the mapping to get the correct metric key
          const metricKey = COMPONENT_TO_METRIC_KEY[component];
          const hasEvaluation = evaluation.evaluationMetrics?.accuracy?.[metricKey];
          
          if (hasEvaluation) {
            coverage[component].evaluated++;
          }
        }
      }
    });
  });

  // Calculate percentages
  Object.keys(coverage).forEach(component => {
    if (coverage[component].total > 0) {
      coverage[component].percentage = (coverage[component].evaluated / coverage[component].total) * 100;
    }
  });

  return coverage;
}

function calculateEvaluationStatistics(papers) {
  let totalEvaluations = 0;
  let evaluatedPapersCount = 0;

  papers.forEach(paper => {
    if (paper.userEvaluations && paper.userEvaluations.length > 0) {
      evaluatedPapersCount++;
      totalEvaluations += paper.userEvaluations.length;
    }
  });

  return {
    totalEvaluations,
    evaluatedPapersCount,
    avgEvaluationsPerPaper: evaluatedPapersCount > 0 ? totalEvaluations / evaluatedPapersCount : 0
  };
}

function calculateMostEvaluatedPapers(papers) {
  const papersWithEvaluations = papers
    .filter(paper => paper.userEvaluations && paper.userEvaluations.length > 1) // Only papers with MORE than 1 evaluation
    .map(paper => {
      // Extract paper info from groundTruth or first evaluation's metadata
      const groundTruth = paper.groundTruth || {};
      const firstEval = paper.userEvaluations[0] || {};
      const metadata = firstEval.metadata || {};
      
      return {
        paperId: paper.id || paper.paperId || groundTruth.paper_id,
        title: groundTruth.title || metadata.title || 'Untitled',
        doi: groundTruth.doi || metadata.doi,
        evaluationCount: paper.userEvaluations.length
      };
    })
    .sort((a, b) => b.evaluationCount - a.evaluationCount);

  return papersWithEvaluations;
}

function calculateQualityMetrics(papers) {
  let totalScores = 0;
  let scoreCount = 0;
  let highQualityCount = 0;
  let lowQualityCount = 0;

  papers.forEach(paper => {
    if (paper.userEvaluations && paper.userEvaluations.length > 0) {
      paper.userEvaluations.forEach(evaluation => {
        if (evaluation.evaluationMetrics?.accuracy) {
          Object.values(evaluation.evaluationMetrics.accuracy).forEach(score => {
            if (typeof score === 'number' && !isNaN(score)) {
              totalScores += score;
              scoreCount++;
              if (score >= 4) highQualityCount++;
              if (score <= 2) lowQualityCount++;
            }
          });
        }
      });
    }
  });

  return {
    averageScore: scoreCount > 0 ? totalScores / scoreCount : 0,
    highQualityPercentage: scoreCount > 0 ? (highQualityCount / scoreCount) * 100 : 0,
    lowQualityPercentage: scoreCount > 0 ? (lowQualityCount / scoreCount) * 100 : 0,
    totalRatings: scoreCount
  };
}

function calculateMultiEvaluationStats(papers) {
  let papersWithMultiple = 0;
  let papersWithThreeOrMore = 0;
  let maxEvaluations = 0;
  let evaluatedPapersCount = 0;

  papers.forEach(paper => {
    if (paper.userEvaluations && paper.userEvaluations.length > 0) {
      evaluatedPapersCount++;
      const evalCount = paper.userEvaluations.length;
      
      if (evalCount >= 2) papersWithMultiple++;
      if (evalCount >= 3) papersWithThreeOrMore++;
      if (evalCount > maxEvaluations) maxEvaluations = evalCount;
    }
  });

  return {
    papersWithMultiple,
    papersWithThreeOrMore,
    maxEvaluations,
    percentageMultiple: evaluatedPapersCount > 0 ? (papersWithMultiple / evaluatedPapersCount) * 100 : 0
  };
}

export default GroundTruthTab;