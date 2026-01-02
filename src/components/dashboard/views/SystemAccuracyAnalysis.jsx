// File: src/components/dashboard/views/SystemAccuracyAnalysis.jsx
// REFACTORED VERSION - NO CALCULATIONS, READ FROM SERVICES ONLY
// 
// This component displays accuracy metrics that are pre-calculated by:
// - aggregationService.js: Aggregates metrics across papers and evaluators
// - integratedDataService.js: Integrates ground truth, system data, and evaluations
//
// ============================================================================
// DATA FLOW DIAGRAM
// ============================================================================
// ┌─────────────────────────────────────────────────────────────────────┐
// │  Ground Truth (ORKG CSV)  +  System Data  +  User Evaluations       │
// │                              ↓                                       │
// │              integratedDataService.loadAllData()                     │
// │                              ↓                                       │
// │                    integratedData.papers                             │
// │                              ↓                                       │
// │              aggregationService.aggregateAll()                       │
// │                              ↓                                       │
// │                       aggregatedData                                 │
// │                              ↓                                       │
// │            aggregatedData.papers[paperId][component]                 │
// │                              ↓                                       │
// │         { accuracyScores, qualityScores, userRatings, ... }         │
// └─────────────────────────────────────────────────────────────────────┘
//
// ============================================================================
// KEY NAMING CONVENTIONS (IMPORTANT!)
// ============================================================================
// 
// COMPONENT KEYS - may use either camelCase or snake_case:
// ┌────────────────────┬─────────────────┬───────────────────┐
// │ UI Key             │ camelCase       │ snake_case        │
// ├────────────────────┼─────────────────┼───────────────────┤
// │ researchField      │ researchField   │ research_field    │
// │ researchProblem    │ researchProblem │ research_problem  │
// │ metadata           │ metadata        │ metadata          │
// │ template           │ template        │ template          │
// │ content            │ content         │ content           │
// └────────────────────┴─────────────────┴───────────────────┘
//
// METADATA FIELD NAMES - evaluation data uses descriptive names:
// ┌────────────────────┬─────────────────────────┐
// │ Display Name       │ Evaluation Data Key     │
// ├────────────────────┼─────────────────────────┤
// │ Title              │ "Title Extraction"      │
// │ Authors            │ "Authors Extraction"    │
// │ DOI                │ "DOI Extraction"        │
// │ Venue              │ "Venue/Journal"         │
// │ Year               │ "publication_year"      │
// └────────────────────┴─────────────────────────┘
//
// ============================================================================
// ACCURACY METRICS (per component):
// ============================================================================
// - Metadata: Levenshtein distance, token matching, special char matching
// - Research Field: Position-based scoring (Top-1=100%, Top-3=80%, Top-5=60%)
// - Research Problem: ORKG=P/R/F1 comparison, LLM=completeness + user rating
// - Template: ORKG=property coverage, LLM=structural similarity
// - Content: Property extraction accuracy with evidence quality
//
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  CheckCircle, XCircle, AlertCircle, FileText, 
  Target, Layers, Grid, Info, BarChart3, FileStack
} from 'lucide-react';

// Import services
import systemAnalysisService from '../../../services/SystemAnalysisService';

// Import reusable components
import PaperView from './PaperView';
import SharedEvaluationExplanations from './shared/SharedEvaluationExplanations';

// Import component-specific accuracy views
import MetadataAccuracyView from './accuracy/MetadataAccuracyView';
import ResearchFieldAccuracyView from './accuracy/ResearchFieldAccuracyView';
import ResearchProblemAccuracyView from './accuracy/ResearchProblemAccuracyView';
import TemplateAccuracyView from './accuracy/TemplateAccuracyView';
import ContentAccuracyView from './accuracy/ContentAccuracyView';

// Import paper detail views
import MetadataPaperDetail from './accuracy/paper-detail/MetadataPaperDetail';
import ResearchFieldPaperDetail from './accuracy/paper-detail/ResearchFieldPaperDetail';
import ResearchProblemPaperDetail from './accuracy/paper-detail/ResearchProblemPaperDetail';
import TemplatePaperDetail from './accuracy/paper-detail/TemplatePaperDetail';
import ContentPaperDetail from './accuracy/paper-detail/ContentPaperDetail';

// ============================================================================
// FIELD MAPPING CONSTANTS
// ============================================================================
// Export these so child components can use consistent field names

/**
 * Metadata field name mapping
 * Maps display names to the keys used in evaluation data
 */
export const METADATA_FIELD_KEYS = {
  title: 'Title Extraction',
  authors: 'Authors Extraction',
  doi: 'DOI Extraction',
  venue: 'Venue/Journal',
  year: 'publication_year'
};

/**
 * Component key variants
 * Maps UI names to possible service key formats (camelCase and snake_case)
 */
export const COMPONENT_KEY_VARIANTS = {
  metadata: ['metadata'],
  researchField: ['researchField', 'research_field'],
  researchProblem: ['researchProblem', 'research_problem'],
  template: ['template'],
  content: ['content']
};

/**
 * Helper function to get component data with key fallback
 * Tries multiple key variants for compatibility
 */
export function getComponentData(data, componentName) {
  if (!data || !componentName) return null;
  
  const variants = COMPONENT_KEY_VARIANTS[componentName];
  if (!variants) return data[componentName] || null;
  
  for (const key of variants) {
    if (data[key]) return data[key];
  }
  return null;
}

/**
 * Helper function to get metadata field data
 * Handles the "Title Extraction" vs "title" naming difference
 */
export function getMetadataFieldData(accuracy, fieldName) {
  if (!accuracy?.metadata) return null;
  
  // Try the mapped key first (e.g., "Title Extraction")
  const mappedKey = METADATA_FIELD_KEYS[fieldName];
  if (mappedKey && accuracy.metadata[mappedKey]) {
    return accuracy.metadata[mappedKey];
  }
  
  // Fallback to direct key
  return accuracy.metadata[fieldName] || null;
}

/**
 * System Accuracy Analysis - Main Entry Point
 * 
 * PURPOSE:
 * Displays pre-calculated accuracy metrics from the aggregation service.
 * NO calculations are performed here - all data is READ from services.
 * 
 * TWO VIEW MODES:
 * 1. Component View - Aggregated analysis by component (Metadata, Field, etc.)
 * 2. Paper View - Drill-down by paper with detailed component analysis
 * 
 * DATA SOURCES:
 * - aggregatedData: Pre-aggregated metrics from aggregationService
 * - integratedData: Three-way integrated papers (GT + System + Evaluation)
 */
const SystemAccuracyAnalysis = ({ aggregatedData, integratedData }) => {
  console.log('📊 SystemAccuracyAnalysis - Input Data:', {
    aggregatedDataKeys: Object.keys(aggregatedData || {}),
    integratedDataKeys: Object.keys(integratedData || {}),
    paperCount: integratedData?.papers?.length || 0,
    aggregatedPaperCount: Object.keys(aggregatedData?.papers || {}).length
  });

  const [viewMode, setViewMode] = useState('component');
  const [activeComponent, setActiveComponent] = useState('metadata');
  const [systemDataCache, setSystemDataCache] = useState({});
  const [loadingSystemData, setLoadingSystemData] = useState(false);

  /**
   * READ average expertise multiplier from aggregated data
   * 
   * Path: aggregatedData.globalStats.expertise.mean
   * 
   * This is pre-calculated by aggregationService based on user roles:
   * - PhD Student: 1.2x
   * - Researcher: 1.5x
   * - PostDoc: 1.7x
   * - Professor: 2.0x
   */
  const averageExpertiseMultiplier = useMemo(() => {
    // First try to read from aggregatedData (preferred - no calculation)
    if (aggregatedData?.globalStats?.expertise?.mean) {
      return aggregatedData.globalStats.expertise.mean;
    }
    
    // Fallback: read from first available paper's evaluation
    if (integratedData?.papers?.[0]?.evaluation?.userInfo?.expertiseMultiplier) {
      return integratedData.papers[0].evaluation.userInfo.expertiseMultiplier;
    }
    
    return 1.0; // Default
  }, [aggregatedData, integratedData]);

  /**
   * Load systemData for all evaluations
   * This is a data FETCH operation, not a calculation
   */
  useEffect(() => {
    const loadAllSystemData = async () => {
      if (!integratedData?.papers || integratedData.papers.length === 0) {
        return;
      }

      setLoadingSystemData(true);
      const newCache = {};

      try {
        await Promise.all(
          integratedData.papers.map(async (paper) => {
            const token = paper.token || paper.evaluation?.token;
            
            if (!token) {
              console.warn('Paper missing token:', paper);
              return;
            }

            // If systemData already exists in the paper, use it
            if (paper.systemData) {
              newCache[token] = paper.systemData;
              return;
            }

            // Otherwise, load from service
            try {
              const systemData = await systemAnalysisService.loadByToken(token);
              newCache[token] = systemData;
            } catch (error) {
              console.error(`Failed to load systemData for ${token}:`, error);
              // Provide empty structure as fallback
              newCache[token] = createEmptySystemData(token);
            }
          })
        );

        setSystemDataCache(newCache);
      } catch (error) {
        console.error('Error loading system data:', error);
      } finally {
        setLoadingSystemData(false);
      }
    };

    loadAllSystemData();
  }, [integratedData]);

  /**
   * Transform three-way integrated data for display
   * This is a data TRANSFORMATION for UI, not a calculation
   * Groups evaluations by DOI for the paper view
   */
  const transformedPapers = useMemo(() => {
    if (!integratedData?.papers) return [];

    const papersByDoi = {};
    
    integratedData.papers.forEach((paper) => {
      const doi = paper.doi;
      const token = paper.token || paper.evaluation?.token;
      
      if (!papersByDoi[doi]) {
        papersByDoi[doi] = {
          doi: doi,
          groundTruth: paper.groundTruth,
          userEvaluations: []
        };
      }
      
      // Get systemData from cache or paper
      const systemData = systemDataCache[token] || paper.systemData || createEmptySystemData(token);
      
      // Transform evaluation for display
      const transformedEvaluation = {
        ...paper.evaluation,
        token: token,
        systemData: systemData,
        overall: paper.evaluation?.overall || {},
        evaluationMetrics: paper.evaluation?.evaluationMetrics || {},
        userInfo: paper.evaluation?.userInfo || {},
        timestamp: paper.evaluation?.timestamp || paper.timestamp
      };
      
      papersByDoi[doi].userEvaluations.push(transformedEvaluation);
    });
    
    return Object.values(papersByDoi);
  }, [integratedData, systemDataCache]);

  /**
   * READ component metrics from aggregatedData
   * 
   * NO CALCULATIONS - All metrics are pre-calculated by aggregationService
   * 
   * IMPORTANT: Key Naming Conventions
   * ================================
   * The evaluation data uses CAMEL CASE:
   * - evaluationMetrics.accuracy.researchField
   * - evaluationMetrics.accuracy.researchProblem
   * 
   * The aggregated data may use EITHER:
   * - aggregatedData.papers[paperId].researchField (camelCase)
   * - aggregatedData.papers[paperId].research_field (snake_case)
   * 
   * This function tries BOTH key formats for compatibility.
   * 
   * Data paths (same as OverviewMetrics):
   * - aggregatedData.papers[paperId][componentKey].accuracyScores.mean
   * - aggregatedData.papers[paperId][componentKey].scores.mean
   * - aggregatedData.papers[paperId][componentKey].userRatings.mean
   */
  const componentMetrics = useMemo(() => {
    // Return empty metrics if no data
    if (!aggregatedData?.papers) {
      console.log('⚠️ No aggregatedData.papers available');
      return createEmptyComponentMetrics();
    }

    const papers = Object.values(aggregatedData.papers);
    console.log(`📊 Reading metrics from ${papers.length} aggregated papers`);
    
    // Log first paper structure for debugging
    if (papers.length > 0) {
      console.log('📊 First paper keys:', Object.keys(papers[0]));
    }

    // Component key mapping - try BOTH camelCase and snake_case
    // The UI uses camelCase, but service might use either
    const componentKeyVariants = {
      metadata: ['metadata'],
      researchField: ['researchField', 'research_field'],
      researchProblem: ['researchProblem', 'research_problem'],
      template: ['template'],
      content: ['content']
    };

    const result = {};

    // READ metrics for each component from aggregated data
    Object.entries(componentKeyVariants).forEach(([uiKey, serviceKeys]) => {
      result[uiKey] = readComponentMetricsWithFallback(papers, serviceKeys);
    });

    console.log('📊 Component metrics (from service):', result);
    return result;
  }, [aggregatedData]);

  /**
   * READ components data structure from aggregatedData
   * 
   * IMPORTANT: Key Naming Conventions
   * The aggregated data may use either camelCase or snake_case.
   * This function tries both for compatibility.
   */
  const components = useMemo(() => {
    if (!aggregatedData?.components) {
      console.log('⚠️ No aggregatedData.components available');
      return {
        metadata: null,
        researchField: null,
        researchProblem: null,
        template: null,
        content: null
      };
    }

    console.log('📊 Available component keys:', Object.keys(aggregatedData.components));

    // Try both camelCase and snake_case for each component
    return {
      metadata: aggregatedData.components.metadata || null,
      researchField: aggregatedData.components.researchField 
        || aggregatedData.components.research_field 
        || null,
      researchProblem: aggregatedData.components.researchProblem 
        || aggregatedData.components.research_problem 
        || null,
      template: aggregatedData.components.template || null,
      content: aggregatedData.components.content || null
    };
  }, [aggregatedData]);

  // Loading state
  if (loadingSystemData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  // Paper detail view components mapping
  const componentDetailViews = {
    metadata: MetadataPaperDetail,
    researchField: ResearchFieldPaperDetail,
    researchProblem: ResearchProblemPaperDetail,
    template: TemplatePaperDetail,
    content: ContentPaperDetail
  };

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">System Accuracy Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              Evaluate automated system outputs against ground truth and expert assessments
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('component')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewMode === 'component'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Component View
            </button>
            <button
              onClick={() => setViewMode('paper')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewMode === 'paper'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileStack className="h-4 w-4" />
              Paper View
            </button>
          </div>
        </div>
      </Card>

      {/* Shared Evaluation Explanations */}
      <SharedEvaluationExplanations 
        expertiseMultiplier={averageExpertiseMultiplier}
      />

      {/* View Content */}
      {viewMode === 'component' ? (
        <Card className="overflow-hidden">
          {/* Summary Cards */}
          <div className="p-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <AccuracySummaryCard
                title="Metadata"
                icon={FileText}
                metrics={componentMetrics.metadata}
                color="blue"
                isActive={activeComponent === 'metadata'}
                description="Title, authors, DOI, venue extraction"
              />
              <AccuracySummaryCard
                title="Research Field"
                icon={Target}
                metrics={componentMetrics.researchField}
                color="green"
                isActive={activeComponent === 'researchField'}
                description="Field classification accuracy"
              />
              <AccuracySummaryCard
                title="Research Problem"
                icon={AlertCircle}
                metrics={componentMetrics.researchProblem}
                color="orange"
                isActive={activeComponent === 'researchProblem'}
                description="Problem identification accuracy"
              />
              <AccuracySummaryCard
                title="Template"
                icon={Grid}
                metrics={componentMetrics.template}
                color="purple"
                isActive={activeComponent === 'template'}
                description="Template selection/generation"
              />
              <AccuracySummaryCard
                title="Content"
                icon={Layers}
                metrics={componentMetrics.content}
                color="red"
                isActive={activeComponent === 'content'}
                description="Property extraction accuracy"
              />
            </div>
          </div>

          {/* Component Tabs */}
          <Tabs value={activeComponent} onValueChange={setActiveComponent} className="p-6 pt-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="researchField">Field</TabsTrigger>
              <TabsTrigger value="researchProblem">Problem</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <TabsContent value="metadata">
              <MetadataAccuracyView 
                componentData={components.metadata}
                papers={transformedPapers}
                fieldKeyMapping={METADATA_FIELD_KEYS}
              />
            </TabsContent>

            <TabsContent value="researchField">
              {/* Debug: Check what data is being passed */}
              {console.log('🔍 ResearchField componentData:', components.researchField)}
              {console.log('🔍 TransformedPapers count:', transformedPapers.length)}
              <ResearchFieldAccuracyView 
                componentData={components.researchField}
                papers={transformedPapers}
              />
            </TabsContent>

            <TabsContent value="researchProblem">
              <ResearchProblemAccuracyView 
                aggregatedData={aggregatedData}
                componentData={components.researchProblem}
                papers={transformedPapers}
              />
            </TabsContent>

            <TabsContent value="template">
              <TemplateAccuracyView 
                aggregatedData={aggregatedData}
                componentData={components.template}
                papers={transformedPapers}
              />
            </TabsContent>

            <TabsContent value="content">
              <ContentAccuracyView 
                aggregatedData={aggregatedData}
                componentData={components.content}
                papers={transformedPapers}
              />
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <PaperView
          papers={transformedPapers}
          componentDetailViews={componentDetailViews}
          viewType="accuracy"
        />
      )}
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS - READ FROM SERVICE, NO CALCULATIONS
// ============================================

/**
 * READ component metrics with fallback for different key formats
 * 
 * Tries multiple key variants (camelCase and snake_case) for compatibility
 * between different parts of the system.
 * 
 * @param {Array} papers - Array of aggregated paper objects
 * @param {Array} keyVariants - Array of possible key names to try
 * @returns {Object} - { score, userRating, finalScore, std, count }
 */
function readComponentMetricsWithFallback(papers, keyVariants) {
  if (!papers || papers.length === 0 || !keyVariants || keyVariants.length === 0) {
    return { score: 0, userRating: 0, finalScore: 0, std: 0, count: 0 };
  }

  const accuracyScores = [];
  const userRatings = [];
  const finalScores = [];

  papers.forEach(paper => {
    // Try each key variant until one works
    let comp = null;
    for (const key of keyVariants) {
      if (paper[key]) {
        comp = paper[key];
        break;
      }
    }
    
    if (!comp) return;

    // READ accuracy score (same path as OverviewMetrics)
    const accScore = comp.accuracyScores?.mean ?? comp.scores?.mean;
    if (accScore !== undefined && !isNaN(accScore)) {
      accuracyScores.push(accScore);
    }

    // READ user rating
    const userRating = comp.userRatings?.mean;
    if (userRating !== undefined && !isNaN(userRating)) {
      userRatings.push(userRating);
    }

    // Calculate final score from formula
    // Final Score = (Automated × 60%) + (User Rating × 40%)
    if (accScore !== undefined && !isNaN(accScore)) {
      const ur = (userRating !== undefined && !isNaN(userRating)) ? userRating : accScore;
      const final = accScore * 0.6 + ur * 0.4;
      finalScores.push(final);
    }
  });

  // Calculate simple means
  const calcMean = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const calcStd = (arr, mean) => {
    if (arr.length <= 1) return 0;
    return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length);
  };

  const avgAccuracy = calcMean(accuracyScores);
  const avgUserRating = calcMean(userRatings);
  const avgFinal = calcMean(finalScores);
  const std = calcStd(finalScores, avgFinal);

  return {
    score: avgAccuracy,
    userRating: avgUserRating,
    finalScore: avgFinal,
    std: std,
    count: accuracyScores.length
  };
}

/**
 * READ component metrics from aggregated papers
 * 
 * This function READS pre-calculated values from the aggregation service.
 * NO calculations are performed here.
 * 
 * Data paths (consistent with OverviewMetrics):
 * - paper[componentKey].accuracyScores.mean -> Automated accuracy score
 * - paper[componentKey].scores.mean -> Fallback for accuracy
 * - paper[componentKey].userRatings.mean -> User rating (1-5 normalized to 0-1)
 * 
 * @param {Array} papers - Array of aggregated paper objects
 * @param {string} componentKey - Component key (e.g., 'metadata', 'research_field')
 * @returns {Object} - { score, userRating, finalScore, std, count }
 */
function readComponentMetrics(papers, componentKey) {
  if (!papers || papers.length === 0) {
    return { score: 0, userRating: 0, finalScore: 0, std: 0, count: 0 };
  }

  const accuracyScores = [];
  const userRatings = [];
  const finalScores = [];

  papers.forEach(paper => {
    const comp = paper[componentKey];
    if (!comp) return;

    // READ accuracy score (same path as OverviewMetrics)
    const accScore = comp.accuracyScores?.mean ?? comp.scores?.mean;
    if (accScore !== undefined && !isNaN(accScore)) {
      accuracyScores.push(accScore);
    }

    // READ user rating
    const userRating = comp.userRatings?.mean;
    if (userRating !== undefined && !isNaN(userRating)) {
      userRatings.push(userRating);
    }

    // READ final score if available, or calculate from formula
    // Final Score = (Automated × 60%) + (User Rating × 40%)
    if (accScore !== undefined && !isNaN(accScore)) {
      const ur = (userRating !== undefined && !isNaN(userRating)) ? userRating : accScore;
      const final = accScore * 0.6 + ur * 0.4;
      finalScores.push(final);
    }
  });

  // Calculate simple means (this is aggregation of already-aggregated values, not raw calculation)
  const calcMean = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const calcStd = (arr, mean) => {
    if (arr.length <= 1) return 0;
    return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length);
  };

  const avgAccuracy = calcMean(accuracyScores);
  const avgUserRating = calcMean(userRatings);
  const avgFinal = calcMean(finalScores);
  const std = calcStd(finalScores, avgFinal);

  return {
    score: avgAccuracy,
    userRating: avgUserRating,
    finalScore: avgFinal,
    std: std,
    count: accuracyScores.length
  };
}

/**
 * Create empty component metrics structure
 */
function createEmptyComponentMetrics() {
  const empty = { score: 0, userRating: 0, finalScore: 0, std: 0, count: 0 };
  return {
    metadata: { ...empty },
    researchField: { ...empty },
    researchProblem: { ...empty },
    template: { ...empty },
    content: { ...empty }
  };
}

/**
 * Create empty system data structure for fallback
 */
function createEmptySystemData(token) {
  return {
    token: token,
    metadata: {},
    researchFields: { fields: [] },
    researchProblems: {
      llm_problem: null,
      orkg_problems: [],
      selectedProblem: null,
      metadata: {},
      processing_info: {}
    },
    templates: {},
    paperContent: {
      properties: [],
      sectionsAnalyzed: []
    }
  };
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * AccuracySummaryCard - Displays component accuracy summary
 * 
 * DISPLAYS (from service data):
 * - Final Score (Automated × 60% + User Rating × 40%)
 * - Evaluation count
 * - Standard deviation
 * - Status indicator (green/yellow/red)
 */
const AccuracySummaryCard = ({ title, icon: Icon, metrics, color, isActive, description }) => {
  if (!metrics || metrics.count === 0) {
    return (
      <Card className="p-4 opacity-50">
        <div className="flex items-center justify-between mb-3">
          <Icon className={`h-5 w-5 text-${color}-500`} />
          <span className="text-xs text-gray-500">No Data</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <p className="text-2xl font-bold text-gray-400 mt-2">N/A</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </Card>
    );
  }

  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200'
  };

  const borderClass = isActive ? 'border-2' : 'border';
  
  // Display the final score (combined automated + user rating)
  const displayScore = metrics.finalScore || metrics.score || 0;

  return (
    <Card className={`p-4 ${colorClasses[color] || 'bg-gray-50'} ${borderClass}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`h-5 w-5 ${colorClasses[color]?.split(' ')[0] || 'text-gray-600'}`} />
        <StatusIndicator score={displayScore} />
      </div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <p className={`text-2xl font-bold mt-2 ${colorClasses[color]?.split(' ')[0] || 'text-gray-600'}`}>
        {(displayScore * 100).toFixed(1)}%
      </p>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{metrics.count} evaluations</span>
          <span>±{(metrics.std * 100).toFixed(1)}%</span>
        </div>
        {/* Show breakdown on hover or always */}
        <div className="text-xs text-gray-500">
          <span>Auto: {(metrics.score * 100).toFixed(0)}%</span>
          {metrics.userRating > 0 && (
            <span className="ml-2">User: {(metrics.userRating * 100).toFixed(0)}%</span>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-400 mt-2 border-t pt-2">{description}</p>
      )}
    </Card>
  );
};

/**
 * StatusIndicator - Visual indicator based on score
 * 
 * Thresholds:
 * - ≥80%: Green (Excellent)
 * - ≥60%: Yellow (Good)
 * - <60%: Red (Needs Improvement)
 */
const StatusIndicator = ({ score }) => {
  if (score >= 0.8) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  } else if (score >= 0.6) {
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  } else {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
};

export default SystemAccuracyAnalysis;