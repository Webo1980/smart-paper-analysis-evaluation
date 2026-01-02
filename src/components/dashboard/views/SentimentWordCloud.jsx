/**
 * SentimentWordCloud Component
 * 
 * An impressive, interactive word cloud visualization featuring:
 * - SVG-based word cloud with collision detection
 * - Color coding by sentiment (positive/neutral/negative)
 * - Size based on word frequency
 * - Interactive hover effects with detailed tooltips
 * - Multiple visualization modes (cloud, spiral, grid, bubble)
 * - Filtering by sentiment and component
 * - Animated transitions
 * - Export functionality
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  Cloud, Download, Filter, Sparkles, Circle, Grid3X3, 
  Waves, Zap, Eye, EyeOff, RefreshCw, Settings,
  TrendingUp, TrendingDown, Minus, Info
} from 'lucide-react';

import { analyzeSentiment, categorizeSentiment } from '../../../services/sentimentAnalysisService';

// Sentiment color schemes
const SENTIMENT_SCHEMES = {
  classic: {
    positive: { primary: '#22c55e', secondary: '#86efac', glow: 'rgba(34, 197, 94, 0.3)' },
    neutral: { primary: '#eab308', secondary: '#fde047', glow: 'rgba(234, 179, 8, 0.3)' },
    negative: { primary: '#ef4444', secondary: '#fca5a5', glow: 'rgba(239, 68, 68, 0.3)' }
  },
  neon: {
    positive: { primary: '#00ff88', secondary: '#00cc6a', glow: 'rgba(0, 255, 136, 0.5)' },
    neutral: { primary: '#ffee00', secondary: '#ccbe00', glow: 'rgba(255, 238, 0, 0.5)' },
    negative: { primary: '#ff0066', secondary: '#cc0052', glow: 'rgba(255, 0, 102, 0.5)' }
  },
  ocean: {
    positive: { primary: '#06b6d4', secondary: '#67e8f9', glow: 'rgba(6, 182, 212, 0.3)' },
    neutral: { primary: '#8b5cf6', secondary: '#c4b5fd', glow: 'rgba(139, 92, 246, 0.3)' },
    negative: { primary: '#f43f5e', secondary: '#fda4af', glow: 'rgba(244, 63, 94, 0.3)' }
  },
  monochrome: {
    positive: { primary: '#1e293b', secondary: '#475569', glow: 'rgba(30, 41, 59, 0.2)' },
    neutral: { primary: '#64748b', secondary: '#94a3b8', glow: 'rgba(100, 116, 139, 0.2)' },
    negative: { primary: '#334155', secondary: '#64748b', glow: 'rgba(51, 65, 85, 0.2)' }
  }
};

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'i', 'me',
  'my', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'they', 'their', 'them',
  'what', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too',
  'very', 'just', 'can', 'also', 'into', 'about', 'after', 'before', 'between', 'through',
  'during', 'without', 'again', 'further', 'then', 'once', 'here', 'there', 'any', 'if'
]);

/**
 * Extract and process words from comments
 */
const extractWords = (comments, minLength = 3) => {
  const wordMap = new Map();
  
  comments.forEach(comment => {
    const text = comment.text || '';
    const sentiment = analyzeSentiment(text);
    const category = categorizeSentiment(sentiment.sentiment);
    
    // Tokenize and clean
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length >= minLength && 
        !STOP_WORDS.has(word) &&
        !/^\d+$/.test(word)
      );
    
    words.forEach(word => {
      if (!wordMap.has(word)) {
        wordMap.set(word, {
          word,
          count: 0,
          sentiments: { positive: 0, neutral: 0, negative: 0 },
          components: new Set(),
          totalScore: 0,
          comments: []
        });
      }
      
      const entry = wordMap.get(word);
      entry.count++;
      entry.sentiments[category]++;
      entry.components.add(comment.componentName || 'Unknown');
      entry.totalScore += sentiment.normalizedScore;
      if (entry.comments.length < 5) {
        entry.comments.push({
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          sentiment: category
        });
      }
    });
  });
  
  // Convert to array and calculate dominant sentiment
  return Array.from(wordMap.values())
    .map(entry => {
      const { positive, neutral, negative } = entry.sentiments;
      const total = positive + neutral + negative;
      let dominant = 'neutral';
      
      if (positive > neutral && positive > negative) dominant = 'positive';
      else if (negative > neutral && negative > positive) dominant = 'negative';
      
      return {
        ...entry,
        dominant,
        avgScore: entry.totalScore / entry.count,
        components: Array.from(entry.components),
        positiveRatio: positive / total,
        neutralRatio: neutral / total,
        negativeRatio: negative / total
      };
    })
    .sort((a, b) => b.count - a.count);
};

/**
 * Calculate word positions using spiral layout
 */
const calculateSpiralLayout = (words, width, height, maxWords = 100) => {
  const placed = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Size scaling
  const maxCount = Math.max(...words.map(w => w.count));
  const minSize = 12;
  const maxSize = 64;
  
  const topWords = words.slice(0, maxWords);
  
  topWords.forEach((word, index) => {
    const size = minSize + ((word.count / maxCount) * (maxSize - minSize));
    const wordWidth = word.word.length * size * 0.6;
    const wordHeight = size * 1.2;
    
    // Spiral parameters
    let angle = 0;
    let radius = 0;
    let placed_word = false;
    let attempts = 0;
    const maxAttempts = 500;
    
    while (!placed_word && attempts < maxAttempts) {
      const x = centerX + radius * Math.cos(angle) - wordWidth / 2;
      const y = centerY + radius * Math.sin(angle) - wordHeight / 2;
      
      // Check collision
      const collision = placed.some(p => 
        x < p.x + p.width + 5 &&
        x + wordWidth + 5 > p.x &&
        y < p.y + p.height + 5 &&
        y + wordHeight + 5 > p.y
      );
      
      if (!collision && x > 10 && x + wordWidth < width - 10 && y > 10 && y + wordHeight < height - 10) {
        placed.push({
          ...word,
          x,
          y,
          width: wordWidth,
          height: wordHeight,
          size,
          rotation: (Math.random() - 0.5) * 20 // Slight rotation
        });
        placed_word = true;
      }
      
      angle += 0.5;
      radius += 0.5;
      attempts++;
    }
  });
  
  return placed;
};

/**
 * Calculate word positions using grid layout
 */
const calculateGridLayout = (words, width, height, maxWords = 80) => {
  const placed = [];
  const topWords = words.slice(0, maxWords);
  
  const maxCount = Math.max(...topWords.map(w => w.count));
  const minSize = 14;
  const maxSize = 48;
  
  const cols = Math.ceil(Math.sqrt(topWords.length * (width / height)));
  const rows = Math.ceil(topWords.length / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  
  topWords.forEach((word, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const size = minSize + ((word.count / maxCount) * (maxSize - minSize));
    
    placed.push({
      ...word,
      x: col * cellWidth + cellWidth / 2 - (word.word.length * size * 0.3),
      y: row * cellHeight + cellHeight / 2,
      width: word.word.length * size * 0.6,
      height: size * 1.2,
      size,
      rotation: 0
    });
  });
  
  return placed;
};

/**
 * Calculate word positions using bubble/pack layout
 */
const calculateBubbleLayout = (words, width, height, maxWords = 60) => {
  const placed = [];
  const topWords = words.slice(0, maxWords);
  const centerX = width / 2;
  const centerY = height / 2;
  
  const maxCount = Math.max(...topWords.map(w => w.count));
  const minRadius = 25;
  const maxRadius = 70;
  
  // Sort by count descending (place biggest first)
  const sorted = [...topWords].sort((a, b) => b.count - a.count);
  
  sorted.forEach((word, index) => {
    const radius = minRadius + ((word.count / maxCount) * (maxRadius - minRadius));
    
    let angle = (index / sorted.length) * Math.PI * 2;
    let distance = 50 + index * 8;
    let attempts = 0;
    let placed_word = false;
    
    while (!placed_word && attempts < 300) {
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      
      const collision = placed.some(p => {
        const dx = x - p.x;
        const dy = y - p.y;
        const minDist = radius + p.radius + 8;
        return Math.sqrt(dx * dx + dy * dy) < minDist;
      });
      
      if (!collision && x > radius && x < width - radius && y > radius && y < height - radius) {
        placed.push({
          ...word,
          x,
          y,
          radius,
          size: Math.max(10, radius * 0.35),
          rotation: 0
        });
        placed_word = true;
      }
      
      angle += 0.3;
      distance += 2;
      attempts++;
    }
  });
  
  return placed;
};

/**
 * Calculate wave layout
 */
const calculateWaveLayout = (words, width, height, maxWords = 60) => {
  const placed = [];
  const topWords = words.slice(0, maxWords);
  
  const maxCount = Math.max(...topWords.map(w => w.count));
  const minSize = 12;
  const maxSize = 42;
  
  const rows = 5;
  const wordsPerRow = Math.ceil(topWords.length / rows);
  
  topWords.forEach((word, index) => {
    const row = Math.floor(index / wordsPerRow);
    const col = index % wordsPerRow;
    const size = minSize + ((word.count / maxCount) * (maxSize - minSize));
    
    const xSpacing = width / (wordsPerRow + 1);
    const ySpacing = height / (rows + 1);
    
    // Wave effect
    const waveOffset = Math.sin((col / wordsPerRow) * Math.PI * 2) * 30;
    
    placed.push({
      ...word,
      x: (col + 1) * xSpacing,
      y: (row + 1) * ySpacing + waveOffset,
      width: word.word.length * size * 0.6,
      height: size * 1.2,
      size,
      rotation: Math.sin((col + row) * 0.5) * 15
    });
  });
  
  return placed;
};

/**
 * Word Cloud Tooltip Component
 */
const WordTooltip = ({ word, position, colorScheme }) => {
  if (!word) return null;
  
  const colors = SENTIMENT_SCHEMES[colorScheme];
  
  return (
    <div 
      className="absolute z-50 bg-white rounded-xl shadow-2xl border p-4 min-w-[280px] pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-10px)'
      }}
    >
      {/* Word header */}
      <div className="flex items-center justify-between mb-3">
        <span 
          className="text-2xl font-bold"
          style={{ color: colors[word.dominant].primary }}
        >
          {word.word}
        </span>
        <span className="text-gray-400 text-sm">
          {word.count} occurrences
        </span>
      </div>
      
      {/* Sentiment bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-3">
        <div 
          className="h-full transition-all"
          style={{ 
            width: `${word.positiveRatio * 100}%`,
            backgroundColor: colors.positive.primary
          }}
        />
        <div 
          className="h-full transition-all"
          style={{ 
            width: `${word.neutralRatio * 100}%`,
            backgroundColor: colors.neutral.primary
          }}
        />
        <div 
          className="h-full transition-all"
          style={{ 
            width: `${word.negativeRatio * 100}%`,
            backgroundColor: colors.negative.primary
          }}
        />
      </div>
      
      {/* Sentiment breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
        <div>
          <div className="font-semibold" style={{ color: colors.positive.primary }}>
            {(word.positiveRatio * 100).toFixed(0)}%
          </div>
          <div className="text-gray-400">Positive</div>
        </div>
        <div>
          <div className="font-semibold" style={{ color: colors.neutral.primary }}>
            {(word.neutralRatio * 100).toFixed(0)}%
          </div>
          <div className="text-gray-400">Neutral</div>
        </div>
        <div>
          <div className="font-semibold" style={{ color: colors.negative.primary }}>
            {(word.negativeRatio * 100).toFixed(0)}%
          </div>
          <div className="text-gray-400">Negative</div>
        </div>
      </div>
      
      {/* Components */}
      <div className="flex flex-wrap gap-1 mb-3">
        {word.components.slice(0, 4).map((comp, i) => (
          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
            {comp}
          </span>
        ))}
        {word.components.length > 4 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
            +{word.components.length - 4} more
          </span>
        )}
      </div>
      
      {/* Sample comment */}
      {word.comments.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <div className="text-xs text-gray-400 mb-1">Sample usage:</div>
          <div className="text-xs text-gray-600 italic">
            "{word.comments[0].text}"
          </div>
        </div>
      )}
      
      {/* Arrow */}
      <div 
        className="absolute w-3 h-3 bg-white border-b border-r transform rotate-45"
        style={{ bottom: '-6px', left: '50%', marginLeft: '-6px' }}
      />
    </div>
  );
};

/**
 * Main Word Cloud Component
 */
const SentimentWordCloud = ({ comments }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [layout, setLayout] = useState('spiral');
  const [colorScheme, setColorScheme] = useState('classic');
  const [hoveredWord, setHoveredWord] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [showGlow, setShowGlow] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [minFrequency, setMinFrequency] = useState(2);
  
  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(600, width - 40), height: 500 });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Extract and process words
  const allWords = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    return extractWords(comments);
  }, [comments]);
  
  // Filter words
  const filteredWords = useMemo(() => {
    let words = allWords.filter(w => w.count >= minFrequency);
    
    if (filterSentiment !== 'all') {
      words = words.filter(w => w.dominant === filterSentiment);
    }
    
    return words;
  }, [allWords, filterSentiment, minFrequency]);
  
  // Calculate layout
  const placedWords = useMemo(() => {
    const { width, height } = dimensions;
    
    switch (layout) {
      case 'grid':
        return calculateGridLayout(filteredWords, width, height);
      case 'bubble':
        return calculateBubbleLayout(filteredWords, width, height);
      case 'wave':
        return calculateWaveLayout(filteredWords, width, height);
      case 'spiral':
      default:
        return calculateSpiralLayout(filteredWords, width, height);
    }
  }, [filteredWords, dimensions, layout]);
  
  // Handle word hover
  const handleWordHover = useCallback((word, event) => {
    if (word) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
    setHoveredWord(word);
  }, []);
  
  // Regenerate layout with animation
  const regenerateLayout = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  // Export as SVG
  const exportSVG = () => {
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sentiment-word-cloud.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Get colors
  const colors = SENTIMENT_SCHEMES[colorScheme];
  
  // Statistics
  const stats = useMemo(() => ({
    totalWords: allWords.length,
    totalOccurrences: allWords.reduce((sum, w) => sum + w.count, 0),
    positive: allWords.filter(w => w.dominant === 'positive').length,
    neutral: allWords.filter(w => w.dominant === 'neutral').length,
    negative: allWords.filter(w => w.dominant === 'negative').length,
    displayed: placedWords.length
  }), [allWords, placedWords]);
  
  if (!comments || comments.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No comments available for word cloud generation.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Sentiment Word Cloud
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {stats.displayed} words from {stats.totalOccurrences.toLocaleString()} total occurrences
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Layout selector */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
              {[
                { id: 'spiral', icon: Waves, label: 'Spiral' },
                { id: 'grid', icon: Grid3X3, label: 'Grid' },
                { id: 'bubble', icon: Circle, label: 'Bubble' },
                { id: 'wave', icon: Zap, label: 'Wave' }
              ].map(l => (
                <Button
                  key={l.id}
                  variant={layout === l.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => { setLayout(l.id); regenerateLayout(); }}
                  className="h-8 px-2"
                  title={l.label}
                >
                  <l.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            
            {/* Color scheme */}
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm"
            >
              <option value="classic">Classic</option>
              <option value="neon">Neon</option>
              <option value="ocean">Ocean</option>
              <option value="monochrome">Monochrome</option>
            </select>
            
            {/* Glow toggle */}
            <Button
              variant={showGlow ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowGlow(!showGlow)}
              className="h-8"
              title="Toggle glow effect"
            >
              {showGlow ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            
            {/* Export */}
            <Button variant="outline" size="sm" onClick={exportSVG} className="h-8">
              <Download className="h-4 w-4 mr-1" />
              SVG
            </Button>
          </div>
        </div>
        
        {/* Filters row */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {/* Sentiment filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
              {[
                { id: 'all', label: 'All', color: '#6b7280' },
                { id: 'positive', label: 'Positive', color: colors.positive.primary },
                { id: 'neutral', label: 'Neutral', color: colors.neutral.primary },
                { id: 'negative', label: 'Negative', color: colors.negative.primary }
              ].map(s => (
                <Button
                  key={s.id}
                  variant={filterSentiment === s.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterSentiment(s.id)}
                  className="h-7 px-2 text-xs"
                  style={filterSentiment === s.id ? { backgroundColor: s.color } : {}}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Min frequency */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Min freq:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={minFrequency}
              onChange={(e) => setMinFrequency(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm font-medium w-6">{minFrequency}</span>
          </div>
          
          {/* Stats */}
          <div className="flex gap-3 ml-auto text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.positive.primary }} />
              {stats.positive} positive
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.neutral.primary }} />
              {stats.neutral} neutral
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.negative.primary }} />
              {stats.negative} negative
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 relative" ref={containerRef}>
        {/* SVG Word Cloud */}
        <svg 
          width={dimensions.width} 
          height={dimensions.height}
          className={`transition-opacity duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}
          style={{ overflow: 'visible' }}
        >
          {/* Definitions for effects */}
          <defs>
            {/* Glow filters for each sentiment */}
            {Object.entries(colors).map(([sentiment, color]) => (
              <filter key={sentiment} id={`glow-${sentiment}-${colorScheme}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
            
            {/* Gradient backgrounds */}
            <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </radialGradient>
          </defs>
          
          {/* Background */}
          <rect width={dimensions.width} height={dimensions.height} fill="url(#bgGradient)" rx="12" />
          
          {/* Words */}
          {layout === 'bubble' ? (
            // Bubble layout - circles with text
            placedWords.map((word, index) => {
              const wordColor = colors[word.dominant];
              const isHovered = hoveredWord?.word === word.word;
              
              return (
                <g
                  key={word.word}
                  transform={`translate(${word.x}, ${word.y})`}
                  onMouseEnter={(e) => handleWordHover(word, e)}
                  onMouseLeave={() => handleWordHover(null)}
                  style={{ cursor: 'pointer' }}
                  className="transition-transform duration-200"
                >
                  <circle
                    r={word.radius}
                    fill={isHovered ? wordColor.secondary : wordColor.primary}
                    opacity={isHovered ? 1 : 0.85}
                    stroke={wordColor.primary}
                    strokeWidth={isHovered ? 3 : 1}
                    filter={showGlow && isHovered ? `url(#glow-${word.dominant}-${colorScheme})` : undefined}
                    className="transition-all duration-200"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={word.size}
                    fontWeight={isHovered ? 'bold' : '600'}
                    fill="white"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    {word.word}
                  </text>
                </g>
              );
            })
          ) : (
            // Text-based layouts (spiral, grid, wave)
            placedWords.map((word, index) => {
              const wordColor = colors[word.dominant];
              const isHovered = hoveredWord?.word === word.word;
              
              return (
                <text
                  key={word.word}
                  x={word.x + (word.width || 0) / 2}
                  y={word.y + (word.height || 0) / 2}
                  fontSize={word.size}
                  fontWeight={isHovered ? 'bold' : '600'}
                  fill={isHovered ? wordColor.secondary : wordColor.primary}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={word.rotation ? `rotate(${word.rotation}, ${word.x + word.width/2}, ${word.y + word.height/2})` : undefined}
                  filter={showGlow ? `url(#glow-${word.dominant}-${colorScheme})` : undefined}
                  onMouseEnter={(e) => handleWordHover(word, e)}
                  onMouseLeave={() => handleWordHover(null)}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isHovered ? 1 : 0.9
                  }}
                  className="select-none"
                >
                  {word.word}
                </text>
              );
            })
          )}
        </svg>
        
        {/* Tooltip */}
        {hoveredWord && (
          <WordTooltip 
            word={hoveredWord} 
            position={tooltipPos} 
            colorScheme={colorScheme}
          />
        )}
      </CardContent>
      
      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">Word size = frequency</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Color = dominant sentiment</span>
          </div>
          <div className="flex items-center gap-4">
            {[
              { sentiment: 'positive', icon: TrendingUp },
              { sentiment: 'neutral', icon: Minus },
              { sentiment: 'negative', icon: TrendingDown }
            ].map(({ sentiment, icon: Icon }) => (
              <span key={sentiment} className="flex items-center gap-1">
                <Icon className="h-4 w-4" style={{ color: colors[sentiment].primary }} />
                <span style={{ color: colors[sentiment].primary }} className="capitalize font-medium">
                  {sentiment}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SentimentWordCloud;