// src\components\evaluation\metadata\utils\metadataConfig.js
export const METADATA_QUALITY_DIMENSIONS = {
    completeness: {
      calculate: (refValue, extValue, fieldType) => {
        if (!refValue) return 1.0;
        if (!extValue) return 0.1;
        
        // For author fields, check number of authors
        if (fieldType === 'authors') {
          const refAuthors = refValue.split(/[;,]/).filter(a => a.trim());
          const extAuthors = extValue.split(/[;,]/).filter(a => a.trim());
          
          return Math.min(extAuthors.length / Math.max(refAuthors.length, 1), 1.0);
        }
        
        // Default length-based completeness
        return Math.min(extValue.length / Math.max(refValue.length, 1), 1.0);
      },
      detectIssues: (refValue, extValue, score, fieldType) => {
        if (score < 0.8) {
          if (fieldType === 'authors') {
            return ['Some authors may be missing'];
          }
          return ['Content may be incomplete'];
        }
        return [];
      },
      weight: 0.4
    },
    
    consistency: {
      calculate: (refValue, extValue, fieldType) => {
        if (!refValue || !extValue) return 0.5;
        
        // Field-specific consistency checks
        if (fieldType === 'doi') {
          // DOI should be consistent in format
          return refValue.toLowerCase() === extValue.toLowerCase() ? 1.0 : 0.7;
        }
        
        if (fieldType === 'authors') {
          // Check for consistent author name format (LastName, FirstName)
          const refHasCommas = refValue.includes(',');
          const extHasCommas = extValue.includes(',');
          
          return refHasCommas === extHasCommas ? 1.0 : 0.7;
        }
        
        // Default consistency check
        return refValue.toLowerCase() === extValue.toLowerCase() ? 1.0 : 0.7;
      },
      detectIssues: (refValue, extValue, score, fieldType) => {
        if (score < 0.9) {
          if (fieldType === 'authors') {
            return ['Author name format may be inconsistent'];
          }
          return ['Format inconsistencies detected'];
        }
        return [];
      },
      weight: 0.3
    },
    
    validity: {
      calculate: (refValue, extValue, fieldType) => {
        if (!extValue) return 0.3;
        
        // Field-specific validity checks
        if (fieldType === 'doi') {
          const doiRegex = /^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/;
          return doiRegex.test(String(extValue)) ? 1.0 : 0.5;
        }
        
        if (fieldType === 'year') {
          const yearRegex = /^\d{4}$/;
          return yearRegex.test(String(extValue)) ? 1.0 : 0.6;
        }
        
        // Default validity check
        return 1.0;
      },
      detectIssues: (refValue, extValue, score, fieldType) => {
        if (score < 0.9) {
          if (fieldType === 'doi') {
            return ['DOI format is incorrect'];
          } else if (fieldType === 'year') {
            return ['Year format is not 4 digits'];
          }
          return ['Value may not be valid'];
        }
        return [];
      },
      weight: 0.3
    }
  };
  
  export const METADATA_ACCURACY_WEIGHTS = {
    levenshtein: 0.5,
    tokenMatching: 0.3,
    specialChar: 0.2
  };
  
  export const METADATA_FIELD_WEIGHTS = {
    title: 1.2,      // Higher importance for title
    authors: 1.0,    // Standard importance
    doi: 0.9,        // Slightly less importance
    publication_year: 0.9,
    venue: 0.9
  };