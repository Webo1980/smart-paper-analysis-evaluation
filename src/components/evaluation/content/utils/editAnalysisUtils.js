// src/components/evaluation/content/utils/editAnalysisUtils.js
/**
 * Utility functions for edit analysis calculations
 */

/**
 * Calculate edit metrics based on properties comparison
 * @param {Array} originalProps - Array of original properties
 * @param {Array} editedProps - Array of edited properties
 * @param {Object} changes - Changes object with added, removed, modified info
 * @returns {Object} Edit metrics
 */
export const calculateEditMetrics = (originalProps = [], editedProps = [], changes = {}) => {
  // Default if no data is provided
  if (!originalProps || !Array.isArray(originalProps)) originalProps = [];
  if (!editedProps || !Array.isArray(editedProps)) editedProps = [];
  if (!changes || typeof changes !== 'object') changes = {};

  // Calculate base metrics
  const totalOriginalProps = originalProps.length;
  
  // Extract change counts from changes object if available
  let addedCount = Array.isArray(changes.added_properties) ? changes.added_properties.length : 0;
  let removedCount = Array.isArray(changes.removed_properties) ? changes.removed_properties.length : 0;
  let modifiedCount = changes.modified_properties ? Object.keys(changes.modified_properties).length : 0;
  
  // If changes object doesn't have proper data, calculate based on arrays
  if (!addedCount && !removedCount && !modifiedCount && totalOriginalProps > 0) {
    // Create maps for faster lookup
    const originalMap = new Map(originalProps.map(prop => [prop.id, prop]));
    const editedMap = new Map(editedProps.map(prop => [prop.id, prop]));
    
    // Find added items (in edited but not in original)
    addedCount = editedProps.filter(prop => !originalMap.has(prop.id)).length;
    
    // Find removed items (in original but not in edited)
    removedCount = originalProps.filter(prop => !editedMap.has(prop.id)).length;
    
    // Find modified items (in both but different)
    const commonIds = originalProps
      .map(prop => prop.id)
      .filter(id => editedMap.has(id));
    
    modifiedCount = commonIds.filter(id => {
      const original = originalMap.get(id);
      const edited = editedMap.get(id);
      // Simple string comparison - in production would have a more robust comparison
      return JSON.stringify(original) !== JSON.stringify(edited);
    }).length;
  }
  
  // Calculate unchanged count
  const unchangedCount = Math.max(0, totalOriginalProps - removedCount - modifiedCount);
  
  // Calculate rates
  const changeRate = totalOriginalProps > 0 ? 
    (addedCount + removedCount + modifiedCount) / totalOriginalProps : 0;
  const preservationRate = totalOriginalProps > 0 ? 
    unchangedCount / totalOriginalProps : 1;
  
  // Calculate edit score
  const editScore = 1 - Math.min(1, changeRate);
  
  return {
    addedCount,
    removedCount,
    modifiedCount,
    unchangedCount,
    totalOriginalProps,
    changeRate,
    preservationRate,
    editScore
  };
};

/**
 * Analyze changes between original and edited properties
 * @param {Object} originalProps - Original properties object
 * @param {Object} editedProps - Edited properties object
 * @returns {Object} Analysis results
 */
export const analyzeChanges = (originalProps = {}, editedProps = {}) => {
  const addedProperties = [];
  const removedProperties = [];
  const modifiedProperties = {};
  
  // Find removed properties
  Object.keys(originalProps).forEach(propId => {
    if (!editedProps[propId]) {
      removedProperties.push(propId);
    }
  });
  
  // Find added and modified properties
  Object.keys(editedProps).forEach(propId => {
    const editedProp = editedProps[propId];
    const originalProp = originalProps[propId];
    
    if (!originalProp) {
      addedProperties.push(propId);
    } else {
      // Check for modifications
      const isTypeChanged = editedProp.type !== originalProp.type;
      const isLabelChanged = editedProp.label !== originalProp.label;
      const isDescriptionChanged = editedProp.description !== originalProp.description;
      
      // Check for value changes
      const originalValues = originalProp.values || [];
      const editedValues = editedProp.values || [];
      const isValueCountChanged = originalValues.length !== editedValues.length;
      
      // Check individual values
      const hasValueChanges = isValueCountChanged || originalValues.some((val, idx) => {
        const editedVal = editedValues[idx];
        if (!editedVal) return true;
        
        // Compare values
        if (val.value !== editedVal.value) return true;
        
        // Compare evidence if present
        if (val.evidence && editedVal.evidence) {
          // Compare evidence keys
          const origEvidenceKeys = Object.keys(val.evidence);
          const editedEvidenceKeys = Object.keys(editedVal.evidence);
          
          if (origEvidenceKeys.length !== editedEvidenceKeys.length) return true;
          
          // Check evidence content
          return origEvidenceKeys.some(evidenceKey => {
            const origEvidence = val.evidence[evidenceKey];
            const editedEvidence = editedVal.evidence[evidenceKey];
            
            if (!origEvidence || !editedEvidence) return true;
            if (origEvidence.text !== editedEvidence.text) return true;
            
            return false;
          });
        }
        
        return false;
      });
      
      // If any changes found, add to modified properties
      if (isTypeChanged || isLabelChanged || isDescriptionChanged || hasValueChanges) {
        modifiedProperties[propId] = {
          original: originalProp,
          modified: editedProp,
          changes: {
            type: isTypeChanged,
            label: isLabelChanged,
            description: isDescriptionChanged,
            values: hasValueChanges
          },
          old_values: originalValues,
          new_values: editedValues
        };
      }
    }
  });
  
  return {
    added_properties: addedProperties,
    removed_properties: removedProperties,
    modified_properties: modifiedProperties
  };
};

/**
 * Calculate edit quality score based on change metrics
 * @param {Object} metrics - Edit metrics
 * @returns {Object} Quality assessment
 */
export const calculateEditQuality = (metrics) => {
  const { editScore } = metrics;
  
  // Define quality thresholds
  const qualityThresholds = {
    excellent: 0.8,
    good: 0.6,
    moderate: 0.4
  };
  
  // Determine quality level
  let qualityLevel = 'poor';
  if (editScore >= qualityThresholds.excellent) {
    qualityLevel = 'excellent';
  } else if (editScore >= qualityThresholds.good) {
    qualityLevel = 'good';
  } else if (editScore >= qualityThresholds.moderate) {
    qualityLevel = 'moderate';
  }
  
  // Generate quality description
  let qualityDescription = '';
  switch (qualityLevel) {
    case 'excellent':
      qualityDescription = 'Excellent initial quality with minimal edits needed';
      break;
    case 'good':
      qualityDescription = 'Good initial quality with moderate edits needed';
      break;
    case 'moderate':
      qualityDescription = 'Fair initial quality with substantial edits needed';
      break;
    default:
      qualityDescription = 'Poor initial quality with significant edits required';
  }
  
  // Identify potential issues
  const issues = [];
  
  if (metrics.removedCount > metrics.totalOriginalProps * 0.2) {
    issues.push(`High removal rate (${(metrics.removedCount / metrics.totalOriginalProps * 100).toFixed(1)}%) indicates potential over-generation of properties`);
  }
  
  if (metrics.addedCount > metrics.totalOriginalProps * 0.3) {
    issues.push(`High addition rate (${(metrics.addedCount / metrics.totalOriginalProps * 100).toFixed(1)}%) indicates significant missing content`);
  }
  
  if (metrics.modifiedCount > metrics.totalOriginalProps * 0.5) {
    issues.push(`High modification rate (${(metrics.modifiedCount / metrics.totalOriginalProps * 100).toFixed(1)}%) indicates quality issues in generated content`);
  }
  
  return {
    score: editScore,
    qualityLevel,
    qualityDescription,
    issues
  };
};

/**
 * Get properties data for comparison
 * @param {Object} originalData - Original data object
 * @param {Object} editedData - Edited data object
 * @returns {Object} Formatted properties data
 */
export const getPropertiesData = (originalData = {}, editedData = {}) => {
  const originalProps = [];
  const editedProps = [];
  
  // Convert original properties object to array format
  if (originalData) {
    Object.keys(originalData).forEach(propId => {
      if (propId !== 'type' && originalData[propId] && typeof originalData[propId] === 'object') {
        const prop = originalData[propId];
        
        // Create a proper values representation for display
        let formattedValues = [];
        if (prop.values && Array.isArray(prop.values)) {
          formattedValues = prop.values.map(val => {
            // Create a clean display string for value
            const displayStr = typeof val.value === 'string' ? 
              val.value.substring(0, 50) + (val.value.length > 50 ? '...' : '') : 
              String(val.value);
              
            // Create a clean evidence string
            let evidenceStr = '';
            if (val.evidence && typeof val.evidence === 'object') {
              evidenceStr = Object.keys(val.evidence)
                .map(sourceKey => {
                  const source = val.evidence[sourceKey];
                  const text = source.text ? 
                    `${source.text.substring(0, 30)}...` : 
                    'No text';
                  return `${sourceKey}: ${text}`;
                })
                .join('; ');
            }
            
            return {
              value: displayStr,
              confidence: val.confidence || 0,
              evidenceSummary: evidenceStr || 'No evidence provided'
            };
          });
        }
        
        originalProps.push({
          id: propId,
          label: prop.label || propId,
          type: prop.type || 'text',
          description: prop.description || '',
          valueDisplay: formattedValues.map(v => v.value).join(', '),
          values: formattedValues,
          valueCount: formattedValues.length
        });
      }
    });
  }
  
  // Convert edited properties to format
  if (editedData) {
    Object.keys(editedData).forEach(propId => {
      if (propId !== 'type' && editedData[propId] && typeof editedData[propId] === 'object') {
        const prop = editedData[propId];
        
        // Create a proper values representation for display
        let formattedValues = [];
        if (prop.values && Array.isArray(prop.values)) {
          formattedValues = prop.values.map(val => {
            // Create a clean display string for value
            const displayStr = typeof val.value === 'string' ? 
              val.value.substring(0, 50) + (val.value.length > 50 ? '...' : '') : 
              String(val.value);
              
            // Create a clean evidence string
            let evidenceStr = '';
            if (val.evidence && typeof val.evidence === 'object') {
              evidenceStr = Object.keys(val.evidence)
                .map(sourceKey => {
                  const source = val.evidence[sourceKey];
                  const text = source.text ? 
                    `${source.text.substring(0, 30)}...` : 
                    'No text';
                  return `${sourceKey}: ${text}`;
                })
                .join('; ');
            }
            
            return {
              value: displayStr,
              confidence: val.confidence || 0,
              evidenceSummary: evidenceStr || 'No evidence provided'
            };
          });
        }
        
        editedProps.push({
          id: propId,
          label: prop.label || propId,
          type: prop.type || 'text',
          description: prop.description || '',
          valueDisplay: formattedValues.map(v => v.value).join(', '),
          values: formattedValues,
          valueCount: formattedValues.length
        });
      }
    });
  }
  
  return {
    originalProps,
    editedProps
  };
};

/**
 * Generate text comparison samples from changes
 * @param {Object} changes - Changes object
 * @returns {Array} Array of text comparison samples
 */
export const getTextComparisonSamples = (changes = {}) => {
  const samples = [];
  
  // Look for modified properties with significant text changes
  if (changes.modified_properties) {
    Object.keys(changes.modified_properties).forEach(propId => {
      const prop = changes.modified_properties[propId];
      
      if (prop.old_values && prop.new_values && 
          prop.old_values.length > 0 && prop.new_values.length > 0) {
        
        // Find a suitable text sample (ideally with edits)
        const oldValue = prop.old_values[0].value;
        const newValue = prop.new_values[0].value;
        
        if (typeof oldValue === 'string' && typeof newValue === 'string' &&
            oldValue !== newValue && 
            oldValue.length > 20 && newValue.length > 20) {
          
          samples.push({
            property: propId,
            original: oldValue,
            edited: newValue,
            confidence: prop.old_values[0].confidence
          });
          
          // Just need a few good samples
          if (samples.length >= 2) return samples;
        }
      }
    });
  }
  
  return samples;
};

/**
 * Process evaluation comparison data
 * @param {Object} evaluationComparison - The comparison data from the component
 * @returns {Object} Processed data ready for display
 */
export const processComparisonData = (evaluationComparison) => {
  if (!evaluationComparison) return null;
  
  const comparisonData = {
    original_data: evaluationComparison.original_data || {},
    new_data: evaluationComparison.new_data || {},
    changes: evaluationComparison.changes || {}
  };
  
  const originalData = comparisonData.original_data;
  const editedData = comparisonData.new_data;
  const changes = comparisonData.changes;
  
  // Get property data
  const { originalProps, editedProps } = getPropertiesData(originalData, editedData);
  
  // Get text samples for comparison
  const textComparisonSamples = getTextComparisonSamples(changes);
  
  // Calculate metrics
  const calculatedMetrics = calculateEditMetrics(originalProps, editedProps, changes);
  
  // Calculate quality assessment
  const qualityAssessment = calculateEditQuality(calculatedMetrics);
  
  return {
    originalData,
    editedData,
    changes,
    originalProps,
    editedProps,
    textComparisonSamples,
    calculatedMetrics,
    qualityAssessment
  };
};

/**
 * Get edit score from metrics or calculate it from comparison data
 * @param {Object} metrics - Metrics object that might contain edit score
 * @param {Object} evaluationComparison - Comparison data
 * @returns {number} - Edit score
 */
export const getEditScore = (metrics, evaluationComparison) => {
  // If we have comparison data, calculate the score (this gets priority)
  if (evaluationComparison) {
    const processedData = processComparisonData(evaluationComparison);
    if (processedData?.calculatedMetrics?.editScore !== undefined) {
      return processedData.calculatedMetrics.editScore;
    }
  }
  
  // Fall back to metrics if available
  if (metrics?.editAnalysis?.score !== undefined) {
    return metrics.editAnalysis.score;
  }
  
  return 0;
};