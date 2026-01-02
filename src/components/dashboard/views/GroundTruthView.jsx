/**
 * Ground Truth Data View - Enhanced Version
 * Displays and manages ORKG ground truth papers with evaluation tracking
 * 
 * Features:
 * - Horizontal scrollable table with sticky header
 * - Color-coded evaluation status with legend (directly above table)
 * - Custom pagination with user-defined page size
 * - Sortable columns with clear visual indicators
 * - Quick action buttons per row
 * - Column visibility toggle
 * - ORKG paper links
 */

import React, { useState, useEffect, useMemo } from 'react';
import groundTruthService from '../../../services/groundTruthService';
import dashboardDataService from '../../../services/dashboardDataService';
import '../../../css/GroundTruthView.css';

// Icons as SVG components
const SortIcon = ({ direction }) => (
  <span className="sort-icon">
    {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
  </span>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ColumnsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

// Column configuration (removed expand and averageScore)
const COLUMN_CONFIG = [
  { key: 'select', label: '', sortable: false, width: '40px', alwaysVisible: true },
  { key: 'title', label: 'Title', sortable: true, width: '250px' },
  { key: 'doi', label: 'DOI', sortable: true, width: '180px' },
  { key: 'publication_year', label: 'Year', sortable: true, width: '80px' },
  { key: 'research_field_name', label: 'Research Field', sortable: true, width: '150px' },
  { key: 'research_problem_name', label: 'Research Problem', sortable: true, width: '180px' },
  { key: 'template_name', label: 'Template', sortable: true, width: '150px' },
  { key: 'evaluationCount', label: 'Evaluations', sortable: true, width: '100px' },
  { key: 'status', label: 'Status', sortable: true, width: '100px' },
  { key: 'actions', label: 'Actions', sortable: false, width: '80px', alwaysVisible: true }
];

// Legend configuration
const LEGEND_CONFIG = [
  { color: '#f8f9fa', border: '#dee2e6', label: 'Not Evaluated', count: 0 },
  { color: '#fff3cd', border: '#ffc107', label: '1 Evaluation', count: 1 },
  { color: '#d1ecf1', border: '#17a2b8', label: '2 Evaluations', count: 2 },
  { color: '#d4edda', border: '#28a745', label: '3+ Evaluations', count: 3 }
];

const GroundTruthView = () => {
  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [papers, setPapers] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    evaluationStatus: 'all',
    minEvaluations: 0,
    researchFieldId: '',
    templateId: '',
    yearFrom: '',
    yearTo: '',
    searchQuery: ''
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: 'title',
    direction: 'asc'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pageSizeInput, setPageSizeInput] = useState('25');
  
  // UI state
  const [stats, setStats] = useState(null);
  const [researchFields, setResearchFields] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPapers, setSelectedPapers] = useState(new Set());
  const [visibleColumns, setVisibleColumns] = useState(
    COLUMN_CONFIG.filter(c => c.alwaysVisible || !['research_problem_name'].includes(c.key)).map(c => c.key)
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Load ground truth data and evaluation counts
  useEffect(() => {
    loadGroundTruthData();
  }, []);

  const loadGroundTruthData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Loading ground truth data...');
      
      // Load CSV from GitHub using environment variables
      await groundTruthService.loadFromGitHub();
      console.log('✓ CSV loaded successfully');

      // Load evaluation data to get counts
      console.log('📊 Loading evaluation data...');
      const evaluationData = await dashboardDataService.getAllEvaluationData();
      
      // IMPORTANT: Use RAW evaluations, not processed ones
      if (evaluationData?.raw && evaluationData.raw.length > 0) {
        console.log(`📋 Found ${evaluationData.raw.length} RAW evaluations`);
        groundTruthService.updateEvaluationCounts(evaluationData.raw);
      } else if (evaluationData?.processed?.evaluations) {
        console.log(`📋 Found ${evaluationData.processed.evaluations.length} processed evaluations`);
        groundTruthService.updateEvaluationCounts(evaluationData.processed.evaluations);
      } else {
        console.warn('⚠️ No evaluation data found');
      }

      // Get data with status
      const papersWithStatus = groundTruthService.getAllPapersWithStatus();
      console.log(`📄 Papers with status: ${papersWithStatus.length}`);
      setPapers(papersWithStatus);

      // Get statistics
      const statistics = groundTruthService.getStatistics();
      console.log('📈 Statistics:', statistics);
      setStats(statistics);

      // Get filter options
      setResearchFields(groundTruthService.getUniqueResearchFields());
      setTemplates(groundTruthService.getUniqueTemplates());

      console.log('✅ Ground truth data loaded successfully');
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading ground truth data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Filter and sort papers
  const filteredAndSortedPapers = useMemo(() => {
    let filtered = groundTruthService.getFilteredPapers(filters);

    // Sort papers
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle special cases
        if (sortConfig.key === 'evaluationCount') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [papers, filters, sortConfig]);

  // Paginated papers
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedPapers.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedPapers, currentPage, pageSize]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedPapers.length / pageSize);
  }, [filteredAndSortedPapers.length, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle sort
  const handleSort = (key) => {
    const column = COLUMN_CONFIG.find(c => c.key === key);
    if (!column?.sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle page size change
  const handlePageSizeChange = () => {
    const newSize = parseInt(pageSizeInput, 10);
    if (!isNaN(newSize) && newSize > 0 && newSize <= 500) {
      setPageSize(newSize);
      setCurrentPage(1);
    } else {
      setPageSizeInput(pageSize.toString());
    }
  };

  // Handle page size input keydown
  const handlePageSizeKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageSizeChange();
    }
  };

  // Handle paper selection
  const togglePaperSelection = (paperId) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return newSet;
    });
  };

  const selectAllPapers = () => {
    if (selectedPapers.size === paginatedPapers.length) {
      setSelectedPapers(new Set());
    } else {
      setSelectedPapers(new Set(paginatedPapers.map(p => p.paper_id)));
    }
  };

  // Handle column visibility
  const toggleColumnVisibility = (columnKey) => {
    const column = COLUMN_CONFIG.find(c => c.key === columnKey);
    if (column?.alwaysVisible) return;
    
    setVisibleColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(k => k !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  // Download CSV
  const downloadCSV = (filtered = false) => {
    try {
      let csvContent;
      if (filtered) {
        csvContent = groundTruthService.exportFilteredCSV(filters);
      } else {
        csvContent = groundTruthService.exportCSV();
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orkg_papers_${filtered ? 'filtered_' : ''}${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download CSV: ' + err.message);
    }
  };

  // Download selected papers
  const downloadSelectedCSV = () => {
    if (selectedPapers.size === 0) {
      alert('Please select papers to download');
      return;
    }

    const selectedData = filteredAndSortedPapers.filter(p => selectedPapers.has(p.paper_id));
    const Papa = require('papaparse');
    const csvContent = Papa.unparse(selectedData);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `orkg_papers_selected_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get row style based on status
  const getRowStyle = (paper) => {
    const config = LEGEND_CONFIG.find(l => {
      if (l.count === 3) return paper.evaluationCount >= 3;
      return paper.evaluationCount === l.count;
    }) || LEGEND_CONFIG[0];
    
    return {
      backgroundColor: config.color,
      borderLeft: `4px solid ${config.border}`
    };
  };

  // Quick action: Open in ORKG
  const openInORKG = (paperId) => {
    window.open(`https://orkg.org/paper/${paperId}`, '_blank');
  };

  // Check if column is visible
  const isColumnVisible = (key) => visibleColumns.includes(key);

  if (loading) {
    return (
      <div className="ground-truth-view loading">
        <div className="loader"></div>
        <p>Loading ground truth data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ground-truth-view error">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={loadGroundTruthData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ground-truth-view">
      {/* Statistics Bar - Full Width Horizontal */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalPapers || 0}</div>
          <div className="stat-label">Total Papers</div>
        </div>
        <div className="stat-card evaluated">
          <div className="stat-value">{stats?.evaluatedPapers || 0}</div>
          <div className="stat-label">Evaluated</div>
          <div className="stat-bar">
            <div 
              className="stat-bar-fill" 
              style={{ width: `${(stats?.evaluatedPapers / stats?.totalPapers * 100) || 0}%` }}
            />
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-value">{stats?.pendingPapers || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalEvaluations || 0}</div>
          <div className="stat-label">Total Evaluations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.avgEvaluationsPerPaper || 0}</div>
          <div className="stat-label">Avg Evals/Paper</div>
        </div>
        <div className="stat-card coverage">
          <div className="stat-value">{stats?.evaluationCoverage || 0}%</div>
          <div className="stat-label">Coverage</div>
          <div className="stat-bar">
            <div 
              className="stat-bar-fill" 
              style={{ width: `${stats?.evaluationCoverage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.evaluationStatus} 
              onChange={(e) => handleFilterChange('evaluationStatus', e.target.value)}
            >
              <option value="all">All Papers</option>
              <option value="evaluated">Evaluated Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Min Evaluations:</label>
            <input 
              type="number" 
              min="0" 
              value={filters.minEvaluations} 
              onChange={(e) => handleFilterChange('minEvaluations', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="filter-group">
            <label>Research Field:</label>
            <select 
              value={filters.researchFieldId} 
              onChange={(e) => handleFilterChange('researchFieldId', e.target.value)}
            >
              <option value="">All Fields</option>
              {researchFields.map(field => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Template:</label>
            <select 
              value={filters.templateId} 
              onChange={(e) => handleFilterChange('templateId', e.target.value)}
            >
              <option value="">All Templates</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year From:</label>
            <input 
              type="number" 
              value={filters.yearFrom} 
              onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
              placeholder="YYYY"
            />
          </div>

          <div className="filter-group">
            <label>Year To:</label>
            <input 
              type="number" 
              value={filters.yearTo} 
              onChange={(e) => handleFilterChange('yearTo', e.target.value)}
              placeholder="YYYY"
            />
          </div>

          <div className="filter-group search-group">
            <label>Search Title:</label>
            <input 
              type="text" 
              value={filters.searchQuery} 
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="Search by title..."
            />
          </div>

          <button 
            className="clear-filters-btn" 
            onClick={() => setFilters({
              evaluationStatus: 'all',
              minEvaluations: 0,
              researchFieldId: '',
              templateId: '',
              yearFrom: '',
              yearTo: '',
              searchQuery: ''
            })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="left-actions">
          <div className="selection-info">
            {selectedPapers.size > 0 && (
              <span className="selected-count">{selectedPapers.size} paper(s) selected</span>
            )}
          </div>
          
          {/* Column Toggle */}
          <div className="column-toggle-wrapper">
            <button 
              className="column-toggle-btn"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              title="Toggle columns"
            >
              <ColumnsIcon /> Columns
            </button>
            {showColumnMenu && (
              <div className="column-menu">
                <div className="column-menu-header">Toggle Columns</div>
                {COLUMN_CONFIG.filter(c => !c.alwaysVisible).map(column => (
                  <label key={column.key} className="column-menu-item">
                    <input 
                      type="checkbox"
                      checked={visibleColumns.includes(column.key)}
                      onChange={() => toggleColumnVisibility(column.key)}
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => downloadCSV(false)} title="Download all papers as CSV">
            <DownloadIcon /> All CSV
          </button>
          <button onClick={() => downloadCSV(true)} title="Download filtered papers as CSV">
            <DownloadIcon /> Filtered CSV
          </button>
          {selectedPapers.size > 0 && (
            <button onClick={downloadSelectedCSV} title="Download selected papers as CSV">
              <DownloadIcon /> Selected CSV
            </button>
          )}
          <button onClick={loadGroundTruthData} title="Refresh data">
            <RefreshIcon /> Refresh
          </button>
        </div>
      </div>

      {/* Results Info & Pagination Controls */}
      <div className="results-pagination-bar">
        <div className="results-info">
          Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredAndSortedPapers.length)} of {filteredAndSortedPapers.length} papers
        </div>
        
        <div className="pagination-controls">
          <div className="page-size-control">
            <label>Items per page:</label>
            <input 
              type="text"
              value={pageSizeInput}
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/\D/g, '');
                setPageSizeInput(value);
              }}
              onBlur={handlePageSizeChange}
              onKeyDown={handlePageSizeKeyDown}
              className="page-size-input"
              title="Enter number and press Enter or click outside"
            />
            <button 
              onClick={handlePageSizeChange}
              className="apply-page-size"
              title="Apply page size"
            >
              Apply
            </button>
          </div>
          
          <div className="page-navigation">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First page"
            >
              ⟪
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              title="Previous page"
            >
              ←
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              title="Next page"
            >
              →
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              title="Last page"
            >
              ⟫
            </button>
          </div>
        </div>
      </div>

      {/* Sortable Columns Hint */}
      <div className="sort-hint">
        <span>💡 Tip: Click on column headers with ⇅ to sort the table</span>
      </div>

      {/* Legend - Directly Above Table */}
      <div className="legend-container">
        <span className="legend-title">Evaluation Status:</span>
        <div className="legend">
          {LEGEND_CONFIG.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ 
                  backgroundColor: item.color,
                  border: `2px solid ${item.border}`
                }}
              />
              <span className="legend-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Papers Table with Horizontal Scroll */}
      <div className="papers-table-container">
        <table className="papers-table">
          <thead>
            <tr>
              {isColumnVisible('select') && (
                <th className="checkbox-col">
                  <input 
                    type="checkbox" 
                    checked={selectedPapers.size === paginatedPapers.length && paginatedPapers.length > 0}
                    onChange={selectAllPapers}
                    title="Select all on this page"
                  />
                </th>
              )}
              {COLUMN_CONFIG.filter(c => c.key !== 'select' && isColumnVisible(c.key)).map(column => (
                <th 
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`${column.sortable ? 'sortable' : ''} ${sortConfig.key === column.key ? 'sorted' : ''}`}
                  style={{ minWidth: column.width }}
                  title={column.sortable ? `Click to sort by ${column.label}` : ''}
                >
                  <div className="th-content">
                    {column.label}
                    {column.sortable && (
                      <SortIcon direction={sortConfig.key === column.key ? sortConfig.direction : null} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedPapers.map((paper) => (
              <tr 
                key={paper.paper_id}
                style={getRowStyle(paper)}
                className={selectedPapers.has(paper.paper_id) ? 'selected' : ''}
              >
                {isColumnVisible('select') && (
                  <td className="checkbox-col">
                    <input 
                      type="checkbox" 
                      checked={selectedPapers.has(paper.paper_id)}
                      onChange={() => togglePaperSelection(paper.paper_id)}
                    />
                  </td>
                )}
                {isColumnVisible('title') && (
                  <td className="title-cell" title={paper.title}>
                    <a 
                      href={`https://orkg.org/paper/${paper.paper_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-title-link"
                    >
                      {paper.title || 'N/A'}
                    </a>
                  </td>
                )}
                {isColumnVisible('doi') && (
                  <td className="doi-cell">
                    {paper.doi ? (
                      <a 
                        href={`https://doi.org/${paper.doi}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {paper.doi}
                      </a>
                    ) : 'N/A'}
                  </td>
                )}
                {isColumnVisible('publication_year') && (
                  <td>{paper.publication_year || 'N/A'}</td>
                )}
                {isColumnVisible('research_field_name') && (
                  <td>{paper.research_field_name || 'N/A'}</td>
                )}
                {isColumnVisible('research_problem_name') && (
                  <td>{paper.research_problem_name || 'N/A'}</td>
                )}
                {isColumnVisible('template_name') && (
                  <td>{paper.template_name || 'N/A'}</td>
                )}
                {isColumnVisible('evaluationCount') && (
                  <td className="eval-count">
                    <span className={`badge ${paper.evaluationCount > 0 ? 'evaluated' : 'pending'}`}>
                      {paper.evaluationCount}
                    </span>
                  </td>
                )}
                {isColumnVisible('status') && (
                  <td>
                    <span className={`status-badge ${paper.status}`}>
                      {paper.status === 'evaluated' ? 'Evaluated' : 'Pending'}
                    </span>
                  </td>
                )}
                {isColumnVisible('actions') && (
                  <td className="actions-cell">
                    <div className="action-buttons-cell">
                      <button 
                        className="action-btn orkg-btn"
                        onClick={() => openInORKG(paper.paper_id)}
                        title="Open in ORKG"
                      >
                        <ExternalLinkIcon />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedPapers.length === 0 && (
          <div className="no-results">
            No papers match the current filters
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="bottom-pagination">
          <button 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </button>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};

export default GroundTruthView;