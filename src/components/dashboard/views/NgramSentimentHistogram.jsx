/**
 * NgramSentimentHistogram Component
 * 
 * Displays a normalized histogram showing sentiment distribution
 * at different comment lengths (n-gram / word count bins)
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { BarChart3, Settings } from 'lucide-react';
import { Button } from '../../ui/button';

import { analyzeSentiment, categorizeSentiment } from '../../../services/sentimentAnalysisService';

// Color scheme for sentiments
const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444'
};

/**
 * Calculate n-gram length (word count) for a text
 */
const getWordCount = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Create bins for n-gram lengths
 */
const createBins = (comments, binSize = 5, maxBins = 15) => {
  // Get all word counts
  const wordCounts = comments.map(c => getWordCount(c.text));
  const maxCount = Math.max(...wordCounts, 1);
  
  // Create bins
  const bins = [];
  for (let i = 0; i < maxBins && i * binSize < maxCount + binSize; i++) {
    const binStart = i * binSize + 1;
    const binEnd = (i + 1) * binSize;
    bins.push({
      binIndex: i,
      binStart,
      binEnd,
      label: binSize === 1 ? `${binStart}` : `${binStart}-${binEnd}`,
      shortLabel: binSize === 1 ? `${binStart}` : `${binStart}-${binEnd}`,
      comments: []
    });
  }
  
  return bins;
};

/**
 * Assign comments to bins based on word count
 */
const assignToBins = (comments, bins, binSize) => {
  comments.forEach(comment => {
    const wordCount = getWordCount(comment.text);
    const binIndex = Math.floor((wordCount - 1) / binSize);
    
    if (binIndex >= 0 && binIndex < bins.length) {
      bins[binIndex].comments.push({
        ...comment,
        wordCount,
        sentiment: analyzeSentiment(comment.text)
      });
    }
  });
  
  return bins;
};

/**
 * Calculate normalized sentiment distribution for each bin
 */
const calculateNormalizedDistribution = (bins) => {
  return bins.map(bin => {
    const total = bin.comments.length;
    
    if (total === 0) {
      return {
        ...bin,
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        avgSentimentScore: 0
      };
    }
    
    // Count sentiments
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let totalScore = 0;
    
    bin.comments.forEach(comment => {
      const category = categorizeSentiment(comment.sentiment.sentiment);
      if (category === 'positive') positiveCount++;
      else if (category === 'neutral') neutralCount++;
      else negativeCount++;
      
      totalScore += comment.sentiment.normalizedScore;
    });
    
    // Calculate normalized percentages
    return {
      ...bin,
      total,
      positive: (positiveCount / total) * 100,
      neutral: (neutralCount / total) * 100,
      negative: (negativeCount / total) * 100,
      positiveCount,
      neutralCount,
      negativeCount,
      avgSentimentScore: (totalScore / total) * 100
    };
  }).filter(bin => bin.total > 0); // Only include bins with data
};

/**
 * Custom tooltip for the histogram
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;
  
  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
      <p className="font-semibold mb-2">Words: {data.label}</p>
      <p className="text-gray-600 mb-2">Total comments: {data.total}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: SENTIMENT_COLORS.positive }} />
          <span>Positive: {data.positive.toFixed(1)}% ({data.positiveCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: SENTIMENT_COLORS.neutral }} />
          <span>Neutral: {data.neutral.toFixed(1)}% ({data.neutralCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: SENTIMENT_COLORS.negative }} />
          <span>Negative: {data.negative.toFixed(1)}% ({data.negativeCount})</span>
        </div>
      </div>
      <p className="mt-2 text-gray-500 border-t pt-2">
        Avg. sentiment: {data.avgSentimentScore.toFixed(1)}%
      </p>
    </div>
  );
};

/**
 * Main component
 */
const NgramSentimentHistogram = ({ comments }) => {
  const [binSize, setBinSize] = useState(5);
  const [chartType, setChartType] = useState('stacked'); // 'stacked', 'grouped', 'area'
  
  // Calculate histogram data
  const histogramData = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    
    // Create and populate bins
    const bins = createBins(comments, binSize);
    const populatedBins = assignToBins(comments, bins, binSize);
    const normalizedData = calculateNormalizedDistribution(populatedBins);
    
    return normalizedData;
  }, [comments, binSize]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!comments || comments.length === 0) return null;
    
    const wordCounts = comments.map(c => getWordCount(c.text));
    const sorted = [...wordCounts].sort((a, b) => a - b);
    
    return {
      min: Math.min(...wordCounts),
      max: Math.max(...wordCounts),
      mean: (wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length).toFixed(1),
      median: sorted[Math.floor(sorted.length / 2)],
      total: comments.length
    };
  }, [comments]);
  
  if (!comments || comments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">No comments available for analysis.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Sentiment Distribution by Comment Length
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Normalized histogram showing sentiment proportions at different n-gram lengths
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bin size selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Bin size:</span>
              <select
                value={binSize}
                onChange={(e) => setBinSize(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={1}>1 word</option>
                <option value={3}>3 words</option>
                <option value={5}>5 words</option>
                <option value={10}>10 words</option>
              </select>
            </div>
            {/* Chart type selector */}
            <div className="flex items-center gap-1 border rounded p-1">
              <Button
                variant={chartType === 'stacked' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('stacked')}
                className="h-7 px-2"
              >
                Stacked
              </Button>
              <Button
                variant={chartType === 'grouped' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('grouped')}
                className="h-7 px-2"
              >
                Grouped
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('area')}
                className="h-7 px-2"
              >
                Area
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics summary */}
        {stats && (
          <div className="flex gap-4 mb-4 text-sm">
            <div className="px-3 py-2 bg-gray-50 rounded">
              <span className="text-gray-500">Comments:</span>{' '}
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded">
              <span className="text-gray-500">Min words:</span>{' '}
              <span className="font-medium">{stats.min}</span>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded">
              <span className="text-gray-500">Max words:</span>{' '}
              <span className="font-medium">{stats.max}</span>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded">
              <span className="text-gray-500">Mean:</span>{' '}
              <span className="font-medium">{stats.mean}</span>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded">
              <span className="text-gray-500">Median:</span>{' '}
              <span className="font-medium">{stats.median}</span>
            </div>
          </div>
        )}
        
        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'area' ? (
            <AreaChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                label={{ value: 'Word Count', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="1"
                stroke={SENTIMENT_COLORS.positive}
                fill={SENTIMENT_COLORS.positive}
                fillOpacity={0.8}
                name="Positive"
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke={SENTIMENT_COLORS.neutral}
                fill={SENTIMENT_COLORS.neutral}
                fillOpacity={0.8}
                name="Neutral"
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke={SENTIMENT_COLORS.negative}
                fill={SENTIMENT_COLORS.negative}
                fillOpacity={0.8}
                name="Negative"
              />
            </AreaChart>
          ) : (
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                label={{ value: 'Word Count', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="positive"
                stackId={chartType === 'stacked' ? 'a' : undefined}
                fill={SENTIMENT_COLORS.positive}
                name="Positive"
                radius={chartType === 'grouped' ? [4, 4, 0, 0] : undefined}
              />
              <Bar
                dataKey="neutral"
                stackId={chartType === 'stacked' ? 'a' : undefined}
                fill={SENTIMENT_COLORS.neutral}
                name="Neutral"
                radius={chartType === 'grouped' ? [4, 4, 0, 0] : undefined}
              />
              <Bar
                dataKey="negative"
                stackId={chartType === 'stacked' ? 'a' : undefined}
                fill={SENTIMENT_COLORS.negative}
                name="Negative"
                radius={chartType === 'grouped' ? [4, 4, 0, 0] : undefined}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
        
        {/* Data table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Word Range</th>
                <th className="text-center p-2">Count</th>
                <th className="text-center p-2">
                  <span className="inline-flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: SENTIMENT_COLORS.positive }} />
                    Positive
                  </span>
                </th>
                <th className="text-center p-2">
                  <span className="inline-flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: SENTIMENT_COLORS.neutral }} />
                    Neutral
                  </span>
                </th>
                <th className="text-center p-2">
                  <span className="inline-flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: SENTIMENT_COLORS.negative }} />
                    Negative
                  </span>
                </th>
                <th className="text-center p-2">Avg. Score</th>
              </tr>
            </thead>
            <tbody>
              {histogramData.map((bin, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{bin.label} words</td>
                  <td className="p-2 text-center">{bin.total}</td>
                  <td className="p-2 text-center">
                    <span className="text-green-700">{bin.positive.toFixed(1)}%</span>
                    <span className="text-gray-400 text-xs ml-1">({bin.positiveCount})</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="text-yellow-700">{bin.neutral.toFixed(1)}%</span>
                    <span className="text-gray-400 text-xs ml-1">({bin.neutralCount})</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="text-red-700">{bin.negative.toFixed(1)}%</span>
                    <span className="text-gray-400 text-xs ml-1">({bin.negativeCount})</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      bin.avgSentimentScore > 60 ? 'bg-green-100 text-green-700' :
                      bin.avgSentimentScore < 40 ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {bin.avgSentimentScore.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default NgramSentimentHistogram;