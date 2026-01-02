import React, { useState, useCallback } from 'react';
import { Card } from '../../../ui/card';
import { Progress } from '../../../ui/progress';
import { ChevronDown, ChevronUp, CheckCircle, FileText, Edit } from 'lucide-react';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import { 
  TEXT_CONFIG, 
  METRIC_CONFIG, 
  QUALITY_WEIGHTS, 
  FORMULA_CONFIG, 
  METRIC_EXPLANATIONS 
} from '../config/contentConfig';
import PropertyCoverageAnalysis from './PropertyCoverageAnalysis';
import EvidenceQualityAnalysis from './EvidenceQualityAnalysis';
import ContentEditAnalysis from './ContentEditAnalysis';
import { getEditScore } from '../utils/editAnalysisUtils';

/**
 * Collapsible section for content quality analysis
 */
const CollapsibleSection = ({ title, icon: Icon, score, isExpanded, toggleExpanded, children }) => {
  return (
    <div className="border rounded overflow-hidden">
      <div 
        className="flex items-center justify-between cursor-pointer p-3 border-b"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          {Icon && <Icon className="h-4 w-4 mr-2 text-gray-700" />}
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        <div className="flex items-center">
          <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${getStatusBadgeColor(score)}`}>
            {formatPercentage(score)}
          </span>
          {isExpanded ? 
            <ChevronUp className="h-4 w-4 text-gray-500" /> : 
            <ChevronDown className="h-4 w-4 text-gray-500" />
          }
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Component for analyzing content quality with detailed metrics
 */
const ContentQualityMetrics = ({
  metrics,
  paperContent,
  templateProperties,
  textSections,
  rating,
  expertiseMultiplier,
  evaluationComparison
}) => {
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    propertyCoverage: false,
    evidenceQuality: false,
    editAnalysis: false
  });

  // Toggle section expansion
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  // Format ratings for display
  const ratingDisplay = rating ? `${rating}/5` : '0/5';
  
  // Check if we have valid metrics
  const hasMetrics = metrics && (
    metrics.propertyCoverage || 
    metrics.evidenceQuality || 
    metrics.valueAccuracy
  );
  
  // Safely get scores
  const propertyCoverageScore = metrics?.propertyCoverage?.score || 0;
  const evidenceQualityScore = metrics?.evidenceQuality?.score || 0;
  const valueAccuracyScore = metrics?.valueAccuracy?.score || 0;
  
  // Use centralized edit score calculation
  const editScore = getEditScore(metrics, evaluationComparison);
  
  // Calculate weighted scores
  const weightedCoverageScore = propertyCoverageScore * QUALITY_WEIGHTS.propertyCoverage;
  const weightedEvidenceScore = evidenceQualityScore * QUALITY_WEIGHTS.evidenceQuality;
  const weightedAccuracyScore = valueAccuracyScore * QUALITY_WEIGHTS.valueAccuracy;
  
  // Calculate overall score
  const overallScore = weightedCoverageScore + weightedEvidenceScore + weightedAccuracyScore;
  
  // Prepare metric definitions for BaseContentMetrics
  const metricDefinitions = {
    propertyCoverage: (refSpan, extractedSpan) => METRIC_EXPLANATIONS.propertyCoverage.description,
    evidenceQuality: (refSpan, extractedSpan) => METRIC_EXPLANATIONS.evidenceQuality.description,
    valueAccuracy: (refSpan, extractedSpan) => METRIC_EXPLANATIONS.valueAccuracy.description,
    overallQuality: (refSpan, extractedSpan) => METRIC_EXPLANATIONS.overallQuality.description
  };

  // Render quality metrics table
  const renderQualityTable = () => {
    return (
      <div className="mb-3 mt-3 border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left border-b">Quality Dimension</th>
              <th className="p-2 text-left border-b">Property Coverage ({(QUALITY_WEIGHTS.propertyCoverage * 100).toFixed(0)}%)</th>
              <th className="p-2 text-left border-b">Evidence Quality ({(QUALITY_WEIGHTS.evidenceQuality * 100).toFixed(0)}%)</th>
              <th className="p-2 text-left border-b">Value Accuracy ({(QUALITY_WEIGHTS.valueAccuracy * 100).toFixed(0)}%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
              <td className="p-2 border-r">
                <div className="whitespace-normal">
                  {METRIC_EXPLANATIONS.propertyCoverage.description}
                </div>
              </td>
              <td className="p-2 border-r">
                <div className="whitespace-normal">
                  {METRIC_EXPLANATIONS.evidenceQuality.description}
                </div>
              </td>
              <td className="p-2">
                <div className="whitespace-normal">
                  {METRIC_EXPLANATIONS.valueAccuracy.description}
                </div>
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 border-r font-medium bg-gray-50">Assessment</td>
              <td className="p-2 border-r align-top">
                <div className="text-xs">
                  {metrics?.propertyCoverage?.details?.annotatedCount || 0} of {metrics?.propertyCoverage?.details?.totalProperties || 0} properties annotated
                </div>
                <div className="text-xs mt-1">
                  {metrics?.propertyCoverage?.details?.dataTypeMatchCount || 0} with correct data types
                </div>
                <div className="text-xs mt-1">
                  {metrics?.propertyCoverage?.details?.completeValueCount || 0} with complete values
                </div>
              </td>
              <td className="p-2 border-r align-top">
                <div className="text-xs">
                  {metrics?.evidenceQuality?.details?.validEvidenceCount || 0} of {metrics?.evidenceQuality?.details?.totalEvidenceCount || 0} evidence citations valid
                </div>
                <div className="text-xs mt-1">
                  Average similarity: {formatPercentage(metrics?.evidenceQuality?.details?.averageSimilarity || 0)}
                </div>
                <div className="text-xs mt-1">
                  Contextual relevance: {formatPercentage(metrics?.evidenceQuality?.details?.contextualRelevance || 0)}
                </div>
              </td>
              <td className="p-2 align-top">
                <div className="text-xs">
                  {metrics?.valueAccuracy?.details?.accurateValues || 0} of {metrics?.valueAccuracy?.details?.totalValues || 0} values accurate
                </div>
                <div className="text-xs mt-1">
                  {metrics?.valueAccuracy?.details?.inaccurateValues?.length || 0} values need improvement
                </div>
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border-r font-medium">Component Score</td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(propertyCoverageScore)}
              </td>
              <td className="p-2 border-r font-medium">
                {formatPercentage(evidenceQualityScore)}
              </td>
              <td className="p-2 font-medium">
                {formatPercentage(valueAccuracyScore)}
              </td>
            </tr>
            <tr>
              <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage(weightedCoverageScore)}
              </td>
              <td className="p-2 border-r text-blue-700 font-medium">
                {formatPercentage(weightedEvidenceScore)}
              </td>
              <td className="p-2 text-blue-700 font-medium">
                {formatPercentage(weightedAccuracyScore)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-blue-50">
          <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
          <div>
            <code className="block bg-gray-50 p-2 rounded text-xs">
              OverallQuality = (PropertyCoverage × {QUALITY_WEIGHTS.propertyCoverage}) + 
              (EvidenceQuality × {QUALITY_WEIGHTS.evidenceQuality}) +
              (ValueAccuracy × {QUALITY_WEIGHTS.valueAccuracy})<br/>
              = {formatPercentage(weightedCoverageScore)} + 
              {formatPercentage(weightedEvidenceScore)} + 
              {formatPercentage(weightedAccuracyScore)}<br/>
              = {formatPercentage(overallScore)}
            </code>
          </div>
          
          {/* Visualizations */}
          <div className="mt-3">
            <h6 className="text-xs font-medium mb-2">Quality Dimensions</h6>
            <div className="space-y-2">
              {/* Property Coverage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Property Coverage</span>
                  <span className="text-xs">{formatPercentage(propertyCoverageScore)}</span>
                </div>
                <Progress value={propertyCoverageScore * 100} className="h-2" />
                <div className="text-xs mt-0.5 text-gray-500">
                  {QUALITY_WEIGHTS.propertyCoverage * 100}% weight contribution
                </div>
              </div>
              
              {/* Evidence Quality */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Evidence Quality</span>
                  <span className="text-xs">{formatPercentage(evidenceQualityScore)}</span>
                </div>
                <Progress value={evidenceQualityScore * 100} className="h-2" />
                <div className="text-xs mt-0.5 text-gray-500">
                  {QUALITY_WEIGHTS.evidenceQuality * 100}% weight contribution
                </div>
              </div>
              
              {/* Value Accuracy */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Value Accuracy</span>
                  <span className="text-xs">{formatPercentage(valueAccuracyScore)}</span>
                </div>
                <Progress value={valueAccuracyScore * 100} className="h-2" />
                <div className="text-xs mt-0.5 text-gray-500">
                  {QUALITY_WEIGHTS.valueAccuracy * 100}% weight contribution
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Generate overall quality analysis based on scores
  const getQualityAnalysis = () => {
    if (overallScore >= 0.8) {
      return METRIC_EXPLANATIONS.overallQuality.analysis.high;
    } else if (overallScore >= 0.6) {
      return METRIC_EXPLANATIONS.overallQuality.analysis.medium;
    } else {
      return METRIC_EXPLANATIONS.overallQuality.analysis.low;
    }
  };

  // Calculate quality metrics for base content metrics
  const analysisData = {
    fieldSpecificMetrics: {
      propertyCoverage: { score: propertyCoverageScore },
      evidenceQuality: { score: evidenceQualityScore },
      valueAccuracy: { score: valueAccuracyScore },
      overallQuality: { 
        score: overallScore,
        automated: overallScore
      }
    },
    weights: QUALITY_WEIGHTS
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">{TEXT_CONFIG.quality.title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {TEXT_CONFIG.quality.description}
      </p>
      
      {hasMetrics ? (
        <>
          <BaseContentMetrics
            metrics={metrics}
            referenceValue="Template Properties"
            extractedValue="Paper Annotations"
            expertiseWeight={expertiseMultiplier}
            expertiseMultiplier={expertiseMultiplier}
            rating={rating}
            fieldName="Content"
            metricType="quality"
            metricDefinitions={metricDefinitions}
            analysisData={analysisData}
            renderAnalysisComponent={() => renderQualityTable()}
            metricConfig={METRIC_CONFIG.quality}
          />
          
          {/* Quality Assessment */}
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
            <h4 className="text-sm font-medium">Quality Assessment</h4>
            <p className="text-sm mt-1">{getQualityAnalysis()}</p>
            
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-2 rounded border text-xs">
              <h5 className="font-medium">Strengths</h5>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {propertyCoverageScore >= 0.7 && (
                    <li>Good coverage of template properties</li>
                  )}
                  {metrics?.propertyCoverage?.details?.dataTypeMatchRate >= 0.8 && (
                    <li>Excellent data type consistency</li>
                  )}
                  {evidenceQualityScore >= 0.7 && (
                    <li>Strong evidence quality with good semantic similarity</li>
                  )}
                  {metrics?.evidenceQuality?.details?.semanticSimilarity >= 0.8 && (
                    <li>High semantic similarity in evidence citations</li>
                  )}
                  {valueAccuracyScore >= 0.8 && (
                    <li>High value accuracy with solid evidence support</li>
                  )}
                  {editScore >= 0.8 && (
                    <li>Few edits needed, indicating good initial content quality</li>
                  )}
                  {overallScore >= 0.75 && (
                    <li>Overall high content quality</li>
                  )}
                </ul>
              </div>
              
              <div className="bg-white p-2 rounded border text-xs">
                <h5 className="font-medium">Areas for Improvement</h5>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {propertyCoverageScore < 0.7 && (
                    <li>Improve coverage of template properties</li>
                  )}
                  {metrics?.propertyCoverage?.details?.dataTypeMatchRate < 0.8 && (
                    <li>Ensure correct data types for all properties</li>
                  )}
                  {evidenceQualityScore < 0.7 && (
                    <li>Enhance evidence quality with better contextual relevance</li>
                  )}
                  {metrics?.evidenceQuality?.details?.semanticSimilarity < 0.8 && (
                    <li>Improve semantic similarity in evidence citations</li>
                  )}
                  {valueAccuracyScore < 0.8 && (
                    <li>Improve value accuracy with better evidence support</li>
                  )}
                  {editScore < 0.8 && (
                    <li>Reduce the need for manual edits in generated content</li>
                  )}
                  {overallScore < 0.75 && (
                    <li>Focus on overall content quality improvements</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            {/* Property Coverage Section */}
            <CollapsibleSection
              title={TEXT_CONFIG.quality.sections.propertyCoverage}
              icon={CheckCircle}
              score={propertyCoverageScore}
              isExpanded={expandedSections.propertyCoverage}
              toggleExpanded={() => toggleSection('propertyCoverage')}
            >
              <PropertyCoverageAnalysis 
                metrics={metrics}
                templateProperties={templateProperties}
                paperContent={paperContent}
              />
            </CollapsibleSection>
            
            {/* Evidence Quality Section */}
            <CollapsibleSection
              title={TEXT_CONFIG.quality.sections.evidenceQuality}
              icon={FileText}
              score={evidenceQualityScore}
              isExpanded={expandedSections.evidenceQuality}
              toggleExpanded={() => toggleSection('evidenceQuality')}
            >
              <EvidenceQualityAnalysis 
                metrics={metrics}
                textSections={textSections}
                paperContent={paperContent}
              />
            </CollapsibleSection>
            
            {/* Edit Analysis Section - Use centralized edit score */}
            {evaluationComparison && (
              <CollapsibleSection
                title="Edit Analysis"
                icon={Edit}
                score={editScore}
                isExpanded={expandedSections.editAnalysis}
                toggleExpanded={() => toggleSection('editAnalysis')}
              >
                <ContentEditAnalysis 
                  metrics={metrics}
                  evaluationComparison={evaluationComparison}
                />
              </CollapsibleSection>
            )}
          </div>
        </>
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-500">No quality metrics available for this content</p>
        </div>
      )}
    </Card>
  );
};

export default ContentQualityMetrics;