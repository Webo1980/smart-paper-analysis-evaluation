// src\components\evaluation\metadata\components\FieldSpecificAnalysis.jsx
import React from 'react';

/**
 * Component to display field-specific analysis for different metadata fields
 */
const FieldSpecificAnalysis = ({ 
  fieldName, 
  extractedValue, 
  orkgValue 
}) => {
  // Handle empty or null values
  const safeExtractedValue = extractedValue || '';
  const safeOrkgValue = orkgValue || '';
  
  const fieldLower = fieldName?.toLowerCase() || '';
  
  // Field-specific analysis for DOI
  if (fieldLower === 'doi') {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium">DOI Validity Checks:</p>
        <ul className="list-disc list-inside text-xs">
          <li>Follows Pattern: 
            {safeExtractedValue.match(/10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+/) ? 
              <span className="text-green-600"> Valid DOI pattern</span> : 
              <span className="text-red-600"> Invalid DOI pattern</span>}
          </li>
          <li>Prefix Valid: 
            {safeExtractedValue.match(/10\.\d{4,}/) ? 
              <span className="text-green-600"> Valid prefix</span> : 
              <span className="text-red-600"> Invalid prefix</span>}
          </li>
          <li>Structure Valid: 
            {safeExtractedValue.includes('/') ? 
              <span className="text-green-600"> Proper structure</span> : 
              <span className="text-red-600"> Missing separator</span>}
          </li>
          <li>Prefix Issues: 
            {safeExtractedValue.toLowerCase().startsWith('doi:') || safeExtractedValue.toLowerCase().startsWith('https://doi.org/') ? 
              <span className="text-yellow-600"> Unnecessary prefix present</span> : 
              <span className="text-green-600"> Clean DOI format</span>}
          </li>
        </ul>
      </div>
    );
  }
  
  // Field-specific analysis for authors
  if (fieldLower === 'authors') {
    const orkgAuthorsCount = safeOrkgValue.split(/[;,]/).filter(a => a.trim()).length || 0;
    const extractedAuthorsCount = safeExtractedValue.split(/[;,]/).filter(a => a.trim()).length || 0;
    
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium">Author Analysis:</p>
        <ul className="list-disc list-inside text-xs">
          <li>ORKG Authors: {orkgAuthorsCount}</li>
          <li>Extracted Authors: {extractedAuthorsCount}</li>
          <li>Completeness: {orkgAuthorsCount > 0 ? 
            `${((extractedAuthorsCount / orkgAuthorsCount) * 100).toFixed(0)}%` : 
            "N/A"}
          </li>
          <li>Name Format: 
            {safeExtractedValue.includes(',') ? 
              <span className="text-green-600"> LastName, FirstName format</span> : 
              <span className="text-yellow-600"> FirstName LastName format</span>}
          </li>
          <li>Character Set: 
            {safeExtractedValue.match(/[^a-zA-Z,\.\s;'-]/) ? 
              <span className="text-red-600"> Contains invalid characters: {(safeExtractedValue.match(/[^a-zA-Z,\.\s;'-]/g) || []).join(', ')}</span> : 
              <span className="text-green-600"> Valid character set</span>}
          </li>
        </ul>
      </div>
    );
  }
  
  // Field-specific analysis for title
  if (fieldLower === 'title') {
    // Extract abbreviations
    const extractedAbbr = safeExtractedValue.match(/\b[A-Z]{2,}\b/g) || [];
    const orkgAbbr = safeOrkgValue.match(/\b[A-Z]{2,}\b/g) || [];
    const orkgAbbrSet = new Set(orkgAbbr);
    const newAbbr = extractedAbbr.filter(a => !orkgAbbrSet.has(a));
    
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium">Title Analysis:</p>
        <ul className="list-disc list-inside text-xs">
          <li>ORKG Word Count: {safeOrkgValue.split(/\s+/).length || 0}</li>
          <li>Extracted Word Count: {safeExtractedValue.split(/\s+/).length || 0}</li>
          <li>Word Count Ratio: {safeOrkgValue.split(/\s+/).length > 0 ? 
            `${((safeExtractedValue.split(/\s+/).length / safeOrkgValue.split(/\s+/).length) * 100).toFixed(0)}%` : 
            "N/A"}
          </li>
          <li>Abbreviations: {newAbbr.length > 0 ? 
            <>New abbreviations found: {newAbbr.map((abbr, i) => (
              <span key={i} className="bg-yellow-100 px-1 rounded mx-1">{abbr}</span>
            ))}</> : 
            <span className="text-green-600"> No new abbreviations</span>}
          </li>
          <li>Capitalization: 
            {safeExtractedValue.match(/^[A-Z]/) ? 
              <span className="text-green-600"> Proper capitalization</span> : 
              <span className="text-yellow-600"> Improper capitalization</span>}
          </li>
        </ul>
      </div>
    );
  }
  
  // Field-specific analysis for year
  if (fieldLower === 'year') {
    const yearValue = parseInt(safeExtractedValue);
    const currentYear = new Date().getFullYear();
    
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium">Year Analysis:</p>
        <ul className="list-disc list-inside text-xs">
          <li>Format: 
            {safeExtractedValue.match(/^(19|20)\d{2}$/) ? 
              <span className="text-green-600"> Valid 4-digit format</span> : 
              safeExtractedValue.match(/^\d{2}$/) ? 
              <span className="text-yellow-600"> 2-digit short format</span> :
              <span className="text-red-600"> Non-standard format</span>}
          </li>
          <li>Value Range: 
            {yearValue >= 1900 && yearValue <= currentYear + 2 ? 
              <span className="text-green-600"> Reasonable range ({yearValue})</span> : 
              <span className="text-red-600"> Suspicious range ({yearValue})</span>}
          </li>
          <li>Match with ORKG: 
            {safeExtractedValue === safeOrkgValue ? 
              <span className="text-green-600"> Exact match</span> : 
              <span className="text-yellow-600"> Different value</span>}
          </li>
        </ul>
      </div>
    );
  }
  
  // Field-specific analysis for venue
  if (fieldLower === 'venue') {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium">Venue Analysis:</p>
        <ul className="list-disc list-inside text-xs">
          <li>Journal Name: 
            {safeExtractedValue.match(/[A-Za-z]/) ? 
              <span className="text-green-600"> Present</span> : 
              <span className="text-red-600"> Missing</span>}
          </li>
          <li>Volume Info: 
            {safeExtractedValue.match(/Vol|Volume|\d+\(\d+\)/) ? 
              <span className="text-green-600"> Present</span> : 
              <span className="text-red-600"> Missing</span>}
          </li>
          <li>Format Style: 
            {safeExtractedValue.match(/[A-Z]\./) && !safeExtractedValue.match(/[A-Z][a-z]+/) ? 
              <span className="text-green-600"> Consistent abbreviation style</span> :
              safeExtractedValue.match(/[A-Z][a-z]+/) && !safeExtractedValue.match(/[A-Z]\./) ? 
              <span className="text-green-600"> Consistent full word style</span> :
              safeExtractedValue.match(/[A-Z][a-z]+/) && safeExtractedValue.match(/[A-Z]\./) ? 
              <span className="text-yellow-600"> Mixed abbreviation and full word style</span> :
              <span className="text-red-600"> Inconsistent format</span>}
          </li>
        </ul>
      </div>
    );
  }
  
  // Default generic analysis
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">Field Analysis:</p>
      <ul className="list-disc list-inside text-xs">
        <li>ORKG Length: {(safeOrkgValue?.length || 0)} characters</li>
        <li>Extracted Length: {(safeExtractedValue?.length || 0)} characters</li>
        <li>Length Ratio: {safeOrkgValue?.length > 0 ? 
          `${((safeExtractedValue?.length / safeOrkgValue?.length) * 100).toFixed(0)}%` : 
          "N/A"}
        </li>
      </ul>
    </div>
  );
};

export default FieldSpecificAnalysis;