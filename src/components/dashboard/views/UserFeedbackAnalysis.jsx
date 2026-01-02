/**
 * UserFeedbackAnalysis View Component - v8 COMPREHENSIVE
 * 
 * ALL IMPROVEMENTS:
 * 1. Fixed multi-evaluator detection using DOI extraction
 * 2. Research-paper quality interpretations with Key Findings section
 * 3. Click-to-open/click-outside-to-close info tooltips
 * 4. Theme Frequency chart restored + individual theme charts
 * 5. N-gram charts with proper interpretation
 * 6. Expert consensus analysis (inter-rater for experts)
 * 7. Venn-style visualization for expertise overlap
 * 8. Enhanced overall sentiment interpretation
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Treemap
} from 'recharts';
import {
  MessageSquare, Download, ChevronDown, ChevronUp,
  BarChart3, AlertCircle, Info, Users, GraduationCap,
  Hash, CheckSquare, Square, ExternalLink, Layers, Star,
  ThumbsUp, ThumbsDown, MessageCircle, Target, Lightbulb, GitCompare,
  Activity, Shield, HelpCircle, FileText, Minus, Search, Filter,
  CheckCircle, XCircle, ArrowLeftRight, Calculator, TrendingUp,
  BookOpen, Award, Zap
} from 'lucide-react';

// Import components
import NgramSentimentHistogram from './NgramSentimentHistogram';
import CommentSelectionPanel from './CommentSelectionPanel';
import ExpertConsensusAnalysis from './ExpertConsensusAnalysis';

// Import services
import {
  analyzeSentiment,
  analyzeMultipleComments,
  getSentimentLabel,
  categorizeSentiment,
  extractThemes
} from '../../../services/sentimentAnalysisService';
import {
  extractAllComments,
  groupCommentsByComponent,
  groupCommentsByPaper,
  groupCommentsByExpertise,
  getExpertiseStatistics,
  getCommentStatistics,
  getAllComponents,
  classifyExpertise
} from '../../../services/Commentextractionservice';
import {
  FLEISS_KAPPA_EXPLANATION,
  INTERSECTION_EXPLANATION,
  calculateFleissKappa,
  extractDOI,
  findMultiEvaluatorPapers,
  calculatePaperIntersection,
  generateComponentInterpretation,
  generateOverallInterpretation,
  analyzeExpertConsensus,
  analyzeExpertisePreferences,
  analyzeNgramPatterns,
  filterNgramData,
  getPaperStatistics,
  calculateComponentInterRater,
  analyzeThemesWithFrequency,
  generateResearchFindings
} from '../../../services/feedbackAnalyticsService';

// Color schemes
const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444'
};

const EXPERTISE_TIER_COLORS = {
  expert: '#7c3aed',
  advanced: '#3b82f6',
  intermediate: '#10b981',
  basic: '#6b7280'
};

// ============================================================================
// CLICK-OUTSIDE HOOK
// ============================================================================

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// ============================================================================
// INFO TOOLTIP WITH CLICK-TO-OPEN, CLICK-OUTSIDE-TO-CLOSE
// ============================================================================

const InfoTooltip = ({ content, title, children, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useClickOutside(ref, () => setIsOpen(false));
  
  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-1',
    'bottom-left': 'top-full left-0 mt-1',
    'top-right': 'bottom-full right-0 mb-1',
    'top-left': 'bottom-full left-0 mb-1'
  };
  
  return (
    <div className="relative inline-block" ref={ref}>
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? '' : 'Click for more info'}
      >
        {children || <HelpCircle className="h-4 w-4 text-gray-400 hover:text-blue-500" />}
      </div>
      {isOpen && (
        <div className={`absolute ${positionClasses[position]} z-50 bg-white border rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto`}>
          {title && <h4 className="font-semibold mb-2 text-gray-800">{title}</h4>}
          <div className="text-sm text-gray-600">{content}</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserFeedbackAnalysis = ({ data }) => {
  const [activeView, setActiveView] = useState('overview');
  const [expandedPapers, setExpandedPapers] = useState({});
  const [expandedThemes, setExpandedThemes] = useState({});
  const [selectedComponent, setSelectedComponent] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [expertiseFilter, setExpertiseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedCommentIds, setSelectedCommentIds] = useState([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [ngramComponentFilter, setNgramComponentFilter] = useState('all');
  const [ngramExpertiseFilter, setNgramExpertiseFilter] = useState('all');

  // Main analysis
  const analysisResults = useMemo(() => {
    if (!data?.raw || !Array.isArray(data.raw)) return null;

    const allComments = extractAllComments(data.raw);
    if (allComments.length === 0) return { isEmpty: true };

    const sentimentResults = analyzeMultipleComments(allComments);
    const byComponent = groupCommentsByComponent(allComments);
    
    const componentSentiment = {};
    Object.entries(byComponent).forEach(([key, data]) => {
      if (data.comments.length > 0) {
        componentSentiment[key] = {
          ...data,
          analysis: analyzeMultipleComments(data.comments)
        };
      }
    });

    const byPaper = groupCommentsByPaper(allComments);
    
    // FIXED: Proper multi-evaluator detection using DOI
    const paperInfo = findMultiEvaluatorPapers(allComments, data.raw);
    const paperStats = getPaperStatistics(allComments, data.raw);

    // Calculate intersection for each multi-evaluator paper
    const multiEvaluatorAnalysis = {};
    Object.entries(paperInfo.multiEvaluatorPapers).forEach(([key, paperData]) => {
      multiEvaluatorAnalysis[key] = {
        ...paperData,
        intersection: calculatePaperIntersection(paperData)
      };
    });

    const themes = extractThemes(allComments);
    const themeAnalysis = analyzeThemesWithFrequency(themes, allComments);
    const statistics = getCommentStatistics(allComments);
    const byExpertise = groupCommentsByExpertise(allComments);
    const expertiseStats = getExpertiseStatistics(allComments);
    
    const expertiseSentiment = { byTier: {} };
    Object.entries(byExpertise.byTier).forEach(([tier, data]) => {
      if (data.comments.length > 0) {
        expertiseSentiment.byTier[tier] = analyzeMultipleComments(data.comments);
      }
    });

    // Expertise preferences with percentages and Venn data
    const expertisePreferences = analyzeExpertisePreferences(byExpertise, analyzeSentiment);
    
    // Expert consensus analysis (NEW)
    const expertConsensus = analyzeExpertConsensus(allComments, byExpertise);
    
    // N-gram patterns with chart data
    const ngramPatterns = analyzeNgramPatterns(allComments, analyzeSentiment);

    // Component inter-rater analysis
    const componentInterRater = calculateComponentInterRater(componentSentiment, byPaper);

    // Fleiss' Kappa calculation
    const ratingsMatrix = [];
    Object.values(multiEvaluatorAnalysis).forEach(paper => {
      if (paper.intersection?.hasIntersection) {
        Object.values(paper.intersection.components).forEach(comp => {
          const ratings = Object.values(comp.evaluatorSentiments).map(e => e.dominant);
          if (ratings.length >= 2) {
            ratingsMatrix.push({ itemId: `${paper.doi}-${comp.name}`, ratings });
          }
        });
      }
    });
    const fleissKappa = ratingsMatrix.length > 0 ? calculateFleissKappa(ratingsMatrix) : null;

    // Research-quality interpretations
    const overallInterpretation = generateOverallInterpretation(sentimentResults.summary, componentSentiment);
    
    // Research findings
    const researchFindings = generateResearchFindings({
      sentimentResults,
      componentSentiment,
      paperStats,
      fleissKappa,
      expertisePreferences
    });

    return {
      isEmpty: false,
      allComments,
      sentimentResults,
      componentSentiment,
      byPaper,
      paperInfo,
      paperStats,
      multiEvaluatorAnalysis,
      themes,
      themeAnalysis,
      statistics,
      byExpertise,
      expertiseStats,
      expertiseSentiment,
      expertisePreferences,
      expertConsensus,
      ngramPatterns,
      componentInterRater,
      fleissKappa,
      overallInterpretation,
      researchFindings
    };
  }, [data]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    if (!analysisResults?.allComments) return [];
    let filtered = [...analysisResults.allComments];

    if (selectedComponent !== 'all') {
      filtered = filtered.filter(c => c.component === selectedComponent);
    }
    if (selectedSentiment !== 'all') {
      filtered = filtered.filter(c => {
        const s = analyzeSentiment(c.text);
        return categorizeSentiment(s.sentiment) === selectedSentiment;
      });
    }
    if (expertiseFilter !== 'all') {
      filtered = filtered.filter(c => c.expertiseClass?.tier === expertiseFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.text.toLowerCase().includes(q) ||
        c.componentName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [analysisResults, selectedComponent, selectedSentiment, expertiseFilter, searchQuery]);

  // N-gram filtered data
  const ngramFilteredData = useMemo(() => {
    if (!analysisResults?.ngramPatterns) return null;
    return filterNgramData(analysisResults.ngramPatterns, {
      component: ngramComponentFilter,
      expertise: ngramExpertiseFilter
    });
  }, [analysisResults, ngramComponentFilter, ngramExpertiseFilter]);

  // Chart data
  const chartData = useMemo(() => {
    if (!analysisResults || analysisResults.isEmpty) return null;

    const sentimentPie = [
      { name: 'Positive', value: analysisResults.sentimentResults.summary.simpleCounts.positive, color: SENTIMENT_COLORS.positive },
      { name: 'Neutral', value: analysisResults.sentimentResults.summary.simpleCounts.neutral, color: SENTIMENT_COLORS.neutral },
      { name: 'Negative', value: analysisResults.sentimentResults.summary.simpleCounts.negative, color: SENTIMENT_COLORS.negative }
    ].filter(d => d.value > 0);

    const componentBar = Object.entries(analysisResults.componentSentiment)
      .filter(([_, data]) => data.comments.length > 0)
      .map(([key, data]) => ({
        key,
        name: data.name,
        positive: data.analysis.summary.simpleCounts.positive,
        neutral: data.analysis.summary.simpleCounts.neutral,
        negative: data.analysis.summary.simpleCounts.negative,
        total: data.comments.length,
        avgScore: Math.round(data.analysis.summary.averageScore * 100),
        color: data.color
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return { sentimentPie, componentBar };
  }, [analysisResults]);

  // Toggle selection
  const toggleCommentSelection = useCallback((id) => {
    setSelectedCommentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // Export
  const exportToCSV = () => {
    if (!analysisResults?.allComments) return;
    const headers = ['Component', 'Subfield', 'Comment', 'Sentiment', 'Score', 'Rating', 'Paper', 'DOI', 'Expertise'];
    const rows = analysisResults.allComments.map(c => {
      const s = analyzeSentiment(c.text);
      return [c.componentName, c.subfield, `"${c.text.replace(/"/g, '""')}"`, s.sentiment, s.normalizedScore.toFixed(3), c.rating || '', `"${(c.paperTitle || '').replace(/"/g, '""')}"`, c.paperDOI || '', c.expertiseClass?.tier || ''];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback_analysis.csv';
    a.click();
  };

  if (!data?.raw) {
    return <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>No data available.</AlertDescription></Alert>;
  }
  if (analysisResults?.isEmpty) {
    return <Alert><Info className="h-4 w-4" /><AlertDescription>No comments found.</AlertDescription></Alert>;
  }

  const { sentimentResults, statistics, paperStats, fleissKappa, overallInterpretation, researchFindings } = analysisResults;
  const { summary } = sentimentResults;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            User Feedback Analysis
          </h2>
          <p className="text-gray-500 mt-1">
            Comprehensive analysis of {summary.analyzed} evaluator comments
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Key Metrics with Info Tooltips */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <MetricCard icon={MessageSquare} label="Comments" value={summary.analyzed} color="blue" />
        <MetricCard icon={ThumbsUp} label="Positive" value={summary.simpleCounts.positive} 
          subValue={`${(summary.simpleCounts.positive / summary.analyzed * 100).toFixed(0)}%`} color="green" />
        <MetricCard icon={Minus} label="Neutral" value={summary.simpleCounts.neutral}
          subValue={`${(summary.simpleCounts.neutral / summary.analyzed * 100).toFixed(0)}%`} color="yellow" />
        <MetricCard icon={ThumbsDown} label="Critical" value={summary.simpleCounts.negative}
          subValue={`${(summary.simpleCounts.negative / summary.analyzed * 100).toFixed(0)}%`} color="red" />
        <MetricCard icon={Target} label="Avg Score" value={`${(summary.averageScore * 100).toFixed(0)}%`} color="purple" />
        
        {/* Papers with click tooltip */}
        <MetricCardWithTooltip 
          icon={FileText} 
          label="Papers" 
          value={paperStats.totalPapersInDataset}
          subValue={`${paperStats.papersWithMultipleEvaluators} multi-eval`}
          color="indigo"
          tooltipTitle="Paper Statistics"
          tooltipContent={
            <div className="space-y-2">
              <div className="flex justify-between"><span>Total Papers:</span><span className="font-medium">{paperStats.totalPapersInDataset}</span></div>
              <div className="flex justify-between"><span>Papers Evaluated:</span><span className="font-medium">{paperStats.papersEvaluated}</span></div>
              <div className="flex justify-between"><span>Multi-Evaluator:</span><span className="font-medium text-purple-600">{paperStats.papersWithMultipleEvaluators}</span></div>
              <div className="flex justify-between"><span>Single Evaluator:</span><span className="font-medium">{paperStats.papersWithSingleEvaluator}</span></div>
              <div className="flex justify-between"><span>Avg Evals/Paper:</span><span className="font-medium">{paperStats.averageEvaluationsPerPaper}</span></div>
              <div className="flex justify-between"><span>Total Sessions:</span><span className="font-medium">{paperStats.totalEvaluationSessions}</span></div>
            </div>
          }
        />

        <MetricCard icon={Users} label="Multi-Eval" value={paperStats.papersWithMultipleEvaluators} subValue="papers" color="pink" />
        
        {/* Reliability with Fleiss' Kappa explanation */}
        <MetricCardWithTooltip 
          icon={Shield} 
          label="Reliability" 
          value={fleissKappa && fleissKappa.kappa != null ? `κ=${fleissKappa.kappa.toFixed(2)}` : 'N/A'}
          subValue={fleissKappa?.interpretation?.split(' ')[0] || 'Insufficient data'}
          color="teal"
          tooltipTitle={FLEISS_KAPPA_EXPLANATION.name}
          tooltipContent={
            <div className="space-y-3">
              <p>{FLEISS_KAPPA_EXPLANATION.description}</p>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs">{FLEISS_KAPPA_EXPLANATION.formula}</div>
              {fleissKappa && fleissKappa.details && (
                <div className="bg-teal-50 p-2 rounded text-xs">
                  <p className="font-medium text-teal-700">Current Calculation:</p>
                  <p>{fleissKappa.details.formula}</p>
                  <p>Items: {fleissKappa.details.n}, Raters: {fleissKappa.details.raters}</p>
                </div>
              )}
              <div className="border-t pt-2">
                <p className="font-medium text-xs mb-1">Interpretation Scale:</p>
                {Object.entries(FLEISS_KAPPA_EXPLANATION.interpretation).map(([range, meaning]) => (
                  <div key={range} className="flex justify-between text-xs">
                    <span className="text-gray-500">{range}:</span>
                    <span>{meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b pb-2 flex-wrap">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'findings', label: 'Key Findings', icon: BookOpen },
          { id: 'components', label: 'Components', icon: Layers },
          { id: 'multieval', label: `Multi-Evaluator (${paperStats.papersWithMultipleEvaluators})`, icon: GitCompare },
          { id: 'expertise', label: 'Expertise', icon: GraduationCap },
          { id: 'consensus', label: 'Expert Consensus', icon: Target },
          { id: 'ngram', label: 'Length Analysis', icon: Hash },
          { id: 'themes', label: 'Themes', icon: Lightbulb },
          { id: 'comments', label: 'All Comments', icon: MessageCircle },
          { id: 'selection', label: `Selection (${selectedCommentIds.length})`, icon: CheckSquare }
        ].map(tab => (
          <Button key={tab.id} variant={activeView === tab.id ? 'default' : 'outline'} size="sm"
            onClick={() => setActiveView(tab.id)}>
            <tab.icon className="h-4 w-4 mr-2" />{tab.label}
          </Button>
        ))}
      </div>

      {/* View Content */}
      {activeView === 'overview' && (
        <OverviewView 
          chartData={chartData} 
          summary={summary} 
          componentSentiment={analysisResults.componentSentiment}
          fleissKappa={fleissKappa}
          componentInterRater={analysisResults.componentInterRater}
          overallInterpretation={overallInterpretation}
          expertConsensus={analysisResults.expertConsensus}
        />
      )}

      {activeView === 'findings' && (
        <KeyFindingsView 
          findings={researchFindings}
          overallInterpretation={overallInterpretation}
          expertConsensus={analysisResults.expertConsensus}
          fleissKappa={fleissKappa}
        />
      )}

      {activeView === 'components' && (
        <ComponentsView 
          componentSentiment={analysisResults.componentSentiment}
          chartData={chartData}
          componentInterRater={analysisResults.componentInterRater}
        />
      )}

      {activeView === 'multieval' && (
        <MultiEvaluatorView 
          multiEvaluatorAnalysis={analysisResults.multiEvaluatorAnalysis}
          paperStats={paperStats}
          expandedPapers={expandedPapers}
          setExpandedPapers={setExpandedPapers}
        />
      )}

      {activeView === 'expertise' && (
        <ExpertiseView 
          byExpertise={analysisResults.byExpertise}
          expertiseStats={analysisResults.expertiseStats}
          expertiseSentiment={analysisResults.expertiseSentiment}
          expertisePreferences={analysisResults.expertisePreferences}
          expertConsensus={analysisResults.expertConsensus}
        />
      )}

      {activeView === 'consensus' && (
        <ExpertConsensusAnalysis
          expertiseStats={analysisResults.expertiseStats}
          expertisePreferences={analysisResults.expertisePreferences}
          expertConsensus={analysisResults.expertConsensus}
          byExpertise={analysisResults.byExpertise}
          expertiseSentiment={analysisResults.expertiseSentiment}
        />
      )}

      {activeView === 'ngram' && (
        <NgramView 
          ngramPatterns={analysisResults.ngramPatterns}
          ngramFilteredData={ngramFilteredData}
          allComments={analysisResults.allComments}
          ngramComponentFilter={ngramComponentFilter}
          setNgramComponentFilter={setNgramComponentFilter}
          ngramExpertiseFilter={ngramExpertiseFilter}
          setNgramExpertiseFilter={setNgramExpertiseFilter}
          components={getAllComponents()}
        />
      )}

      {activeView === 'themes' && (
        <ThemesView 
          themes={analysisResults.themes}
          themeAnalysis={analysisResults.themeAnalysis}
          expandedThemes={expandedThemes}
          setExpandedThemes={setExpandedThemes}
        />
      )}

      {activeView === 'comments' && (
        <CommentsView
          comments={filteredComments}
          selectedComponent={selectedComponent}
          setSelectedComponent={setSelectedComponent}
          selectedSentiment={selectedSentiment}
          setSelectedSentiment={setSelectedSentiment}
          expertiseFilter={expertiseFilter}
          setExpertiseFilter={setExpertiseFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          selectedIds={selectedCommentIds}
          onToggleSelection={toggleCommentSelection}
          showSelectionMode={showSelectionMode}
          setShowSelectionMode={setShowSelectionMode}
        />
      )}

      {activeView === 'selection' && (
        <CommentSelectionPanel
          comments={analysisResults.allComments}
          selectedIds={selectedCommentIds}
          onSelectionChange={setSelectedCommentIds}
        />
      )}
    </div>
  );
};

// ============================================================================
// METRIC CARDS
// ============================================================================

const MetricCard = ({ icon: Icon, label, value, subValue, color }) => {
  const colors = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-600',
    red: 'from-red-50 to-red-100 border-red-200 text-red-600',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600',
    pink: 'from-pink-50 to-pink-100 border-pink-200 text-pink-600',
    teal: 'from-teal-50 to-teal-100 border-teal-200 text-teal-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-3 border`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 opacity-70" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
      {subValue && <p className="text-xs opacity-70">{subValue}</p>}
    </div>
  );
};

const MetricCardWithTooltip = ({ icon: Icon, label, value, subValue, color, tooltipTitle, tooltipContent }) => {
  const colors = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600',
    teal: 'from-teal-50 to-teal-100 border-teal-200 text-teal-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-3 border relative`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 opacity-70" />
        <span className="text-xs font-medium opacity-80">{label}</span>
        <div className="ml-auto">
          <InfoTooltip title={tooltipTitle} content={tooltipContent} position="bottom-left">
            <HelpCircle className="h-3 w-3 opacity-50 hover:opacity-100" />
          </InfoTooltip>
        </div>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
      {subValue && <p className="text-xs opacity-70">{subValue}</p>}
    </div>
  );
};

// ============================================================================
// INTERPRETATION BOX
// ============================================================================

const InterpretationBox = ({ children, type = 'blue', title, icon: Icon }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };
  return (
    <div className={`p-4 rounded-lg border text-sm ${colors[type]}`}>
      {title && (
        <p className="font-semibold mb-2 flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
          {title}
        </p>
      )}
      {typeof children === 'string' ? (
        <p dangerouslySetInnerHTML={{ __html: children.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
      ) : children}
    </div>
  );
};

// ============================================================================
// KEY FINDINGS VIEW (NEW - Research Paper Quality)
// ============================================================================

const KeyFindingsView = ({ findings, overallInterpretation, expertConsensus, fleissKappa }) => (
  <div className="space-y-6">
    {/* Research Headline */}
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <Award className="h-6 w-6 text-blue-600" />
          Key Research Findings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-bold text-lg text-blue-900 mb-2">{overallInterpretation.headline}</h3>
            <p className="text-gray-700" dangerouslySetInnerHTML={{ 
              __html: overallInterpretation.details.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
            }} />
            <p className="text-gray-600 mt-2 text-sm italic">{overallInterpretation.implications}</p>
            {overallInterpretation.componentInsight && (
              <p className="mt-3 text-gray-700 font-medium" dangerouslySetInnerHTML={{ 
                __html: overallInterpretation.componentInsight.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
              }} />
            )}
          </div>
          
          {overallInterpretation.recommendations?.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" /> Recommendations
              </h4>
              <ul className="space-y-1">
                {overallInterpretation.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span className="text-yellow-500">→</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Individual Findings */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {findings.map(finding => (
        <Card key={finding.id} className="overflow-hidden">
          <div className={`h-1 ${
            finding.category === 'reception' ? 'bg-blue-500' :
            finding.category === 'components' ? 'bg-purple-500' :
            finding.category === 'reliability' ? 'bg-teal-500' :
            'bg-orange-500'
          }`} />
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {finding.category === 'reception' && <TrendingUp className="h-4 w-4 text-blue-600" />}
              {finding.category === 'components' && <Layers className="h-4 w-4 text-purple-600" />}
              {finding.category === 'reliability' && <Shield className="h-4 w-4 text-teal-600" />}
              {finding.category === 'expertise' && <GraduationCap className="h-4 w-4 text-orange-600" />}
              {finding.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ 
              __html: finding.content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
            }} />
            <p className="text-xs text-gray-400 mt-2 font-mono">{finding.dataSupport}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Expert Consensus Section */}
    {expertConsensus?.hasConsensus && (
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-purple-600" />
            Expert Consensus Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ 
            __html: expertConsensus.interpretation.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
          }} />
          
          <div className="grid grid-cols-2 gap-3">
            {expertConsensus.findings.map((f, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                f.sentiment === 'positive' ? 'bg-green-50 border-green-200' :
                f.sentiment === 'negative' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{f.component}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    f.consensusType === 'unanimous' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {f.consensusType}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{f.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

// ============================================================================
// OVERVIEW VIEW
// ============================================================================

const OverviewView = ({ chartData, summary, componentSentiment, fleissKappa, componentInterRater, overallInterpretation, expertConsensus }) => {
  return (
    <div className="space-y-6">
      {/* Fleiss' Kappa Alert */}
      {fleissKappa && fleissKappa.kappa !== null && (
        <Alert className={fleissKappa.kappa >= 0.4 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Inter-Rater Reliability:</span> Fleiss' κ = {fleissKappa.kappa.toFixed(3)} ({fleissKappa.interpretation}).
            Observed: {fleissKappa.observedAgreement}%, Expected by chance: {fleissKappa.expectedAgreement}%.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Pie with Research-Quality Interpretation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={chartData.sentimentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {chartData.sentimentPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <InterpretationBox type="blue" title={overallInterpretation.headline} icon={TrendingUp}>
              <p dangerouslySetInnerHTML={{ __html: overallInterpretation.details.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
            </InterpretationBox>
          </CardContent>
        </Card>

        {/* Component Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Component Sentiment Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.componentBar} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v}%`, 'Score']} />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                  {chartData.componentBar.map((entry, i) => (
                    <Cell key={i} fill={entry.avgScore >= 60 ? '#22c55e' : entry.avgScore >= 40 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <InterpretationBox type="purple" title="Component Analysis">
              {(() => {
                const best = chartData.componentBar[0];
                const worst = chartData.componentBar[chartData.componentBar.length - 1];
                return `**${best.name}** leads with ${best.avgScore}% sentiment score (n=${best.total}). ` +
                  `**${worst.name}** shows most room for improvement at ${worst.avgScore}% (n=${worst.total}).`;
              })()}
            </InterpretationBox>
          </CardContent>
        </Card>

        {/* Stacked Sentiment by Component */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sentiment Breakdown by Component</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.componentBar}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} name="Positive" />
                <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} name="Neutral" />
                <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} name="Critical" />
              </BarChart>
            </ResponsiveContainer>
            <InterpretationBox type="green" title="Feedback Distribution">
              {(() => {
                const mostCommented = [...chartData.componentBar].sort((a, b) => b.total - a.total)[0];
                const highestNeg = [...chartData.componentBar].sort((a, b) => b.negative - a.negative)[0];
                return `**${mostCommented.name}** received most feedback (${mostCommented.total} comments). ` +
                  `${highestNeg.negative > 0 ? `**${highestNeg.name}** has most critical feedback (${highestNeg.negative} comments).` : 'No significant critical feedback concentration.'}`;
              })()}
            </InterpretationBox>
          </CardContent>
        </Card>

        {/* Component Inter-Rater Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-purple-600" />
              Component Inter-Rater Agreement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {Object.entries(componentInterRater).filter(([_, d]) => d.hasInterRater).map(([key, data]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium text-sm">{data.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{data.papersAnalyzed} papers</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      parseInt(data.agreementRate) >= 70 ? 'bg-green-100 text-green-700' :
                      parseInt(data.agreementRate) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {data.agreementRate}% agree
                    </span>
                  </div>
                </div>
              ))}
              {Object.values(componentInterRater).filter(d => d.hasInterRater).length === 0 && (
                <p className="text-gray-500 text-sm">No multi-evaluator data available for component analysis. This requires the same paper (by DOI) to be evaluated by multiple evaluators.</p>
              )}
            </div>
            <InterpretationBox type="purple" title="Inter-Rater Insight">
              {(() => {
                const withData = Object.entries(componentInterRater).filter(([_, d]) => d.hasInterRater);
                if (withData.length === 0) return 'Need multiple evaluators per paper to calculate inter-rater agreement. Ensure papers are identified by DOI for proper matching.';
                const avgAgreement = withData.reduce((sum, [_, d]) => sum + parseInt(d.agreementRate), 0) / withData.length;
                const highAgreement = withData.filter(([_, d]) => parseInt(d.agreementRate) >= 70);
                return `Average agreement across components: **${avgAgreement.toFixed(0)}%**. ${highAgreement.length > 0 ? `High consensus on: ${highAgreement.map(([_, d]) => d.name).join(', ')}.` : ''}`;
              })()}
            </InterpretationBox>
          </CardContent>
        </Card>
      </div>
      
      {/* Expert Consensus */}
      {expertConsensus?.hasConsensus && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Expert Consensus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ 
              __html: expertConsensus.interpretation.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
            }} />
            <div className="flex flex-wrap gap-2">
              {expertConsensus.findings.slice(0, 6).map((f, i) => (
                <span key={i} className={`px-3 py-1.5 rounded-lg text-sm ${
                  f.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                  f.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                }`}>
                  {f.consensusType === 'unanimous' && '✓ '}
                  {f.component}: {f.sentiment}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTS VIEW
// ============================================================================

const ComponentsView = ({ componentSentiment, chartData, componentInterRater }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(componentSentiment)
        .filter(([_, data]) => data.comments.length > 0)
        .sort((a, b) => b[1].analysis.summary.averageScore - a[1].analysis.summary.averageScore)
        .map(([key, data]) => {
          const s = data.analysis.summary;
          const sentimentInfo = getSentimentLabel(s.overallSentiment);
          const interpretation = generateComponentInterpretation(data, key);
          const interRater = componentInterRater[key];
          
          return (
            <Card key={key} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: data.color }} />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                    {data.name}
                  </span>
                  <span className="text-2xl">{sentimentInfo.emoji}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-700">{s.simpleCounts.positive}</div>
                    <div className="text-xs text-green-600">{(s.simpleCounts.positive / s.analyzed * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-700">{s.simpleCounts.neutral}</div>
                    <div className="text-xs text-yellow-600">{(s.simpleCounts.neutral / s.analyzed * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-700">{s.simpleCounts.negative}</div>
                    <div className="text-xs text-red-600">{(s.simpleCounts.negative / s.analyzed * 100).toFixed(0)}%</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Sentiment Score</span>
                    <span className={`font-bold ${s.averageScore >= 0.6 ? 'text-green-600' : s.averageScore < 0.4 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {(s.averageScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${s.averageScore >= 0.6 ? 'bg-green-500' : s.averageScore < 0.4 ? 'bg-red-500' : 'bg-yellow-500'}`}
                      style={{ width: `${s.averageScore * 100}%` }} />
                  </div>
                </div>

                {interRater?.hasInterRater && (
                  <div className="mb-3 px-2 py-1 bg-purple-50 rounded text-xs flex items-center justify-between">
                    <span className="text-purple-600 flex items-center gap-1">
                      <GitCompare className="h-3 w-3" /> Inter-rater:
                    </span>
                    <span className="font-medium">{interRater.agreementRate}% ({interRater.agreementCount}/{interRater.papersAnalyzed})</span>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <p>{interpretation}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  </div>
);

// ============================================================================
// MULTI-EVALUATOR VIEW
// ============================================================================

const MultiEvaluatorView = ({ multiEvaluatorAnalysis, paperStats, expandedPapers, setExpandedPapers }) => {
  const papers = Object.entries(multiEvaluatorAnalysis)
    .sort((a, b) => b[1].evaluatorCount - a[1].evaluatorCount);

  if (papers.length === 0) {
    return (
      <div className="space-y-4">
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <p className="font-medium">No papers with multiple evaluators found.</p>
            <p className="text-sm mt-2">
              This analysis requires the same paper (identified by DOI) to be evaluated by at least 2 different evaluators.
            </p>
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Dataset Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-700">{paperStats.totalPapersInDataset}</div>
                <div className="text-sm text-gray-500">Total Papers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-700">{paperStats.papersWithSingleEvaluator}</div>
                <div className="text-sm text-gray-500">Single Evaluator</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-700">{paperStats.totalEvaluationSessions}</div>
                <div className="text-sm text-gray-500">Total Sessions</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-700">{paperStats.averageEvaluationsPerPaper}</div>
                <div className="text-sm text-gray-500">Avg per Paper</div>
              </div>
            </div>
            
            <InterpretationBox type="blue" title="How to Enable Multi-Evaluator Analysis">
              To analyze inter-rater agreement, have multiple evaluators assess the same papers. 
              Papers are matched by their **title** extracted from the evaluation metadata. 
              When multiple users evaluate the same paper, their comments can be compared for agreement analysis.
            </InterpretationBox>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <GitCompare className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <span className="font-medium">{papers.length} papers</span> have been evaluated by multiple evaluators.
          This enables inter-rater agreement analysis per component.
        </AlertDescription>
      </Alert>

      <Card className="bg-purple-50/50 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-purple-600" />
            What is Intersection Analysis?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <p>{INTERSECTION_EXPLANATION.description}</p>
          <ul className="mt-2 space-y-1">
            {INTERSECTION_EXPLANATION.metrics.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-600">•</span>{m}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {papers.map(([key, paperData]) => {
        const isExpanded = expandedPapers[key];
        const intersection = paperData.intersection;
        
        return (
          <Card key={key} className="overflow-hidden">
            <div 
              className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => setExpandedPapers(prev => ({ ...prev, [key]: !prev[key] }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{paperData.title || 'Untitled'}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {paperData.doi && (
                        <a href={`https://doi.org/${paperData.doi}`} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink className="h-3 w-3" /> DOI
                        </a>
                      )}
                      <span className="text-gray-500">{paperData.comments.length} comments</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{paperData.evaluatorCount}</div>
                    <div className="text-xs text-gray-500">Evaluators</div>
                  </div>
                  {intersection?.hasIntersection && (
                    <div className="text-center">
                      <div className={`text-lg font-bold ${parseInt(intersection.summary.agreementRate) >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                        {intersection.summary.agreementRate}%
                      </div>
                      <div className="text-xs text-gray-500">Agreement</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <CardContent className="pt-4">
                {/* Evaluator Details */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    Evaluators
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {(paperData.evaluators || Object.keys(paperData.evaluatorDetails || {})).map((evalId, idx) => {
                      const evalDetail = paperData.evaluatorDetails?.[evalId];
                      const name = evalDetail?.userInfo?.firstName || `Evaluator ${idx + 1}`;
                      const commentCount = evalDetail?.comments?.length || 0;
                      const expertise = evalDetail?.expertiseClass || 'unknown';
                      
                      return (
                        <div key={evalId} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded border text-sm">
                          <span className="font-medium">{name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            expertise === 'expert' ? 'bg-purple-100 text-purple-700' :
                            expertise === 'advanced' ? 'bg-blue-100 text-blue-700' :
                            expertise === 'intermediate' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {expertise}
                          </span>
                          <span className="text-gray-500 text-xs">({commentCount} comments)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {intersection?.hasIntersection && Object.keys(intersection.components || {}).length > 0 ? (
                  <>
                    <InterpretationBox type="blue" title="Intersection Summary">
                      {intersection.interpretation}
                    </InterpretationBox>

                    <h4 className="font-medium mt-4 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      Component Sentiment Matrix
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(intersection.components).map(([compKey, compData]) => (
                        <div key={compKey} className={`p-3 rounded-lg border-2 ${compData.agreement ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm" style={{ color: compData.color }}>{compData.name}</span>
                            {compData.agreement ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowLeftRight className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {Object.entries(compData.evaluatorSentiments).map(([evalId, evalData], idx) => {
                              const evalDetail = paperData.evaluatorDetails?.[evalId];
                              const name = evalDetail?.userInfo?.firstName || `Eval ${idx + 1}`;
                              
                              return (
                                <div key={evalId} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600 font-medium">{name}</span>
                                  <div className="flex gap-1">
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded" title="Positive">{evalData.sentiments.positive}</span>
                                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded" title="Neutral">{evalData.sentiments.neutral}</span>
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded" title="Negative">{evalData.sentiments.negative}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-2 pt-2 border-t flex gap-2 flex-wrap text-xs">
                            {compData.intersection.allPositive && <span className="text-green-600">✓ All positive</span>}
                            {compData.intersection.allNegative && <span className="text-red-600">✓ All critical</span>}
                            {compData.intersection.somePositive && !compData.intersection.allPositive && (
                              <span className="text-green-600">{compData.intersection.positiveCount}/{compData.evaluatorCount} positive</span>
                            )}
                            {compData.intersection.someNegative && !compData.intersection.allNegative && (
                              <span className="text-red-600">{compData.intersection.negativeCount}/{compData.evaluatorCount} critical</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <p className="font-medium">No textual comments available for comparison</p>
                      <p className="text-sm mt-1">
                        The evaluators of this paper provided ratings but did not leave textual comments. 
                        Component sentiment analysis requires textual feedback to compare perspectives.
                      </p>
                      <div className="mt-2 text-xs text-gray-600">
                        <strong>Tip:</strong> Encourage evaluators to add comments explaining their ratings 
                        for richer inter-rater analysis.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ============================================================================
// EXPERTISE VIEW
// ============================================================================

const ExpertiseView = ({ byExpertise, expertiseStats, expertiseSentiment, expertisePreferences, expertConsensus }) => {
  // Generate intersection data for the visual
  const intersectionData = useMemo(() => {
    if (!expertisePreferences?.interRater?.componentAgreement) return null;
    
    const tiers = ['expert', 'advanced', 'intermediate', 'basic'];
    const activeTiers = tiers.filter(t => expertiseStats?.byTier?.[t]?.count > 0);
    
    // Get component agreement/disagreement data
    const componentData = Object.entries(expertisePreferences.interRater.componentAgreement || {}).map(([compName, info]) => {
      // Determine which tiers agree for this component
      const tierSentiments = {};
      activeTiers.forEach(tier => {
        const tierData = expertiseSentiment?.byTier?.[tier];
        if (tierData?.byComponent) {
          const compData = Object.values(tierData.byComponent).find(c => c.name === compName || c.key === compName);
          if (compData) {
            const pos = compData.simpleCounts?.positive || 0;
            const neg = compData.simpleCounts?.negative || 0;
            tierSentiments[tier] = pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral';
          }
        }
      });
      
      return {
        component: compName,
        agreement: info.agreement,
        tierSentiments,
        tiersWithData: Object.keys(tierSentiments).length
      };
    });
    
    return {
      activeTiers,
      components: componentData,
      agreed: componentData.filter(c => c.agreement),
      divergent: componentData.filter(c => !c.agreement)
    };
  }, [expertisePreferences, expertiseStats, expertiseSentiment]);

  return (
    <div className="space-y-6">
      <Alert className="bg-purple-50 border-purple-200">
        <GraduationCap className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <p className="font-medium mb-1">Expertise-Based Analysis</p>
          <p className="text-sm" dangerouslySetInnerHTML={{ 
            __html: expertisePreferences.interpretation.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
          }} />
        </AlertDescription>
      </Alert>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['expert', 'advanced', 'intermediate', 'basic'].map(tier => {
          const stats = expertiseStats.byTier[tier];
          const prefs = expertisePreferences.preferences[tier];
          const tierAnalysis = expertiseSentiment.byTier[tier];
          
          if (!stats || stats.count === 0) return null;
          
          return (
            <Card key={tier} className="border-t-4" style={{ borderTopColor: EXPERTISE_TIER_COLORS[tier] }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {tier === 'expert' && <Star className="h-4 w-4 text-purple-600" />}
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xl font-bold" style={{ color: EXPERTISE_TIER_COLORS[tier] }}>{stats.evaluators}</div>
                    <div className="text-xs text-gray-500">Evaluators</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xl font-bold" style={{ color: EXPERTISE_TIER_COLORS[tier] }}>{stats.count}</div>
                    <div className="text-xs text-gray-500">Comments</div>
                  </div>
                </div>
                
                {tierAnalysis && (
                  <div className="flex gap-1 mb-3">
                    <div className="flex-1 bg-green-100 rounded p-1 text-center">
                      <div className="text-sm font-bold text-green-700">{tierAnalysis.summary.simpleCounts.positive}</div>
                    </div>
                    <div className="flex-1 bg-yellow-100 rounded p-1 text-center">
                      <div className="text-sm font-bold text-yellow-700">{tierAnalysis.summary.simpleCounts.neutral}</div>
                    </div>
                    <div className="flex-1 bg-red-100 rounded p-1 text-center">
                      <div className="text-sm font-bold text-red-700">{tierAnalysis.summary.simpleCounts.negative}</div>
                    </div>
                  </div>
                )}

                {prefs && (
                  <div className="text-xs space-y-1 p-2 bg-gray-50 rounded">
                    {prefs.favorite && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Favors:</span>
                        <span className="font-medium text-green-600">{prefs.favorite.name} ({prefs.favorite.positivePercent}%)</span>
                      </div>
                    )}
                    {prefs.concern && prefs.concern.key !== prefs.favorite?.key && prefs.concern.negativeRatio > 0.15 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Critical of:</span>
                        <span className="font-medium text-red-600">{prefs.concern.name} ({prefs.concern.negativePercent}%)</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Expert Consensus */}
      {expertConsensus?.hasConsensus && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Expert Consensus Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ 
              __html: expertConsensus.interpretation.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
            }} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {expertConsensus.findings.map((f, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  f.sentiment === 'positive' ? 'bg-green-50 border-green-200' :
                  f.sentiment === 'negative' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{f.component}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      f.consensusType === 'unanimous' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
                    }`}>
                      {f.consensusType} ({f.expertCount} experts)
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{f.message}</p>
                </div>
              ))}
            </div>
            
            <InterpretationBox type="purple" title="Research Implication" className="mt-4">
              {expertConsensus.positiveConsensus.length > 0 && expertConsensus.negativeConsensus.length > 0
                ? `Expert consensus suggests **clear differentiation** between strong components (${expertConsensus.positiveConsensus.map(p => p.component).join(', ')}) and areas needing attention (${expertConsensus.negativeConsensus.map(n => n.component).join(', ')}). This convergence among domain experts provides reliable guidance for system improvement.`
                : 'Expert feedback patterns provide domain-specific insights into system performance.'
              }
            </InterpretationBox>
          </CardContent>
        </Card>
      )}

      {/* NEW: Expertise Tier Intersection Visual */}
      {intersectionData && intersectionData.activeTiers.length >= 2 && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-purple-600" />
              Cross-Expertise Agreement Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpertiseTierIntersectionVisual 
              intersectionData={intersectionData}
              expertisePreferences={expertisePreferences}
              expertiseStats={expertiseStats}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// EXPERTISE TIER INTERSECTION VISUAL - Shows agreement/disagreement across tiers
// Inspired by ConfidenceSection expandable design
// ============================================================================

const ExpertiseTierIntersectionVisual = ({ intersectionData, expertisePreferences, expertiseStats }) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: false,
    agreement: false,
    divergence: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Use vennData from expertisePreferences for accurate intersection data
  const vennData = expertisePreferences?.vennData;
  const interRater = expertisePreferences?.interRater;
  const preferences = expertisePreferences?.preferences || {};
  
  // Get active tiers with their comment counts
  const tiers = ['expert', 'advanced', 'intermediate', 'basic'];
  const activeTiers = tiers.filter(t => {
    const tierStats = expertiseStats?.byTier?.[t];
    const tierPrefs = preferences[t];
    return (tierStats?.count > 0) || (tierPrefs?.totalComments > 0);
  });

  // Color and style helpers
  const getTierColor = (tier) => EXPERTISE_TIER_COLORS[tier] || '#888';
  const getTierBgClass = (tier) => ({
    expert: 'bg-purple-50 border-purple-300',
    advanced: 'bg-blue-50 border-blue-300',
    intermediate: 'bg-green-50 border-green-300',
    basic: 'bg-yellow-50 border-yellow-300'
  }[tier] || 'bg-gray-50 border-gray-300');

  const getSentimentBadge = (sentiment) => {
    const styles = {
      positive: 'bg-green-100 text-green-700 border-green-200',
      negative: 'bg-red-100 text-red-700 border-red-200',
      neutral: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    const icons = {
      positive: <ThumbsUp className="h-3 w-3" />,
      negative: <ThumbsDown className="h-3 w-3" />,
      neutral: <Minus className="h-3 w-3" />
    };
    return { className: styles[sentiment] || styles.neutral, icon: icons[sentiment] || icons.neutral };
  };

  // Calculate stats
  const agreementRate = interRater?.agreementRate || 0;
  const agreedCount = vennData?.summary?.agreedCount || interRater?.agreed || 0;
  const divergentCount = vennData?.summary?.divergentCount || (interRater?.total - interRater?.agreed) || 0;
  const totalComponents = vennData?.summary?.totalComponents || interRater?.total || 0;

  // Get agreed and divergent components from vennData or interRater
  const agreedComponents = vennData?.agreed || [];
  const divergentComponents = vennData?.divergent || [];

  if (activeTiers.length < 2) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        <Info className="h-6 w-6 mx-auto mb-2" />
        <p>Need at least 2 expertise tiers with data for intersection analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{agreementRate}%</div>
          <div className="text-xs text-purple-700">Cross-Tier Agreement</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{agreedCount}</div>
          <div className="text-xs text-green-700">Consensus Components</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{divergentCount}</div>
          <div className="text-xs text-orange-700">Divergent Components</div>
        </div>
      </div>

      {/* Expertise Tier Circles - Interactive Intersection Visual */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={() => toggleSection('overview')}
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-gray-800">Expertise Tiers Overview</span>
          </div>
          {expandedSections.overview ? 
            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
            <ChevronDown className="h-5 w-5 text-gray-500" />
          }
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiers.map(tier => {
            const tierStats = expertiseStats?.byTier?.[tier];
            const tierPrefs = preferences[tier];
            const commentCount = tierStats?.count || tierPrefs?.totalComments || 0;
            const evaluatorCount = tierStats?.evaluators || 0;
            
            if (commentCount === 0) return null;
            
            return (
              <div 
                key={tier}
                className={`p-3 rounded-lg border-2 ${getTierBgClass(tier)}`}
                style={{ borderColor: getTierColor(tier) }}
              >
                <div className="text-center">
                  <div className="font-bold text-sm" style={{ color: getTierColor(tier) }}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </div>
                  <div className="text-lg font-bold text-gray-800">{commentCount}</div>
                  <div className="text-xs text-gray-500">comments</div>
                  {evaluatorCount > 0 && (
                    <div className="text-xs text-gray-400 mt-1">{evaluatorCount} evaluators</div>
                  )}
                </div>
                
                {/* Tier's top preference */}
                {tierPrefs?.favorite && (
                  <div className="mt-2 pt-2 border-t text-xs">
                    <span className="text-gray-500">Favors: </span>
                    <span className="font-medium text-green-600">{tierPrefs.favorite.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Expanded Details */}
        {expandedSections.overview && (
          <div className="mt-4 p-3 bg-white rounded border text-sm">
            <p className="font-medium mb-2 text-gray-800">Tier Distribution Analysis</p>
            <div className="space-y-2">
              {activeTiers.map(tier => {
                const tierPrefs = preferences[tier];
                if (!tierPrefs) return null;
                
                return (
                  <div key={tier} className="flex items-center justify-between text-xs">
                    <span className="font-medium" style={{ color: getTierColor(tier) }}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </span>
                    <div className="flex gap-2">
                      {tierPrefs.favorite && (
                        <span className="text-green-600">↑ {tierPrefs.favorite.name}</span>
                      )}
                      {tierPrefs.concern && tierPrefs.concern.negativeRatio > 0.2 && (
                        <span className="text-red-600">↓ {tierPrefs.concern.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-100">
              <p className="text-xs text-purple-800">
                <strong>Interpretation:</strong> {activeTiers.length} expertise tiers provide diverse perspectives. 
                {agreementRate >= 70 
                  ? ' High cross-tier agreement suggests objective quality dimensions.'
                  : agreementRate >= 40
                    ? ' Moderate agreement indicates some expertise-dependent evaluation criteria.'
                    : ' Low agreement suggests expertise significantly influences perception.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Agreement Zone */}
      <div className="bg-white rounded-lg border-2 border-green-300">
        <div 
          className="flex items-center justify-between cursor-pointer p-3 bg-green-50 rounded-t-lg"
          onClick={() => toggleSection('agreement')}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Agreement Zone ({agreedCount} components)</span>
          </div>
          {expandedSections.agreement ? 
            <ChevronUp className="h-5 w-5 text-green-600" /> : 
            <ChevronDown className="h-5 w-5 text-green-600" />
          }
        </div>

        <div className="p-3">
          {agreedComponents.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {agreedComponents.map(comp => (
                <div key={comp.key} className="p-2 bg-green-50 rounded border border-green-200">
                  <div className="font-medium text-sm text-green-800">{comp.name}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {Object.entries(comp.tierSentiments || {}).map(([tier, sentiment]) => {
                      const badge = getSentimentBadge(sentiment);
                      return (
                        <span 
                          key={tier}
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs border ${badge.className}`}
                          title={`${tier}: ${sentiment}`}
                        >
                          {badge.icon}
                          <span className="font-medium">{tier.charAt(0).toUpperCase()}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-2">
              No components with full cross-tier agreement
            </p>
          )}

          {/* Expanded interpretation */}
          {expandedSections.agreement && agreedComponents.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200 text-sm">
              <p className="font-medium text-green-800 mb-2">Agreement Analysis</p>
              <p className="text-green-700">
                These {agreedComponents.length} components show consistent sentiment across all expertise tiers.
                This indicates <strong>objective quality perception</strong> - regardless of evaluator experience,
                these aspects are viewed similarly.
              </p>
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-green-800 font-medium">Research Implication:</p>
                <p className="text-xs text-green-700">
                  Components with cross-tier agreement ({agreedComponents.map(c => c.name).join(', ')}) 
                  represent reliably perceived system qualities suitable for findings claims.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divergence Zone */}
      {divergentComponents.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-orange-300">
          <div 
            className="flex items-center justify-between cursor-pointer p-3 bg-orange-50 rounded-t-lg"
            onClick={() => toggleSection('divergence')}
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">Divergence Zone ({divergentCount} components)</span>
            </div>
            {expandedSections.divergence ? 
              <ChevronUp className="h-5 w-5 text-orange-600" /> : 
              <ChevronDown className="h-5 w-5 text-orange-600" />
            }
          </div>

          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {divergentComponents.map(comp => (
                <div key={comp.key} className="p-3 bg-orange-50 rounded border border-orange-200">
                  <div className="font-medium text-orange-800 mb-2">{comp.name}</div>
                  <div className="space-y-1">
                    {Object.entries(comp.tierSentiments || {}).map(([tier, sentiment]) => {
                      const badge = getSentimentBadge(sentiment);
                      return (
                        <div key={tier} className="flex items-center justify-between text-sm">
                          <span className="font-medium" style={{ color: getTierColor(tier) }}>
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${badge.className}`}>
                            {badge.icon}
                            {sentiment}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Expanded interpretation */}
            {expandedSections.divergence && (
              <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200 text-sm">
                <p className="font-medium text-orange-800 mb-2">Divergence Analysis</p>
                <p className="text-orange-700">
                  These {divergentComponents.length} components show <strong>expertise-dependent perception</strong>.
                  Different expertise levels evaluate these aspects differently.
                </p>
                <div className="mt-2 pt-2 border-t border-orange-200">
                  <p className="text-xs text-orange-800 font-medium">Possible Explanations:</p>
                  <ul className="list-disc list-inside text-xs text-orange-700 mt-1 space-y-1">
                    <li>Experts notice subtle issues invisible to novices</li>
                    <li>Experts hold higher/different quality standards</li>
                    <li>Domain knowledge influences expectations</li>
                    <li>Experience affects usability perception</li>
                  </ul>
                </div>
                <div className="mt-2 pt-2 border-t border-orange-200">
                  <p className="text-xs text-orange-800 font-medium">Research Implication:</p>
                  <p className="text-xs text-orange-700">
                    Consider expertise-stratified reporting for {divergentComponents.map(c => c.name).join(', ')}.
                    Expert opinions may warrant higher weight for technical accuracy claims.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Research Interpretation */}
      <InterpretationBox type="purple" title="Cross-Expertise Pattern Summary">
        {agreedCount > divergentCount ? (
          <>
            <strong>High cross-expertise consensus</strong> observed ({agreedCount}/{totalComponents} components, {agreementRate}% agreement rate).
            System quality is perceived consistently across expertise levels, indicating <strong>objective quality dimensions</strong>.
            {agreedComponents.length > 0 && (
              <> Components with universal agreement ({agreedComponents.slice(0, 3).map(c => c.name).join(', ')}{agreedComponents.length > 3 ? '...' : ''}) 
              represent reliably validated strengths.</>
            )}
          </>
        ) : divergentCount > agreedCount ? (
          <>
            <strong>Notable expertise-based divergence</strong> detected ({divergentCount}/{totalComponents} components show disagreement, {agreementRate}% agreement rate).
            Different expertise levels apply distinct evaluation criteria.
            {divergentComponents.length > 0 && (
              <> Particularly {divergentComponents.slice(0, 2).map(c => c.name).join(', ')} show varying assessments.
              Consider <strong>expertise-weighted reporting</strong> or tier-specific improvement strategies.</>
            )}
          </>
        ) : (
          <>
            <strong>Balanced pattern</strong> with {agreedCount} consensus and {divergentCount} divergent components ({agreementRate}% agreement rate).
            Some quality dimensions are universally perceived while others depend on evaluator expertise.
          </>
        )}
      </InterpretationBox>
    </div>
  );
};

// ============================================================================
// N-GRAM VIEW WITH CHARTS
// ============================================================================

const NgramView = ({ ngramPatterns, ngramFilteredData, allComments, ngramComponentFilter, setNgramComponentFilter, ngramExpertiseFilter, setNgramExpertiseFilter, components }) => (
  <div className="space-y-6">
    <Alert className="bg-blue-50 border-blue-200">
      <Hash className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <p className="font-medium">Comment Length Analysis</p>
        <p className="text-sm mt-1">
          Examines how sentiment correlates with comment length. Longer comments often contain more detailed, substantive feedback.
        </p>
      </AlertDescription>
    </Alert>

    {/* Key Insights */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ngramPatterns.insights.map((insight, idx) => (
          <p key={idx} className="text-sm text-gray-700 mb-2" dangerouslySetInnerHTML={{ 
            __html: insight.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
          }} />
        ))}
      </CardContent>
    </Card>

    {/* Length Sentiment Chart */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sentiment by Comment Length</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ngramPatterns.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} name="Positive" />
            <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} name="Neutral" />
            <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} name="Critical" />
          </BarChart>
        </ResponsiveContainer>
        <InterpretationBox type="blue" title="Length-Sentiment Correlation">
          {(() => {
            const mp = ngramPatterns.mostPositiveLength;
            const mn = ngramPatterns.mostNegativeLength;
            if (mp && mn && mp.key !== mn.key) {
              return `**${mp.label}** comments are most positive (${(mp.ratio * 100).toFixed(0)}%), while **${mn.label}** contain most critical feedback (${(mn.ratio * 100).toFixed(0)}%). This pattern ${mp.key === 'detailed' || mp.key === 'extensive' ? 'suggests engaged users who elaborate tend to be more satisfied' : 'indicates brief feedback tends to be more positive'}.`;
            }
            return 'Sentiment is relatively consistent across comment lengths.';
          })()}
        </InterpretationBox>
      </CardContent>
    </Card>

    {/* Filters */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-gray-500">Component</label>
            <select value={ngramComponentFilter} onChange={e => setNgramComponentFilter(e.target.value)}
              className="block border rounded px-3 py-1.5 text-sm mt-1">
              <option value="all">All Components</option>
              {components.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Expertise Level</label>
            <select value={ngramExpertiseFilter} onChange={e => setNgramExpertiseFilter(e.target.value)}
              className="block border rounded px-3 py-1.5 text-sm mt-1">
              <option value="all">All Levels</option>
              <option value="expert">Expert</option>
              <option value="advanced">Advanced</option>
              <option value="intermediate">Intermediate</option>
              <option value="basic">Basic</option>
            </select>
          </div>
          {(ngramComponentFilter !== 'all' || ngramExpertiseFilter !== 'all') && ngramFilteredData && (
            <div className="flex items-end">
              <div className="px-4 py-2 bg-blue-50 rounded">
                <span className="text-sm text-blue-600">
                  Filtered: {ngramFilteredData.total} comments | 
                  {(ngramFilteredData.positiveRatio * 100).toFixed(0)}% pos, {(ngramFilteredData.negativeRatio * 100).toFixed(0)}% neg
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Length Category Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(ngramPatterns.categories).map(([key, data]) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{data.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 mb-2">{data.total}</div>
            
            {data.total > 0 && (
              <>
                <div className="flex h-3 rounded overflow-hidden mb-2">
                  <div style={{ width: `${data.positiveRatio * 100}%` }} className="bg-green-500" />
                  <div style={{ width: `${data.neutralRatio * 100}%` }} className="bg-yellow-500" />
                  <div style={{ width: `${data.negativeRatio * 100}%` }} className="bg-red-500" />
                </div>
                
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-green-600">{(data.positiveRatio * 100).toFixed(0)}%</span>
                  <span className="text-red-600">{(data.negativeRatio * 100).toFixed(0)}%</span>
                </div>

                <div className="text-center p-2 bg-gray-50 rounded mb-3">
                  <span className="text-sm font-medium">Avg: {(data.avgScore * 100).toFixed(0)}%</span>
                </div>

                <p className="text-xs text-gray-600">
                  {data.positiveRatio >= 0.6 ? 'Strong positive sentiment' :
                   data.negativeRatio >= 0.4 ? 'Critical feedback dominates' :
                   `Balanced: ${(data.positiveRatio * 100).toFixed(0)}% pos, ${(data.negativeRatio * 100).toFixed(0)}% neg`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Standard N-gram Histogram */}
    <NgramSentimentHistogram comments={allComments} />
  </div>
);

// ============================================================================
// THEMES VIEW WITH FREQUENCY CHART
// ============================================================================

const ThemesView = ({ themes, themeAnalysis, expandedThemes, setExpandedThemes }) => (
  <div className="space-y-6">
    <Alert className="bg-purple-50 border-purple-200">
      <Lightbulb className="h-4 w-4 text-purple-600" />
      <AlertDescription>
        Themes are automatically extracted from feedback keywords. Each theme shows related components, sentiment distribution, and frequency.
      </AlertDescription>
    </Alert>

    {/* Theme Frequency Chart (RESTORED) */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Theme Frequency Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={themeAnalysis.chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="theme" type="category" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} name="Positive" />
            <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} name="Neutral" />
            <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} name="Critical" />
          </BarChart>
        </ResponsiveContainer>
        <InterpretationBox type="purple" title="Theme Analysis">
          {(() => {
            const topTheme = themeAnalysis.chartData[0];
            const mostPositiveTheme = [...themeAnalysis.chartData].sort((a, b) => 
              parseInt(b.positivePercent) - parseInt(a.positivePercent)
            )[0];
            return `**"${topTheme?.theme}"** is the most discussed theme (${topTheme?.count} mentions). ` +
              `**"${mostPositiveTheme?.theme}"** has highest positive sentiment (${mostPositiveTheme?.positivePercent}% positive).`;
          })()}
        </InterpretationBox>
      </CardContent>
    </Card>

    {/* Individual Theme Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {themes.sorted.map((theme, idx) => {
        const isExpanded = expandedThemes[theme.theme];
        const themeComments = themes.comments[theme.theme] || [];
        const freqData = themeAnalysis.frequency[theme.theme];
        
        let positive = 0, negative = 0;
        themeComments.forEach(c => {
          const s = analyzeSentiment(c.text);
          if (categorizeSentiment(s.sentiment) === 'positive') positive++;
          if (categorizeSentiment(s.sentiment) === 'negative') negative++;
        });

        return (
          <Card key={idx} className="overflow-hidden">
            <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedThemes(prev => ({ ...prev, [theme.theme]: !prev[theme.theme] }))}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <h3 className="font-semibold text-lg">{theme.theme}</h3>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{theme.count} ({theme.percentage}%)</span>
              </div>

              <div className="flex h-2 rounded overflow-hidden mb-3">
                <div style={{ width: `${(positive / themeComments.length) * 100}%` }} className="bg-green-500" />
                <div style={{ width: `${((themeComments.length - positive - negative) / themeComments.length) * 100}%` }} className="bg-yellow-500" />
                <div style={{ width: `${(negative / themeComments.length) * 100}%` }} className="bg-red-500" />
              </div>

              {freqData?.components && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {freqData.components.slice(0, 3).map(comp => (
                    <span key={comp.key} className="px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: comp.color }}>
                      {comp.name} ({comp.count})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t p-4 bg-gray-50">
                {/* Mini chart for this theme */}
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={[{
                      name: theme.theme,
                      positive: freqData?.sentiments.positive || 0,
                      neutral: freqData?.sentiments.neutral || 0,
                      negative: freqData?.sentiments.negative || 0
                    }]}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Bar dataKey="positive" fill={SENTIMENT_COLORS.positive} />
                      <Bar dataKey="neutral" fill={SENTIMENT_COLORS.neutral} />
                      <Bar dataKey="negative" fill={SENTIMENT_COLORS.negative} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {themeComments.slice(0, 10).map((c, i) => {
                    const s = analyzeSentiment(c.text);
                    const sLabel = getSentimentLabel(s.sentiment);
                    return (
                      <div key={i} className="p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: c.componentColor }}>{c.componentName}</span>
                          <span>{c.subfield}</span>
                          <span className="ml-auto">{sLabel.emoji}</span>
                        </div>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    );
                  })}
                  {themeComments.length > 10 && <p className="text-xs text-gray-500 text-center">+{themeComments.length - 10} more</p>}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  </div>
);

// ============================================================================
// COMMENTS VIEW
// ============================================================================

const CommentsView = ({ comments, selectedComponent, setSelectedComponent, selectedSentiment, setSelectedSentiment, expertiseFilter, setExpertiseFilter, searchQuery, setSearchQuery, groupBy, setGroupBy, selectedIds, onToggleSelection, showSelectionMode, setShowSelectionMode }) => {
  const comps = getAllComponents();
  
  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups = {};
    comments.forEach(c => {
      let key, label, color;
      if (groupBy === 'component') { key = c.component; label = c.componentName; color = c.componentColor; }
      else if (groupBy === 'expertise') { key = c.expertiseClass?.tier || 'unknown'; label = key.charAt(0).toUpperCase() + key.slice(1); color = EXPERTISE_TIER_COLORS[key]; }
      else if (groupBy === 'sentiment') { const s = analyzeSentiment(c.text); key = categorizeSentiment(s.sentiment); label = key.charAt(0).toUpperCase() + key.slice(1); color = SENTIMENT_COLORS[key]; }
      else { key = 'all'; label = 'All'; }
      
      if (!groups[key]) groups[key] = { label, color, comments: [], sentiments: { positive: 0, neutral: 0, negative: 0 } };
      groups[key].comments.push(c);
      const s = analyzeSentiment(c.text);
      groups[key].sentiments[categorizeSentiment(s.sentiment)]++;
    });
    return groups;
  }, [comments, groupBy]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant={showSelectionMode ? 'default' : 'outline'} size="sm" onClick={() => setShowSelectionMode(!showSelectionMode)}>
              <CheckSquare className="h-4 w-4 mr-2" />{showSelectionMode ? 'Selection On' : 'Select'}
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <select value={selectedComponent} onChange={e => setSelectedComponent(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
              <option value="all">All Components</option>
              {comps.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
            <select value={selectedSentiment} onChange={e => setSelectedSentiment(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Critical</option>
            </select>
            <select value={expertiseFilter} onChange={e => setExpertiseFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
              <option value="all">All Expertise</option>
              <option value="expert">Expert</option>
              <option value="advanced">Advanced</option>
              <option value="intermediate">Intermediate</option>
              <option value="basic">Basic</option>
            </select>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
              <option value="none">No Grouping</option>
              <option value="component">By Component</option>
              <option value="expertise">By Expertise</option>
              <option value="sentiment">By Sentiment</option>
            </select>
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..." className="border rounded px-3 py-1.5 pl-9 text-sm w-full" />
            </div>
            <span className="text-sm text-gray-500">{comments.length} comments</span>
          </div>
        </CardContent>
      </Card>

      {grouped ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, group]) => {
            const total = group.comments.length;
            const posRatio = group.sentiments.positive / total;
            const negRatio = group.sentiments.negative / total;
            
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />}
                      {group.label}
                    </CardTitle>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">{group.sentiments.positive}</span>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">{group.sentiments.neutral}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">{group.sentiments.negative}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {posRatio >= 0.6 ? `Strong positive (${(posRatio * 100).toFixed(0)}%)` :
                     negRatio >= 0.4 ? `Critical feedback (${(negRatio * 100).toFixed(0)}%)` :
                     `Mixed: ${(posRatio * 100).toFixed(0)}% pos, ${(negRatio * 100).toFixed(0)}% neg`}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {group.comments.slice(0, 15).map((c, i) => (
                      <CommentRow key={i} comment={c} isSelected={selectedIds.includes(c.id)} showSelection={showSelectionMode} onToggle={() => onToggleSelection(c.id)} />
                    ))}
                    {group.comments.length > 15 && <p className="text-center text-gray-500 text-sm">+{group.comments.length - 15} more</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {comments.slice(0, 100).map((c, i) => (
                <CommentRow key={i} comment={c} isSelected={selectedIds.includes(c.id)} showSelection={showSelectionMode} onToggle={() => onToggleSelection(c.id)} />
              ))}
              {comments.length > 100 && <p className="text-center text-gray-500 py-4">Showing 100 of {comments.length}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const CommentRow = ({ comment, isSelected, showSelection, onToggle }) => {
  const s = analyzeSentiment(comment.text);
  const sLabel = getSentimentLabel(s.sentiment);
  const exp = comment.expertiseClass || classifyExpertise(comment.userInfo);

  return (
    <div className={`p-3 rounded-lg border transition-colors cursor-pointer ${showSelection ? (isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50') : 'bg-gray-50'}`}
      onClick={() => showSelection && onToggle()}>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        {showSelection && (isSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-gray-400" />)}
        <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: comment.componentColor }}>{comment.componentName}</span>
        <span>{comment.subfield}</span>
        <span className={`px-1.5 py-0.5 rounded ${exp.tier === 'expert' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>
          {exp.tier === 'expert' && '★ '}{exp.tier}
        </span>
        {comment.rating && <span>Rating: {comment.rating}/5</span>}
        <span className="ml-auto text-lg">{sLabel.emoji}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs ${s.normalizedScore > 0.6 ? 'bg-green-100 text-green-700' : s.normalizedScore < 0.4 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {(s.normalizedScore * 100).toFixed(0)}%
        </span>
      </div>
      <p className="text-sm text-gray-800">{comment.text}</p>
    </div>
  );
};

export default UserFeedbackAnalysis;