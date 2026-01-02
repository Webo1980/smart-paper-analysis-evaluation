import React from 'react';
import { Check } from 'lucide-react';

const ProgressNav = ({ steps, currentStep, onStepChange }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <nav className="py-4 pl-9">
      <ol className="flex items-center w-full text-xs text-gray-900 font-medium sm:text-base">
        {steps.map((step, index) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = index < currentStepIndex;
          const isLastStep = index === steps.length - 1;
          const shouldShowLine = !isLastStep;
          const lineColor = index < currentStepIndex ? 'bg-red-600' : 'bg-gray-200';
          const isNavigable = index <= currentStepIndex;

          return (
            <li
              key={step.id}
              className={`flex relative items-center w-full ${isCurrent ? 'text-red-600' : 'text-gray-900'}`}
            >
              <div 
                className={`flex flex-col items-center w-full ${isNavigable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => isNavigable && onStepChange(step.id)}
              >
                {/* Progress line connector */}
                {shouldShowLine && (
                  <div
                    className={`absolute top-1/4 left-1/2 w-full h-0.5 ${lineColor}`}
                    style={{
                      transform: 'translateY(-50%) translateX(10px)', 
                      zIndex: -1,
                    }}
                  />
                )}

                {/* Step circle and label */}
                <div className="relative z-10 flex flex-col items-center">
                  <span
                    className={`w-6 h-6 ${isCompleted ? 'bg-red-600' : isCurrent ? 'bg-red-100' : 'bg-gray-50'} 
                    border-2 ${isCompleted ? 'border-transparent' : isCurrent ? 'border-red-600' : 'border-gray-200'} 
                    rounded-full flex items-center justify-center mb-2 text-sm 
                    ${isCompleted ? 'text-white' : isCurrent ? 'text-red-600' : 'text-gray-500'}
                    lg:w-10 lg:h-10
                    ${isNavigable ? 'hover:opacity-80' : 'opacity-50'}`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>
                  <div className="flex flex-col items-center text-center">
                    <span className="mb-1">{step.label}</span>
                    <span className="text-xs text-gray-500">
                      Estimated: {step.estimatedTime}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressNav;