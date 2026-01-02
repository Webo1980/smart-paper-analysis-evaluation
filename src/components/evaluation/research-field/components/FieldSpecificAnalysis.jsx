import React from 'react';

const FieldSpecificAnalysis = ({ 
  fieldName, 
  orkgValue, 
  extractedValue 
}) => {
  // Basic text similarity and comparison
  const getTextSimilarity = (ref, ext) => {
    if (!ref || !ext) return 'No comparison possible';
    
    const refWords = ref.toLowerCase().split(/\s+/);
    const extWords = ext.toLowerCase().split(/\s+/);
    
    const commonWords = refWords.filter(word => extWords.includes(word));
    const similarityPercentage = (commonWords.length / refWords.length) * 100;
    
    return {
      commonWordsCount: commonWords.length,
      similarityPercentage: similarityPercentage.toFixed(1)
    };
  };

  const similarity = getTextSimilarity(orkgValue, extractedValue);

  return (
    <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
      <div>
        <span className="font-medium">Reference {fieldName}:</span>
        <span className="ml-2 text-gray-700">{orkgValue || 'N/A'}</span>
      </div>
      <div>
        <span className="font-medium">Extracted {fieldName}:</span>
        <span className="ml-2 text-gray-700">{extractedValue || 'N/A'}</span>
      </div>
      <div className="border-t pt-2">
        <div className="flex justify-between">
          <span>Common Words:</span>
          <span className="font-medium">{similarity.commonWordsCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Similarity:</span>
          <span className="font-medium">{similarity.similarityPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default FieldSpecificAnalysis;