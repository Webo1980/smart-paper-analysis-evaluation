// src/components/evaluation/research-problem/managers/ResearchProblemAssessmentManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { expertiseToMultiplier } from '../../base/utils/baseMetricsUtils';
import { storeOverallEvaluation } from '../../base/utils/storageUtils';
import ResearchProblemEvaluationForm from '../components/ResearchProblemEvaluationForm';
import ResearchProblemEvaluationReport from '../components/ResearchProblemEvaluationReport';
import { NavigationButtons } from '../../base';
import { DEFAULT_RATINGS, QUALITY_WEIGHTS, PROBLEM_ACCURACY_WEIGHTS } from '../config/researchProblemConfig';
import { 
  extractGroundTruth, 
  extractProblemData, 
  extractProblemFromEvalData,
  processResearchProblemAccuracy,
  processResearchProblemQuality
} from '../utils/researchProblemMetrics';
import { compareResearchProblems } from '../utils/advancedContentAnalysisUtils';
import { 
  calculateTitleQuality, 
  calculateDescriptionQuality, 
  calculateRelevanceScore, 
  calculateEvidenceQualityScore 
} from '../utils/qualityAnalysisUtils';
import { calculateContentSimilarity } from '../utils/contentAnalysisUtils';

const STORAGE_KEY = 'problemAnalysis';
const VIEW_STATE_KEY = 'problemAnalysisView';

const ResearchProblemAssessmentManager = ({
  evaluationData,
  userInfo,
  showComparison: externalShowComparison,
  setShowComparison: externalSetShowComparison,
  evaluationState = {},
  updateSection,
  useAbstract = true,
  onNext,
  onPrevious
}) => {
  // Load view state
  const getInitialViewState = () => {
    if (externalShowComparison !== undefined) return externalShowComparison;
    
    try {
      const stored = localStorage.getItem(VIEW_STATE_KEY);
      if (stored) return JSON.parse(stored) === true;
    } catch (e) {
      console.error("Error parsing stored view state:", e);
    }
    
    if (evaluationState?.research_problem?.showComparison !== undefined) {
      return evaluationState.research_problem.showComparison;
    }
    
    return false;
  };

  const [internalShowComparison, setInternalShowComparison] = useState(getInitialViewState());
  const showComparison = externalShowComparison !== undefined ? externalShowComparison : internalShowComparison;
  
  const setShowComparison = useCallback((value) => {
    localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(value));
    if (externalSetShowComparison) {
      externalSetShowComparison(value);
    } else {
      setInternalShowComparison(value);
    }
  }, [externalSetShowComparison]);

  // Load user assessment
  const loadFromStorage = useCallback(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (e) {
        console.error("Error parsing stored assessment:", e);
      }
    }
    
    return evaluationState?.research_problem?.userAssessment || {
      problemTitle: DEFAULT_RATINGS.problemTitle,
      problemTitleComments: '',
      problemDescription: DEFAULT_RATINGS.problemDescription,
      problemDescriptionComments: '',
      relevance: DEFAULT_RATINGS.relevance,
      relevanceComments: '',
      completeness: DEFAULT_RATINGS.completeness,
      completenessComments: '',
      evidenceQuality: DEFAULT_RATINGS.evidenceQuality,
      evidenceQualityComments: '',
      comments: ''
    };
  }, [evaluationState]);

  const [userAssessment, setUserAssessment] = useState(loadFromStorage);
  
  const [finalAssessment, setFinalAssessment] = useState(() => {
    if (evaluationState?.research_problem?.finalAssessment) {
      return evaluationState.research_problem.finalAssessment;
    }
    return {};
  });

  const [isComplete, setIsComplete] = useState(
    evaluationState?.research_problem?.isComplete || false
  );

  // Save user assessment to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userAssessment));
    
    const { problemTitle, problemDescription, relevance, completeness, evidenceQuality } = userAssessment;
    const complete = problemTitle > 0 && problemDescription > 0 && relevance > 0 && 
                    completeness > 0 && evidenceQuality > 0;
    setIsComplete(complete);
  }, [userAssessment]);

  // Handle assessment changes
  const handleAssessmentChange = useCallback((changes) => {
    setUserAssessment(prev => ({
      ...prev,
      ...changes
    }));
  }, []);

  // ✅ SIMPLIFIED generateFinalAssessment - matches content structure
  const generateFinalAssessment = useCallback(async (userAssessment, userInfo) => {
    try {
      console.log('🔵 Research Problem: generateFinalAssessment called');

      const {
        problemTitle: problemTitleRating = 3,
        problemTitleComments = '',
        problemDescription: problemDescriptionRating = 3,
        problemDescriptionComments = '',
        relevance: relevanceRating = 3,
        relevanceComments = '',
        completeness: completenessRating = 3,
        completenessComments = '',
        evidenceQuality: evidenceQualityRating = 3,
        evidenceQualityComments = '',
        comments = ''
      } = userAssessment;

      const expertiseMultiplier = userInfo?.expertiseMultiplier || expertiseToMultiplier(userInfo?.expertiseWeight || 1);

      // Extract data
      const groundTruth = extractGroundTruth(evaluationData, useAbstract);
      const problemDataRaw = extractProblemFromEvalData(evaluationData);
      const problemData = extractProblemData(problemDataRaw);

      // Calculate comparisons
      const titleComparison = compareResearchProblems(
        { title: groundTruth, description: '' },
        { title: problemData.title, description: '' }
      );

      const descriptionComparison = compareResearchProblems(
        { title: '', description: groundTruth },
        { title: '', description: problemData.description }
      );

      // Calculate metrics
      const similarityData = calculateContentSimilarity(groundTruth, problemData);
      const accuracyResults = processResearchProblemAccuracy(
        'research_problem',
        groundTruth,
        problemData,
        Math.max(problemTitleRating, problemDescriptionRating),
        expertiseMultiplier
      );

      const overallAccuracyScore = (
        (accuracyResults.similarityData.semanticSimilarity * PROBLEM_ACCURACY_WEIGHTS.semanticSimilarity) +
        (accuracyResults.similarityData.conceptOverlap * PROBLEM_ACCURACY_WEIGHTS.conceptOverlap) +
        (accuracyResults.similarityData.contextualRelevance * PROBLEM_ACCURACY_WEIGHTS.contextualRelevance) +
        (accuracyResults.similarityData.structuralAlignment * PROBLEM_ACCURACY_WEIGHTS.structuralAlignment) +
        (accuracyResults.similarityData.specificity * PROBLEM_ACCURACY_WEIGHTS.specificity)
      );

      // Quality analysis
      const qualityAnalysis = {
        problemTitle: calculateTitleQuality(problemData.title),
        problemDescription: calculateDescriptionQuality(problemData.description),
        relevance: calculateRelevanceScore(problemData, groundTruth),
        evidenceQuality: calculateEvidenceQualityScore(problemData),
        details: {
          problemTitleReason: `Title length: ${problemData.title?.length || 0} chars`,
          problemTitleDetails: problemData.title || '',
          problemDescriptionReason: `Description length: ${problemData.description?.length || 0} chars`,
          problemDescriptionDetails: problemData.description || '',
          relevanceReason: 'Based on semantic overlap with ground truth',
          relevanceDetails: groundTruth || '',
          evidenceQualityReason: 'Based on available evidence and citations',
          evidenceQualityDetails: problemData.evidence || ''
        }
      };

      const qualityResults = processResearchProblemQuality(
        'research_problem',
        groundTruth,
        problemData,
        relevanceRating,
        expertiseMultiplier,
        qualityAnalysis
      );

      const overallQualityScore = (
        (qualityAnalysis.problemTitle * QUALITY_WEIGHTS.problemTitle) +
        (qualityAnalysis.problemDescription * QUALITY_WEIGHTS.problemDescription) +
        (qualityAnalysis.relevance * QUALITY_WEIGHTS.relevance) +
        (completenessRating / 5 * 0.25) +
        (qualityAnalysis.evidenceQuality * QUALITY_WEIGHTS.evidenceQuality)
      );

      const combinedOverallScore = (
        overallAccuracyScore * 0.6 +
        overallQualityScore * 0.4
      );

      // ✅ SIMPLIFIED STRUCTURE - Everything under overall.research_problem
      const assessment = {
        overall: {
          research_problem: {
            // ===========================
            // USER RATINGS (All user input here)
            // ===========================
            userRatings: {
              problemTitle: {
                rating: problemTitleRating,
                comments: problemTitleComments
              },
              problemDescription: {
                rating: problemDescriptionRating,
                comments: problemDescriptionComments
              },
              relevance: {
                rating: relevanceRating,
                comments: relevanceComments
              },
              completeness: {
                rating: completenessRating,
                comments: completenessComments
              },
              evidenceQuality: {
                rating: evidenceQualityRating,
                comments: evidenceQualityComments
              },
              overallRating: Math.max(
                problemTitleRating,
                problemDescriptionRating,
                relevanceRating,
                completenessRating,
                evidenceQualityRating
              ),
              overallComments: comments,
              expertiseWeight: userInfo?.expertiseWeight || 1,
              expertiseMultiplier
            },

            // ===========================
            // ACCURACY METRICS (Pure calculations)
            // ===========================
            accuracy: {
              overallAccuracy: {
                value: overallAccuracyScore,
                automated: accuracyResults.scoreDetails.combinedScore,
                finalScore: accuracyResults.scoreDetails.finalScore
              },
              semanticSimilarity: { 
                value: accuracyResults.similarityData.semanticSimilarity,
                weight: PROBLEM_ACCURACY_WEIGHTS.semanticSimilarity
              },
              conceptOverlap: { 
                value: accuracyResults.similarityData.conceptOverlap,
                weight: PROBLEM_ACCURACY_WEIGHTS.conceptOverlap
              },
              contextualRelevance: { 
                value: accuracyResults.similarityData.contextualRelevance,
                weight: PROBLEM_ACCURACY_WEIGHTS.contextualRelevance
              },
              structuralAlignment: { 
                value: accuracyResults.similarityData.structuralAlignment,
                weight: PROBLEM_ACCURACY_WEIGHTS.structuralAlignment
              },
              specificity: { 
                value: accuracyResults.similarityData.specificity,
                weight: PROBLEM_ACCURACY_WEIGHTS.specificity
              },
              precision: { value: accuracyResults.similarityData.precision || 0.7 },
              recall: { value: accuracyResults.similarityData.recall || 0.65 },
              f1Score: { value: accuracyResults.similarityData.f1Score || 0.675 },
              similarityData: accuracyResults.similarityData,
              scoreDetails: accuracyResults.scoreDetails
            },

            // ===========================
            // QUALITY METRICS (Pure calculations)
            // ===========================
            quality: {
              overallQuality: { 
                value: overallQualityScore,
                automated: qualityResults.qualityData.automatedOverallScore,
                finalScore: qualityResults.scoreDetails.finalScore
              },
              problemTitle: {
                value: qualityAnalysis.problemTitle,
                weight: QUALITY_WEIGHTS.problemTitle,
                reason: qualityAnalysis.details.problemTitleReason,
                details: qualityAnalysis.details.problemTitleDetails
              },
              problemDescription: {
                value: qualityAnalysis.problemDescription,
                weight: QUALITY_WEIGHTS.problemDescription,
                reason: qualityAnalysis.details.problemDescriptionReason,
                details: qualityAnalysis.details.problemDescriptionDetails
              },
              relevance: { 
                value: qualityAnalysis.relevance,
                weight: QUALITY_WEIGHTS.relevance,
                reason: qualityAnalysis.details.relevanceReason,
                details: qualityAnalysis.details.relevanceDetails
              },
              evidenceQuality: { 
                value: qualityAnalysis.evidenceQuality,
                weight: QUALITY_WEIGHTS.evidenceQuality,
                reason: qualityAnalysis.details.evidenceQualityReason,
                details: qualityAnalysis.details.evidenceQualityDetails
              },
              qualityData: qualityResults.qualityData,
              qualityAnalysis,
              scoreDetails: qualityResults.scoreDetails
            },

            // ===========================
            // COMBINED SCORES
            // ===========================
            scores: {
              accuracyScore: overallAccuracyScore,
              qualityScore: overallQualityScore,
              overallScore: combinedOverallScore,
              weights: { 
                accuracy: 0.6, 
                quality: 0.4 
              }
            },

            // ===========================
            // COMPARISON DATA
            // ===========================
            comparisonData: {
              title: titleComparison,
              description: descriptionComparison
            },

            // ===========================
            // SOURCE DATA
            // ===========================
            groundTruth: typeof groundTruth === 'string' ? 
              { text: groundTruth, source: useAbstract ? 'abstract' : 'orkg' } : 
              groundTruth,
            problemData,

            // ===========================
            // CONFIGURATION
            // ===========================
            config: {
              useAbstract,
              accuracyWeights: PROBLEM_ACCURACY_WEIGHTS,
              qualityWeights: QUALITY_WEIGHTS
            },

            // ===========================
            // METADATA
            // ===========================
            timestamp: new Date().toISOString()
          }
        }
      };
      
      console.log('🔵 Research Problem: Calling storeOverallEvaluation');
      
      // ✅ Save to evaluation_metrics.overall.research_problem
      storeOverallEvaluation(assessment, 'research_problem');
      
      // ✅ Update evaluationState immediately
      if (typeof updateSection === 'function') {
        console.log('🔵 Research Problem: Updating evaluationState');
        updateSection('research_problem', {
          userAssessment,
          finalAssessment: assessment,
          isComplete: true,
          showComparison: true
        });
      }
      
      console.log('✅ Research problem assessment saved successfully');
      
      return assessment;
    } catch (error) {
      console.error("Error in generateFinalAssessment:", error);
      return {
        overall: {
          research_problem: {
            userRatings: userAssessment,
            accuracy: { overallAccuracy: { value: 0 } },
            quality: { overallQuality: { value: 0 } },
            scores: {
              accuracyScore: 0,
              qualityScore: 0,
              overallScore: 0
            },
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }, [evaluationData, useAbstract, updateSection]);

  // Show comparison view
  const handleShowComparison = useCallback(async () => {
    try {
      console.log('🔵 Research Problem: handleShowComparison called');
      const assessment = await generateFinalAssessment(userAssessment, userInfo);
      setFinalAssessment(assessment);
      setShowComparison(true);
    } catch (error) {
      console.error("Error in handleShowComparison:", error);
    }
  }, [generateFinalAssessment, userAssessment, userInfo, setShowComparison]);

  // Update evaluationState
  useEffect(() => {
    if (typeof updateSection === 'function') {
      updateSection('research_problem', {
        userAssessment,
        finalAssessment,
        isComplete,
        showComparison
      });
    }
  }, [userAssessment, isComplete, showComparison, updateSection]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 relative">
        {showComparison ? (
          <ResearchProblemEvaluationReport
            finalAssessment={finalAssessment}
            evaluationData={evaluationData}
            userInfo={userInfo}
            onEditAssessment={() => setShowComparison(false)}
            useAbstract={useAbstract}
          />
        ) : (
          <ResearchProblemEvaluationForm
            userAssessment={userAssessment}
            handleAssessmentChange={handleAssessmentChange}
            isComplete={isComplete}
            onShowComparison={handleShowComparison}
            evaluationData={evaluationData}
            useAbstract={useAbstract}
          />
        )}
      </div>
      
      <NavigationButtons 
        onPrevious={onPrevious} 
        onNext={onNext} 
        showNext={showComparison} 
      />
    </div>
  );
};

export default ResearchProblemAssessmentManager;