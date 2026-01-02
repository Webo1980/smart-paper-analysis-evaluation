// src/components/evaluation/research-problem/visualizations/ProblemComparisonVisualizations.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';

/**
 * Visualization of edit distance between original and edited problem
 */
export const EditDistanceVisualization = ({ comparisonData }) => {
  if (!comparisonData) return null;
  
  const { title, description, overall } = comparisonData;
  
  const data = [
    {
      name: 'Title',
      similarity: title.levenshtein.similarityScore,
      distance: title.levenshtein.normalizedDistance,
      edits: title.edits.editPercentage
    },
    {
      name: 'Description',
      similarity: description.levenshtein.similarityScore,
      distance: description.levenshtein.normalizedDistance,
      edits: description.edits.editPercentage
    },
    {
      name: 'Overall',
      similarity: overall.levenshtein.similarityScore,
      distance: overall.levenshtein.normalizedDistance,
      edits: overall.edits.editPercentage
    }
  ];

  return (
    <div className="h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
          <Legend />
          <Bar dataKey="similarity" name="Text Similarity" fill="#4ade80" />
          <Bar dataKey="edits" name="Edit Percentage" fill="#f87171" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Visualization of token matching analysis
 */
export const TokenMatchingVisualization = ({ comparisonData }) => {
  if (!comparisonData) return null;
  
  const { title, description } = comparisonData;
  
  const data = [
    {
      name: 'Title',
      precision: title.tokenMatching.precision,
      recall: title.tokenMatching.recall,
      f1Score: title.tokenMatching.f1Score
    },
    {
      name: 'Description',
      precision: description.tokenMatching.precision,
      recall: description.tokenMatching.recall,
      f1Score: description.tokenMatching.f1Score
    }
  ];

  return (
    <div className="h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
          <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
          <Legend />
          <Bar dataKey="precision" name="Precision" fill="#60a5fa" />
          <Bar dataKey="recall" name="Recall" fill="#c084fc" />
          <Bar dataKey="f1Score" name="F1 Score" fill="#34d399" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Visualization of special character analysis
 */
export const SpecialCharactersVisualization = ({ specialCharsData }) => {
  if (!specialCharsData || !specialCharsData.characters || specialCharsData.characters.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No special characters found
      </div>
    );
  }

  // Only show top 10 special characters
  const data = specialCharsData.characters.slice(0, 10).map(char => ({
    name: char.character === ' ' ? 'Space' : char.character,
    value: char.count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#f59e0b'];

  return (
    <div className="h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Visualization of edit analysis
 */
export const EditAnalysisVisualization = ({ editData }) => {
  if (!editData) return null;
  
  const { insertions, deletions, modifications } = editData;
  
  const data = [
    { name: 'Insertions', value: insertions },
    { name: 'Deletions', value: deletions },
    { name: 'Modifications', value: modifications }
  ];

  const COLORS = ['#4ade80', '#f87171', '#facc15'];

  return (
    <div className="h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Visualization for user satisfaction estimate
 */
export const SatisfactionGaugeVisualization = ({ satisfactionScore }) => {
  if (satisfactionScore === undefined || satisfactionScore === null) return null;
  
  const score = Math.max(0, Math.min(1, satisfactionScore));
  const data = [
    { name: 'Satisfaction', value: score },
    { name: 'Empty', value: 1 - score }
  ];

  // Color based on score
  const gaugeColor = score >= 0.7 ? '#22c55e' : 
                    score >= 0.4 ? '#f59e0b' : 
                    '#ef4444';

  return (
    <div className="h-[200px] mt-4 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell key="satisfaction" fill={gaugeColor} />
            <Cell key="empty" fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{(score * 100).toFixed(0)}%</div>
        <div className="text-sm text-gray-500">Estimated Satisfaction</div>
        <div className="text-xs text-gray-400 mt-1">Based on Edit Analysis</div>
      </div>
    </div>
  );
};