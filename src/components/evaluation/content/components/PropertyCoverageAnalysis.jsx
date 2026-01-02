import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';
import { PROPERTY_COVERAGE_WEIGHTS, PROPERTY_COVERAGE_EXPLANATIONS } from '../config/contentConfig';
import PropertyTypeChart from '../visualizations/PropertyTypeChart';
import PropertyCompletionTable from '../visualizations/PropertyCompletionTable';
import { PropertyDistributionChart } from '../visualizations/PropertyDistributionChart';
import { 
  analyzeProperties, 
  calculatePropertyCoverageScores, 
  getPropertyCoverageExplanation, 
  generateTypeMatchReport, 
  generateGranularityReport 
} from '../utils/propertyCoverageUtils';

/**
 * Component that analyzes property coverage metrics
 */
const PropertyCoverageAnalysis = ({ metrics, templateProperties, paperContent }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState({
    dataTypeMatch: false,
    granularityQuality: false,
    valueCompleteness: false
  });
  
  const [showExplanation, setShowExplanation] = useState({
    dataTypeMatch: false,
    granularityQuality: false,
    valueCompleteness: false
  });
  
  if (!metrics || !metrics.propertyCoverage) {
    return <div className="text-center text-gray-500">No property coverage data available</div>;
  }

  const propertyCoverage = metrics.propertyCoverage;
  const details = propertyCoverage.details || {};
  
  // Toggle section expansion
  const toggleMetric = (metric) => {
    setExpandedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // Toggle explanation visibility
  const toggleExplanation = (metric) => {
    setShowExplanation(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // Get explanations from config
  const getExplanation = (metric) => {
    const explanation = getPropertyCoverageExplanation(metric);
    // Ensure interpretation exists
    if (!explanation.interpretation && explanation.interpretation) {
      explanation.interpretation = explanation.interpretation;
    }
    return explanation;
  };
  
  // Analyze template properties and identified properties
  const propertyAnalysis = analyzeProperties(paperContent, templateProperties);
  
  // Calculate coverage scores using utility function
  const coverageScores = calculatePropertyCoverageScores(metrics);
  
  // Generate detailed reports
  const typeMatchReport = generateTypeMatchReport(paperContent, templateProperties);
  const granularityReport = generateGranularityReport(paperContent);
  
  // Destructure coverage scores
  const { 
    dataTypeScore, 
    granularityScore, 
    completenessScore,
    weightedDataTypeScore,
    weightedGranularityScore,
    weightedCompletenessScore,
    combinedScore
  } = coverageScores;

  // Filter the data type issues to only include actual mismatches
  const dataTypeIssues = typeMatchReport.mismatches.map(mismatch => ({
    property: mismatch.property,
    propertyLabel: mismatch.propertyLabel,
    expectedType: mismatch.expectedType,
    actualType: mismatch.issues[0]?.actualType || 'unknown'
  }));

  // Compare property completion with template requirements
  const existingPropertiesMap = {};
  
  // First, mark which properties exist in the paper content with valid values
  Object.keys(paperContent || {}).forEach(propId => {
    const prop = paperContent[propId];
    if (prop && prop.values && prop.values.length > 0 && 
        prop.values.some(v => v.value !== null && v.value !== undefined && v.value !== '')) {
      existingPropertiesMap[propId] = true;
    }
  });
  
  // Now, identify truly missing properties
  const actualMissingProperties = Object.keys(templateProperties || {}).filter(propId => 
    !existingPropertiesMap[propId]
  );

  // Get property counts for completeness calculation
  const totalProperties = Object.keys(templateProperties || {}).length;
  const propertiesWithValues = Object.keys(existingPropertiesMap).length;

  return (
    <div className="space-y-4">
      {/* Overview metrics and charts */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded border">
            <div className="text-xs text-gray-500">Property Coverage Rate</div>
            <div className="text-lg font-semibold">
              {formatPercentage(details.coverageRate || 0)}
            </div>
            <div className="text-xs mt-1">
              {details.annotatedCount || 0} of {details.totalProperties || 0} properties annotated
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded border">
            <div className="text-xs text-gray-500">Overall Quality</div>
            <div className="text-lg font-semibold">{formatPercentage(propertyCoverage.score || 0)}</div>
            <div className="text-xs mt-1">Combined score across all metrics</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h6 className="text-xs font-medium">Component Contributions</h6>
          
          {/* Data Type Match */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs">Data Type Match ({PROPERTY_COVERAGE_WEIGHTS.dataTypeMatch * 100}%)</span>
              <span className="text-xs">{formatPercentage(dataTypeScore)}</span>
            </div>
            <Progress value={dataTypeScore * 100} className="h-2" />
          </div>
          
          {/* Granularity Quality */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs">Granularity Quality ({PROPERTY_COVERAGE_WEIGHTS.granularityQuality * 100}%)</span>
              <span className="text-xs">{formatPercentage(granularityScore)}</span>
            </div>
            <Progress value={granularityScore * 100} className="h-2" />
          </div>
          
          {/* Value Completeness */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs">Value Completeness ({PROPERTY_COVERAGE_WEIGHTS.valueCompleteness * 100}%)</span>
              <span className="text-xs">{formatPercentage(completenessScore)}</span>
            </div>
            <Progress value={completenessScore * 100} className="h-2" />
          </div>
        </div>
      </div>
      
      {/* Detailed metrics */}
      <div className="space-y-3">
        {/* Data Type Match */}
        <div className="border rounded p-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleMetric('dataTypeMatch')}
          >
            <div className="font-medium text-sm">Data Type Match:</div>
            <div className="flex items-center">
              <span className={`mr-2 px-2 py-0.5 rounded text-xs ${getStatusBadgeColor(dataTypeScore)}`}>
                {formatPercentage(dataTypeScore)}
              </span>
              {expandedMetrics.dataTypeMatch ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          
          {expandedMetrics.dataTypeMatch && (
            <div className="mt-3 space-y-3">
              <p className="text-xs">
                {getExplanation('dataTypeMatch').description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Explanation Section */}
                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                    onClick={() => toggleExplanation('dataTypeMatch')}
                  >
                    <span className="text-xs font-medium text-blue-800">How is data type match calculated?</span>
                    {showExplanation.dataTypeMatch ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                  
                  {showExplanation.dataTypeMatch && (
                    <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Formula:</div>
                        <div className="font-mono text-gray-700">{getExplanation('dataTypeMatch').formula}</div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Example:</div>
                        <div className="text-gray-700">{getExplanation('dataTypeMatch').example}</div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Interpretation:</div>
                        <ul className="list-disc list-inside">
                          {getExplanation('dataTypeMatch').interpretation?.map((item, i) => (
                            <li key={i}>{item}</li>
                          )) || (
                            <li>This score measures how well the annotated properties match their expected data types as defined in the template.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Calculation Details */}
                <div className="bg-white rounded border p-2">
                  <div className="flex items-center mb-2">
                    <Calculator className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-xs font-medium">Calculation Details</span>
                  </div>
                  
                  <div className="text-xs space-y-2">
                    <div className="bg-gray-50 p-2 rounded border">
                      <div className="font-medium mb-1">Data Type Match</div>
                      <div className="flex justify-between">
                        <span>Correct Types:</span>
                        <span>{typeMatchReport.matchedProperties} of {typeMatchReport.totalProperties}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Match Rate:</span>
                        <span className="font-medium">{formatPercentage(typeMatchReport.matchRate)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded border">
                      <div className="font-medium mb-1">Weighted Score</div>
                      <div className="flex justify-between">
                        <span>Weight:</span>
                        <span>{PROPERTY_COVERAGE_WEIGHTS.dataTypeMatch} ({PROPERTY_COVERAGE_WEIGHTS.dataTypeMatch * 100}%)</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Weighted Value:</span>
                        <span className="font-medium">{formatPercentage(weightedDataTypeScore)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Property Type Chart */}
              <div>
                <h6 className="text-xs font-medium mb-2">Property Type Distribution</h6>
                <div className="bg-white p-3 rounded border" style={{ minHeight: "320px", height: "auto" }}>
                  <PropertyTypeChart 
                    templateProperties={templateProperties} 
                    paperContent={paperContent} 
                  />
                </div>
              </div>
              
              {/* Type error properties */}
              {dataTypeIssues.length > 0 && (
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                    <h6 className="text-xs font-medium">Data Type Mismatch Report:</h6>
                  </div>
                  
                  <div className="mt-2 text-xs">
                    <div className="grid grid-cols-3 gap-2 font-medium bg-white p-1 rounded border">
                      <div>Property</div>
                      <div>Expected Type</div>
                      <div>Actual Type</div>
                    </div>
                    
                    {dataTypeIssues.map((issue, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 mt-1 bg-white p-1 rounded border">
                        <div>{issue.propertyLabel}</div>
                        <div className="font-mono text-green-700">{issue.expectedType}</div>
                        <div className="font-mono text-red-700">{issue.actualType}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-xs font-medium">Impact on score:</div>
                  <div className="text-xs">Each type mismatch reduces the dataTypeMatchRate, which accounts for {PROPERTY_COVERAGE_WEIGHTS.dataTypeMatch * 100}% of the overall property coverage score.</div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Granularity Quality */}
        <div className="border rounded p-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleMetric('granularityQuality')}
          >
            <div className="font-medium text-sm">Granularity Quality:</div>
            <div className="flex items-center">
              <span className={`mr-2 px-2 py-0.5 rounded text-xs ${getStatusBadgeColor(granularityScore)}`}>
                {formatPercentage(granularityScore)}
              </span>
              {expandedMetrics.granularityQuality ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          
          {expandedMetrics.granularityQuality && (
            <div className="mt-3 space-y-3">
              <p className="text-xs">
                {getExplanation('granularityQuality').description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Explanation Section */}
                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                    onClick={() => toggleExplanation('granularityQuality')}
                  >
                    <span className="text-xs font-medium text-blue-800">How is granularity quality calculated?</span>
                    {showExplanation.granularityQuality ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                  
                  {showExplanation.granularityQuality && (
                    <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Formula:</div>
                        <div className="font-mono text-gray-700">{getExplanation('granularityQuality').formula}</div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Example:</div>
                        <div className="text-gray-700">{getExplanation('granularityQuality').example}</div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Value Type Scoring:</div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left p-1">Value Type</th>
                              <th className="text-left p-1">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries({
                              'Detailed text (>10 words)': 1.0,
                              'Medium text (3-10 words)': 0.8,
                              'Simple text (1-3 words)': 0.5,
                              'Numeric value': 0.7,
                              'Boolean value': 0.3,
                              'Complex object': 0.9,
                              'Array value': 0.85,
                              'Empty value': 0
                            }).map(([type, score], idx) => (
                              <tr key={idx} className="border-t">
                                <td className="p-1">{type}</td>
                                <td className="p-1 font-medium">{score}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Calculation Details */}
                <div className="bg-white rounded border p-2">
                  <div className="flex items-center mb-2">
                    <Calculator className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-xs font-medium">Granularity Analysis</span>
                  </div>
                  
                  <div className="text-xs space-y-2">
                    <div className="bg-gray-50 p-2 rounded border">
                      <div className="font-medium mb-1">Value Type Distribution</div>
                      <div className="space-y-1">
                        {granularityReport.typeDistribution?.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.type}:</span>
                            <span>{item.count} ({Math.round(item.percentage * 100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded border">
                      <div className="font-medium mb-1">Weighted Score</div>
                      <div className="flex justify-between">
                        <span>Weight:</span>
                        <span>{PROPERTY_COVERAGE_WEIGHTS.granularityQuality} ({PROPERTY_COVERAGE_WEIGHTS.granularityQuality * 100}%)</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Weighted Value:</span>
                        <span className="font-medium">{formatPercentage(weightedGranularityScore)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Property Distribution Chart */}
              <div>
                <h6 className="text-xs font-medium mb-2">Granularity Analysis by Value Type</h6>
                <div className="bg-white p-3 rounded border">
                  <div className="grid grid-cols-2 gap-4">
                    <div style={{ minHeight: "320px", height: "auto" }}>
                      <h6 className="text-xs font-medium mb-2">Value Type Distribution</h6>
                      <div>
                        <PropertyDistributionChart 
                          paperContent={paperContent} 
                          granularityReport={granularityReport}
                        />
                      </div>
                    </div>
                    <div>
                      <h6 className="text-xs font-medium mb-2">Granularity Interpretation</h6>
                      <div className="text-xs space-y-2">
                        <p>The granularity score indicates how detailed and specific the property values are:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><span className="font-medium text-green-700">High granularity (0.8-1.0):</span> Detailed values with rich information</li>
                          <li><span className="font-medium text-yellow-700">Medium granularity (0.5-0.8):</span> Adequate detail but could be more specific</li>
                          <li><span className="font-medium text-red-700">Low granularity (0-0.5):</span> Overly simple values lacking detail</li>
                        </ul>
                        <p className="mt-2">Current average: <span className={`font-medium ${
                          granularityScore >= 0.8 ? 'text-green-700' : 
                          granularityScore >= 0.5 ? 'text-yellow-700' : 'text-red-700'
                        }`}>{formatPercentage(granularityScore)}</span></p>
                        <p className="mt-1">{
                          granularityScore >= 0.8 ? 'Excellent granularity with detailed property values' :
                          granularityScore >= 0.5 ? 'Acceptable granularity with room for improvement' :
                          'Low granularity - values need more detail and specificity'
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Value Completeness */}
        <div className="border rounded p-3">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleMetric('valueCompleteness')}
          >
            <div className="font-medium text-sm">Value Completeness:</div>
            <div className="flex items-center">
              <span className={`mr-2 px-2 py-0.5 rounded text-xs ${getStatusBadgeColor(completenessScore)}`}>
                {formatPercentage(completenessScore)}
              </span>
              {expandedMetrics.valueCompleteness ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          
          {expandedMetrics.valueCompleteness && (
            <div className="mt-3 space-y-3">
              <p className="text-xs">
                {getExplanation('valueCompleteness').description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Explanation Section */}
                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer bg-blue-50 p-2 rounded border border-blue-100"
                    onClick={() => toggleExplanation('valueCompleteness')}
                  >
                    <span className="text-xs font-medium text-blue-800">How is value completeness calculated?</span>
                    {showExplanation.valueCompleteness ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                  
                  {showExplanation.valueCompleteness && (
                    <div className="mt-2 text-xs space-y-2 p-2 bg-gray-50 rounded border">
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Formula:</div>
                        <div className="font-mono text-gray-700">{getExplanation('valueCompleteness').formula}</div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Example:</div>
                        <div className="text-gray-700">{getExplanation('valueCompleteness').example}</div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium mb-1">Interpretation:</div>
                        <ul className="list-disc list-inside">
                          {getExplanation('valueCompleteness').interpretation?.map((item, i) => (
                            <li key={i}>{item}</li>
                          )) || (
                            <li>This score measures whether properties have complete values with supporting evidence.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Calculation Details */}
                <div className="bg-white rounded border p-2">
                  <div className="flex items-center mb-2">
                    <Calculator className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-xs font-medium">Calculation Details</span>
                  </div>
                  
                  <div className="text-xs space-y-2">
                    <div className="bg-gray-50 p-2 rounded border">
                      <div className="font-medium mb-1">Value Completeness</div>
                      <div className="flex justify-between">
                        <span>Properties with Values:</span>
                        <span>{propertiesWithValues} of {totalProperties}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Properties with Evidence:</span>
                        <span>{details.propertiesWithEvidence || 0} of {totalProperties}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded border">
                      <div className="font-medium mb-1">Weighted Score</div>
                      <div className="flex justify-between">
                        <span>Weight:</span>
                        <span>{PROPERTY_COVERAGE_WEIGHTS.valueCompleteness} ({PROPERTY_COVERAGE_WEIGHTS.valueCompleteness * 100}%)</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Weighted Value:</span>
                        <span className="font-medium">{formatPercentage(weightedCompletenessScore)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Property Completion Table */}
              <div>
                <h6 className="text-xs font-medium mb-2">Property Completion Status</h6>
                <div className="bg-white rounded border">
                  <PropertyCompletionTable 
                    templateProperties={templateProperties}
                    paperContent={paperContent}
                  />
                </div>
              </div>
              
              {/* Missing properties */}
              {actualMissingProperties.length > 0 && (
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                    <h6 className="text-xs font-medium">Missing Properties:</h6>
                  </div>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {actualMissingProperties.map((propId, idx) => (
                      <li key={idx}>
                        {templateProperties[propId]?.label || propId}
                        {templateProperties[propId]?.required && 
                          <span className="text-red-600 font-medium"> (Required)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Overall Quality Calculation */}
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
        <div className="flex items-center mb-2">
          <Info className="h-4 w-4 text-blue-600 mr-1" />
          <h6 className="text-xs font-medium text-blue-800">Overall Property Coverage Score Calculation</h6>
        </div>
        
        <div className="text-xs">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-white p-2 rounded border border-blue-100">
              <div className="font-medium mb-1">Data Type Match</div>
              <div className="flex justify-between">
                <span>{formatPercentage(dataTypeScore)}</span>
                <span>× {PROPERTY_COVERAGE_WEIGHTS.dataTypeMatch}</span>
              </div>
              <div className="font-medium mt-1 text-right">{formatPercentage(weightedDataTypeScore)}</div>
            </div>
            
            <div className="bg-white p-2 rounded border border-blue-100">
              <div className="font-medium mb-1">Granularity Quality</div>
              <div className="flex justify-between">
                <span>{formatPercentage(granularityScore)}</span>
                <span>× {PROPERTY_COVERAGE_WEIGHTS.granularityQuality}</span>
              </div>
              <div className="font-medium mt-1 text-right">{formatPercentage(weightedGranularityScore)}</div>
            </div>
            
            <div className="bg-white p-2 rounded border border-blue-100">
              <div className="font-medium mb-1">Value Completeness</div>
              <div className="flex justify-between">
                <span>{formatPercentage(completenessScore)}</span>
                <span>× {PROPERTY_COVERAGE_WEIGHTS.valueCompleteness}</span>
              </div>
              <div className="font-medium mt-1 text-right">{formatPercentage(weightedCompletenessScore)}</div>
            </div>
          </div>
          
          <div className="bg-white p-2 rounded border border-blue-100">
            <div className="font-medium mb-1">Final Calculation</div>
            <div className="font-mono mb-1">
              {formatPercentage(weightedDataTypeScore)} + {formatPercentage(weightedGranularityScore)} + {formatPercentage(weightedCompletenessScore)}
            </div>
            <div className="font-medium text-right">{formatPercentage(combinedScore)}</div>
          </div>
        </div>
      </div>
      
      {/* Issues detected */}
      {propertyCoverage.issues?.length > 0 && (
        <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
          <h6 className="text-sm font-medium flex items-center text-yellow-800">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Issues Detected
          </h6>
          <ul className="list-disc list-inside mt-2 text-xs text-yellow-800">
            {propertyCoverage.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PropertyCoverageAnalysis;