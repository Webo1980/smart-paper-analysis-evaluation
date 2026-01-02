// src/components/evaluation/content/utils/evidenceUtils.js
/**
 * Utility functions for evidence analysis
 */
import { EVIDENCE_QUALITY_WEIGHTS, CONTENT_CONFIG } from '../config/contentConfig';
import { analyzeEvidenceSemantics } from './contentMetrics';

/**
 * Check if evidence is valid (has both evidence text and corresponding section)
 * @param {Object} evidence - Evidence object to check
 * @param {string} sectionName - Section name
 * @param {Object} textSections - Available text sections
 * @returns {boolean} Whether the evidence is valid
 */
export const validateEvidence = (evidence, sectionName, textSections) => {
  // First check if evidence and evidence.text exist
  if (!evidence || !evidence.text) {
    return false;
  }
  
  // Then check if the section exists
  if (!textSections || !textSections[sectionName]) {
    return false;
  }
  
  // Finally check if they're not empty strings
  if (evidence.text === '' || textSections[sectionName] === '') {
    return false;
  }
  
  return true;
};

/**
 * Analyze evidence against section text to determine quality metrics
 * @param {string} evidenceText - Evidence text
 * @param {string} sectionText - Section text to compare against
 * @returns {Object} Evidence analysis results
 */
export const analyzeEvidence = (evidenceText, sectionText) => {
  // Defensive check to prevent the includes error
  if (!evidenceText || !sectionText) {
    return {
      bestMatchScore: 0,
      bestMatchText: "",
      semanticAnalysis: {
        semanticSimilarity: 0,
        contextualRelevance: 0,
        tokenOverlap: 0,
        structureMatch: 0,
        overallScore: 0
      }
    };
  }
  
  // Check for exact match first
  if (sectionText.includes(evidenceText)) {
    return {
      bestMatchScore: 1.0,
      bestMatchText: evidenceText,
      semanticAnalysis: {
        semanticSimilarity: 1.0,
        contextualRelevance: 1.0,
        tokenOverlap: 1.0,
        structureMatch: 1.0,
        overallScore: 1.0
      }
    };
  }
  
  // Then check for partial matches
  const semanticAnalysis = analyzeEvidenceSemantics(evidenceText, sectionText);
  const bestMatchScore = semanticAnalysis.overallScore;
  const bestMatchText = sectionText.substring(0, 200);
  
  return {
    bestMatchScore,
    bestMatchText,
    semanticAnalysis
  };
};

/**
 * Extract and validate evidence items from paper content
 * @param {Object} paperContent - Paper content with properties and values
 * @param {Object} textSections - Text sections from the paper
 * @returns {Object} Extracted evidence items and property mapping
 */
export const extractEvidenceItems = (paperContent, textSections) => {
  if (!paperContent || !textSections) return { evidenceItems: [], propertyEvidenceMap: {} };
  
  const evidenceItems = [];
  const propertyEvidenceMap = {};
  
  Object.keys(paperContent).forEach(propId => {
    const property = paperContent[propId];
    if (!property?.values) return;
    
    property.values.forEach((value, valueIndex) => {
      if (!value.evidence) return;
      
      Object.keys(value.evidence).forEach(sectionName => {
        const evidence = value.evidence[sectionName];
        
        // Validate the evidence exists and matches a section
        const hasEvidence = validateEvidence(evidence, sectionName, textSections);
        
        // Skip if evidence is not valid
        if (!hasEvidence) return;
        
        // Get section text
        const sectionText = textSections[sectionName];
        
        // Analyze the evidence against section text
        const analysisResult = analyzeEvidence(evidence.text, sectionText);
        
        // Only include evidence that has some similarity (> 0)
        if (analysisResult.bestMatchScore > 0) {
          // Determine if this is a significant match
          const isSignificantMatch = analysisResult.bestMatchScore >= CONTENT_CONFIG.textSimilarityThreshold;
          
          const evidenceItem = {
            id: `${propId}-${valueIndex}-${sectionName}`,
            property: propId,
            propertyLabel: property.property || property.label || propId,
            value: value.value,
            evidence: evidence.text,
            section: sectionName,
            isValid: isSignificantMatch, // Based on semantic similarity threshold
            hasEvidence: hasEvidence, // Based solely on validateEvidence result
            bestMatchScore: analysisResult.bestMatchScore,
            bestMatchText: analysisResult.bestMatchText,
            semanticAnalysis: analysisResult.semanticAnalysis
          };

          evidenceItems.push(evidenceItem);
          
          // Group by property
          if (!propertyEvidenceMap[propId]) {
            propertyEvidenceMap[propId] = {
              property: propId,
              propertyLabel: property.property || property.label || propId,
              values: []
            };
          }
          propertyEvidenceMap[propId].values.push(evidenceItem);
        }
      });
    });
  });
  
  return { evidenceItems, propertyEvidenceMap };
};

/**
 * Process evidence items to generate distribution data
 * @param {Array} evidenceItems - Evidence items to process
 * @returns {Object} Processed evidence data for visualization
 */
export const processEvidenceData = (evidenceItems) => {
  // Track direct counts based on hasEvidence for pie chart
  let directValidCount = 0;
  let directInvalidCount = 0;
  
  // Count hasEvidence vs !hasEvidence for pie chart
  evidenceItems.forEach(item => {
    if (item.hasEvidence) {
      directValidCount++;
    } else {
      directInvalidCount++;
    }
  });
  
  // Group evidence items by property
  const propertyDistribution = evidenceItems.reduce((acc, item) => {
    // Skip if no property or evidence
    if (!item.property || !item.evidence) return acc;
    
    const propertyKey = item.property;
    const propertyName = item.propertyLabel || item.property;
    
    if (!acc[propertyKey]) {
      acc[propertyKey] = { 
        property: propertyKey,
        propertyName: propertyName,
        total: 0,
        valid: 0,
        invalid: 0,
      };
    }
    
    // Count the item based on hasEvidence (not isValid)
    acc[propertyKey].total += 1;
    if (item.hasEvidence) {  // Use hasEvidence for property chart
      acc[propertyKey].valid += 1;
    } else {
      acc[propertyKey].invalid += 1;
    }
    
    return acc;
  }, {});
  
  // Convert to array and calculate validation rate
  const propertyData = Object.values(propertyDistribution)
    .map(item => ({
      ...item,
      validRate: item.total > 0 ? item.valid / item.total : 0,
      shortName: shortenName(item.propertyName || item.property, 16)
    }))
    .sort((a, b) => b.total - a.total); // Sort by total count
  
  // Group evidence items by section
  const sectionDistribution = evidenceItems.reduce((acc, item) => {
    // Skip if no section or evidence
    if (!item.section || !item.evidence) return acc;
    
    const sectionName = item.section;
    
    if (!acc[sectionName]) {
      acc[sectionName] = { 
        section: sectionName,
        total: 0,
        valid: 0,
        invalid: 0,
      };
    }
    
    // Count the item based on hasEvidence (not isValid)
    acc[sectionName].total += 1;
    if (item.hasEvidence) {  // Use hasEvidence for section chart
      acc[sectionName].valid += 1;
    } else {
      acc[sectionName].invalid += 1;
    }
    
    return acc;
  }, {});
  
  // Convert to array and calculate validation rate
  const sectionData = Object.values(sectionDistribution)
    .map(item => ({
      ...item,
      validRate: item.total > 0 ? item.valid / item.total : 0,
      shortName: shortenName(item.section, 18)
    }))
    .sort((a, b) => b.total - a.total); // Sort by total count
    
  return {
    propertyData,
    sectionData,
    directValidCount,
    directInvalidCount,
    totalEvidence: directValidCount + directInvalidCount
  };
};

/**
 * Helper function to shorten names
 * @param {string} name - Name to shorten
 * @param {number} maxLength - Maximum length
 * @returns {string} Shortened name
 */
export const shortenName = (name, maxLength) => {
  if (!name) return 'Unnamed';
  return name.length > maxLength ? name.substring(0, maxLength - 2) + '..' : name;
};

/**
 * Calculate evidence quality metrics 
 * @param {Object} metrics - Evidence quality metrics
 * @returns {Object} Component scores and final score
 */
export const calculateEvidenceQualityScores = (metrics) => {
  if (!metrics || !metrics.evidenceQuality) {
    return {
      semanticSimilarityScore: 0,
      contextualRelevanceScore: 0,
      tokenOverlapScore: 0,
      structureMatchScore: 0,
      citationCoverageScore: 0,
      weightedSemanticScore: 0,
      weightedContextScore: 0,
      weightedTokenScore: 0,
      weightedStructureScore: 0,
      weightedCitationScore: 0,
      combinedScore: 0
    };
  }

  const details = metrics.evidenceQuality.details || {};
  
  // Calculate citation coverage from evidence items if available 
  // or use the provided value
  let citationCoverageScore = details.validEvidenceRate || 0;
  if (!citationCoverageScore && details.validEvidenceCount && details.totalEvidenceCount) {
    citationCoverageScore = details.validEvidenceCount / Math.max(1, details.totalEvidenceCount);
  }
  
  const semanticSimilarityScore = details.averageSimilarity || 0;
  const contextualRelevanceScore = details.contextualRelevance || 0;
  const tokenOverlapScore = details.tokenOverlap || 0;
  const structureMatchScore = details.structureMatch || 0;
  
  // Apply weights from config
  const weightedCitationScore = citationCoverageScore * EVIDENCE_QUALITY_WEIGHTS.citationCoverage;
  const weightedSemanticScore = semanticSimilarityScore * EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity;
  const weightedContextScore = contextualRelevanceScore * EVIDENCE_QUALITY_WEIGHTS.contextualRelevance;
  const weightedTokenScore = tokenOverlapScore * EVIDENCE_QUALITY_WEIGHTS.tokenOverlap;
  const weightedStructureScore = structureMatchScore * EVIDENCE_QUALITY_WEIGHTS.structureMatch;
  
  // Combined weighted score
  const combinedScore = 
    weightedCitationScore + 
    weightedSemanticScore + 
    weightedContextScore + 
    weightedTokenScore + 
    weightedStructureScore;
  
  return {
    semanticSimilarityScore,
    contextualRelevanceScore,
    tokenOverlapScore,
    structureMatchScore,
    citationCoverageScore,
    weightedCitationScore,
    weightedSemanticScore,
    weightedContextScore,
    weightedTokenScore,
    weightedStructureScore,
    combinedScore
  };
};