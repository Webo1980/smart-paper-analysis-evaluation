// src/components/dashboard/quality/MetadataQualityView.jsx

import React, { useMemo, useState } from 'react';
import { Card } from '../../../ui/card';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Info, CheckCircle, AlertTriangle, XCircle,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  HelpCircle, BarChart3, FileText, Calculator, Users
} from 'lucide-react';
import { formatPercentage } from '../../../../utils/formatters';

/**
 * Metadata Quality View Component
 * 
 * Displays aggregated quality analysis for metadata fields across multiple evaluations:
 * - Overall quality metrics (mean, median, std dev)
 * - Quality dimension breakdown (Completeness, Consistency, Validity)
 * - Field-level quality comparison
 * - Quality distribution charts
 * - Issues summary
 * - Detailed explanations of evaluation methodology
 * 
 * IMPORTANT: All scores shown are AGGREGATED across multiple papers and evaluators,
 * incorporating user ratings, expertise weights, and agreement bonuses.
 * 
 * Data Source: aggregatedData.components.metadata
 */
const MetadataQualityView = ({ componentData, papers }) => {
  console.log("MetadataQualityView render", { componentData, papers });
  
  const [expandedSections, setExpandedSections] = useState({
    evaluationMethodology: false,
    dimensionDetails: false,
    fieldAnalysis: {},
    calculationFormulas: false,
    conceptExplanations: false
  });

  // Process and aggregate quality metrics
  const qualityMetrics = useMemo(() => {
    if (!componentData) return null;

    const {
      qualityScores,
      byDimension,
      byField,
      evaluationCount
    } = componentData;

    if (!qualityScores) return null;

    return {
      overall: qualityScores,
      dimensions: byDimension || {},
      fields: byField || {},
      evaluationCount: evaluationCount || 0
    };
  }, [componentData]);

  // Calculate quality distribution
  const qualityDistribution = useMemo(() => {
    if (!componentData?.byField) return null;

    const fields = Object.values(componentData.byField);
    
    return {
      excellent: fields.filter(f => f.overall >= 0.9).length,
      good: fields.filter(f => f.overall >= 0.7 && f.overall < 0.9).length,
      fair: fields.filter(f => f.overall >= 0.5 && f.overall < 0.7).length,
      poor: fields.filter(f => f.overall >= 0.3 && f.overall < 0.5).length,
      critical: fields.filter(f => f.overall < 0.3).length,
      total: fields.length
    };
  }, [componentData]);

  // Identify issues and recommendations
  const issues = useMemo(() => {
    if (!componentData?.byField) return [];

    const issuesList = [];
    
    Object.entries(componentData.byField).forEach(([fieldName, fieldData]) => {
      // Low completeness
      if (fieldData.completeness < 0.5) {
        issuesList.push({
          type: 'low_completeness',
          field: fieldName,
          score: fieldData.completeness,
          severity: 'high',
          dimension: 'completeness',
          message: `${fieldName} has low completeness (${formatPercentage(fieldData.completeness)})`,
          recommendation: 'Ensure all required information is being extracted for this field.'
        });
      }

      // Low consistency
      if (fieldData.consistency < 0.5) {
        issuesList.push({
          type: 'low_consistency',
          field: fieldName,
          score: fieldData.consistency,
          severity: 'medium',
          dimension: 'consistency',
          message: `${fieldName} has low consistency (${formatPercentage(fieldData.consistency)})`,
          recommendation: 'Standardize the format and structure of extracted values.'
        });
      }

      // Low validity
      if (fieldData.validity < 0.5) {
        issuesList.push({
          type: 'low_validity',
          field: fieldName,
          score: fieldData.validity,
          severity: 'high',
          dimension: 'validity',
          message: `${fieldName} has low validity (${formatPercentage(fieldData.validity)})`,
          recommendation: 'Review validation rules and ensure conformance to expected standards.'
        });
      }

      // Overall low quality
      if (fieldData.overall < 0.5) {
        issuesList.push({
          type: 'low_overall',
          field: fieldName,
          score: fieldData.overall,
          severity: 'high',
          dimension: 'overall',
          message: `${fieldName} has low overall quality (${formatPercentage(fieldData.overall)})`,
          recommendation: 'Comprehensive review needed across all quality dimensions.'
        });
      }
    });

    return issuesList.sort((a, b) => a.score - b.score); // Sort by score (worst first)
  }, [componentData]);

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

  if (!componentData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No metadata quality data available.
        </AlertDescription>
      </Alert>
    );
  }

  if (!qualityMetrics) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No quality metrics calculated for metadata.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Explanation */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              Metadata Quality Analysis
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                Aggregated across {qualityMetrics.evaluationCount} evaluations
              </span>
            </h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Comprehensive quality assessment measuring <strong>Completeness</strong> (all information present), 
              <strong> Consistency</strong> (uniform formatting), and <strong>Validity</strong> (standards conformance) 
              across all metadata fields.
            </p>
          </div>
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center text-sm mb-2">
            <Info className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
            <span className="text-gray-700 font-medium">
              Automated Quality Score = (Completeness × 40%) + (Consistency × 30%) + (Validity × 30%)
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-600 ml-6">
            <Users className="h-3 w-3 mr-1" />
            <span>
              Final scores incorporate user ratings, expertise weights, and system-user agreement bonuses
            </span>
          </div>
        </div>
      </Card>

      {/* Evaluation Methodology Explanation */}
      <Card className="overflow-hidden border-purple-200">
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-gradient-to-r from-purple-50 to-blue-50"
          onClick={() => toggleSection('evaluationMethodology')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                Understanding the Evaluation Methodology
              </h4>
            </div>
            <button 
              className="p-2 rounded hover:bg-white/50 transition-colors"
              aria-label={expandedSections.evaluationMethodology ? "Collapse" : "Expand"}
            >
              {expandedSections.evaluationMethodology ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          
          {!expandedSections.evaluationMethodology && (
            <p className="text-xs text-gray-600 mt-2">
              Click to learn how quality scores combine automated metrics with expertise-weighted 
              user evaluations and agreement bonuses
            </p>
          )}
        </div>

        {expandedSections.evaluationMethodology && (
          <div className="p-4 pt-0 space-y-4 border-t">
            {/* Overview Section */}
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <h5 className="text-sm font-semibold text-blue-900 mb-2">
                Evaluation Methodology Overview
              </h5>
              <p className="text-xs text-blue-700 leading-relaxed mb-2">
                Our evaluation system combines automated quality metrics with expert human 
                assessments to produce balanced quality scores. The scores you see are 
                <strong> aggregated across multiple papers and evaluators</strong>, with each 
                individual evaluation incorporating:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside ml-2">
                <li><strong>Automated Quality Analysis:</strong> Completeness, consistency, and validity checks</li>
                <li><strong>User Rating:</strong> Expert evaluator's 1-5 star rating (normalized to 0-1)</li>
                <li><strong>Expertise Multiplier:</strong> Weight based on evaluator's role and experience (1.0× to 2.0×)</li>
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
                    Automated Score = (Completeness × 0.4) + (Consistency × 0.3) + (Validity × 0.3)
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
                  <p className="text-xs font-medium text-gray-700 mb-1">Step 3: Combine Scores with Weights</p>
                  <code className="text-xs block bg-white p-2 rounded border">
                    Combined Score = (Automated Score × Auto Weight) + (User Rating × User Weight)
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
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Step 5: Aggregate Across Evaluations</p>
                  <code className="text-xs block bg-white p-2 rounded border">
                    Mean Quality = Average of all Final Scores<br />
                    Median Quality = Middle value of sorted Final Scores<br />
                    Std Deviation = Variability measure across evaluations
                  </code>
                </div>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <h5 className="text-sm font-semibold text-green-900 mb-2">
                Example: Why Overall Score ≠ Simple Weighted Sum
              </h5>
              <div className="text-xs text-green-700 space-y-2">
                <div>
                  <p className="font-medium">Scenario:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>Completeness: 10% (weight: 40%)</li>
                    <li>Consistency: 50% (weight: 30%)</li>
                    <li>Validity: 30% (weight: 30%)</li>
                    <li>User Rating: 3/5 stars (60%)</li>
                    <li>Expertise Multiplier: 1.5×</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Calculation:</p>
                  <code className="block bg-white p-2 rounded text-xs mt-1">
                    Automated Score = (10% × 0.4) + (50% × 0.3) + (30% × 0.3) = 28%<br />
                    System Confidence = U-Curve(0.28) ≈ 69%<br />
                    Auto Weight = 0.69 × 0.5 = 0.345 → Normalized: 45%<br />
                    User Weight = 1.5 × 0.5 = 0.75 → Normalized: 55%<br />
                    Combined = (28% × 0.45) + (60% × 0.55) = 12.6% + 33% = 45.6%<br />
                    Agreement = 1 - |0.28 - 0.60| = 0.68<br />
                    Agreement Bonus = 0.68 × 0.1 = 0.068 (6.8%)<br />
                    Final Score = 45.6% × (1 + 0.068) = 48.7%
                  </code>
                </div>
                
                <div className="pt-2 border-t border-green-300">
                  <p className="font-semibold">
                    Result: Final Score (48.7%) is higher than simple weighted sum (28%) because it 
                    incorporates the expert's 60% rating with 1.5× expertise weight, plus agreement bonus.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Principles */}
            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <h5 className="text-sm font-semibold text-purple-900 mb-2">
                Key Evaluation Principles
              </h5>
              <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
                <li>
                  <strong>Dynamic Weighting:</strong> System and user weights adjust based on 
                  confidence and expertise levels
                </li>
                <li>
                  <strong>U-Shaped Confidence:</strong> System is most uncertain at 50% (needs human input), 
                  most confident at extremes (0% or 100%)
                </li>
                <li>
                  <strong>Expertise Multiplier:</strong> Expert evaluations carry more weight 
                  (1.0× to 2.0×) based on role and experience
                </li>
                <li>
                  <strong>Consensus Bonus:</strong> Agreement between system and expert receives 
                  up to 10% bonus
                </li>
                <li>
                  <strong>Aggregation:</strong> All displayed scores are means/medians across 
                  multiple papers and evaluators
                </li>
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* Overall Quality Metrics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Overall Metadata Quality
          </h3>
          <span className="text-sm text-gray-500 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Based on {qualityMetrics.evaluationCount} evaluations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QualityMetricCard
            label="Mean Quality"
            value={qualityMetrics.overall.mean}
            icon={<TrendingUp className="h-5 w-5" />}
            description="Average quality across all evaluations"
          />
          <QualityMetricCard
            label="Median Quality"
            value={qualityMetrics.overall.median}
            icon={<Minus className="h-5 w-5" />}
            description="Middle value in quality distribution"
          />
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Min Quality</span>
              <span className={`text-lg font-bold ${getScoreColor(qualityMetrics.overall.min)}`}>
                {formatPercentage(qualityMetrics.overall.min)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Max Quality</span>
              <span className={`text-lg font-bold ${getScoreColor(qualityMetrics.overall.max)}`}>
                {formatPercentage(qualityMetrics.overall.max)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Quality range across evaluations</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Std Deviation</span>
              <span className="text-lg font-bold text-blue-600">
                {formatPercentage(qualityMetrics.overall.std)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Variance</span>
              <span className="text-lg font-bold text-blue-600">
                {formatPercentage(Math.pow(qualityMetrics.overall.std, 2))}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Quality consistency measure</p>
          </div>
        </div>
      </Card>

      {/* Quality Dimension Breakdown with Details */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            Quality Dimensions (Automated Components)
            <button
              onClick={() => toggleSection('dimensionDetails')}
              className="ml-2 text-blue-600 hover:text-blue-700"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </h3>
          <button
            onClick={() => toggleSection('dimensionDetails')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            {expandedSections.dimensionDetails ? 'Hide Details' : 'Show Details'}
            {expandedSections.dimensionDetails ? 
              <ChevronUp className="h-4 w-4 ml-1" /> : 
              <ChevronDown className="h-4 w-4 ml-1" />
            }
          </button>
        </div>

        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> These dimension scores are the <strong>automated components only</strong>. 
            The final overall quality scores shown in the field table include user ratings, expertise weights, 
            and agreement bonuses as explained in the methodology above.
          </p>
        </div>

        <div className="space-y-4">
          <DimensionBar
            label="Completeness (40% weight)"
            score={qualityMetrics.dimensions.completeness?.mean || 0}
            std={qualityMetrics.dimensions.completeness?.std || 0}
            min={qualityMetrics.dimensions.completeness?.min || 0}
            max={qualityMetrics.dimensions.completeness?.max || 0}
            color="blue"
            description="All required information is present"
            expanded={expandedSections.dimensionDetails}
          />
          <DimensionBar
            label="Consistency (30% weight)"
            score={qualityMetrics.dimensions.consistency?.mean || 0}
            std={qualityMetrics.dimensions.consistency?.std || 0}
            min={qualityMetrics.dimensions.consistency?.min || 0}
            max={qualityMetrics.dimensions.consistency?.max || 0}
            color="green"
            description="Uniform structure and formatting"
            expanded={expandedSections.dimensionDetails}
          />
          <DimensionBar
            label="Validity (30% weight)"
            score={qualityMetrics.dimensions.validity?.mean || 0}
            std={qualityMetrics.dimensions.validity?.std || 0}
            min={qualityMetrics.dimensions.validity?.min || 0}
            max={qualityMetrics.dimensions.validity?.max || 0}
            color="purple"
            description="Conforms to expected standards"
            expanded={expandedSections.dimensionDetails}
          />
        </div>

        {/* Detailed Dimension Explanations */}
        {expandedSections.dimensionDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Understanding Quality Dimensions
            </h4>
            
            <div className="space-y-4">
              <DimensionExplanation
                title="Completeness (40% weight)"
                description="Measures whether all required information is present in the extracted value."
                examples={[
                  "Missing required fields or data elements",
                  "Truncated information or partial extraction",
                  "Incomplete field values"
                ]}
                color="blue"
              />
              
              <DimensionExplanation
                title="Consistency (30% weight)"
                description="Evaluates the uniform formatting and structure in the extracted value."
                examples={[
                  "Mixed date formats (e.g., 2024 vs 24)",
                  "Inconsistent naming conventions",
                  "Irregular spacing or delimiters"
                ]}
                color="green"
              />
              
              <DimensionExplanation
                title="Validity (30% weight)"
                description="Checks if the extracted value conforms to expected formats and reasonable ranges."
                examples={[
                  "Values outside expected ranges",
                  "Incorrect data types or format patterns",
                  "Nonsensical or unrealistic values"
                ]}
                color="purple"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Field-Level Quality Table with Expandable Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Field-Level Quality Analysis
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>Important:</strong> The "Overall" scores include user ratings + expertise weights + agreement bonuses, 
          not just the weighted sum of automated dimensions.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 border-b">Field</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Completeness</span>
                    <span className="text-xs font-normal text-gray-500">(Automated 40%)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Consistency</span>
                    <span className="text-xs font-normal text-gray-500">(Automated 30%)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Validity</span>
                    <span className="text-xs font-normal text-gray-500">(Automated 30%)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Overall</span>
                    <span className="text-xs font-normal text-gray-500">(With User + Expertise)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Status</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(qualityMetrics.fields).map(([fieldName, fieldData]) => (
                <React.Fragment key={fieldName}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900 capitalize">
                      {fieldName.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${getScoreColor(fieldData.completeness)}`}>
                        {formatPercentage(fieldData.completeness)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${getScoreColor(fieldData.consistency)}`}>
                        {formatPercentage(fieldData.consistency)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${getScoreColor(fieldData.validity)}`}>
                        {formatPercentage(fieldData.validity)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${getScoreColor(fieldData.overall)}`}>
                        {formatPercentage(fieldData.overall)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {getQualityStatusIcon(fieldData.overall)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleSection('fieldAnalysis', fieldName)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {expandedSections.fieldAnalysis?.[fieldName] ? (
                          <ChevronUp className="h-4 w-4 mx-auto" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mx-auto" />
                        )}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Field Analysis */}
                  {expandedSections.fieldAnalysis?.[fieldName] && (
                    <tr>
                      <td colSpan="7" className="p-4 bg-gray-50">
                        <FieldQualityAnalysis 
                          fieldName={fieldName}
                          fieldData={fieldData}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Formula Toggle */}
        <div className="mt-4">
          <button
            onClick={() => toggleSection('calculationFormulas')}
            className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-between"
          >
            <span className="font-medium text-blue-900 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              {expandedSections.calculationFormulas ? 'Hide' : 'Show'} Complete Quality Calculation Formula
            </span>
            {expandedSections.calculationFormulas ? 
              <ChevronUp className="h-5 w-5 text-blue-600" /> : 
              <ChevronDown className="h-5 w-5 text-blue-600" />
            }
          </button>
          
          {expandedSections.calculationFormulas && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">Quality Score Calculation (Full Process)</h4>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Step 1: Automated Quality Score</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    Automated Quality = (Completeness × 0.4) + (Consistency × 0.3) + (Validity × 0.3)
                  </code>
                  <p className="text-xs text-gray-600 mt-1">
                    This is the purely algorithmic assessment based on data analysis.
                  </p>
                </div>
                
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Step 2: Dynamic Weight Calculation</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    System Confidence = 1 - ((|Score - 0.5| × 2)²)<br />
                    Auto Weight = max(0.3, 0.5 × System Confidence)<br />
                    User Weight = 0.5 × Expertise Multiplier<br />
                    Total = Auto Weight + User Weight<br />
                    Normalized Auto = Auto Weight / Total<br />
                    Normalized User = User Weight / Total
                  </code>
                  <p className="text-xs text-gray-600 mt-1">
                    Weights adjust based on system confidence (U-shaped curve) and user expertise.
                  </p>
                </div>
                
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Step 3: Combine with User Rating</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    Normalized Rating = User Rating / 5<br />
                    Combined Score = (Automated × Normalized Auto) + (Normalized Rating × Normalized User)
                  </code>
                  <p className="text-xs text-gray-600 mt-1">
                    User rating (1-5 stars) is normalized and weighted by expertise.
                  </p>
                </div>
                
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Step 4: Agreement Bonus</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    Agreement = 1 - |Automated Score - Normalized Rating|<br />
                    Agreement Bonus = Agreement × 0.1<br />
                    Final Score = Combined Score × (1 + Agreement Bonus)
                  </code>
                  <p className="text-xs text-gray-600 mt-1">
                    Up to 10% bonus when system and expert agree.
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Why Overall ≠ Simple Weighted Sum
                  </p>
                  <p className="text-xs text-blue-700">
                    The <strong>Overall Quality Score</strong> you see in the table is <strong>NOT</strong> just 
                    (Completeness × 0.4 + Consistency × 0.3 + Validity × 0.3). It includes the user's rating, 
                    weighted by their expertise level, plus an agreement bonus when the system and user assessments 
                    align. This produces a more balanced and reliable quality measure that combines algorithmic 
                    precision with human expert judgment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quality Distribution */}
      {qualityDistribution && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quality Distribution Across Fields
          </h3>

          <div className="grid grid-cols-5 gap-4 mb-4">
            <DistributionCard
              label="Excellent"
              count={qualityDistribution.excellent}
              total={qualityDistribution.total}
              color="green"
              range="≥90%"
            />
            <DistributionCard
              label="Good"
              count={qualityDistribution.good}
              total={qualityDistribution.total}
              color="blue"
              range="70-89%"
            />
            <DistributionCard
              label="Fair"
              count={qualityDistribution.fair}
              total={qualityDistribution.total}
              color="yellow"
              range="50-69%"
            />
            <DistributionCard
              label="Poor"
              count={qualityDistribution.poor}
              total={qualityDistribution.total}
              color="orange"
              range="30-49%"
            />
            <DistributionCard
              label="Critical"
              count={qualityDistribution.critical}
              total={qualityDistribution.total}
              color="red"
              range="<30%"
            />
          </div>

          {/* Visual Distribution Bar */}
          <div className="w-full h-8 flex rounded-lg overflow-hidden border">
            {qualityDistribution.excellent > 0 && (
              <div 
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(qualityDistribution.excellent / qualityDistribution.total) * 100}%` }}
              >
                {qualityDistribution.excellent > 0 && `${qualityDistribution.excellent}`}
              </div>
            )}
            {qualityDistribution.good > 0 && (
              <div 
                className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(qualityDistribution.good / qualityDistribution.total) * 100}%` }}
              >
                {qualityDistribution.good > 0 && `${qualityDistribution.good}`}
              </div>
            )}
            {qualityDistribution.fair > 0 && (
              <div 
                className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(qualityDistribution.fair / qualityDistribution.total) * 100}%` }}
              >
                {qualityDistribution.fair > 0 && `${qualityDistribution.fair}`}
              </div>
            )}
            {qualityDistribution.poor > 0 && (
              <div 
                className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(qualityDistribution.poor / qualityDistribution.total) * 100}%` }}
              >
                {qualityDistribution.poor > 0 && `${qualityDistribution.poor}`}
              </div>
            )}
            {qualityDistribution.critical > 0 && (
              <div 
                className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(qualityDistribution.critical / qualityDistribution.total) * 100}%` }}
              >
                {qualityDistribution.critical > 0 && `${qualityDistribution.critical}`}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Issues Summary */}
      {issues.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            Quality Issues Detected ({issues.length})
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {issues.slice(0, 20).map((issue, idx) => (
              <div 
                key={idx} 
                className={`
                  p-4 rounded-lg border
                  ${issue.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium mr-2
                        ${issue.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {issue.dimension}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 capitalize mb-1">
                      {issue.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">{issue.message}</p>
                    <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                      <strong className="text-blue-600">Recommendation:</strong> {issue.recommendation}
                    </p>
                  </div>
                  {issue.severity === 'high' ? (
                    <XCircle className="h-5 w-5 text-red-600 ml-2 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 ml-2 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {issues.length > 20 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing 20 of {issues.length} issues
              </p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Issues →
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          Quality Improvement Recommendations
        </h3>

        <div className="space-y-3">
          {qualityMetrics.overall.mean < 0.7 && (
            <RecommendationItem
              icon={<TrendingDown className="h-5 w-5 text-orange-600" />}
              title="Improve Overall Quality"
              description={`Mean metadata quality is ${formatPercentage(qualityMetrics.overall.mean)}. Focus on improving completeness, consistency, and validity across all fields.`}
              priority="high"
            />
          )}

          {qualityMetrics.dimensions.completeness?.mean < 0.7 && (
            <RecommendationItem
              icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
              title="Address Completeness Issues"
              description="Several fields have incomplete information. Ensure all required metadata is extracted. Review extraction pipeline for missing data."
              priority="high"
            />
          )}

          {qualityMetrics.dimensions.consistency?.mean < 0.7 && (
            <RecommendationItem
              icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
              title="Improve Consistency"
              description="Formatting inconsistencies detected. Standardize metadata extraction format and implement consistent naming conventions."
              priority="medium"
            />
          )}

          {qualityMetrics.dimensions.validity?.mean < 0.7 && (
            <RecommendationItem
              icon={<XCircle className="h-5 w-5 text-red-600" />}
              title="Fix Validity Issues"
              description="Some extracted values don't conform to expected standards. Review validation rules and ensure proper format compliance."
              priority="high"
            />
          )}

          {qualityMetrics.overall.std > 0.3 && (
            <RecommendationItem
              icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
              title="Reduce Quality Variance"
              description={`High standard deviation (${formatPercentage(qualityMetrics.overall.std)}) indicates inconsistent quality across fields. Focus on standardizing extraction processes.`}
              priority="medium"
            />
          )}

          {qualityMetrics.overall.mean >= 0.8 && qualityMetrics.overall.std < 0.2 && issues.length === 0 && (
            <RecommendationItem
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              title="Excellent Quality Performance"
              description="Metadata extraction quality is excellent with high consistency! Continue monitoring for sustained quality and consider this as a baseline standard."
              priority="low"
            />
          )}

          {issues.length > 10 && (
            <RecommendationItem
              icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
              title="Multiple Issues Detected"
              description={`${issues.length} quality issues identified across fields. Prioritize addressing high-severity issues first, particularly those affecting completeness and validity.`}
              priority="high"
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

const QualityMetricCard = ({ label, value, icon, description }) => {
  const scoreColor = getScoreColor(value);
  const bgColor = getScoreBg(value);

  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${getBorderColor(value)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={scoreColor}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${scoreColor} mb-1`}>
        {formatPercentage(value)}
      </p>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
};

const DimensionBar = ({ label, score, std, min, max, color, description, expanded }) => {
  const colorClasses = {
    blue: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    green: { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    purple: { bar: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' }
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
        <div className="text-right ml-4">
          <p className={`text-xl font-bold ${colors.text}`}>
            {formatPercentage(score)}
          </p>
          <p className="text-xs text-gray-600">±{formatPercentage(std)}</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 relative">
        <div
          className={`${colors.bar} h-2.5 rounded-full transition-all`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Minimum:</span>
            <span className={`font-semibold ${getScoreColor(min)}`}>
              {formatPercentage(min)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Maximum:</span>
            <span className={`font-semibold ${getScoreColor(max)}`}>
              {formatPercentage(max)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Range:</span>
            <span className="font-semibold text-gray-700">
              {formatPercentage(max - min)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">CV:</span>
            <span className="font-semibold text-gray-700">
              {score > 0 ? formatPercentage(std / score) : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const DimensionExplanation = ({ title, description, examples, color }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <h5 className="font-semibold text-gray-900 mb-2">{title}</h5>
      <p className="text-sm text-gray-700 mb-2">{description}</p>
      <div className="text-sm">
        <p className="font-medium text-gray-700 mb-1">Common issues include:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          {examples.map((example, idx) => (
            <li key={idx}>{example}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const FieldQualityAnalysis = ({ fieldName, fieldData }) => {
  const weights = { completeness: 0.4, consistency: 0.3, validity: 0.3 };
  
  // Calculate automated score from dimensions
  const automatedScore = (
    fieldData.completeness * weights.completeness +
    fieldData.consistency * weights.consistency +
    fieldData.validity * weights.validity
  );
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 capitalize">
          {fieldName.replace(/_/g, ' ')} - Detailed Quality Analysis
        </h4>
        <span className={`text-lg font-bold ${getScoreColor(fieldData.overall)}`}>
          Overall: {formatPercentage(fieldData.overall)}
        </span>
      </div>

      {/* Show difference between automated and overall */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-900">Automated Quality Score:</span>
          <span className={`text-lg font-bold ${getScoreColor(automatedScore)}`}>
            {formatPercentage(automatedScore)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-900">Final Quality Score (with user input):</span>
          <span className={`text-lg font-bold ${getScoreColor(fieldData.overall)}`}>
            {formatPercentage(fieldData.overall)}
          </span>
        </div>
        <div className="pt-2 border-t border-purple-300">
          <p className="text-xs text-purple-700">
            <strong>Difference:</strong> {formatPercentage(Math.abs(fieldData.overall - automatedScore))} 
            {fieldData.overall > automatedScore ? ' higher' : ' lower'} than automated score due to 
            user ratings, expertise weights, and agreement bonuses.
          </p>
        </div>
      </div>

      {/* Automated Quality Calculation Breakdown */}
      <div className="p-4 bg-white rounded-lg border">
        <h5 className="font-medium text-gray-700 mb-3">Automated Quality Calculation (Step 1)</h5>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Completeness ({formatPercentage(weights.completeness)} weight):</span>
            <div className="flex items-center">
              <span className={`font-semibold mr-2 ${getScoreColor(fieldData.completeness)}`}>
                {formatPercentage(fieldData.completeness)}
              </span>
              <span className="text-gray-500">
                × {formatPercentage(weights.completeness)} = {formatPercentage(fieldData.completeness * weights.completeness)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Consistency ({formatPercentage(weights.consistency)} weight):</span>
            <div className="flex items-center">
              <span className={`font-semibold mr-2 ${getScoreColor(fieldData.consistency)}`}>
                {formatPercentage(fieldData.consistency)}
              </span>
              <span className="text-gray-500">
                × {formatPercentage(weights.consistency)} = {formatPercentage(fieldData.consistency * weights.consistency)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Validity ({formatPercentage(weights.validity)} weight):</span>
            <div className="flex items-center">
              <span className={`font-semibold mr-2 ${getScoreColor(fieldData.validity)}`}>
                {formatPercentage(fieldData.validity)}
              </span>
              <span className="text-gray-500">
                × {formatPercentage(weights.validity)} = {formatPercentage(fieldData.validity * weights.validity)}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t flex items-center justify-between font-semibold">
            <span>Automated Score:</span>
            <span className={getScoreColor(automatedScore)}>
              {formatPercentage(automatedScore)}
            </span>
          </div>
        </div>
      </div>

      {/* Additional processing explanation */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900 font-medium mb-1">Steps 2-4: User Rating Integration</p>
        <p className="text-xs text-blue-700">
          The automated score ({formatPercentage(automatedScore)}) is then combined with user ratings using dynamic weights 
          (based on system confidence and evaluator expertise), plus an agreement bonus when system and user align. 
          This produces the final overall score of {formatPercentage(fieldData.overall)}.
        </p>
      </div>

      {/* Visual Quality Comparison */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-gray-600 mb-1">Completeness</p>
          <p className={`text-lg font-bold ${getScoreColor(fieldData.completeness)}`}>
            {formatPercentage(fieldData.completeness)}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${fieldData.completeness * 100}%` }}
            />
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-xs text-gray-600 mb-1">Consistency</p>
          <p className={`text-lg font-bold ${getScoreColor(fieldData.consistency)}`}>
            {formatPercentage(fieldData.consistency)}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-green-500 h-1.5 rounded-full"
              style={{ width: `${fieldData.consistency * 100}%` }}
            />
          </div>
        </div>
        <div className="p-3 bg-purple-50 rounded border border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Validity</p>
          <p className={`text-lg font-bold ${getScoreColor(fieldData.validity)}`}>
            {formatPercentage(fieldData.validity)}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{ width: `${fieldData.validity * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Field-Specific Insights */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h5 className="font-medium text-gray-700 mb-2">Field-Specific Insights</h5>
        <div className="space-y-2 text-sm text-gray-600">
          {getFieldSpecificInsights(fieldName, fieldData)}
        </div>
      </div>
    </div>
  );
};

const DistributionCard = ({ label, count, total, color, range }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colorClasses = {
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' }
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
      <p className="text-xs text-gray-600 mt-1">{percentage.toFixed(1)}%</p>
      <p className="text-xs text-gray-500 mt-1">{range}</p>
    </div>
  );
};

const RecommendationItem = ({ icon, title, description, priority = 'medium' }) => {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50'
  };

  const priorityLabels = {
    high: 'HIGH PRIORITY',
    medium: 'MEDIUM PRIORITY',
    low: 'LOW PRIORITY'
  };

  const priorityTextColors = {
    high: 'text-red-700',
    medium: 'text-yellow-700',
    low: 'text-green-700'
  };

  return (
    <div className={`flex items-start p-4 rounded-lg border ${priorityColors[priority]}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="ml-3 flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-gray-900">{title}</p>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${priorityTextColors[priority]} bg-white`}>
            {priorityLabels[priority]}
          </span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

/**
 * Helper Functions
 */

function getScoreColor(score) {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.7) return 'text-blue-600';
  if (score >= 0.5) return 'text-yellow-600';
  if (score >= 0.3) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBg(score) {
  if (score >= 0.9) return 'bg-green-50';
  if (score >= 0.7) return 'bg-blue-50';
  if (score >= 0.5) return 'bg-yellow-50';
  if (score >= 0.3) return 'bg-orange-50';
  return 'bg-red-50';
}

function getBorderColor(score) {
  if (score >= 0.9) return 'border-green-200';
  if (score >= 0.7) return 'border-blue-200';
  if (score >= 0.5) return 'border-yellow-200';
  if (score >= 0.3) return 'border-orange-200';
  return 'border-red-200';
}

function getQualityStatusIcon(score) {
  if (score >= 0.9) return <CheckCircle className="h-5 w-5 text-green-600" />;
  if (score >= 0.7) return <CheckCircle className="h-5 w-5 text-blue-600" />;
  if (score >= 0.5) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  if (score >= 0.3) return <AlertTriangle className="h-5 w-5 text-orange-600" />;
  return <XCircle className="h-5 w-5 text-red-600" />;
}

function getFieldSpecificInsights(fieldName, fieldData) {
  const insights = [];
  const fieldLower = fieldName.toLowerCase();

  // Calculate automated score
  const automatedScore = (fieldData.completeness * 0.4) + (fieldData.consistency * 0.3) + (fieldData.validity * 0.3);

  // General insights based on scores
  if (fieldData.completeness < 0.5) {
    insights.push(
      <div key="completeness" className="flex items-start">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Low completeness indicates missing or incomplete data for this field.</span>
      </div>
    );
  }

  if (fieldData.consistency < 0.5) {
    insights.push(
      <div key="consistency" className="flex items-start">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Formatting inconsistencies detected. Consider standardizing the format.</span>
      </div>
    );
  }

  if (fieldData.validity < 0.5) {
    insights.push(
      <div key="validity" className="flex items-start">
        <XCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Values may not conform to expected standards or formats.</span>
      </div>
    );
  }

  // Insight about user rating impact
  if (Math.abs(fieldData.overall - automatedScore) > 0.15) {
    const direction = fieldData.overall > automatedScore ? 'increased' : 'decreased';
    const impact = Math.abs(fieldData.overall - automatedScore);
    insights.push(
      <div key="user-impact" className="flex items-start">
        <Info className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>
          User evaluations {direction} the score by {formatPercentage(impact)} compared to automated analysis, 
          indicating {direction === 'increased' ? 'more positive human assessment' : 'concerns flagged by evaluators'}.
        </span>
      </div>
    );
  }

  // Field-specific insights
  if (fieldLower === 'doi') {
    insights.push(
      <div key="doi-specific" className="flex items-start">
        <Info className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>DOI should follow pattern: 10.XXXX/suffix. Check for unnecessary prefixes or formatting issues.</span>
      </div>
    );
  }

  if (fieldLower === 'authors') {
    insights.push(
      <div key="authors-specific" className="flex items-start">
        <Info className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Author names should be consistently formatted (e.g., "Last, First" or "First Last"). Check for special characters.</span>
      </div>
    );
  }

  if (fieldLower === 'year' || fieldLower === 'publicationyear' || fieldLower === 'publication_year') {
    insights.push(
      <div key="year-specific" className="flex items-start">
        <Info className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Year should be a 4-digit number between 1900 and current year.</span>
      </div>
    );
  }

  if (fieldLower === 'title') {
    insights.push(
      <div key="title-specific" className="flex items-start">
        <Info className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Title should be complete with proper capitalization. Check for truncation or missing words.</span>
      </div>
    );
  }

  // All fields performing well
  if (fieldData.completeness >= 0.9 && fieldData.consistency >= 0.9 && fieldData.validity >= 0.9) {
    insights.push(
      <div key="excellent" className="flex items-start">
        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Excellent quality across all dimensions! This field is performing very well.</span>
      </div>
    );
  }

  // Default insight if no specific ones
  if (insights.length === 0) {
    insights.push(
      <div key="default" className="flex items-start">
        <Info className="h-4 w-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
        <span>Field quality is acceptable. Continue monitoring for consistency.</span>
      </div>
    );
  }

  return insights;
}

export default MetadataQualityView;