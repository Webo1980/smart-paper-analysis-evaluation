// File: src/components/dashboard/views/quality/TemplateQualityView.jsx
// ENHANCED VERSION with Edit Metrics Analysis

import React, { useState } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Progress } from '../../../ui/progress';
import { 
  Package, Database, Brain, ChevronDown, ChevronUp, Info, 
  Star, CheckCircle, AlertCircle, Zap, Layers,
  Award, BarChart3, Grid, List, Radar, Edit3, HelpCircle
} from 'lucide-react';
import { QUALITY_METRICS, QUALITY_WEIGHTS } from '../../../evaluation/template/config/templateConfig';
import { PropertyTypeDistribution } from '../../../evaluation/template/visualizations/PropertyTypeDistribution';
import { PropertyCategoryDistribution } from '../../../evaluation/template/visualizations/PropertyCategoryDistribution';
import { ExpectedPropertyCoverage } from '../../../evaluation/template/visualizations/ExpectedPropertyCoverage';
import { ResearchAlignmentRadar } from '../../../evaluation/template/visualizations/ResearchAlignmentRadar';
import QualityMetricsDisplay from '../../../evaluation/template/components/QualityMetricsDisplay';
import { formatPercentage } from '../../../evaluation/base/utils/baseMetricsUtils';

// Edit Metrics Calculation Function - FIXED with better source detection and field handling
const calculateEditMetrics = (papers) => {
  const editStats = {
    totalEvaluations: 0,
    evaluationsWithChanges: 0,
    totalChanges: 0,
    changesByType: {},
    changesBySource: { orkg: { total: 0, count: 0 }, llm: { total: 0, count: 0 }, unknown: { total: 0, count: 0 } },
    changesByField: {},
    newPropertiesAdded: 0,
    propertyModifications: 0,
    avgChangesPerEvaluation: 0,
    editDistribution: { none: 0, light: 0, moderate: 0, heavy: 0 }
  };

  if (!papers || papers.length === 0) return editStats;

  papers.forEach(paper => {
    const userEvaluations = paper.userEvaluations || [];
    
    if (userEvaluations.length === 0) return;
    
    userEvaluations.forEach(evaluation => {
      const templateEval = evaluation?.evaluationMetrics?.overall?.template;
      if (!templateEval) return;

      const rawChanges = evaluation?.systemData?.evaluationData?.template?.changes;
      const changes = Array.isArray(rawChanges) 
        ? rawChanges 
        : rawChanges ? [rawChanges] : [];
      
      const templateData = templateEval.templateData || {};
      
      // Try multiple source locations and normalize the value
      let source = templateData.source || templateData.templateSource || templateEval.source || 'unknown';
      source = String(source).toLowerCase().trim();
      
      // Normalize source names
      if (source.includes('orkg')) {
        source = 'orkg';
      } else if (source.includes('llm') || source.includes('ai') || source.includes('generated')) {
        source = 'llm';
      }
      
      console.log("Template source detected:", source, "from templateData:", templateData);
      
      editStats.totalEvaluations++;
      
      if (changes.length > 0) {
        editStats.evaluationsWithChanges++;
        editStats.totalChanges += changes.length;
        
        // Track by source (including unknown)
        if (source === 'orkg' || source === 'llm') {
          editStats.changesBySource[source].total += changes.length;
          editStats.changesBySource[source].count++;
        } else {
          editStats.changesBySource.unknown.total += changes.length;
          editStats.changesBySource.unknown.count++;
        }
        
        // Track by field and type
        changes.forEach(change => {
          console.log("Processing change: ", change);
          // By field - handle undefined
          const fieldName = change.field || 'property'; // default to 'property' if undefined
          editStats.changesByField[fieldName] = (editStats.changesByField[fieldName] || 0) + 1;
          
          // New properties vs modifications
          if (change.is_new_property) {
            editStats.newPropertiesAdded++;
          } else {
            editStats.propertyModifications++;
          }
          
          // By type
          const changeType = change.is_new_property ? 'added' : 
                            (change.from === null ? 'added' : 
                             (change.to === null ? 'removed' : 'modified'));
          editStats.changesByType[changeType] = (editStats.changesByType[changeType] || 0) + 1;
        });
        
        // Edit distribution
        if (changes.length <= 3) editStats.editDistribution.light++;
        else if (changes.length <= 7) editStats.editDistribution.moderate++;
        else editStats.editDistribution.heavy++;
      } else {
        editStats.editDistribution.none++;
      }
    });
  });
  
  editStats.avgChangesPerEvaluation = editStats.totalEvaluations > 0 
    ? editStats.totalChanges / editStats.totalEvaluations 
    : 0;
    
  // Calculate averages by source
  editStats.changesBySource.orkg.avg = editStats.changesBySource.orkg.count > 0
    ? editStats.changesBySource.orkg.total / editStats.changesBySource.orkg.count
    : 0;
  editStats.changesBySource.llm.avg = editStats.changesBySource.llm.count > 0
    ? editStats.changesBySource.llm.total / editStats.changesBySource.llm.count
    : 0;
  editStats.changesBySource.unknown.avg = editStats.changesBySource.unknown.count > 0
    ? editStats.changesBySource.unknown.total / editStats.changesBySource.unknown.count
    : 0;

  console.log("Final edit stats:", editStats);
  return editStats;
};

// Edit Metrics Section Component
const EditMetricsSection = ({ editStats }) => {
  console.log("EditMetricsSection received editStats:", editStats);
  const editPercentage = editStats.totalEvaluations > 0 
    ? (editStats.evaluationsWithChanges / editStats.totalEvaluations * 100).toFixed(1)
    : 0;
    
  const orkgAvg = editStats.changesBySource.orkg.avg;
  const llmAvg = editStats.changesBySource.llm.avg;
  const qualityIndicator = orkgAvg < llmAvg ? 'ORKG templates required fewer edits' : 
                           orkgAvg > llmAvg ? 'LLM templates required fewer edits' : 
                           'Both sources show similar edit requirements';
  
  return (
    <div className="space-y-4">
      <Alert className="bg-orange-50 border-orange-200">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <p className="text-sm">
            <strong>Edit Analysis:</strong> This shows how many changes evaluators made to templates, 
            indicating the quality of generated templates. Fewer edits suggest higher initial quality.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Edits" 
          value={editStats.totalChanges} 
          type="count" 
        />
        <StatCard 
          label="Avg Edits/Template" 
          value={editStats.avgChangesPerEvaluation.toFixed(2)} 
          type="text" 
        />
        <StatCard 
          label="Templates Edited" 
          value={`${editStats.evaluationsWithChanges} (${editPercentage}%)`} 
          type="text" 
        />
        <StatCard 
          label="New Properties Added" 
          value={editStats.newPropertiesAdded} 
          type="count" 
        />
      </div>

      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Edit Distribution</h4>
        <div className="space-y-2">
          {Object.entries(editStats.editDistribution).map(([level, count]) => {
            const percentage = editStats.totalEvaluations > 0 
              ? (count / editStats.totalEvaluations * 100) 
              : 0;
            const labels = {
              none: 'No Edits (Perfect)',
              light: 'Light Edits (1-3)',
              moderate: 'Moderate Edits (4-7)',
              heavy: 'Heavy Edits (8+)'
            };
            return (
              <div key={level}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{labels[level]}</span>
                  <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            ORKG Templates - Edit Analysis
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Evaluations:</span>
              <span className="font-bold">{editStats.changesBySource.orkg.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Edits:</span>
              <span className="font-bold">{editStats.changesBySource.orkg.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Edits/Template:</span>
              <span className="font-bold text-lg text-blue-600">{orkgAvg.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-purple-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            LLM Templates - Edit Analysis
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Evaluations:</span>
              <span className="font-bold">{editStats.changesBySource.llm.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Edits:</span>
              <span className="font-bold">{editStats.changesBySource.llm.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Edits/Template:</span>
              <span className="font-bold text-lg text-purple-600">{llmAvg.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {editStats.changesBySource.unknown.count > 0 && (
          <Card className="p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-gray-600" />
              Unknown Source Templates - Edit Analysis
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Evaluations:</span>
                <span className="font-bold">{editStats.changesBySource.unknown.count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Edits:</span>
                <span className="font-bold">{editStats.changesBySource.unknown.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Edits/Template:</span>
                <span className="font-bold text-lg text-gray-600">{editStats.changesBySource.unknown.avg.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {orkgAvg !== llmAvg && editStats.changesBySource.orkg.count > 0 && editStats.changesBySource.llm.count > 0 && (
        <Alert className={orkgAvg < llmAvg ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
          <CheckCircle className={`h-4 w-4 ${orkgAvg < llmAvg ? 'text-green-600' : 'text-yellow-600'}`} />
          <AlertDescription>
            <p className="text-sm font-medium">{qualityIndicator}</p>
            <p className="text-xs mt-1">
              ORKG: {orkgAvg.toFixed(2)} edits/template vs LLM: {llmAvg.toFixed(2)} edits/template
              {orkgAvg < llmAvg && ' - ORKG templates show higher initial quality'}
              {llmAvg < orkgAvg && ' - LLM templates show higher initial quality'}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(editStats.changesByField).length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Changes by Field</h4>
          <div className="space-y-2">
            {Object.entries(editStats.changesByField)
              .sort(([,a], [,b]) => b - a)
              .map(([field, count]) => {
                const percentage = (count / editStats.totalChanges * 100);
                return (
                  <div key={field}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{field}</span>
                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {Object.keys(editStats.changesByType).length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Edit Type Distribution</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(editStats.changesByType).map(([type, count]) => (
              <div key={type} className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600 capitalize">{type}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const TemplateQualityView = ({ componentData, papers }) => {
  console.log("TemplateQualityView received:", { 
    componentData, 
    paperCount: papers?.length,
    hasComponentData: !!componentData,
    componentDataKeys: componentData ? Object.keys(componentData) : []
  });
  
  const [expandedSections, setExpandedSections] = useState({
    sourceBreakdown: true,
    qualityDimensions: true,
    subDimensions: true,
    userRatings: true,
    overallStats: true,
    templateDistribution: true,
    visualAnalysis: true,
    detailedMetrics: false,
    propertyAnalysis: false,
    editAnalysis: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const metrics = componentData;

  if (!metrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No template quality data available
        </AlertDescription>
      </Alert>
    );
  }
  console.log("Rendering TemplateQualityView with metrics:", metrics);
  console.log("Template metrics being displayed:", {
    hasQualityScores: !!metrics.qualityScores,
    overallMean: metrics.qualityScores?.overall?.mean,
    hasDimensionScores: !!metrics.dimensionScores,
    dimensionKeys: metrics.dimensionScores ? Object.keys(metrics.dimensionScores) : [],
    sourceDistribution: metrics.sourceDistribution,
    bySource: metrics.bySource
  });

  const alignmentData = metrics.dimensionScores ? {
    titleSimilarity: metrics.dimensionScores.titleQuality?.automated?.mean || 0,
    descriptionSimilarity: metrics.dimensionScores.descriptionQuality?.automated?.mean || 0,
    propertyAlignment: metrics.dimensionScores.propertyCoverage?.automated?.mean || 0,
    domainRelevance: metrics.dimensionScores.researchAlignment?.automated?.mean || 0
  } : null;

  return (
    <div className="space-y-6 mt-4">
      {/* Overall Template Quality Score */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
            <Award className="h-8 w-8 text-indigo-600" />
            Overall Template Quality
          </h2>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {metrics.evaluationCount} Evaluations
          </Badge>
        </div>

        {metrics.qualityScores?.overall && (
          <div className="flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-indigo-200">
              <Award className={`h-20 w-20 mx-auto mb-4 ${getScoreColor(metrics.qualityScores.overall.mean)}`} />
              <p className="text-sm text-gray-600 mb-2">Mean Quality Score</p>
              <p className={`text-6xl font-bold mb-2 ${getScoreColor(metrics.qualityScores.overall.mean)}`}>
                {formatPercentage(metrics.qualityScores.overall.mean)}
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Range: {formatPercentage(metrics.qualityScores.overall.min)} - {formatPercentage(metrics.qualityScores.overall.max)}</p>
                <p>Std Dev: {(metrics.qualityScores.overall.std * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
        
        {metrics.dimensionScores && (
          <div className="mt-6">
            <QualityMetricsDisplay 
              qualityData={{
                fieldSpecificMetrics: Object.entries(QUALITY_METRICS).reduce((acc, [key, config]) => {
                  acc[key] = {
                    score: metrics.dimensionScores[key]?.automated?.mean || 0,
                    issues: []
                  };
                  return acc;
                }, {}),
                weights: QUALITY_WEIGHTS,
                overallScore: metrics.qualityScores?.overall?.mean || 0,
                automatedOverallScore: metrics.qualityScores?.automated?.mean || 0
              }}
            />
          </div>
        )}
      </Card>

      {/* Quality Dimension Radar Visualization */}
      {alignmentData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Radar className="h-5 w-5 text-indigo-600" />
            Quality Dimensions Radar Chart
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
              <ResearchAlignmentRadar 
                alignmentData={alignmentData}
                height={300}
              />
            </div>
            <div className="space-y-3">
              {Object.entries(QUALITY_METRICS).map(([key, config]) => {
                const score = metrics.dimensionScores[key]?.automated?.mean || 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getColorClass(config.color, 'bg')}`} />
                        {config.label}
                      </span>
                      <span className="font-semibold">{formatPercentage(score)}</span>
                    </div>
                    <Progress value={score * 100} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Template Source Distribution */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('sourceBreakdown')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Template Source Distribution
          </h3>
          {expandedSections.sourceBreakdown ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.sourceBreakdown && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SourceCard
                icon={Database}
                title="ORKG Templates"
                count={metrics.sourceDistribution.orkg}
                percentage={metrics.sourceDistribution.total > 0 
                  ? (metrics.sourceDistribution.orkg / metrics.sourceDistribution.total * 100).toFixed(1)
                  : 0}
                color="blue"
                description="From ORKG database"
                qualityScore={metrics.bySource?.orkg?.overall?.mean}
                templates={metrics.bySource?.orkg?.templates}
              />
              <SourceCard
                icon={Brain}
                title="LLM Generated"
                count={metrics.sourceDistribution.llm}
                percentage={metrics.sourceDistribution.total > 0 
                  ? (metrics.sourceDistribution.llm / metrics.sourceDistribution.total * 100).toFixed(1)
                  : 0}
                color="purple"
                description="Generated by AI"
                qualityScore={metrics.bySource?.llm?.overall?.mean}
                templates={metrics.bySource?.llm?.templates}
              />
              <SourceCard
                icon={Package}
                title="Total Templates"
                count={metrics.sourceDistribution.total}
                percentage="100.0"
                color="green"
                description="All evaluated templates"
                qualityScore={metrics.qualityScores?.overall?.mean}
              />
            </div>
          </div>
        )}
      </Card>

      {/* AI Generation Quality - Edit Analysis */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50">
        <button
          onClick={() => toggleSection('editAnalysis')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-orange-600" />
            AI Generation Quality - Edit Analysis
            <Badge variant="outline" className="ml-2">Quality Indicator</Badge>
          </h3>
          {expandedSections.editAnalysis ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.editAnalysis && (
          <div className="bg-white rounded-lg p-4">
            <EditMetricsSection editStats={calculateEditMetrics(papers)} />
          </div>
        )}
      </Card>

      {/* Property Analysis with Visualizations */}
      {metrics.propertyAnalysis && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('propertyAnalysis')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <List className="h-5 w-5 text-purple-600" />
              Property Analysis & Visualizations
            </h3>
            {expandedSections.propertyAnalysis ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.propertyAnalysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  label="Avg Properties" 
                  value={metrics.propertyAnalysis.avgPropertyCount?.mean?.toFixed(1) || 'N/A'}
                  type="text"
                />
                <StatCard 
                  label="Required Ratio" 
                  value={formatPercentage(metrics.propertyAnalysis.requiredPropertiesRatio?.mean || 0)}
                  type="text"
                />
                <StatCard 
                  label="Unique Types" 
                  value={Object.keys(metrics.propertyAnalysis.typeDistribution).length}
                  type="count"
                />
                <StatCard 
                  label="Categories" 
                  value={Object.keys(metrics.propertyAnalysis.categoryDistribution).length}
                  type="count"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Property Type Distribution</h4>
                  <PropertyTypeDistribution 
                    typeDistribution={metrics.propertyAnalysis.typeDistribution}
                    height={250}
                  />
                </Card>

                <Card className="p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Property Category Distribution</h4>
                  <PropertyCategoryDistribution 
                    categoryDistribution={metrics.propertyAnalysis.categoryDistribution}
                    height={250}
                  />
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Expected Property Coverage</h4>
                <ExpectedPropertyCoverage 
                  categoryDistribution={metrics.propertyAnalysis.categoryDistribution}
                  researchField="default"
                  height={300}
                />
              </Card>
            </div>
          )}
        </Card>
      )}

      {/* Template Distribution & Usage */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('templateDistribution')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Grid className="h-5 w-5 text-purple-600" />
            Template Distribution & Usage
          </h3>
          {expandedSections.templateDistribution ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.templateDistribution && metrics.templateDistribution && (
          <div className="space-y-4">
            <div className="space-y-3">
              {Object.entries(metrics.templateDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([templateName, count]) => {
                  const percentage = (count / metrics.sourceDistribution.total) * 100;
                  return (
                    <div key={templateName} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 truncate max-w-md" title={templateName}>
                          {templateName}
                        </span>
                        <span className="text-gray-600 ml-2 whitespace-nowrap">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </div>
                  );
                })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatCard 
                label="Unique Templates" 
                value={Object.keys(metrics.templateDistribution).length} 
                type="count" 
              />
              <StatCard 
                label="Most Used" 
                value={Math.max(...Object.values(metrics.templateDistribution))} 
                type="count" 
              />
              <StatCard 
                label="Avg Usage" 
                value={(metrics.sourceDistribution.total / Object.keys(metrics.templateDistribution).length).toFixed(1)} 
                type="text"
              />
              <StatCard 
                label="Template Variety" 
                value={(Object.keys(metrics.templateDistribution).length / metrics.sourceDistribution.total * 100).toFixed(0) + '%'} 
                type="text" 
              />
            </div>
          </div>
        )}
      </Card>

      {/* Quality Dimensions */}
      {metrics.dimensionScores && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('qualityDimensions')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Quality Dimensions
            </h3>
            {expandedSections.qualityDimensions ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.qualityDimensions && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
                <h5 className="text-sm font-semibold text-gray-900 mb-4 text-center">
                  Quality Dimensions Overview
                </h5>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(QUALITY_METRICS).map(([key, config]) => {
                    const dimScore = metrics.dimensionScores[key]?.automated?.mean;
                    if (dimScore === null || dimScore === undefined) return null;
                    
                    return (
                      <div key={key} className="text-center">
                        <div className="relative inline-block">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="#e5e7eb"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke={getColorHex(config.color)}
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${dimScore * 201} 201`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-bold ${getColorClass(config.color, 'text')}`}>
                              {formatPercentage(dimScore)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-gray-900 mt-2">{config.label}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {(config.weight * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(QUALITY_METRICS).map(([key, metric]) => {
                  const dimScores = metrics.dimensionScores[key];
                  if (!dimScores || (!dimScores.final && !dimScores.automated)) return null;

                  return (
                    <DimensionCard
                      key={key}
                      label={metric.label}
                      description={metric.description}
                      automatedScore={dimScores.automated?.mean}
                      weight={metric.weight}
                      color={metric.color}
                    />
                  );
                })}
              </div>

              <div className="p-4 bg-gray-50 rounded border">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Quality Dimension Weights</h4>
                <div className="space-y-2">
                  {Object.entries(QUALITY_METRICS).map(([key, metric]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getColorClass(metric.color, 'bg')} h-2 rounded-full`}
                            style={{ width: `${metric.weight * 100}%` }}
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
            </div>
          )}
        </Card>
      )}

      {/* Sub-Dimensions */}
      {metrics.subDimensionScores && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('subDimensions')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Sub-Dimension Analysis
            </h3>
            {expandedSections.subDimensions ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.subDimensions && (
            <div className="space-y-6">
              {Object.entries(metrics.subDimensionScores).map(([dimension, subDims]) => {
                const dimensionConfig = QUALITY_METRICS[dimension];
                if (!dimensionConfig?.subDimensions) return null;

                const hasData = Object.values(subDims).some(stats => stats && stats.count > 0);
                if (!hasData) return null;

                return (
                  <div key={dimension} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span>{dimensionConfig.label}</span>
                      <Badge variant="outline" className="text-xs">Sub-Dimensions</Badge>
                    </h4>
                    <p className="text-xs text-gray-600 mb-4">{dimensionConfig.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(dimensionConfig.subDimensions).map(([subKey, subConfig]) => {
                        const stats = subDims[subKey];
                        if (!stats || stats.count === 0) return null;

                        return (
                          <SubDimensionCard
                            key={subKey}
                            label={subConfig.label}
                            description={subConfig.description}
                            stats={stats}
                            color={dimensionConfig.color}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* User Ratings */}
      {metrics.userRatings && Object.values(metrics.userRatings).some(r => r && r.count > 0) && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('userRatings')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              User Ratings Distribution (1-5 Scale)
            </h3>
            {expandedSections.userRatings ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.userRatings && (
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <p className="text-sm">
                    <strong>Note:</strong> User ratings (1-5 scale) are subjective assessments by evaluators 
                    and are separate from the automated quality dimensions shown above.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(metrics.userRatings).map(([key, stats]) => {
                  if (!stats || stats.count === 0) return null;
                  
                  const labelMap = {
                    overallAssessment: 'Overall Assessment',
                    titleAccuracy: 'Title Accuracy',
                    descriptionQuality: 'Description Quality',
                    propertyCoverage: 'Property Coverage',
                    researchAlignment: 'Research Alignment'
                  };
                  
                  return (
                    <UserRatingCard
                      key={key}
                      label={labelMap[key] || key}
                      stats={stats}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// Helper Components

const SourceCard = ({ icon: Icon, title, count, percentage, color, description, qualityScore, templates }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700'
  };

  return (
    <Card className={`p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-6 w-6" />
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="text-3xl font-bold mb-1">{count}</div>
      <div className="text-2xl font-semibold mb-2">{percentage}%</div>
      {qualityScore !== undefined && qualityScore !== null && (
        <div className="text-sm font-medium mb-2">
          Quality: {formatPercentage(qualityScore)}
        </div>
      )}
      <p className="text-xs opacity-80 mb-2">{description}</p>
      {templates && templates.length > 0 && (
        <div className="text-xs mt-2 pt-2 border-t border-current/20">
          <p className="font-semibold mb-1">Templates ({templates.length}):</p>
          <div className="space-y-0.5">
            {templates.slice(0, 3).map((t, i) => (
              <p key={i} className="truncate" title={t}>• {t}</p>
            ))}
            {templates.length > 3 && (
              <p className="italic">...and {templates.length - 3} more</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

const StatCard = ({ label, value, type, decimals = 2 }) => {
  const formatValue = () => {
    if (value === null || value === undefined) return 'N/A';
    if (type === 'score') return formatPercentage(value);
    if (type === 'count') return value.toString();
    if (type === 'text') return value;
    return typeof value === 'number' ? value.toFixed(decimals) : value;
  };

  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${type === 'score' ? getScoreColor(value) : 'text-gray-900'}`}>
        {formatValue()}
      </p>
    </Card>
  );
};

const DimensionCard = ({ label, description, automatedScore, weight, color }) => {
  return (
    <Card className={`p-4 ${getColorClass(color, 'bg-light')}`}>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-semibold text-gray-900">{label}</h5>
        <Badge variant="outline" className="text-xs">
          {(weight * 100).toFixed(0)}%
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        {automatedScore !== undefined && automatedScore !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Score:</span>
            <span className={`text-lg font-bold ${getScoreColor(automatedScore)}`}>
              {formatPercentage(automatedScore)}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600">{description}</p>
    </Card>
  );
};

const SubDimensionCard = ({ label, description, stats, color }) => {
  return (
    <Card className={`p-3 ${getColorClass(color, 'bg-light')}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${getColorClass(color, 'bg')}`} />
        <h5 className="text-xs font-semibold text-gray-900">{label}</h5>
      </div>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Mean:</span>
          <span className={`text-sm font-bold ${getScoreColor(stats.mean)}`}>
            {formatPercentage(stats.mean)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Range:</span>
          <span className="text-gray-900 font-medium">
            {formatPercentage(stats.min)} - {formatPercentage(stats.max)}
          </span>
        </div>
      </div>
    </Card>
  );
};

const UserRatingCard = ({ label, stats }) => {
  return (
    <Card className="p-4">
      <h5 className="text-sm font-semibold text-gray-900 mb-2">{label}</h5>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Mean:</span>
          <span className={`text-lg font-bold ${getRatingColor(stats.mean)}`}>
            {formatRating(stats.mean)} / 5
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Range:</span>
          <span className="text-gray-900 font-medium">
            {formatRating(stats.min)} - {formatRating(stats.max)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Ratings:</span>
          <span className="text-gray-900 font-medium">{stats.count}</span>
        </div>
      </div>

      <RatingStars rating={stats.mean} />
    </Card>
  );
};

const RatingStars = ({ rating, size = 'normal' }) => {
  const starSize = size === 'small' ? 'h-3 w-3' : size === 'large' ? 'h-6 w-6' : 'h-4 w-4';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
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

// Helper Functions

function formatRating(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return value.toFixed(1);
}

function getScoreColor(score) {
  if (score === null || score === undefined || isNaN(score)) return 'text-gray-400';
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

function getRatingColor(rating) {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-blue-600';
  if (rating >= 2) return 'text-yellow-600';
  return 'text-red-600';
}

function getColorClass(color, type) {
  const classes = {
    blue: { 'bg': 'bg-blue-500', 'bg-light': 'bg-blue-50', 'text': 'text-blue-600' },
    green: { 'bg': 'bg-green-500', 'bg-light': 'bg-green-50', 'text': 'text-green-600' },
    purple: { 'bg': 'bg-purple-500', 'bg-light': 'bg-purple-50', 'text': 'text-purple-600' },
    orange: { 'bg': 'bg-orange-500', 'bg-light': 'bg-orange-50', 'text': 'text-orange-600' }
  };
  return classes[color]?.[type] || 'bg-gray-500';
}

function getColorHex(color) {
  const hexColors = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#a855f7',
    orange: '#f97316'
  };
  return hexColors[color] || '#6b7280';
}

export default TemplateQualityView;