// File: src/components/dashboard/views/accuracy/paper-detail/ResearchProblemPaperDetail.jsx
// CORRECTED VERSION - Fixed data paths and using existing ThreeWayComparison component

import React, { useState } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { 
  CheckCircle, XCircle, AlertCircle, Target, 
  TrendingUp, Info, ChevronDown, ChevronUp, Star
} from 'lucide-react';
import ThreeWayComparison from './ThreeWayComparison';

/**
 * Research Problem Quality Metrics Configuration
 * Matches the evaluation form structure
 */
const QUALITY_METRICS = {
  problemTitle: {
    key: 'problemTitle',
    label: 'Problem Title',
    description: 'How well the problem title captures the research focus',
    weight: 0.3
  },
  problemDescription: {
    key: 'problemDescription',
    label: 'Problem Description',
    description: 'Clarity and completeness of the problem description',
    weight: 0.3
  },
  relevance: {
    key: 'relevance',
    label: 'Relevance',
    description: 'How well the problem aligns with the paper content',
    weight: 0.2
  },
  completeness: {
    key: 'completeness',
    label: 'Completeness',
    description: 'Whether the problem captures all key aspects from the paper',
    weight: 0.0 // Not in qualityWeights, shown separately
  },
  evidenceQuality: {
    key: 'evidenceQuality',
    label: 'Evidence Quality',
    description: 'Quality of evidence supporting the problem formulation',
    weight: 0.2
  }
};

/**
 * Accuracy Metrics Configuration
 */
const ACCURACY_METRICS = {
  titleAlignment: {
    key: 'titleAlignment',
    label: 'Title Alignment',
    description: 'Accuracy of title extraction',
    weight: 0.4
  },
  contentCoverage: {
    key: 'contentCoverage',
    label: 'Content Coverage',
    description: 'Coverage of ground truth content',
    weight: 0.4
  },
  specificity: {
    key: 'specificity',
    label: 'Specificity',
    description: 'Problem definition clarity',
    weight: 0.2
  }
};

/**
 * Helper function to extract rating value from rating object or direct value
 */
const getRatingValue = (ratingData) => {
  if (ratingData === null || ratingData === undefined) return null;
  
  // If it's already a number, return it
  if (typeof ratingData === 'number') return ratingData;
  
  // If it's an object, try to extract the rating
  if (typeof ratingData === 'object') {
    return ratingData.rating ?? ratingData.value ?? ratingData.score ?? null;
  }
  
  return null;
};

/**
 * Helper function to extract comments from rating object
 */
const getComments = (ratingData) => {
  if (!ratingData || typeof ratingData !== 'object') return null;
  return ratingData.comments ?? ratingData.comment ?? null;
};

/**
 * Research Problem Paper Detail - CORRECTED VERSION
 * Fixed data paths and using existing ThreeWayComparison component
 */
const ResearchProblemPaperDetail = ({ 
  groundTruth, 
  systemData, 
  evaluation,
  paperData,
  selectedEvaluation,
  selectedEvaluationIndex 
}) => {
  // State
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showUserRatings, setShowUserRatings] = useState(true);
  const [showQualityMetrics, setShowQualityMetrics] = useState(true);
  const [showAccuracyMetrics, setShowAccuracyMetrics] = useState(false);
  
  // Extract data with proper fallback paths
  const researchProblems = systemData?.researchProblems || {};
  const selectedProblem = researchProblems?.selectedProblem || researchProblems?.llm_problem;
  const isLLMGenerated = selectedProblem?.isLLMGenerated !== false;
  
  // Get evaluation data - CORRECTED PATH (no redundant nesting)
  const rpEvaluation = evaluation?.evaluationMetrics?.overall?.research_problem;
  
  // Accuracy data directly under rpEvaluation
  const rpAccuracy = rpEvaluation?.overall?.research_problem?.accuracy;
  
  // Get user ratings directly from rpEvaluation
  const userRatings = rpEvaluation?.overall?.research_problem?.userRatings || {};
  console.log('ResearchProblemPaperDetail', rpEvaluation, rpAccuracy, userRatings);
  
  // Extract scores from the corrected structure
  const overallAccuracy = rpAccuracy?.overallAccuracy;
  const similarityData = rpAccuracy?.similarityData;
  const scoreDetails = rpAccuracy?.scoreDetails;
  
  // Overall score: use finalScore from overallAccuracy or similarityData
  const overallScore = overallAccuracy?.finalScore || 
                      similarityData?.finalScore || 
                      overallAccuracy?.automated || 0;
  
  const qualityScore = rpEvaluation?.quality?.overallScore || 0;
  const accuracyScore = overallAccuracy?.automated || similarityData?.automatedOverallScore || 0;
  
  // Get user info
  const expertiseMultiplier = evaluation?.userInfo?.expertiseMultiplier || 1.0;
  const userName = evaluation?.userInfo?.userName || 'User';
  
  // Get automated score
  const automatedScore = overallAccuracy?.automated || 
                        similarityData?.automatedOverallScore || 
                        scoreDetails?.automatedScore || 0;

  // Calculate weighted quality score if we have user ratings
  const calculateWeightedQualityScore = () => {
    if (Object.keys(userRatings).length === 0) return 0;
    
    let totalWeighted = 0;
    let totalWeight = 0;
    
    Object.entries(QUALITY_METRICS).forEach(([key, metric]) => {
      if (metric.weight > 0 && userRatings[metric.key] !== undefined) {
        const ratingValue = getRatingValue(userRatings[metric.key]);
        if (ratingValue !== null) {
          const normalizedRating = ratingValue / 5; // Convert 0-5 to 0-1
          totalWeighted += normalizedRating * metric.weight;
          totalWeight += metric.weight;
        }
      }
    });
    
    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  };
  
  const calculatedQualityScore = calculateWeightedQualityScore();
  
  // Get overall assessment rating value
  const overallAssessmentValue = getRatingValue(userRatings.overallAssessment);

  // ============================================================================
  // PREPARE THREE-WAY COMPARISON DATA BASED ON SOURCE TYPE
  // ============================================================================
  
  // Prepare props for ThreeWayComparison component - conditional based on source
  const threeWayProps = (() => {
    if (isLLMGenerated) {
      // For LLM: Ground Truth is abstract (truncated), User Input is selected problem
      const abstractText = rpEvaluation?.groundTruth?.text || "";
      const words = abstractText.split(" ");
      const truncatedAbstract = words.length > 70 
        ? words.slice(0, 70).join(" ") + "..."
        : abstractText;
      
      return {
        groundTruth: truncatedAbstract || "N/A",
        userInput: selectedProblem?.title || "N/A",
        userDescription: selectedProblem?.description || null,
        systemValue: selectedProblem?.title || "N/A",
        systemDescription: selectedProblem?.description || null,
        evaluationScore: overallScore,
        label: "Research Problem",
        showMatchIndicators: true,
        footNote: words.length > 70 ? "Truncated abstract from paper" : null
      };
    } else {
      // For ORKG: Ground Truth is ORKG problem, User Input is user's assessment
      return {
        groundTruth: groundTruth?.research_problem || rpEvaluation?.groundTruth?.title || "N/A",
        userInput: overallAssessmentValue ? `Overall Assessment: ${overallAssessmentValue.toFixed(1)}/5` : "User Assessment",
        userDescription: calculatedQualityScore > 0 ? `Quality Score: ${formatPercentage(calculatedQualityScore)}` : null,
        userRating: overallAssessmentValue,
        systemValue: selectedProblem?.title || "N/A",
        systemDescription: selectedProblem?.description || null,
        evaluationScore: overallScore,
        label: "Research Problem",
        showMatchIndicators: false
      };
    }
  })();

  console.log('ResearchProblemPaperDetail Three-Way Props:', {
    isLLMGenerated,
    threeWayProps,
    overallAssessmentValue,
    calculatedQualityScore
  });

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-600" />
          Research Problem Analysis
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant={isLLMGenerated ? "default" : "secondary"}>
            {isLLMGenerated ? "LLM-Generated" : "ORKG"}
          </Badge>
          <Badge className={getScoreColorClass(overallScore)}>
            Overall: {formatPercentage(overallScore)}
          </Badge>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Accuracy Score</p>
            <p className="text-3xl font-bold text-orange-700">
              {formatPercentage(overallScore)}
            </p>
            <div className="flex items-center gap-4 mt-2">
              {qualityScore > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Quality:</span> {formatPercentage(qualityScore)}
                </div>
              )}
              {accuracyScore > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Accuracy:</span> {formatPercentage(accuracyScore)}
                </div>
              )}
              {automatedScore > 0 && automatedScore !== accuracyScore && (
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Automated:</span> {formatPercentage(automatedScore)}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <StatusIndicator score={overallScore} size="large" />
          </div>
        </div>
      </Card>

      {/* Three-Way Comparison - Using Existing Component */}
      <Card className="p-4">
        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Three-Way Comparison
        </h5>
        
        <ThreeWayComparison {...threeWayProps} />
      </Card>

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
                <>Hide Ratings <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show Ratings <ChevronDown className="h-4 w-4" /></>
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
                <p className="text-xs text-blue-600 mt-1">
                  User ratings are weighted by this expertise level
                </p>
              </div>

              {/* Weighted Quality Score */}
              {calculatedQualityScore > 0 && (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-900">
                      Weighted Quality Score
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {formatPercentage(calculatedQualityScore)}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Based on weighted quality metrics
                  </p>
                </div>
              )}

              {/* Overall Assessment */}
              {overallAssessmentValue !== null && (
                <div className="p-4 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-900">
                      Overall Assessment
                    </span>
                    <span className="text-2xl font-bold text-purple-700">
                      {overallAssessmentValue.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${(overallAssessmentValue / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    Comprehensive evaluation of the research problem formulation
                  </p>
                </div>
              )}

              {/* Individual Quality Metrics */}
              <div>
                <h6 className="text-sm font-semibold text-gray-900 mb-3">Quality Metrics</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(QUALITY_METRICS).map(([key, metric]) => {
                    const ratingValue = getRatingValue(userRatings[metric.key]);
                    if (ratingValue === null) return null;
                    
                    return (
                      <RatingDisplay
                        key={key}
                        label={metric.label}
                        value={ratingValue}
                        description={metric.description}
                        weight={metric.weight}
                        showWeight={metric.weight > 0}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Comments Section */}
              {Object.entries(QUALITY_METRICS).some(([key, metric]) => {
                const ratingData = userRatings[metric.key];
                const comment = getComments(ratingData) || userRatings[`${metric.key}Comments`];
                return comment !== null;
              }) && (
                <div className="mt-4">
                  <h6 className="text-sm font-semibold text-gray-900 mb-2">User Comments</h6>
                  <div className="space-y-2">
                    {Object.entries(QUALITY_METRICS).map(([key, metric]) => {
                      const ratingData = userRatings[metric.key];
                      const comment = getComments(ratingData) || userRatings[`${metric.key}Comments`];
                      if (!comment) return null;
                      
                      return (
                        <CommentDisplay 
                          key={key}
                          label={metric.label} 
                          comment={comment} 
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weight Distribution */}
              <WeightDistribution weights={QUALITY_METRICS} title="Quality Weights" />
            </div>
          )}
        </Card>
      )}

      {/* Accuracy Metrics Section */}
      {similarityData && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Automated Accuracy Metrics
            </h5>
            <button
              onClick={() => setShowAccuracyMetrics(!showAccuracyMetrics)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showAccuracyMetrics ? (
                <>Hide Metrics <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show Metrics <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>

          {showAccuracyMetrics && (
            <div className="space-y-4">
              {/* Accuracy Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(ACCURACY_METRICS).map(([key, metric]) => {
                  const value = similarityData[metric.key];
                  if (value === undefined) return null;
                  
                  return (
                    <MetricCard
                      key={key}
                      label={metric.label}
                      value={value}
                      description={metric.description}
                      weight={metric.weight}
                    />
                  );
                })}
              </div>

              {/* Additional Similarity Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {similarityData.precision !== undefined && (
                  <MetricCard
                    label="Precision"
                    value={similarityData.precision}
                    description="Accuracy of extracted content"
                  />
                )}
                {similarityData.recall !== undefined && (
                  <MetricCard
                    label="Recall"
                    value={similarityData.recall}
                    description="Coverage of ground truth"
                  />
                )}
                {similarityData.f1Score !== undefined && (
                  <MetricCard
                    label="F1 Score"
                    value={similarityData.f1Score}
                    description="Balanced accuracy measure"
                  />
                )}
              </div>

              {/* Weight Distribution */}
              <WeightDistribution weights={ACCURACY_METRICS} title="Accuracy Weights" />
            </div>
          )}
        </Card>
      )}

      {/* Calculation Matrix Section */}
      {(similarityData || scoreDetails) && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-purple-600" />
              Score Calculation Details
            </h5>
            <button
              onClick={() => setShowCalculationDetails(!showCalculationDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showCalculationDetails ? (
                <>Hide Details <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show Details <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>

          {showCalculationDetails && (
            <div className="space-y-4">
              {/* Score Breakdown Table */}
              {scoreDetails && (
                <CalculationMatrix
                  scoreDetails={scoreDetails}
                  automatedScore={automatedScore}
                  overallScore={overallScore}
                  qualityScore={qualityScore}
                  accuracyScore={accuracyScore}
                  expertiseMultiplier={expertiseMultiplier}
                />
              )}
            </div>
          )}
        </Card>
      )}

      {/* Problem Details */}
      {selectedProblem && (
        <Card className="p-4">
          <h5 className="font-semibold text-gray-900 mb-3">Problem Details</h5>
          
          <div className="space-y-3">
            {/* Title */}
            <div>
              <p className="text-xs text-gray-600 mb-1">Title</p>
              <p className="text-sm font-medium text-gray-900">
                {selectedProblem.title || 'N/A'}
              </p>
            </div>

            {/* Description */}
            {selectedProblem.description && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Description</p>
                <p className="text-sm text-gray-700">
                  {selectedProblem.description}
                </p>
              </div>
            )}

            {/* Additional Fields */}
            {selectedProblem.domain && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Domain</p>
                <p className="text-sm text-gray-700">{selectedProblem.domain}</p>
              </div>
            )}

            {selectedProblem.motivation && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Motivation</p>
                <p className="text-sm text-gray-700">{selectedProblem.motivation}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Configuration Display */}
      {rpEvaluation?.config && (
        <Card className="p-4">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Evaluation Configuration
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Use Abstract:</span>
              <span className="font-medium">{rpEvaluation.config.useAbstract ? 'Yes' : 'No'}</span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Accuracy Weights:</p>
              {rpEvaluation.config.accuracyWeights && Object.entries(rpEvaluation.config.accuracyWeights).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs ml-2">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono">{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Quality Weights:</p>
              {rpEvaluation.config.qualityWeights && Object.entries(rpEvaluation.config.qualityWeights).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs ml-2">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono">{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* No Data Alert */}
      {!selectedProblem && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No research problem data available for this evaluation.
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
const RatingDisplay = ({ label, value, description, weight, showWeight }) => {
  const percentage = (value / 5) * 100;
  
  return (
    <div className="p-3 bg-gray-50 rounded border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          {showWeight && (
            <Badge variant="outline" className="text-xs">
              {(weight * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
        <span className="text-lg font-bold text-gray-700">
          {value.toFixed(1)}/5
        </span>
      </div>
      
      {/* Progress Bar */}
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
 * Comment Display Component
 */
const CommentDisplay = ({ label, comment }) => {
  return (
    <div className="p-2 bg-gray-50 rounded border border-gray-200">
      <p className="text-xs font-medium text-gray-700 mb-1">{label}:</p>
      <p className="text-xs text-gray-600 italic">{comment}</p>
    </div>
  );
};

/**
 * Weight Distribution Component
 */
const WeightDistribution = ({ weights, title }) => {
  const totalWeight = Object.values(weights)
    .filter(m => m.weight > 0)
    .reduce((sum, m) => sum + m.weight, 0);
  
  return (
    <div className="p-3 bg-gray-50 rounded border">
      <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
      <div className="space-y-1">
        {Object.entries(weights)
          .filter(([_, metric]) => metric.weight > 0)
          .map(([key, metric]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{metric.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${(metric.weight / totalWeight) * 100}%` }}
                  />
                </div>
                <span className="text-gray-900 font-mono w-12 text-right">
                  {(metric.weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

/**
 * Calculation Matrix Component
 */
const CalculationMatrix = ({ 
  scoreDetails, 
  automatedScore, 
  overallScore,
  qualityScore,
  accuracyScore,
  expertiseMultiplier 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left border">Component</th>
            <th className="p-2 text-right border">Value</th>
            <th className="p-2 text-left border">Description</th>
          </tr>
        </thead>
        <tbody>
          {/* Automated Score */}
          <tr className="border-b bg-blue-50">
            <td className="p-2 border font-medium">Automated Score</td>
            <td className="p-2 border text-right font-mono">
              {formatPercentage(automatedScore)}
            </td>
            <td className="p-2 border text-gray-600">
              System's calculated accuracy
            </td>
          </tr>

          {/* Quality Score */}
          {qualityScore > 0 && (
            <tr className="border-b bg-green-50">
              <td className="p-2 border font-medium">Quality Score</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(qualityScore)}
              </td>
              <td className="p-2 border text-gray-600">
                User quality assessment
              </td>
            </tr>
          )}

          {/* Accuracy Score */}
          {accuracyScore > 0 && (
            <tr className="border-b bg-yellow-50">
              <td className="p-2 border font-medium">Accuracy Score</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(accuracyScore)}
              </td>
              <td className="p-2 border text-gray-600">
                Combined accuracy metrics
              </td>
            </tr>
          )}

          {/* User Rating */}
          {scoreDetails.userRating !== undefined && (
            <tr className="border-b">
              <td className="p-2 border font-medium">User Rating</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(scoreDetails.userRating)}
              </td>
              <td className="p-2 border text-gray-600">
                Expert's assessment
              </td>
            </tr>
          )}

          {/* System Confidence */}
          {scoreDetails.systemConfidence !== undefined && (
            <tr className="border-b">
              <td className="p-2 border font-medium">System Confidence</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(scoreDetails.systemConfidence)}
              </td>
              <td className="p-2 border text-gray-600">
                U-shaped confidence curve
              </td>
            </tr>
          )}

          {/* Automated Weight */}
          {scoreDetails.automatedWeight !== undefined && (
            <tr className="border-b">
              <td className="p-2 border font-medium">Automated Weight</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(scoreDetails.automatedWeight)}
              </td>
              <td className="p-2 border text-gray-600">
                Weight applied to system score
              </td>
            </tr>
          )}

          {/* User Weight */}
          {scoreDetails.userWeight !== undefined && (
            <tr className="border-b">
              <td className="p-2 border font-medium">User Weight</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(scoreDetails.userWeight)}
              </td>
              <td className="p-2 border text-gray-600">
                Weight applied to user rating (×{expertiseMultiplier.toFixed(2)})
              </td>
            </tr>
          )}

          {/* Agreement Level */}
          {scoreDetails.agreementLevel !== undefined && (
            <tr className="border-b">
              <td className="p-2 border font-medium">Agreement Level</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(scoreDetails.agreementLevel)}
              </td>
              <td className="p-2 border text-gray-600">
                Alignment between system and user
              </td>
            </tr>
          )}

          {/* Agreement Bonus */}
          {scoreDetails.agreementBonus !== undefined && scoreDetails.agreementBonus > 0 && (
            <tr className="border-b bg-green-50">
              <td className="p-2 border font-medium">Agreement Bonus</td>
              <td className="p-2 border text-right font-mono text-green-700">
                +{formatPercentage(scoreDetails.agreementBonus)}
              </td>
              <td className="p-2 border text-gray-600">
                Bonus for consensus
              </td>
            </tr>
          )}

          {/* Final Score */}
          <tr className="bg-orange-50 font-bold">
            <td className="p-2 border">Final Score</td>
            <td className="p-2 border text-right font-mono text-orange-700">
              {formatPercentage(overallScore)}
            </td>
            <td className="p-2 border text-gray-600">
              Human-system balanced result
            </td>
          </tr>
        </tbody>
      </table>

      {/* Calculation Formula */}
      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-2">Formula:</p>
        <code className="text-xs block bg-white p-2 rounded">
          Final = (Automated × AutoWeight) + (User × UserWeight) + AgreementBonus
        </code>
        {scoreDetails.automatedWeight !== undefined && (
          <code className="text-xs block bg-white p-2 rounded mt-2">
            = ({formatPercentage(automatedScore)} × {formatPercentage(scoreDetails.automatedWeight)}) + 
            ({formatPercentage(scoreDetails.userRating || 0)} × {formatPercentage(scoreDetails.userWeight || 0)}) + 
            {formatPercentage(scoreDetails.agreementBonus || 0)}
          </code>
        )}
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard = ({ label, value, description, weight }) => {
  return (
    <div className="p-3 bg-white border rounded">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-600">{label}</p>
        {weight !== undefined && (
          <Badge variant="outline" className="text-xs">
            {(weight * 100).toFixed(0)}%
          </Badge>
        )}
      </div>
      <p className="text-lg font-bold text-gray-900">
        {formatPercentage(value)}
      </p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
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
  } else {
    return <XCircle size={iconSize} className="text-red-500" />;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreColorClass(score) {
  if (score >= 0.9) {
    return 'bg-green-100 text-green-700 border-green-200';
  } else if (score >= 0.7) {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (score >= 0.5) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  } else if (score >= 0.3) {
    return 'bg-orange-100 text-orange-700 border-orange-200';
  } else {
    return 'bg-red-100 text-red-700 border-red-200';
  }
}

function getProgressColor(percentage) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreColor(score) {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.7) return 'text-blue-600';
  if (score >= 0.5) return 'text-yellow-600';
  if (score >= 0.3) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreIcon(score) {
  if (score >= 0.8) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  } else if (score >= 0.6) {
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  } else {
    return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

export default ResearchProblemPaperDetail;