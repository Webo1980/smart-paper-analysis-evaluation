// src/components/FormContainer.jsx
import React, { useState, useEffect } from 'react';
import ProgressNav from './Navigation/ProgressNav';
import LoginForm from './LoginForm';
// import IntroPage from './IntroPage';
import UserInfoPage from './UserInfo';

const FormContainer = ({ onNotification }) => {
  const [currentStep, setCurrentStep] = useState('login');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [evaluationData, setEvaluationData] = useState(null);

  const stepSequence = [
    'login',
    'intro',
    'userInfo',
    'metadata',
    'research',
    'template',
    'property',
    'system',
    'innovation',
    'comparison',
    'final'
  ];

  const handleLogin = async (token) => { // this is wrong and not needed
    try {
      const response = await window.fs.readFile(`/src/data/evaluations/${token}.json`);
      const data = JSON.parse(new TextDecoder().decode(response));
      console.log(data);
      setEvaluationData(data);
      setCurrentStep('intro');
      console.log(currentStep);
    } catch (err) {
      onNotification({
        title: 'Error',
        description: 'Invalid evaluation token',
        type: 'error'
      });
    }
  };
  console.log(currentStep);
  return (
    <div className="min-h-screen bg-gray-50">
      {currentStep !== 'login' && (
        <ProgressNav
          currentStep={currentStep}
          completedSteps={completedSteps}
          stepSequence={stepSequence}
        />
      )}
      <div className="container mx-auto px-4">
        {currentStep === 'login' && <LoginForm onLogin={handleLogin} />}
        {currentStep === 'intro' && <IntroPage onProceed={() => setCurrentStep('userInfo')} />}
        {currentStep === 'userInfo' && (
          <UserInfoPage
            onNext={() => setCurrentStep('metadata')}
            onPrevious={() => setCurrentStep('intro')}
          />
        )}
        {currentStep !== 'login' && currentStep !== 'intro' && currentStep !== 'userInfo' && (
          <EvaluationForm 
            evaluationData={evaluationData}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        )}
      </div>
    </div>
  );
};

export default FormContainer;