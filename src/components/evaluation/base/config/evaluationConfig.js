// src\components\evaluation\config\evaluationConfig.js
/**
 * Central configuration for evaluation weighting and calculations
 * These values are used across all domains unless overridden
 */
export const WEIGHTING_CONFIG = {
    // Balance between automated and user weights
    AUTOMATED_WEIGHT_BASE: 0.4,
    USER_WEIGHT_BASE: 0.6,
    
    // Minimum automated weight to ensure system always has some influence
    MIN_AUTOMATED_WEIGHT: 0.1,
    
    // Agreement bonus factor (up to 10% boost for agreement)
    AGREEMENT_BONUS_FACTOR: 0.1,
    
    // Default quality metrics weights
    DEFAULT_QUALITY_WEIGHTS: {
      completeness: 0.4,
      consistency: 0.3,
      validity: 0.3
    },
    
    // Default accuracy metrics weights
    DEFAULT_ACCURACY_WEIGHTS: {
      levenshtein: 0.5,
      tokenMatching: 0.3,
      specialChar: 0.2
    },
    
    // Default overall score weights
    DEFAULT_OVERALL_WEIGHTS: {
      accuracy: 0.6, 
      quality: 0.4
    }
  };
  
  /**
   * Convert expertise weight to multiplier
   * @param {number} expertiseWeight - Expertise weight (1-5)
   * @returns {number} Multiplier (0.8-1.8)
   */
  export const expertiseWeightToMultiplier = (expertiseWeight) => {
    if (!expertiseWeight) return 1.0;
    return 0.8 + (expertiseWeight - 1) * 0.2;
  };