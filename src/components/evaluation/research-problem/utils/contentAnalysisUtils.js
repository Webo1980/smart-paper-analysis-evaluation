// src/components/evaluation/research-problem/utils/contentAnalysisUtils.js

import { calculateTokenAccuracy } from './advancedProblemMetricsUtils';

/**
 * Calculate content similarity between ground truth and problem
 */
export const calculateContentSimilarity = (groundTruth, problem) => {
  // Extract problem data
  const { title, description } = problem || { title: '', description: '' };
  
  let gtText = '';
  let gtTitle = '';
  let gtDescription = '';
  
  // Handle different formats of ground truth
  if (typeof groundTruth === 'string') {
    gtText = groundTruth;
    // Try to extract a potential title (first line or sentence)
    const lines = groundTruth.split('\n');
    if (lines.length > 0) {
      gtTitle = lines[0];
      gtDescription = lines.slice(1).join('\n');
    } else {
      const sentences = groundTruth.split(/\.|\?|!/).filter(Boolean);
      if (sentences.length > 0) {
        gtTitle = sentences[0];
        gtDescription = sentences.slice(1).join('. ');
      }
    }
  } else if (typeof groundTruth === 'object') {
    gtTitle = groundTruth.title || groundTruth.name || '';
    gtDescription = groundTruth.description || groundTruth.content || '';
    gtText = `${gtTitle}\n${gtDescription}`;
  }
  
  // Title alignment - How well the problem title aligns with ground truth title or text
  const titleAlignmentScore = calculateTitleAlignment(gtTitle || gtText, title);
  
  // Content coverage - How completely the problem description covers key aspects in ground truth
  const contentCoverageScore = calculateContentCoverage(gtDescription || gtText, description);
  
  // Specificity - How specific and well-defined the problem formulation is
  const specificityScore = calculateSpecificity(title, description);
  
  // Token-level metrics
  const titleTokenMetrics = calculateTokenAccuracy(gtTitle, title);
  const descriptionTokenMetrics = calculateTokenAccuracy(gtDescription || gtText, description);
  
  return {
    titleAlignment: titleAlignmentScore,
    contentCoverage: contentCoverageScore,
    specificity: specificityScore,
    titleTokenMetrics,
    descriptionTokenMetrics,
    
    // Additional metrics for detailed analysis
    keyConceptsPreserved: calculateKeyConceptsPreservation(gtText, title + ' ' + description),
    structuralQuality: calculateStructuralQuality(title, description),
    
    // Store original text for reference
    groundTruth: {
      text: gtText,
      title: gtTitle,
      description: gtDescription
    },
    problem: {
      title,
      description
    }
  };
};

/**
 * Calculate title alignment score
 */
const calculateTitleAlignment = (groundTruthTitle, problemTitle) => {
  if (!groundTruthTitle || !problemTitle) return 0;
  
  // Calculate token overlap
  const gtTokens = groundTruthTitle.toLowerCase().split(/\W+/).filter(Boolean);
  const ptTokens = problemTitle.toLowerCase().split(/\W+/).filter(Boolean);
  
  // Count matching tokens
  const matches = gtTokens.filter(token => ptTokens.includes(token));
  
  // Calculate Jaccard similarity
  const union = new Set([...gtTokens, ...ptTokens]);
  const jaccard = matches.length / union.size;
  
  // Calculate containment score (% of ground truth tokens contained in problem title)
  const containment = gtTokens.length > 0 ? matches.length / gtTokens.length : 0;
  
  // Combined score with higher weight on containment (more important that key concepts are preserved)
  return (jaccard * 0.4) + (containment * 0.6);
};

/**
 * Calculate content coverage score
 */
const calculateContentCoverage = (groundTruthDescription, problemDescription) => {
  if (!groundTruthDescription || !problemDescription) return 0;
  
  // Extract key concepts from ground truth
  const gtConcepts = extractKeyConcepts(groundTruthDescription);
  
  // Count how many key concepts are covered in problem description
  const pdLower = problemDescription.toLowerCase();
  const coveredConcepts = gtConcepts.filter(concept => 
    pdLower.includes(concept.toLowerCase())
  );
  
  // Calculate coverage ratio
  const coverageRatio = gtConcepts.length > 0 ? 
    coveredConcepts.length / gtConcepts.length : 0;
  
  // Calculate text length ratio (penalize if too short compared to ground truth)
  const lengthRatio = Math.min(
    problemDescription.length / Math.max(groundTruthDescription.length, 1),
    1.0
  );
  
  // Combined score with higher weight on concept coverage
  return (coverageRatio * 0.7) + (lengthRatio * 0.3);
};

/**
 * Calculate specificity score
 */
const calculateSpecificity = (title, description) => {
  if (!title || !description) return 0;
  
  // Check for specific terms indicating a well-defined problem
  const specificTerms = [
    'how', 'why', 'what', 'which', 'where', 'when',
    'improve', 'enhance', 'optimize', 'reduce', 'increase',
    'challenge', 'problem', 'issue', 'question', 'limitation'
  ];
  
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Count specific terms
  const termCount = specificTerms.reduce((count, term) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = combinedText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  // Calculate normalized score (cap at reasonable maximum)
  const maxExpectedTerms = 5;
  const normalizedScore = Math.min(termCount / maxExpectedTerms, 1.0);
  
  // Include length as a factor (longer descriptions tend to be more specific)
  const lengthFactor = Math.min(description.length / 500, 1.0);
  
  // Combined score
  return (normalizedScore * 0.7) + (lengthFactor * 0.3);
};

/**
 * Extract key concepts from text
 */
const extractKeyConcepts = (text) => {
  if (!text) return [];
  
  // Simple approach: extract nouns and noun phrases
  // For a production system, use NLP libraries
  
  // Split by sentence and punctuation
  const sentences = text.split(/[.!?]/).filter(Boolean);
  
  // Extract noun-like phrases (simplistic approach)
  const concepts = [];
  
  const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'for', 'with', 'by', 'to', 'and', 'or', 'but', 'is', 'are', 'was', 'were']);
  
  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    
    // Extract 1-3 word phrases that might be concepts
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^a-z0-9]/gi, '');
      
      // Skip stop words as single concepts
      if (stopWords.has(word)) continue;
      
      // Add single words that might be concepts
      if (word.length > 3) {
        concepts.push(word);
      }
      
      // Add 2-word phrases
      if (i < words.length - 1) {
        const nextWord = words[i + 1].toLowerCase().replace(/[^a-z0-9]/gi, '');
        if (!stopWords.has(nextWord) && nextWord.length > 1) {
          concepts.push(`${word} ${nextWord}`);
        }
      }
      
      // Add 3-word phrases
      if (i < words.length - 2) {
        const nextWord = words[i + 1].toLowerCase().replace(/[^a-z0-9]/gi, '');
        const thirdWord = words[i + 2].toLowerCase().replace(/[^a-z0-9]/gi, '');
        if (nextWord.length > 1 && thirdWord.length > 1) {
          concepts.push(`${word} ${nextWord} ${thirdWord}`);
        }
      }
    }
  });
  
  // Return unique concepts
  return [...new Set(concepts)];
};

/**
 * Calculate key concepts preservation
 */
const calculateKeyConceptsPreservation = (groundTruthText, problemText) => {
  if (!groundTruthText || !problemText) return 0;
  
  // Extract key concepts from ground truth
  const gtConcepts = extractKeyConcepts(groundTruthText);
  
  // Count preserved concepts
  const problemTextLower = problemText.toLowerCase();
  const preservedConcepts = gtConcepts.filter(concept => 
    problemTextLower.includes(concept.toLowerCase())
  );
  
  return gtConcepts.length > 0 ? 
    preservedConcepts.length / gtConcepts.length : 0;
};

/**
 * Calculate structural quality
 */
const calculateStructuralQuality = (title, description) => {
  if (!title || !description) return 0;
  
  let score = 0;
  
  // Check if title is appropriate length (not too short, not too long)
  const titleLength = title.length;
  if (titleLength >= 10 && titleLength <= 150) {
    score += 0.3;
  } else if (titleLength > 0) {
    score += 0.1;
  }
  
  // Check if description is substantial
  if (description.length >= 50) {
    score += 0.3;
  } else if (description.length > 0) {
    score += 0.1;
  }
  
  // Check if description includes problem statement indicators
  const problemIndicators = [
    'problem', 'challenge', 'issue', 'question', 'investigate',
    'explore', 'address', 'solve', 'improve', 'enhance'
  ];
  
  const hasIndicators = problemIndicators.some(indicator => 
    description.toLowerCase().includes(indicator)
  );
  
  if (hasIndicators) {
    score += 0.2;
  }
  
  // Check if description includes structure (e.g., background, approach, significance)
  const structuralIndicators = [
    'background', 'context', 'approach', 'method', 'significance',
    'importance', 'impact', 'contribution', 'novel', 'new'
  ];
  
  const hasStructure = structuralIndicators.some(indicator => 
    description.toLowerCase().includes(indicator)
  );
  
  if (hasStructure) {
    score += 0.2;
  }
  
  return score;
};