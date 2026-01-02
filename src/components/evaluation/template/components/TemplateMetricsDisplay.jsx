// src/components/evaluation/template/components/QualityMetricsDisplay.jsx
import React from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { QUALITY_WEIGHTS } from '../config/templateConfig';
import { QualityDimensionRadar } from '../visualizations/QualityDimensionRadar';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border">
          <h6 className="text-sm font-medium mb-3">Quality Dimensions</h6>
          <QualityDimensionRadar qualityData={qualityData} height={250} />
        </div>
        
        <div>
          <h6 className="text-sm font-medium mb-3">Dimension Breakdown</h6>
          
          <div className="space-y-3">
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
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className="bg-blue-50 p-2 rounded text-center">
          <p className="text-xs">Title</p>
          <p className="font-medium">{formatPercentage(weightedTitleScore)}</p>
        </div>
        <div className="bg-green-50 p-2 rounded text-center">
          <p className="text-xs">Description</p>
          <p className="font-medium">{formatPercentage(weightedDescriptionScore)}</p>
        </div>
        <div className="bg-purple-50 p-2 rounded text-center">
          <p className="text-xs">Coverage</p>
          <p className="font-medium">{formatPercentage(weightedCoverageScore)}</p>
        </div>
        <div className="bg-yellow-50 p-2 rounded text-center">
          <p className="text-xs">Alignment</p>
          <p className="font-medium">{formatPercentage(weightedAlignmentScore)}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md border">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Overall Quality Score</span>
          <span className="text-sm font-medium">{formatPercentage(totalScore)}</span>
        </div>
        <Progress value={totalScore * 100} className="h-3" />
        <p className="text-xs mt-2 text-gray-600">
          The overall quality score is calculated by weighing each dimension according to its importance.
          For more detailed analysis, explore the specific dimension tabs above.
        </p>
      </div>
    </div>
  );
};

export default QualityMetricsDisplay;