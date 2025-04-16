---
title: BERT Attention Visualizer API
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
sdk_version: "3.9"
app_file: app_hf.py
app_port: 7860
pinned: false
license: mit
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

# BERT Attention Visualizer API

This is the backend API for the BERT Attention Visualizer, a tool that allows you to visualize attention patterns in BERT, RoBERTa, DistilBERT, and TinyBERT models.

## API Endpoints

- `GET /models` - Get available models
- `POST /tokenize` - Tokenize text
- `POST /predict_masked` - Predict masked tokens
- `POST /attention` - Get attention matrices
- `POST /attention_comparison` - Compare attention before and after word replacement

## Frontend

The frontend for this application is deployed on Vercel. Visit the live demo at: [BERT Attention Visualizer](https://your-vercel-app-url.vercel.app)

## Local Development

To run this API locally:

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

## About

This API powers the BERT Attention Visualizer, which helps researchers and practitioners understand how transformer models like BERT attend to different tokens and how attention patterns change with different inputs.

# todo:

1.  ~~word replacement UI & it's back end~~ ✓ (Implemented via `/attention_comparison` endpoint)
2.  extened the attetion page when it have more word.
3.  backend maybe not correct for attention heatmap and flow

# PyTorch Backend

This backend provides a FastAPI service for tokenization, attention visualization, and masked word prediction using PyTorch implementations of BERT and RoBERTa models.

## Requirements

- Python 3.8+
- PyTorch 2.0.0+
- Transformers 4.27.4+
- FastAPI 0.95.0+
- Uvicorn 0.21.1+
- Pydantic 2.0.0+
- NLTK 3.8.1+
- NumPy 1.24.0+
- python-multipart 0.0.6+

## Installation

1. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the server with:

```bash
python main.py
```

This will launch the server at `http://localhost:8000`.

## API Endpoints

### GET /models

Returns a list of available models.

### POST /tokenize

Tokenizes input text using the specified model.

Request body:

```json
{
  "text": "The cat sat on the mat",
  "model_name": "bert-base-uncased"
}
```

Response:

```json
{
  "tokens": [
    { "text": "[CLS]", "index": 0 },
    { "text": "the", "index": 1 },
    { "text": "cat", "index": 2 }
    // ...other tokens
  ]
}
```

### POST /predict_masked

Predicts masked tokens using the specified model.

Request body:

```json
{
  "text": "The cat sat on the mat",
  "mask_index": 1,
  "model_name": "bert-base-uncased",
  "top_k": 10
}
```

Response:

```json
{
  "predictions": [
    { "word": "the", "score": 0.9 },
    { "word": "a", "score": 0.05 }
    // ...other predictions
  ]
}
```

### POST /attention

Retrieves attention matrices for visualizing attention patterns between tokens.

Request body:

```json
{
  "text": "The cat sat on the mat",
  "model_name": "bert-base-uncased",
  "visualization_method": "raw"
}
```

Response:

```json
{
  "attention_data": {
    "tokens": [
      {"text": "[CLS]", "index": 0},
      {"text": "the", "index": 1},
      // ...other tokens
    ],
    "layers": [
      {
        "layerIndex": 0,
        "heads": [
          {
            "headIndex": 0,
            "attention": [
              [0.1, 0.2, 0.3, ...],  // Attention weights from token 0 to all tokens
              [0.2, 0.5, 0.1, ...],  // Attention weights from token 1 to all tokens
              // ...attention weights for other tokens
            ]
          },
          // ...other attention heads
        ]
      },
      // ...other layers
    ]
  }
}
```

### POST /attention_comparison

Compares attention patterns before and after replacing a word in the input text. This is useful for analyzing how word replacements affect the model's attention distribution.

Request body:

```json
{
  "text": "The cat sat on the mat",
  "masked_index": 2,
  "replacement_word": "dog",
  "model_name": "bert-base-uncased",
  "visualization_method": "raw"
}
```

Response:

```json
{
  "before_attention": {
    // Original attention data structure (same format as /attention endpoint)
  },
  "after_attention": {
    // Attention data after replacement (same format as /attention endpoint)
  }
}
```

## Available Models

- `bert-base-uncased`: BERT Base Uncased model (12 layers, 768 hidden dimensions)
- `roberta-base`: RoBERTa Base model (12 layers, 768 hidden dimensions)
- `distilbert-base-uncased`: DistilBERT Base Uncased model (6 layers, 768 hidden dimensions)
- `EdwinXhen/TinyBert_6Layer_MLM`: TinyBERT 6 Layer model (6 layers, knowledge distilled from BERT)

## Attention Visualization Methods

The API supports three attention visualization methods, which can be specified using the `visualization_method` parameter in the `/attention` and `/attention_comparison` endpoints:

- `raw`: Shows the raw attention weights from each attention head. This is the direct output from the model's attention mechanism.

- `rollout`: Implements Attention Rollout, which recursively combines attention weights across all layers through matrix multiplication. This accounts for how attention propagates through the network and incorporates the effect of residual connections, providing a more holistic view of token relationships.

- `flow`: Implements Attention Flow, which treats the multi-layer attention weights as a graph network and uses maximum flow algorithms to measure information flow between tokens. This method accounts for all possible paths through the network, revealing important connections that might not be apparent in raw attention weights.

## RoBERTa Token Handling

RoBERTa tokens are automatically cleaned to remove the leading 'Ġ' character (which represents spaces in the original RoBERTa tokenizer) for better visualization in the frontend.

## Integration with Frontend

The backend communicates with the frontend through these API endpoints. The `/attention` endpoint is particularly important for the attention visualization features, including the matrix view, parallel view, and attention distribution bar charts.

The `/attention_comparison` endpoint enables a comparative analysis feature in the frontend, allowing users to see how attention patterns change when a word is replaced. This can be used to:

- Analyze semantic shifts in the model's understanding
- Compare attention flows before and after word replacements
- Visualize how different word choices affect contextual relationships

## Debugging

For debugging purposes, the backend includes extensive logging for token processing and attention matrix extraction. Check the server logs if you encounter issues with token handling or attention visualization.

## Performance Considerations

- Models are loaded dynamically upon first request and cached for subsequent requests
- The server supports both CPU and CUDA (GPU) execution if available
- For large texts, attention matrices can become quite large, so consider limiting input length for better performance
