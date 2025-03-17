# BERT Attention Visualizer

A tool for visualizing attention patterns in BERT and RoBERTa models.

## Project Structure

- `frontend/`: React application with Vite for the UI
- `backend/`: FastAPI Python service for model processing

## CI/CD with GitHub Actions

This project uses GitHub Actions for automated deployment:
- Frontend is deployed to Vercel
- Backend is deployed to Hugging Face Spaces

### Setup Instructions

#### 1. Fork this repository

#### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

For frontend deployment:
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `HUGGINGFACE_SPACE_URL`: The URL of your Hugging Face Space (e.g., https://your-username-bert-visualizer.hf.space)

For backend deployment:
- `HUGGINGFACE_TOKEN`: Your Hugging Face API token
- `HUGGINGFACE_SPACE_ID`: Your Hugging Face Space ID (e.g., username/space-name)

#### 3. Setup Vercel Project

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the frontend directory: `cd frontend`
3. Link to Vercel: `vercel link`
4. Get your Vercel project ID and org ID from the generated `.vercel/project.json` file

#### 4. Setup Hugging Face Space

1. Create a new Space on Hugging Face: https://huggingface.co/spaces/new
2. Choose "Docker" Space type
3. Note your Space ID (username/space-name)
4. Get your Hugging Face token from: https://huggingface.co/settings/tokens

#### 5. Trigger Deployments

The deployments will be triggered automatically when you push changes to the main branch:
- Changes in the `frontend/` directory will trigger the frontend workflow
- Changes in the `backend/` directory will trigger the backend workflow

You can also trigger deployments manually from the "Actions" tab in GitHub.

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

## Connecting Backend and Frontend

- In development: The frontend connects to the backend using a proxy configured in `vite.config.ts`
- In production: The frontend connects to the backend using the URL specified in the `VITE_API_URL` environment variable, which is set during the GitHub Actions workflow

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Select a model from the available options
3. Enter a sentence to analyze
4. Explore attention patterns across different layers and heads
5. Try masking a token by clicking on it to see the model's predictions

## Supported Models

Currently, the following models are supported:

- BERT Base Uncased
- RoBERTa Base

Additional models can be added by modifying the `MODEL_CONFIGS` in the backend's `app.py`.
