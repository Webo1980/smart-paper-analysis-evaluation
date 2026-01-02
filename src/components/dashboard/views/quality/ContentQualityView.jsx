// File: src/components/dashboard/views/quality/ContentQualityView.jsx
// Content Quality View with comprehensive property extraction analysis

import React, { useState } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Progress } from '../../../ui/progress';
import { 
  FileText, Database, Brain, ChevronDown, ChevronUp, Info, 
  Star, CheckCircle, AlertCircle, Zap, Layers,
  Award, BarChart3, Grid, List, Target, Edit3, HelpCircle,
  Package, Hash, Percent, TrendingUp
} from 'lucide-react';
import { formatPercentage } from '../../../evaluation/base/utils/baseMetricsUtils';

// Edit Metrics Calculation Function
const calculateContentEditMetrics = (papers) => {
  const editStats = {
    totalEvaluations: 0,
    evaluationsWithChanges: 0,
    totalChanges: 0,
    changesByProperty: {},
    changesBySource: { 
      orkg: { total: 0, count: 0 }, 
      llm: { total: 0, count: 0 }, 
      unknown: { total: 0, count: 0 } 
    },
    propertyAdditions: 0,
    propertyModifications: 0,
    propertyDeletions: 0,
    avgChangesPerEvaluation: 0,
    editDistribution: { none: 0, light: 0, moderate: 0, heavy: 0 }
  };

  if (!papers || papers.length === 0) return editStats;

  papers.forEach(paper => {
    const userEvaluations = paper.userEvaluations || [];
    
    userEvaluations.forEach(evaluation => {
        console.log("Processing evaluation:", evaluation);
      const contentEval = evaluation?.evaluationMetrics?.overall?.content;
      if (!contentEval) return;

      const rawChanges = evaluation?.systemData?.evaluationData?.paperContent?.changes;
      const changes = Array.isArray(rawChanges) 
        ? rawChanges 
        : rawChanges ? [rawChanges] : [];
      
      const templateData = evaluation?.evaluationMetrics?.overall?.template?.templateData || {};
      
      // Determine source
      let source = templateData.source || templateData.templateSource || 'unknown';
      source = String(source).toLowerCase().trim();
      
      if (source.includes('orkg')) {
        source = 'orkg';
      } else if (source.includes('llm') || source.includes('ai') || source.includes('generated')) {
        source = 'llm';
      }
      
      editStats.totalEvaluations++;
      
      if (changes.length > 0) {
        editStats.evaluationsWithChanges++;
        editStats.totalChanges += changes.length;
        
        // Track by source
        if (source === 'orkg' || source === 'llm') {
          editStats.changesBySource[source].total += changes.length;
          editStats.changesBySource[source].count++;
        } else {
          editStats.changesBySource.unknown.total += changes.length;
          editStats.changesBySource.unknown.count++;
        }
        
        // Track by property and change type
        changes.forEach(change => {
          const propertyName = change.property || change.field || 'unknown';
          editStats.changesByProperty[propertyName] = (editStats.changesByProperty[propertyName] || 0) + 1;
          
          if (change.changeType === 'added' || change.from === null) {
            editStats.propertyAdditions++;
          } else if (change.changeType === 'deleted' || change.to === null) {
            editStats.propertyDeletions++;
          } else {
            editStats.propertyModifications++;
          }
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
  const qualityIndicator = orkgAvg < llmAvg ? 'ORKG-based content required fewer edits' : 
                           orkgAvg > llmAvg ? 'LLM-based content required fewer edits' : 
                           'Both sources show similar edit requirements';
  
  return (
    <div className="space-y-4">
      <Alert className="bg-orange-50 border-orange-200">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <p className="text-sm">
            <strong>Edit Analysis:</strong> This shows how many changes evaluators made to extracted content, 
            indicating the quality of property value extraction. Fewer edits suggest higher extraction accuracy.
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
          label="Avg Edits/Paper" 
          value={editStats.avgChangesPerEvaluation.toFixed(2)} 
          type="text" 
        />
        <StatCard 
          label="Papers Edited" 
          value={`${editStats.evaluationsWithChanges} (${editPercentage}%)`} 
          type="text" 
        />
        <StatCard 
          label="Properties Added" 
          value={editStats.propertyAdditions} 
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
            ORKG-Based Content - Edit Analysis
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
              <span>Avg Edits/Paper:</span>
              <span className="font-bold text-lg text-blue-600">{orkgAvg.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-purple-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            LLM-Based Content - Edit Analysis
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
              <span>Avg Edits/Paper:</span>
              <span className="font-bold text-lg text-purple-600">{llmAvg.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {editStats.changesBySource.unknown.count > 0 && (
          <Card className="p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-gray-600" />
              Unknown Source Content - Edit Analysis
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
                <span>Avg Edits/Paper:</span>
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
              ORKG: {orkgAvg.toFixed(2)} edits/paper vs LLM: {llmAvg.toFixed(2)} edits/paper
              {orkgAvg < llmAvg && ' - ORKG-based extraction shows higher initial quality'}
              {llmAvg < orkgAvg && ' - LLM-based extraction shows higher initial quality'}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(editStats.changesByProperty).length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Changes by Property</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(editStats.changesByProperty)
              .sort(([,a], [,b]) => b - a)
              .map(([property, count]) => {
                const percentage = (count / editStats.totalChanges * 100);
                return (
                  <div key={property}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate max-w-[200px]" title={property}>{property}</span>
                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Edit Type Distribution</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded">
            <p className="text-2xl font-bold text-green-600">{editStats.propertyAdditions}</p>
            <p className="text-xs text-gray-600">Added</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded">
            <p className="text-2xl font-bold text-blue-600">{editStats.propertyModifications}</p>
            <p className="text-xs text-gray-600">Modified</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <p className="text-2xl font-bold text-red-600">{editStats.propertyDeletions}</p>
            <p className="text-xs text-gray-600">Deleted</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ContentQualityView = ({ componentData, papers }) => {
  console.log("ContentQualityView received:", { 
    componentData, 
    paperCount: papers?.length,
    hasComponentData: !!componentData,
    componentDataKeys: componentData ? Object.keys(componentData) : []
  });
  
  const [expandedSections, setExpandedSections] = useState({
    sourceBreakdown: true,
    qualityDimensions: true,
    propertyAnalysis: true,
    overallStats: true,
    editAnalysis: true,
    sectionCoverage: false,
    extractionMetrics: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const metrics = componentData;
  console.log("Content Quality Metrics:", metrics);
  if (!metrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No content quality data available
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Overall Content Quality Score */}
      <Card className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-teal-900">
            <Award className="h-8 w-8 text-teal-600" />
            Overall Content Quality
          </h2>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {metrics.evaluationCount} Evaluations
          </Badge>
        </div>

        {metrics.qualityScores?.overall && (
          <div className="flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-teal-200">
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
      </Card>

      {/* Source Distribution */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('sourceBreakdown')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-teal-600" />
            Content Source Distribution
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
                title="ORKG-Based"
                count={metrics.sourceDistribution?.orkg || 0}
                percentage={metrics.sourceDistribution?.total > 0 
                  ? ((metrics.sourceDistribution.orkg / metrics.sourceDistribution.total) * 100).toFixed(1)
                  : 0}
                color="blue"
                description="Using ORKG templates"
                qualityScore={metrics.bySource?.orkg?.overall?.mean}
              />
              <SourceCard
                icon={Brain}
                title="LLM-Based"
                count={metrics.sourceDistribution?.llm || 0}
                percentage={metrics.sourceDistribution?.total > 0 
                  ? ((metrics.sourceDistribution.llm / metrics.sourceDistribution.total) * 100).toFixed(1)
                  : 0}
                color="purple"
                description="Using LLM templates"
                qualityScore={metrics.bySource?.llm?.overall?.mean}
              />
              <SourceCard
                icon={Package}
                title="Total Content"
                count={metrics.sourceDistribution?.total || 0}
                percentage="100.0"
                color="green"
                description="All evaluated content"
                qualityScore={metrics.qualityScores?.overall?.mean}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Edit Analysis */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50">
        <button
          onClick={() => toggleSection('editAnalysis')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-orange-600" />
            Content Extraction Quality - Edit Analysis
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
            <EditMetricsSection editStats={calculateContentEditMetrics(papers)} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(metrics.dimensionScores).map(([key, scores]) => {
                if (!scores || (!scores.final && !scores.automated && !scores.mean)) return null;

                const labelMap = {
                  extractionAccuracy: 'Extraction Accuracy',
                  completeness: 'Completeness',
                  sectionMapping: 'Section Mapping',
                  propertyQuality: 'Property Quality',
                  consistencyCheck: 'Consistency'
                };

                return (
                  <DimensionCard
                    key={key}
                    label={labelMap[key] || key}
                    automatedScore={scores.automated?.mean || scores.mean}
                    finalScore={scores.final?.mean}
                  />
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Property Analysis */}
      {metrics.propertyAnalysis && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('propertyAnalysis')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Grid className="h-5 w-5 text-purple-600" />
              Property Extraction Analysis
            </h3>
            {expandedSections.propertyAnalysis ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.propertyAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  label="Avg Properties Extracted" 
                  value={metrics.propertyAnalysis.avgPropertiesExtracted?.mean?.toFixed(1) || 'N/A'}
                  type="text"
                />
                <StatCard 
                  label="Extraction Rate" 
                  value={formatPercentage(metrics.propertyAnalysis.extractionRate?.mean || 0)}
                  type="text"
                />
                <StatCard 
                  label="Avg Confidence" 
                  value={formatPercentage(metrics.propertyAnalysis.avgConfidence?.mean || 0)}
                  type="text"
                />
                <StatCard 
                  label="Properties with Sources" 
                  value={formatPercentage(metrics.propertyAnalysis.propertiesWithSources?.mean || 0)}
                  type="text"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Section Coverage */}
      {metrics.sectionCoverage && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('sectionCoverage')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <List className="h-5 w-5 text-blue-600" />
              Section Coverage Analysis
            </h3>
            {expandedSections.sectionCoverage ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.sectionCoverage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard 
                  label="Avg Sections Used" 
                  value={metrics.sectionCoverage.avgSectionsUsed?.mean?.toFixed(1) || 'N/A'}
                  type="text"
                />
                <StatCard 
                  label="Section Coverage" 
                  value={formatPercentage(metrics.sectionCoverage.coverageRatio?.mean || 0)}
                  type="text"
                />
                <StatCard 
                  label="Most Common Section" 
                  value={metrics.sectionCoverage.mostCommonSection || 'N/A'}
                  type="text"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* User Ratings */}
      {metrics.userRatings && Object.values(metrics.userRatings).some(r => r && r.count > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-600" />
            User Ratings Distribution (1-5 Scale)
          </h3>
          
          <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <p className="text-sm">
                <strong>Note:</strong> User ratings (1-5 scale) reflect evaluator assessments of content extraction quality.
              </p>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metrics.userRatings).map(([key, stats]) => {
              if (!stats || stats.count === 0) return null;
              
              const labelMap = {
                overallQuality: 'Overall Quality',
                extractionAccuracy: 'Extraction Accuracy',
                completeness: 'Completeness',
                propertyQuality: 'Property Quality'
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
        </Card>
      )}
    </div>
  );
};

// Helper Components

const SourceCard = ({ icon: Icon, title, count, percentage, color, description, qualityScore }) => {
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
      <p className="text-xs opacity-80">{description}</p>
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

const DimensionCard = ({ label, automatedScore, finalScore }) => {
  return (
    <Card className="p-4">
      <h5 className="text-sm font-semibold text-gray-900 mb-3">{label}</h5>
      
      <div className="space-y-2">
        {automatedScore !== undefined && automatedScore !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Automated:</span>
            <span className={`text-lg font-bold ${getScoreColor(automatedScore)}`}>
              {formatPercentage(automatedScore)}
            </span>
          </div>
        )}
        
        {finalScore !== undefined && finalScore !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Final:</span>
            <span className={`text-lg font-bold ${getScoreColor(finalScore)}`}>
              {formatPercentage(finalScore)}
            </span>
          </div>
        )}
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

export default ContentQualityView;