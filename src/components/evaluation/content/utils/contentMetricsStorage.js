/**
 * RESTRUCTURED VERSION: Content Metrics Storage with Improved Data Organization
 * 
 * Changes from previous version:
 * 1. Move _aggregate.content.userRatings → overall.content.userRatings
 * 2. Move _expertiseMultiplier under userRatings for each property
 * 3. Remove _userRatings and _expertiseMultiplier from accuracy and quality
 * 4. Keep only clean metric data in accuracy/quality sections
 */

import { storeFieldMetrics } from '../../base/utils/storageUtils';
import {
  calculatePropertyAccuracy,
  calculatePropertyQuality,
  calculatePropertyOverall
} from './contentMetrics';

// ============================================================================
// Property Name Extraction
// ============================================================================

/**
 * Extract property name from template property object
 */
const extractPropertyName = (property, index) => {
  const name = property?.label 
    || property?.name 
    || property?.propertyName 
    || property?.title
    || property?.property
    || property?.id;
  
  if (name && typeof name === 'string' && name.trim().length > 0) {
    return name.trim();
  }
  
  return `Property_${index + 1}`;
};

/**
 * Create safe storage key from property name
 */
const createSafeKey = (propertyName) => {
  if (!propertyName) {
    console.error('CRITICAL: createSafeKey called with empty propertyName!');
    return 'unknown_property';
  }
  
  return propertyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .substring(0, 50);
};

// ============================================================================
// Unknown Property Cleanup
// ============================================================================

/**
 * Clean up any unknown_property entries from localStorage
 */
const cleanupUnknownProperties = () => {
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    let cleanedCount = 0;
    
    if (metrics.accuracy?.content?.unknown_property) {
      console.log('🧹 Removing unknown_property from accuracy.content');
      delete metrics.accuracy.content.unknown_property;
      cleanedCount++;
    }
    
    if (metrics.quality?.content?.unknown_property) {
      console.log('🧹 Removing unknown_property from quality.content');
      delete metrics.quality.content.unknown_property;
      cleanedCount++;
    }
    
    if (metrics.overall?.content?.unknown_property) {
      console.log('🧹 Removing unknown_property from overall.content');
      delete metrics.overall.content.unknown_property;
      cleanedCount++;
    }
    
    if (cleanedCount > 0) {
      localStorage.setItem('evaluation_metrics', JSON.stringify(metrics));
      console.log(`✓ Cleaned ${cleanedCount} unknown_property entries`);
    } else {
      console.log('✓ No unknown_property entries to clean');
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Error during cleanup:', error);
    return 0;
  }
};

// ============================================================================
// Remove Internal Fields from Metrics
// ============================================================================

/**
 * Clean internal fields (_userRatings, _expertiseMultiplier, etc.) from metric objects
 */
const cleanInternalFields = (metricsObject) => {
  if (!metricsObject || typeof metricsObject !== 'object') {
    return metricsObject;
  }
  
  const cleaned = { ...metricsObject };
  
  // Remove internal fields
  delete cleaned._userRatings;
  delete cleaned._expertiseMultiplier;
  delete cleaned._metadata; // We'll store metadata differently
  
  return cleaned;
};

// ============================================================================
// Main Storage Function - RESTRUCTURED
// ============================================================================

/**
 * Store all content metrics for all template properties
 * RESTRUCTURED VERSION with improved data organization
 */
export const storeAllContentMetrics = ({
  templateProperties,
  paperContent,
  userRatings,
  expertiseMultiplier,
  evaluationData = null
}) => {
  console.log('\n========================================');
  console.log('CONTENT METRICS STORAGE - RESTRUCTURED VERSION');
  console.log('========================================\n');
  
  // ========================================
  // STEP 1: Clean up any existing unknown_property
  // ========================================
  
  const cleanedCount = cleanupUnknownProperties();
  if (cleanedCount > 0) {
    console.log(`\n⚠️ Cleaned ${cleanedCount} unknown_property entries before processing\n`);
  }
  
  // ========================================
  // STEP 2: Validation
  // ========================================
  
  if (!templateProperties || !Array.isArray(templateProperties)) {
    console.error('❌ Invalid templateProperties:', templateProperties);
    return { 
      success: false, 
      error: 'templateProperties must be an array',
      errorCount: 0,
      successCount: 0
    };
  }
  
  if (templateProperties.length === 0) {
    console.error('❌ No template properties to process');
    return { 
      success: false, 
      error: 'No template properties',
      errorCount: 0,
      successCount: 0
    };
  }
  
  if (!expertiseMultiplier || expertiseMultiplier <= 0) {
    console.warn('⚠️ Invalid expertise multiplier, defaulting to 1.0');
    expertiseMultiplier = 1.0;
  }
  
  console.log(`Processing ${templateProperties.length} template properties`);
  console.log(`Expertise multiplier: ${expertiseMultiplier}`);
  console.log(`User ratings:`, userRatings);
  console.log('');
  
  // ========================================
  // STEP 3: Process each property
  // ========================================
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const processedKeys = new Set();
  
  templateProperties.forEach((property, index) => {
    try {
      // Extract property name
      const propertyName = extractPropertyName(property, index);
      const propertyKey = createSafeKey(propertyName);
      
      console.log(`\n--- Property ${index + 1}/${templateProperties.length} ---`);
      console.log(`Name: "${propertyName}"`);
      console.log(`Key: "${propertyKey}"`);
      
      // Check for duplicates
      if (processedKeys.has(propertyKey)) {
        console.warn(`⚠️ Duplicate key detected: "${propertyKey}"`);
      }
      processedKeys.add(propertyKey);
      
      // Get property data
      const propertyData = property;
      
      console.log(`✓ Using property data for: ${propertyName}`);
      console.log(`  Value: ${propertyData.value || 'null'}`);
      console.log(`  Confidence: ${propertyData.confidence || 'null'}`);
      
      // Calculate metrics
      const accuracyMetrics = calculatePropertyAccuracy(
        propertyData,
        property,
        userRatings,
        expertiseMultiplier
      );
      
      const qualityMetrics = calculatePropertyQuality(
        propertyData,
        property,
        userRatings,
        expertiseMultiplier
      );
      
      const overallMetrics = calculatePropertyOverall(
        accuracyMetrics,
        qualityMetrics
      );
      
      // ========================================
      // RESTRUCTURED: Clean metrics objects
      // ========================================
      
      // Remove internal fields from accuracy and quality
      const cleanedAccuracyMetrics = cleanInternalFields(accuracyMetrics);
      const cleanedQualityMetrics = cleanInternalFields(qualityMetrics);
      
      // Store CLEAN accuracy metrics (no _userRatings, no _expertiseMultiplier)
      storeFieldMetrics(
        propertyKey,
        'accuracy',
        cleanedAccuracyMetrics,
        'content'
      );
      
      // Store CLEAN quality metrics (no _userRatings, no _expertiseMultiplier)
      storeFieldMetrics(
        propertyKey,
        'quality',
        cleanedQualityMetrics,
        'content'
      );
      
      // ========================================
      // RESTRUCTURED: Store overall with metadata only
      // ========================================
      
      // Build overall metrics with metadata only (no userRatings per property)
      const overallWithMetadata = {
        ...overallMetrics,
        metadata: {
          // Property identification
          originalPropertyName: propertyName,
          safeKey: propertyKey,
          propertyIndex: index,
          
          // Timestamps
          timestamp: new Date().toISOString(),
          evaluationDate: new Date().toLocaleDateString(),
          evaluationTime: new Date().toLocaleTimeString(),
          
          // Property data snapshot
          propertyData: {
            value: propertyData?.value || null,
            confidence: propertyData?.confidence || null,
            evidence: propertyData?.evidence || null,
            source: propertyData?.source || null
          },
          
          // Template property details
          templateProperty: {
            label: property?.label || null,
            dataType: property?.dataType || property?.type || null,
            description: property?.description || null,
            required: property?.required || false
          },
          
          // Evaluation context
          evaluationContext: {
            paperContentAvailable: !!paperContent,
            evaluationDataAvailable: !!evaluationData,
            userRatingsProvided: !!userRatings,
            expertiseMultiplierApplied: expertiseMultiplier
          }
        }
      };
      
      // Store overall metrics with metadata only
      storeFieldMetrics(
        propertyKey,
        'overall',
        overallWithMetadata,
        'content'
      );
      
      console.log(`✅ Stored metrics for "${propertyName}"`);
      console.log(`   Accuracy: stored (clean, no internal fields)`);
      console.log(`   Quality: stored (clean, no internal fields)`);
      console.log(`   Overall: stored (with metadata only, no userRatings)`);
      
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing property ${index + 1}:`, error);
      errorCount++;
      errors.push({
        propertyIndex: index,
        propertyName: extractPropertyName(property, index),
        error: error.message,
        stack: error.stack
      });
    }
  });
  
  // ========================================
  // STEP 4: Store aggregate metadata
  // RESTRUCTURED: Store under overall.content.userRatings
  // ========================================
  
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    
    // Ensure overall.content exists
    if (!metrics.overall) metrics.overall = {};
    if (!metrics.overall.content) metrics.overall.content = {};
    
    // Store user ratings with expertise multiplier under overall.content
    metrics.overall.content.userRatings = {
      // User ratings
      propertyCoverage: userRatings?.propertyCoverage || 0,
      evidenceQuality: userRatings?.evidenceQuality || 0,
      valueAccuracy: userRatings?.valueAccuracy || 0,
      confidenceCalibration: userRatings?.confidenceCalibration || 0,
      
      // Expertise multiplier moved here
      expertiseMultiplier: expertiseMultiplier,
      
      // Summary information
      timestamp: new Date().toISOString(),
      totalProperties: templateProperties.length,
      successCount,
      errorCount,
      processedKeys: Array.from(processedKeys),
      version: 'RESTRUCTURED_V1'
    };
    
    // Remove old _aggregate structure if it exists
    if (metrics._aggregate?.content) {
      console.log('🧹 Removing old _aggregate.content structure');
      delete metrics._aggregate.content;
      if (Object.keys(metrics._aggregate).length === 0) {
        delete metrics._aggregate;
      }
    }
    
    localStorage.setItem('evaluation_metrics', JSON.stringify(metrics));
    
    console.log('\n✓ Stored aggregate user ratings under overall.content.userRatings');
    console.log('✓ Removed old _aggregate structure');
  } catch (error) {
    console.error('Error storing aggregate metadata:', error);
  }
  
  // ========================================
  // STEP 5: Verification
  // ========================================
  
  console.log('\n========================================');
  console.log('VERIFICATION');
  console.log('========================================\n');
  console.log(`✅ Success: ${successCount}/${templateProperties.length}`);
  
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}/${templateProperties.length}`);
    console.log('Error details:', errors);
  }
  
  // Check what was stored
  const storedMetrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
  const storedKeys = Object.keys(storedMetrics?.accuracy?.content || {});
  
  console.log('\nStored keys in localStorage:');
  console.log(`  accuracy.content: [${storedKeys.join(', ')}]`);
  console.log(`  Total: ${storedKeys.length} properties`);
  
  // Check for unknown_property
  if (storedKeys.includes('unknown_property')) {
    console.error('\n❌❌❌ CRITICAL ERROR ❌❌❌');
    console.error('unknown_property STILL EXISTS after processing!');
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n');
  } else {
    console.log('\n✅✅✅ SUCCESS ✅✅✅');
    console.log('No unknown_property found!');
    console.log('All metrics stored with restructured data:');
    console.log('  - accuracy: clean metrics only ✓');
    console.log('  - quality: clean metrics only ✓');
    console.log('  - overall.{property}: includes metadata only ✓');
    console.log('  - overall.content.userRatings: parent-level user ratings with expertiseMultiplier ✓');
    console.log('✅✅✅✅✅✅✅✅✅✅✅');
  }
  
  // Verify restructured data
  console.log('\nData Structure Verification:');
  console.log(`  overall.content.userRatings exists: ${!!storedMetrics?.overall?.content?.userRatings}`);
  console.log(`  _aggregate.content exists: ${!!storedMetrics?._aggregate?.content} (should be false)`);
  
  // Check first property for structure
  if (storedKeys.length > 0) {
    const firstKey = storedKeys[0];
    const accuracyHasUserRatings = !!storedMetrics?.accuracy?.content?.[firstKey]?._userRatings;
    const qualityHasUserRatings = !!storedMetrics?.quality?.content?.[firstKey]?._userRatings;
    const overallHasUserRatings = !!storedMetrics?.overall?.content?.[firstKey]?.userRatings;
    
    console.log(`\nFirst property (${firstKey}) structure:`);
    console.log(`  accuracy has _userRatings: ${accuracyHasUserRatings} (should be false)`);
    console.log(`  quality has _userRatings: ${qualityHasUserRatings} (should be false)`);
    console.log(`  overall.{property} has userRatings: ${overallHasUserRatings} (should be false)`);
    console.log(`  overall.{property} has metadata: ${!!storedMetrics?.overall?.content?.[firstKey]?.metadata} (should be true)`);
  }
  
  // Verify parent-level userRatings
  const parentUserRatings = storedMetrics?.overall?.content?.userRatings;
  if (parentUserRatings) {
    console.log(`\nParent-level userRatings (overall.content.userRatings):`);
    console.log(`  ✓ Has expertiseMultiplier: ${!!parentUserRatings.expertiseMultiplier}`);
    console.log(`  ✓ Has propertyCoverage: ${!!parentUserRatings.propertyCoverage}`);
    console.log(`  ✓ Has evidenceQuality: ${!!parentUserRatings.evidenceQuality}`);
    console.log(`  ✓ Has valueAccuracy: ${!!parentUserRatings.valueAccuracy}`);
    console.log(`  ✓ Has confidenceCalibration: ${!!parentUserRatings.confidenceCalibration}`);
  }
  
  // Check for duplicates
  if (processedKeys.size < templateProperties.length) {
    console.warn('\n⚠️ WARNING: Duplicate keys detected!');
    console.warn(`   Expected: ${templateProperties.length} unique keys`);
    console.warn(`   Got: ${processedKeys.size} unique keys`);
  } else {
    console.log('\n✓ All properties have unique keys');
  }
  
  console.log('\n========================================\n');
  
  return {
    success: successCount > 0,
    successCount,
    errorCount,
    errors,
    totalProperties: templateProperties.length,
    storedKeys: Array.from(processedKeys),
    hasDuplicates: processedKeys.size < templateProperties.length,
    cleanedCount,
    restructured: true,
    restructuredFields: {
      removed: [
        '_userRatings from accuracy', 
        '_expertiseMultiplier from accuracy', 
        '_userRatings from quality', 
        '_expertiseMultiplier from quality', 
        '_aggregate.content',
        'userRatings from overall.content.{property}'
      ],
      added: [
        'overall.content.userRatings (parent level only)',
        'overall.content.userRatings.expertiseMultiplier'
      ],
      preserved: [
        'overall.content.{property}.metadata (per property)'
      ]
    }
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Retrieve stored content metrics from localStorage
 * RESTRUCTURED: Returns data from new structure
 */
export const getStoredContentMetrics = () => {
  try {
    const metricsStr = localStorage.getItem('evaluation_metrics');
    if (!metricsStr) return null;
    
    const metrics = JSON.parse(metricsStr);
    return {
      accuracy: metrics?.accuracy?.content || {},
      quality: metrics?.quality?.content || {},
      overall: metrics?.overall?.content || {},
      userRatings: metrics?.overall?.content?.userRatings || null,  // Changed from aggregate
      keys: Object.keys(metrics?.accuracy?.content || {}),
      restructured: true
    };
  } catch (error) {
    console.error('Error retrieving stored metrics:', error);
    return null;
  }
};

/**
 * Get user data from parent level (overall.content.userRatings)
 * User ratings are now stored at parent level, not per property
 */
export const getPropertyUserData = (propertyKey = null) => {
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    
    // Get parent-level user ratings
    const parentUserRatings = metrics?.overall?.content?.userRatings;
    
    if (!parentUserRatings) {
      return null;
    }
    
    // If propertyKey is provided, also get property metadata
    if (propertyKey) {
      const propertyMetadata = metrics?.overall?.content?.[propertyKey]?.metadata;
      
      return {
        propertyKey,
        userRatings: parentUserRatings,  // From parent level
        expertiseMultiplier: parentUserRatings?.expertiseMultiplier || null,
        metadata: propertyMetadata || null
      };
    }
    
    // If no propertyKey, just return parent-level data
    return {
      userRatings: parentUserRatings,
      expertiseMultiplier: parentUserRatings?.expertiseMultiplier || null
    };
  } catch (error) {
    console.error('Error getting property user data:', error);
    return null;
  }
};

/**
 * Get complete data for a specific property
 * RESTRUCTURED: Returns clean structure with userRatings from parent level
 */
export const getPropertyCompleteData = (propertyKey) => {
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    
    const accuracy = metrics?.accuracy?.content?.[propertyKey];
    const quality = metrics?.quality?.content?.[propertyKey];
    const overall = metrics?.overall?.content?.[propertyKey];
    
    if (!accuracy && !quality && !overall) {
      return null;
    }
    
    // Get parent-level user ratings
    const parentUserRatings = metrics?.overall?.content?.userRatings;
    
    return {
      propertyKey,
      accuracy: accuracy,                                    // Clean metrics only
      quality: quality,                                      // Clean metrics only
      overall: overall,                                      // Includes metadata only
      userRatings: parentUserRatings || null,               // From parent level (overall.content.userRatings)
      expertiseMultiplier: parentUserRatings?.expertiseMultiplier || null,  // From parent level
      metadata: overall?.metadata || null                    // From overall.{property}
    };
  } catch (error) {
    console.error('Error getting property complete data:', error);
    return null;
  }
};

/**
 * Get all properties with complete data
 */
export const getAllPropertiesCompleteData = () => {
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    const keys = Object.keys(metrics?.accuracy?.content || {});
    
    return keys.map(key => getPropertyCompleteData(key)).filter(Boolean);
  } catch (error) {
    console.error('Error getting all properties complete data:', error);
    return [];
  }
};

/**
 * Get aggregate user ratings
 * RESTRUCTURED: Get from overall.content.userRatings
 */
export const getAggregateUserRatings = () => {
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    return metrics?.overall?.content?.userRatings || null;
  } catch (error) {
    console.error('Error getting aggregate user ratings:', error);
    return null;
  }
};

/**
 * Clear all content metrics from localStorage
 */
export const clearContentMetrics = () => {
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    
    if (metrics.accuracy?.content) delete metrics.accuracy.content;
    if (metrics.quality?.content) delete metrics.quality.content;
    if (metrics.overall?.content) delete metrics.overall.content;
    if (metrics._aggregate?.content) delete metrics._aggregate.content;
    
    localStorage.setItem('evaluation_metrics', JSON.stringify(metrics));
    console.log('✓ Cleared content metrics');
  } catch (error) {
    console.error('Error clearing content metrics:', error);
  }
};

/**
 * Debug template properties structure
 */
export const debugTemplateProperties = (properties) => {
  console.log('\n========================================');
  console.log('DEBUGGING TEMPLATE PROPERTIES');
  console.log('========================================\n');
  
  if (!properties || !Array.isArray(properties)) {
    console.error('❌ properties is not an array:', properties);
    return;
  }
  
  console.log(`Found ${properties.length} properties\n`);
  
  properties.forEach((property, index) => {
    console.log(`Property ${index + 1}:`);
    console.log('  Raw object:', property);
    console.log('  Available keys:', Object.keys(property || {}));
    
    const extractedName = extractPropertyName(property, index);
    const safeKey = createSafeKey(extractedName);
    console.log(`  ✓ Will use: "${extractedName}" → "${safeKey}"`);
    console.log('');
  });
  
  console.log('========================================\n');
};

/**
 * Export stored data as JSON for download/analysis
 * RESTRUCTURED: Uses new data structure
 */
export const exportContentMetrics = () => {
  try {
    const completeData = getAllPropertiesCompleteData();
    const aggregateUserRatings = getAggregateUserRatings();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: 'RESTRUCTURED_V1',
      userRatings: aggregateUserRatings,
      properties: completeData,
      summary: {
        totalProperties: completeData.length,
        expertiseMultiplier: aggregateUserRatings?.expertiseMultiplier,
        userRatingsSnapshot: {
          propertyCoverage: aggregateUserRatings?.propertyCoverage,
          evidenceQuality: aggregateUserRatings?.evidenceQuality,
          valueAccuracy: aggregateUserRatings?.valueAccuracy,
          confidenceCalibration: aggregateUserRatings?.confidenceCalibration
        }
      }
    };
    
    return exportData;
  } catch (error) {
    console.error('Error exporting content metrics:', error);
    return null;
  }
};

/**
 * Migrate from old structure to new structure
 * Use this if you have old data with _aggregate and internal fields
 */
export const migrateToNewStructure = () => {
  console.log('\n========================================');
  console.log('MIGRATION TO RESTRUCTURED FORMAT');
  console.log('========================================\n');
  
  try {
    const metrics = JSON.parse(localStorage.getItem('evaluation_metrics') || '{}');
    let migrationCount = 0;
    
    // Step 1: Move _aggregate.content to overall.content.userRatings
    if (metrics._aggregate?.content) {
      console.log('📦 Found old _aggregate.content structure');
      
      if (!metrics.overall) metrics.overall = {};
      if (!metrics.overall.content) metrics.overall.content = {};
      
      // Move user ratings and expertise multiplier to parent level
      metrics.overall.content.userRatings = {
        ...metrics._aggregate.content.userRatings,
        expertiseMultiplier: metrics._aggregate.content.expertiseMultiplier,
        timestamp: metrics._aggregate.content.timestamp,
        totalProperties: metrics._aggregate.content.totalProperties,
        successCount: metrics._aggregate.content.successCount,
        errorCount: metrics._aggregate.content.errorCount,
        processedKeys: metrics._aggregate.content.processedKeys,
        version: 'RESTRUCTURED_V2'
      };
      
      // Remove old _aggregate
      delete metrics._aggregate.content;
      if (Object.keys(metrics._aggregate).length === 0) {
        delete metrics._aggregate;
      }
      
      console.log('✓ Moved _aggregate.content → overall.content.userRatings');
      migrationCount++;
    }
    
    // Step 2: Clean internal fields from accuracy and quality
    const propertyKeys = Object.keys(metrics?.accuracy?.content || {});
    
    propertyKeys.forEach(key => {
      let cleaned = false;
      
      // Clean accuracy
      if (metrics?.accuracy?.content?.[key]) {
        const original = metrics.accuracy.content[key];
        metrics.accuracy.content[key] = cleanInternalFields(original);
        if (original._userRatings || original._expertiseMultiplier) {
          cleaned = true;
        }
      }
      
      // Clean quality
      if (metrics?.quality?.content?.[key]) {
        const original = metrics.quality.content[key];
        metrics.quality.content[key] = cleanInternalFields(original);
        if (original._userRatings || original._expertiseMultiplier) {
          cleaned = true;
        }
      }
      
      if (cleaned) {
        console.log(`✓ Cleaned internal fields from: ${key}`);
        migrationCount++;
      }
    });
    
    // Step 3: Remove userRatings from individual properties in overall
    propertyKeys.forEach(key => {
      if (metrics?.overall?.content?.[key]) {
        const overall = metrics.overall.content[key];
        
        // Remove userRatings from individual properties (now at parent level only)
        if (overall.userRatings) {
          console.log(`✓ Removed userRatings from property: ${key}`);
          delete overall.userRatings;
          migrationCount++;
        }
        
        // Remove any stray _expertiseMultiplier
        if (overall._expertiseMultiplier) {
          console.log(`✓ Removed _expertiseMultiplier from property: ${key}`);
          delete overall._expertiseMultiplier;
          migrationCount++;
        }
      }
    });
    
    // Save migrated data
    localStorage.setItem('evaluation_metrics', JSON.stringify(metrics));
    
    console.log('\n========================================');
    console.log(`✅ Migration complete: ${migrationCount} changes made`);
    console.log('========================================');
    console.log('\nFinal structure:');
    console.log('  ✓ overall.content.userRatings (parent level)');
    console.log('  ✓ overall.content.{property}.metadata (per property)');
    console.log('  ✓ accuracy.content.{property} (clean metrics)');
    console.log('  ✓ quality.content.{property} (clean metrics)');
    console.log('========================================\n');
    
    return {
      success: true,
      changesCount: migrationCount
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};