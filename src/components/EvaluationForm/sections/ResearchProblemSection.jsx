import React, { useState, useEffect, useCallback } from 'react';
import { BaseEvaluationSection } from '../../evaluation/base/BaseEvaluationSection';
import { Card } from '../../ui/card';
import { Alert } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ArrowLeft, ArrowRight, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { useEvaluation } from '../../../context/EvaluationContext';
import { Tooltip } from '../../ui/tooltip';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

export const ResearchProblemSection = ({ 
  evaluationData, 
  onNext, 
  onPrevious 
}) => {
  const { evaluationState, updateSection } = useEvaluation();
  
  const determineProblemType = useCallback(() => {
    if (evaluationData?.researchProblems?.orkg_problems?.length > 0) {
      return 'ORKG Match';
    }
    if (evaluationData?.researchProblems?.llm_problem) {
      return 'LLM Generation';
    }
    return 'LLM Generation';
  }, [evaluationData]);

  const [showMetrics, setShowMetrics] = useState(() => 
    evaluationState.researchProblem?.showMetrics ?? false
  );
  
  const [editMode, setEditMode] = useState(() => 
    !evaluationState.researchProblem?.showMetrics
  );
  
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  
  const [problemData, setProblemData] = useState(() => {
    const problemType = determineProblemType();
    
    return evaluationState.researchProblem?.problemData || {
      detectionMethod: problemType,
      problemTitle: evaluationData?.researchProblems?.llm_problem?.title || '',
      problemDescription: evaluationData?.researchProblems?.llm_problem?.description || '',
      problemExplanation: evaluationData?.researchProblems?.llm_problem?.explanation || '',
      titleClarity: 0,
      descriptionAccuracy: 0,
      relevance: 0,
      novelty: 0,
      impactScore: 0,
      motivationClarity: 0,
      domainRelevance: 0,
      explanationQuality: 0,
      sourceEvidence: evaluationData?.researchProblems?.llm_problem?.explanation || '',
      systemAnalysisComments: ''
    };
  });

  const [assessment, setAssessment] = useState(() => 
    evaluationState.researchProblem?.assessment || {
      problemDetection: { rating: 0, comments: '' },
      relevance: { rating: 0, comments: '' },
      evidence: { rating: 0, comments: '' },
      overall: { rating: 0, comments: '' }
    }
  );

  const handleInputChange = useCallback((field, value) => {
    setProblemData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const isComplete = Object.entries(assessment)
    .filter(([field]) => field !== 'overall')
    .every(([_, value]) => value.rating > 0);
    useEffect(() => {
      const timer = setTimeout(() => {
        const newState = {
          assessment,
          problemData,
          showMetrics,
          editMode,
          isComplete
        };
  
        if (JSON.stringify(evaluationState.researchProblem) !== JSON.stringify(newState)) {
          updateSection('researchProblem', newState);
        }
      }, 300);
  
      return () => clearTimeout(timer);
    }, [assessment, problemData, showMetrics, editMode, isComplete, updateSection]);
  
    const toggleEditMode = useCallback(() => {
      setEditMode(prev => !prev);
      if (!showMetrics) {
        setShowMetrics(true);
      }
    }, [showMetrics]);
  
    const handleAssessmentChange = useCallback((newAssessment) => {
      setAssessment(newAssessment);
      if (!showMetrics && Object.entries(newAssessment)
          .filter(([field]) => field !== 'overall')
          .every(([_, value]) => value.rating > 0)) {
        setShowMetrics(true);
        setEditMode(false);
      }
    }, [showMetrics]);
  
    const calculateProblemMetrics = useCallback(() => {
      const isProblemTypeOrkg = evaluationData?.researchProblems?.orkg_problems?.length > 0;
      const researchProblems = evaluationData?.researchProblems || {};
  
      if (isProblemTypeOrkg) {
        const metadata = researchProblems.metadata || {};
        const matchQuality = metadata.max_similarity || 0;
        const thresholdScore = metadata.threshold_used || 0;
        const similarityScore = metadata.similarities_found > 0 
          ? (metadata.total_similar / metadata.total_scanned) * 100 
          : 0;
  
        return {
          isProblemTypeOrkg: true,
          overallScore: Math.min(100, Math.max(0, 
            matchQuality * 50 + 
            thresholdScore * 30 + 
            similarityScore * 20
          )),
          details: {
            matchQuality: matchQuality * 100,
            thresholdScore: thresholdScore * 100,
            similarityScore: similarityScore,
            totalPapersScanned: metadata.total_scanned || 0,
            similarPapersFound: metadata.total_similar || 0,
            maxSimilarity: metadata.max_similarity || 0
          }
        };
      } else {
        const llmProblem = researchProblems.llm_problem || {};
        const hasTitle = !!llmProblem.title;
        const hasDescription = !!llmProblem.description;
        const hasExplanation = !!llmProblem.explanation;
  
        const titleScore = hasTitle ? 33.33 : 0;
        const descriptionScore = hasDescription ? 33.33 : 0;
        const explanationScore = hasExplanation ? 33.34 : 0;
  
        return {
          isProblemTypeOrkg: false,
          overallScore: titleScore + descriptionScore + explanationScore,
          details: {
            titleExists: hasTitle,
            descriptionExists: hasDescription,
            explanationExists: hasExplanation
          }
        };
      }
    }, [evaluationData]);
    const renderProblemForm = () => (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Problem Detection Method</Label>
          <RadioGroup
            value={problemData.detectionMethod}
            onValueChange={(value) => handleInputChange('detectionMethod', value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ORKG Match" id="orkg" />
              <Label htmlFor="orkg">ORKG Match</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="LLM Generation" id="llm" />
              <Label htmlFor="llm">LLM Generation</Label>
            </div>
          </RadioGroup>
        </div>
  
        <div className="space-y-4">
          <h4 className="font-medium">Base Assessment</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title Clarity (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.titleClarity}
                onChange={(e) => handleInputChange('titleClarity', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description Accuracy (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.descriptionAccuracy}
                onChange={(e) => handleInputChange('descriptionAccuracy', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Relevance (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.relevance}
                onChange={(e) => handleInputChange('relevance', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Novelty (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.novelty}
                onChange={(e) => handleInputChange('novelty', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
  
        <div className="space-y-4">
          <h4 className="font-medium">Quality Assessment</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Impact Assessment (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.impactScore}
                onChange={(e) => handleInputChange('impactScore', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">Rate the potential impact of the research problem</p>
            </div>
            <div className="space-y-2">
              <Label>Motivation Clarity (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.motivationClarity}
                onChange={(e) => handleInputChange('motivationClarity', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">Rate how well the motivation is explained</p>
            </div>
            <div className="space-y-2">
              <Label>Domain Relevance (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.domainRelevance}
                onChange={(e) => handleInputChange('domainRelevance', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">Rate the relevance to the research domain</p>
            </div>
            <div className="space-y-2">
              <Label>Explanation Quality (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={problemData.explanationQuality}
                onChange={(e) => handleInputChange('explanationQuality', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500">Rate the quality of the problem explanation</p>
            </div>
          </div>
        </div>
  
        <div className="space-y-2">
          <Label>Source Evidence</Label>
          <Textarea
            value={problemData.sourceEvidence}
            onChange={(e) => handleInputChange('sourceEvidence', e.target.value)}
            rows={4}
            placeholder="Provide evidence from the source text that supports this research problem"
          />
        </div>
  
        <div className="space-y-2">
          <Label>System Analysis Comments</Label>
          <Textarea
            value={problemData.systemAnalysisComments}
            onChange={(e) => handleInputChange('systemAnalysisComments', e.target.value)}
            rows={4}
            placeholder="Add your observations about the automated research problem analysis..."
          />
        </div>
      </div>
    );
    const renderMetrics = () => {
      if (!showMetrics) return null;
      
      if (!evaluationData?.researchProblems) {
        return (
          <Card className="mt-6">
            <Alert>
              <AlertTitle>Data Unavailable</AlertTitle>
              <AlertDescription>Research problem data is not available.</AlertDescription>
            </Alert>
          </Card>
        );
      }
    
      const metrics = calculateProblemMetrics();
    
      return (
        <Card className="mt-6">
          <Alert className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">
                {metrics.isProblemTypeOrkg ? 'ORKG Research Problem' : 'LLM Generated Research Problem'}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs text-gray-600 underline hover:text-gray-900"
                  onClick={() => setShowScoreInfo(!showScoreInfo)}
                >
                  {showScoreInfo ? 'Hide Score Info' : 'Show Score Info'}
                </button>
                <Badge 
                  className={
                    metrics.overallScore >= 70 ? "bg-green-500" : 
                    metrics.overallScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }
                >
                  Score: {metrics.overallScore.toFixed(1)}%
                </Badge>
              </div>
            </div>
    
            {showScoreInfo && (
              <div className="mb-4 text-sm bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-1">Score Calculation:</p>
                {metrics.isProblemTypeOrkg ? (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Match Quality (50%): {metrics.details.matchQuality.toFixed(1)}%</li>
                    <li>Threshold Score (30%): {metrics.details.thresholdScore.toFixed(1)}%</li>
                    <li>Similarity Score (20%): {metrics.details.similarityScore.toFixed(1)}%</li>
                    <li>Total Papers Scanned: {metrics.details.totalPapersScanned}</li>
                    <li>Similar Papers Found: {metrics.details.similarPapersFound}</li>
                    <li>Maximum Similarity: {metrics.details.maxSimilarity.toFixed(1)}%</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Title Exists: {metrics.details.titleExists ? 'Yes (40%)' : 'No'}</li>
                    <li>Description Exists: {metrics.details.descriptionExists ? 'Yes (30%)' : 'No'}</li>
                    <li>Explanation Exists: {metrics.details.explanationExists ? 'Yes (30%)' : 'No'}</li>
                  </ul>
                )}
              </div>
            )}
    
            <div className="space-y-4">
              {metrics.isProblemTypeOrkg ? (
                <div className="space-y-2">
                  <div>Selected Problem: {evaluationData.researchProblems.selectedProblem?.title || 'N/A'}</div>
                  <div>Match Quality: {metrics.details.matchQuality.toFixed(1)}%</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-600">Problem Title</div>
                    <div className="text-lg font-medium">
                      {evaluationData.researchProblems.llm_problem?.title}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Problem Description</div>
                    <div className="text-base bg-white p-2 rounded border">
                      {evaluationData.researchProblems.llm_problem?.description}
                    </div>
                  </div>
                </div>
              )}
    
              <div className="space-y-2">
                <Label>System Analysis Comments</Label>
                <Textarea
                  value={problemData.systemAnalysisComments}
                  onChange={(e) => handleInputChange('systemAnalysisComments', e.target.value)}
                  rows={4}
                  placeholder="Add your observations about the automated research problem analysis..."
                />
              </div>
            </div>
          </Alert>
        </Card>
      );
    };
    const renderContent = () => {
      if (editMode) {
        return (
          <BaseEvaluationSection
            title="Research Problem Analysis"
            description="Please evaluate the research problem analysis before seeing the metrics."
            fields={[
              { 
                id: 'problemDetection',
                label: 'Problem Detection Quality',
                help: 'How well was the research problem identified?'
              },
              {
                id: 'relevance',
                label: 'Relevance and Accuracy',
                help: 'Is the identified problem relevant and accurate?'
              },
              {
                id: 'evidence',
                label: 'Evidence Support',
                help: 'Is there clear evidence supporting the problem identification?'
              }
            ]}
            data={assessment}
            onChange={handleAssessmentChange}
            onComplete={() => {
              setShowMetrics(true);
              setEditMode(false);
            }}
            isComplete={isComplete}
          >
            {renderProblemForm()}
          </BaseEvaluationSection>
        );
      }
    
      return (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Research Problem Analysis Results</h2>
            <p className="text-gray-600">
              Review the analysis of the identified research problem and its evaluation.
            </p>
          </div>
          {renderMetrics()}
        </>
      );
    };
    
    const renderToggleButton = () => {
      if (!showMetrics) return null;
    
      const buttonContent = (
        <Button
          variant="ghost"
          onClick={toggleEditMode}
          disabled={editMode && !isComplete}
          className={`mb-4 flex items-center gap-2 text-white p-2 rounded-md 
            ${editMode ? "!bg-[#E86161] hover:!bg-[#c54545]" : "!bg-[#E86161] hover:!bg-[#c54545]"}
            !outline-none !ring-0 !border-none
          `}
        >
          {editMode ? (
            <>
              <ArrowLeft className="h-4 w-4" />
              Back to Analysis
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Edit Assessment
            </>
          )}
        </Button>
      );
    
      if (editMode && !isComplete) {
        return (
          <Tooltip content="Complete all questions to view the analysis">
            {buttonContent}
          </Tooltip>
        );
      }
    
      return buttonContent;
    };
    
    const renderNavigationButtons = () => (
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!isComplete}
          className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  
    return (
      <div className="space-y-4">
        {renderToggleButton()}
        {renderContent()}
        {renderNavigationButtons()}
      </div>
    );
  };
  
  export default ResearchProblemSection;