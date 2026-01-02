// File: src/components/dashboard/views/accuracy/paper-detail/MetadataFieldComparison.jsx

import React, { useState } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { ChevronDown, ChevronUp, FileText, Users, Link as LinkIcon, Building } from 'lucide-react';
import ThreeWayComparison from './ThreeWayComparison';

/**
 * Metadata Field Comparison Component
 * Shows detailed comparison for a single metadata field
 */
const MetadataFieldComparison = ({ 
  fieldName,
  groundTruth, 
  userInput, 
  systemOutput, 
  similarityData 
}) => {
  const [expanded, setExpanded] = useState(false);

  // Get field icon
  const FieldIcon = getFieldIcon(fieldName);

  // Format values for display
  const formattedGT = formatValue(groundTruth, fieldName);
  const formattedUser = formatValue(userInput, fieldName);
  const formattedSystem = formatValue(systemOutput, fieldName);

  // Calculate overall score
  const overallScore = similarityData?.overallScore || 0;

  return (
    <Card className="p-4 mb-4">
      {/* Field Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FieldIcon className="h-5 w-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">{fieldName}</h4>
          <Badge className={getScoreColorClass(overallScore)}>
            {formatPercentage(overallScore)}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Three-Way Comparison */}
          <ThreeWayComparison
            groundTruth={formattedGT}
            userSelection={formattedUser}
            systemPrediction={formattedSystem}
            label={`${fieldName} Comparison`}
            showMatchIndicators={true}
          />

          {/* Similarity Metrics */}
          {similarityData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Levenshtein Distance */}
              {similarityData.levenshtein && (
                <MetricCard
                  label="Levenshtein Similarity"
                  value={similarityData.levenshtein.score}
                  weight="50%"
                  details={[
                    `Distance: ${similarityData.levenshtein.distance || 0}`,
                    `Weighted: ${formatPercentage(similarityData.levenshtein.weightedScore)}`
                  ]}
                />
              )}

              {/* Token Matching */}
              {similarityData.tokenMatching && (
                <MetricCard
                  label="Token Matching"
                  value={similarityData.tokenMatching.score}
                  weight="30%"
                  details={[
                    `Precision: ${formatPercentage(similarityData.tokenMatching.precision)}`,
                    `Recall: ${formatPercentage(similarityData.tokenMatching.recall)}`,
                    `F1: ${formatPercentage(similarityData.tokenMatching.f1Score)}`
                  ]}
                />
              )}

              {/* Special Characters */}
              {similarityData.specialChar && (
                <MetricCard
                  label="Special Chars"
                  value={similarityData.specialChar.score}
                  weight="20%"
                  details={[
                    `Match rate: ${formatPercentage(similarityData.specialChar.score)}`
                  ]}
                />
              )}
            </div>
          )}

          {/* Overall Calculation */}
          {similarityData && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-900 mb-1">Overall Score Calculation:</p>
              <p className="text-xs text-blue-700">
                {similarityData.levenshtein && `(0.5 × ${formatPercentage(similarityData.levenshtein.score)})`}
                {similarityData.tokenMatching && ` + (0.3 × ${formatPercentage(similarityData.tokenMatching.score)})`}
                {similarityData.specialChar && ` + (0.2 × ${formatPercentage(similarityData.specialChar.score)})`}
                {` = ${formatPercentage(overallScore)}`}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * Metric Card for similarity metrics
 */
const MetricCard = ({ label, value, weight, details = [] }) => {
  return (
    <div className="p-3 bg-gray-50 rounded border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <Badge className="bg-white text-gray-600 text-xs">{weight}</Badge>
      </div>
      <p className="text-xl font-bold text-gray-900 mb-2">
        {formatPercentage(value)}
      </p>
      {details.length > 0 && (
        <div className="space-y-1">
          {details.map((detail, idx) => (
            <p key={idx} className="text-xs text-gray-600">{detail}</p>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFieldIcon(fieldName) {
  const fieldNameLower = fieldName.toLowerCase();
  
  if (fieldNameLower.includes('title')) return FileText;
  if (fieldNameLower.includes('author')) return Users;
  if (fieldNameLower.includes('doi')) return LinkIcon;
  if (fieldNameLower.includes('venue') || fieldNameLower.includes('journal')) return Building;
  
  return FileText;
}

function formatValue(value, fieldName) {
  if (!value) return 'N/A';
  
  // Handle arrays (e.g., authors)
  if (Array.isArray(value)) {
    return value.filter(v => v).join(', ');
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function getScoreColorClass(score) {
  if (score >= 0.9) return 'bg-green-100 text-green-700';
  if (score >= 0.7) return 'bg-blue-100 text-blue-700';
  if (score >= 0.5) return 'bg-yellow-100 text-yellow-700';
  if (score >= 0.3) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export default MetadataFieldComparison;