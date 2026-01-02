// src/components/evaluation/research-field/utils/fieldAnalysis.js

export const analyzeFieldNames = (orkgData, evaluationData) => {
    // Safely extract values with fallbacks
    const orkgField = orkgData?.research_field_name || '';
    const predictions = evaluationData?.researchFields?.fields || 
                        evaluationData?.fields || 
                        [];
  
    // Safety check - if no data, return baseline scores
    if (!orkgField && (!predictions || predictions.length === 0)) {
      return {
        confidence: 0.5,
        relevance: 0.5,
        consistency: 0.5,
        details: {
          confidenceReason: 'No data available for assessment.',
          relevanceReason: 'No data available for assessment.',
          consistencyReason: 'No data available for assessment.'
        }
      };
    }
  
    // Normalize field names for comparison
    const normalizeFieldName = (name) => {
      if (!name) return '';
      return name.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
  
    // Get normalized field names
    const orkgFieldNormalized = normalizeFieldName(orkgField);
    const predictionNames = predictions.map(p => 
      normalizeFieldName(p.name || p.field || '')
    ).filter(Boolean);
  
    // 1. Confidence calculation
    const calculateConfidence = () => {
      if (predictions.length === 0) return { score: 0.5, reason: 'No predictions available.' };
  
      // Use top prediction's confidence score if available
      const topPrediction = predictions[0];
      let confidenceScore = 0.5; // Default
      
      if (typeof topPrediction.score === 'number') {
        confidenceScore = Math.min(Math.max(topPrediction.score / 100, 0), 1);
      } else if (typeof topPrediction.confidence === 'number') {
        confidenceScore = Math.min(Math.max(topPrediction.confidence, 0), 1);
      }
  
      // If multiple predictions, analyze distribution
      if (predictions.length > 1) {
        const secondPredScore = predictions[1].score ? 
          Math.min(predictions[1].score / 100, 1) : 0.5;
        
        const scoreDifference = Math.max(confidenceScore - secondPredScore, 0);
        confidenceScore = (confidenceScore * 0.7) + (scoreDifference * 0.3);
      }
  
      return {
        score: confidenceScore,
        reason: `Top prediction confidence: ${(confidenceScore * 100).toFixed(1)}%`
      };
    };
  
    // 2. Relevance calculation
    const calculateRelevance = () => {
      if (!orkgFieldNormalized || predictions.length === 0) {
        return { score: 0.5, reason: 'Insufficient data for relevance assessment.' };
      }
  
      // Calculate semantic overlap with ground truth
      const topPredictionNormalized = predictionNames[0] || '';
      
      // Word-level overlap analysis
      const orkgWords = orkgFieldNormalized.split(' ').filter(Boolean);
      const predictionWords = topPredictionNormalized.split(' ').filter(Boolean);
      
      if (orkgWords.length === 0 || predictionWords.length === 0) {
        return { score: 0.5, reason: 'Empty field names prevent semantic analysis.' };
      }
      
      // Count matching words
      const matchingWords = orkgWords.filter(word => predictionWords.includes(word));
      
      // Calculate Jaccard similarity
      const union = new Set([...orkgWords, ...predictionWords]);
      const intersection = new Set(matchingWords);
      const jaccardSimilarity = intersection.size / union.size;
      
      // Calculate word order similarity
      let wordOrderScore = 1.0;
      if (matchingWords.length > 1) {
        const orkgIndices = matchingWords.map(word => orkgWords.indexOf(word));
        const predIndices = matchingWords.map(word => predictionWords.indexOf(word));
        
        // Check if indices maintain the same order
        const isOrdered = (arr) => {
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] <= arr[i-1]) return false;
          }
          return true;
        };
        
        if (!(isOrdered(orkgIndices) && isOrdered(predIndices))) {
          wordOrderScore = 0.8; // Penalty for different word orders
        }
      }
      
      // Combine with alternative field relevance
      let alternativeScore = 0.5;
      if (predictions.length > 1) {
        // Check how many alternatives have word overlap with ground truth
        const relevantAlternatives = predictionNames.slice(1).filter(name => {
          const altWords = name.split(' ').filter(Boolean);
          return orkgWords.some(word => altWords.includes(word));
        });
        
        alternativeScore = relevantAlternatives.length / Math.max(1, predictionNames.length - 1);
      }
      
      // Calculate final relevance score (weighted combination)
      const wordOverlapScore = intersection.size / Math.max(1, orkgWords.length);
      const finalScore = (wordOverlapScore * 0.5) + (jaccardSimilarity * 0.3) + 
                        (alternativeScore * 0.1) + (wordOrderScore * 0.1);
      
      return {
        score: Math.min(finalScore, 1.0),
        reason: `Word overlap: ${(wordOverlapScore * 100).toFixed(1)}%, Jaccard similarity: ${(jaccardSimilarity * 100).toFixed(1)}%`
      };
    };
  
    // 3. Consistency calculation
    const calculateConsistency = () => {
      if (predictions.length < 2) {
        return { score: 0.5, reason: 'At least two predictions needed to assess consistency.' };
      }
      
      // Analyze word frequency across predictions
      const allWords = new Set();
      const wordFrequency = {};
      
      // Count word frequencies
      predictionNames.forEach(name => {
        const words = name.split(' ').filter(Boolean);
        words.forEach(word => {
          allWords.add(word);
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
      });
      
      // Calculate average word presence
      const totalPredictions = predictionNames.length;
      const averageWordPresence = Object.values(wordFrequency).reduce((sum, freq) => sum + freq, 0) / 
        (allWords.size * totalPredictions);
      
      // Find common semantic elements
      const commonWords = [...allWords].filter(word => 
        wordFrequency[word] >= Math.ceil(totalPredictions / 2)
      );
      
      const semanticCoherenceScore = commonWords.length / Math.max(1, allWords.size);
      
      // Calculate score variance if available
      let scoreVarianceScore = 1.0;
      if (predictions.every(p => typeof p.score === 'number')) {
        const scores = predictions.map(p => p.score / 100);
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        
        // Lower variance means higher consistency
        scoreVarianceScore = Math.max(0, 1 - Math.sqrt(variance));
      }
      
      // Final consistency score
      const finalScore = (averageWordPresence * 0.4) + (semanticCoherenceScore * 0.4) + (scoreVarianceScore * 0.2);
      
      return {
        score: Math.min(finalScore, 1.0),
        reason: `Word coherence: ${(semanticCoherenceScore * 100).toFixed(1)}%, Average word presence: ${(averageWordPresence * 100).toFixed(1)}%`
      };
    };
  
    // Calculate all metrics
    const confidence = calculateConfidence();
    const relevance = calculateRelevance();
    const consistency = calculateConsistency();
  
    // Return final analysis
    return {
      confidence: confidence.score,
      relevance: relevance.score, 
      consistency: consistency.score,
      details: {
        confidenceReason: confidence.reason,
        relevanceReason: relevance.reason,
        consistencyReason: consistency.reason
      }
    };
  };
  
  export const analyzeFieldAccuracy = (orkgData, evaluationData) => {
    // Extract data with fallbacks
    const orkgField = orkgData?.research_field_name || '';
    const predictions = evaluationData?.researchFields?.fields || 
                       evaluationData?.fields || [];
    
    // If no data, return baseline scores
    if (!orkgField && (!predictions || predictions.length === 0)) {
      return {
        exactMatch: 0,
        topPosition: 0,
        semanticMatch: 0,
        details: {
          exactMatchReason: 'No data available for assessment.',
          topPositionReason: 'No data available for assessment.',
          semanticMatchReason: 'No data available for assessment.'
        }
      };
    }
  
    // Normalize field names for comparison
    const normalizeFieldName = (name) => {
      if (!name) return '';
      return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    };
  
    const orkgFieldNormalized = normalizeFieldName(orkgField);
    const predictionNames = predictions.map(p => 
      normalizeFieldName(p.name || p.field || '')
    ).filter(Boolean);
  
    // Calculate exact match score
    const calculateExactMatch = () => {
      if (predictionNames.length === 0 || !orkgFieldNormalized) {
        return { score: 0, reason: 'No predictions or reference field available.' };
      }
  
      // Check for exact match in predictions
      const exactMatchIndex = predictionNames.findIndex(name => name === orkgFieldNormalized);
      
      if (exactMatchIndex === 0) {
        return { score: 1.0, reason: 'Exact match found in top position.' };
      } else if (exactMatchIndex > 0) {
        // Exact match but not in top position
        const positionScore = Math.max(0, 1 - (exactMatchIndex / Math.min(5, predictionNames.length)));
        return { 
          score: positionScore, 
          reason: `Exact match found at position ${exactMatchIndex + 1}.` 
        };
      } else {
        return { score: 0, reason: 'No exact match found in predictions.' };
      }
    };
  
    // Calculate top position accuracy
    const calculateTopPosition = () => {
      if (predictionNames.length === 0 || !orkgFieldNormalized) {
        return { score: 0, reason: 'No predictions or reference field available.' };
      }
  
      const topPrediction = predictionNames[0];
      
      // If exact match, return perfect score
      if (topPrediction === orkgFieldNormalized) {
        return { score: 1.0, reason: 'Top prediction is exact match.' };
      }
      
      // Check for partial match
      const orkgWords = orkgFieldNormalized.split(' ').filter(Boolean);
      const predictionWords = topPrediction.split(' ').filter(Boolean);
      
      if (orkgWords.length === 0 || predictionWords.length === 0) {
        return { score: 0, reason: 'Empty field names prevent comparison.' };
      }
      
      // Calculate word overlap percentage
      const matchingWords = orkgWords.filter(word => predictionWords.includes(word));
      const wordOverlapPercentage = matchingWords.length / Math.max(1, orkgWords.length);
      
      // Calculate Jaccard similarity 
      const union = new Set([...orkgWords, ...predictionWords]);
      const intersection = new Set(matchingWords);
      const jaccardSimilarity = intersection.size / union.size;
      
      // Final score is weighted average of metrics
      const finalScore = (wordOverlapPercentage * 0.7) + (jaccardSimilarity * 0.3);
      
      return {
        score: finalScore,
        reason: `Word overlap: ${(wordOverlapPercentage * 100).toFixed(1)}%, Jaccard similarity: ${(jaccardSimilarity * 100).toFixed(1)}%`
      };
    };
  
    // Calculate semantic match score
    const calculateSemanticMatch = () => {
      if (predictionNames.length === 0 || !orkgFieldNormalized) {
        return { score: 0, reason: 'No predictions or reference field available.' };
      }
  
      // Check for reference field in any position
      const exactMatchIndex = predictionNames.findIndex(name => name === orkgFieldNormalized);
      
      // If found, calculate position-based score
      if (exactMatchIndex >= 0) {
        const positionScore = Math.max(0, 1 - (exactMatchIndex / Math.min(10, predictionNames.length)));
        return {
          score: positionScore,
          reason: `Reference field found at position ${exactMatchIndex + 1}.`
        };
      }
      
      // Find best semantic match
      let bestSimilarity = 0;
      let bestMatchIndex = -1;
      
      predictionNames.forEach((name, index) => {
        const orkgWords = orkgFieldNormalized.split(' ').filter(Boolean);
        const predWords = name.split(' ').filter(Boolean);
        
        const matchingWords = orkgWords.filter(word => predWords.includes(word));
        const wordOverlap = matchingWords.length / Math.max(1, orkgWords.length);
        
        // Calculate Jaccard similarity
        const union = new Set([...orkgWords, ...predWords]);
        const intersection = new Set(matchingWords);
        const jaccardSimilarity = intersection.size / union.size;
        
        // Combined similarity score with position adjustment
        const similarity = (wordOverlap * 0.7) + (jaccardSimilarity * 0.3);
        const positionAdjustedSimilarity = similarity * Math.max(0.5, 1 - (index * 0.1));
        
        if (positionAdjustedSimilarity > bestSimilarity) {
          bestSimilarity = positionAdjustedSimilarity;
          bestMatchIndex = index;
        }
      });
      
      return bestMatchIndex === -1 ? 
        { score: 0, reason: 'No semantic similarity found.' } :
        { 
          score: bestSimilarity, 
          reason: `Best match at position ${bestMatchIndex + 1} with ${(bestSimilarity * 100).toFixed(1)}% similarity.` 
        };
    };
  
    // Calculate all metrics
    const exactMatch = calculateExactMatch();
    const topPosition = calculateTopPosition();
    const semanticMatch = calculateSemanticMatch();
  
    return {
      exactMatch: exactMatch.score,
      topPosition: topPosition.score,
      semanticMatch: semanticMatch.score,
      details: {
        exactMatchReason: exactMatch.reason,
        topPositionReason: topPosition.reason,
        semanticMatchReason: semanticMatch.reason
      }
    };
  };
  