// src\utils\csvHelpers.js
import Papa from 'papaparse';
import _ from 'lodash';

export const loadCSVData = async (filePath) => {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const papers = results.data;
          const fields = _.uniq(papers.map(paper => paper.research_field_name));
          resolve({ papers, fields });
        }
      });
    });
  } catch (error) {
    console.error('Error loading CSV:', error);
    return { papers: [], fields: [] };
  }
};

const formatMetrics = (metricsData) => {
  const aspects = ['research_field', 'research_problem', 'template', 'properties'];
  const metrics = {};

  aspects.forEach(aspect => {
    const predictions = metricsData?.predictions?.[aspect] || [];
    const groundTruth = metricsData?.groundTruth?.[aspect] || [];

    const truePos = predictions.filter((p, i) => p && groundTruth[i]).length;
    const trueNeg = predictions.filter((p, i) => !p && !groundTruth[i]).length;
    const falsePos = predictions.filter((p, i) => p && !groundTruth[i]).length;
    const falseNeg = predictions.filter((p, i) => !p && groundTruth[i]).length;

    metrics[`${aspect}_true_positives`] = truePos;
    metrics[`${aspect}_true_negatives`] = trueNeg;
    metrics[`${aspect}_false_positives`] = falsePos;
    metrics[`${aspect}_false_negatives`] = falseNeg;
    metrics[`${aspect}_precision`] = truePos / (truePos + falsePos) || 0;
    metrics[`${aspect}_recall`] = truePos / (truePos + falseNeg) || 0;
    metrics[`${aspect}_f1`] = 2 * truePos / (2 * truePos + falsePos + falseNeg) || 0;
  });

  return metrics;
};

export const flattenFormData = (formData) => {
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const fullKey = prefix ? `${prefix}_${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        return { ...acc, ...flattenObject(obj[key], fullKey) };
      }
      
      return { ...acc, [fullKey]: obj[key] };
    }, {});
  };

  const userInfo = {
    evaluator_name: `${formData.userInfo.firstName} ${formData.userInfo.lastName}`,
    evaluator_email: formData.userInfo.email,
    evaluator_role: formData.userInfo.role,
    orkg_experience: formData.userInfo.orkgExperience
  };

  const paperInfo = {
    paper_id: formData.selectedPaper?.paper_id,
    paper_title: formData.selectedPaper?.title,
    paper_doi: formData.selectedPaper?.doi,
    research_field: formData.selectedPaper?.research_field_name
  };

  const evaluationData = flattenObject({
    metadata: formData.metadata,
    research: formData.research,
    problem: formData.problem,
    template: formData.template,
    property: formData.property,
    system: formData.system,
    innovation: formData.innovation,
    comparison: formData.comparison,
    additional: formData.additional,
    final: formData.final
  });

  const metricsData = formatMetrics(formData.metricsData);

  const timestamps = {
    evaluation_date: new Date().toISOString(),
    evaluation_timestamp: Date.now()
  };

  return {
    ...userInfo,
    ...paperInfo,
    ...evaluationData,
    ...metricsData,
    ...timestamps
  };
};

export const saveToCSV = (formData, filename) => {
  try {
    const flattenedData = flattenFormData(formData);
    const csv = Papa.unparse([flattenedData]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error saving CSV:', error);
  }
};