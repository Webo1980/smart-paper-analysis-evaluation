// src\components\evaluation\metadata\components\ContentMetricsBase.jsx
import React from 'react';
import { BaseContentMetrics } from '../../base';
import { 
  calculateWeightsAndAgreement, 
  calculateBalancedOverallScore 
} from '../../base/utils/baseMetricsUtils';

const ContentMetricsBase = (props) => {
  return (
    <BaseContentMetrics
      {...props}
      calculateWeightsAndAgreement={calculateWeightsAndAgreement}
      calculateBalancedOverallScore={calculateBalancedOverallScore}
    />
  );
};

export default ContentMetricsBase;