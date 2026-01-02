// src\components\evaluation\base\ContentDisplayComponent.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Component to display content with show more/show less functionality
 * Can be used across all evaluation modules for displaying content with truncation
 */
const ContentDisplayComponent = ({
  content,
  title,
  maxLength = 50,
  backgroundColor = 'bg-gray-50',
  contentClassName = ''
}) => {
  const [showFull, setShowFull] = useState(false);
  
  // Check if content is long enough to need truncation
  const isLong = content && content.length > maxLength;
  
  // Get display content
  const displayContent = isLong && !showFull 
    ? `${content.substring(0, maxLength)}...` 
    : content;
  
  return (
    <div className={`${backgroundColor} p-2 rounded border`}>
      <div className="flex items-center justify-between">
        <strong className="text-xs">{title}: </strong>
        {isLong && (
          <button 
            onClick={() => setShowFull(!showFull)} 
            className="text-blue-600 text-xs flex items-center"
          >
            {showFull ? 'Show less' : 'Show more'} 
            {showFull ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </button>
        )}
      </div>
      <div className={`mt-1 ${isLong ? 'pt-1 border-t' : ''}`}>
        <div className={`break-words ${contentClassName}`}>
          {displayContent || <span className="text-gray-400 italic">Empty</span>}
        </div>
      </div>
    </div>
  );
};

export default ContentDisplayComponent;