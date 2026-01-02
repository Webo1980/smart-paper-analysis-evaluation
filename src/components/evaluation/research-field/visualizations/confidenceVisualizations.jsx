// src/components/evaluation/research-field/visualizations/confidenceVisualizations.jsx
import React from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine 
} from 'recharts';

/**
 * Gauge chart for confidence visualization
 */
export const GaugeChart = ({ value = 0, isCorrect = false }) => {
  const getColor = () => {
    if (isCorrect) {
      return value >= 80 ? "#16a34a" : value >= 50 ? "#22c55e" : "#86efac";
    }
    return value >= 80 ? "#dc2626" : value >= 50 ? "#f59e0b" : "#9ca3af";
  };

  const gaugeData = [
    { name: "value", value: value, fill: getColor() },
    { name: "empty", value: 100 - value, fill: "#e5e7eb" }
  ];

  return (
    <div className="w-[180px] h-[180px] relative">
      <PieChart width={180} height={180}>
        <Pie
          data={gaugeData}
          dataKey="value"
          cx={90}
          cy={90}
          innerRadius={60}
          outerRadius={80}
          startAngle={180}
          endAngle={0}
          paddingAngle={0}
        >
          {gaugeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
        <div className="text-xs font-medium text-gray-600">
          {isCorrect ? "✓ Match" : "✗ Mismatch"}
        </div>
        <div className="text-2xl font-bold">{value}%</div>
        <div className="text-xs text-gray-500 mt-1">Confidence</div>
      </div>
    </div>
  );
};

/**
 * Confidence distribution chart
 */
export const ConfidenceDistributionChart = ({ predictions = [], groundTruth = '' }) => {
  const chartData = predictions.map(pred => {
    const label = pred.name || pred.field || '';
    const score = pred.score || 0;
    const isGroundTruth = label.toLowerCase() === groundTruth.toLowerCase();
    
    return {
      name: label.length > 12 ? label.substring(0, 12) + '...' : label,
      fullName: label,
      score,
      fill: isGroundTruth ? "#16a34a" : "#3b82f6",
      isGroundTruth
    };
  });

  return (
    <div className="h-[220px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
          barSize={25}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={60} 
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            tick={{ fontSize: 10 }} 
            tickFormatter={(value) => `${value}%`} 
          />
          <Tooltip 
            formatter={(value) => `${value}%`}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
          {chartData.some(d => d.isGroundTruth) && (
            <ReferenceLine 
              x={chartData.findIndex(d => d.isGroundTruth)} 
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{ 
                value: 'Ground Truth', 
                position: 'top', 
                fill: '#92400e',
                fontSize: 10
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-3 text-xs text-gray-600 flex justify-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span>Ground Truth</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span>Other Predictions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hierarchy relationship visualization
 */
export const HierarchyVisualization = ({ groundTruthPosition, hierarchyMismatch }) => {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded border">
      <div className="flex items-center justify-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
          groundTruthPosition === 0 
            ? "bg-green-100 border-4 border-green-500 text-green-800" 
            : "bg-blue-100 border-4 border-blue-500 text-blue-800"
        }`}>
          <div className="text-center">
            <div className="text-xs font-medium">Top</div>
            <div className="text-xs font-medium">Prediction</div>
            {groundTruthPosition === 0 && (
              <div className="text-[10px] mt-1 p-1 bg-green-200 rounded-full">
                ✓ Match
              </div>
            )}
          </div>
        </div>
        
        {groundTruthPosition !== 0 && (
          <>
            <div className="mx-4 w-16 border-t-4 border-gray-300 relative">
              <div className="absolute -top-6 text-sm font-medium text-gray-700 w-full text-center">
                Distance: {hierarchyMismatch}
              </div>
            </div>
            
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-100 border-4 border-green-500 text-green-800">
              <div className="text-center">
                <div className="text-xs font-medium">Ground</div>
                <div className="text-xs font-medium">Truth</div>
                <div className="text-[10px] mt-1 p-1 bg-green-200 rounded-full">
                  Position: {groundTruthPosition + 1}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {groundTruthPosition !== 0 && (
        <div className="mt-4 p-2 bg-gray-100 rounded border text-xs text-center">
          <span className="font-medium">Distance Interpretation: </span>
          {hierarchyMismatch === 1 ? (
            <span className="text-green-700">Close relationship (parent/child/sibling)</span>
          ) : hierarchyMismatch === 2 ? (
            <span className="text-yellow-700">Moderate relationship (same branch)</span>
          ) : (
            <span className="text-red-700">Distant relationship (different branches)</span>
          )}
        </div>
      )}
    </div>
  );
};