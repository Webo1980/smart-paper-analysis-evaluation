// src/components/evaluation/metadata/config/metadataConfig.js

import { WEIGHTING_CONFIG } from '../../base/config/evaluationConfig';

/**
 * Metadata-specific configuration for evaluations
 */
export const METADATA_CONFIG = {
  // Override default accuracy weights for metadata
  accuracyWeights: {
    levenshtein: 0.5,
    tokenMatching: 0.3,
    specialChar: 0.2
  },
  
  // Override default quality dimensions with metadata-specific ones
  qualityDimensions: {
    completeness: {
      weight: 0.4,
      calculate: (ref, ext, fieldType) => {
        if (!ref && !ext) return 0.5;
        if (!ref) return 0.7; // No reference but has extracted
        if (!ext) return 0.1; // Has reference but no extracted
        
        // Special handling for different field types
        if (fieldType === 'title') {
          return ext.length / Math.max(ref.length, 1);
        }
        
        if (fieldType === 'authors') {
          // Count author name matches
          const refAuthors = typeof ref === 'string' ? ref.split(',').map(a => a.trim()) : [];
          const extAuthors = typeof ext === 'string' ? ext.split(',').map(a => a.trim()) : [];
          
          if (refAuthors.length === 0) return extAuthors.length > 0 ? 1 : 0.5;
          
          const matches = extAuthors.filter(author => 
            refAuthors.some(refAuthor => refAuthor.toLowerCase().includes(author.toLowerCase()))
          );
          
          return Math.min(matches.length / refAuthors.length, 1);
        }
        
        // Default completeness based on length
        return Math.min(ext.length / Math.max(ref.length, 1), 1);
      },
      detectIssues: (ref, ext, score, fieldType) => {
        if (score < 0.5) {
          if (fieldType === 'title') return ['Title appears incomplete'];
          if (fieldType === 'authors') return ['Some authors may be missing'];
          if (fieldType === 'doi') return ['DOI appears incomplete'];
          return ['Content may be incomplete'];
        }
        return [];
      }
    },
    consistency: {
      weight: 0.3,
      calculate: (ref, ext, fieldType) => {
        if (!ref || !ext) return 0.5;
        
        // Special handling for field types
        if (fieldType === 'authors') {
          // Check for consistent author formatting
          const authorPattern = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
          const extAuthors = typeof ext === 'string' ? ext.split(',').map(a => a.trim()) : [];
          
          if (extAuthors.length === 0) return 0.5;
          
          const consistentAuthors = extAuthors.filter(author => authorPattern.test(author));
          return consistentAuthors.length / extAuthors.length;
        }
        
        if (fieldType === 'doi') {
          // Standard DOI format
          const doiPattern = /^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/;
          return doiPattern.test(ext) ? 1.0 : 0.3;
        }
        
        if (fieldType === 'year' || fieldType === 'publicationYear') {
          // Year format
          const yearPattern = /^(19|20)\d{2}$/;
          return yearPattern.test(ext) ? 1.0 : 0.3;
        }
        
        // Check for matching case
        if (ref.toLowerCase() === ext.toLowerCase()) {
          // Same text, check if case matches
          return ref === ext ? 1.0 : 0.7;
        }
        
        return 0.5;
      },
      detectIssues: (ref, ext, score, fieldType) => {
        if (score < 0.7) {
          if (fieldType === 'authors') return ['Author formatting inconsistencies'];
          if (fieldType === 'doi') return ['DOI format issues'];
          if (fieldType === 'year' || fieldType === 'publicationYear') return ['Year format issues'];
          return ['Format inconsistencies detected'];
        }
        return [];
      }
    },
    validity: {
      weight: 0.3,
      calculate: (ref, ext, fieldType) => {
        if (!ext) return 0.3;
        
        // Special handling for field types
        if (fieldType === 'doi') {
          // Valid DOI format
          return /^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/.test(String(ext)) ? 1.0 : 0.5;
        }
        
        if (fieldType === 'year' || fieldType === 'publicationYear') {
          // Valid year range
          const year = parseInt(ext);
          return (year >= 1900 && year <= new Date().getFullYear()) ? 1.0 : 0.3;
        }
        
        if (fieldType === 'url') {
          // Valid URL format
          try {
            new URL(ext);
            return 1.0;
          } catch {
            return 0.3;
          }
        }
        
        // Default validity - assume valid
        return 1.0;
      },
      detectIssues: (ref, ext, score, fieldType) => {
        if (score < 0.7) {
          if (fieldType === 'doi') return ['DOI format is incorrect'];
          if (fieldType === 'year' || fieldType === 'publicationYear') return ['Year value is invalid'];
          if (fieldType === 'url') return ['URL format is invalid'];
          return ['Value may not be valid'];
        }
        return [];
      }
    }
  },
  
  // Get field type based on metadata field ID
  getFieldType: (fieldId) => {
    const fieldTypeMap = {
      title: 'title',
      authors: 'authors',
      doi: 'doi',
      venue: 'venue',
      year: 'year',
      publicationYear: 'year',
      pubYear: 'year',
      url: 'url'
    };
    
    return fieldTypeMap[fieldId] || fieldId;
  },
  
  // Fallback configuration for when analysis fails
  fallbackConfig: {
    defaultScore: 0.5,
    defaultAccuracyScore: 0.5,
    defaultQualityScore: 0.5,
    agreement: 0.5,
    dimensions: ['completeness', 'consistency', 'validity'],
    dimensionWeights: {
      completeness: 0.4,
      consistency: 0.3,
      validity: 0.3
    }
  },
  
  // Field importance weights - some fields may be more important than others
  fieldImportance: {
    title: 1.2,
    authors: 1.1,
    doi: 1.0,
    venue: 0.9,
    year: 0.8,
    url: 0.7
  },
  
  // Overall weights (accuracy vs quality)
  overallWeights: WEIGHTING_CONFIG.DEFAULT_OVERALL_WEIGHTS,
  
  // Metric configurations for UI display
  metricConfig: {
    accuracy: {
      primaryMetrics: ['precision', 'recall'],
      mainMetric: 'f1Score',
      displayName: 'Metadata Accuracy'
    },
    quality: {
      primaryMetrics: ['completeness', 'consistency', 'validity'],
      mainMetric: 'overallQuality',
      displayName: 'Metadata Quality'
    }
  }
};

export default METADATA_CONFIG;