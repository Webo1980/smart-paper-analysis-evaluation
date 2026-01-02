// File: src/components/dashboard/views/PaperCard.jsx
// FIXED VERSION - Shows selected evaluator's scores when expanded

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  ChevronDown, ChevronUp, FileText, Layers, Target, 
  Grid, BarChart3, Users, ExternalLink
} from 'lucide-react';
import EvaluationSelector from './EvaluationSelector';
import { 
  calculatePaperOverallScore, 
  calculatePaperComponentScores 
} from '../../../utils/dataEnrichment';

/**
 * Paper Card Component
 * Expandable card showing paper details with component tabs
 * 
 * FIXED: Shows selected evaluator's scores when expanded
 * - Collapsed: Shows AVERAGE scores across all evaluators
 * - Expanded: Shows SELECTED evaluator's scores
 * 
 * Props:
 * - paperData: { doi, groundTruth, userEvaluations }
 * - componentDetailViews: Object mapping component names to React components
 * - viewType: 'accuracy' | 'quality' | 'other'
 */
const PaperCard = ({ 
  paperData, 
  componentDetailViews = {}, 
  viewType = 'accuracy' 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedEvaluationIndex, setSelectedEvaluationIndex] = useState(0);
  const [activeComponent, setActiveComponent] = useState('metadata');

  if (!paperData || !paperData.userEvaluations || paperData.userEvaluations.length === 0) {
    return null;
  }

  const { doi, groundTruth, userEvaluations } = paperData;
  const selectedEvaluation = userEvaluations[selectedEvaluationIndex];
  const hasMultipleEvaluations = userEvaluations.length > 1;
  
  // ============================================================================
  // SCORE CALCULATION - Different for collapsed vs expanded
  // Now passes viewType to use appropriate calculation method
  // ============================================================================
  
  // Calculate scores based on state:
  // - Collapsed: AVERAGE across all evaluators (evaluationIndex = null)
  // - Expanded: SELECTED evaluator's scores (evaluationIndex = selectedEvaluationIndex)
  const { overallScore, componentScores, isAverage } = useMemo(() => {
    if (expanded) {
      // Show selected evaluator's scores - pass viewType for correct calculation
      return {
        overallScore: calculatePaperOverallScore(paperData, selectedEvaluationIndex, viewType),
        componentScores: calculatePaperComponentScores(paperData, selectedEvaluationIndex, viewType),
        isAverage: false
      };
    } else {
      // Show average scores (or single evaluator if only one) - pass viewType
      return {
        overallScore: calculatePaperOverallScore(paperData, null, viewType),
        componentScores: calculatePaperComponentScores(paperData, null, viewType),
        isAverage: hasMultipleEvaluations
      };
    }
  }, [paperData, expanded, selectedEvaluationIndex, hasMultipleEvaluations, viewType]);

  // Helper function to safely render component detail views
  const renderComponentDetail = (componentKey) => {
    const DetailComponent = componentDetailViews[componentKey];
    
    if (!DetailComponent) {
      return <ComingSoonView componentName={getComponentDisplayName(componentKey)} />;
    }
    
    return (
      <DetailComponent
        key={`${componentKey}-${selectedEvaluationIndex}`}
        groundTruth={groundTruth}
        systemData={selectedEvaluation?.systemData}
        evaluation={selectedEvaluation}
        paperData={paperData}
        selectedEvaluation={selectedEvaluation}
        selectedEvaluationIndex={selectedEvaluationIndex}
      />
    );
  };

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Header - Always Visible */}
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div 
          className="flex items-start justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 pr-4">
            {/* Paper Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="line-clamp-2">{groundTruth?.title || 'Untitled Paper'}</span>
            </h3>

            {/* DOI */}
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="h-4 w-4 text-gray-400" />
              <a 
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-blue-600 hover:underline"
              >
                {doi}
              </a>
            </div>

            {/* Evaluation Count and Overall Score */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  {userEvaluations.length} Evaluation{userEvaluations.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <Badge className={getScoreColorClass(overallScore)}>
                Overall: {formatPercentage(overallScore)}
                {isAverage && hasMultipleEvaluations && (
                  <span className="ml-1 text-xs opacity-75">(avg)</span>
                )}
              </Badge>
              
              {/* Show selected evaluator name when expanded */}
              {expanded && hasMultipleEvaluations && (
                <Badge variant="outline" className="text-xs">
                  Viewing: {selectedEvaluation?.userInfo?.firstName || 'Unknown'}
                </Badge>
              )}
            </div>

            {/* Component Scores Summary */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <ComponentScoreBadge 
                icon={FileText} 
                label="Meta" 
                score={componentScores.metadata}
                isAverage={isAverage && hasMultipleEvaluations}
              />
              <ComponentScoreBadge 
                icon={Layers} 
                label="Field" 
                score={componentScores.researchField}
                isAverage={isAverage && hasMultipleEvaluations}
              />
              <ComponentScoreBadge 
                icon={Target} 
                label="Problem" 
                score={componentScores.researchProblem}
                isAverage={isAverage && hasMultipleEvaluations}
              />
              <ComponentScoreBadge 
                icon={Grid} 
                label="Template" 
                score={componentScores.template}
                isAverage={isAverage && hasMultipleEvaluations}
              />
              <ComponentScoreBadge 
                icon={BarChart3} 
                label="Content" 
                score={componentScores.content}
                isAverage={isAverage && hasMultipleEvaluations}
              />
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex-shrink-0">
            <button 
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="h-6 w-6 text-gray-600" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {expanded && (
        <CardContent className="pt-0">
          <div className="border-t pt-4">
            {/* Evaluation Selector (if multiple evaluations) */}
            <EvaluationSelector
              evaluations={userEvaluations}
              selectedIndex={selectedEvaluationIndex}
              onChange={setSelectedEvaluationIndex}
            />

            {/* Component Detail Tabs */}
            <Tabs value={activeComponent} onValueChange={setActiveComponent}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="metadata">
                  <FileText className="h-4 w-4 mr-2" />
                  Metadata
                </TabsTrigger>
                <TabsTrigger value="researchField">
                  <Layers className="h-4 w-4 mr-2" />
                  Field
                </TabsTrigger>
                <TabsTrigger value="researchProblem">
                  <Target className="h-4 w-4 mr-2" />
                  Problem
                </TabsTrigger>
                <TabsTrigger value="template">
                  <Grid className="h-4 w-4 mr-2" />
                  Template
                </TabsTrigger>
                <TabsTrigger value="content">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Content
                </TabsTrigger>
              </TabsList>

              {/* Metadata Tab */}
              <TabsContent value="metadata">
                {renderComponentDetail('metadata')}
              </TabsContent>

              {/* Research Field Tab */}
              <TabsContent value="researchField">
                {renderComponentDetail('researchField')}
              </TabsContent>

              {/* Research Problem Tab */}
              <TabsContent value="researchProblem">
                {renderComponentDetail('researchProblem')}
              </TabsContent>

              {/* Template Tab */}
              <TabsContent value="template">
                {renderComponentDetail('template')}
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content">
                {renderComponentDetail('content')}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Component Score Badge
 */
const ComponentScoreBadge = ({ icon: Icon, label, score, isAverage = false }) => {
  if (score === 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
        <Icon className="h-3 w-3" />
        <span>{label}: N/A</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getScoreColorClass(score, true)}`}>
      <Icon className="h-3 w-3" />
      <span>{label}: {formatPercentage(score)}</span>
    </div>
  );
};


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getComponentDisplayName(componentKey) {
  const displayNames = {
    metadata: 'Metadata',
    researchField: 'Research Field',
    researchProblem: 'Research Problem',
    template: 'Template',
    content: 'Content'
  };
  return displayNames[componentKey] || componentKey;
}

function getScoreColorClass(score, isSmall = false) {
  const base = isSmall ? '' : 'text-sm font-medium ';
  
  if (score >= 0.9) {
    return base + 'bg-green-100 text-green-700 border-green-200';
  } else if (score >= 0.7) {
    return base + 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (score >= 0.5) {
    return base + 'bg-yellow-100 text-yellow-700 border-yellow-200';
  } else if (score >= 0.3) {
    return base + 'bg-orange-100 text-orange-700 border-orange-200';
  } else {
    return base + 'bg-red-100 text-red-700 border-red-200';
  }
}

function formatPercentage(value) {
  if (value === null || value === undefined || value === 0) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

export default PaperCard;