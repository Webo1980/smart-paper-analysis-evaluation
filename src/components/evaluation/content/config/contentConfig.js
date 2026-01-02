// src/components/evaluation/content/config/contentConfig.js
export const EVALUATION_FIELDS = [
  {
    id: 'propertyCoverage',
    label: 'Property Coverage',
    description: 'Did the AI identify and annotate all template properties?',
    weight: 0.3
  },
  {
    id: 'evidenceQuality',
    label: 'Evidence Quality',
    description: 'Are the cited evidence sections valid and relevant?',
    weight: 0.3
  },
  {
    id: 'valueAccuracy',
    label: 'Value Accuracy',
    description: 'Are the annotated property values accurate?',
    weight: 0.4
  }
];

export const QUALITY_WEIGHTS = {
  propertyCoverage: 0.3,
  evidenceQuality: 0.3,
  valueAccuracy: 0.4
};

export const PROPERTY_COVERAGE_WEIGHTS = {
  dataTypeMatch: 0.4,
  granularityQuality: 0.3,
  valueCompleteness: 0.3
};

export const EVIDENCE_QUALITY_WEIGHTS = {
  citationCoverage: 0.25,
  semanticSimilarity: 0.30,
  contextualRelevance: 0.25,
  tokenOverlap: 0.15,
  structureMatch: 0.05
};

export const TEXT_CONFIG = {
  accuracy: {
    title: 'Content Accuracy Analysis',
    description: 'This evaluation measures how accurately the paper was annotated based on the template properties. Scores consider property coverage and value accuracy.',
    sections: {
      precision: "Precision Analysis",
      recall: "Recall Analysis", 
      //valueAccuracy: "Value Accuracy Analysis",
      f1Score: "Overall Accuracy (F1 Score)"
    }
  },
  quality: {
    title: 'Content Quality Analysis',
    description: 'This evaluation assesses the quality of the paper annotations across multiple dimensions: property coverage, evidence quality, and value accuracy.',
    sections: {
      propertyCoverage: "Property Coverage Analysis",
      evidenceQuality: "Evidence Quality Analysis"
    }
  }
};

export const FORMULA_CONFIG = {
  precision: "Precision = Accurate annotations / Total annotations",
  recall: "Recall = Annotated properties / Total template properties",
  f1Score: "F1 Score = 2 × (Precision × Recall) / (Precision + Recall)",
  propertyCoverage: "Coverage = (Annotated properties / Total template properties) × Quality Factor",
  evidenceQuality: "Quality = (Valid evidence / Total evidence) × Semantic Similarity Score",
  valueAccuracy: "Accuracy = Accurate values / Total values",
  overallQuality: "Overall = (Property Coverage × weight) + (Evidence Quality × weight) + (Value Accuracy × weight)",
  dataTypeMatch: "Match Rate = Properties with correct data types / Total annotated properties",
  granularityQuality: "Quality = Sum(Granularity scores) / Total properties with values",
  valueCompleteness: "Completeness = Properties with complete values / Total annotated properties"
};

export const METRIC_CONFIG = {
  accuracy: {
    primaryMetrics: ['precision', 'recall', 'valueAccuracy'],
    mainMetric: 'f1Score'
  },
  quality: {
    primaryMetrics: ['propertyCoverage', 'evidenceQuality', 'valueAccuracy'],
    mainMetric: 'overallQuality'
  }
};

export const METRIC_EXPLANATIONS = {
  precision: {
    title: 'Precision',
    description: 'Measures what percentage of the annotations created by the system are accurate according to the template properties.',
    formula: 'Precision = Accurate annotations / Total annotations',
    analysis: {
      high: ' almost all of the annotated properties are accurate.',
      medium: ' a moderate portion of the annotated properties are accurate, but there are some errors.',
      low: ' many of the annotated properties contain errors or inaccuracies.'
    }
  },
  recall: {
    title: 'Recall',
    description: 'Measures what percentage of the template properties were successfully annotated in the paper.',
    formula: 'Recall = Annotated properties / Total template properties',
    analysis: {
      high: ' almost all template properties were successfully annotated.',
      medium: ' a moderate portion of template properties were annotated, but some were missed.',
      low: ' many template properties were not annotated from the paper.'
    }
  },
  valueAccuracy: {
    title: 'Value Accuracy',
    description: 'Evaluates how accurate the annotated property values are compared to the ground truth or expected values.',
    formula: 'Accuracy = Accurate values / Total values',
    analysis: {
      high: ' the annotated values are highly accurate and match the expected content.',
      medium: ' the annotated values are moderately accurate, but some contain errors or imprecisions.',
      low: ' many of the annotated values are inaccurate or incorrect.'
    }
  },
  f1Score: {
    title: 'F1 Score',
    description: 'A balanced measure combining precision and recall to provide an overall accuracy score.',
    formula: 'F1 Score = 2 × (Precision × Recall) / (Precision + Recall)',
    analysis: {
      high: ' The content annotation system performs extremely well, with both high precision and recall.',
      medium: ' The content annotation system performs reasonably well, but has room for improvement.',
      low: ' The content annotation system needs significant improvement in accuracy.'
    },
    comparison: {
      precisionHigher: 'The system is more precise than complete, meaning it annotates fewer properties but with higher accuracy.',
      recallHigher: 'The system prioritizes completeness over precision, annotating most properties but with some inaccuracies.',
      balanced: 'The system has a good balance between precision and recall, providing both accurate and complete annotations.'
    }
  },
  propertyCoverage: {
    title: 'Property Coverage',
    description: 'Evaluates whether all template properties were annotated in the paper with proper data types and granularity.',
    components: {
      dataTypeMatch: {
        title: 'Data Type Match',
        description: 'Measures if the annotated values match the expected data types defined in the template.',
        formula: 'Match Rate = Properties with correct data types / Total annotated properties',
        threshold: { good: 0.8, medium: 0.6 }
      },
      granularityQuality: {
        title: 'Granularity Quality',
        description: 'Assesses whether the level of detail in the annotated values is appropriate.',
        formula: 'Quality = Sum(Granularity scores) / Total properties with values',
        threshold: { good: 0.8, medium: 0.6 }
      },
      valueCompleteness: {
        title: 'Value Completeness',
        description: 'Evaluates if the annotated values contain all expected information.',
        formula: 'Completeness = Properties with complete values / Total annotated properties',
        threshold: { good: 0.8, medium: 0.6 }
      }
    }
  },
  evidenceQuality: {
    title: 'Evidence Quality',
    description: 'Evaluates the quality and validity of evidence citations that support property annotations',
    formula: 'EQ = (SS × Wss) + (CR × Wcr) + (TO × Wto) + (SM × Wsm)',
    components: {
      overallQuality: {
        title: 'Overall Evidence Quality',
        description: 'A comprehensive measure combining all evidence quality metrics to assess how well property values are supported by evidence from the paper.',
        formula: 'EQ = (SS × Wss) + (CR × Wcr) + (TO × Wto) + (SM × Wsm)',
        explanation: 'Where SS is Semantic Similarity, CR is Contextual Relevance, TO is Token Overlap, SM is Structure Match, and W are their respective weights.'
      },
      semanticSimilarity: {
        title: 'Semantic Similarity',
        description: 'Measures how closely the evidence text captures the meaning of the source text, even if different words are used.',
        formula: 'Similarity = Semantic vector similarity between evidence and source text',
        threshold: { good: 0.8, medium: 0.6 }
      },
      contextualRelevance: {
        title: 'Contextual Relevance',
        description: 'Evaluates whether the evidence is relevant to the property it claims to support.',
        formula: 'Relevance = Context overlap / Total possible context',
        threshold: { good: 0.8, medium: 0.6 }
      },
      tokenOverlap: {
        title: 'Token Overlap',
        description: 'Percentage of matching words between the evidence and source text.',
        formula: 'Overlap = |Evidence tokens ∩ Source tokens| / |Evidence tokens ∪ Source tokens|',
        threshold: { good: 0.6, medium: 0.4 }
      },
      structureMatch: {
        title: 'Structure Match',
        description: 'Assesses whether the evidence maintains the correct structure and relationships of the source text.',
        formula: 'Match = Structural similarity between evidence and source',
        threshold: { good: 0.7, medium: 0.5 }
      }
    }
  },
  overallQuality: {
    title: 'Overall Quality',
    description: 'A comprehensive measure combining all quality dimensions to assess the overall annotation quality.',
    formula: 'Overall = (Property Coverage × weight) + (Evidence Quality × weight) + (Value Accuracy × weight)',
    analysis: {
      high: 'The annotated content demonstrates excellent quality across all dimensions.',
      medium: 'The annotated content is of good quality but has room for improvement in some areas.',
      low: 'The annotated content has significant quality issues that should be addressed.'
    }
  },
  editAnalysis: {
    title: 'Edit Analysis',
    description: 'Analyzes the modifications made to LLM-generated content during evaluation.',
    components: {
      changeRate: {
        title: 'Change Rate',
        description: 'Percentage of properties that were modified during evaluation.',
        formula: 'Rate = (Added + Removed + Modified) / Total Original Properties',
        threshold: { good: 0.2, medium: 0.5 }
      },
      valuePreservation: {
        title: 'Value Preservation',
        description: 'Percentage of original values preserved in the final annotations.',
        formula: 'Preservation = Unchanged / Total Original Properties',
        threshold: { good: 0.8, medium: 0.5 }
      }
    }
  }
};

export const CONTENT_CONFIG = {
  overallWeights: {
    accuracy: 0.5,
    quality: 0.5
  },
  scoreThresholds: {
    excellent: 0.9,
    good: 0.7,
    medium: 0.4
  },
  textSimilarityThreshold: 0.6,
  annotationEvaluationWeight: {
    evidenceValidity: 0.7,
    valueAccuracy: 0.3
  },
  statusColors: {
    excellent: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    good: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    poor: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    }
  },
  chartColors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
};

export const SIMILARITY_METRIC_EXPLANATIONS = {
  semanticSimilarity: {
    title: "Semantic Similarity",
    description: "Measures how closely the meaning of two texts align using advanced NLP techniques that analyze word embeddings and contextual relationships between words and phrases.",
    formula: "cosine_similarity(embedding(text1), embedding(text2))"
  },
  editDistance: {
    title: "Edit Distance Similarity",
    description: "Calculates similarity based on the minimum number of single-character edits (insertions, deletions, or substitutions) required to change one text into the other.",
    formula: "1 - (levenshtein_distance(text1, text2) / max_length(text1, text2))"
  },
  jaccardSimilarity: {
    title: "Jaccard Similarity",
    description: "Computes the similarity between texts based on the intersection over union of their word sets, measuring lexical overlap.",
    formula: "intersection(word_set1, word_set2) / union(word_set1, word_set2)"
  },
  tokenF1Score: {
    title: "Token F1 Score",
    description: "Harmonic mean of token precision and recall, balancing the proportion of matching tokens from both texts.",
    formula: "2 * (precision * recall) / (precision + recall)"
  },
  tokenPrecision: {
    title: "Token Precision",
    description: "Measures what proportion of tokens in the target text appear in the source text.",
    formula: "matching_tokens / target_tokens"
  },
  tokenRecall: {
    title: "Token Recall",
    description: "Measures what proportion of tokens in the source text appear in the target text.",
    formula: "matching_tokens / source_tokens"
  },
  contextualAnalysis: {
    title: "Contextual Analysis",
    description: "Evaluates how well the evidence fits within the surrounding context of the source text using discourse analysis and coherence metrics."
  },
  levenshteinDistance: {
    title: "Levenshtein Distance",
    description: "The absolute count of single-character edits needed to transform one text into another, providing a raw measure of textual difference."
  }
};

export const PROPERTY_COVERAGE_EXPLANATIONS = {
  dataTypeMatch: {
    description: "Measures how well the annotated properties match their expected data types as defined in the template. Higher scores indicate better adherence to the type specification.",
    formula: "dataTypeMatchRate = dataTypeMatchCount / annotatedCount",
    example: "If 9 out of 10 properties have the correct data type, the score is 0.9 or 90%."
  },
  granularityQuality: {
    description: "Evaluates the level of detail and specificity in property values. Complex values with more information receive higher granularity scores than simple values.",
    formula: "granularityQuality = average(granularityScores) where values are scored based on complexity",
    example: "Detailed text descriptions receive scores near 1.0, while simple boolean values receive lower scores around 0.3."
  },
  valueCompleteness: {
    description: "Measures whether properties have complete values with supporting evidence. Properties with non-empty values and evidence receive higher completeness scores.",
    formula: "valueCompleteness = completeValueCount / annotatedCount",
    example: "If 8 out of 10 properties have complete values with evidence, the score is 0.8 or 80%."
  },
  overallCoverage: {
    description: "The combined score balancing property coverage rate with the quality of annotations based on data type correctness, value granularity, and completeness.",
    formula: "overallScore = (coverageRate * 0.4) + (dataTypeMatchRate * 0.3) + (granularityQuality * 0.15) + (valueCompleteness * 0.15)",
    example: "With coverageRate=0.85, dataTypeMatchRate=0.9, granularityQuality=0.75, valueCompleteness=0.8, the overall score would be: (0.85 * 0.4) + (0.9 * 0.3) + (0.75 * 0.15) + (0.8 * 0.15) = 0.34 + 0.27 + 0.1125 + 0.12 = 0.8425 or 84.25%"
  }
};