import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from transformers import (
    AutoTokenizer, 
    AutoModelForMaskedLM, 
    BertTokenizer, 
    BertForMaskedLM,
    RobertaTokenizer,
    RobertaForMaskedLM,
    BertModel,
    RobertaModel
)

app = FastAPI(title="BERT Attention Visualizer Backend")

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model cache
models = {}
tokenizers = {}

# Available models
MODEL_CONFIGS = {
    "bert-base-uncased": {
        "name": "BERT Base Uncased",
        "model_class": BertForMaskedLM,
        "tokenizer_class": AutoTokenizer,
        "base_model_class": BertModel
    },
    "roberta-base": {
        "name": "RoBERTa Base",
        "model_class": RobertaForMaskedLM,
        "tokenizer_class": AutoTokenizer,
        "base_model_class": RobertaModel
    }
}

# Add a helper function to clean RoBERTa tokens
def clean_roberta_token(token: str) -> str:
    """
    Clean RoBERTa tokens by removing the leading 'Ġ' character which represents spaces
    """
    if token.startswith('Ġ'):
        return token[1:]
    if token.startswith('G'):
        return token[1:]
    return token

# Helper function to load models on demand
def get_model_and_tokenizer(model_name):
    if model_name not in MODEL_CONFIGS:
        raise HTTPException(status_code=400, detail=f"Model {model_name} not supported")
    
    if model_name not in models:
        print(f"Loading {model_name}...")
        config = MODEL_CONFIGS[model_name]
        models[model_name] = config["model_class"].from_pretrained(model_name)
        tokenizers[model_name] = config["tokenizer_class"].from_pretrained(model_name)
        if torch.cuda.is_available():
            models[model_name] = models[model_name].cuda()
        models[model_name].eval()
        print(f"Model {model_name} loaded")
    
    return models[model_name], tokenizers[model_name]

class TokenizeRequest(BaseModel):
    text: str
    model_name: str = "bert-base-uncased"

class Token(BaseModel):
    text: str
    index: int

class TokenizeResponse(BaseModel):
    tokens: List[Token]

class MaskPredictionRequest(BaseModel):
    text: str
    mask_index: int
    model_name: str = "bert-base-uncased"
    top_k: int = 10

class WordPrediction(BaseModel):
    word: str
    score: float

class MaskPredictionResponse(BaseModel):
    predictions: List[WordPrediction]

class AttentionRequest(BaseModel):
    text: str
    model_name: str = "bert-base-uncased"

class AttentionHead(BaseModel):
    headIndex: int
    attention: List[List[float]]

class Layer(BaseModel):
    layerIndex: int
    heads: List[AttentionHead]

class AttentionData(BaseModel):
    tokens: List[Token]
    layers: List[Layer]

class AttentionResponse(BaseModel):
    attention_data: AttentionData

@app.get("/models")
async def get_available_models():
    """Get list of available models"""
    return {
        "models": [
            {
                "id": model_id,
                "name": config["name"],
            } for model_id, config in MODEL_CONFIGS.items()
        ]
    }

@app.post("/tokenize", response_model=TokenizeResponse)
async def tokenize_text(request: TokenizeRequest):
    """Tokenize input text using the specified model's tokenizer"""
    try:
        _, tokenizer = get_model_and_tokenizer(request.model_name)
        
        # The text might include punctuation - let the tokenizer handle it properly
        if "roberta" in request.model_name:
            # For RoBERTa, we'll encode with the tokenizer and decode to get the individual tokens
            # Remove return_offsets_mapping which causes issues with Python tokenizers
            encoding = tokenizer.encode_plus(
                request.text, 
                add_special_tokens=True, 
                return_tensors="pt",
                return_attention_mask=True
            )
            
            # Get tokens from encoding
            tokens = tokenizer.convert_ids_to_tokens(encoding["input_ids"][0])
            
            # Clean the tokens to remove the leading 'Ġ' character from RoBERTa tokens
            tokens = [clean_roberta_token(token) for token in tokens]
        else:
            # For BERT, add special tokens and tokenize
            text = f"[CLS] {request.text} [SEP]"
            tokens = tokenizer.tokenize(text)
        
        # Create token objects with indices
        token_objects = [
            {"text": token, "index": idx}
            for idx, token in enumerate(tokens)
        ]
        
        return {"tokens": token_objects}
    
    except Exception as e:
        print(f"Tokenization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_masked", response_model=MaskPredictionResponse)
async def predict_masked_token(request: MaskPredictionRequest):
    """Predict masked token using the specified model"""
    try:
        model, tokenizer = get_model_and_tokenizer(request.model_name)
        
        # Get tokens from the original text using the tokenize endpoint for consistency
        tokenizer_response = await tokenize_text(TokenizeRequest(text=request.text, model_name=request.model_name))
        tokens = tokenizer_response["tokens"]
        
        # Validate mask index
        if request.mask_index < 0 or request.mask_index >= len(tokens):
            raise HTTPException(status_code=400, detail=f"Invalid mask index {request.mask_index}. Valid range: 0-{len(tokens)-1}")
        
        # Get the token to mask
        masked_token_text = tokens[request.mask_index]["text"]
        print(f"Masking token: '{masked_token_text}' at index {request.mask_index}")
        
        # For RoBERTa, it's easier to mask directly in the original text
        if "roberta" in request.model_name:
            # Reconstruct original text
            words = request.text.split()
            
            # Create a version of the text with the word at the mask_index replaced with the mask token
            # We need to map token index to word index
            token_idx_to_word_idx = {}
            word_idx = 0
            
            # Special case for first token which is usually a special token
            if request.mask_index == 0 and tokens[0]["text"] in ["<s>", "<cls>"]:
                # Skip first special token
                pass
            # Special case for last token which is usually a special token
            elif request.mask_index == len(tokens) - 1 and tokens[-1]["text"] in ["</s>", "<sep>"]:
                # Skip last special token
                pass
            else:
                # Print all tokens to debug
                print(f"All tokens: {[t['text'] for t in tokens]}")
                
                # Determine which word to mask based on the token index
                # Since RoBERTa may split words into subwords, we need to map token indices to word indices
                
                # Simple approach: mask the word that contains the token
                # First, build a mapping of cleaned tokens to the original words
                word_starts = []
                current_pos = 0
                for word in words:
                    word_starts.append(current_pos)
                    current_pos += len(word) + 1  # +1 for the space
                
                # Find which word contains the token to mask
                token_to_mask = clean_roberta_token(tokens[request.mask_index]["text"])
                word_to_mask_idx = None
                
                for i, word in enumerate(words):
                    if token_to_mask in word:
                        word_to_mask_idx = i
                        break
                
                # If we couldn't find a direct match, use a heuristic based on position
                if word_to_mask_idx is None:
                    # For simplicity, in this demo we'll just mask the index directly
                    # This is a fallback and might not be accurate for all cases
                    word_to_mask_idx = min(request.mask_index, len(words) - 1)
                
                # Replace the word with the mask token
                words[word_to_mask_idx] = tokenizer.mask_token
            
            # Join back into text
            text_with_mask = " ".join(words)
            print(f"Text with mask: '{text_with_mask}'")
        else:
            # For BERT models
            
            # Convert tokens to a list of strings
            token_texts = [token["text"] for token in tokens]
            
            # Replace the token at mask_index with the mask token
            token_texts[request.mask_index] = tokenizer.mask_token
            
            # Join the tokens
            text_with_mask = tokenizer.convert_tokens_to_string(token_texts)
            print(f"Text with mask: '{text_with_mask}'")
        
        # Get predictions
        inputs = tokenizer(text_with_mask, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # Find the mask token position in input_ids
        mask_token_index = torch.where(inputs["input_ids"][0] == tokenizer.mask_token_id)[0]
        if len(mask_token_index) == 0:
            raise HTTPException(status_code=500, detail="Mask token not found in processed input")
        
        print(f"Mask token position in input_ids: {mask_token_index}")
        
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = outputs.logits[0, mask_token_index, :].softmax(dim=-1)
        
        # Get top k predictions
        topk_values, topk_indices = torch.topk(predictions, k=request.top_k, dim=-1)
        
        # Convert predictions to response format
        predictions_list = []
        for i, (value, idx) in enumerate(zip(topk_values[0], topk_indices[0])):
            token = tokenizer.decode([idx])
            # Clean up tokens (some models have extra spaces or special chars)
            token = token.strip()
            
            # For RoBERTa, also clean any leading 'Ġ' character
            if "roberta" in request.model_name:
                token = clean_roberta_token(token)
            
            predictions_list.append({
                "word": token,
                "score": float(value)
            })
        
        print(f"Top prediction: '{predictions_list[0]['word']}' with score {predictions_list[0]['score']}")
        return {"predictions": predictions_list}
    
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/attention", response_model=AttentionResponse)
async def get_attention_matrices(request: AttentionRequest):
    """Get attention matrices for the input text using the specified model"""
    try:
        print(f"Processing attention request: text='{request.text}', model={request.model_name}")
        
        # First tokenize the text using the same function that the /tokenize endpoint uses
        # to ensure consistency
        tokenizer_response = await tokenize_text(TokenizeRequest(text=request.text, model_name=request.model_name))
        tokens = tokenizer_response["tokens"]
        print(f"Tokenized into {len(tokens)} tokens")
        
        # Load base model (not masked LM) to access attention matrices
        model_name = request.model_name
        
        if model_name not in MODEL_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Model {model_name} not supported")
            
        config = MODEL_CONFIGS[model_name]
        base_model_class = config["base_model_class"]
        
        # Check if we already have a base model cached
        base_model_key = f"{model_name}_base"
        if base_model_key not in models:
            print(f"Loading base model {model_name}...")
            models[base_model_key] = base_model_class.from_pretrained(model_name)
            if torch.cuda.is_available():
                models[base_model_key] = models[base_model_key].cuda()
            models[base_model_key].eval()
            print(f"Base model {model_name} loaded")
        
        model = models[base_model_key]
        tokenizer = tokenizers[request.model_name]
        
        # Get input tokens - use the same encoding approach as the tokenize endpoint
        if "roberta" in request.model_name.lower():
            encoding = tokenizer.encode_plus(
                request.text, 
                add_special_tokens=True, 
                return_tensors="pt",
                return_attention_mask=True
            )
        else:
            text = f"[CLS] {request.text} [SEP]"
            encoding = tokenizer(text, return_tensors="pt")
        
        if torch.cuda.is_available():
            encoding = {k: v.cuda() for k, v in encoding.items()}
        
        # Configure the model to return attention
        print("Running model inference to get attention matrices...")
        with torch.no_grad():
            try:
                # Try without attn_implementation first (for older transformers versions)
                outputs = model(**encoding, output_attentions=True)
            except TypeError as e:
                if "attn_implementation" in str(e):
                    # Fall back to newer syntax for newer transformers versions
                    print("Using older transformers version without attn_implementation")
                else:
                    # Re-raise if it's not about attn_implementation
                    raise
            
        # Extract attention from outputs
        # outputs.attentions is a tuple of tensors with shape (batch_size, num_heads, seq_len, seq_len)
        # One tensor per layer
        attention_matrices = outputs.attentions
        print(f"Got attention matrices for {len(attention_matrices)} layers")
        
        # Convert attention matrices to the expected response format
        layers = []
        for layer_idx, layer_attention in enumerate(attention_matrices):
            # Convert from torch tensor to Python list
            layer_attention = layer_attention.cpu().numpy()
            
            # Extract heads
            heads = []
            num_heads = layer_attention.shape[1]  # Dimension 1 is the number of heads
            for head_idx in range(num_heads):
                # Convert attention matrix for this head to list format
                # Shape is [batch_size=1, seq_len, seq_len]
                attention_matrix = layer_attention[0, head_idx].tolist()
                
                heads.append({
                    "headIndex": head_idx,
                    "attention": attention_matrix
                })
            
            layers.append({
                "layerIndex": layer_idx,
                "heads": heads
            })
        
        print(f"Processed {len(layers)} layers with {num_heads} heads each")
            
        # Return complete attention data
        attention_data = {
            "tokens": tokens,
            "layers": layers
        }
        
        # Log the structure of the response for debugging
        response = {"attention_data": attention_data}
        print(f"Sending response with {len(response['attention_data']['tokens'])} tokens and {len(response['attention_data']['layers'])} layers")
        
        return response
    
    except Exception as e:
        print(f"Attention extraction error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 