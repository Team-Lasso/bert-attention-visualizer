from fastapi import APIRouter, HTTPException
from classes import *
from helpers import *

router = APIRouter()

@router.post("", response_model=TokenizeResponse)
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
            # For BERT and DistilBERT, add special tokens and tokenize
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
