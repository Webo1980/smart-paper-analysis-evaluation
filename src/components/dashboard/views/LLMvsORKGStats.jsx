import React, { useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Zap, Database, TrendingUp, PieChart, Info, Users } from 'lucide-react';
import MetricsExtractor from '../../../utils/metricsExtractor';

/**
 * LLMvsORKGStats Component
 * 
 * Displays statistics about the usage of LLM-generated vs ORKG-sourced
 * research problems and templates.
 * 
 * FIXED: Now properly counts unique papers (by DOI) instead of evaluations
 */
const LLMvsORKGStats = ({ integratedPapers }) => {
  const isLoading = integratedPapers === undefined || integratedPapers === null;

  // Calculate stats and paper counts
  const { stats, paperCounts } = useMemo(() => {
    if (!Array.isArray(integratedPapers) || integratedPapers.length === 0) {
      return { stats: null, paperCounts: null };
    }
    
    // Deduplicate papers by DOI to get unique papers
    const uniquePapersMap = new Map();
    integratedPapers.forEach(paper => {
      const key = paper.doi || paper.token || paper.id;
      if (key && !uniquePapersMap.has(key)) {
        uniquePapersMap.set(key, paper);
      }
    });
    const uniquePapers = Array.from(uniquePapersMap.values());
    
    // Count papers with multiple evaluations
    const evaluationCounts = new Map();
    integratedPapers.forEach(paper => {
      const key = paper.doi || paper.token || paper.id;
      if (key) {
        evaluationCounts.set(key, (evaluationCounts.get(key) || 0) + 1);
      }
    });
    const papersWithMultipleEvals = Array.from(evaluationCounts.values()).filter(c => c > 1).length;
    
    // Calculate stats using unique papers only
    const calculatedStats = MetricsExtractor.calculateLLMvsORKGStats(uniquePapers);
    
    return {
      stats: calculatedStats,
      paperCounts: {
        uniquePapers: uniquePapers.length,
        totalEvaluations: integratedPapers.length,
        papersWithMultipleEvals
      }
    };
  }, [integratedPapers]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Loading…</div>
      </Card>
    );
  }

  console.log('LLMvsORKGStats - stats:', stats);
  console.log('LLMvsORKGStats - paperCounts:', paperCounts);

  if (!stats) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No LLM vs ORKG statistics available
        </div>
      </Card>
    );
  }

  const SourceCard = ({ title, llmCount, orkgCount, total, llmPercentage, orkgPercentage, icon: Icon }) => {
    if (total === 0) {
      return (
        <Card className="p-6 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
          </div>
          <div className="text-center text-gray-400 py-4">
            No data available
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        {/* Total Count */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-600">Unique Papers</div>
        </div>

        {/* LLM vs ORKG Breakdown */}
        <div className="space-y-4">
          {/* LLM Generated */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">LLM Generated</span>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                {llmPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${llmPercentage}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              {llmCount} paper{llmCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* ORKG Sourced */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">ORKG Sourced</span>
              </div>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                {orkgPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${orkgPercentage}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              {orkgCount} paper{orkgCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Visual Pie Representation */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">LLM: {llmCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm">ORKG: {orkgCount}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const dominant = (llm, orkg) => {
    if (llm > orkg) return 'LLM';
    if (orkg > llm) return 'ORKG';
    return 'Balanced';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          LLM vs ORKG Usage Statistics
        </h2>
        <p className="text-gray-600 mt-1">
          Analysis of data source selection across {paperCounts?.uniquePapers || 0} unique paper{paperCounts?.uniquePapers !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Data Coverage Info */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>
              <strong>{paperCounts?.uniquePapers || 0}</strong> unique papers with system output
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              <strong>{paperCounts?.totalEvaluations || 0}</strong> total evaluations
            </span>
          </div>
          {paperCounts?.papersWithMultipleEvals > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {paperCounts.papersWithMultipleEvals} paper{paperCounts.papersWithMultipleEvals !== 1 ? 's' : ''} evaluated by multiple users
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SourceCard 
          title="Research Problems"
          llmCount={stats.problems.llm}
          orkgCount={stats.problems.orkg}
          total={stats.problems.total}
          llmPercentage={stats.problems.llmPercentage}
          orkgPercentage={stats.problems.orkgPercentage}
          icon={PieChart}
        />

        <SourceCard 
          title="Templates"
          llmCount={stats.templates.llm}
          orkgCount={stats.templates.orkg}
          total={stats.templates.total}
          llmPercentage={stats.templates.llmPercentage}
          orkgPercentage={stats.templates.orkgPercentage}
          icon={PieChart}
        />
      </div>

      {/* Summary Insights */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Research Problem Source</div>
            <div className="text-2xl font-bold text-gray-900">
              {dominant(stats.problems.llm, stats.problems.orkg)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.problems.llm} of {stats.problems.total} papers ({stats.problems.llmPercentage.toFixed(1)}%) used LLM-generated problems
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Template Source</div>
            <div className="text-2xl font-bold text-gray-900">
              {dominant(stats.templates.llm, stats.templates.orkg)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.templates.llm} of {stats.templates.total} papers ({stats.templates.llmPercentage.toFixed(1)}%) used LLM-generated templates
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Overall LLM Usage</div>
            <div className="text-2xl font-bold text-blue-700">
              {((stats.problems.llm + stats.templates.llm) / Math.max(stats.problems.total + stats.templates.total, 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.problems.llm + stats.templates.llm} of {stats.problems.total + stats.templates.total} source selections
              <span className="block text-gray-400 mt-0.5">
                (each paper has 2 selections: problem + template)
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Overall ORKG Usage</div>
            <div className="text-2xl font-bold text-purple-700">
              {((stats.problems.orkg + stats.templates.orkg) / Math.max(stats.problems.total + stats.templates.total, 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.problems.orkg + stats.templates.orkg} of {stats.problems.total + stats.templates.total} source selections
              <span className="block text-gray-400 mt-0.5">
                (each paper has 2 selections: problem + template)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-gray-50">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium">LLM Generated:</span>
            <span className="text-gray-600">System-generated using large language models</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" />
            <span className="font-medium">ORKG Sourced:</span>
            <span className="text-gray-600">Retrieved from Open Research Knowledge Graph</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LLMvsORKGStats;