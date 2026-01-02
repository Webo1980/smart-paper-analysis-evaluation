// src/components/dashboard/views/ExpertiseWeightedAnalysis.jsx
// FIXED VERSION - Calculations now match Overview component
// KEY FIX: Both Accuracy and Quality now use Final = (Automated × 60%) + (User Rating × 40%)

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Users, Award, TrendingUp, Brain, Scale, Target,
  Filter, BarChart3, Info, ChevronDown, ChevronUp, AlertCircle,
  Globe, Database, BookOpen, Calculator, GitCompare, Layers,
  Lightbulb, CheckCircle, ArrowUpRight, ArrowDownRight, Star
} from 'lucide-react';

// Collapsible Research Findings Component
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

// Interpretation Box Component
const InterpretationBox = ({ children, type = 'info' }) => {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    insight: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  };
  
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${colors[type]}`}>
      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
};

// User Rating Note Component
const UserRatingNote = ({ className = '', compact = false }) => (
  <div className={`flex items-center gap-2 p-2 rounded-lg text-xs bg-amber-50 border border-amber-200 ${className}`}>
    <Star className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
    <span className="text-amber-800">
      {compact 
        ? <><strong>Quality</strong> and <strong>Accuracy</strong> include user ratings (40% weight)</>
        : <><strong>Note:</strong> Both Accuracy and Quality scores use formula: Final = (Automated × 60%) + (User Rating × 40%)</>
      }
    </span>
  </div>
);

// Inline user rating indicator
const QualityIndicator = ({ showStar = true }) => (
  showStar ? (
    <span className="inline-flex items-center gap-0.5 text-amber-500" title="Includes user ratings (40% weight)">
      <Star className="h-3 w-3" />
    </span>
  ) : null
);

const ExpertiseWeightedAnalysis = ({ data, aggregatedData, integratedData }) => {
  const [activeTab, setActiveTab] = useState('accuracy');
  const [compareMode, setCompareMode] = useState(true);
  const [selectedRole, setSelectedRole] = useState('all');
  const [showFormula, setShowFormula] = useState(false);

  const componentKeys = ['metadata', 'research_field', 'research_problem', 'template', 'content'];
  const componentLabels = {
    metadata: 'Metadata',
    research_field: 'Research Field',
    research_problem: 'Research Problem',
    template: 'Template',
    content: 'Content'
  };

  // Extract evaluator data from multiple sources
  const evaluatorsData = useMemo(() => {
    const evaluatorMap = new Map();
    const intSource = integratedData?.papers || window.threeWayIntegratedDataDebug?.papers || [];
    const aggPaperIds = aggregatedData?.papers ? new Set(Object.keys(aggregatedData.papers)) : new Set();

    intSource.forEach(paper => {
      const paperId = paper.token;
      if (aggPaperIds.size > 0 && !aggPaperIds.has(paperId)) return;
      
      paper.userEvaluations?.forEach(evaluation => {
        const userInfo = evaluation.userInfo;
        if (!userInfo) return;
        
        const id = `${userInfo.firstName}_${userInfo.lastName}`;
        
        if (!evaluatorMap.has(id)) {
          evaluatorMap.set(id, {
            id,
            name: `${userInfo.firstName} ${userInfo.lastName}`,
            profile: {
              role: userInfo.role || 'Unknown',
              domainExpertise: userInfo.domainExpertise || 'Unknown',
              evaluationExperience: userInfo.evaluationExperience || 'Unknown',
              orkgExperience: userInfo.orkgExperience || 'never',
              expertiseWeight: userInfo.expertiseWeight || 1,
              expertiseMultiplier: userInfo.expertiseMultiplier || 1,
              weightComponents: userInfo.weightComponents || null
            },
            evaluations: [],
            papersEvaluated: []
          });
        }
        
        const evaluator = evaluatorMap.get(id);
        evaluator.evaluations.push({
          paperId: paperId,
          timestamp: evaluation.timestamp,
          metrics: evaluation.evaluationMetrics?.overall
        });
        if (!evaluator.papersEvaluated.includes(paperId)) {
          evaluator.papersEvaluated.push(paperId);
        }
      });
    });

    if (aggregatedData?.evaluators) {
      Object.entries(aggregatedData.evaluators).forEach(([id, evalData]) => {
        if (evaluatorMap.has(id)) {
          const existing = evaluatorMap.get(id);
          existing.performance = evalData.performance;
        } else {
          evaluatorMap.set(id, {
            id,
            ...evalData,
            profile: evalData.profile || {},
            evaluations: [],
            papersEvaluated: evalData.papersEvaluated || []
          });
        }
      });
    }

    return Array.from(evaluatorMap.values());
  }, [integratedData, aggregatedData]);

  // Calculate component scores by expertise tier
  const componentScoresByExpertise = useMemo(() => {
    if (!aggregatedData?.papers) return null;

    const tiers = {
      expert: { min: 4.0, max: 5.1, label: 'Expert', color: 'green' },
      senior: { min: 3.0, max: 4.0, label: 'Senior', color: 'blue' },
      intermediate: { min: 2.0, max: 3.0, label: 'Intermediate', color: 'yellow' },
      junior: { min: 0, max: 2.0, label: 'Junior', color: 'gray' }
    };

    const result = {};
    const paperExpertise = {};
    
    const intSource = integratedData?.papers || window.threeWayIntegratedDataDebug?.papers || [];
    const aggPaperIds = new Set(Object.keys(aggregatedData.papers));
    
    intSource.forEach(paper => {
      const paperId = paper.token;
      if (!aggPaperIds.has(paperId)) return;
      
      paper.userEvaluations?.forEach(evaluation => {
        const weight = evaluation.userInfo?.expertiseWeight || 1;
        if (!paperExpertise[paperId]) {
          paperExpertise[paperId] = [];
        }
        paperExpertise[paperId].push(weight);
      });
    });

    if (Object.keys(paperExpertise).length === 0 && aggregatedData.evaluators) {
      Object.entries(aggregatedData.evaluators).forEach(([evalId, evaluator]) => {
        const weight = evaluator.profile?.expertiseWeight || 1;
        evaluator.papersEvaluated?.forEach(paperId => {
          if (!paperExpertise[paperId]) {
            paperExpertise[paperId] = [];
          }
          paperExpertise[paperId].push(weight);
        });
      });
    }

    const paperAvgExpertise = {};
    Object.entries(paperExpertise).forEach(([paperId, weights]) => {
      paperAvgExpertise[paperId] = weights.reduce((a, b) => a + b, 0) / weights.length;
    });

    if (Object.keys(paperAvgExpertise).length === 0) {
      return null;
    }

    componentKeys.forEach(compKey => {
      result[compKey] = {};
      
      Object.entries(tiers).forEach(([tierKey, tier]) => {
        const accScores = [];
        const qualScores = [];

        Object.entries(aggregatedData.papers).forEach(([paperId, paper]) => {
          const avgExp = paperAvgExpertise[paperId];
          if (avgExp === undefined || avgExp < tier.min || avgExp >= tier.max) return;

          const compData = paper[compKey];
          if (!compData) return;

          // Get automated scores
          const accScoreAuto = compData.accuracyScores?.mean ?? compData.scores?.mean;
          const qualScoreAuto = compData.qualityScores?.mean;
          
          // Get user rating from userRatings.mean (already 0-1 scale)
          const userRating = compData.userRatings?.mean;

          // Calculate final scores: Final = (Auto × 60%) + (User × 40%)
          if (accScoreAuto !== undefined && !isNaN(accScoreAuto)) {
            const finalAcc = userRating !== undefined 
              ? (accScoreAuto * 0.6) + (userRating * 0.4)
              : accScoreAuto;
            accScores.push(finalAcc);
          }

          if (qualScoreAuto !== undefined && !isNaN(qualScoreAuto) && qualScoreAuto > 0) {
            const finalQual = userRating !== undefined 
              ? (qualScoreAuto * 0.6) + (userRating * 0.4)
              : qualScoreAuto;
            qualScores.push(finalQual);
          }
        });

        result[compKey][tierKey] = {
          ...tier,
          accuracy: accScores.length > 0 ? accScores.reduce((a, b) => a + b, 0) / accScores.length : null,
          quality: qualScores.length > 0 ? qualScores.reduce((a, b) => a + b, 0) / qualScores.length : null,
          accCount: accScores.length,
          qualCount: qualScores.length
        };
      });
    });

    return result;
  }, [integratedData, aggregatedData]);

  // Calculate overall scores by expertise tier
  const overallByExpertise = useMemo(() => {
    if (!componentScoresByExpertise) return null;

    const tiers = ['expert', 'senior', 'intermediate', 'junior'];
    const result = {};

    tiers.forEach(tier => {
      const accScores = [];
      const qualScores = [];

      componentKeys.forEach(compKey => {
        const data = componentScoresByExpertise[compKey]?.[tier];
        if (data?.accuracy !== null) accScores.push(data.accuracy);
        if (data?.quality !== null) qualScores.push(data.quality);
      });

      result[tier] = {
        accuracy: accScores.length > 0 ? accScores.reduce((a, b) => a + b, 0) / accScores.length : null,
        quality: qualScores.length > 0 ? qualScores.reduce((a, b) => a + b, 0) / qualScores.length : null,
        accCount: accScores.length,
        qualCount: qualScores.length
      };
    });

    return result;
  }, [componentScoresByExpertise]);

  // Calculate ORKG experience impact
  const orkgExperienceImpact = useMemo(() => {
    if (!aggregatedData?.papers) return null;

    const intSource = integratedData?.papers || window.threeWayIntegratedDataDebug?.papers || [];
    const aggPaperIds = new Set(Object.keys(aggregatedData.papers));

    const withOrkgPapers = new Set();
    const withoutOrkgPapers = new Set();

    intSource.forEach(paper => {
      const paperId = paper.token;
      if (!aggPaperIds.has(paperId)) return;
      
      paper.userEvaluations?.forEach(evaluation => {
        const hasOrkg = evaluation.userInfo?.orkgExperience === 'used';
        if (hasOrkg) {
          withOrkgPapers.add(paperId);
        } else {
          withoutOrkgPapers.add(paperId);
        }
      });
    });

    if (withOrkgPapers.size === 0 && withoutOrkgPapers.size === 0) {
      return null;
    }

    const calcGroupScores = (paperSet) => {
      const result = {};
      componentKeys.forEach(compKey => {
        const accScores = [];
        const qualScores = [];

        paperSet.forEach(paperId => {
          const paper = aggregatedData.papers[paperId];
          if (!paper) return;

          const compData = paper[compKey];
          if (!compData) return;

          // Get automated scores
          const accScoreAuto = compData.accuracyScores?.mean ?? compData.scores?.mean;
          const qualScoreAuto = compData.qualityScores?.mean;
          
          // Get user rating from userRatings.mean (already 0-1 scale)
          const userRating = compData.userRatings?.mean;

          // Calculate final scores: Final = (Auto × 60%) + (User × 40%)
          if (accScoreAuto !== undefined && !isNaN(accScoreAuto)) {
            const finalAcc = userRating !== undefined 
              ? (accScoreAuto * 0.6) + (userRating * 0.4)
              : accScoreAuto;
            accScores.push(finalAcc);
          }

          if (qualScoreAuto !== undefined && !isNaN(qualScoreAuto) && qualScoreAuto > 0) {
            const finalQual = userRating !== undefined 
              ? (qualScoreAuto * 0.6) + (userRating * 0.4)
              : qualScoreAuto;
            qualScores.push(finalQual);
          }
        });

        result[compKey] = {
          accuracy: accScores.length > 0 ? accScores.reduce((a, b) => a + b, 0) / accScores.length : null,
          quality: qualScores.length > 0 ? qualScores.reduce((a, b) => a + b, 0) / qualScores.length : null,
          count: accScores.length
        };
      });
      return result;
    };

    return {
      withOrkg: {
        scores: calcGroupScores(withOrkgPapers),
        count: withOrkgPapers.size
      },
      withoutOrkg: {
        scores: calcGroupScores(withoutOrkgPapers),
        count: withoutOrkgPapers.size
      }
    };
  }, [integratedData, aggregatedData]);

  // Calculate expertise distribution
  const expertiseDistribution = useMemo(() => {
    const distribution = {
      'Expert': { count: 0, color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-100' },
      'Advanced': { count: 0, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
      'Intermediate': { count: 0, color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100' },
      'Basic': { count: 0, color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      'Novice': { count: 0, color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-100' }
    };

    evaluatorsData.forEach(evaluator => {
      const expertise = evaluator.profile?.domainExpertise || 'Unknown';
      if (distribution[expertise]) {
        distribution[expertise].count++;
      }
    });

    return distribution;
  }, [evaluatorsData]);

  // Calculate ORKG experience distribution
  const orkgExperienceDistribution = useMemo(() => {
    let withExperience = 0;
    let withoutExperience = 0;

    evaluatorsData.forEach(evaluator => {
      if (evaluator.profile?.orkgExperience === 'used') {
        withExperience++;
      } else {
        withoutExperience++;
      }
    });

    const total = withExperience + withoutExperience;
    return {
      withExperience,
      withoutExperience,
      total,
      experiencePercentage: total > 0 ? (withExperience / total) * 100 : 0
    };
  }, [evaluatorsData]);

  // Role distribution
  const roleDistribution = useMemo(() => {
    const distribution = {};
    
    evaluatorsData.forEach(evaluator => {
      const role = evaluator.profile?.role || 'Unknown';
      if (!distribution[role]) {
        distribution[role] = {
          count: 0,
          evaluators: [],
          avgWeight: 0,
          totalWeight: 0
        };
      }
      distribution[role].count++;
      distribution[role].evaluators.push(evaluator);
      distribution[role].totalWeight += (evaluator.profile?.expertiseWeight || 1);
    });

    Object.values(distribution).forEach(role => {
      role.avgWeight = role.count > 0 ? role.totalWeight / role.count : 0;
    });

    return distribution;
  }, [evaluatorsData]);

  // Overall statistics
  const overallStats = useMemo(() => {
    if (evaluatorsData.length === 0) return null;

    const weights = evaluatorsData.map(e => e.profile?.expertiseWeight || 1);
    const multipliers = evaluatorsData.map(e => e.profile?.expertiseMultiplier || 1);
    
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const variance = weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length;
    const stdDev = Math.sqrt(variance);
    
    const avgMultiplier = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;

    let totalEvaluations = evaluatorsData.reduce((sum, e) => sum + (e.evaluations?.length || 0), 0);
    if (totalEvaluations === 0) {
      totalEvaluations = evaluatorsData.reduce((sum, e) => sum + (e.papersEvaluated?.length || 0), 0);
    }
    if (totalEvaluations === 0 && aggregatedData?.metadata?.totalEvaluations) {
      totalEvaluations = aggregatedData.metadata.totalEvaluations;
    }
    if (totalEvaluations === 0 && aggregatedData?.papers) {
      totalEvaluations = Object.keys(aggregatedData.papers).length;
    }

    return {
      avgWeight,
      avgMultiplier,
      stdDev,
      minWeight: Math.min(...weights),
      maxWeight: Math.max(...weights),
      totalEvaluators: evaluatorsData.length,
      totalEvaluations,
      totalRoles: Object.keys(roleDistribution).length
    };
  }, [evaluatorsData, roleDistribution, aggregatedData]);

  // FIXED: Calculate overall accuracy/quality from aggregatedData
  // Now properly applies: Final = (Automated × 60%) + (User Rating × 40%)
  // KEY FIX: User ratings are in compData.userRatings.mean (plural, already 0-1 scale)
  const overallScores = useMemo(() => {
    if (!aggregatedData?.papers) return null;

    const papers = Object.values(aggregatedData.papers);
    const result = {};

    // Calculate component-level scores with user ratings
    componentKeys.forEach(compKey => {
      const accScoresAuto = [];
      const qualScoresAuto = [];
      const userRatingsArr = [];
      const finalAccScores = [];
      const finalQualScores = [];

      papers.forEach(paper => {
        const compData = paper[compKey];
        if (!compData) return;

        // Get automated accuracy score
        const accScoreAuto = compData.accuracyScores?.mean ?? compData.scores?.mean;
        if (accScoreAuto !== undefined && !isNaN(accScoreAuto)) {
          accScoresAuto.push(accScoreAuto);
        }

        // Get automated quality score
        const qualScoreAuto = compData.qualityScores?.mean;
        if (qualScoreAuto !== undefined && !isNaN(qualScoreAuto) && qualScoreAuto > 0) {
          qualScoresAuto.push(qualScoreAuto);
        }

        // KEY FIX: Get user rating from userRatings.mean (already 0-1 scale)
        const userRating = compData.userRatings?.mean;
        if (userRating !== undefined && !isNaN(userRating)) {
          userRatingsArr.push(userRating);
        }

        // Calculate final scores per paper using formula: Final = (Auto × 60%) + (User × 40%)
        if (accScoreAuto !== undefined && userRating !== undefined) {
          finalAccScores.push((accScoreAuto * 0.6) + (userRating * 0.4));
        }
        if (qualScoreAuto !== undefined && userRating !== undefined) {
          finalQualScores.push((qualScoreAuto * 0.6) + (userRating * 0.4));
        }
      });

      const avgAccAuto = accScoresAuto.length > 0 ? accScoresAuto.reduce((a, b) => a + b, 0) / accScoresAuto.length : 0;
      const avgQualAuto = qualScoresAuto.length > 0 ? qualScoresAuto.reduce((a, b) => a + b, 0) / qualScoresAuto.length : 0;
      const avgUserRating = userRatingsArr.length > 0 ? userRatingsArr.reduce((a, b) => a + b, 0) / userRatingsArr.length : null;

      // Calculate final scores - average of per-paper finals, or apply formula to averages
      let finalAccuracy, finalQuality;
      
      if (finalAccScores.length > 0) {
        // Average of per-paper final scores
        finalAccuracy = finalAccScores.reduce((a, b) => a + b, 0) / finalAccScores.length;
      } else if (avgUserRating !== null) {
        // Apply formula to component averages
        finalAccuracy = (avgAccAuto * 0.6) + (avgUserRating * 0.4);
      } else {
        finalAccuracy = avgAccAuto;
      }

      if (finalQualScores.length > 0) {
        // Average of per-paper final scores
        finalQuality = finalQualScores.reduce((a, b) => a + b, 0) / finalQualScores.length;
      } else if (avgUserRating !== null) {
        // Apply formula to component averages
        finalQuality = (avgQualAuto * 0.6) + (avgUserRating * 0.4);
      } else {
        finalQuality = avgQualAuto;
      }

      result[compKey] = {
        accuracyAuto: avgAccAuto,
        qualityAuto: avgQualAuto,
        userRating: avgUserRating,
        accuracy: finalAccuracy,
        quality: finalQuality,
        accCount: accScoresAuto.length,
        qualCount: qualScoresAuto.length
      };
    });

    const validAcc = componentKeys.filter(k => result[k].accCount > 0);
    const validQual = componentKeys.filter(k => result[k].qualCount > 0);

    // Calculate overall averages of FINAL scores (matching Overview)
    const overallAccuracy = validAcc.length > 0 
      ? validAcc.reduce((sum, k) => sum + result[k].accuracy, 0) / validAcc.length 
      : 0;
    const overallQuality = validQual.length > 0 
      ? validQual.reduce((sum, k) => sum + result[k].quality, 0) / validQual.length 
      : 0;

    result.overall = {
      accuracy: overallAccuracy,
      quality: overallQuality,
      // Also store automated-only values for reference
      accuracyAuto: validAcc.length > 0 
        ? validAcc.reduce((sum, k) => sum + result[k].accuracyAuto, 0) / validAcc.length 
        : 0,
      qualityAuto: validQual.length > 0 
        ? validQual.reduce((sum, k) => sum + result[k].qualityAuto, 0) / validQual.length 
        : 0
    };

    return result;
  }, [aggregatedData]);

  if (!aggregatedData && !integratedData && !data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No expertise data available for analysis.</AlertDescription>
      </Alert>
    );
  }

  const roles = Object.keys(roleDistribution);
  const overallGap = overallScores ? overallScores.overall.quality - overallScores.overall.accuracy : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expertise-Weighted Analysis</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of evaluator expertise and its impact on accuracy vs quality assessments
          </p>
        </div>
        <Button
          onClick={() => setCompareMode(!compareMode)}
          variant={compareMode ? "default" : "outline"}
          size="sm"
        >
          <GitCompare className="h-4 w-4 mr-2" />
          {compareMode ? 'Hide' : 'Show'} Comparisons
        </Button>
      </div>

      {/* ========== SECTION 1: EXPERTISE WEIGHT CALCULATION ========== */}
      <Card className="p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowFormula(!showFormula)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calculator className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Expertise Weight Calculation</h3>
              <p className="text-sm text-orange-700">How evaluator expertise weights are computed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-500 text-white">
              Avg Weight: {overallStats?.avgWeight?.toFixed(2) ?? 'N/A'}
            </Badge>
            {showFormula ? <ChevronUp className="h-5 w-5 text-orange-600" /> : <ChevronDown className="h-5 w-5 text-orange-600" />}
          </div>
        </div>

        {showFormula && (
          <div className="mt-4 space-y-4">
            {/* Formula */}
            <div className="p-4 bg-white rounded-lg border border-orange-200">
              <p className="font-mono text-sm font-semibold text-orange-900 mb-2">
                expertiseWeight = roleWeight × domainMultiplier × experienceMultiplier
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Result is normalized to 1-5 scale. ORKG experience bonus applied separately where relevant.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Role Weights */}
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="font-semibold text-orange-800 mb-2">Role Weights (Base)</p>
                  <ul className="text-orange-700 space-y-0.5">
                    <li>Professor = <strong>5.0</strong></li>
                    <li>PostDoc = <strong>4.0</strong></li>
                    <li>Senior Researcher = <strong>4.0</strong></li>
                    <li>Researcher = <strong>3.5</strong></li>
                    <li>PhD Student = <strong>3.0</strong></li>
                    <li>Research Assistant = <strong>2.5</strong></li>
                    <li>Master Student = <strong>2.0</strong></li>
                    <li>Bachelor Student = <strong>1.5</strong></li>
                    <li>Other = <strong>1.0</strong></li>
                  </ul>
                </div>
                
                {/* Domain Multiplier */}
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="font-semibold text-orange-800 mb-2">Domain Expertise Multiplier</p>
                  <ul className="text-orange-700 space-y-0.5">
                    <li>Expert = <strong>2.0×</strong></li>
                    <li>Advanced = <strong>1.5×</strong></li>
                    <li>Intermediate = <strong>1.0×</strong></li>
                    <li>Basic = <strong>0.8×</strong></li>
                    <li>Novice = <strong>0.6×</strong></li>
                  </ul>
                </div>
                
                {/* Experience Multiplier */}
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="font-semibold text-orange-800 mb-2">Evaluation Experience Multiplier</p>
                  <ul className="text-orange-700 space-y-0.5">
                    <li>Extensive = <strong>1.3×</strong></li>
                    <li>Moderate = <strong>1.1×</strong></li>
                    <li>Limited = <strong>1.0×</strong></li>
                    <li>None = <strong>0.9×</strong></li>
                  </ul>
                  <div className="mt-2 pt-2 border-t border-orange-200">
                    <p className="font-semibold text-orange-800">ORKG Bonus</p>
                    <p className="text-orange-700">Applied separately for users with ORKG experience</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg border border-orange-200 text-center">
                <p className="text-xs text-gray-500">Min Weight</p>
                <p className="text-xl font-bold text-gray-700">{overallStats?.minWeight?.toFixed(2) ?? 'N/A'}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-orange-200 text-center">
                <p className="text-xs text-gray-500">Max Weight</p>
                <p className="text-xl font-bold text-gray-700">{overallStats?.maxWeight?.toFixed(2) ?? 'N/A'}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-orange-200 text-center">
                <p className="text-xs text-gray-500">Mean Weight</p>
                <p className="text-xl font-bold text-orange-600">{overallStats?.avgWeight?.toFixed(2) ?? 'N/A'}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-orange-200 text-center">
                <p className="text-xs text-gray-500">Std Deviation</p>
                <p className="text-xl font-bold text-gray-700">{overallStats?.stdDev?.toFixed(2) ?? 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ========== SECTION 2: HEADER STATS - FIXED TO MATCH OVERVIEW ========== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                Overall Accuracy <QualityIndicator />
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {overallScores ? (overallScores.overall.accuracy * 100).toFixed(1) : 'N/A'}%
              </p>
              <p className="text-xs text-amber-600 mt-1">(Auto × 60%) + (User × 40%)</p>
              {compareMode && overallScores && (
                <p className="text-xs text-purple-500 mt-1">
                  vs Quality: {(overallScores.overall.quality * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                Overall Quality <QualityIndicator />
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {overallScores ? (overallScores.overall.quality * 100).toFixed(1) : 'N/A'}%
              </p>
              <p className="text-xs text-amber-600 mt-1">(Auto × 60%) + (User × 40%)</p>
              {compareMode && overallScores && (
                <p className="text-xs text-green-600 mt-1">
                  Gap: {overallGap >= 0 ? '+' : ''}{(overallGap * 100).toFixed(1)}% vs Accuracy
                </p>
              )}
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Evaluators</p>
              <p className="text-2xl font-bold text-green-600">
                {overallStats?.totalEvaluators ?? 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {overallStats?.totalRoles ?? 0} different roles
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Evaluations</p>
              <p className="text-2xl font-bold text-indigo-600">
                {overallStats?.totalEvaluations ?? 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Across all papers
              </p>
            </div>
            <Layers className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* User Rating Note - Updated */}
      <UserRatingNote />

      {/* ========== SECTION 3: EXPERTISE IMPACT - ACCURACY VS QUALITY ========== */}
      {overallByExpertise && overallScores && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Expertise Impact: Accuracy vs Quality Analysis</h3>
                <p className="text-sm text-gray-600">How expertise level influences accuracy and quality assessments</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700">Key Research Insight</Badge>
          </div>

          {/* Tier Definitions */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Expertise Tier Definitions (based on expertiseWeight 1-5 scale)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-semibold text-green-800">Expert (4.0-5.0)</span>
                </div>
                <p className="text-green-700">Professor, PostDoc, Senior Researcher with high domain expertise</p>
              </div>
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-blue-800">Senior (3.0-4.0)</span>
                </div>
                <p className="text-blue-700">Researcher, PhD Student with advanced domain expertise</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="font-semibold text-yellow-800">Intermediate (2.0-3.0)</span>
                </div>
                <p className="text-yellow-700">PhD Student, Master Student with intermediate knowledge</p>
              </div>
              <div className="p-2 bg-gray-100 rounded border border-gray-300">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="font-semibold text-gray-700">Junior (0-2.0)</span>
                </div>
                <p className="text-gray-600">Research Assistant, Bachelor Student, General users</p>
              </div>
            </div>
          </div>

          {(() => {
            const tiers = ['expert', 'senior', 'intermediate', 'junior'];
            const tiersWithData = tiers.filter(t => 
              overallByExpertise[t]?.accuracy !== null && overallByExpertise[t]?.quality !== null
            );
            
            if (tiersWithData.length === 0) return null;

            const gaps = tiersWithData.map(t => ({
              tier: t,
              gap: (overallByExpertise[t]?.quality || 0) - (overallByExpertise[t]?.accuracy || 0),
              accuracy: overallByExpertise[t]?.accuracy || 0,
              quality: overallByExpertise[t]?.quality || 0
            }));

            const maxGapTier = gaps.reduce((max, g) => g.gap > max.gap ? g : max, gaps[0]);
            const minGapTier = gaps.reduce((min, g) => g.gap < min.gap ? g : min, gaps[0]);

            const tierColors = {
              expert: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
              senior: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
              intermediate: { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-700' },
              junior: { bg: 'bg-gray-400', light: 'bg-gray-100', text: 'text-gray-700' }
            };

            return (
              <>
                {/* Side-by-Side Accuracy vs Quality Bars for Each Tier */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Accuracy vs Quality by Expertise Tier
                  </h4>
                  <div className="space-y-4">
                    {gaps.map((g, idx) => (
                      <div key={g.tier} className={`p-4 rounded-lg border ${idx === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${tierColors[g.tier].bg}`} />
                            <span className="font-semibold capitalize">{g.tier}</span>
                            {idx === 0 && <Badge className="text-xs bg-green-100 text-green-700">Top Tier</Badge>}
                          </div>
                          <Badge variant="outline" className={g.gap >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                            Gap: {g.gap >= 0 ? '+' : ''}{(g.gap * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Accuracy Bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                                <Target className="h-3 w-3" /> Accuracy <QualityIndicator />
                              </span>
                              <span className="text-xs font-bold text-blue-700">{(g.accuracy * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(g.accuracy * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Quality Bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                                <Award className="h-3 w-3" /> Quality <QualityIndicator />
                              </span>
                              <span className="text-xs font-bold text-purple-700">{(g.quality * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(g.quality * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comprehensive Tier Comparison Table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300 bg-gray-50">
                        <th className="text-left py-3 px-3 font-semibold text-gray-700">Expertise Tier</th>
                        <th className="text-center py-3 px-3 font-semibold text-blue-600">
                          Accuracy
                          <span className="block text-xs font-normal text-amber-500 flex items-center justify-center gap-1">
                            <Star className="h-2.5 w-2.5" /> Final Score
                          </span>
                        </th>
                        <th className="text-center py-3 px-3 font-semibold text-purple-600">
                          Quality
                          <span className="block text-xs font-normal text-amber-500 flex items-center justify-center gap-1">
                            <Star className="h-2.5 w-2.5" /> Final Score
                          </span>
                        </th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-600">Gap (Q-A)</th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-600">vs Overall</th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-600">Bias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gaps.map((g, idx) => {
                        const vsOverall = g.gap - overallGap;
                        const biasLabel = g.gap > 0.05 ? 'Quality ↑' : g.gap < -0.05 ? 'Accuracy ↑' : 'Balanced';
                        const biasColor = g.gap > 0.05 ? 'text-purple-600 bg-purple-50' : g.gap < -0.05 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50';
                        
                        return (
                          <tr key={g.tier} className={`border-b ${idx === 0 ? 'bg-green-50' : ''}`}>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  g.tier === 'expert' ? 'bg-green-500' :
                                  g.tier === 'senior' ? 'bg-blue-500' :
                                  g.tier === 'intermediate' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`} />
                                <span className="font-medium capitalize">{g.tier}</span>
                                {idx === 0 && <Badge className="text-xs bg-green-100 text-green-700">Top Tier</Badge>}
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className="font-mono font-semibold text-blue-600">{(g.accuracy * 100).toFixed(1)}%</span>
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className="font-mono font-semibold text-purple-600">{(g.quality * 100).toFixed(1)}%</span>
                            </td>
                            <td className={`text-center py-3 px-3 font-mono ${g.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {g.gap >= 0 ? '+' : ''}{(g.gap * 100).toFixed(1)}%
                            </td>
                            <td className={`text-center py-3 px-3 font-mono text-xs ${
                              vsOverall >= 0 ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {vsOverall >= 0 ? '+' : ''}{(vsOverall * 100).toFixed(1)}%
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${biasColor}`}>
                                {biasLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 font-semibold border-t-2">
                        <td className="py-3 px-3">Overall Average</td>
                        <td className="text-center py-3 px-3 font-mono text-blue-700">
                          {(overallScores.overall.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-3 font-mono text-purple-700">
                          {(overallScores.overall.quality * 100).toFixed(1)}%
                        </td>
                        <td className={`text-center py-3 px-3 font-mono ${overallGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {overallGap >= 0 ? '+' : ''}{(overallGap * 100).toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-3 text-gray-400">—</td>
                        <td className="text-center py-3 px-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            overallGap > 0.05 ? 'text-purple-600 bg-purple-50' : 
                            overallGap < -0.05 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'
                          }`}>
                            {overallGap > 0.05 ? 'Quality ↑' : overallGap < -0.05 ? 'Accuracy ↑' : 'Balanced'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Interpretation */}
                <InterpretationBox type="insight">
                  <strong>Key Findings:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                    <li>
                      <strong>Gap Range:</strong> Quality-Accuracy gap ranges from {(minGapTier.gap * 100).toFixed(1)}% ({minGapTier.tier}) 
                      to {(maxGapTier.gap * 100).toFixed(1)}% ({maxGapTier.tier}).
                    </li>
                    <li className="text-amber-700">
                      <strong>Note:</strong> Both Accuracy and Quality use the formula: Final = (Automated × 60%) + (User Rating × 40%).
                    </li>
                  </ul>
                </InterpretationBox>
              </>
            );
          })()}
        </Card>
      )}

      {/* ========== SECTION 4: DOMAIN & ORKG EXPERIENCE ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Domain Coverage Card */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold">Domain Expertise Distribution</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(expertiseDistribution)
              .filter(([_, data]) => data.count > 0)
              .map(([level, data]) => {
              const total = evaluatorsData.length;
              const percentage = total > 0 ? (data.count / total) * 100 : 0;
              
              return (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${data.color}`} />
                      <span className="font-medium">{level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${data.bgColor} ${data.textColor} border-0`}>
                        {data.count}
                      </Badge>
                      <span className="text-gray-500 text-xs w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${data.color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t text-sm text-gray-600">
            Total Evaluators: <span className="font-semibold">{evaluatorsData.length}</span>
          </div>
        </Card>

        {/* ORKG Experience Card */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" style={{ color: 'rgb(232, 97, 97)' }} />
            <h3 className="text-lg font-semibold">ORKG Experience</h3>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" stroke="rgb(232, 97, 97)" strokeWidth="12" fill="none"
                  strokeDasharray={`${orkgExperienceDistribution.experiencePercentage * 3.52} 352`}
                  className="transition-all duration-500" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {orkgExperienceDistribution.experiencePercentage.toFixed(0)}%
                </span>
                <span className="text-xs text-gray-500">with ORKG exp.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(232, 97, 97, 0.1)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(232, 97, 97)' }} />
                <span className="text-sm font-medium" style={{ color: 'rgb(180, 60, 60)' }}>With ORKG Experience</span>
              </div>
              <Badge style={{ backgroundColor: 'rgb(232, 97, 97)', color: 'white' }}>{orkgExperienceDistribution.withExperience}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-gray-600">Without ORKG Experience</span>
              </div>
              <Badge variant="secondary">{orkgExperienceDistribution.withoutExperience}</Badge>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500 italic">
            ORKG experience provides a bonus to expertise weight, improving evaluation validity for knowledge graph assessment.
          </p>
        </Card>
      </div>

      {/* ========== SECTION 5: ROLE-BASED ANALYSIS ========== */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Role-Based Analysis</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ')} ({roleDistribution[role].count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(roleDistribution)
            .filter(([role]) => selectedRole === 'all' || selectedRole === role)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([role, data]) => (
              <div key={role} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium capitalize">{role.replace(/_/g, ' ')}</h4>
                      <p className="text-xs text-gray-500">{data.count} evaluator{data.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Avg Weight: {data.avgWeight.toFixed(2)}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {data.evaluators.reduce((sum, e) => sum + (e.papersEvaluated?.length || 0), 0)} papers
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* ========== SECTION 6: RESEARCH FINDINGS ========== */}
      <ResearchFindings title="📊 Research Findings: Expertise-Weighted Evaluation Analysis" defaultOpen={false}>
        <div className="space-y-4">
          {/* Evaluator Pool */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-900 mb-2">1. Evaluator Pool Characteristics</h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Pool Composition:</strong> {overallStats?.totalEvaluators || 0} evaluators across {overallStats?.totalRoles || 0} professional roles 
                contributed {overallStats?.totalEvaluations || 0} evaluations.
              </li>
              <li>
                <strong>Expertise Weight Distribution:</strong> Weights ranged from {overallStats?.minWeight?.toFixed(2)} to {overallStats?.maxWeight?.toFixed(2)} 
                (M = {overallStats?.avgWeight?.toFixed(2)}, SD = {overallStats?.stdDev?.toFixed(2)}).
              </li>
              <li>
                <strong>ORKG Familiarity:</strong> {orkgExperienceDistribution.experiencePercentage.toFixed(0)}% of evaluators 
                ({orkgExperienceDistribution.withExperience}/{orkgExperienceDistribution.total}) had prior ORKG experience.
              </li>
            </ul>
          </div>

          {/* Score Composition Note */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              2. Score Composition (Matching Overview)
            </h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Both Accuracy and Quality:</strong> Use the formula Final = (Automated × 60%) + (User Rating × 40%)
              </li>
              <li>
                <strong>Accuracy:</strong> Measures how well extracted values match ground truth.
              </li>
              <li>
                <strong>Quality:</strong> Measures completeness, consistency, and validity.
              </li>
            </ul>
          </div>

          {/* System Interpretation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 System Interpretation</h4>
            <p className="text-sm text-gray-700 italic leading-relaxed">
              "The evaluation study employed {overallStats?.totalEvaluators || 0} domain experts across {overallStats?.totalRoles || 0} 
              professional roles, contributing {overallStats?.totalEvaluations || 0} evaluations. 
              {overallScores && ` The system achieved overall accuracy of ${(overallScores.overall.accuracy * 100).toFixed(1)}% and quality of ${(overallScores.overall.quality * 100).toFixed(1)}%, with a gap of ${overallGap >= 0 ? '+' : ''}${(overallGap * 100).toFixed(1)}%.`}
              "
            </p>
          </div>
        </div>
      </ResearchFindings>
    </div>
  );
};

export default ExpertiseWeightedAnalysis;