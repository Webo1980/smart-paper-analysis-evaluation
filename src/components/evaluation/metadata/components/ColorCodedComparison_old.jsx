// src\components\evaluation\metadata\components\ColorCodedComparison.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Component for displaying color-coded comparison between ORKG and extracted values
 */
const ColorCodedComparison = ({ 
  fieldName, 
  orkgValue, 
  extractedValue 
}) => {
  const [showFullOrkg, setShowFullOrkg] = useState(false);
  const [showFullExtracted, setShowFullExtracted] = useState(false);
  
  // Handle empty or null values
  const safeOrkgValue = orkgValue || '';
  const safeExtractedValue = extractedValue || '';
  const fieldLower = fieldName?.toLowerCase() || '';
  
  // Determine if values are long (more than 50 characters)
  const isOrkgLong = safeOrkgValue.length > 50;
  const isExtractedLong = safeExtractedValue.length > 50;
  
  // For title, highlight words that match and those that don't
  if (fieldLower === 'title') {
    const orkgWords = safeOrkgValue.split(/\s+/);
    const extractedWords = safeExtractedValue.split(/\s+/);
    const orkgWordSet = new Set(orkgWords.map(w => w.toLowerCase()));
    
    return (
      <div className="mt-2 space-y-2">
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">ORKG: </strong>
            {isOrkgLong && (
              <button 
                onClick={() => setShowFullOrkg(!showFullOrkg)} 
                className="text-blue-600 text-xs flex items-center"
              >
                {showFullOrkg ? 'Show less' : 'Show more'} 
                {showFullOrkg ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            )}
          </div>
          <div className={`mt-1 ${isOrkgLong ? 'pt-1 border-t' : ''}`}>
            <div className="break-words">
              {isOrkgLong && !showFullOrkg ? (
                <>{orkgWords.slice(0, 10).join(' ')} <span className="text-gray-500">...</span></>
              ) : (
                orkgWords.map((word, idx) => (
                  <span key={`orkg-${idx}`} className="mx-1">
                    {word}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">Extracted: </strong>
            {isExtractedLong && (
              <button 
                onClick={() => setShowFullExtracted(!showFullExtracted)} 
                className="text-blue-600 text-xs flex items-center"
              >
                {showFullExtracted ? 'Show less' : 'Show more'} 
                {showFullExtracted ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            )}
          </div>
          <div className={`mt-1 ${isExtractedLong ? 'pt-1 border-t' : ''}`}>
            <div className="break-words">
              {isExtractedLong && !showFullExtracted ? (
                <>
                  {extractedWords.slice(0, 10).map((word, idx) => {
                    const isMatched = orkgWordSet.has(word.toLowerCase());
                    return (
                      <span 
                        key={`ext-${idx}`} 
                        className={isMatched ? "bg-green-100 px-1 rounded mx-1" : "bg-red-100 px-1 rounded mx-1"}
                      >
                        {word}
                      </span>
                    );
                  })}
                  <span className="text-gray-500"> ...</span>
                </>
              ) : (
                extractedWords.map((word, idx) => {
                  const isMatched = orkgWordSet.has(word.toLowerCase());
                  return (
                    <span 
                      key={`ext-${idx}`} 
                      className={isMatched ? "bg-green-100 px-1 rounded mx-1" : "bg-red-100 px-1 rounded mx-1"}
                    >
                      {word}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <div><span className="bg-green-100 px-1 rounded">Green</span>: Words in original</div>
          <div><span className="bg-red-100 px-1 rounded">Red</span>: New/missing words</div>
        </div>
      </div>
    );
  }
  
  // For DOI, highlight the prefix, separator, and suffix
  if (fieldLower === 'doi') {
    const prefixMatch = safeExtractedValue.match(/10\.\d{4,}/);
    const hasPrefix = prefixMatch !== null;
    const hasSeparator = safeExtractedValue.includes('/');
    const hasSuffix = hasSeparator && safeExtractedValue.split('/')[1]?.length > 0;
    
    return (
      <div className="mt-2 space-y-2">
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">ORKG: </strong>
            {isOrkgLong && (
              <button 
                onClick={() => setShowFullOrkg(!showFullOrkg)} 
                className="text-blue-600 text-xs flex items-center"
              >
                {showFullOrkg ? 'Show less' : 'Show more'} 
                {showFullOrkg ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            )}
          </div>
          <div className={`mt-1 ${isOrkgLong ? 'pt-1 border-t' : ''}`}>
            <div className="break-words">
              {isOrkgLong && !showFullOrkg ? (
                <>{safeOrkgValue.substring(0, 50)} <span className="text-gray-500">...</span></>
              ) : (
                safeOrkgValue
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">Extracted: </strong>
            {isExtractedLong && (
              <button 
                onClick={() => setShowFullExtracted(!showFullExtracted)} 
                className="text-blue-600 text-xs flex items-center"
              >
                {showFullExtracted ? 'Show less' : 'Show more'} 
                {showFullExtracted ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            )}
          </div>
          <div className={`mt-1 ${isExtractedLong ? 'pt-1 border-t' : ''}`}>
            <div className="break-words">
              {isExtractedLong && !showFullExtracted ? (
                <>
                  {hasSeparator ? (
                    <>
                      <span className={hasPrefix ? "bg-green-100 px-1 rounded" : "bg-red-100 px-1 rounded"}>
                        {safeExtractedValue.split('/')[0]}
                      </span>
                      <span className="bg-blue-100 px-1 rounded">/</span>
                      <span className={hasSuffix ? "bg-green-100 px-1 rounded" : "bg-red-100 px-1 rounded"}>
                        {safeExtractedValue.split('/')[1]?.substring(0, 20)}
                      </span>
                      {safeExtractedValue.split('/')[1]?.length > 20 && <span className="text-gray-500">...</span>}
                    </>
                  ) : (
                    <>
                      <span className={hasPrefix ? "bg-green-100 px-1 rounded" : "bg-red-100 px-1 rounded"}>
                        {safeExtractedValue.substring(0, 50)}
                      </span>
                      <span className="bg-red-100 px-1 rounded">(missing separator)</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  {hasSeparator ? (
                    safeExtractedValue.split('/').map((part, idx) => {
                      if (idx === 0) {
                        // Prefix part
                        const isPrefixValid = part.match(/10\.\d{4,}/);
                        return (
                          <span 
                            key="prefix" 
                            className={isPrefixValid ? "bg-green-100 px-1 rounded" : "bg-red-100 px-1 rounded"}
                          >
                            {part}
                          </span>
                        );
                      } else {
                        // Suffix part
                        return (
                          <React.Fragment key={`suffix-${idx}`}>
                            <span className="bg-blue-100 px-1 rounded">/</span>
                            <span className={part.length > 0 ? "bg-green-100 px-1 rounded" : "bg-red-100 px-1 rounded"}>
                              {part}
                            </span>
                          </React.Fragment>
                        );
                      }
                    })
                  ) : (
                    <>
                      <span className={hasPrefix ? "bg-green-100 px-1 rounded" : "bg-red-100 px-1 rounded"}>
                        {safeExtractedValue}
                      </span>
                      <span className="bg-red-100 px-1 rounded ml-1">(missing separator)</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div><span className="bg-green-100 px-1 rounded">Green</span>: Valid parts</div>
          <div><span className="bg-red-100 px-1 rounded">Red</span>: Invalid/missing parts</div>
          <div><span className="bg-blue-100 px-1 rounded">Blue</span>: Separator</div>
        </div>
      </div>
    );
  }
  
  // For authors comparison
  if (fieldLower === 'authors') {
    const orkgAuthors = safeOrkgValue.split(/[;,]/).map(a => a.trim()).filter(a => a);
    const extractedAuthors = safeExtractedValue.split(/[;,]/).map(a => a.trim()).filter(a => a);
    
    return (
      <div className="mt-2 space-y-2">
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">ORKG ({orkgAuthors.length} authors): </strong>
            {isOrkgLong && (
              <button 
                onClick={() => setShowFullOrkg(!showFullOrkg)} 
                className="text-blue-600 text-xs flex items-center"
              >
                {showFullOrkg ? 'Show less' : 'Show more'} 
                {showFullOrkg ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            )}
          </div>
          <div className={`mt-1 ${isOrkgLong ? 'pt-1 border-t' : ''}`}>
            <div className="break-words">
              {isOrkgLong && !showFullOrkg ? (
                <>
                  {orkgAuthors.slice(0, 2).map((author, idx) => (
                    <span key={`orkg-${idx}`} className="bg-blue-100 px-1 rounded mx-1">
                      {author}
                    </span>
                  ))}
                  {orkgAuthors.length > 2 && <span className="text-gray-500">... and {orkgAuthors.length - 2} more</span>}
                </>
              ) : (
                orkgAuthors.map((author, idx) => (
                  <span key={`orkg-${idx}`} className="bg-blue-100 px-1 rounded mx-1">
                    {author}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">Extracted ({extractedAuthors.length} authors): </strong>
            {isExtractedLong && (
              <button 
                onClick={() => setShowFullExtracted(!showFullExtracted)} 
                className="text-blue-600 text-xs flex items-center"
              >
                {showFullExtracted ? 'Show less' : 'Show more'} 
                {showFullExtracted ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            )}
          </div>
          <div className={`mt-1 ${isExtractedLong ? 'pt-1 border-t' : ''}`}>
            <div className="break-words">
              {isExtractedLong && !showFullExtracted ? (
                <>
                  {extractedAuthors.slice(0, 2).map((author, idx) => {
                    const hasComma = author.includes(',');
                    return (
                      <span 
                        key={`ext-${idx}`} 
                        className={idx < orkgAuthors.length ? "bg-green-100 px-1 rounded mx-1" : "bg-yellow-100 px-1 rounded mx-1"}
                      >
                        {author} {hasComma ? "" : "(no comma)"}
                      </span>
                    );
                  })}
                  {extractedAuthors.length > 2 && <span className="text-gray-500">... and {extractedAuthors.length - 2} more</span>}
                  {extractedAuthors.length < orkgAuthors.length && (
                    <span className="bg-red-100 px-1 rounded mx-1">
                      Missing {orkgAuthors.length - extractedAuthors.length} authors
                    </span>
                  )}
                </>
              ) : (
                <>
                  {extractedAuthors.map((author, idx) => {
                    const hasComma = author.includes(',');
                    return (
                      <span 
                        key={`ext-${idx}`} 
                        className={idx < orkgAuthors.length ? "bg-green-100 px-1 rounded mx-1" : "bg-yellow-100 px-1 rounded mx-1"}
                      >
                        {author} {hasComma ? "" : "(no comma)"}
                      </span>
                    );
                  })}
                  {extractedAuthors.length < orkgAuthors.length && (
                    <span className="bg-red-100 px-1 rounded mx-1">
                      Missing {orkgAuthors.length - extractedAuthors.length} authors
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div><span className="bg-green-100 px-1 rounded">Green</span>: Present authors</div>
          <div><span className="bg-yellow-100 px-1 rounded">Yellow</span>: Extra authors</div>
          <div><span className="bg-red-100 px-1 rounded">Red</span>: Missing authors</div>
          <div><span className="bg-blue-100 px-1 rounded">Blue</span>: Original format</div>
        </div>
      </div>
    );
  }
  
  // For year comparison
  if (fieldLower === 'year') {
    const isValid4Digit = safeExtractedValue.match(/^(19|20)\d{2}$/);
    const isReasonableRange = parseInt(safeExtractedValue) >= 1900 && 
                             parseInt(safeExtractedValue) <= new Date().getFullYear() + 2;
    
    return (
      <div className="mt-2 space-y-2">
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">ORKG: </strong>
          </div>
          <div className="mt-1">
            <span className="bg-blue-100 px-1 rounded">
              {safeOrkgValue || '<empty>'}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded border">
          <div className="flex items-center justify-between">
            <strong className="text-xs">Extracted: </strong>
          </div>
          <div className="mt-1">
            <span 
              className={
                isValid4Digit && isReasonableRange ? "bg-green-100 px-1 rounded" : 
                !isValid4Digit ? "bg-red-100 px-1 rounded" :
                "bg-yellow-100 px-1 rounded"
              }
            >
              {safeExtractedValue || '<empty>'}
            </span>
            {!isValid4Digit && (
              <span className="ml-2 text-red-600">(Not 4-digit format)</span>
            )}
            {!isReasonableRange && (
              <span className="ml-2 text-red-600">(Outside reasonable range)</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <div><span className="bg-green-100 px-1 rounded">Green</span>: Valid year</div>
          <div><span className="bg-red-100 px-1 rounded">Red</span>: Invalid format</div>
          <div><span className="bg-yellow-100 px-1 rounded">Yellow</span>: Valid format but unusual value</div>
        </div>
      </div>
    );
  }
  
  // Default comparison with highlighting of abbreviations
  const highlightAbbreviations = (text) => {
    if (!text) return '';
    
    // Find all abbreviations (all caps words of 2+ letters)
    return text.replace(/\b[A-Z]{2,}\b/g, match => {
      return `<span class="bg-yellow-200 px-1 rounded">${match}</span>`;
    });
  };
  
  return (
    <div className="mt-2 space-y-2">
      <div className="bg-gray-50 p-2 rounded border">
        <div className="flex items-center justify-between">
          <strong className="text-xs">ORKG: </strong>
          {isOrkgLong && (
            <button 
              onClick={() => setShowFullOrkg(!showFullOrkg)} 
              className="text-blue-600 text-xs flex items-center"
            >
              {showFullOrkg ? 'Show less' : 'Show more'} 
              {showFullOrkg ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </button>
          )}
        </div>
        <div className={`mt-1 ${isOrkgLong ? 'pt-1 border-t' : ''}`}>
          <div className="break-words">
            {isOrkgLong && !showFullOrkg ? (
              <span dangerouslySetInnerHTML={{
                __html: highlightAbbreviations(safeOrkgValue.substring(0, 50) + '...')
              }} />
            ) : (
              <span dangerouslySetInnerHTML={{
                __html: highlightAbbreviations(safeOrkgValue)
              }} />
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-2 rounded border">
        <div className="flex items-center justify-between">
          <strong className="text-xs">Extracted: </strong>
          {isExtractedLong && (
            <button 
              onClick={() => setShowFullExtracted(!showFullExtracted)} 
              className="text-blue-600 text-xs flex items-center"
            >
              {showFullExtracted ? 'Show less' : 'Show more'} 
              {showFullExtracted ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </button>
          )}
        </div>
        <div className={`mt-1 ${isExtractedLong ? 'pt-1 border-t' : ''}`}>
          <div className="break-words">
            {isExtractedLong && !showFullExtracted ? (
              <span dangerouslySetInnerHTML={{
                __html: highlightAbbreviations(safeExtractedValue.substring(0, 50) + '...')
              }} />
            ) : (
              <span dangerouslySetInnerHTML={{
                __html: highlightAbbreviations(safeExtractedValue)
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorCodedComparison;