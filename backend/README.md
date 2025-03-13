# todo:
 1. word replacement  UI & it's back end
 2. extened the attetion page when it have more word.
 3. backend maybe not correct for attention heatmap and flow


# PyTorch Backend

This backend provides a FastAPI service for tokenization, attention visualization, and masked word prediction using PyTorch implementations of BERT and RoBERTa models.

## Requirements

- Python 3.8+
- PyTorch
- Transformers
- FastAPI
- Uvicorn

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
python app.py
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
    {"text": "[CLS]", "index": 0},
    {"text": "the", "index": 1},
    {"text": "cat", "index": 2},
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
    {"word": "the", "score": 0.9},
    {"word": "a", "score": 0.05},
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
  "model_name": "bert-base-uncased"
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

## Available Models

- `bert-base-uncased`: BERT Base Uncased model
- `roberta-base`: RoBERTa Base model

## RoBERTa Token Handling

RoBERTa tokens are automatically cleaned to remove the leading 'Ġ' character (which represents spaces in the original RoBERTa tokenizer) for better visualization in the frontend.

## Integration with Frontend

The backend communicates with the frontend through these API endpoints. The `/attention` endpoint is particularly important for the attention visualization features, including the matrix view, parallel view, and attention distribution bar charts.

## Debugging

For debugging purposes, the backend includes extensive logging for token processing and attention matrix extraction. Check the server logs if you encounter issues with token handling or attention visualization.

## Performance Considerations

- Models are loaded dynamically upon first request and cached for subsequent requests
- The server supports both CPU and CUDA (GPU) execution if available
- For large texts, attention matrices can become quite large, so consider limiting input length for better performance 
