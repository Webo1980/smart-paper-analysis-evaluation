import React from 'react';
import { Card } from '../../../ui/card';
import BaseContentMetrics from '../../base/BaseContentMetrics';

const ContentMetricsBase = (props) => {
  const { 
    fieldName, 
    metricType,
    referenceValue,
    extractedValue 
  } = props;
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">
        {fieldName} {metricType === 'accuracy' ? 'Detection Accuracy' : 'Quality Assessment'}
      </h3>
      
      <BaseContentMetrics {...props} />
    </Card>
  );
};

export default ContentMetricsBase;