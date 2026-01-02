// src/components/evaluation/research-problem/utils/advancedProblemMetricsUtils.js

/**
 * Calculate Token-level Accuracy
 * @param {string} groundTruth - Original text
 * @param {string} generated - Generated text
 * @returns {Object} Token-level accuracy metrics
 */
export const calculateTokenAccuracy = (groundTruth, generated) => {
  if (!groundTruth || !generated) {
    return {
      tokens: {
        reference: [],
        generated: [],
        matched: []
      },
      precision: 0,
      recall: 0,
      f1Score: 0,
      tokenAccuracy: 0
    };
  }
  
  const refTokens = groundTruth.toLowerCase().split(/\W+/).filter(Boolean);
  const genTokens = generated.toLowerCase().split(/\W+/).filter(Boolean);
  
  // Exact match tokens
  const matchedTokens = refTokens.filter(token => 
    genTokens.includes(token)
  );
  
  // Calculate token-level metrics
  const precision = genTokens.length > 0 
    ? matchedTokens.length / genTokens.length 
    : 0;
  
  const recall = refTokens.length > 0
    ? matchedTokens.length / refTokens.length
    : 0;
  
  const f1Score = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;
  
  return {
    tokens: {
      reference: refTokens,
      generated: genTokens,
      matched: matchedTokens
    },
    precision,
    recall,
    f1Score,
    tokenAccuracy: Math.max(refTokens.length, genTokens.length) > 0
      ? matchedTokens.length / Math.max(refTokens.length, genTokens.length)
      : 0
  };
};

/**
 * Calculate quality metrics for a research problem
 * @param {Object} problem - Problem data (title, description)
 * @param {string} abstract - Paper abstract
 * @returns {Object} Quality metrics
 */
export const calculateQualityMetrics = (problem, abstract) => {
  if (!problem || !abstract) {
    return {
      relevance: 0,
      completeness: 0,
      evidenceQuality: 0,
      details: {
        relevanceReason: 'No problem or abstract provided',
        completenessReason: 'No problem or abstract provided',
        evidenceQualityReason: 'No problem or abstract provided'
      }
    };
  }
  
  const { title, description } = problem;
  const combinedProblemText = `${title} ${description}`;
  
  // Calculate relevance (semantic alignment with abstract)
  const relevanceScore = calculateRelevanceScore(combinedProblemText, abstract);
  
  // Calculate completeness (coverage of key aspects from abstract)
  const completenessScore = calculateCompletenessScore(combinedProblemText, abstract);
  
  // Calculate evidence quality (presence of specific evidence in problem)
  const evidenceQualityScore = calculateEvidenceQualityScore(description, abstract);
  
  return {
    relevance: relevanceScore.score,
    completeness: completenessScore.score,
    evidenceQuality: evidenceQualityScore.score,
    details: {
      relevanceReason: relevanceScore.reason,
      completenessReason: completenessScore.reason,
      evidenceQualityReason: evidenceQualityScore.reason,
      relevanceDetails: relevanceScore.details,
      completenessDetails: completenessScore.details,
      evidenceQualityDetails: evidenceQualityScore.details
    }
  };
};

/**
 * Calculate relevance score
 */
const calculateRelevanceScore = (problemText, abstract) => {
  // Extract key topics from abstract
  const abstractTopics = extractTopics(abstract);
  
  // Check how many topics are present in problem text
  const problemTextLower = problemText.toLowerCase();
  const matchedTopics = abstractTopics.filter(topic => 
    problemTextLower.includes(topic.toLowerCase())
  );
  
  // Calculate topic coverage ratio
  const topicCoverageRatio = abstractTopics.length > 0 ? 
    matchedTopics.length / abstractTopics.length : 0;
  
  // Generate reason based on score
  let reason = '';
  if (topicCoverageRatio >= 0.8) {
    reason = 'The problem captures most of the key topics from the abstract.';
  } else if (topicCoverageRatio >= 0.5) {
    reason = 'The problem captures some important topics from the abstract but misses others.';
  } else {
    reason = 'The problem fails to capture many key topics from the abstract.';
  }
  
  return {
    score: topicCoverageRatio,
    reason,
    details: {
      abstractTopics,
      matchedTopics,
      topicCoverageRatio
    }
  };
};

/**
 * Calculate completeness score
 */
const calculateCompletenessScore = (problemText, abstract) => {
  // Calculate token overlap
  const abstractTokens = abstract.toLowerCase().split(/\W+/).filter(Boolean);
  const problemTokens = problemText.toLowerCase().split(/\W+/).filter(Boolean);
  
  // Calculate token coverage
  const uniqueAbstractTokens = new Set(abstractTokens);
  const uniqueProblemTokens = new Set(problemTokens);
  
  // Check token coverage (how many unique abstract tokens are in problem)
  let coveredTokens = 0;
  uniqueAbstractTokens.forEach(token => {
    if (uniqueProblemTokens.has(token)) {
      coveredTokens++;
    }
  });
  
  // Calculate coverage ratio
  const tokenCoverageRatio = uniqueAbstractTokens.size > 0 ? 
    coveredTokens / uniqueAbstractTokens.size : 0;
  
  // Adjust for problem length relative to abstract
  const lengthRatio = Math.min(
    problemText.length / abstract.length, 
    1.0
  );
  
  // Combined completeness score with higher weight on token coverage
  const completenessScore = (tokenCoverageRatio * 0.7) + (lengthRatio * 0.3);
  
  // Generate reason based on score
  let reason = '';
  if (completenessScore >= 0.8) {
    reason = 'The problem comprehensively captures the content from the abstract.';
  } else if (completenessScore >= 0.5) {
    reason = 'The problem covers significant portions of the abstract but lacks some details.';
  } else {
    reason = 'The problem is missing substantial content from the abstract.';
  }
  
  return {
    score: completenessScore,
    reason,
    details: {
      tokenCoverageRatio,
      lengthRatio,
      uniqueAbstractTokens: uniqueAbstractTokens.size,
      uniqueProblemTokens: uniqueProblemTokens.size,
      coveredTokens
    }
  };
};

/**
 * Calculate evidence quality score
 */
const calculateEvidenceQualityScore = (description, abstract) => {
  if (!description || !abstract) {
    return {
      score: 0,
      reason: 'No description or abstract provided',
      details: {}
    };
  }
  
  // Look for evidence indicators in description
  const evidenceIndicators = [
    'research shows', 'studies indicate', 'evidence suggests',
    'according to', 'demonstrated by', 'as shown in',
    'data indicates', 'findings reveal', 'research indicates',
    'previous work', 'prior research', 'existing studies'
  ];
  
  // Count evidence indicators
  let evidenceCount = 0;
  evidenceIndicators.forEach(indicator => {
    const regex = new RegExp(indicator, 'gi');
    const matches = description.match(regex);
    if (matches) {
      evidenceCount += matches.length;
    }
  });
  
  // Calculate normalized score (cap at reasonable maximum)
  const maxExpectedEvidence = 3;
  const evidenceCountScore = Math.min(evidenceCount / maxExpectedEvidence, 1.0);
  
  // Check for specific numbers or statistics
  const hasNumbers = /\d+%|\d+\.\d+|\(\d+\)|\[\d+\]/.test(description);
  const numberScore = hasNumbers ? 0.3 : 0;
  
  // Check for references to specific methods or techniques
  const methodTerms = [
    'method', 'approach', 'technique', 'algorithm', 'model',
    'framework', 'system', 'analysis', 'experiment', 'study'
  ];
  
  const hasMethodTerms = methodTerms.some(term => 
    new RegExp(`\\b${term}\\b`, 'i').test(description)
  );
  
  const methodScore = hasMethodTerms ? 0.3 : 0;
  
  // Combined evidence quality score
  const evidenceQualityScore = Math.min(
    evidenceCountScore * 0.4 + numberScore + methodScore,
    1.0
  );
  
  // Generate reason based on score
  let reason = '';
  if (evidenceQualityScore >= 0.8) {
    reason = 'The problem is well-supported with specific evidence from the abstract.';
  } else if (evidenceQualityScore >= 0.5) {
    reason = 'The problem includes some evidence but could benefit from more specific support.';
  } else {
    reason = 'The problem lacks sufficient evidence to support its formulation.';
  }
  
  return {
    score: evidenceQualityScore,
    reason,
    details: {
      evidenceCount,
      hasNumbers,
      hasMethodTerms,
      evidenceCountScore,
      numberScore,
      methodScore
    }
  };
};

/**
 * Extract topics from text
 */
const extractTopics = (text) => {
  if (!text) return [];
  
  // Simple approach: extract noun phrases as topics
  // For a production system, use NLP libraries
  
  // Split by sentence
  const sentences = text.split(/[.!?]/).filter(Boolean);
  
  // List of stop words to exclude
  const stopWords = new Set([
    'a', 'an', 'the', 'this', 'that', 'these', 'those',
    'it', 'they', 'he', 'she', 'we', 'you', 'i', 'me',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'and', 'or', 'but', 'if', 'then', 'else', 'when',
    'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below',
    'from', 'up', 'down', 'out', 'off', 'over', 'under'
  ]);
  
  // Topics collection
  const topics = [];
  
  // Process each sentence to extract potential topics
  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    
    // Find noun phrases (simplistic approach)
    let currentPhrase = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[,.;:()[\]{}'"!?]/g, '');
      
      // Skip if it's a stop word and not part of an existing phrase
      if (stopWords.has(word.toLowerCase()) && currentPhrase.length === 0) {
        continue;
      }
      
      // If we encounter a likely verb or preposition, end the current phrase
      if (/ing$|ed$|ly$|\b(is|are|was|were|have|has|had|be|been|will|would|could|should|may|might|must|can|do|does|did|go|went|come|came)\b/i.test(word) && currentPhrase.length > 0) {
        if (currentPhrase.length > 0) {
          topics.push(currentPhrase.join(' '));
          currentPhrase = [];
        }
        continue;
      }
      
      // Add to current phrase
      currentPhrase.push(word);
      
      // If phrase gets too long or we're at the end, finalize it
      if (currentPhrase.length >= 4 || i === words.length - 1) {
        if (currentPhrase.length > 0) {
          topics.push(currentPhrase.join(' '));
          currentPhrase = [];
        }
      }
    }
  });
  
  // Filter out duplicates and very short topics
  return [...new Set(topics)].filter(topic => 
    topic.length >= 4 && topic.split(' ').length <= 4
  );
};