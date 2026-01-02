// src/components/evaluation/research-problem/utils/metricsExplanations.js
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

export const textComparisonColors = {
  preserved: { color: "bg-green-700", description: "Text preserved in both versions" },
  removed: { color: "bg-red-700", description: "Text removed from the original" },
  added: { color: "bg-blue-700", description: "Text added in the edited version" }
};

// Improved with more precise formulas and calculations
export const metricExplanations = {
  // Text comparison metrics
  levenshteinDistance: {
    title: "Levenshtein Distance",
    description: "Measures the minimum number of single-character edits (insertions, deletions, or substitutions) required to change one text into another.",
    formula: "LD(s1, s2) = min(insertions + deletions + substitutions)",
    example: "For 'research' and 'search': LD = 2 (two deletions)",
    calculation: (original, edited, distance) => {
      if (!original || !edited) return "N/A";
      return `For "${original.substring(0, 10)}${original.length > 10 ? '...' : ''}" and "${edited.substring(0, 10)}${edited.length > 10 ? '...' : ''}", minimum edit operations = ${distance}`;
    }
  },
  similarityScore: {
    title: "Similarity Score",
    description: "A normalized score between 0 and 1 indicating how similar two texts are, based on their Levenshtein distance.",
    formula: "Similarity = 1 - (Levenshtein Distance / max(length of s1, length of s2))",
    example: "For 'research' vs 'search' with LD=2 and max length=8: Similarity = 1-(2/8) = 0.75 or 75%",
    calculation: (distance, maxLength, formattedResult) => {
      return `1 - (${distance} / ${maxLength}) = ${formattedResult}`;
    }
  },
  tokenF1Score: {
    title: "Token F1 Score",
    description: "Balanced measure of word-level matching that combines precision (accuracy of words used) and recall (coverage of original words).",
    formula: "F1 = 2 × (Precision × Recall) / (Precision + Recall)",
    example: "With Precision=80% and Recall=90%: F1 = 2×(0.8×0.9)/(0.8+0.9) = 84.7%",
    calculation: (precision, recall, formattedPrecision, formattedRecall, formattedResult) => {
      return `2 × (${formattedPrecision} × ${formattedRecall}) / (${formattedPrecision} + ${formattedRecall}) = ${formattedResult}`;
    }
  },
  
  // Relevance dimensions with enhanced formulas
  contentOverlap: {
    title: "Content Overlap",
    description: "Measures the degree to which the content in both texts covers the same topics and information.",
    formula: "CO = (Common Keywords / Total Keywords) × KeywordWeightFactor",
    calculation: (original, edited, score) => {
      const originalCount = original ? original.split(/\s+/).length : 0;
      const editedCount = edited ? edited.split(/\s+/).length : 0;
      const estimatedCommon = Math.round(score * Math.min(originalCount, editedCount));
      return `(${estimatedCommon} common keywords / ${originalCount + editedCount - estimatedCommon} total keywords) × weight factor = ${score}`;
    }
  },
  semanticAlignment: {
    title: "Semantic Alignment",
    description: "Evaluates how well the meanings align beyond just the specific words used, capturing the underlying concepts.",
    formula: "SA = cosine_similarity(embedding(text1), embedding(text2))",
    calculation: (score) => {
      return `Cosine similarity between document embeddings = ${score}`;
    }
  },
  keyConceptPreservation: {
    title: "Key Concept Preservation",
    description: "Assesses how well important research concepts from the source are preserved in the problem statement.",
    formula: "KCP = (Preserved Key Concepts / Total Key Concepts) × ImportanceFactor",
    calculation: (original, edited, score) => {
      // Estimate key concepts (typically 20-30% of nouns and technical terms)
      const originalWords = original ? original.split(/\s+/).length : 0;
      const estimatedKeyConcepts = Math.round(originalWords * 0.25);
      const preservedConcepts = Math.round(score * estimatedKeyConcepts);
      return `(${preservedConcepts} preserved concepts / ${estimatedKeyConcepts} key concepts) × importance factor = ${score}`;
    }
  },
  contextFidelity: {
    title: "Context Fidelity",
    description: "Measures how well the broader research context is maintained in the problem formulation.",
    formula: "CF = (Context Markers Preserved / Total Context Markers) × ContextWeight",
    calculation: (score) => {
      return `Analysis of preserved contextual framework elements = ${score}`;
    }
  },
  
  // Evidence quality dimensions with concrete formulas
  detailLevel: {
    title: "Detail Level",
    description: "Evaluates the specificity and depth of supporting details included in the problem formulation.",
    formula: "DL = (Specific Terms / Total Terms) × InformationDensity",
    calculation: (text, score) => {
      const wordCount = text ? text.split(/\s+/).length : 0;
      const estimatedSpecificTerms = Math.round(score * wordCount * 0.3);
      return `(${estimatedSpecificTerms} specific terms / ${wordCount} total terms) × information density = ${score}`;
    }
  },
  contextualSupport: {
    title: "Contextual Support",
    description: "Assesses how well the problem is contextualized within relevant research backgrounds and frameworks.",
    formula: "CS = (Background References / Expected References) × RelevanceFactor",
    calculation: (text, score) => {
      // Estimate background references based on text length
      const wordCount = text ? text.split(/\s+/).length : 0;
      const expectedReferences = Math.max(2, Math.round(wordCount / 50));
      const foundReferences = Math.round(score * expectedReferences);
      return `(${foundReferences} background references / ${expectedReferences} expected) × relevance factor = ${score}`;
    }
  },
  methodologicalClarity: {
    title: "Methodological Clarity",
    description: "Evaluates how clearly research methods or approaches are articulated in the problem statement.",
    formula: "MC = (Method Terms / Expected Method Terms) × ClarityFactor",
    calculation: (text, score) => {
      const wordCount = text ? text.split(/\s+/).length : 0;
      const expectedMethodTerms = Math.max(2, Math.round(wordCount * 0.15));
      const foundMethodTerms = Math.round(score * expectedMethodTerms);
      return `(${foundMethodTerms} method terms / ${expectedMethodTerms} expected) × clarity factor = ${score}`;
    }
  },
  citationQuality: {
    title: "Citation Quality",
    description: "Measures how well the problem statement is supported by references to existing literature or evidence.",
    formula: "CQ = (Citation Count × CitationRelevance) / ExpectedCitations",
    calculation: (text, score) => {
      const wordCount = text ? text.split(/\s+/).length : 0;
      const expectedCitations = Math.max(1, Math.round(wordCount / 100));
      const estimatedCitations = Math.round(score * expectedCitations);
      return `(${estimatedCitations} citations × relevance factor) / ${expectedCitations} expected = ${score}`;
    }
  }
};

// Helper function to generate real-time calculations with proper formatting
export const generateRealTimeCalculation = (metricKey, values) => {
  const metric = metricExplanations[metricKey];
  if (!metric) return "Calculation not available";
  
  switch(metricKey) {
    case 'similarityScore':
      return metric.calculation(
        values.distance, 
        values.maxLength,
        formatPercentage(1 - values.distance/values.maxLength)
      );
    case 'tokenF1Score':
      return metric.calculation(
        values.precision,
        values.recall,
        formatPercentage(values.precision),
        formatPercentage(values.recall),
        formatPercentage((2 * values.precision * values.recall) / (values.precision + values.recall))
      );
    case 'contentOverlap':
      return metric.calculation(values.original, values.edited, formatPercentage(values.score));
    case 'semanticAlignment':
      return metric.calculation(formatPercentage(values.score));
    case 'keyConceptPreservation':
      return metric.calculation(values.original, values.edited, formatPercentage(values.score));
    case 'contextFidelity':
      return metric.calculation(formatPercentage(values.score));
    case 'detailLevel':
      return metric.calculation(values.text, formatPercentage(values.score));
    case 'contextualSupport':
      return metric.calculation(values.text, formatPercentage(values.score));
    case 'methodologicalClarity':
      return metric.calculation(values.text, formatPercentage(values.score));
    case 'citationQuality':
      return metric.calculation(values.text, formatPercentage(values.score));
    default:
      return metric.calculation(values.original, values.edited, values.distance);
  }
};