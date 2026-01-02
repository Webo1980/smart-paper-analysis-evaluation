// src/components/evaluation/template/config/templateConfig.js
// Template evaluation configuration

/**
 * Quality Metrics Configuration with Sub-Dimensions
 * This is the primary configuration used by TemplateQualityView
 */
export const QUALITY_METRICS = {
  titleQuality: {
    key: 'titleQuality',
    label: 'Title Quality',
    description: 'How well the template title reflects the research domain',
    weight: 0.25,
    color: 'blue',
    subDimensions: {
      clarity: { label: 'Clarity', description: 'Title clarity and specificity' },
      relevance: { label: 'Relevance', description: 'Title relevance to research' },
      completeness: { label: 'Completeness', description: 'Title captures key aspects' }
    }
  },
  descriptionQuality: {
    key: 'descriptionQuality',
    label: 'Description Quality',
    description: 'Clarity and completeness of the template description',
    weight: 0.25,
    color: 'green',
    subDimensions: {
      detail: { label: 'Detail Level', description: 'Description comprehensiveness' },
      clarity: { label: 'Clarity', description: 'Description understandability' },
      structure: { label: 'Structure', description: 'Logical organization' }
    }
  },
  propertyCoverage: {
    key: 'propertyCoverage',
    label: 'Property Coverage',
    description: 'Extent and completeness of property coverage',
    weight: 0.25,
    color: 'purple',
    subDimensions: {
      count: { label: 'Property Count', description: 'Number of properties' },
      variety: { label: 'Type Variety', description: 'Diversity of property types' },
      completeness: { label: 'Completeness', description: 'Required properties present' }
    }
  },
  researchAlignment: {
    key: 'researchAlignment',
    label: 'Research Alignment',
    description: 'Alignment with research problem and content',
    weight: 0.25,
    color: 'orange',
    subDimensions: {
      contextual: { label: 'Contextual Fit', description: 'Fits research context' },
      methodological: { label: 'Method Match', description: 'Aligns with methodology' },
      coverage: { label: 'Content Coverage', description: 'Covers research aspects' }
    }
  }
};

/**
 * Legacy TEMPLATE_METRICS for backwards compatibility
 */
export const TEMPLATE_METRICS = {
  TITLE_ACCURACY: {
    key: 'titleAccuracy',
    label: 'Title Accuracy',
    description: 'Evaluate how accurately the template title reflects the research domain.',
    type: 'accuracy'
  },
  DESCRIPTION_QUALITY: {
    key: 'descriptionQuality',
    label: 'Description Quality',
    description: 'Assess the clarity and completeness of the template description.',
    type: 'quality'
  },
  PROPERTY_COVERAGE: {
    key: 'propertyCoverage',
    label: 'Property Coverage',
    description: 'Evaluate whether the template includes all necessary properties for the research domain.',
    type: 'coverage'
  },
  RESEARCH_ALIGNMENT: {
    key: 'researchAlignment',
    label: 'Research Alignment',
    description: 'Assess how well the template aligns with the specific research problem.',
    type: 'relevance'
  }
};

// Evaluation fields for form
export const EVALUATION_FIELDS = [
  { 
    id: 'titleAccuracy', 
    label: 'Title Accuracy', 
    description: 'Evaluate how well the template title reflects the research domain' 
  },
  { 
    id: 'descriptionQuality', 
    label: 'Description Quality', 
    description: 'Assess the clarity and completeness of the template description' 
  },
  { 
    id: 'propertyCoverage', 
    label: 'Property Coverage', 
    description: 'Evaluate whether the template includes all necessary properties' 
  },
  { 
    id: 'researchAlignment', 
    label: 'Research Alignment', 
    description: 'Assess how well the template aligns with the research problem' 
  }
];

// Quality component weights
export const QUALITY_WEIGHTS = {
  titleQuality: 0.25,
  descriptionQuality: 0.25,
  propertyCoverage: 0.25,
  researchAlignment: 0.25
};

export const ACCURACY_WEIGHTS = {
  titleMatch: 0.2,
  f1Score: 0.6,
  typeMatch: 0.2
};

// Accuracy component weights for property matching
export const PROPERTY_ACCURACY_WEIGHTS = {
  exactMatch: 0.4,
  semanticMatch: 0.3,
  typeMatch: 0.3
};

// Text configuration for BaseContentMetrics
export const TEXT_CONFIG = {
  quality: {
    titles: {
      overallScore: 'Overall Template Quality Score (Human-System Balanced)',
      automatedScore: 'Automated Template Quality Score',
      analysisTitle: 'Detailed Template Quality Analysis',
      hideAnalysis: 'Hide detailed analysis',
      showAnalysis: 'View detailed analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      quality: 'Combines automated analysis with human expertise, giving more weight to expert judgment while maintaining objective measurements.'
    },
    analysisLabels: {
      quality: {
        title: 'Template Quality Analysis:',
        description: 'The automated score is calculated by combining four quality dimensions:',
        metrics: [
          {name: `Title Quality (${QUALITY_WEIGHTS.titleQuality * 100}%):`, description: 'How well does the title reflect the research domain?'},
          {name: `Description Quality (${QUALITY_WEIGHTS.descriptionQuality * 100}%):`, description: 'How clear and comprehensive is the template description?'},
          {name: `Property Coverage (${QUALITY_WEIGHTS.propertyCoverage * 100}%):`, description: 'Does the template include all necessary properties?'},
          {name: `Research Alignment (${QUALITY_WEIGHTS.researchAlignment * 100}%):`, description: 'How well does the template align with the research problem?'}
        ]
      }
    }
  }
};

// Metric configurations for BaseContentMetrics
export const METRIC_CONFIG = {
  accuracy: {
    primaryMetrics: ['precision', 'recall', 'titleMatch'],
    mainMetric: 'f1Score',
    displayName: 'Template Structure Accuracy'
  },
  quality: {
    primaryMetrics: ['titleQuality', 'descriptionQuality', 'propertyCoverage', 'researchAlignment'],
    mainMetric: 'overallQuality',
    displayName: 'Template Quality'
  },
  title: {
    explanations: {
      levenshteinDistance: {
        title: "Levenshtein Distance",
        description: "Measures the minimum number of single-character edits required to change one title into another",
        formula: "Count of edits (insertions, deletions, substitutions) needed",
        example: "Distance between 'kitten' and 'sitting' is 3",
        calculation: (orig, edit, dist) => `Distance between '${orig}' and '${edit}' is ${dist} edits`
      },
      similarityScore: {
        title: "Similarity Score",
        description: "Percentage-based similarity between titles based on Levenshtein distance",
        formula: "1 - (distance / max(length1, length2))",
        example: "If distance is 3 and max length is 10, similarity is 1-(3/10) = 70%",
        calculation: (dist, max, result) => `1 - (${dist}/${max}) = ${result}`
      },
      tokenF1Score: {
        title: "Token F1 Score",
        description: "Harmonic mean of precision and recall for word-level matching",
        formula: "2 * (precision * recall) / (precision + recall)",
        example: "If precision is 80% and recall is 70%, F1 = 2*(0.8*0.7)/(0.8+0.7) = 74.7%",
        calculation: (prec, rec, precPct, recPct, f1) => `2 * (${precPct} * ${recPct}) / (${precPct} + ${recPct}) = ${f1}`
      }
    }
  },
  description: {
    explanations: {
      levenshteinDistance: {
        title: "Levenshtein Distance",
        description: "Measures the minimum number of single-character edits required to change one description into another",
        formula: "Count of edits (insertions, deletions, substitutions) needed",
        example: "Distance between longer text segments",
        calculation: (orig, edit, dist) => `Edit distance: ${dist} operations`
      },
      similarityScore: {
        title: "Similarity Score",
        description: "Percentage-based similarity between descriptions based on Levenshtein distance",
        formula: "1 - (distance / max(length1, length2))",
        example: "Normalized similarity calculation for texts",
        calculation: (dist, max, result) => `1 - (${dist}/${max}) = ${result}`
      },
      tokenF1Score: {
        title: "Token F1 Score",
        description: "Harmonic mean of precision and recall for word-level matching in descriptions",
        formula: "2 * (precision * recall) / (precision + recall)",
        example: "Balanced measure of word overlap",
        calculation: (prec, rec, precPct, recPct, f1) => `2 * (${precPct} * ${recPct}) / (${precPct} + ${recPct}) = ${f1}`
      }
    }
  }
};

export const QUALITY_CRITERIA = {
  title: {
    lengthRange: { min: 10, max: 100 },
    wordCountRange: { min: 2, max: 15 },
    requiresCapitalization: true,
    minDomainRelevance: 0.3
  },
  description: {
    lengthRange: { min: 30, max: 500 },
    wordCountRange: { min: 5, max: 100 },
    requiresStructure: true,
    minSentences: 1
  },
  properties: {
    minProperties: 3,
    requiresRequiredProps: true,
    requiresVariedTypes: true,
    expectedPropertyTypes: {
      'Computer Science': ['method', 'algorithm', 'code', 'dataset', 'performance', 'complexity'],
      'Biomedical': ['sample', 'patient', 'tissue', 'gene', 'protein', 'treatment', 'drug'],
      'Physics': ['measurement', 'equation', 'theory', 'experiment', 'model', 'energy', 'particle'],
      'default': ['method', 'result', 'data', 'analysis', 'conclusion']
    }
  }
};

// Score thresholds for visual indicators
export const TEMPLATE_CONFIG = {
  // Add QUALITY_WEIGHTS to TEMPLATE_CONFIG
  QUALITY_WEIGHTS: QUALITY_WEIGHTS,
  
  // Overall weights (accuracy vs quality)
  overallWeights: {
    accuracy: 0.5,
    quality: 0.5
  },
  
  // Score thresholds for visual indicators
  scoreThresholds: {
    good: 0.8,
    medium: 0.6
  },
  
  // Expected property counts by domain
  expectedPropertyCounts: {
    default: {
      methodology: 3,
      results: 3,
      parameters: 2,
      implementation: 1,
      data: 2,
      other: 1
    },
    'Computer Science': {
      methodology: 3,
      results: 2,
      parameters: 3,
      implementation: 3,
      data: 2,
      other: 1
    },
    'Biomedical': {
      methodology: 4,
      results: 3,
      parameters: 2,
      implementation: 1,
      data: 3,
      other: 1
    }
  },
  
  // Heatmap thresholds
  heatmap: {
    thresholds: {
      high: 0.7,
      medium: 0.4
    }
  },
  
  // Visualization configuration
  colors: {
    primary: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'],
    secondary: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe']
  },
  radar: {
    outerRadius: 130,
    gridOpacity: 0.6,
    angleOffset: 90,
    domain: [0, 5]
  },
  bar: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    barSize: 20,
    barGap: 4
  }
};

// Default ratings
export const DEFAULT_RATINGS = {
  // Accuracy ratings
  titleMatch: 3,
  propertyMatch: 3,
  typeAccuracy: 3,
  
  // Quality ratings
  titleQuality: 3,
  descriptionQuality: 3,
  propertyCoverage: 3,
  researchAlignment: 3
};

// Helper to get property category
export const getPropertyCategory = (property) => {
  if (!property || !property.label) return 'other';
  
  const label = property.label.toLowerCase();
  if (label.includes('method') || label.includes('approach') || label.includes('technique')) {
    return 'methodology';
  } else if (label.includes('result') || label.includes('performance') || label.includes('evaluation')) {
    return 'results';
  } else if (label.includes('parameter') || label.includes('config') || label.includes('setting')) {
    return 'parameters';
  } else if (label.includes('implementation') || label.includes('code') || label.includes('tool')) {
    return 'implementation';
  } else if (label.includes('data') || label.includes('dataset')) {
    return 'data';
  }
  return 'other';
};