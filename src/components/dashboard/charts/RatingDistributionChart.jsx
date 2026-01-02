// src/components/dashboard/charts/SectionPerformanceRadar.jsx
import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Radar, Download, AlertCircle } from 'lucide-react';

const SectionPerformanceRadar = ({ data, aggregatedData }) => {
  const [showMetrics, setShowMetrics] = useState('score');
  const [compareMode, setCompareMode] = useState(false);

  console.log('🎯 Radar Chart - Data received:', {
    hasAggregatedData: !!aggregatedData,
    hasComponents: !!aggregatedData?.components,
    componentKeys: aggregatedData?.components ? Object.keys(aggregatedData.components) : []
  });

  if (!aggregatedData?.components) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No component performance data available.
        </AlertDescription>
      </Alert>
    );
  }

  // Extract radar data directly from aggregatedData.components
  const radarData = useMemo(() => {
    const components = [
      { id: 'metadata', label: 'Metadata', color: '#3b82f6' },
      { id: 'research_field', label: 'Research Field', color: '#22c55e' },
      { id: 'research_problem', label: 'Research Problem', color: '#f97316' },
      { id: 'template', label: 'Template', color: '#a855f7' },
      { id: 'content', label: 'Content', color: '#ef4444' }
    ];

    return components.map(comp => {
      const compData = aggregatedData.components[comp.id];
      
      if (!compData) {
        console.warn(`⚠️ Component ${comp.id} not found in aggregatedData`);
        return { ...comp, score: 0, completeness: 0, coverage: 0, evaluationCount: 0, std: 0 };
      }

      const result = {
        ...comp,
        score: compData.scores?.mean || 0,
        completeness: compData.scores?.mean || 0,
        coverage: compData.coverageRate || 0,
        evaluationCount: compData.evaluationCount || 0,
        std: compData.scores?.std || 0
      };

      console.log(`✅ ${comp.id}:`, result);
      return result;
    });
  }, [aggregatedData]);

  const createRadarPath = (values, maxValue = 1) => {
    const center = 200;
    const radius = 150;
    const angleStep = (2 * Math.PI) / values.length;
    
    return values.map((value, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const r = (value / maxValue) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y };
    }).map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`
    ).join(' ') + ' Z';
  };

  const getMetricValues = () => {
    const values = radarData.map(d => {
      switch (showMetrics) {
        case 'score': return d.score;
        case 'completeness': return d.completeness;
        case 'coverage': return d.coverage;
        default: return d.score;
      }
    });
    console.log('📊 Metric values:', values);
    return values;
  };

  const metricValues = getMetricValues();
  const comparisonValues = compareMode ? radarData.map(d => d.coverage) : null;
  const overallScore = metricValues.reduce((a, b) => a + b, 0) / metricValues.length;

  const handleExport = () => {
    const exportData = {
      components: radarData.map(d => ({
        component: d.label,
        score: (d.score * 100).toFixed(1),
        completeness: (d.completeness * 100).toFixed(1),
        coverage: (d.coverage * 100).toFixed(1),
        evaluationCount: d.evaluationCount
      })),
      metric: showMetrics,
      overallScore: (overallScore * 100).toFixed(1),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component_performance_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Component Performance Radar</h3>
          <p className="text-xs text-gray-600 mt-1">
            Visualization of component-level performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={showMetrics}
            onChange={(e) => setShowMetrics(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="score">Score</option>
            <option value="completeness">Completeness</option>
            <option value="coverage">Coverage</option>
          </select>
          
          <Button
            onClick={() => setCompareMode(!compareMode)}
            variant={compareMode ? "default" : "outline"}
            size="sm"
          >
            Compare
          </Button>
          
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{(overallScore * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Overall {showMetrics.charAt(0).toUpperCase() + showMetrics.slice(1)}</div>
        </div>
      </div>

      <div className="flex justify-center">
        <svg width="400" height="400" viewBox="0 0 400 400">
          {[0.2, 0.4, 0.6, 0.8, 1].map((level, index) => (
            <circle key={index} cx="200" cy="200" r={150 * level} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray={index === 4 ? "0" : "2,2"} />
          ))}
          
          {radarData.map((_, index) => {
            const angleStep = (2 * Math.PI) / radarData.length;
            const angle = index * angleStep - Math.PI / 2;
            const x = 200 + 150 * Math.cos(angle);
            const y = 200 + 150 * Math.sin(angle);
            return <line key={index} x1="200" y1="200" x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
          })}
          
          {[0.2, 0.4, 0.6, 0.8, 1].map((level, index) => (
            <text key={index} x="200" y={200 - 150 * level} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-400">
              {(level * 100).toFixed(0)}%
            </text>
          ))}
          
          {compareMode && comparisonValues && (
            <path d={createRadarPath(comparisonValues)} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
          )}
          
          <path d={createRadarPath(metricValues)} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
          
          {metricValues.map((value, index) => {
            const angleStep = (2 * Math.PI) / metricValues.length;
            const angle = index * angleStep - Math.PI / 2;
            const r = value * 150;
            const x = 200 + r * Math.cos(angle);
            const y = 200 + r * Math.sin(angle);
            return (
              <circle key={index} cx={x} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" className="cursor-pointer">
                <title>{radarData[index].label}: {(value * 100).toFixed(1)}%</title>
              </circle>
            );
          })}
          
          {radarData.map((component, index) => {
            const angleStep = (2 * Math.PI) / radarData.length;
            const angle = index * angleStep - Math.PI / 2;
            const labelRadius = 175;
            const x = 200 + labelRadius * Math.cos(angle);
            const y = 200 + labelRadius * Math.sin(angle);
            return (
              <text key={index} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-xs font-medium" fill={component.color}>
                {component.label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0 border-t-2 border-blue-500" />
          <span className="text-xs text-gray-600">{showMetrics.charAt(0).toUpperCase() + showMetrics.slice(1)}</span>
        </div>
        {compareMode && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0 border-t-2 border-red-500 border-dashed" />
            <span className="text-xs text-gray-600">Coverage (Comparison)</span>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Component</th>
              <th className="text-right py-2">Score</th>
              <th className="text-right py-2">Completeness</th>
              <th className="text-right py-2">Coverage</th>
              <th className="text-right py-2">Evaluations</th>
            </tr>
          </thead>
          <tbody>
            {radarData.map((component, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: component.color }} />
                    {component.label}
                  </div>
                </td>
                <td className="text-right py-2">
                  <Badge variant="outline" className="text-xs">{(component.score * 100).toFixed(1)}%</Badge>
                </td>
                <td className="text-right py-2">
                  <Badge variant="outline" className="text-xs">{(component.completeness * 100).toFixed(1)}%</Badge>
                </td>
                <td className="text-right py-2">
                  <Badge variant="outline" className="text-xs">{(component.coverage * 100).toFixed(1)}%</Badge>
                </td>
                <td className="text-right py-2">
                  <Badge variant="secondary" className="text-xs">{component.evaluationCount}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Alert className="mt-4 bg-blue-50 border-blue-200">
        <Radar className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm font-medium mb-1">Performance Insights:</p>
          <ul className="text-xs space-y-1">
            {radarData.filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map((comp, idx) => (
              <li key={idx}><strong>{comp.label}</strong> is performing well at {(comp.score * 100).toFixed(0)}%</li>
            ))}
            {radarData.filter(c => c.score > 0 && c.score < 0.7).sort((a, b) => a.score - b.score).slice(0, 1).map((comp, idx) => (
              <li key={idx}><strong>{comp.label}</strong> may need attention ({(comp.score * 100).toFixed(0)}%)</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </Card>
  );
};

export default SectionPerformanceRadar;