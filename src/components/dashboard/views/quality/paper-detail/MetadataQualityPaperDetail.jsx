// src/components/dashboard/views/quality/paper-detail/MetadataQualityPaperDetail.jsx
// UPDATED: Accepts both evaluationIndex and selectedEvaluationIndex props

import React, { useMemo, useState } from 'react';
import { Card } from '../../../../ui/card';
import { Badge } from '../../../../ui/badge';
import { Alert, AlertDescription } from '../../../../ui/alert';
import { 
  Info, CheckCircle, AlertTriangle, XCircle,
  FileText, Award, TrendingUp, ChevronDown, ChevronUp,
  Star, HelpCircle, Calculator, Users
} from 'lucide-react';
import { formatPercentage } from '../../../../../utils/formatters';

/**
 * Field mapping between display names and field IDs
 */
const FIELD_DISPLAY_NAME_MAP = {
  'Title Extraction': 'title',
  'Authors Extraction': 'authors',
  'DOI Extraction': 'doi',
  'Publication Year': 'publication_year',
  'Venue/Journal': 'venue'
};

const FIELD_ID_TO_DISPLAY_NAME = {
  'title': 'Title Extraction',
  'authors': 'Authors Extraction',
  'doi': 'DOI Extraction',
  'publication_year': 'Publication Year',
  'venue': 'Venue/Journal'
};

/**
 * Extract and map metadata quality data from evaluation
 */
const extractMetadataQuality = (evaluation) => {
  if (!evaluation?.evaluationMetrics?.quality?.metadata) return null;
  
  const qualityData = evaluation.evaluationMetrics.quality.metadata;
  const mappedData = {};
  
  // Map from display names to field IDs
  Object.entries(FIELD_DISPLAY_NAME_MAP).forEach(([displayName, fieldId]) => {
    if (qualityData[displayName]) {
      const fieldData = qualityData[displayName];
      
      mappedData[fieldId] = {
        displayName: displayName,
        completeness: fieldData.qualityData?.fieldSpecificMetrics?.completeness?.score || 0,
        consistency: fieldData.qualityData?.fieldSpecificMetrics?.consistency?.score || 0,
        validity: fieldData.qualityData?.fieldSpecificMetrics?.validity?.score || 0,
        overall: fieldData.qualityData?.automatedOverallScore || 0,
        finalScore: fieldData.metricDetails?.finalScore || 0,
        rating: fieldData.rating,
        expertiseMultiplier: fieldData.expertiseMultiplier || 1.0,
        metricDetails: fieldData.metricDetails,
        issues: {
          completeness: fieldData.qualityData?.fieldSpecificMetrics?.completeness?.issues || [],
          consistency: fieldData.qualityData?.fieldSpecificMetrics?.consistency?.issues || [],
          validity: fieldData.qualityData?.fieldSpecificMetrics?.validity?.issues || []
        },
        weights: fieldData.qualityData?.weights || { completeness: 0.4, consistency: 0.3, validity: 0.3 },
        explanation: fieldData.qualityData?.explanation || {}
      };
    }
  });
  
  return mappedData;
};

/**
 * Metadata Quality Paper Detail Component - UPDATED VERSION
 * 
 * Now accepts both prop naming conventions from PaperCard:
 * - evaluationIndex / selectedEvaluationIndex
 * - evaluation / selectedEvaluation
 */
const MetadataQualityPaperDetail = ({ 
  groundTruth, 
  evaluation, 
  paperData, 
  evaluationIndex,
  selectedEvaluationIndex,   // ADDED: What PaperCard passes
  selectedEvaluation         // ADDED: What PaperCard passes
}) => {
  // Resolve the correct index and evaluation to use
  const effectiveIndex = selectedEvaluationIndex ?? evaluationIndex ?? 0;
  const effectiveEvaluation = selectedEvaluation || evaluation;

  console.log("MetadataQualityPaperDetail - effectiveIndex:", effectiveIndex);
  console.log("MetadataQualityPaperDetail - effectiveEvaluation:", effectiveEvaluation);
  console.log("Quality Data:", effectiveEvaluation?.evaluationMetrics?.quality?.metadata);
  
  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState({
    methodology: false,
    userRatings: true,
    fieldDetails: {}
  });

  // Get expertise multiplier from effective evaluation
  const expertiseMultiplier = effectiveEvaluation?.userInfo?.expertiseMultiplier || 1.6;

  // Extract metadata quality from evaluation
  const metadataQuality = useMemo(() => {
    return extractMetadataQuality(effectiveEvaluation);
  }, [effectiveEvaluation]);

  console.log("Mapped metadataQuality:", metadataQuality);

  // Calculate overall metadata quality statistics
  const overallStats = useMemo(() => {
    if (!metadataQuality) return null;

    const fields = ['title', 'authors', 'doi', 'publication_year', 'venue'];
    const validFields = fields.filter(f => metadataQuality[f]);
    
    console.log("Valid fields for overall stats calculation:", validFields, metadataQuality);

    if (validFields.length === 0) return null;

    const completenessScores = validFields.map(f => metadataQuality[f].completeness);
    const consistencyScores = validFields.map(f => metadataQuality[f].consistency);
    const validityScores = validFields.map(f => metadataQuality[f].validity);
    const overallScores = validFields.map(f => metadataQuality[f].overall);
    const finalScores = validFields.map(f => metadataQuality[f].finalScore);
    const ratings = validFields.map(f => metadataQuality[f].rating).filter(r => r !== undefined);

    return {
      completeness: avg(completenessScores),
      consistency: avg(consistencyScores),
      validity: avg(validityScores),
      automatedOverall: avg(overallScores),
      finalOverall: avg(finalScores),
      avgRating: ratings.length > 0 ? avg(ratings) : null,
      fieldCount: validFields.length,
      fields: validFields
    };
  }, [metadataQuality]);

  // Extract ground truth values for display
  const groundTruthValues = useMemo(() => {
    if (!groundTruth) return {};

    return {
      title: groundTruth.title || 'N/A',
      authors: groundTruth.authors?.join(', ') || 'N/A',
      doi: groundTruth.doi || 'N/A',
      publication_year: groundTruth.publication_year || 'N/A',
      venue: groundTruth.venue || 'N/A'
    };
  }, [groundTruth]);

  // Extract extracted values from evaluation
  const extractedValues = useMemo(() => {
    const overall = effectiveEvaluation?.overall?.metadata;
    if (!overall) return {};

    return {
      title: overall.title?.extractedValue || 'N/A',
      authors: overall.authors?.extractedValue || 'N/A',
      doi: overall.doi?.extractedValue || 'N/A',
      publication_year: overall.publication_year?.extractedValue || 'N/A',
      venue: overall.venue?.extractedValue || 'N/A'
    };
  }, [effectiveEvaluation]);

  const toggleSection = (section, fieldName = null) => {
    if (fieldName !== null) {
      setExpandedSections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [fieldName]: !prev[section]?.[fieldName]
        }
      }));
    } else {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
  };

  if (!metadataQuality || !overallStats) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No metadata quality data available for this evaluation.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Paper Info */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Metadata Quality Analysis
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Evaluation #{effectiveIndex + 1} • {overallStats.fieldCount} fields analyzed
            </p>
            {groundTruth?.doi && (
              <p className="text-xs text-gray-500 font-mono">
                DOI: {groundTruth.doi}
              </p>
            )}
            {overallStats.avgRating && (
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>Expert Rating: </span>
                <StarRating value={overallStats.avgRating} size="small" />
                <span className="ml-1 font-medium">({overallStats.avgRating.toFixed(1)}/5)</span>
              </div>
            )}
          </div>

          {/* Overall Quality Score Badge */}
          <div className="text-center bg-white rounded-lg p-4 shadow-sm border-2 border-blue-200">
            <Award className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(overallStats.finalOverall)}`} />
            <p className="text-xs text-gray-600 mb-1">Overall Quality</p>
            <p className={`text-2xl font-bold ${getScoreColor(overallStats.finalOverall)}`}>
              {formatPercentage(overallStats.finalOverall)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              (with user input)
            </p>
          </div>
        </div>

        {/* Show difference between automated and final */}
        {Math.abs(overallStats.finalOverall - overallStats.automatedOverall) > 0.05 && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-900">
                <strong>Automated Quality Score:</strong> {formatPercentage(overallStats.automatedOverall)}
              </span>
              <span className="text-purple-900">
                <strong>Final Score (with user input):</strong> {formatPercentage(overallStats.finalOverall)}
              </span>
              <span className={`font-bold ${overallStats.finalOverall > overallStats.automatedOverall ? 'text-green-600' : 'text-red-600'}`}>
                {overallStats.finalOverall > overallStats.automatedOverall ? '+' : ''}
                {formatPercentage(overallStats.finalOverall - overallStats.automatedOverall)} difference
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Evaluation Methodology Explanation */}
      <Card className="overflow-hidden border-purple-200">
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-gradient-to-r from-purple-50 to-blue-50"
          onClick={() => toggleSection('methodology')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                Understanding Quality Evaluation Methodology
              </h4>
            </div>
            <button 
              className="p-2 rounded hover:bg-white/50 transition-colors"
              aria-label={expandedSections.methodology ? "Collapse" : "Expand"}
            >
              {expandedSections.methodology ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          
          {!expandedSections.methodology && (
            <p className="text-xs text-gray-600 mt-2">
              Click to learn how quality scores combine automated metrics (completeness, consistency, validity) 
              with expert ratings, expertise weights, and agreement bonuses
            </p>
          )}
        </div>

        {expandedSections.methodology && (
          <div className="p-4 pt-0 space-y-4 border-t">
            {/* Overview Section */}
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <h5 className="text-sm font-semibold text-blue-900 mb-2">
                Quality Evaluation Overview
              </h5>
              <p className="text-xs text-blue-700 leading-relaxed mb-2">
                Quality assessment combines three automated dimensions (Completeness, Consistency, Validity) 
                with expert human ratings to produce balanced quality scores. Each score integrates:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside ml-2">
                <li><strong>Automated Quality Analysis:</strong> Weighted sum of completeness (40%), consistency (30%), and validity (30%)</li>
                <li><strong>User Rating:</strong> Expert evaluator's 1-5 star rating (normalized to 0-1)</li>
                <li><strong>Expertise Multiplier:</strong> Weight based on evaluator's role and experience ({expertiseMultiplier.toFixed(2)}×)</li>
                <li><strong>Agreement Bonus:</strong> Up to 10% bonus when system and expert agree</li>
              </ul>
            </div>

            {/* Complete Formula */}
            <div className="p-3 bg-gray-50 rounded border">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">
                Complete Quality Score Calculation
              </h5>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Step 1: Calculate Automated Quality Score</p>
                  <code className="text-xs block bg-white p-2 rounded border">
                    Automated Quality = (Completeness × 0.4) + (Consistency × 0.3) + (Validity × 0.3)
                  </code>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Step 2: Calculate Dynamic Weights</p>
                  <code className="text-xs block bg-white p-2 rounded border">
                    System Confidence = U-Shaped Curve (highest at 50%, lowest at extremes)<br />
                    Auto Weight = System Confidence × Base Weight<br />
                    User Weight = Expertise Multiplier × Base Weight<br />
                    Normalized Weights = Weights / Total Weight
                  </code>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Step 3: Combine Scores</p>
                  <code className="text-xs block bg-white p-2 rounded border">
                    Combined Score = (Automated × Auto Weight) + (User Rating × User Weight)
                  </code>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Step 4: Apply Agreement Bonus</p>
                  <code className="text-xs block bg-white p-2 rounded border">
                    Agreement = 1 - |Automated Score - User Rating|<br />
                    Agreement Bonus = Agreement × 0.1<br />
                    Final Score = Combined Score × (1 + Agreement Bonus)
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* User Ratings Summary */}
      {overallStats.avgRating && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              User Evaluation Ratings
            </h5>
            <button
              onClick={() => toggleSection('userRatings')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {expandedSections.userRatings ? (
                <>Hide Ratings <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show Ratings <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          </div>
          
          {expandedSections.userRatings && (
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

              {/* Individual Field Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overallStats.fields.map(fieldName => {
                  const fieldData = metadataQuality[fieldName];
                  if (!fieldData.rating) return null;
                  
                  return (
                    <RatingDisplay
                      key={fieldName}
                      label={getFieldDisplayName(fieldName)}
                      value={fieldData.rating}
                      automatedScore={fieldData.overall}
                      finalScore={fieldData.finalScore}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quality Dimensions Summary */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Quality Dimensions Summary (Automated Components)
        </h4>

        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> These are the <strong>automated component scores</strong>. 
            The final overall scores shown below include user ratings, expertise weights, and agreement bonuses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DimensionCard
            label="Completeness"
            score={overallStats.completeness}
            weight="40%"
            description="All required information present"
            color="blue"
          />
          <DimensionCard
            label="Consistency"
            score={overallStats.consistency}
            weight="30%"
            description="Uniform structure and format"
            color="green"
          />
          <DimensionCard
            label="Validity"
            score={overallStats.validity}
            weight="30%"
            description="Conforms to standards"
            color="purple"
          />
        </div>

        {/* Calculation Formula */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-1">Automated Quality Formula:</p>
          <code className="text-xs text-gray-600">
            Automated Quality = (Completeness × 0.4) + (Consistency × 0.3) + (Validity × 0.3) = {' '}
            ({formatPercentage(overallStats.completeness)} × 0.4) + {' '}
            ({formatPercentage(overallStats.consistency)} × 0.3) + {' '}
            ({formatPercentage(overallStats.validity)} × 0.3) = {' '}
            <span className="font-semibold">{formatPercentage(overallStats.automatedOverall)}</span>
          </code>
          {overallStats.avgRating && (
            <p className="text-xs text-gray-600 mt-2">
              This automated score is then combined with user rating ({overallStats.avgRating.toFixed(1)}/5) 
              and expertise weight ({expertiseMultiplier.toFixed(2)}×) to produce the final score 
              of {formatPercentage(overallStats.finalOverall)}.
            </p>
          )}
        </div>
      </Card>

      {/* Field-by-Field Quality Analysis */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Field-Level Quality Analysis
        </h4>

        <div className="space-y-4">
          {overallStats.fields.map(fieldName => {
            const fieldData = metadataQuality[fieldName];
            const gtValue = groundTruthValues[fieldName];
            const extractedValue = extractedValues[fieldName];

            return (
              <ExpandableFieldQualityCard
                key={fieldName}
                fieldName={fieldName}
                fieldData={fieldData}
                groundTruth={gtValue}
                extracted={extractedValue}
                expanded={expandedSections.fieldDetails[fieldName]}
                onToggle={() => toggleSection('fieldDetails', fieldName)}
                expertiseMultiplier={expertiseMultiplier}
              />
            );
          })}
        </div>
      </Card>

      {/* Score Calculation Details Table */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Calculator className="h-5 w-5 text-blue-600 mr-2" />
          Score Calculation Breakdown
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 border-b">Field</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Automated</span>
                    <span className="text-xs font-normal text-gray-500">(Quality Score)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>User Rating</span>
                    <span className="text-xs font-normal text-gray-500">(1-5 stars)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Final Score</span>
                    <span className="text-xs font-normal text-gray-500">(With Expertise)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Impact</th>
              </tr>
            </thead>
            <tbody>
              {overallStats.fields.map(fieldName => {
                const fieldData = metadataQuality[fieldName];
                const difference = fieldData.finalScore - fieldData.overall;

                return (
                  <tr key={fieldName} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900 capitalize">
                      {getFieldDisplayName(fieldName)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${getScoreColor(fieldData.overall)}`}>
                        {formatPercentage(fieldData.overall)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {fieldData.rating ? (
                        <div className="flex flex-col items-center">
                          <StarRating value={fieldData.rating} size="small" />
                          <span className="text-xs text-gray-600 mt-1">
                            {fieldData.rating.toFixed(1)}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${getScoreColor(fieldData.finalScore)}`}>
                        {formatPercentage(fieldData.finalScore)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        {getDifferenceIcon(difference)}
                        <span className={`ml-1 text-xs ${getDifferenceColor(difference)}`}>
                          {difference >= 0 ? '+' : ''}{formatPercentage(Math.abs(difference))}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Impact Column:</strong> Shows how much user evaluation changed the final score compared 
            to the automated quality assessment. Positive values indicate the expert rated quality higher 
            than the automated system.
          </p>
        </div>
      </Card>

      {/* Issues Summary */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          Quality Issues
        </h4>

        <div className="space-y-3">
          {overallStats.fields.map(fieldName => {
            const fieldData = metadataQuality[fieldName];
            const allIssues = [
              ...fieldData.issues.completeness.map(i => ({ dimension: 'completeness', text: i })),
              ...fieldData.issues.consistency.map(i => ({ dimension: 'consistency', text: i })),
              ...fieldData.issues.validity.map(i => ({ dimension: 'validity', text: i }))
            ];

            if (allIssues.length === 0) return null;

            return (
              <div key={fieldName} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-gray-900 capitalize mb-2">
                  {getFieldDisplayName(fieldName)}
                </p>
                <ul className="space-y-1">
                  {allIssues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      <span>
                        <span className="font-medium capitalize">{issue.dimension}:</span> {issue.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {overallStats.fields.every(f => {
            const fieldData = metadataQuality[f];
            const totalIssues = fieldData.issues.completeness.length +
                               fieldData.issues.consistency.length +
                               fieldData.issues.validity.length;
            return totalIssues === 0;
          }) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-sm text-gray-700">
                No quality issues detected. All metadata fields meet quality standards.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Recommendations
        </h4>

        <div className="space-y-3">
          {overallStats.finalOverall < 0.7 && (
            <RecommendationItem
              severity="warning"
              text="Overall metadata quality is below target. Review extraction process for improvements."
            />
          )}

          {overallStats.completeness < 0.7 && (
            <RecommendationItem
              severity="warning"
              text="Completeness needs improvement. Ensure all required metadata fields are extracted."
            />
          )}

          {overallStats.consistency < 0.7 && (
            <RecommendationItem
              severity="info"
              text="Format consistency could be improved. Standardize extraction formatting rules."
            />
          )}

          {overallStats.validity < 0.7 && (
            <RecommendationItem
              severity="error"
              text="Validity issues detected. Review validation rules and field type constraints."
            />
          )}

          {Math.abs(overallStats.finalOverall - overallStats.automatedOverall) > 0.15 && (
            <RecommendationItem
              severity="info"
              text={`Significant difference (${formatPercentage(Math.abs(overallStats.finalOverall - overallStats.automatedOverall))}) between automated and user-evaluated quality. Review evaluation criteria alignment.`}
            />
          )}

          {overallStats.finalOverall >= 0.9 && (
            <RecommendationItem
              severity="success"
              text="Excellent metadata quality! Continue maintaining these high standards."
            />
          )}
        </div>
      </Card>
    </div>
  );
};

/**
 * Helper Components
 */

const DimensionCard = ({ label, score, weight, description, color }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', bar: 'bg-green-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', bar: 'bg-purple-500' }
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
        <span className="text-xs font-medium text-gray-500">{weight}</span>
      </div>
      <p className={`text-2xl font-bold ${colors.text} mb-2`}>
        {formatPercentage(score)}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colors.bar} h-2 rounded-full transition-all`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
};

const ExpandableFieldQualityCard = ({ 
  fieldName, 
  fieldData, 
  groundTruth, 
  extracted, 
  expanded, 
  onToggle,
  expertiseMultiplier 
}) => {
  const automatedScore = fieldData.overall;
  const finalScore = fieldData.finalScore;
  const hasDetails = fieldData.rating !== undefined;
  const displayName = getFieldDisplayName(fieldName);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h5 className="font-medium text-gray-900">
                {displayName}
              </h5>
              <Badge className={getScoreBadgeClass(finalScore)}>
                {formatPercentage(finalScore)}
              </Badge>
              {fieldData.rating && (
                <div className="flex items-center gap-1">
                  <StarRating value={fieldData.rating} size="small" />
                </div>
              )}
            </div>
            
            {/* Value Comparison Preview */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Ground Truth:</p>
                <p className="text-gray-900 font-medium truncate">
                  {groundTruth}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Extracted:</p>
                <p className="text-gray-900 font-medium truncate">
                  {extracted}
                </p>
              </div>
            </div>

            {/* Quality Dimensions Mini View */}
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <QualityMetricMini
                label="Completeness"
                score={fieldData.completeness}
                color="blue"
              />
              <QualityMetricMini
                label="Consistency"
                score={fieldData.consistency}
                color="green"
              />
              <QualityMetricMini
                label="Validity"
                score={fieldData.validity}
                color="purple"
              />
            </div>
          </div>

          <div className="flex-shrink-0 ml-4 flex flex-col items-end">
            <div className="text-right mb-2">
              <p className={`text-xl font-bold ${getScoreColor(finalScore)}`}>
                {formatPercentage(finalScore)}
              </p>
              <p className="text-xs text-gray-600">Final Score</p>
            </div>
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
      {expanded && (
        <div className="p-4 pt-0 border-t space-y-4">
          {/* Score Comparison */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h6 className="text-sm font-semibold text-purple-900 mb-2">Score Comparison</h6>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-800">Automated Quality Score:</span>
                <span className={`font-bold ${getScoreColor(automatedScore)}`}>
                  {formatPercentage(automatedScore)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-800">User Rating:</span>
                <div className="flex items-center gap-2">
                  <StarRating value={fieldData.rating || 0} size="small" />
                  <span className="font-medium">{(fieldData.rating || 0).toFixed(1)}/5</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="text-purple-900 font-medium">Final Score (with expertise):</span>
                <span className={`font-bold text-lg ${getScoreColor(finalScore)}`}>
                  {formatPercentage(finalScore)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-purple-700">
                  <strong>Impact:</strong> User evaluation {finalScore > automatedScore ? 'increased' : 'decreased'} 
                  the score by {formatPercentage(Math.abs(finalScore - automatedScore))} due to 
                  {finalScore > automatedScore ? ' positive' : ' critical'} expert assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Quality Breakdown */}
          <div className="p-3 bg-gray-50 rounded border">
            <h6 className="text-sm font-semibold text-gray-900 mb-3">Quality Dimension Breakdown</h6>
            <div className="space-y-3">
              <DimensionDetailRow
                label="Completeness"
                score={fieldData.completeness}
                weight={0.4}
                issues={fieldData.issues.completeness}
                color="blue"
              />
              <DimensionDetailRow
                label="Consistency"
                score={fieldData.consistency}
                weight={0.3}
                issues={fieldData.issues.consistency}
                color="green"
              />
              <DimensionDetailRow
                label="Validity"
                score={fieldData.validity}
                weight={0.3}
                issues={fieldData.issues.validity}
                color="purple"
              />
            </div>

            {/* Calculation */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-gray-700 mb-1">Automated Score Calculation:</p>
              <code className="text-xs block bg-white p-2 rounded">
                ({formatPercentage(fieldData.completeness)} × 0.4) + 
                ({formatPercentage(fieldData.consistency)} × 0.3) + 
                ({formatPercentage(fieldData.validity)} × 0.3) = {formatPercentage(automatedScore)}
              </code>
            </div>
          </div>

          {/* Calculation Details */}
          {fieldData.rating && fieldData.metricDetails && (
            <CalculationMatrix
              metricDetails={fieldData.metricDetails}
              rating={fieldData.rating}
              expertiseMultiplier={expertiseMultiplier}
            />
          )}
        </div>
      )}
    </div>
  );
};

const QualityMetricMini = ({ label, score, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="text-center p-1 bg-gray-50 rounded">
      <p className="text-gray-600 text-xs mb-0.5">{label}</p>
      <p className={`font-semibold text-xs ${colorClasses[color]}`}>
        {formatPercentage(score)}
      </p>
    </div>
  );
};

const DimensionDetailRow = ({ label, score, weight, issues, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={`p-2 rounded border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
          {formatPercentage(score)} × {weight}
        </span>
      </div>
      {issues.length > 0 && (
        <div className="mt-1 text-xs text-gray-700">
          <p className="font-medium">Issues:</p>
          <ul className="list-disc list-inside ml-2">
            {issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RatingDisplay = ({ label, value, automatedScore, finalScore }) => {
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
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Automated: {formatPercentage(automatedScore)}</span>
        <span>Final: {formatPercentage(finalScore)}</span>
      </div>
    </div>
  );
};

const StarRating = ({ value, size = 'medium' }) => {
  const starSize = size === 'small' ? 'h-3 w-3' : size === 'medium' ? 'h-4 w-4' : 'h-5 w-5';
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

const CalculationMatrix = ({ metricDetails, rating, expertiseMultiplier }) => {
  if (!metricDetails) return null;

  return (
    <div className="p-3 bg-gray-50 rounded border">
      <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
        <Calculator className="h-4 w-4 mr-1 text-blue-600" />
        Score Calculation Details
      </h6>
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
            <tr className="border-b bg-blue-50">
              <td className="p-2 border font-medium">Automated Quality</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(metricDetails.automatedOverallScore)}
              </td>
              <td className="p-2 border text-gray-600">
                Weighted quality dimensions
              </td>
            </tr>
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
                {formatPercentage(metricDetails.normalizedRating)}
              </td>
              <td className="p-2 border text-gray-600">
                Scaled to 0-1 range
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border font-medium">System Confidence</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(metricDetails.automaticConfidence)}
              </td>
              <td className="p-2 border text-gray-600">
                U-shaped confidence curve
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border font-medium">Automated Weight</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(metricDetails.automaticWeight)}
              </td>
              <td className="p-2 border text-gray-600">
                Weight for system score
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border font-medium">User Weight</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(metricDetails.userWeight)}
              </td>
              <td className="p-2 border text-gray-600">
                Weight for user rating
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border font-medium">Expertise Multiplier</td>
              <td className="p-2 border text-right font-mono">
                {expertiseMultiplier.toFixed(2)}×
              </td>
              <td className="p-2 border text-gray-600">
                Evaluator's expertise weight
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border font-medium">Agreement Level</td>
              <td className="p-2 border text-right font-mono">
                {formatPercentage(metricDetails.agreement)}
              </td>
              <td className="p-2 border text-gray-600">
                Alignment between system and user
              </td>
            </tr>
            {metricDetails.agreementBonus > 0 && (
              <tr className="border-b bg-green-50">
                <td className="p-2 border font-medium">Agreement Bonus</td>
                <td className="p-2 border text-right font-mono text-green-700">
                  +{formatPercentage(metricDetails.agreementBonus)}
                </td>
                <td className="p-2 border text-gray-600">
                  Bonus for consensus
                </td>
              </tr>
            )}
            <tr className="bg-blue-100 font-bold">
              <td className="p-2 border">Final Score</td>
              <td className="p-2 border text-right font-mono text-blue-700">
                {formatPercentage(metricDetails.finalScore)}
              </td>
              <td className="p-2 border text-gray-600">
                Combined with agreement bonus
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-1">Formula:</p>
        <code className="text-xs block bg-white p-2 rounded">
          Combined = (Automated × {formatPercentage(metricDetails.automaticWeight)}) + (UserRating × {formatPercentage(metricDetails.userWeight)})<br />
          = ({formatPercentage(metricDetails.automatedOverallScore)} × {formatPercentage(metricDetails.automaticWeight)}) + ({formatPercentage(metricDetails.normalizedRating)} × {formatPercentage(metricDetails.userWeight)})<br />
          = {formatPercentage(metricDetails.combinedScore)}<br />
          Final = Combined × (1 + AgreementBonus)<br />
          = {formatPercentage(metricDetails.combinedScore)} × (1 + {formatPercentage(metricDetails.agreementBonus)})<br />
          = {formatPercentage(metricDetails.finalScore)}
        </code>
      </div>
    </div>
  );
};

const RecommendationItem = ({ severity, text }) => {
  const severityConfig = {
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
    warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`flex items-start p-3 rounded ${config.bg}`}>
      <Icon className={`h-5 w-5 ${config.color} mr-3 flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
};

/**
 * Helper Functions
 */

function getFieldDisplayName(fieldId) {
  const displayNameMap = {
    'title': 'Title',
    'authors': 'Authors',
    'doi': 'DOI',
    'publication_year': 'Publication Year',
    'venue': 'Venue/Journal'
  };
  
  return displayNameMap[fieldId] || fieldId.replace(/_/g, ' ');
}

function getScoreColor(score) {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.7) return 'text-blue-600';
  if (score >= 0.5) return 'text-yellow-600';
  if (score >= 0.3) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBadgeClass(score) {
  if (score >= 0.9) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 0.7) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (score >= 0.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (score >= 0.3) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

function getDifferenceColor(diff) {
  if (Math.abs(diff) < 0.05) return 'text-gray-500';
  if (diff > 0) return 'text-green-600';
  return 'text-red-600';
}

function getDifferenceIcon(diff) {
  if (Math.abs(diff) < 0.05) return <Minus className="h-3 w-3 text-gray-500" />;
  if (diff > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
  return <TrendingDown className="h-3 w-3 text-red-600" />;
}

function getProgressColor(percentage) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function avg(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

const Minus = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const TrendingDown = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

export default MetadataQualityPaperDetail;