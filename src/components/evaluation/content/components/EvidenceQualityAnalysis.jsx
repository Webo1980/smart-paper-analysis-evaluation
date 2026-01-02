// src/components/evaluation/content/components/EvidenceQualityAnalysis.jsx
import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { extractEvidenceItems, calculateEvidenceQualityScores } from '../utils/evidenceUtils';
import SemanticSimilarityAnalysis from './SemanticSimilarityAnalysis';
import ContextualRelevanceAnalysis from './ContextualRelevanceAnalysis';
import TokenOverlapAnalysis from './TokenOverlapAnalysis';
import StructureMatchAnalysis from './StructureMatchAnalysis';
import CitationCoverageAnalysis from './CitationCoverageAnalysis';
import EvidenceQualityCalculation from './EvidenceQualityCalculation';
import EvidenceAnalysisMatrix from './EvidenceAnalysisMatrix';
import SemanticTextComparison from '../../base/SemanticTextComparison';
import { CONTENT_CONFIG, EVIDENCE_QUALITY_WEIGHTS  } from '../config/contentConfig';

const EvidenceQualityAnalysis = ({ metrics, textSections, paperContent }) => {
  const [expandedEvidences, setExpandedEvidences] = useState({});
  const [expandedProperties, setExpandedProperties] = useState({});
  const [showEvidenceList, setShowEvidenceList] = useState(false);
  const [showValidEvidence, setShowValidEvidence] = useState(false);
  const [showInvalidEvidence, setShowInvalidEvidence] = useState(false);
  
  if (!metrics || !metrics.evidenceQuality) {
    return <div className="text-center text-gray-500">No evidence quality data available</div>;
  }

  const evidenceQuality = metrics.evidenceQuality;
  const details = evidenceQuality.details || {};
  
  const toggleEvidence = (id) => {
    setExpandedEvidences(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleProperty = (propId) => {
    setExpandedProperties(prev => ({
      ...prev,
      [propId]: !prev[propId]
    }));
  };
  
  // Extract evidence items from paper content
  const { evidenceItems, propertyEvidenceMap } = extractEvidenceItems(paperContent, textSections);
  const validEvidence = evidenceItems.filter(item => item.isValid);
  const invalidEvidence = evidenceItems.filter(item => !item.isValid);
  
  // Calculate scores
  const calculatedScores = calculateEvidenceQualityScores(metrics);
  console.log(metrics);
  return (
    <div className="space-y-6">
      {/* Component Metrics */}
      
        <div className="space-y-4">
          {/* Overall Evidence Quality Calculation (Combined Score) */}
          <EvidenceQualityCalculation 
            score={calculatedScores.combinedScore}
            componentScores={calculatedScores}
            weightedScores={calculatedScores}
            metrics={metrics}
            evidenceItems={evidenceItems}
          />
        
          {/* Citation Coverage Analysis 
          <CitationCoverageAnalysis 
            score={calculatedScores.citationCoverageScore}
            weight={EVIDENCE_QUALITY_WEIGHTS.citationCoverage}
            evidenceItems={evidenceItems}
            validCount={details.validEvidenceCount || validEvidence.length}
            totalCount={details.totalEvidenceCount || evidenceItems.length}
          />
          */}
          {/* Semantic Similarity Analysis */}
          <SemanticSimilarityAnalysis 
            score={calculatedScores.semanticSimilarityScore}
            weight={EVIDENCE_QUALITY_WEIGHTS.semanticSimilarity}
            evidenceItems={evidenceItems}
          />
          
          {/* Contextual Relevance Analysis */}
          <ContextualRelevanceAnalysis 
            score={calculatedScores.contextualRelevanceScore}
            weight={EVIDENCE_QUALITY_WEIGHTS.contextualRelevance}
            evidenceItems={evidenceItems}
          />
          
          {/* Token Overlap Analysis */}
          <TokenOverlapAnalysis 
            score={calculatedScores.tokenOverlapScore}
            weight={EVIDENCE_QUALITY_WEIGHTS.tokenOverlap}
            evidenceItems={evidenceItems}
          />
          
          {/* Structure Match Analysis */}
          <StructureMatchAnalysis 
            score={calculatedScores.structureMatchScore}
            weight={EVIDENCE_QUALITY_WEIGHTS.structureMatch}
            evidenceItems={evidenceItems}
          />
        </div>
      
      
      {/* Evidence List */}
      <div className="border rounded overflow-hidden">
        <div 
          className="bg-gray-50 p-3 flex items-center justify-between cursor-pointer"
          onClick={() => setShowEvidenceList(!showEvidenceList)}
        >
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-gray-600" />
            <h6 className="font-medium text-sm">Evidence Citations Analysis</h6>
          </div>
          <div className="flex items-center">
            <span className="mr-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
              {validEvidence.length + invalidEvidence.length} items
            </span>
            {showEvidenceList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {showEvidenceList && (
          <div className="p-3 space-y-4">
            {/* Valid Evidence Section */}
            {validEvidence.length > 0 && (
              <div className="border rounded overflow-hidden">
                <div 
                  className="bg-green-50 p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setShowValidEvidence(!showValidEvidence)}
                >
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    <h6 className="font-medium text-sm text-green-800">Valid Evidence ({validEvidence.length})</h6>
                  </div>
                  <div>
                    {showValidEvidence ? <ChevronUp className="h-4 w-4 text-green-600" /> : <ChevronDown className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
                
                {showValidEvidence && (
                  <div className="divide-y">
                    {Object.values(propertyEvidenceMap).map((propertyGroup) => {
                      const propertyValidEvidences = propertyGroup.values.filter(e => e.isValid);
                      if (propertyValidEvidences.length === 0) return null;
                      
                      const isExpanded = expandedProperties[propertyGroup.property];
                      
                      return (
                        <div key={propertyGroup.property} className="bg-white">
                          <div 
                            className="p-3 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleProperty(propertyGroup.property)}
                          >
                            <div>
                              <span className="font-medium text-sm">{propertyGroup.propertyLabel}</span>
                              <div className="text-xs text-gray-500">
                                {propertyValidEvidences.length} valid evidence citations
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="mr-2 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                {propertyValidEvidences.length}
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-3 border-t bg-gray-50 space-y-3">
                              {propertyValidEvidences.map((evidence) => {
                                const isExpanded = expandedEvidences[evidence.id];
                                
                                return (
                                  <div key={evidence.id} className="border rounded p-2">
                                    <div 
                                      className="flex items-center justify-between cursor-pointer mb-1"
                                      onClick={() => toggleEvidence(evidence.id)}
                                    >
                                      <div>
                                        <div className="text-xs font-medium">Value: {evidence.value?.toString().substring(0, 80)}{evidence.value?.toString().length > 80 ? '...' : ''}</div>
                                        <div className="text-xs text-gray-500">
                                          From {evidence.section} section
                                        </div>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="mr-2 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                          {formatPercentage(evidence.bestMatchScore)}
                                        </span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </div>
                                    </div>
                                    
                                    {isExpanded && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded border">
                                        <EvidenceAnalysisMatrix 
                                          sourceText={textSections[evidence.section] || ''}
                                          evidenceText={evidence.evidence}
                                          semanticAnalysis={evidence.semanticAnalysis}
                                        />
                                        
                                        <SemanticTextComparison
                                          sourceText={textSections[evidence.section] || ''}
                                          targetText={evidence.evidence}
                                          sourceLabel={`Paper Text (${evidence.section})`}
                                          targetLabel="Evidence"
                                          similarityThreshold={CONTENT_CONFIG.textSimilarityThreshold}
                                          showDetailsInitially={true}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Invalid Evidence Section */}
            {invalidEvidence.length > 0 && (
              <div className="border rounded overflow-hidden">
                <div 
                  className="bg-red-50 p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setShowInvalidEvidence(!showInvalidEvidence)}
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                    <h6 className="font-medium text-sm text-red-800">Invalid Evidence ({invalidEvidence.length})</h6>
                  </div>
                  <div>
                    {showInvalidEvidence ? <ChevronUp className="h-4 w-4 text-red-600" /> : <ChevronDown className="h-4 w-4 text-red-600" />}
                  </div>
                </div>
                
                {showInvalidEvidence && (
                  <div className="divide-y">
                    {Object.values(propertyEvidenceMap).map((propertyGroup) => {
                      const propertyInvalidEvidences = propertyGroup.values.filter(e => !e.isValid);
                      if (propertyInvalidEvidences.length === 0) return null;
                      
                      const isExpanded = expandedProperties[propertyGroup.property];
                      
                      return (
                        <div key={propertyGroup.property} className="bg-white">
                          <div 
                            className="p-3 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleProperty(propertyGroup.property)}
                          >
                            <div>
                              <span className="font-medium text-sm">{propertyGroup.propertyLabel}</span>
                              <div className="text-xs text-gray-500">
                                {propertyInvalidEvidences.length} invalid evidence citations
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="mr-2 px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                {propertyInvalidEvidences.length}
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-3 border-t bg-gray-50 space-y-3">
                              {propertyInvalidEvidences.map((evidence) => {
                                const isExpanded = expandedEvidences[evidence.id];
                                
                                return (
                                  <div key={evidence.id} className="border rounded p-2">
                                    <div 
                                      className="flex items-center justify-between cursor-pointer mb-1"
                                      onClick={() => toggleEvidence(evidence.id)}
                                    >
                                      <div>
                                        <div className="text-xs font-medium">Value: {evidence.value?.toString().substring(0, 80)}{evidence.value?.toString().length > 80 ? '...' : ''}</div>
                                        <div className="text-xs text-gray-500">
                                          From {evidence.section} section
                                        </div>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="mr-2 px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                          {formatPercentage(evidence.bestMatchScore)}
                                        </span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </div>
                                    </div>
                                    
                                    {isExpanded && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded border">
                                        <div className="bg-red-50 p-2 rounded border border-red-200 mb-3">
                                          <span className="text-xs text-red-700 font-medium">Issue: </span>
                                          <span className="text-xs text-red-700">
                                            Evidence not found in section with sufficient similarity.
                                            {evidence.bestMatchScore > 0 && ` Closest match: ${formatPercentage(evidence.bestMatchScore)} similar`}
                                          </span>
                                        </div>
                                        
                                        <EvidenceAnalysisMatrix 
                                          sourceText={textSections[evidence.section] || ''}
                                          evidenceText={evidence.evidence}
                                          semanticAnalysis={evidence.semanticAnalysis}
                                        />
                                        
                                        <SemanticTextComparison
                                          sourceText={textSections[evidence.section] || ''}
                                          targetText={evidence.evidence}
                                          sourceLabel={`Paper Text (${evidence.section})`}
                                          targetLabel="Evidence"
                                          similarityThreshold={CONTENT_CONFIG.textSimilarityThreshold}
                                          showDetailsInitially={true}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Evidence Analysis Tips */}
            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <h6 className="text-xs font-medium mb-2 text-blue-800">Understanding Evidence Analysis</h6>
              <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                <li>Evidence is considered <span className="font-medium">valid</span> when its similarity score exceeds {formatPercentage(CONTENT_CONFIG.textSimilarityThreshold)}</li>
                <li>Click on individual evidence items to see detailed analysis</li>
                <li>Distribution charts show how similarity scores are spread across all evidence items</li>
                <li>The overall evidence quality combines all five metric dimensions with their respective weights</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceQualityAnalysis;