// src/components/evaluation/research-problem/config/researchProblemConfig.js

// Research Problem Metrics Definitions
export const RESEARCH_PROBLEM_METRICS = {
  PROBLEM_TITLE: {
    key: 'problemTitle',
    label: 'Problem Title',
    description: 'Evaluate how well the problem title captures the research focus.',
    type: 'accuracy'
  },
  PROBLEM_DESCRIPTION: {
    key: 'problemDescription',
    label: 'Problem Description',
    description: 'Assess the clarity and completeness of the problem description.',
    type: 'accuracy'
  },
  RELEVANCE: {
    key: 'relevance',
    label: 'Relevance',
    description: 'Evaluate how well the problem aligns with the paper content.',
    type: 'quality'
  },
  COMPLETENESS: {
    key: 'completeness',
    label: 'Completeness',
    description: 'Assess whether the problem captures all key aspects from the paper.',
    type: 'quality'
  },
  EVIDENCE_QUALITY: {
    key: 'evidenceQuality',
    label: 'Evidence Quality',
    description: 'Evaluate the quality of evidence supporting the problem formulation.',
    type: 'quality'
  }
};


// Evaluation fields for the form
export const EVALUATION_FIELDS = [
  { 
    id: 'problemTitle', 
    label: 'Problem Title', 
    description: 'Evaluate how well the problem title captures the research focus' 
  },
  { 
    id: 'problemDescription', 
    label: 'Problem Description', 
    description: 'Assess the clarity and completeness of the problem description' 
  },
  { 
    id: 'relevance', 
    label: 'Relevance', 
    description: 'Evaluate how well the problem aligns with the paper content' 
  },
  { 
    id: 'completeness', 
    label: 'Completeness', 
    description: 'Assess whether the problem captures all key aspects from the paper' 
  },
  { 
    id: 'evidenceQuality', 
    label: 'Evidence Quality', 
    description: 'Evaluate the quality of evidence supporting the problem formulation' 
  }
];

// Accuracy component weights
export const ACCURACY_WEIGHTS = {
  precision: 0.25,
  recall: 0.25,
  f1Score: 0.2,
  detailedAccuracy: 0.1,
  editDistance: 0.1,
  tokenMatching: 0.05,
  specialCharacters: 0.03,
  editOperations: 0.02
};

// Problem Accuracy weights (legacy)
export const PROBLEM_ACCURACY_WEIGHTS = {
  titleAlignment: 0.4,  // Title alignment with ground truth
  contentCoverage: 0.4, // Content coverage of key aspects
  specificity: 0.2      // Specificity of problem formulation
};

// Quality component weights
export const QUALITY_WEIGHTS = {
  problemTitle: 0.3,    // Problem title quality
  problemDescription: 0.3, // Problem description quality
  relevance: 0.2,       // Content relevance
  evidenceQuality: 0.2  // Quality of supporting evidence
};

// Default rating values
export const DEFAULT_RATINGS = {
  problemTitle: 0,
  problemDescription: 0,
  relevance: 0,
  completeness: 0,
  evidenceQuality: 0
};

// Score thresholds for visual indicators
export const RESEARCH_PROBLEM_CONFIG = {
  // Overall weights (accuracy vs quality)
  overallWeights: {
    accuracy: 0.6,
    quality: 0.4
  },
  
  // Score thresholds for visual indicators
  scoreThresholds: {
    good: 0.9,
    medium: 0.7
  }
};

export const ANALYSIS_COMPONENTS = {
  // Basic metrics
  precision: {
    key: 'precision',
    title: 'Precision',
    description: 'What percentage of the problem content accurately matches the ground truth',
    icon: 'Crosshair',
    weight: ACCURACY_WEIGHTS.precision,
    component: 'PrecisionAnalysis',
    type: 'basic'
  },
  recall: {
    key: 'recall',
    title: 'Recall',
    description: 'What percentage of the ground truth content is covered by the problem',
    icon: 'CheckCircle',
    weight: ACCURACY_WEIGHTS.recall,
    component: 'RecallAnalysis',
    type: 'basic'
  },
  f1Score: {
    key: 'f1Score',
    title: 'F1 Score',
    description: 'Balanced measure combining precision and recall for overall accuracy',
    icon: 'Activity',
    weight: ACCURACY_WEIGHTS.f1Score,
    component: 'F1ScoreAnalysis',
    type: 'basic'
  },
  
  // Advanced analyses
  editDistance: {
    key: 'editDistance',
    title: 'Edit Distance',
    description: 'Number of changes needed to transform the extracted problem to match the ground truth',
    icon: 'Edit',
    weight: ACCURACY_WEIGHTS.editDistance,
    component: 'EditDistanceAnalysis',
    type: 'advanced'
  },
  tokenMatching: {
    key: 'tokenMatching',
    title: 'Token Matching',
    description: 'How many words from the original text were preserved in the extracted problem',
    icon: 'Copy',
    weight: ACCURACY_WEIGHTS.tokenMatching,
    component: 'TokenMatchingAnalysis',
    type: 'advanced'
  },
  specialCharacters: {
    key: 'specialCharacters',
    title: 'Special Characters',
    description: 'Usage of special characters in the extracted problem',
    icon: 'Hash',
    weight: ACCURACY_WEIGHTS.specialCharacters,
    component: 'SpecialCharacterAnalysis',
    type: 'advanced'
  },
  editOperations: {
    key: 'editOperations',
    title: 'Edit Operations',
    description: 'Types of edit operations performed (insertions, deletions, modifications)',
    icon: 'List',
    weight: ACCURACY_WEIGHTS.editOperations,
    component: 'EditOperationAnalysis',
    type: 'advanced'
  }
};

// Accuracy configuration
export const ACCURACY_CONFIG = {
  textConfig: {
    referenceLabel: "Ground Truth",
    extractedLabel: "Extracted Problem",
    scoreLabel: "Accuracy Score",
    titles: {
      overallScore: 'Overall Problem Accuracy (Human-System Balanced)',
      automatedScore: 'Automated Problem Accuracy Score',
      analysisTitle: 'Problem Formulation Components Breakdown',
      hideAnalysis: 'Hide component analysis',
      showAnalysis: 'View component analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      accuracy: `This score represents the alignment between the extracted problem and the reference content. 
      It combines automated analysis (40%) with human expertise (60%, weighted by experience level) 
      to provide a balanced assessment of accuracy. The system applies a U-shaped confidence curve to ensure
      balanced judgment, with highest confidence in middle range scores and lowest confidence in extreme scores.
      Multiple metrics are weighted appropriately to evaluate different aspects of the research problem representation.`
    },
    analysisLabels: {
      accuracy: {
        title: 'How the Automated Score is Calculated:',
        description: 'The system evaluates problem accuracy using multiple metrics weighted by importance:',
        metrics: Object.values(ANALYSIS_COMPONENTS).map(component => ({
          name: `${component.title} (${(component.weight * 100).toFixed(0)}%):`,
          description: component.description
        }))
      }
    }
  },
  metricConfig: {
    accuracy: {
      primaryMetrics: Object.keys(ANALYSIS_COMPONENTS),
      mainMetric: 'overallScore',
      displayName: 'Problem Formulation Accuracy',
      components: ANALYSIS_COMPONENTS
    }
  }
};

// Quality configuration
export const QUALITY_CONFIG = {
  // Text configurations for components
  textConfig: {
    referenceLabel: "Ideal Quality Criteria",
    extractedLabel: "Current Problem",
    scoreLabel: "Quality Score",
    titles: {
      overallScore: 'Overall Quality (Human-System Balanced)',
      automatedScore: 'Automated Quality Score',
      analysisTitle: 'Detailed Quality Analysis',
      hideAnalysis: 'Hide detailed analysis',
      showAnalysis: 'View detailed analysis',
      noExplanation: 'No explanation available for this metric'
    },
    descriptions: {
      quality: 'Balanced scoring combines automated metrics with expert assessment, weighted by expertise level and confidence.'
    },
    analysisLabels: {
      title: 'Component Quality Analysis:',
      description: 'The overall quality is calculated by analyzing:',
      metrics: [
        {name: 'Title Quality:', description: 'How well the title is formulated and focused'},
        {name: 'Description Quality:', description: 'Completeness and clarity of problem description'},
        {name: 'Relevance:', description: 'How well the problem aligns with the source'},
        {name: 'Evidence Quality:', description: 'Quality of supporting evidence in the problem'}
      ]
    }
  },
  // Metric configurations
  metricConfig: {
    quality: {
      primaryMetrics: ['problemTitle', 'problemDescription', 'relevance', 'evidenceQuality'],
      mainMetric: 'overallQuality',
      displayName: 'Quality'
    }
  }
};

// Explanation texts for metrics
export const ACCURACY_EXPLANATIONS = {
  titleAlignment: {
    title: 'Title Alignment',
    short: 'Measures how well the problem title captures the key focus from the ground truth.',
    long: 'Title alignment evaluates the semantic and conceptual alignment between the problem title and the expected research focus. A high score indicates that the title accurately represents the core research challenge.',
    method: 'Combines semantic similarity and key concept preservation between the problem title and ground truth.',
    formula: 'Calculated through semantic alignment and key concept preservation',
    calculation: (problem, groundTruth, similarityData) => 
      `Title: "${problem.title || 'N/A'}" vs Expected Source\nWord Overlap: ${similarityData.titleTokenMetrics?.precision || 0}\nResult: ${similarityData.titleAlignment || 0}`,
    example: (problem, groundTruth, similarityData) => 
      `For this problem, the title "${problem.title || 'N/A'}" has ${
        similarityData.titleAlignment > 0.7 ? 'strong' : 
        similarityData.titleAlignment > 0.4 ? 'moderate' : 'weak'
      } alignment with the source material.`
  },
  contentCoverage: {
    title: 'Content Coverage',
    short: 'Measures how completely the problem covers the key aspects in the ground truth.',
    long: 'Content coverage evaluates how comprehensively the problem description addresses the key concepts, challenges, and context from the source material. A high score indicates thorough coverage of important aspects.',
    method: 'Based on concept coverage and content alignment',
    formula: 'Content coverage based on key concept preservation and topic coverage',
    calculation: (problem, groundTruth, similarityData) => 
      `Description vs Ground Truth\nKey Concepts Preserved: ${similarityData.keyConceptsPreserved || 0}\nResult: ${similarityData.contentCoverage || 0}`,
    example: (problem, groundTruth, similarityData) => 
      `The problem description ${
        similarityData.contentCoverage > 0.7 ? 'comprehensively' : 
        similarityData.contentCoverage > 0.4 ? 'partially' : 'minimally'
      } covers the key aspects from the source material.`
  },
  specificity: {
    title: 'Specificity',
    short: 'Measures how specific and well-defined the problem formulation is.',
    long: 'Specificity evaluates how precisely and clearly the research problem is formulated. A highly specific problem statement clearly defines the scope, approach, and research questions.',
    method: 'Based on specific terms and structural quality',
    formula: 'Analysis of specific problem-related terms and level of detail',
    calculation: (problem, groundTruth, similarityData) => 
      `Problem specificity analysis\nStructural Quality: ${similarityData.structuralQuality || 0}\nResult: ${similarityData.specificity || 0}`,
    example: (problem, groundTruth, similarityData) => 
      `The problem formulation is ${
        similarityData.specificity > 0.7 ? 'highly' : 
        similarityData.specificity > 0.4 ? 'moderately' : 'not very'
      } specific in defining the research challenge.`
  },
  precision: {
    title: 'Precision',
    short: 'Measures what percentage of the problem content accurately matches the ground truth.',
    long: 'Precision quantifies the accuracy of the problem content compared to the source material. High precision means that what\'s included in the problem is accurate and relevant.',
    method: 'For abstracts: Weighted average of title and description token precision. For ORKG problems: Direct calculation of matched tokens divided by problem tokens.',
    formula: 'Precision = Matched Tokens / Problem Tokens',
    calculation: (problem, groundTruth, similarityData) => 
      `Title Precision: ${similarityData.titleTokenMetrics?.precision || 0}\nDescription Precision: ${similarityData.descriptionTokenMetrics?.precision || 0}\nResult: ${similarityData.precision || 0}`,
    example: (problem, groundTruth, similarityData) => 
      `The problem has ${
        similarityData.precision > 0.7 ? 'high' : 
        similarityData.precision > 0.4 ? 'moderate' : 'low'
      } precision, meaning ${
        similarityData.precision > 0.7 ? 'most' : 
        similarityData.precision > 0.4 ? 'some' : 'few'
      } of its content accurately reflects the source material.`
  },
  recall: {
    title: 'Recall',
    short: 'Measures what percentage of the ground truth content is covered by the problem.',
    long: 'Recall quantifies how completely the problem captures the important content from the source material. High recall means that most key aspects from the source are included in the problem.',
    method: 'For abstracts: Weighted coverage of key concepts. For ORKG problems: Direct calculation of matched tokens divided by ground truth tokens.',
    formula: 'Recall = Matched Tokens / Ground Truth Tokens',
    calculation: (problem, groundTruth, similarityData) => 
      `Title Recall: ${similarityData.titleTokenMetrics?.recall || 0}\nDescription Recall: ${similarityData.descriptionTokenMetrics?.recall || 0}\nResult: ${similarityData.recall || 0}`,
    example: (problem, groundTruth, similarityData) => 
      `The problem captures ${
        similarityData.recall > 0.7 ? 'most' : 
        similarityData.recall > 0.4 ? 'some' : 'few'
      } of the key content from the source material.`
  },
  f1Score: {
    title: 'F1 Score',
    short: 'Balanced measure combining precision and recall for overall accuracy.',
    long: 'The F1 score provides a balanced assessment that considers both precision and recall. It helps identify whether the problem has a good balance between accuracy and completeness.',
    method: 'Harmonic mean of precision and recall',
    formula: 'F1 = 2 × (Precision × Recall) / (Precision + Recall)',
    calculation: (problem, groundTruth, similarityData) => 
      `Precision: ${similarityData.precision || 0}\nRecall: ${similarityData.recall || 0}\nF1 = 2 × (${similarityData.precision || 0} × ${similarityData.recall || 0}) / (${similarityData.precision || 0} + ${similarityData.recall || 0})\nResult: ${similarityData.f1Score || 0}`,
    example: (problem, groundTruth, similarityData) => 
      `The F1 score (${similarityData.f1Score || 0}) indicates ${
        similarityData.f1Score > 0.7 ? 'good' : 
        similarityData.f1Score > 0.4 ? 'moderate' : 'poor'
      } balance between precision and recall.`
  },
  prf: {
    importance: 'Precision and recall provide complementary views of accuracy. Precision measures how accurate the content is, while recall measures how complete it is. The F1 score balances both for an overall assessment.',
    interpretations: {
      high: 'High F1 score indicates excellent balance of accuracy and completeness.',
      good: 'Good F1 score shows reasonable balance between accuracy and completeness.',
      moderate: 'Moderate F1 score suggests improvements needed in either precision or recall.',
      low: 'Low F1 score indicates significant issues with either precision, recall, or both.'
    }
  },
  overallAccuracy: {
    title: 'Overall Accuracy',
    short: 'Combined measure of title alignment, content coverage, and specificity.',
    long: 'Overall accuracy provides a comprehensive assessment of how well the problem formulation aligns with and covers the essential aspects of the source material.',
    method: 'Weighted combination of component metrics',
    formula: '(Title Alignment × 40%) + (Content Coverage × 40%) + (Specificity × 20%)',
    calculation: (problem, groundTruth, similarityData) => 
      `(${similarityData.titleAlignment || 0} × 0.4) + (${similarityData.contentCoverage || 0} × 0.4) + (${similarityData.specificity || 0} × 0.2) = ${similarityData.overallScore || 0}`,
    example: (problem, groundTruth, similarityData) => 
      `Overall, the problem formulation has ${
        similarityData.overallScore > 0.7 ? 'high' : 
        similarityData.overallScore > 0.4 ? 'moderate' : 'low'
      } accuracy compared to the source material.`
  }
};

// Quality analysis explanations
export const QUALITY_EXPLANATIONS = {
  problemTitle: {
    title: 'Problem Title Quality',
    short: 'Evaluates the clarity, conciseness, and focus of the problem title.',
    long: 'A high-quality research problem title clearly conveys the focus of the research, using appropriate terminology and structure. It should be specific enough to distinguish the research from related areas.',
    method: 'Assesses clarity, specificity, and terminology',
    formula: 'Combined assessment of title clarity, terminology, and focus',
    calculation: (problem, groundTruth, qualityData) => 
      `Title: "${problem.title || 'N/A'}"\nClarity Score: ${qualityData.titleClarity || 0}\nTerminology Score: ${qualityData.titleTerminology || 0}\nResult: ${qualityData.problemTitle || 0}`,
    example: (problem, groundTruth, qualityData) => 
      `The problem title "${problem.title || 'N/A'}" is ${
        (qualityData.problemTitle || 0) > 0.7 ? 'well-formulated' : 
        (qualityData.problemTitle || 0) > 0.4 ? 'adequately formulated' : 'poorly formulated'
      }.`
  },
  problemDescription: {
    title: 'Problem Description Quality',
    short: 'Evaluates the clarity, completeness, and structure of the problem description.',
    long: 'A high-quality research problem description clearly articulates the challenge, context, and significance of the research. It should provide sufficient detail while remaining focused on the core research question.',
    method: 'Assesses clarity, completeness, and structure',
    formula: 'Combined assessment of description clarity, structure, and detail',
    calculation: (problem, groundTruth, qualityData) => 
      `Description Length: ${problem.description?.length || 0} characters\nClarity Score: ${qualityData.descriptionClarity || 0}\nStructure Score: ${qualityData.descriptionStructure || 0}\nResult: ${qualityData.problemDescription || 0}`,
    example: (problem, groundTruth, qualityData) => 
      `The problem description is ${
        (qualityData.problemDescription || 0) > 0.7 ? 'well-articulated' : 
        (qualityData.problemDescription || 0) > 0.4 ? 'adequately articulated' : 'poorly articulated'
      }.`
  },
  relevance: {
    title: 'Relevance',
    short: 'Evaluates how well the problem aligns with the source material content.',
    long: 'Relevance assesses whether the research problem addresses a significant challenge that is central to the source material. A highly relevant problem focuses on key aspects rather than peripheral issues.',
    method: 'Assesses content alignment and significance',
    formula: 'Semantic alignment with source material focus areas',
    calculation: (problem, groundTruth, qualityData) => 
      `Content Match: ${qualityData.contentMatch || 0}\nFocus Alignment: ${qualityData.focusAlignment || 0}\nResult: ${qualityData.relevance || 0}`,
    example: (problem, groundTruth, qualityData) => 
      `The problem is ${
        (qualityData.relevance || 0) > 0.7 ? 'highly relevant' : 
        (qualityData.relevance || 0) > 0.4 ? 'moderately relevant' : 'minimally relevant'
      } to the source material.`
  },
  evidenceQuality: {
    title: 'Evidence Quality',
    short: 'Evaluates the quality of supporting evidence in the problem formulation.',
    long: 'Evidence quality assesses how well the problem is supported by specific details, context, or methodological considerations. Strong evidence helps establish the significance and feasibility of addressing the research problem.',
    method: 'Analyzes specific details, references, and context',
    formula: 'Combined assessment of supporting details and context',
    calculation: (problem, groundTruth, qualityData) => 
      `Detail Level: ${qualityData.detailLevel || 0}\nContextual Support: ${qualityData.contextualSupport || 0}\nResult: ${qualityData.evidenceQuality || 0}`,
    example: (problem, groundTruth, qualityData) => 
      `The problem contains ${
        (qualityData.evidenceQuality || 0) > 0.7 ? 'strong' : 
        (qualityData.evidenceQuality || 0) > 0.4 ? 'moderate' : 'minimal'
      } supporting evidence.`
  },
  overallQuality: {
    title: 'Overall Quality',
    short: 'Combines title quality, description quality, relevance, and evidence quality.',
    long: 'Overall quality provides a comprehensive assessment of the research problem formulation, considering multiple dimensions of quality. A high-quality problem is well-articulated, relevant, and supported by evidence.',
    method: 'Weighted combination of quality dimensions',
    formula: '(Problem Title × 30%) + (Problem Description × 30%) + (Relevance × 20%) + (Evidence Quality × 20%)',
    calculation: (problem, groundTruth, qualityData) => 
      `(${qualityData.problemTitle || 0} × 0.3) + (${qualityData.problemDescription || 0} × 0.3) + (${qualityData.relevance || 0} × 0.2) + (${qualityData.evidenceQuality || 0} × 0.2) = ${qualityData.overallQuality || 0}`,
    example: (problem, groundTruth, qualityData) => 
      `Overall, the research problem has ${
        (qualityData.overallQuality || 0) > 0.7 ? 'high' : 
        (qualityData.overallQuality || 0) > 0.4 ? 'moderate' : 'low'
      } quality.`
  }
};

