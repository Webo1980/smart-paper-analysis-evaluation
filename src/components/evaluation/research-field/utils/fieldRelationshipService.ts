// src/services/research-field/fieldRelationshipService.ts

import { loadResearchFieldHierarchy } from '../services/fieldHierarchyService';

export interface FieldNode {
  id: string;
  label: string;
  children?: FieldNode[];
}

export interface FieldRelationship {
  type: 'same' | 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant' | 'distant';
  distance: number;
  commonAncestor?: {
    id: string;
    label: string;
  };
  path?: string[];
}

export class FieldRelationshipAnalyzer {
  private hierarchy: FieldNode;

  constructor(hierarchy: FieldNode) {
    this.hierarchy = hierarchy;
  }

  /**
   * Find the path from root to a specific field
   * @param fieldId - ID of the field to find
   * @returns Array of field IDs representing the path, or null if not found
   */
  private findFieldPath(fieldId: string): string[] | null {
    const traverse = (node: FieldNode, currentPath: string[] = []): string[] | null => {
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
   * @param field1Id - ID of the first field
   * @param field2Id - ID of the second field
   * @returns Detailed relationship information
   */
  calculateFieldRelationship(field1Id: string, field2Id: string): FieldRelationship {
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

    let type: FieldRelationship['type'] = 'distant';
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
   * @param fieldId - ID of the field to find
   * @returns Field details or null if not found
   */
  private getFieldById(fieldId: string): FieldNode | null {
    const traverse = (node: FieldNode): FieldNode | null => {
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
   * @param orkgFieldId - ID of the ORKG field
   * @param selectedFieldIds - Array of selected field IDs
   * @returns Detailed relationship analysis
   */
  analyzeFieldRelationships(orkgFieldId: string, selectedFieldIds: string[]): FieldRelationship[] {
    return selectedFieldIds.map(fieldId => 
      this.calculateFieldRelationship(orkgFieldId, fieldId)
    );
  }
}

/**
 * Create a field relationship analyzer
 * @returns Initialized FieldRelationshipAnalyzer
 */
export async function createFieldRelationshipAnalyzer(): Promise<FieldRelationshipAnalyzer> {
  const hierarchy = await loadResearchFieldHierarchy();
  return new FieldRelationshipAnalyzer(hierarchy);
}

/**
 * Comprehensive field relationship analysis
 * @param orkgFieldId - ORKG field ID
 * @param selectedFieldIds - Selected field IDs
 * @returns Detailed relationship analysis
 */
export async function analyzeFieldRelationships(
  orkgFieldId: string, 
  selectedFieldIds: string[]
): Promise<FieldRelationship[]> {
  const analyzer = await createFieldRelationshipAnalyzer();
  return analyzer.analyzeFieldRelationships(orkgFieldId, selectedFieldIds);
}