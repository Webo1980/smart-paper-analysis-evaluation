// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from './context/FormContext';
import * as Toast from '@radix-ui/react-toast';
import { FormProvider } from './context/FormContext';
import { Header, Footer } from './components/layout/';
import { EvaluationProvider } from './context/EvaluationContext';
import LoginForm from './components/LoginForm';
import IntroPage from './components/IntroPage';
import UserInfo from './components/UserInfo';
import PaperInfoSection from './components/EvaluationForm/sections/PaperInfoSection';
import Notification from './components/shared/Notification';
import ProgressNav from './components/Navigation/ProgressNav';
import { calculateExpertiseWeight } from './config/expertiseWeights';
import { InnovationSection } from './components/evaluation/InnovationSection';
import { FinalVerdictSection } from './components/evaluation/FinalVerdictSection';
import { RAGHighlightSection } from './components/evaluation/RAGHighlightSection';

import { 
  MetadataAnalysisSection,
  ResearchFieldAnalysisSection,
  ResearchProblemSection,
  TemplateAnalysisSection,
  ContentAnalysisSection,
  SystemPerformanceSection,
  ComparativeAnalysisSection 
} from './components/EvaluationForm/sections';

const STEPS = [
  { index: 0,  id: 'introduction', label: 'Introduction', estimatedTime: '1-2 min' },
  { index: 1,  id: 'userInfo', label: 'User Info', estimatedTime: '1-2 min' },
  { index: 2,  id: 'metadata', label: 'Metadata', estimatedTime: '1-2 min' },
  { index: 3,  id: 'researchField', label: 'Research Field', estimatedTime: '1-2 min' },
  { index: 4,  id: 'researchProblem', label: 'Research Problem', estimatedTime: '1-2 min' },
  { index: 5,  id: 'template', label: 'Template', estimatedTime: '1-2 min' },
  { index: 6,  id: 'property', label: 'Content', estimatedTime: '1-2 min' },
  { index: 7,  id: 'system', label: 'System', estimatedTime: '1-2 min' },
  { index: 8,  id: 'innovation', label: 'Innovation', estimatedTime: '1-2 min' },
  { index: 9,  id: 'comparison', label: 'Comparison', estimatedTime: '1-2 min' },
  { index: 10,  id: 'RAGHighlightSection', label: 'Extension', estimatedTime: '3-4 min' },
  { index: 11,   id: 'conclusion', label: 'Conclusion', estimatedTime: '1-2 min' }
];

const expertiseToMultiplier = (expertiseWeight) => {
  const safeExpertiseWeight = Math.max(1, Math.min(5, expertiseWeight || 1));
  return 0.6 + (0.2 * safeExpertiseWeight);
};

const AppContent = () => {
  const formContext = useForm();
  const { setEvaluationData, setOrkgData } = formContext || {};

  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('auth');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed || {
        isAuthenticated: false,
        token: null,
        evaluationData: null
      };
    } catch (error) {
      console.error("Error parsing auth from localStorage:", error);
      return {
        isAuthenticated: false,
        token: null,
        evaluationData: null
      };
    }
  });
  
  const [currentStep, setCurrentStep] = useState(() => {
    if (!auth.isAuthenticated) return 'login';
    
    try {
      const savedStep = localStorage.getItem('currentStep');
      return savedStep && savedStep !== 'login' ? savedStep : 'introduction';
    } catch (error) {
      console.error("Error retrieving currentStep from localStorage:", error);
      return 'introduction';
    }
  });

  const [notification, setNotification] = useState(null);
  const [orkgPaperData, setOrkgPaperData] = useState(null);
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('userInfo');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed || {
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        domainExpertise: '',
        evaluationExperience: '',
        orkgExperience: ''
      };
    } catch (error) {
      console.error("Error parsing userInfo from localStorage:", error);
      return {
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        domainExpertise: '',
        evaluationExperience: '',
        orkgExperience: ''
      };
    }
  });

  // Calculate expertise values using useMemo to prevent infinite loops
  const expertiseCalculations = useMemo(() => {
    if (userInfo.role && userInfo.domainExpertise && userInfo.evaluationExperience) {
      try {
        const expertiseWeight = calculateExpertiseWeight(
          userInfo.role,
          userInfo.domainExpertise,
          userInfo.evaluationExperience,
          userInfo.orkgExperience
        );
        
        const multiplier = expertiseToMultiplier(expertiseWeight.finalWeight);
        
        return {
          expertiseWeight: expertiseWeight.finalWeight,
          expertiseMultiplier: multiplier,
          weightComponents: expertiseWeight
        };
      } catch (error) {
        console.error("Error calculating expertise:", error);
        return {
          expertiseWeight: 1,
          expertiseMultiplier: 1,
          weightComponents: null
        };
      }
    }
    
    return {
      expertiseWeight: 1,
      expertiseMultiplier: 1,
      weightComponents: null
    };
  }, [userInfo.role, userInfo.domainExpertise, userInfo.evaluationExperience, userInfo.orkgExperience]);

  // Combine userInfo with calculated expertise values
  const fullUserInfo = useMemo(() => ({
    ...userInfo,
    ...expertiseCalculations
  }), [userInfo, expertiseCalculations]);

  // Handle step changes
  const handleStepChange = useCallback((newStep) => {
    console.log('Changing step:', { from: currentStep, to: newStep });
    if (newStep !== 'login') {
      setCurrentStep(newStep);
    }
  }, [currentStep]);

  // Effect for local storage
  useEffect(() => {
    try {
      localStorage.setItem('auth', JSON.stringify(auth));
      if (auth.isAuthenticated && currentStep !== 'login') {
        localStorage.setItem('currentStep', currentStep);
      }
      localStorage.setItem('userInfo', JSON.stringify(fullUserInfo));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [auth, currentStep, fullUserInfo]);

  // Effect for syncing with FormContext
  useEffect(() => {
    if (auth.evaluationData && setEvaluationData) {
      setEvaluationData(auth.evaluationData);
    }
  }, [auth.evaluationData, setEvaluationData]);

  // Effect for fetching ORKG data
  useEffect(() => {
    const fetchOrkgData = async () => {
      if (!auth?.evaluationData?.metadata?.doi) {
        console.log('No DOI available for ORKG lookup');
        return;
      }
      
      try {
        console.log('Fetching ORKG data for DOI:', auth.evaluationData.metadata.doi);
        
        const response = await fetch(
          `https://api.github.com/repos/${import.meta.env.VITE_GITHUB_USERNAME}/${import.meta.env.VITE_GITHUB_REPO}/contents/src/data/evaluations/orkg_papers_20250204_163723.csv`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3.raw'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ORKG data: ${response.statusText}`);
        }

        const csv = await response.text();
        const rows = csv.split('\n').filter(line => line.trim());
        
        if (rows.length === 0) {
          throw new Error('Empty CSV file');
        }

        const headers = rows[0].split(',').map(h => h.trim());
        const authorStartIndex = headers.indexOf('author1');

        const papers = rows.slice(1).map(line => {
          const columns = line.split(',').map(col => col.trim());
          
          return {
            id: columns[0],
            doi: columns[1],
            title: columns[2],
            publication_year: columns[3],
            venue: columns[4],
            research_field_id: columns[5],
            research_field_name: columns[6],
            template_id: columns[7],
            template_name: columns[8],
            validated_url: columns[9],
            research_problem_id: columns[10],
            research_problem_name: columns[11],
            authors: columns.slice(authorStartIndex).filter(author => author)
          };
        });

        const paper = papers.find(p => p.doi === auth.evaluationData.metadata.doi);
        
        if (paper) {
          console.log('Found matching ORKG paper:', paper);
          setOrkgPaperData(paper);
          if (setOrkgData) {
            setOrkgData(paper);
          }
        } else {
          console.log('No matching paper found in ORKG for DOI:', auth.evaluationData.metadata.doi);
        }
      } catch (error) {
        console.error("Error loading ORKG data:", error);
        setNotification({
          type: 'error',
          message: 'Failed to load ORKG data. Some comparisons may be unavailable.'
        });
      }
    };

    if (auth.isAuthenticated) {
      fetchOrkgData();
    }
  }, [auth.isAuthenticated, auth?.evaluationData?.metadata?.doi, setOrkgData]);

  const handleLogout = useCallback(() => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset auth state
    setAuth({
      isAuthenticated: false,
      token: null,
      evaluationData: null,
      evaluationState: null
    });
    
    // Reset current step
    setCurrentStep('login');
    
    // Reset user info
    setUserInfo({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      domainExpertise: '',
      evaluationExperience: '',
      orkgExperience: ''
    });
    
    // Reset ORKG data
    setOrkgPaperData(null);
    
    // Clear notification
    setNotification(null);
  }, []);

  // Then update the Header component call (around line 337)
  <Header steps={STEPS} onLogout={handleLogout} />

  const handleLogin = useCallback(async ({ token, data }) => {
    console.log('Login successful:', { token: token ? 'present' : 'missing', data: data ? 'present' : 'missing' });
    
    setAuth({
      isAuthenticated: true,
      token,
      evaluationData: data
    });
    
    if (setEvaluationData) {
      setEvaluationData(data);
    }
    
    setCurrentStep('introduction');
  }, [setEvaluationData]);

  const renderEvaluationSection = useCallback((props) => {
    const sections = {
      metadata: MetadataAnalysisSection,
      researchField: ResearchFieldAnalysisSection,
      researchProblem: ResearchProblemSection,
      template: TemplateAnalysisSection,
      property: ContentAnalysisSection,
      system: SystemPerformanceSection,
      innovation: InnovationSection,
      comparison: ComparativeAnalysisSection,
      RAGHighlightSection: RAGHighlightSection,
      conclusion: FinalVerdictSection
    };

    const Section = sections[currentStep];
    
    if (!Section) {
      console.warn(`No section found for step: ${currentStep}`);
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Section not found for: {currentStep}</p>
        </div>
      );
    }
    
    return <Section {...props} />;
  }, [currentStep]);

  const getCommonProps = useCallback(() => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    
    return {
      evaluationData: auth.evaluationData,
      orkgPaperData,
      onNext: () => {
        if (currentIndex < STEPS.length - 1) {
          handleStepChange(STEPS[currentIndex + 1].id);
        }
      },
      onPrevious: () => {
        if (currentIndex > 0) {
          handleStepChange(STEPS[currentIndex - 1].id);
        }
      }
    };
  }, [auth.evaluationData, orkgPaperData, currentStep, handleStepChange]);

  const renderContent = useCallback(() => {
    // Always show login if not authenticated
    if (!auth.isAuthenticated) {
      console.log('Rendering login form');
      return (
        <div className="max-w-md mx-auto mt-8">
          <LoginForm onLogin={handleLogin} />
        </div>
      );
    }

    const commonProps = getCommonProps();
    const currentStepData = STEPS.find(step => step.id === currentStep);
    const currentStepIndex = currentStepData?.index;

    console.log('Rendering authenticated content:', { currentStep, currentStepIndex });

    // Handle special steps
    if (currentStep === 'introduction') {
      return <IntroPage {...commonProps} />;
    }
    
    if (currentStep === 'userInfo') {
      return (
        <UserInfo 
          data={userInfo} 
          onChange={setUserInfo} 
          {...commonProps} 
        />
      );
    }

    // Default layout with sidebar
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {renderEvaluationSection({ ...commonProps, userInfo: fullUserInfo })}
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <PaperInfoSection 
              evaluationData={auth.evaluationData}
              orkgPaperData={orkgPaperData}
              userInfo={fullUserInfo}
              currentStepIndex={currentStepIndex}
            />
          </div>
        </div>
      </div>
    );
  }, [
    auth.isAuthenticated, 
    auth.evaluationData, 
    orkgPaperData, 
    currentStep, 
    userInfo, 
    fullUserInfo,
    handleLogin,
    getCommonProps,
    renderEvaluationSection
  ]);

  return (
    <Toast.Provider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header steps={STEPS} />
        
        {auth.isAuthenticated && currentStep !== 'login' && (
          <div className="sticky top-16 z-40 bg-white border-b">
            <ProgressNav 
              steps={STEPS} 
              currentStep={currentStep} 
              onStepChange={handleStepChange} 
            />
          </div>
        )}
        
        <main className="flex-grow pt-16">
          <div className="container mx-auto px-4 py-6">
            {renderContent()}
          </div>
        </main>
        
        <Footer />
        
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </Toast.Provider>
  );
};

const App = () => {
  console.log('App component mounting');
  
  return (
    <FormProvider>
      <EvaluationProvider>
        <AppContent />
      </EvaluationProvider>
    </FormProvider>
  );
};

export default App;