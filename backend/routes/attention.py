from fastapi import APIRouter, HTTPException
from classes import *
from helpers import *
from routes.tokenize import tokenize_text
from attention_processing import process_attention_with_method
router = APIRouter()

@router.post("", response_model=AttentionResponse)
async def get_attention_matrices(request: AttentionRequest):
    """Get attention matrices for the input text using the specified model"""
    try:
        debug = request.debug if hasattr(request, 'debug') else False
        print(f"Processing attention request: text='{request.text}', model={request.model_name}, method={request.visualization_method}, debug={debug}")
        
        # First tokenize the text using the same function that the /tokenize endpoint uses
        # to ensure consistency
        tokenizer_response = await tokenize_text(TokenizeRequest(text=request.text, model_name=request.model_name, debug=debug))
        tokens = tokenizer_response["tokens"]
        print(f"Tokenized into {len(tokens)} tokens")
        
        # Load base model (not masked LM) to access attention matrices
        model_name = request.model_name
        
        if model_name not in MODEL_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Model {model_name} not supported")
            
        config = MODEL_CONFIGS[model_name]
        
        # Handle custom model differently if needed
        if config["model_class"] == "custom":
            # For custom models, we need special handling
            base_model_key = f"{model_name}_base"
            if base_model_key not in models:
                # For TinyBERT, we use the same model with different configuration
                _, tokenizer = get_model_and_tokenizer(model_name, debug)
                custom_repo = "EdwinXhen/TinyBert_6Layer_MLM"
                print(f"Loading base model from {custom_repo} for attention visualization...")
                from transformers import AutoModel
                models[base_model_key] = AutoModel.from_pretrained(custom_repo, attn_implementation="eager", output_attentions=True)
                if torch.cuda.is_available():
                    models[base_model_key] = models[base_model_key].cuda()
                models[base_model_key].eval()
                print(f"Base model {model_name} loaded")
        else:
            # Standard model loading
            base_model_class = config["base_model_class"]
            
            # Check if we already have a base model cached
            base_model_key = f"{model_name}_base"
            if base_model_key not in models:
                print(f"Loading base model {model_name}...")
                models[base_model_key] = base_model_class.from_pretrained(model_name, attn_implementation="eager")
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
            
            # Map RoBERTa tokens to words for better visualization
            token_to_word_map = map_roberta_tokens_to_words(tokens, request.text)
        else:
            # For BERT and DistilBERT
            text = f"[CLS] {request.text} [SEP]"
            encoding = tokenizer(text, return_tensors="pt")
            
            # Map BERT/DistilBERT tokens to words for better visualization
            token_to_word_map = map_bert_tokens_to_words(tokens, request.text)
        
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
        
        # Process attention using the specified method
        if request.visualization_method != "raw":
            print(f"Processing attention with method: {request.visualization_method}")

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
        
        # Process with selected visualization method
        if request.visualization_method != "raw":
            processed_layers = process_attention_with_method(
                attention_matrices, 
                method=request.visualization_method,
                debug=False
            )
            # Replace the layers with the processed ones
            layers = processed_layers
            
        # Add token-to-word mapping to the response
        for i, token in enumerate(tokens):
            if i in token_to_word_map:
                token["wordIndex"] = token_to_word_map[i]
            
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
