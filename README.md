# Smart Paper Analysis Evaluation Dashboard

Interactive evaluation dashboard for the SARAG (Section-Aware Retrieval-Augmented Generation) system with three-way data integration, expertise-weighted scoring, and comprehensive metrics visualization.

[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-purple.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- GitHub account (for data persistence)

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

3. **Configure environment variables**
   
   Create a `.env` file:
   ```env
   VITE_GITHUB_TOKEN=your_github_personal_access_token
   VITE_GITHUB_OWNER=your_github_username
   VITE_GITHUB_REPO=smart-paper-analysis-evaluation
   ```

4. **Set up GitHub Actions** (see [GitHub Integration](#github-integration) section)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the dashboard**
   - Evaluation form: http://localhost:5173/
   - Full dashboard: http://localhost:5173/dashboard?view=full

## GitHub Integration

The dashboard uses GitHub for persistent storage of evaluation data. Follow these steps to set it up:

### Step 1: Create a Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a name (e.g., "SARAG Evaluation")
4. Select scopes:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Action workflows)
5. Click **Generate token**
6. Copy the token and save it securely

### Step 2: Create GitHub Action Workflow

Create the file `.github/workflows/update-evaluation.yml` in your repository:

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

### Step 3: Configure Environment Variables

Add your GitHub token to the `.env` file:

```env
VITE_GITHUB_TOKEN=ghp_your_token_here
VITE_GITHUB_OWNER=Webo1980
VITE_GITHUB_REPO=smart-paper-analysis-evaluation
```

## Usage

### For Evaluators

1. Navigate to http://localhost:5173/
2. Enter your evaluator information (name, role, expertise)
3. Select a paper to evaluate
4. Complete the five-stage evaluation:
   - Metadata accuracy and quality
   - Research field accuracy and quality
   - Research problem accuracy and quality
   - Template accuracy and quality
   - Content accuracy and quality
5. Provide qualitative feedback
6. Submit evaluation (automatically saved to GitHub)

### For Researchers

1. Navigate to http://localhost:5173/dashboard?view=full
2. Explore evaluation metrics across all tabs
3. Analyze:
   - Overall system performance
   - Component-level accuracy vs quality
   - Expertise-weighted scores
   - Inter-rater reliability
   - Qualitative feedback patterns

## Project Structure

```
smart-paper-analysis-evaluation/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── Overview.jsx
│   │   │   ├── ConfusionMatrix.jsx
│   │   │   ├── ExpertiseAnalysis.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── PaperAnalysis.jsx
│   │   │   ├── AccuracyView.jsx
│   │   │   ├── AgreementAnalysis.jsx
│   │   │   ├── QualityView.jsx
│   │   │   ├── ErrorAnalysis.jsx
│   │   │   ├── FeedbackAnalysis.jsx
│   │   │   └── GTAnalytics.jsx
│   │   └── Evaluation/
│   │       └── EvaluationForm.jsx
│   ├── data/
│   │   ├── evaluations/          # Evaluation JSON files
│   │   └── groundTruth/          # ORKG ground truth data
│   ├── hooks/
│   │   └── useGitHubStorage.js   # GitHub integration hook
│   ├── utils/
│   │   ├── calculations.js       # Score calculations
│   │   └── metrics.js            # Evaluation metrics
│   ├── App.jsx
│   └── main.jsx
├── .github/
│   └── workflows/
│       └── update-evaluation.yml # GitHub Action
├── .env                          # Environment variables
├── package.json
├── vite.config.js
└── README.md
```

## Evaluation Metrics

### Scoring Formula

```
Final Score = (Automated Score × 60%) + (User Rating × 40%)
```

### Expertise Weighting

| Tier | Weight Range | Roles |
|------|--------------|-------|
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

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Live Demo

An interactive evaluation dashboard is available at: [https://sarag-evaluation.netlify.app](https://sarag-evaluation.netlify.app)

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