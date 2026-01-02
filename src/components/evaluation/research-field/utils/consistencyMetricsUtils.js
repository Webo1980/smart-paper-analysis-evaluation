// src/components/evaluation/research-field/utils/consistencyMetricsUtils.js

/**
 * Safe rendering of predicted values
 */
export const renderPredictedValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.name || JSON.stringify(value);
    return String(value);
  };
  
  /**
   * Break down fields into words and generate word consistency analysis
   */
  export const analyzeWordConsistency = (groundTruth, predictedValues) => {
    // Convert to array if not already
    const predictionsArray = Array.isArray(predictedValues) ? predictedValues : [predictedValues];
    
    // Break down ground truth into words
    const safeGroundTruth = typeof groundTruth === 'string' ? groundTruth : 
                          (groundTruth ? String(groundTruth) : '');
    const groundTruthWords = safeGroundTruth.split(/\s+/).filter(word => word.trim().length > 0);
    
    // Generate normalized predictions strings
    const normalizedPredictions = predictionsArray.map(pred => ({
      name: renderPredictedValue(pred),
      score: pred.score || 1
    }));
    
    // Join all predicted values for combined word analysis
    const predictedValuesText = normalizedPredictions
      .map(item => renderPredictedValue(item))
      .join(' ');
      
    const predictedValuesWords = predictedValuesText.split(/\s+/)
      .filter(word => word.trim().length > 0);
    
    // Calculate ground truth-prediction consistency
    const groundTruthPredictedValuesConsistency = groundTruthWords.length > 0 ?
      groundTruthWords.reduce((total, word) => {
        return total + (predictedValuesWords.includes(word) ? 1 : 0);
      }, 0) / Math.max(groundTruthWords.length, predictedValuesWords.length, 1) : 0;
    
    // Calculate per-prediction consistency
    const predictionConsistencies = normalizedPredictions.map(pred => {
      const predWords = pred.name.split(/\s+/).filter(word => word.trim().length > 0);
      
      const groundTruthConsistency = predWords.length > 0 ?
        predWords.reduce((total, word) => {
          return total + (groundTruthWords.includes(word) ? 1 : 0);
        }, 0) / Math.max(predWords.length, groundTruthWords.length, 1) : 0;
      
      // All words consistency (vocabulary similarity)
      const allWords = Array.from(new Set([
        ...groundTruthWords, 
        ...predictedValuesWords, 
        ...normalizedPredictions.flatMap(p => p.name.split(/\s+/).filter(w => w.trim().length > 0))
      ]));
      
      const allWordsConsistency = predWords.length > 0 ?
        predWords.reduce((total, word) => {
          return total + (allWords.includes(word) ? 1 : 0);
        }, 0) / Math.max(predWords.length, allWords.length, 1) : 0;
      
      return {
        name: pred.name,
        groundTruthConsistency,
        allWordsConsistency
      };
    });
    
    // Find all unique words
    const allWords = Array.from(new Set([
      ...groundTruthWords, 
      ...predictedValuesWords, 
      ...normalizedPredictions.flatMap(p => p.name.split(/\s+/).filter(w => w.trim().length > 0))
    ]));
    
    return {
      groundTruthWords,
      predictedValuesWords,
      groundTruthPredictedValuesConsistency,
      predictionConsistencies,
      allWords,
      normalizedPredictions
    };
  };
  
  /**
   * Analyze word presence across predictions
   */
  export const analyzeWordPresence = (groundTruth, predictedValues) => {
    // Get word consistency data
    const wordConsistencyAnalysis = analyzeWordConsistency(groundTruth, predictedValues);
    
    // Create combined items array for presence analysis
    const allItems = [
      groundTruth,
      ...(Array.isArray(predictedValues) ? predictedValues : [predictedValues]),
      ...wordConsistencyAnalysis.normalizedPredictions.map(p => p.name)
    ].filter(item => item !== undefined && item !== null);
    
    // Calculate presence for each word
    const wordPresence = wordConsistencyAnalysis.allWords.map(word => {
      const presenceCount = allItems.filter(item => 
        String(item).includes(word)
      ).length;
      
      const presenceRate = presenceCount / Math.max(allItems.length, 1);
      
      return { word, presenceCount, presenceRate };
    });
    
    // Calculate average presence
    const averagePresence = wordPresence.length > 0 
      ? wordPresence.reduce((sum, item) => sum + item.presenceRate, 0) / wordPresence.length 
      : 0;
      
    return {
      wordPresence,
      averagePresence,
      items: allItems,
      wordConsistencyAnalysis
    };
  };
  
  /**
   * Calculate complete consistency metrics
   */
  export const calculateConsistencyMetrics = (params) => {
    const { groundTruth, predictedValues } = params;
    
    // Word presence analysis
    const { 
      wordPresence, 
      averagePresence, 
      items, 
      wordConsistencyAnalysis 
    } = analyzeWordPresence(groundTruth, predictedValues);
    
    // Calculate overall consistency score
    const predictionScores = wordConsistencyAnalysis.predictionConsistencies
      .map(pred => (pred.groundTruthConsistency + pred.allWordsConsistency) / 2);
  
    const avgPredictionScore = predictionScores.length > 0
      ? predictionScores.reduce((a, b) => a + b, 0) / predictionScores.length
      : 0;
  
    const groundTruthScore = wordConsistencyAnalysis.groundTruthPredictedValuesConsistency || 0;
    const presenceScore = averagePresence || 0;
  
    const overallConsistencyScore = (groundTruthScore + avgPredictionScore + presenceScore) / 3;
    
    return {
      metrics: {
        groundTruthConsistency: groundTruthScore,
        averagePredictionConsistency: avgPredictionScore,
        wordPresenceConsistency: presenceScore,
        overallConsistencyScore
      },
      details: {
        wordConsistencyAnalysis,
        wordPresence,
        averagePresence,
        visualizationItems: items,
        predictionScores
      }
    };
  };