// src/components/dashboard/views/OverviewMetrics.jsx
// REDESIGNED v11 - Fixed quality scores, role distribution, rating format

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  Users, Award, Target, 
  AlertCircle, FileText,
  Star, ChevronDown, ChevronUp,
  ArrowUpRight, Database, GitCompare, Layers, Info
} from 'lucide-react';

// Proper import
import LLMvsORKGStats from './LLMvsORKGStats';

// Services
import integratedDataService from '../../../services/IntegratedDataService';

/**
 * OverviewMetrics Component - v11
 * 
 * FIXES:
 * - Quality scores extracted from qualityScores path (different from accuracy)
 * - Expertise shows by role (PhD Student, Master, etc.) not just level
 * - User rating shows both % and (/5) format
 */

// ============================================
// MINI BAR CHART
// ============================================
const MiniBarChart = ({ data, height = 32, colorFn }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value), 0.01);
  
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div 
            className={`w-full rounded-t ${colorFn(item.value)} transition-all`}
            style={{ height: Math.max((item.value / maxVal) * height, 2) }}
            title={`${item.label}: ${(item.value * 100).toFixed(0)}%`}
          />
          <span className="text-[7px] text-gray-400 mt-0.5 truncate w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// MINI DONUT
// ============================================
const MiniDonut = ({ value, size = 44, color = '#3b82f6' }) => {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 1);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle 
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round" className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-gray-700">{(value * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

// ============================================
// COLLAPSIBLE CARD
// ============================================
const CollapsibleCard = ({ title, icon: Icon, badge, badgeColor = 'bg-blue-100 text-blue-700', 
  children, defaultExpanded = true, linkTo, onNavigate, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <Card className={`overflow-hidden border border-gray-200 ${className}`}>
      <div 
        className="flex items-center justify-between px-3 py-2 bg-gray-50/50 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          <h3 className="font-medium text-gray-800 text-sm">{title}</h3>
          {badge && <Badge className={`text-[9px] px-1.5 py-0 ${badgeColor}`}>{badge}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {linkTo && (
            <button
              className="p-1 hover:bg-gray-200 rounded"
              onClick={(e) => { e.stopPropagation(); onNavigate?.(linkTo); }}
              title="View details"
            >
              <ArrowUpRight className="h-3 w-3 text-blue-500" />
            </button>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      {isExpanded && <div className="px-3 py-2">{children}</div>}
    </Card>
  );
};

// ============================================
// INFO BOX
// ============================================
const InfoBox = ({ color = 'blue', children }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };
  return (
    <div className={`flex items-start gap-2 p-2 rounded border text-[10px] mb-2 ${colors[color]}`}>
      <Info className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-70" />
      <div>{children}</div>
    </div>
  );
};

// ============================================
// SCORE TABLE - WITH USER RATING AS % AND /5
// ============================================
const ScoreTable = ({ data, componentLabels, type = 'accuracy' }) => {
  const formatPct = (v) => v !== null && v !== undefined && !isNaN(v) ? `${(v * 100).toFixed(1)}%` : '—';
  const formatStd = (v) => v !== null && v !== undefined && !isNaN(v) ? `±${(v * 100).toFixed(1)}%` : '—';
  
  // Format user rating as both % and /5
  const formatUserRating = (v) => {
    if (v === null || v === undefined || isNaN(v)) return null;
    const pct = (v * 100).toFixed(1);
    const outOf5 = (v * 5).toFixed(1);
    return { pct, outOf5 };
  };
  
  const getBarColor = (score) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    if (score >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getBadge = (score) => {
    if (score === null || isNaN(score)) return { label: '—', color: 'bg-gray-100 text-gray-400' };
    if (score >= 0.8) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (score >= 0.6) return { label: 'Good', color: 'bg-yellow-100 text-yellow-700' };
    if (score >= 0.4) return { label: 'Fair', color: 'bg-orange-100 text-orange-700' };
    return { label: 'Poor', color: 'bg-red-100 text-red-700' };
  };

  const sortedData = Object.entries(data)
    .filter(([, d]) => d !== null)
    .sort(([, a], [, b]) => (b.finalScore || 0) - (a.finalScore || 0));

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-3 text-gray-400">
        <AlertCircle className="h-5 w-5 mx-auto mb-1 opacity-50" />
        <p className="text-[10px]">No {type} data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto text-[10px]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="text-left py-1.5 px-1 font-medium text-gray-500">Component</th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">Auto</th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">
              <span className="flex items-center justify-center gap-0.5">
                <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                User Rating
              </span>
            </th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">Final</th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">Std</th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">Min</th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">Max</th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">n</th>
            <th className="text-center py-1.5 px-1 font-medium text-gray-500">Grade</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(([comp, d]) => {
            const badge = getBadge(d.finalScore);
            const userRating = formatUserRating(d.userRating);
            return (
              <tr key={comp} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-1.5 px-1 font-medium text-gray-700 whitespace-nowrap">{componentLabels[comp] || comp}</td>
                <td className="text-center py-1.5 px-1 font-mono text-blue-600">{formatPct(d.automated)}</td>
                <td className="text-center py-1.5 px-1">
                  {userRating ? (
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-yellow-600">{userRating.pct}%</span>
                      <span className="text-[8px] text-gray-400">({userRating.outOf5}/5)</span>
                    </div>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="text-center py-1.5 px-1">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${getBarColor(d.finalScore)}`} style={{ width: `${(d.finalScore || 0) * 100}%` }} />
                    </div>
                    <span className="font-mono font-medium text-gray-700">{formatPct(d.finalScore)}</span>
                  </div>
                </td>
                <td className="text-center py-1.5 px-1 font-mono text-gray-400">{formatStd(d.std)}</td>
                <td className="text-center py-1.5 px-1 font-mono text-gray-400">{formatPct(d.min)}</td>
                <td className="text-center py-1.5 px-1 font-mono text-gray-400">{formatPct(d.max)}</td>
                <td className="text-center py-1.5 px-1 text-gray-500">{d.count || 0}</td>
                <td className="text-center py-1.5 px-1">
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 ${badge.color}`}>{badge.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// HELPER: Normalize DOI
// ============================================
const normalizeDOI = (doi) => {
  if (!doi) return null;
  return doi.toString().toLowerCase().trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
};

// ============================================
// HELPER: Extract DOI from paper object
// ============================================
const extractDOI = (paper) => {
  const doi = paper.doi || 
              paper.groundTruth?.doi ||
              paper.systemAnalysis?.metadata?.doi ||
              paper.metadata?.doi ||
              null;
  return normalizeDOI(doi);
};

// ============================================
// MAIN COMPONENT
// ============================================
const OverviewMetrics = ({ data, aggregatedData, integratedData: propIntegratedData, onTabChange }) => {
  const [integratedPapers, setIntegratedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const handleNavigate = (tabName) => onTabChange?.(tabName);

  // Load integrated data
  useEffect(() => {
    const loadData = async () => {
      try {
        let papers = [];
        
        if (Array.isArray(propIntegratedData) && propIntegratedData.length > 0) {
          papers = propIntegratedData;
        } else if (propIntegratedData?.papers?.length > 0) {
          papers = propIntegratedData.papers;
        } else {
          const loadedData = await integratedDataService.loadAllData();
          if (loadedData?.papers?.length > 0) {
            papers = loadedData.papers;
          }
        }
        
        setIntegratedPapers(papers);
      } catch (error) {
        console.error('📊 [v11] Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [propIntegratedData]);

  const componentLabels = {
    metadata: 'Metadata',
    research_field: 'Research Field',
    research_problem: 'Research Problem',
    template: 'Template',
    content: 'Content'
  };

  const componentLabelsShort = {
    metadata: 'Meta',
    research_field: 'Field',
    research_problem: 'Problem',
    template: 'Templ',
    content: 'Content'
  };

  // ============================================
  // PAPER STATS - GROUP BY DOI
  // ============================================
  const paperStats = useMemo(() => {
    const totalEvaluations = integratedPapers.length;
    
    if (totalEvaluations === 0) {
      return {
        uniquePapers: aggregatedData?.globalStats?.totalPapers || 0,
        totalEvaluations: aggregatedData?.globalStats?.totalEvaluations || 0,
        papersWithMultiple: 0,
        totalEvaluators: aggregatedData?.globalStats?.totalEvaluators || 0
      };
    }
    
    const byDOI = new Map();
    integratedPapers.forEach((paper, index) => {
      const doi = extractDOI(paper);
      const key = doi || `unknown_${index}`;
      if (!byDOI.has(key)) byDOI.set(key, []);
      byDOI.get(key).push(paper);
    });
    
    const uniquePapers = byDOI.size;
    let papersWithMultiple = 0;
    byDOI.forEach((evaluations) => {
      if (evaluations.length > 1) papersWithMultiple++;
    });
    
    return {
      uniquePapers,
      totalEvaluations,
      papersWithMultiple,
      totalEvaluators: aggregatedData?.globalStats?.totalEvaluators || 0
    };
  }, [integratedPapers, aggregatedData]);
  window.aggregatedData = aggregatedData;
window.integratedPapers = integratedPapers;


  // ============================================
  // GLOBAL STATS WITH ROLE DISTRIBUTION
  // ============================================
  const globalStats = useMemo(() => {
    const gs = aggregatedData?.globalStats;
    const dist = gs?.expertise?.distribution || {};
    
    return {
      totalEvaluators: gs?.totalEvaluators || 0,
      avgExpertise: gs?.expertise?.mean || 1.0,
      expertiseDistribution: {
        byLevel: dist.byLevel || {},
        byRole: dist.byRole || {}
      }
    };
  }, [aggregatedData]);

  // ============================================
  // COMPONENT SCORES - ACCURACY
  // ============================================
  const accuracyScores = useMemo(() => {
    if (!aggregatedData?.papers) return {};
    
    const papers = Object.values(aggregatedData.papers);
    const componentNames = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const result = {};
    
    componentNames.forEach(compName => {
      const scores = [];
      const userRatings = [];
      
      papers.forEach(paper => {
        const comp = paper[compName];
        if (!comp) return;
        
        // ACCURACY: Get from accuracyScores.mean or scores.mean
        const acc = comp.accuracyScores?.mean ?? comp.scores?.mean;
        if (acc !== undefined && !isNaN(acc)) scores.push(acc);
        
        // User rating
        const ur = comp.userRatings?.mean;
        if (ur !== undefined && !isNaN(ur)) userRatings.push(ur);
      });
      
      if (scores.length > 0) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const std = scores.length > 1 
          ? Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length) 
          : 0;
        const userMean = userRatings.length > 0 ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : null;
        const finalScore = userMean !== null ? mean * 0.6 + userMean * 0.4 : mean;
        
        result[compName] = {
          automated: mean,
          userRating: userMean,
          finalScore,
          std,
          min: Math.min(...scores),
          max: Math.max(...scores),
          count: scores.length
        };
      }
    });
    
    return result;
  }, [aggregatedData]);

  // ============================================
  // COMPONENT SCORES - QUALITY (DIFFERENT PATH!)
  // ============================================
  const qualityScores = useMemo(() => {
    if (!aggregatedData?.papers) return {};
    
    const papers = Object.values(aggregatedData.papers);
    const componentNames = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
    const result = {};
    
    console.log('📊 [v11 Quality] Processing', papers.length, 'papers');
    
    componentNames.forEach(compName => {
      const scores = [];
      const userRatings = [];
      
      papers.forEach(paper => {
        const comp = paper[compName];
        if (!comp) return;
        
        // QUALITY: Get from qualityScores.mean specifically
        // This is different from accuracy!
        let qual = null;
        
        // Primary path: qualityScores.mean
        if (comp.qualityScores?.mean !== undefined && !isNaN(comp.qualityScores.mean)) {
          qual = comp.qualityScores.mean;
        }
        
        if (qual !== null && qual > 0) {
          scores.push(qual);
        }
        
        // User rating (same as accuracy)
        const ur = comp.userRatings?.mean;
        if (ur !== undefined && !isNaN(ur)) userRatings.push(ur);
      });
      
      console.log(`📊 [v11 Quality] ${compName}: found ${scores.length} scores`, scores.slice(0, 3));
      
      if (scores.length > 0) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const std = scores.length > 1 
          ? Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length) 
          : 0;
        const userMean = userRatings.length > 0 ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : null;
        const finalScore = userMean !== null ? mean * 0.6 + userMean * 0.4 : mean;
        
        result[compName] = {
          automated: mean,
          userRating: userMean,
          finalScore,
          std,
          min: Math.min(...scores),
          max: Math.max(...scores),
          count: scores.length
        };
      }
    });
    
    console.log('📊 [v11 Quality] Final result:', result);
    return result;
  }, [aggregatedData]);

  // Chart data
  const getBarColor = (v) => v >= 0.8 ? 'bg-green-400' : v >= 0.6 ? 'bg-yellow-400' : v >= 0.4 ? 'bg-orange-400' : 'bg-red-400';
  
  const accuracyChartData = Object.entries(accuracyScores).map(([name, d]) => ({
    label: componentLabelsShort[name], value: d.finalScore
  }));
  
  const qualityChartData = Object.entries(qualityScores).map(([name, d]) => ({
    label: componentLabelsShort[name], value: d.finalScore
  }));

  const avgAccuracy = useMemo(() => {
    const s = Object.values(accuracyScores);
    return s.length > 0 ? s.reduce((a, b) => a + b.finalScore, 0) / s.length : 0;
  }, [accuracyScores]);

  const avgQuality = useMemo(() => {
    const s = Object.values(qualityScores);
    return s.length > 0 ? s.reduce((a, b) => a + b.finalScore, 0) / s.length : 0;
  }, [qualityScores]);

  // ============================================
  // RENDER
  // ============================================
  if (!aggregatedData && integratedPapers.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No data available</p>
        </div>
      </Card>
    );
  }

  // Role colors
  const roleColors = {
    'PhD Student': 'bg-blue-400',
    'Master Student': 'bg-green-400',
    'Researcher': 'bg-purple-400',
    'Research Assistant': 'bg-yellow-400',
    'PostDoc': 'bg-pink-400',
    'Professor': 'bg-red-400',
    'Other': 'bg-gray-400'
  };
  

  return (
    <div className="space-y-3">
      {/* METHODOLOGY DISCLAIMER - NO AI/LLM INVOLVEMENT */}
      <div className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <Database className="h-5 w-5 mt-0.5 text-emerald-600 flex-shrink-0" />
        <div className="text-[11px] text-emerald-800 leading-relaxed">
          <strong>Transparency Notice:</strong> All metrics, analyses, interpretations, 
          statistical computations, and LaTeX-formatted findings in this dashboard are generated 
          <span className="font-medium text-emerald-900"> at runtime through deterministic algorithms and rule-based calculations</span>, 
          <span className="font-semibold text-emerald-900">not by any LLM or AI system</span>. 
          Any section that includes a collapsible <strong>"Research Findings"</strong> panel provides 
          interpretations derived purely from the underlying data.
        </div>
      </div>

      {/* ROW 1: KEY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="p-3 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <p className="text-[10px] text-blue-600 font-medium">Evaluations</p>
          <p className="text-xl font-bold text-blue-700">{paperStats.totalEvaluations}</p>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-green-50 to-white border-green-100">
          <p className="text-[10px] text-green-600 font-medium">Unique Papers</p>
          <p className="text-xl font-bold text-green-700">{paperStats.uniquePapers}</p>
          {paperStats.papersWithMultiple > 0 && (
            <p className="text-[9px] text-green-500">{paperStats.papersWithMultiple} with 2+ evals</p>
          )}
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <p className="text-[10px] text-purple-600 font-medium">Evaluators</p>
          <p className="text-xl font-bold text-purple-700">{globalStats.totalEvaluators}</p>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
          <p className="text-[10px] text-yellow-600 font-medium">Avg Expertise</p>
          <p className="text-xl font-bold text-yellow-700">{globalStats.avgExpertise.toFixed(2)}×</p>
        </Card>
      </div>

      {/* ROW 2: ACCURACY & QUALITY (2 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* ACCURACY */}
        <CollapsibleCard
          title="Accuracy"
          icon={Target}
          badge={`${(avgAccuracy * 100).toFixed(0)}% avg`}
          badgeColor="bg-blue-100 text-blue-700"
          linkTo="systemAccuracy"
          onNavigate={handleNavigate}
        >
          <InfoBox color="blue">
            <strong>Accuracy Score</strong> measures how well extracted values match ground truth.<br/>
            <span className="opacity-75">Formula: Final = (Automated × 60%) + (User Rating × 40%)</span>
          </InfoBox>
          
          {accuracyChartData.length > 0 && (
            <div className="mb-2">
              <MiniBarChart data={accuracyChartData} height={28} colorFn={getBarColor} />
            </div>
          )}
          <ScoreTable data={accuracyScores} componentLabels={componentLabels} type="accuracy" />
        </CollapsibleCard>

        {/* QUALITY */}
        <CollapsibleCard
          title="Quality"
          icon={Award}
          badge={avgQuality > 0 ? `${(avgQuality * 100).toFixed(0)}% avg` : null}
          badgeColor="bg-purple-100 text-purple-700"
          linkTo="dataQuality"
          onNavigate={handleNavigate}
        >
          <InfoBox color="purple">
            <strong>Quality Score</strong> measures completeness, consistency, and validity.<br/>
            <span className="opacity-75">Formula: Final = (Automated × 60%) + (User Rating × 40%)</span>
          </InfoBox>
          
          {qualityChartData.length > 0 && (
            <div className="mb-2">
              <MiniBarChart data={qualityChartData} height={28} colorFn={getBarColor} />
            </div>
          )}
          <ScoreTable data={qualityScores} componentLabels={componentLabels} type="quality" />
        </CollapsibleCard>
      </div>

      {/* ROW 3: EXPERTISE & AGREEMENT (2 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* EXPERTISE - BY ROLE */}
        <CollapsibleCard
          title="Evaluator Expertise"
          icon={Users}
          linkTo="expertise"
          onNavigate={handleNavigate}
        >
          <div className="space-y-2">
            {/* Average Expertise */}
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <MiniDonut value={globalStats.avgExpertise / 2} color="#22c55e" size={40} />
              <div>
                <p className="text-xs font-medium text-gray-700">Average Multiplier</p>
                <p className="text-lg font-bold text-green-600">{globalStats.avgExpertise.toFixed(2)}×</p>
              </div>
            </div>
            
            {/* Distribution by Role */}
            <div>
              <p className="text-[9px] text-gray-500 font-medium mb-1">Distribution by Role</p>
              <div className="space-y-1">
                {Object.entries(globalStats.expertiseDistribution.byRole || {})
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([role, count]) => {
                    const total = Object.values(globalStats.expertiseDistribution.byRole || {}).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    const color = roleColors[role] || 'bg-gray-400';
                    
                    return (
                      <div key={role} className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-600 w-24 truncate">{role}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-500 w-16 text-right">
                          {count} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* AGREEMENT */}
        <CollapsibleCard
          title="Agreement"
          icon={GitCompare}
          badge={paperStats.papersWithMultiple > 0 ? `${paperStats.papersWithMultiple} papers` : null}
          badgeColor="bg-indigo-100 text-indigo-700"
          linkTo="userAgreement"
          onNavigate={handleNavigate}
        >
          {paperStats.papersWithMultiple > 0 ? (
            <div className="flex items-center gap-3">
              <div className="text-center px-3">
                <p className="text-xl font-bold text-indigo-600">{paperStats.papersWithMultiple}</p>
                <p className="text-[9px] text-gray-500">w/ 2+ evals</p>
              </div>
              <div className="flex-1 text-[10px] text-gray-500">
                <p>Inter-rater reliability metrics available</p>
                <p className="text-[9px] mt-0.5 text-gray-400">Click arrow to view analysis</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <GitCompare className="h-5 w-5 mx-auto mb-1 text-gray-300" />
              <p className="text-[10px] text-gray-500">No multi-evaluator papers yet</p>
              <p className="text-[9px] text-gray-400">
                {paperStats.uniquePapers} papers, {paperStats.totalEvaluations} evaluations
              </p>
            </div>
          )}
        </CollapsibleCard>
      </div>

      {/* ROW 4: LLM VS ORKG */}
      {!loading && integratedPapers.length > 0 && (
        <CollapsibleCard
          title="Data Sources"
          icon={Layers}
          badge="LLM vs ORKG"
          badgeColor="bg-teal-100 text-teal-700"
          defaultExpanded={false}
          linkTo="groundTruthAnalytics"
          onNavigate={handleNavigate}
        >
          <LLMvsORKGStats integratedPapers={integratedPapers} />
        </CollapsibleCard>
      )}

      {loading && (
        <Card className="p-3 border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <div className="animate-spin h-3 w-3 border-2 border-teal-500 border-t-transparent rounded-full"></div>
            Loading...
          </div>
        </Card>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-center gap-3 text-[9px] text-gray-400 pt-1">
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-green-400 rounded"></span> ≥80%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-yellow-400 rounded"></span> 60-79%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-orange-400 rounded"></span> 40-59%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-red-400 rounded"></span> &lt;40%</span>
        <span className="mx-1">|</span>
        <span className="flex items-center gap-0.5">
          <Star className="h-2 w-2 text-yellow-500 fill-yellow-500" /> User Rating
        </span>
      </div>
    </div>
  );
};

export default OverviewMetrics;