// src/components/evaluation/research-field/services/fieldHierarchyService.js

// Research field hierarchy data
let researchFieldsHierarchy = null;

/**
 * Load research field hierarchy data
 * @returns {Promise<Object>} - Research field hierarchy
 */
export const loadResearchFieldHierarchy = async () => {
  // If already loaded, return cached data
  if (researchFieldsHierarchy) {
    return researchFieldsHierarchy;
  }

  try {
    // Load data from JSON file
    const response = await fetch(
      `https://api.github.com/repos/${import.meta.env.VITE_GITHUB_USERNAME}/${import.meta.env.VITE_GITHUB_REPO}/contents/src/data/evaluations/research_fields_hierarchy.json`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to load research fields hierarchy: ${response.statusText}`);
    }
    
    researchFieldsHierarchy = await response.json();
    return researchFieldsHierarchy;
  } catch (error) {
    console.error('Error loading research fields hierarchy:', error);
    throw error;
  }
};

/**
 * Get research field hierarchy data
 * @returns {Object|null} - Research field hierarchy or null if not loaded
 */
export const getResearchFieldHierarchy = () => {
  return researchFieldsHierarchy;
};

/**
 * Clear cached research field hierarchy data
 */
export const clearResearchFieldHierarchy = () => {
  researchFieldsHierarchy = null;
};

/**
 * Get field information by ID
 * @param {string} fieldId - Research field ID
 * @returns {Promise<Object>} - Field information
 */
export const getFieldById = async (fieldId) => {
  const hierarchy = await loadResearchFieldHierarchy();
  
  // Recursive function to find field
  const findField = (node, id) => {
    if (node.id === id) {
      return { id: node.id, label: node.label };
    }
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const result = findField(child, id);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  return findField(hierarchy, fieldId);
};

/**
 * Get fields information by IDs
 * @param {Array<string>} fieldIds - Research field IDs
 * @returns {Promise<Array<Object>>} - Array of field information
 */
export const getFieldsByIds = async (fieldIds) => {
  const hierarchy = await loadResearchFieldHierarchy();
  const fields = [];
  
  // Process each field ID
  for (const id of fieldIds) {
    const field = await getFieldById(id);
    if (field) {
      fields.push(field);
    }
  }
  
  return fields;
};