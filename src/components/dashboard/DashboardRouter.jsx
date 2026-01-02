// src/components/dashboard/DashboardRouter.jsx
import React from 'react';
import { Button } from '../ui/button';
import { BarChart3, ArrowLeft, ExternalLink } from 'lucide-react';

const DashboardRouter = ({ onNavigate, returnTo }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-8">
        {returnTo && (
          <Button
            onClick={() => onNavigate(returnTo)}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {returnTo}
          </Button>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Evaluation Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive analysis and insights from all evaluation data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">📊 Overview Metrics</h3>
              <p className="text-sm text-gray-600">
                High-level KPIs, expertise distribution, and system performance summary
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">📈 Section Analysis</h3>
              <p className="text-sm text-gray-600">
                Detailed performance metrics and field-level analysis for each section
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎯 Confusion Matrices</h3>
              <p className="text-sm text-gray-600">
                Visual representation of prediction accuracy across all sections
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">👥 Expertise Analysis</h3>
              <p className="text-sm text-gray-600">
                Weighted consensus, inter-rater reliability, and role-based insights
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Interactive Visualizations
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Rating distribution charts with statistical analysis</li>
              <li>• Time series trends with moving averages</li>
              <li>• Correlation heatmaps between variables</li>
              <li>• Multi-dimensional performance radar charts</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => window.open('/dashboard', '_blank')}
              size="lg"
              className="px-8"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Open Dashboard
            </Button>
            
            <Button
              onClick={() => window.open('/dashboard?view=overview', '_blank')}
              variant="outline"
              size="lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Quick Overview
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Dashboard automatically fetches latest evaluation data from GitHub repository
          </div>
        </div>

        {/* Features Card */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Real-time Data</h4>
              <p className="text-sm text-gray-600">
                Live synchronization with GitHub repository
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Advanced Filtering</h4>
              <p className="text-sm text-gray-600">
                Filter by date, expertise, role, and section
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Export Options</h4>
              <p className="text-sm text-gray-600">
                Download data as CSV or JSON formats
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Statistical Analysis</h4>
              <p className="text-sm text-gray-600">
                Correlations, trends, and confidence intervals
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Performance Metrics</h4>
              <p className="text-sm text-gray-600">
                Precision, recall, F1 scores, and accuracy
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Comparative Views</h4>
              <p className="text-sm text-gray-600">
                Compare sections, roles, and expertise levels
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardRouter;