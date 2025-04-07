from fastapi import APIRouter, HTTPException
from classes import *
from helpers import *
from routes.tokenize import tokenize_text
router = APIRouter()

@router.post("", response_model=AttentionResponse)
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
        
        # AI-generated code
        # Update attention matrix extraction to support DistilBERT and TinyBERT models
        model_name_lower = request.model_name.lower()
        
        # Get input tokens - use the same encoding approach as the tokenize endpoint
        if "roberta" in model_name_lower:
            encoding = tokenizer.encode_plus(
                request.text, 
                add_special_tokens=True, 
                return_tensors="pt",
                return_attention_mask=True
            )
        elif "distilbert" in model_name_lower or "huawei-noah/tinybert" in model_name_lower or "bert" in model_name_lower:
            # For DistilBERT and BERT/TinyBERT models
            text = request.text
            encoding = tokenizer(text, return_tensors="pt", add_special_tokens=True)
        else:
            # Fallback for other models
            encoding = tokenizer(request.text, return_tensors="pt", add_special_tokens=True)
        
        if torch.cuda.is_available():
            encoding = {k: v.cuda() for k, v in encoding.items()}
        
        # Configure the model to return attention
        print("Running model inference to get attention matrices...")
        with torch.no_grad():
            try:
                # Try newer transformers syntax first
                outputs = model(**encoding, output_attentions=True)
            except TypeError as e:
                print(f"Encountered error: {str(e)}")
                if "unexpected keyword argument" in str(e):
                    # Fall back for models with different API
                    print("Using alternate model API")
                    outputs = model(**encoding)
                else:
                    raise
            
        # Extract attention from outputs
        # outputs.attentions is a tuple of tensors with shape (batch_size, num_heads, seq_len, seq_len)
        # One tensor per layer
        attention_matrices = outputs.attentions
        if attention_matrices is None:
            raise ValueError(f"Model {request.model_name} did not return attention matrices. Please check if this model supports attention output.")
            
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
