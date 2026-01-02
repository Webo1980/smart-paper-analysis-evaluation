/**
 * Sentiment Analysis Service
 * 
 * Professional sentiment analysis using keyword-based approach with
 * intensity modifiers, negation handling, and domain-specific terms.
 * 
 * For academic evaluation context in the ORKG/ORKGEx system.
 */

// Positive words with weights (0.1 to 1.0)
const POSITIVE_WORDS = {
  // Strong positive
  'excellent': 1.0,
  'outstanding': 1.0,
  'perfect': 1.0,
  'amazing': 0.95,
  'exceptional': 0.95,
  'fantastic': 0.9,
  'superb': 0.9,
  'impressive': 0.85,
  'brilliant': 0.85,
  
  // Medium positive
  'great': 0.8,
  'good': 0.7,
  'accurate': 0.75,
  'correct': 0.75,
  'helpful': 0.7,
  'useful': 0.7,
  'effective': 0.7,
  'appropriate': 0.65,
  'suitable': 0.65,
  'relevant': 0.65,
  'clear': 0.6,
  'nice': 0.6,
  'well': 0.6,
  'complete': 0.7,
  'comprehensive': 0.75,
  'thorough': 0.7,
  'detailed': 0.65,
  
  // Light positive
  'fine': 0.5,
  'okay': 0.4,
  'ok': 0.4,
  'adequate': 0.45,
  'reasonable': 0.5,
  'acceptable': 0.45,
  'satisfactory': 0.5,
  'decent': 0.5,
  
  // Domain-specific positive
  'matched': 0.7,
  'extracted': 0.6,
  'identified': 0.65,
  'recognized': 0.65,
  'aligned': 0.7,
  'consistent': 0.65,
  'reliable': 0.7,
  'precise': 0.75,
  'valid': 0.65,
  'properly': 0.6,
  'successfully': 0.7,
  'correctly': 0.7,
  'improved': 0.65,
  'innovative': 0.75,
  'intuitive': 0.7
};

// Negative words with weights (-0.1 to -1.0)
const NEGATIVE_WORDS = {
  // Strong negative
  'terrible': -1.0,
  'awful': -1.0,
  'horrible': -1.0,
  'worst': -0.95,
  'useless': -0.9,
  'completely wrong': -0.95,
  'totally incorrect': -0.95,
  
  // Medium negative
  'wrong': -0.75,
  'incorrect': -0.75,
  'bad': -0.7,
  'poor': -0.7,
  'inaccurate': -0.75,
  'missing': -0.65,
  'error': -0.7,
  'errors': -0.7,
  'failed': -0.75,
  'failure': -0.75,
  'problematic': -0.65,
  'issue': -0.5,
  'issues': -0.55,
  'problem': -0.55,
  'problems': -0.6,
  'confusing': -0.6,
  'confused': -0.55,
  'unclear': -0.55,
  'difficult': -0.5,
  'frustrating': -0.7,
  'disappointing': -0.65,
  'incomplete': -0.6,
  
  // Light negative
  'minor': -0.3,
  'slight': -0.25,
  'somewhat': -0.2,
  'could be better': -0.4,
  'needs improvement': -0.45,
  'not ideal': -0.4,
  'limited': -0.4,
  
  // Domain-specific negative
  'irrelevant': -0.7,
  'unrelated': -0.65,
  'mismatch': -0.6,
  'mismatched': -0.6,
  'misidentified': -0.7,
  'misextracted': -0.7,
  'inconsistent': -0.6,
  'unreliable': -0.7,
  'invalid': -0.65,
  'buggy': -0.7,
  'slow': -0.5,
  'crashed': -0.8,
  'unresponsive': -0.7
};

// Intensity modifiers
const INTENSIFIERS = {
  'very': 1.5,
  'really': 1.4,
  'extremely': 1.7,
  'highly': 1.5,
  'incredibly': 1.6,
  'absolutely': 1.6,
  'completely': 1.5,
  'totally': 1.5,
  'quite': 1.2,
  'fairly': 1.1,
  'rather': 1.1,
  'somewhat': 0.7,
  'slightly': 0.6,
  'a bit': 0.7,
  'a little': 0.6,
  'mostly': 1.1
};

// Negation words
const NEGATIONS = ['not', 'no', 'never', 'neither', "n't", 'none', 'nothing', 'nowhere', 'hardly', 'barely', 'scarcely', "doesn't", "don't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't"];

/**
 * Tokenize and clean text
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Check if word is negated
 */
function isNegated(tokens, index) {
  // Check previous 3 words for negation
  const start = Math.max(0, index - 3);
  for (let i = start; i < index; i++) {
    if (NEGATIONS.includes(tokens[i]) || tokens[i].endsWith("n't")) {
      return true;
    }
  }
  return false;
}

/**
 * Get intensity modifier for a word
 */
function getIntensifier(tokens, index) {
  if (index === 0) return 1.0;
  const prevWord = tokens[index - 1];
  return INTENSIFIERS[prevWord] || 1.0;
}

/**
 * Analyze sentiment of a single comment
 * @param {string} text - The comment text
 * @returns {Object} Sentiment analysis result
 */
export function analyzeSentiment(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      score: 0,
      normalizedScore: 0.5, // Neutral
      sentiment: 'neutral',
      confidence: 0,
      positiveWords: [],
      negativeWords: [],
      wordCount: 0,
      isEmpty: true
    };
  }

  const tokens = tokenize(text);
  let totalScore = 0;
  let wordMatches = 0;
  const positiveWords = [];
  const negativeWords = [];

  // Check for multi-word phrases first
  const lowerText = text.toLowerCase();
  Object.keys(POSITIVE_WORDS).forEach(phrase => {
    if (phrase.includes(' ') && lowerText.includes(phrase)) {
      totalScore += POSITIVE_WORDS[phrase];
      wordMatches++;
      positiveWords.push({ word: phrase, score: POSITIVE_WORDS[phrase] });
    }
  });
  Object.keys(NEGATIVE_WORDS).forEach(phrase => {
    if (phrase.includes(' ') && lowerText.includes(phrase)) {
      totalScore += NEGATIVE_WORDS[phrase];
      wordMatches++;
      negativeWords.push({ word: phrase, score: NEGATIVE_WORDS[phrase] });
    }
  });

  // Analyze individual tokens
  tokens.forEach((token, index) => {
    let score = 0;
    let word = token;

    if (POSITIVE_WORDS[token]) {
      score = POSITIVE_WORDS[token];
      word = token;
    } else if (NEGATIVE_WORDS[token]) {
      score = NEGATIVE_WORDS[token];
      word = token;
    }

    if (score !== 0) {
      // Apply intensity modifier
      const intensity = getIntensifier(tokens, index);
      score *= intensity;

      // Apply negation
      if (isNegated(tokens, index)) {
        score *= -0.8; // Flip and slightly reduce
        word = `not ${word}`;
      }

      totalScore += score;
      wordMatches++;

      if (score > 0) {
        positiveWords.push({ word, score: Math.round(score * 100) / 100 });
      } else {
        negativeWords.push({ word, score: Math.round(score * 100) / 100 });
      }
    }
  });

  // Calculate normalized score (0 to 1 scale, 0.5 = neutral)
  const normalizedScore = wordMatches > 0 
    ? Math.max(0, Math.min(1, (totalScore / wordMatches + 1) / 2))
    : 0.5;

  // Determine sentiment category
  let sentiment = 'neutral';
  if (normalizedScore >= 0.65) sentiment = 'positive';
  else if (normalizedScore >= 0.55) sentiment = 'slightly_positive';
  else if (normalizedScore <= 0.35) sentiment = 'negative';
  else if (normalizedScore <= 0.45) sentiment = 'slightly_negative';

  // Calculate confidence based on word matches and text length
  const confidence = Math.min(1, (wordMatches / Math.max(tokens.length, 1)) * 2);

  return {
    score: Math.round(totalScore * 100) / 100,
    normalizedScore: Math.round(normalizedScore * 1000) / 1000,
    sentiment,
    confidence: Math.round(confidence * 100) / 100,
    positiveWords,
    negativeWords,
    wordCount: tokens.length,
    isEmpty: false
  };
}

/**
 * Get sentiment label with emoji
 */
export function getSentimentLabel(sentiment) {
  const labels = {
    'positive': { label: 'Positive', emoji: '😊', color: '#22c55e' },
    'slightly_positive': { label: 'Slightly Positive', emoji: '🙂', color: '#84cc16' },
    'neutral': { label: 'Neutral', emoji: '😐', color: '#eab308' },
    'slightly_negative': { label: 'Slightly Negative', emoji: '😕', color: '#f97316' },
    'negative': { label: 'Negative', emoji: '😟', color: '#ef4444' }
  };
  return labels[sentiment] || labels.neutral;
}

/**
 * Categorize sentiment into 3 main categories
 */
export function categorizeSentiment(sentiment) {
  if (sentiment === 'positive' || sentiment === 'slightly_positive') return 'positive';
  if (sentiment === 'negative' || sentiment === 'slightly_negative') return 'negative';
  return 'neutral';
}

/**
 * Analyze multiple comments and return aggregated statistics
 */
export function analyzeMultipleComments(comments) {
  const results = comments
    .filter(c => c && c.text && c.text.trim().length > 0)
    .map(comment => ({
      ...comment,
      analysis: analyzeSentiment(comment.text)
    }));

  const sentimentCounts = {
    positive: 0,
    slightly_positive: 0,
    neutral: 0,
    slightly_negative: 0,
    negative: 0
  };

  let totalScore = 0;
  let totalConfidence = 0;
  const allPositiveWords = [];
  const allNegativeWords = [];

  results.forEach(r => {
    if (!r.analysis.isEmpty) {
      sentimentCounts[r.analysis.sentiment]++;
      totalScore += r.analysis.normalizedScore;
      totalConfidence += r.analysis.confidence;
      allPositiveWords.push(...r.analysis.positiveWords);
      allNegativeWords.push(...r.analysis.negativeWords);
    }
  });

  const nonEmptyCount = results.filter(r => !r.analysis.isEmpty).length;

  // Calculate word frequencies
  const positiveWordFreq = {};
  allPositiveWords.forEach(w => {
    positiveWordFreq[w.word] = (positiveWordFreq[w.word] || 0) + 1;
  });

  const negativeWordFreq = {};
  allNegativeWords.forEach(w => {
    negativeWordFreq[w.word] = (negativeWordFreq[w.word] || 0) + 1;
  });

  // Sort by frequency
  const topPositive = Object.entries(positiveWordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  const topNegative = Object.entries(negativeWordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    results,
    summary: {
      total: comments.length,
      analyzed: nonEmptyCount,
      empty: comments.length - nonEmptyCount,
      sentimentCounts,
      simpleCounts: {
        positive: sentimentCounts.positive + sentimentCounts.slightly_positive,
        neutral: sentimentCounts.neutral,
        negative: sentimentCounts.negative + sentimentCounts.slightly_negative
      },
      averageScore: nonEmptyCount > 0 ? totalScore / nonEmptyCount : 0.5,
      averageConfidence: nonEmptyCount > 0 ? totalConfidence / nonEmptyCount : 0,
      topPositiveWords: topPositive,
      topNegativeWords: topNegative,
      overallSentiment: determineOverallSentiment(sentimentCounts, nonEmptyCount)
    }
  };
}

/**
 * Determine overall sentiment from counts
 */
function determineOverallSentiment(counts, total) {
  if (total === 0) return 'neutral';
  
  const positive = counts.positive + counts.slightly_positive;
  const negative = counts.negative + counts.slightly_negative;
  
  const positiveRatio = positive / total;
  const negativeRatio = negative / total;
  
  if (positiveRatio > 0.6) return 'positive';
  if (negativeRatio > 0.6) return 'negative';
  if (positiveRatio > negativeRatio + 0.2) return 'slightly_positive';
  if (negativeRatio > positiveRatio + 0.2) return 'slightly_negative';
  return 'neutral';
}

/**
 * Extract common themes from comments
 */
export function extractThemes(comments) {
  const themeKeywords = {
    'Accuracy': ['accurate', 'correct', 'wrong', 'incorrect', 'match', 'mismatch', 'precise', 'error'],
    'Completeness': ['complete', 'incomplete', 'missing', 'partial', 'full', 'comprehensive', 'thorough'],
    'Relevance': ['relevant', 'irrelevant', 'related', 'unrelated', 'appropriate', 'suitable'],
    'Clarity': ['clear', 'unclear', 'confusing', 'understandable', 'readable', 'well-written'],
    'Performance': ['fast', 'slow', 'responsive', 'lag', 'speed', 'quick', 'performance'],
    'Usability': ['easy', 'difficult', 'intuitive', 'user-friendly', 'confusing', 'usable'],
    'Quality': ['good', 'bad', 'excellent', 'poor', 'quality', 'well', 'great'],
    'Suggestions': ['should', 'could', 'would', 'suggest', 'recommend', 'improve', 'better', 'need']
  };

  const themeCounts = {};
  const themeComments = {};

  Object.keys(themeKeywords).forEach(theme => {
    themeCounts[theme] = 0;
    themeComments[theme] = [];
  });

  comments.forEach(comment => {
    if (!comment || !comment.text) return;
    const lowerText = comment.text.toLowerCase();

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const hasTheme = keywords.some(kw => lowerText.includes(kw));
      if (hasTheme) {
        themeCounts[theme]++;
        themeComments[theme].push(comment);
      }
    });
  });

  return {
    counts: themeCounts,
    comments: themeComments,
    sorted: Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, count, percentage: (count / comments.length * 100).toFixed(1) }))
  };
}

export default {
  analyzeSentiment,
  analyzeMultipleComments,
  getSentimentLabel,
  categorizeSentiment,
  extractThemes
};