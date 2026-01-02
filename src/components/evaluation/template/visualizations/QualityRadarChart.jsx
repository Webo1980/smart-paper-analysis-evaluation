// src\components\evaluation\template\visualizations\QualityRadarChart.jsx
import React from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, Tooltip 
} from 'recharts';
import { TEMPLATE_CONFIG } from '../config/templateConfig';
import { ProgressBar } from './CommonVisualizations';

/**
 * Quality dimension radar chart
 */
export const QualityDimensionRadar = ({ qualityData }) => {
  // Format the data for the radar chart
  const formatRadarData = () => {
    const dimensions = [
      { name: 'Title Accuracy', key: 'titleAccuracy', description: 'How well the title reflects the content' },
      { name: 'Description Quality', key: 'descriptionQuality', description: 'Clarity and informativeness of description' },
      { name: 'Property Coverage', key: 'propertyCoverage', description: 'Comprehensiveness of properties' },
      { name: 'Research Alignment', key: 'researchAlignment', description: 'Alignment with research problem' }
    ];
    
    return dimensions.map(dim => ({
      subject: dim.name,
      value: qualityData?.[dim.key]?.rating || 0,
      fullMark: 5,
      description: dim.description
    }));
  };

  const radarData = formatRadarData();
  const radarConfig = TEMPLATE_CONFIG.radar;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius={radarConfig.outerRadius} 
          data={radarData}
        >
          <PolarGrid gridType="polygon" gridOpacity={radarConfig.gridOpacity} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#4b5563', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={radarConfig.angleOffset} 
            domain={radarConfig.domain} 
            tick={{ fontSize: 10 }}
          />
          <Radar
            name="Quality Rating"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip 
            formatter={(value) => [`${value}/5`, 'Rating']}
            labelFormatter={(label) => `${label}`}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Quality dimension breakdown table
 */
export const QualityDimensionTable = ({ qualityData }) => {
  // Get descriptions based on ratings
  const getDimensionDescription = (dimension, rating) => {
    const descriptions = {
      titleAccuracy: {
        low: 'Title lacks specificity or clarity',
        medium: 'Title is somewhat clear but could be more specific',
        high: 'Title clearly describes the template purpose'
      },
      descriptionQuality: {
        low: 'Description is unclear or incomplete',
        medium: 'Description provides basic context but lacks detail',
        high: 'Description is clear, informative and comprehensive'
      },
      propertyCoverage: {
        low: 'Missing many expected properties for this domain',
        medium: 'Includes most key properties but has some gaps',
        high: 'Comprehensive property coverage for this research type'
      },
      researchAlignment: {
        low: 'Poor alignment with the research problem',
        medium: 'Moderate alignment with some relevance to research',
        high: 'Strong alignment with research problem focus'
      }
    };
    
    const level = rating <= 2 ? 'low' : rating <= 3.5 ? 'medium' : 'high';
    return descriptions[dimension]?.[level] || '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dimension</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(qualityData || {}).map(([key, data]) => {
            if (key === 'overall' || key === 'overallComments') return null;
            
            const rating = data?.rating || 0;
            return (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  {key === 'titleAccuracy' ? 'Title Accuracy' : 
                   key === 'descriptionQuality' ? 'Description Quality' :
                   key === 'propertyCoverage' ? 'Property Coverage' :
                   key === 'researchAlignment' ? 'Research Alignment' : key}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center">
                    <div className="font-bold mr-2">{rating}</div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rating >= 4 ? 'bg-green-500' :
                          rating >= 3 ? 'bg-green-400' :
                          rating >= 2 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">
                  {getDimensionDescription(key, rating)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Comprehensive quality visualization
 */
export const TemplateQualityVisualization = ({ qualityData }) => {
  // Calculate overall score
  const calculateOverallScore = () => {
    if (!qualityData) return 0;
    
    const dimensions = ['titleAccuracy', 'descriptionQuality', 'propertyCoverage', 'researchAlignment'];
    const weights = { titleAccuracy: 0.2, descriptionQuality: 0.2, propertyCoverage: 0.4, researchAlignment: 0.2 };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    dimensions.forEach(dim => {
      const rating = qualityData[dim]?.rating || 0;
      if (rating > 0) {
        const normalizedRating = rating / 5; // Convert to 0-1 scale
        totalScore += normalizedRating * weights[dim];
        totalWeight += weights[dim];
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const overallScore = calculateOverallScore();
  
  // Get breakdown data for progress bars
  const getBreakdownData = () => {
    return [
      { 
        key: 'titleAccuracy',
        label: 'Title Accuracy',
        value: (qualityData?.titleAccuracy?.rating || 0) / 5,
        description: 'How well the title reflects the research domain'
      },
      { 
        key: 'descriptionQuality',
        label: 'Description Quality',
        value: (qualityData?.descriptionQuality?.rating || 0) / 5,
        description: 'Clarity and completeness of the description'
      },
      { 
        key: 'propertyCoverage',
        label: 'Property Coverage',
        value: (qualityData?.propertyCoverage?.rating || 0) / 5,
        description: 'Comprehensiveness of properties for research representation'
      },
      { 
        key: 'researchAlignment',
        label: 'Research Alignment',
        value: (qualityData?.researchAlignment?.rating || 0) / 5,
        description: 'Alignment with specific research problem'
      }
    ];
  };

  const breakdownData = getBreakdownData();

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded border">
        <h4 className="text-sm font-medium mb-2">Overall Template Quality</h4>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-3 mr-4">
            <div
              className={`h-3 rounded-full ${
                overallScore >= 0.8 ? 'bg-green-500' :
                overallScore >= 0.6 ? 'bg-green-400' :
                overallScore >= 0.4 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(overallScore * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-lg font-bold min-w-[80px] text-right">
            {(overallScore * 100).toFixed(0)}%
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Based on user assessment across all template quality dimensions
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-3">Quality Dimensions</h4>
          <QualityDimensionRadar qualityData={qualityData} />
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-3">Dimension Breakdown</h4>
          <div className="space-y-3">
            {breakdownData.map((item) => (
              <ProgressBar 
                key={item.key}
                value={item.value}
                label={item.label}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="text-sm font-medium mb-3">Quality Assessment Details</h4>
        <QualityDimensionTable qualityData={qualityData} />
      </div>
    </div>
  );
};