// src/config/appConfig.js
// Configuration for switching between Demo and Full modes

export const APP_MODE = import.meta.env.VITE_APP_MODE || 'demo';

export const config = {
  mode: APP_MODE,
  isDemo: APP_MODE === 'demo',
  isFull: APP_MODE === 'full',
  
  github: {
    token: import.meta.env.VITE_GITHUB_TOKEN || '',
    owner: import.meta.env.VITE_GITHUB_OWNER || 'Webo1980',
    repo: import.meta.env.VITE_GITHUB_REPO || 'smart-paper-analysis-evaluation',
    branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
    
    // Raw GitHub URL for fetching files without API (no token needed)
    get rawBaseUrl() {
      return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}`;
    },
    
    // GitHub API URL
    get apiBaseUrl() {
      return `https://api.github.com/repos/${this.owner}/${this.repo}`;
    }
  },
  
  // Data paths
  paths: {
    evaluations: 'src/data/evaluations',
    userEvaluations: 'src/data/userEvaluations/evaluations',
    groundTruth: 'src/data/groundTruth'
  }
};

// Helper functions
export const isFullMode = () => config.isFull;
export const isDemoMode = () => config.isDemo;

// Log current mode in development
if (import.meta.env.DEV) {
  console.log(`📊 Dashboard running in ${APP_MODE.toUpperCase()} mode`);
}

export default config;