// src/components/evaluation/research-field/utils/researchFieldEvaluation.js
import { loadResearchFieldHierarchy } from '../services/fieldHierarchyService';
import {
  findFieldById,
  findFieldByLabel,
  getFieldPath,
  findFieldRelationship,
  findNearestNeighbors,
  analyzeFieldRelationships
} from './fieldHierarchyUtils';

// Cache for the hierarchy data
let researchFieldHierarchy = null;

/**
 * Load the research field hierarchy if not already loaded
 */
export async function ensureHierarchyLoaded() {
  if (!researchFieldHierarchy) {
    researchFieldHierarchy = await loadResearchFieldHierarchy();
  }
  return researchFieldHierarchy;
}

/**
 * Clear the hierarchy cache
 */
export function clearHierarchyCache() {
  researchFieldHierarchy = null;
}

/**
 * Compare user-selected fields with ORKG research field
 * Using enhanced relationship analysis
 * @param {Object} evaluationData - User selected fields { fields: Array }
 * @param {Object} orkgData - ORKG paper data { research_field_name: string, research_field: { id: string } }
 * @returns {Object} - Comparison results
 */
export async function compareResearchFields(evaluationData, orkgData) {
  try {
    // Load hierarchy if needed
    const hierarchy = await ensureHierarchyLoaded();
    
    if (!hierarchy) {
      throw new Error('Research field hierarchy not available');
    }

    // Get ORKG field info
    const orkgField = orkgData?.research_field || {};
    const orkgFieldName = orkgData?.research_field_name || '';
    const orkgFieldId = orkgField.id;

    // Get user selected fields
    const userFields = evaluationData?.fields || [];
    
    // Find ORKG field in hierarchy
    let orkgHierarchyNode = null;
    if (orkgFieldId) {
      orkgHierarchyNode = findFieldById(hierarchy, orkgFieldId);
    }
    if (!orkgHierarchyNode && orkgFieldName) {
      orkgHierarchyNode = findFieldByLabel(hierarchy, orkgFieldName);
    }

    // Analyze relationships between user fields and ORKG field
    // Using the enhanced analyzer
    const relationshipAnalysis = orkgHierarchyNode 
      ? analyzeFieldRelationships(
          hierarchy,
          userFields,
          { 
            id: orkgHierarchyNode.id, 
            label: orkgHierarchyNode.label 
          }
        )
      : {
          exactMatch: false,
          matches: [],
          relationships: [],
          confidence: 0.5,
          relevance: 0.5,
          consistency: 0.5,
          details: {
            confidenceReason: "Could not locate ORKG field in hierarchy",
            relevanceReason: "Could not locate ORKG field in hierarchy",
            consistencyReason: "Could not locate ORKG field in hierarchy"
          }
        };

    // Find nearest neighbors of ORKG field
    const neighbors = orkgHierarchyNode 
      ? findNearestNeighbors(hierarchy, orkgHierarchyNode.id)
      : {
          parent: null,
          siblings: [],
          children: []
        };

    // Check if any user fields match ORKG field exactly
    const exactMatch = relationshipAnalysis.exactMatch;
    
    // Check if any user fields are related (parent, child, sibling)
    const relatedMatches = relationshipAnalysis.matches.filter(m => !m.isExact && m.isRelated);
    
    // Get the closest related field if no exact match
    let closestRelationship = null;
    if (!exactMatch && relationshipAnalysis.relationships.length > 0) {
      closestRelationship = relationshipAnalysis.relationships.reduce((closest, current) => {
        if (!closest || (current.relationship.distance > -1 && 
            current.relationship.distance < closest.relationship.distance)) {
          return current;
        }
        return closest;
      }, null);
    }

    // Prepare detailed comparison results
    const comparisonDetails = {
      orkgField: {
        id: orkgHierarchyNode?.id || orkgFieldId,
        label: orkgHierarchyNode?.label || orkgFieldName,
        path: orkgHierarchyNode ? getFieldPath(hierarchy, orkgHierarchyNode.id) : []
      },
      userFields: userFields.map(field => {
        const fieldId = field.id || field.field_id;
        const fieldNode = fieldId ? findFieldById(hierarchy, fieldId) : 
                          field.name ? findFieldByLabel(hierarchy, field.name) : null;
        
        // Use enhanced relationship info
        const relationship = orkgHierarchyNode && fieldNode 
          ? findFieldRelationship(hierarchy, fieldNode.id, orkgHierarchyNode.id)
          : null;
        
        return {
          ...field,
          node: fieldNode,
          path: fieldNode ? getFieldPath(hierarchy, fieldNode.id) : [],
          relationship: relationship,
          isExactMatch: exactMatch && (fieldId === orkgHierarchyNode?.id || 
                          field.name?.toLowerCase() === orkgFieldName?.toLowerCase()),
          isRelated: relationship && ['parent', 'child', 'sibling'].includes(relationship.relationship)
        };
      }),
      neighbors,
      metrics: {
        exactMatch,
        hasRelatedMatch: relatedMatches.length > 0,
        closestRelationship: closestRelationship?.relationship || null,
        confidence: relationshipAnalysis.confidence,
        relevance: relationshipAnalysis.relevance,
        consistency: relationshipAnalysis.consistency
      },
      analysisDetails: relationshipAnalysis.details
    };

    return {
      success: true,
      data: comparisonDetails
    };
  } catch (error) {
    console.error('Error comparing research fields:', error);
    return {
      success: false,
      error: error.message,
      data: {
        orkgField: null,
        userFields: [],
        neighbors: null,
        metrics: {
          exactMatch: false,
          hasRelatedMatch: false,
          closestRelationship: null,
          confidence: 0.5,
          relevance: 0.5,
          consistency: 0.5
        },
        analysisDetails: {
          confidenceReason: "Error during analysis",
          relevanceReason: "Error during analysis",
          consistencyReason: "Error during analysis"
        }
      }
    };
  }
}

/**
 * Evaluate the quality of user-selected fields against ORKG field
 * @param {Object} evaluationData - User selected fields
 * @param {Object} orkgData - ORKG paper data
 * @returns {Object} - Evaluation results with scores and explanations
 */
export async function evaluateResearchFieldQuality(evaluationData, orkgData) {
  const comparison = await compareResearchFields(evaluationData, orkgData);
  
  if (!comparison.success) {
    return {
      success: false,
      error: comparison.error,
      metrics: {
        overallScore: 0.5,
        accuracy: 0.5,
        relevance: 0.5,
        consistency: 0.5
      },
      details: {
        accuracyReason: "Error during evaluation",
        relevanceReason: "Error during evaluation",
        consistencyReason: "Error during evaluation"
      }
    };
  }

  const { metrics, analysisDetails } = comparison.data;

  // Calculate overall score (weighted average)
  const overallScore = (
    (metrics.confidence * 0.4) + 
    (metrics.relevance * 0.3) + 
    (metrics.consistency * 0.3)
  );

  return {
    success: true,
    metrics: {
      overallScore,
      exactMatch: metrics.exactMatch,
      hasRelatedMatch: metrics.hasRelatedMatch,
      closestRelationship: metrics.closestRelationship,
      confidence: metrics.confidence,
      relevance: metrics.relevance,
      consistency: metrics.consistency
    },
    details: analysisDetails
  };
}