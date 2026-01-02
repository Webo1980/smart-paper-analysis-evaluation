// src/components/evaluation/research-field/utils/relevanceMetricsUtils.js

/**
 * Calculate word-level metrics from text fields
 */
export const calculateWordMetrics = (groundTruth, prediction) => {
    // Handle null/undefined inputs
    const safeGroundTruth = groundTruth || '';
    const safePrediction = prediction || '';
    
    // Tokenize strings to words
    const refWords = safeGroundTruth.split(/\s+/).filter(w => w.trim().length > 0);
    const predWords = safePrediction.split(/\s+/).filter(w => w.trim().length > 0);
    
    // Find common words
    const commonWords = refWords.filter(w => 
      predWords.some(pw => pw.toLowerCase() === w.toLowerCase())
    );
    
    // Calculate metrics
    const wordOverlapScore = refWords.length === 0 ? 0 : commonWords.length / refWords.length;
    const unionWords = new Set([...refWords.map(w => w.toLowerCase()), ...predWords.map(w => w.toLowerCase())]);
    const jaccardScore = unionWords.size === 0 ? 0 : commonWords.length / unionWords.size;
    
    return {
      refWords,
      predWords,
      commonWords,
      wordOverlapScore,
      unionWords: unionWords.size,
      jaccardScore
    };
  };
  
  /**
   * Find field paths in taxonomy
   */
  export const findFieldPaths = (hierarchy, groundTruth, prediction) => {
    // Utility to find path by label
    const findFieldPathByLabel = (hierarchy, label) => {
      const findPath = (node, targetLabel, currentPath = []) => {
        const newPath = [...currentPath, { id: node.id, label: node.label }];
        
        if (node.label.toLowerCase() === targetLabel.toLowerCase()) return newPath;
        
        if (node.children) {
          for (const child of node.children) {
            const result = findPath(child, targetLabel, newPath);
            if (result) return result;
          }
        }
        
        return null;
      };
  
      return findPath(hierarchy, label) || [];
    };
    
    // Get field paths
    const refFieldPath = hierarchy ? findFieldPathByLabel(hierarchy, groundTruth) : [];
    const predFieldPath = hierarchy ? findFieldPathByLabel(hierarchy, prediction) : [];
    
    return { refFieldPath, predFieldPath };
  };
  
  /**
   * Calculate hierarchy-based Jaccard similarity
   */
  export const calculateHierarchyJaccard = (refFieldPath, predFieldPath) => {
    // Extract IDs for set operations
    const refPathSet = new Set(refFieldPath.map(node => node.id));
    const predPathSet = new Set(predFieldPath.map(node => node.id));
    
    // Calculate intersection and union
    const pathIntersection = [...refPathSet].filter(id => predPathSet.has(id));
    const intersectionSize = pathIntersection.length;
    const unionSize = new Set([...refPathSet, ...predPathSet]).size;
    
    // Calculate Jaccard score
    return {
      intersectionSize,
      unionSize,
      jaccardScore: unionSize ? intersectionSize / unionSize : 0
    };
  };
  
  /**
   * Find common ancestors between paths
   */
  export const findCommonAncestors = (refPath, predPath) => {
    const ancestors = [];
    const minLength = Math.min(refPath.length, predPath.length);
    
    for (let i = 0; i < minLength; i++) {
      if (refPath[i]?.id === predPath[i]?.id) {
        ancestors.push(refPath[i]);
      } else {
        break;
      }
    }
    
    return ancestors;
  };
  
  /**
   * Calculate hierarchy score based on path relationships
   */
  export const calculateHierarchyScore = (params) => {
    const { 
      refFieldPath, 
      predFieldPath,
      commonAncestors = []
    } = params;
    
    // Check for exact match
    const isExactMatch = refFieldPath.length > 0 && 
                        predFieldPath.length > 0 &&
                        refFieldPath.length === predFieldPath.length && 
                        refFieldPath[refFieldPath.length - 1]?.id === 
                        predFieldPath[predFieldPath.length - 1]?.id;
    
    if (isExactMatch) return { score: 1.0, isExactMatch: true };
    
    if (commonAncestors.length === 0) return { score: 0.1, isExactMatch: false };
    
    // Calculate path distance
    const pathDistance = (refFieldPath.length - commonAncestors.length) + 
                        (predFieldPath.length - commonAncestors.length);
    
    // Calculate based on common ancestors and path distance
    const commonAncestorsScore = commonAncestors.length / Math.max(1, Math.max(refFieldPath.length, predFieldPath.length));
    const distanceScore = 1 / (1 + pathDistance);
    
    const score = 0.6 * commonAncestorsScore + 0.4 * distanceScore;
    
    return { 
      score, 
      isExactMatch,
      pathDistance,
      commonAncestorsScore,
      distanceScore
    };
  };
  
  /**
   * Calculate complete relevance metrics
   */
  export const calculateRelevanceMetrics = (params) => {
    const { groundTruth, prediction, researchFieldsTree } = params;
    
    // Word-level metrics
    const wordMetrics = calculateWordMetrics(groundTruth, prediction);
    
    // Hierarchy metrics
    let hierarchyMetrics = { score: 0.177 }; // Default hard-coded value from the UI
    let hierarchyJaccard = { jaccardScore: 0.143 }; // Default hard-coded value from the UI
    let commonAncestors = [];
    
    // If we have taxonomy data, calculate actual scores
    if (researchFieldsTree) {
      const { refFieldPath, predFieldPath } = findFieldPaths(researchFieldsTree, groundTruth, prediction);
      commonAncestors = findCommonAncestors(refFieldPath, predFieldPath);
      
      hierarchyMetrics = calculateHierarchyScore({
        refFieldPath,
        predFieldPath,
        commonAncestors
      });
      
      hierarchyJaccard = calculateHierarchyJaccard(refFieldPath, predFieldPath);
    }
    
    // Calculate overall relevance score
    const relevanceScore = (
      (hierarchyMetrics.score * 0.4) + 
      (wordMetrics.wordOverlapScore * 0.4) + 
      (hierarchyJaccard.jaccardScore * 0.2)
    );
    
    return {
      metrics: {
        wordOverlapScore: wordMetrics.wordOverlapScore,
        jaccardScore: hierarchyJaccard.jaccardScore,
        hierarchyScore: hierarchyMetrics.score,
        relevanceScore
      },
      details: {
        wordMetrics,
        hierarchyMetrics,
        hierarchyJaccard,
        commonAncestors,
        weightedHierarchy: hierarchyMetrics.score * 0.4,
        weightedWordOverlap: wordMetrics.wordOverlapScore * 0.4,
        weightedJaccard: hierarchyJaccard.jaccardScore * 0.2
      }
    };
  };