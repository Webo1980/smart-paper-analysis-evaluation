// src/components/evaluation/research-problem/utils/qualityAnalysisUtils.js
/**
 * This file contains utility functions for analyzing research problem quality
 */

/**
 * Calculate title quality based on various factors
 */
export const calculateTitleQuality = (problem) => {
    if (!problem || !problem.title) {
      return { score: 0, reason: "No title provided", details: {} };
    }
    
    const title = problem.title;
    const length = title.length;
    const words = title.split(/\s+/).filter(Boolean).length;
    
    // Basic quality metrics
    const lengthScore = Math.min(1, length / 100);
    const wordCountScore = words >= 4 && words <= 15 ? 1 : words < 4 ? words / 4 : 15 / words;
    
    // Check for specificity indicators
    const hasSpecificTerms = /approach|method|technique|framework|model|system|analysis/i.test(title);
    const specificityScore = hasSpecificTerms ? 1 : 0.5;
    
    // Combined score
    const score = (lengthScore * 0.3 + wordCountScore * 0.4 + specificityScore * 0.3);
    
    let reason;
    if (score > 0.7) {
      reason = "The title is well-formulated, with good length and specificity.";
    } else if (score > 0.4) {
      reason = "The title is adequate but could be improved in specificity or clarity.";
    } else {
      reason = "The title needs significant improvement in formulation, length, or focus.";
    }
    
    return {
      score,
      reason,
      details: {
        length,
        words,
        lengthScore,
        wordCountScore,
        specificityScore,
        hasSpecificTerms
      }
    };
  };
  
  /**
   * Calculate description quality based on various factors
   */
  export const calculateDescriptionQuality = (problem) => {
    if (!problem || !problem.description) {
      return { score: 0, reason: "No description provided", details: {} };
    }
    
    const description = problem.description;
    const length = description.length;
    const sentences = description.split(/[.!?]+/).filter(Boolean).length;
    const words = description.split(/\s+/).filter(Boolean).length;
    
    // Basic quality metrics
    const lengthScore = Math.min(1, length / 500);
    const sentenceScore = sentences >= 3 ? 1 : sentences / 3;
    
    // Check for problem formulation indicators
    const hasContextIndicators = /background|context|previous|existing|current/i.test(description);
    const hasMethodIndicators = /approach|method|technique|propose|develop|create/i.test(description);
    const hasObjectiveIndicators = /aim|goal|objective|purpose|focus/i.test(description);
    
    const structureScore = (hasContextIndicators ? 0.33 : 0) + 
                          (hasMethodIndicators ? 0.33 : 0) + 
                          (hasObjectiveIndicators ? 0.34 : 0);
    
    // Combined score
    const score = (lengthScore * 0.3 + sentenceScore * 0.3 + structureScore * 0.4);
    
    let reason;
    if (score > 0.7) {
      reason = "The description is comprehensive, well-structured, and clearly articulates the research problem.";
    } else if (score > 0.4) {
      reason = "The description adequately explains the problem but could be improved in structure or detail.";
    } else {
      reason = "The description needs significant improvement in structure, comprehensiveness, or clarity.";
    }
    
    return {
      score,
      reason,
      details: {
        length,
        sentences,
        words,
        lengthScore,
        sentenceScore,
        structureScore,
        hasContextIndicators,
        hasMethodIndicators,
        hasObjectiveIndicators
      }
    };
  };
  
  /**
   * Calculate relevance between problem and ground truth
   */
  export const calculateRelevanceScore = (problem, groundTruth) => {
    if (!problem || !groundTruth) {
      return { score: 0.5, reason: "Insufficient data to assess relevance", details: {} };
    }
    
    let groundTruthText = '';
    if (typeof groundTruth === 'string') {
      groundTruthText = groundTruth;
    } else if (typeof groundTruth === 'object') {
      groundTruthText = `${groundTruth.title || ''} ${groundTruth.description || ''}`;
    }
    
    const problemText = `${problem.title || ''} ${problem.description || ''}`;
    
    // Calculate word overlap
    const groundTruthWords = new Set(groundTruthText.toLowerCase().split(/\W+/).filter(Boolean));
    const problemWords = new Set(problemText.toLowerCase().split(/\W+/).filter(Boolean));
    
    let matchedWords = 0;
    problemWords.forEach(word => {
      if (groundTruthWords.has(word)) matchedWords++;
    });
    
    // Calculate Jaccard similarity
    const union = new Set([...groundTruthWords, ...problemWords]);
    const jaccardSimilarity = matchedWords / union.size;
    
    // Calculate word recall
    const wordRecall = matchedWords / groundTruthWords.size;
    
    // Combined score
    const score = (jaccardSimilarity * 0.5 + wordRecall * 0.5);
    
    let reason;
    if (score > 0.7) {
      reason = "The problem is highly relevant to the source material, with strong content alignment.";
    } else if (score > 0.4) {
      reason = "The problem is moderately relevant to the source material, with partial content alignment.";
    } else {
      reason = "The problem has low relevance to the source material, with minimal content alignment.";
    }
    
    return {
      score,
      reason,
      details: {
        matchedWords,
        totalGroundTruthWords: groundTruthWords.size,
        totalProblemWords: problemWords.size,
        jaccardSimilarity,
        wordRecall
      }
    };
  };
  
  /**
   * Calculate evidence quality based on description content
   */
  export const calculateEvidenceQualityScore = (problem) => {
    if (!problem || !problem.description) {
      return { score: 0, reason: "No description provided to assess evidence", details: {} };
    }
    
    const description = problem.description;
    
    // Check for evidence indicators in description
    const hasNumbers = /\d+%|\d+\.\d+|\(\d+\)|\[\d+\]/.test(description);
    const hasCitations = /\[\d+\]|\(\w+,\s*\d{4}\)|et al\./.test(description);
    const hasMethodTerms = /method|approach|technique|algorithm|model|framework|system/.test(description);
    const hasEvidenceTerms = /research shows|studies indicate|evidence suggests|according to|demonstrated by|shown in|findings|results/.test(description);
    
    // Count evidence indicators
    const evidenceCount = (hasNumbers ? 1 : 0) + 
                         (hasCitations ? 1 : 0) + 
                         (hasMethodTerms ? 1 : 0) + 
                         (hasEvidenceTerms ? 1 : 0);
    
    // Normalize score
    const score = evidenceCount / 4;
    
    let reason;
    if (score > 0.7) {
      reason = "The problem includes strong supporting evidence with specific details and references.";
    } else if (score > 0.4) {
      reason = "The problem includes some supporting evidence but could benefit from more specific details.";
    } else {
      reason = "The problem lacks sufficient supporting evidence and specific details.";
    }
    
    return {
      score,
      reason,
      details: {
        evidenceCount,
        hasNumbers,
        hasCitations,
        hasMethodTerms,
        hasEvidenceTerms
      }
    };
  };