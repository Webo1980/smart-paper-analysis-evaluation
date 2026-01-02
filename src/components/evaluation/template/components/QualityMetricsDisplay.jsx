import React from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { QUALITY_WEIGHTS } from '../config/templateConfig';

/**
 * Component to display template quality metrics with visualizations
 */
const QualityMetricsDisplay = ({ qualityData }) => {
  if (!qualityData || !qualityData.fieldSpecificMetrics) return null;
  
  const metrics = qualityData.fieldSpecificMetrics;
  
  // Get individual scores
  const titleScore = metrics.titleQuality?.score || 0;
  const descriptionScore = metrics.descriptionQuality?.score || 0;
  const coverageScore = metrics.propertyCoverage?.score || 0;
  const alignmentScore = metrics.researchAlignment?.score || 0;
  
  // Get weighted scores
  const weightedTitleScore = titleScore * QUALITY_WEIGHTS.titleQuality;
  const weightedDescriptionScore = descriptionScore * QUALITY_WEIGHTS.descriptionQuality;
  const weightedCoverageScore = coverageScore * QUALITY_WEIGHTS.propertyCoverage;
  const weightedAlignmentScore = alignmentScore * QUALITY_WEIGHTS.researchAlignment;
  
  // Calculate total score
  const totalScore = weightedTitleScore + weightedDescriptionScore + weightedCoverageScore + weightedAlignmentScore;
  
  return (
    <div className="space-y-4">
      <h6 className="text-xs font-medium">Quality Metrics Visualization</h6>
      
      {/* Primary metrics visualization */}
      <div className="space-y-2">
        {/* Title Quality */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium">Title Quality</span>
            <span className="text-xs">{formatPercentage(titleScore)}</span>
          </div>
          <Progress value={titleScore * 100} className="h-2" />
          <div className="text-xs mt-0.5 text-gray-500">
            {QUALITY_WEIGHTS.titleQuality * 100}% weight contribution
          </div>
        </div>
        
        {/* Description Quality */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium">Description Quality</span>
            <span className="text-xs">{formatPercentage(descriptionScore)}</span>
          </div>
          <Progress value={descriptionScore * 100} className="h-2" />
          <div className="text-xs mt-0.5 text-gray-500">
            {QUALITY_WEIGHTS.descriptionQuality * 100}% weight contribution
          </div>
        </div>
        
        {/* Property Coverage */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium">Property Coverage</span>
            <span className="text-xs">{formatPercentage(coverageScore)}</span>
          </div>
          <Progress value={coverageScore * 100} className="h-2" />
          <div className="text-xs mt-0.5 text-gray-500">
            {QUALITY_WEIGHTS.propertyCoverage * 100}% weight contribution
          </div>
        </div>
        
        {/* Research Alignment */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium">Research Alignment</span>
            <span className="text-xs">{formatPercentage(alignmentScore)}</span>
          </div>
          <Progress value={alignmentScore * 100} className="h-2" />
          <div className="text-xs mt-0.5 text-gray-500">
            {QUALITY_WEIGHTS.researchAlignment * 100}% weight contribution
          </div>
        </div>
      </div>
      
      {/* Detailed metrics visualization */}
      <div className="bg-white p-2 rounded-md border text-xs">
        <h6 className="font-medium mb-2">Dimension Details</h6>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="font-medium">Title Quality:</p>
            <p>{formatPercentage(titleScore)}</p>
            <p className="text-gray-500 text-xs mt-1">
              Measures title clarity and domain relevance
            </p>
          </div>
          
          <div>
            <p className="font-medium">Description Quality:</p>
            <p>{formatPercentage(descriptionScore)}</p>
            <p className="text-gray-500 text-xs mt-1">
              Evaluates description completeness and clarity
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <p className="font-medium">Property Coverage:</p>
            <p>{formatPercentage(coverageScore)}</p>
            <p className="text-gray-500 text-xs mt-1">
              Assesses property completeness for domain needs
            </p>
          </div>
          
          <div>
            <p className="font-medium">Research Alignment:</p>
            <p>{formatPercentage(alignmentScore)}</p>
            <p className="text-gray-500 text-xs mt-1">
              Measures alignment with research problem
            </p>
          </div>
        </div>
        
        <div className="mt-3">
          <p className="font-medium">Weighted Score Components:</p>
          <div className="grid grid-cols-4 gap-1 mt-1">
            <div className="bg-blue-50 p-1 rounded text-center">
              <p>Title</p>
              <p className="font-medium">{formatPercentage(weightedTitleScore)}</p>
            </div>
            <div className="bg-green-50 p-1 rounded text-center">
              <p>Description</p>
              <p className="font-medium">{formatPercentage(weightedDescriptionScore)}</p>
            </div>
            <div className="bg-purple-50 p-1 rounded text-center">
              <p>Coverage</p>
              <p className="font-medium">{formatPercentage(weightedCoverageScore)}</p>
            </div>
            <div className="bg-yellow-50 p-1 rounded text-center">
              <p>Alignment</p>
              <p className="font-medium">{formatPercentage(weightedAlignmentScore)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overall score visualization */}
      <div className="bg-gray-50 p-2 rounded-md border">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">Overall Quality Score</span>
          <span className="text-xs font-medium">{formatPercentage(totalScore)}</span>
        </div>
        <Progress value={totalScore * 100} className="h-3" />
      </div>
    </div>
  );
};
export default QualityMetricsDisplay;