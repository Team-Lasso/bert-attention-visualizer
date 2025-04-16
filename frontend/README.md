# BERT Attention Visualizer Frontend

A visual interface for exploring attention patterns in transformer-based language models like BERT, RoBERTa, DistilBERT, and TinyBERT.

## Features

- Visualize attention patterns across different layers and attention heads
- Multiple visualization methods: Raw attention, Attention Rollout, and Attention Flow
- Mask tokens and see the model's predictions
- Compare attention patterns across different models
- Interactive exploration of token relationships
- Side-by-side comparison of attention before and after word replacement

## Supported Models

- BERT Base Uncased (12 layers, 768 hidden dimensions)
- RoBERTa Base (12 layers, 768 hidden dimensions)
- DistilBERT Base Uncased (6 layers, 768 hidden dimensions)
- TinyBERT 6 Layer (6 layers, knowledge distilled from BERT)

## Attention Visualization Methods

The application provides three different methods for visualizing attention:

1. **Raw Attention** - Shows the direct attention weights from the model's attention heads. This provides insight into how each attention head specifically focuses on different tokens.

2. **Attention Rollout** - Recursively combines attention weights across all layers through matrix multiplication. This accounts for how attention propagates through the network and incorporates residual connections, providing a more holistic view of token relationships.

3. **Attention Flow** - Treats the multi-layer attention weights as a graph network and uses maximum flow algorithms to measure information flow between tokens. This reveals important connections that might not be apparent in raw attention weights.

## Backend Integration

This frontend is designed to work with the FastAPI backend. The integration enables:

1. **Real-time model selection** - The frontend fetches available models from the backend
2. **Token masking and prediction** - Uses the backend to generate masked word predictions
3. **Attention visualization** - Fetches real attention matrices from the model for visualization
4. **Visualization method switching** - Processes attention using different algorithms on demand

## Setup Instructions

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on http://localhost:5173 and automatically proxy API requests to the backend at http://localhost:8000.

## Testing the Backend Integration

1. **Make sure the backend is running** at http://localhost:8000
2. Access the frontend at http://localhost:5173
3. Try the following tests to verify integration:

   - **Model Selection**: Click on the model selector to see if available models are fetched from the backend
   - **Tokenization**: Enter a sentence and submit to see if it's properly tokenized by the backend
   - **Masked Word Prediction**: Click on a token to mask it and verify predictions are retrieved from the backend
   - **Attention Visualization**: Verify that attention patterns are displayed after entering a sentence
   - **Visualization Methods**: Try switching between Raw, Rollout and Flow visualization methods
   - **Comparison View**: Test the word replacement feature to see attention patterns before and after

## Troubleshooting

If you experience issues with the backend integration:

1. Check the browser console for error messages
2. Verify that the backend server is running at http://localhost:8000
3. Test backend endpoints directly using a tool like curl or Postman

## Development Notes

- The `services/modelService.ts` file contains all the API communication with the backend
- Fallback mechanisms are implemented in case the backend is not available
- The Vite dev server is configured to proxy API requests to the backend 