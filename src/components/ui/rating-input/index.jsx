import React from 'react';
import { Star } from 'lucide-react';

export const RatingInput = ({ value = 0, onChange, maxRating = 5 }) => {
  const handleClick = (rating) => {
    // If clicking the same rating twice, clear it
    if (rating === value) {
      onChange(0);
    } else {
      onChange(rating);
    }
  };

  return (
    <div 
      className="flex gap-1" 
      role="radiogroup" 
      aria-label="Rating"
    >
      {[...Array(maxRating)].map((_, index) => {
        const rating = index + 1;
        const isFilled = rating <= value;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            className={`
              p-1 hover:scale-110 transition-transform
              ${isFilled ? 'text-[#E86161]' : 'text-gray-300'}
            `}
            aria-label={`Rate ${rating} out of ${maxRating}`}
            aria-checked={rating === value}
            role="radio"
          >
            <Star
              className={`w-6 h-6 ${isFilled ? 'fill-current' : ''}`}
            />
          </button>
        );
      })}

      <div className="ml-2 text-sm text-gray-500" aria-live="polite">
        {value > 0 ? `${value} out of ${maxRating}` : 'No rating selected'}
      </div>
    </div>
  );
};

export default RatingInput;