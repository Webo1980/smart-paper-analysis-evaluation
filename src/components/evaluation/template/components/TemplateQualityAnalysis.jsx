// src/components/evaluation/template/components/TemplateQualityAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Card } from '../../../ui/card';
import BaseContentMetrics from '../../base/BaseContentMetrics';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { processTemplateQualityMetrics } from '../utils/qualityMetrics';
import { QualityDimensionRadar } from '../visualizations/QualityDimensionRadar';
import QualityMetricsDisplay from './QualityMetricsDisplay';
import TitleQualitySection from './TitleQualitySection';
import DescriptionQualitySection from './DescriptionQualitySection';
import PropertyCoverageSection from './PropertyCoverageSection';
import ResearchAlignmentSection from './ResearchAlignmentSection';
import { QUALITY_WEIGHTS, TEXT_CONFIG, METRIC_CONFIG } from '../config/templateConfig';

const TemplateQualityAnalysis = ({
  metrics,
  templateData,
  researchProblem,
  expertiseMultiplier,
  ratings
}) => {
  const [qualityResults, setQualityResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const processQuality = () => {
      setLoading(true);
      try {
        const result = processTemplateQualityMetrics(templateData, researchProblem);
        setQualityResults(result);
      } catch (error) {
        console.error("Error processing template quality:", error);
      } finally {
        setLoading(false);
      }
    };
    
    processQuality();
  }, [templateData, researchProblem]);

  if (loading && !qualityResults) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Template Quality Analysis</h3>
        <p className="text-sm text-gray-600">Loading quality metrics...</p>
      </Card>
    );
  }

  const { qualityData, titleQuality, descriptionQuality, propertyCoverage, researchAlignment } = qualityResults || {};
  
  const effectiveRating = ratings?.researchAlignment || 3;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Template Quality Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        This evaluation assesses the quality of the template across four dimensions:
        title quality, description quality, property coverage, and research alignment.
      </p>
      
      <BaseContentMetrics
        metrics={metrics}
        referenceValue={templateData?.title || templateData?.name || ''}
        extractedValue={researchProblem?.title || ''}
        expertiseWeight={expertiseMultiplier}
        expertiseMultiplier={expertiseMultiplier}
        rating={effectiveRating}
        fieldName="Template"
        metricType="quality"
        textConfig={TEXT_CONFIG.quality}
        metricDefinitions={{}} // These will be passed from the config
        analysisData={qualityData}
        scoreDetails={{}} // These will be calculated
        metricConfig={METRIC_CONFIG.quality}
      />
      
      <div className="mt-6 mb-4">
        <QualityDimensionRadar qualityData={qualityData} height={300} />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="title">Title Quality</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="alignment">Alignment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-2">
          <QualityMetricsDisplay qualityData={qualityData} />
        </TabsContent>
        
        <TabsContent value="title" className="mt-2">
          <TitleQualitySection qualityData={qualityData} titleQuality={titleQuality} />
        </TabsContent>
        
        <TabsContent value="description" className="mt-2">
          <DescriptionQualitySection qualityData={qualityData} descriptionQuality={descriptionQuality} />
        </TabsContent>
        
        <TabsContent value="properties" className="mt-2">
          <PropertyCoverageSection qualityData={qualityData} propertyCoverage={propertyCoverage} templateData={templateData} />
        </TabsContent>
        
        <TabsContent value="alignment" className="mt-2">
          <ResearchAlignmentSection qualityData={qualityData} researchAlignment={researchAlignment} templateData={templateData} researchProblem={researchProblem} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TemplateQualityAnalysis;