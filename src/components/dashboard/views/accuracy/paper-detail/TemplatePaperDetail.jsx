// File: src/components/dashboard/views/accuracy/paper-detail/TemplatePaperDetail.jsx
// FIXED VERSION - Correct data paths for template evaluation
//
// ============================================================================
// KEY FIXES:
// ============================================================================
// 1. Scores are at: evaluationMetrics.accuracy.template.template.scoreDetails (nested!)
// 2. Similarity at: evaluationMetrics.accuracy.template.template.similarityData
// 3. Ground truth: groundTruth.template_name (prop passed in)
// 4. System template: systemData.templates.selectedTemplate
// 5. LLM check: systemData.templates.llm_template (null = ORKG, object = LLM)
//
// ============================================================================
// DATA STRUCTURE (from debug):
// ============================================================================
// groundTruth.template_name = "Contribution"
//
// systemData.templates = {
//   selectedTemplate: { id, name, template: { properties: [...] } },
//   llm_template: null | { template: {...} }
// }
//
// evaluation.evaluationMetrics.accuracy.template = {
//   template: {  // <-- Note: nested "template" object!
//     similarityData: { titleMatch, propertyMatch, overallScore, ... },
//     scoreDetails: { finalScore, normalizedRating, ... }
//   }
// }
// ============================================================================

import React, { useState } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { 
  CheckCircle, XCircle, AlertCircle, Layout, 
  TrendingUp, Info, ChevronDown, ChevronUp, Star, List
} from 'lucide-react';
import ThreeWayComparison from './ThreeWayComparison';

/**
 * Template Quality Metrics Configuration
 */
const QUALITY_METRICS = {
  titleAccuracy: {
    key: 'titleAccuracy',
    label: 'Title Accuracy',
    description: 'How well the template title reflects the research domain',
    weight: 0.25
  },
  descriptionQuality: {
    key: 'descriptionQuality',
    label: 'Description Quality',
    description: 'Clarity and completeness of the template description',
    weight: 0.25
  },
  propertyCoverage: {
    key: 'propertyCoverage',
    label: 'Property Coverage',
    description: 'Whether the template includes all necessary properties',
    weight: 0.25
  },
  researchAlignment: {
    key: 'researchAlignment',
    label: 'Research Alignment',
    description: 'How well the template aligns with the research problem',
    weight: 0.25
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
 * Template Paper Detail Component - FIXED VERSION
 */
const TemplatePaperDetail = ({ 
  groundTruth, 
  systemData, 
  evaluation,
  paperData,
  selectedEvaluation,
  selectedEvaluationIndex 
}) => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TemplatePaperDetail: FIXED VERSION');
  console.log('═══════════════════════════════════════════════════════');
  
  // State
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showQualityMetrics, setShowQualityMetrics] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  
  // ============================================================================
  // EXTRACT DATA FROM CORRECT PATHS
  // ============================================================================
  
  // Ground truth template name (from prop)
  const groundTruthTemplateName = groundTruth?.template_name || 'N/A';
  
  // System template data
  const templates = systemData?.templates || {};
  const selectedTemplate = templates?.selectedTemplate?.template || templates?.selectedTemplate;
  const selectedTemplateName = templates?.selectedTemplate?.name || selectedTemplate?.name;
  
  // Check if LLM generated
  const isLLMGenerated = !!(templates.llm_template && templates.llm_template !== null);
  const llmTemplate = isLLMGenerated ? templates.llm_template?.template : null;
  
  // Use LLM template if available, otherwise use selected/ORKG template
  const displayTemplate = llmTemplate || selectedTemplate;
  const displayTemplateName = llmTemplate?.name || selectedTemplateName || 'N/A';
  
  console.log('Template sources:', {
    groundTruthTemplateName,
    selectedTemplateName,
    isLLMGenerated,
    displayTemplateName
  });
  
  // ============================================================================
  // EXTRACT SCORES FROM CORRECT PATH (nested template.template)
  // ============================================================================
  
  // FIXED: Scores are at evaluationMetrics.accuracy.template.template (nested!)
  const templateAccuracy = evaluation?.evaluationMetrics?.accuracy?.template;
  const templateData = templateAccuracy?.template; // The nested template object
  
  const similarityData = templateData?.similarityData || {};
  const scoreDetails = templateData?.scoreDetails || {};
  
  // Extract key scores
  const automatedScore = similarityData.automatedOverallScore ?? similarityData.overallScore ?? 0;
  const finalScore = scoreDetails.finalScore ?? 0;
  const normalizedRating = scoreDetails.normalizedRating ?? 0;
  const userRating = templateAccuracy?.rating ?? (normalizedRating * 5); // Convert back to 1-5
  
  console.log('Extracted scores:', {
    automatedScore,
    finalScore,
    normalizedRating,
    userRating,
    similarityData,
    scoreDetails
  });
  
  // Fallback to overall.template if available
  const templateOverall = evaluation?.overall?.template || {};
  const accuracyScore = templateOverall.accuracyScore || automatedScore;
  const qualityScore = templateOverall.qualityScore || normalizedRating;
  const overallScore = templateOverall.overallScore || finalScore;
  
  // Get user info
  const expertiseMultiplier = evaluation?.userInfo?.expertiseMultiplier || 1.0;
  const userName = evaluation?.userInfo?.firstName || 'User';
  
  // Extract user ratings from overall.template if available
  const userRatings = {
    titleAccuracy: getRatingValue(templateOverall.titleAccuracy),
    descriptionQuality: getRatingValue(templateOverall.descriptionQuality),
    propertyCoverage: getRatingValue(templateOverall.propertyCoverage),
    researchAlignment: getRatingValue(templateOverall.researchAlignment)
  };
  
  // Calculate average rating
  const validRatings = Object.values(userRatings).filter(v => v !== null);
  const averageUserRating = validRatings.length > 0
    ? validRatings.reduce((sum, v) => sum + v, 0) / validRatings.length
    : userRating; // Fallback to extracted rating

  // ============================================================================
  // PREPARE THREE-WAY COMPARISON DATA
  // ============================================================================
  
  // Different handling for LLM-generated vs ORKG templates
  const threeWayProps = (() => {
    if (isLLMGenerated) {
      // For LLM-Generated templates:
      // - There's NO ORKG ground truth to compare against
      // - Ground Truth reference = the paper's methodology/content that LLM used
      // - System = LLM-generated template
      const methodologyText = evaluation?.overall?.template?.groundTruth?.text || 
                             systemData?.paperContent?.methodology || 
                             "Paper content used for template generation";
      
      // Truncate long methodology text
      const words = methodologyText.split(" ");
      const truncatedMethodology = words.length > 50 
        ? words.slice(0, 50).join(" ") + "..."
        : methodologyText;
      
      return {
        groundTruth: truncatedMethodology,
        groundTruthLabel: "Reference (Paper Methodology)",
        userInput: displayTemplateName,
        userDescription: displayTemplate?.description || null,
        systemValue: displayTemplateName,
        systemDescription: displayTemplate?.description || null,
        evaluationScore: overallScore,
        label: "Template",
        showMatchIndicators: false, // No match indicators for LLM - different comparison type
        footNote: "LLM-generated template based on paper methodology. No ORKG template exists for comparison.",
        isLLMGenerated: true
      };
    } else {
      // For ORKG templates:
      // - Ground Truth = ORKG template from knowledge graph
      // - System = Selected ORKG template
      return {
        groundTruth: groundTruthTemplateName,
        groundTruthLabel: "Ground Truth (ORKG)",
        userInput: displayTemplateName,
        userDescription: displayTemplate?.description || null,
        systemValue: displayTemplateName,
        systemDescription: displayTemplate?.description || null,
        evaluationScore: overallScore,
        label: "Template",
        showMatchIndicators: true,
        isLLMGenerated: false
      };
    }
  })();

  // Get template properties
  const templateProperties = displayTemplate?.properties || [];

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layout className="h-5 w-5 text-purple-600" />
          Template Analysis
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
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Template Score</p>
            <p className="text-3xl font-bold text-purple-700">
              {formatPercentage(overallScore)}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Automated:</span> {formatPercentage(automatedScore)}
              </div>
              {normalizedRating > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">User Rating:</span> {(normalizedRating * 5).toFixed(1)}/5
                </div>
              )}
              {scoreDetails.agreement !== undefined && (
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Agreement:</span> {formatPercentage(scoreDetails.agreement)}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <StatusIndicator score={overallScore} size="large" />
          </div>
        </div>
      </Card>

      {/* Similarity Metrics Card */}
      <Card className="p-4">
        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Similarity Metrics
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBox 
            label="Title Match" 
            value={similarityData.titleMatch} 
            format="percentage"
          />
          <MetricBox 
            label="Property Match" 
            value={similarityData.propertyMatch} 
            format="percentage"
          />
          <MetricBox 
            label="Precision" 
            value={similarityData.precision} 
            format="percentage"
          />
          <MetricBox 
            label="Recall" 
            value={similarityData.recall} 
            format="percentage"
          />
          <MetricBox 
            label="F1 Score" 
            value={similarityData.f1Score} 
            format="percentage"
          />
          <MetricBox 
            label="Type Accuracy" 
            value={similarityData.typeAccuracy} 
            format="percentage"
          />
          <MetricBox 
            label="Exact Matches" 
            value={similarityData.exactMatches} 
            format="number"
          />
          <MetricBox 
            label="Semantic Matches" 
            value={similarityData.semanticMatches} 
            format="number"
          />
        </div>
        
        {/* Property Counts */}
        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
          <div className="text-xs">
            <span className="text-gray-500">Template Properties:</span>
            <span className="font-semibold ml-2">{similarityData.totalTemplateProps || templateProperties.length}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-500">Reference Properties:</span>
            <span className="font-semibold ml-2">{similarityData.totalReferenceProps || 0}</span>
          </div>
        </div>
      </Card>

      {/* Three-Way Comparison */}
      <Card className="p-4">
        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          {isLLMGenerated ? "Template Quality Assessment" : "Three-Way Comparison"}
        </h5>
        
        {/* LLM-Generated Info Banner */}
        {isLLMGenerated && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>LLM-Generated Template:</strong> No ORKG ground truth exists for this paper. 
              The template was created by the LLM based on paper methodology. 
              Evaluation is based on quality metrics rather than ground truth matching.
            </p>
          </div>
        )}
        
        <ThreeWayComparison {...threeWayProps} />
        
        {/* Footnote for additional context */}
        {threeWayProps.footNote && (
          <p className="mt-3 text-xs text-gray-500 italic border-t pt-2">
            {threeWayProps.footNote}
          </p>
        )}
      </Card>

      {/* Template Properties */}
      {templateProperties.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <List className="h-4 w-4 text-purple-600" />
              Template Properties ({templateProperties.length})
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
            <div className="space-y-2">
              {templateProperties.map((property, index) => (
                <PropertyDisplay 
                  key={index} 
                  property={property} 
                  index={index}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Score Calculation Details */}
      {Object.keys(scoreDetails).length > 0 && (
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
                <>Hide <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>

          {showCalculationDetails && (
            <CalculationMatrix
              scoreDetails={scoreDetails}
              automatedScore={automatedScore}
              expertiseMultiplier={expertiseMultiplier}
            />
          )}
        </Card>
      )}

      {/* Template Details */}
      <Card className="p-4">
        <h5 className="font-semibold text-gray-900 mb-3">Template Details</h5>
        
        <div className="space-y-3">
          {/* Template Name */}
          <div>
            <p className="text-xs text-gray-600 mb-1">
              {isLLMGenerated ? "LLM-Generated Template" : "System Template"}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {displayTemplateName}
            </p>
          </div>

          {/* Ground Truth - Only show for ORKG templates */}
          {!isLLMGenerated && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Ground Truth (ORKG)</p>
              <p className="text-sm font-medium text-gray-900">
                {groundTruthTemplateName}
              </p>
            </div>
          )}

          {/* LLM Generation Note */}
          {isLLMGenerated && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This template was generated by the LLM based on the paper's 
                methodology section. There is no corresponding ORKG template for direct comparison.
                The evaluation is based on template quality assessment rather than ground truth matching.
              </p>
            </div>
          )}

          {/* Match Status - Only show for ORKG templates */}
          {!isLLMGenerated && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Match Status</p>
              {displayTemplateName === groundTruthTemplateName ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" /> Exact Match
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-700">
                  <AlertCircle className="h-3 w-3 mr-1" /> Different Templates
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {displayTemplate?.description && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Description</p>
              <p className="text-sm text-gray-700">
                {displayTemplate.description}
              </p>
            </div>
          )}

          {/* Source */}
          <div>
            <p className="text-xs text-gray-600 mb-1">Source</p>
            <Badge variant={isLLMGenerated ? "default" : "secondary"}>
              {isLLMGenerated ? "LLM-Generated" : "ORKG Database"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* No Data Alert */}
      {!displayTemplate && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No template data available for this evaluation.
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
 * Metric Box Component
 */
const MetricBox = ({ label, value, format = 'percentage' }) => {
  const displayValue = value === undefined || value === null
    ? 'N/A'
    : format === 'percentage'
      ? formatPercentage(value)
      : value;
  
  const colorClass = value === undefined || value === null
    ? 'text-gray-400'
    : value >= 0.8
      ? 'text-green-600'
      : value >= 0.5
        ? 'text-yellow-600'
        : 'text-red-600';
  
  return (
    <div className="p-2 bg-gray-50 rounded border text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>{displayValue}</p>
    </div>
  );
};

/**
 * Property Display Component
 */
const PropertyDisplay = ({ property, index }) => {
  return (
    <div className="p-3 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
            <span className="text-sm font-semibold text-gray-900">
              {property.label || property.name || 'Unnamed Property'}
            </span>
            {property.required && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
            {property.type && (
              <Badge variant="outline" className="text-xs">
                {property.type}
              </Badge>
            )}
          </div>
          {property.description && (
            <p className="text-xs text-gray-600 mt-1">
              {property.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Calculation Matrix Component
 */
const CalculationMatrix = ({ scoreDetails, automatedScore, expertiseMultiplier }) => {
  return (
    <div className="space-y-4">
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
                Similarity-based automated score
              </td>
            </tr>

            {/* Normalized Rating */}
            {scoreDetails.normalizedRating !== undefined && (
              <tr className="border-b bg-green-50">
                <td className="p-2 border font-medium">User Rating (Normalized)</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.normalizedRating)}
                </td>
                <td className="p-2 border text-gray-600">
                  User rating normalized to 0-1 ({(scoreDetails.normalizedRating * 5).toFixed(1)}/5)
                </td>
              </tr>
            )}

            {/* Automatic Confidence */}
            {scoreDetails.automaticConfidence !== undefined && (
              <tr className="border-b">
                <td className="p-2 border font-medium">Automatic Confidence</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.automaticConfidence)}
                </td>
                <td className="p-2 border text-gray-600">
                  System confidence in automated score
                </td>
              </tr>
            )}

            {/* Automated Weight */}
            {scoreDetails.automaticWeight !== undefined && (
              <tr className="border-b">
                <td className="p-2 border font-medium">Automated Weight</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.automaticWeight)}
                </td>
                <td className="p-2 border text-gray-600">
                  Weight applied to automated score
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
                  Weight applied to user rating (expertise: {expertiseMultiplier.toFixed(2)}×)
                </td>
              </tr>
            )}

            {/* Agreement */}
            {scoreDetails.agreement !== undefined && (
              <tr className="border-b">
                <td className="p-2 border font-medium">Agreement</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.agreement)}
                </td>
                <td className="p-2 border text-gray-600">
                  How closely user and system scores align
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
                  Bonus for high agreement
                </td>
              </tr>
            )}

            {/* Combined Score */}
            {scoreDetails.combinedScore !== undefined && (
              <tr className="border-b bg-yellow-50">
                <td className="p-2 border font-medium">Combined Score</td>
                <td className="p-2 border text-right font-mono">
                  {formatPercentage(scoreDetails.combinedScore)}
                </td>
                <td className="p-2 border text-gray-600">
                  Weighted combination before bonus
                </td>
              </tr>
            )}

            {/* Final Score */}
            <tr className="bg-purple-50 font-bold">
              <td className="p-2 border">Final Score</td>
              <td className="p-2 border text-right font-mono text-purple-700">
                {formatPercentage(scoreDetails.finalScore)}
              </td>
              <td className="p-2 border text-gray-600">
                Combined + Agreement Bonus
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Calculation Formula */}
      <div className="p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-2">Formula:</p>
        <code className="text-xs block bg-white p-2 rounded">
          Final = (Automated × {formatPercentage(scoreDetails.automaticWeight || 0)}) + 
          (UserRating × {formatPercentage(scoreDetails.userWeight || 0)}) + 
          AgreementBonus
        </code>
        <code className="text-xs block bg-white p-2 rounded mt-2">
          = ({formatPercentage(automatedScore)} × {formatPercentage(scoreDetails.automaticWeight || 0)}) + 
          ({formatPercentage(scoreDetails.normalizedRating || 0)} × {formatPercentage(scoreDetails.userWeight || 0)}) + 
          {formatPercentage(scoreDetails.agreementBonus || 0)}
          = {formatPercentage(scoreDetails.finalScore)}
        </code>
      </div>
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

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

export default TemplatePaperDetail;