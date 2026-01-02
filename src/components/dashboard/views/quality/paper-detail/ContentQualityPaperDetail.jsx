// File: src/components/dashboard/views/quality/paper-detail/ContentQualityPaperDetail.jsx
// UI-ONLY VERSION - No calculations, displays data from correct paths
// UPDATED: Accepts both evaluation and selectedEvaluation props for compatibility with PaperCard
// Data structure:
// - Per-property scores: contentOverall[propertyName].score/finalScore
// - Per-property accuracy: contentAccuracy[propertyName].similarity/f1Score
// - Aggregate: contentOverall._aggregate.mean
// - User ratings: contentOverall.userRatings

import React, { useState, useMemo } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { Progress } from '../../../../ui/progress';
import { 
  FileText, ChevronDown, ChevronUp, Info, 
  CheckCircle, AlertCircle, TrendingUp, Target,
  List, Grid, Award, Edit3, Star, Layers
} from 'lucide-react';

/**
 * Content Quality Paper Detail Component
 * UI-only - renders per-property scores from evaluation data
 * 
 * UPDATED: Now accepts both prop naming conventions from PaperCard:
 * - evaluation / selectedEvaluation
 * - evaluationIndex / selectedEvaluationIndex
 */
const ContentQualityPaperDetail = ({ 
  evaluation, 
  selectedEvaluation,
  evaluationIndex,
  selectedEvaluationIndex,
  paperData,
  groundTruth 
}) => {
  // Resolve the correct evaluation to use
  const effectiveEvaluation = selectedEvaluation || evaluation;
  const effectiveIndex = selectedEvaluationIndex ?? evaluationIndex ?? 0;

  console.log('ContentQualityPaperDetail - effectiveIndex:', effectiveIndex);
  console.log('ContentQualityPaperDetail - effectiveEvaluation:', effectiveEvaluation);
  
  const [expandedSections, setExpandedSections] = useState({
    overallQuality: true,
    propertyScores: true,
    userRatings: true,
    propertyDetails: false
  });

  const [selectedProperty, setSelectedProperty] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract content data from correct paths using effectiveEvaluation
  const contentOverall = effectiveEvaluation?.evaluationMetrics?.overall?.content;
  const contentAccuracy = effectiveEvaluation?.evaluationMetrics?.accuracy?.content;
  const contentQuality = effectiveEvaluation?.evaluationMetrics?.quality?.content;
  
  // Get aggregate score
  const aggregate = contentOverall?._aggregate;
  const userRatings = contentOverall?.userRatings;

  // Extract property list (exclude special keys)
  const propertyNames = useMemo(() => {
    if (!contentOverall) return [];
    return Object.keys(contentOverall).filter(key => 
      !key.startsWith('_') && key !== 'userRatings'
    );
  }, [contentOverall]);

  // Calculate property statistics
  const propertyStats = useMemo(() => {
    if (!contentOverall || propertyNames.length === 0) return null;

    const scores = propertyNames
      .map(name => contentOverall[name]?.finalScore || contentOverall[name]?.score)
      .filter(s => s !== undefined && s !== null);

    if (scores.length === 0) return null;

    return {
      count: propertyNames.length,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      excellentCount: scores.filter(s => s >= 0.8).length,
      goodCount: scores.filter(s => s >= 0.6 && s < 0.8).length,
      fairCount: scores.filter(s => s >= 0.4 && s < 0.6).length,
      poorCount: scores.filter(s => s < 0.4).length
    };
  }, [contentOverall, propertyNames]);

  if (!contentOverall && !contentAccuracy) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No content quality data available for this evaluation.
        </AlertDescription>
      </Alert>
    );
  }

  const overallScore = aggregate?.mean || propertyStats?.avgScore || 0;

  return (
    <div className="space-y-6">
      {/* Overall Quality Score */}
      <Card className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <button
          onClick={() => toggleSection('overallQuality')}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-teal-600" />
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-900">Content Quality Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">
                Property extraction quality assessment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {formatPercentage(overallScore)}
              </div>
              <div className="text-xs text-gray-600">Overall Score</div>
            </div>
            {expandedSections.overallQuality ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.overallQuality && propertyStats && (
          <div className="mt-6 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Properties Evaluated"
                value={propertyStats.count}
                type="count"
              />
              <StatCard
                label="Average Score"
                value={propertyStats.avgScore}
                type="score"
              />
              <StatCard
                label="Min Score"
                value={propertyStats.minScore}
                type="score"
              />
              <StatCard
                label="Max Score"
                value={propertyStats.maxScore}
                type="score"
              />
            </div>

            {/* Quality Distribution */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quality Distribution</h4>
              <div className="grid grid-cols-4 gap-3">
                <QualityBucket
                  label="Excellent"
                  count={propertyStats.excellentCount}
                  total={propertyStats.count}
                  color="green"
                  range="≥80%"
                />
                <QualityBucket
                  label="Good"
                  count={propertyStats.goodCount}
                  total={propertyStats.count}
                  color="blue"
                  range="60-79%"
                />
                <QualityBucket
                  label="Fair"
                  count={propertyStats.fairCount}
                  total={propertyStats.count}
                  color="yellow"
                  range="40-59%"
                />
                <QualityBucket
                  label="Poor"
                  count={propertyStats.poorCount}
                  total={propertyStats.count}
                  color="red"
                  range="<40%"
                />
              </div>
            </div>

            {/* Aggregate Info */}
            {aggregate && (
              <div className="p-3 bg-gray-50 rounded border text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aggregate Mean:</span>
                  <span className="font-semibold">{formatPercentage(aggregate.mean)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Properties Count:</span>
                  <span className="font-semibold">{aggregate.count}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* User Ratings */}
      {userRatings && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('userRatings')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              User Ratings
            </h3>
            {expandedSections.userRatings ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.userRatings && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <UserRatingCard
                label="Property Coverage"
                rating={userRatings.propertyCoverage}
              />
              <UserRatingCard
                label="Evidence Quality"
                rating={userRatings.evidenceQuality}
              />
              <UserRatingCard
                label="Value Accuracy"
                rating={userRatings.valueAccuracy}
              />
              {userRatings.expertiseMultiplier && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Expertise</h5>
                  <div className="text-2xl font-bold text-gray-700">
                    {userRatings.expertiseMultiplier.toFixed(2)}x
                  </div>
                  <div className="text-xs text-gray-600">Multiplier</div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Property Scores Grid */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('propertyScores')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Grid className="h-5 w-5 text-blue-600" />
            Property Scores
            <Badge variant="outline">{propertyNames.length} properties</Badge>
          </h3>
          {expandedSections.propertyScores ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.propertyScores && (
          <div className="space-y-4">
            {/* Property Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {propertyNames.map(propName => {
                const propOverall = contentOverall[propName];
                const propAccuracy = contentAccuracy?.[propName];
                
                return (
                  <PropertyScoreCard
                    key={propName}
                    name={propName}
                    overallData={propOverall}
                    accuracyData={propAccuracy}
                    onClick={() => setSelectedProperty(propName === selectedProperty ? null : propName)}
                    isSelected={selectedProperty === propName}
                  />
                );
              })}
            </div>

            {/* Selected Property Details */}
            {selectedProperty && (
              <PropertyDetailPanel
                name={selectedProperty}
                overallData={contentOverall[selectedProperty]}
                accuracyData={contentAccuracy?.[selectedProperty]}
                qualityData={contentQuality?.[selectedProperty]}
                onClose={() => setSelectedProperty(null)}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// Sub-Components
const StatCard = ({ label, value, type }) => {
  const formatValue = () => {
    if (value === null || value === undefined) return 'N/A';
    if (type === 'score') return formatPercentage(value);
    return value.toString();
  };

  return (
    <div className="bg-white p-4 rounded-lg border text-center">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${type === 'score' ? getScoreColor(value) : 'text-gray-900'}`}>
        {formatValue()}
      </div>
    </div>
  );
};

const QualityBucket = ({ label, count, total, color, range }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200'
  };

  const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]} text-center`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-xs opacity-75">{range}</div>
      <div className="text-xs mt-1">({percentage}%)</div>
    </div>
  );
};

const UserRatingCard = ({ label, rating }) => (
  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
    <h5 className="text-sm font-semibold text-gray-900 mb-2">{label}</h5>
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-bold ${getRatingColor(rating)}`}>
        {rating?.toFixed(1) || 'N/A'}
      </span>
      <span className="text-sm text-gray-600">/ 5</span>
    </div>
    <div className="flex gap-0.5 mt-2">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= (rating || 0) 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  </div>
);

const PropertyScoreCard = ({ name, overallData, accuracyData, onClick, isSelected }) => {
  const finalScore = overallData?.finalScore || overallData?.score;
  const similarity = accuracyData?.similarity || accuracyData?.f1Score;

  // Format property name for display
  const displayName = name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
          : 'bg-white hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h5 className="text-sm font-medium text-gray-900 truncate" title={displayName}>
          {displayName}
        </h5>
        <Badge variant="outline" className={`text-xs ${getScoreBadgeColor(finalScore)}`}>
          {formatPercentage(finalScore)}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Final Score:</span>
          <span className={`font-medium ${getScoreColor(finalScore)}`}>
            {formatPercentage(finalScore)}
          </span>
        </div>
        {similarity !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Similarity:</span>
            <span className={`font-medium ${getScoreColor(similarity)}`}>
              {formatPercentage(similarity)}
            </span>
          </div>
        )}
      </div>

      <Progress value={(finalScore || 0) * 100} className="h-1 mt-2" />
    </div>
  );
};

const PropertyDetailPanel = ({ name, overallData, accuracyData, qualityData, onClose }) => {
  const displayName = name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 capitalize">{displayName}</h4>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Scores */}
        {overallData && (
          <div className="bg-white p-3 rounded border">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Overall Scores</h5>
            <div className="space-y-1 text-sm">
              <ScoreRow label="Final Score" value={overallData.finalScore} />
              <ScoreRow label="Accuracy Score" value={overallData.accuracyScore} />
              <ScoreRow label="Quality Score" value={overallData.qualityScore} />
              <ScoreRow label="Overall Score" value={overallData.overallScore} />
            </div>
          </div>
        )}

        {/* Accuracy Metrics */}
        {accuracyData && (
          <div className="bg-white p-3 rounded border">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Accuracy Metrics</h5>
            <div className="space-y-1 text-sm">
              <ScoreRow label="Similarity" value={accuracyData.similarity} />
              <ScoreRow label="Precision" value={accuracyData.precision} />
              <ScoreRow label="Recall" value={accuracyData.recall} />
              <ScoreRow label="F1 Score" value={accuracyData.f1Score} />
            </div>
          </div>
        )}

        {/* Quality Metrics */}
        {qualityData && (
          <div className="bg-white p-3 rounded border">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Quality Metrics</h5>
            <div className="space-y-1 text-sm">
              <ScoreRow label="Overall Score" value={qualityData.overallScore} />
              <ScoreRow label="Automated Score" value={qualityData.automatedOverallScore} />
              {qualityData.completeness && (
                <ScoreRow label="Completeness" value={qualityData.completeness.score} />
              )}
              {qualityData.consistency && (
                <ScoreRow label="Consistency" value={qualityData.consistency.score} />
              )}
              {qualityData.validity && (
                <ScoreRow label="Validity" value={qualityData.validity.score} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Similarity Details */}
      {accuracyData?.similarityData && (
        <div className="mt-4 bg-white p-3 rounded border">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Similarity Details</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <ScoreRow label="Overall" value={accuracyData.similarityData.overallScore} />
            <ScoreRow label="Jaccard" value={accuracyData.similarityData.jaccardSimilarity} />
            <ScoreRow label="Cosine" value={accuracyData.similarityData.cosineSimilarity} />
            <ScoreRow label="Levenshtein" value={accuracyData.similarityData.levenshteinSimilarity} />
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}:</span>
    <span className={`font-medium ${getScoreColor(value)}`}>
      {formatPercentage(value)}
    </span>
  </div>
);

// Helper Functions
function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

function getScoreColor(score) {
  if (score === null || score === undefined || isNaN(score)) return 'text-gray-400';
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBadgeColor(score) {
  if (score === null || score === undefined || isNaN(score)) return '';
  if (score >= 0.8) return 'bg-green-100 text-green-700 border-green-300';
  if (score >= 0.6) return 'bg-blue-100 text-blue-700 border-blue-300';
  if (score >= 0.4) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

function getRatingColor(rating) {
  if (!rating) return 'text-gray-400';
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-blue-600';
  if (rating >= 2) return 'text-yellow-600';
  return 'text-red-600';
}

export default ContentQualityPaperDetail;