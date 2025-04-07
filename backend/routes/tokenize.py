from fastapi import APIRouter, HTTPException
from classes import *
from helpers import *

router = APIRouter()

@router.post("", response_model=TokenizeResponse)
async def tokenize_text(request: TokenizeRequest):
    """Tokenize input text using the specified model's tokenizer"""
    try:
        _, tokenizer = get_model_and_tokenizer(request.model_name)
        
        # Get model type to determine tokenization approach
        model_name = request.model_name.lower()
        
        # The text might include punctuation - let the tokenizer handle it properly
        if "roberta" in model_name:
            # For RoBERTa, we'll encode with the tokenizer and decode to get the individual tokens
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
        elif "distilbert" in model_name:
            # For DistilBERT, use the same approach as BERT
            text = f"[CLS] {request.text} [SEP]"
            tokens = tokenizer.tokenize(text)
            print(f"DistilBERT tokens: {tokens}")
        elif "bert-tiny" in model_name or "bert" in model_name or "tinybert" in model_name:
            # For BERT and TinyBERT, add special tokens and tokenize
            text = f"[CLS] {request.text} [SEP]"
            tokens = tokenizer.tokenize(text)
        else:
            # Fallback for any other model types
            print(f"Using fallback tokenization for model: {model_name}")
            text = request.text
            tokens = tokenizer.tokenize(text)
            # Add special tokens if they're not already included
            if tokens and tokens[0] != "[CLS]":
                tokens = ["[CLS]"] + tokens + ["[SEP]"]
        
        # Create token objects with indices
        token_objects = [
            {"text": token, "index": idx}
            for idx, token in enumerate(tokens)
        ]
        
        print(f"Tokenized '{request.text}' into {len(tokens)} tokens using {model_name}")
        return {"tokens": token_objects}
    
    except Exception as e:
        print(f"Tokenization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

