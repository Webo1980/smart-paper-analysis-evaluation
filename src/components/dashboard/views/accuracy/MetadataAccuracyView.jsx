// File: src/components/dashboard/views/accuracy/MetadataAccuracyView.jsx
// FIXED VERSION - Correct field names and array data handling
//
// ============================================================================
// KEY FIXES:
// ============================================================================
// 1. Fixed 'Extraction DOI' -> 'DOI Extraction' (typo in original)
// 2. Added support for ARRAY format metadata (data comes as array with 'id' field)
// 3. Added field ID mapping for consistent access
// 4. Removed calculations - reads from service data
//
// ============================================================================
// DATA FORMAT:
// ============================================================================
// The metadata accuracy data can come in TWO formats:
//
// FORMAT 1 - ARRAY (from evaluation):
// [
//   { id: "title", displayName: "Title Extraction", similarityData: {...}, scoreDetails: {...} },
//   { id: "doi", displayName: "DOI Extraction", similarityData: {...}, scoreDetails: {...} },
//   ...
// ]
//
// FORMAT 2 - OBJECT (from some services):
// {
//   "Title Extraction": { similarityData: {...}, scoreDetails: {...} },
//   "DOI Extraction": { similarityData: {...}, scoreDetails: {...} },
//   ...
// }
//
// This component handles BOTH formats.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Activity, ChevronDown, ChevronUp, Info, TrendingUp,
  CheckCircle, AlertCircle, Zap
} from 'lucide-react';

// ============================================================================
// FIELD NAME MAPPINGS - CRITICAL FOR CORRECT DATA ACCESS
// ============================================================================

/**
 * Maps internal field IDs to display names used in evaluation data
 * The evaluation system uses descriptive names with spaces
 */
const FIELD_ID_TO_DISPLAY = {
  title: 'Title Extraction',
  authors: 'Authors Extraction',
  doi: 'DOI Extraction',      // FIXED: Was 'Extraction DOI' (typo)
  venue: 'Venue/Journal',
  year: 'publication_year'
};

/**
 * Maps display names back to internal IDs
 */
const DISPLAY_TO_FIELD_ID = {
  'Title Extraction': 'title',
  'Authors Extraction': 'authors',
  'DOI Extraction': 'doi',
  'Venue/Journal': 'venue',
  'publication_year': 'year'
};

/**
 * List of fields to process (using CORRECT display names)
 */
const METADATA_FIELDS = [
  'Title Extraction',
  'Authors Extraction', 
  'DOI Extraction',      // FIXED: Was 'Extraction DOI'
  'Venue/Journal'
];

/**
 * Metadata Accuracy View Component
 * Comprehensive accuracy analysis for metadata extraction
 * Works with both raw papers data and aggregated statistics
 */
const MetadataAccuracyView = ({ componentData, papers, aggregatedData, fieldKeyMapping }) => {
  const [expandedSections, setExpandedSections] = useState({
    detailedAccuracy: true,
    similarityMetrics: true,
    fieldBreakdown: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate or extract detailed metadata metrics
  const metadataMetrics = useMemo(() => {
    console.log('MetadataAccuracyView: Received data:', {
      hasComponentData: !!componentData,
      hasPapers: !!papers,
      papersLength: papers?.length,
      hasAggregatedData: !!aggregatedData,
      aggregatedDataKeys: aggregatedData ? Object.keys(aggregatedData) : null,
      fieldKeyMapping: fieldKeyMapping
    });

    // Option 1: Extract from aggregatedData.papers (pre-processed statistics)
    if (aggregatedData?.papers) {
      console.log('MetadataAccuracyView: Using aggregated data approach');
      const papersObj = aggregatedData.papers;
      const paperIds = Object.keys(papersObj);
      
      if (paperIds.length === 0) {
        console.warn('MetadataAccuracyView: No papers in aggregated data');
        return null;
      }

      console.log('MetadataAccuracyView: Extracting from', paperIds.length, 'papers in aggregated data');
      return extractMetricsFromAggregatedData(papersObj);
    }

    // Option 2: Calculate from raw papers with userEvaluations
    if (papers && papers.length > 0) {
      console.log('MetadataAccuracyView: Processing', papers.length, 'raw papers');
      return calculateDetailedMetadataMetrics(papers);
    }

    console.warn('MetadataAccuracyView: No usable data available');
    return null;
  }, [papers, aggregatedData, componentData, fieldKeyMapping]);

  // Show error if no data is available
  if (!componentData && !metadataMetrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">No metadata accuracy data available</p>
            <p className="text-sm">
              This view requires either:
              <ul className="list-disc list-inside mt-1">
                <li>Raw papers with userEvaluations.evaluationMetrics.accuracy.metadata</li>
                <li>Aggregated data with papers[].metadata.byField statistics</li>
              </ul>
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  console.log('MetadataAccuracyView: Final metrics:', metadataMetrics);

  return (
    <div className="space-y-6 mt-4">
      {/* Detailed Metadata Accuracy Metrics */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('detailedAccuracy')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Detailed Metadata Accuracy Metrics
          </h3>
          {expandedSections.detailedAccuracy ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.detailedAccuracy && metadataMetrics && (
          <div className="space-y-6">
            {/* Overall Similarity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Levenshtein Similarity"
                value={metadataMetrics.levenshtein.mean}
                description="Character-level comparison"
                weight="50%"
                details={{
                  avgDistance: metadataMetrics.levenshtein.avgDistance,
                  range: `${(metadataMetrics.levenshtein.min * 100).toFixed(0)}% - ${(metadataMetrics.levenshtein.max * 100).toFixed(0)}%`,
                  std: metadataMetrics.levenshtein.std.toFixed(3)
                }}
              />
              <MetricCard
                title="Token Matching"
                value={metadataMetrics.tokenMatching.mean}
                description="Word-level comparison"
                weight="30%"
                details={{
                  avgPrecision: metadataMetrics.tokenMatching.avgPrecision,
                  avgRecall: metadataMetrics.tokenMatching.avgRecall,
                  avgF1: metadataMetrics.tokenMatching.avgF1
                }}
              />
              <MetricCard
                title="Special Characters"
                value={metadataMetrics.specialChar.mean}
                description="Punctuation & symbols"
                weight="20%"
                details={{
                  matchRate: metadataMetrics.specialChar.matchRate,
                  range: `${(metadataMetrics.specialChar.min * 100).toFixed(0)}% - ${(metadataMetrics.specialChar.max * 100).toFixed(0)}%`
                }}
              />
            </div>

            {/* Similarity Metrics Explanation */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium text-sm mb-2">How Similarity is Calculated:</p>
                <div className="text-sm space-y-1">
                  <p><strong>Levenshtein (50%):</strong> Measures character-by-character differences. Lower distance = higher similarity.</p>
                  <p><strong>Token Matching (30%):</strong> Compares individual words. Calculates precision (correctness) and recall (completeness).</p>
                  <p><strong>Special Characters (20%):</strong> Checks if punctuation, symbols, and formatting are preserved correctly.</p>
                  <p className="mt-2 pt-2 border-t border-blue-300">
                    <strong>Final Score = </strong>(0.5 × Levenshtein) + (0.3 × Token Matching) + (0.2 × Special Chars)
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </Card>

      {/* Similarity Metrics Breakdown by Field */}
      {metadataMetrics && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('similarityMetrics')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Similarity Metrics by Field
            </h3>
            {expandedSections.similarityMetrics ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.similarityMetrics && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left border-b font-semibold">Field</th>
                    <th className="p-3 text-center border-b font-semibold">Levenshtein</th>
                    <th className="p-3 text-center border-b font-semibold">Token Matching</th>
                    <th className="p-3 text-center border-b font-semibold">Special Chars</th>
                    <th className="p-3 text-center border-b font-semibold">Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metadataMetrics.byField).map(([fieldName, fieldMetrics]) => (
                    <tr key={fieldName} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{formatFieldName(fieldName)}</td>
                      <td className="p-3 text-center">
                        <Badge className={getScoreColor(fieldMetrics.levenshtein)}>
                          {formatPercentage(fieldMetrics.levenshtein)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getScoreColor(fieldMetrics.tokenMatching)}>
                          {formatPercentage(fieldMetrics.tokenMatching)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getScoreColor(fieldMetrics.specialChar)}>
                          {formatPercentage(fieldMetrics.specialChar)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getScoreColor(fieldMetrics.overall)}>
                          {formatPercentage(fieldMetrics.overall)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Field-Specific Validation and Analysis */}
      {metadataMetrics && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection('fieldBreakdown')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Field-Specific Validation & Insights
            </h3>
            {expandedSections.fieldBreakdown ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.fieldBreakdown && (
            <div className="space-y-4">
              {Object.entries(metadataMetrics.byField).map(([fieldName, fieldMetrics]) => (
                <FieldValidationCard
                  key={fieldName}
                  fieldName={fieldName}
                  metrics={fieldMetrics}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Performance Insights */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium text-sm mb-2">Metadata Performance Insights:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {metadataMetrics && metadataMetrics.levenshtein.mean >= 0.9 && (
              <li>Excellent character-level similarity (≥90%) indicates high-quality text extraction.</li>
            )}
            {metadataMetrics && metadataMetrics.tokenMatching.avgPrecision >= 0.85 && (
              <li>High token matching precision (≥85%) shows accurate word-level extraction.</li>
            )}
            {metadataMetrics && metadataMetrics.specialChar.matchRate >= 70 && (
              <li>Good special character preservation rate (≥70%) indicates proper formatting retention.</li>
            )}
            {metadataMetrics && metadataMetrics.levenshtein.std < 0.1 && (
              <li>Low variance in Levenshtein scores suggests consistent performance across documents.</li>
            )}
            <li>The weighted scoring system (50-30-20) balances character accuracy, word matching, and formatting preservation.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

/**
 * Metric Card Component
 * Displays a single similarity metric with details
 */
const MetricCard = ({ title, value, description, weight, details }) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700">{weight}</Badge>
      </div>
      
      <div className="mt-3">
        <p className="text-3xl font-bold text-blue-600">
          {formatPercentage(value)}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200 space-y-1">
        {details.avgDistance !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Avg Distance:</span>
            <span className="font-medium">{details.avgDistance.toFixed(2)}</span>
          </div>
        )}
        {details.avgPrecision !== undefined && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Precision:</span>
              <span className="font-medium">{formatPercentage(details.avgPrecision)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Recall:</span>
              <span className="font-medium">{formatPercentage(details.avgRecall)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">F1 Score:</span>
              <span className="font-medium">{formatPercentage(details.avgF1)}</span>
            </div>
          </>
        )}
        {details.matchRate !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Perfect Match Rate:</span>
            <span className="font-medium">{details.matchRate.toFixed(1)}%</span>
          </div>
        )}
        {details.range && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Range:</span>
            <span className="font-medium">{details.range}</span>
          </div>
        )}
        {details.std && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Std Dev:</span>
            <span className="font-medium">{details.std}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Field Validation Card Component
 * Shows field-specific validation checks and analysis
 */
const FieldValidationCard = ({ fieldName, metrics }) => {
  const [expanded, setExpanded] = useState(false);
  const validationChecks = getFieldValidationChecks(fieldName);

  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium text-gray-900">
            {formatFieldName(fieldName)}
          </span>
          <Badge className={getScoreColor(metrics.overall)}>
            {formatPercentage(metrics.overall)}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Similarity Scores */}
            <div>
              <h5 className="text-xs font-semibold text-gray-700 mb-2">Similarity Scores:</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Levenshtein:</span>
                  <span className="font-medium">{formatPercentage(metrics.levenshtein)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Token Matching:</span>
                  <span className="font-medium">{formatPercentage(metrics.tokenMatching)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Special Chars:</span>
                  <span className="font-medium">{formatPercentage(metrics.specialChar)}</span>
                </div>
              </div>
            </div>

            {/* Validation Checks */}
            <div>
              <h5 className="text-xs font-semibold text-gray-700 mb-2">Validation Checks:</h5>
              <ul className="space-y-1 text-xs list-disc list-inside">
                {validationChecks.map((check, index) => (
                  <li key={index} className="text-gray-600">{check}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS - DATA ACCESS
// ============================================================================

/**
 * Get metadata field data from either ARRAY or OBJECT format
 * 
 * Handles two data formats:
 * 1. ARRAY: [{ id: "doi", displayName: "DOI Extraction", ... }]
 * 2. OBJECT: { "DOI Extraction": { ... } }
 * 
 * @param {Array|Object} metadataAccuracy - The metadata accuracy data
 * @param {string} fieldKey - Either the ID (e.g., "doi") or display name (e.g., "DOI Extraction")
 * @returns {Object|null} The field data or null if not found
 */
function getMetadataField(metadataAccuracy, fieldKey) {
  if (!metadataAccuracy) return null;
  
  // Handle ARRAY format (from evaluation data)
  if (Array.isArray(metadataAccuracy)) {
    // Try to find by ID first
    let field = metadataAccuracy.find(item => item.id === fieldKey);
    if (field) return field;
    
    // Try to find by displayName
    field = metadataAccuracy.find(item => item.displayName === fieldKey);
    if (field) return field;
    
    // Try to find by name
    field = metadataAccuracy.find(item => item.name === fieldKey);
    if (field) return field;
    
    // Try mapped display name
    const displayName = FIELD_ID_TO_DISPLAY[fieldKey];
    if (displayName) {
      field = metadataAccuracy.find(item => item.displayName === displayName);
      if (field) return field;
    }
    
    return null;
  }
  
  // Handle OBJECT format (from some services)
  if (typeof metadataAccuracy === 'object') {
    // Try direct key access
    if (metadataAccuracy[fieldKey]) return metadataAccuracy[fieldKey];
    
    // Try mapped display name
    const displayName = FIELD_ID_TO_DISPLAY[fieldKey];
    if (displayName && metadataAccuracy[displayName]) {
      return metadataAccuracy[displayName];
    }
    
    // Try reverse lookup (display name -> id)
    const fieldId = DISPLAY_TO_FIELD_ID[fieldKey];
    if (fieldId && metadataAccuracy[fieldId]) {
      return metadataAccuracy[fieldId];
    }
  }
  
  return null;
}

/**
 * Format field name for display
 * Converts internal IDs to readable names
 */
function formatFieldName(fieldName) {
  // If it's already a display name, return it
  if (DISPLAY_TO_FIELD_ID[fieldName]) return fieldName;
  
  // If it's an ID, convert to display name
  if (FIELD_ID_TO_DISPLAY[fieldName]) return FIELD_ID_TO_DISPLAY[fieldName];
  
  // Fallback: capitalize and replace underscores
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// HELPER FUNCTIONS - METRICS CALCULATION
// ============================================================================

/**
 * Calculate detailed metadata metrics from papers
 * FIXED: Uses correct field names and handles ARRAY format
 */
function calculateDetailedMetadataMetrics(papers) {
  const metrics = {
    levenshtein: { values: [], distances: [], weighted: [] },
    tokenMatching: { values: [], precision: [], recall: [], f1: [], matchCounts: [], weighted: [] },
    specialChar: { values: [], matches: 0, total: 0 },
    byField: {}
  };

  // Initialize byField for each metadata field
  METADATA_FIELDS.forEach(field => {
    metrics.byField[field] = {
      levenshtein: [],
      tokenMatching: [],
      specialChar: [],
      overall: []
    };
  });

  papers.forEach(paper => {
    if (!paper.userEvaluations || paper.userEvaluations.length === 0) return;

    paper.userEvaluations.forEach(evaluation => {
      const metadataAccuracy = evaluation.evaluationMetrics?.accuracy?.metadata;
      
      if (!metadataAccuracy) {
        console.log('No metadata accuracy for evaluation');
        return;
      }

      // Log data format for debugging
      console.log('Metadata accuracy format:', 
        Array.isArray(metadataAccuracy) ? 'ARRAY' : 'OBJECT',
        Array.isArray(metadataAccuracy) ? metadataAccuracy.map(f => f.id || f.displayName) : Object.keys(metadataAccuracy)
      );

      METADATA_FIELDS.forEach(fieldDisplayName => {
        // Get field ID for lookup
        const fieldId = DISPLAY_TO_FIELD_ID[fieldDisplayName] || fieldDisplayName;
        
        // Use helper function to get field data (handles both ARRAY and OBJECT formats)
        const fieldData = getMetadataField(metadataAccuracy, fieldDisplayName) 
                       || getMetadataField(metadataAccuracy, fieldId);
        
        if (!fieldData) {
          console.log(`Field "${fieldDisplayName}" (id: ${fieldId}) not found in metadata`);
          return;
        }

        const sim = fieldData.similarityData;
        if (!sim) {
          console.log(`No similarityData for field "${fieldDisplayName}"`);
          return;
        }

        // Levenshtein
        if (sim.levenshtein) {
          metrics.levenshtein.values.push(sim.levenshtein.score || 0);
          metrics.levenshtein.distances.push(sim.levenshtein.distance || 0);
          metrics.levenshtein.weighted.push(sim.levenshtein.weightedScore || 0);
          metrics.byField[fieldDisplayName].levenshtein.push(sim.levenshtein.score || 0);
        }

        // Token Matching
        if (sim.tokenMatching) {
          metrics.tokenMatching.values.push(sim.tokenMatching.score || 0);
          metrics.tokenMatching.precision.push(sim.tokenMatching.precision || sim.precisionScore || 0);
          metrics.tokenMatching.recall.push(sim.tokenMatching.recall || sim.recallScore || 0);
          metrics.tokenMatching.f1.push(sim.tokenMatching.f1Score || sim.f1Score || 0);
          metrics.tokenMatching.matchCounts.push(sim.tokenMatching.tokenMatchCount || 0);
          metrics.tokenMatching.weighted.push(sim.tokenMatching.weightedScore || 0);
          metrics.byField[fieldDisplayName].tokenMatching.push(sim.tokenMatching.score || 0);
        }

        // Special Char
        if (sim.specialChar) {
          metrics.specialChar.values.push(sim.specialChar.score || 0);
          if (sim.specialChar.score === 1.0) metrics.specialChar.matches++;
          metrics.specialChar.total++;
          metrics.byField[fieldDisplayName].specialChar.push(sim.specialChar.score || 0);
        }

        // Overall for field
        const overallScore = sim.overallScore || fieldData.scoreDetails?.finalScore || 0;
        metrics.byField[fieldDisplayName].overall.push(overallScore);
      });
    });
  });

  // Calculate statistics
  const result = {
    levenshtein: calculateStats(metrics.levenshtein.values),
    tokenMatching: calculateStats(metrics.tokenMatching.values),
    specialChar: calculateStats(metrics.specialChar.values),
    byField: {}
  };

  // Add additional metrics
  result.levenshtein.avgDistance = avg(metrics.levenshtein.distances);
  result.levenshtein.avgWeighted = avg(metrics.levenshtein.weighted);
  
  result.tokenMatching.avgPrecision = avg(metrics.tokenMatching.precision);
  result.tokenMatching.avgRecall = avg(metrics.tokenMatching.recall);
  result.tokenMatching.avgF1 = avg(metrics.tokenMatching.f1);
  result.tokenMatching.avgMatchCount = avg(metrics.tokenMatching.matchCounts);
  result.tokenMatching.avgWeighted = avg(metrics.tokenMatching.weighted);

  result.specialChar.matchRate = metrics.specialChar.total > 0 
    ? (metrics.specialChar.matches / metrics.specialChar.total) * 100 
    : 0;

  // Field-level statistics
  METADATA_FIELDS.forEach(field => {
    const fieldData = metrics.byField[field];
    result.byField[field] = {
      levenshtein: avg(fieldData.levenshtein),
      tokenMatching: avg(fieldData.tokenMatching),
      specialChar: avg(fieldData.specialChar),
      overall: avg(fieldData.overall),
      count: fieldData.overall.length
    };
  });

  console.log('Calculated metrics result:', result);
  return result;
}

/**
 * Extract metrics from already-aggregated data
 * Reads from aggregatedData.papers structure
 */
function extractMetricsFromAggregatedData(papersObj) {
  // This would read from pre-aggregated statistics
  // For now, return a structure that matches what the component expects
  const result = {
    levenshtein: { mean: 0, std: 0, min: 0, max: 0, avgDistance: 0 },
    tokenMatching: { mean: 0, std: 0, avgPrecision: 0, avgRecall: 0, avgF1: 0 },
    specialChar: { mean: 0, std: 0, min: 0, max: 0, matchRate: 0 },
    byField: {}
  };

  // Initialize fields
  METADATA_FIELDS.forEach(field => {
    result.byField[field] = {
      levenshtein: 0,
      tokenMatching: 0,
      specialChar: 0,
      overall: 0
    };
  });

  // Extract from aggregated data if available
  Object.values(papersObj).forEach(paper => {
    const metadata = paper.metadata;
    if (!metadata) return;

    // If byField exists, use it
    if (metadata.byField) {
      Object.entries(metadata.byField).forEach(([fieldKey, fieldStats]) => {
        const displayName = FIELD_ID_TO_DISPLAY[fieldKey] || fieldKey;
        if (result.byField[displayName]) {
          result.byField[displayName].overall = fieldStats.mean || fieldStats.scores?.mean || 0;
        }
      });
    }

    // Use overall scores
    if (metadata.accuracyScores?.mean !== undefined) {
      result.levenshtein.mean = metadata.accuracyScores.mean;
    }
  });

  return result;
}

function calculateStats(values) {
  if (!values || values.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, median: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = avg(values);
  const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

  return {
    mean,
    std,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)]
  };
}

function avg(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Get field-specific validation checks
 */
function getFieldValidationChecks(fieldName) {
  const fieldLower = fieldName.toLowerCase();

  if (fieldLower.includes('doi')) {
    return [
      'DOI pattern validation (10.xxxx/yyyy)',
      'Prefix structure check',
      'Format consistency',
      'Unnecessary prefix detection'
    ];
  } else if (fieldLower === 'authors' || fieldLower.includes('author')) {
    return [
      'Author count completeness',
      'Name format validation',
      'Character set verification',
      'Delimiter consistency'
    ];
  } else if (fieldLower.includes('title')) {
    return [
      'Word count comparison',
      'Abbreviation detection',
      'Capitalization validation',
      'Special character preservation'
    ];
  } else if (fieldLower.includes('year') || fieldLower.includes('date') || fieldLower === 'publication_year') {
    return [
      'Year format validation (YYYY)',
      'Value range check (1900-current+2)',
      'Temporal consistency',
      'Date format standardization'
    ];
  } else if (fieldLower.includes('venue') || fieldLower.includes('journal')) {
    return [
      'Journal name presence',
      'Volume information check',
      'Abbreviation style consistency',
      'Format standardization'
    ];
  }

  return [
    'Length comparison',
    'Format validation',
    'Character accuracy',
    'Completeness check'
  ];
}

/**
 * Format percentage for display
 */
function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

/**
 * Get score color based on value
 */
function getScoreColor(score) {
  if (score >= 0.8) return 'bg-green-100 text-green-700';
  if (score >= 0.6) return 'bg-yellow-100 text-yellow-700';
  if (score >= 0.4) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export default MetadataAccuracyView;