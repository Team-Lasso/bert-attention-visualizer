# BERT Attention Visualizer

A visual tool for exploring attention patterns in transformer-based language models like BERT and RoBERTa. The application allows you to:

- Visualize attention patterns across different layers and attention heads
- Mask tokens and see the model's predictions
- Compare attention patterns across different models

## Project Structure

This project is composed of two main parts:

- `frontend/`: React-based UI for visualizing attention patterns
- `backend/`: FastAPI service that handles model inference using PyTorch and Hugging Face Transformers

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm for the frontend
- Python 3.8+ for the backend
- Git (for cloning the repository)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - MacOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the backend server:
   ```bash
   python start_server.py
   ```

   The backend will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`.

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
