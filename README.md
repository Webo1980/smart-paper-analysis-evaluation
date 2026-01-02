# Smart Paper Analysis Evaluation Dashboard

Interactive evaluation dashboard for the SARAG (Section-Aware Retrieval-Augmented Generation) system with three-way data integration, expertise-weighted scoring, and comprehensive metrics visualization.

[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-purple.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Live Demo

**Dashboard**: [https://sarag-evaluation.netlify.app/dashboard?view=full](https://sarag-evaluation.netlify.app/dashboard?view=full)

## Overview

This dashboard provides comprehensive analysis tools for evaluating the SARAG paper analysis system. It implements a three-way evaluation framework that integrates:

1. **ORKG Ground Truth**: Reference data from the Open Research Knowledge Graph
2. **System Output**: Automated extraction results from Smart Paper Analysis
3. **Human Assessment**: Expertise-weighted evaluations from domain experts

## Features

| Tab | Description |
|-----|-------------|
| **Overview** | Summary metrics, accuracy vs quality scores, evaluation statistics |
| **Confusion** | Confusion matrix analysis for each pipeline component |
| **Expertise** | Expertise-weighted scoring analysis by evaluator tier |
| **Charts** | Interactive visualizations (radar charts, correlation matrix, sentiment) |
| **Paper Analysis** | Detailed per-paper evaluation breakdown |
| **Accuracy** | Component-level accuracy metrics and comparisons |
| **Agreement** | Inter-rater reliability analysis (Fleiss' Kappa) |
| **Quality** | Quality scoring across all components |
| **Errors** | Error analysis and failure case identification |
| **Feedback** | Qualitative feedback and sentiment analysis |
| **GT Analytics** | Ground truth data analysis |
| **GT Data** | Raw ground truth data viewer |

## Running Modes

The dashboard supports two modes:

| Mode | Purpose | GitHub Token | Saves Data |
|------|---------|--------------|------------|
| **Demo** | View results, Netlify deployment | Not required | No |
| **Full** | Reproduce paper, run evaluations | Required | Yes |

### Demo Mode (Default)

For viewing evaluation results without any configuration:

```bash
npm install
npm run dev
```

Open: http://localhost:5173/dashboard?view=full

Features:
- View all evaluation metrics and visualizations
- No GitHub token required
- Data is bundled with the application
- Ideal for Netlify deployment

### Full Mode

For reproducing the paper and running new evaluations:

1. Create `.env` file:
```env
VITE_APP_MODE=full
VITE_GITHUB_TOKEN=your_github_token
VITE_GITHUB_OWNER=Webo1980
VITE_GITHUB_REPO=smart-paper-analysis-evaluation
```

2. Run:
```bash
npm run dev
```

Features:
- All demo mode features
- Submit new evaluations
- Save data to GitHub repository
- Requires GitHub token with `repo` scope

## Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Webo1980/smart-paper-analysis-evaluation.git
   cd smart-paper-analysis-evaluation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Access the dashboard**
   - Evaluation form: http://localhost:5173/
   - Full dashboard: http://localhost:5173/dashboard?view=full

## Full Mode Setup (For Paper Reproduction)

To reproduce the paper's evaluation workflow and submit new evaluations:

### Step 1: Create GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name: "SARAG Evaluation"
4. Select scopes: `repo` (full control)
5. Click **Generate token**
6. Copy and save the token

### Step 2: Configure Environment

Create `.env` file in project root:

```env
VITE_APP_MODE=full
VITE_GITHUB_TOKEN=ghp_your_token_here
VITE_GITHUB_OWNER=Webo1980
VITE_GITHUB_REPO=smart-paper-analysis-evaluation
```

### Step 3: Set Up GitHub Actions (Optional)

For automatic data updates, create `.github/workflows/update-evaluation.yml`:

```yaml
name: Update Evaluation Data
on:
  repository_dispatch:
    types: [update-evaluation]

permissions:
  contents: write

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git config pull.rebase true

      - name: Ensure latest changes
        run: |
          git fetch origin main
          git reset --hard origin/main
          git pull --rebase

      - name: Update evaluation data
        env:
          EVALUATION_DATA: ${{ toJson(github.event.client_payload.data) }}
          TOKEN: ${{ github.event.client_payload.token }}
        run: |
          mkdir -p src/data/evaluations
          echo "$EVALUATION_DATA" | python3 -m json.tool > "src/data/evaluations/${TOKEN}.json"

      - name: Commit changes
        run: |
          git add src/data/evaluations/
          git commit -m "Update evaluation data: ${{ github.event.client_payload.token }}" || echo "No changes to commit"

      - name: Push changes with retry
        run: |
          max_attempts=3
          attempt=0
          while [ $attempt -lt $max_attempts ]; do
            git push origin main && break
            attempt=$((attempt+1))
            git fetch origin main
            git pull --rebase origin main
            sleep 2
          done
          
          if [ $attempt -eq $max_attempts ]; then
            echo "Failed to push after $max_attempts attempts"
            exit 1
          fi
```

## Evaluation Metrics

### Scoring Formula

```
Final Score = (Automated Score × 60%) + (User Rating × 40%)
```

### Expertise Weighting

| Tier | Weight Range | Example Roles |
|------|--------------|---------------|
| Expert | 4.0 - 5.0 | Professor, PostDoc, Senior Researcher |
| Senior | 3.0 - 4.0 | Researcher, PhD Student (advanced) |
| Intermediate | 2.0 - 3.0 | PhD Student, Master Student |
| Junior | 0 - 2.0 | Research Assistant, Bachelor Student |

### Components Evaluated

| Component | Accuracy Metrics | Quality Metrics |
|-----------|------------------|-----------------|
| Metadata | Match against CrossRef/DOI | Completeness, formatting |
| Research Field | Position in top-5 predictions | Relevance to paper content |
| Research Problem | ORKG match or LLM similarity | Clarity, specificity |
| Template | Property coverage | Semantic appropriateness |
| Content | Property value matching | Data type conformance |

## Deployment

### Netlify (Demo Mode)

The easiest way to deploy:

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. No environment variables needed (uses demo mode)

### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Create `public/_redirects`:

```
/*    /index.html   200
```

### Self-Hosted (Full Mode)

1. Clone the repository
2. Create `.env` with full mode configuration
3. Build: `npm run build`
4. Deploy the `dist` folder to your server

## Usage

### For Viewing Results (Demo Mode)

1. Navigate to http://localhost:5173/dashboard?view=full
2. Explore evaluation metrics across all tabs
3. Analyze system performance, accuracy, and quality metrics

### For Running Evaluations (Full Mode)

1. Configure full mode (see [Full Mode Setup](#full-mode-setup-for-paper-reproduction))
2. Navigate to http://localhost:5173/
3. Enter evaluator information (name, role, expertise)
4. Select a paper to evaluate
5. Complete the five-stage evaluation
6. Submit (automatically saved to GitHub)

## API Reference

### Data Service

```javascript
import dataService from './services/dataService';

// Get all evaluations
const evaluations = await dataService.getEvaluations();

// Get ground truth
const groundTruth = await dataService.getGroundTruth();

// Get dashboard data (all at once)
const { data } = await dataService.getDashboardData();

// Check current mode
const modeInfo = dataService.getModeInfo();
// { mode: 'demo', isDemo: true, isFull: false, canSave: false }

// Save evaluation (full mode only)
const result = await dataService.saveEvaluation(evaluationData);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Page not found on refresh | Add `_redirects` file to `public/` folder |
| GitHub API CORS error | Check environment variables are set correctly |
| Data not loading | Verify JSON files exist in `src/data/` folders |
| Save not working | Ensure `VITE_APP_MODE=full` and token is valid |

## Related Projects

| Project | Description |
|---------|-------------|
| [smart-paper-analysis-backend](https://github.com/Webo1980/smart-paper-analysis-backend) | Backend API for SARAG system |
| [smart-paper-analysis-frontend](https://github.com/Webo1980/smart-paper-analysis-frontend) | Web application integrated with ORKG |
| [ORKGEx-2.0](https://github.com/Webo1980/ORKGEx-2.0) | Chrome extension for paper annotation |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Open Research Knowledge Graph (ORKG)](https://orkg.org/)
- [TIB Leibniz Information Centre for Science and Technology](https://www.tib.eu/)