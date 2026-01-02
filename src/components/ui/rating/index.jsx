import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const Rating = ({ 
  value = 0, 
  onValueChange, 
  max = 5,
  size = 24,
  color = "#E86161" // Red color matching your theme
}) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onValueChange(starValue)}
            className={cn(
              "transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1",
              isFilled ? "text-red-500" : "text-gray-300"
            )}
          >
            <Star
              size={size}
              fill={isFilled ? color : "none"}
              className={cn(
                "transition-colors",
                isFilled ? "stroke-red-500" : "stroke-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default Rating;