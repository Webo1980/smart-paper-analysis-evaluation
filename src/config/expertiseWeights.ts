// src/config/expertiseWeights.js

// Role-based weights
export const ROLE_WEIGHTS = {
  'Professor': 5,
  'PostDoc': 4,
  'Senior Researcher': 4,
  'Researcher': 3.5,
  'PhD Student': 3,
  'Research Assistant': 2.5,
  'Master Student': 2,
  'Bachelor Student': 1.5,
  'Other': 1
};

// Domain expertise multipliers
export const DOMAIN_EXPERTISE_WEIGHTS = {
  'Expert': 2.0,    // Multiplier for domain experts
  'Advanced': 1.5,  // Multiplier for advanced knowledge
  'Intermediate': 1.0, // Base multiplier
  'Basic': 0.8,     // Reduction for basic knowledge
  'Novice': 0.6     // Reduction for novices
};

// Evaluation experience multipliers
export const EVALUATION_EXPERIENCE_WEIGHTS = {
  'Extensive': 1.3,  // Bonus for extensive evaluation experience
  'Moderate': 1.1,  // Small bonus for some experience
  'Limited': 1.0,   // No modification
  'None': 0.9       // Small reduction for no experience
};

/**
* Calculates expertise weight components and final weight
* @param {string} role - User's academic/professional role
* @param {string} domainExpertise - Level of domain expertise
* @param {string} evaluationExperience - Level of evaluation experience
* @param {string} orkgExperience - Whether user has used ORKG before ('used' or 'never')
* @returns {Object} Weight components and final normalized weight
*/
export const calculateExpertiseWeight = (role, domainExpertise, evaluationExperience, orkgExperience = 'never') => {
  // Get base weights from configuration
  const roleWeight = ROLE_WEIGHTS[role] || ROLE_WEIGHTS.Other;
  const domainMultiplier = DOMAIN_EXPERTISE_WEIGHTS[domainExpertise];
  const experienceMultiplier = EVALUATION_EXPERIENCE_WEIGHTS[evaluationExperience];
  
  // Calculate ORKG bonus (5% bonus for ORKG experience)
  const orkgBonus = orkgExperience === 'used' ? 0.05 : 0;

  // Calculate initial combined weight
  let combinedWeight = roleWeight * domainMultiplier * experienceMultiplier;
  
  // Apply ORKG bonus
  combinedWeight = combinedWeight * (1 + orkgBonus);
  
  // Normalize to 1-5 scale
  const finalWeight = Math.min(Math.max(combinedWeight, 1), 5);

  return {
      roleWeight,
      domainMultiplier,
      experienceMultiplier,
      orkgBonus,
      finalWeight
  };
};

/**
* Formats expertise weight components for display
* @param {Object} components - Weight calculation components
* @returns {string[]} Array of formatted strings for display
*/
export const formatExpertiseWeightComponents = (components) => {
  return [
      `Role Weight: ${components.roleWeight.toFixed(2)}`,
      `Domain Multiplier: ${components.domainMultiplier.toFixed(2)}`,
      `Experience Multiplier: ${components.experienceMultiplier.toFixed(2)}`,
      `ORKG Bonus: ${(components.orkgBonus * 100).toFixed(0)}%`,
      `Final Weight: ${components.finalWeight.toFixed(2)}/5`
  ];
};

/**
* Gets the confidence level based on the final expertise weight
* @param {number} weight - Final calculated expertise weight
* @returns {string} Confidence level (High, Medium, or Low)
*/
export const getConfidenceLevel = (weight) => {
  if (weight >= 4) return 'High';
  if (weight >= 2.5) return 'Medium';
  return 'Low';
};

/**
* Determines if an evaluator is considered an expert
* @param {number} weight - Final calculated expertise weight
* @returns {boolean} Whether the evaluator is considered an expert
*/
export const isExpertEvaluator = (weight) => {
  return weight >= 4;
};

/**
* Validates that all required expertise data is present
* @param {Object} data - User expertise data
* @returns {boolean} Whether all required data is present and valid
*/
export const validateExpertiseData = (data) => {
  if (!data.role || !data.domainExpertise || !data.evaluationExperience) {
      return false;
  }

  // Check if role is valid
  if (!(data.role in ROLE_WEIGHTS)) {
      return false;
  }

  // Check if domain expertise is valid
  if (!(data.domainExpertise in DOMAIN_EXPERTISE_WEIGHTS)) {
      return false;
  }

  // Check if evaluation experience is valid
  if (!(data.evaluationExperience in EVALUATION_EXPERIENCE_WEIGHTS)) {
      return false;
  }

  return true;
};