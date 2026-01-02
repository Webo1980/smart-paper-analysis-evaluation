// src/components/evaluation/research-problem/utils/advancedContentAnalysisUtils.js

/**
 * Calculate Levenshtein distance between two strings
 */
export const calculateLevenshteinDistance = (str1, str2) => {
    const m = str1?.length || 0;
    const n = str2?.length || 0;
    
    if (m === 0 && n === 0) return { distance: 0, normalizedDistance: 0, similarityScore: 1 };
    if (m === 0) return { distance: n, normalizedDistance: 1, similarityScore: 0 };
    if (n === 0) return { distance: m, normalizedDistance: 1, similarityScore: 0 };
    
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
  
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }
  
    return {
      distance: dp[m][n],
      normalizedDistance: dp[m][n] / Math.max(m, n),
      similarityScore: 1 - (dp[m][n] / Math.max(m, n))
    };
  };
  
  /**
   * Analyze token matching between two texts
   */
  export const analyzeTokenMatching = (original, modified) => {
    if (!original || !modified) {
      return {
        originalTokens: [],
        modifiedTokens: [],
        matchedTokens: [],
        precision: 0,
        recall: 0,
        f1Score: 0
      };
    }
  
    // Tokenize both texts (simple whitespace tokenization)
    const originalTokens = original.split(/\s+/).filter(Boolean);
    const modifiedTokens = modified.split(/\s+/).filter(Boolean);
    
    // Find matching tokens
    const matchedTokens = originalTokens.filter(token => 
      modifiedTokens.includes(token)
    );
    
    // Calculate precision and recall
    const precision = modifiedTokens.length > 0 ? matchedTokens.length / modifiedTokens.length : 0;
    const recall = originalTokens.length > 0 ? matchedTokens.length / originalTokens.length : 0;
    
    // Calculate F1 score
    const f1Score = precision + recall > 0 
      ? 2 * (precision * recall) / (precision + recall) 
      : 0;
    
    return {
      originalTokens,
      modifiedTokens, 
      matchedTokens,
      precision,
      recall,
      f1Score
    };
  };
  
  /**
   * Analyze special characters in text
   */
  export const analyzeSpecialCharacters = (text) => {
    if (!text) return { count: 0, ratio: 0, characters: [] };
    
    const specialChars = text.match(/[^\w\s]/g) || [];
    const totalChars = text.length;
    
    // Count occurrences of each special character
    const charCounts = {};
    specialChars.forEach(char => {
      charCounts[char] = (charCounts[char] || 0) + 1;
    });
    
    // Convert to array and sort by frequency
    const characters = Object.entries(charCounts).map(([char, count]) => ({
      character: char,
      count,
      percentage: count / totalChars
    })).sort((a, b) => b.count - a.count);
    
    return {
      count: specialChars.length,
      ratio: specialChars.length / totalChars,
      characters
    };
  };
  
  /**
   * Calculate edit percentage between original and modified text
   */
  export const calculateEditPercentage = (original, modified) => {
    if (!original || !modified) {
      return {
        insertions: 0,
        deletions: 0, 
        modifications: 0,
        totalEdits: 0,
        editPercentage: 0,
        levenshteinData: { distance: 0, normalizedDistance: 0, similarityScore: 0 }
      };
    }
  
    // Get Levenshtein data
    const levenshteinData = calculateLevenshteinDistance(original, modified);
    
    // Calculate character-level changes (simplistic approach)
    const insertions = Math.max(0, modified.length - original.length);
    const deletions = Math.max(0, original.length - modified.length);
    const modifications = levenshteinData.distance - (insertions + deletions);
    
    // Calculate total edits and edit percentage
    const totalEdits = insertions + deletions + modifications;
    const editPercentage = original.length > 0 ? totalEdits / original.length : 0;
    
    return {
      insertions,
      deletions,
      modifications,
      totalEdits,
      editPercentage,
      levenshteinData
    };
  };
  
  /**
   * Get edit distance metrics for visualization components
   */
  export const getEditDistanceMetrics = (original, edited) => {
    if (!original || !edited) return null;
    
    // Extract fields
    const originalTitle = original.title || '';
    const originalDescription = original.description || original.problem || '';
    
    const editedTitle = edited.title || '';
    const editedDescription = edited.description || edited.problem || '';
    
    // Combine for overall comparison
    const originalText = `${originalTitle} ${originalDescription}`;
    const editedText = `${editedTitle} ${editedDescription}`;
    
    // Calculate Levenshtein metrics
    const titleLevenshtein = calculateLevenshteinDistance(originalTitle, editedTitle);
    const descriptionLevenshtein = calculateLevenshteinDistance(originalDescription, editedDescription);
    const overallLevenshtein = calculateLevenshteinDistance(originalText, editedText);
    
    return {
      title: {
        original: originalTitle,
        edited: editedTitle,
        levenshtein: titleLevenshtein
      },
      description: {
        original: originalDescription,
        edited: editedDescription,
        levenshtein: descriptionLevenshtein
      },
      overall: {
        levenshtein: overallLevenshtein
      }
    };
  };
  
  /**
   * Get token matching metrics for visualization components
   */
  export const getTokenMatchingMetrics = (original, edited) => {
    if (!original || !edited) return null;
    
    // Extract fields
    const originalTitle = original.title || '';
    const originalDescription = original.description || original.problem || '';
    
    const editedTitle = edited.title || '';
    const editedDescription = edited.description || edited.problem || '';
    
    // Combine for overall comparison
    const originalText = `${originalTitle} ${originalDescription}`;
    const editedText = `${editedTitle} ${editedDescription}`;
    
    // Calculate token matching metrics
    const titleTokens = analyzeTokenMatching(originalTitle, editedTitle);
    const descriptionTokens = analyzeTokenMatching(originalDescription, editedDescription);
    const overallTokens = analyzeTokenMatching(originalText, editedText);
    
    return {
      title: {
        original: originalTitle,
        edited: editedTitle,
        tokenMatching: titleTokens
      },
      description: {
        original: originalDescription,
        edited: editedDescription,
        tokenMatching: descriptionTokens
      },
      overall: {
        tokenMatching: overallTokens
      }
    };
  };
  
  /**
   * Get special characters metrics for visualization components
   */
  export const getSpecialCharactersMetrics = (problem) => {
    if (!problem) return null;
    
    // Extract fields
    const title = problem.title || '';
    const description = problem.description || problem.problem || '';
    
    // Analyze special characters
    const titleSpecialChars = analyzeSpecialCharacters(title);
    const descriptionSpecialChars = analyzeSpecialCharacters(description);
    
    return {
      title: {
        specialCharacters: titleSpecialChars
      },
      description: {
        specialCharacters: descriptionSpecialChars
      }
    };
  };
  
  /**
   * Get edit operation metrics for visualization components
   */
  export const getEditOperationMetrics = (original, edited) => {
    if (!original || !edited) return null;
    
    // Extract fields
    const originalTitle = original.title || '';
    const originalDescription = original.description || original.problem || '';
    
    const editedTitle = edited.title || '';
    const editedDescription = edited.description || edited.problem || '';
    
    // Combine for overall comparison
    const originalText = `${originalTitle} ${originalDescription}`;
    const editedText = `${editedTitle} ${editedDescription}`;
    
    // Calculate edit percentages
    const titleEdits = calculateEditPercentage(originalTitle, editedTitle);
    const descriptionEdits = calculateEditPercentage(originalDescription, editedDescription);
    const overallEdits = calculateEditPercentage(originalText, editedText);
    
    return {
      title: {
        original: originalTitle,
        edited: editedTitle,
        edits: titleEdits
      },
      description: {
        original: originalDescription,
        edited: editedDescription,
        edits: descriptionEdits
      },
      overall: {
        edits: overallEdits
      }
    };
  };
  
  /**
   * Detailed comparison of research problems
   * Comprehensive analysis combining all metrics
   */
  export const compareResearchProblems = (original, edited) => {
    if (!original || !edited) return null;
    
    // Extract relevant fields
    const originalTitle = original.title || original.problem_title || '';
    const originalDescription = original.problem || original.description || original.problem_description || '';
    const editedTitle = edited.title || edited.problem_title || '';
    const editedDescription = edited.problem || edited.description || edited.problem_description || '';
    
    // Combine title and description for overall comparison
    const originalText = `${originalTitle} ${originalDescription}`;
    const editedText = `${editedTitle} ${editedDescription}`;
    
    // Calculate detailed metrics
    const titleLevenshtein = calculateLevenshteinDistance(originalTitle, editedTitle);
    const descriptionLevenshtein = calculateLevenshteinDistance(originalDescription, editedDescription);
    const overallLevenshtein = calculateLevenshteinDistance(originalText, editedText);
    
    const titleTokens = analyzeTokenMatching(originalTitle, editedTitle);
    const descriptionTokens = analyzeTokenMatching(originalDescription, editedDescription);
    const overallTokens = analyzeTokenMatching(originalText, editedText);
    
    const titleSpecialChars = analyzeSpecialCharacters(editedTitle);
    const descriptionSpecialChars = analyzeSpecialCharacters(editedDescription);
    
    const titleEdits = calculateEditPercentage(originalTitle, editedTitle);
    const descriptionEdits = calculateEditPercentage(originalDescription, editedDescription);
    const overallEdits = calculateEditPercentage(originalText, editedText);
    
    // Calculate user satisfaction estimate based on edit percentage
    // More edits generally indicate lower satisfaction
    const satisfactionEstimate = 1 - Math.min(overallEdits.editPercentage, 1);
    
    return {
      title: {
        original: originalTitle,
        edited: editedTitle,
        levenshtein: titleLevenshtein,
        tokenMatching: titleTokens,
        specialCharacters: titleSpecialChars,
        edits: titleEdits
      },
      description: {
        original: originalDescription,
        edited: editedDescription,
        levenshtein: descriptionLevenshtein,
        tokenMatching: descriptionTokens,
        specialCharacters: descriptionSpecialChars,
        edits: descriptionEdits
      },
      overall: {
        levenshtein: overallLevenshtein,
        tokenMatching: overallTokens,
        edits: overallEdits,
        satisfactionEstimate
      }
    };
  };