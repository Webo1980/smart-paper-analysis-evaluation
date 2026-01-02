/**
 * ExpertConsensusAnalysis Component
 * 
 * Enhanced visualization for expert consensus showing:
 * 1. Expertise tier codes legend (E/A/I/B)
 * 2. Component-level tier coverage matrix
 * 3. Agreement vs disagreement visualization
 * 4. Cross-tier sentiment analysis
 * 5. Research-ready interpretations
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Cell
} from 'recharts';
import {
  Users, Star, Award, GraduationCap, User, CheckCircle, XCircle,
  ArrowLeftRight, ChevronDown, ChevronUp, Info, ThumbsUp, ThumbsDown,
  Minus, Target, TrendingUp, Shield, HelpCircle, Layers, GitCompare
} from 'lucide-react';

// ============================================================================
// CONSTANTS & COLORS
// ============================================================================

const EXPERTISE_TIERS = {
  expert: {
    code: 'E',
    name: 'Expert',
    description: 'Senior researchers, professors, domain specialists with extensive experience',
    color: '#7c3aed',
    bgClass: 'bg-purple-50 border-purple-300',
    textClass: 'text-purple-700',
    icon: Star,
    weightRange: '≥4.0'
  },
  advanced: {
    code: 'A',
    name: 'Advanced',
    description: 'PhD students, postdocs, researchers with significant domain knowledge',
    color: '#3b82f6',
    bgClass: 'bg-blue-50 border-blue-300',
    textClass: 'text-blue-700',
    icon: Award,
    weightRange: '3.0-3.9'
  },
  intermediate: {
    code: 'I',
    name: 'Intermediate',
    description: 'Graduate students, junior researchers with moderate experience',
    color: '#10b981',
    bgClass: 'bg-green-50 border-green-300',
    textClass: 'text-green-700',
    icon: GraduationCap,
    weightRange: '2.0-2.9'
  },
  basic: {
    code: 'B',
    name: 'Basic',
    description: 'Undergraduates, newcomers, users with limited domain experience',
    color: '#f59e0b',
    bgClass: 'bg-yellow-50 border-yellow-300',
    textClass: 'text-yellow-700',
    icon: User,
    weightRange: '<2.0'
  }
};

const SENTIMENT_STYLES = {
  positive: { color: '#22c55e', bgClass: 'bg-green-100 text-green-700 border-green-200', icon: ThumbsUp },
  neutral: { color: '#eab308', bgClass: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Minus },
  negative: { color: '#ef4444', bgClass: 'bg-red-100 text-red-700 border-red-200', icon: ThumbsDown }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const TierCodeBadge = ({ tier, sentiment = null, showLabel = false, size = 'sm' }) => {
  const tierConfig = EXPERTISE_TIERS[tier];
  if (!tierConfig) return null;
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };
  
  const sentimentBorder = sentiment ? {
    positive: 'ring-2 ring-green-400',
    negative: 'ring-2 ring-red-400',
    neutral: 'ring-2 ring-yellow-400'
  }[sentiment] : '';
  
  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClasses[size]} ${sentimentBorder}`}
      style={{ backgroundColor: `${tierConfig.color}20`, color: tierConfig.color }}
      title={`${tierConfig.name}${sentiment ? ` - ${sentiment}` : ''}`}
    >
      {tierConfig.code}
      {showLabel && <span className="ml-1">{tierConfig.name}</span>}
    </div>
  );
};

const TierCodeLegend = ({ compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-100/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-800">Expertise Tier Codes Legend</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick reference */}
          <div className="hidden sm:flex items-center gap-1">
            {Object.entries(EXPERTISE_TIERS).map(([key, tier]) => (
              <TierCodeBadge key={key} tier={key} size="sm" />
            ))}
          </div>
          {expanded ? 
            <ChevronUp className="h-5 w-5 text-purple-600" /> : 
            <ChevronDown className="h-5 w-5 text-purple-600" />
          }
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 pt-0 border-t border-purple-200">
          <p className="text-sm text-gray-600 mb-3">
            Each component shows which expertise tiers have evaluated it. For example, <strong>"EAB"</strong> means 
            Expert, Advanced, and Basic evaluators reviewed that component.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(EXPERTISE_TIERS).map(([key, tier]) => {
              const IconComponent = tier.icon;
              return (
                <div 
                  key={key}
                  className={`p-3 rounded-lg border-2 ${tier.bgClass}`}
                  style={{ borderColor: tier.color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: tier.color }}
                    >
                      {tier.code}
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: tier.color }}>{tier.name}</div>
                      <div className="text-xs text-gray-500">Weight: {tier.weightRange}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{tier.description}</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
            <strong>Reading the codes:</strong> When you see tier codes like "EAI" next to a component, 
            it means Expert (E), Advanced (A), and Intermediate (I) evaluators provided feedback. 
            The sentiment indicators (🟢 positive, 🟡 neutral, 🔴 negative) show each tier's overall assessment.
          </div>
        </div>
      )}
    </div>
  );
};

const InterpretationBox = ({ type = 'blue', title, children, icon: IconProp }) => {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };
  
  const Icon = IconProp || Info;
  
  return (
    <div className={`p-4 rounded-lg border ${styles[type]}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT TIER COVERAGE MATRIX
// ============================================================================

const ComponentTierMatrix = ({ expertisePreferences, expertiseStats, expertiseSentiment }) => {
  // Debug: log actual data structure
  console.log('ComponentTierMatrix received:', {
    expertiseSentiment: expertiseSentiment,
    expertisePreferences: expertisePreferences,
    expertiseStats: expertiseStats
  });
  
  if (expertiseSentiment?.byTier) {
    console.log('expertiseSentiment.byTier keys:', Object.keys(expertiseSentiment.byTier));
    Object.entries(expertiseSentiment.byTier).forEach(([tier, data]) => {
      console.log(`Tier ${tier}:`, {
        hasData: !!data,
        keys: data ? Object.keys(data) : [],
        byComponent: data?.byComponent,
        summary: data?.summary
      });
    });
  }
  
  const components = useMemo(() => {
    // Build component data from expertiseSentiment.byTier which has the actual component data
    const compMap = {};
    
    if (expertiseSentiment?.byTier) {
      Object.entries(expertiseSentiment.byTier).forEach(([tier, tierData]) => {
        // Check byComponent in the tier's sentiment data
        if (tierData?.byComponent) {
          Object.entries(tierData.byComponent).forEach(([compKey, compData]) => {
            if (!compMap[compKey]) {
              compMap[compKey] = {
                key: compKey,
                name: compData.name || compKey,
                color: compData.color,
                tiers: {},
                totalComments: 0
              };
            }
            
            const counts = compData.simpleCounts || { positive: 0, neutral: 0, negative: 0 };
            const total = counts.positive + counts.neutral + counts.negative;
            
            compMap[compKey].tiers[tier] = {
              count: total,
              positiveRatio: total > 0 ? counts.positive / total : 0,
              negativeRatio: total > 0 ? counts.negative / total : 0,
              sentiments: counts
            };
            compMap[compKey].totalComments += total;
          });
        }
      });
    }
    
    // Fallback: try expertisePreferences if expertiseSentiment doesn't have data
    if (Object.keys(compMap).length === 0 && expertisePreferences?.preferences) {
      Object.entries(expertisePreferences.preferences).forEach(([tier, tierData]) => {
        if (tierData?.byComponent) {
          Object.entries(tierData.byComponent).forEach(([compKey, compData]) => {
            if (!compMap[compKey]) {
              compMap[compKey] = {
                key: compKey,
                name: compData.name || compKey,
                color: compData.color,
                tiers: {},
                totalComments: 0
              };
            }
            
            compMap[compKey].tiers[tier] = {
              count: compData.total || 0,
              positiveRatio: compData.positiveRatio || 0,
              negativeRatio: compData.negativeRatio || 0,
              sentiments: compData.sentiments || { positive: 0, neutral: 0, negative: 0 }
            };
            compMap[compKey].totalComments += compData.total || 0;
          });
        }
      });
    }
    
    return Object.values(compMap).sort((a, b) => b.totalComments - a.totalComments);
  }, [expertiseSentiment, expertisePreferences]);
  
  const getTierCode = (tiers) => {
    const codes = [];
    ['expert', 'advanced', 'intermediate', 'basic'].forEach(tier => {
      if (tiers[tier] && tiers[tier].count > 0) {
        codes.push(EXPERTISE_TIERS[tier].code);
      }
    });
    return codes.join('');
  };
  
  const getConsensusStatus = (tiers) => {
    const activeTiers = Object.entries(tiers).filter(([_, data]) => data && data.count > 0);
    if (activeTiers.length < 2) return { status: 'single', label: 'Single Tier' };
    
    const sentiments = activeTiers.map(([_, data]) => {
      if (data.positiveRatio > data.negativeRatio && data.positiveRatio > 0.3) return 'positive';
      if (data.negativeRatio > data.positiveRatio && data.negativeRatio > 0.3) return 'negative';
      return 'neutral';
    });
    
    const allSame = sentiments.every(s => s === sentiments[0]);
    if (allSame) return { status: 'agree', label: 'Consensus', sentiment: sentiments[0] };
    return { status: 'disagree', label: 'Divergent' };
  };
  
  if (components.length === 0) {
    // Debug info
    const hasSentiment = !!expertiseSentiment?.byTier;
    const sentimentTiers = hasSentiment ? Object.keys(expertiseSentiment.byTier) : [];
    const hasPreferences = !!expertisePreferences?.preferences;
    const preferenceKeys = hasPreferences ? Object.keys(expertisePreferences.preferences) : [];
    
    return (
      <div className="text-center py-8 text-gray-500">
        <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No component data available</p>
        <p className="text-xs mt-2">Ensure evaluations contain component-level comments</p>
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left max-w-md mx-auto">
          <p><strong>Debug Info:</strong></p>
          <p>expertiseSentiment.byTier: {hasSentiment ? sentimentTiers.join(', ') : 'None'}</p>
          {sentimentTiers.map(tier => {
            const tierData = expertiseSentiment?.byTier?.[tier];
            const hasBC = !!tierData?.byComponent;
            const compKeys = hasBC ? Object.keys(tierData.byComponent) : [];
            return (
              <p key={tier}>{tier}.byComponent: {hasBC ? `${compKeys.length} comps` : 'missing'}</p>
            );
          })}
          <p className="mt-2">expertisePreferences.preferences: {preferenceKeys.join(', ') || 'None'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        This matrix shows which expertise tiers evaluated each component and their sentiment consensus.
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Component</th>
              <th className="text-center py-2 px-2 font-semibold" style={{ color: EXPERTISE_TIERS.expert.color }}>
                <div className="flex flex-col items-center">
                  <TierCodeBadge tier="expert" size="sm" />
                  <span className="text-xs mt-1">Expert</span>
                </div>
              </th>
              <th className="text-center py-2 px-2 font-semibold" style={{ color: EXPERTISE_TIERS.advanced.color }}>
                <div className="flex flex-col items-center">
                  <TierCodeBadge tier="advanced" size="sm" />
                  <span className="text-xs mt-1">Advanced</span>
                </div>
              </th>
              <th className="text-center py-2 px-2 font-semibold" style={{ color: EXPERTISE_TIERS.intermediate.color }}>
                <div className="flex flex-col items-center">
                  <TierCodeBadge tier="intermediate" size="sm" />
                  <span className="text-xs mt-1">Intermediate</span>
                </div>
              </th>
              <th className="text-center py-2 px-2 font-semibold" style={{ color: EXPERTISE_TIERS.basic.color }}>
                <div className="flex flex-col items-center">
                  <TierCodeBadge tier="basic" size="sm" />
                  <span className="text-xs mt-1">Basic</span>
                </div>
              </th>
              <th className="text-center py-2 px-3 font-semibold text-gray-700">Tiers</th>
              <th className="text-center py-2 px-3 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp, idx) => {
              const consensus = getConsensusStatus(comp.tiers);
              const tierCode = getTierCode(comp.tiers);
              
              return (
                <tr key={comp.key} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {comp.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: comp.color }} />
                      )}
                      {comp.name}
                    </div>
                  </td>
                  
                  {['expert', 'advanced', 'intermediate', 'basic'].map(tier => {
                    const tierData = comp.tiers[tier];
                    if (!tierData || tierData.count === 0) {
                      return (
                        <td key={tier} className="text-center py-2 px-2">
                          <span className="text-gray-300">—</span>
                        </td>
                      );
                    }
                    
                    const sentiment = tierData.positiveRatio > tierData.negativeRatio && tierData.positiveRatio > 0.3
                      ? 'positive'
                      : tierData.negativeRatio > tierData.positiveRatio && tierData.negativeRatio > 0.3
                        ? 'negative'
                        : 'neutral';
                    
                    const SentimentIcon = SENTIMENT_STYLES[sentiment].icon;
                    
                    return (
                      <td key={tier} className="text-center py-2 px-2">
                        <div className="flex flex-col items-center gap-1">
                          <div 
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${SENTIMENT_STYLES[sentiment].bgClass}`}
                          >
                            <SentimentIcon className="h-3 w-3" />
                            <span>{tierData.count}</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  
                  <td className="text-center py-2 px-3">
                    <span className="font-mono font-bold text-purple-600">{tierCode}</span>
                  </td>
                  
                  <td className="text-center py-2 px-3">
                    {consensus.status === 'agree' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle className="h-3 w-3" />
                        {consensus.label}
                      </span>
                    ) : consensus.status === 'disagree' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 border border-orange-200">
                        <ArrowLeftRight className="h-3 w-3" />
                        {consensus.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        {consensus.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// AGREEMENT / DISAGREEMENT VISUALIZATION
// ============================================================================

const AgreementDisagreementView = ({ vennData, interRater, preferences }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const agreementRate = interRater?.agreementRate || 0;
  const agreedComponents = vennData?.agreed || [];
  const divergentComponents = vennData?.divergent || [];
  
  const agreementChartData = useMemo(() => {
    return [
      { name: 'Agreement', value: agreedComponents.length, fill: '#22c55e' },
      { name: 'Divergence', value: divergentComponents.length, fill: '#f97316' }
    ];
  }, [agreedComponents, divergentComponents]);
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">{agreementRate}%</div>
          <div className="text-sm text-purple-700 font-medium">Overall Agreement</div>
          <div className="text-xs text-purple-600 mt-1">Across expertise tiers</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600">{agreedComponents.length}</div>
          <div className="text-sm text-green-700 font-medium">Consensus Components</div>
          <div className="text-xs text-green-600 mt-1">All tiers agree</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="text-3xl font-bold text-orange-600">{divergentComponents.length}</div>
          <div className="text-sm text-orange-700 font-medium">Divergent Components</div>
          <div className="text-xs text-orange-600 mt-1">Tiers disagree</div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'agreement', label: 'Agreement Zone', icon: CheckCircle },
          { id: 'divergence', label: 'Divergence Zone', icon: ArrowLeftRight }
        ].map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconComp className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium text-gray-700 mb-3">Agreement Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agreementChartData} layout="vertical">
                <XAxis type="number" domain={[0, 'auto']} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {agreementChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Interpretation */}
          <div className="space-y-3">
            <InterpretationBox 
              type={agreementRate >= 70 ? 'green' : agreementRate >= 40 ? 'orange' : 'red'}
              title="Consensus Interpretation"
              icon={Shield}
            >
              {agreementRate >= 70 ? (
                <>
                  <strong>High cross-tier consensus ({agreementRate}%).</strong> Evaluators across all expertise 
                  levels perceive system quality similarly. This indicates <strong>objective quality dimensions</strong> 
                  that don't depend on evaluator experience. Claims about these components are well-supported.
                </>
              ) : agreementRate >= 40 ? (
                <>
                  <strong>Moderate agreement ({agreementRate}%).</strong> Some components show universal consensus 
                  while others depend on expertise level. Consider <strong>stratified reporting</strong> - 
                  report expert and non-expert perceptions separately for divergent components.
                </>
              ) : (
                <>
                  <strong>Low agreement ({agreementRate}%).</strong> Expertise level significantly affects 
                  quality perception. Expert opinions should be weighted more heavily for technical 
                  accuracy claims. Consider investigating why different expertise levels perceive quality differently.
                </>
              )}
            </InterpretationBox>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500">Components evaluated:</span>
                <span className="font-bold ml-2">{agreedComponents.length + divergentComponents.length}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="text-gray-500">Multi-tier coverage:</span>
                <span className="font-bold ml-2">{interRater?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'agreement' && (
        <div className="space-y-4">
          <InterpretationBox type="green" title="Agreement Zone Components" icon={CheckCircle}>
            These components show <strong>consistent sentiment across all expertise tiers</strong>. 
            Regardless of whether the evaluator is an expert or beginner, they perceive these 
            aspects similarly - indicating objective quality dimensions.
          </InterpretationBox>
          
          {agreedComponents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {agreedComponents.map(comp => (
                <div key={comp.key} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-medium text-green-800 mb-2">{comp.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(comp.tierSentiments || {}).map(([tier, sentiment]) => (
                      <TierCodeBadge key={tier} tier={tier} sentiment={sentiment} />
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    ✓ All tiers: {Object.values(comp.tierSentiments || {})[0] || 'consistent'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No components with full cross-tier agreement</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'divergence' && (
        <div className="space-y-4">
          <InterpretationBox type="orange" title="Divergence Zone Components" icon={ArrowLeftRight}>
            These components show <strong>expertise-dependent perception</strong>. Different 
            expertise levels evaluate these aspects differently. This could indicate that experts 
            notice issues invisible to novices, or have different quality standards.
          </InterpretationBox>
          
          {divergentComponents.length > 0 ? (
            <div className="space-y-3">
              {divergentComponents.map(comp => (
                <div key={comp.key} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="font-medium text-orange-800 mb-3">{comp.name}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(comp.tierSentiments || {}).map(([tier, sentiment]) => {
                      const tierConfig = EXPERTISE_TIERS[tier];
                      const sentimentStyle = SENTIMENT_STYLES[sentiment];
                      const SentimentIcon = sentimentStyle?.icon || Minus;
                      
                      return (
                        <div 
                          key={tier}
                          className={`p-2 rounded border ${tierConfig?.bgClass || 'bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <TierCodeBadge tier={tier} size="sm" />
                            <span className="font-medium text-sm" style={{ color: tierConfig?.color }}>
                              {tierConfig?.name}
                            </span>
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${sentimentStyle?.bgClass}`}>
                            <SentimentIcon className="h-3 w-3" />
                            {sentiment}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No divergent components - all tiers agree!</p>
            </div>
          )}
          
          {divergentComponents.length > 0 && (
            <div className="p-3 bg-orange-100 rounded border border-orange-200 text-sm">
              <strong className="text-orange-800">Research Recommendation:</strong>
              <p className="text-orange-700 mt-1">
                For divergent components ({divergentComponents.map(c => c.name).join(', ')}), consider:
              </p>
              <ul className="list-disc list-inside text-orange-700 mt-1 text-xs space-y-1">
                <li>Report expert and non-expert perceptions separately</li>
                <li>Weight expert opinions more heavily for technical accuracy claims</li>
                <li>Investigate why expertise affects perception of these specific components</li>
                <li>Use this divergence as a discussion point about evaluation methodology</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ExpertConsensusAnalysis = ({ 
  expertiseStats, 
  expertisePreferences, 
  expertConsensus,
  byExpertise,
  expertiseSentiment
}) => {
  const [expandedSections, setExpandedSections] = useState({
    legend: true,
    matrix: true,
    agreement: true
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Extract data
  const vennData = expertisePreferences?.vennData;
  const interRater = expertisePreferences?.interRater;
  const preferences = expertisePreferences?.preferences || {};
  
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const activeTiers = Object.keys(EXPERTISE_TIERS).filter(tier => 
      expertiseStats?.byTier?.[tier]?.count > 0 || preferences[tier]?.totalComments > 0
    );
    
    const totalEvaluators = Object.values(expertiseStats?.byTier || {})
      .reduce((sum, tier) => sum + (tier.evaluators || 0), 0);
    
    const totalComments = Object.values(expertiseStats?.byTier || {})
      .reduce((sum, tier) => sum + (tier.count || 0), 0);
    
    return {
      activeTiers,
      totalEvaluators,
      totalComments,
      tierCount: activeTiers.length
    };
  }, [expertiseStats, preferences]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <GitCompare className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Expert Consensus Analysis</h2>
            <p className="text-sm text-gray-500">
              Cross-expertise agreement and divergence patterns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summaryStats.activeTiers.map(tier => (
            <TierCodeBadge key={tier} tier={tier} size="md" />
          ))}
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{summaryStats.tierCount}</div>
          <div className="text-xs text-purple-700">Active Tiers</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{summaryStats.totalEvaluators}</div>
          <div className="text-xs text-blue-700">Total Evaluators</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">{summaryStats.totalComments}</div>
          <div className="text-xs text-green-700">Total Comments</div>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{interRater?.agreementRate || 0}%</div>
          <div className="text-xs text-orange-700">Agreement Rate</div>
        </div>
      </div>
      
      {/* Tier Code Legend */}
      <TierCodeLegend compact={false} />
      
      {/* Component-Tier Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('matrix')}
          >
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-purple-600" />
              Component Coverage by Expertise Tier
            </CardTitle>
            {expandedSections.matrix ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
        </CardHeader>
        {expandedSections.matrix && (
          <CardContent>
            <ComponentTierMatrix 
              expertisePreferences={expertisePreferences}
              expertiseStats={expertiseStats}
              expertiseSentiment={expertiseSentiment}
            />
          </CardContent>
        )}
      </Card>
      
      {/* Agreement / Disagreement */}
      <Card>
        <CardHeader className="pb-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('agreement')}
          >
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-green-600" />
              Intersection Analysis: Agreement vs Disagreement
            </CardTitle>
            {expandedSections.agreement ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
        </CardHeader>
        {expandedSections.agreement && (
          <CardContent>
            <AgreementDisagreementView 
              vennData={vennData}
              interRater={interRater}
              preferences={preferences}
            />
          </CardContent>
        )}
      </Card>
      
      {/* Expert Consensus Summary (from existing analysis) */}
      {expertConsensus?.hasConsensus && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-yellow-500" />
              Expert-Level Consensus Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                className="text-sm text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: expertConsensus.interpretation?.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') 
                }}
              />
              
              {expertConsensus.findings?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {expertConsensus.findings.map((finding, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 rounded border ${
                        finding.consensusType === 'unanimous' 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-sm">{finding.component}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          finding.consensusType === 'unanimous' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {finding.consensusType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {finding.expertCount} experts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Research Implications Summary */}
      <InterpretationBox type="purple" title="Research Implications" icon={TrendingUp}>
        <div className="space-y-2">
          <p>
            <strong>Findings:</strong> Components with high cross-tier agreement 
            ({vennData?.agreed?.length || 0} found) represent objectively validated system qualities. 
            Claims about these components are well-supported by diverse evaluator perspectives.
          </p>
          <p>
            <strong>For Improvement:</strong> Divergent components 
            ({vennData?.divergent?.length || 0} found) may require targeted refinement. 
            Expert feedback should be prioritized for technical accuracy improvements.
          </p>
          <p>
            <strong>Methodology Note:</strong> The {summaryStats.tierCount}-tier coverage with 
            {' '}{interRater?.agreementRate || 0}% overall agreement provides 
            {' '}{(interRater?.agreementRate || 0) >= 70 ? 'strong' : (interRater?.agreementRate || 0) >= 40 ? 'moderate' : 'limited'} 
            {' '}evidence for evaluation reliability across expertise levels.
          </p>
        </div>
      </InterpretationBox>
    </div>
  );
};

export default ExpertConsensusAnalysis;