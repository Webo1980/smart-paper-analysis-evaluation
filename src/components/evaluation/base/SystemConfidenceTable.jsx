// src\components\evaluation\base\SystemConfidenceTable.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';
import Chart from 'chart.js/auto';

const SystemConfidenceTable = ({ className, initialExpanded = false }) => {
const [isExpanded, setIsExpanded] = useState(initialExpanded);
const chartRef = useRef(null);
const chartInstance = useRef(null);
useEffect(() => {
  if (isExpanded && chartRef.current) {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['0%', '25%', '50%', '75%', '100%'],
        datasets: [
          {
            label: 'Confidence Curve',
            data: [0, 75, 100, 75, 0],
            borderColor: '#2c5282',
            backgroundColor: 'rgba(44, 82, 130, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 7,
            pointHoverRadius: 9,
            pointStyle: 'circle',
            pointBackgroundColor: [
              'rgb(239,68,68)', 
              'rgb(234,179,8)', 
              'rgb(34,197,94)', 
              'rgb(234,179,8)', 
              'rgb(239,68,68)'
            ],
            pointBorderColor: '#2c5282',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => [
                `Automated Score: ${context.label}`,
                `Confidence Curve: ${context.parsed.y}%`
              ]
            }
          },
          legend: {
            display: true,
            labels: {
              color: '#2c5282'
            }
          }
        },
        scales: {
          x: {
            title: { 
              display: true, 
              text: 'Automated Score (%)',
              color: '#2c5282'
            },
            grid: {
              color: 'rgba(44, 82, 130, 0.1)'
            },
            ticks: {
              stepSize: 25
            }
          },
          y: {
            title: { 
              display: true, 
              text: 'Confidence (%)',
              color: '#2c5282'
            },
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            },
            grid: {
              color: 'rgba(44, 82, 130, 0.1)'
            }
          },
        },
      },
    });
  }
}, [isExpanded]);

return (
  <div className={`mt-3 p-2 bg-white border border-blue-100 rounded ${className || ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <HelpCircle size={14} className="text-blue-600" />
        <h6 className="text-xs font-medium text-blue-700">System Confidence Values (U-shaped)</h6>
      </div>
      <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-600">
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </div>

    {isExpanded && (
      <div>
        <div className="bg-blue-50 p-2 rounded mb-3 text-xs grid grid-cols-2 gap-4">
          <div>
            <h6 className="font-medium mb-2 text-green-700">📊 Confidence Characteristics</h6>
            <ul className="space-y-1 list-disc list-inside">
              <li className="text-blue-700">Lowest at 0% and 100% scores</li>
              <li className="text-blue-700">Peaks at 50% score</li>
              <li className="text-blue-700">Drops symmetrically from 50%</li>
            </ul>
          </div>

          <div>
            <h6 className="font-medium mb-2 text-green-700">📐 Confidence Calculation</h6>
            <div className="space-y-1">
              <div>
                <strong className="text-blue-700">Formula:</strong>
                <code className="ml-2 text-blue-800">Confidence = 1 - ((Score - 0.5) × 2)²</code>
              </div>
              <div>
                <strong className="text-blue-700">Curve:</strong>
                <span className="ml-2 text-blue-800">0% → 75% → 100% → 75% → 0%</span>
              </div>
              <div>
                <strong className="text-blue-700">Purpose:</strong>
                <span className="ml-2 text-blue-800">Moderate extreme confidences</span>
              </div>
            </div>
          </div>
        </div>

        {/* U-Shaped Confidence Graph */}
        <div className="w-full h-40">
          <canvas ref={chartRef}></canvas>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-1 border">Automated Score</th>
                <th className="p-1 border">0%</th>
                <th className="p-1 border">25%</th>
                <th className="p-1 border">50%</th>
                <th className="p-1 border">75%</th>
                <th className="p-1 border">100%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1 border font-medium">Confidence</td>
                <td className="p-1 border">0%</td>
                <td className="p-1 border">75%</td>
                <td className="p-1 border">100%</td>
                <td className="p-1 border">75%</td>
                <td className="p-1 border">0%</td>
              </tr>
              <tr>
                <td className="p-1 border font-medium">Formula</td>
                <td className="p-1 border">1 - (|0 - 0.5| × 2)²</td>
                <td className="p-1 border">1 - (|0.25 - 0.5| × 2)²</td>
                <td className="p-1 border">1 - (|0.5 - 0.5| × 2)²</td>
                <td className="p-1 border">1 - (|0.75 - 0.5| × 2)²</td>
                <td className="p-1 border">1 - (|1 - 0.5| × 2)²</td>
              </tr>
              <tr>
                <td className="p-1 border font-medium">Calculation</td>
                <td className="p-1 border">1 - (0.5 × 2)² = 1 - 1 = 0</td>
                <td className="p-1 border">1 - (0.25 × 2)² = 1 - 0.25 = 0.75</td>
                <td className="p-1 border">1 - (0 × 2)² = 1 - 0 = 1</td>
                <td className="p-1 border">1 - (0.25 × 2)² = 1 - 0.25 = 0.75</td>
                <td className="p-1 border">1 - (0.5 × 2)² = 1 - 1 = 0</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs mt-1">
            <span className="font-medium">Why this matters:</span> The system has the highest confidence in scores near 50% and lowest confidence in extreme scores (0% or 100%). This prevents the system from overriding expert judgment at the extremes.
          </p>
        </div>
      </div>
    )}
  </div>
);
};

export default SystemConfidenceTable;