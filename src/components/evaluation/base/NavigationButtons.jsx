// src\components\evaluation\base\NavigationButtons.jsx
import React from 'react';
import { Button } from '../../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Base component for navigation buttons
 * Can be used across different assessment modules
 */
const NavigationButtons = ({ 
  onPrevious, 
  onNext, 
  showNext = true,
  previousLabel = "Previous",
  nextLabel = "Next",
  previousClassName = "!bg-[#E86161] hover:!bg-[#c54545] text-white",
  nextClassName = "!bg-[#E86161] hover:!bg-[#c54545] text-white"
}) => {
  return (
    <div className="flex justify-between mt-6">
      {onPrevious && (
        <Button
          variant="outline"
          onClick={onPrevious}
          className={`mb-4 flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none ${previousClassName}`}
        >
          <ArrowLeft className="h-4 w-4" />
          {previousLabel}
        </Button>
      )}
      
      {showNext && onNext && (
        <Button
          onClick={onNext}
          className={`mb-4 flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none ${nextClassName}`}
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default NavigationButtons;