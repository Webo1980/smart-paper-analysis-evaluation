/**
 * Comment Extraction Service - v4 UPDATED
 * 
 * CHANGES in v4:
 * - Added DOI extraction from evaluations
 * - Added paperId extraction from evaluations
 * - Comments now include doi and paperId fields
 * 
 * VERIFIED PATHS from actual data:
 * - evaluationMetrics.overall.metadata.[field].comments
 * - evaluationMetrics.overall.research_field.[field].comments
 * - evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.[field].comments
 * - evaluationMetrics.overall.template.[field]Comments (note: different pattern)
 * - evaluationMetrics.systemPerformance.systemPerformance.[field].comments
 * - evaluationMetrics.innovation.innovation.[field].comments
 * - evaluationMetrics.comparativeAnalysis.comparativeAnalysis.[field].comments
 * - evaluationMetrics.ragHighlight.ragHighlight.[field].comments
 */

// ============================================================================
// SELECTION CRITERIA
// ============================================================================

export const SELECTION_CRITERIA = {
  REPRESENTATIVE: 'representative',
  STRONG_SENTIMENT: 'strong_sentiment',
  EXPERT_ONLY: 'expert_only',
  LOW_RATING: 'low_rating',
  HIGH_RATING: 'high_rating',
  CRITICAL_FEEDBACK: 'critical_feedback',
  POSITIVE_FEEDBACK: 'positive_feedback',
  DETAILED: 'detailed',
  BY_COMPONENT: 'by_component'
};

// ============================================================================
// EXPERTISE CONFIGURATION
// ============================================================================

export const EXPERTISE_CONFIG = {
  roles: {
    'Professor': { weight: 5.0, tier: 'senior', label: 'Professor', credibilityLabel: 'highly credible' },
    'PostDoc': { weight: 4.0, tier: 'senior', label: 'PostDoc', credibilityLabel: 'highly credible' },
    'Senior Researcher': { weight: 4.0, tier: 'senior', label: 'Senior Researcher', credibilityLabel: 'highly credible' },
    'Researcher': { weight: 3.5, tier: 'mid', label: 'Researcher', credibilityLabel: 'credible' },
    'PhD Student': { weight: 3.0, tier: 'mid', label: 'PhD Student', credibilityLabel: 'credible' },
    'Research Assistant': { weight: 2.5, tier: 'junior', label: 'Research Assistant', credibilityLabel: 'moderately credible' },
    'Master Student': { weight: 2.0, tier: 'junior', label: 'Master Student', credibilityLabel: 'emerging' },
    'Bachelor Student': { weight: 1.5, tier: 'junior', label: 'Bachelor Student', credibilityLabel: 'emerging' },
    'Other': { weight: 1.0, tier: 'other', label: 'Other', credibilityLabel: 'general' }
  },
  domainExpertise: {
    'Expert': { multiplier: 2.0, label: 'Domain Expert', credibilityBoost: 'with deep domain knowledge' },
    'Advanced': { multiplier: 1.5, label: 'Advanced', credibilityBoost: 'with strong domain background' },
    'Intermediate': { multiplier: 1.0, label: 'Intermediate', credibilityBoost: 'with relevant domain experience' },
    'Basic': { multiplier: 0.8, label: 'Basic', credibilityBoost: 'with basic domain understanding' },
    'Novice': { multiplier: 0.6, label: 'Novice', credibilityBoost: 'new to the domain' }
  },
  evaluationExperience: {
    'Extensive': { multiplier: 1.3, label: 'Extensive Experience' },
    'Moderate': { multiplier: 1.1, label: 'Moderate Experience' },
    'Limited': { multiplier: 1.0, label: 'Limited Experience' },
    'None': { multiplier: 0.9, label: 'No Experience' }
  },
  orkgExperience: {
    'used': { bonus: 0.05, label: 'ORKG User' },
    'familiar': { bonus: 0.02, label: 'ORKG Familiar' },
    'none': { bonus: 0, label: 'No ORKG Experience' }
  }
};

// ============================================================================
// VERIFIED COMPONENT PATHS - Based on actual data structure
// ============================================================================

const COMPONENT_PATHS = {
  metadata: {
    name: 'Metadata',
    color: '#3b82f6',
    fields: [
      { path: 'evaluationMetrics.overall.metadata.title.comments', subfield: 'Title', ratingPath: 'evaluationMetrics.overall.metadata.title.rating' },
      { path: 'evaluationMetrics.overall.metadata.authors.comments', subfield: 'Authors', ratingPath: 'evaluationMetrics.overall.metadata.authors.rating' },
      { path: 'evaluationMetrics.overall.metadata.doi.comments', subfield: 'DOI', ratingPath: 'evaluationMetrics.overall.metadata.doi.rating' },
      { path: 'evaluationMetrics.overall.metadata.venue.comments', subfield: 'Venue', ratingPath: 'evaluationMetrics.overall.metadata.venue.rating' },
      { path: 'evaluationMetrics.overall.metadata.publication_year.comments', subfield: 'Publication Year', ratingPath: 'evaluationMetrics.overall.metadata.publication_year.rating' }
    ]
  },
  research_field: {
    name: 'Research Field',
    color: '#8b5cf6',
    fields: [
      { path: 'evaluationMetrics.overall.research_field.primaryField.comments', subfield: 'Primary Field', ratingPath: 'evaluationMetrics.overall.research_field.primaryField.rating' },
      { path: 'evaluationMetrics.overall.research_field.confidence.comments', subfield: 'Confidence', ratingPath: 'evaluationMetrics.overall.research_field.confidence.rating' },
      { path: 'evaluationMetrics.overall.research_field.consistency.comments', subfield: 'Consistency', ratingPath: 'evaluationMetrics.overall.research_field.consistency.rating' },
      { path: 'evaluationMetrics.overall.research_field.relevance.comments', subfield: 'Relevance', ratingPath: 'evaluationMetrics.overall.research_field.relevance.rating' },
      { path: 'evaluationMetrics.overall.research_field.comments', subfield: 'Overall', ratingPath: null }
    ]
  },
  research_problem: {
    name: 'Research Problem',
    color: '#ec4899',
    fields: [
      { path: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.problemTitle.comments', subfield: 'Problem Title', ratingPath: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.problemTitle.rating' },
      { path: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.problemDescription.comments', subfield: 'Problem Description', ratingPath: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.problemDescription.rating' },
      { path: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.relevance.comments', subfield: 'Relevance', ratingPath: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.relevance.rating' },
      { path: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.completeness.comments', subfield: 'Completeness', ratingPath: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.completeness.rating' },
      { path: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.evidenceQuality.comments', subfield: 'Evidence Quality', ratingPath: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.evidenceQuality.rating' },
      { path: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.overallComments', subfield: 'Overall', ratingPath: 'evaluationMetrics.overall.research_problem.overall.research_problem.userRatings.overallRating' }
    ]
  },
  template: {
    name: 'Template',
    color: '#f59e0b',
    fields: [
      { path: 'evaluationMetrics.overall.template.titleAccuracyComments', subfield: 'Title Accuracy', ratingPath: 'evaluationMetrics.overall.template.titleAccuracy' },
      { path: 'evaluationMetrics.overall.template.descriptionQualityComments', subfield: 'Description Quality', ratingPath: 'evaluationMetrics.overall.template.descriptionQuality' },
      { path: 'evaluationMetrics.overall.template.propertyCoverageComments', subfield: 'Property Coverage', ratingPath: 'evaluationMetrics.overall.template.propertyCoverage' },
      { path: 'evaluationMetrics.overall.template.researchAlignmentComments', subfield: 'Research Alignment', ratingPath: 'evaluationMetrics.overall.template.researchAlignment' },
      { path: 'evaluationMetrics.overall.template.overallComments', subfield: 'Overall', ratingPath: null }
    ]
  },
  content: {
    name: 'Content',
    color: '#10b981',
    fields: [],
    isDynamic: true
  },
  system_performance: {
    name: 'System Performance',
    color: '#6366f1',
    fields: [
      { path: 'evaluationMetrics.systemPerformance.systemPerformance.responsiveness.comments', subfield: 'Responsiveness', ratingPath: 'evaluationMetrics.systemPerformance.systemPerformance.responsiveness.rating' },
      { path: 'evaluationMetrics.systemPerformance.systemPerformance.errors.comments', subfield: 'Errors', ratingPath: 'evaluationMetrics.systemPerformance.systemPerformance.errors.rating' },
      { path: 'evaluationMetrics.systemPerformance.systemPerformance.stability.comments', subfield: 'Stability', ratingPath: 'evaluationMetrics.systemPerformance.systemPerformance.stability.rating' },
      { path: 'evaluationMetrics.systemPerformance.systemPerformance.overall.comments', subfield: 'Overall', ratingPath: 'evaluationMetrics.systemPerformance.systemPerformance.overall.rating' }
    ]
  },
  innovation: {
    name: 'Innovation',
    color: '#14b8a6',
    fields: [
      { path: 'evaluationMetrics.innovation.innovation.novelty.comments', subfield: 'Novelty', ratingPath: 'evaluationMetrics.innovation.innovation.novelty.rating' },
      { path: 'evaluationMetrics.innovation.innovation.usability.comments', subfield: 'Usability', ratingPath: 'evaluationMetrics.innovation.innovation.usability.rating' },
      { path: 'evaluationMetrics.innovation.innovation.impact.comments', subfield: 'Impact', ratingPath: 'evaluationMetrics.innovation.innovation.impact.rating' },
      { path: 'evaluationMetrics.innovation.innovation.overall.comments', subfield: 'Overall', ratingPath: 'evaluationMetrics.innovation.innovation.overall.rating' }
    ]
  },
  comparative_analysis: {
    name: 'Comparative Analysis',
    color: '#f97316',
    fields: [
      { path: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.efficiency.comments', subfield: 'Efficiency', ratingPath: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.efficiency.rating' },
      { path: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.quality.comments', subfield: 'Quality', ratingPath: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.quality.rating' },
      { path: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.completeness.comments', subfield: 'Completeness', ratingPath: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.completeness.rating' },
      { path: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.overall.comments', subfield: 'Overall', ratingPath: 'evaluationMetrics.comparativeAnalysis.comparativeAnalysis.overall.rating' }
    ]
  },
  rag_highlight: {
    name: 'RAG Highlight',
    color: '#a855f7',
    fields: [
      { path: 'evaluationMetrics.ragHighlight.ragHighlight.highlightAccuracy.comments', subfield: 'Highlight Accuracy', ratingPath: 'evaluationMetrics.ragHighlight.ragHighlight.highlightAccuracy.rating' },
      { path: 'evaluationMetrics.ragHighlight.ragHighlight.navigationFunctionality.comments', subfield: 'Navigation', ratingPath: 'evaluationMetrics.ragHighlight.ragHighlight.navigationFunctionality.rating' },
      { path: 'evaluationMetrics.ragHighlight.ragHighlight.manualHighlight.comments', subfield: 'Manual Highlight', ratingPath: 'evaluationMetrics.ragHighlight.ragHighlight.manualHighlight.rating' },
      { path: 'evaluationMetrics.ragHighlight.ragHighlight.contextPreservation.comments', subfield: 'Context Preservation', ratingPath: 'evaluationMetrics.ragHighlight.ragHighlight.contextPreservation.rating' },
      { path: 'evaluationMetrics.ragHighlight.ragHighlight.visualClarity.comments', subfield: 'Visual Clarity', ratingPath: 'evaluationMetrics.ragHighlight.ragHighlight.visualClarity.rating' },
      { path: 'evaluationMetrics.ragHighlight.ragHighlight.responseTime.comments', subfield: 'Response Time', ratingPath: 'evaluationMetrics.ragHighlight.ragHighlight.responseTime.rating' },
      { path: 'evaluationMetrics.ragHighlight.ragHighlight.overall.comments', subfield: 'Overall', ratingPath: null }
    ]
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getNestedValue(obj, path) {
  if (!obj || !path) return null;
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

/**
 * Simple check - just verify it's a non-empty string
 * NO aggressive filtering!
 */
function isValidComment(value) {
  return value && typeof value === 'string' && value.trim().length > 0;
}

// ============================================================================
// CONTENT EXTRACTION
// Content properties don't have individual comments in current structure
// ============================================================================

function extractContentComments(evaluation) {
  return [];
}

function extractPaperTitle(evaluation) {
  const paths = [
    'evaluationMetrics.overall.metadata.title.extractedValue',
    'evaluationMetrics.overall.metadata.title.referenceValue',
    'evaluationMetrics.overall.metadata.title.systemValue',
    'metadata.title',
    'paperMetadata.title'
  ];
  
  for (const path of paths) {
    const value = getNestedValue(evaluation, path);
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

/**
 * NEW: Extract DOI from evaluation
 */
function extractPaperDOI(evaluation) {
  const paths = [
    'metadata.doi',
    'evaluationMetrics.overall.metadata.doi.extractedValue',
    'evaluationMetrics.overall.metadata.doi.referenceValue',
    'evaluationMetrics.overall.metadata.doi.systemValue',
    'paperMetadata.doi',
    'doi'
  ];
  
  for (const path of paths) {
    const value = getNestedValue(evaluation, path);
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

/**
 * NEW: Extract Paper ID from evaluation
 */
function extractPaperId(evaluation) {
  const paths = [
    'paperId',
    'paper_id',
    'metadata.paperId',
    'metadata.paper_id',
    'paperMetadata.id',
    'paperMetadata.paperId'
  ];
  
  for (const path of paths) {
    const value = getNestedValue(evaluation, path);
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

// ============================================================================
// EXPERTISE CLASSIFICATION
// ============================================================================

export function classifyExpertise(userInfo) {
  if (!userInfo) {
    return {
      tier: 'unknown',
      level: 'unknown',
      compositeScore: 1.0,
      displayLabel: 'Unknown Evaluator',
      credibilityStatement: 'an evaluator'
    };
  }

  const role = userInfo.role || 'Other';
  const roleInfo = EXPERTISE_CONFIG.roles[role] || EXPERTISE_CONFIG.roles['Other'];
  
  const domainExpertise = userInfo.domainExpertise || 'Intermediate';
  const domainInfo = EXPERTISE_CONFIG.domainExpertise[domainExpertise] || EXPERTISE_CONFIG.domainExpertise['Intermediate'];
  
  let compositeScore = userInfo.expertiseWeight || userInfo.weightComponents?.finalWeight;
  if (!compositeScore) {
    const baseWeight = roleInfo.weight;
    const domainMultiplier = domainInfo.multiplier;
    compositeScore = Math.min(5, baseWeight * domainMultiplier);
  }
  
  let tier, level;
  if (compositeScore >= 4.0) {
    tier = 'expert';
    level = 'Expert Level';
  } else if (compositeScore >= 3.0) {
    tier = 'advanced';
    level = 'Advanced Level';
  } else if (compositeScore >= 2.0) {
    tier = 'intermediate';
    level = 'Intermediate Level';
  } else {
    tier = 'basic';
    level = 'Basic Level';
  }

  const credibilityStatement = `a ${roleInfo.credibilityLabel} ${roleInfo.label} ${domainInfo.credibilityBoost}`;

  return {
    tier,
    level,
    compositeScore,
    displayLabel: `${roleInfo.label} (${domainInfo.label})`,
    credibilityStatement,
    rawRole: role,
    rawDomainExpertise: domainExpertise,
    rawEvaluationExperience: userInfo.evaluationExperience,
    roleInfo,
    domainInfo
  };
}

// ============================================================================
// COMMENT EXTRACTION - MAIN FUNCTION
// ============================================================================

export function extractCommentsFromEvaluation(evaluation) {
  if (!evaluation) return [];

  const allComments = [];
  const token = evaluation.token || 'unknown';
  const paperId = extractPaperId(evaluation) || token;
  const paperTitle = extractPaperTitle(evaluation);
  const paperDOI = extractPaperDOI(evaluation); // NEW: Extract DOI
  const timestamp = evaluation.timestamp;
  const userInfo = evaluation.userInfo;
  const expertiseClass = classifyExpertise(userInfo);
  const addedComments = new Set();

  // Extract from all component paths
  Object.entries(COMPONENT_PATHS).forEach(([componentKey, config]) => {
    if (config.isDynamic && componentKey === 'content') {
      const contentComments = extractContentComments(evaluation);
      contentComments.forEach(cc => {
        const commentKey = `${componentKey}-${cc.subfield}-${cc.text.substring(0, 50)}`;
        if (!addedComments.has(commentKey)) {
          addedComments.add(commentKey);
          allComments.push({
            id: `${token}-${componentKey}-${cc.subfield}-${Math.random().toString(36).substr(2, 9)}`,
            component: componentKey,
            componentName: config.name,
            componentColor: config.color,
            subfield: cc.subfield,
            text: cc.text,
            rating: cc.rating,
            token,
            paperId,
            paperTitle,
            paperDOI, // NEW: Include DOI
            timestamp,
            userInfo,
            expertiseWeight: userInfo?.expertiseWeight || expertiseClass.compositeScore,
            expertiseClass,
            role: userInfo?.role || 'Unknown'
          });
        }
      });
    } else {
      config.fields.forEach(field => {
        const comment = getNestedValue(evaluation, field.path);
        
        if (isValidComment(comment)) {
          const commentKey = `${componentKey}-${field.subfield}-${comment.substring(0, 50)}`;
          if (!addedComments.has(commentKey)) {
            addedComments.add(commentKey);
            const rating = field.ratingPath ? getNestedValue(evaluation, field.ratingPath) : null;
            allComments.push({
              id: `${token}-${componentKey}-${field.subfield}-${Math.random().toString(36).substr(2, 9)}`,
              component: componentKey,
              componentName: config.name,
              componentColor: config.color,
              subfield: field.subfield,
              text: comment.trim(),
              rating,
              token,
              paperId,
              paperTitle,
              paperDOI, // NEW: Include DOI
              timestamp,
              userInfo,
              expertiseWeight: userInfo?.expertiseWeight || expertiseClass.compositeScore,
              expertiseClass,
              role: userInfo?.role || 'Unknown'
            });
          }
        }
      });
    }
  });

  return allComments;
}

export function extractAllComments(evaluations) {
  if (!evaluations || !Array.isArray(evaluations)) return [];
  
  const allComments = [];
  evaluations.forEach(evaluation => {
    const comments = extractCommentsFromEvaluation(evaluation);
    allComments.push(...comments);
  });
  
  console.log(`[CommentExtraction] Extracted ${allComments.length} comments from ${evaluations.length} evaluations`);
  return allComments;
}

// ============================================================================
// AUTO-SELECT COMMENTS
// ============================================================================

export function autoSelectComments(comments, criteria = {}, sentimentAnalyzer = null) {
  const {
    maxComments = 20,
    sentimentThreshold = 0.3,
    minLength = 50,
    expertTiers = ['expert', 'advanced'],
    lowRatingThreshold = 2,
    highRatingThreshold = 4,
    components = null,
    criteriaType = SELECTION_CRITERIA.REPRESENTATIVE
  } = criteria;

  const getSentiment = (text) => {
    if (sentimentAnalyzer) {
      const result = sentimentAnalyzer(text);
      return result.normalizedScore;
    }
    return 0.5;
  };

  let selected = [];

  switch (criteriaType) {
    case SELECTION_CRITERIA.STRONG_SENTIMENT:
      selected = comments
        .filter(c => {
          const score = getSentiment(c.text);
          return Math.abs(score - 0.5) >= sentimentThreshold;
        })
        .slice(0, maxComments)
        .map(c => c.id);
      break;

    case SELECTION_CRITERIA.EXPERT_ONLY:
      selected = comments
        .filter(c => expertTiers.includes(c.expertiseClass?.tier))
        .slice(0, maxComments)
        .map(c => c.id);
      break;

    case SELECTION_CRITERIA.LOW_RATING:
    case SELECTION_CRITERIA.CRITICAL_FEEDBACK:
      selected = comments
        .filter(c => c.rating && c.rating <= lowRatingThreshold)
        .sort((a, b) => {
          const tierOrder = { expert: 0, advanced: 1, intermediate: 2, basic: 3 };
          return (tierOrder[a.expertiseClass?.tier] || 3) - (tierOrder[b.expertiseClass?.tier] || 3);
        })
        .slice(0, maxComments)
        .map(c => c.id);
      break;

    case SELECTION_CRITERIA.HIGH_RATING:
    case SELECTION_CRITERIA.POSITIVE_FEEDBACK:
      selected = comments
        .filter(c => c.rating && c.rating >= highRatingThreshold)
        .sort((a, b) => {
          const tierOrder = { expert: 0, advanced: 1, intermediate: 2, basic: 3 };
          return (tierOrder[a.expertiseClass?.tier] || 3) - (tierOrder[b.expertiseClass?.tier] || 3);
        })
        .slice(0, maxComments)
        .map(c => c.id);
      break;

    case SELECTION_CRITERIA.DETAILED:
      selected = comments
        .filter(c => c.text.length >= minLength)
        .sort((a, b) => b.text.length - a.text.length)
        .slice(0, maxComments)
        .map(c => c.id);
      break;

    case SELECTION_CRITERIA.BY_COMPONENT:
      if (components && components.length > 0) {
        selected = comments
          .filter(c => components.includes(c.component))
          .slice(0, maxComments)
          .map(c => c.id);
      }
      break;

    case SELECTION_CRITERIA.REPRESENTATIVE:
    default:
      const byComponent = {};
      comments.forEach(c => {
        if (!byComponent[c.component]) byComponent[c.component] = [];
        byComponent[c.component].push(c);
      });

      const perComponent = Math.max(2, Math.floor(maxComments / Object.keys(byComponent).length));
      
      Object.values(byComponent).forEach(componentComments => {
        componentComments
          .sort((a, b) => {
            const tierOrder = { expert: 0, advanced: 1, intermediate: 2, basic: 3, unknown: 4 };
            return (tierOrder[a.expertiseClass?.tier] || 4) - (tierOrder[b.expertiseClass?.tier] || 4);
          })
          .slice(0, perComponent)
          .forEach(c => selected.push(c.id));
      });
      selected = selected.slice(0, maxComments);
      break;
  }

  return selected;
}

// ============================================================================
// NATURAL INTERPRETIVE REPORT GENERATION
// ============================================================================

export function generateInterpretiveReport(comments, selectedIds, options = {}) {
  const { sentimentAnalyzer = null } = options;

  const selected = selectedIds 
    ? comments.filter(c => selectedIds.includes(c.id))
    : comments;

  if (selected.length === 0) {
    return {
      narrative: 'No feedback comments were available for analysis.',
      markdown: 'No feedback comments were available for analysis.',
      statistics: { total: 0, expertCount: 0, positive: 0, neutral: 0, negative: 0 }
    };
  }

  const analyzed = selected.map(c => {
    const sentiment = sentimentAnalyzer ? sentimentAnalyzer(c.text) : null;
    const score = sentiment?.normalizedScore ?? 0.5;
    return {
      ...c,
      sentiment: score > 0.6 ? 'positive' : score < 0.4 ? 'negative' : 'neutral',
      isExpert: c.expertiseClass?.tier === 'expert' || c.expertiseClass?.tier === 'advanced'
    };
  });

  const positive = analyzed.filter(c => c.sentiment === 'positive');
  const negative = analyzed.filter(c => c.sentiment === 'negative');
  const neutral = analyzed.filter(c => c.sentiment === 'neutral');
  const experts = analyzed.filter(c => c.isExpert);

  const narrative = buildNaturalNarrative(analyzed, positive, negative, experts);

  return {
    narrative,
    markdown: narrative,
    statistics: {
      total: selected.length,
      expertCount: experts.length,
      positive: positive.length,
      neutral: neutral.length,
      negative: negative.length
    }
  };
}

function buildNaturalNarrative(all, positive, negative, experts) {
  const parts = [];
  const total = all.length;
  
  const positiveRatio = positive.length / total;
  if (positiveRatio > 0.6) {
    parts.push('Evaluators responded positively to the system overall.');
  } else if (positiveRatio < 0.35) {
    parts.push('Evaluators identified several areas needing improvement.');
  } else {
    parts.push('Evaluator feedback was mixed, highlighting both strengths and concerns.');
  }

  if (positive.length > 0) {
    const best = selectBestQuote(positive);
    const topics = findStrengthTopics(positive);
    
    let text = topics.length > 0 
      ? `Users particularly appreciated ${topics.join(' and ')}`
      : 'Users expressed appreciation for the system';
    
    if (best) {
      const role = formatRole(best);
      text += ` — ${role} noted "${cleanQuote(best.text)}"`;
    }
    parts.push(text + '.');
  }

  if (negative.length > 0) {
    const best = selectBestQuote(negative);
    const topics = findConcernTopics(negative);
    
    let text = topics.length > 0
      ? `The main concerns centered on ${topics.join(' and ')}`
      : 'Some concerns were raised';
    
    if (best) {
      const role = best.isExpert ? formatRole(best) : 'one user';
      text += ` — ${role} reported "${cleanQuote(best.text)}"`;
    }
    parts.push(text + '.');
  }

  if (experts.length >= 2) {
    const expertPositive = experts.filter(c => c.sentiment === 'positive').length;
    if (expertPositive > experts.length / 2) {
      parts.push(`Expert evaluators validated the approach, with ${expertPositive} of ${experts.length} providing favorable assessments.`);
    } else {
      parts.push('Expert feedback suggests prioritizing the identified concerns.');
    }
  }

  if (positive.length > negative.length && negative.length > 0) {
    parts.push('Despite minor concerns, the overall reception indicates the system meets user expectations.');
  }

  return parts.join(' ');
}

function selectBestQuote(comments) {
  return [...comments]
    .sort((a, b) => {
      if (a.isExpert !== b.isExpert) return a.isExpert ? -1 : 1;
      return b.text.length - a.text.length;
    })[0];
}

function cleanQuote(text) {
  let cleaned = text.trim().replace(/\.+$/, '');
  
  if (cleaned.length > 100) {
    const breakPoint = cleaned.lastIndexOf(' ', 90);
    cleaned = breakPoint > 40 
      ? cleaned.substring(0, breakPoint) + '...'
      : cleaned.substring(0, 90) + '...';
  }
  
  if (/^[A-Z][a-z]/.test(cleaned) && !/^(I |I'|The |A |An |It )/.test(cleaned)) {
    cleaned = cleaned[0].toLowerCase() + cleaned.slice(1);
  }
  
  return cleaned;
}

function formatRole(comment) {
  const role = comment.userInfo?.role || comment.role;
  if (role === 'Professor') return 'a Professor';
  if (role === 'PostDoc') return 'a PostDoc researcher';
  if (role === 'Senior Researcher') return 'a Senior Researcher';
  if (role === 'PhD Student') return 'a PhD student';
  if (role === 'Researcher') return 'a Researcher';
  if (comment.isExpert) return 'an expert evaluator';
  return 'an evaluator';
}

function findStrengthTopics(comments) {
  const topics = [];
  const text = comments.map(c => c.text.toLowerCase()).join(' ');
  
  if (text.includes('literature') || text.includes('review')) topics.push('its utility for literature review');
  if (text.includes('novel') || text.includes('innovative')) topics.push('the innovative approach');
  if (text.includes('easy') || text.includes('friendly')) topics.push('ease of use');
  if (text.includes('accurate') || text.includes('quality')) topics.push('output quality');
  if (text.includes('helpful') || text.includes('useful')) topics.push('practical utility');
  if (text.includes('potential')) topics.push('its potential');
  if (text.includes('highlight')) topics.push('the highlighting feature');
  
  return topics.slice(0, 2);
}

function findConcernTopics(comments) {
  const topics = [];
  const text = comments.map(c => c.text.toLowerCase()).join(' ');
  
  if (text.includes('slow') || text.includes('time') || text.includes('minute')) topics.push('processing speed');
  if (text.includes('complex') || text.includes('confusing')) topics.push('complexity');
  if (text.includes('error') || text.includes('incorrect')) topics.push('accuracy');
  if (text.includes('missing')) topics.push('missing information');
  
  return topics.slice(0, 2);
}

export const generateCommentReport = generateInterpretiveReport;

export function exportReport(report, format = 'markdown') {
  switch (format) {
    case 'markdown':
      return report.markdown;
    case 'json':
      return JSON.stringify(report, null, 2);
    case 'text':
      return report.narrative;
    case 'csv':
      let csv = 'Section,Content\n';
      report.sections.forEach(s => {
        csv += `"${s.title}","${s.content.replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
      });
      return csv;
    case 'latex':
      let latex = `% ${report.title}\n\\section{User Feedback Interpretation}\n\n`;
      report.sections.forEach(section => {
        latex += `\\subsection{${section.title}}\n\n`;
        let content = section.content
          .replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
          .replace(/\*([^*]+)\*/g, '\\textit{$1}');
        latex += content + '\n\n';
      });
      return latex;
    default:
      return report.markdown;
  }
}

// ============================================================================
// GROUPING FUNCTIONS
// ============================================================================

export function groupCommentsByComponent(comments) {
  const grouped = {};
  Object.keys(COMPONENT_PATHS).forEach(key => {
    grouped[key] = { name: COMPONENT_PATHS[key].name, color: COMPONENT_PATHS[key].color, comments: [] };
  });
  comments.forEach(comment => {
    if (grouped[comment.component]) {
      grouped[comment.component].comments.push(comment);
    }
  });
  return grouped;
}

export function groupCommentsByPaper(comments) {
  const grouped = {};
  comments.forEach(comment => {
    const key = comment.token || comment.paperId;
    if (!grouped[key]) {
      grouped[key] = { 
        token: comment.token, 
        paperId: comment.paperId, 
        paperTitle: comment.paperTitle, 
        paperDOI: comment.paperDOI, // NEW: Include DOI
        timestamp: comment.timestamp, 
        userInfo: comment.userInfo, 
        expertiseClass: comment.expertiseClass, 
        comments: [] 
      };
    }
    if (!grouped[key].paperTitle && comment.paperTitle) grouped[key].paperTitle = comment.paperTitle;
    if (!grouped[key].paperDOI && comment.paperDOI) grouped[key].paperDOI = comment.paperDOI; // NEW
    grouped[key].comments.push(comment);
  });
  return grouped;
}

export function groupCommentsBySubfield(comments) {
  const grouped = {};
  comments.forEach(comment => {
    const key = `${comment.componentName} - ${comment.subfield}`;
    if (!grouped[key]) {
      grouped[key] = {
        component: comment.component,
        componentName: comment.componentName,
        subfield: comment.subfield,
        color: comment.componentColor,
        comments: []
      };
    }
    grouped[key].comments.push(comment);
  });
  return grouped;
}

export function groupCommentsByExpertise(comments) {
  const grouped = {
    byTier: {
      expert: { name: 'Expert Evaluators', description: 'Score ≥ 4.0', comments: [], byComponent: {} },
      advanced: { name: 'Advanced Evaluators', description: 'Score 3.0-3.9', comments: [], byComponent: {} },
      intermediate: { name: 'Intermediate Evaluators', description: 'Score 2.0-2.9', comments: [], byComponent: {} },
      basic: { name: 'Basic Evaluators', description: 'Score < 2.0', comments: [], byComponent: {} }
    },
    byRole: {},
    byDomainExpertise: {}
  };
  
  comments.forEach(comment => {
    const expertiseClass = comment.expertiseClass || classifyExpertise(comment.userInfo);
    const tier = expertiseClass.tier || 'intermediate';
    
    if (grouped.byTier[tier]) {
      grouped.byTier[tier].comments.push(comment);
      const componentKey = comment.component;
      if (!grouped.byTier[tier].byComponent[componentKey]) {
        grouped.byTier[tier].byComponent[componentKey] = { name: comment.componentName, color: comment.componentColor, comments: [] };
      }
      grouped.byTier[tier].byComponent[componentKey].comments.push(comment);
    }
    
    const role = expertiseClass.rawRole || comment.role || 'Other';
    if (!grouped.byRole[role]) {
      const roleConfig = EXPERTISE_CONFIG.roles[role] || EXPERTISE_CONFIG.roles['Other'];
      grouped.byRole[role] = { name: role, weight: roleConfig.weight, tier: roleConfig.tier, comments: [] };
    }
    grouped.byRole[role].comments.push(comment);
    
    const domain = expertiseClass.rawDomainExpertise || 'Intermediate';
    if (!grouped.byDomainExpertise[domain]) {
      const domainConfig = EXPERTISE_CONFIG.domainExpertise[domain] || EXPERTISE_CONFIG.domainExpertise['Intermediate'];
      grouped.byDomainExpertise[domain] = { name: domainConfig.label, multiplier: domainConfig.multiplier, comments: [] };
    }
    grouped.byDomainExpertise[domain].comments.push(comment);
  });

  return grouped;
}

export function getExpertiseStatistics(comments) {
  const byExpertise = groupCommentsByExpertise(comments);
  
  const tierStats = {};
  Object.entries(byExpertise.byTier).forEach(([tier, data]) => {
    const uniqueEvaluators = new Set(data.comments.map(c => c.token));
    tierStats[tier] = {
      count: data.comments.length,
      evaluators: uniqueEvaluators.size,
      avgWeight: data.comments.length > 0 
        ? data.comments.reduce((sum, c) => sum + (c.expertiseWeight || 1), 0) / data.comments.length 
        : 0
    };
  });
  
  const roleStats = {};
  Object.entries(byExpertise.byRole).forEach(([role, data]) => {
    const uniqueEvaluators = new Set(data.comments.map(c => c.token));
    roleStats[role] = { count: data.comments.length, evaluators: uniqueEvaluators.size, weight: data.weight, tier: data.tier };
  });
  
  const domainStats = {};
  Object.entries(byExpertise.byDomainExpertise).forEach(([domain, data]) => {
    const uniqueEvaluators = new Set(data.comments.map(c => c.token));
    domainStats[domain] = { count: data.comments.length, evaluators: uniqueEvaluators.size, multiplier: data.multiplier };
  });
  
  return { byTier: tierStats, byRole: roleStats, byDomainExpertise: domainStats };
}

export function getCommentStatistics(comments) {
  const byComponent = groupCommentsByComponent(comments);
  const byPaper = groupCommentsByPaper(comments);
  
  return {
    totalComments: comments.length,
    totalPapers: Object.keys(byPaper).length,
    byComponent: Object.entries(byComponent).map(([key, data]) => ({
      key, name: data.name, color: data.color, count: data.comments.length
    })),
    averageCommentsPerPaper: Object.keys(byPaper).length > 0 
      ? Math.round(comments.length / Object.keys(byPaper).length * 10) / 10 : 0
  };
}

export function getAllComponents() {
  return Object.entries(COMPONENT_PATHS).map(([key, config]) => ({
    key, name: config.name, color: config.color
  }));
}

export function getComponentConfig(componentKey) {
  return COMPONENT_PATHS[componentKey] || null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractCommentsFromEvaluation,
  extractAllComments,
  groupCommentsByComponent,
  groupCommentsByPaper,
  groupCommentsBySubfield,
  groupCommentsByExpertise,
  getExpertiseStatistics,
  classifyExpertise,
  getComponentConfig,
  getAllComponents,
  getCommentStatistics,
  generateInterpretiveReport,
  generateCommentReport,
  autoSelectComments,
  exportReport,
  COMPONENT_PATHS,
  EXPERTISE_CONFIG,
  SELECTION_CRITERIA
};