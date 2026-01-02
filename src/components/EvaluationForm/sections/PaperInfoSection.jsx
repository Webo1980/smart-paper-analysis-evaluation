import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  ClipboardCheck, 
  FileText, 
  Link2, 
  ExternalLink, 
  Calendar, 
  Atom, 
  Sparkles,
  Award,
  FileDigit,
  ChevronDown,
  ChevronUp,
  User,
  Mail
} from 'lucide-react';

// Reusable component for info row
const InfoRow = ({ icon: Icon, label, value, externalLink }) => (
  <div className="flex items-start gap-2">
    <Icon className="w-4 h-4 text-gray-500 mt-1" />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="font-medium break-words flex items-center gap-2">
        {value || 'N/A'}
        {externalLink && (
          <a 
            href={externalLink} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E86161] hover:text-[#c54545] inline-flex items-center"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  </div>
);

// Section header component
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-5 h-5 text-[#E86161]" />
    <h3 className="font-semibold text-gray-800">{title}</h3>
  </div>
);

const PaperInfoSection = ({ 
  evaluationData, 
  orkgPaperData, 
  userInfo, 
  currentStepIndex 
}) => {
  const [showExpertiseCalculation, setShowExpertiseCalculation] = useState(false);
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get confidence level color
  const getConfidenceColor = (weight) => {
    if (weight >= 4) return 'bg-green-100 text-green-800 border-green-200';
    if (weight >= 2.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Determine if we should show research problem section
  const showResearchProblem = currentStepIndex > 4 && 
    evaluationData?.researchProblems?.selectedProblem;

  // Determine if we should show template section
  const showTemplate = currentStepIndex > 5 && 
    evaluationData?.templates;

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-0">
        {/* Section 1: Evaluator Information */}
        <div className="p-4 bg-gray-50 border-b">
          <SectionHeader icon={User} title="Evaluator Information" />
          {userInfo ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{userInfo.firstName} {userInfo.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">{userInfo.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Evaluator information not available</p>
          )}
        </div>
        
        {/* Section 2: Expertise Weight 
        <div className="p-4 border-b">
          {userInfo?.expertiseWeight ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <SectionHeader icon={Award} title="Expertise Rating" />
                <button 
                  onClick={() => setShowExpertiseCalculation(!showExpertiseCalculation)}
                  className="flex items-center text-sm text-white bg-[#E86161] hover:bg-[#c54545] px-2 py-1 rounded"
                >
                  {showExpertiseCalculation ? (
                    <>
                      <span className="mr-1">Hide details</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span className="mr-1">Details</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge 
                  className={`inline-flex items-center ${getConfidenceColor(userInfo.expertiseWeight)}`}
                  variant="outline"
                >
                  Final Score: {userInfo.expertiseWeight.toFixed(2)}/5
                </Badge>
                <Badge 
                  className={`inline-flex items-center ${getConfidenceColor(userInfo.expertiseWeight)}`}
                  variant="outline"
                >
                  Expertise Multiplier: {userInfo.expertiseMultiplier}
                </Badge>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-gray-50">
                    Domain: {userInfo.domainExpertise}
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50">
                    Experience: {userInfo.evaluationExperience}
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50">
                    ORKG: {userInfo.orkgExperience === "used" ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              
              {showExpertiseCalculation && userInfo.weightComponents && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
                  <h4 className="font-medium mb-2">Weight Calculation</h4>
                  <div className="space-y-1">
                    <p>Role Weight: <span className="font-semibold">{userInfo.weightComponents.roleWeight}</span></p>
                    <p>Domain Multiplier: <span className="font-semibold">{userInfo.weightComponents.domainMultiplier}x</span></p>
                    <p>Experience Multiplier: <span className="font-semibold">{userInfo.weightComponents.experienceMultiplier}x</span></p>
                    <p>ORKG Bonus: <span className="font-semibold">+{userInfo.weightComponents.orkgBonus}</span></p>
                    <div className="pt-1 border-t mt-2">
                      <p className="font-medium">
                        Final: {userInfo.weightComponents.roleWeight} × {userInfo.weightComponents.domainMultiplier} × {userInfo.weightComponents.experienceMultiplier} + {userInfo.weightComponents.orkgBonus} = {userInfo.weightComponents.finalWeight}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <SectionHeader icon={Award} title="Expertise Rating" />
              <p className="text-sm text-gray-500">Expertise not evaluated</p>
            </>
          )}
        </div>
        */}
        {/* Section 3: Paper Data */}
        <div className="p-4 border-b">
          <SectionHeader icon={FileDigit} title="Paper Information" />
          <div className="space-y-3">
            <InfoRow 
              icon={FileText} 
              label="Title" 
              value={evaluationData?.metadata?.title} 
            />
            <InfoRow 
              icon={Link2} 
              label="DOI" 
              value={evaluationData?.metadata?.doi}
              externalLink={`https://www.doi.org/${evaluationData?.metadata?.doi}`}
            />
            <InfoRow 
              icon={Calendar} 
              label="Published" 
              value={formatDate(evaluationData?.metadata?.publicationDate)}
            />
            <InfoRow 
              icon={Atom} 
              label="ORKG ID" 
              value={orkgPaperData?.id}
              externalLink={orkgPaperData?.id 
                ? `http://www.orkg.org/paper/${orkgPaperData.id}` 
                : undefined
              }
            />
          </div>
        </div>

        {/* Section 4: Research Problem Badge */}
        {showResearchProblem && (
          <div className="p-4 border-b">
            <SectionHeader icon={ClipboardCheck} title="Research Problem" />
            <div className="flex items-center">
              {evaluationData.researchProblems.selectedProblem?.isLLMGenerated ? (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-[#1E90FF] text-white px-3 py-1"
                  >
                    AI-Generated Research Problem
                  </Badge>
                  <Sparkles className="h-5 w-5 text-[#1E90FF]" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-[#E86161] text-white px-3 py-1"
                  >
                    ORKG Research Problem
                  </Badge>
                  <Atom className="h-5 w-5 text-[#E86161]" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5: Template Badge */}
        {showTemplate && (
          <div className="p-4">
            <SectionHeader icon={ClipboardCheck} title="Template" />
            <div className="flex items-center">
              {evaluationData?.templates?.llm_template ? (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-[#1E90FF] text-white px-3 py-1"
                  >
                    AI-Generated Template
                  </Badge>
                  <Sparkles className="h-5 w-5 text-[#1E90FF]" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-[#E86161] text-white px-3 py-1"
                  >
                    ORKG Template
                  </Badge>
                  <Atom className="h-5 w-5 text-[#E86161]" />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaperInfoSection;