// src\components\evaluation\metadata\utils\contentAnalysisUtils.js
export const generateTextSimilarityData = (referenceValue, extractedValue) => {
    if (!referenceValue || !extractedValue) return null;
    
    // Calculate levenshtein distance
    const levenshteinDistance = (a, b) => {
      if (!a || !b) return 0;
      const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
      
      for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + substitutionCost
          );
        }
      }
      
      return matrix[b.length][a.length];
    };
    
    // Calculate token matching
    const calculateTokenMatching = (original, extracted) => {
      const originalTokens = original.split(/\s+/).filter(w => w.trim());
      const extractedTokens = extracted.split(/\s+/).filter(w => w.trim());
      const originalSet = new Set(originalTokens);
      
      let tokenMatchCount = 0;
      extractedTokens.forEach(token => {
        if (originalSet.has(token)) tokenMatchCount++;
      });
      
      return {
        originalTokens,
        extractedTokens,
        originalSet,
        tokenMatchCount,
        score: Math.min(
          Math.max(originalTokens.length, extractedTokens.length) > 0 ? 
            tokenMatchCount / Math.max(originalTokens.length, extractedTokens.length) : 1,
          1
        )
      };
    };
    
    // Calculate special character matching
    const calculateSpecialCharMatching = (original, extracted) => {
      const originalSpecial = (original.match(/[^\w\s]/g) || []);
      const extractedSpecial = (extracted.match(/[^\w\s]/g) || []);
      const originalSpecialSet = new Set(originalSpecial);
      
      let specialMatchCount = 0;
      extractedSpecial.forEach(char => {
        if (originalSpecialSet.has(char)) specialMatchCount++;
      });
      
      return {
        originalSpecial,
        extractedSpecial,
        originalSpecialSet,
        specialMatchCount,
        score: Math.min(
          Math.max(originalSpecial.length, extractedSpecial.length) > 0 ?
            specialMatchCount / Math.max(originalSpecial.length, extractedSpecial.length) : 1,
          1
        )
      };
    };
    
    const distance = levenshteinDistance(referenceValue, extractedValue);
    const maxLength = Math.max(referenceValue.length, extractedValue.length);
    const levenshteinScore = maxLength > 0 ? 1 - (distance / maxLength) : 1;
    
    const tokenMatching = calculateTokenMatching(referenceValue, extractedValue);
    const specialCharMatching = calculateSpecialCharMatching(referenceValue, extractedValue);
    
    // Calculate combined score using weighted components
    const weightedLevenshtein = levenshteinScore * 0.5;
    const weightedTokenMatching = tokenMatching.score * 0.3;
    const weightedSpecialChar = specialCharMatching.score * 0.2;
    const combinedScore = Math.min(weightedLevenshtein + weightedTokenMatching + weightedSpecialChar, 1.0);
    
    return {
      levenshtein: {
        score: levenshteinScore,
        distance,
        maxLength,
        weightedScore: weightedLevenshtein
      },
      tokenMatching: {
        ...tokenMatching,
        weightedScore: weightedTokenMatching
      },
      specialChar: {
        ...specialCharMatching,
        weightedScore: weightedSpecialChar
      },
      overallScore: combinedScore
    };
  };
  
  export const calculateOverallQuality = (fieldMetrics, weights, userRating = 0, expertiseMultiplier = 1) => {
    const automatedScore = 
      fieldMetrics.completeness.score * weights.completeness +
      fieldMetrics.consistency.score * weights.consistency + 
      fieldMetrics.validity.score * weights.validity;
    
    if (!userRating) return automatedScore;
    
    const normalizedRating = userRating / 5;
    const combinedScore = (normalizedRating * 0.7 + automatedScore * 0.3) * expertiseMultiplier;
    return Math.min(combinedScore, 1.0);
  };