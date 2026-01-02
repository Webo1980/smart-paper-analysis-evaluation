import React from 'react';
import { FormSection } from '../FormComponents';
import { Card, CardContent } from '../../ui/card';
import { Alert } from '../../ui/alert';

export const MetricsTracking = ({ data, onChange, aspect, evaluationData }) => {
  console.log("Predictions Data:", evaluationData);
  const getMetricConfig = () => {
    switch (aspect) {
      case 'metadata':
        return {
          title: "Metadata Predictions vs Ground Truth",
          items: [
            {
              id: 'title',
              prediction: evaluationData?.metadata?.title || "N/A",
              actual: evaluationData?.orkg_data?.title || "N/A"
            },
            {
              id: 'authors',
              prediction: evaluationData?.metadata?.authors?.join(', ') || "N/A",
              actual: evaluationData?.orkg_data?.authors?.join(', ') || "N/A"
            },
            {
              id: 'doi',
              prediction: evaluationData?.metadata?.doi || "N/A",
              actual: evaluationData?.orkg_data?.doi || "N/A"
            }
          ]
        };
  
      case 'research_field':
          const predictions = evaluationData?.researchFields?.fields || [];
          const groundTruth = evaluationData?.researchFields?.selectedField?.name || "Unknown";
          
          return {
            title: "Research Field Predictions vs Ground Truth",
            items: predictions.length > 0 ? predictions.map(pred => ({
              id: pred.id,
              prediction: pred.name || "Unknown",
              confidence: pred.score ? pred.score.toFixed(2) : "N/A",
              actual: groundTruth
            })) : []
          };
  
      case 'template':
        return {
          title: "Template Matching Analysis",
          items: (evaluationData?.templates || []).map(template => ({
            id: template.id,
            prediction: template.name,
            match_score: template.score,
            actual: evaluationData?.orkg_data?.template_id === template.id
          }))
        };
  
      case 'properties':
        return {
          title: "Property Value Extraction Analysis",
          items: (evaluationData?.properties || []).map(prop => ({
            id: prop.id,
            name: prop.name,
            prediction: prop.extracted_value || "N/A",
            actual: prop.orkg_value || "N/A",
            source_text: prop.source_text || "N/A"
          }))
        };
  
      default:
        return { title: "Unknown Aspect", items: [] };
    }
  };
  

  const config = getMetricConfig();

  return (
    <FormSection title={config.title}>
      <Card>
        <CardContent className="space-y-4">
          {config.items.map(item => (
            <div key={item.id} className="border-b pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-sm">System Prediction</h5>
                  <p className="mt-1">{item.prediction}</p>
                  {item.confidence && (
                    <p className="text-sm text-gray-500">
                      Confidence: {item.confidence}%
                    </p>
                  )}
                  {item.source_text && (
                    <p className="text-sm text-gray-500">
                      Source: {item.source_text}
                    </p>
                  )}
                </div>
                <div>
                  <h5 className="font-medium text-sm">Ground Truth</h5>
                  <p className="mt-1">{item.actual}</p>
                </div>
              </div>
              <div className="mt-2">
                <select
                  value={data.evaluations?.[item.id] || ''}
                  onChange={(e) => {
                    const evaluations = {
                      ...(data.evaluations || {}),
                      [item.id]: e.target.value
                    };
                    onChange({
                      ...data,
                      evaluations
                    });
                  }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select evaluation</option>
                  <option value="correct">Correct</option>
                  <option value="partial">Partially Correct</option>
                  <option value="incorrect">Incorrect</option>
                </select>
              </div>
            </div>
          ))}
          
          {config.items.length > 0 && (
            <Alert className="mt-4">
              <div className="font-medium">Confusion Matrix Stats</div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>True Positives: {calculateMetrics(data).truePositives}</div>
                <div>False Positives: {calculateMetrics(data).falsePositives}</div>
                <div>True Negatives: {calculateMetrics(data).trueNegatives}</div>
                <div>False Negatives: {calculateMetrics(data).falseNegatives}</div>
                <div>Precision: {calculateMetrics(data).precision.toFixed(2)}</div>
                <div>Recall: {calculateMetrics(data).recall.toFixed(2)}</div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </FormSection>
  );
};

const calculateMetrics = (data) => {
  const evaluations = data.evaluations || {};
  const results = Object.values(evaluations);
  
  const truePositives = results.filter(r => r === 'correct').length;
  const partialCorrect = results.filter(r => r === 'partial').length;
  const falsePositives = results.filter(r => r === 'incorrect').length;
  const total = results.length;
  
  const falseNegatives = total - truePositives - partialCorrect;
  const trueNegatives = total - truePositives - falsePositives;
  
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  
  return {
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    precision,
    recall
  };
};