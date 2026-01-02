// File: src/components/dashboard/EvaluationDashboard.jsx

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Loader2, RefreshCw, Download, Filter, TrendingUp, 
  Users, BarChart3, PieChart, Activity, ArrowLeft,
  GitCompare, Target, FileText, Database, Table, AlertTriangle,
  MessageSquare
} from 'lucide-react';
import '../../styles/GroundTruthView.css';

// Services
import githubDataService from '../../services/githubDataService';
import aggregationService from '../../services/aggregationService';
import integratedDataService from '../../services/IntegratedDataService';
import systemAnalysisService from '../../services/SystemAnalysisService';
import groundTruthService from '../../services/groundTruthService';
import { 
  enrichAllPapersContent, 
  getGroupedContentScores,
  getContentOverallStats 
} from '../../services/contentEnrichmentService';


// View Components
import OverviewMetrics from './views/OverviewMetrics';
// import SectionAnalysis from './views/SectionAnalysis';
import CrossPaperAnalysis from './views/CrossPaperAnalysis';
import ConfusionMatrixDisplay from './views/ConfusionMatrixDisplay';
import ExpertiseWeightedAnalysis from './views/ExpertiseWeightedAnalysis';
import SystemAccuracyAnalysis from './views/SystemAccuracyAnalysis';
import UserAgreementAnalysis from './views/UserAgreementAnalysis';
// import PaperDrillDown from './views/PaperDrillDown';
import DataQualityView from './views/DataQualityview';
import GroundTruthAnalytics from './views/GroundTruthTab';
import GroundTruthDataView from './views/GroundTruthView';
import ErrorsView from './views/ErrorsView';
import UserFeedbackAnalysis from './views/UserFeedbackAnalysis';
// Chart Components - Combined collection with research findings
import EvaluationChartsCollection from './charts/EvaluationChartsCollection';

// Config
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig';

const EvaluationDashboard = ({ initialView = 'overview' }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialView);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    expertiseLevel: 'all',
    role: 'all',
    section: 'all'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [integratedData, setIntegratedData] = useState(null);
  const [threeWayIntegratedData, setThreeWayIntegratedData] = useState(null);
  const [enrichmentStats, setEnrichmentStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);
 console.log("aggregatedData in main:", aggregatedData);
 console.log("integratedData in main:", integratedData);
 console.log("threeWayIntegratedData in main:", threeWayIntegratedData);
  useEffect(() => {
    if (aggregatedData) {
      // Expose for browser console debugging
      window.aggregatedDataDebug = aggregatedData;
      window.threeWayIntegratedDataDebug = threeWayIntegratedData;
      window.rawDataDebug = data;
      
      console.log('🐛 DEBUG DATA EXPOSED:');
      console.log('  ✅ window.aggregatedDataDebug');
      console.log('  ✅ window.threeWayIntegratedDataDebug');
      console.log('  ✅ window.rawDataDebug');
      console.log('');
      console.log('📊 Quick Check:');
      console.log('  - Total Evaluations:', aggregatedData.globalStats?.totalEvaluations || 'N/A');
      console.log('  - Total Papers:', aggregatedData.globalStats?.totalPapers || 'N/A');
      console.log('  - Has Components:', !!aggregatedData.components);
      console.log('  - Has GlobalStats:', !!aggregatedData.globalStats);
      console.log('  - Has Temporal:', !!aggregatedData.temporal);
      console.log('  - Has Correlations:', !!aggregatedData.correlations);
      console.log('  - Has Distribution:', !!aggregatedData.globalStats?.scores?.distribution);
      console.log('  - Enrichment Applied:', aggregatedData.globalStats?.enrichment?.applied || false);
      console.log('');
      
      // CHART FIX: Detailed component check
      const components = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
      console.log('📈 Component Scores:');
      components.forEach(comp => {
        if (aggregatedData.components?.[comp]) {
          const mean = aggregatedData.components[comp].scores?.mean;
          console.log(`  ✅ ${comp}: mean = ${mean !== undefined ? mean.toFixed(3) : 'N/A'}`);
          
          // Check for distribution
          if (aggregatedData.components[comp].scores?.distribution) {
            console.log(`     Distribution: available`);
          } else {
            console.warn(`     Distribution: MISSING`);
          }
        } else {
          console.log(`  ❌ ${comp}: MISSING`);
        }
      });
      console.log('');
      console.log('🔍 To run diagnostics: Paste chart_diagnostics.js content in console');
    }
  }, [aggregatedData, threeWayIntegratedData, data]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Step 1: Loading evaluation data...');
      // Load evaluation data
      const result = await githubDataService.fetchAllEvaluations();
      setData(result);
      
      // Initial aggregation (will be updated after enrichment)
      let initialAggregated = null;
      if (result.raw && result.raw.length > 0) {
        console.log('📊 Step 2: Initial aggregation (pre-enrichment)...');
        initialAggregated = aggregationService.aggregateAll(result.raw);
        console.log('✅ Initial aggregated data (content may be 0):', initialAggregated);
      }

      // Load integrated data (Ground Truth + System + Evaluations)
      let enrichedThreeWayData = null;
      try {
        console.log('🔗 Step 3: Loading integrated data (GT + System + Evaluations)...');
        const integrated = await integratedDataService.loadAllData();
        setIntegratedData(integrated);
        console.log('✅ Integrated data loaded:', integrated);

        // Step 4: Create three-way integrated data structure
        if (integrated && integrated.matches && result.raw) {
          console.log('🔧 Step 4: Creating three-way integrated data structure...');
          const threeWayData = await createThreeWayIntegratedData(integrated, result.raw);
          
          // Step 5: Enrich content data with system values and recalculate scores
          console.log('🔄 Step 5: Enriching content data from systemData...');
          enrichedThreeWayData = enrichAllPapersContent(threeWayData);
          setThreeWayIntegratedData(enrichedThreeWayData);
          
          // Track enrichment stats
          const stats = enrichedThreeWayData.enrichmentStats?.content || {};
          setEnrichmentStats(stats);
          console.log('✅ Three-way integrated data created and enriched:', enrichedThreeWayData);
          console.log('📊 Enrichment stats:', stats);
        }
      } catch (integratedError) {
        console.warn('⚠️ Could not load integrated data:', integratedError);
      }

      // Step 6: RE-AGGREGATE with enriched evaluations
      // This is the KEY FIX - we need to re-aggregate after enrichment
      if (result.raw && result.raw.length > 0 && enrichedThreeWayData) {
        console.log('🔄 Step 6: Re-aggregating with enriched content data...');
        
        // Extract enriched evaluations from three-way data
        const enrichedEvaluations = extractEnrichedEvaluations(enrichedThreeWayData, result.raw);
        
        // Re-run aggregation with enriched evaluations
        const enrichedAggregated = aggregationService.aggregateAll(enrichedEvaluations);
        
        // Add enrichment metadata
        if (enrichedAggregated.globalStats) {
          enrichedAggregated.globalStats.enrichment = {
            applied: true,
            propertiesEnriched: enrichedThreeWayData.enrichmentStats?.content?.propertiesEnriched || 0,
            evaluationsEnriched: enrichedThreeWayData.enrichmentStats?.content?.evaluationsEnriched || 0,
            timestamp: new Date().toISOString()
          };
        }
        
        setAggregatedData(enrichedAggregated);
        console.log('✅ Re-aggregated with enrichment:', enrichedAggregated);
        console.log('📊 Content score after enrichment:', enrichedAggregated.components?.content?.scores?.mean);
      } else {
        // Fallback to initial aggregation if enrichment wasn't possible
        setAggregatedData(initialAggregated);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to load evaluation data');
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Extract enriched evaluations from three-way integrated data
   * Maps back the enriched evaluation metrics to the original evaluation objects
   */
  const extractEnrichedEvaluations = (enrichedThreeWayData, originalEvaluations) => {
    if (!enrichedThreeWayData?.papers || !originalEvaluations) {
      return originalEvaluations;
    }

    // Create a map of token -> enriched evaluation
    const enrichedMap = new Map();
    enrichedThreeWayData.papers.forEach(paper => {
      if (paper.token && paper.evaluation) {
        enrichedMap.set(paper.token, paper.evaluation);
      }
      // Also handle userEvaluations array if present
      if (paper.userEvaluations) {
        paper.userEvaluations.forEach(evals => {
          if (evals.token) {
            enrichedMap.set(evals.token, evals);
          }
        });
      }
    });

    // Merge enriched data back into original evaluations
    return originalEvaluations.map(originalEval => {
      const enrichedEval = enrichedMap.get(originalEval.token);
      if (enrichedEval && enrichedEval.evaluationMetrics?.overall?.content) {
        // Deep merge the enriched content into original evaluation
        return {
          ...originalEval,
          evaluationMetrics: {
            ...originalEval.evaluationMetrics,
            overall: {
              ...originalEval.evaluationMetrics?.overall,
              content: enrichedEval.evaluationMetrics.overall.content
            },
            accuracy: {
              ...originalEval.evaluationMetrics?.accuracy,
              content: enrichedEval.evaluationMetrics?.accuracy?.content
            },
            quality: {
              ...originalEval.evaluationMetrics?.quality,
              content: enrichedEval.evaluationMetrics?.quality?.content
            }
          },
          _enriched: true
        };
      }
      return originalEval;
    });
  };

  /**
   * CRITICAL: Create three-way integrated data structure
   * Following Pattern 4 from Data_Integration_Overview.md
   * 
   * Structure:
   * {
   *   papers: [
   *     {
   *       groundTruth: { ... ground truth data ... },
   *       systemData: { ... system analysis data ... },
   *       evaluation: { ... user evaluation data ... },
   *       token: "eval_...",
   *       doi: "10.1234/...",
   *       linked: { systemToEvaluation, evaluationToGroundTruth }
   *     }
   *   ]
   * }
   */
  const createThreeWayIntegratedData = async (integratedData, evaluations) => {
    console.log('🔧 Creating three-way integrated data...');
    const papers = [];
    
    // Get all unique tokens from evaluations
    const tokens = [...new Set(evaluations.map(e => e.token))];
    console.log(`  📝 Processing ${tokens.length} unique tokens...`);
    
    for (const token of tokens) {
      try {
        // 1. Load system data using token
        console.log(`  🔍 Loading data for token: ${token}`);
        const systemData = await systemAnalysisService.loadSystemData(token);
        
        // 2. Load evaluation data using same token
        const evaluation = evaluations.find(e => e.token === token);
        
        if (!systemData || !evaluation) {
          console.warn(`  ⚠️ Missing data for token ${token}`);
          continue;
        }
        
        // 3. Extract DOI from system data
        const doi = systemData.metadata?.doi;
        
        // 4. Find in ground truth using DOI
        const groundTruthPaper = doi ? groundTruthService.getPaperByDoi(doi) : null;
        
        // 5. Create integrated paper object
        const integratedPaper = {
          // Primary identifiers
          token: token,
          doi: doi,
          
          // Three data sources - CRITICAL: Include systemOutput for enrichment service
          groundTruth: groundTruthPaper || null,
          systemData: systemData,
          systemOutput: systemData, // Alias for enrichment service compatibility
          evaluation: evaluation,
          userEvaluations: [evaluation], // Array format for enrichment service
          
          // Linkage verification
          linked: {
            systemToEvaluation: systemData.token === evaluation.token,
            evaluationToGroundTruth: !!groundTruthPaper
          },
          
          // Extracted summary data for quick access
          summary: {
            // From Ground Truth
            gtField: groundTruthPaper?.research_field_name || null,
            gtProblem: groundTruthPaper?.research_problem_name || null,
            gtTemplate: groundTruthPaper?.template_name || null,
            
            // From System Data
            systemField: systemData.researchFields?.selectedField?.name || null,
            systemFieldConfidence: systemData.researchFields?.selectedField?.score || 0,
            systemProblemSource: systemAnalysisService.getResearchProblemSource(systemData),
            systemTemplateSource: systemAnalysisService.getTemplateSource(systemData),
            
            // From Evaluation
            metadataScore: evaluation.overall?.metadata?.overall?.overallScore || 0,
            fieldScore: evaluation.overall?.research_field?.overallScore || 0,
            problemScore: evaluation.overall?.research_problem?.overallScore || 0,
            templateScore: evaluation.overall?.template?.overallScore || 0,
            
            // User info
            evaluatorExpertise: evaluation.userInfo?.expertiseWeight || 0,
            evaluatorRole: evaluation.userInfo?.role || 'Unknown'
          }
        };
        
        papers.push(integratedPaper);
        console.log(`  ✅ Integrated paper: ${systemData.metadata?.title?.substring(0, 50)}...`);
        
      } catch (err) {
        console.error(`  ❌ Error processing token ${token}:`, err);
      }
    }
    
    console.log(`✅ Three-way integration complete. Papers: ${papers.length}`);
    
    return {
      papers: papers,
      statistics: {
        totalPapers: papers.length,
        withGroundTruth: papers.filter(p => p.groundTruth).length,
        withSystemData: papers.filter(p => p.systemData).length,
        withEvaluation: papers.filter(p => p.evaluation).length,
        fullyLinked: papers.filter(p => p.linked.systemToEvaluation && p.linked.evaluationToGroundTruth).length,
        llmProblems: papers.filter(p => p.summary.systemProblemSource === 'LLM').length,
        llmTemplates: papers.filter(p => p.summary.systemTemplateSource === 'LLM').length
      }
    };
  };

  // Extract system evaluation data for errors analysis (same as in DataQualityView)
  const systemEvaluationData = useMemo(() => {
    if (!threeWayIntegratedData?.papers) return [];
    return threeWayIntegratedData.papers.map(paper => ({
      doi: paper.doi,
      systemData: paper.systemData,
      evaluation: paper.evaluation,
      token: paper.token
    }));
  }, [threeWayIntegratedData]);
  console.log('🔍 Extracting system evaluation data for ErrorsView...', systemEvaluationData);
  const handleRefresh = async () => {
    setRefreshing(true);
    githubDataService.clearCache();
    systemAnalysisService.clear();
    integratedDataService.clearCache(); // Also clear integrated data cache
    aggregationService.clearCache(); // Clear aggregation cache
    await loadData();
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    if (!data || !data.processed) return;
    
    const csv = generateCSV(data.processed);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation_analysis_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (processedData) => {
    // Handle both array and object formats
    let dataArray = [];
    if (Array.isArray(processedData)) {
      dataArray = processedData;
    } else if (processedData && typeof processedData === 'object') {
      dataArray = Object.values(processedData);
    }

    const headers = [
      'Paper ID',
      'Timestamp',
      'User Role',
      'Expertise Weight',
      'Overall Score',
      'Metadata Score',
      'Research Field Score',
      'Research Problem Score',
      'Template Score',
      'Content Score'
    ];

    const rows = dataArray.map(item => [
      item.paperId || item.token || 'N/A',
      item.timestamp || 'N/A',
      item.userRole || item.userInfo?.role || 'N/A',
      item.expertiseWeight || item.userInfo?.expertiseWeight || 'N/A',
      item.overallScore || 'N/A',
      item.metadataScore || 'N/A',
      item.researchFieldScore || 'N/A',
      item.researchProblemScore || 'N/A',
      item.templateScore || 'N/A',
      item.contentScore || 'N/A'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const filteredData = React.useMemo(() => {
    if (!data) return null;

    // Handle different data structures
    let processedArray = [];
    if (data.processed) {
      if (Array.isArray(data.processed)) {
        processedArray = data.processed;
      } else if (typeof data.processed === 'object') {
        processedArray = Object.values(data.processed);
      }
    } else if (data.raw && Array.isArray(data.raw)) {
      processedArray = data.raw;
    }

    if (processedArray.length === 0) {
      return data;
    }

    let filtered = [...processedArray];

    // Apply filters
    if (filters.expertiseLevel !== 'all') {
      filtered = filtered.filter(item => 
        item.expertiseLevel === filters.expertiseLevel ||
        item.userInfo?.expertiseLevel === filters.expertiseLevel
      );
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(item => 
        item.userRole === filters.role ||
        item.userInfo?.role === filters.role
      );
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const ranges = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        quarter: 90 * 24 * 60 * 60 * 1000
      };
      const cutoff = new Date(now - ranges[filters.dateRange]);
      filtered = filtered.filter(item => new Date(item.timestamp) >= cutoff);
    }

    return { ...data, processed: filtered };
  }, [data, filters]);

  console.log('🐛 filteredData:', filteredData);
  console.log("Aggregated Data:", aggregatedData);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading data: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Evaluation Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Comprehensive analysis of paper evaluations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 w-full">
            <TabsTrigger value="overview" className="flex-shrink-0">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            {/* 
            <TabsTrigger value="sections" className="flex-shrink-0">
              <BarChart3 className="h-4 w-4 mr-2" />
              Sections
            </TabsTrigger>
            */}
            <TabsTrigger value="confusion" className="flex-shrink-0">
              <Activity className="h-4 w-4 mr-2" />
              Confusion
            </TabsTrigger>
            <TabsTrigger value="expertise" className="flex-shrink-0">
              <Users className="h-4 w-4 mr-2" />
              Expertise
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="flex-shrink-0">
              <PieChart className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="crossPaper" className="flex-shrink-0">
              <FileText className="h-4 w-4 mr-2" />
              Paper Analysis
            </TabsTrigger>
            <TabsTrigger value="systemAccuracy" className="flex-shrink-0">
              <Target className="h-4 w-4 mr-2" />
              Accuracy
            </TabsTrigger>
            <TabsTrigger value="userAgreement" className="flex-shrink-0">
              <Users className="h-4 w-4 mr-2" />
              Agreement
            </TabsTrigger>
            {/*
            <TabsTrigger value="paperComparison" className="flex-shrink-0">
              <FileText className="h-4 w-4 mr-2" />
              Papers
            </TabsTrigger>
            */}
            <TabsTrigger value="dataQuality" className="flex-shrink-0">
              <Database className="h-4 w-4 mr-2" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex-shrink-0">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Errors
            </TabsTrigger>
            {/* NEW: User Feedback Tab */}
            <TabsTrigger value="userFeedback" className="flex-shrink-0">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="groundTruthAnalytics" className="flex-shrink-0">
              <BarChart3 className="h-4 w-4 mr-2" />
              GT Analytics
            </TabsTrigger>
            <TabsTrigger value="groundTruthData" className="flex-shrink-0">
              <Table className="h-4 w-4 mr-2" />
              GT Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewMetrics 
              data={filteredData} 
              aggregatedData={aggregatedData}
              integratedData={threeWayIntegratedData}
              enrichmentStats={enrichmentStats}
              onTabChange={setActiveTab}
            />
          </TabsContent>
          {/*
          <TabsContent value="sections">
            <SectionAnalysis 
              data={filteredData} 
              aggregatedData={aggregatedData}
              integratedData={threeWayIntegratedData}
            />
          </TabsContent>
          */}
          <TabsContent value="confusion">
            <ConfusionMatrixDisplay 
              data={filteredData} 
              aggregatedData={aggregatedData}
              integratedData={threeWayIntegratedData}
            />
          </TabsContent>

          <TabsContent value="expertise">
            <ExpertiseWeightedAnalysis 
              data={filteredData} 
              aggregatedData={aggregatedData} 
              integratedData={integratedData}
            />
          </TabsContent>

          {/* UPDATED: Charts tab now uses EvaluationChartsCollection only */}
          <TabsContent value="visualizations">
            <EvaluationChartsCollection 
              data={filteredData}
              aggregatedData={aggregatedData} 
              integratedData={threeWayIntegratedData} 
            />
          </TabsContent>

          <TabsContent value="crossPaper">
            <CrossPaperAnalysis 
              aggregatedData={aggregatedData} 
              integratedData={integratedData}
            />
          </TabsContent>

          {/* CRITICAL: Pass three-way integrated data to SystemAccuracyAnalysis */}
          <TabsContent value="systemAccuracy">
            <SystemAccuracyAnalysis 
              aggregatedData={aggregatedData}
              integratedData={threeWayIntegratedData}
            />
          </TabsContent>

          <TabsContent value="userAgreement">
            <UserAgreementAnalysis 
              aggregatedData={aggregatedData}
              integratedData={threeWayIntegratedData}
            />
          </TabsContent>
          {/*
          <TabsContent value="paperComparison">
            <PaperDrillDown 
              aggregatedData={aggregatedData}
              integratedData={integratedData}
            />
          </TabsContent>
          */}
          <TabsContent value="dataQuality">
            <DataQualityView 
              aggregatedData={aggregatedData}
              integratedData={threeWayIntegratedData}
            />
          </TabsContent>

          {/* NEW: Errors Tab - Main Dashboard Level */}
          <TabsContent value="errors">
            <ErrorsView systemData={systemEvaluationData} />
          </TabsContent>

          {/* NEW: User Feedback Analysis Tab */}
          <TabsContent value="userFeedback">
            <UserFeedbackAnalysis 
              data={filteredData}
              aggregatedData={aggregatedData}
            />
          </TabsContent>

          <TabsContent value="groundTruthAnalytics">
            <GroundTruthAnalytics />
          </TabsContent>

          <TabsContent value="groundTruthData">
            <GroundTruthDataView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EvaluationDashboard;