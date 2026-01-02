// src/components/dashboard/ContentAnalysisDashboard.jsx

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle,
  FileText, Edit, Database, BarChart3, Link2, Info, HelpCircle,
  TrendingUp, Award, Calculator, AlertTriangle, Layers, Star,
  User, Users, PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, Area
} from 'recharts';
import { aggregateContentAnalysis } from '../../services/contentAnalysisAggregator';

/**
 * ContentAnalysisDashboard - UPDATED v4
 * 
 * COMPREHENSIVE FEATURES:
 * 1. Correct Final Score display in header (not coverage)
 * 2. User ratings integration and display
 * 3. Paper-level analysis view
 * 4. Interactive charts (bar, pie, radar)
 * 5. Fixed correlation analysis for edge cases
 * 6. Score calculation breakdown showing user + automated weights
 */

const CHART_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#94a3b8', '#8b5cf6', '#3b82f6'];

const ContentAnalysisDashboard = ({ integratedData, userWeight = 1.0 }) => {
  const [expandedSections, setExpandedSections] = useState({
    finalScore: true,
    userRatings: true,
    coverage: false,
    granularity: false,
    edits: false,
    evidence: false,
    confidence: false,
    valueTypes: false,
    correlations: false,
    paperAnalysis: false,
    charts: true
  });
  
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);

  // Aggregate content analysis
  const analysis = useMemo(() => {
    return aggregateContentAnalysis(integratedData, { userWeight });
  }, [integratedData, userWeight]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;
  
  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score) => {
    if (score >= 0.8) return 'bg-green-50 border-green-200';
    if (score >= 0.6) return 'bg-yellow-50 border-yellow-200';
    if (score >= 0.4) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreBadge = (score) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    if (score >= 0.4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Tooltip component
  const ExplanationTooltip = ({ explanationKey, explanation }) => {
    const tooltipRef = useRef(null);
    const isOpen = activeTooltip === explanationKey;
    
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
          setActiveTooltip(null);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);
    
    const handleToggle = (e) => {
      e.stopPropagation();
      setActiveTooltip(isOpen ? null : explanationKey);
    };
    
    const renderInterpretation = (interpretation) => {
      if (!interpretation) return null;
      if (typeof interpretation === 'string') {
        return <div className="text-gray-600 bg-gray-50 p-2 rounded">{interpretation}</div>;
      }
      if (typeof interpretation === 'object') {
        return (
          <div className="space-y-1">
            {Object.entries(interpretation).map(([level, desc]) => (
              <div key={level} className="flex gap-2 text-xs">
                <span className={`font-medium capitalize min-w-16 ${
                  level === 'high' || level === 'positive' ? 'text-green-600' : 
                  level === 'medium' || level === 'neutral' ? 'text-yellow-600' : 'text-red-600'
                }`}>{level}:</span>
                <span className="text-gray-600">{desc}</span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };
    
    return (
      <div className="relative inline-block" ref={tooltipRef}>
        <button onClick={handleToggle} className="text-gray-400 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50">
          <HelpCircle className="h-4 w-4" />
        </button>
        {isOpen && (
          <div className="absolute z-50 left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border p-4 text-xs" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{explanation.title}</h4>
              <button onClick={handleToggle} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <p className="text-gray-600 mb-3">{explanation.description}</p>
            {explanation.formula && (
              <div className="bg-blue-50 p-2 rounded text-blue-800 font-mono text-xs mb-3 border border-blue-100">
                {explanation.formula}
              </div>
            )}
            {explanation.interpretation && (
              <div className="mb-2">
                <div className="font-medium text-gray-700 mb-1">Interpretation:</div>
                {renderInterpretation(explanation.interpretation)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Section Header
  const SectionHeader = ({ title, icon: Icon, score, isExpanded, onClick, badge, explanationKey }) => (
    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50" onClick={onClick}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-600" />
        <span className="font-medium">{title}</span>
        {explanationKey && analysis.explanations[explanationKey] && (
          <ExplanationTooltip explanationKey={explanationKey} explanation={analysis.explanations[explanationKey]} />
        )}
        {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
      </div>
      <div className="flex items-center gap-2">
        {score !== undefined && <Badge className={getScoreBadge(score)}>{formatPercent(score)}</Badge>}
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
    </div>
  );

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-lg text-xs">
          <p className="font-medium">{payload[0]?.payload?.fullName || label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name.includes('rating') ? '' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Summary Header - FIXED: Shows Final Score, not Coverage */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Content Analysis Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-blue-600">Papers</div>
            <div className="text-xl font-bold text-blue-700">{analysis.summary.totalPapers}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-purple-600">Properties</div>
            <div className="text-xl font-bold text-purple-700">{analysis.summary.totalPropertyValues}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-green-600">Coverage</div>
            <div className="text-xl font-bold text-green-700">{formatPercent(analysis.coverage.overall.coverageRate)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-xs text-orange-600">Evidence</div>
            <div className="text-xl font-bold text-orange-700">{formatPercent(analysis.evidence.overall.evidenceRate)}</div>
          </div>
          {analysis.userRatings.available && (
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-xs text-yellow-600">User Rating</div>
              <div className="text-xl font-bold text-yellow-700">
                {analysis.userRatings.overall.mean?.toFixed(1)}/5
              </div>
            </div>
          )}
          <div className={`p-3 rounded border-2 ${getScoreBgColor(analysis.finalScore.weightedScore)}`}>
            <div className="text-xs text-gray-600 font-medium">Final Score</div>
            <div className={`text-xl font-bold ${getScoreColor(analysis.finalScore.weightedScore)}`}>
              {formatPercent(analysis.finalScore.weightedScore)}
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Section - with Score Explanation */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Visual Analysis"
          icon={PieChartIcon}
          isExpanded={expandedSections.charts}
          onClick={() => toggleSection('charts')}
          badge={`Automated: ${formatPercent(analysis.finalScore.automatedScore)} | Final: ${formatPercent(analysis.finalScore.weightedScore)}`}
        />
        {expandedSections.charts && analysis.chartData && (
          <div className="p-4 border-t space-y-6">
            {/* Score Explanation Card - NEW */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                Score Calculation Explanation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Automated Score */}
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Automated Metrics (60%)</div>
                  <div className="text-2xl font-bold text-blue-600">{formatPercent(analysis.finalScore.automatedScore)}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    <div className="flex justify-between"><span>Coverage</span><span>×0.20</span></div>
                    <div className="flex justify-between"><span>Evidence</span><span>×0.15</span></div>
                    <div className="flex justify-between"><span>Edits</span><span>×0.10</span></div>
                    <div className="flex justify-between"><span>Granularity</span><span>×0.10</span></div>
                    <div className="flex justify-between"><span>Confidence</span><span>×0.05</span></div>
                  </div>
                </div>
                
                {/* User Rating */}
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    User Rating (40%)
                  </div>
                  {analysis.userRatings.available ? (
                    <>
                      <div className="text-2xl font-bold text-yellow-600">
                        {formatPercent(analysis.finalScore.userRatingScore || 0)}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <span>Average: {analysis.userRatings.overall.mean?.toFixed(2)}/5</span>
                          <div className="flex">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`h-2 w-2 ${
                                i <= Math.round(analysis.userRatings.overall.mean || 0)
                                  ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                              }`} />
                            ))}
                          </div>
                        </div>
                        <div>{analysis.userRatings.papersWithRatings} papers rated</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400 mt-2">
                      No user ratings available
                      <div className="text-xs">(Using automated only)</div>
                    </div>
                  )}
                </div>
                
                {/* Final Score */}
                <div className={`p-3 rounded border-2 ${getScoreBgColor(analysis.finalScore.weightedScore)}`}>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Final Weighted Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.finalScore.weightedScore)}`}>
                    {formatPercent(analysis.finalScore.weightedScore)}
                  </div>
                  <div className="mt-2">
                    <Badge className={getScoreBadge(analysis.finalScore.weightedScore)}>
                      {analysis.finalScore.qualityLevel}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {analysis.finalScore.calculationMethod}
                  </div>
                </div>
              </div>
              
              {/* Formula Display */}
              <div className="mt-3 p-2 bg-white rounded border text-xs font-mono text-gray-600">
                Final = Automated ({formatPercent(analysis.finalScore.automatedScore)}) 
                {analysis.userRatings.available && (
                  <> + User ({formatPercent(analysis.finalScore.userRatingScore || 0)} × 0.40)</>
                )}
                {' = '}<span className="font-bold text-blue-600">{formatPercent(analysis.finalScore.weightedScore)}</span>
              </div>
            </div>
            
            {/* Score Radar Chart */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="text-sm font-medium mb-3">Quality Dimensions Radar</h4>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <RadarChart data={analysis.chartData.scoreRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Score %" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coverage by Paper Bar Chart */}
              {analysis.chartData.coverageByPaper?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium mb-3">Coverage & Evidence by Paper</h4>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={analysis.chartData.coverageByPaper.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="coverage" name="Coverage %" fill="#3b82f6" />
                        <Bar dataKey="evidence" name="Evidence %" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Granularity Pie Chart */}
              {analysis.chartData.granularityPie?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium mb-3">Granularity Distribution</h4>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analysis.chartData.granularityPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {analysis.chartData.granularityPie.map((entry, index) => (
                            <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Confidence Pie Chart */}
              {analysis.chartData.confidencePie?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium mb-3">Confidence Distribution</h4>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analysis.chartData.confidencePie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {analysis.chartData.confidencePie.map((entry, index) => (
                            <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Evidence by Section */}
              {analysis.chartData.evidenceBySectionBar?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium mb-3">Evidence by Paper Section</h4>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={analysis.chartData.evidenceBySectionBar} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Citations" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* User Ratings by Paper */}
            {analysis.chartData.userRatingsByPaper?.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded">
                <h4 className="text-sm font-medium mb-3">User Ratings by Paper</h4>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={analysis.chartData.userRatingsByPaper}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis yAxisId="left" domain={[1, 5]} tick={{ fontSize: 10 }} label={{ value: 'Rating', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 2]} tick={{ fontSize: 10 }} label={{ value: 'Expertise', angle: 90, position: 'insideRight', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar yAxisId="left" dataKey="rating" name="User Rating (1-5)" fill="#eab308" />
                      <Line yAxisId="right" dataKey="expertiseMultiplier" name="Expertise Multiplier" stroke="#8b5cf6" strokeWidth={2} dot />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Final Score Card - Enhanced with User Rating */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Final Weighted Score"
          icon={Award}
          score={analysis.finalScore.weightedScore}
          isExpanded={expandedSections.finalScore}
          onClick={() => toggleSection('finalScore')}
        />
        {expandedSections.finalScore && (
          <div className="p-4 border-t space-y-4">
            {/* Quality Level */}
            <div className={`p-4 rounded-lg border ${getScoreBgColor(analysis.finalScore.weightedScore)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold capitalize">{analysis.finalScore.qualityLevel} Quality</h4>
                  <p className="text-sm text-gray-600 mt-1">{analysis.finalScore.qualityDescription}</p>
                  <p className="text-xs text-gray-500 mt-2 italic">{analysis.finalScore.calculationMethod}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.finalScore.weightedScore)}`}>
                    {formatPercent(analysis.finalScore.weightedScore)}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown - Shows Automated + User */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Score Breakdown
              </h4>
              
              {/* Automated Components */}
              <div className="mb-4">
                <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase">Automated Metrics (60%)</h5>
                <div className="space-y-2">
                  {analysis.finalScore.breakdown.filter(b => b.type === 'automated').map((item) => (
                    <div key={item.metric} className="flex items-center gap-3">
                      <span className="text-sm w-24 capitalize">{item.metric}</span>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.score >= 0.8 ? 'bg-green-500' :
                              item.score >= 0.6 ? 'bg-yellow-500' :
                              item.score >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.score * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm w-14 text-right">{formatPercent(item.score)}</span>
                      <span className="text-xs text-gray-400 w-12">×{item.weight}</span>
                      <span className="text-sm font-medium w-14 text-right text-blue-600">
                        {formatPercent(item.weighted)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Rating Component */}
              {analysis.finalScore.breakdown.filter(b => b.type === 'user').length > 0 && (
                <div className="pt-3 border-t">
                  <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase">User Rating (40%)</h5>
                  {analysis.finalScore.breakdown.filter(b => b.type === 'user').map((item) => (
                    <div key={item.metric} className="flex items-center gap-3">
                      <span className="text-sm w-24 flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        Rating
                      </span>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-yellow-500" style={{ width: `${item.score * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm w-14 text-right">
                        {item.rawRating?.toFixed(1)}/5
                      </span>
                      <span className="text-xs text-gray-400 w-12">×{item.weight}</span>
                      <span className="text-sm font-medium w-14 text-right text-yellow-600">
                        {formatPercent(item.weighted)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Final Calculation */}
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="text-xs font-mono text-gray-600">
                  Automated: {formatPercent(analysis.finalScore.automatedScore)} | 
                  {analysis.userRatings.available && ` User: ${formatPercent(analysis.finalScore.userRatingScore)} |`}
                  <span className="font-bold text-blue-600 ml-1">
                    Final: {formatPercent(analysis.finalScore.weightedScore)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* User Ratings Section - NEW */}
      {analysis.userRatings.available && (
        <Card className="overflow-hidden">
          <SectionHeader
            title="User Ratings"
            icon={Star}
            score={analysis.userRatings.normalizedOverall.mean}
            isExpanded={expandedSections.userRatings}
            onClick={() => toggleSection('userRatings')}
            badge={`${analysis.userRatings.papersWithRatings} papers`}
            explanationKey="userRating"
          />
          {expandedSections.userRatings && (
            <div className="p-4 border-t space-y-4">
              {/* Overall User Rating */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 p-3 rounded text-center">
                  <div className="text-xs text-yellow-600">Average Rating</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {analysis.userRatings.overall.mean?.toFixed(2)}/5
                  </div>
                  <div className="flex justify-center mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-4 w-4 ${
                        i <= Math.round(analysis.userRatings.overall.mean || 0)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded text-center">
                  <div className="text-xs text-purple-600">Expertise-Weighted</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {analysis.userRatings.expertiseWeighted.weightedAvgRating?.toFixed(2)}/5
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg expertise: {analysis.userRatings.expertiseWeighted.avgExpertiseMultiplier?.toFixed(2)}x
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="text-xs text-blue-600">Normalized</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatPercent(analysis.userRatings.normalizedOverall.mean || 0)}
                  </div>
                  <div className="text-xs text-gray-500">σ: {(analysis.userRatings.normalizedOverall.std || 0).toFixed(3)}</div>
                </div>
                <div className="bg-gray-100 p-3 rounded text-center">
                  <div className="text-xs text-gray-600">Papers Rated</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {analysis.userRatings.papersWithRatings}
                  </div>
                  <div className="text-xs text-gray-500">of {analysis.summary.totalPapers}</div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm font-medium mb-3">Rating Distribution</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-green-100 rounded">
                    <div className="text-xs text-green-600">Excellent (≥4.5)</div>
                    <div className="font-bold text-green-700">{analysis.userRatings.distribution.excellent}</div>
                  </div>
                  <div className="text-center p-2 bg-blue-100 rounded">
                    <div className="text-xs text-blue-600">Good (3.5-4.5)</div>
                    <div className="font-bold text-blue-700">{analysis.userRatings.distribution.good}</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-100 rounded">
                    <div className="text-xs text-yellow-600">Moderate (2.5-3.5)</div>
                    <div className="font-bold text-yellow-700">{analysis.userRatings.distribution.moderate}</div>
                  </div>
                  <div className="text-center p-2 bg-red-100 rounded">
                    <div className="text-xs text-red-600">Poor (&lt;2.5)</div>
                    <div className="font-bold text-red-700">{analysis.userRatings.distribution.poor}</div>
                  </div>
                </div>
              </div>

              {/* Per-Paper Ratings */}
              {analysis.userRatings.byPaper?.length > 0 && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="text-sm font-medium mb-3">Ratings by Paper</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analysis.userRatings.byPaper.map((paper, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <span className="flex-1 text-xs truncate" title={paper.paperTitle}>
                          {paper.paperTitle}
                        </span>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${
                              i <= Math.round(paper.rating || 0)
                                ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                            }`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {paper.rating?.toFixed(1)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          ×{paper.expertiseMultiplier?.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Paper-Level Analysis - NEW */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Paper-Level Analysis"
          icon={FileText}
          isExpanded={expandedSections.paperAnalysis}
          onClick={() => toggleSection('paperAnalysis')}
          badge={`${analysis.paperAnalysis?.length || 0} papers`}
        />
        {expandedSections.paperAnalysis && analysis.paperAnalysis?.length > 0 && (
          <div className="p-4 border-t">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Paper</th>
                    <th className="text-center p-2">Coverage</th>
                    <th className="text-center p-2">Evidence</th>
                    <th className="text-center p-2">Confidence</th>
                    <th className="text-center p-2">User Rating</th>
                    <th className="text-center p-2">Edit Score</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.paperAnalysis.map((paper, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedPaper(paper)}>
                      <td className="p-2 max-w-xs truncate" title={paper.paperTitle}>
                        {paper.paperTitle}
                      </td>
                      <td className="text-center p-2">
                        <Badge className={getScoreBadge(paper.metrics.coverageRate)}>
                          {formatPercent(paper.metrics.coverageRate)}
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <Badge className={getScoreBadge(paper.metrics.evidenceRate)}>
                          {formatPercent(paper.metrics.evidenceRate)}
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <Badge className={getScoreBadge(paper.metrics.avgConfidence)}>
                          {formatPercent(paper.metrics.avgConfidence)}
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        {paper.userRating ? (
                          <span className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {paper.userRating.toFixed(1)}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="text-center p-2">
                        {paper.editScore !== null ? (
                          <Badge className={getScoreBadge(paper.editScore)}>
                            {formatPercent(paper.editScore)}
                          </Badge>
                        ) : <span className="text-gray-400">N/A</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paper Detail Modal */}
            {selectedPaper && (
              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-blue-900">{selectedPaper.paperTitle}</h4>
                  <button onClick={() => setSelectedPaper(null)} className="text-blue-600 hover:text-blue-800">×</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Total Properties</div>
                    <div className="font-medium">{selectedPaper.metrics.totalProperties}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">With Values</div>
                    <div className="font-medium">{selectedPaper.metrics.propertiesWithValues}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Resources</div>
                    <div className="font-medium">{selectedPaper.metrics.resourceCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Literals</div>
                    <div className="font-medium">{selectedPaper.metrics.literalCount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Coverage Analysis */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Coverage Analysis"
          icon={CheckCircle}
          score={analysis.coverage.overall.coverageRate}
          isExpanded={expandedSections.coverage}
          onClick={() => toggleSection('coverage')}
          badge={`${analysis.coverage.overall.withValues}/${analysis.coverage.overall.totalPropertyValues}`}
          explanationKey="coverage"
        />
        {expandedSections.coverage && (
          <div className="p-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm font-medium mb-3">Property Value Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />With Values</span>
                    <span className="font-medium">{analysis.coverage.overall.withValues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" />Empty/Missing</span>
                    <span className="font-medium">{analysis.coverage.overall.withoutValues}</span>
                  </div>
                  <Progress value={analysis.coverage.overall.coverageRate * 100} className="h-3 mt-2" />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="text-sm font-medium mb-3">Per-Paper Statistics</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div><div className="text-xs text-gray-500">Mean</div><div className="font-bold">{formatPercent(analysis.coverage.perPaper.mean)}</div></div>
                  <div><div className="text-xs text-gray-500">Median</div><div className="font-bold">{formatPercent(analysis.coverage.perPaper.median)}</div></div>
                  <div><div className="text-xs text-gray-500">Min</div><div className="font-bold">{formatPercent(analysis.coverage.perPaper.min)}</div></div>
                  <div><div className="text-xs text-gray-500">Max</div><div className="font-bold">{formatPercent(analysis.coverage.perPaper.max)}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confidence Analysis */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Confidence Analysis"
          icon={AlertCircle}
          score={analysis.confidence.overall.mean}
          isExpanded={expandedSections.confidence}
          onClick={() => toggleSection('confidence')}
          explanationKey="confidence"
        />
        {expandedSections.confidence && (
          <div className="p-4 border-t space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded text-center">
                <div className="text-xs text-green-600">High (≥0.8)</div>
                <div className="text-xl font-bold text-green-700">{analysis.confidence.distribution.high.count}</div>
                <div className="text-xs text-gray-500">{formatPercent(analysis.confidence.distribution.high.percentage)}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded text-center">
                <div className="text-xs text-yellow-600">Moderate (0.5-0.8)</div>
                <div className="text-xl font-bold text-yellow-700">{analysis.confidence.distribution.moderate.count}</div>
                <div className="text-xs text-gray-500">{formatPercent(analysis.confidence.distribution.moderate.percentage)}</div>
              </div>
              <div className="bg-red-50 p-3 rounded text-center">
                <div className="text-xs text-red-600">Low (&lt;0.5)</div>
                <div className="text-xl font-bold text-red-700">{analysis.confidence.distribution.low.count}</div>
                <div className="text-xs text-gray-500">{formatPercent(analysis.confidence.distribution.low.percentage)}</div>
              </div>
            </div>
            
            {/* Confidence by Evidence */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-sm font-medium mb-3">Confidence by Evidence</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs text-gray-500">With Evidence ({analysis.confidence.byEvidence.withEvidence.count})</div>
                  <div className="text-lg font-bold">{analysis.confidence.byEvidence.withEvidence.avgConfidence.toFixed(3)}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs text-gray-500">Without Evidence ({analysis.confidence.byEvidence.withoutEvidence.count})</div>
                  <div className="text-lg font-bold">
                    {analysis.confidence.byEvidence.withoutEvidence.count > 0 
                      ? analysis.confidence.byEvidence.withoutEvidence.avgConfidence.toFixed(3)
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Correlation Insights - FIXED */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Correlation Insights"
          icon={TrendingUp}
          isExpanded={expandedSections.correlations}
          onClick={() => toggleSection('correlations')}
          explanationKey="correlations"
        />
        {expandedSections.correlations && (
          <div className="p-4 border-t space-y-4">
            {analysis.correlations.confidenceEvidence && (
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm font-medium mb-2">Confidence vs Evidence</h4>
                <div className="grid grid-cols-2 gap-4 text-center mb-2">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">With Evidence ({analysis.correlations.confidenceEvidence.withEvidenceCount})</div>
                    <div className="font-bold">
                      {analysis.correlations.confidenceEvidence.withEvidenceCount > 0 
                        ? analysis.correlations.confidenceEvidence.withEvidenceAvgConfidence.toFixed(3)
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Without Evidence ({analysis.correlations.confidenceEvidence.withoutEvidenceCount})</div>
                    <div className="font-bold">
                      {analysis.correlations.confidenceEvidence.withoutEvidenceCount > 0 
                        ? analysis.correlations.confidenceEvidence.withoutEvidenceAvgConfidence.toFixed(3)
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <strong>Finding:</strong> {analysis.correlations.confidenceEvidence.interpretation}
                </p>
              </div>
            )}

            {analysis.correlations.granularityConfidence && (
              <div className="bg-purple-50 p-3 rounded">
                <h4 className="text-sm font-medium mb-2">Granularity vs Confidence</h4>
                <div className="grid grid-cols-2 gap-4 text-center mb-2">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">High Granularity ({analysis.correlations.granularityConfidence.highGranularityCount})</div>
                    <div className="font-bold">
                      {analysis.correlations.granularityConfidence.highGranularityCount > 0 
                        ? analysis.correlations.granularityConfidence.highGranularityAvgConfidence.toFixed(3)
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-500">Low Granularity ({analysis.correlations.granularityConfidence.lowGranularityCount})</div>
                    <div className="font-bold">
                      {analysis.correlations.granularityConfidence.lowGranularityCount > 0 
                        ? analysis.correlations.granularityConfidence.lowGranularityAvgConfidence.toFixed(3)
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <strong>Finding:</strong> {analysis.correlations.granularityConfidence.interpretation}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ContentAnalysisDashboard;