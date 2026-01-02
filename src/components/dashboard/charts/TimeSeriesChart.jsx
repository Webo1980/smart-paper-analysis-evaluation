// src/components/dashboard/charts/TimeSeriesChart.jsx
import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { TrendingUp, TrendingDown, Minus, Calendar, Info, AlertCircle } from 'lucide-react';

const TimeSeriesChart = ({ data, aggregatedData }) => {
  const [selectedMetric, setSelectedMetric] = useState('score');
  const [showMovingAverage, setShowMovingAverage] = useState(true);

  console.log('📈 TimeSeries - Data received:', {
    hasAggregatedData: !!aggregatedData,
    hasTemporal: !!aggregatedData?.temporal,
    temporalTimeline: aggregatedData?.temporal?.timeline,
    timelineLength: aggregatedData?.temporal?.timeline?.length
  });

  if (!aggregatedData?.temporal?.timeline) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No time series data available.</AlertDescription>
      </Alert>
    );
  }

  // Use the pre-calculated temporal data
  const timeSeriesData = useMemo(() => {
    const timeline = aggregatedData.temporal.timeline || [];
    
    console.log('📈 Processing timeline:', timeline);

    if (timeline.length === 0) {
      return { aggregated: [], movingAverage: [], startDate: null, endDate: null };
    }

    // Sort by date
    const sorted = [...timeline].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const startDate = new Date(sorted[0].date);
    const endDate = new Date(sorted[sorted.length - 1].date);

    // Calculate moving average
    const movingAverage = [];
    const window = 3; // 3-point moving average
    
    sorted.forEach((point, index) => {
      const start = Math.max(0, index - window + 1);
      const windowPoints = sorted.slice(start, index + 1);
      const avgValue = windowPoints.reduce((sum, p) => sum + p.avgScore, 0) / windowPoints.length;
      
      movingAverage.push({
        date: point.date,
        value: avgValue
      });
    });

    console.log('📈 Processed data:', { aggregated: sorted, movingAverage });

    return {
      aggregated: sorted,
      movingAverage,
      startDate,
      endDate
    };
  }, [aggregatedData]);

  // Calculate trend
  const trend = useMemo(() => {
    if (timeSeriesData.aggregated.length < 2) return null;
    
    const firstHalf = timeSeriesData.aggregated.slice(0, Math.floor(timeSeriesData.aggregated.length / 2));
    const secondHalf = timeSeriesData.aggregated.slice(Math.floor(timeSeriesData.aggregated.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.avgScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.avgScore, 0) / secondHalf.length;
    const change = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      percentage: Math.abs(change)
    };
  }, [timeSeriesData]);

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value) => `${(value * 100).toFixed(1)}%`;

  const maxValue = 1; // Scores are 0-1

  if (timeSeriesData.aggregated.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Temporal Trends</h3>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>No temporal data available for visualization.</AlertDescription>
        </Alert>
      </Card>
    );
  }

  const maxCount = Math.max(...timeSeriesData.aggregated.map(p => p.count), 1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Temporal Trends</h3>
          {trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <Badge className={
                trend.direction === 'up' ? 'bg-green-100 text-green-800' :
                trend.direction === 'down' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }>
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                {trend.percentage.toFixed(1)}%
              </Badge>
            </div>
          )}
        </div>
        
        <Button
          onClick={() => setShowMovingAverage(!showMovingAverage)}
          variant={showMovingAverage ? "default" : "outline"}
          size="sm"
        >
          MA
        </Button>
      </div>

      {/* Chart Area */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
          {[100, 75, 50, 25, 0].map((value, i) => (
            <div key={i}>{value}%</div>
          ))}
        </div>

        {/* Chart */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
              <div key={i} className="absolute w-full border-t border-gray-200" style={{ top: `${fraction * 100}%` }} />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between px-2">
            {timeSeriesData.aggregated.map((point, index) => {
              const height = (point.avgScore / maxValue) * 100;
              
              return (
                <div key={index} className="relative group" style={{ width: `${100 / timeSeriesData.aggregated.length - 1}%` }}>
                  <div
                    className="bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer mx-1 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div className="font-bold">{formatValue(point.avgScore)}</div>
                      <div className="text-gray-300">{formatDate(point.date)}</div>
                      <div className="text-gray-400">{point.count} evaluations</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Moving Average Line */}
          {showMovingAverage && timeSeriesData.movingAverage.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="5,5"
                points={timeSeriesData.movingAverage.map((point, index) => {
                  const x = (index / (timeSeriesData.movingAverage.length - 1)) * 100;
                  const y = 100 - (point.value / maxValue) * 100;
                  return `${x},${y}`;
                }).join(' ')}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mt-2 flex justify-between text-xs text-gray-500">
          {timeSeriesData.aggregated.map((point, index) => {
            if (timeSeriesData.aggregated.length > 10 && index % 2 !== 0) return null;
            return (
              <div key={index} className="text-center">{formatDate(point.date)}</div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-xs text-gray-600">Average Score</span>
          </div>
          {showMovingAverage && (
            <div className="flex items-center gap-2">
              <div className="w-4 border-t-2 border-red-500 border-dashed" />
              <span className="text-xs text-gray-600">Moving Average</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>
            {timeSeriesData.startDate && timeSeriesData.endDate && 
              `${timeSeriesData.startDate.toLocaleDateString()} - ${timeSeriesData.endDate.toLocaleDateString()}`
            }
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-600">Total Evaluations</p>
          <p className="text-xl font-bold text-blue-600">
            {timeSeriesData.aggregated.reduce((sum, p) => sum + p.count, 0)}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="text-xs text-gray-600">Average Score</p>
          <p className="text-xl font-bold text-green-600">
            {formatValue(timeSeriesData.aggregated.reduce((sum, p) => sum + p.avgScore, 0) / timeSeriesData.aggregated.length)}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <p className="text-xs text-gray-600">Time Points</p>
          <p className="text-xl font-bold text-purple-600">
            {timeSeriesData.aggregated.length}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TimeSeriesChart;