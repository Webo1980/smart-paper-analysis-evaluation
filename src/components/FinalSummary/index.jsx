import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button }  from '../ui/button';
import { ExternalLink, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { useEvaluation } from '../../context/EvaluationContext';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

const FinalSummary = ({ evaluationData, orkgPaperData }) => {
  const { evaluationState, updateSection } = useEvaluation();
  
  if (!evaluationData?.metadata) return null;

  const renderProgressBadge = (isComplete) => {
    if (isComplete) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  const renderMetadataProgress = () => {
    const metadata = evaluationState.metadata;
    if (!metadata?.assessment) return null;

    const completedFields = Object.entries(metadata.assessment)
      .filter(([key, value]) => key !== 'overall' && value.rating > 0)
      .length;

    const handleEditClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateSection('metadata', {
        ...metadata,
        editMode: true
      });
    };

    return (
      <div className="border-t pt-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700">Metadata Assessment</h4>
            {renderProgressBadge(completedFields === 5)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-600">
                  Fields Completed: {completedFields}/5
                </span>
                <Progress value={(completedFields / 5) * 100} className="w-32" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none focus:outline-none"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>

            </div>
            
            {metadata.comparisonComments && (
              <div className="text-sm text-gray-500 mt-2">
                <div className="font-medium">Latest Comments:</div>
                <p className="text-xs mt-1 line-clamp-2 italic">
                  "{metadata.comparisonComments}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResearchFieldProgress = () => {
    const researchField = evaluationState.researchField;
    if (!researchField?.assessment) return null;
  
    const completedFields = Object.entries(researchField.assessment)
      .filter(([key, value]) => key !== 'overall' && value.rating > 0)
      .length;
  
    const handleEditClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateSection('researchField', {
        ...researchField,
        editMode: true
      });
    };
  
    return (
      <div className="border-t pt-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700">Research Field Analysis</h4>
            {renderProgressBadge(completedFields === 2)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-600">
                  Assessment Complete: {completedFields}/2
                </span>
                <Progress value={(completedFields / 2) * 100} className="w-32" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-1 p-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </div>
            
            {researchField.selectedField && (
              <div className="text-sm text-gray-500">
                <div className="font-medium">Selected Field:</div>
                <p className="text-xs mt-1">{researchField.selectedField}</p>
              </div>
            )}
            
            {researchField.assessment.overall.comments && (
              <div className="text-sm text-gray-500">
                <div className="font-medium">Comments:</div>
                <p className="text-xs mt-1 line-clamp-2 italic">
                  "{researchField.assessment.overall.comments}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResearchProblemProgress = () => {
    const researchProblem = evaluationState.researchProblem;
    if (!researchProblem?.assessment) return null;
  
    const completedFields = Object.entries(researchProblem.assessment)
      .filter(([key, value]) => key !== 'overall' && value.rating > 0)
      .length;
  
    const handleEditClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateSection('researchProblem', {
        ...researchProblem,
        editMode: true
      });
    };
  
    return (
      <div className="border-t pt-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700">Research Problem Analysis</h4>
            {renderProgressBadge(completedFields === 3)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-600">
                  Assessment Complete: {completedFields}/3
                </span>
                <Progress value={(completedFields / 3) * 100} className="w-32" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-1 p-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </div>
            
            {researchProblem.problemData?.problemTitle && (
              <div className="text-sm text-gray-500">
                <div className="font-medium">Problem Title:</div>
                <p className="text-xs mt-1 line-clamp-2">
                  {researchProblem.problemData.problemTitle}
                </p>
              </div>
            )}
            
            {researchProblem.assessment.overall.comments && (
              <div className="text-sm text-gray-500">
                <div className="font-medium">Comments:</div>
                <p className="text-xs mt-1 line-clamp-2 italic">
                  "{researchProblem.assessment.overall.comments}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderTemplateProgress = () => {
    const templateAnalysis = evaluationState.templateAnalysis;
    if (!templateAnalysis) return null;
  
    const completedFields = Object.entries(templateAnalysis.assessment)
      .filter(([key, value]) => key !== 'overall' && value.rating > 0)
      .length;
    
    const handleEditClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateSection('templateAnalysis', {
        ...templateAnalysis,
        editMode: true
      });
    };
    return (
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-700">Template Analysis</h4>
          {renderProgressBadge(completedFields === 3)}
        </div>
  
        {templateAnalysis.selectedTemplate && (
          <p className="text-sm text-gray-600">
            Selected Template: <strong>{templateAnalysis.selectedTemplate}</strong>
          </p>
        )}
  
        <div className="flex justify-between items-center mt-2">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-600">
              Assessment Complete: {completedFields}/3
            </span>
            <Progress value={(completedFields / 3) * 100} className="w-32" />
          </div>
  
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditClick}
            className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-1 p-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
  
        {templateAnalysis.isComplete && templateAnalysis.overallScore !== undefined && (
          <div className="text-sm text-gray-600 mt-2">
            <strong>Score:</strong> {templateAnalysis.overallScore}%
          </div>
        )}
      </div>
    );
  };
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <h3 className="text-lg font-semibold">Paper Summary</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-2">Title</h4>
          <p className="text-sm text-gray-600">{evaluationData.metadata.title}</p>
        </div>

        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-2">Authors</h4>
          <p className="text-sm text-gray-600">
            {Array.isArray(evaluationData.metadata.authors) 
              ? evaluationData.metadata.authors.join(', ')
              : evaluationData.metadata.authors}
          </p>
        </div>

        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-2">ORKG Data</h4>
          <div className="space-y-2">
            {orkgPaperData?.research_field_name && (
              <p className="text-sm text-gray-600">
                Field: {orkgPaperData.research_field_name}
              </p>
            )}
            {orkgPaperData?.id && (
              <a 
                href={`https://orkg.org/paper/${orkgPaperData.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#E86161] hover:text-[#c54545] flex items-center gap-1"
              >
                View in ORKG
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-2">Source</h4>
          <a 
            href={`https://doi.org/${evaluationData.metadata.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#E86161] hover:text-[#c54545] flex items-center gap-1"
          >
            {evaluationData.metadata.doi}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Evaluation Progress</h4>
          {renderMetadataProgress()}
          {renderResearchFieldProgress()}
          {renderResearchProblemProgress()}
          {renderTemplateProgress()}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinalSummary;