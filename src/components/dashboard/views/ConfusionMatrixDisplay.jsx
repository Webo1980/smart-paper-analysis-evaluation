// src/components/dashboard/ConfusionMatrixDisplay.jsx
// FIXED VERSION v14 - With Component-Specific Cell Descriptions
// - Confusion Matrix: 15 unique papers (classification is paper-level)
// - Hybrid Scores: 17 evaluations (user ratings vary by evaluator)
// - Research Findings: Component-specific analysis cards
// - Content: Uses Precision-Recall-F1 methodology (no GT, LLM-extracted)
// - NEW: Component-specific cell descriptions with hover tooltips
// - FIX: Tooltip positioning - left column shows LEFT, right column shows RIGHT

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Info, Download, Maximize2, 
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  XCircle, Target, HelpCircle, Cpu, Database, Award, Star,
  TreeDeciduous, Table, Users, FileText, BookOpen, ChevronDown, ChevronUp,
  Layers, FileSearch
} from 'lucide-react';

// Research field components
import ResearchFieldTree from '../../evaluation/research-field/components/ResearchFieldTree';
import ResearchFieldPredictionsTable from '../../evaluation/research-field/components/ResearchFieldPredictionsTable';

// Field hierarchy service
import { 
  loadResearchFieldHierarchy, 
  getResearchFieldHierarchy 
} from '../../evaluation/research-field/services/fieldHierarchyService';

// ============================================
// COMPONENT-SPECIFIC CELL DESCRIPTIONS
// ============================================
const getCellDescriptions = (componentKey) => {
  const descriptions = {
    metadata: {
      tp: {
        title: 'Correct Extraction',
        description: 'ORKG has metadata AND system extracted matching title/authors/venue/DOI',
        example: 'GT: "Deep Learning for NLP" → System: "Deep Learning for NLP"'
      },
      fn: {
        title: 'Missed Extraction',
        description: 'ORKG has metadata BUT system failed to extract or returned empty/null',
        example: 'GT: "Paper Title" → System: null or empty'
      },
      fp: {
        title: 'Incorrect Extraction',
        description: 'System extracted metadata that differs from ORKG ground truth',
        example: 'GT: "ML in Healthcare" → System: "Machine Learning Healthcare"'
      },
      tn: {
        title: 'Correct Empty',
        description: 'No ORKG metadata AND system correctly returned no metadata',
        example: 'GT: null → System: null (both empty)'
      }
    },
    research_field: {
      tp: {
        title: 'Correct Classification',
        description: 'System\'s top prediction exactly matches ORKG ground truth field',
        example: 'GT: "Natural Language Processing" → System Top-1: "Natural Language Processing"'
      },
      fn: {
        title: 'Missed Classification',
        description: 'ORKG has field label BUT system did not predict any field or confidence too low',
        example: 'GT: "Computer Vision" → System: No prediction or <50% confidence'
      },
      fp: {
        title: 'Wrong Classification',
        description: 'System predicted a field BUT it differs from ORKG ground truth',
        example: 'GT: "Machine Learning" → System: "Data Mining" (different field)'
      },
      tn: {
        title: 'Correct No-Field',
        description: 'No ORKG field label AND system correctly made no confident prediction',
        example: 'GT: null → System: null or low confidence predictions'
      }
    },
    research_problem: {
      tp: {
        title: 'Correct Problem Match',
        description: 'Selected research problem exactly matches ORKG ground truth problem',
        example: 'GT: "Image Classification" → System: "Image Classification"'
      },
      fn: {
        title: 'Missed Problem',
        description: 'ORKG has research problem BUT system did not select any or returned empty',
        example: 'GT: "Sentiment Analysis" → System: No problem selected'
      },
      fp: {
        title: 'Wrong Problem',
        description: 'System selected a problem BUT it differs from ORKG ground truth',
        example: 'GT: "Object Detection" → System: "Scene Recognition" (LLM-generated or wrong ORKG match)'
      },
      tn: {
        title: 'Correct No-Problem',
        description: 'No ORKG problem exists AND system correctly returned no problem',
        example: 'GT: null → System: null (paper has no ORKG problem definition)'
      }
    },
    template: {
      tp: {
        title: 'Correct Template',
        description: 'Selected template ID/name matches ORKG ground truth template',
        example: 'GT: "Contribution" (R603969) → System: "Contribution" (R603969)'
      },
      fn: {
        title: 'Missed Template',
        description: 'ORKG has template BUT system did not select any template',
        example: 'GT: "Method" template → System: No template selected'
      },
      fp: {
        title: 'Wrong Template',
        description: 'System selected a template BUT it differs from ORKG ground truth',
        example: 'GT: "Dataset" template → System: "Algorithm" template (or LLM-generated)'
      },
      tn: {
        title: 'Correct No-Template',
        description: 'No ORKG template exists AND system correctly used LLM generation',
        example: 'GT: null → System: LLM template (appropriate for papers without ORKG templates)'
      }
    },
    content: {
      tp: {
        title: 'N/A for Content',
        description: 'Content extraction uses Precision/Recall/F1 methodology without ground truth',
        example: 'No traditional confusion matrix - see P/R/F1 scores'
      },
      fn: {
        title: 'N/A for Content',
        description: 'Content extraction uses Precision/Recall/F1 methodology without ground truth',
        example: 'No traditional confusion matrix - see P/R/F1 scores'
      },
      fp: {
        title: 'N/A for Content',
        description: 'Content extraction uses Precision/Recall/F1 methodology without ground truth',
        example: 'No traditional confusion matrix - see P/R/F1 scores'
      },
      tn: {
        title: 'N/A for Content',
        description: 'Content extraction uses Precision/Recall/F1 methodology without ground truth',
        example: 'No traditional confusion matrix - see P/R/F1 scores'
      }
    }
  };
  
  return descriptions[componentKey] || descriptions.metadata;
};

// ============================================
// RESEARCH FINDINGS COMPONENT (Collapsible)
// ============================================
const ResearchFindings = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between hover:from-blue-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
      </button>
      {isOpen && <div className="p-4 bg-white border-t border-blue-100">{children}</div>}
    </div>
  );
};

/**
 * ConfusionMatrixDisplay (V14 - With Component-Specific Cell Descriptions)
 */
const ConfusionMatrixDisplay = ({ 
  data, 
  aggregatedData, 
  integratedData 
}) => {
  const [selectedComponent, setSelectedComponent] = useState('research_field');
  const [showDetails, setShowDetails] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [hoverCell, setHoverCell] = useState(null);
  const [selectedPaperForTree, setSelectedPaperForTree] = useState(null);
  const [showFieldTree, setShowFieldTree] = useState(false);
  const [showPredictionsTable, setShowPredictionsTable] = useState(false);
  const [showCellDescriptions, setShowCellDescriptions] = useState(true);
  
  // Hierarchy state
  const [hierarchyData, setHierarchyData] = useState(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyError, setHierarchyError] = useState(null);

  // Components array - now includes Content
  const components = [
    { id: 'metadata', label: 'Metadata', color: '#3B82F6', description: 'Title, authors, DOI, venue, year' },
    { id: 'research_field', label: 'Research Field', color: '#10B981', description: 'Field classification accuracy' },
    { id: 'research_problem', label: 'Research Problem', color: '#F59E0B', description: 'Problem identification accuracy' },
    { id: 'template', label: 'Template', color: '#8B5CF6', description: 'Template selection accuracy' },
    { id: 'content', label: 'Content', color: '#EC4899', description: 'Property extraction accuracy (Precision/Recall/F1)' }
  ];

  const currentComponent = components.find(c => c.id === selectedComponent);
  const cellDescriptions = getCellDescriptions(selectedComponent);

  // Load hierarchy data for research field
  useEffect(() => {
    const loadHierarchy = async () => {
      if (selectedComponent !== 'research_field') return;
      
      const existingHierarchy = getResearchFieldHierarchy();
      if (existingHierarchy) {
        setHierarchyData(existingHierarchy);
        return;
      }
      
      setHierarchyLoading(true);
      setHierarchyError(null);
      
      try {
        const hierarchy = await loadResearchFieldHierarchy();
        setHierarchyData(hierarchy);
        console.log('✅ Hierarchy loaded:', hierarchy?.children?.length, 'top-level fields');
      } catch (error) {
        console.error('❌ Hierarchy load error:', error);
        setHierarchyError(error.message);
      } finally {
        setHierarchyLoading(false);
      }
    };
    
    loadHierarchy();
  }, [selectedComponent]);

  /**
   * HYBRID APPROACH: Separate unique papers from all evaluations
   */
  const analysisData = useMemo(() => {
    if (!integratedData?.papers || !Array.isArray(integratedData.papers) || integratedData.papers.length === 0) {
      console.log('⚠️ No papers to analyze');
      return null;
    }

    const allEvaluations = integratedData.papers;
    const totalEvaluations = allEvaluations.length;
    const componentKey = selectedComponent;
    
    // Get aggregated component data
    const aggregatedPapers = aggregatedData?.papers || {};

    // Deduplicate papers by DOI for confusion matrix
    const uniquePapersMap = new Map();
    allEvaluations.forEach(paper => {
      const key = paper.doi || paper.token;
      if (key && !uniquePapersMap.has(key)) {
        uniquePapersMap.set(key, paper);
      }
    });
    const uniquePapers = Array.from(uniquePapersMap.values());
    const totalUniquePapers = uniquePapers.length;

    // Build paper breakdown from UNIQUE papers (for matrix)
    const paperBreakdown = buildPaperBreakdown(uniquePapers, componentKey, confidenceThreshold);
    
    // Build confusion matrix from unique papers
    const matrix = buildMatrixFromBreakdown(paperBreakdown);
    
    // Calculate coverage from unique papers
    const coverage = calculateCoverage(uniquePapers, componentKey, paperBreakdown);
    coverage.totalEvaluations = totalEvaluations;
    
    // For content, we don't have GT - use different threshold
    const hasEnoughGT = componentKey === 'content' 
      ? false  // Content never has traditional GT
      : coverage.withGroundTruth >= 3;
    
    // READ metrics from aggregated service
    const metrics = readMetricsFromService(aggregatedPapers, componentKey);
    
    // Extract scoring stats from ALL evaluations
    const scoringStats = extractScoringStats(aggregatedPapers, componentKey);
    scoringStats.totalEvaluations = totalEvaluations;
    scoringStats.totalUniquePapers = totalUniquePapers;
    
    // Extract source stats from unique papers
    const sourceStats = extractSourceStats(uniquePapers, componentKey);
    
    // Extract position stats from unique papers
    const positionStats = extractPositionStats(uniquePapers, componentKey);
    
    // Extract content-specific stats
    const contentStats = componentKey === 'content' 
      ? extractContentStats(uniquePapers, aggregatedPapers)
      : null;

    console.log(`📊 Analysis data for ${componentKey}:`, {
      totalEvaluations,
      uniquePapers: totalUniquePapers,
      breakdown: paperBreakdown.length,
      matrix,
      hasGT: coverage.withGroundTruth,
      hasEnoughGT,
      metrics,
      contentStats
    });

    return { 
      matrix, 
      metrics, 
      paperBreakdown, 
      coverage, 
      sourceStats, 
      positionStats, 
      scoringStats,
      contentStats,
      hasEnoughGT,
      totalEvaluations,
      totalUniquePapers
    };
  }, [integratedData, aggregatedData, selectedComponent, confidenceThreshold]);

  // Get selected paper data
  const selectedPaperData = useMemo(() => {
    if (!selectedPaperForTree || !integratedData?.papers) return null;
    return integratedData.papers.find(p => p.doi === selectedPaperForTree);
  }, [selectedPaperForTree, integratedData]);

  // Prepare tree view data
  const treeViewData = useMemo(() => {
    if (!selectedPaperData) return null;
    
    const evaluation = selectedPaperData.evaluation || selectedPaperData.userEvaluations?.[0];
    const evalOverall = evaluation?.evaluationMetrics?.overall || evaluation?.overall;
    const researchFieldData = evalOverall?.research_field;
    
    const predictions = selectedPaperData.systemData?.researchFields?.fields || [];
    const groundTruth = selectedPaperData.groundTruth?.research_field_name;
    
    let userSelectedField = researchFieldData?.selectedField?.name
      || selectedPaperData.systemData?.researchFields?.selectedField?.name
      || (predictions.length > 0 ? predictions[0].name : null);
    
    return {
      groundTruth,
      prediction: userSelectedField,
      hierarchyAnalysis: hierarchyData,
      predictedValues: predictions.map(p => ({ name: p.name, score: p.score })),
      selectedField: userSelectedField
    };
  }, [selectedPaperData, hierarchyData]);

  const handlePaperSelect = useCallback((doi) => {
    setSelectedPaperForTree(doi);
  }, []);

  const handleFieldSelect = useCallback((fieldName) => {
    console.log('Field selected:', fieldName);
  }, []);

  // Early returns for missing data
  if (!integratedData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Confusion matrix requires integrated data. Please ensure data is loaded.
        </AlertDescription>
      </Alert>
    );
  }

  if (!analysisData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No analysis data available for {currentComponent?.label}. 
          Input papers: {integratedData?.papers?.length || 0}
        </AlertDescription>
      </Alert>
    );
  }

  const { 
    matrix, metrics, paperBreakdown, coverage, sourceStats, positionStats, 
    scoringStats, contentStats, hasEnoughGT, totalEvaluations, totalUniquePapers 
  } = analysisData;
  const total = matrix.tp + matrix.tn + matrix.fp + matrix.fn;
  
  const hasEnoughGTForTraditionalMetrics = hasEnoughGT;

  const getCellInfo = (type) => {
    const configs = {
      tp: { label: 'Correct Match', icon: CheckCircle2, bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', hoverBg: 'hover:bg-green-200' },
      fp: { label: 'Mismatch', icon: XCircle, bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', hoverBg: 'hover:bg-red-200' },
      fn: { label: 'Missed', icon: AlertCircle, bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', hoverBg: 'hover:bg-orange-200' },
      tn: { label: 'Correct Empty', icon: Target, bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', hoverBg: 'hover:bg-blue-200' }
    };
    return configs[type];
  };

  // ============================================
  // MATRIX CELL WITH COMPONENT-SPECIFIC TOOLTIP
  // FIX: Left column (TP, FP) → tooltip LEFT, Right column (FN, TN) → tooltip RIGHT
  // ============================================
  const MatrixCell = ({ type, value }) => {
    const info = getCellInfo(type);
    const Icon = info.icon;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    const isHovered = hoverCell === type;
    const cellDesc = cellDescriptions[type];
    
    // TOOLTIP POSITIONING - explicit per cell type
    // Matrix layout: [TP green][FN orange] / [FP red][TN blue]
    // Green (TP, top-left) → tooltip shows to LEFT of cell
    // Blue (TN, bottom-right) → tooltip shows to RIGHT of cell
    // Red (FP, bottom-left) → tooltip shows to LEFT of cell  
    // Orange (FN, top-right) → tooltip shows to RIGHT of cell
    // CSS: right-full = tooltip appears LEFT, left-full = tooltip appears RIGHT
    const getTooltipPosition = (cellType) => {
      switch(cellType) {
        case 'tp': return 'right-full mr-3'; // GREEN → LEFT
        case 'fp': return 'right-full mr-3'; // RED → LEFT
        case 'fn': return 'left-full ml-3';  // ORANGE → RIGHT
        case 'tn': return 'left-full ml-3';  // BLUE → RIGHT
        default: return 'left-full ml-3';
      }
    };
    const tooltipPosition = getTooltipPosition(type);

    return (
      <div className="relative">
        {/* Main Cell */}
        <div
          className={`
            relative flex flex-col items-center justify-center p-4
            rounded-xl border-2 cursor-pointer transition-all duration-200
            ${info.bg} ${info.border}
            ${isHovered ? 'scale-105 shadow-xl z-10 ring-2 ring-offset-2' : 'hover:scale-102 hover:shadow-md'}
            ${type === 'tp' ? 'ring-green-400' : type === 'fp' ? 'ring-red-400' : type === 'fn' ? 'ring-orange-400' : 'ring-blue-400'}
          `}
          onMouseEnter={() => setHoverCell(type)}
          onMouseLeave={() => setHoverCell(null)}
          style={{ minHeight: '160px' }}
        >
          <Icon className={`h-6 w-6 mb-1 ${info.text}`} />
          <div className={`text-3xl font-bold ${info.text}`}>{value}</div>
          <div className={`text-base font-medium ${info.text}`}>{percentage}%</div>
          <div className={`text-xs mt-1 ${info.text} font-semibold text-center`}>{info.label}</div>
          
          {/* Component-specific title inside cell */}
          <div className={`text-xs mt-2 ${info.text} opacity-80 text-center font-medium px-2 py-1 bg-white/50 rounded`}>
            {cellDesc.title}
          </div>
        </div>

        {/* Hover Tooltip with Component-Specific Description */}
        {isHovered && showCellDescriptions && (
          <div className={`
            absolute z-20 w-80 p-4 rounded-lg shadow-xl border-2
            ${info.bg} ${info.border}
            ${tooltipPosition}
            top-1/2 transform -translate-y-1/2
          `}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-5 w-5 ${info.text}`} />
              <span className={`font-bold ${info.text} text-sm`}>{cellDesc.title}</span>
              <Badge className={`ml-auto ${info.bg} ${info.text} border ${info.border}`}>
                {value} ({percentage}%)
              </Badge>
            </div>
            <p className={`text-sm ${info.text} mb-3`}>
              {cellDesc.description}
            </p>
            <div className={`text-xs ${info.text} opacity-90 bg-white/60 p-2 rounded border ${info.border}`}>
              <strong>Example:</strong><br/>
              <span className="italic">{cellDesc.example}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // COMPACT DESCRIPTION CARDS (Always Visible)
  // ============================================
  const CellDescriptionCard = ({ type }) => {
    const info = getCellInfo(type);
    const Icon = info.icon;
    const cellDesc = cellDescriptions[type];
    const value = matrix[type];
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

    return (
      <div className={`p-3 rounded-lg border ${info.bg} ${info.border}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${info.text}`} />
          <span className={`font-bold ${info.text} text-sm`}>{info.label}</span>
          <Badge className={`ml-auto ${info.bg} ${info.text} border ${info.border}`}>
            {value} ({percentage}%)
          </Badge>
        </div>
        <p className={`text-xs ${info.text} mb-1`}>
          <strong>{cellDesc.title}:</strong> {cellDesc.description}
        </p>
        <div className={`text-xs ${info.text} opacity-70 italic`}>
          Ex: {cellDesc.example}
        </div>
      </div>
    );
  };

  const formatPercent = (value) => `${((value || 0) * 100).toFixed(1)}%`;

  const handleExport = () => {
    const exportData = { 
      component: selectedComponent, 
      confidenceThreshold, 
      matrix, 
      metrics, 
      paperBreakdown, 
      coverage, 
      sourceStats, 
      positionStats, 
      scoringStats,
      contentStats,
      counts: {
        totalEvaluations,
        totalUniquePapers,
        note: 'Matrix based on unique papers; scores include all evaluations'
      },
      timestamp: new Date().toISOString() 
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confusion_matrix_${selectedComponent}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const currentComponentIndex = components.findIndex(c => c.id === selectedComponent);

  // ============================================
  // RESEARCH FINDINGS CONTENT BY COMPONENT
  // ============================================
  const renderResearchFindings = () => {
    const matrixAccuracy = total > 0 ? ((matrix.tp + matrix.tn) / total) : 0;
    const matrixErrorRate = total > 0 ? ((matrix.fp + matrix.fn) / total) : 0;
    
    switch (selectedComponent) {
      case 'metadata':
        return (
          <ResearchFindings title="📊 Research Findings: Metadata Extraction Analysis">
            <div className="space-y-4">
              {/* Key Metrics Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Metrics Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Accuracy</div>
                    <div className="font-bold text-blue-700">{formatPercent(metrics.accuracy)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Precision</div>
                    <div className="font-bold text-green-700">{formatPercent(metrics.precision)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Recall</div>
                    <div className="font-bold text-orange-700">{formatPercent(metrics.recall)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">F1 Score</div>
                    <div className="font-bold text-purple-700">{formatPercent(metrics.f1Score)}</div>
                  </div>
                </div>
              </div>

              {/* Analysis Points */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-2">Analysis</h4>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Extraction Coverage:</strong> {matrix.tp + matrix.fp} of {totalUniquePapers} papers 
                    ({((matrix.tp + matrix.fp) / totalUniquePapers * 100).toFixed(1)}%) had metadata successfully extracted.
                  </li>
                  <li>
                    <strong>Ground Truth Alignment:</strong> {matrix.tp} papers ({((matrix.tp / total) * 100).toFixed(1)}%) 
                    showed exact match with ORKG ground truth for bibliographic fields.
                  </li>
                  <li>
                    <strong>Final Score:</strong> {formatPercent(scoringStats?.overallScore)} combining 
                    automated accuracy ({formatPercent(scoringStats?.gtBasedScore)}) with 
                    user ratings ({formatPercent(scoringStats?.userRatingScore)}).
                  </li>
                  {metrics.accuracy >= 0.8 && (
                    <li className="text-green-700">
                      <strong>High Performance:</strong> Metadata extraction demonstrates strong accuracy (≥80%), 
                      indicating reliable bibliographic information retrieval.
                    </li>
                  )}
                </ul>
              </div>

              {/* System Interpretation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
                <p className="text-sm text-gray-700 italic">
                  "Metadata extraction analysis across {totalUniquePapers} papers ({totalEvaluations} evaluations) achieved 
                  {formatPercent(metrics.accuracy)} accuracy using Levenshtein distance and token-based similarity metrics. 
                  The confusion matrix revealed {matrix.tp} correct matches ({((matrix.tp / total) * 100).toFixed(1)}%), 
                  {matrix.fp} mismatches ({((matrix.fp / total) * 100).toFixed(1)}%), and 
                  {matrix.fn} missed extractions ({((matrix.fn / total) * 100).toFixed(1)}%). 
                  The hybrid scoring approach combining automated metrics (60%) with expert ratings (40%) 
                  yielded a final score of {formatPercent(scoringStats?.overallScore)}, demonstrating 
                  {scoringStats?.overallScore >= 0.8 ? ' robust' : scoringStats?.overallScore >= 0.6 ? ' acceptable' : ' areas for improvement in'} 
                  metadata extraction capabilities."
                </p>
              </div>

              {/* Methodology Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <strong>Methodology:</strong> Metadata accuracy computed using character-level Levenshtein distance 
                    (normalized to 0-1 similarity) and token-based precision/recall for title, authors, venue, and DOI fields.
                    Final scores combine automated metrics with expert evaluation using a 60/40 weighting formula.
                  </div>
                </div>
              </div>
            </div>
          </ResearchFindings>
        );

      case 'research_field':
        const top1Rate = positionStats ? (positionStats.top1 / totalUniquePapers * 100).toFixed(1) : 0;
        const top3Rate = positionStats ? (positionStats.top3 / totalUniquePapers * 100).toFixed(1) : 0;
        const top5Rate = positionStats ? (positionStats.top5 / totalUniquePapers * 100).toFixed(1) : 0;
        
        return (
          <ResearchFindings title="📊 Research Findings: Research Field Classification Analysis">
            <div className="space-y-4">
              {/* Key Metrics Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Metrics Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Top-1 Accuracy</div>
                    <div className="font-bold text-green-700">{top1Rate}%</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Top-3 Accuracy</div>
                    <div className="font-bold text-green-600">{top3Rate}%</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Top-5 Accuracy</div>
                    <div className="font-bold text-yellow-600">{top5Rate}%</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Final Score</div>
                    <div className="font-bold text-purple-700">{formatPercent(scoringStats?.overallScore)}</div>
                  </div>
                </div>
              </div>

              {/* Position Distribution */}
              {positionStats && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Position Distribution Analysis</h4>
                  <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                    <li>
                      <strong>Exact Match (Top-1):</strong> {positionStats.top1} papers ({top1Rate}%) had the 
                      ground truth field as the system's top prediction, receiving 100% position score.
                    </li>
                    <li>
                      <strong>Close Match (Top-3):</strong> {positionStats.top3} papers ({top3Rate}%) included 
                      the correct field within top 3 predictions (80% score for positions 2-3).
                    </li>
                    <li>
                      <strong>Acceptable Match (Top-5):</strong> {positionStats.top5} papers ({top5Rate}%) had 
                      the correct field within top 5 predictions (60% score for positions 4-5).
                    </li>
                    <li>
                      <strong>Outside Top-5:</strong> {positionStats.outside} papers ({((positionStats.outside / totalUniquePapers) * 100).toFixed(1)}%) 
                      did not have the ground truth in top 5, falling back to user rating for scoring.
                    </li>
                  </ul>
                </div>
              )}

              {/* Confusion Matrix Insights */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Classification Performance</h4>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Matrix Accuracy:</strong> {formatPercent(matrixAccuracy)} based on exact string matching 
                    ({matrix.tp} TP + {matrix.tn} TN out of {total} papers).
                  </li>
                  <li>
                    <strong>Error Analysis:</strong> {matrix.fp} mismatches (predicted wrong field) and 
                    {matrix.fn} missed (no prediction when GT exists).
                  </li>
                  <li>
                    <strong>GT Coverage:</strong> {coverage.withGroundTruth} of {totalUniquePapers} papers 
                    ({((coverage.withGroundTruth / totalUniquePapers) * 100).toFixed(1)}%) have ORKG ground truth for research field.
                  </li>
                </ul>
              </div>

              {/* System Interpretation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
                <p className="text-sm text-gray-700 italic">
                  "Research field classification evaluation across {totalUniquePapers} papers ({totalEvaluations} evaluations) 
                  demonstrated {top1Rate}% top-1 accuracy and {top5Rate}% top-5 accuracy using position-based scoring 
                  against the ORKG taxonomy. The system achieved {positionStats?.top1 || 0} exact matches where the 
                  ground truth field ranked first among predictions. Position-weighted scoring (100% for top-1, 
                  80% for top-3, 60% for top-5) combined with expert ratings produced a final score of 
                  {formatPercent(scoringStats?.overallScore)}. 
                  {positionStats && positionStats.top3 > positionStats.top1 && 
                    ` Notably, ${positionStats.top3 - positionStats.top1} additional papers had correct fields in positions 2-3, 
                    suggesting semantic proximity in the field taxonomy.`}
                  These results validate the effectiveness of combining vector similarity-based field detection 
                  with the hierarchical ORKG research field structure."
                </p>
              </div>

              {/* Methodology Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <strong>Methodology:</strong> Research field accuracy uses position-based scoring comparing 
                    system predictions against ORKG ground truth. Scores: Top-1 = 100%, Top-3 = 80%, Top-5 = 60%, 
                    Outside = User Rating. Final score combines position score (60%) with expert rating (40%).
                  </div>
                </div>
              </div>
            </div>
          </ResearchFindings>
        );

      case 'research_problem':
        const orkgCount = sourceStats?.orkg || 0;
        const llmCount = sourceStats?.llm || 0;
        const orkgPct = totalUniquePapers > 0 ? (orkgCount / totalUniquePapers * 100).toFixed(1) : 0;
        const llmPct = totalUniquePapers > 0 ? (llmCount / totalUniquePapers * 100).toFixed(1) : 0;
        
        return (
          <ResearchFindings title="📊 Research Findings: Research Problem Identification Analysis">
            <div className="space-y-4">
              {/* Key Metrics Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Metrics Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Final Score</div>
                    <div className="font-bold text-blue-700">{formatPercent(scoringStats?.overallScore)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Automated</div>
                    <div className="font-bold text-green-700">{formatPercent(scoringStats?.gtBasedScore)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">User Rating</div>
                    <div className="font-bold text-purple-700">{formatPercent(scoringStats?.userRatingScore)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">F1 Score</div>
                    <div className="font-bold text-orange-700">{formatPercent(metrics.f1Score)}</div>
                  </div>
                </div>
              </div>

              {/* Source Distribution */}
              {sourceStats && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Source Distribution Analysis</h4>
                  <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                    <li>
                      <strong>ORKG-Sourced:</strong> {orkgCount} papers ({orkgPct}%) used research problems 
                      retrieved from ORKG, achieving {formatPercent(sourceStats.orkgAccuracy)} GT match accuracy.
                    </li>
                    <li>
                      <strong>LLM-Generated:</strong> {llmCount} papers ({llmPct}%) used LLM-generated 
                      research problems, with average user rating of {formatPercent(sourceStats.llmUserRating)} 
                      ({(sourceStats.llmUserRating * 5).toFixed(1)}/5).
                    </li>
                    <li>
                      <strong>Hybrid Approach Benefit:</strong> The system's fallback to LLM generation when 
                      ORKG data is unavailable ensures {totalUniquePapers} papers have research problem identification, 
                      demonstrating comprehensive coverage.
                    </li>
                  </ul>
                </div>
              )}

              {/* Confusion Matrix Insights */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Classification Performance</h4>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Correct Matches (TP):</strong> {matrix.tp} papers ({((matrix.tp / total) * 100).toFixed(1)}%) 
                    had exact match between system prediction and ground truth.
                  </li>
                  <li>
                    <strong>Mismatches (FP):</strong> {matrix.fp} papers ({((matrix.fp / total) * 100).toFixed(1)}%) 
                    had system predictions that differed from ground truth.
                  </li>
                  <li>
                    <strong>GT Coverage:</strong> {coverage.withGroundTruth} papers have ORKG ground truth; 
                    {coverage.withoutGroundTruth} rely solely on LLM generation with user validation.
                  </li>
                </ul>
              </div>

              {/* System Interpretation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
                <p className="text-sm text-gray-700 italic">
                  "Research problem identification across {totalUniquePapers} papers ({totalEvaluations} evaluations) 
                  achieved a final score of {formatPercent(scoringStats?.overallScore)} using a hybrid ORKG-LLM approach. 
                  {orkgCount > 0 && `ORKG-sourced problems (${orkgPct}% of papers) achieved ${formatPercent(sourceStats?.orkgAccuracy)} 
                  accuracy against ground truth. `}
                  {llmCount > 0 && `LLM-generated problems (${llmPct}% of papers) received ${formatPercent(sourceStats?.llmUserRating)} 
                  average user rating, indicating ${sourceStats?.llmUserRating >= 0.8 ? 'high' : sourceStats?.llmUserRating >= 0.6 ? 'acceptable' : 'moderate'} 
                  quality for generated content. `}
                  The confusion matrix revealed {matrix.tp} correct matches and {matrix.fp + matrix.fn} errors, 
                  demonstrating the value of combining curated knowledge graph data with generative AI capabilities 
                  for comprehensive research problem coverage."
                </p>
              </div>

              {/* Methodology Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <strong>Methodology:</strong> ORKG-sourced problems evaluated using token-based similarity 
                    (precision, recall, F1) against ground truth. LLM-generated problems evaluated via expert ratings 
                    on title clarity, description completeness, and relevance. Final score: (Automated × 60%) + (User × 40%).
                  </div>
                </div>
              </div>
            </div>
          </ResearchFindings>
        );

      case 'template':
        const tplOrkgCount = sourceStats?.orkg || 0;
        const tplLlmCount = sourceStats?.llm || 0;
        const tplOrkgPct = totalUniquePapers > 0 ? (tplOrkgCount / totalUniquePapers * 100).toFixed(1) : 0;
        const tplLlmPct = totalUniquePapers > 0 ? (tplLlmCount / totalUniquePapers * 100).toFixed(1) : 0;
        
        return (
          <ResearchFindings title="📊 Research Findings: Template Selection Analysis">
            <div className="space-y-4">
              {/* Key Metrics Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Metrics Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Final Score</div>
                    <div className="font-bold text-blue-700">{formatPercent(scoringStats?.overallScore)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Automated</div>
                    <div className="font-bold text-green-700">{formatPercent(scoringStats?.gtBasedScore)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">User Rating</div>
                    <div className="font-bold text-purple-700">{formatPercent(scoringStats?.userRatingScore)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Recall</div>
                    <div className="font-bold text-orange-700">{formatPercent(metrics.recall)}</div>
                  </div>
                </div>
              </div>

              {/* Source Distribution */}
              {sourceStats && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Source Distribution Analysis</h4>
                  <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                    <li>
                      <strong>ORKG Templates:</strong> {tplOrkgCount} papers ({tplOrkgPct}%) used existing 
                      ORKG templates, achieving {formatPercent(sourceStats.orkgAccuracy)} property coverage accuracy.
                    </li>
                    <li>
                      <strong>LLM-Generated Templates:</strong> {tplLlmCount} papers ({tplLlmPct}%) used 
                      LLM-generated templates, with average user rating of {formatPercent(sourceStats.llmUserRating)} 
                      ({(sourceStats.llmUserRating * 5).toFixed(1)}/5).
                    </li>
                    <li>
                      <strong>Template Coverage:</strong> The hybrid approach ensures all {totalUniquePapers} papers 
                      have template structures for knowledge extraction, either from ORKG or generated by LLM.
                    </li>
                  </ul>
                </div>
              )}

              {/* Property Analysis */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Template Quality Insights</h4>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Correct Matches (TP):</strong> {matrix.tp} papers ({((matrix.tp / total) * 100).toFixed(1)}%) 
                    selected the exact template matching ground truth.
                  </li>
                  <li>
                    <strong>Template Mismatches (FP):</strong> {matrix.fp} papers ({((matrix.fp / total) * 100).toFixed(1)}%) 
                    selected different templates than ground truth.
                  </li>
                  <li>
                    <strong>Recall Performance:</strong> {formatPercent(metrics.recall)} of expected template 
                    properties were successfully identified and utilized.
                  </li>
                </ul>
              </div>

              {/* System Interpretation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
                <p className="text-sm text-gray-700 italic">
                  "Template selection analysis across {totalUniquePapers} papers ({totalEvaluations} evaluations) 
                  achieved a final score of {formatPercent(scoringStats?.overallScore)}, combining automated 
                  property coverage metrics with expert evaluation. 
                  {tplOrkgCount > 0 && `ORKG-sourced templates (${tplOrkgPct}%) demonstrated ${formatPercent(sourceStats?.orkgAccuracy)} 
                  accuracy in matching reference templates. `}
                  {tplLlmCount > 0 && `LLM-generated templates (${tplLlmPct}%) provided flexible schema generation 
                  when no suitable ORKG template existed, receiving ${formatPercent(sourceStats?.llmUserRating)} user approval. `}
                  The system achieved {formatPercent(metrics.recall)} recall for template property identification, 
                  indicating {metrics.recall >= 0.8 ? 'comprehensive' : metrics.recall >= 0.6 ? 'substantial' : 'partial'} 
                  coverage of domain-relevant properties. This hybrid approach balances the precision of curated 
                  ORKG templates with the flexibility of LLM generation for novel research domains."
                </p>
              </div>

              {/* Methodology Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <strong>Methodology:</strong> ORKG templates evaluated using recall and F1-score measuring 
                    property coverage against reference templates. LLM templates evaluated for structural validity, 
                    property relevance, and alignment with paper content. Final score: (Automated × 60%) + (User × 40%).
                  </div>
                </div>
              </div>
            </div>
          </ResearchFindings>
        );

      // ============================================
      // CONTENT - NEW COMPONENT
      // ============================================
      case 'content':
        const avgPropertyCount = contentStats?.avgPropertyCount || 0;
        const totalProperties = contentStats?.totalProperties || 0;
        const avgConfidence = contentStats?.avgConfidence || 0;
        const withEvidence = contentStats?.withEvidence || 0;
        const withEvidencePct = totalUniquePapers > 0 ? (withEvidence / totalUniquePapers * 100).toFixed(1) : 0;
        
        return (
          <ResearchFindings title="📊 Research Findings: Content Property Extraction Analysis">
            <div className="space-y-4">
              {/* Key Metrics Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Key Metrics Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">F1 Score</div>
                    <div className="font-bold text-blue-700">{formatPercent(metrics.f1Score)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Precision</div>
                    <div className="font-bold text-green-700">{formatPercent(metrics.precision)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Recall</div>
                    <div className="font-bold text-orange-700">{formatPercent(metrics.recall)}</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Final Score</div>
                    <div className="font-bold text-purple-700">{formatPercent(scoringStats?.overallScore)}</div>
                  </div>
                </div>
              </div>

              {/* Extraction Statistics */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-2">Extraction Statistics</h4>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Properties Extracted:</strong> {totalProperties} total properties across {totalUniquePapers} papers 
                    (avg {avgPropertyCount.toFixed(1)} properties/paper).
                  </li>
                  <li>
                    <strong>Extraction Confidence:</strong> Average LLM confidence of {formatPercent(avgConfidence)} 
                    across all extracted property values.
                  </li>
                  <li>
                    <strong>Evidence Coverage:</strong> {withEvidence} papers ({withEvidencePct}%) include 
                    supporting textual evidence for extracted values.
                  </li>
                  <li>
                    <strong>Precision Performance:</strong> {formatPercent(metrics.precision)} of annotated properties 
                    are accurate according to template specifications.
                  </li>
                  <li>
                    <strong>Recall Performance:</strong> {formatPercent(metrics.recall)} of template properties 
                    were successfully annotated from paper content.
                  </li>
                </ul>
              </div>

              {/* Quality Breakdown */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Quality Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-800">Property Coverage</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: 30% — Measures if all template properties were annotated with correct data types.
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <FileSearch className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-800">Evidence Quality</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: 30% — Evaluates validity and relevance of cited evidence sections.
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-gray-800">Value Accuracy</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Weight: 40% — Assesses accuracy of annotated property values.
                    </div>
                  </div>
                </div>
              </div>

              {/* System Interpretation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
                <p className="text-sm text-gray-700 italic">
                  "Content property extraction across {totalUniquePapers} papers ({totalEvaluations} evaluations) 
                  achieved an F1 score of {formatPercent(metrics.f1Score)}, balancing precision ({formatPercent(metrics.precision)}) 
                  and recall ({formatPercent(metrics.recall)}). The LLM extracted {totalProperties} property values 
                  with an average confidence of {formatPercent(avgConfidence)}. 
                  {withEvidence > 0 && `${withEvidencePct}% of papers included supporting textual evidence, 
                  enhancing extraction traceability and verifiability. `}
                  Since content extraction operates without ORKG ground truth, accuracy relies on 
                  the precision-recall framework comparing system annotations against template property specifications. 
                  The hybrid scoring approach combining automated F1 metrics (60%) with expert ratings (40%) 
                  yielded a final score of {formatPercent(scoringStats?.overallScore)}, indicating 
                  {scoringStats?.overallScore >= 0.8 ? ' robust' : scoringStats?.overallScore >= 0.6 ? ' acceptable' : ' areas for improvement in'} 
                  content extraction capabilities."
                </p>
              </div>

              {/* Methodology Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <strong>Methodology:</strong> Content accuracy uses a precision-recall framework without ground truth. 
                    <strong> Precision</strong> = Matched Properties / Total Annotated Properties. 
                    <strong> Recall</strong> = Matched Properties / Total Template Properties. 
                    <strong> F1</strong> = 2 × (Precision × Recall) / (Precision + Recall). 
                    LLM confidence serves as an accuracy proxy when GT is unavailable. 
                    Evidence bonus (+0.1) rewards extractions with supporting text. 
                    Final score: (F1 × 60%) + (User Rating × 40%).
                  </div>
                </div>
              </div>
            </div>
          </ResearchFindings>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Confusion Matrix Analysis</h2>
          <p className="text-gray-600 mt-1">
            {totalEvaluations} Evaluations across {totalUniquePapers} unique papers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowCellDescriptions(!showCellDescriptions)} 
            variant="outline" 
            size="sm"
            className={showCellDescriptions ? 'bg-blue-50' : ''}
          >
            <Info className="h-4 w-4 mr-1" />
            {showCellDescriptions ? 'Hide' : 'Show'} Descriptions
          </Button>
          <Button onClick={() => setShowDetails(!showDetails)} variant="outline" size="sm">
            <Maximize2 className="h-4 w-4 mr-1" />
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hybrid Approach Notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-blue-50 border border-blue-200">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <div className="text-blue-800">
          <strong>Hybrid Approach:</strong> Confusion matrix uses <strong>{totalUniquePapers} unique papers</strong> (classification is paper-level). 
          Hybrid scores use <strong>all {totalEvaluations} evaluations</strong> (user ratings vary by evaluator).
          {selectedComponent === 'content' && (
            <span className="ml-1 text-pink-700">
              <strong>Content:</strong> No ORKG ground truth — uses Precision/Recall/F1 framework.
            </span>
          )}
        </div>
      </div>

      {/* Component Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => currentComponentIndex > 0 && setSelectedComponent(components[currentComponentIndex - 1].id)}
              variant="outline" size="sm" disabled={currentComponentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {components.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <Button
              onClick={() => currentComponentIndex < components.length - 1 && setSelectedComponent(components[currentComponentIndex + 1].id)}
              variant="outline" size="sm" disabled={currentComponentIndex === components.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {totalUniquePapers} Papers
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalEvaluations} Evals
            </Badge>
            {selectedComponent === 'content' ? (
              <Badge className="bg-pink-100 text-pink-800">
                No GT (P/R/F1)
              </Badge>
            ) : (
              <Badge className={hasEnoughGTForTraditionalMetrics ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                {hasEnoughGTForTraditionalMetrics 
                  ? `GT: ${coverage.withGroundTruth}/${totalUniquePapers}`
                  : `Score: ${formatPercent(scoringStats?.overallScore)}`}
              </Badge>
            )}
            {selectedComponent === 'research_field' && hierarchyData && (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Hierarchy
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Scoring Explanation - Component-specific */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm w-full">
            <strong className="text-blue-800">
              Accuracy Metrics (System vs. Ground Truth):
            </strong>
            
            <div className="mt-2 text-gray-700">
              {/* METADATA */}
              {selectedComponent === 'metadata' && (
                <div className="space-y-2">
                  <p>
                    <strong>Metadata Accuracy</strong> measures how well extracted bibliographic information 
                    (title, authors, venue, DOI) matches ground truth using three complementary measures:
                  </p>
                  <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                    <li><strong>Levenshtein distance:</strong> Character-level edit distance normalized to 0–1 similarity</li>
                    <li><strong>Token matching:</strong> Precision, Recall, F1-score for token overlap</li>
                    <li><strong>Special character matching:</strong> Preservation of Greek letters, mathematical symbols</li>
                  </ul>
                </div>
              )}

              {/* RESEARCH FIELD */}
              {selectedComponent === 'research_field' && (
                <div className="space-y-2">
                  <p>
                    <strong>Research Field Accuracy</strong> uses position-based scoring that accounts for ranked predictions.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <div className="bg-green-100 p-2 rounded text-center">
                      <div className="font-bold text-green-800">Top-1</div>
                      <div className="text-xs text-green-600">100% (Exact match)</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="font-bold text-green-700">Top-3</div>
                      <div className="text-xs text-green-600">80% (Close match)</div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <div className="font-bold text-yellow-700">Top-5</div>
                      <div className="text-xs text-yellow-600">60% (Acceptable)</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="font-bold text-red-700">Not in Top-5</div>
                      <div className="text-xs text-red-600">User rating (Fallback)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* RESEARCH PROBLEM */}
              {selectedComponent === 'research_problem' && (
                <div className="space-y-2">
                  <p>
                    <strong>Research Problem Accuracy</strong> depends on data provenance:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">ORKG Source</span>
                      </div>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Classical Precision, Recall, F1-score</li>
                        <li>• Compares selected problem against GT</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-purple-800">LLM Source</span>
                      </div>
                      <ul className="text-xs text-purple-700 space-y-1">
                        <li>• No ground truth for LLM-generated</li>
                        <li>• Relies on expert ratings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE */}
              {selectedComponent === 'template' && (
                <div className="space-y-2">
                  <p>
                    <strong>Template Accuracy</strong> varies by provenance:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">ORKG Source</span>
                      </div>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Recall and F1-score for property coverage</li>
                        <li>• Comparison against reference template</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-purple-800">LLM Source</span>
                      </div>
                      <ul className="text-xs text-purple-700 space-y-1">
                        <li>• Structural similarity metrics</li>
                        <li>• Property overlap assessment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT - NEW */}
              {selectedComponent === 'content' && (
                <div className="space-y-2">
                  <p>
                    <strong>Content Accuracy</strong> uses a Precision-Recall-F1 framework (no ORKG ground truth):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-800">Precision</span>
                      </div>
                      <ul className="text-xs text-green-700 space-y-1">
                        <li>• Matched / Total Annotated</li>
                        <li>• % of annotations that are accurate</li>
                      </ul>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold text-orange-800">Recall</span>
                      </div>
                      <ul className="text-xs text-orange-700 space-y-1">
                        <li>• Matched / Total Template Props</li>
                        <li>• % of properties annotated</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">F1 Score</span>
                      </div>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• 2 × (P × R) / (P + R)</li>
                        <li>• Harmonic mean of P & R</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-pink-50 rounded border border-pink-200">
                    <p className="text-xs text-pink-800">
                      <strong>No Ground Truth:</strong> Content properties are LLM-extracted without ORKG reference data. 
                      The system uses <strong>LLM confidence</strong> as an accuracy proxy (default: 0.7). 
                      An <strong>evidence bonus (+0.1)</strong> rewards extractions with supporting textual evidence.
                    </p>
                  </div>
                </div>
              )}

              {/* Final Score Formula */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  <strong>Final Score</strong> = (Automated Accuracy × 60%) + (User Rating × 40%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Content-specific notice about no confusion matrix */}
      {selectedComponent === 'content' && (
        <Alert className="border-pink-200 bg-pink-50">
          <Cpu className="h-4 w-4 text-pink-600" />
          <AlertDescription className="text-pink-800">
            <strong>LLM-Only Extraction:</strong> Content properties are extracted by the LLM without ORKG ground truth. 
            Traditional confusion matrix classification (TP/FP/FN/TN) is not applicable. 
            Accuracy is measured via <strong>Precision</strong> (annotation correctness), <strong>Recall</strong> (annotation completeness), 
            and <strong>F1 Score</strong> (balanced measure).
          </AlertDescription>
        </Alert>
      )}

      {/* Main Matrix with Component-Specific Descriptions - Based on UNIQUE PAPERS (not shown for content) */}
      {hasEnoughGTForTraditionalMetrics && selectedComponent !== 'content' && (
        <Card className="p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Confusion Matrix: {currentComponent?.label}
              <Badge variant="outline" className="text-xs font-normal">
                <FileText className="h-3 w-3 mr-1" />
                {totalUniquePapers} unique papers
              </Badge>
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Based on exact string comparison between Ground Truth and System Output.
              <span className="ml-1 text-blue-600">Hover over cells for component-specific explanations.</span>
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Column Headers */}
              <div className="mb-2 ml-28">
                <div className="text-center text-sm font-semibold text-gray-700 mb-2">System Prediction</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center text-xs font-medium text-gray-500 py-1 bg-gray-100 rounded">
                    Predicted ✓
                  </div>
                  <div className="text-center text-xs font-medium text-gray-500 py-1 bg-gray-100 rounded">
                    Not Predicted ✗
                  </div>
                </div>
              </div>

              <div className="flex">
                {/* Row Headers */}
                <div className="w-28 flex flex-col justify-center pr-2">
                  <div className="text-sm font-semibold text-gray-700 text-center mb-4">
                    ORKG<br/>Ground Truth
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 flex items-center justify-end" style={{ minHeight: '160px' }}>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Has Data ✓
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-end" style={{ minHeight: '160px' }}>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        No Data ✗
                      </span>
                    </div>
                  </div>
                </div>

                {/* Matrix Grid */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <MatrixCell type="tp" value={matrix.tp} />
                  <MatrixCell type="fn" value={matrix.fn} />
                  <MatrixCell type="fp" value={matrix.fp} />
                  <MatrixCell type="tn" value={matrix.tn} />
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Correct ({matrix.tp + matrix.tn})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-gray-600">Mismatch ({matrix.fp})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-gray-600">Missed ({matrix.fn})</span>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================ */}
      {/* COMPONENT-SPECIFIC CELL DESCRIPTIONS CARDS */}
      {/* ============================================ */}
      {showCellDescriptions && hasEnoughGTForTraditionalMetrics && selectedComponent !== 'content' && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Cell Descriptions for {currentComponent?.label}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CellDescriptionCard type="tp" />
            <CellDescriptionCard type="fn" />
            <CellDescriptionCard type="fp" />
            <CellDescriptionCard type="tn" />
          </div>
        </Card>
      )}

      {/* Info about GT coverage (not for content) */}
      {!hasEnoughGTForTraditionalMetrics && selectedComponent !== 'content' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Limited Ground Truth Coverage:</strong> {coverage.withGroundTruth} of {totalUniquePapers} papers have ORKG Ground Truth.
            Confusion matrix visualization requires ≥3 papers with GT. Accuracy scores are still calculated from available evaluation data.
          </AlertDescription>
        </Alert>
      )}

      {/* Score Summary - Based on ALL EVALUATIONS */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {selectedComponent === 'content' 
            ? 'Precision-Recall-F1 Score Breakdown'
            : hasEnoughGTForTraditionalMetrics 
              ? 'Accuracy Summary (from Ground Truth)' 
              : 'Hybrid Score Breakdown'}
          <Badge variant="outline" className="text-xs font-normal ml-2">
            <Users className="h-3 w-3 mr-1" />
            {totalEvaluations} evaluations
          </Badge>
        </h4>
        
        {selectedComponent === 'content' ? (
          // Content-specific P/R/F1 display
          <>
            <div className="mb-4 p-3 bg-pink-50 rounded-lg border border-pink-200 text-sm text-pink-700">
              <strong>Precision-Recall Mode:</strong> Content extraction evaluated without ground truth. 
              F1 score provides balanced accuracy measure. User ratings from {totalEvaluations} evaluations 
              contribute to final hybrid scoring.
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-800">{formatPercent(metrics.precision)}</div>
                  <div className="text-sm text-green-600 mt-1">Precision</div>
                  <div className="text-xs text-green-500 mt-1">Accurate / Annotated</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-800">{formatPercent(metrics.recall)}</div>
                  <div className="text-sm text-orange-600 mt-1">Recall</div>
                  <div className="text-xs text-orange-500 mt-1">Annotated / Template</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-800">{formatPercent(metrics.f1Score)}</div>
                  <div className="text-sm text-blue-600 mt-1">F1 Score</div>
                  <div className="text-xs text-blue-500 mt-1">2×(P×R)/(P+R)</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-800">{formatPercent(scoringStats?.overallScore)}</div>
                  <div className="text-sm text-purple-600 mt-1 flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    Final Score
                  </div>
                  <div className="text-xs text-purple-500 mt-1">
                    (F1 × 60%) + (User × 40%)
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : hasEnoughGTForTraditionalMetrics ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-700">
              <strong>Ground Truth Mode:</strong> Scores derived from ORKG Ground Truth comparison. 
              {coverage.withGroundTruth} of {totalUniquePapers} papers have GT data for {selectedComponent.replace('_', ' ')}.
              User ratings from {totalEvaluations} evaluations contribute to hybrid scoring.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-800">{formatPercent(metrics.accuracy)}</div>
                  <div className="text-sm text-green-600 mt-1">Accuracy</div>
                  <div className="text-xs text-green-500 mt-2">(TP + TN) / Total</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-800">{formatPercent(metrics.f1Score)}</div>
                  <div className="text-sm text-blue-600 mt-1">F1 Score</div>
                  <div className="text-xs text-blue-500 mt-2">2 × (P × R) / (P + R)</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
              <strong>Hybrid Mode:</strong> Final Score = (Automated × 60%) + (User Rating × 40%)
              <br/>
              <span className="text-xs text-gray-500">
                Based on {totalEvaluations} evaluations across {totalUniquePapers} papers.
                Insufficient GT data for traditional metrics ({coverage.withGroundTruth} papers, need ≥3).
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-800">{formatPercent(scoringStats?.gtBasedScore)}</div>
                  <div className="text-sm text-green-600 mt-1">Automated Score</div>
                  <div className="text-xs text-green-500 mt-2">{scoringStats?.gtScoredPapers || 0} papers</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-800">{formatPercent(scoringStats?.userRatingScore)}</div>
                  <div className="text-sm text-purple-600 mt-1 flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    User Rating
                  </div>
                  <div className="text-xs text-purple-500 mt-2">
                    {scoringStats?.userRatedPapers || 0} evals 
                    ({((scoringStats?.userRatingScore || 0) * 5).toFixed(1)}/5)
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-800">{formatPercent(scoringStats?.overallScore)}</div>
                  <div className="text-sm text-blue-600 mt-1">Final Score</div>
                  <div className="text-xs text-blue-500 mt-2">
                    = ({formatPercent(scoringStats?.gtBasedScore)} × 60%) + ({formatPercent(scoringStats?.userRatingScore)} × 40%)
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Content-specific Property Stats */}
      {selectedComponent === 'content' && contentStats && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-pink-600" />
            Content Extraction Statistics
            <Badge variant="outline" className="text-xs font-normal">
              <FileText className="h-3 w-3 mr-1" />
              {totalUniquePapers} papers
            </Badge>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 text-center">
              <div className="text-3xl font-bold text-pink-900">{contentStats.totalProperties}</div>
              <div className="text-sm font-medium text-pink-800 mt-1">Total Properties</div>
              <div className="text-xs text-pink-600">Extracted values</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 text-center">
              <div className="text-3xl font-bold text-pink-800">{contentStats.avgPropertyCount.toFixed(1)}</div>
              <div className="text-sm font-medium text-pink-700 mt-1">Avg per Paper</div>
              <div className="text-xs text-pink-600">Properties/paper</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 text-center">
              <div className="text-3xl font-bold text-pink-800">{formatPercent(contentStats.avgConfidence)}</div>
              <div className="text-sm font-medium text-pink-700 mt-1">Avg Confidence</div>
              <div className="text-xs text-pink-600">LLM certainty</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 text-center">
              <div className="text-3xl font-bold text-pink-800">{contentStats.withEvidence}</div>
              <div className="text-sm font-medium text-pink-700 mt-1">With Evidence</div>
              <div className="text-xs text-pink-600">Papers with citations</div>
            </div>
          </div>
        </Card>
      )}

      {/* Research Field Position Stats */}
      {selectedComponent === 'research_field' && positionStats && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5" />
              Field Prediction Position Analysis
              <Badge variant="outline" className="text-xs font-normal">
                <FileText className="h-3 w-3 mr-1" />
                {totalUniquePapers} papers
              </Badge>
            </h4>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowPredictionsTable(!showPredictionsTable)} 
                variant="outline" size="sm"
                disabled={!selectedPaperForTree}
              >
                <Table className="h-4 w-4 mr-1" />
                {showPredictionsTable ? 'Hide' : 'Show'} Predictions
              </Button>
              <Button 
                onClick={() => setShowFieldTree(!showFieldTree)} 
                variant="outline" size="sm"
                disabled={!selectedPaperForTree || !hierarchyData}
              >
                <TreeDeciduous className="h-4 w-4 mr-1" />
                {showFieldTree ? 'Hide' : 'Show'} Tree
              </Button>
            </div>
          </div>
          
          {!selectedPaperForTree && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Select a paper</strong> from the breakdown table below (click "Show Details") to view the hierarchy tree or predictions table.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
              <div className="text-3xl font-bold text-green-900">{positionStats.top1}</div>
              <div className="text-sm font-medium text-green-800 mt-1">Top 1</div>
              <div className="text-xs text-green-600">Score: 100%</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
              <div className="text-3xl font-bold text-green-800">{positionStats.top3 - positionStats.top1}</div>
              <div className="text-sm font-medium text-green-700 mt-1">Top 2-3</div>
              <div className="text-xs text-green-600">Score: 80%</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
              <div className="text-3xl font-bold text-yellow-800">{positionStats.top5 - positionStats.top3}</div>
              <div className="text-sm font-medium text-yellow-700 mt-1">Top 4-5</div>
              <div className="text-xs text-yellow-600">Score: 60%</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
              <div className="text-3xl font-bold text-red-800">{positionStats.outside}</div>
              <div className="text-sm font-medium text-red-700 mt-1">Outside Top 5</div>
              <div className="text-xs text-red-600">Score: User Rating</div>
            </div>
          </div>

          {/* Selected Paper Info */}
          {selectedPaperForTree && selectedPaperData && treeViewData && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-sm font-medium text-blue-800">Selected: </span>
                  <span className="text-sm text-blue-700">{selectedPaperData.systemData?.metadata?.title || selectedPaperForTree}</span>
                </div>
                <Button onClick={() => setSelectedPaperForTree(null)} variant="outline" size="sm">Clear</Button>
              </div>
              <div className="mt-2 text-xs text-blue-600 grid grid-cols-2 gap-2">
                <div><span className="font-medium">GT:</span> <span className="bg-red-100 px-1 rounded">{treeViewData.groundTruth || 'N/A'}</span></div>
                <div><span className="font-medium">Selected:</span> <span className="bg-green-100 px-1 rounded">{treeViewData.prediction || 'N/A'}</span></div>
              </div>
            </div>
          )}

          {/* Predictions Table */}
          {showPredictionsTable && selectedPaperForTree && treeViewData && (
            <div className="mt-4 border-t pt-4">
              <ResearchFieldPredictionsTable
                groundTruth={treeViewData.groundTruth}
                predictions={treeViewData.predictedValues}
                selectedResearchField={treeViewData.selectedField}
                onResearchFieldSelect={handleFieldSelect}
              />
            </div>
          )}

          {/* Tree Visualization */}
          {showFieldTree && selectedPaperForTree && treeViewData && hierarchyData && (
            <div className="mt-4 border-t pt-4">
              <ResearchFieldTree
                groundTruth={treeViewData.groundTruth}
                prediction={treeViewData.prediction}
                hierarchyAnalysis={treeViewData.hierarchyAnalysis}
                predictedValues={treeViewData.predictedValues}
              />
            </div>
          )}
        </Card>
      )}

      {/* Source Analysis (Problem/Template) */}
      {(selectedComponent === 'research_problem' || selectedComponent === 'template') && sourceStats && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Source Analysis: {currentComponent?.label}
            <Badge variant="outline" className="text-xs font-normal">
              <FileText className="h-3 w-3 mr-1" />
              {totalUniquePapers} papers
            </Badge>
          </h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">ORKG Matched</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{sourceStats.orkg}</div>
              <div className="mt-2 text-sm text-blue-700">
                <div>Scoring: <strong>GT Comparison</strong></div>
                <div className="mt-1">Accuracy: {formatPercent(sourceStats.orkgAccuracy)}</div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-800">LLM Generated</span>
              </div>
              <div className="text-3xl font-bold text-purple-900">{sourceStats.llm}</div>
              <div className="mt-2 text-sm text-purple-700">
                <div>Scoring: <strong>User Rating</strong></div>
                <div className="mt-1">Avg Rating: {formatPercent(sourceStats.llmUserRating)}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Traditional Performance Metrics */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-2">Traditional Metrics</h4>
        <p className="text-xs text-gray-500 mb-4">
          Based on {totalUniquePapers} unique papers. 
          {selectedComponent === 'content' 
            ? ' Content uses Precision/Recall/F1 (no GT).'
            : ' Precision, Recall, F1 from evaluation service.'}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">{formatPercent(metrics.accuracy)}</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">{formatPercent(metrics.precision)}</div>
            <div className="text-sm text-gray-600">Precision</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">{formatPercent(metrics.recall)}</div>
            <div className="text-sm text-gray-600">Recall</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">{formatPercent(metrics.f1Score)}</div>
            <div className="text-sm text-gray-600">F1 Score</div>
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* RESEARCH FINDINGS - Component Specific */}
      {/* ============================================ */}
      {renderResearchFindings()}

      {/* Detailed Paper Breakdown - Based on UNIQUE PAPERS */}
      {showDetails && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Paper-Level Breakdown
            <Badge variant="outline" className="text-xs font-normal">
              <FileText className="h-3 w-3 mr-1" />
              {paperBreakdown.length} unique papers
            </Badge>
          </h4>
          
          {selectedComponent === 'research_field' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-blue-800">Select paper:</label>
                <select
                  value={selectedPaperForTree || ''}
                  onChange={(e) => handlePaperSelect(e.target.value || null)}
                  className="px-3 py-2 border rounded-lg text-sm flex-1 max-w-md"
                >
                  <option value="">-- Select a paper --</option>
                  {paperBreakdown.map((paper, idx) => (
                    <option key={idx} value={paper.doi}>{paper.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Paper</th>
                  {selectedComponent !== 'content' && (
                    <>
                      <th className="px-3 py-2 text-left">ORKG (GT)</th>
                      <th className="px-3 py-2 text-left">System</th>
                    </>
                  )}
                  {selectedComponent === 'content' && (
                    <>
                      <th className="px-3 py-2 text-center">Properties</th>
                      <th className="px-3 py-2 text-center">Confidence</th>
                    </>
                  )}
                  {(selectedComponent === 'research_problem' || selectedComponent === 'template') && (
                    <th className="px-3 py-2 text-center">Source</th>
                  )}
                  {selectedComponent === 'research_field' && (
                    <th className="px-3 py-2 text-center">Position</th>
                  )}
                  <th className="px-3 py-2 text-center">Method</th>
                  <th className="px-3 py-2 text-center">User</th>
                  <th className="px-3 py-2 text-center">Score</th>
                  {selectedComponent !== 'content' && (
                    <th className="px-3 py-2 text-center">Result</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paperBreakdown.map((paper, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-t hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedPaperForTree === paper.doi ? 'bg-blue-100 border-blue-300' : ''
                    }`}
                    onClick={() => selectedComponent === 'research_field' && handlePaperSelect(paper.doi)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 truncate max-w-40" title={paper.title}>
                        {selectedPaperForTree === paper.doi && <CheckCircle2 className="h-4 w-4 inline mr-1 text-blue-500" />}
                        {paper.title}
                      </div>
                    </td>
                    {selectedComponent !== 'content' && (
                      <>
                        <td className="px-3 py-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded truncate block max-w-28" title={paper.groundTruth}>
                            {paper.groundTruth || 'None'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded truncate block max-w-28" title={paper.systemPrediction}>
                            {paper.systemPrediction || 'None'}
                          </span>
                        </td>
                      </>
                    )}
                    {selectedComponent === 'content' && (
                      <>
                        <td className="px-3 py-2 text-center">
                          <Badge className="bg-pink-100 text-pink-800">
                            {paper.propertyCount || 0}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-sm">{formatPercent(paper.confidence)}</span>
                        </td>
                      </>
                    )}
                    {(selectedComponent === 'research_problem' || selectedComponent === 'template') && (
                      <td className="px-3 py-2 text-center">
                        <Badge className={paper.source === 'LLM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {paper.source || 'ORKG'}
                        </Badge>
                      </td>
                    )}
                    {selectedComponent === 'research_field' && (
                      <td className="px-3 py-2 text-center">
                        <Badge className={
                          paper.position === 1 ? 'bg-green-100 text-green-800' :
                          paper.position && paper.position <= 3 ? 'bg-green-100 text-green-700' :
                          paper.position && paper.position <= 5 ? 'bg-yellow-100 text-yellow-800' :
                          paper.position ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                        }>
                          {paper.position ? `#${paper.position}` : 'N/F'}
                        </Badge>
                      </td>
                    )}
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className="text-xs">
                        {selectedComponent === 'content' ? 'P/R/F1' : 
                          paper.scoreMethod === 'position' ? 'Pos' : paper.scoreMethod === 'user' ? 'User' : 'GT'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {paper.userRating != null ? (
                        <span className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{(paper.userRating * 5).toFixed(1)}</span>
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-sm font-bold ${
                        paper.score >= 0.8 ? 'text-green-600' :
                        paper.score >= 0.6 ? 'text-yellow-600' :
                        paper.score >= 0.4 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {formatPercent(paper.score)}
                      </span>
                    </td>
                    {selectedComponent !== 'content' && (
                      <td className="px-3 py-2 text-center">
                        <Badge className={
                          paper.classification === 'TP' ? 'bg-green-100 text-green-800' :
                          paper.classification === 'TN' ? 'bg-blue-100 text-blue-800' :
                          paper.classification === 'FP' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }>
                          {paper.classification}
                        </Badge>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildPaperBreakdown(papers, componentKey, confidenceThreshold) {
  if (!papers || !Array.isArray(papers)) return [];
  
  return papers.map((paper, index) => {
    const breakdown = {
      doi: paper.doi || `paper-${index}`,
      title: paper.systemData?.metadata?.title || paper.groundTruth?.title || `Paper ${index + 1}`,
      groundTruth: null,
      systemPrediction: null,
      confidence: 0,
      hasGroundTruth: false,
      source: 'ORKG',
      position: null,
      score: 0,
      scoreMethod: 'gt',
      userRating: null,
      classification: 'TN',
      // Content-specific fields
      propertyCount: 0,
      hasEvidence: false
    };

    const evaluation = paper.evaluation || paper.userEvaluations?.[0];
    const evalMetrics = evaluation?.evaluationMetrics;
    const evalOverall = evalMetrics?.overall || evaluation?.overall;

    switch (componentKey) {
      case 'research_field':
        breakdown.groundTruth = paper.groundTruth?.research_field_name || null;
        breakdown.systemPrediction = paper.systemData?.researchFields?.selectedField?.name || null;
        breakdown.confidence = paper.systemData?.researchFields?.selectedField?.score || 0;
        breakdown.hasGroundTruth = !!breakdown.groundTruth;
        breakdown.userRating = readUserRating(evalOverall?.research_field, evalMetrics?.accuracy?.researchField);
        breakdown.position = readPosition(evalOverall?.research_field, evalMetrics?.accuracy?.researchField);
        breakdown.score = readFinalScore(evalMetrics?.accuracy?.researchField) || 0;
        breakdown.scoreMethod = breakdown.position != null ? 'position' : 'gt';
        break;

      case 'research_problem':
        breakdown.groundTruth = paper.groundTruth?.research_problem_name || null;
        breakdown.hasGroundTruth = !!breakdown.groundTruth || !!paper.groundTruth?.research_problem_id;
        breakdown.systemPrediction = paper.systemData?.researchProblems?.selectedProblem?.title || null;
        breakdown.confidence = paper.systemData?.researchProblems?.selectedProblem?.confidence || 0;
        breakdown.userRating = readUserRating(evalOverall?.research_problem, evalMetrics?.accuracy?.researchProblem);
        breakdown.score = readFinalScore(evalMetrics?.accuracy?.researchProblem) || 0;
        const rp = paper.systemData?.researchProblems;
        breakdown.source = (rp?.selectedProblem?.isLLMGenerated === true || (rp?.llm_problem && !rp?.orkg_problems?.length)) ? 'LLM' : 'ORKG';
        breakdown.scoreMethod = breakdown.source === 'LLM' ? 'user' : 'gt';
        break;

      case 'template':
        breakdown.groundTruth = paper.groundTruth?.template_name || null;
        breakdown.hasGroundTruth = !!breakdown.groundTruth || !!paper.groundTruth?.template_id;
        breakdown.userRating = readUserRating(evalOverall?.template, evalMetrics?.accuracy?.template);
        breakdown.score = readFinalScore(evalMetrics?.accuracy?.template) || 0;
        const t = paper.systemData?.templates;
        if (t?.llm_template && t.llm_template !== false && t.llm_template?.template) {
          breakdown.systemPrediction = t.llm_template.template.name;
          breakdown.confidence = t.llm_template.confidence || 1.0;
          breakdown.source = 'LLM';
          breakdown.scoreMethod = 'user';
        } else if (t?.available?.template) {
          breakdown.systemPrediction = t.available.template.name;
          breakdown.confidence = t.available.confidence || 1.0;
          breakdown.source = 'ORKG';
          breakdown.scoreMethod = 'gt';
        }
        break;

      case 'metadata':
        breakdown.groundTruth = paper.groundTruth ? 'present' : null;
        breakdown.systemPrediction = paper.systemData?.metadata ? 'present' : null;
        breakdown.confidence = 1.0;
        breakdown.hasGroundTruth = !!paper.groundTruth;
        breakdown.userRating = readUserRating(evalOverall?.metadata, evalMetrics?.accuracy?.metadata);
        breakdown.score = readFinalScore(evalMetrics?.accuracy?.metadata) || 0;
        break;

      // ============================================
      // CONTENT - NEW CASE
      // ============================================
      case 'content':
        // Content has no GT - uses P/R/F1 methodology
        breakdown.groundTruth = null;
        breakdown.hasGroundTruth = false;
        breakdown.systemPrediction = 'LLM Extracted';
        breakdown.source = 'LLM';
        breakdown.scoreMethod = 'prf1'; // Precision/Recall/F1
        
        // Get content data
        const paperContent = paper.systemData?.paperContent?.paperContent;
        if (paperContent) {
          breakdown.propertyCount = Object.keys(paperContent).length;
          
          // Calculate average confidence across properties
          let totalConfidence = 0;
          let confCount = 0;
          let hasAnyEvidence = false;
          
          Object.values(paperContent).forEach(prop => {
            if (prop.confidence !== undefined) {
              totalConfidence += prop.confidence;
              confCount++;
            }
            if (prop.evidence) {
              hasAnyEvidence = true;
            }
          });
          
          breakdown.confidence = confCount > 0 ? totalConfidence / confCount : 0.7;
          breakdown.hasEvidence = hasAnyEvidence;
        }
        
        // Read content scores from evaluation
        const contentAccuracy = evalMetrics?.accuracy?.content;
        const contentOverall = evalOverall?.content;
        
        // Try to get F1 score or calculate from precision/recall
        let precision = contentAccuracy?.precision ?? contentAccuracy?._aggregate?.precision ?? 0;
        let recall = contentAccuracy?.recall ?? contentAccuracy?._aggregate?.recall ?? 0;
        let f1 = contentAccuracy?.f1Score ?? contentAccuracy?._aggregate?.f1Score ?? 0;
        
        // If F1 not available, calculate from P/R
        if (!f1 && precision > 0 && recall > 0) {
          f1 = 2 * (precision * recall) / (precision + recall);
        }
        
        // Fallback to confidence-based scoring if no metrics
        if (!f1 && breakdown.confidence > 0) {
          f1 = breakdown.confidence;
        }
        
        breakdown.score = f1;
        breakdown.userRating = readUserRating(contentOverall, contentAccuracy);
        
        // Content doesn't use TP/FP/FN/TN classification
        breakdown.classification = 'N/A';
        break;
    }

    // Classification logic (not for content)
    if (componentKey !== 'content') {
      const gtPresent = !!breakdown.groundTruth && breakdown.groundTruth !== 'None' && breakdown.groundTruth !== '';
      const sysPresent = !!breakdown.systemPrediction && breakdown.systemPrediction !== 'None' && breakdown.systemPrediction !== '' && breakdown.confidence >= confidenceThreshold;
      
      if (gtPresent && sysPresent) {
        breakdown.classification = normalizeString(breakdown.groundTruth) === normalizeString(breakdown.systemPrediction) ? 'TP' : 'FP';
      } else if (gtPresent && !sysPresent) {
        breakdown.classification = 'FN';
      } else if (!gtPresent && sysPresent) {
        breakdown.classification = 'FP';
      } else {
        breakdown.classification = 'TN';
      }
    }

    return breakdown;
  });
}

function readUserRating(overallData, accuracyData) {
  let rating = overallData?.primaryField?.rating
    ?? overallData?.overallScore
    ?? overallData?.overall?.overallScore
    ?? accuracyData?.scoreDetails?.finalScore
    ?? accuracyData?.rating
    ?? accuracyData?._aggregate?.mean
    ?? null;
  
  if (rating != null && rating > 1) {
    rating = rating / 5;
  }
  
  return rating;
}

function readPosition(overallData, accuracyData) {
  let position = overallData?.orkgPosition ?? null;
  
  if (position == null) {
    const fp = accuracyData?.similarityData?.foundPosition;
    if (fp != null && fp >= 0) position = fp + 1;
  }
  
  return position;
}

function readFinalScore(accuracyData) {
  return accuracyData?.scoreDetails?.finalScore
    ?? accuracyData?.similarityData?.finalScore
    ?? accuracyData?.overallScore
    ?? accuracyData?._aggregate?.mean
    ?? null;
}

function calculateCoverage(papers, componentKey, paperBreakdown) {
  let withGroundTruth = 0;
  let withoutGroundTruth = 0;
  
  papers.forEach((paper, index) => {
    let hasGT = false;
    
    switch (componentKey) {
      case 'metadata':
        hasGT = !!paper.groundTruth?.title;
        break;
      case 'research_field':
        hasGT = !!paper.groundTruth?.research_field_name;
        break;
      case 'research_problem':
        hasGT = !!paper.groundTruth?.research_problem_name || !!paper.groundTruth?.research_problem_id;
        break;
      case 'template':
        hasGT = !!paper.groundTruth?.template_name || !!paper.groundTruth?.template_id;
        break;
      case 'content':
        // Content never has GT
        hasGT = false;
        break;
      default:
        hasGT = false;
    }
    
    if (hasGT) {
      withGroundTruth++;
    } else {
      withoutGroundTruth++;
    }
  });
  
  return {
    totalPapers: papers.length,
    withGroundTruth,
    withoutGroundTruth
  };
}

function buildMatrixFromBreakdown(paperBreakdown) {
  const matrix = { tp: 0, tn: 0, fp: 0, fn: 0 };
  
  paperBreakdown.forEach(paper => {
    if (paper.classification === 'N/A') return; // Skip content
    const key = paper.classification.toLowerCase();
    if (matrix.hasOwnProperty(key)) {
      matrix[key]++;
    }
  });
  
  return matrix;
}

function extractScoringStats(aggregatedPapers, componentKey) {
  const papers = Object.values(aggregatedPapers);
  const automatedScores = [];
  const userRatingScores = [];
  const finalScores = [];
  
  papers.forEach(paper => {
    const comp = paper[componentKey];
    if (!comp) return;
    
    const automated = comp.accuracyScores?.mean ?? comp.scores?.mean ?? comp.f1Score?.mean;
    const userRating = comp.userRatings?.mean;
    
    if (automated !== undefined && !isNaN(automated)) {
      automatedScores.push(automated);
      
      if (userRating !== undefined && !isNaN(userRating)) {
        const finalScore = automated * 0.6 + userRating * 0.4;
        finalScores.push(finalScore);
        userRatingScores.push(userRating);
      } else {
        finalScores.push(automated);
      }
    }
  });
  
  const calcMean = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  return {
    overallScore: calcMean(finalScores),
    gtBasedScore: calcMean(automatedScores),
    userRatingScore: calcMean(userRatingScores),
    scoredPapers: finalScores.length,
    gtScoredPapers: automatedScores.length,
    userRatedPapers: userRatingScores.length
  };
}

function readMetricsFromService(aggregatedPapers, componentKey) {
  const papers = Object.values(aggregatedPapers);
  const accuracyScores = [];
  const precisionScores = [];
  const recallScores = [];
  const f1Scores = [];
  
  papers.forEach(paper => {
    const comp = paper[componentKey];
    if (!comp) return;
    
    const acc = comp.accuracyScores?.mean ?? comp.scores?.mean;
    if (acc !== undefined && !isNaN(acc)) {
      accuracyScores.push(acc);
    }
    
    const precision = comp.precision?.mean ?? comp.accuracyScores?.precision;
    const recall = comp.recall?.mean ?? comp.accuracyScores?.recall;
    const f1 = comp.f1Score?.mean ?? comp.accuracyScores?.f1Score;
    
    if (precision !== undefined && !isNaN(precision)) precisionScores.push(precision);
    if (recall !== undefined && !isNaN(recall)) recallScores.push(recall);
    if (f1 !== undefined && !isNaN(f1)) f1Scores.push(f1);
  });
  
  const calcMean = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  const accuracy = calcMean(accuracyScores);
  const precision = precisionScores.length > 0 ? calcMean(precisionScores) : accuracy;
  const recall = recallScores.length > 0 ? calcMean(recallScores) : accuracy;
  const f1Score = f1Scores.length > 0 ? calcMean(f1Scores) : 
    (precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : accuracy);
  
  return { accuracy, precision, recall, f1Score, specificity: 0, count: accuracyScores.length };
}

function extractSourceStats(papers, componentKey) {
  if (componentKey !== 'research_problem' && componentKey !== 'template') {
    return null;
  }
  
  let llm = 0, orkg = 0, llmCorrect = 0, orkgCorrect = 0;
  let llmUserRatingSum = 0, llmUserRatingCount = 0;
  
  papers.forEach(paper => {
    const evaluation = paper.evaluation || paper.userEvaluations?.[0];
    const evalMetrics = evaluation?.evaluationMetrics;
    
    if (componentKey === 'research_problem') {
      const rp = paper.systemData?.researchProblems;
      const isLLM = rp?.selectedProblem?.isLLMGenerated === true || (rp?.llm_problem && !rp?.orkg_problems?.length);
      
      if (isLLM) {
        llm++;
        const userRating = readUserRating(null, evalMetrics?.accuracy?.researchProblem);
        if (userRating != null) {
          llmUserRatingSum += userRating;
          llmUserRatingCount++;
        }
      } else {
        orkg++;
        const gt = paper.groundTruth?.research_problem_name;
        const sys = rp?.selectedProblem?.title;
        if (gt && sys && normalizeString(gt) === normalizeString(sys)) {
          orkgCorrect++;
        }
      }
    } else if (componentKey === 'template') {
      const t = paper.systemData?.templates;
      const isLLM = t?.llm_template && t.llm_template !== false && t.llm_template?.template;
      
      if (isLLM) {
        llm++;
        const userRating = readUserRating(null, evalMetrics?.accuracy?.template);
        if (userRating != null) {
          llmUserRatingSum += userRating;
          llmUserRatingCount++;
        }
      } else if (t?.available?.template) {
        orkg++;
        const gt = paper.groundTruth?.template_name;
        const sys = t.available.template.name;
        if (gt && sys && normalizeString(gt) === normalizeString(sys)) {
          orkgCorrect++;
        }
      }
    }
  });
  
  return {
    llm,
    orkg,
    llmCorrect,
    orkgCorrect,
    orkgAccuracy: orkg > 0 ? orkgCorrect / orkg : 0,
    llmUserRating: llmUserRatingCount > 0 ? llmUserRatingSum / llmUserRatingCount : 0
  };
}

function extractPositionStats(papers, componentKey) {
  if (componentKey !== 'research_field') {
    return null;
  }
  
  const stats = { top1: 0, top3: 0, top5: 0, outside: 0 };
  
  papers.forEach(paper => {
    const evaluation = paper.evaluation || paper.userEvaluations?.[0];
    const evalOverall = evaluation?.evaluationMetrics?.overall || evaluation?.overall;
    
    let position = readPosition(evalOverall?.research_field, evaluation?.evaluationMetrics?.accuracy?.researchField);
    
    if (position == null && paper.groundTruth?.research_field_name && paper.systemData?.researchFields?.fields) {
      const gt = paper.groundTruth.research_field_name;
      const idx = paper.systemData.researchFields.fields.findIndex(f => 
        normalizeString(f.name) === normalizeString(gt)
      );
      if (idx >= 0) position = idx + 1;
    }
    
    if (position != null && position > 0) {
      if (position === 1) {
        stats.top1++;
        stats.top3++;
        stats.top5++;
      } else if (position <= 3) {
        stats.top3++;
        stats.top5++;
      } else if (position <= 5) {
        stats.top5++;
      } else {
        stats.outside++;
      }
    } else {
      stats.outside++;
    }
  });
  
  return stats;
}

/**
 * Extract content-specific statistics
 */
function extractContentStats(papers, aggregatedPapers) {
  let totalProperties = 0;
  let totalConfidence = 0;
  let confCount = 0;
  let withEvidence = 0;
  
  papers.forEach(paper => {
    const paperContent = paper.systemData?.paperContent?.paperContent;
    if (paperContent) {
      const propCount = Object.keys(paperContent).length;
      totalProperties += propCount;
      
      let hasEvidence = false;
      Object.values(paperContent).forEach(prop => {
        if (prop.confidence !== undefined) {
          totalConfidence += prop.confidence;
          confCount++;
        }
        if (prop.evidence) {
          hasEvidence = true;
        }
      });
      
      if (hasEvidence) {
        withEvidence++;
      }
    }
  });
  
  return {
    totalProperties,
    avgPropertyCount: papers.length > 0 ? totalProperties / papers.length : 0,
    avgConfidence: confCount > 0 ? totalConfidence / confCount : 0,
    withEvidence
  };
}

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

export default ConfusionMatrixDisplay;