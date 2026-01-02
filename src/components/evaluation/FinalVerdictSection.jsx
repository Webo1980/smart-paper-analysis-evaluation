import React, { useMemo, useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowLeft, CheckCircle2, Star, DownloadCloud, Trophy, Heart, TrendingUp, AlertCircle, Edit3, Save, Loader2 } from 'lucide-react';
import { useEvaluation } from '../../context/EvaluationContext';

export const FinalVerdictSection = ({ evaluationData, userInfo, onPrevious }) => {
  const { evaluationState } = useEvaluation();
  const [saveStatus, setSaveStatus] = useState({
    saving: false,
    saved: false,
    error: null
  });
  
  console.log('FinalVerdictSection evaluationState:', evaluationState);

  // Check if metrics have already been saved to GitHub
  const checkIfAlreadySaved = () => {
    const token = evaluationData?.token || 
                  evaluationState?.token || 
                  evaluationState?.metadata?.token ||
                  localStorage.getItem('evaluationToken');
    
    if (!token) return false;
    
    // Check localStorage for save status
    const savedKey = `metrics_saved_${token}`;
    return localStorage.getItem(savedKey) === 'true';
  };

  // Mark metrics as saved in localStorage
  const markAsSaved = (token) => {
    const savedKey = `metrics_saved_${token}`;
    localStorage.setItem(savedKey, 'true');
  };

  // Function to save evaluation_metrics from localStorage to GitHub
  const saveMetricsToGitHub = async () => {
    // Get token from various possible sources
    const token = evaluationData?.token || 
                  evaluationState?.token || 
                  evaluationState?.metadata?.token ||
                  localStorage.getItem('evaluationToken');
    
    if (!token) {
      console.error('No token available for saving');
      setSaveStatus({
        saving: false,
        saved: false,
        error: 'No evaluation token found'
      });
      return;
    }

    // Check if already saved
    if (checkIfAlreadySaved()) {
      console.log('Metrics already saved to GitHub, skipping duplicate save');
      setSaveStatus({ saving: false, saved: true, error: null });
      return;
    }

    setSaveStatus({ saving: true, saved: false, error: null });

    try {
      // Get evaluation_metrics from localStorage
      const metricsKey = 'evaluation_metrics';
      const storedMetrics = localStorage.getItem(metricsKey);
      
      if (!storedMetrics) {
        throw new Error('No evaluation_metrics found in localStorage');
      }

      const evaluationMetrics = JSON.parse(storedMetrics);

      // Prepare the complete data to save
      const dataToSave = {
        timestamp: new Date().toISOString(),
        token: token,
        userInfo: userInfo || evaluationState?.metadata?.userInfo || {},
        evaluationMetrics: evaluationMetrics // Include the metrics from localStorage
      };

      const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
      const GITHUB_OWNER = import.meta.env.VITE_GITHUB_USERNAME;
      const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;

      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        throw new Error('Missing GitHub configuration. Check your .env file.');
      }

      // Create file path
      const fileName = `evaluations/${token}.json`;
      const filePath = `src/data/userEvaluations/${fileName}`;
      
      // Fix: Properly encode Unicode strings to base64
      const jsonString = JSON.stringify(dataToSave, null, 2);
      const utf8Bytes = new TextEncoder().encode(jsonString);
      const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
      const fileContent = btoa(binaryString);
      
      // First, try to get the file to see if it exists (for updating)
      let sha = null;
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
            }
          }
        );
        
        if (getResponse.ok) {
          const existingFile = await getResponse.json();
          sha = existingFile.sha; // Need SHA for updating existing file
          console.log('Existing file found, will update with SHA:', sha);
        } else if (getResponse.status === 404) {
          console.log('File does not exist, will create new file');
          // File doesn't exist, this is fine - we'll create it
        } else {
          // Some other error occurred
          const errorData = await getResponse.json();
          console.warn('Error checking for existing file:', errorData);
        }
      } catch (err) {
        // Network error or other issue - assume file doesn't exist
        console.log('Could not check for existing file, will attempt to create:', err);
      }

      // Create or update the file
      const putBody = {
        message: sha 
          ? `Update evaluation with metrics for token ${token}` 
          : `Save evaluation with metrics for token ${token}`,
        content: fileContent,
        branch: 'main' // Adjust if using different branch
      };

      // Only include SHA if we're updating an existing file
      if (sha) {
        putBody.sha = sha;
      }

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save to GitHub (${response.status})`);
      }

      const result = await response.json();
      console.log('File with metrics saved successfully:', result.content.path);
      
      // Mark as saved to prevent duplicate saves
      markAsSaved(token);
      
      setSaveStatus({ saving: false, saved: true, error: null });
    } catch (error) {
      console.error('Error saving evaluation metrics:', error);
      setSaveStatus({
        saving: false,
        saved: false,
        error: error.message || 'Failed to save evaluation metrics'
      });
    }
  };

  // Auto-save when component mounts and evaluationState is ready
  useEffect(() => {
    // Only attempt to save if not already saved and not currently saving
    if (evaluationState && !checkIfAlreadySaved() && !saveStatus.saved && !saveStatus.saving) {
      const timer = setTimeout(() => {
        saveMetricsToGitHub();
      }, 1000);

      return () => clearTimeout(timer);
    } else if (checkIfAlreadySaved()) {
      // If already saved, update the UI state
      setSaveStatus({ saving: false, saved: true, error: null });
    }
  }, [evaluationState]);

  // Extract user assessments from evaluationState
  const getUserAssessments = () => {
    if (!evaluationState) return {};

    return {
      metadata: evaluationState.metadata?.userAssessment || {},
      researchField: evaluationState.research_field?.userAssessment || evaluationState.researchField?.userAssessment || {},
      researchProblem: evaluationState.research_problem?.userAssessment || evaluationState.researchProblem?.userAssessment || {},
      template: evaluationState.template?.userAssessment || {},
      content: evaluationState.content?.userAssessment || {},
      systemPerformance: evaluationState.systemPerformance?.assessment || {},
      innovation: evaluationState.innovation?.assessment || {},
      comparativeAnalysis: evaluationState.comparativeAnalysis?.assessment || {},
      ragHighlight: evaluationState.ragHighlight?.assessment || {},
      finalVerdict: evaluationState.finalVerdict?.assessment || {}
    };
  };

  // Calculate overall system performance from evaluationState
  const calculateOverallPerformance = () => {
    if (!evaluationState) return 0;
    
    let totalScore = 0;
    let totalCount = 0;

    // Metadata scores
    if (evaluationState.metadata?.finalAssessment?.overall) {
      const metadata = evaluationState.metadata.finalAssessment.overall;
      totalScore += (metadata.accuracyScore || 0) * 100;
      totalScore += (metadata.qualityScore || 0) * 100;
      totalCount += 2;
    }

    // Research field scores
    if (evaluationState.research_field?.finalAssessment?.overall || evaluationState.researchField?.finalAssessment?.overall) {
      const field = evaluationState.research_field?.finalAssessment?.overall || evaluationState.researchField?.finalAssessment?.overall;
      totalScore += (field.accuracyScore || 0) * 100;
      totalScore += (field.qualityScore || 0) * 100;
      totalCount += 2;
    }

    // Research problem scores
    if (evaluationState.research_problem?.finalAssessment?.overall || evaluationState.researchProblem?.finalAssessment?.overall) {
      const problem = evaluationState.research_problem?.finalAssessment?.overall || evaluationState.researchProblem?.finalAssessment?.overall;
      totalScore += (problem.accuracyScore || 0) * 100;
      totalScore += (problem.qualityScore || 0) * 100;
      totalCount += 2;
    }

    // Template scores
    if (evaluationState.template?.finalAssessment) {
      const template = evaluationState.template.finalAssessment;
      totalScore += (template.overallScore || 0) * 100;
      totalCount += 1;
    }

    // Content scores
    if (evaluationState.content?.finalAssessment?.metrics) {
      const content = evaluationState.content.finalAssessment.metrics;
      Object.values(content).forEach(metric => {
        if (metric?.score !== undefined) {
          totalScore += metric.score * 100;
          totalCount += 1;
        }
      });
    }

    return totalCount > 0 ? (totalScore / totalCount) : 0;
  };

  // Download CSV function with actual user ratings
  const downloadCSV = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userAssessments = getUserAssessments();
    
    // Create comprehensive headers for all evaluation sections
    const headers = [
      'Timestamp', 'Evaluator Name', 'Evaluator Role', 'Paper DOI', 'Paper Title',
      // Metadata ratings
      'Metadata: Title', 'Metadata: Authors', 'Metadata: DOI', 'Metadata: Publication Year', 'Metadata: Venue',
      // Research Field ratings
      'Research Field: Primary Field', 'Research Field: Confidence', 'Research Field: Consistency', 'Research Field: Relevance',
      // Template ratings
      'Template: Title Accuracy', 'Template: Description Quality', 'Template: Property Coverage', 'Template: Research Alignment',
      // Content ratings
      'Content: Property Coverage', 'Content: Evidence Quality', 'Content: Value Accuracy',
      // System Performance ratings
      'System: Responsiveness', 'System: Error Handling', 'System: Stability',
      // Innovation ratings
      'Innovation: Novelty', 'Innovation: Usability', 'Innovation: Impact',
      // Comparative Analysis ratings (if present)
      'Comparative: Efficiency', 'Comparative: Quality', 'Comparative: Completeness',
      // RAG Highlight ratings (if present)
      'RAG: Highlight Accuracy', 'RAG: Navigation', 'RAG: Manual Highlight', 
      'RAG: Context Preservation', 'RAG: Visual Clarity', 'RAG: Response Time'
    ];
    
    // Get user info from evaluationState
    const userInfoData = evaluationState?.metadata?.userInfo || evaluationState?.content?.finalAssessment?.userInfo || {};
    const evaluatorName = userInfoData.firstName && userInfoData.lastName 
      ? `${userInfoData.firstName} ${userInfoData.lastName}`
      : userInfo?.name || 'Anonymous';
    const evaluatorRole = userInfoData.role || userInfo?.role || 'N/A';
    
    // Extract all individual ratings
    const data = [
      timestamp,
      evaluatorName,
      evaluatorRole,
      evaluationData?.metadata?.doi || 'N/A',
      `"${evaluationData?.metadata?.title || 'N/A'}"`,
      // Metadata ratings
      userAssessments.metadata?.title?.rating || 0,
      userAssessments.metadata?.authors?.rating || 0,
      userAssessments.metadata?.doi?.rating || 0,
      userAssessments.metadata?.publication_year?.rating || 0,
      userAssessments.metadata?.venue?.rating || 0,
      // Research Field ratings
      userAssessments.researchField?.primaryField?.rating || 0,
      userAssessments.researchField?.confidence?.rating || 0,
      userAssessments.researchField?.consistency?.rating || 0,
      userAssessments.researchField?.relevance?.rating || 0,
      // Template ratings
      userAssessments.template?.titleAccuracy?.rating || userAssessments.template?.titleAccuracy || 0,
      userAssessments.template?.descriptionQuality?.rating || userAssessments.template?.descriptionQuality || 0,
      userAssessments.template?.propertyCoverage?.rating || userAssessments.template?.propertyCoverage || 0,
      userAssessments.template?.researchAlignment?.rating || userAssessments.template?.researchAlignment || 0,
      // Content ratings
      userAssessments.content?.propertyCoverage?.rating || userAssessments.content?.propertyCoverage || 0,
      userAssessments.content?.evidenceQuality?.rating || userAssessments.content?.evidenceQuality || 0,
      userAssessments.content?.valueAccuracy?.rating || userAssessments.content?.valueAccuracy || 0,
      // System Performance ratings
      userAssessments.systemPerformance?.responsiveness?.rating || 0,
      userAssessments.systemPerformance?.errors?.rating || 0,
      userAssessments.systemPerformance?.stability?.rating || 0,
      // Innovation ratings
      userAssessments.innovation?.novelty?.rating || 0,
      userAssessments.innovation?.usability?.rating || 0,
      userAssessments.innovation?.impact?.rating || 0,
      // Comparative Analysis ratings
      userAssessments.comparativeAnalysis?.efficiency?.rating || 0,
      userAssessments.comparativeAnalysis?.quality?.rating || 0,
      userAssessments.comparativeAnalysis?.completeness?.rating || 0,
      // RAG Highlight ratings
      userAssessments.ragHighlight?.highlightAccuracy?.rating || 0,
      userAssessments.ragHighlight?.navigationFunctionality?.rating || 0,
      userAssessments.ragHighlight?.manualHighlight?.rating || 0,
      userAssessments.ragHighlight?.contextPreservation?.rating || 0,
      userAssessments.ragHighlight?.visualClarity?.rating || 0,
      userAssessments.ragHighlight?.responseTime?.rating || 0
    ];
    
    const csvContent = headers.join(',') + '\n' + data.join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluation_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const overallPerformance = useMemo(() => calculateOverallPerformance(), [evaluationState]);
  const userAssessments = getUserAssessments();
  
  // Count how many sections were assessed
  const assessedSections = Object.values(userAssessments).filter(
    section => Object.keys(section).length > 0
  ).length;

  // Helper function to render star rating
  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Save Status Indicator */}
      {saveStatus.saving && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">Saving evaluation to GitHub...</span>
        </div>
      )}
      
      {saveStatus.saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">Evaluation successfully saved to GitHub!</span>
        </div>
      )}
      
      {saveStatus.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Failed to save evaluation</span>
          </div>
          <p className="text-xs text-red-600 ml-6">{saveStatus.error}</p>
        </div>
      )}

      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-xl border-2 border-blue-200">
        <div className="p-8 space-y-6">
          {/* Celebration Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Trophy className="h-20 w-20 text-yellow-500 animate-bounce" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Evaluation Complete!
            </h2>
            
            <div className="flex items-center justify-center gap-2 text-lg text-gray-600">
              <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
              <span>Thank you for your valuable contribution!</span>
              <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
            </div>
          </div>

          {/* Overall Performance Score */}
          <div className="bg-white rounded-xl p-6 border-2 border-blue-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Overall System Performance</h3>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      overallPerformance >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      overallPerformance >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${overallPerformance}%` }}
                  />
                </div>
              </div>
              <Badge className={`text-2xl font-bold px-4 py-2 ${
                overallPerformance >= 80 ? 'bg-green-100 text-green-800' :
                overallPerformance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {overallPerformance.toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Detailed Assessment Summary */}
          <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Assessment Summary</h3>
            
            <div className="space-y-4">
              {/* Metadata Assessment */}
              {Object.keys(userAssessments.metadata).length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Metadata Quality Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(userAssessments.metadata).map(([field, value]) => {
                      if (typeof value === 'object' && value?.rating) {
                        return (
                          <div key={field} className="flex items-center gap-2">
                            <span className="text-gray-600">{field}:</span>
                            {renderStarRating(value.rating)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Research Field Assessment */}
              {Object.keys(userAssessments.researchField).length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Research Field Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(userAssessments.researchField).map(([field, value]) => {
                      if (typeof value === 'object' && value?.rating) {
                        return (
                          <div key={field} className="flex items-center gap-2">
                            <span className="text-gray-600">{field}:</span>
                            {renderStarRating(value.rating)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Research Problem Assessment */}
              {Object.keys(userAssessments.researchProblem).length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Research Problem Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(userAssessments.researchProblem).map(([field, value]) => {
                      if (typeof value === 'object' && value?.rating) {
                        return (
                          <div key={field} className="flex items-center gap-2">
                            <span className="text-gray-600">{field}:</span>
                            {renderStarRating(value.rating)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Template Assessment */}
              {Object.keys(userAssessments.template).length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Template Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(userAssessments.template).map(([field, value]) => {
                      if (typeof value === 'number' && field !== 'overall') {
                        return (
                          <div key={field} className="flex items-center gap-2">
                            <span className="text-gray-600">{field}:</span>
                            {renderStarRating(value)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Content Assessment */}
              {Object.keys(userAssessments.content).length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Content Analysis Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(userAssessments.content).map(([field, value]) => {
                      if (typeof value === 'number' && field !== 'overall') {
                        return (
                          <div key={field} className="flex items-center gap-2">
                            <span className="text-gray-600">{field}:</span>
                            {renderStarRating(value)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* System Performance & Innovation */}
              <div className="grid grid-cols-2 gap-3">
                {/* System Performance */}
                {Object.keys(userAssessments.systemPerformance).length > 0 && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-gray-700 mb-2">System Performance</h4>
                    <div className="space-y-1 text-sm">
                      {userAssessments.systemPerformance.responsiveness && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Responsiveness:</span>
                          {renderStarRating(userAssessments.systemPerformance.responsiveness.rating)}
                        </div>
                      )}
                      {userAssessments.systemPerformance.errors && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Error Handling:</span>
                          {renderStarRating(userAssessments.systemPerformance.errors.rating)}
                        </div>
                      )}
                      {userAssessments.systemPerformance.stability && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Stability:</span>
                          {renderStarRating(userAssessments.systemPerformance.stability.rating)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Innovation */}
                {Object.keys(userAssessments.innovation).length > 0 && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-gray-700 mb-2">Innovation Assessment</h4>
                    <div className="space-y-1 text-sm">
                      {userAssessments.innovation.novelty && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Novelty:</span>
                          {renderStarRating(userAssessments.innovation.novelty.rating)}
                        </div>
                      )}
                      {userAssessments.innovation.usability && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Usability:</span>
                          {renderStarRating(userAssessments.innovation.usability.rating)}
                        </div>
                      )}
                      {userAssessments.innovation.impact && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Impact:</span>
                          {renderStarRating(userAssessments.innovation.impact.rating)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RAG Highlight Assessment if present */}
              {Object.keys(userAssessments.ragHighlight || {}).length > 0 && userAssessments.ragHighlight.highlightAccuracy && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">RAG Highlight Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(userAssessments.ragHighlight).map(([field, data]) => {
                      if (data?.rating !== undefined && field !== 'overall') {
                        return (
                          <div key={field} className="flex items-center gap-2">
                            <span className="text-gray-600">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            {renderStarRating(data.rating)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Details */}
          {(evaluationState?.metadata?.userInfo || evaluationState?.content?.finalAssessment?.userInfo) && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500">
                Evaluated by: {evaluationState.metadata?.userInfo?.firstName || evaluationState.content?.finalAssessment?.userInfo?.firstName} {evaluationState.metadata?.userInfo?.lastName || evaluationState.content?.finalAssessment?.userInfo?.lastName} 
                ({evaluationState.metadata?.userInfo?.role || evaluationState.content?.finalAssessment?.userInfo?.role}) - 
                Expertise Weight: {evaluationState.metadata?.userInfo?.expertiseWeight || evaluationState.content?.finalAssessment?.userInfo?.expertiseWeight || 0}/5
              </p>
            </div>
          )}

          {/* Appreciation Message */}
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <p className="italic">
              "Your contribution helps advance scientific research evaluation"
            </p>
          </div>

          {/* Download Button */}
          <div className="pt-4">
            <Button
              onClick={downloadCSV}
              size="lg"
              className="!bg-blue-600 hover:!bg-blue-700 text-white flex items-center gap-2 mx-auto"
            >
              <DownloadCloud className="h-5 w-5" />
              Download Complete Evaluation Report
            </Button>
          </div>

          {/* Footer Message */}
          <p className="text-sm text-gray-500 pt-4">
            This evaluation has been recorded. Your detailed assessment across {assessedSections} sections 
            has been saved for analysis.
          </p>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous (Review/Edit)
        </Button>

        {/* Show retry button if save failed */}
        {saveStatus.error && (
          <Button
            onClick={saveMetricsToGitHub}
            disabled={saveStatus.saving}
            className="!bg-green-600 hover:!bg-green-700 text-white mb-4 flex items-center gap-2 p-2 rounded-md"
          >
            {saveStatus.saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Retry Save
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FinalVerdictSection;