// File: src/components/dashboard/views/accuracy/paper-detail/ResearchFieldPaperDetail.jsx
// ENHANCED VERSION - With all 4 user ratings and calculation transparency

import React, { useState } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { 
  Target, TrendingUp, Award, CheckCircle, 
  Star, ChevronDown, ChevronUp, Info, AlertCircle,
  BarChart3, Calculator, Percent
} from 'lucide-react';
import ThreeWayComparison from './ThreeWayComparison';
import ResearchFieldPredictionsTable from '../../../../evaluation/research-field/components/ResearchFieldPredictionsTable';

/**
 * Research Field Paper Detail Component - ENHANCED VERSION
 * Shows detailed research field analysis with ALL user ratings and transparent calculations
 */
const ResearchFieldPaperDetail = ({ groundTruth, evaluation, paperData, evaluationIndex }) => {
  // State
  const [showUserRatings, setShowUserRatings] = useState(true);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showQualityBreakdown, setShowQualityBreakdown] = useState(false);
  const [showWeightsExplainer, setShowWeightsExplainer] = useState(false);

  console.log("ResearchFieldPaperDetail: Received groundTruth =", groundTruth);
  console.log("ResearchFieldPaperDetail: Received evaluation =", evaluation);
  console.log("ResearchFieldPaperDetail: Received paperData =", paperData);
  console.log("ResearchFieldPaperDetail: Received evaluationIndex =", evaluationIndex);

  // Extract data for current evaluation
  const groundTruthField = groundTruth?.research_field_name;
  const userSelection = evaluation?.evaluationMetrics?.overall?.research_field?.selectedField;
  
  // Get predictions from systemData
  const systemPredictions = evaluation?.systemData?.researchFields?.fields || [];
  const topPrediction = systemPredictions[0]?.name;

  // Get accuracy and quality data from evaluation metrics (the source of truth)
  const rfAccuracy = evaluation?.evaluationMetrics?.overall?.research_field;
  console.log("ResearchFieldPaperDetail: rfAccuracy =", rfAccuracy);
  
  // Extract all user ratings
  const primaryFieldRating = rfAccuracy?.primaryField?.rating;
  const primaryFieldComments = rfAccuracy?.primaryField?.comments;
  const confidenceRating = rfAccuracy?.confidence?.rating;
  const confidenceComments = rfAccuracy?.confidence?.comments;
  const consistencyRating = rfAccuracy?.consistency?.rating;
  const consistencyComments = rfAccuracy?.consistency?.comments;
  const relevanceRating = rfAccuracy?.relevance?.rating;
  const relevanceComments = rfAccuracy?.relevance?.comments;
  const generalComments = rfAccuracy?.comments;

  // Get metrics data
  const accuracyMetrics = rfAccuracy?.accuracyMetrics;
  const qualityMetrics = rfAccuracy?.qualityMetrics;
  const config = rfAccuracy?.config;
  
  // Get similarity and score details
  const similarityData = accuracyMetrics?.similarityData;
  const accuracyScoreDetails = accuracyMetrics?.scoreDetails;
  const qualityScoreDetails = qualityMetrics?.scoreDetails;
  
  // Get user rating from accuracy metrics (this is the aggregated rating)
  const overallRating = accuracyScoreDetails?.normalizedRating 
    ? accuracyScoreDetails.normalizedRating * 5 
    : primaryFieldRating;
  const expertiseMultiplier = evaluation?.userInfo?.expertiseMultiplier || 1.0;

  // Get overall scores
  const accuracyScore = accuracyMetrics?.overallAccuracy?.value || 
                       similarityData?.overallScore || 
                       accuracyScoreDetails?.finalScore || 0;
  
  const qualityScore = qualityMetrics?.overallQuality?.value || 
                      qualityScoreDetails?.finalScore || 0;
  
  const overallScore = rfAccuracy?.overallScore || 0;

  // Get all evaluations for position distribution
  const allEvaluations = paperData?.userEvaluations || [];
  const hasMultipleEvaluations = allEvaluations.length > 1;

  // Check if we have user ratings
  const hasUserRatings = primaryFieldRating !== undefined || 
                         confidenceRating !== undefined || 
                         consistencyRating !== undefined || 
                         relevanceRating !== undefined;

  console.log('ResearchFieldPaperDetail final:', {
    doi: paperData?.doi,
    currentEvaluationIndex: evaluationIndex,
    totalEvaluations: allEvaluations.length,
    hasMultipleEvaluations,
    groundTruthField,
    userSelection,
    predictionsCount: systemPredictions.length,
    hasUserRatings,
    ratings: {
      primaryField: primaryFieldRating,
      confidence: confidenceRating,
      consistency: consistencyRating,
      relevance: relevanceRating
    },
    scores: {
      accuracy: accuracyScore,
      quality: qualityScore,
      overall: overallScore
    }
  });

  return (
    <div className="space-y-6 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Research Field Analysis
        </h4>
        <Badge className={getScoreColorClass(overallScore)}>
          Overall: {formatPercentage(overallScore)}
        </Badge>
      </div>

      {/* Score Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Accuracy Score */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Accuracy Score</span>
            {config?.overallWeights?.accuracy && (
              <Badge className="bg-blue-200 text-blue-800 text-xs">
                {formatPercentage(config.overallWeights.accuracy)} weight
              </Badge>
            )}
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {formatPercentage(accuracyScore)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Based on ground truth comparison
          </p>
        </Card>

        {/* Quality Score */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Quality Score</span>
            {config?.overallWeights?.quality && (
              <Badge className="bg-purple-200 text-purple-800 text-xs">
                {formatPercentage(config.overallWeights.quality)} weight
              </Badge>
            )}
          </div>
          <p className="text-3xl font-bold text-purple-700">
            {formatPercentage(qualityScore)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Based on confidence, relevance & consistency
          </p>
        </Card>

        {/* Overall Score */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Overall Score</span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {formatPercentage(overallScore)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Weighted combination of accuracy & quality
          </p>
        </Card>
      </div>

      {/* Overall Calculation Formula */}
      {config?.overallWeights && (
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Overall Score Calculation</span>
          </div>
          <div className="bg-white p-3 rounded border font-mono text-sm">
            <div className="text-gray-700">
              Overall Score = (Accuracy × {formatPercentage(config.overallWeights.accuracy)}) + 
              (Quality × {formatPercentage(config.overallWeights.quality)})
            </div>
            <div className="text-green-700 mt-2">
              = ({formatPercentage(accuracyScore)} × {formatPercentage(config.overallWeights.accuracy)}) + 
              ({formatPercentage(qualityScore)} × {formatPercentage(config.overallWeights.quality)})
            </div>
            <div className="text-green-800 font-bold mt-2 text-base">
              = {formatPercentage(overallScore)}
            </div>
          </div>
        </Card>
      )}

      {/* Three-Way Comparison */}
      <Card className="p-4">
        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Three-Way Comparison
        </h5>
        <ThreeWayComparison
          groundTruth={groundTruthField}
          userSelection={userSelection}
          systemPrediction={topPrediction}
          label="Research Field Comparison"
          showMatchIndicators={true}
          userRating={overallRating}
        />
      </Card>

      {/* User Ratings Section - All 4 Ratings */}
      {hasUserRatings && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              User Evaluation Ratings
            </h5>
            <button
              onClick={() => setShowUserRatings(!showUserRatings)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showUserRatings ? (
                <>Hide Ratings <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show Ratings <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>
          
          {showUserRatings && (
            <div className="space-y-4">
              {/* Expertise Multiplier Banner */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-blue-900">
                      Expertise Multiplier
                    </span>
                    <p className="text-xs text-blue-600 mt-1">
                      All ratings are weighted by user expertise level
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-blue-700">
                    {expertiseMultiplier.toFixed(2)}×
                  </span>
                </div>
              </div>

              {/* Individual Rating Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Field Detection */}
                {primaryFieldRating !== undefined && (
                  <UserRatingCard
                    title="Primary Field Detection"
                    description="Accuracy of main research field identification"
                    rating={primaryFieldRating}
                    comments={primaryFieldComments}
                    color="blue"
                    icon={Target}
                  />
                )}

                {/* Confidence Scores */}
                {confidenceRating !== undefined && (
                  <UserRatingCard
                    title="Confidence Scores"
                    description="Appropriateness of confidence scores"
                    rating={confidenceRating}
                    comments={confidenceComments}
                    color="purple"
                    icon={Percent}
                    weight={config?.qualityWeights?.confidence}
                  />
                )}

                {/* Overall Consistency */}
                {consistencyRating !== undefined && (
                  <UserRatingCard
                    title="Overall Consistency"
                    description="Consistency between suggested fields"
                    rating={consistencyRating}
                    comments={consistencyComments}
                    color="green"
                    icon={CheckCircle}
                    weight={config?.qualityWeights?.consistency}
                  />
                )}

                {/* Overall Relevance */}
                {relevanceRating !== undefined && (
                  <UserRatingCard
                    title="Overall Relevance"
                    description="Match between fields and paper content"
                    rating={relevanceRating}
                    comments={relevanceComments}
                    color="orange"
                    icon={Award}
                    weight={config?.qualityWeights?.relevance}
                  />
                )}
              </div>

              {/* General Comments */}
              {generalComments && (
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    General Comments
                  </p>
                  <p className="text-sm text-gray-900">{generalComments}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Quality Score Breakdown */}
      {qualityMetrics && config?.qualityWeights && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Quality Score Breakdown
            </h5>
            <button
              onClick={() => setShowQualityBreakdown(!showQualityBreakdown)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showQualityBreakdown ? (
                <>Hide Breakdown <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show Breakdown <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>

          {showQualityBreakdown && (
            <div className="space-y-4">
              {/* Quality Components Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Confidence */}
                <QualityComponentCard
                  label="Confidence"
                  value={qualityMetrics.confidence?.value}
                  weight={config.qualityWeights.confidence}
                  description="Score distribution appropriateness"
                  color="purple"
                />

                {/* Relevance */}
                <QualityComponentCard
                  label="Relevance"
                  value={qualityMetrics.relevance?.value}
                  weight={config.qualityWeights.relevance}
                  description="Field relevance to paper"
                  color="orange"
                />

                {/* Consistency */}
                <QualityComponentCard
                  label="Consistency"
                  value={qualityMetrics.consistency?.value}
                  weight={config.qualityWeights.consistency}
                  description="Inter-field consistency"
                  color="green"
                />
              </div>

              {/* Quality Calculation Formula */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">Quality Score Formula</span>
                </div>
                <div className="bg-white p-3 rounded border font-mono text-xs">
                  <div className="text-gray-700">
                    Quality = (Confidence × {formatPercentage(config.qualityWeights.confidence)}) + 
                    (Relevance × {formatPercentage(config.qualityWeights.relevance)}) + 
                    (Consistency × {formatPercentage(config.qualityWeights.consistency)})
                  </div>
                  {qualityMetrics.confidence?.value !== undefined && (
                    <div className="text-purple-700 mt-2">
                      = ({formatPercentage(qualityMetrics.confidence.value)} × {formatPercentage(config.qualityWeights.confidence)}) + 
                      ({formatPercentage(qualityMetrics.relevance?.value)} × {formatPercentage(config.qualityWeights.relevance)}) + 
                      ({formatPercentage(qualityMetrics.consistency?.value)} × {formatPercentage(config.qualityWeights.consistency)})
                    </div>
                  )}
                  <div className="text-purple-800 font-bold mt-2">
                    = {formatPercentage(qualityScore)}
                  </div>
                </div>
              </div>

              {/* Automated vs User-Influenced Scores */}
              {qualityScoreDetails && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-xs text-gray-600 mb-1">Automated Quality Score</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatPercentage(qualityMetrics?.automatedScore?.value || qualityMetrics?.qualityData?.automatedOverallScore)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Final Quality Score (with user ratings)</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatPercentage(qualityScore)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Predictions Table */}
      {systemPredictions.length > 0 && (
        <Card className="p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            System Predictions (Ranked)
          </h4>
          <ResearchFieldPredictionsTable
            groundTruth={groundTruthField}
            predictions={systemPredictions}
            selectedResearchField={userSelection}
            className="mt-2"
          />
        </Card>
      )}

      {/* Accuracy Calculation Details */}
      {(similarityData || accuracyScoreDetails) && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Accuracy Score Calculation Details
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
              {/* Accuracy Score Details Table */}
              {accuracyScoreDetails && (
                <AccuracyCalculationMatrix
                  scoreDetails={accuracyScoreDetails}
                  expertiseMultiplier={expertiseMultiplier}
                  rating={overallRating}
                />
              )}

              {/* Similarity Metrics Grid */}
              {similarityData && config?.accuracyWeights && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Exact Match */}
                    <MetricCard
                      icon={Target}
                      label="Exact Match"
                      value={similarityData.exactMatch}
                      weight={config.accuracyWeights.exactMatch || 0.4}
                      description="Top prediction matches ground truth"
                      color="blue"
                    />

                    {/* Top-3 Presence */}
                    <MetricCard
                      icon={Award}
                      label="Top-N Presence"
                      value={similarityData.topN}
                      weight={config.accuracyWeights.topN || 0.3}
                      description="Ground truth in top N predictions"
                      color="green"
                    />

                    {/* Position Score */}
                    <MetricCard
                      icon={TrendingUp}
                      label="Position Score"
                      value={similarityData.positionScore}
                      weight={config.accuracyWeights.positionScore || 0.3}
                      description="Rank-based scoring"
                      color="purple"
                      additionalInfo={
                        similarityData.foundPosition 
                          ? `Found at rank ${similarityData.foundPosition}` 
                          : 'Not found in predictions'
                      }
                    />
                  </div>

                  {/* Automated Accuracy Formula */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Automated Accuracy Formula</span>
                    </div>
                    <div className="bg-white p-3 rounded border font-mono text-xs">
                      <div className="text-gray-700">
                        Automated Accuracy = (Exact Match × {formatPercentage(config.accuracyWeights.exactMatch || 0.4)}) + 
                        (Top-N × {formatPercentage(config.accuracyWeights.topN || 0.3)}) + 
                        (Position × {formatPercentage(config.accuracyWeights.positionScore || 0.3)})
                      </div>
                      <div className="text-blue-700 mt-2">
                        = ({formatPercentage(similarityData.exactMatch)} × {formatPercentage(config.accuracyWeights.exactMatch || 0.4)}) + 
                        ({formatPercentage(similarityData.topN)} × {formatPercentage(config.accuracyWeights.topN || 0.3)}) + 
                        ({formatPercentage(similarityData.positionScore)} × {formatPercentage(config.accuracyWeights.positionScore || 0.3)})
                      </div>
                      <div className="text-blue-800 font-bold mt-2">
                        = {formatPercentage(similarityData.automatedOverallScore || similarityData.overallScore)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Metrics */}
              {similarityData?.recall !== undefined && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-xs text-gray-600 mb-1">Recall (Found Anywhere)</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatPercentage(similarityData.recall)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-xs text-gray-600 mb-1">F1 Score</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatPercentage(similarityData.f1Score)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Configuration Weights Explainer */}
      {config && (
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-600" />
              Evaluation Configuration
            </h5>
            <button
              onClick={() => setShowWeightsExplainer(!showWeightsExplainer)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {showWeightsExplainer ? (
                <>Hide Config <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show Config <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>

          {showWeightsExplainer && (
            <div className="space-y-4">
              {/* Overall Weights */}
              {config.overallWeights && (
                <div className="p-3 bg-white rounded border">
                  <h6 className="text-sm font-semibold text-gray-900 mb-2">Overall Score Weights</h6>
                  <div className="space-y-2">
                    <WeightBar
                      label="Accuracy"
                      weight={config.overallWeights.accuracy}
                      color="blue"
                    />
                    <WeightBar
                      label="Quality"
                      weight={config.overallWeights.quality}
                      color="purple"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    These weights determine how accuracy and quality scores are combined into the overall score.
                  </p>
                </div>
              )}

              {/* Quality Weights */}
              {config.qualityWeights && (
                <div className="p-3 bg-white rounded border">
                  <h6 className="text-sm font-semibold text-gray-900 mb-2">Quality Score Weights</h6>
                  <div className="space-y-2">
                    <WeightBar
                      label="Confidence"
                      weight={config.qualityWeights.confidence}
                      color="purple"
                    />
                    <WeightBar
                      label="Relevance"
                      weight={config.qualityWeights.relevance}
                      color="orange"
                    />
                    <WeightBar
                      label="Consistency"
                      weight={config.qualityWeights.consistency}
                      color="green"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    These weights determine how confidence, relevance, and consistency metrics are combined into the quality score.
                  </p>
                </div>
              )}

              {/* Accuracy Weights */}
              {config.accuracyWeights && (
                <div className="p-3 bg-white rounded border">
                  <h6 className="text-sm font-semibold text-gray-900 mb-2">Accuracy Score Weights</h6>
                  <div className="space-y-2">
                    {config.accuracyWeights.exactMatch !== undefined && (
                      <WeightBar
                        label="Exact Match"
                        weight={config.accuracyWeights.exactMatch}
                        color="blue"
                      />
                    )}
                    {config.accuracyWeights.topN !== undefined && (
                      <WeightBar
                        label="Top-N Presence"
                        weight={config.accuracyWeights.topN}
                        color="green"
                      />
                    )}
                    {config.accuracyWeights.positionScore !== undefined && (
                      <WeightBar
                        label="Position Score"
                        weight={config.accuracyWeights.positionScore}
                        color="purple"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    These weights determine how different accuracy metrics are combined into the automated accuracy score.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Position Analysis */}
      {similarityData?.foundPosition && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                Ground Truth Found Successfully
              </h4>
              <p className="text-sm text-green-700">
                The ground truth field "<strong>{groundTruthField}</strong>" was found at 
                rank <strong>{similarityData.foundPosition}</strong> in the system's predictions.
                {similarityData.foundPosition === 1 && (
                  <span className="ml-1">This is the top prediction! 🎉</span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Not Found Warning */}
      {similarityData && !similarityData.foundPosition && (
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-orange-900 mb-1">
                Ground Truth Not Found
              </h4>
              <p className="text-sm text-orange-700">
                The ground truth field "<strong>{groundTruthField}</strong>" was not found in 
                the system's top {systemPredictions.length} predictions. This indicates the system 
                may need improvement for this type of paper.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Position Distribution for Multiple Evaluations */}
      {hasMultipleEvaluations && (
        <Card className="p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Position Distribution Across All Evaluations
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            This paper has been evaluated {allEvaluations.length} time{allEvaluations.length !== 1 ? 's' : ''}. 
            Here's how each evaluation compared to the ground truth.
          </p>

          <div className="space-y-3">
            {allEvaluations.map((evaluationItem, idx) => {
              const evalGroundTruth = paperData.groundTruth?.research_field_name;
              const evalUserSelection = evaluationItem?.researchFieldAssessment?.selectedField;
              const evalSystemPredictions = evaluationItem?.researchFieldAssessment?.predictions || [];
              const evalSimilarityData = evaluationItem?.evaluationMetrics?.accuracy?.researchField?.similarityData;
              const evalPrimaryFieldRating = evaluationItem?.evaluationMetrics?.accuracy?.researchField?.rating;
            
              const evalTopPrediction = evalSystemPredictions[0]?.name;
              const evalPosition = evalSimilarityData?.foundPosition;
              const isCurrentEval = idx === evaluationIndex;
              
              return (
                <div 
                  key={evaluationItem.token || idx} 
                  className={`p-4 rounded-lg border-2 ${
                    isCurrentEval 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        Evaluation {idx + 1}
                        {isCurrentEval && (
                          <Badge className="bg-blue-500 text-white text-xs">Current</Badge>
                        )}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {evaluationItem.userInfo?.email || 'Unknown user'} • {new Date(evaluationItem.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {evalPosition ? (
                        <Badge className={`${
                          evalPosition === 1 
                            ? 'bg-green-500 text-white' 
                            : evalPosition <= 3
                            ? 'bg-blue-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}>
                          Position {evalPosition}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">Not Found</Badge>
                      )}
                      {evalPrimaryFieldRating && (
                        <div className="flex items-center gap-1">
                          <StarRating value={evalPrimaryFieldRating} size="small" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mini Three-Way Comparison */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-white rounded border border-red-200">
                      <p className="text-xs text-gray-600 mb-1">Ground Truth</p>
                      <p className="text-xs font-semibold text-gray-900 truncate" title={evalGroundTruth}>
                        {evalGroundTruth || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">User Selected</p>
                      <p className="text-xs font-semibold text-gray-900 truncate" title={evalUserSelection}>
                        {evalUserSelection || 'N/A'}
                      </p>
                      {evalUserSelection === evalGroundTruth && (
                        <span className="text-xs text-green-600">✓ Match</span>
                      )}
                    </div>
                    <div className="p-2 bg-white rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">System Top</p>
                      <p className="text-xs font-semibold text-gray-900 truncate" title={evalTopPrediction}>
                        {evalTopPrediction || 'N/A'}
                      </p>
                      {evalTopPrediction === evalGroundTruth && (
                        <span className="text-xs text-green-600">✓ Match</span>
                      )}
                    </div>
                  </div>

                  {/* Accuracy Score */}
                  {evalSimilarityData && (
                    <div className="mt-3 p-2 bg-white rounded border flex items-center justify-between">
                      <span className="text-xs text-gray-600">Accuracy Score:</span>
                      <span className="text-sm font-bold text-purple-600">
                        {formatPercentage(evalSimilarityData.overallScore || evalSimilarityData.automatedOverallScore)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * User Rating Card - Shows individual rating with comments
 */
const UserRatingCard = ({ title, description, rating, comments, color, icon: Icon, weight }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
    green: 'border-green-200 bg-green-50',
    orange: 'border-orange-200 bg-orange-50'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColorClasses[color]}`} />
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {weight !== undefined && (
          <Badge className="bg-white text-gray-700 text-xs">
            {formatPercentage(weight)}
          </Badge>
        )}
      </div>

      <p className="text-xs text-gray-600 mb-3">{description}</p>

      {/* Star Rating */}
      <div className="flex items-center gap-2 mb-2">
        <StarRating value={rating} size="medium" />
        <span className="text-sm font-bold text-gray-700">{rating.toFixed(1)}/5</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${getProgressColor((rating / 5) * 100)}`}
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>

      {/* Comments */}
      {comments && (
        <div className="mt-3 p-2 bg-white rounded border">
          <p className="text-xs text-gray-600 mb-1">Comments:</p>
          <p className="text-xs text-gray-900">{comments}</p>
        </div>
      )}
    </Card>
  );
};

/**
 * Quality Component Card
 */
const QualityComponentCard = ({ label, value, weight, description, color }) => {
  const colorClasses = {
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    green: 'border-green-200 bg-green-50 text-green-700'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <Badge className="bg-white text-gray-700 text-xs">
          {formatPercentage(weight)} weight
        </Badge>
      </div>
      <p className={`text-2xl font-bold mb-1 ${colorClasses[color].split(' ')[2]}`}>
        {formatPercentage(value)}
      </p>
      <p className="text-xs text-gray-600">{description}</p>
    </Card>
  );
};

/**
 * Weight Bar Component
 */
const WeightBar = ({ label, weight, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900">{formatPercentage(weight)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${weight * 100}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Star Rating Component
 */
const StarRating = ({ value, size = 'medium' }) => {
  const starSize = size === 'small' ? 'h-3 w-3' : size === 'medium' ? 'h-4 w-4' : 'h-5 w-5';
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`${starSize} fill-yellow-400 text-yellow-400`} />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className={`${starSize} text-yellow-400`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      ))}
    </div>
  );
};

/**
 * Accuracy Calculation Matrix Component
 */
const AccuracyCalculationMatrix = ({ scoreDetails, expertiseMultiplier, rating }) => {
  if (!scoreDetails) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border">
        <thead className="bg-gray-100">
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
              {formatPercentage(scoreDetails.automatedScore || 0)}
            </td>
            <td className="p-2 border text-gray-600">
              System's calculated accuracy from ground truth comparison
            </td>
          </tr>

          {/* User Rating */}
          {rating !== undefined && (
            <>
              <tr className="border-b">
                <td className="p-2 border font-medium">User Rating (Raw)</td>
                <td className="p-2 border text-right font-mono">
                  {rating.toFixed(1)}/5
                </td>
                <td className="p-2 border text-gray-600">
                  Expert's assessment of primary field accuracy
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 border font-medium">User Rating (Normalized)</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.normalizedRating || (rating / 5))}
                </td>
                <td className="p-2 border text-gray-600">
                  Rating scaled to 0-1 range
                </td>
              </tr>
            </>
          )}

          {/* System Confidence */}
          {scoreDetails.automaticConfidence !== undefined && (
            <tr className="border-b">
              <td className="p-2 border font-medium">System Confidence</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(scoreDetails.automaticConfidence)}
              </td>
              <td className="p-2 border text-gray-600">
                U-shaped confidence curve based on score
              </td>
            </tr>
          )}

          {/* Weights */}
          {scoreDetails.automaticWeight !== undefined && (
            <>
              <tr className="border-b">
                <td className="p-2 border font-medium">Automated Weight</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.automaticWeight)}
                </td>
                <td className="p-2 border text-gray-600">
                  Weight for system score (based on confidence)
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 border font-medium">User Weight</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.userWeight)}
                </td>
                <td className="p-2 border text-gray-600">
                  Weight for user rating (×{expertiseMultiplier.toFixed(2)} expertise)
                </td>
              </tr>
              {scoreDetails.rawAutomaticWeight !== undefined && (
                <tr className="border-b bg-gray-50">
                  <td className="p-2 border text-xs italic pl-4">Raw Automatic Weight</td>
                  <td className="p-2 border text-right font-mono text-gray-600">
                    {formatPercentage(scoreDetails.rawAutomaticWeight)}
                  </td>
                  <td className="p-2 border text-gray-500 text-xs">
                    Before normalization
                  </td>
                </tr>
              )}
              {scoreDetails.rawUserWeight !== undefined && (
                <tr className="border-b bg-gray-50">
                  <td className="p-2 border text-xs italic pl-4">Raw User Weight</td>
                  <td className="p-2 border text-right font-mono text-gray-600">
                    {formatPercentage(scoreDetails.rawUserWeight)}
                  </td>
                  <td className="p-2 border text-gray-500 text-xs">
                    Before normalization
                  </td>
                </tr>
              )}
            </>
          )}

          {/* Agreement */}
          {scoreDetails.agreement !== undefined && (
            <>
              <tr className="border-b">
                <td className="p-2 border font-medium">Agreement Level</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.agreement)}
                </td>
                <td className="p-2 border text-gray-600">
                  Alignment between system and user assessment
                </td>
              </tr>
              {scoreDetails.agreementBonus > 0 && (
                <tr className="border-b bg-green-50">
                  <td className="p-2 border font-medium">Agreement Bonus</td>
                  <td className="p-2 border text-right font-mono text-green-700">
                    +{formatPercentage(scoreDetails.agreementBonus)}
                  </td>
                  <td className="p-2 border text-gray-600">
                    Bonus for high consensus
                  </td>
                </tr>
              )}
            </>
          )}

          {/* Combined Score */}
          {scoreDetails.combinedScore !== undefined && (
            <tr className="border-b bg-yellow-50">
              <td className="p-2 border font-medium">Combined Score</td>
              <td className="p-2 border text-right font-mono text-yellow-700">
                {formatPercentage(scoreDetails.combinedScore)}
              </td>
              <td className="p-2 border text-gray-600">
                Weighted average before bonus
              </td>
            </tr>
          )}

          {/* Final Score */}
          <tr className="bg-green-100 font-bold">
            <td className="p-2 border">Final Accuracy Score</td>
            <td className="p-2 border text-right font-mono text-green-700">
              {formatPercentage(scoreDetails.finalScore || 0)}
            </td>
            <td className="p-2 border text-gray-600">
              Combined score + agreement bonus
            </td>
          </tr>

          {/* Capped Warning */}
          {scoreDetails.isCapped && (
            <tr className="bg-orange-50">
              <td colSpan="3" className="p-2 border text-xs text-orange-700">
                ⚠️ Score was capped at maximum value of 1.0
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Formula */}
      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-1">Calculation Formula:</p>
        <code className="text-xs block bg-white p-2 rounded mb-1">
          Combined = (Automated × AutoWeight) + (User × UserWeight)
        </code>
        <code className="text-xs block bg-white p-2 rounded">
          Final = Combined + AgreementBonus (capped at 1.0)
        </code>
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  weight, 
  description, 
  color,
  additionalInfo 
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colorClasses[color].split(' ')[0]}`} />
          <span className="text-xs font-semibold text-gray-700">{label}</span>
        </div>
        <Badge className="bg-white text-gray-700 text-xs">
          {formatPercentage(weight)}
        </Badge>
      </div>

      <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]} mb-1`}>
        {formatPercentage(value)}
      </p>

      <p className="text-xs text-gray-600 mb-2">{description}</p>

      {additionalInfo && (
        <p className="text-xs font-medium text-gray-700 mt-2 pt-2 border-t">
          {additionalInfo}
        </p>
      )}
    </Card>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

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

export default ResearchFieldPaperDetail;