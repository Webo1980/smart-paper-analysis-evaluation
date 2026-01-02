// src/components/dashboard/DashboardWrapper.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardRouter from './DashboardRouter';
import EvaluationDashboard from './EvaluationDashboard';
import integratedDataService from '../../services/IntegratedDataService';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

const DashboardWrapper = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get('view');
  
  // State for integrated data
  const [integratedData, setIntegratedData] = useState(null);
  const [loadingIntegrated, setLoadingIntegrated] = useState(false);
  const [integratedError, setIntegratedError] = useState(null);

  // Determine if current view requires integrated data
  const requiresIntegratedData = view && 
    ['systemAccuracy', 'userAgreement', 'paperComparison', 'dataQuality', 'comparison'].includes(view);

  useEffect(() => {
    console.log('DashboardWrapper rendering with view:', view);
    
    // Try to load integrated data in the background for all dashboard views
    // This allows the integrated tabs to be available if data exists
    if (view && !integratedData && !loadingIntegrated) {
      loadIntegratedData();
    }
  }, [view]);

  const loadIntegratedData = async () => {
    try {
      setLoadingIntegrated(true);
      setIntegratedError(null);
      
      // Load all three data sources
      const data = await integratedDataService.loadAllData({
        // Optional: specify paths if not using default locations
        // orkgPath: '/path/to/orkg.csv',
        // systemPath: '/path/to/system-analyses',
        // userEvalPath: '/path/to/user-evaluations'
      });
      
      setIntegratedData(data);
      console.log('Integrated data loaded:', data);
    } catch (err) {
      console.error('Error loading integrated data:', err);
      setIntegratedError(err.message || 'Failed to load integrated data');
    } finally {
      setLoadingIntegrated(false);
    }
  };

  const handleRefreshIntegrated = async () => {
    await loadIntegratedData();
  };

  // Only show loading state if we're on an integrated view AND still loading
  if (requiresIntegratedData && loadingIntegrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading integrated data sources...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a moment as we load ORKG ground truth, system analyses, and user evaluations
          </p>
        </div>
      </div>
    );
  }

  // Only show error if we're on an integrated view AND there's an error
  if (requiresIntegratedData && integratedError) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-medium">Error loading integrated data</p>
            <p className="mt-1">{integratedError}</p>
            <button 
              onClick={handleRefreshIntegrated}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If we have a view parameter, show the actual dashboard
  if (view) {
    console.log('Showing EvaluationDashboard with view:', view);
    console.log('IntegratedData available:', !!integratedData);
    
    return (
      <EvaluationDashboard 
        initialView={view === 'full' ? 'overview' : view}
        integratedData={integratedData}
        onRefreshIntegrated={handleRefreshIntegrated}
      />
    );
  }

  // Otherwise show the landing page
  console.log('Showing DashboardRouter');
  return (
    <DashboardRouter 
      onNavigate={(destination) => {
        if (destination === 'evaluation') {
          navigate('/');
        } else if (destination === 'dashboard') {
          navigate('/dashboard?view=overview');
        }
      }}
    />
  );
};

export default DashboardWrapper;