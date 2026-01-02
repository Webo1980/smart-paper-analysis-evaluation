/**
 * CommentSelectionPanel Component - v2
 * 
 * NEW: Generates INTERPRETIVE narrative reports instead of README-style lists
 * - Synthesizes feedback based on expertise
 * - Provides expert-weighted analysis
 * - Creates academic-ready narrative text
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  CheckSquare, Square, Download, FileText, Wand2, Copy,
  CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen 
} from 'lucide-react';

import {
  generateInterpretiveReport,
  classifyExpertise,
  EXPERTISE_CONFIG
} from '../../../services/Commentextractionservice';
import { analyzeSentiment, getSentimentLabel } from '../../../services/sentimentAnalysisService';

const SELECTION_CRITERIA = {
  REPRESENTATIVE: 'representative',
  EXPERT_ONLY: 'expert_only',
  CRITICAL_FEEDBACK: 'critical_feedback',
  POSITIVE_FEEDBACK: 'positive_feedback',
  DETAILED: 'detailed'
};

const CommentSelectionPanel = ({ 
  comments, 
  selectedIds, 
  onSelectionChange,
  onGenerateReport 
}) => {
  const [showAutoSelectOptions, setShowAutoSelectOptions] = useState(false);
  const [autoSelectCriteria, setAutoSelectCriteria] = useState({
    criteriaType: SELECTION_CRITERIA.REPRESENTATIVE,
    maxComments: 20
  });
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  // Calculate selection statistics
  const selectionStats = useMemo(() => {
    const selected = comments.filter(c => selectedIds.includes(c.id));
    
    const byComponent = {};
    const bySentiment = { positive: 0, neutral: 0, negative: 0 };
    const byExpertise = { expert: 0, advanced: 0, intermediate: 0, basic: 0 };
    let ratingSum = 0;
    let ratingCount = 0;

    selected.forEach(c => {
      byComponent[c.componentName] = (byComponent[c.componentName] || 0) + 1;
      
      const sentiment = analyzeSentiment(c.text);
      if (sentiment.normalizedScore > 0.6) bySentiment.positive++;
      else if (sentiment.normalizedScore < 0.4) bySentiment.negative++;
      else bySentiment.neutral++;
      
      const tier = c.expertiseClass?.tier || 'intermediate';
      byExpertise[tier] = (byExpertise[tier] || 0) + 1;
      
      if (c.rating) {
        ratingSum += c.rating;
        ratingCount++;
      }
    });

    return {
      total: selected.length,
      byComponent,
      bySentiment,
      byExpertise,
      avgRating: ratingCount > 0 ? ratingSum / ratingCount : null,
      expertCount: byExpertise.expert + byExpertise.advanced
    };
  }, [comments, selectedIds]);

  // Toggle single comment selection
  const toggleComment = useCallback((commentId) => {
    const newSelection = selectedIds.includes(commentId)
      ? selectedIds.filter(id => id !== commentId)
      : [...selectedIds, commentId];
    onSelectionChange(newSelection);
  }, [selectedIds, onSelectionChange]);

  // Select all / clear all
  const selectAll = useCallback(() => {
    onSelectionChange(comments.map(c => c.id));
  }, [comments, onSelectionChange]);

  const clearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Auto-select based on criteria
  const handleAutoSelect = useCallback(() => {
    let selected = [];
    const { criteriaType, maxComments } = autoSelectCriteria;

    switch (criteriaType) {
      case SELECTION_CRITERIA.EXPERT_ONLY:
        selected = comments
          .filter(c => c.expertiseClass?.tier === 'expert' || c.expertiseClass?.tier === 'advanced')
          .slice(0, maxComments)
          .map(c => c.id);
        break;

      case SELECTION_CRITERIA.CRITICAL_FEEDBACK:
        selected = comments
          .filter(c => {
            const sentiment = analyzeSentiment(c.text);
            return sentiment.normalizedScore < 0.5 || c.rating <= 3;
          })
          .sort((a, b) => {
            const tierOrder = { expert: 0, advanced: 1, intermediate: 2, basic: 3 };
            return (tierOrder[a.expertiseClass?.tier] || 3) - (tierOrder[b.expertiseClass?.tier] || 3);
          })
          .slice(0, maxComments)
          .map(c => c.id);
        break;

      case SELECTION_CRITERIA.POSITIVE_FEEDBACK:
        selected = comments
          .filter(c => {
            const sentiment = analyzeSentiment(c.text);
            return sentiment.normalizedScore > 0.5 || c.rating >= 4;
          })
          .sort((a, b) => {
            const tierOrder = { expert: 0, advanced: 1, intermediate: 2, basic: 3 };
            return (tierOrder[a.expertiseClass?.tier] || 3) - (tierOrder[b.expertiseClass?.tier] || 3);
          })
          .slice(0, maxComments)
          .map(c => c.id);
        break;

      case SELECTION_CRITERIA.DETAILED:
        selected = comments
          .filter(c => c.text.length >= 50)
          .sort((a, b) => b.text.length - a.text.length)
          .slice(0, maxComments)
          .map(c => c.id);
        break;

      case SELECTION_CRITERIA.REPRESENTATIVE:
      default:
        // Balanced selection: prioritize experts, cover all components
        const byComponent = {};
        comments.forEach(c => {
          if (!byComponent[c.component]) byComponent[c.component] = [];
          byComponent[c.component].push(c);
        });

        const perComponent = Math.max(2, Math.floor(maxComments / Object.keys(byComponent).length));
        
        Object.values(byComponent).forEach(componentComments => {
          componentComments
            .sort((a, b) => {
              const tierOrder = { expert: 0, advanced: 1, intermediate: 2, basic: 3, unknown: 4 };
              return (tierOrder[a.expertiseClass?.tier] || 4) - (tierOrder[b.expertiseClass?.tier] || 4);
            })
            .slice(0, perComponent)
            .forEach(c => selected.push(c.id));
        });
        selected = selected.slice(0, maxComments);
        break;
    }

    onSelectionChange(selected);
    setShowAutoSelectOptions(false);
  }, [comments, autoSelectCriteria, onSelectionChange]);

  // Generate interpretive report
  const handleGenerateReport = useCallback(() => {
    const report = generateInterpretiveReport(
      comments,
      selectedIds,
      {
        title: 'User Feedback Interpretation',
        sentimentAnalyzer: analyzeSentiment
      }
    );
    setGeneratedReport(report);
    setShowReportPreview(true);
    if (onGenerateReport) {
      onGenerateReport(report);
    }
  }, [comments, selectedIds, onGenerateReport]);

  // Export functions
  const handleExport = useCallback((format) => {
    if (!generatedReport) return;
    
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (format) {
      case 'markdown':
        content = generatedReport.markdown || generatedReport.narrative || '';
        filename = 'feedback_interpretation.md';
        mimeType = 'text/markdown';
        break;
      case 'text':
        content = generatedReport.narrative || generatedReport.markdown || '';
        filename = 'feedback_interpretation.txt';
        mimeType = 'text/plain';
        break;
      case 'latex':
        content = convertToLatex(generatedReport);
        filename = 'feedback_interpretation.tex';
        mimeType = 'text/plain';
        break;
      default:
        return;
    }
    
    if (!content) return;
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [generatedReport]);

  const convertToLatex = (report) => {
    let latex = `% User Feedback Interpretation
% Generated: ${new Date().toISOString()}

\\section{User Feedback Analysis}

`;
    // Convert markdown-style formatting to LaTeX
    let content = (report.narrative || report.markdown || '')
      .replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
      .replace(/\*([^*]+)\*/g, '\\textit{$1}')
      .replace(/"([^"]+)"/g, '``$1\'\'');
    
    latex += content + '\n\n';
    
    latex += `\\subsection{Statistical Summary}

\\begin{table}[h]
\\centering
\\begin{tabular}{lr}
\\toprule
\\textbf{Metric} & \\textbf{Value} \\\\
\\midrule
Total Comments & ${report.statistics?.total || 0} \\\\
Expert Feedback & ${report.statistics?.expertCount || 0} \\\\
Positive Sentiment & ${report.statistics?.positive || 0} \\\\
Negative Sentiment & ${report.statistics?.negative || 0} \\\\
\\bottomrule
\\end{tabular}
\\end{table}
`;
    return latex;
  };

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    if (!generatedReport) return;
    const content = generatedReport.markdown || generatedReport.narrative || '';
    if (content) {
      navigator.clipboard.writeText(content);
    }
  }, [generatedReport]);

  return (
    <div className="space-y-4">
      {/* Selection Toolbar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              Comment Selection for Report
            </span>
            <span className="text-sm font-normal text-gray-500">
              {selectionStats.total} of {comments.length} selected
              {selectionStats.expertCount > 0 && (
                <span className="ml-2 text-purple-600">
                  (★ {selectionStats.expertCount} expert)
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
            
            <div className="h-6 w-px bg-gray-300 mx-2" />
            
            {/* Auto-select dropdown */}
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAutoSelectOptions(!showAutoSelectOptions)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Smart Select
                {showAutoSelectOptions ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
              
              {showAutoSelectOptions && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border rounded-lg shadow-lg z-50 p-4">
                  <h4 className="font-medium mb-3">Smart Selection</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Selection Strategy</label>
                      <select
                        value={autoSelectCriteria.criteriaType}
                        onChange={(e) => setAutoSelectCriteria(prev => ({ ...prev, criteriaType: e.target.value }))}
                        className="w-full border rounded px-2 py-1 mt-1 text-sm"
                      >
                        <option value={SELECTION_CRITERIA.REPRESENTATIVE}>Representative Sample</option>
                        <option value={SELECTION_CRITERIA.EXPERT_ONLY}>Expert Feedback Only</option>
                        <option value={SELECTION_CRITERIA.CRITICAL_FEEDBACK}>Critical Feedback</option>
                        <option value={SELECTION_CRITERIA.POSITIVE_FEEDBACK}>Positive Feedback</option>
                        <option value={SELECTION_CRITERIA.DETAILED}>Detailed Comments</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600">Max Comments: {autoSelectCriteria.maxComments}</label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={autoSelectCriteria.maxComments}
                        onChange={(e) => setAutoSelectCriteria(prev => ({ ...prev, maxComments: parseInt(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                    
                    <Button size="sm" onClick={handleAutoSelect} className="w-full">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Apply Selection
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-gray-300 mx-2" />
            
            {/* Generate Report */}
            <Button 
              size="sm" 
              onClick={handleGenerateReport}
              disabled={selectionStats.total === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Generate Interpretation
            </Button>
          </div>
          
          {/* Selection Stats */}
          {selectionStats.total > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xl font-bold text-gray-700">{selectionStats.total}</div>
                  <div className="text-xs text-gray-500">Selected</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="text-xl font-bold text-purple-700">{selectionStats.expertCount}</div>
                  <div className="text-xs text-purple-500">★ Expert</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-xl font-bold text-green-700">{selectionStats.bySentiment.positive}</div>
                  <div className="text-xs text-green-500">Positive</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="text-xl font-bold text-yellow-700">{selectionStats.bySentiment.neutral}</div>
                  <div className="text-xs text-yellow-500">Neutral</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-xl font-bold text-red-700">{selectionStats.bySentiment.negative}</div>
                  <div className="text-xs text-red-500">Critical</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Select Comments for Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {comments.map((comment) => {
              const isSelected = selectedIds.includes(comment.id);
              const sentiment = analyzeSentiment(comment.text);
              const sentimentLabel = getSentimentLabel(sentiment.sentiment);
              const isExpert = comment.expertiseClass?.tier === 'expert' || comment.expertiseClass?.tier === 'advanced';
              
              return (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${isExpert ? 'border-l-4 border-l-purple-400' : ''}`}
                  onClick={() => toggleComment(comment.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                        <span 
                          className="px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: comment.componentColor }}
                        >
                          {comment.componentName}
                        </span>
                        <span>{comment.subfield}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          isExpert 
                            ? 'bg-purple-100 text-purple-700 font-medium' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isExpert && '★ '}
                          {comment.role}
                        </span>
                        {comment.rating && (
                          <span className="text-gray-400">Rating: {comment.rating}/5</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">{comment.text}</p>
                      {isExpert && comment.expertiseClass && (
                        <div className="mt-1 text-xs text-purple-600">
                          {comment.expertiseClass.credibilityStatement}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <span title={sentimentLabel.label}>{sentimentLabel.emoji}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        sentiment.normalizedScore > 0.6 ? 'bg-green-100 text-green-700' :
                        sentiment.normalizedScore < 0.4 ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {(sentiment.normalizedScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Modal */}
      {showReportPreview && generatedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Feedback Interpretation Report
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('markdown')}>
                    <Download className="h-4 w-4 mr-2" />
                    Markdown
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('latex')}>
                    LaTeX
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowReportPreview(false)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6">
              {/* Statistics Summary */}
              <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{generatedReport.statistics?.total || 0}</div>
                  <div className="text-xs text-gray-500">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{generatedReport.statistics?.expertCount || 0}</div>
                  <div className="text-xs text-purple-500">Expert</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{generatedReport.statistics?.positive || 0}</div>
                  <div className="text-xs text-green-500">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{generatedReport.statistics?.negative || 0}</div>
                  <div className="text-xs text-red-500">Critical</div>
                </div>
              </div>
              
              {/* Natural Narrative */}
              <div className="prose prose-sm max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed text-base"
                  dangerouslySetInnerHTML={{ 
                    __html: (generatedReport.narrative || generatedReport.markdown || '')
                      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                      .replace(/"([^"]+)"/g, '<span class="text-gray-600 italic">"$1"</span>')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CommentSelectionPanel;

/**
 * SelectableCommentRow - Compact comment row for table views with selection
 */
export const SelectableCommentRow = ({ 
  comment, 
  isSelected, 
  onToggle,
  showFullText = false 
}) => {
  const sentiment = analyzeSentiment(comment.text);
  const sentimentLabel = getSentimentLabel(sentiment.sentiment);
  const expertiseClass = comment.expertiseClass || classifyExpertise(comment.userInfo);
  const isExpert = expertiseClass.tier === 'expert' || expertiseClass.tier === 'advanced';
  
  return (
    <tr 
      className={`border-b hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''} ${isExpert ? 'border-l-2 border-l-purple-400' : ''}`}
      onClick={() => onToggle(comment.id)}
    >
      <td className="p-2 text-center">
        {isSelected ? (
          <CheckSquare className="h-4 w-4 text-blue-600 inline" />
        ) : (
          <Square className="h-4 w-4 text-gray-400 inline" />
        )}
      </td>
      <td className="p-2">
        <span 
          className="px-2 py-0.5 rounded text-white text-xs"
          style={{ backgroundColor: comment.componentColor }}
        >
          {comment.componentName}
        </span>
      </td>
      <td className="p-2 text-gray-600 text-sm">{comment.subfield}</td>
      <td className="p-2 max-w-md">
        <span className={showFullText ? '' : 'line-clamp-2'}>{comment.text}</span>
      </td>
      <td className="p-2 text-center">{comment.rating || '-'}</td>
      <td className="p-2 text-center">
        <span className={`px-2 py-0.5 rounded text-xs ${
          expertiseClass.tier === 'expert' 
            ? 'bg-purple-100 text-purple-700' 
            : expertiseClass.tier === 'advanced'
            ? 'bg-blue-100 text-blue-700'
            : expertiseClass.tier === 'intermediate'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isExpert && '★ '}
          {expertiseClass.tier ? expertiseClass.tier.charAt(0).toUpperCase() + expertiseClass.tier.slice(1) : 'Unknown'}
        </span>
      </td>
      <td className="p-2 text-center">
        <span title={sentimentLabel.label}>{sentimentLabel.emoji}</span>
      </td>
      <td className="p-2 text-center">
        <span 
          className="px-2 py-0.5 rounded text-xs"
          style={{ 
            backgroundColor: sentiment.normalizedScore > 0.6 ? '#dcfce7' : 
                           sentiment.normalizedScore < 0.4 ? '#fee2e2' : '#fef9c3',
            color: sentiment.normalizedScore > 0.6 ? '#166534' : 
                   sentiment.normalizedScore < 0.4 ? '#991b1b' : '#854d0e'
          }}
        >
          {(sentiment.normalizedScore * 100).toFixed(0)}%
        </span>
      </td>
    </tr>
  );
};