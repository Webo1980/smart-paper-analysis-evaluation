// src/components/dashboard/views/quality/ResearchFieldQualityView.jsx

import React, { useState, useMemo } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Info, Award, TrendingUp, TrendingDown, AlertCircle,
  BarChart3, Users, Star, CheckCircle, Target, 
  Percent, ChevronDown, ChevronUp, Calculator,
  Layers, Activity, Gauge, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatPercentage } from '../../../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

/**
 * Research Field Quality View Component
 * 
 * Displays aggregated quality analysis across all evaluated papers
 * 
 * Props:
 * - componentData: Pre-aggregated statistics from DataQualityView
 * - papers: Array of paper objects with userEvaluations
 */
const ResearchFieldQualityView = ({ componentData, papers = [] }) => {
  console.log("ResearchFieldQualityView: Rendering", { 
    componentData,
    papersLength: papers.length
  });

  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState({
    methodology: false,
    distribution: true,
    dimensions: true,
    userRatings: false,
    topBottom: true,
    automation: false
  });

  // Extract quality data from papers for detailed analysis
const qualityDataArray = useMemo(() => {
  if (!papers || papers.length === 0) return [];

  const extracted = [];
  
  papers.forEach(paper => {
    paper.userEvaluations?.forEach(evaluation => {
        console.log('Processing evaluation:', evaluation);
      // FIXED: Use correct path for quality metrics
      const rfQualityMetrics = evaluation?.evaluationMetrics?.overall?.research_field?.qualityMetrics;
      if (rfQualityMetrics?.overallQuality?.value !== undefined) {
        extracted.push({
          groundTruth: paper.groundTruth,
          evaluation: evaluation,
          qualityData: rfQualityMetrics,
          qualityDataRaw: evaluation?.evaluationMetrics?.quality?.researchField
        });
      }
    });
  });

  console.log("ResearchFieldQualityView: Extracted quality data", extracted.length);
  return extracted;
}, [papers]);

  // Use componentData if available, otherwise compute from qualityDataArray
// Use componentData if available, otherwise compute from qualityDataArray
const aggregateMetrics = useMemo(() => {
  // If we have pre-computed componentData, use it
  if (componentData) {
    console.log("ResearchFieldQualityView: Using componentData", componentData);
    return {
      overall: componentData.qualityScores,
      automated: componentData.automatedScores || componentData.qualityScores,
      dimensions: {
        confidence: {
          final: componentData.byDimension?.confidence?.final,
          automated: componentData.byDimension?.confidence?.automated
        },
        relevance: {
          final: componentData.byDimension?.relevance?.final,
          automated: componentData.byDimension?.relevance?.automated
        },
        consistency: {
          final: componentData.byDimension?.consistency?.final,
          automated: componentData.byDimension?.consistency?.automated
        }
      },
      userRatings: componentData.userRatings || {
        primaryField: null,
        confidence: null,
        relevance: null,
        consistency: null
      },
      totalEvaluations: componentData.evaluationCount || qualityDataArray.length,
      evaluationsWithRatings: componentData.ratingsCount || 0
    };
  }

  // Otherwise compute from raw data
  if (qualityDataArray.length === 0) {
    console.log("ResearchFieldQualityView: No quality data available");
    return null;
  }

  console.log("ResearchFieldQualityView: Computing from raw data");

  const overallScores = [];
  const automatedScores = [];
  const confidenceScores = [];
  const relevanceScores = [];
  const consistencyScores = [];
  const confidenceAutomated = [];
  const relevanceAutomated = [];
  const consistencyAutomated = [];

  const primaryFieldRatings = [];
  const confidenceRatings = [];
  const relevanceRatings = [];
  const consistencyRatings = [];

  qualityDataArray.forEach(item => {
    const quality = item.qualityData; // This is qualityMetrics with .value properties
    const qualityDataRaw = item.qualityDataRaw; // This is the raw quality data with automated scores
    const evaluation = item.evaluation;

    // FIXED: Get overall score from qualityMetrics.overallQuality.value
    if (quality.overallQuality?.value !== undefined) {
      overallScores.push(quality.overallQuality.value);
    }
    
    // FIXED: Get automated overall score from qualityData.automatedOverallScore
    if (qualityDataRaw?.qualityData?.automatedOverallScore !== undefined) {
      automatedScores.push(qualityDataRaw.qualityData.automatedOverallScore);
    }

    // FIXED: Get final dimension scores from qualityMetrics (has .value)
    if (quality.confidence?.value !== undefined) {
      confidenceScores.push(quality.confidence.value);
    }
    if (quality.relevance?.value !== undefined) {
      relevanceScores.push(quality.relevance.value);
    }
    if (quality.consistency?.value !== undefined) {
      consistencyScores.push(quality.consistency.value);
    }

    // FIXED: Get automated dimension scores from qualityData.fieldSpecificMetrics (has .score)
    if (qualityDataRaw?.qualityData?.fieldSpecificMetrics) {
      const metrics = qualityDataRaw.qualityData.fieldSpecificMetrics;
      
      if (metrics.confidence?.score !== undefined) {
        confidenceAutomated.push(metrics.confidence.score);
      }
      if (metrics.relevance?.score !== undefined) {
        relevanceAutomated.push(metrics.relevance.score);
      }
      if (metrics.consistency?.score !== undefined) {
        consistencyAutomated.push(metrics.consistency.score);
      }
    }

    // FIXED: Get user ratings from evaluation.overall.research_field
    const rfOverall = evaluation?.overall?.research_field;
    if (rfOverall) {
      if (rfOverall.primaryField?.rating !== undefined) {
        primaryFieldRatings.push(rfOverall.primaryField.rating);
      }
      if (rfOverall.confidence?.rating !== undefined) {
        confidenceRatings.push(rfOverall.confidence.rating);
      }
      if (rfOverall.relevance?.rating !== undefined) {
        relevanceRatings.push(rfOverall.relevance.rating);
      }
      if (rfOverall.consistency?.rating !== undefined) {
        consistencyRatings.push(rfOverall.consistency.rating);
      }
    }
  });

  const calculateStats = (scores) => {
    if (scores.length === 0) return null;
    const sorted = [...scores].sort((a, b) => a - b);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      std: Math.sqrt(scores.reduce((sum, val) => {
        const diff = val - mean;
        return sum + diff * diff;
      }, 0) / scores.length),
      count: scores.length
    };
  };

  return {
    overall: calculateStats(overallScores),
    automated: calculateStats(automatedScores),
    dimensions: {
      confidence: {
        final: calculateStats(confidenceScores),
        automated: calculateStats(confidenceAutomated)
      },
      relevance: {
        final: calculateStats(relevanceScores),
        automated: calculateStats(relevanceAutomated)
      },
      consistency: {
        final: calculateStats(consistencyScores),
        automated: calculateStats(consistencyAutomated)
      }
    },
    userRatings: {
      primaryField: calculateStats(primaryFieldRatings),
      confidence: calculateStats(confidenceRatings),
      relevance: calculateStats(relevanceRatings),
      consistency: calculateStats(consistencyRatings)
    },
    totalEvaluations: qualityDataArray.length,
    evaluationsWithRatings: primaryFieldRatings.length
  };
}, [componentData, qualityDataArray]);
 console.log("ResearchFieldQualityView: Aggregate Metrics", aggregateMetrics);
  // Distribution data for charts
  const distributionData = useMemo(() => {
    if (qualityDataArray.length === 0) return null;

    const bins = [
      { range: '0-20%', min: 0, max: 0.2, count: 0, label: 'Very Low' },
      { range: '20-40%', min: 0.2, max: 0.4, count: 0, label: 'Low' },
      { range: '40-60%', min: 0.4, max: 0.6, count: 0, label: 'Medium' },
      { range: '60-80%', min: 0.6, max: 0.8, count: 0, label: 'High' },
      { range: '80-100%', min: 0.8, max: 1.0, count: 0, label: 'Very High' }
    ];

    qualityDataArray.forEach(item => {
      const score = item.qualityData?.overallQuality?.value;
      if (score !== undefined) {
        const bin = bins.find(b => score >= b.min && score < b.max) || bins[bins.length - 1];
        bin.count++;
      }
    });

    return bins;
  }, [qualityDataArray]);

  // Dimension comparison data
  const dimensionComparisonData = useMemo(() => {
    if (!aggregateMetrics) return null;

    return [
      {
        dimension: 'Confidence',
        automated: aggregateMetrics.dimensions.confidence.automated?.mean || 0,
        final: aggregateMetrics.dimensions.confidence.final?.mean || 0,
        weight: 0.333
      },
      {
        dimension: 'Relevance',
        automated: aggregateMetrics.dimensions.relevance.automated?.mean || 0,
        final: aggregateMetrics.dimensions.relevance.final?.mean || 0,
        weight: 0.333
      },
      {
        dimension: 'Consistency',
        automated: aggregateMetrics.dimensions.consistency.automated?.mean || 0,
        final: aggregateMetrics.dimensions.consistency.final?.mean || 0,
        weight: 0.333
      }
    ];
  }, [aggregateMetrics]);

  // Radar chart data for dimensions
  const radarData = useMemo(() => {
    if (!aggregateMetrics) return null;

    return [
      {
        dimension: 'Confidence',
        automated: (aggregateMetrics.dimensions.confidence.automated?.mean || 0) * 100,
        final: (aggregateMetrics.dimensions.confidence.final?.mean || 0) * 100
      },
      {
        dimension: 'Relevance',
        automated: (aggregateMetrics.dimensions.relevance.automated?.mean || 0) * 100,
        final: (aggregateMetrics.dimensions.relevance.final?.mean || 0) * 100
      },
      {
        dimension: 'Consistency',
        automated: (aggregateMetrics.dimensions.consistency.automated?.mean || 0) * 100,
        final: (aggregateMetrics.dimensions.consistency.final?.mean || 0) * 100
      }
    ];
  }, [aggregateMetrics]);

  // Top and bottom papers
// Top and bottom papers
const topBottomPapers = useMemo(() => {
  if (qualityDataArray.length === 0) return null;

  const papersWithScores = qualityDataArray
    .map(item => ({
      doi: item.groundTruth?.doi || 'Unknown',
      title: item.groundTruth?.title || 'Untitled',
      score: item.qualityData?.overallQuality?.value || 0,
      // FIXED: Get automated score from qualityData.automatedOverallScore
      automatedScore: item.qualityDataRaw?.qualityData?.automatedOverallScore || 0
    }))
    .sort((a, b) => b.score - a.score);

  return {
    top: papersWithScores.slice(0, 5),
    bottom: papersWithScores.slice(-5).reverse()
  };
}, [qualityDataArray]);

  // User rating impact analysis
// User rating impact analysis
const userRatingImpact = useMemo(() => {
  if (qualityDataArray.length === 0) return null;

  let positiveImpact = 0;
  let negativeImpact = 0;
  let noChange = 0;
  let totalImpact = 0;

  qualityDataArray.forEach(item => {
    const quality = item.qualityData; // qualityMetrics with .value
    const qualityDataRaw = item.qualityDataRaw; // raw data with automated scores
    
    // FIXED: Get automated and final scores from correct paths
    const automated = qualityDataRaw?.qualityData?.automatedOverallScore;
    const final = quality.overallQuality?.value;

    if (automated !== undefined && final !== undefined) {
      const diff = final - automated;
      totalImpact += Math.abs(diff);

      if (diff > 0.01) positiveImpact++;
      else if (diff < -0.01) negativeImpact++;
      else noChange++;
    }
  });

  const total = positiveImpact + negativeImpact + noChange;

  return {
    positiveImpact,
    negativeImpact,
    noChange,
    total,
    averageImpact: total > 0 ? totalImpact / total : 0,
    impactDistribution: [
      { name: 'Improved', value: positiveImpact, color: '#10b981' },
      { name: 'Decreased', value: negativeImpact, color: '#ef4444' },
      { name: 'No Change', value: noChange, color: '#6b7280' }
    ]
  };
}, [qualityDataArray]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!aggregateMetrics) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No research field quality data available for analysis. Quality metrics are generated when evaluators provide ratings for confidence, relevance, and consistency dimensions.
        </AlertDescription>
      </Alert>
    );
  }

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <Award className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">
                Research Field Quality Analysis
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Comprehensive quality assessment across {aggregateMetrics.totalEvaluations} evaluations,
              analyzing confidence, relevance, and consistency dimensions.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                label="Total Evaluations"
                value={aggregateMetrics.totalEvaluations}
                color="blue"
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="With User Ratings"
                value={aggregateMetrics.evaluationsWithRatings}
                color="green"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Avg Quality Score"
                value={formatPercentage(aggregateMetrics.overall.mean)}
                color="purple"
              />
              <StatCard
                icon={<Gauge className="h-5 w-5" />}
                label="Quality Range"
                value={`${formatPercentage(aggregateMetrics.overall.min)} - ${formatPercentage(aggregateMetrics.overall.max)}`}
                color="orange"
                small
              />
            </div>
          </div>

          {/* Overall Score Gauge */}
          <div className="ml-6 text-center bg-white rounded-lg p-6 shadow-md border-2 border-purple-200">
            <Award className={`h-12 w-12 mx-auto mb-3 ${getScoreColor(aggregateMetrics.overall.mean)}`} />
            <p className="text-xs text-gray-600 mb-2">Mean Quality Score</p>
            <p className={`text-3xl font-bold ${getScoreColor(aggregateMetrics.overall.mean)}`}>
              {formatPercentage(aggregateMetrics.overall.mean)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              σ = {formatPercentage(aggregateMetrics.overall.std)}
            </p>
          </div>
        </div>
      </Card>

      {/* Methodology Explanation */}
      <Card className="overflow-hidden border-purple-200">
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-gradient-to-r from-purple-50 to-blue-50"
          onClick={() => toggleSection('methodology')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              <h3 className="text-md font-semibold text-gray-900">
                Quality Evaluation Methodology
              </h3>
            </div>
            <button className="p-2 rounded hover:bg-white/50 transition-colors">
              {expandedSections.methodology ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {expandedSections.methodology && (
          <div className="p-6 pt-0 space-y-4 border-t">
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">
                Three-Dimensional Quality Framework
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center mb-2">
                    <Percent className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="font-medium text-sm">Confidence (33.3%)</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Evaluates confidence score distribution, calibration quality, 
                    ranking accuracy, and hierarchical relationships in predictions.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center mb-2">
                    <Award className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="font-medium text-sm">Relevance (33.3%)</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Assesses field-paper semantic alignment through hierarchy positioning,
                    word overlap, and Jaccard similarity measures.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="font-medium text-sm">Consistency (33.3%)</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Measures inter-field coherence, terminology consistency,
                    and vocabulary distribution across predictions.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                Four Expert Rating Dimensions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start">
                  <Target className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Primary Field Detection:</span> Overall accuracy assessment (influences weighting)
                  </div>
                </div>
                <div className="flex items-start">
                  <Percent className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Confidence Scores:</span> Appropriateness of confidence distribution
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Overall Consistency:</span> Coherence between suggested fields
                  </div>
                </div>
                <div className="flex items-start">
                  <Award className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Overall Relevance:</span> Field-paper content match quality
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded border">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Score Calculation Formula
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 bg-white rounded">
                  <strong>Step 1:</strong> Calculate automated scores for each dimension
                </div>
                <div className="p-2 bg-white rounded">
                  <strong>Step 2:</strong> Apply dynamic weights based on system confidence
                </div>
                <div className="p-2 bg-white rounded">
                  <strong>Step 3:</strong> Combine with user ratings using expertise multipliers
                </div>
                <div className="p-2 bg-white rounded">
                  <strong>Step 4:</strong> Add agreement bonuses for aligned assessments
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <strong>Overall Quality =</strong> (Confidence × 0.333) + (Relevance × 0.333) + (Consistency × 0.333)
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Quality Distribution */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Quality Score Distribution
          </h3>
          <button
            onClick={() => toggleSection('distribution')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {expandedSections.distribution ? 'Hide' : 'Show'}
          </button>
        </div>

        {expandedSections.distribution && distributionData && (
          <div className="space-y-6">
            {/* Distribution Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded shadow-lg border">
                        <p className="font-semibold text-sm">{data.label}</p>
                        <p className="text-xs text-gray-600">{data.range}</p>
                        <p className="text-sm mt-1">
                          <span className="font-bold text-purple-600">{data.count}</span> evaluations
                        </p>
                        <p className="text-xs text-gray-500">
                          {((data.count / aggregateMetrics.totalEvaluations) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Number of Evaluations" />
              </BarChart>
            </ResponsiveContainer>

            {/* Statistics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-purple-50 rounded border border-purple-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Mean</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatPercentage(aggregateMetrics.overall.mean)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Median</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatPercentage(aggregateMetrics.overall.median)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded border border-green-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Std Dev</p>
                <p className="text-lg font-bold text-green-600">
                  {formatPercentage(aggregateMetrics.overall.std)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded border border-orange-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Min</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatPercentage(aggregateMetrics.overall.min)}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded border border-red-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Max</p>
                <p className="text-lg font-bold text-red-600">
                  {formatPercentage(aggregateMetrics.overall.max)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dimension Breakdown */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            Quality Dimensions Breakdown
          </h3>
          <button
            onClick={() => toggleSection('dimensions')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {expandedSections.dimensions ? 'Hide' : 'Show'}
          </button>
        </div>

        {expandedSections.dimensions && dimensionComparisonData && (
          <div className="space-y-6">
            {/* Dimension Comparison Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Automated vs Final Scores
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dimensionComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dimension" />
                    <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip 
                      formatter={(value) => formatPercentage(value)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    <Bar dataKey="automated" fill="#94a3b8" name="Automated Score" />
                    <Bar dataKey="final" fill="#8b5cf6" name="Final Score (with user input)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Dimension Profile
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Radar 
                      name="Automated" 
                      dataKey="automated" 
                      stroke="#94a3b8" 
                      fill="#94a3b8" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Final (with user)" 
                      dataKey="final" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.5} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Dimension Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DimensionDetailCard
                title="Confidence"
                icon={<Percent className="h-5 w-5" />}
                color="purple"
                automated={aggregateMetrics.dimensions.confidence.automated}
                final={aggregateMetrics.dimensions.confidence.final}
                weight={0.333}
              />
              <DimensionDetailCard
                title="Relevance"
                icon={<Award className="h-5 w-5" />}
                color="orange"
                automated={aggregateMetrics.dimensions.relevance.automated}
                final={aggregateMetrics.dimensions.relevance.final}
                weight={0.333}
              />
              <DimensionDetailCard
                title="Consistency"
                icon={<CheckCircle className="h-5 w-5" />}
                color="green"
                automated={aggregateMetrics.dimensions.consistency.automated}
                final={aggregateMetrics.dimensions.consistency.final}
                weight={0.333}
              />
            </div>
          </div>
        )}
      </Card>

      {/* User Ratings Impact */}
      {aggregateMetrics.evaluationsWithRatings > 0 && userRatingImpact && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              User Ratings Impact Analysis
            </h3>
            <button
              onClick={() => toggleSection('userRatings')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {expandedSections.userRatings ? 'Hide' : 'Show'}
            </button>
          </div>

          {expandedSections.userRatings && (
            <div className="space-y-6">
              {/* Impact Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Score Change Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={userRatingImpact.impactDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRatingImpact.impactDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Statistics */}
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Scores Improved</span>
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {userRatingImpact.positiveImpact}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {((userRatingImpact.positiveImpact / userRatingImpact.total) * 100).toFixed(1)}% of evaluations
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Scores Decreased</span>
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {userRatingImpact.negativeImpact}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {((userRatingImpact.negativeImpact / userRatingImpact.total) * 100).toFixed(1)}% of evaluations
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded border">
                    <p className="text-sm font-medium text-gray-700 mb-1">Average Impact</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPercentage(userRatingImpact.averageImpact)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Mean absolute score change
                    </p>
                  </div>
                </div>
              </div>

              {/* User Rating Averages */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {aggregateMetrics.userRatings.primaryField && (
                  <UserRatingCard
                    title="Primary Field"
                    icon={<Target className="h-4 w-4" />}
                    stats={aggregateMetrics.userRatings.primaryField}
                    color="blue"
                  />
                )}
                {aggregateMetrics.userRatings.confidence && (
                  <UserRatingCard
                    title="Confidence"
                    icon={<Percent className="h-4 w-4" />}
                    stats={aggregateMetrics.userRatings.confidence}
                    color="purple"
                  />
                )}
                {aggregateMetrics.userRatings.relevance && (
                  <UserRatingCard
                    title="Relevance"
                    icon={<Award className="h-4 w-4" />}
                    stats={aggregateMetrics.userRatings.relevance}
                    color="orange"
                  />
                )}
                {aggregateMetrics.userRatings.consistency && (
                  <UserRatingCard
                    title="Consistency"
                    icon={<CheckCircle className="h-4 w-4" />}
                    stats={aggregateMetrics.userRatings.consistency}
                    color="green"
                  />
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Top and Bottom Performing Papers */}
      {topBottomPapers && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Top & Bottom Performing Papers
            </h3>
            <button
              onClick={() => toggleSection('topBottom')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {expandedSections.topBottom ? 'Hide' : 'Show'}
            </button>
          </div>

          {expandedSections.topBottom && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 */}
              <div>
                <div className="flex items-center mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-700">
                    Highest Quality Scores
                  </h4>
                </div>
                <div className="space-y-2">
                  {topBottomPapers.top.map((paper, idx) => (
                    <PaperScoreCard
                      key={paper.doi}
                      rank={idx + 1}
                      paper={paper}
                      type="top"
                    />
                  ))}
                </div>
              </div>

              {/* Bottom 5 */}
              <div>
                <div className="flex items-center mb-3">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-700">
                    Lowest Quality Scores
                  </h4>
                </div>
                <div className="space-y-2">
                  {topBottomPapers.bottom.map((paper, idx) => (
                    <PaperScoreCard
                      key={paper.doi}
                      rank={aggregateMetrics.totalEvaluations - idx}
                      paper={paper}
                      type="bottom"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Automation vs Human Comparison */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            Automated vs Final Score Analysis
          </h3>
          <button
            onClick={() => toggleSection('automation')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {expandedSections.automation ? 'Hide' : 'Show'}
          </button>
        </div>

        {expandedSections.automation && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded border">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Automated Scores</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mean:</span>
                    <span className="font-semibold">{formatPercentage(aggregateMetrics.automated.mean)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Median:</span>
                    <span className="font-semibold">{formatPercentage(aggregateMetrics.automated.median)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Std Dev:</span>
                    <span className="font-semibold">{formatPercentage(aggregateMetrics.automated.std)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded border border-purple-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Final Scores (with user input)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mean:</span>
                    <span className="font-semibold text-purple-600">{formatPercentage(aggregateMetrics.overall.mean)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Median:</span>
                    <span className="font-semibold text-purple-600">{formatPercentage(aggregateMetrics.overall.median)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Std Dev:</span>
                    <span className="font-semibold text-purple-600">{formatPercentage(aggregateMetrics.overall.std)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Average Score Difference (Final - Automated):
                </span>
                <span className={`text-xl font-bold ${
                  aggregateMetrics.overall.mean > aggregateMetrics.automated.mean 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {aggregateMetrics.overall.mean > aggregateMetrics.automated.mean ? '+' : ''}
                  {formatPercentage(aggregateMetrics.overall.mean - aggregateMetrics.automated.mean)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {aggregateMetrics.overall.mean > aggregateMetrics.automated.mean
                  ? 'User ratings generally increased quality scores, indicating expert input adds value.'
                  : aggregateMetrics.overall.mean < aggregateMetrics.automated.mean
                  ? 'User ratings generally decreased quality scores, suggesting automated metrics may be optimistic.'
                  : 'User ratings had minimal average impact on scores, indicating good automated-human alignment.'}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

/**
 * Helper Components
 */

const StatCard = ({ icon, label, value, color, small = false }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center mb-1">
        <span className={colorClasses[color].split(' ')[0]}>{icon}</span>
      </div>
      <p className={`${small ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
        {value}
      </p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
};

const DimensionDetailCard = ({ title, icon, color, automated, final, weight }) => {
  if (!automated || !final) return null;

  const colorClasses = {
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' }
  };

  const colors = colorClasses[color];
  const improvement = final.mean - automated.mean;

  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={colors.text}>{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <Badge className="bg-white text-gray-700 text-xs">
          {formatPercentage(weight)}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Automated Mean:</span>
          <span className="font-medium">{formatPercentage(automated.mean)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-900 font-medium">Final Mean:</span>
          <span className={`font-bold ${colors.text}`}>
            {formatPercentage(final.mean)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="text-gray-600">Improvement:</span>
          <span className={`font-semibold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {improvement >= 0 ? '+' : ''}{formatPercentage(improvement)}
          </span>
        </div>
      </div>

      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${colors.text.replace('text', 'bg')}`}
          style={{ width: `${final.mean * 100}%` }}
        />
      </div>
    </div>
  );
};

const UserRatingCard = ({ title, icon, stats, color }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
    green: 'border-green-200 bg-green-50'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center mb-3">
        {icon}
        <span className="text-sm font-medium text-gray-900 ml-2">{title}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <StarRating value={stats.mean} size="small" />
        <span className="text-lg font-bold text-gray-900">
          {stats.mean.toFixed(2)}
        </span>
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Range:</span>
          <span>{stats.min.toFixed(1)} - {stats.max.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span>Count:</span>
          <span>{stats.count}</span>
        </div>
      </div>
    </div>
  );
};

const StarRating = ({ value, size = 'medium' }) => {
  const starSize = size === 'small' ? 'h-3 w-3' : 'h-4 w-4';
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`${starSize} fill-yellow-400 text-yellow-400`} />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className={`${starSize} text-yellow-400`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      ))}
    </div>
  );
};

const PaperScoreCard = ({ rank, paper, type }) => {
  const bgColor = type === 'top' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const rankColor = type === 'top' ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`p-3 rounded border ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          <div className="flex items-center mb-1">
            <span className={`text-xs font-bold ${rankColor} mr-2`}>#{rank}</span>
            <span className="text-xs text-gray-500 font-mono">{paper.doi}</span>
          </div>
          <p className="text-sm text-gray-900 line-clamp-2">
            {paper.title}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${getScoreColor(paper.score)}`}>
            {formatPercentage(paper.score)}
          </p>
          <p className="text-xs text-gray-500">
            Auto: {formatPercentage(paper.automatedScore)}
          </p>
        </div>
      </div>
    </div>
  );
};

function getScoreColor(score) {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.7) return 'text-blue-600';
  if (score >= 0.5) return 'text-yellow-600';
  if (score >= 0.3) return 'text-orange-600';
  return 'text-red-600';
}

export default ResearchFieldQualityView;