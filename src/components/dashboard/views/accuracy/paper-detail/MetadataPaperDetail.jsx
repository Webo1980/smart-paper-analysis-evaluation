// File: src/components/dashboard/views/accuracy/paper-detail/MetadataPaperDetail.jsx
// UPDATED VERSION - With user ratings, star ratings, and calculation details

import React, { useState } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { 
  Info, FileText, ChevronDown, ChevronUp, 
  CheckCircle, Star 
} from 'lucide-react';
import MetadataFieldComparison from './MetadataFieldComparison';

/**
 * Metadata Paper Detail Component - UPDATED VERSION
 * Shows detailed metadata field analysis with user ratings and calculations
 */
const MetadataPaperDetail = ({ groundTruth, systemData, evaluation }) => {
  // State for collapsible sections
  const [expandedField, setExpandedField] = useState(null);
  const [showUserRatings, setShowUserRatings] = useState(true);

  console.log("MetadataPaperDetail: Received groundTruth =", groundTruth);
  console.log("MetadataPaperDetail: Received evaluation =", evaluation);
  console.log("MetadataPaperDetail: Received systemData =", systemData);
   // ADD THIS DEBUG:
  console.log('=== METADATA DETAIL DEBUG ===');
  console.log('evaluation token:', evaluation?.token);
  console.log('evaluator:', evaluation?.userInfo?.firstName);
  console.log('metadata accuracy:', evaluation?.evaluationMetrics?.accuracy?.metadata);
  console.log('=== END DEBUG ===');
  // Get expertise multiplier
  const expertiseMultiplier = evaluation?.userInfo?.expertiseMultiplier || 1.0;
  
  // Define metadata fields to analyze with CORRECTED PATHS
  const fields = [
    {
      id: 'title',
      name: 'Title',
      displayName: 'Title Extraction',
      groundTruth: groundTruth?.title,
      userInput: systemData?.metadata?.title,
      systemOutput: evaluation?.evaluationMetrics?.overall?.metadata?.title?.extractedValue,
      similarityData: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Title Extraction']?.similarityData,
      rating: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Title Extraction']?.rating,
      scoreDetails: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Title Extraction']?.scoreDetails
    },
    {
      id: 'authors',
      name: 'Authors',
      displayName: 'Authors Extraction',
      groundTruth: getAuthorsArray(groundTruth),
      userInput: systemData?.metadata?.authors,
      systemOutput: evaluation?.evaluationMetrics?.overall?.metadata?.authors?.extractedValue,
      similarityData: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Authors Extraction']?.similarityData,
      rating: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Authors Extraction']?.rating,
      scoreDetails: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Authors Extraction']?.scoreDetails
    },
    {
      id: 'doi',
      name: 'DOI',
      displayName: 'DOI Extraction',
      groundTruth: groundTruth?.doi,
      userInput: systemData?.metadata?.doi,
      systemOutput: evaluation?.evaluationMetrics?.overall?.metadata?.doi?.extractedValue,
      similarityData: evaluation?.evaluationMetrics?.accuracy?.metadata?.['DOI Extraction']?.similarityData,
      rating: evaluation?.evaluationMetrics?.accuracy?.metadata?.['DOI Extraction']?.rating,
      scoreDetails: evaluation?.evaluationMetrics?.accuracy?.metadata?.['DOI Extraction']?.scoreDetails
    },
    {
      id: 'venue',
      name: 'Venue/Journal',
      displayName: 'Venue/Journal',
      groundTruth: groundTruth?.venue,
      userInput: systemData?.metadata?.venue,
      systemOutput: evaluation?.evaluationMetrics?.overall?.metadata?.venue?.extractedValue,
      similarityData: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Venue/Journal']?.similarityData,
      rating: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Venue/Journal']?.rating,
      scoreDetails: evaluation?.evaluationMetrics?.accuracy?.metadata?.['Venue/Journal']?.scoreDetails
    }
  ];

  // In MetadataPaperDetail, after fields definition
console.log('=== METADATA FIELD SCORES ===');
console.log('Evaluator:', evaluation?.userInfo?.firstName);
fields.forEach(f => {
  console.log(`${f.name}: overallScore=${f.similarityData?.overallScore}, finalScore=${f.scoreDetails?.finalScore}`);
});
console.log('=== END ===');
  console.log("MetadataPaperDetail: Fields with ratings =", fields);

  // Calculate overall metadata score
  const overallScore = calculateAverageScore(fields);

  // Check if we have any data
  const hasData = fields.some(field => 
    field.groundTruth || field.userInput || field.systemOutput
  );

  if (!hasData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No metadata evaluation data available for this paper.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Metadata Analysis
        </h4>
        <Badge className={getScoreColorClass(overallScore)}>
          Overall: {formatPercentage(overallScore)}
        </Badge>
      </div>

      {/* Overall Score Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Metadata Accuracy</p>
            <p className="text-3xl font-bold text-blue-700">
              {formatPercentage(overallScore)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Average across all metadata fields
            </p>
          </div>
          <div className="text-right">
            {getStatusIcon(overallScore, 48)}
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm text-blue-900 font-medium mb-1">
            Metadata Field Analysis
          </p>
          <p className="text-xs text-blue-700">
            Each field shows a three-way comparison between Ground Truth (from ORKG), 
            User Input (what the system extracted), and System Output (what was evaluated). 
            Click any field to expand and see detailed similarity metrics and user ratings.
          </p>
        </AlertDescription>
      </Alert>

      {/* User Ratings Summary */}
      {fields.some(f => f.rating !== undefined) && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
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
            <div className="space-y-3">
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

              {/* Individual Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map(field => {
                  if (field.rating === undefined) return null;
                  
                  return (
                    <RatingDisplay
                      key={field.id}
                      label={field.displayName}
                      value={field.rating}
                      score={field.similarityData?.overallScore}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}
      
      {/* Field Comparisons */}
      <div className="space-y-3">
        {fields.map(field => (
          <ExpandableFieldCard
            key={field.id}
            field={field}
            expanded={expandedField === field.id}
            onToggle={() => setExpandedField(expandedField === field.id ? null : field.id)}
            expertiseMultiplier={expertiseMultiplier}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Field-by-Field Accuracy Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fields.map(field => {
            const score = field.similarityData?.overallScore || 0;
            return (
              <div key={field.id} className="text-center p-3 bg-white rounded border">
                <p className="text-xs text-gray-600 mb-1">{field.name}</p>
                <p className={`text-lg font-bold ${getScoreColorText(score)}`}>
                  {formatPercentage(score)}
                </p>
                {field.rating && (
                  <div className="flex justify-center mt-1">
                    <StarRating value={field.rating} size="small" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Expandable Field Card Component
 */
const ExpandableFieldCard = ({ field, expanded, onToggle, expertiseMultiplier }) => {
  const score = field.similarityData?.overallScore || 0;
  const hasDetails = field.similarityData || field.scoreDetails;

  return (
    <Card className="overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h5 className="text-sm font-semibold text-gray-900">{field.name}</h5>
              <Badge className={getScoreColorClass(score, true)}>
                {formatPercentage(score)}
              </Badge>
              {field.rating && (
                <div className="flex items-center gap-1">
                  <StarRating value={field.rating} size="small" />
                </div>
              )}
            </div>
            
            {/* Three-Way Preview */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Ground Truth</p>
                <p className="text-gray-900 font-medium truncate">
                  {formatValue(field.groundTruth) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">User Input</p>
                <p className="text-gray-900 font-medium truncate">
                  {formatValue(field.userInput) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">System Output</p>
                <p className="text-gray-900 font-medium truncate">
                  {formatValue(field.systemOutput) || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 ml-4">
            {hasDetails && (
              <button className="p-2 rounded hover:bg-gray-100">
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && hasDetails && (
        <div className="p-4 pt-0 border-t space-y-4">
          {/* Full Three-Way Comparison */}
          <MetadataFieldComparison
            fieldName={field.name}
            groundTruth={field.groundTruth}
            userInput={field.userInput}
            systemOutput={field.systemOutput}
            similarityData={field.similarityData}
          />

          {/* Calculation Matrix */}
          {field.scoreDetails && (
            <Card className="p-3 bg-gray-50">
              <h6 className="text-sm font-semibold text-gray-900 mb-2">
                Score Calculation Details
              </h6>
              <CalculationMatrix
                scoreDetails={field.scoreDetails}
                expertiseMultiplier={expertiseMultiplier}
                rating={field.rating}
              />
            </Card>
          )}

          {/* Similarity Breakdown */}
          {field.similarityData && (
            <Card className="p-3 bg-gray-50">
              <h6 className="text-sm font-semibold text-gray-900 mb-2">
                Similarity Metrics Breakdown
              </h6>
              <SimilarityBreakdown similarityData={field.similarityData} />
            </Card>
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * Rating Display Component with Stars
 */
const RatingDisplay = ({ label, value, score }) => {
  const percentage = (value / 5) * 100;
  
  return (
    <div className="p-3 bg-gray-50 rounded border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-lg font-bold text-gray-700">
          {value.toFixed(1)}/5
        </span>
      </div>
      
      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-2">
        <StarRating value={value} size="medium" />
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {score !== undefined && (
        <p className="text-xs text-gray-600 mt-1">
          Accuracy: {formatPercentage(score)}
        </p>
      )}
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
 * Calculation Matrix Component
 */
const CalculationMatrix = ({ scoreDetails, expertiseMultiplier, rating }) => {
  if (!scoreDetails) return null;

  const automatedScore = scoreDetails.automatedScore || 0;
  const normalizedRating = scoreDetails.normalizedRating || 0;
  const finalScore = scoreDetails.finalScore || 0;

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
              {formatPercentage(automatedScore)}
            </td>
            <td className="p-2 border text-gray-600">
              System's similarity calculation
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
                  Expert's assessment
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 border font-medium">User Rating (Normalized)</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(normalizedRating)}
                </td>
                <td className="p-2 border text-gray-600">
                  Rating scaled to 0-1
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
                U-shaped confidence curve
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
                  Weight for system score
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 border font-medium">User Weight</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.userWeight)}
                </td>
                <td className="p-2 border text-gray-600">
                  Weight for user rating (×{expertiseMultiplier.toFixed(2)})
                </td>
              </tr>
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
                  Alignment between system and user
                </td>
              </tr>
              {scoreDetails.agreementBonus > 0 && (
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
            </>
          )}

          {/* Final Score */}
          <tr className="bg-blue-100 font-bold">
            <td className="p-2 border">Final Score</td>
            <td className="p-2 border text-right font-mono text-blue-700">
              {formatPercentage(finalScore)}
            </td>
            <td className="p-2 border text-gray-600">
              Balanced result
            </td>
          </tr>
        </tbody>
      </table>

      {/* Formula */}
      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-1">Formula:</p>
        <code className="text-xs block bg-white p-2 rounded">
          Final = (Automated × AutoWeight) + (User × UserWeight) + AgreementBonus
        </code>
      </div>
    </div>
  );
};

/**
 * Similarity Breakdown Component
 */
const SimilarityBreakdown = ({ similarityData }) => {
  return (
    <div className="space-y-2">
      {/* Levenshtein */}
      {similarityData.levenshtein && (
        <div className="p-2 bg-white border rounded">
          <p className="text-xs font-medium text-gray-900 mb-1">Levenshtein Distance</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Score:</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPercentage(similarityData.levenshtein.score)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600">Edit Distance:</span>
            <span className="text-xs font-mono text-gray-700">
              {similarityData.levenshtein.distance}
            </span>
          </div>
        </div>
      )}

      {/* Token Matching */}
      {similarityData.tokenMatching && (
        <div className="p-2 bg-white border rounded">
          <p className="text-xs font-medium text-gray-900 mb-1">Token Matching</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Score:</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPercentage(similarityData.tokenMatching.score)}
            </span>
          </div>
        </div>
      )}

      {/* Overall Score */}
      <div className="p-2 bg-blue-50 border border-blue-200 rounded">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-900">Overall Similarity:</span>
          <span className="text-lg font-bold text-blue-700">
            {formatPercentage(similarityData.overallScore)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAuthorsArray(groundTruth) {
  if (!groundTruth) return [];
  
  const authors = [];
  for (let i = 1; i <= 24; i++) {
    const author = groundTruth[`author${i}`];
    if (author) {
      authors.push(author);
    }
  }
  return authors;
}

function calculateAverageScore(fields) {
  const scores = fields
    .map(field => field.similarityData?.overallScore || 0)
    .filter(score => score > 0);
  
  if (scores.length === 0) return 0;
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value;
}

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function getScoreColorText(score) {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.7) return 'text-blue-600';
  if (score >= 0.5) return 'text-yellow-600';
  if (score >= 0.3) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreColorClass(score, isSmall = false) {
  const base = isSmall ? 'text-xs ' : 'text-sm font-medium ';
  
  if (score >= 0.9) {
    return base + 'bg-green-100 text-green-700 border-green-200';
  } else if (score >= 0.7) {
    return base + 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (score >= 0.5) {
    return base + 'bg-yellow-100 text-yellow-700 border-yellow-200';
  } else if (score >= 0.3) {
    return base + 'bg-orange-100 text-orange-700 border-orange-200';
  } else {
    return base + 'bg-red-100 text-red-700 border-red-200';
  }
}

function getProgressColor(percentage) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getStatusIcon(score, size = 32) {
  if (score >= 0.8) {
    return <CheckCircle size={size} className="text-green-500" />;
  } else if (score >= 0.6) {
    return <Info size={size} className="text-yellow-500" />;
  } else {
    return <Info size={size} className="text-red-500" />;
  }
}

export default MetadataPaperDetail;