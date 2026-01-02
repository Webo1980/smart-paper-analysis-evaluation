// src\components\evaluation\metadata\views\MetadataReportView.jsx
import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Textarea } from '../../../ui/textarea';
import { formatPercentage } from '../utils/metadataMetrics';
import MetadataFieldAnalysis from '../components/MetadataFieldAnalysis';
import AssessmentSummaryTable from '../../base/AssessmentSummaryTable';
import SystemConfidenceTable from '../../base/SystemConfidenceTable';
import AdvancedMetricsExplanation from '../../base/AdvancedMetricsExplanation';
import UnderstandingScoresBox from '../../base/UnderstandingScoresBox';
import { ChevronUp, ChevronDown } from 'lucide-react';

const MetadataReportView = ({
  metadataData,
  finalAssessment,
  evaluationFields,
  setShowComparison,
  comparisonComments,
  setComparisonComments,
  userInfo,
  expertiseMultiplier,
  fields
}) => {
  const mappedAssesementData = Object.fromEntries(
    fields.map(key => [key, evaluationFields[key]])
  );
  const overallAccuracyScore = finalAssessment?.overall?.f1Score || 0;
  const [isExpanded, setIsExpanded] = useState(false);  
  // Calculate overall quality score - average of character accuracy for all fields
  const calculateOverallQuality = () => {
    const fields = Object.keys(finalAssessment).filter(k => k !== 'overall');
    if (fields.length === 0) return 0;
    
    let totalQuality = 0;
    fields.forEach(field => {
      const fieldAssessment = finalAssessment[field];
      if (fieldAssessment && fieldAssessment.qualityMetrics) {
        // Use character accuracy if available, fallback to a default value
        totalQuality += fieldAssessment.qualityMetrics.characterAccuracy?.value || 0.5;
      }
    });
    
    return totalQuality / fields.length;
  };

  const overallQualityScore = calculateOverallQuality();
    
  // Count missing fields in metadata
  const countMissingFields = (metadata, orkgData) => {
    let missingCount = 0;
    
    // Check title
    if (!metadata.title && orkgData.title) missingCount++;
    
    // Check authors - consider missing if no authors array or empty array
    const hasAuthors = metadata.authors && Array.isArray(metadata.authors) && metadata.authors.length > 0;
    if (!hasAuthors && orkgData.authors && orkgData.authors.length > 0) missingCount++;
    
    // Check DOI
    if (!metadata.doi && orkgData.doi) missingCount++;
    
    // Check publication date/year
    if (!metadata.publicationDate && orkgData.publication_year) missingCount++;
    
    // Check venue
    if (!metadata.venue && orkgData.venue) missingCount++;
    
    return missingCount;
  };
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Metadata Evaluation Report</h2>
            <p className="text-gray-600">
              Review your expert assessment of the metadata extraction quality.
            </p>
          </div>
          <Button
            onClick={() => setShowComparison(false)}
            className="!bg-[#E86161] hover:!bg-[#c54545] text-white flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none"
          >
            <Edit className="h-4 w-4" />
            Edit Assessment
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 border mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Metadata Analysis Results</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 border rounded">
            <h5 className="font-medium text-sm mb-2">Total Fields</h5>
            <p className="text-2xl font-bold">
              {Object.keys(finalAssessment).filter(k => k !== 'overall').length}
            </p>
          </div>
          <div className="p-3 border rounded">
            <h5 className="font-medium text-sm mb-2">Missing Fields</h5>
            <p className="text-2xl font-bold">
              {countMissingFields(metadataData?.evaluationData?.metadata || {}, metadataData?.orkgData || {})}
            </p>
          </div>
        </div>
        <AssessmentSummaryTable 
          assessment={mappedAssesementData} 
          userInfo={userInfo} 
          domainName="metadata analysis"
        />
      </div>
      
      <div className="bg-white rounded-lg p-4 border mb-6">
      <div className="mb-6 border rounded-lg overflow-hidden">
        <div 
          className="p-4 bg-gray-100 flex justify-between items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center">
            <h3 className="text-lg font-medium">Scoring Framework</h3>
            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="bg-white p-4">
            <AdvancedMetricsExplanation expertiseMultiplier={expertiseMultiplier} />
            <SystemConfidenceTable className="mt-3" />
          </div>
        )}
      </div>
      
        <MetadataFieldAnalysis 
          fields={evaluationFields || {}} 
          orkgData={metadataData?.orkgData || {}}
          evaluationData={metadataData?.evaluationData || {}}
          expertiseWeight={userInfo?.expertiseWeight || 3}
          expertiseMultiplier={expertiseMultiplier || 1.0}
          overallQualityScore={overallQualityScore}
          metrics={metadataData?.metrics || {}} // Add metrics
          analysisData={metadataData?.analysisData || {}} // Add analysisData
        />
      </div>
      {/* Expert Comments section */}
      <div className="bg-white rounded-lg p-4 border mb-6">
        <h4 className="text-lg font-medium mb-4">Expert Comments</h4>
        <Textarea
          id="comparison-comments"
          className="min-h-[100px] resize-none focus:ring-red-500 focus:border-red-500"
          placeholder="Add your expert observations about the metadata analysis..."
          value={comparisonComments}
          onChange={(e) => setComparisonComments(e.target.value)}
        />
      </div>
      
      {/* Remove the Field Analysis section, and Scoring Framework section for now, will reintroduce later after completing the evaluation 
      <UnderstandingScoresBox />
      */}
    </div>
  );
};

export default MetadataReportView;