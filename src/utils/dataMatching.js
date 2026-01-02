/**
 * Data Matching Utilities
 * Functions for matching data across different sources (ORKG, System, User)
 */

/**
 * Normalize DOI for comparison
 * @param {string} doi
 * @returns {string}
 */
export const normalizeDOI = (doi) => {
  if (!doi) return '';
  return doi.toLowerCase().trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
};

/**
 * Match data by DOI
 * @param {Object} groundTruth - Ground truth data with DOI
 * @param {Object} systemData - System analysis with DOI
 * @param {Object} userEvaluation - User evaluation (may have DOI in metadata)
 * @returns {boolean}
 */
export const matchByDOI = (groundTruth, systemData, userEvaluation) => {
  const gtDoi = normalizeDOI(groundTruth?.doi);
  const sysDoi = normalizeDOI(systemData?.doi || systemData?.metadata?.doi);
  const userDoi = normalizeDOI(userEvaluation?.paperDoi);

  if (!gtDoi && !sysDoi && !userDoi) return false;

  return (gtDoi && sysDoi && gtDoi === sysDoi) ||
         (gtDoi && userDoi && gtDoi === userDoi) ||
         (sysDoi && userDoi && sysDoi === userDoi);
};

/**
 * Match data by paper ID
 * @param {Object} groundTruth
 * @param {Object} systemData
 * @param {Object} userEvaluation
 * @returns {boolean}
 */
export const matchByPaperID = (groundTruth, systemData, userEvaluation) => {
  const gtId = groundTruth?.paper_id;
  const sysId = systemData?.paperId;
  const userId = userEvaluation?.paperId;

  if (!gtId && !sysId && !userId) return false;

  return (gtId && sysId && gtId === sysId) ||
         (gtId && userId && gtId === userId) ||
         (sysId && userId && sysId === userId);
};

/**
 * Find orphaned records (present in one source but not others)
 * @param {Array} groundTruthData
 * @param {Array} systemData
 * @param {Array} userEvaluations
 * @returns {Object}
 */
export const findOrphanedRecords = (groundTruthData, systemData, userEvaluations) => {
  const orphaned = {
    groundTruthOnly: [],
    systemOnly: [],
    userOnly: []
  };

  // Create DOI sets for quick lookup
  const gtDois = new Set(groundTruthData.map(d => normalizeDOI(d.doi)).filter(Boolean));
  const sysDois = new Set(systemData.map(d => normalizeDOI(d.doi || d.metadata?.doi)).filter(Boolean));
  const userDois = new Set(userEvaluations.map(d => normalizeDOI(d.paperDoi)).filter(Boolean));

  // Find ground truth only
  groundTruthData.forEach(gt => {
    const doi = normalizeDOI(gt.doi);
    if (doi && !sysDois.has(doi) && !userDois.has(doi)) {
      orphaned.groundTruthOnly.push(gt);
    }
  });

  // Find system only
  systemData.forEach(sys => {
    const doi = normalizeDOI(sys.doi || sys.metadata?.doi);
    if (doi && !gtDois.has(doi) && !userDois.has(doi)) {
      orphaned.systemOnly.push(sys);
    }
  });

  // Find user only
  userEvaluations.forEach(user => {
    const doi = normalizeDOI(user.paperDoi);
    if (doi && !gtDois.has(doi) && !sysDois.has(doi)) {
      orphaned.userOnly.push(user);
    }
  });

  return orphaned;
};

/**
 * Build three-way match index
 * Creates a map where each entry contains all matching records from each source
 * @param {Array} groundTruthData
 * @param {Array} systemData
 * @param {Array} userEvaluations
 * @returns {Map}
 */
export const buildThreeWayMatchIndex = (groundTruthData, systemData, userEvaluations) => {
  const index = new Map();

  // Helper to get or create entry
  const getEntry = (key) => {
    if (!index.has(key)) {
      index.set(key, {
        groundTruth: null,
        systemAnalysis: null,
        userEvaluation: null
      });
    }
    return index.get(key);
  };

  // Index ground truth by DOI and paper_id
  groundTruthData.forEach(gt => {
    const doi = normalizeDOI(gt.doi);
    const paperId = gt.paper_id;

    if (doi) {
      const entry = getEntry(doi);
      entry.groundTruth = gt;
    }
    if (paperId) {
      const entry = getEntry(paperId);
      entry.groundTruth = gt;
    }
  });

  // Index system analysis by DOI
  systemData.forEach(sys => {
    const doi = normalizeDOI(sys.doi || sys.metadata?.doi);
    const paperId = sys.paperId;

    if (doi) {
      const entry = getEntry(doi);
      entry.systemAnalysis = sys;
    }
    if (paperId) {
      const entry = getEntry(paperId);
      entry.systemAnalysis = sys;
    }
  });

  // Index user evaluations by DOI
  userEvaluations.forEach(user => {
    const doi = normalizeDOI(user.paperDoi);
    const paperId = user.paperId;

    if (doi) {
      const entry = getEntry(doi);
      entry.userEvaluation = user;
    }
    if (paperId) {
      const entry = getEntry(paperId);
      entry.userEvaluation = user;
    }
  });

  return index;
};

/**
 * Calculate match statistics
 * @param {Map} matchIndex - Result from buildThreeWayMatchIndex
 * @returns {Object}
 */
export const calculateMatchStatistics = (matchIndex) => {
  let completeMatches = 0;
  let twoWayMatches = 0;
  let oneSource = 0;

  matchIndex.forEach(entry => {
    const sources = [
      entry.groundTruth,
      entry.systemAnalysis,
      entry.userEvaluation
    ].filter(Boolean).length;

    if (sources === 3) completeMatches++;
    else if (sources === 2) twoWayMatches++;
    else if (sources === 1) oneSource++;
  });

  return {
    total: matchIndex.size,
    completeMatches,
    twoWayMatches,
    oneSource,
    coveragePercentage: {
      complete: (completeMatches / matchIndex.size * 100).toFixed(1),
      twoWay: (twoWayMatches / matchIndex.size * 100).toFixed(1),
      oneSource: (oneSource / matchIndex.size * 100).toFixed(1)
    }
  };
};

/**
 * Get coverage statistics from integrated data
 * @param {Object} integratedData - Integrated data object
 * @returns {Object} Coverage statistics
 */
export const getCoverageStatistics = (integratedData) => {
  if (!integratedData || !integratedData.papers) {
    return {
      total: 0,
      withGroundTruth: 0,
      withSystemOutput: 0,
      withUserEvaluations: 0,
      completeMatches: 0,
      twoWayMatches: 0,
      oneSource: 0,
      coveragePercentage: {
        groundTruth: '0.0',
        systemOutput: '0.0',
        userEvaluations: '0.0',
        complete: '0.0',
        twoWay: '0.0',
        oneSource: '0.0'
      }
    };
  }

  const papers = integratedData.papers;
  const total = papers.length;

  let withGroundTruth = 0;
  let withSystemOutput = 0;
  let withUserEvaluations = 0;
  let completeMatches = 0;
  let twoWayMatches = 0;
  let oneSource = 0;

  papers.forEach(paper => {
    const hasGT = !!paper.groundTruth;
    const hasSys = !!paper.systemOutput;
    const hasEvals = paper.userEvaluations && paper.userEvaluations.length > 0;

    if (hasGT) withGroundTruth++;
    if (hasSys) withSystemOutput++;
    if (hasEvals) withUserEvaluations++;

    const sources = [hasGT, hasSys, hasEvals].filter(Boolean).length;
    
    if (sources === 3) completeMatches++;
    else if (sources === 2) twoWayMatches++;
    else if (sources === 1) oneSource++;
  });

  return {
    total,
    withGroundTruth,
    withSystemOutput,
    withUserEvaluations,
    completeMatches,
    twoWayMatches,
    oneSource,
    coveragePercentage: {
      groundTruth: (withGroundTruth / total * 100).toFixed(1),
      systemOutput: (withSystemOutput / total * 100).toFixed(1),
      userEvaluations: (withUserEvaluations / total * 100).toFixed(1),
      complete: (completeMatches / total * 100).toFixed(1),
      twoWay: (twoWayMatches / total * 100).toFixed(1),
      oneSource: (oneSource / total * 100).toFixed(1)
    }
  };
};

/**
 * Match system analysis to ground truth
 * @param {Object} systemAnalysis
 * @param {Array} groundTruthData
 * @returns {Object|null}
 */
export const findGroundTruthMatch = (systemAnalysis, groundTruthData) => {
  const sysDoi = normalizeDOI(systemAnalysis.doi || systemAnalysis.metadata?.doi);
  
  if (sysDoi) {
    return groundTruthData.find(gt => normalizeDOI(gt.doi) === sysDoi) || null;
  }

  return null;
};

/**
 * Match user evaluation to system analysis
 * @param {Object} userEvaluation
 * @param {Array} systemData
 * @returns {Object|null}
 */
export const findSystemAnalysisMatch = (userEvaluation, systemData) => {
  const userDoi = normalizeDOI(userEvaluation.paperDoi);
  const userId = userEvaluation.paperId;

  if (userDoi) {
    return systemData.find(sys => 
      normalizeDOI(sys.doi || sys.metadata?.doi) === userDoi
    ) || null;
  }

  if (userId) {
    return systemData.find(sys => sys.paperId === userId) || null;
  }

  return null;
};

/**
 * Get identifier for a paper (prefers DOI, falls back to paper_id)
 * @param {Object} paper
 * @returns {string}
 */
export const getPaperIdentifier = (paper) => {
  return normalizeDOI(paper.doi || paper.metadata?.doi) || 
         paper.paper_id || 
         paper.paperId || 
         'unknown';
};

/**
 * Search papers across all data sources
 * @param {Object} integratedData - Integrated data object with papers array
 * @param {string} searchTerm - Search term (DOI, title, author, field)
 * @returns {Array} - Array of matching papers
 */
export const searchPapers = (integratedData, searchTerm) => {
  if (!integratedData || !integratedData.papers || !searchTerm) {
    return [];
  }

  const term = searchTerm.toLowerCase().trim();
  
  return integratedData.papers.filter(paper => {
    // Search in DOI
    const doi = normalizeDOI(paper.doi);
    if (doi && doi.includes(term)) return true;

    // Search in title (from ground truth or system output)
    const title = (
      paper.groundTruth?.title || 
      paper.systemOutput?.metadata?.title || 
      ''
    ).toLowerCase();
    if (title.includes(term)) return true;

    // Search in authors (from ground truth)
    if (paper.groundTruth) {
      const authors = Object.keys(paper.groundTruth)
        .filter(key => key.startsWith('author') && paper.groundTruth[key])
        .map(key => paper.groundTruth[key].toLowerCase());
      
      if (authors.some(author => author.includes(term))) return true;
    }

    // Search in authors (from system output)
    if (paper.systemOutput?.metadata?.authors) {
      const systemAuthors = paper.systemOutput.metadata.authors
        .map(author => author.toLowerCase());
      
      if (systemAuthors.some(author => author.includes(term))) return true;
    }

    // Search in research field
    const fieldName = (
      paper.groundTruth?.research_field_name || 
      paper.systemOutput?.researchFields?.selectedField?.label ||
      paper.systemOutput?.researchFields?.selectedField?.name ||
      ''
    ).toLowerCase();
    if (fieldName.includes(term)) return true;

    // Search in research problem
    const problemName = (
      paper.groundTruth?.research_problem_name ||
      paper.systemOutput?.researchProblems?.selectedProblem?.label ||
      paper.systemOutput?.researchProblems?.selectedProblem?.title ||
      ''
    ).toLowerCase();
    if (problemName.includes(term)) return true;

    // Search in venue
    const venue = (
      paper.groundTruth?.venue ||
      paper.systemOutput?.metadata?.venue ||
      ''
    ).toLowerCase();
    if (venue.includes(term)) return true;

    return false;
  });
};

/**
 * Get a paper by its DOI
 * @param {Object} integratedData - Integrated data object with papers array
 * @param {string} doi - DOI to search for
 * @returns {Object|null} - Paper object or null if not found
 */
export const getPaperByDOI = (integratedData, doi) => {
  if (!integratedData || !integratedData.papers || !doi) {
    return null;
  }

  const normalizedDoi = normalizeDOI(doi);
  
  return integratedData.papers.find(paper => {
    return normalizeDOI(paper.doi) === normalizedDoi;
  }) || null;
};

/**
 * Get a paper by its paper ID
 * @param {Object} integratedData - Integrated data object with papers array
 * @param {string} paperId - Paper ID to search for
 * @returns {Object|null} - Paper object or null if not found
 */
export const getPaperByID = (integratedData, paperId) => {
  if (!integratedData || !integratedData.papers || !paperId) {
    return null;
  }

  return integratedData.papers.find(paper => {
    return paper.paper_id === paperId || 
           paper.paperId === paperId ||
           paper.groundTruth?.paper_id === paperId ||
           paper.systemOutput?.paperId === paperId;
  }) || null;
};

/**
 * Advanced search with multiple filters
 * @param {Object} integratedData - Integrated data object with papers array
 * @param {Object} filters - Filter options
 * @param {string} filters.searchTerm - General search term
 * @param {string} filters.researchField - Filter by research field
 * @param {string} filters.venue - Filter by venue
 * @param {number} filters.yearFrom - Filter by publication year (from)
 * @param {number} filters.yearTo - Filter by publication year (to)
 * @param {boolean} filters.hasGroundTruth - Filter papers with ground truth
 * @param {boolean} filters.hasSystemOutput - Filter papers with system output
 * @param {boolean} filters.hasEvaluations - Filter papers with user evaluations
 * @param {number} filters.minAccuracy - Filter by minimum accuracy (0-1)
 * @param {number} filters.maxAccuracy - Filter by maximum accuracy (0-1)
 * @returns {Array} - Array of matching papers
 */
export const advancedSearchPapers = (integratedData, filters = {}) => {
  if (!integratedData || !integratedData.papers) {
    return [];
  }

  let results = [...integratedData.papers];

  // Apply search term filter
  if (filters.searchTerm) {
    results = searchPapers({ papers: results }, filters.searchTerm);
  }

  // Apply research field filter
  if (filters.researchField) {
    const fieldTerm = filters.researchField.toLowerCase();
    results = results.filter(paper => {
      const fieldName = (
        paper.groundTruth?.research_field_name || 
        paper.systemOutput?.researchFields?.selectedField?.label ||
        paper.systemOutput?.researchFields?.selectedField?.name ||
        ''
      ).toLowerCase();
      return fieldName.includes(fieldTerm);
    });
  }

  // Apply venue filter
  if (filters.venue) {
    const venueTerm = filters.venue.toLowerCase();
    results = results.filter(paper => {
      const venue = (
        paper.groundTruth?.venue ||
        paper.systemOutput?.metadata?.venue ||
        ''
      ).toLowerCase();
      return venue.includes(venueTerm);
    });
  }

  // Apply year range filter
  if (filters.yearFrom || filters.yearTo) {
    results = results.filter(paper => {
      const year = parseInt(
        paper.groundTruth?.publication_year ||
        paper.systemOutput?.metadata?.publicationDate?.split('-')[0] ||
        '0'
      );
      
      if (filters.yearFrom && year < filters.yearFrom) return false;
      if (filters.yearTo && year > filters.yearTo) return false;
      return true;
    });
  }

  // Apply data availability filters
  if (filters.hasGroundTruth !== undefined) {
    results = results.filter(paper => 
      filters.hasGroundTruth ? !!paper.groundTruth : !paper.groundTruth
    );
  }

  if (filters.hasSystemOutput !== undefined) {
    results = results.filter(paper => 
      filters.hasSystemOutput ? !!paper.systemOutput : !paper.systemOutput
    );
  }

  if (filters.hasEvaluations !== undefined) {
    results = results.filter(paper => {
      const hasEvals = paper.userEvaluations && paper.userEvaluations.length > 0;
      return filters.hasEvaluations ? hasEvals : !hasEvals;
    });
  }

  // Apply accuracy filter
  if (filters.minAccuracy !== undefined || filters.maxAccuracy !== undefined) {
    results = results.filter(paper => {
      const accuracy = paper.comparison?.overall?.accuracy || 0;
      
      if (filters.minAccuracy !== undefined && accuracy < filters.minAccuracy) return false;
      if (filters.maxAccuracy !== undefined && accuracy > filters.maxAccuracy) return false;
      return true;
    });
  }

  return results;
};