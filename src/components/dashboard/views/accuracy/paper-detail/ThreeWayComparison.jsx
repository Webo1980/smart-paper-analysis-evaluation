// File: src/components/dashboard/views/accuracy/paper-detail/ThreeWayComparison.jsx
// UPDATED VERSION - Now supports star ratings display

import React from 'react';
import { Card } from '../../../../ui/card';
import { CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react';

/**
 * Three-Way Comparison Component - UPDATED VERSION
 * Displays side-by-side comparison of Ground Truth, User Selection/Input, and System Prediction/Output
 * Now includes optional star rating display
 * 
 * Props:
 * - groundTruth: Ground truth value (from ORKG)
 * - userSelection: What the user selected/assessed
 * - userInput: Alternative to userSelection (for metadata)
 * - systemPrediction: Top system prediction
 * - systemValue: Alternative to systemPrediction
 * - systemDescription: Additional system description
 * - evaluationScore: Overall evaluation score (optional)
 * - label: Label for the comparison
 * - showMatchIndicators: Show checkmarks for matches (default: true)
 * - userRating: Star rating from user (1-5 scale, optional)
 */
const ThreeWayComparison = ({
  groundTruth,
  userSelection,
  userInput,
  systemPrediction,
  systemValue,
  systemDescription,
  evaluationScore,
  label = 'Comparison',
  showMatchIndicators = true,
  userRating
}) => {
  // Normalize inputs
  const normalizedUserValue = userSelection || userInput;
  const normalizedSystemValue = systemPrediction || systemValue;

  // Check for matches
  const userMatchesGround = normalizedUserValue && groundTruth && 
                           String(normalizedUserValue).toLowerCase().trim() === 
                           String(groundTruth).toLowerCase().trim();
  
  const systemMatchesGround = normalizedSystemValue && groundTruth && 
                             String(normalizedSystemValue).toLowerCase().trim() === 
                             String(groundTruth).toLowerCase().trim();
  
  const userMatchesSystem = normalizedUserValue && normalizedSystemValue && 
                           String(normalizedUserValue).toLowerCase().trim() === 
                           String(normalizedSystemValue).toLowerCase().trim();

  // Format values for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  return (
    <div className="space-y-3">
      {/* Header with Overall Score */}
      {evaluationScore !== undefined && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="text-sm font-medium text-gray-700">{label} Score:</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getScoreColor(evaluationScore)}`}>
              {formatPercentage(evaluationScore)}
            </span>
            {getScoreIcon(evaluationScore)}
          </div>
        </div>
      )}

      {/* Three-Way Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ground Truth */}
        <ComparisonColumn
          title="Ground Truth"
          subtitle="From ORKG"
          value={formatValue(groundTruth)}
          color="red"
          icon={null}
          showMatch={false}
        />

        {/* User Selection/Input */}
        <ComparisonColumn
          title={userSelection ? "User Selection" : "User Input"}
          subtitle="Expert Assessment"
          value={formatValue(normalizedUserValue)}
          description={userRating ? `Rating: ${userRating.toFixed(1)}/5` : null}
          color="blue"
          icon={showMatchIndicators && userMatchesGround ? <CheckCircle className="h-4 w-4" /> : null}
          showMatch={showMatchIndicators && userMatchesGround}
          userRating={userRating}
        />

        {/* System Output/Prediction */}
        <ComparisonColumn
          title={systemPrediction ? "System Top Prediction" : "System Output"}
          subtitle="Automated Analysis"
          value={formatValue(normalizedSystemValue)}
          description={systemDescription}
          color="green"
          icon={showMatchIndicators && systemMatchesGround ? <CheckCircle className="h-4 w-4" /> : null}
          showMatch={showMatchIndicators && systemMatchesGround}
        />
      </div>

      {/* Match Indicators Summary */}
      {showMatchIndicators && (
        <div className="p-3 bg-gray-50 rounded space-y-2">
          <MatchIndicator
            label="User ↔ Ground Truth"
            matched={userMatchesGround}
          />
          <MatchIndicator
            label="System ↔ Ground Truth"
            matched={systemMatchesGround}
          />
          <MatchIndicator
            label="User ↔ System"
            matched={userMatchesSystem}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Comparison Column Component
 */
const ComparisonColumn = ({ 
  title, 
  subtitle, 
  value, 
  description, 
  color, 
  icon, 
  showMatch,
  userRating 
}) => {
  const colorClasses = {
    red: 'border-red-200 bg-red-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50'
  };

  const headerColorClasses = {
    red: 'bg-red-100 text-red-900',
    blue: 'bg-blue-100 text-blue-900',
    green: 'bg-green-100 text-green-900'
  };

  return (
    <Card className={`overflow-hidden border-2 ${colorClasses[color]}`}>
      {/* Header */}
      <div className={`p-3 ${headerColorClasses[color]} flex items-center justify-between`}>
        <div>
          <h5 className="text-sm font-semibold">{title}</h5>
          <p className="text-xs opacity-75">{subtitle}</p>
        </div>
        {icon && showMatch && (
          <div className="text-green-600">
            {icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 break-words">
          {value}
        </p>
        
        {/* Star Rating */}
        {userRating && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <StarRating value={userRating} size="small" />
              <span className="text-xs text-gray-600">
                {userRating.toFixed(1)}/5
              </span>
            </div>
          </div>
        )}
        
        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 mt-2 pt-2 border-t">
            {description}
          </p>
        )}
      </div>

      {/* Match Badge */}
      {showMatch && (
        <div className="px-3 pb-3">
          <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Matches Ground Truth
          </div>
        </div>
      )}
    </Card>
  );
};

/**
 * Match Indicator Component
 */
const MatchIndicator = ({ label, matched }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-700">{label}</span>
      <div className="flex items-center gap-1">
        {matched ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Match</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Different</span>
          </>
        )}
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

export default ThreeWayComparison;