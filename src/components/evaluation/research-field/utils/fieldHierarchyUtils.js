// src/components/evaluation/research-field/utils/fieldHierarchyUtils.js

/**
 * Find a research field node by ID in the hierarchy
 * @param {Object} node - Current node in hierarchy
 * @param {string} id - Field ID to find
 * @returns {Object|null} - Found node or null
 */
export const findFieldById = (node, id) => {
  if (node.id === id) return node;
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const result = findFieldById(child, id);
      if (result) return result;
    }
  }
  
  return null;
};

/**
 * Find a research field node by label in the hierarchy
 * @param {Object} node - Current node in hierarchy
 * @param {string} label - Field label to find (case insensitive)
 * @returns {Object|null} - Found node or null
 */
export const findFieldByLabel = (node, label) => {
  if (node.label.toLowerCase() === label.toLowerCase()) return node;
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const result = findFieldByLabel(child, label);
      if (result) return result;
    }
  }
  
  return null;
};

/**
 * Get path from root to a specific field
 * @param {Object} node - Current node in hierarchy
 * @param {string} id - Target field ID
 * @param {Array} path - Current path (for recursion)
 * @returns {Array|null} - Path array or null if not found
 */
export const getFieldPath = (node, id, path = []) => {
  const newPath = [...path, { id: node.id, label: node.label }];
  
  if (node.id === id) return newPath;
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const result = getFieldPath(child, id, newPath);
      if (result) return result;
    }
  }
  
  return null;
};

/**
 * Field Relationship Analyzer class
 * Ported from the TypeScript implementation
 */
class FieldRelationshipAnalyzer {
  constructor(hierarchy) {
    this.hierarchy = hierarchy;
  }

  /**
   * Find the path from root to a specific field
   * @param {string} fieldId - ID of the field to find
   * @returns {Array|null} - Path array of field IDs or null if not found
   */
  findFieldPath(fieldId) {
    const traverse = (node, currentPath = []) => {
      const newPath = [...currentPath, node.id];
      
      if (node.id === fieldId) {
        return newPath;
      }

      if (node.children) {
        for (const child of node.children) {
          const result = traverse(child, newPath);
          if (result) return result;
        }
      }

      return null;
    };

    return traverse(this.hierarchy);
  }

  /**
   * Calculate relationship between two fields
   * @param {string} field1Id - ID of the first field
   * @param {string} field2Id - ID of the second field
   * @returns {Object} - Relationship information
   */
  calculateFieldRelationship(field1Id, field2Id) {
    if (field1Id === field2Id) {
      return {
        type: 'same',
        distance: 0
      };
    }

    const path1 = this.findFieldPath(field1Id);
    const path2 = this.findFieldPath(field2Id);

    if (!path1 || !path2) {
      return {
        type: 'distant',
        distance: -1
      };
    }

    // Find common ancestor
    let commonAncestorIndex = 0;
    const minLength = Math.min(path1.length, path2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (path1[i] !== path2[i]) break;
      commonAncestorIndex = i;
    }

    const distance = path1.length + path2.length - 2 * (commonAncestorIndex + 1);
    const commonAncestor = this.getFieldById(path1[commonAncestorIndex]);

    // Determine relationship type
    const relativePosition = path1.length - (commonAncestorIndex + 1);
    const field2RelativePosition = path2.length - (commonAncestorIndex + 1);

    let type = 'distant';
    if (relativePosition === 0 && field2RelativePosition > 0) {
      type = 'parent';
    } else if (field2RelativePosition === 0 && relativePosition > 0) {
      type = 'child';
    } else if (relativePosition > 0 && field2RelativePosition > 0) {
      type = 'sibling';
    } else if (relativePosition === 0 && field2RelativePosition === 0) {
      type = 'same';
    }

    return {
      type,
      distance,
      commonAncestor: commonAncestor ? {
        id: commonAncestor.id,
        label: commonAncestor.label
      } : undefined,
      path: [field1Id, field2Id]
    };
  }

  /**
   * Get field details by ID within the hierarchy
   * @param {string} fieldId - ID of the field to find
   * @returns {Object|null} - Field details or null if not found
   */
  getFieldById(fieldId) {
    const traverse = (node) => {
      if (node.id === fieldId) return node;

      if (node.children) {
        for (const child of node.children) {
          const result = traverse(child);
          if (result) return result;
        }
      }

      return null;
    };

    return traverse(this.hierarchy);
  }

  /**
   * Analyze relationships between ORKG field and selected fields
   * @param {string} orkgFieldId - ID of the ORKG field
   * @param {Array} selectedFieldIds - Array of selected field IDs
   * @returns {Array} - Relationship analysis for each field
   */
  analyzeFieldRelationships(orkgFieldId, selectedFieldIds) {
    return selectedFieldIds.map(fieldId => 
      this.calculateFieldRelationship(orkgFieldId, fieldId)
    );
  }
}

/**
 * Map relationship type to human-readable description
 * @param {string} type - Relationship type
 * @returns {string} - Human-readable description
 */
export const getRelationshipDescription = (type) => {
  const descriptions = {
    'same': 'Exact match',
    'parent': 'Parent field',
    'child': 'Child field',
    'sibling': 'Sibling field',
    'ancestor': 'Ancestor field',
    'descendant': 'Descendant field',
    'distant': 'Distantly related field'
  };
  return descriptions[type] || 'Unknown relationship';
};

/**
 * Find relationship between two research fields with enhanced relationship info
 * @param {Object} hierarchy - Full research field hierarchy
 * @param {string} fieldId1 - First field ID
 * @param {string} fieldId2 - Second field ID
 * @returns {Object} - Enhanced relationship info
 */
export const findFieldRelationship = (hierarchy, fieldId1, fieldId2) => {
  // Create analyzer from hierarchy
  const analyzer = new FieldRelationshipAnalyzer(hierarchy);
  
  // Use the enhanced relationship calculation
  const relationship = analyzer.calculateFieldRelationship(fieldId1, fieldId2);
  
  // Convert to format expected by existing code
  return {
    relationship: relationship.type,
    relationshipDescription: getRelationshipDescription(relationship.type),
    distance: relationship.distance,
    commonAncestor: relationship.commonAncestor,
    path1: getFieldPath(hierarchy, fieldId1) || [],
    path2: getFieldPath(hierarchy, fieldId2) || []
  };
};

/**
 * Find nearest neighbors for a field (parent, siblings, children)
 * @param {Object} hierarchy - Full research field hierarchy
 * @param {string} fieldId - Field ID to find neighbors for
 * @returns {Object} - Nearest neighbors
 */
export const findNearestNeighbors = (hierarchy, fieldId) => {
  const field = findFieldById(hierarchy, fieldId);
  if (!field) {
    return {
      parent: null,
      siblings: [],
      children: field ? field.children || [] : []
    };
  }
  
  // Find path to get parent
  const path = getFieldPath(hierarchy, fieldId);
  const parent = path && path.length > 1 ? path[path.length - 2] : null;
  
  // Find siblings (fields with the same parent)
  let siblings = [];
  if (parent) {
    const parentNode = findFieldById(hierarchy, parent.id);
    siblings = parentNode.children
      .filter(child => child.id !== fieldId)
      .map(child => ({ id: child.id, label: child.label }));
  }
  
  return {
    parent,
    siblings,
    children: field.children || []
  };
};

/**
 * Create a field relationship analyzer
 * @param {Object} hierarchy - Research field hierarchy
 * @returns {FieldRelationshipAnalyzer} - Initialized analyzer
 */
export const createFieldRelationshipAnalyzer = (hierarchy) => {
  return new FieldRelationshipAnalyzer(hierarchy);
};

/**
 * Analyze relationship between user-selected fields and ORKG field
 * with enhanced relationship analysis
 * @param {Object} hierarchy - Full research field hierarchy
 * @param {Array} userFields - User-selected fields
 * @param {Object} orkgField - ORKG research field
 * @returns {Object} - Analysis results
 */
export const analyzeFieldRelationships = (hierarchy, userFields, orkgField) => {
  if (!orkgField || !orkgField.id) {
    return {
      exactMatch: false,
      matches: [],
      relationships: [],
      confidence: 0,
      relevance: 0,
      consistency: 0,
      details: {
        confidenceReason: "Cannot assess confidence without ORKG field information",
        relevanceReason: "Cannot assess relevance without ORKG field information",
        consistencyReason: "Cannot assess consistency without ORKG field information"
      }
    };
  }
  
  // Create field relationship analyzer
  const analyzer = createFieldRelationshipAnalyzer(hierarchy);
  
  // Find matches and relationships
  const matches = [];
  const relationships = [];
  let exactMatch = false;
  
  // Get nearest neighbors for ORKG field
  const neighbors = findNearestNeighbors(hierarchy, orkgField.id);
  
  // Get all related fields (parent, siblings, children)
  const relatedFields = [
    ...(neighbors.parent ? [neighbors.parent] : []),
    ...neighbors.siblings,
    ...neighbors.children
  ];
  
  // Check each user field against ORKG field and its neighbors
  userFields.forEach((userField, index) => {
    const fieldId = userField.id || userField.field_id;
    
    // Check for exact match
    if (fieldId === orkgField.id) {
      exactMatch = true;
      matches.push({
        index,
        field: userField,
        isExact: true
      });
    } else {
      // Check relationship with ORKG field using enhanced analyzer
      const relationship = analyzer.calculateFieldRelationship(fieldId, orkgField.id);
      relationships.push({
        index,
        field: userField,
        relationship: {
          type: relationship.type,
          description: getRelationshipDescription(relationship.type),
          relationship: relationship.type,
          distance: relationship.distance,
          commonAncestor: relationship.commonAncestor
        }
      });
      
      // Check if it's a parent, child, or sibling
      const isRelated = relatedFields.some(related => related.id === fieldId) || 
                        ['parent', 'child', 'sibling'].includes(relationship.type);
      
      if (isRelated) {
        matches.push({
          index,
          field: userField,
          isExact: false,
          isRelated: true,
          relationshipType: relationship.type,
          relationshipDescription: getRelationshipDescription(relationship.type)
        });
      }
    }
  });
  
  // Calculate metrics
  const confidence = calculateConfidence(exactMatch, matches, relationships);
  const relevance = calculateRelevance(exactMatch, matches, relationships);
  const consistency = calculateConsistency(userFields, relationships);
  
  return {
    exactMatch,
    matches,
    relationships,
    confidence,
    relevance,
    consistency,
    details: {
      confidenceReason: generateConfidenceReason(exactMatch, matches, relationships),
      relevanceReason: generateRelevanceReason(exactMatch, matches, relationships),
      consistencyReason: generateConsistencyReason(userFields, relationships)
    }
  };
};

/**
 * Calculate confidence score
 * @param {boolean} exactMatch - Whether there's an exact match
 * @param {Array} matches - Array of matches
 * @param {Array} relationships - Array of relationships
 * @returns {number} - Confidence score (0-1)
 */
function calculateConfidence(exactMatch, matches, relationships) {
  if (exactMatch) return 1.0;
  
  if (matches.length > 0) {
    return 0.8; // High confidence if there are related matches
  }
  
  // Check closest relationships
  const closestRelationship = relationships.reduce((closest, current) => {
    if (!closest || (current.relationship.distance > -1 && current.relationship.distance < closest.relationship.distance)) {
      return current;
    }
    return closest;
  }, null);
  
  if (!closestRelationship) return 0.2;
  
  const distance = closestRelationship.relationship.distance;
  
  // Scale confidence based on distance
  if (distance <= 2) return 0.7;
  if (distance <= 4) return 0.5;
  if (distance <= 6) return 0.3;
  return 0.2;
}

/**
 * Calculate relevance score
 * @param {boolean} exactMatch - Whether there's an exact match
 * @param {Array} matches - Array of matches
 * @param {Array} relationships - Array of relationships
 * @returns {number} - Relevance score (0-1)
 */
function calculateRelevance(exactMatch, matches, relationships) {
  if (exactMatch) return 1.0;
  
  if (matches.length > 0) {
    // If we have parent, child, or sibling matches
    return 0.9;
  }
  
  // Calculate semantic relevance based on common ancestors
  const relevanceScores = relationships.map(rel => {
    const distance = rel.relationship.distance;
    if (distance === -1) return 0;
    
    // Exponential decay based on distance
    return Math.exp(-0.3 * distance);
  });
  
  // Average relevance score
  return relevanceScores.length > 0 
    ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
    : 0.3;
}

/**
 * Calculate consistency score
 * @param {Array} userFields - User-selected fields
 * @param {Array} relationships - Array of relationships
 * @returns {number} - Consistency score (0-1)
 */
function calculateConsistency(userFields, relationships) {
  if (userFields.length <= 1) return 1.0;
  
  // Calculate distances between selected fields
  let totalDistance = 0;
  let count = 0;
  
  for (let i = 0; i < relationships.length; i++) {
    for (let j = i + 1; j < relationships.length; j++) {
      const rel1 = relationships[i];
      const rel2 = relationships[j];
      
      if (rel1.relationship.path1 && rel2.relationship.path1) {
        // Calculate consistency based on common ancestors
        const path1 = rel1.relationship.path1;
        const path2 = rel2.relationship.path1;
        
        // Find common ancestors
        let commonPrefix = 0;
        for (let k = 0; k < Math.min(path1.length, path2.length); k++) {
          if (path1[k].id === path2[k].id) {
            commonPrefix = k + 1;
          } else {
            break;
          }
        }
        
        const totalPathLength = path1.length + path2.length - 2 * commonPrefix;
        totalDistance += totalPathLength;
        count++;
      }
    }
  }
  
  if (count === 0) return 0.5;
  
  const avgDistance = totalDistance / count;
  
  // Calculate consistency - closer fields are more consistent
  return Math.max(0, 1 - (avgDistance / 10));
}

/**
 * Generate explanation for confidence score
 */
function generateConfidenceReason(exactMatch, matches, relationships) {
  if (exactMatch) {
    return "High confidence due to exact match with ORKG research field.";
  }
  
  if (matches.length > 0) {
    const relationshipTypes = matches
      .filter(m => !m.isExact && m.isRelated)
      .map(m => m.relationshipDescription || getRelationshipDescription(m.relationshipType))
      .join(', ');
    return `Good confidence level as selected fields include closely related fields (${relationshipTypes} of the ORKG field).`;
  }
  
  // Find closest relationship
  const closestRel = relationships.reduce((closest, current) => {
    if (!closest || (current.relationship.distance > -1 && current.relationship.distance < closest.relationship.distance)) {
      return current;
    }
    return closest;
  }, null);
  
  if (!closestRel || closestRel.relationship.distance === -1) {
    return "Low confidence as selected fields are very distant from the ORKG field in the research field hierarchy.";
  }
  
  const relationshipDescription = closestRel.relationship.description || getRelationshipDescription(closestRel.relationship.type);
  
  if (closestRel.relationship.distance <= 2) {
    return `Moderate confidence as one selected field is a ${relationshipDescription} only ${closestRel.relationship.distance} levels away from the ORKG field.`;
  }
  
  if (closestRel.relationship.distance <= 5) {
    return `Limited confidence as the closest selected field is a ${relationshipDescription} ${closestRel.relationship.distance} levels away in the research taxonomy.`;
  }
  
  return "Low confidence as selected fields are quite distant from the ORKG field in the research hierarchy.";
}

/**
 * Generate explanation for relevance score
 */
function generateRelevanceReason(exactMatch, matches, relationships) {
  if (exactMatch) {
    return "Perfect relevance due to exact match with ORKG research field.";
  }
  
  if (matches.length > 0) {
    const matchTypes = matches.map(m => {
      if (m.relationshipType) {
        return m.relationshipDescription || getRelationshipDescription(m.relationshipType);
      }
      
      const fieldId = m.field.id || m.field.field_id;
      const relatedRel = relationships.find(r => (r.field.id || r.field.field_id) === fieldId);
      if (relatedRel) {
        return relatedRel.relationship.description || getRelationshipDescription(relatedRel.relationship.type);
      }
      return 'related field';
    });
    
    const relationshipCounts = matchTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const relationshipText = Object.entries(relationshipCounts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');
    
    return `High relevance as the selection includes ${relationshipText} of the ORKG field.`;
  }
  
  // Calculate semantic relevance based on common ancestors
  const closestDist = Math.min(...relationships.map(r => r.relationship.distance).filter(d => d !== -1));
  const closestRel = relationships.find(r => r.relationship.distance === closestDist);
  const relationshipDescription = closestRel?.relationship.description || 
                                getRelationshipDescription(closestRel?.relationship.type);
  
  if (closestDist <= 3) {
    return `Moderate relevance as the closest selected field is a ${relationshipDescription} within ${closestDist} levels of the ORKG field.`;
  }
  
  if (closestDist <= 6) {
    return `Limited relevance as the closest selected field is a ${relationshipDescription} ${closestDist} levels away from the ORKG field.`;
  }
  
  return "Low relevance as selected fields are distant from the ORKG field in the taxonomy.";
}

/**
 * Generate explanation for consistency score
 */
function generateConsistencyReason(userFields, relationships) {
  if (userFields.length <= 1) {
    return "Perfect consistency as only one field was selected.";
  }
  
  // Calculate distances between selected fields
  const distances = [];
  const relationshipPairs = [];
  
  for (let i = 0; i < relationships.length; i++) {
    for (let j = i + 1; j < relationships.length; j++) {
      const rel1 = relationships[i];
      const rel2 = relationships[j];
      
      if (rel1.relationship.path1 && rel2.relationship.path1) {
        // Find common ancestors
        const path1 = rel1.relationship.path1;
        const path2 = rel2.relationship.path1;
        
        let commonPrefix = 0;
        for (let k = 0; k < Math.min(path1.length, path2.length); k++) {
          if (path1[k].id === path2[k].id) {
            commonPrefix = k + 1;
          } else {
            break;
          }
        }
        
        const distance = path1.length + path2.length - 2 * commonPrefix;
        distances.push(distance);
        
        relationshipPairs.push({
          field1: rel1.field.name || rel1.field.field || 'Field 1',
          field2: rel2.field.name || rel2.field.field || 'Field 2',
          distance,
          relationship: distance <= 2 ? 'closely related' : 
                        distance <= 5 ? 'moderately related' : 'distantly related'
        });
      }
    }
  }
  
  if (distances.length === 0) {
    return "Unable to assess consistency due to missing path information.";
  }
  
  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const maxDistance = Math.max(...distances);
  
  // Find most closely and distantly related fields
  const closestPair = relationshipPairs.reduce((closest, current) => 
    !closest || current.distance < closest.distance ? current : closest, null);
  
  const furthestPair = relationshipPairs.reduce((furthest, current) => 
    !furthest || current.distance > furthest.distance ? current : furthest, null);
  
  if (avgDistance < 3) {
    return `High consistency as selected fields are closely related within the research taxonomy. Most closely related: ${closestPair.field1} and ${closestPair.field2} (${closestPair.relationship}).`;
  }
  
  if (avgDistance < 6) {
    return `Moderate consistency as selected fields are somewhat related within the research taxonomy. Fields range from ${closestPair.relationship} to ${furthestPair.relationship}.`;
  }
  
  if (maxDistance > 10) {
    return `Limited consistency as some selected fields are far apart in the taxonomy. Most distant pair: ${furthestPair.field1} and ${furthestPair.field2} (${furthestPair.distance} levels apart).`;
  }
  
  return "Low consistency as selected fields span across different branches of the research taxonomy.";
}