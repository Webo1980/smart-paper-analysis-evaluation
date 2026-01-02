import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../../../ui/card';
import { ChevronDown, ChevronUp, Info, Layers, Target, HelpCircle, List } from 'lucide-react';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { formatPercentage, getAutomatedScore } from '../../base/utils/baseMetricsUtils';
import { processTemplateQuality } from '../utils/templateMetrics';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import QualityMetricsDisplay from './QualityMetricsDisplay';
import TextComparison from '../../base/TextComparison';
import ObjectListComparison from '../../base/ObjectListComparison';
import PropertyCoverageSection from './PropertyCoverageSection';
import ResearchAlignmentSection from './ResearchAlignmentSection';
import { QUALITY_WEIGHTS, DEFAULT_RATINGS, TEXT_CONFIG, METRIC_CONFIG } from '../config/templateConfig';

const CollapsibleSectionHeader = ({ title, icon: Icon, score, isExpanded, toggleExpanded }) => {
  return (
    <div 
      className="flex items-center justify-between cursor-pointer p-3 border-b"
      onClick={toggleExpanded}
    >
      <div className="flex items-center">
        {Icon && <Icon className="h-4 w-4 mr-2 text-gray-700" />}
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <div className="flex items-center">
        <span className={`mr-2 px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(score)}`}>
          {formatPercentage(score)}
        </span>
        {isExpanded ? 
          <ChevronUp className="h-4 w-4 text-gray-500" /> : 
          <ChevronDown className="h-4 w-4 text-gray-500" />
        }
      </div>
    </div>
  );
};

const TemplateQualityMetrics = ({
  metrics,
  templateData,
  evaluationData,
  researchProblem,
  expertiseMultiplier,
  ratings
}) => {
  // Extract ratings with defaults
  const { 
    titleQuality: titleQualityRating = DEFAULT_RATINGS.titleQuality, 
    titleAccuracy: titleAccuracyRating = DEFAULT_RATINGS.titleQuality,
    descriptionQuality: descriptionQualityRating = DEFAULT_RATINGS.descriptionQuality, 
    propertyCoverage: propertyCoverageRating = DEFAULT_RATINGS.propertyCoverage,
    researchAlignment: researchAlignmentRating = DEFAULT_RATINGS.researchAlignment
  } = ratings || {};
  
  const effectiveRating = researchAlignmentRating || DEFAULT_RATINGS.researchAlignment;
  const effectiveTitleRating = titleAccuracyRating || titleQualityRating || DEFAULT_RATINGS.titleQuality;
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    title: false,
    description: false,
    properties: false,
    alignment: false,
    propertyComparison: false
  });
  
  // Quality data state
  const [qualityResults, setQualityResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Original template and LLM template data
  const originalTemplate = evaluationData?.templates?.available?.template || {};
  const llmTemplate = evaluationData?.templates?.llm_template?.template || templateData || {};
  
  // Extract properties from both templates for comparison
  const originalProperties = originalTemplate?.properties || [];
  const llmProperties = llmTemplate?.properties || [];
  
  // CHECK FOR PRE-CALCULATED DATA FROM METRICS PROP
  const hasPreCalculatedData = useMemo(() => {
    const preCalc = metrics?.qualityData;
    return preCalc && 
           preCalc.fieldSpecificMetrics && 
           preCalc.automatedOverallScore !== undefined &&
           preCalc.automatedOverallScore !== null &&
           !isNaN(preCalc.automatedOverallScore);
  }, [metrics]);
  
  // Process quality metrics - SKIP IF PRE-CALCULATED DATA EXISTS
  const processQuality = useCallback(async () => {
    // Skip processing if we have pre-calculated data
    if (hasPreCalculatedData) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const result = await processTemplateQuality(
        'template',
        llmTemplate,
        researchProblem,
        effectiveRating,
        expertiseMultiplier
      );
      setQualityResults(result);
    } catch (error) {
      console.error("Error processing template quality:", error);
    } finally {
      setLoading(false);
    }
  }, [llmTemplate, researchProblem, effectiveRating, expertiseMultiplier, hasPreCalculatedData]);

  useEffect(() => {
    processQuality();
  }, [processQuality]);

  // Toggle section
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Custom getAutomatedScore for template metrics
  const getTemplateScore = useCallback((metricName, metricsArg, analysisData, metricType) => {
    const metricKeyMap = {
      'titleQuality': 'titleQuality',
      'descriptionQuality': 'descriptionQuality',
      'propertyCoverage': 'propertyCoverage',
      'researchAlignment': 'researchAlignment'
    };

    const actualKey = metricKeyMap[metricName];

    if (analysisData?.fieldSpecificMetrics && actualKey) {
      return analysisData.fieldSpecificMetrics[actualKey]?.score ?? 0;
    }
    
    // Handle overallQuality - check multiple paths
    if (metricName === 'overallQuality') {
      // Check analysisData paths first
      if (analysisData?.automatedOverallScore !== undefined && analysisData?.automatedOverallScore !== null) {
        return analysisData.automatedOverallScore;
      }
      if (analysisData?.fieldSpecificMetrics?.overallQuality?.score !== undefined) {
        return analysisData.fieldSpecificMetrics.overallQuality.score;
      }
      if (analysisData?.overallScore !== undefined && analysisData?.overallScore !== null) {
        return analysisData.overallScore;
      }
      // Check metrics paths
      if (metricsArg?.automatedScore !== undefined) {
        return metricsArg.automatedScore;
      }
      if (metricsArg?.overallQuality?.automated !== undefined) {
        return metricsArg.overallQuality.automated;
      }
      return 0;
    }
    
    return getAutomatedScore(metricName, metricsArg, analysisData, metricType);
  }, []);

  // Memoized quality data - USE PRE-CALCULATED DATA IF AVAILABLE
  const qualityData = useMemo(() => {
    // Prefer pre-calculated data from metrics prop
    if (hasPreCalculatedData) {
      return metrics.qualityData;
    }
    
    // Fall back to internally calculated data
    return qualityResults?.qualityData || {
      fieldSpecificMetrics: {
        titleQuality: { score: 0, issues: [] },
        descriptionQuality: { score: 0, issues: [] },
        propertyCoverage: { score: 0, issues: [] },
        researchAlignment: { score: 0, issues: [] }
      },
      weights: QUALITY_WEIGHTS,
      overallScore: 0,
      automatedOverallScore: 0,
      details: {}
    };
  }, [hasPreCalculatedData, metrics, qualityResults]);

  // Score details - USE PRE-CALCULATED IF AVAILABLE
  const scoreDetails = useMemo(() => {
    if (hasPreCalculatedData && metrics.qualityData?.scoreDetails) {
      return metrics.qualityData.scoreDetails;
    }
    return qualityResults?.scoreDetails || null;
  }, [hasPreCalculatedData, metrics, qualityResults]);

  // Calculate property comparison score data for explanation
  const propertyScoreData = useMemo(() => {
    // Calculate some property comparison metrics
    const addedCount = llmProperties.filter(prop => !originalProperties.find(o => o.id === prop.id)).length;
    const removedCount = originalProperties.filter(prop => !llmProperties.find(l => l.id === prop.id)).length;
    const unchangedCount = llmProperties.filter(prop => 
      originalProperties.find(o => o.id === prop.id && JSON.stringify(o) === JSON.stringify(prop))
    ).length;
    const modifiedCount = llmProperties.filter(prop => {
      const original = originalProperties.find(o => o.id === prop.id);
      return original && JSON.stringify(original) !== JSON.stringify(prop);
    }).length;
    
    // Calculate coverage metrics
    const totalUniqueProps = [...new Set([
      ...originalProperties.map(p => p.id),
      ...llmProperties.map(p => p.id)
    ])].length;
    
    const coverageRatio = totalUniqueProps > 0 ? 
      llmProperties.length / totalUniqueProps : 0;
    
    // Calculate type diversity (number of unique types / total properties)
    const uniqueTypes = [...new Set(llmProperties.map(p => p.type))].length;
    const typeDiversity = llmProperties.length > 0 ? 
      uniqueTypes / llmProperties.length : 0;
    
    // Calculate required properties ratio
    const requiredProps = llmProperties.filter(p => p.required).length;
    const requiredRatio = llmProperties.length > 0 ?
      requiredProps / llmProperties.length : 0;
    
    // Calculate final property score change impact
    const changeScore = (addedCount * 0.7 - removedCount * 0.3) / (totalUniqueProps || 1);
    
    // Weight factors for final score calculation
    const weights = {
      coverage: 0.4,
      diversity: 0.3,
      required: 0.2,
      change: 0.1
    };

    return {
      score: qualityData.fieldSpecificMetrics.propertyCoverage.score,
      coverageRatio,
      typeDiversity,
      requiredRatio,
      changeScore,
      uniqueTypes,
      requiredProps,
      totalUniqueProps,
      weights
    };
  }, [originalProperties, llmProperties, qualityData]);

  // Metric definitions
  const metricDefinitions = useMemo(() => ({
    titleQuality: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Title Quality</strong></p>
        <p>Evaluates how well the template title reflects the research domain.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Based on title length, word count, and domain relevance</p>
        </div>
      </div>
    `,
    descriptionQuality: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Description Quality</strong></p>
        <p>Measures the clarity and completeness of the template description.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Based on description length, structure, and information content</p>
        </div>
      </div>
    `,
    propertyCoverage: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Property Coverage</strong></p>
        <p>Evaluates whether the template includes all necessary properties for the research domain.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Based on number of properties, presence of required fields, and property type variety</p>
        </div>
      </div>
    `,
    researchAlignment: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Research Alignment</strong></p>
        <p>Assesses how well the template aligns with the specific research problem.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Based on title similarity, description similarity, and domain-specific property alignment</p>
        </div>
      </div>
    `,
    overallQuality: (refSpan, extractedSpan) => `
      <div class="space-y-2">
        <p><strong>Overall Quality</strong></p>
        <p>Combined quality score weighing all quality dimensions.</p>
        <div class="bg-gray-50 p-2 rounded mt-2">
          <p class="font-medium">Formula:</p>
          <p>Overall = (Title Quality × ${QUALITY_WEIGHTS.titleQuality}) + (Description Quality × ${QUALITY_WEIGHTS.descriptionQuality}) + (Property Coverage × ${QUALITY_WEIGHTS.propertyCoverage}) + (Research Alignment × ${QUALITY_WEIGHTS.researchAlignment})</p>
        </div>
      </div>
    `
  }), []);

  const renderQualityTable = useCallback((data, showAnalysis) => {
    if (!data || !showAnalysis) return null;
    
    const overallScore = data.automatedOverallScore;
    
    return (
      <div className="space-y-6">
        <div className="mb-3 mt-3 border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left border-b">Quality Dimension</th>
                <th className="p-2 text-left border-b">Title Quality ({QUALITY_WEIGHTS.titleQuality * 100}%)</th>
                <th className="p-2 text-left border-b">Description Quality ({QUALITY_WEIGHTS.descriptionQuality * 100}%)</th>
                <th className="p-2 text-left border-b">Property Coverage ({QUALITY_WEIGHTS.propertyCoverage * 100}%)</th>
                <th className="p-2 text-left border-b">Research Alignment ({QUALITY_WEIGHTS.researchAlignment * 100}%)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 border-r font-medium bg-gray-50">Explanation</td>
                <td className="p-2 border-r">
                  <div className="whitespace-normal">
                    Evaluates how well the template title reflects the research domain.
                  </div>
                </td>
                <td className="p-2 border-r">
                  <div className="whitespace-normal">
                    Measures the clarity and completeness of the template description.
                  </div>
                </td>
                <td className="p-2 border-r">
                  <div className="whitespace-normal">
                    Evaluates whether the template includes all necessary properties for the domain.
                  </div>
                </td>
                <td className="p-2">
                  <div className="whitespace-normal">
                    Assesses how well the template aligns with the specific research problem.
                  </div>
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 border-r font-medium bg-gray-50">Assessment</td>
                <td className="p-2 border-r align-top">
                  <div className="text-xs">
                    {data.details?.titleReason || "No detailed reason available"}
                  </div>
                </td>
                <td className="p-2 border-r align-top">
                  <div className="text-xs">
                    {data.details?.descriptionReason || "No detailed reason available"}
                  </div>
                </td>
                <td className="p-2 border-r align-top">
                  <div className="text-xs">
                    {data.details?.coverageReason || "No detailed reason available"}
                  </div>
                </td>
                <td className="p-2 align-top">
                  <div className="text-xs">
                    {data.details?.alignmentReason || "No detailed reason available"}
                  </div>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 border-r font-medium">Component Score</td>
                <td className="p-2 border-r font-medium">
                  {formatPercentage(data.fieldSpecificMetrics?.titleQuality?.score || 0)}
                </td>
                <td className="p-2 border-r font-medium">
                  {formatPercentage(data.fieldSpecificMetrics?.descriptionQuality?.score || 0)}
                </td>
                <td className="p-2 border-r font-medium">
                  {formatPercentage(data.fieldSpecificMetrics?.propertyCoverage?.score || 0)}
                </td>
                <td className="p-2 font-medium">
                  {formatPercentage(data.fieldSpecificMetrics?.researchAlignment?.score || 0)}
                </td>
              </tr>
              <tr>
                <td className="p-2 border-r font-medium bg-gray-50">Weighted Value</td>
                <td className="p-2 border-r text-blue-700 font-medium">
                  {formatPercentage((data.fieldSpecificMetrics?.titleQuality?.score || 0) * QUALITY_WEIGHTS.titleQuality)}
                </td>
                <td className="p-2 border-r text-blue-700 font-medium">
                  {formatPercentage((data.fieldSpecificMetrics?.descriptionQuality?.score || 0) * QUALITY_WEIGHTS.descriptionQuality)}
                </td>
                <td className="p-2 border-r text-blue-700 font-medium">
                  {formatPercentage((data.fieldSpecificMetrics?.propertyCoverage?.score || 0) * QUALITY_WEIGHTS.propertyCoverage)}
                </td>
                <td className="p-2 text-blue-700 font-medium">
                  {formatPercentage((data.fieldSpecificMetrics?.researchAlignment?.score || 0) * QUALITY_WEIGHTS.researchAlignment)}
                </td>
              </tr>
              <tr>
                <td className="p-2 border-r font-medium bg-gray-50">Potential Issues</td>
                <td className="p-2 border-r">
                  {data.fieldSpecificMetrics?.titleQuality?.issues?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {data.fieldSpecificMetrics.titleQuality.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-green-600">No title issues detected</span>
                  )}
                </td>
                <td className="p-2 border-r">
                  {data.fieldSpecificMetrics?.descriptionQuality?.issues?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {data.fieldSpecificMetrics.descriptionQuality.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-green-600">No description issues detected</span>
                  )}
                </td>
                <td className="p-2 border-r">
                  {data.fieldSpecificMetrics?.propertyCoverage?.issues?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {data.fieldSpecificMetrics.propertyCoverage.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-green-600">No property issues detected</span>
                  )}
                </td>
                <td className="p-2">
                  {data.fieldSpecificMetrics?.researchAlignment?.issues?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {data.fieldSpecificMetrics.researchAlignment.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-green-600">No alignment issues detected</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="p-2 bg-blue-50">
            <h6 className="text-xs font-medium mb-1">Calculation Formula:</h6>
            <div>
              <code className="block bg-gray-50 p-2 rounded text-xs">
                OverallQuality = (TitleQuality × {QUALITY_WEIGHTS.titleQuality}) + 
                (DescriptionQuality × {QUALITY_WEIGHTS.descriptionQuality}) + 
                (PropertyCoverage × {QUALITY_WEIGHTS.propertyCoverage}) + 
                (ResearchAlignment × {QUALITY_WEIGHTS.researchAlignment})<br/>
                = {formatPercentage((data.fieldSpecificMetrics?.titleQuality?.score || 0) * QUALITY_WEIGHTS.titleQuality)} + 
                {formatPercentage((data.fieldSpecificMetrics?.descriptionQuality?.score || 0) * QUALITY_WEIGHTS.descriptionQuality)} + 
                {formatPercentage((data.fieldSpecificMetrics?.propertyCoverage?.score || 0) * QUALITY_WEIGHTS.propertyCoverage)} + 
                {formatPercentage((data.fieldSpecificMetrics?.researchAlignment?.score || 0) * QUALITY_WEIGHTS.researchAlignment)}<br/>
                = {formatPercentage(overallScore)}
              </code>
            </div>
            <div className="mt-3">
              <QualityMetricsDisplay qualityData={data} />
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  // Create comparison data function - Updated to compare original template with LLM template
  const createComparisonData = useCallback((field) => {
    const original = field === 'title' 
      ? originalTemplate?.title || originalTemplate?.name || '' 
      : originalTemplate?.description || '';
    const edited = field === 'title'
      ? llmTemplate?.title || llmTemplate?.name || ''
      : llmTemplate?.description || '';
      
    return {
      original,
      edited,
      levenshtein: {
        distance: qualityData.details?.[`${field}Levenshtein`] || 0,
        similarityScore: qualityData.fieldSpecificMetrics?.[`${field}Quality`]?.similarityScore || 0.5
      },
      edits: {
        modifications: qualityData.details?.[`${field}Modifications`] || 0,
        editPercentage: qualityData.details?.[`${field}EditPercentage`] || 0
      },
      tokenMatching: {
        precision: qualityData.details?.[`${field}Precision`] || 0.5,
        recall: qualityData.details?.[`${field}Recall`] || 0.5,
        f1Score: qualityData.details?.[`${field}F1Score`] || 0.5
      }
    };
  }, [originalTemplate, llmTemplate, qualityData]);

  // Extract scores from quality data
  const titleScore = qualityData.fieldSpecificMetrics?.titleQuality?.score || 0;
  const descriptionScore = qualityData.fieldSpecificMetrics?.descriptionQuality?.score || 0;
  const propertiesScore = qualityData.fieldSpecificMetrics?.propertyCoverage?.score || 0;
  const alignmentScore = qualityData.fieldSpecificMetrics?.researchAlignment?.score || 0;
  
  // Create reusable component renderers that will be used in both places
  const renderTitleComparison = useCallback(() => {
    return (
      <TextComparison
        comparisonData={createComparisonData('title')}
        fieldName="Title"
        originalLabel="Original Template"
        editedLabel="Generated Template"
        qualityAnalysis={{
          score: titleScore || 0,
          details: qualityData.details?.titleReason || "Template title quality analysis",
          issues: qualityData.fieldSpecificMetrics?.titleQuality?.issues || [],
          suggestions: qualityData.details?.titleSuggestions || []
        }}
        showQualitySection={true}
        metricsExplanations={METRIC_CONFIG.title.explanations}
      />
    );
  }, [createComparisonData, qualityData, titleScore]);

  const renderDescriptionComparison = useCallback(() => {
    return (
      <TextComparison
        comparisonData={createComparisonData('description')}
        fieldName="Description"
        originalLabel="Original Template"
        editedLabel="Generated Template"
        qualityAnalysis={{
          score: qualityData.fieldSpecificMetrics?.descriptionQuality?.score || 0,
          details: qualityData.details?.descriptionReason || "Template description quality analysis",
          issues: qualityData.fieldSpecificMetrics?.descriptionQuality?.issues || [],
          suggestions: qualityData.details?.descriptionSuggestions || []
        }}
        showQualitySection={true}
        metricsExplanations={METRIC_CONFIG.description.explanations}
      />
    );
  }, [createComparisonData, qualityData]);

  const renderPropertyCoverage = useCallback(() => {
    return (
      <PropertyCoverageSection 
        propertyCoverage={qualityData.fieldSpecificMetrics?.propertyCoverage} 
        templateData={llmTemplate} 
        researchProblem={researchProblem}
        details={qualityData.details?.coverageReason}
      />
    );
  }, [qualityData, llmTemplate, researchProblem]);

  const renderResearchAlignment = useCallback(() => {
    return (
      <ResearchAlignmentSection 
        researchAlignment={qualityData.fieldSpecificMetrics?.researchAlignment} 
        templateData={llmTemplate} 
        researchProblem={researchProblem}
        details={qualityData.details?.alignmentReason}
      />
    );
  }, [qualityData, llmTemplate, researchProblem]);

  // Property comparison renderer using ObjectListComparison
  const renderPropertyComparison = useCallback(() => {
    // Field labels for properties
    const fieldLabels = {
      label: 'Property Name',
      type: 'Data Type',
      description: 'Description',
      required: 'Required Field'
    };

    return (
      <ObjectListComparison
        originalItems={originalProperties}
        editedItems={llmProperties}
        itemType="Property"
        primaryKey="id"
        nameKey="label"
        fieldsToCompare={['label', 'type', 'description', 'required']}
        fieldLabels={fieldLabels}
        maxItemsToShowInitially={5}
        showScoreExplanation={true}
        scoreData={propertyScoreData}
      />
    );
  }, [originalProperties, llmProperties, propertyScoreData]);

  // Unified metric details renderer that uses our reusable component renderers
  const renderMetricDetails = useCallback((metricType) => {
    if (!qualityData) return null;
    
    switch(metricType) {
      case 'titleQuality':
        return renderTitleComparison();
      case 'descriptionQuality':
        return renderDescriptionComparison();
      case 'propertyCoverage':
        return renderPropertyCoverage();
      case 'researchAlignment':
        return renderResearchAlignment();
      default:
        return null;
    }
  }, [qualityData, renderTitleComparison, renderDescriptionComparison, renderPropertyCoverage, renderResearchAlignment]);

  // Show loading only if we don't have pre-calculated data AND internal calculation is in progress
  if (loading && !qualityResults && !hasPreCalculatedData) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Template Quality Analysis</h3>
        <p className="text-sm text-gray-600">Loading quality metrics...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Template Quality Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        This evaluation assesses the quality of the template across four dimensions:
        title quality, description quality, property coverage, and research alignment.
      </p>
      
      <BaseContentMetrics
        metrics={metrics}
        referenceValue={originalTemplate?.title || originalTemplate?.name || ''}
        extractedValue={llmTemplate?.title || llmTemplate?.name || ''}
        expertiseWeight={expertiseMultiplier}
        expertiseMultiplier={expertiseMultiplier}
        rating={effectiveRating}
        fieldName="Template"
        metricType="quality"
        textConfig={TEXT_CONFIG.quality}
        metricDefinitions={metricDefinitions}
        analysisData={qualityData}
        renderAnalysisComponent={renderQualityTable}
        renderMetricDetails={renderMetricDetails}
        scoreDetails={scoreDetails}
        metricConfig={METRIC_CONFIG.quality}
        utils={{ getAutomatedScore: getTemplateScore }}
      />
      
      <div className="mt-6 bg-white rounded border">
        <CollapsibleSectionHeader 
          title="Title Quality Analysis" 
          icon={Info}
          score={titleScore}
          isExpanded={expandedSections.title} 
          toggleExpanded={() => toggleSection('title')}
        />
        {expandedSections.title && (
          <div className="p-4">
            {renderTitleComparison()}
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-white rounded border">
        <CollapsibleSectionHeader 
          title="Description Quality Analysis" 
          icon={HelpCircle}
          score={descriptionScore}
          isExpanded={expandedSections.description} 
          toggleExpanded={() => toggleSection('description')}
        />
        {expandedSections.description && (
          <div className="p-4">
            {renderDescriptionComparison()}
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-white rounded border">
        <CollapsibleSectionHeader 
          title="Property Coverage Analysis" 
          icon={Layers}
          score={propertiesScore}
          isExpanded={expandedSections.properties} 
          toggleExpanded={() => toggleSection('properties')}
        />
        {expandedSections.properties && (
          <div className="p-4">
            {renderPropertyCoverage()}
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-white rounded border">
        <CollapsibleSectionHeader 
          title="Research Alignment Analysis" 
          icon={Target}
          score={alignmentScore}
          isExpanded={expandedSections.alignment} 
          toggleExpanded={() => toggleSection('alignment')}
        />
        {expandedSections.alignment && (
          <div className="p-4">
            {renderResearchAlignment()}
          </div>
        )}
      </div>
      
      {/* Property Comparison section with the updated ObjectListComparison */}
      <div className="mt-4 bg-white rounded border">
        <CollapsibleSectionHeader 
          title="Template Properties Comparison" 
          icon={List}
          score={propertiesScore} // Reusing the properties score here as it's related
          isExpanded={expandedSections.propertyComparison} 
          toggleExpanded={() => toggleSection('propertyComparison')}
        />
        {expandedSections.propertyComparison && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Comparing original template properties with properties generated by the LLM.
              This analysis helps identify added, removed, and modified properties.
            </p>
            {renderPropertyComparison()}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TemplateQualityMetrics;