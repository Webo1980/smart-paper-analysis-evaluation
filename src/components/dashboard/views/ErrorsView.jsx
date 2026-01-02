// src/components/dashboard/views/ErrorsView.jsx
// Component for displaying system and LLM errors with statistics and visualizations

import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  TrendingUp, 
  Activity,
  Database,
  Brain,
  Code,
  Network,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Zap
} from 'lucide-react';

/**
 * Helper function to categorize errors
 */
const categorizeError = (error) => {
  const errorStr = JSON.stringify(error).toLowerCase();
  
  if (errorStr.includes('llm') || errorStr.includes('model') || errorStr.includes('ai')) {
    return 'llm';
  } else if (errorStr.includes('api') || errorStr.includes('request') || errorStr.includes('response')) {
    return 'api';
  } else if (errorStr.includes('parse') || errorStr.includes('json') || errorStr.includes('format')) {
    return 'parsing';
  } else if (errorStr.includes('network') || errorStr.includes('timeout') || errorStr.includes('connection')) {
    return 'network';
  } else if (errorStr.includes('validation') || errorStr.includes('invalid')) {
    return 'validation';
  } else if (errorStr.includes('data') || errorStr.includes('missing') || errorStr.includes('undefined')) {
    return 'data';
  }
  
  return 'system';
};

/**
 * Helper function to get severity
 */
const getSeverity = (error) => {
  const errorStr = JSON.stringify(error).toLowerCase();
  
  if (errorStr.includes('fatal') || errorStr.includes('critical')) {
    return 'critical';
  } else if (errorStr.includes('error') || errorStr.includes('failed')) {
    return 'error';
  } else if (errorStr.includes('warning') || errorStr.includes('warn')) {
    return 'warning';
  }
  
  return 'info';
};

/**
 * Error Statistics Card Component
 */
const ErrorStatsCard = ({ title, count, percentage, icon: Icon, color, trend }) => {
  return (
    <Card className={`p-4 border-l-4 border-${color}-500`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 text-${color}-600`} />
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{count}</p>
            {percentage !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {percentage.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
        {trend !== undefined && (
          <div className={`text-sm font-medium ${trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Error Details Component
 */
const ErrorDetailsSection = ({ errors, title, icon: Icon, color }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!errors || errors.length === 0) {
    return null;
  }
  
  return (
    <Card className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-3">
          <Icon className={`h-5 w-5 text-${color}-600`} />
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{errors.length} error{errors.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-3">
          {errors.map((error, idx) => (
            <Alert key={idx} variant={error.severity === 'critical' ? 'destructive' : 'default'}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{error.message || 'Unknown error'}</p>
                    {error.details && (
                      <p className="text-xs text-gray-600 mt-1">{error.details}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {error.severity}
                  </Badge>
                </div>
                {error.location && (
                  <p className="text-xs text-gray-500">
                    Location: {error.location}
                  </p>
                )}
                {error.timestamp && (
                  <p className="text-xs text-gray-400">
                    {new Date(error.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}
    </Card>
  );
};

/**
 * Error Distribution Chart Component
 */
const ErrorDistributionChart = ({ distribution }) => {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  const categories = [
    { key: 'llm', label: 'LLM Errors', color: 'bg-purple-500', icon: Brain },
    { key: 'api', label: 'API Errors', color: 'bg-blue-500', icon: Network },
    { key: 'parsing', label: 'Parsing Errors', color: 'bg-yellow-500', icon: Code },
    { key: 'network', label: 'Network Errors', color: 'bg-red-500', icon: Activity },
    { key: 'validation', label: 'Validation Errors', color: 'bg-orange-500', icon: AlertTriangle },
    { key: 'data', label: 'Data Errors', color: 'bg-pink-500', icon: Database },
    { key: 'system', label: 'System Errors', color: 'bg-gray-500', icon: AlertCircle }
  ];
  
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Error Distribution by Type</h3>
      <div className="space-y-3">
        {categories.map(({ key, label, color, icon: Icon }) => {
          const count = distribution[key] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{count}</span>
                  <span className="text-gray-400">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/**
 * Error Rate Timeline Component
 */
const ErrorRateTimeline = ({ errorsByPaper }) => {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Error Rate by Paper</h3>
      <div className="space-y-2">
        {errorsByPaper.map((paper, idx) => {
          const errorRate = paper.totalErrors / Math.max(paper.totalOperations, 1);
          const successRate = 1 - errorRate;
          
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate max-w-md">
                  Paper {idx + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`text-${paper.totalErrors > 0 ? 'red' : 'green'}-600`}>
                    {paper.totalErrors} errors
                  </span>
                  <span className="text-gray-400">
                    ({(successRate * 100).toFixed(1)}% success)
                  </span>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${successRate * 100}%` }}
                />
                <div 
                  className="bg-red-500" 
                  style={{ width: `${errorRate * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/**
 * Main ErrorsView Component
 */
const ErrorsView = ({ systemData }) => {
  console.log("=== ErrorsView Received Data ===", systemData);
  
  // Aggregate error data from system evaluations
  const errorAnalysis = useMemo(() => {
    if (!systemData || !Array.isArray(systemData)) {
      console.log("No valid system data available");
      return null;
    }
    
    const errors = {
      total: 0,
      byCategory: {
        llm: 0,
        api: 0,
        parsing: 0,
        network: 0,
        validation: 0,
        data: 0,
        system: 0
      },
      bySeverity: {
        critical: 0,
        error: 0,
        warning: 0,
        info: 0
      },
      byComponent: {
        metadata: [],
        researchField: [],
        researchProblem: [],
        template: [],
        content: []
      },
      llmErrors: [],
      systemErrors: [],
      allErrors: [],
      errorsByPaper: []
    };
    
    systemData.forEach((item, paperIdx) => {
      const paperErrors = {
        paperIndex: paperIdx,
        doi: item.doi,
        totalErrors: 0,
        totalOperations: 0,
        errors: []
      };
      
      // Check for errors in different components
      const checkForErrors = (data, component) => {
        if (!data) return;
        
        // Check for explicit error fields
        if (data.error || data.errors) {
          const errorList = Array.isArray(data.errors) ? data.errors : [data.error];
          errorList.forEach(err => {
            const errorObj = {
              message: err.message || err,
              component,
              severity: getSeverity(err),
              category: categorizeError(err),
              location: `${component}`,
              timestamp: data.timestamp || new Date().toISOString(),
              details: err.details || err.stack || ''
            };
            
            errors.total++;
            errors.byCategory[errorObj.category]++;
            errors.bySeverity[errorObj.severity]++;
            errors.byComponent[component].push(errorObj);
            errors.allErrors.push(errorObj);
            paperErrors.errors.push(errorObj);
            paperErrors.totalErrors++;
            
            if (errorObj.category === 'llm') {
              errors.llmErrors.push(errorObj);
            } else {
              errors.systemErrors.push(errorObj);
            }
          });
        }
        
        // Check for processing status
        if (data.status === 'error' || data.status === 'failed') {
          const errorObj = {
            message: data.message || 'Processing failed',
            component,
            severity: 'error',
            category: categorizeError(data),
            location: component,
            timestamp: data.timestamp || new Date().toISOString()
          };
          
          errors.total++;
          errors.byCategory[errorObj.category]++;
          errors.bySeverity[errorObj.severity]++;
          errors.byComponent[component].push(errorObj);
          errors.allErrors.push(errorObj);
          paperErrors.errors.push(errorObj);
          paperErrors.totalErrors++;
        }
        
        paperErrors.totalOperations++;
      };
      
      // Check each component for errors
      if (item.systemData) {
        checkForErrors(item.systemData.metadata, 'metadata');
        checkForErrors(item.systemData.researchField, 'researchField');
        checkForErrors(item.systemData.researchProblems, 'researchProblem');
        checkForErrors(item.systemData.templates, 'template');
        checkForErrors(item.systemData.paperContent, 'content');
      }
      
      if (item.evaluation) {
        // Check evaluation metrics for errors
        checkForErrors(item.evaluation.evaluationMetrics, 'evaluation');
      }
      
      errors.errorsByPaper.push(paperErrors);
    });
    
    console.log("=== Error Analysis Results ===", errors);
    return errors;
  }, [systemData]);
  
  if (!errorAnalysis) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No system data available for error analysis.
        </AlertDescription>
      </Alert>
    );
  }
  
  const totalOperations = errorAnalysis.errorsByPaper.reduce(
    (sum, p) => sum + p.totalOperations, 0
  );
  const successRate = totalOperations > 0 
    ? ((totalOperations - errorAnalysis.total) / totalOperations) * 100 
    : 100;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Errors Analysis</h2>
        <p className="text-gray-600 mt-1">
          Track and analyze LLM and system errors across all components
        </p>
      </div>
      
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ErrorStatsCard
          title="Total Errors"
          count={errorAnalysis.total}
          percentage={(errorAnalysis.total / Math.max(totalOperations, 1)) * 100}
          icon={AlertCircle}
          color="red"
        />
        <ErrorStatsCard
          title="LLM Errors"
          count={errorAnalysis.llmErrors.length}
          percentage={(errorAnalysis.llmErrors.length / Math.max(errorAnalysis.total, 1)) * 100}
          icon={Brain}
          color="purple"
        />
        <ErrorStatsCard
          title="System Errors"
          count={errorAnalysis.systemErrors.length}
          percentage={(errorAnalysis.systemErrors.length / Math.max(errorAnalysis.total, 1)) * 100}
          icon={Code}
          color="blue"
        />
        <ErrorStatsCard
          title="Success Rate"
          count={`${successRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="green"
        />
      </div>
      
      {/* Severity Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-red-600">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium">Critical</p>
          </div>
          <p className="text-2xl font-bold">{errorAnalysis.bySeverity.critical}</p>
        </Card>
        <Card className="p-4 border-l-4 border-orange-600">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <p className="text-sm font-medium">Error</p>
          </div>
          <p className="text-2xl font-bold">{errorAnalysis.bySeverity.error}</p>
        </Card>
        <Card className="p-4 border-l-4 border-yellow-600">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium">Warning</p>
          </div>
          <p className="text-2xl font-bold">{errorAnalysis.bySeverity.warning}</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-600">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium">Info</p>
          </div>
          <p className="text-2xl font-bold">{errorAnalysis.bySeverity.info}</p>
        </Card>
      </div>
      
      {/* Charts and Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorDistributionChart distribution={errorAnalysis.byCategory} />
        <ErrorRateTimeline errorsByPaper={errorAnalysis.errorsByPaper} />
      </div>
      
      {/* Detailed Error Sections by Category */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Error Details by Category</h3>
        
        <ErrorDetailsSection
          errors={errorAnalysis.llmErrors}
          title="LLM Errors"
          icon={Brain}
          color="purple"
        />
        
        <ErrorDetailsSection
          errors={errorAnalysis.byComponent.metadata}
          title="Metadata Errors"
          icon={FileText}
          color="blue"
        />
        
        <ErrorDetailsSection
          errors={errorAnalysis.byComponent.researchField}
          title="Research Field Errors"
          icon={Database}
          color="green"
        />
        
        <ErrorDetailsSection
          errors={errorAnalysis.byComponent.researchProblem}
          title="Research Problem Errors"
          icon={AlertTriangle}
          color="yellow"
        />
        
        <ErrorDetailsSection
          errors={errorAnalysis.byComponent.template}
          title="Template Errors"
          icon={Code}
          color="orange"
        />
        
        <ErrorDetailsSection
          errors={errorAnalysis.byComponent.content}
          title="Content Extraction Errors"
          icon={Zap}
          color="red"
        />
      </div>
      
      {/* Summary */}
      {errorAnalysis.total === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong className="text-green-700">Excellent!</strong> No errors detected in the system evaluation data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ErrorsView;