// src\utils\metrics.js
export const calculateMetrics = (predictions, groundTruth, type) => {
  switch (type) {
    case 'metadata':
      return calculateMetadataMetrics(predictions, groundTruth);
    case 'researchField':
      return calculateResearchFieldMetrics(predictions, groundTruth);
    case 'template':
      return calculateTemplateMetrics(predictions, groundTruth);
    case 'properties':
      return calculatePropertyMetrics(predictions, groundTruth);
    default:
      return null;
  }
};

const calculateMetadataMetrics = (predictions, groundTruth) => {
  if (!predictions || !groundTruth) return { accuracy: 0, details: {} };

  const fields = ['title', 'authors', 'doi', 'date', 'venue'];
  let matches = 0;
  const details = {};

  fields.forEach(field => {
    const predValue = predictions[field];
    const truthValue = groundTruth[field];
    const isMatch = compareValues(predValue, truthValue);
    
    if (isMatch) matches++;
    details[field] = {
      matches: isMatch,
      prediction: predValue,
      truth: truthValue
    };
  });

  return {
    accuracy: matches / fields.length,
    details
  };
};

const calculateResearchFieldMetrics = (predictions, groundTruth) => {
  if (!predictions?.fields || !groundTruth) return null;

  const topPrediction = predictions.fields[0];
  const inTop5 = predictions.fields.slice(0, 5).some(f => f.name === groundTruth);

  return {
    exactMatch: topPrediction?.name === groundTruth,
    inTop5,
    confidence: topPrediction?.score || 0,
    predictions: predictions.fields.map(f => ({
      field: f.name,
      confidence: f.score,
      correct: f.name === groundTruth
    }))
  };
};

const calculateTemplateMetrics = (predictions, groundTruth) => {
  if (!predictions?.template || !groundTruth) return null;

  const templateMatch = predictions.template.id === groundTruth.id;
  const propertyMatch = calculatePropertyMatchScore(
    predictions.template.properties,
    groundTruth.properties
  );

  return {
    correctTemplate: templateMatch,
    propertyMatch,
    structure: calculateStructureSimilarity(predictions.template, groundTruth)
  };
};

const calculatePropertyMetrics = (predictions, groundTruth) => {
  if (!predictions || !groundTruth) return null;

  const evaluated = predictions.map(pred => {
    const truth = groundTruth.find(t => t.id === pred.id);
    return {
      id: pred.id,
      name: pred.name,
      correct: compareValues(pred.value, truth?.value),
      confidence: pred.confidence
    };
  });

  return {
    accuracy: evaluated.filter(e => e.correct).length / evaluated.length,
    coverage: predictions.length / groundTruth.length,
    details: evaluated
  };
};

const compareValues = (pred, truth) => {
  if (!pred || !truth) return false;
  if (Array.isArray(pred) && Array.isArray(truth)) {
    return pred.length === truth.length && 
           pred.every(p => truth.includes(p));
  }
  return String(pred).toLowerCase().trim() === String(truth).toLowerCase().trim();
};

const calculatePropertyMatchScore = (predProps, truthProps) => {
  if (!predProps || !truthProps) return 0;
  const matching = predProps.filter(p => 
    truthProps.some(t => t.name === p.name)
  ).length;
  return matching / Math.max(predProps.length, truthProps.length);
};

const calculateStructureSimilarity = (pred, truth) => {
  if (!pred || !truth) return 0;
  const predTypes = new Set(pred.properties.map(p => p.type));
  const truthTypes = new Set(truth.properties.map(p => p.type));
  const intersection = new Set([...predTypes].filter(x => truthTypes.has(x)));
  return intersection.size / Math.max(predTypes.size, truthTypes.size);
};