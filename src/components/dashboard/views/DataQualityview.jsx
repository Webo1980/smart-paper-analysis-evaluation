// src/components/dashboard/views/DataQualityView.jsx
// REFACTORED: Pure UI component - all calculations moved to dataEnrichment.js

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Info, BarChart3, FileText } from 'lucide-react';
import MetadataQualityView from './quality/MetadataQualityView';
import ResearchFieldQualityView from './quality/ResearchFieldQualityView';
import ResearchProblemQualityView from './quality/ResearchProblemQualityView';
import TemplateQualityView from './quality/TemplateQualityView';
import ContentQualityView from './quality/ContentQualityView';
import PaperView from './PaperView';
import SharedEvaluationExplanations from './shared/SharedEvaluationExplanations';
import { 
  extractMetadataQuality,
  extractFieldQuality,
  extractProblemQuality,
  extractTemplateQuality,
  extractContentQuality 
} from '../../../utils/qualityDataExtractors';
import MetadataQualityPaperDetail from './quality/paper-detail/MetadataQualityPaperDetail';
import ResearchFieldQualityPaperDetail from './quality/paper-detail/ResearchFieldQualityPaperDetail';
import ResearchProblemQualityPaperDetail from './quality/paper-detail/ResearchProblemQualityPaperDetail';
import TemplateQualityPaperDetail from './quality/paper-detail/TemplateQualityPaperDetail.jsx';
import ContentQualityPaperDetail from './quality/paper-detail/ContentQualityPaperDetail';

// Import calculation functions from service
import {
  transformPapersForQuality,
  aggregateMetadataQuality,
  aggregateResearchFieldQuality,
  aggregateResearchProblemQuality,
  aggregateTemplateQuality,
  aggregateContentQuality,
  calculateQualitySummaryStats
} from '../../../utils/dataEnrichment';

/**
 * Data Quality View Component
 * REFACTORED: Pure UI component - reads from dataEnrichment service
 */
const DataQualityView = ({ aggregatedData, integratedData }) => {
  const [viewMode, setViewMode] = useState('component');
  const [activeTab, setActiveTab] = useState('metadata');

  // Create extractors object to pass to transform function
  const extractors = useMemo(() => ({
    extractMetadataQuality,
    extractFieldQuality,
    extractProblemQuality,
    extractTemplateQuality,
    extractContentQuality
  }), []);

  // Transform integrated data for paper view - uses service function
  const transformedPapers = useMemo(() => {
    console.log('DataQualityView - integratedData:', integratedData);
    console.log('DataQualityView - integratedData.papers:', integratedData?.papers);
    
    if (!integratedData?.papers) return [];
    return transformPapersForQuality(integratedData.papers, extractors);
  }, [integratedData, extractors]);
   
  // Extract system evaluation data for errors analysis
  const systemEvaluationData = useMemo(() => {
    if (!integratedData?.papers) return [];
    
    return integratedData.papers.map(paper => ({
      doi: paper.doi,
      systemData: paper.systemData,
      evaluation: paper.evaluation,
      token: paper.token
    }));
  }, [integratedData]);

  // Aggregate quality data - all use service functions
  const aggregatedMetadataQualityData = useMemo(() => {
    return aggregateMetadataQuality(transformedPapers);
  }, [transformedPapers]);

  const aggregatedResearchFieldQualityData = useMemo(() => {
    return aggregateResearchFieldQuality(transformedPapers);
  }, [transformedPapers]);

  const aggregatedResearchProblemQualityData = useMemo(() => {
    return aggregateResearchProblemQuality(transformedPapers);
  }, [transformedPapers]);

  const aggregatedTemplateQualityData = useMemo(() => {
    return aggregateTemplateQuality(transformedPapers);
  }, [transformedPapers]);

  const aggregatedContentQualityData = useMemo(() => {
    return aggregateContentQuality(transformedPapers);
  }, [transformedPapers]);

  // Quality-specific component detail views for PaperView
  const qualityDetailViews = {
    metadata: MetadataQualityPaperDetail,
    researchField: ResearchFieldQualityPaperDetail,
    researchProblem: ResearchProblemQualityPaperDetail,
    template: TemplateQualityPaperDetail,
    content: ContentQualityPaperDetail
  };

  // Calculate summary statistics - uses service function with aggregatedData
  const summaryStats = useMemo(() => {
    return calculateQualitySummaryStats({
      aggregatedMetadataQuality: aggregatedMetadataQualityData,
      aggregatedResearchFieldQuality: aggregatedResearchFieldQualityData,
      aggregatedResearchProblemQuality: aggregatedResearchProblemQualityData,
      aggregatedTemplateQuality: aggregatedTemplateQualityData,
      aggregatedContentQuality: aggregatedContentQualityData
    }, systemEvaluationData, aggregatedData);
  }, [
    aggregatedMetadataQualityData,
    aggregatedResearchFieldQualityData,
    aggregatedResearchProblemQualityData,
    aggregatedTemplateQualityData,
    aggregatedContentQualityData,
    systemEvaluationData,
    aggregatedData
  ]);

  if (!aggregatedData && !integratedData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No data available for quality analysis. Please load evaluation data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Quality Analysis</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive quality assessment with detailed sub-dimension metrics
          </p>
        </div>

        {/* View Mode Toggle */}
        <Card className="p-1 flex items-center space-x-1">
          <button
            onClick={() => setViewMode('component')}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded transition-colors
              ${viewMode === 'component' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'}
            `}
          >
            <BarChart3 size={16} />
            <span className="text-sm font-medium">Component View</span>
          </button>
          <button
            onClick={() => setViewMode('paper')}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded transition-colors
              ${viewMode === 'paper' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'}
            `}
          >
            <FileText size={16} />
            <span className="text-sm font-medium">Paper View</span>
          </button>
        </Card>
      </div>

      {/* Shared Evaluation Explanations */}
      <SharedEvaluationExplanations focusType="quality" />

      {/* Component View - Aggregated Analysis */}
      {viewMode === 'component' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {summaryStats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <QualitySummaryCard
                title="Metadata"
                score={summaryStats.metadata.final}
                evaluations={summaryStats.metadata.evaluations}
                dimensions={{
                  'Auto': summaryStats.metadata.auto,
                  'User': summaryStats.metadata.userRating || 0,
                  'Final': summaryStats.metadata.final
                }}
                active={activeTab === 'metadata'}
                onClick={() => setActiveTab('metadata')}
              />
              <QualitySummaryCard
                title="Research Field"
                score={summaryStats.researchField.final}
                evaluations={summaryStats.researchField.evaluations}
                dimensions={{
                  'Auto': summaryStats.researchField.auto,
                  'User': summaryStats.researchField.userRating || 0,
                  'Final': summaryStats.researchField.final
                }}
                active={activeTab === 'researchField'}
                onClick={() => setActiveTab('researchField')}
              />
              <QualitySummaryCard
                title="Research Problem"
                score={summaryStats.researchProblem.final}
                evaluations={summaryStats.researchProblem.evaluations}
                dimensions={{
                  'Auto': summaryStats.researchProblem.auto,
                  'User': summaryStats.researchProblem.userRating || 0,
                  'Final': summaryStats.researchProblem.final
                }}
                active={activeTab === 'researchProblem'}
                onClick={() => setActiveTab('researchProblem')}
              />
              <QualitySummaryCard
                title="Template"
                score={summaryStats.template.final}
                evaluations={summaryStats.template.evaluations}
                dimensions={{
                  'Auto': summaryStats.template.auto,
                  'User': summaryStats.template.userRating || 0,
                  'Final': summaryStats.template.final
                }}
                active={activeTab === 'template'}
                onClick={() => setActiveTab('template')}
              />
              <QualitySummaryCard
                title="Content"
                score={summaryStats.content.final}
                evaluations={summaryStats.content.evaluations}
                dimensions={{
                  'Auto': summaryStats.content.auto,
                  'User': summaryStats.content.userRating || 0,
                  'Final': summaryStats.content.final
                }}
                active={activeTab === 'content'}
                onClick={() => setActiveTab('content')}
              />
            </div>
          )}

          {/* Component Tabs */}
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="researchField">Research Field</TabsTrigger>
                <TabsTrigger value="researchProblem">Research Problem</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>

              <TabsContent value="metadata">
                {aggregatedMetadataQualityData ? (
                  <MetadataQualityView 
                    componentData={aggregatedMetadataQualityData}
                    papers={transformedPapers}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No metadata quality data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="researchField">
                {aggregatedResearchFieldQualityData ? (
                  <ResearchFieldQualityView 
                    componentData={aggregatedResearchFieldQualityData}
                    papers={transformedPapers}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No research field quality data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="researchProblem">
                {aggregatedResearchProblemQualityData ? (
                  <ResearchProblemQualityView 
                    componentData={aggregatedResearchProblemQualityData}
                    papers={transformedPapers}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No research problem quality data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="template">
                {aggregatedTemplateQualityData ? (
                  <TemplateQualityView 
                    componentData={aggregatedTemplateQualityData}
                    papers={transformedPapers}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No template quality data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="content">
                {aggregatedContentQualityData ? (
                  <ContentQualityView 
                    componentData={aggregatedContentQualityData}
                    papers={transformedPapers}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No content quality data available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}

      {/* Paper View - Individual Paper Analysis */}
      {viewMode === 'paper' && (
        <PaperView
          papers={transformedPapers}
          componentDetailViews={qualityDetailViews}
          viewType="quality"
        />
      )}
    </div>
  );
};

/**
 * Quality Summary Card Component
 */
const QualitySummaryCard = ({ 
  title, 
  score, 
  evaluations, 
  dimensions, 
  active, 
  onClick 
}) => {
  const getScoreColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    if (score >= 0.3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 0.9) return 'from-green-50 to-emerald-50 border-green-200';
    if (score >= 0.7) return 'from-blue-50 to-indigo-50 border-blue-200';
    if (score >= 0.5) return 'from-yellow-50 to-amber-50 border-yellow-200';
    if (score >= 0.3) return 'from-orange-50 to-red-50 border-orange-200';
    return 'from-red-50 to-pink-50 border-red-200';
  };

  return (
    <Card 
      className={`
        p-4 cursor-pointer transition-all hover:shadow-lg
        bg-gradient-to-r ${getScoreBg(score)}
        ${active ? 'ring-2 ring-blue-600' : ''}
      `}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {active && <div className="h-2 w-2 bg-blue-600 rounded-full" />}
        </div>
        
        <div>
          <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {(score * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {evaluations} evaluation{evaluations !== 1 ? 's' : ''}
          </p>
        </div>

        {dimensions && (
          <div className="space-y-1 pt-2 border-t border-gray-200">
            {Object.entries(dimensions).map(([dim, value]) => (
              <div key={dim} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 capitalize">
                  {dim.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-medium text-gray-900">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DataQualityView;