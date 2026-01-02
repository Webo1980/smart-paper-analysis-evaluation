/**
 * Advanced Feedback Analytics Service v3 - COMPREHENSIVE FIX
 * 
 * MAJOR FIXES:
 * 1. Proper multi-evaluator detection using DOI from evaluation.overall.metadata.doi.referenceValue
 * 2. Research-paper quality interpretations with statistical insights
 * 3. Expert consensus analysis (inter-rater for experts, not just papers)
 * 4. Enhanced interpretation generation for academic publication
 * 5. Venn-diagram data structures for intersection visualization
 */

import { analyzeSentiment, categorizeSentiment } from './sentimentAnalysisService';

// ============================================================================
// EXPERTISE CLASSIFICATION HELPER
// ============================================================================

/**
 * Classify user expertise based on userInfo
 * Returns { tier: 'expert'|'advanced'|'intermediate'|'basic', ... }
 */
function classifyExpertise(userInfo) {
  if (!userInfo) return { tier: 'intermediate' };
  
  const role = (userInfo.role || '').toLowerCase();
  const domain = (userInfo.domainExpertise || '').toLowerCase();
  const experience = (userInfo.evaluationExperience || '').toLowerCase();
  
  // Expert tier: Professors, Senior Researchers, or high domain expertise
  if (role.includes('professor') || role.includes('senior') || 
      role.includes('phd') && experience !== 'none') {
    return { tier: 'expert', role, domain, experience };
  }
  
  // Advanced tier: PhD students, Postdocs, or advanced domain
  if (role.includes('phd') || role.includes('postdoc') || 
      role.includes('researcher') || domain === 'advanced') {
    return { tier: 'advanced', role, domain, experience };
  }
  
  // Basic tier: Undergrad or minimal experience
  if (role.includes('undergrad') || role.includes('bachelor') ||
      (domain === 'beginner' && experience === 'none')) {
    return { tier: 'basic', role, domain, experience };
  }
  
  // Default: Intermediate
  return { tier: 'intermediate', role, domain, experience };
}

export const FLEISS_KAPPA_EXPLANATION = {
  name: "Fleiss' Kappa (κ)",
  description: "Fleiss' Kappa measures agreement among multiple raters when assigning categorical ratings. It accounts for agreement occurring by chance, providing a more robust measure than simple percentage agreement.",
  formula: "κ = (P̄ - P̄ₑ) / (1 - P̄ₑ)",
  formulaDetails: [
    "P̄ = Average observed agreement across all items",
    "P̄ₑ = Expected agreement by chance",
    "P̄ = (1/N) × Σᵢ Pᵢ where Pᵢ = (1/(n(n-1))) × Σⱼ(nᵢⱼ(nᵢⱼ - 1))",
    "P̄ₑ = Σⱼ pⱼ² where pⱼ is the proportion of ratings in category j"
  ],
  interpretation: {
    "< 0": "Poor (less than chance agreement)",
    "0.00 - 0.20": "Slight agreement",
    "0.21 - 0.40": "Fair agreement",
    "0.41 - 0.60": "Moderate agreement",
    "0.61 - 0.80": "Substantial agreement",
    "0.81 - 1.00": "Almost perfect agreement"
  },
  academicContext: "In evaluation studies, κ > 0.60 is generally considered acceptable for reliable inter-rater agreement. Values below 0.40 suggest the need for clearer evaluation criteria or additional rater training.",
  example: "If κ = 0.65, evaluators agree substantially more than would be expected by chance alone."
};

export const INTERSECTION_EXPLANATION = {
  name: "Sentiment Intersection Analysis",
  description: "Intersection analysis identifies where multiple evaluators agree or disagree on sentiment for each component, revealing consensus patterns and points of divergence.",
  metrics: [
    "Agreement: All evaluators share the same dominant sentiment classification",
    "Partial Overlap: Majority agrees while minority differs",
    "Divergence: No clear consensus, suggesting subjective interpretation differences"
  ],
  useCase: "Helps identify which components have consistent evaluation criteria vs. those that may need clearer guidelines or are inherently more subjective.",
  academicImplication: "High agreement on some components with low agreement on others may indicate that certain evaluation dimensions are more objective (e.g., metadata accuracy) while others depend more on evaluator perspective (e.g., innovation assessment)."
};

/**
 * Calculate Fleiss' Kappa for multiple raters
 */
export function calculateFleissKappa(ratingsMatrix) {
  const categories = ['positive', 'neutral', 'negative'];
  const n = ratingsMatrix.length;
  
  if (n === 0) return { 
    kappa: null, 
    interpretation: 'No data available',
    details: { n: 0, raters: 0 }
  };

  const k = ratingsMatrix[0]?.ratings?.length || 0;
  if (k < 2) return { 
    kappa: null, 
    interpretation: 'Need at least 2 raters',
    details: { n, raters: k }
  };

  const counts = ratingsMatrix.map(item => {
    const count = { positive: 0, neutral: 0, negative: 0 };
    item.ratings.forEach(r => {
      if (count[r] !== undefined) count[r]++;
    });
    return count;
  });

  const P_i = counts.map(count => {
    let sum = 0;
    categories.forEach(c => {
      sum += count[c] * (count[c] - 1);
    });
    return sum / (k * (k - 1));
  });

  const P_bar = P_i.reduce((a, b) => a + b, 0) / n;

  const p_j = {};
  categories.forEach(c => {
    let sum = 0;
    counts.forEach(count => {
      sum += count[c];
    });
    p_j[c] = sum / (n * k);
  });

  let P_e = 0;
  categories.forEach(c => {
    P_e += p_j[c] * p_j[c];
  });

  const kappa = P_e === 1 ? 1 : (P_bar - P_e) / (1 - P_e);

  return {
    kappa: Math.round(kappa * 1000) / 1000,
    observedAgreement: Math.round(P_bar * 100),
    expectedAgreement: Math.round(P_e * 100),
    interpretation: interpretKappa(kappa),
    categoryProportions: p_j,
    details: {
      n,
      raters: k,
      P_bar,
      P_e,
      formula: `κ = (${P_bar.toFixed(3)} - ${P_e.toFixed(3)}) / (1 - ${P_e.toFixed(3)}) = ${kappa.toFixed(3)}`
    }
  };
}

function interpretKappa(kappa) {
  if (kappa === null) return 'Unable to calculate';
  if (kappa < 0) return 'Poor (worse than chance)';
  if (kappa < 0.20) return 'Slight agreement';
  if (kappa < 0.40) return 'Fair agreement';
  if (kappa < 0.60) return 'Moderate agreement';
  if (kappa < 0.80) return 'Substantial agreement';
  return 'Almost perfect agreement';
}

// ============================================================================
// FIXED: PROPER MULTI-EVALUATOR DETECTION
// ============================================================================

/**
 * Extract DOI from evaluation object - handles multiple possible locations
 */
/**
 * Extract paper title from evaluation metrics
 * This is the PRIMARY paper identifier in this data structure
 */
export function extractPaperTitle(evaluation) {
  // Primary: from evaluationMetrics.accuracy.metadata['Title Extraction']
  const titleTokens = evaluation?.evaluationMetrics?.accuracy?.metadata?.['Title Extraction']
    ?.similarityData?.tokenMatching?.originalTokens;
  
  if (titleTokens && Array.isArray(titleTokens) && titleTokens.length > 0) {
    return titleTokens.join(' ');
  }
  
  // Fallback paths
  if (evaluation?.overall?.metadata?.title?.referenceValue) {
    return evaluation.overall.metadata.title.referenceValue;
  }
  if (evaluation?.overall?.metadata?.title?.systemValue) {
    return evaluation.overall.metadata.title.systemValue;
  }
  if (evaluation?.metadata?.title) {
    return evaluation.metadata.title;
  }
  
  return null;
}

/**
 * Normalize paper title for consistent matching
 */
function normalizePaperTitle(title) {
  if (!title || typeof title !== 'string') return null;
  
  // Normalize: trim, lowercase, collapse whitespace
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Extract user identifier from evaluation
 */
export function extractUserIdentifier(evaluation) {
  const userInfo = evaluation?.userInfo;
  if (!userInfo) return null;
  
  // Unique identifier: email (most reliable) or full name
  return userInfo.email || 
         `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() ||
         null;
}

// Legacy function - kept for compatibility
export function extractDOI(evaluation) {
  // Try various DOI locations
  if (evaluation?.overall?.metadata?.doi?.referenceValue) {
    return evaluation.overall.metadata.doi.referenceValue;
  }
  if (evaluation?.overall?.metadata?.doi?.systemValue) {
    return evaluation.overall.metadata.doi.systemValue;
  }
  if (evaluation?.metadata?.doi) {
    return evaluation.metadata.doi;
  }
  return null;
}

// Legacy function - kept for compatibility
export function extractTitle(evaluation) {
  return extractPaperTitle(evaluation) || 'Untitled';
}

/**
 * Find papers with multiple evaluators
 * FIXED: Uses paper TITLE as identifier, USER as evaluator
 * ENHANCED: Extracts comments directly from evaluations for proper association
 * 
 * Data structure:
 * - Each evaluation = one user evaluating one paper
 * - Paper identified by title from evaluationMetrics.accuracy.metadata['Title Extraction']
 * - User identified by userInfo.email or full name
 */
export function findMultiEvaluatorPapers(allComments, evaluations) {
  // Build map: normalized paper title -> { title, evaluators[], evaluatorDetails{} }
  const paperGroups = {};
  
  // Step 1: Create paper groups from evaluations (this tells us who evaluated what)
  if (Array.isArray(evaluations)) {
    evaluations.forEach(evaluation => {
      const paperTitle = extractPaperTitle(evaluation);
      const userIdentifier = extractUserIdentifier(evaluation);
      const userInfo = evaluation.userInfo;
      
      if (!paperTitle) {
        console.warn('Evaluation without paper title:', evaluation.token);
        return;
      }
      
      const normalizedTitle = normalizePaperTitle(paperTitle);
      
      if (!paperGroups[normalizedTitle]) {
        paperGroups[normalizedTitle] = {
          paperId: normalizedTitle,
          title: paperTitle,
          evaluators: new Set(),
          evaluatorDetails: {},
          comments: []
        };
      }
      
      if (userIdentifier) {
        paperGroups[normalizedTitle].evaluators.add(userIdentifier);
        
        if (!paperGroups[normalizedTitle].evaluatorDetails[userIdentifier]) {
          paperGroups[normalizedTitle].evaluatorDetails[userIdentifier] = {
            userIdentifier,
            userInfo,
            expertiseClass: classifyExpertise(userInfo)?.tier || 'intermediate',
            comments: []
          };
        }
      }
    });
  }
  
  // Step 2: Add comments to papers using the comment's paperTitle
  // allComments from extractAllComments already has paperTitle on each comment
  if (allComments && allComments.length > 0) {
    allComments.forEach(comment => {
      const commentPaperTitle = comment.paperTitle;
      if (!commentPaperTitle) return;
      
      const normalizedCommentTitle = normalizePaperTitle(commentPaperTitle);
      const userIdentifier = comment.userInfo?.email || 
        `${comment.userInfo?.firstName || ''} ${comment.userInfo?.lastName || ''}`.trim();
      
      // Find matching paper group
      const paperGroup = paperGroups[normalizedCommentTitle];
      
      if (paperGroup) {
        // Add to paper's total comments
        paperGroup.comments.push(comment);
        
        // Add to specific evaluator's comments
        if (userIdentifier && paperGroup.evaluatorDetails[userIdentifier]) {
          paperGroup.evaluatorDetails[userIdentifier].comments.push(comment);
        }
      }
    });
  }

  // Step 3: Filter to only papers with multiple evaluators
  const multiEvaluatorPapers = {};
  Object.entries(paperGroups).forEach(([key, data]) => {
    const evaluatorCount = data.evaluators.size;
    if (evaluatorCount > 1) {
      multiEvaluatorPapers[key] = {
        ...data,
        evaluatorCount,
        evaluators: Array.from(data.evaluators)
      };
    }
  });

  return {
    multiEvaluatorPapers,
    totalPapers: Object.keys(paperGroups).length,
    papersWithMultipleEvaluators: Object.keys(multiEvaluatorPapers).length,
    papersWithSingleEvaluator: Object.keys(paperGroups).length - Object.keys(multiEvaluatorPapers).length,
    allPaperGroups: paperGroups
  };
}

// ============================================================================
// ENHANCED INTERSECTION ANALYSIS
// ============================================================================

export function calculatePaperIntersection(paperData) {
  const { evaluatorDetails, evaluatorCount } = paperData;
  const evaluatorIds = Object.keys(evaluatorDetails);
  
  if (evaluatorCount < 2) {
    return { hasIntersection: false, message: 'Need at least 2 evaluators' };
  }

  const componentAnalysis = {};
  const allComponents = new Set();
  
  evaluatorIds.forEach(evalId => {
    evaluatorDetails[evalId].comments.forEach(c => {
      allComponents.add(c.component);
    });
  });

  allComponents.forEach(comp => {
    const evaluatorSentiments = {};
    
    evaluatorIds.forEach(evalId => {
      const compComments = evaluatorDetails[evalId].comments.filter(c => c.component === comp);
      
      if (compComments.length > 0) {
        const sentiments = { positive: 0, neutral: 0, negative: 0 };
        compComments.forEach(c => {
          const s = analyzeSentiment(c.text);
          const cat = categorizeSentiment(s.sentiment);
          sentiments[cat]++;
        });
        
        const total = sentiments.positive + sentiments.neutral + sentiments.negative;
        const dominant = Object.entries(sentiments)
          .sort((a, b) => b[1] - a[1])[0];
        
        evaluatorSentiments[evalId] = {
          sentiments,
          total,
          dominant: dominant[0],
          dominantRatio: total > 0 ? dominant[1] / total : 0,
          comments: compComments
        };
      }
    });

    const evalCount = Object.keys(evaluatorSentiments).length;
    if (evalCount >= 2) {
      const dominants = Object.values(evaluatorSentiments).map(e => e.dominant);
      const allAgree = dominants.every(d => d === dominants[0]);
      
      const sentimentSets = {
        positive: new Set(),
        neutral: new Set(),
        negative: new Set()
      };
      
      Object.entries(evaluatorSentiments).forEach(([evalId, data]) => {
        if (data.sentiments.positive > 0) sentimentSets.positive.add(evalId);
        if (data.sentiments.neutral > 0) sentimentSets.neutral.add(evalId);
        if (data.sentiments.negative > 0) sentimentSets.negative.add(evalId);
      });

      componentAnalysis[comp] = {
        name: evaluatorDetails[evaluatorIds[0]].comments.find(c => c.component === comp)?.componentName || comp,
        color: evaluatorDetails[evaluatorIds[0]].comments.find(c => c.component === comp)?.componentColor || '#gray',
        evaluatorCount: evalCount,
        agreement: allAgree,
        dominantIfAgree: allAgree ? dominants[0] : null,
        evaluatorSentiments,
        intersection: {
          allPositive: sentimentSets.positive.size === evalCount,
          allNeutral: sentimentSets.neutral.size === evalCount,
          allNegative: sentimentSets.negative.size === evalCount,
          somePositive: sentimentSets.positive.size > 0 && sentimentSets.positive.size < evalCount,
          someNegative: sentimentSets.negative.size > 0 && sentimentSets.negative.size < evalCount,
          positiveCount: sentimentSets.positive.size,
          negativeCount: sentimentSets.negative.size,
          neutralCount: sentimentSets.neutral.size
        }
      };
    }
  });

  const components = Object.values(componentAnalysis);
  const agreementCount = components.filter(c => c.agreement).length;
  const totalComponents = components.length;

  return {
    hasIntersection: true,
    evaluatorCount,
    components: componentAnalysis,
    summary: {
      totalComponents,
      agreementCount,
      disagreementCount: totalComponents - agreementCount,
      agreementRate: totalComponents > 0 ? (agreementCount / totalComponents * 100).toFixed(0) : 0
    },
    interpretation: generateIntersectionInterpretation(componentAnalysis, evaluatorCount)
  };
}

function generateIntersectionInterpretation(components, evaluatorCount) {
  const compArray = Object.values(components);
  const agreed = compArray.filter(c => c.agreement);
  const disagreed = compArray.filter(c => !c.agreement);
  
  let text = `${evaluatorCount} evaluators assessed this paper. `;
  
  if (agreed.length === compArray.length) {
    text += `Complete agreement across all ${compArray.length} components. `;
    const dominants = agreed.map(c => c.dominantIfAgree);
    const positiveCount = dominants.filter(d => d === 'positive').length;
    if (positiveCount > agreed.length / 2) {
      text += 'Evaluators consistently viewed the analysis positively.';
    } else {
      text += 'Evaluators share similar critical perspectives.';
    }
  } else if (disagreed.length === compArray.length) {
    text += `Evaluators disagree on all ${compArray.length} components, suggesting subjective interpretation differences.`;
  } else {
    text += `Agreement on ${agreed.length}/${compArray.length} components. `;
    if (disagreed.length > 0) {
      text += `Divergent views on: ${disagreed.map(c => c.name).join(', ')}.`;
    }
  }
  
  return text;
}

// ============================================================================
// RESEARCH-PAPER QUALITY OVERALL INTERPRETATION
// ============================================================================

/**
 * Generate publication-quality overall sentiment interpretation
 */
export function generateOverallInterpretation(summary, componentSentiment) {
  const { analyzed, simpleCounts, averageScore } = summary;
  const posRatio = simpleCounts.positive / analyzed;
  const negRatio = simpleCounts.negative / analyzed;
  const neutralRatio = simpleCounts.neutral / analyzed;
  
  const findings = {
    headline: '',
    details: '',
    implications: '',
    recommendations: []
  };
  
  // Determine reception category
  if (posRatio >= 0.6 && negRatio <= 0.15) {
    findings.headline = 'Strong Positive Reception';
    findings.details = `User feedback demonstrates **strong positive sentiment** with ${(posRatio * 100).toFixed(0)}% favorable responses (n=${simpleCounts.positive}). ` +
      `Only ${(negRatio * 100).toFixed(0)}% of feedback (n=${simpleCounts.negative}) expressed concerns.`;
    findings.implications = 'This sentiment distribution suggests the system successfully meets user expectations across most evaluation dimensions.';
    findings.recommendations.push('Focus on maintaining current quality while addressing specific concerns in critical feedback.');
  } else if (negRatio >= 0.35) {
    findings.headline = 'Critical Feedback Dominant';
    findings.details = `User feedback reveals **significant critical sentiment** with ${(negRatio * 100).toFixed(0)}% negative responses (n=${simpleCounts.negative}). ` +
      `Positive feedback accounts for ${(posRatio * 100).toFixed(0)}% (n=${simpleCounts.positive}).`;
    findings.implications = 'The high proportion of critical feedback indicates substantial areas for improvement.';
    findings.recommendations.push('Prioritize analysis of critical feedback themes to identify systematic issues.');
    findings.recommendations.push('Consider user study to understand root causes of dissatisfaction.');
  } else if (neutralRatio >= 0.45) {
    findings.headline = 'Predominantly Neutral Reception';
    findings.details = `Feedback is **predominantly neutral** with ${(neutralRatio * 100).toFixed(0)}% (n=${simpleCounts.neutral}) neither strongly positive nor negative. ` +
      `Positive: ${(posRatio * 100).toFixed(0)}%, Critical: ${(negRatio * 100).toFixed(0)}%.`;
    findings.implications = 'High neutral sentiment may indicate: (1) adequate but unremarkable performance, (2) unclear evaluation criteria, or (3) evaluator uncertainty.';
    findings.recommendations.push('Review evaluation prompts for clarity.');
    findings.recommendations.push('Consider adding Likert scales alongside open-ended feedback.');
  } else {
    findings.headline = 'Mixed Reception';
    findings.details = `User feedback shows a **mixed sentiment distribution**: ${(posRatio * 100).toFixed(0)}% positive (n=${simpleCounts.positive}), ` +
      `${(neutralRatio * 100).toFixed(0)}% neutral (n=${simpleCounts.neutral}), and ${(negRatio * 100).toFixed(0)}% critical (n=${simpleCounts.negative}).`;
    findings.implications = 'Mixed feedback suggests the system performs well in some areas while requiring improvement in others. Component-level analysis is essential.';
    findings.recommendations.push('Conduct component-level analysis to identify specific strengths and weaknesses.');
  }
  
  // Add component insights
  if (componentSentiment) {
    const sortedComponents = Object.entries(componentSentiment)
      .filter(([_, d]) => d.comments.length > 0)
      .sort((a, b) => b[1].analysis.summary.averageScore - a[1].analysis.summary.averageScore);
    
    if (sortedComponents.length >= 2) {
      const best = sortedComponents[0];
      const worst = sortedComponents[sortedComponents.length - 1];
      
      findings.componentInsight = `**${best[1].name}** achieved highest satisfaction (${(best[1].analysis.summary.averageScore * 100).toFixed(0)}% sentiment score), ` +
        `while **${worst[1].name}** shows most room for improvement (${(worst[1].analysis.summary.averageScore * 100).toFixed(0)}%).`;
    }
  }
  
  return findings;
}

// ============================================================================
// COMPONENT INTERPRETATION - RESEARCH QUALITY
// ============================================================================

export function generateComponentInterpretation(componentData, componentKey) {
  const { comments, analysis } = componentData;
  const s = analysis.summary;
  
  const total = s.analyzed;
  if (total === 0) return 'No feedback available for this component.';
  
  const positiveRatio = s.simpleCounts.positive / total;
  const neutralRatio = s.simpleCounts.neutral / total;
  const negativeRatio = s.simpleCounts.negative / total;
  
  const contexts = {
    metadata: { aspect: 'bibliographic information extraction', domain: 'metadata processing' },
    research_field: { aspect: 'research field classification', domain: 'taxonomic alignment' },
    research_problem: { aspect: 'problem identification', domain: 'semantic extraction' },
    template: { aspect: 'template matching', domain: 'structural mapping' },
    system_performance: { aspect: 'system responsiveness', domain: 'technical performance' },
    innovation: { aspect: 'innovative features', domain: 'novelty assessment' },
    comparative_analysis: { aspect: 'comparative analysis', domain: 'benchmarking' },
    rag_highlight: { aspect: 'RAG highlighting', domain: 'evidence localization' }
  };
  
  const ctx = contexts[componentKey] || { aspect: 'this component', domain: 'general evaluation' };
  
  let interpretation = '';
  
  if (positiveRatio >= 0.6 && negativeRatio <= 0.2) {
    interpretation = `Strong positive reception (${(positiveRatio * 100).toFixed(0)}% favorable, n=${s.simpleCounts.positive}). ` +
      `Users express high satisfaction with ${ctx.aspect}. Only ${s.simpleCounts.negative} critical responses identified.`;
  } else if (negativeRatio >= 0.4) {
    interpretation = `Critical feedback predominates (${(negativeRatio * 100).toFixed(0)}%, n=${s.simpleCounts.negative}). ` +
      `This component shows the most significant opportunity for improvement in ${ctx.domain}.`;
  } else if (positiveRatio >= 0.4 && negativeRatio >= 0.2) {
    interpretation = `Mixed sentiment: ${(positiveRatio * 100).toFixed(0)}% positive vs ${(negativeRatio * 100).toFixed(0)}% critical. ` +
      `Users appreciate some aspects of ${ctx.aspect} while identifying specific concerns.`;
  } else if (neutralRatio >= 0.5) {
    interpretation = `Predominantly neutral responses (${(neutralRatio * 100).toFixed(0)}%). ` +
      `This may indicate adequate but unremarkable performance, or uncertainty about ${ctx.domain} evaluation criteria.`;
  } else {
    interpretation = `Sentiment distribution: ${(positiveRatio * 100).toFixed(0)}% positive, ` +
      `${(neutralRatio * 100).toFixed(0)}% neutral, ${(negativeRatio * 100).toFixed(0)}% critical.`;
  }
  
  return interpretation;
}

// ============================================================================
// EXPERT CONSENSUS ANALYSIS (NEW)
// ============================================================================

/**
 * Analyze inter-rater agreement among experts specifically
 * This provides insights like "3 experts agree that innovation is lacking"
 */
export function analyzeExpertConsensus(allComments, byExpertise) {
  const expertTiers = ['expert', 'advanced']; // Include advanced as "near-expert"
  
  const expertComments = allComments.filter(c => 
    expertTiers.includes(c.expertiseClass?.tier)
  );
  
  if (expertComments.length < 3) {
    return {
      hasConsensus: false,
      message: 'Insufficient expert feedback for consensus analysis',
      expertCount: expertComments.length
    };
  }
  
  // Group expert comments by component and sentiment
  const componentConsensus = {};
  
  expertComments.forEach(comment => {
    const comp = comment.component;
    if (!componentConsensus[comp]) {
      componentConsensus[comp] = {
        name: comment.componentName,
        color: comment.componentColor,
        experts: new Set(),
        sentiments: { positive: 0, neutral: 0, negative: 0 },
        comments: [],
        byExpert: {}
      };
    }
    
    const expertId = `${comment.userInfo?.firstName || ''}_${comment.userInfo?.lastName || comment.token}`;
    componentConsensus[comp].experts.add(expertId);
    
    const sentiment = analyzeSentiment(comment.text);
    const category = categorizeSentiment(sentiment.sentiment);
    componentConsensus[comp].sentiments[category]++;
    componentConsensus[comp].comments.push({ ...comment, sentimentCategory: category });
    
    if (!componentConsensus[comp].byExpert[expertId]) {
      componentConsensus[comp].byExpert[expertId] = { positive: 0, neutral: 0, negative: 0, tier: comment.expertiseClass?.tier };
    }
    componentConsensus[comp].byExpert[expertId][category]++;
  });
  
  // Analyze consensus per component
  const findings = [];
  
  Object.entries(componentConsensus).forEach(([compKey, data]) => {
    const expertCount = data.experts.size;
    if (expertCount < 2) return;
    
    const total = data.sentiments.positive + data.sentiments.neutral + data.sentiments.negative;
    const posRatio = data.sentiments.positive / total;
    const negRatio = data.sentiments.negative / total;
    
    // Check for expert consensus
    const expertDominants = Object.entries(data.byExpert).map(([expId, sentiments]) => {
      const expTotal = sentiments.positive + sentiments.neutral + sentiments.negative;
      if (sentiments.positive / expTotal > 0.5) return 'positive';
      if (sentiments.negative / expTotal > 0.5) return 'negative';
      return 'neutral';
    });
    
    const allAgree = expertDominants.every(d => d === expertDominants[0]);
    const majorityPositive = expertDominants.filter(d => d === 'positive').length > expertCount / 2;
    const majorityNegative = expertDominants.filter(d => d === 'negative').length > expertCount / 2;
    
    if (allAgree || majorityPositive || majorityNegative) {
      findings.push({
        component: data.name,
        componentKey: compKey,
        expertCount,
        consensusType: allAgree ? 'unanimous' : 'majority',
        sentiment: majorityPositive ? 'positive' : majorityNegative ? 'negative' : 'neutral',
        strength: allAgree ? 'strong' : 'moderate',
        message: allAgree 
          ? `All ${expertCount} experts ${majorityPositive ? 'praise' : 'critique'} ${data.name.toLowerCase()}`
          : `${majorityPositive || majorityNegative ? 'Majority' : 'Most'} of ${expertCount} experts ${majorityPositive ? 'favor' : 'critique'} ${data.name.toLowerCase()}`
      });
    }
  });
  
  // Generate overall interpretation
  const positiveConsensus = findings.filter(f => f.sentiment === 'positive');
  const negativeConsensus = findings.filter(f => f.sentiment === 'negative');
  
  let interpretation = '';
  if (positiveConsensus.length > 0 && negativeConsensus.length > 0) {
    interpretation = `Expert consensus reveals clear patterns: ${positiveConsensus.map(f => f.component).join(', ')} ` +
      `receive consistent praise, while ${negativeConsensus.map(f => f.component).join(', ')} are areas of expert concern.`;
  } else if (positiveConsensus.length > 0) {
    interpretation = `Expert feedback shows consensus on strengths: ${positiveConsensus.map(f => f.component).join(', ')}.`;
  } else if (negativeConsensus.length > 0) {
    interpretation = `Expert feedback highlights areas needing attention: ${negativeConsensus.map(f => f.component).join(', ')}.`;
  } else {
    interpretation = 'Expert opinions vary across components, indicating subjective evaluation dimensions.';
  }
  
  return {
    hasConsensus: findings.length > 0,
    findings,
    expertCount: new Set(expertComments.map(c => c.token)).size,
    totalExpertComments: expertComments.length,
    componentConsensus,
    interpretation,
    positiveConsensus,
    negativeConsensus
  };
}

// ============================================================================
// EXPERTISE ANALYSIS WITH VENN DATA
// ============================================================================

export function analyzeExpertisePreferences(byExpertise, sentimentAnalyzer) {
  const tiers = ['expert', 'advanced', 'intermediate', 'basic'];
  const analysis = {
    preferences: {},
    interpretation: '',
    interRater: null,
    vennData: null
  };

  tiers.forEach(tier => {
    const tierData = byExpertise.byTier[tier];
    if (!tierData || tierData.comments.length === 0) return;

    const byComponent = {};
    tierData.comments.forEach(comment => {
      if (!byComponent[comment.component]) {
        byComponent[comment.component] = {
          name: comment.componentName,
          color: comment.componentColor,
          comments: [],
          sentiments: { positive: 0, neutral: 0, negative: 0 }
        };
      }
      
      const sentiment = sentimentAnalyzer(comment.text);
      const category = categorizeSentiment(sentiment.sentiment);
      
      byComponent[comment.component].comments.push(comment);
      byComponent[comment.component].sentiments[category]++;
    });

    const componentScores = {};
    Object.entries(byComponent).forEach(([compKey, compData]) => {
      const total = compData.comments.length;
      const positiveRatio = total > 0 ? compData.sentiments.positive / total : 0;
      const negativeRatio = total > 0 ? compData.sentiments.negative / total : 0;
      
      componentScores[compKey] = {
        name: compData.name,
        color: compData.color,
        total,
        positiveRatio,
        negativeRatio,
        positivePercent: (positiveRatio * 100).toFixed(0),
        negativePercent: (negativeRatio * 100).toFixed(0),
        netScore: positiveRatio - negativeRatio,
        sentiments: compData.sentiments
      };
    });

    const sorted = Object.entries(componentScores)
      .sort((a, b) => b[1].netScore - a[1].netScore);
    
    analysis.preferences[tier] = {
      totalComments: tierData.comments.length,
      byComponent: componentScores,
      favorite: sorted[0] ? { key: sorted[0][0], ...sorted[0][1] } : null,
      concern: sorted.length > 1 ? { key: sorted[sorted.length - 1][0], ...sorted[sorted.length - 1][1] } : null
    };
  });

  analysis.interpretation = generateExpertiseInterpretation(analysis.preferences);
  analysis.interRater = calculateExpertiseInterRater(analysis.preferences);
  analysis.vennData = generateExpertiseVennData(analysis.preferences);

  return analysis;
}

/**
 * Generate Venn diagram data for expertise overlap visualization
 */
function generateExpertiseVennData(preferences) {
  const tiers = Object.keys(preferences);
  if (tiers.length < 2) return null;
  
  // Get all components
  const allComponents = new Set();
  tiers.forEach(tier => {
    Object.keys(preferences[tier].byComponent).forEach(c => allComponents.add(c));
  });
  
  // Calculate overlap/intersection for each component
  const componentOverlap = {};
  
  allComponents.forEach(comp => {
    const tierSentiments = {};
    
    tiers.forEach(tier => {
      const data = preferences[tier]?.byComponent[comp];
      if (data && data.total > 0) {
        if (data.positiveRatio > 0.5) tierSentiments[tier] = 'positive';
        else if (data.negativeRatio > 0.5) tierSentiments[tier] = 'negative';
        else tierSentiments[tier] = 'neutral';
      }
    });
    
    componentOverlap[comp] = {
      name: preferences[tiers.find(t => preferences[t]?.byComponent[comp])]?.byComponent[comp]?.name || comp,
      tierSentiments,
      tiersWithData: Object.keys(tierSentiments).length,
      allAgree: Object.values(tierSentiments).every(s => s === Object.values(tierSentiments)[0]),
      allPositive: Object.values(tierSentiments).every(s => s === 'positive'),
      allNegative: Object.values(tierSentiments).every(s => s === 'negative')
    };
  });
  
  // Group components by agreement type
  const agreed = Object.entries(componentOverlap).filter(([_, d]) => d.allAgree && d.tiersWithData >= 2);
  const divergent = Object.entries(componentOverlap).filter(([_, d]) => !d.allAgree && d.tiersWithData >= 2);
  
  return {
    componentOverlap,
    agreed: agreed.map(([k, v]) => ({ key: k, ...v })),
    divergent: divergent.map(([k, v]) => ({ key: k, ...v })),
    summary: {
      totalComponents: allComponents.size,
      agreedCount: agreed.length,
      divergentCount: divergent.length
    }
  };
}

function generateExpertiseInterpretation(preferences) {
  const parts = [];
  
  if (preferences.expert?.favorite) {
    const fav = preferences.expert.favorite;
    parts.push(`**Domain experts** favor **${fav.name}** (${fav.positivePercent}% positive)`);
    
    if (preferences.expert.concern && preferences.expert.concern.negativeRatio > 0.2) {
      const con = preferences.expert.concern;
      parts.push(`but express concern about **${con.name}** (${con.negativePercent}% negative)`);
    }
  }
  
  if (preferences.advanced?.favorite && preferences.expert?.favorite) {
    if (preferences.advanced.favorite.key !== preferences.expert.favorite.key) {
      parts.push(`**Advanced evaluators** prefer **${preferences.advanced.favorite.name}** (${preferences.advanced.favorite.positivePercent}% positive)`);
    }
  }
  
  if (preferences.basic?.favorite && preferences.expert?.favorite) {
    if (preferences.basic.favorite.key !== preferences.expert.favorite.key) {
      parts.push(`**Basic evaluators** favor **${preferences.basic.favorite.name}** (${preferences.basic.favorite.positivePercent}% positive), differing from experts`);
    } else {
      parts.push(`**Basic evaluators** agree with experts, favoring **${preferences.basic.favorite.name}**`);
    }
  }
  
  return parts.length > 0 ? parts.join('. ') + '.' : 'Insufficient data for expertise comparison.';
}

function calculateExpertiseInterRater(preferences) {
  const tiers = Object.keys(preferences);
  if (tiers.length < 2) return null;
  
  const allComponents = new Set();
  tiers.forEach(tier => {
    Object.keys(preferences[tier].byComponent).forEach(c => allComponents.add(c));
  });
  
  const componentAgreement = {};
  allComponents.forEach(comp => {
    const dominants = tiers.map(tier => {
      const data = preferences[tier]?.byComponent[comp];
      if (!data || data.total === 0) return null;
      
      if (data.positiveRatio > data.negativeRatio && data.positiveRatio > 0.3) return 'positive';
      if (data.negativeRatio > data.positiveRatio && data.negativeRatio > 0.3) return 'negative';
      return 'neutral';
    }).filter(d => d !== null);
    
    if (dominants.length >= 2) {
      const allSame = dominants.every(d => d === dominants[0]);
      componentAgreement[comp] = {
        agreement: allSame,
        dominants: Object.fromEntries(tiers.map((t, i) => [t, dominants[i] || 'N/A']))
      };
    }
  });
  
  const agreed = Object.values(componentAgreement).filter(a => a.agreement).length;
  const total = Object.keys(componentAgreement).length;
  
  return {
    componentAgreement,
    agreementRate: total > 0 ? (agreed / total * 100).toFixed(0) : 0,
    agreed,
    total
  };
}

// ============================================================================
// N-GRAM ANALYSIS WITH CHARTS DATA
// ============================================================================

export function analyzeNgramPatterns(comments, sentimentAnalyzer) {
  const getWordCount = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const enrichedComments = comments.map(comment => {
    const sentiment = sentimentAnalyzer(comment.text);
    return {
      ...comment,
      wordCount: getWordCount(comment.text),
      sentimentCategory: categorizeSentiment(sentiment.sentiment),
      sentimentScore: sentiment.normalizedScore
    };
  });

  const lengthCategories = {
    brief: { label: 'Brief (1-10 words)', min: 1, max: 10 },
    moderate: { label: 'Moderate (11-30 words)', min: 11, max: 30 },
    detailed: { label: 'Detailed (31-60 words)', min: 31, max: 60 },
    extensive: { label: 'Extensive (60+ words)', min: 61, max: Infinity }
  };

  const categories = {};
  Object.entries(lengthCategories).forEach(([key, config]) => {
    const catComments = enrichedComments.filter(
      c => c.wordCount >= config.min && c.wordCount <= config.max
    );
    
    if (catComments.length === 0) {
      categories[key] = { label: config.label, total: 0, sentiments: { positive: 0, neutral: 0, negative: 0 } };
      return;
    }
    
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    const byComponent = {};
    const byExpertise = {};
    let scoreSum = 0;
    
    catComments.forEach(c => {
      sentiments[c.sentimentCategory]++;
      scoreSum += c.sentimentScore;
      
      if (!byComponent[c.component]) {
        byComponent[c.component] = { name: c.componentName, positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      byComponent[c.component][c.sentimentCategory]++;
      byComponent[c.component].total++;
      
      const tier = c.expertiseClass?.tier || 'unknown';
      if (!byExpertise[tier]) {
        byExpertise[tier] = { positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      byExpertise[tier][c.sentimentCategory]++;
      byExpertise[tier].total++;
    });
    
    const total = catComments.length;
    categories[key] = {
      label: config.label,
      total,
      sentiments,
      positiveRatio: sentiments.positive / total,
      negativeRatio: sentiments.negative / total,
      neutralRatio: sentiments.neutral / total,
      avgScore: scoreSum / total,
      byComponent,
      byExpertise,
      comments: catComments
    };
  });

  // Generate insights with statistical context
  const insights = [];
  const catArray = Object.entries(categories).filter(([_, c]) => c.total >= 3);
  
  let mostPositive = null, mostNegative = null;
  catArray.forEach(([key, data]) => {
    if (!mostPositive || data.positiveRatio > mostPositive.ratio) {
      mostPositive = { key, label: data.label, ratio: data.positiveRatio, total: data.total };
    }
    if (!mostNegative || data.negativeRatio > mostNegative.ratio) {
      mostNegative = { key, label: data.label, ratio: data.negativeRatio, total: data.total };
    }
  });
  
  if (mostPositive) {
    insights.push(`**${mostPositive.label}** comments show highest positive sentiment (${(mostPositive.ratio * 100).toFixed(0)}% of n=${mostPositive.total}).`);
  }
  if (mostNegative && mostNegative.key !== mostPositive?.key) {
    insights.push(`**${mostNegative.label}** comments contain most critical feedback (${(mostNegative.ratio * 100).toFixed(0)}%).`);
  }
  
  if (categories.brief?.total >= 3 && categories.detailed?.total >= 3) {
    const briefPos = categories.brief.positiveRatio;
    const detailedPos = categories.detailed.positiveRatio;
    
    if (detailedPos > briefPos + 0.15) {
      insights.push('Detailed comments tend to be more positive—users who elaborate are more satisfied.');
    } else if (briefPos > detailedPos + 0.15) {
      insights.push('Brief comments are more positive; detailed feedback often contains constructive criticism.');
    } else {
      insights.push('Sentiment is consistent across comment lengths.');
    }
  }

  // Chart data for visualization
  const chartData = Object.entries(categories)
    .filter(([_, d]) => d.total > 0)
    .map(([key, data]) => ({
      category: data.label.split(' ')[0],
      fullLabel: data.label,
      key,
      positive: data.sentiments.positive,
      neutral: data.sentiments.neutral,
      negative: data.sentiments.negative,
      total: data.total,
      positivePercent: (data.positiveRatio * 100).toFixed(0),
      negativePercent: (data.negativeRatio * 100).toFixed(0),
      avgScore: (data.avgScore * 100).toFixed(0)
    }));

  return {
    categories,
    enrichedComments,
    insights,
    mostPositiveLength: mostPositive,
    mostNegativeLength: mostNegative,
    chartData // For bar chart visualization
  };
}

export function filterNgramData(ngramData, filters) {
  const { component, expertise, lengthCategory } = filters;
  
  let filtered = [...ngramData.enrichedComments];
  
  if (component && component !== 'all') {
    filtered = filtered.filter(c => c.component === component);
  }
  
  if (expertise && expertise !== 'all') {
    filtered = filtered.filter(c => c.expertiseClass?.tier === expertise);
  }
  
  if (lengthCategory && lengthCategory !== 'all') {
    const ranges = {
      brief: [1, 10],
      moderate: [11, 30],
      detailed: [31, 60],
      extensive: [61, Infinity]
    };
    const [min, max] = ranges[lengthCategory] || [0, Infinity];
    filtered = filtered.filter(c => c.wordCount >= min && c.wordCount <= max);
  }
  
  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  let scoreSum = 0;
  
  filtered.forEach(c => {
    sentiments[c.sentimentCategory]++;
    scoreSum += c.sentimentScore;
  });
  
  const total = filtered.length;
  
  return {
    comments: filtered,
    total,
    sentiments,
    positiveRatio: total > 0 ? sentiments.positive / total : 0,
    negativeRatio: total > 0 ? sentiments.negative / total : 0,
    avgScore: total > 0 ? scoreSum / total : 0
  };
}

// ============================================================================
// PAPER STATISTICS
// ============================================================================

export function getPaperStatistics(allComments, evaluations) {
  const paperInfo = findMultiEvaluatorPapers(allComments, evaluations);
  
  const evaluationsPerPaper = {};
  Object.entries(paperInfo.allPaperGroups).forEach(([paperId, data]) => {
    // Use evaluators.size (Set) for papers from findMultiEvaluatorPapers
    evaluationsPerPaper[paperId] = data.evaluators?.size || data.evaluatorTokens?.size || 1;
  });
  
  const evalCounts = Object.values(evaluationsPerPaper);
  const avgEvaluations = evalCounts.length > 0 
    ? (evalCounts.reduce((a, b) => a + b, 0) / evalCounts.length).toFixed(1) 
    : 0;
  
  return {
    totalPapersInDataset: Object.keys(paperInfo.allPaperGroups).length,
    papersEvaluated: evalCounts.filter(c => c >= 1).length,
    papersWithMultipleEvaluators: paperInfo.papersWithMultipleEvaluators,
    papersWithSingleEvaluator: paperInfo.papersWithSingleEvaluator,
    averageEvaluationsPerPaper: avgEvaluations,
    maxEvaluations: Math.max(...evalCounts, 0),
    minEvaluations: Math.min(...evalCounts, 0),
    totalEvaluationSessions: evalCounts.reduce((a, b) => a + b, 0)
  };
}

// ============================================================================
// COMPONENT INTER-RATER ANALYSIS
// ============================================================================

export function calculateComponentInterRater(componentSentiment, byPaper) {
  const componentAnalysis = {};
  
  Object.entries(componentSentiment).forEach(([compKey, compData]) => {
    const paperGroups = {};
    compData.comments.forEach(comment => {
      const paperId = comment.paperDOI || comment.paperId || comment.paperTitle || 'unknown';
      if (!paperGroups[paperId]) {
        paperGroups[paperId] = [];
      }
      paperGroups[paperId].push(comment);
    });
    
    const multiCommentPapers = Object.entries(paperGroups)
      .filter(([_, comments]) => {
        const tokens = new Set(comments.map(c => c.token));
        return tokens.size > 1;
      });
    
    if (multiCommentPapers.length === 0) {
      componentAnalysis[compKey] = {
        name: compData.name,
        hasInterRater: false,
        message: 'No multi-evaluator data'
      };
      return;
    }
    
    let agreed = 0;
    let total = 0;
    const paperDetails = [];
    
    multiCommentPapers.forEach(([paperId, comments]) => {
      const byEvaluator = {};
      comments.forEach(c => {
        if (!byEvaluator[c.token]) byEvaluator[c.token] = [];
        const sentiment = analyzeSentiment(c.text);
        byEvaluator[c.token].push(categorizeSentiment(sentiment.sentiment));
      });
      
      const dominants = Object.values(byEvaluator).map(sentiments => {
        const counts = { positive: 0, neutral: 0, negative: 0 };
        sentiments.forEach(s => counts[s]++);
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      });
      
      const allAgree = dominants.every(d => d === dominants[0]);
      if (allAgree) agreed++;
      total++;
      
      paperDetails.push({
        paperId,
        evaluatorCount: Object.keys(byEvaluator).length,
        agreement: allAgree,
        dominants
      });
    });
    
    componentAnalysis[compKey] = {
      name: compData.name,
      color: compData.color,
      hasInterRater: true,
      papersAnalyzed: total,
      agreementCount: agreed,
      agreementRate: total > 0 ? (agreed / total * 100).toFixed(0) : 0,
      paperDetails
    };
  });
  
  return componentAnalysis;
}

// ============================================================================
// THEME ANALYSIS WITH FREQUENCY DATA
// ============================================================================

export function analyzeThemesWithFrequency(themes, allComments) {
  const themeAnalysis = {
    sorted: themes.sorted,
    frequency: {},
    sentimentByTheme: {},
    chartData: []
  };
  
  themes.sorted.forEach(theme => {
    const themeComments = themes.comments[theme.theme] || [];
    
    // Sentiment breakdown
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    const byComponent = {};
    
    themeComments.forEach(c => {
      const s = analyzeSentiment(c.text);
      const cat = categorizeSentiment(s.sentiment);
      sentiments[cat]++;
      
      if (!byComponent[c.component]) {
        byComponent[c.component] = { name: c.componentName, count: 0, color: c.componentColor };
      }
      byComponent[c.component].count++;
    });
    
    themeAnalysis.frequency[theme.theme] = {
      count: theme.count,
      percentage: theme.percentage,
      sentiments,
      components: Object.entries(byComponent)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([key, data]) => ({ key, ...data }))
    };
    
    // Chart data
    themeAnalysis.chartData.push({
      theme: theme.theme,
      count: theme.count,
      positive: sentiments.positive,
      neutral: sentiments.neutral,
      negative: sentiments.negative,
      positivePercent: themeComments.length > 0 ? (sentiments.positive / themeComments.length * 100).toFixed(0) : 0
    });
  });
  
  return themeAnalysis;
}

// ============================================================================
// RESEARCH FINDINGS GENERATOR
// ============================================================================

/**
 * Generate research-paper quality key findings
 */
export function generateResearchFindings(analysisResults) {
  const findings = [];
  
  const { sentimentResults, componentSentiment, paperStats, fleissKappa, expertisePreferences } = analysisResults;
  const summary = sentimentResults.summary;
  
  // Finding 1: Overall Reception
  const posRatio = summary.simpleCounts.positive / summary.analyzed;
  const negRatio = summary.simpleCounts.negative / summary.analyzed;
  
  findings.push({
    id: 'overall-reception',
    title: 'User Perception Analysis',
    category: 'reception',
    content: posRatio >= 0.5 
      ? `The system demonstrates **positive user reception** with ${(posRatio * 100).toFixed(0)}% favorable feedback across ${summary.analyzed} evaluator comments. This suggests the core functionality meets user expectations.`
      : negRatio >= 0.3
        ? `User feedback reveals **areas requiring attention** with ${(negRatio * 100).toFixed(0)}% critical responses. This indicates opportunities for targeted improvements.`
        : `Feedback shows a **balanced distribution** suggesting adequate but not exceptional performance.`,
    dataSupport: `n=${summary.analyzed}, positive=${summary.simpleCounts.positive}, neutral=${summary.simpleCounts.neutral}, negative=${summary.simpleCounts.negative}`
  });
  
  // Finding 2: Component Analysis
  if (componentSentiment) {
    const sorted = Object.entries(componentSentiment)
      .filter(([_, d]) => d.comments.length > 0)
      .sort((a, b) => b[1].analysis.summary.averageScore - a[1].analysis.summary.averageScore);
    
    if (sorted.length >= 2) {
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      
      findings.push({
        id: 'component-variance',
        title: 'Component Performance Variance',
        category: 'components',
        content: `**${best[1].name}** achieves highest satisfaction (${(best[1].analysis.summary.averageScore * 100).toFixed(0)}% score, n=${best[1].comments.length}), ` +
          `while **${worst[1].name}** shows most improvement opportunity (${(worst[1].analysis.summary.averageScore * 100).toFixed(0)}% score, n=${worst[1].comments.length}). ` +
          `This ${(best[1].analysis.summary.averageScore - worst[1].analysis.summary.averageScore) > 0.3 ? 'significant' : 'moderate'} variance suggests targeted enhancement strategies.`,
        dataSupport: `Score range: ${(worst[1].analysis.summary.averageScore * 100).toFixed(0)}% - ${(best[1].analysis.summary.averageScore * 100).toFixed(0)}%`
      });
    }
  }
  
  // Finding 3: Inter-rater Reliability
  if (fleissKappa && fleissKappa.kappa !== null) {
    findings.push({
      id: 'inter-rater',
      title: 'Evaluation Consistency',
      category: 'reliability',
      content: `Fleiss' κ = ${fleissKappa.kappa.toFixed(3)} indicates **${fleissKappa.interpretation}** among evaluators. ` +
        `Observed agreement (${fleissKappa.observedAgreement}%) exceeds chance expectation (${fleissKappa.expectedAgreement}%) by ${fleissKappa.observedAgreement - fleissKappa.expectedAgreement}%, ` +
        `${fleissKappa.kappa >= 0.6 ? 'supporting the reliability of evaluation findings' : 'suggesting need for clearer evaluation criteria'}.`,
      dataSupport: `κ=${fleissKappa.kappa.toFixed(3)}, P_observed=${fleissKappa.observedAgreement}%, P_expected=${fleissKappa.expectedAgreement}%`
    });
  }
  
  // Finding 4: Expertise Patterns
  if (expertisePreferences?.preferences?.expert && expertisePreferences?.preferences?.basic) {
    const expertFav = expertisePreferences.preferences.expert.favorite;
    const basicFav = expertisePreferences.preferences.basic.favorite;
    
    if (expertFav && basicFav) {
      const samePreference = expertFav.key === basicFav.key;
      
      findings.push({
        id: 'expertise-pattern',
        title: 'Expertise-Based Perception Patterns',
        category: 'expertise',
        content: samePreference
          ? `Both domain experts and novice evaluators favor **${expertFav.name}**, indicating broad appeal. ` +
            `This consistency across expertise levels suggests the component's quality is universally recognized.`
          : `Expertise levels show **divergent preferences**: experts favor **${expertFav.name}** (${expertFav.positivePercent}% positive) ` +
            `while novices prefer **${basicFav.name}** (${basicFav.positivePercent}% positive). ` +
            `This divergence may reflect different evaluation priorities or domain knowledge requirements.`,
        dataSupport: `Expert: ${expertFav.name} (${expertFav.positivePercent}%), Basic: ${basicFav.name} (${basicFav.positivePercent}%)`
      });
    }
  }
  
  return findings;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  FLEISS_KAPPA_EXPLANATION,
  INTERSECTION_EXPLANATION,
  calculateFleissKappa,
  extractDOI,
  extractTitle,
  extractPaperTitle,
  extractUserIdentifier,
  findMultiEvaluatorPapers,
  calculatePaperIntersection,
  generateComponentInterpretation,
  generateOverallInterpretation,
  analyzeExpertConsensus,
  analyzeExpertisePreferences,
  analyzeNgramPatterns,
  filterNgramData,
  getPaperStatistics,
  calculateComponentInterRater,
  analyzeThemesWithFrequency,
  generateResearchFindings
};