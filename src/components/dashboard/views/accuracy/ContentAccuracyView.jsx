// File: src/components/dashboard/views/accuracy/ContentAccuracyView.jsx
// Content Accuracy View - Displays aggregated content evaluation metrics

import React, { useMemo, useState } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  FileText, ChevronDown, ChevronUp, Info, TrendingUp,
  CheckCircle, AlertCircle, Star, Brain, Target, Database
} from 'lucide-react';

/**
 * Content Accuracy View Component
 * 
 * Data Paths:
 * - Property Metrics: evaluationMetrics.accuracy.content.[propertyName]
 * - Overall Content: overall.content
 * - User Ratings: overall.content.userRatings
 * 
 * Note: Content is ONLY LLM-generated (no ORKG source)
 */
const ContentAccuracyView = ({ componentData, papers, aggregatedData }) => {
  console.log("Props in ContentAccuracyView:", { componentData, papers, aggregatedData });
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 ContentAccuracyView: INITIALIZATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Props received:', {
    hasComponentData: !!componentData,
    componentData: componentData,
    hasPapers: !!papers,
    papersLength: papers?.length,
    hasAggregatedData: !!aggregatedData
  });
  
  const [expandedSections, setExpandedSections] = useState({
    propertyMetrics: true,
    overallStats: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate content metrics from papers
  const contentMetrics = useMemo(() => {
    console.log('───────────────────────────────────────────────────────');
    console.log('📊 ContentAccuracyView: CALCULATING METRICS');
    console.log('───────────────────────────────────────────────────────');

    if (papers && papers.length > 0) {
      console.log(`✓ Calculating metrics from ${papers.length} raw papers`);
      return calculateContentMetrics(papers);
    }

    console.error('✗ No papers available for metrics calculation');
    return null;
  }, [papers]);
  
  console.log('───────────────────────────────────────────────────────');
  console.log('📊 ContentAccuracyView: FINAL METRICS');
  console.log('contentMetrics:', contentMetrics);
  console.log('═══════════════════════════════════════════════════════');
  
  // Show error if no data is available
  if (!contentMetrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">No content accuracy data available</p>
            <p className="text-sm">
              This view requires raw papers with userEvaluations containing content evaluation data.
            </p>
            <div className="mt-3 p-3 bg-red-50 rounded text-xs">
              <p className="font-semibold mb-1">Debug Info:</p>
              <p>Papers: {papers?.length || 0}</p>
              <p>ComponentData: {componentData ? 'Present' : 'Missing'}</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* LLM Generation Notice */}
      <Alert className="bg-purple-50 border-purple-200">
        <Brain className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <p className="text-sm">
            <strong>Content Extraction:</strong> All content is extracted using LLM-based analysis. 
            Properties are identified from paper sections (methodology, contributions) and evaluated 
            for accuracy, completeness, and evidence quality.
          </p>
        </AlertDescription>
      </Alert>

      {/* Property Extraction Metrics */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('propertyMetrics')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Property Extraction Metrics
          </h3>
          {expandedSections.propertyMetrics ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.propertyMetrics && (
          <div className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={FileText}
                title="Total Properties"
                value={contentMetrics.propertyStats.totalProperties}
                color="blue"
                description="Extracted across all papers"
              />
              <MetricCard
                icon={CheckCircle}
                title="Avg Properties/Paper"
                value={contentMetrics.propertyStats.avgPropertiesPerPaper.toFixed(1)}
                color="green"
                description="Average per evaluation"
              />
              <MetricCard
                icon={Target}
                title="Avg Accuracy"
                value={formatPercentage(contentMetrics.propertyStats.avgAccuracy)}
                color="purple"
                description="Mean extraction accuracy"
              />
            </div>

            {/* Data Coverage Statistics */}
            {(contentMetrics.propertyStats.totalHasData > 0 || contentMetrics.propertyStats.totalNoData > 0) && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Data Coverage Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {contentMetrics.propertyStats.totalHasData}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Properties with Data</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-700">
                      {contentMetrics.propertyStats.totalNoData}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Properties without Data</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {formatPercentage(contentMetrics.propertyStats.dataAvailabilityRate)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Data Availability Rate</p>
                  </div>
                </div>
                
                {/* Visual Bar */}
                <div className="mt-3">
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${contentMetrics.propertyStats.dataAvailabilityRate * 100}%` }}
                      title={`${contentMetrics.propertyStats.totalHasData} with data`}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${(1 - contentMetrics.propertyStats.dataAvailabilityRate) * 100}%` }}
                      title={`${contentMetrics.propertyStats.totalNoData} without data`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>With Data</span>
                    <span>Without Data</span>
                  </div>
                </div>
              </div>
            )}

            {/* Property Type Distribution */}
            {contentMetrics.propertyTypes && Object.keys(contentMetrics.propertyTypes).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Property Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(contentMetrics.propertyTypes)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 15)
                    .map(([propName, stats]) => (
                      <PropertyTypeRow
                        key={propName}
                        name={propName}
                        stats={stats}
                        total={contentMetrics.propertyStats.totalProperties}
                      />
                    ))}
                </div>
                {Object.keys(contentMetrics.propertyTypes).length > 15 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing top 15 of {Object.keys(contentMetrics.propertyTypes).length} properties
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Overall Statistics */}
      {contentMetrics.overall && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('overallStats')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Overall Performance
            </h3>
            {expandedSections.overallStats ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.overallStats && (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Mean Score" value={contentMetrics.overall.mean} type="score" />
                <StatCard label="Std Dev" value={contentMetrics.overall.std} type="number" decimals={3} />
                <StatCard label="Min Score" value={contentMetrics.overall.min} type="score" />
                <StatCard label="Max Score" value={contentMetrics.overall.max} type="score" />
                <StatCard label="Median" value={contentMetrics.overall.median} type="score" />
              </div>

              {/* Score Distribution */}
              {contentMetrics.overall.distribution && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Score Distribution</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(contentMetrics.overall.distribution).map(([range, count]) => (
                      <div key={range} className="text-center">
                        <div className="h-24 bg-gray-100 rounded relative flex items-end justify-center">
                          <div
                            className="w-full bg-indigo-500 rounded transition-all"
                            style={{
                              height: `${(count / Math.max(...Object.values(contentMetrics.overall.distribution))) * 100}%`
                            }}
                          />
                          <span className="absolute top-1 text-xs font-medium text-gray-700">
                            {count}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{range}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

/**
 * Calculate content metrics from raw papers
 */
function calculateContentMetrics(papers) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 calculateContentMetrics: STARTING');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Processing ${papers.length} papers...`);
  
  const metrics = {
    propertyStats: {
      totalProperties: 0,
      totalPapers: 0,
      avgPropertiesPerPaper: 0
    },
    propertyTypes: {},
    overall: { scores: [] },
    scoreDetails: null
  };

  papers.forEach((paper, paperIndex) => {
    console.log(`\n───────────────────────────────────────────────────────`);
    console.log(`📄 Processing Paper ${paperIndex + 1}/${papers.length}`);
    console.log(`DOI: ${paper.doi}`);
    
    if (!paper.userEvaluations || paper.userEvaluations.length === 0) {
      console.warn(`⚠️ Paper ${paper.doi} has no user evaluations`);
      return;
    }

    paper.userEvaluations.forEach((evaluation, evalIndex) => {
      console.log(`\n  🔍 Evaluation ${evalIndex + 1}/${paper.userEvaluations.length}`);
      console.log(`  Token: ${evaluation.token}`);

      // Get content evaluation data
      const contentAccuracy = evaluation.evaluationMetrics?.accuracy?.content;
      const contentOverall = evaluation.overall?.content;
      
      if (!contentAccuracy && !contentOverall) {
        console.warn(`  ⚠️ No content evaluation data for token ${evaluation.token}`);
        return;
      }

      metrics.propertyStats.totalPapers++;

      // Process properties from accuracy metrics
      if (contentAccuracy) {
        const propertyCount = Object.keys(contentAccuracy).length;
        metrics.propertyStats.totalProperties += propertyCount;
        
        Object.entries(contentAccuracy).forEach(([propName, propData]) => {
          if (!metrics.propertyTypes[propName]) {
            metrics.propertyTypes[propName] = {
              count: 0,
              totalScore: 0,
              avgScore: 0,
              hasDataCount: 0,
              noDataCount: 0,
              totalValueCount: 0,
              confusionMatrices: []
            };
          }
          
          metrics.propertyTypes[propName].count++;
          
          // Extract property score
          const propScore = propData.similarity || propData.f1Score || propData.precision || 0;
          metrics.propertyTypes[propName].totalScore += propScore;
          metrics.propertyTypes[propName].avgScore = 
            metrics.propertyTypes[propName].totalScore / metrics.propertyTypes[propName].count;
          
          // Extract details
          if (propData.details) {
            if (propData.details.hasData) {
              metrics.propertyTypes[propName].hasDataCount++;
            } else {
              metrics.propertyTypes[propName].noDataCount++;
            }
            
            if (propData.details.valueCount) {
              metrics.propertyTypes[propName].totalValueCount += propData.details.valueCount;
            }
          }
          
          // Store confusion matrix
          if (propData.confusionMatrix) {
            metrics.propertyTypes[propName].confusionMatrices.push(propData.confusionMatrix);
          }
        });
      }

      // Extract overall score from evaluationMetrics.accuracy.content
      if (contentAccuracy && Object.keys(contentAccuracy).length > 0) {
        // Calculate average score from all properties
        const propertyScores = Object.values(contentAccuracy).map(propData => {
          return propData.similarity || propData.f1Score || propData.precision || 0;
        });
        
        if (propertyScores.length > 0) {
          const avgScore = avg(propertyScores);
          metrics.overall.scores.push(avgScore);
        }
      }
    });
  });

  // Calculate derived statistics
  metrics.propertyStats.avgPropertiesPerPaper = 
    metrics.propertyStats.totalPapers > 0 
      ? metrics.propertyStats.totalProperties / metrics.propertyStats.totalPapers 
      : 0;

  // Calculate average accuracy from property scores
  const allPropertyScores = Object.values(metrics.propertyTypes).map(pt => pt.avgScore);
  metrics.propertyStats.avgAccuracy = avg(allPropertyScores);
  
  // Calculate data coverage statistics
  let totalHasData = 0;
  let totalNoData = 0;
  let totalWithConfusionMatrix = 0;
  
  Object.values(metrics.propertyTypes).forEach(pt => {
    totalHasData += pt.hasDataCount;
    totalNoData += pt.noDataCount;
    if (pt.confusionMatrices.length > 0) {
      totalWithConfusionMatrix++;
    }
  });
  
  metrics.propertyStats.totalHasData = totalHasData;
  metrics.propertyStats.totalNoData = totalNoData;
  metrics.propertyStats.dataAvailabilityRate = 
    (totalHasData + totalNoData) > 0 
      ? totalHasData / (totalHasData + totalNoData)
      : 0;
  metrics.propertyStats.propertiesWithConfusionMatrix = totalWithConfusionMatrix;

  // Calculate overall statistics
  metrics.overall = calculateStats(metrics.overall.scores);

  console.log('✅ Final calculated content metrics:', metrics);
  return metrics;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStats(values) {
  if (!values || values.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, median: 0, count: 0, distribution: {} };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = avg(values);
  const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

  // Create distribution
  const distribution = {
    '0-0.2': 0,
    '0.2-0.4': 0,
    '0.4-0.6': 0,
    '0.6-0.8': 0,
    '0.8-1.0': 0
  };

  values.forEach(val => {
    if (val < 0.2) distribution['0-0.2']++;
    else if (val < 0.4) distribution['0.2-0.4']++;
    else if (val < 0.6) distribution['0.4-0.6']++;
    else if (val < 0.8) distribution['0.6-0.8']++;
    else distribution['0.8-1.0']++;
  });

  return {
    mean,
    std,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    count: values.length,
    distribution
  };
}

function avg(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const MetricCard = ({ icon: Icon, title, value, color, description }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-6 w-6" />
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <p className="text-xs opacity-80">{description}</p>
    </Card>
  );
};

const PropertyTypeRow = ({ name, stats, total }) => {
  const percentage = (stats.count / total) * 100;
  const avgValueCount = stats.totalValueCount / stats.count;
  const hasDataPercentage = (stats.hasDataCount / stats.count) * 100;
  
  return (
    <div className="p-3 bg-white rounded border hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            {stats.hasDataCount > 0 && stats.noDataCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Mixed
              </Badge>
            )}
            {stats.hasDataCount === stats.count && (
              <Badge variant="default" className="text-xs bg-green-600">
                Full Data
              </Badge>
            )}
            {stats.noDataCount === stats.count && (
              <Badge variant="destructive" className="text-xs">
                No Data
              </Badge>
            )}
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>Evaluations: {stats.count}</span>
            {stats.hasDataCount > 0 && (
              <span>Has Data: {stats.hasDataCount}/{stats.count}</span>
            )}
            {avgValueCount > 0 && (
              <span>Avg Values: {avgValueCount.toFixed(1)}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          <Badge variant="outline">{stats.count}</Badge>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-2">
        {/* Accuracy Score Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-16">Accuracy:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.avgScore * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-12 text-right">
            {(stats.avgScore * 100).toFixed(0)}%
          </span>
        </div>
        
        {/* Has Data Bar (if mixed) */}
        {stats.hasDataCount > 0 && stats.noDataCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-16">Has Data:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${hasDataPercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-12 text-right">
              {hasDataPercentage.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, type, decimals = 2 }) => {
  const formatValue = () => {
    if (type === 'score') return formatPercentage(value);
    if (type === 'count') return value.toString();
    return value.toFixed(decimals);
  };

  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${type === 'score' ? getScoreColor(value) : 'text-gray-900'}`}>
        {formatValue()}
      </p>
    </Card>
  );
};

function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function getScoreColor(score) {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

export default ContentAccuracyView;