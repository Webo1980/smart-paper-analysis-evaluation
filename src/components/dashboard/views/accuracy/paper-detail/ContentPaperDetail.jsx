// File: src/components/dashboard/views/accuracy/paper-detail/ContentPaperDetail.jsx
// FIXED VERSION - Correct data paths and score aggregation
//
// ============================================================================
// KEY FIXES:
// ============================================================================
// 1. Content has NO single overall score - must aggregate from property scores
// 2. Each property has: evaluationMetrics.accuracy.content[propertyName].scoreDetails.finalScore
// 3. Overall score = average of all property finalScores, or from _aggregate
// 4. User ratings at: evaluationMetrics.overall.content.userRatings
// 5. Properties at: systemData.paperContent.paperContent (object, not array)
//
// ============================================================================
// DATA STRUCTURE (from debug):
// ============================================================================
// evaluationMetrics.accuracy.content = {
//   "primary_dataset": {
//     precision: 0.7, recall: 0.7, f1Score: 0.7,
//     similarityData: { overallScore: 0.7, ... },
//     scoreDetails: { finalScore: 0.7, automaticWeight: 0.6, userWeight: 0.4 },
//     hasData: true
//   },
//   "dataset_class_distribution": { ... },
//   "_aggregate": { ... }  // May contain overall aggregated score
// }
//
// evaluationMetrics.overall.content = {
//   "primary_dataset": { ... },  // Per-property data
//   userRatings: { propertyCoverage: 5, evidenceQuality: 5, valueAccuracy: 5, ... }
// }
//
// systemData.paperContent.paperContent = {
//   "prob-001": { label: "Primary Dataset", value: {...}, evidence: {...} },
//   ...
// }
// ============================================================================

import React, { useState, useMemo } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { 
  CheckCircle, XCircle, AlertCircle, FileText, 
  TrendingUp, Info, ChevronDown, ChevronUp, Star, Database, Brain, Target
} from 'lucide-react';

/**
 * Content Quality Metrics Configuration
 */
const QUALITY_METRICS = {
  propertyCoverage: {
    key: 'propertyCoverage',
    label: 'Property Coverage',
    description: 'How well the extracted properties cover the paper content',
    weight: 0.4
  },
  evidenceQuality: {
    key: 'evidenceQuality',
    label: 'Evidence Quality',
    description: 'Quality of evidence supporting extracted properties',
    weight: 0.3
  },
  valueAccuracy: {
    key: 'valueAccuracy',
    label: 'Value Accuracy',
    description: 'Accuracy of extracted property values',
    weight: 0.3
  }
};

/**
 * Helper function to extract rating value (1-5 scale)
 */
const getRatingValue = (ratingData) => {
  if (ratingData === null || ratingData === undefined) return null;
  if (typeof ratingData === 'number') return ratingData;
  if (typeof ratingData === 'object') {
    return ratingData.rating ?? ratingData.value ?? ratingData.score ?? null;
  }
  return null;
};

/**
 * Content Paper Detail Component - FIXED VERSION
 */
const ContentPaperDetail = ({ 
  groundTruth, 
  systemData, 
  evaluation,
  paperData,
  selectedEvaluation,
  selectedEvaluationIndex 
}) => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 ContentPaperDetail: FIXED VERSION');
  console.log('═══════════════════════════════════════════════════════');
  
  // State
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [showQualityMetrics, setShowQualityMetrics] = useState(true);
  
  // ============================================================================
  // EXTRACT DATA FROM CORRECT PATHS
  // ============================================================================
  
  // Get content accuracy data (per-property metrics)
  const contentAccuracy = evaluation?.evaluationMetrics?.accuracy?.content || {};
  
  // Get content overall data (includes userRatings)
  const contentOverall = evaluation?.evaluationMetrics?.overall?.content || {};
  
  // Get user ratings - they're directly on contentOverall, not nested
  const userRatings = contentOverall.userRatings || {};
  
  console.log('Content data sources:', {
    contentAccuracyKeys: Object.keys(contentAccuracy).slice(0, 5),
    contentOverallKeys: Object.keys(contentOverall).slice(0, 5),
    hasUserRatings: Object.keys(userRatings).length > 0,
    userRatingsKeys: Object.keys(userRatings)
  });
  
  // ============================================================================
  // CALCULATE OVERALL SCORE FROM PROPERTY SCORES
  // ============================================================================
  
  const { overallScore, accuracyScore, propertyScores } = useMemo(() => {
    const scores = [];
    const propertyDetails = [];
    
    // Check for _aggregate first
    if (contentAccuracy._aggregate?.finalScore !== undefined) {
      console.log('Found _aggregate score:', contentAccuracy._aggregate.finalScore);
      return {
        overallScore: contentAccuracy._aggregate.finalScore,
        accuracyScore: contentAccuracy._aggregate.automatedScore || contentAccuracy._aggregate.finalScore,
        propertyScores: []
      };
    }
    
    // Calculate by averaging property scores
    Object.entries(contentAccuracy).forEach(([key, value]) => {
      if (key === '_aggregate' || key.startsWith('_')) return;
      
      const finalScore = value?.scoreDetails?.finalScore ?? 
                        value?.similarityData?.overallScore ?? 
                        value?.similarity ?? 
                        null;
      
      if (finalScore !== null && typeof finalScore === 'number') {
        scores.push(finalScore);
        propertyDetails.push({
          name: key,
          score: finalScore,
          hasData: value?.hasData ?? value?.details?.hasData ?? null
        });
      }
    });
    
    const avgScore = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
      : 0;
    
    console.log(`Calculated overall score from ${scores.length} properties:`, avgScore);
    
    return {
      overallScore: avgScore,
      accuracyScore: avgScore,
      propertyScores: propertyDetails
    };
  }, [contentAccuracy]);
  
  // ============================================================================
  // CALCULATE QUALITY SCORE FROM USER RATINGS
  // ============================================================================
  
  const { qualityScore, averageUserRating } = useMemo(() => {
    let totalWeighted = 0;
    let totalWeight = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    
    Object.entries(QUALITY_METRICS).forEach(([key, metric]) => {
      const ratingValue = getRatingValue(userRatings[metric.key]);
      if (ratingValue !== null && ratingValue > 0) {
        const normalizedRating = ratingValue / 5;
        totalWeighted += normalizedRating * metric.weight;
        totalWeight += metric.weight;
        ratingSum += ratingValue;
        ratingCount++;
      }
    });
    
    // Also check for overall assessment
    const overallAssessment = getRatingValue(userRatings.overallAssessment);
    if (overallAssessment !== null && overallAssessment > 0) {
      ratingSum += overallAssessment;
      ratingCount++;
    }
    
    return {
      qualityScore: totalWeight > 0 ? totalWeighted / totalWeight : 0,
      averageUserRating: ratingCount > 0 ? ratingSum / ratingCount : 0
    };
  }, [userRatings]);
  
  // Get user info
  const expertiseMultiplier = userRatings.expertiseMultiplier || 
                             evaluation?.userInfo?.expertiseMultiplier || 
                             1.0;
  const userName = evaluation?.userInfo?.firstName || 'User';
  
  // ============================================================================
  // EXTRACT AND MERGE PROPERTIES
  // ============================================================================
  
  // Get extracted properties from systemData
  const extractedPropertiesObj = evaluation?.systemData?.paperContent?.paperContent || 
                                 systemData?.paperContent?.paperContent || {};
  
  const mergedProperties = useMemo(() => {
    const properties = Object.entries(extractedPropertiesObj).map(([key, property]) => {
      const propertyLabel = property.label || property.property || key;
      
      // Find matching accuracy metrics using normalized key matching
      const normalizeKey = (str) => str.toLowerCase().replace(/[-_\s]/g, '');
      const normalizedLabel = normalizeKey(propertyLabel);
      
      let metrics = null;
      
      // Try direct label match first
      for (const [accKey, accValue] of Object.entries(contentAccuracy)) {
        if (accKey === '_aggregate' || accKey.startsWith('_')) continue;
        
        const normalizedAccKey = normalizeKey(accKey);
        if (normalizedAccKey === normalizedLabel) {
          metrics = { key: accKey, ...accValue };
          break;
        }
      }
      
      return {
        key,
        ...property,
        metrics,
        value: property.values?.[0]?.value || property.value,
        confidence: property.values?.[0]?.confidence || property.confidence,
        evidence: property.values?.[0]?.evidence || property.evidence
      };
    });
    
    return properties;
  }, [extractedPropertiesObj, contentAccuracy]);

  // Calculate data coverage
  const dataCoverage = useMemo(() => {
    const withData = mergedProperties.filter(p => 
      p.metrics?.hasData === true || p.metrics?.details?.hasData === true
    ).length;
    const withoutData = mergedProperties.filter(p => 
      p.metrics?.hasData === false || p.metrics?.details?.hasData === false
    ).length;
    const unknown = mergedProperties.length - withData - withoutData;
    
    return { withData, withoutData, unknown, total: mergedProperties.length };
  }, [mergedProperties]);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Content Analysis
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-purple-600">
            <Brain className="h-3 w-3 mr-1" />
            LLM-Generated
          </Badge>
          <Badge className={getScoreColorClass(overallScore)}>
            Overall: {formatPercentage(overallScore)}
          </Badge>
        </div>
      </div>

      {/* LLM Generation Notice */}
      <Alert className="bg-purple-50 border-purple-200">
        <Brain className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <p className="text-sm">
            Content properties are extracted from paper sections using LLM-based analysis. 
            Each property is validated against the source text with evidence tracking.
            No ORKG ground truth exists for content - evaluation is based on extraction quality.
          </p>
        </AlertDescription>
      </Alert>

      {/* Overall Score Card */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Content Score</p>
            <p className="text-3xl font-bold text-indigo-700">
              {formatPercentage(overallScore)}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Automated:</span> {formatPercentage(accuracyScore)}
              </div>
              {qualityScore > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Quality:</span> {formatPercentage(qualityScore)}
                </div>
              )}
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Properties:</span> {mergedProperties.length}
              </div>
              {averageUserRating > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Avg Rating:</span> {averageUserRating.toFixed(1)}/5
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <StatusIndicator score={overallScore} size="large" />
          </div>
        </div>
      </Card>

      {/* Property Scores Summary */}
      {propertyScores.length > 0 && (
        <Card className="p-4">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Property Score Distribution
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {propertyScores.slice(0, 8).map((prop, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded border text-center">
                <p className="text-xs text-gray-500 truncate" title={prop.name}>
                  {prop.name.replace(/_/g, ' ')}
                </p>
                <p className={`text-lg font-bold ${getScoreTextColor(prop.score)}`}>
                  {formatPercentage(prop.score)}
                </p>
              </div>
            ))}
          </div>
          {propertyScores.length > 8 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              + {propertyScores.length - 8} more properties
            </p>
          )}
        </Card>
      )}

      {/* Data Coverage Summary */}
      {dataCoverage.total > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            Data Coverage
          </h5>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{dataCoverage.withData}</p>
              <p className="text-xs text-gray-600 mt-1">With Data</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-700">{dataCoverage.withoutData}</p>
              <p className="text-xs text-gray-600 mt-1">No Data</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">
                {dataCoverage.withData + dataCoverage.withoutData > 0 
                  ? formatPercentage(dataCoverage.withData / (dataCoverage.withData + dataCoverage.withoutData))
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-600 mt-1">Data Rate</p>
            </div>
          </div>
          {/* Visual Bar */}
          <div className="flex h-3 rounded-full overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${(dataCoverage.withData / dataCoverage.total) * 100}%` }}
            />
            <div 
              className="bg-red-500" 
              style={{ width: `${(dataCoverage.withoutData / dataCoverage.total) * 100}%` }}
            />
            <div 
              className="bg-gray-300" 
              style={{ width: `${(dataCoverage.unknown / dataCoverage.total) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* User Quality Ratings Section */}
      {Object.keys(userRatings).length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Quality Evaluation by {userName}
            </h5>
            <button
              onClick={() => setShowQualityMetrics(!showQualityMetrics)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showQualityMetrics ? (
                <>Hide <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>
          
          {showQualityMetrics && (
            <div className="space-y-4">
              {/* Expertise Multiplier */}
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Expertise Multiplier
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {expertiseMultiplier.toFixed(2)}×
                  </span>
                </div>
              </div>

              {/* Individual Quality Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(QUALITY_METRICS).map(([key, metric]) => {
                  const ratingValue = getRatingValue(userRatings[metric.key]);
                  if (ratingValue === null || ratingValue === 0) return null;
                  
                  return (
                    <RatingDisplay
                      key={key}
                      label={metric.label}
                      value={ratingValue}
                      description={metric.description}
                      weight={metric.weight}
                    />
                  );
                })}
              </div>

              {/* Overall Assessment */}
              {userRatings.overallAssessment && (
                <div className="p-4 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-900">
                      Overall Assessment
                    </span>
                    <span className="text-2xl font-bold text-purple-700">
                      {getRatingValue(userRatings.overallAssessment)?.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${(getRatingValue(userRatings.overallAssessment) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Extracted Properties */}
      {mergedProperties.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              Extracted Properties ({mergedProperties.length})
            </h5>
            <button
              onClick={() => setShowProperties(!showProperties)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showProperties ? (
                <>Hide <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>
          
          {showProperties && (
            <div className="space-y-3">
              {mergedProperties.map((property, index) => (
                <PropertyDisplay 
                  key={property.key} 
                  property={property}
                  index={index}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* No Data Alert */}
      {mergedProperties.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No content properties were found for this evaluation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Rating Display Component
 */
const RatingDisplay = ({ label, value, description, weight }) => {
  const percentage = (value / 5) * 100;
  
  return (
    <div className="p-3 bg-gray-50 rounded border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <Badge variant="outline" className="text-xs">
            {(weight * 100).toFixed(0)}%
          </Badge>
        </div>
        <span className="text-lg font-bold text-gray-700">
          {value.toFixed(1)}/5
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
};

/**
 * Property Display Component
 */
const PropertyDisplay = ({ property, index }) => {
  const [showEvidence, setShowEvidence] = useState(false);
  
  const metrics = property.metrics;
  const hasData = metrics?.hasData ?? metrics?.details?.hasData ?? null;
  const finalScore = metrics?.scoreDetails?.finalScore ?? metrics?.similarityData?.overallScore ?? null;
  
  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200">
      {/* Header Row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
        <span className="text-sm font-semibold text-gray-900">
          {property.label || property.property || property.key}
        </span>
        {property.type && (
          <Badge variant="outline" className="text-xs">{property.type}</Badge>
        )}
        {hasData === true && (
          <Badge className="text-xs bg-green-600">Has Data</Badge>
        )}
        {hasData === false && (
          <Badge variant="destructive" className="text-xs">No Data</Badge>
        )}
        {finalScore !== null && (
          <Badge className={`text-xs ${getScoreColorClass(finalScore)}`}>
            Score: {formatPercentage(finalScore)}
          </Badge>
        )}
      </div>
      
      {/* Property Value */}
      {property.value && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1 font-medium">Extracted Value:</p>
          <div className="p-3 bg-white rounded border border-gray-300">
            <p className="text-sm text-gray-800">
              {typeof property.value === 'object' 
                ? JSON.stringify(property.value, null, 2)
                : property.value}
            </p>
          </div>
        </div>
      )}
      
      {/* Confidence */}
      {property.confidence !== null && property.confidence !== undefined && (
        <div className="mb-3">
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            Confidence: {(property.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      )}
      
      {/* Evidence Section */}
      {property.evidence && Object.keys(property.evidence).length > 0 && (
        <div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {showEvidence ? (
              <>Hide Evidence <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show Evidence ({Object.keys(property.evidence).length} sections) <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
          
          {showEvidence && (
            <div className="mt-2 space-y-2">
              {Object.entries(property.evidence).map(([section, data], idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">📄 {section}</p>
                  {data.text && (
                    <p className="text-xs text-gray-700 bg-white p-2 rounded">
                      "{typeof data.text === 'string' 
                        ? (data.text.substring(0, 200) + (data.text.length > 200 ? '...' : ''))
                        : JSON.stringify(data.text)}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Accuracy Metrics */}
      {metrics && (metrics.precision !== undefined || metrics.recall !== undefined) && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {metrics.precision !== undefined && (
            <div className="p-2 bg-white rounded border text-center">
              <p className="text-xs text-gray-500">Precision</p>
              <p className="text-sm font-bold">{formatPercentage(metrics.precision)}</p>
            </div>
          )}
          {metrics.recall !== undefined && (
            <div className="p-2 bg-white rounded border text-center">
              <p className="text-xs text-gray-500">Recall</p>
              <p className="text-sm font-bold">{formatPercentage(metrics.recall)}</p>
            </div>
          )}
          {metrics.f1Score !== undefined && (
            <div className="p-2 bg-white rounded border text-center">
              <p className="text-xs text-gray-500">F1 Score</p>
              <p className="text-sm font-bold">{formatPercentage(metrics.f1Score)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Status Indicator Component
 */
const StatusIndicator = ({ score, size = 'medium' }) => {
  const iconSize = size === 'large' ? 48 : size === 'medium' ? 32 : 24;
  
  if (score >= 0.8) {
    return <CheckCircle size={iconSize} className="text-green-500" />;
  } else if (score >= 0.6) {
    return <AlertCircle size={iconSize} className="text-yellow-500" />;
  } else if (score >= 0.4) {
    return <AlertCircle size={iconSize} className="text-orange-500" />;
  } else {
    return <XCircle size={iconSize} className="text-red-500" />;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreColorClass(score) {
  if (score >= 0.9) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 0.7) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (score >= 0.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (score >= 0.3) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

function getScoreTextColor(score) {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

function getProgressColor(percentage) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

export default ContentPaperDetail;