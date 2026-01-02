// src/components/evaluation/content/components/ValueAccuracyAnalysis.jsx
import React from 'react';
import { Progress } from '../../../ui/progress';
import { AlertCircle } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import SemanticTextComparison from '../../base/SemanticTextComparison';

const ValueAccuracyAnalysis = ({ accuracyData, textSections }) => {
  if (!accuracyData) return null;
  
  return (
    <div className="space-y-3">
      <div className="bg-white p-3 rounded border">
        <h6 className="text-xs font-medium mb-2">Value Accuracy Summary</h6>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs">
            <span className="font-medium">Accurate Values: </span>
            <span>{accuracyData.details?.accurateValues || 0} of {accuracyData.details?.totalValues || 0} values</span>
          </div>
          <div className="text-xs">
            <span className="font-medium">Accuracy: </span>
            <span>{formatPercentage(accuracyData.score)}</span>
          </div>
        </div>
        
        <Progress value={accuracyData.score * 100} className="h-2" />
        
        {accuracyData.issues?.length > 0 && (
          <div className="mt-3 bg-yellow-50 p-2 rounded text-xs">
            <p className="font-medium mb-1">Issues:</p>
            <ul className="list-disc list-inside">
              {accuracyData.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {accuracyData.details?.accuracyBreakdown && (
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Accuracy by Property Type</h6>
          <div className="space-y-2">
            {Object.entries(accuracyData.details.accuracyBreakdown).map(([type, data], i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">{type}</span>
                  <span className="text-xs">{formatPercentage(data.score)}</span>
                </div>
                <div className="flex items-center">
                  <Progress value={data.score * 100} className="flex-grow h-2" />
                  <span className="ml-2 text-xs">{data.correct}/{data.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {accuracyData.details?.inaccurateValues?.length > 0 && (
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Inaccurate Values</h6>
          <div className="space-y-2">
            {accuracyData.details.inaccurateValues.slice(0, 5).map((value, i) => (
              <div key={i} className="bg-gray-50 p-2 rounded text-xs">
                <div className="flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
                  <span className="font-medium">{value.property}: </span>
                  <span className="ml-1 truncate">{value.value}</span>
                </div>
                {value.confidence !== undefined && (
                  <div className="mt-1 text-xs">
                    <span className="font-medium">Confidence: </span>
                    <span>{Math.round(value.confidence * 100)}%</span>
                  </div>
                )}
                <div className="mt-1 text-xs">
                  <span className="font-medium">Issue: </span>
                  <span>{value.issue}</span>
                </div>
                
                {/* Add semantic text comparison if evidence is available */}
                {value.evidence && textSections[value.section] && (
                  <div className="mt-2">
                    <SemanticTextComparison
                      sourceText={textSections[value.section]}
                      targetText={value.evidence}
                      sourceLabel={`Paper Text (${value.section})`}
                      targetLabel="Evidence Text"
                      similarityThreshold={0.6}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {accuracyData.details.inaccurateValues.length > 5 && (
              <div className="text-xs text-center text-gray-500">
                +{accuracyData.details.inaccurateValues.length - 5} more inaccurate values
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValueAccuracyAnalysis;