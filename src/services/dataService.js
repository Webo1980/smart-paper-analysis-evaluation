// src/services/dataService.js
// Unified data service that switches between Demo and Full modes
// Demo mode: Uses static bundled data or raw GitHub URLs
// Full mode: Uses GitHub API with authentication for read/write

import config from '../config/appConfig';

// ============================================
// STATIC DATA IMPORTS (Demo Mode)
// ============================================
// These imports bundle the data at build time for demo mode
// Add your evaluation files here

// Import all evaluation files statically for demo mode
// Update these imports based on your actual file structure
const staticEvaluations = import.meta.glob('../data/evaluations/*.json', { eager: true });
const staticUserEvaluations = import.meta.glob('../data/userEvaluations/evaluations/*.json', { eager: true });
const staticGroundTruth = import.meta.glob('../data/groundTruth/*.json', { eager: true });

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Process glob imports into array of data
 */
function processGlobImports(globResult) {
  return Object.entries(globResult).map(([path, module]) => {
    const fileName = path.split('/').pop().replace('.json', '');
    return {
      fileName,
      path,
      data: module.default || module
    };
  });
}

/**
 * Fetch JSON from raw GitHub URL (no token needed for public repos)
 */
async function fetchRawGitHub(path) {
  const url = `${config.github.rawBaseUrl}/${path}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from raw GitHub: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch from GitHub API (supports authentication)
 */
async function fetchGitHubAPI(endpoint, options = {}) {
  const url = `${config.github.apiBaseUrl}${endpoint}`;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    ...options.headers
  };
  
  // Add auth header if token is available
  if (config.github.token) {
    headers['Authorization'] = `Bearer ${config.github.token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`GitHub API error: ${error.message}`);
    throw error;
  }
}

/**
 * List files in a GitHub directory
 */
async function listGitHubDirectory(path) {
  const data = await fetchGitHubAPI(`/contents/${path}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Get file content from GitHub API
 */
async function getGitHubFileContent(path) {
  const data = await fetchGitHubAPI(`/contents/${path}`);
  
  if (data.content) {
    // Decode base64 content
    const content = atob(data.content);
    return JSON.parse(content);
  }
  
  throw new Error(`No content found for ${path}`);
}

// ============================================
// EVALUATION DATA FUNCTIONS
// ============================================

/**
 * Get all evaluations
 */
export async function getEvaluations() {
  if (config.isDemo) {
    // Demo mode: Return bundled static data
    const evaluations = processGlobImports(staticEvaluations);
    return evaluations.map(e => e.data);
  } else {
    // Full mode: Fetch from GitHub
    try {
      const files = await listGitHubDirectory(config.paths.evaluations);
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      
      const evaluations = await Promise.all(
        jsonFiles.map(async (file) => {
          return await fetchRawGitHub(`${config.paths.evaluations}/${file.name}`);
        })
      );
      
      return evaluations;
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      // Fallback to static data if GitHub fails
      const evaluations = processGlobImports(staticEvaluations);
      return evaluations.map(e => e.data);
    }
  }
}

/**
 * Get all user evaluations
 */
export async function getUserEvaluations() {
  if (config.isDemo) {
    // Demo mode: Return bundled static data
    const evaluations = processGlobImports(staticUserEvaluations);
    return evaluations.map(e => e.data);
  } else {
    // Full mode: Fetch from GitHub
    try {
      const files = await listGitHubDirectory(config.paths.userEvaluations);
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      
      const evaluations = await Promise.all(
        jsonFiles.map(async (file) => {
          return await fetchRawGitHub(`${config.paths.userEvaluations}/${file.name}`);
        })
      );
      
      return evaluations;
    } catch (error) {
      console.error('Error fetching user evaluations:', error);
      // Fallback to static data
      const evaluations = processGlobImports(staticUserEvaluations);
      return evaluations.map(e => e.data);
    }
  }
}

/**
 * Get single evaluation by ID
 */
export async function getEvaluationById(id) {
  const evaluations = await getEvaluations();
  return evaluations.find(e => e.id === id || e.paperId === id);
}

// ============================================
// GROUND TRUTH DATA FUNCTIONS
// ============================================

/**
 * Get all ground truth data
 */
export async function getGroundTruth() {
  if (config.isDemo) {
    // Demo mode: Return bundled static data
    const groundTruth = processGlobImports(staticGroundTruth);
    return groundTruth.map(e => e.data);
  } else {
    // Full mode: Fetch from GitHub
    try {
      const files = await listGitHubDirectory(config.paths.groundTruth);
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      
      const groundTruth = await Promise.all(
        jsonFiles.map(async (file) => {
          return await fetchRawGitHub(`${config.paths.groundTruth}/${file.name}`);
        })
      );
      
      return groundTruth;
    } catch (error) {
      console.error('Error fetching ground truth:', error);
      // Fallback to static data
      const groundTruth = processGlobImports(staticGroundTruth);
      return groundTruth.map(e => e.data);
    }
  }
}

/**
 * Get ground truth for specific paper
 */
export async function getGroundTruthByPaperId(paperId) {
  const groundTruth = await getGroundTruth();
  return groundTruth.find(gt => gt.paperId === paperId || gt.id === paperId);
}

// ============================================
// SAVE FUNCTIONS (Full Mode Only)
// ============================================

/**
 * Save evaluation to GitHub
 */
export async function saveEvaluation(evaluationData) {
  if (config.isDemo) {
    console.warn('⚠️ Save disabled in demo mode');
    return {
      success: false,
      message: 'Saving is disabled in demo mode. Switch to full mode to save evaluations.',
      mode: 'demo'
    };
  }
  
  if (!config.github.token) {
    console.error('❌ GitHub token required for saving');
    return {
      success: false,
      message: 'GitHub token required. Please configure VITE_GITHUB_TOKEN.',
      mode: 'full'
    };
  }
  
  try {
    const fileName = `${evaluationData.id || Date.now()}.json`;
    const path = `${config.paths.userEvaluations}/${fileName}`;
    const content = btoa(JSON.stringify(evaluationData, null, 2));
    
    // Check if file exists (for update)
    let sha;
    try {
      const existing = await fetchGitHubAPI(`/contents/${path}`);
      sha = existing.sha;
    } catch (e) {
      // File doesn't exist, that's okay for new files
    }
    
    // Create or update file
    const response = await fetchGitHubAPI(`/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update evaluation: ${fileName}`,
        content,
        sha,
        branch: config.github.branch
      })
    });
    
    return {
      success: true,
      message: 'Evaluation saved successfully',
      data: response
    };
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return {
      success: false,
      message: error.message,
      mode: 'full'
    };
  }
}

/**
 * Delete evaluation from GitHub
 */
export async function deleteEvaluation(evaluationId) {
  if (config.isDemo) {
    console.warn('⚠️ Delete disabled in demo mode');
    return {
      success: false,
      message: 'Deleting is disabled in demo mode.',
      mode: 'demo'
    };
  }
  
  if (!config.github.token) {
    return {
      success: false,
      message: 'GitHub token required for deletion.',
      mode: 'full'
    };
  }
  
  try {
    const path = `${config.paths.userEvaluations}/${evaluationId}.json`;
    
    // Get file SHA
    const existing = await fetchGitHubAPI(`/contents/${path}`);
    
    // Delete file
    await fetchGitHubAPI(`/contents/${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Delete evaluation: ${evaluationId}`,
        sha: existing.sha,
        branch: config.github.branch
      })
    });
    
    return {
      success: true,
      message: 'Evaluation deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// ============================================
// AGGREGATED DATA FUNCTIONS
// ============================================

/**
 * Get all data needed for dashboard
 */
export async function getDashboardData() {
  try {
    const [evaluations, userEvaluations, groundTruth] = await Promise.all([
      getEvaluations(),
      getUserEvaluations(),
      getGroundTruth()
    ]);
    
    return {
      success: true,
      data: {
        evaluations,
        userEvaluations,
        groundTruth
      },
      mode: config.mode,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return {
      success: false,
      error: error.message,
      mode: config.mode
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if save functionality is available
 */
export function canSave() {
  return config.isFull && !!config.github.token;
}

/**
 * Get current mode info
 */
export function getModeInfo() {
  return {
    mode: config.mode,
    isDemo: config.isDemo,
    isFull: config.isFull,
    canSave: canSave(),
    github: {
      owner: config.github.owner,
      repo: config.github.repo,
      hasToken: !!config.github.token
    }
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Data fetching
  getEvaluations,
  getUserEvaluations,
  getEvaluationById,
  getGroundTruth,
  getGroundTruthByPaperId,
  getDashboardData,
  
  // Data modification (full mode only)
  saveEvaluation,
  deleteEvaluation,
  
  // Utilities
  canSave,
  getModeInfo,
  
  // Config access
  config
};