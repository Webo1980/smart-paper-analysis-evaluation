//src\components\IntroPage\index.jsx
import React, { useState } from 'react';
import { TermsDialog } from './TermsDialog';

const IntroPage = ({ onNext }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleProceed = () => {
    if (termsAccepted) {
      onNext();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#E86161] mb-4">
          Welcome to Smart Paper Analysis
        </h1>
        <p className="text-xl text-gray-600">
          Evaluate and Analyze Research Papers with AI
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">About the System</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              The Smart Paper Analysis System uses advanced AI to help analyze and 
              evaluate research papers for quality and consistency.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Automates metadata extraction</li>
              <li>Identifies research problems and contributions</li>
              <li>Analyzes research methodology</li>
              <li>Evaluates paper structure and clarity</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Evaluation Process</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              As an evaluator, you will assess the system's performance across:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Metadata accuracy</li>
              <li>Research field identification</li>
              <li>Research problem discovery</li>
              <li>Template analysis</li>
              <li>Property value generation</li>
              <li>Overall system effectiveness</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="h-4 w-4 text-[#E86161] border-gray-300 rounded focus:ring-[#E86161]"
          />
          <label htmlFor="terms" className="text-gray-700">
            I accept the{' '}
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowTerms(true);
              }}
              className="text-[#E86161] underline hover:text-[#c54545]"
            >
              terms and conditions
            </button>
          </label>
        </div>

        <button
          onClick={handleProceed}
          disabled={!termsAccepted}
          className={`w-full p-4 rounded-lg text-white transition-colors duration-200
            ${termsAccepted 
              ? 'bg-[#E86161] hover:bg-[#c54545]' 
              : 'bg-gray-300 cursor-not-allowed'}`}
        >
          Begin Evaluation
        </button>
      </div>

      <TermsDialog open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
};

export default IntroPage;