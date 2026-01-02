// src\components\evaluation\template\utils\templateQualityMetrics.js
import { calculateStringSimilarity } from './stringUtils';

export const calculateTemplateQuality = (templateData, researchProblem) => {
  if (!templateData) return defaultQualityMetrics();

  return {
    titleQuality: calculateTitleQuality(templateData, researchProblem),
    descriptionQuality: calculateDescriptionQuality(templateData),
    propertyCoverage: calculatePropertyCoverage(templateData, researchProblem),
    researchAlignment: calculateResearchAlignment(templateData, researchProblem)
  };
};

const calculateTitleQuality = (templateData, researchProblem) => {
  const title = templateData.title || templateData.name || '';
  const titleLength = title.length;
  const wordCount = title.split(/\s+/).length;

  // Title quality scoring
  const lengthScore = titleLength >= 10 && titleLength <= 100 ? 0.5 : 0.2;
  const wordCountScore = wordCount >= 2 && wordCount <= 15 ? 0.5 : 0.2;
  
  // Domain relevance
  const domainRelevanceScore = researchProblem 
    ? calculateStringSimilarity(title, researchProblem.title || '') 
    : 0;

  const totalScore = (lengthScore + wordCountScore + domainRelevanceScore) / 3;

  return {
    score: totalScore,
    reasons: {
      length: titleLength >= 10 && titleLength <= 100 
        ? "Title length is optimal" 
        : "Title length should be between 10-100 characters",
      wordCount: wordCount >= 2 && wordCount <= 15 
        ? "Word count is optimal" 
        : "Word count should be between 2-15 words",
      domainRelevance: domainRelevanceScore > 0.5 
        ? "Title is highly relevant to research domain" 
        : "Title could better reflect research domain"
    }
  };
};

// Similar implementations for other quality metrics...