export const validateSection = (section, data) => {
  const errors = {};

  switch (section) {
    case 'metadata':
      if (!data.titleExtraction) errors.titleExtraction = 'Required';
      if (!data.authorsExtraction) errors.authorsExtraction = 'Required';
      if (!data.doiExtraction) errors.doiExtraction = 'Required';
      if (!data.publicationDate) errors.publicationDate = 'Required';
      if (!data.qualityScore) errors.qualityScore = 'Required';
      break;

    case 'researchField':
      if (!data.matchType) errors.matchType = 'Required';
      if (!data.accuracyScore) errors.accuracyScore = 'Required';
      break;

    case 'template':
      if (!data.templateSource) errors.templateSource = 'Required';
      if (data.templateSource === 'Existing ORKG Template') {
        if (!data.comprehensiveness) errors.comprehensiveness = 'Required';
        if (!data.propertyRelevance) errors.propertyRelevance = 'Required';
        if (!data.propertyCoverage) errors.propertyCoverage = 'Required';
      } else {
        if (!data.templateStructure) errors.templateStructure = 'Required';
        if (!data.propertyNaming) errors.propertyNaming = 'Required';
        if (!data.dataTypeSelection) errors.dataTypeSelection = 'Required';
      }
      break;

    case 'property':
      if (!data.accuracyScore) errors.accuracyScore = 'Required';
      if (!data.completenessScore) errors.completenessScore = 'Required';
      if (!data.evidenceScore) errors.evidenceScore = 'Required';
      break;

    case 'system':
      if (!data.processingTime) errors.processingTime = 'Required';
      if (!data.apiResponseTime) errors.apiResponseTime = 'Required';
      if (!data.apiCalls) errors.apiCalls = 'Required';
      break;

    case 'innovation':
      if (!data.qualityImprovement) errors.qualityImprovement = 'Required';
      if (!data.userSatisfaction) errors.userSatisfaction = 'Required';
      break;

    case 'final':
      if (!data.overallScore) errors.overallScore = 'Required';
      if (!data.recommendation) errors.recommendation = 'Required';
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};