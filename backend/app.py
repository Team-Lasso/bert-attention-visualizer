import torch
from fastapi import FastAPI, HTTPException, Header
from fastapi import Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import nltk
from nltk.tag import pos_tag
from nltk.corpus import stopwords
import os
from transformers import (
    AutoTokenizer, 
    BertForMaskedLM,
    RobertaForMaskedLM,
    BertModel,
    RobertaModel
)

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('taggers/averaged_perceptron_tagger')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('averaged_perceptron_tagger')
    nltk.download('stopwords')

app = FastAPI(title="BERT Attention Visualizer Backend")

# Get allowed origins from environment variable or use default
cors_origins_str = os.environ.get("CORS_ALLOW_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

# Log the configured origins for debugging
print(f"CORS allowed origins: {allowed_origins}")

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Use the configured origins
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
    Clean RoBERTa tokens by removing the leading 'Ġ' character which represents spaces.
    Also handles other special characters and token variations.
    """
    # Handle the standard case of 'Ġ' prefix (most common in modern RoBERTa models)
    if token.startswith('Ġ'):
        return token[1:]
    # Handle older models that might use 'G' prefix
    if token.startswith('G') and len(token) > 1 and not token[1].isalnum():
        return token[1:]
    # Handle any other special characters that might appear in RoBERTa tokenization
    # but keep alphabetic/numeric characters
    return token

# Helper function to check if token is at the start of a word in RoBERTa
def is_word_start_token(token: str) -> bool:
    """
    Check if a RoBERTa token is at the start of a word (has the 'Ġ' prefix)
    """
    # In RoBERTa tokenization, tokens that start with 'Ġ' indicate the start of a new word
    # Some older RoBERTa models may use 'G' instead of 'Ġ'
    return token.startswith('Ġ') or token.startswith('G')

# Helper function to map RoBERTa tokens to word positions
def map_roberta_tokens_to_words(tokens, original_text):
    """
    Maps RoBERTa tokens to words in the original text.
    Returns a dictionary mapping token indices to word indices.
    Uses direct matching between tokens and words.
    """
    # Get the words from the original text
    words = original_text.split()
    print(f"Original words: {words}")
    
    # Filter out special tokens
    content_tokens = []
    for i, token in enumerate(tokens):
        if token["text"] not in ["<s>", "</s>", "<pad>"]:
            content_tokens.append((i, token["text"]))
    
    print(f"Content tokens: {[t for _, t in content_tokens]}")
    
    # Create the mapping
    token_to_word_map = {}
    
    # First approach: try exact direct matching of tokens to words
    for token_idx, token_text in content_tokens:
        clean_token = token_text.lower()
        
        # Try to find an exact match in the words
        for word_idx, word in enumerate(words):
            word_lower = word.lower().rstrip(".,!?;:")
            if clean_token == word_lower:
                print(f"Exact match: Token '{token_text}' -> Word '{word}' at index {word_idx}")
                token_to_word_map[token_idx] = word_idx
                break
    
    # Second approach: Try substring matching for tokens not yet mapped
    for token_idx, token_text in content_tokens:
        if token_idx in token_to_word_map:
            continue  # Skip tokens that are already mapped
            
        clean_token = token_text.lower()
        
        # Try to find a word containing this token
        best_match = None
        for word_idx, word in enumerate(words):
            word_lower = word.lower()
            if clean_token in word_lower:
                print(f"Substring match: Token '{token_text}' in Word '{word}' at index {word_idx}")
                best_match = word_idx
                break
        
        if best_match is not None:
            token_to_word_map[token_idx] = best_match
    
    # Third approach: Position-based matching for any remaining tokens
    if len(token_to_word_map) < len(content_tokens):
        print("Using position-based matching for remaining tokens")
        # Count how many tokens are mapped to each word
        word_token_counts = {}
        for word_idx in token_to_word_map.values():
            word_token_counts[word_idx] = word_token_counts.get(word_idx, 0) + 1
        
        # Assign unmapped tokens to the nearest word with the fewest tokens
        current_word_idx = 0
        for token_pos, (token_idx, token_text) in enumerate(content_tokens):
            if token_idx not in token_to_word_map:
                # Advance to next word if needed
                while current_word_idx < len(words) - 1 and word_token_counts.get(current_word_idx, 0) > 0:
                    current_word_idx += 1
                
                # Map this token to the current word
                token_to_word_map[token_idx] = current_word_idx
                word_token_counts[current_word_idx] = word_token_counts.get(current_word_idx, 0) + 1
                print(f"Position-based match: Token '{token_text}' -> Word '{words[current_word_idx]}' at index {current_word_idx}")
    
    # Print the final mapping
    print("Final token-to-word mapping:")
    for token_idx, word_idx in sorted(token_to_word_map.items()):
        token_text = next((t["text"] for i, t in enumerate(tokens) if i == token_idx), "")
        if word_idx < len(words):
            print(f"  Token '{token_text}' (idx {token_idx}) -> Word {word_idx} '{words[word_idx]}'")
    
    return token_to_word_map

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

# Helper function to identify function words using NLTK
def is_function_word(word: str) -> bool:
    """
    Determine if a word is a function word using NLTK's part-of-speech tagging and stopwords.
    Function words include determiners, prepositions, conjunctions, auxiliary verbs, etc.
    """
    # Basic punctuation check
    if all(c in ".,;:!?-'\"`()[]{}" for c in word):
        return True
        
    # Clean and lowercase the word
    word = word.lower().strip()
    
    # Empty words are considered function words
    if not word:
        return True
    
    # Very short words (1-2 chars) are usually function words
    if len(word) <= 2:
        return True
    
    # Check if it's in NLTK's stopwords (common function words)
    english_stopwords = set(stopwords.words('english'))
    if word in english_stopwords:
        return True
    
    # Use POS tagging to determine word type
    try:
        # Tag the word to determine its part of speech
        tagged = pos_tag([word])
        pos = tagged[0][1]
        
        # Function word POS tags: determiners, prepositions, conjunctions, etc.
        function_pos_tags = {'DT', 'IN', 'CC', 'MD', 'PRP', 'PRP$', 'WDT', 'WP', 'WP$', 'WRB', 'TO', 'EX'}
        
        if pos in function_pos_tags:
            return True
    except Exception as e:
        # If NLTK tagging fails, fall back to the length-based heuristic
        return len(word) <= 3
    
    # If not identified as a function word, it's a content word
    return False

class TokenizeRequest(BaseModel):
    text: str
    model_name: str = "bert-base-uncased"

class Token(BaseModel):
    text: str
    index: int

class TokenizeResponse(BaseModel):
    tokens: List[Token]

class TokenPrediction(BaseModel):
    token: str
    score: float

class WordPrediction(BaseModel):
    word: str
    score: float

class MaskPredictionRequest(BaseModel):
    text: str
    mask_index: int
    model_name: str = "bert-base-uncased"
    top_k: int = 10

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

class ComparisonRequest(BaseModel):
    text: str
    masked_index: int
    replacement_word: str
    model_name: str = "bert-base-uncased"

class AttentionComparisonResponse(BaseModel):
    before_attention: AttentionData
    after_attention: AttentionData

@app.get("/")
async def root():
    """
    Root endpoint that provides information about the API
    """
    return {
        "message": "BERT Attention Visualizer API",
        "version": "1.0",
        "endpoints": {
            "GET /models": "Get available models",
            "POST /tokenize": "Tokenize text",
            "POST /predict_masked": "Predict masked token",
            "POST /attention": "Get attention matrices",
            "POST /attention_comparison": "Compare attention before and after word replacement"
        },
        "docs": "/docs"  # Link to API documentation
    }

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
async def predict_masked_token(request: MaskPredictionRequest, x_token_to_mask: str = Header(None), x_explicit_masked_text: str = Header(None)):
    """Predict masked token using the specified model"""
    try:
        print(f"\n=== MASK PREDICTION REQUEST ===")
        print(f"Input text: '{request.text}'")
        print(f"Mask index: {request.mask_index}")
        print(f"Model: {request.model_name}")
        print(f"Token to mask header: '{x_token_to_mask}'")
        print(f"Explicit masked text header: '{x_explicit_masked_text}'")
        
        model, tokenizer = get_model_and_tokenizer(request.model_name)
        
        # For RoBERTa, use explicit masked text if provided
        if "roberta" in request.model_name and x_explicit_masked_text:
            print("\n=== USING EXPLICIT MASKED TEXT FOR ROBERTA ===")
            print(f"Explicit masked text: '{x_explicit_masked_text}'")
            
            # Replace the <mask> placeholder with the actual RoBERTa mask token
            text_with_mask = x_explicit_masked_text.replace('<mask>', tokenizer.mask_token)
            print(f"Text with mask token: '{text_with_mask}'")
            
            # Skip all other masking logic and go straight to prediction
            inputs = tokenizer(text_with_mask, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Find the mask token position
            mask_token_index = torch.where(inputs["input_ids"][0] == tokenizer.mask_token_id)[0]
            if len(mask_token_index) == 0:
                raise HTTPException(status_code=400, detail="No mask token found in the explicit masked text")
            mask_token_index = mask_token_index[0].item()
            
            # Get predictions
            with torch.no_grad():
                outputs = model(**inputs)
                predictions = outputs.logits[0, mask_token_index, :].softmax(dim=-1)
            
            # Get top k predictions
            topk_values, topk_indices = torch.topk(predictions, k=request.top_k, dim=-1)
            
            # Process predictions
            predictions_list = []
            seen_words = set()
            
            for i, (value, idx) in enumerate(zip(topk_values, topk_indices)):
                token = tokenizer.decode([idx])
                token = token.strip()
                
                # Clean RoBERTa tokens
                token = clean_roberta_token(token)
                
                # Skip empty, duplicate, or special tokens
                if not token or token in seen_words or token in [tokenizer.unk_token, tokenizer.sep_token, 
                                                                tokenizer.pad_token, tokenizer.cls_token, 
                                                                tokenizer.mask_token, '<s>', '</s>']:
                    continue
                
                seen_words.add(token)
                predictions_list.append(WordPrediction(word=token, score=float(value)))
                
                if len(predictions_list) >= 5:
                    break
            
            print("\n=== ROBERTA PREDICTION RESULTS ===")
            for i, pred in enumerate(predictions_list):
                print(f"  {i+1}. '{pred.word}' ({pred.score:.3f})")
            
            return MaskPredictionResponse(predictions=predictions_list)

        # Get tokens from the original text using the tokenize endpoint for consistency
        tokenizer_response = await tokenize_text(TokenizeRequest(text=request.text, model_name=request.model_name))
        tokens = tokenizer_response["tokens"]
        
        print(f"Tokenizer response: {len(tokens)} tokens")
        for i, t in enumerate(tokens):
            print(f"  Token {i}: '{t['text']}'")
        
        # Validate mask index
        if request.mask_index < 0 or request.mask_index >= len(tokens):
            raise HTTPException(status_code=400, detail=f"Invalid mask index {request.mask_index}. Valid range: 0-{len(tokens)-1}")
        
        # Get the token to mask
        masked_token_text = tokens[request.mask_index]["text"]
        print(f"Masking token: '{masked_token_text}' at index {request.mask_index}")
        
        # For RoBERTa, use a specialized approach for handling punctuation and regular tokens
        if "roberta" in request.model_name:
            print("\n=== ROBERTA MASKING APPROACH ===")
            
            # Check if the token is a punctuation token
            is_punctuation = masked_token_text in [".", ",", "!", "?", ":", ";", "-", "'", "\""]
            print(f"Is token punctuation? {is_punctuation}")
            
            # Split text into tokens for processing
            original_words = request.text.split()
            print(f"Original words: {original_words}")
            
            # For punctuation like periods, we need to be cautious as they might be
            # separate tokens or attached to the previous word
            if is_punctuation:
                print(f"Handling punctuation token: '{masked_token_text}'")
                
                # Directly encode to get original token positions
                encoding = tokenizer.encode_plus(
                    request.text,
                    add_special_tokens=True,
                    return_tensors="pt"
                )
                
                # Convert to tokens for analysis
                all_tokens = tokenizer.convert_ids_to_tokens(encoding["input_ids"][0])
                print(f"All raw tokens: {all_tokens}")
                
                # Create masked input directly
                masked_input_ids = encoding["input_ids"].clone()
                
                # Try to use a simple split-based approach first for period at end of sentence
                if masked_token_text == "." and request.text.endswith("."):
                    print("Period at end of sentence detected.")
                    text_with_mask = request.text[:-1] + tokenizer.mask_token
                else:
                    # Create a version with a mask token directly in the sentence
                    # For RoBERTa, we'll try a simpler approach for masking
                    words = request.text.split()
                    # Try each word position and see which one produces viable output
                    best_match = None
                    for i, word in enumerate(words):
                        # Test if this position makes sense to mask based on proximity to the mask index
                        if abs(i - request.mask_index) <= 1:  # Only test nearby positions
                            test_words = words.copy()
                            if i < len(test_words):
                                # Try replacing the word
                                test_words[i] = tokenizer.mask_token
                                test_text = " ".join(test_words)
                                
                                # Try masking position
                                print(f"Testing mask at position {i}: '{test_text}'")
                                test_encoding = tokenizer.encode_plus(
                                    test_text,
                                    add_special_tokens=True,
                                    return_tensors="pt"
                                )
                                mask_idx = (test_encoding.input_ids[0] == tokenizer.mask_token_id).nonzero(as_tuple=True)[0]
                                if len(mask_idx) > 0:
                                    best_match = {"text": test_text, "pos": i}
                                    break  # Found a working position
                    
                    # Use the best match if found, otherwise default to simple approach
                    if best_match:
                        text_with_mask = best_match["text"]
                        print(f"Found valid mask position at {best_match['pos']}: '{text_with_mask}'")
                    else:
                        # Last resort: Just replace the character
                        if masked_token_text in request.text:
                            last_pos = request.text.rfind(masked_token_text)
                            text_with_mask = request.text[:last_pos] + tokenizer.mask_token + request.text[last_pos + 1:]
                            print(f"Direct character replacement: '{text_with_mask}'")
                        else:
                            # Absolute last resort
                            text_with_mask = request.text + " " + tokenizer.mask_token
                            print(f"Fallback - appending mask: '{text_with_mask}'")
            else:
                # For regular word tokens, use the normal approach
                # Try different masking positions
                words_to_try = []
                for i, word in enumerate(original_words):
                    # If this is near the position we want to mask
                    position_diff = abs(i - request.mask_index)
                    if position_diff <= 2:  # Try words near our target position
                        # Create a version with this word masked
                        test_words = original_words.copy()
                        test_words[i] = tokenizer.mask_token
                        words_to_try.append({
                            "position": i,
                            "original": word,
                            "masked_text": " ".join(test_words)
                        })
                
                # Try each possible masking position
                best_match = None
                for attempt in words_to_try:
                    print(f"\nTrying mask at position {attempt['position']}: '{attempt['masked_text']}'")
                    # Tokenize this attempt
                    test_encoding = tokenizer.encode_plus(
                        attempt["masked_text"],
                        add_special_tokens=True,
                        return_tensors="pt"
                    )
                    # Check if mask token is present
                    mask_positions = (test_encoding.input_ids[0] == tokenizer.mask_token_id).nonzero(as_tuple=True)[0]
                    if len(mask_positions) > 0:
                        print(f"  ✓ Mask token found at position(s): {mask_positions.tolist()}")
                        # This is a valid masking position
                        if best_match is None:
                            best_match = attempt
                            print(f"  → Selected as best match")
                    else:
                        print(f"  ✗ No mask token found")
                
                # Use the best match or fallback to original approach
                if best_match:
                    text_with_mask = best_match["masked_text"]
                    print(f"\nUsing best match: '{text_with_mask}'")
                else:
                    # Fallback to the direct approach
                    words = request.text.split()
                    word_to_mask_idx = min(request.mask_index, len(words) - 1)
                    words[word_to_mask_idx] = tokenizer.mask_token
                    text_with_mask = " ".join(words)
                    print(f"\nFallback to direct position masking: '{text_with_mask}'")
        else:
            # For BERT models
            print("\n=== BERT MASKING APPROACH ===")
            
            # For BERT, we'll take a more direct approach focused on content words
            original_words = request.text.split()
            print(f"Original words: {original_words}")
            
            # Check if we have a direct word to mask from header
            explicit_word_to_mask = None
            if x_token_to_mask and "bert" in request.model_name and not "roberta" in request.model_name:
                explicit_word_to_mask = x_token_to_mask
                print(f"Using explicit word to mask from header: '{explicit_word_to_mask}'")
                
                # Find this word in the original text
                word_found = False
                for i, word in enumerate(original_words):
                    if word.lower() == explicit_word_to_mask.lower():
                        print(f"Found explicit word '{word}' at position {i}")
                        masked_words = original_words.copy()
                        masked_words[i] = tokenizer.mask_token
                        text_with_mask = " ".join(masked_words)
                        print(f"Direct word masking: '{text_with_mask}'")
                        word_found = True
                        break
                
                # If we found the word, we can skip the rest of the logic
                if word_found:
                    # Continue with predictions using text_with_mask
                    inputs = tokenizer(text_with_mask, return_tensors="pt")
                    with torch.no_grad():
                        outputs = model(**inputs)
                        
                    mask_token_index = torch.where(inputs["input_ids"][0] == tokenizer.mask_token_id)[0]
                    if len(mask_token_index) == 0:
                        raise HTTPException(status_code=400, detail="No mask token found in the input")
                    mask_token_index = mask_token_index[0].item()
                    
                    logits = outputs.logits
                    mask_token_logits = logits[0, mask_token_index, :]
                    
                    # Get top 5 tokens
                    top_k = 10
                    top_n_tokens = torch.topk(mask_token_logits, top_k, dim=0)
                    
                    print("\nTop predictions:")
                    predictions = []
                    seen_words = set()  # Track seen words to avoid duplicates
                    
                    for i, (score, idx) in enumerate(zip(top_n_tokens.values, top_n_tokens.indices)):
                        token = tokenizer.convert_ids_to_tokens([idx])[0]
                        token_str = token.replace("##", "")
                        
                        # Skip special tokens and duplicates of previous predictions
                        if token_str in [tokenizer.unk_token, tokenizer.sep_token, tokenizer.pad_token, tokenizer.cls_token, tokenizer.mask_token]:
                            continue
                        if token_str in seen_words:
                            continue
                            
                        seen_words.add(token_str)
                        predictions.append(WordPrediction(word=token_str, score=float(score)))
                        print(f"{i+1}. {token_str} ({float(score):.4f})")
                        
                        if len(predictions) >= 5:
                            break
                    
                    return MaskPredictionResponse(predictions=predictions[:5])
                else:
                    print(f"Explicit word '{explicit_word_to_mask}' not found, falling back to normal approach")
                    # Fall through to normal approach
                    explicit_word_to_mask = None
            
            # Only proceed with normal logic if we didn't find an explicit word
            if not explicit_word_to_mask:
                # Check if we're masking a content word (not function word)
                masked_token_is_content = not is_function_word(masked_token_text)
                print(f"Is masking content word: {masked_token_is_content} - '{masked_token_text}'")
                
                if masked_token_is_content:
                    # For content words, ignore position and directly find the content word
                    content_word_found = False
                    for i, word in enumerate(original_words):
                        # Check for case-insensitive match since BERT lowercases
                        if masked_token_text.lower() in word.lower() or word.lower() == masked_token_text.lower():
                            print(f"Found content word '{word}' at position {i}")
                            masked_words = original_words.copy()
                            masked_words[i] = tokenizer.mask_token
                            text_with_mask = " ".join(masked_words)
                            print(f"Content word masking: '{text_with_mask}'")
                            content_word_found = True
                            break
                    
                    if not content_word_found:
                        # If not found directly, check for any content words in positions near the request index
                        potential_content_positions = []
                        for i, word in enumerate(original_words):
                            if not is_function_word(word):
                                potential_content_positions.append(i)
                        
                        if potential_content_positions:
                            # Find closest content word to the requested position
                            closest_content_pos = min(potential_content_positions, key=lambda x: abs(x - request.mask_index))
                            print(f"Using closest content word '{original_words[closest_content_pos]}' at position {closest_content_pos}")
                            masked_words = original_words.copy()
                            masked_words[closest_content_pos] = tokenizer.mask_token
                            text_with_mask = " ".join(masked_words)
                            print(f"Closest content word masking: '{text_with_mask}'")
                        else:
                            # Fallback to position-based approach
                            closest_pos = min(range(len(original_words)), key=lambda x: abs(x - request.mask_index))
                            masked_words = original_words.copy()
                            masked_words[closest_pos] = tokenizer.mask_token
                            text_with_mask = " ".join(masked_words)
                            print(f"Fallback to closest position masking: '{text_with_mask}'")
                else:
                    # For function words, use position-based masking
                    # Identify the most likely position for this token in the original text
                    token_positions = []
                    for i, word in enumerate(original_words):
                        if masked_token_text in word or masked_token_text == word:
                            token_positions.append(i)
                    
                    if token_positions:
                        print(f"Found token '{masked_token_text}' at word positions: {token_positions}")
                        # Use the position most closely matching the request index
                        closest_pos = min(token_positions, key=lambda x: abs(x - request.mask_index))
                        
                        # Create masked text
                        masked_words = original_words.copy()
                        masked_words[closest_pos] = tokenizer.mask_token
                        text_with_mask = " ".join(masked_words)
                        print(f"Masking at closest word position {closest_pos}: '{text_with_mask}'")
                    else:
                        # Try direct BERT tokenizer-based approach (original method)
                        # Convert tokens to a list of strings
                        token_texts = [token["text"] for token in tokens]
                        
                        # Replace the token at mask_index with the mask token
                        token_texts[request.mask_index] = tokenizer.mask_token
                        
                        # Join the tokens
                        text_with_mask = tokenizer.convert_tokens_to_string(token_texts)
                        print(f"Fallback to token-based masking: '{text_with_mask}'")
                        
                        # If that doesn't work, try to directly place the masked token at a position
                        try:
                            test_encoding = tokenizer.encode_plus(
                                text_with_mask,
                                add_special_tokens=True,
                                return_tensors="pt"
                            )
                            mask_positions = (test_encoding.input_ids[0] == tokenizer.mask_token_id).nonzero(as_tuple=True)[0]
                            
                            if len(mask_positions) == 0:
                                print("Warning: No mask token found in token-based approach, trying word-based")
                                # Try masking at the word level instead
                                words = request.text.split()
                                word_idx = min(request.mask_index, len(words) - 1)
                                words[word_idx] = tokenizer.mask_token
                                text_with_mask = " ".join(words)
                                print(f"Word-based masking: '{text_with_mask}'")
                        except Exception as e:
                            print(f"Error in token-based masking, falling back to word-based: {e}")
                            # Fallback to simple word replacement
                            words = request.text.split()
                            word_idx = min(request.mask_index, len(words) - 1)
                            words[word_idx] = tokenizer.mask_token 
                            text_with_mask = " ".join(words)
                            print(f"Simple word replacement: '{text_with_mask}'")
        
        # Get predictions
        print(f"\n=== GETTING PREDICTIONS ===")
        print(f"Final text with mask: '{text_with_mask}'")
        
        inputs = tokenizer(text_with_mask, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # Print input IDs and tokens for debugging
        input_tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        print(f"Tokenized input: {input_tokens}")
        
        # Find the mask token position in input_ids
        mask_token_index = torch.where(inputs["input_ids"][0] == tokenizer.mask_token_id)[0]
        if len(mask_token_index) == 0:
            raise HTTPException(status_code=500, detail="Mask token not found in processed input")
        
        print(f"Mask token position in input_ids: {mask_token_index.tolist()}")
        
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = outputs.logits[0, mask_token_index, :].softmax(dim=-1)
        
        # Get top k predictions
        topk_values, topk_indices = torch.topk(predictions, k=request.top_k, dim=-1)
        
        # Convert predictions to response format
        predictions_list = []
        seen_words = set()  # Track seen words to avoid duplicates
        
        for i, (value, idx) in enumerate(zip(topk_values[0], topk_indices[0])):
            token = tokenizer.decode([idx])
            # Clean up tokens (some models have extra spaces or special chars)
            token = token.strip()
            
            # For RoBERTa, also clean any leading 'Ġ' character
            if "roberta" in request.model_name:
                token = clean_roberta_token(token)
            
            # Skip token if it's empty or already seen
            if not token or token in seen_words:
                continue
                
            # Skip special tokens
            if token in [tokenizer.unk_token, tokenizer.sep_token, tokenizer.pad_token, 
                         tokenizer.cls_token, tokenizer.mask_token, '<s>', '</s>']:
                continue
                
            seen_words.add(token)
            predictions_list.append(WordPrediction(word=token, score=float(value)))
            
            # Stop after getting enough predictions
            if len(predictions_list) >= request.top_k:
                break
        
        print(f"\n=== PREDICTION RESULTS ===")
        for i, pred in enumerate(predictions_list[:5]):  # Print top 5
            print(f"  {i+1}. '{pred.word}' ({pred.score:.3f})")
        
        return {"predictions": predictions_list}
    
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
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

@app.post("/attention_comparison", response_model=AttentionComparisonResponse)
async def get_attention_comparison(request: ComparisonRequest):
    """
    Dispatcher for attention comparison - routes to the appropriate model-specific implementation
    """
    # Log request details
    print(f"\n\n=== ATTENTION COMPARISON REQUEST ===")
    print(f"Text: '{request.text}'")
    print(f"Masked index: {request.masked_index}")
    print(f"Replacement word: '{request.replacement_word}'")
    print(f"Model: {request.model_name}")
    
    # Dispatch based on model type
    if "roberta" in request.model_name.lower():
        return await get_attention_comparison_roberta(request)
    else:
        return await get_attention_comparison_bert(request)


async def get_attention_comparison_bert(request: ComparisonRequest):
    """
    BERT-specific implementation of attention comparison
    """
    try:
        print(f"\n=== USING BERT ATTENTION COMPARISON IMPLEMENTATION ===")
        
        # 1. Get the "before" attention data
        before_attention_request = AttentionRequest(text=request.text, model_name=request.model_name)
        before_data = (await get_attention_matrices(before_attention_request))["attention_data"]
        
        # 2. Tokenize the text
        tokenizer_response = await tokenize_text(TokenizeRequest(text=request.text, model_name=request.model_name))
        tokens = tokenizer_response["tokens"]
        
        # Print all tokens for debugging
        print(f"\nTokens ({len(tokens)}):")
        for i, t in enumerate(tokens):
            print(f"  {i}: '{t['text']}'")
        
        # Validate masked_index
        if request.masked_index < 0 or request.masked_index >= len(tokens):
            raise HTTPException(status_code=400, detail=f"Invalid token index {request.masked_index}. Valid range: 0-{len(tokens)-1}")
        
        # Get the selected token
        selected_token = tokens[request.masked_index]["text"]
        print(f"\nSelected token at index {request.masked_index}: '{selected_token}'")
        
        # Get the tokenizer for this model
        _, tokenizer = get_model_and_tokenizer(request.model_name)
        
        # Detect if we're working with a punctuation token
        is_punctuation = selected_token in [".", ",", "!", "?", ":", ";", "-", "'", "\""]
        print(f"Is punctuation token: {is_punctuation}")
        
        # Get full original text
        original_text = request.text
        
        # HANDLE PUNCTUATION 
        if is_punctuation:
            print(f"\nUsing BERT punctuation replacement approach")
            
            # Find all occurrences of this punctuation in the original text
            punctuation_positions = [pos for pos, char in enumerate(original_text) if char == selected_token]
            print(f"Found punctuation '{selected_token}' at positions: {punctuation_positions}")
            
            if not punctuation_positions:
                print(f"Warning: Could not find punctuation '{selected_token}' in text, using fallback")
                # Fallback to word-based approach
                is_punctuation = False
            else:
                # Determine which occurrence of the punctuation corresponds to our token
                # We'll use a heuristic based on the token's position
                
                # Count non-special tokens before our selected token
                non_special_tokens_before = sum(1 for t in tokens[:request.masked_index] 
                                             if t["text"] not in ["[CLS]", "[SEP]"])
                
                # Select the corresponding punctuation position (or last one if out of range)
                punct_idx = min(non_special_tokens_before, len(punctuation_positions) - 1)
                position_to_replace = punctuation_positions[punct_idx]
                
                print(f"Selected punctuation occurrence {punct_idx} at position {position_to_replace}")
                
                # Replace just the punctuation character
                replaced_text = original_text[:position_to_replace] + request.replacement_word + original_text[position_to_replace+1:]
                print(f"Original text: '{original_text}'")
                print(f"Replaced text: '{replaced_text}'")
                
                # Get the after attention data
                after_attention_request = AttentionRequest(text=replaced_text, model_name=request.model_name)
                after_data = (await get_attention_matrices(after_attention_request))["attention_data"]
                
                # Return comparison data
                return {"before_attention": before_data, "after_attention": after_data}
        
        # HANDLE REGULAR WORDS FOR BERT
        print(f"\nUsing BERT word replacement approach")
        words = original_text.split()
        print(f"Words: {words}")
        
        # Build a mapping of token indices to original text positions
        token_positions = []
        current_pos = 0
        
        for token in tokens:
            # Skip special tokens
            if token["text"] in ["[CLS]", "[SEP]"]:
                token_positions.append(None)
                continue
            
            # For regular tokens, find their position in the original text
            token_text = token["text"].replace("##", "")
            
            # Find the token in the original text starting from current position
            start_pos = original_text.lower().find(token_text.lower(), current_pos)
            if start_pos != -1:
                token_positions.append((start_pos, start_pos + len(token_text)))
                current_pos = start_pos + len(token_text)
            else:
                # If token not found directly, it might be due to case sensitivity or special handling
                token_positions.append(None)
        
        print(f"Token positions: {token_positions}")
        
        # Now determine which word(s) correspond to our selected token
        if request.masked_index < len(token_positions) and token_positions[request.masked_index] is not None:
            token_start, token_end = token_positions[request.masked_index]
            
            # Find which word contains this token
            current_pos = 0
            target_word_idx = None
            
            for i, word in enumerate(words):
                word_start = original_text.lower().find(word.lower(), current_pos)
                if word_start == -1:  # Skip if word not found
                    continue
                    
                word_end = word_start + len(word)
                
                # Check if token is within this word
                if (token_start >= word_start and token_start < word_end) or \
                   (token_end > word_start and token_end <= word_end):
                    target_word_idx = i
                    break
                
                current_pos = word_end
            
            if target_word_idx is not None:
                print(f"Selected token maps to word {target_word_idx}: '{words[target_word_idx]}'")
                
                # Check if the word has punctuation at the end
                original_word = words[target_word_idx]
                punctuation_suffix = ""
                
                for char in ['.', ',', '!', '?', ':', ';']:
                    if original_word.endswith(char):
                        punctuation_suffix = char
                        break
                
                # Replace the word, preserving any punctuation
                replaced_word = request.replacement_word
                if punctuation_suffix and not replaced_word.endswith(punctuation_suffix):
                    replaced_word = replaced_word + punctuation_suffix
                    print(f"Preserving punctuation: {request.replacement_word} → {replaced_word}")
                
                # Create the new text
                words[target_word_idx] = replaced_word
                replaced_text = " ".join(words)
                
                print(f"Original text: '{original_text}'")
                print(f"Original word: '{original_word}'")
                print(f"Replacement: '{replaced_word}'")
                print(f"Replaced text: '{replaced_text}'")
            else:
                # Fallback: replace the word closest to the token position
                print(f"Could not map token to a specific word, using fallback")
                
                # Use a simple approach: split by spaces and replace the closest word
                # Adjust the index to account for [CLS] token
                adjusted_index = max(0, request.masked_index - 1)
                word_idx = min(adjusted_index, len(words) - 1)
                
                # Check for punctuation
                original_word = words[word_idx]
                punctuation_suffix = ""
                
                for char in ['.', ',', '!', '?', ':', ';']:
                    if original_word.endswith(char):
                        punctuation_suffix = char
                        break
                
                # Replace the word, preserving any punctuation
                replaced_word = request.replacement_word
                if punctuation_suffix and not replaced_word.endswith(punctuation_suffix):
                    replaced_word = replaced_word + punctuation_suffix
                
                words[word_idx] = replaced_word
                replaced_text = " ".join(words)
                
                print(f"Fallback replacement: '{original_word}' → '{replaced_word}'")
                print(f"Replaced text: '{replaced_text}'")
        else:
            # Fallback if we couldn't find token position
            print(f"Could not determine token position, using simple word replacement")
            words = original_text.split()
            
            # Adjust for special tokens in BERT ([CLS])
            adjusted_index = max(0, request.masked_index - 1)
            word_idx = min(adjusted_index, len(words) - 1)
            
            # Check for punctuation
            original_word = words[word_idx]
            punctuation_suffix = ""
            
            for char in ['.', ',', '!', '?', ':', ';']:
                if original_word.endswith(char):
                    punctuation_suffix = char
                    break
            
            # Replace the word, preserving any punctuation
            replaced_word = request.replacement_word
            if punctuation_suffix and not replaced_word.endswith(punctuation_suffix):
                replaced_word = replaced_word + punctuation_suffix
            
            words[word_idx] = replaced_word
            replaced_text = " ".join(words)
            
            print(f"Simple replacement: '{original_word}' → '{replaced_word}'")
            print(f"Replaced text: '{replaced_text}'")
        
        # Get the after attention data
        after_attention_request = AttentionRequest(text=replaced_text, model_name=request.model_name)
        after_data = (await get_attention_matrices(after_attention_request))["attention_data"]
        
        # Return comparison data
        return {"before_attention": before_data, "after_attention": after_data}
    
    except Exception as e:
        print(f"BERT Attention comparison error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


async def get_attention_comparison_roberta(request: ComparisonRequest):
    """
    RoBERTa-specific implementation of attention comparison.
    Completely rewritten to properly handle token replacement.
    """
    try:
        print(f"\n=== ROBERTA ATTENTION COMPARISON ===")
        print(f"Text: '{request.text}'")
        print(f"Selected token index: {request.masked_index}")
        print(f"Replacement word: '{request.replacement_word}'")
        
        # Get the "before" attention data
        before_attention_request = AttentionRequest(text=request.text, model_name=request.model_name)
        before_data = (await get_attention_matrices(before_attention_request))["attention_data"]
        
        # Tokenize the text
        tokenizer_response = await tokenize_text(TokenizeRequest(text=request.text, model_name=request.model_name))
        tokens = tokenizer_response["tokens"]
        
        # Get the tokenizer 
        _, tokenizer = get_model_and_tokenizer(request.model_name)
        
        # Log tokens
        print("\nTokens:")
        for i, t in enumerate(tokens):
            print(f"  {i}: '{t['text']}'")
        
        # Validate masked_index
        if request.masked_index < 0 or request.masked_index >= len(tokens):
            raise HTTPException(status_code=400, detail=f"Invalid token index {request.masked_index}. Valid range: 0-{len(tokens)-1}")
        
        # Get the selected token
        selected_token = tokens[request.masked_index]["text"]
        print(f"Selected token: '{selected_token}' at index {request.masked_index}")
        
        # Get original text as a list of words
        original_text = request.text
        words = original_text.split()
        
        # Step 1: Direct handling for punctuation tokens
        is_punctuation = selected_token in [".", ",", "!", "?", ":", ";", "-", "'", "\""]
        
        if is_punctuation:
            print(f"Handling punctuation token: '{selected_token}'")
            
            # Find all occurrences of this punctuation in the original text
            punctuation_positions = [pos for pos, char in enumerate(original_text) if char == selected_token]
            
            if punctuation_positions:
                # Decide which occurrence to replace based on position
                if len(punctuation_positions) == 1:
                    # Only one occurrence - clear choice
                    pos_to_replace = punctuation_positions[0]
                elif selected_token == "." and original_text.endswith("."):
                    # End-of-sentence period
                    pos_to_replace = len(original_text) - 1
                else:
                    # Count non-special tokens before our selected token to guess which occurrence
                    non_special_count = sum(1 for i, t in enumerate(tokens) 
                                         if i < request.masked_index and t["text"] not in ["<s>", "</s>", "<pad>"])
                    
                    # Use the count (bounded) to select which occurrence
                    pos_idx = min(non_special_count, len(punctuation_positions) - 1)
                    pos_to_replace = punctuation_positions[pos_idx]
                
                # Perform the replacement
                print(f"Replacing punctuation at position {pos_to_replace}")
                replaced_text = original_text[:pos_to_replace] + request.replacement_word + original_text[pos_to_replace+1:]
                print(f"Replaced text: '{replaced_text}'")
                
                # Get the "after" attention data and return
                after_request = AttentionRequest(text=replaced_text, model_name=request.model_name)
                after_data = (await get_attention_matrices(after_request))["attention_data"]
                return {"before_attention": before_data, "after_attention": after_data}
        
        # Step 2: Map the token to a word
        print("Mapping selected token to a word:")
        token_to_word_map = map_roberta_tokens_to_words(tokens, original_text)
        
        # Get the word index for the selected token
        if request.masked_index in token_to_word_map:
            word_idx = token_to_word_map[request.masked_index]
            if word_idx < 0 or word_idx >= len(words):
                print(f"Warning: word_idx {word_idx} is out of bounds, using nearest valid index")
                word_idx = max(0, min(word_idx, len(words) - 1))
            
            original_word = words[word_idx]
            print(f"Selected token maps to word '{original_word}' at index {word_idx}")
            
            # Handle any punctuation at the end of the word
            punctuation_suffix = ""
            for char in ['.', ',', '!', '?', ':', ';']:
                if original_word.endswith(char):
                    punctuation_suffix = char
                    break
            
            # Create replacement word with punctuation preserved if needed
            if punctuation_suffix:
                replaced_word = request.replacement_word + punctuation_suffix
                print(f"Preserving punctuation: '{request.replacement_word}' → '{replaced_word}'")
            else:
                replaced_word = request.replacement_word
            
            # Create the replaced text
            words[word_idx] = replaced_word
            replaced_text = " ".join(words)
            print(f"Replacing '{original_word}' with '{replaced_word}'")
            print(f"Replaced text: '{replaced_text}'")
            
            # Get the "after" attention data
            after_request = AttentionRequest(text=replaced_text, model_name=request.model_name)
            after_data = (await get_attention_matrices(after_request))["attention_data"]
            
            return {"before_attention": before_data, "after_attention": after_data}
        else:
            # Step 3: Fallback - direct content matching
            print(f"Selected token not found in mapping, using fallback approach")
            clean_token = selected_token.lower()
            
            # Try to find a direct match in any word
            matching_word_idx = -1
            for i, word in enumerate(words):
                word_lower = word.lower().rstrip(".,!?;:")
                if clean_token == word_lower or clean_token in word_lower:
                    matching_word_idx = i
                    print(f"Direct match: token '{selected_token}' → word '{word}'")
                    break
            
            if matching_word_idx >= 0:
                # Replace the matched word
                original_word = words[matching_word_idx]
                
                # Preserve punctuation if present
                punctuation_suffix = ""
                for char in ['.', ',', '!', '?', ':', ';']:
                    if original_word.endswith(char):
                        punctuation_suffix = char
                        break
                
                if punctuation_suffix:
                    replaced_word = request.replacement_word + punctuation_suffix
                else:
                    replaced_word = request.replacement_word
                
                words[matching_word_idx] = replaced_word
                replaced_text = " ".join(words)
                print(f"Replacing '{original_word}' with '{replaced_word}'")
                print(f"Replaced text: '{replaced_text}'")
            else:
                # Step 4: Absolute fallback - position-based replacement
                print("No word match found, using position-based fallback")
                
                # Count non-special tokens before our token to estimate word position
                non_special_count = 0
                for i, t in enumerate(tokens):
                    if i < request.masked_index and t["text"] not in ["<s>", "</s>", "<pad>"]:
                        non_special_count += 1
                
                # Map to a word index (bounded)
                word_idx = min(non_special_count, len(words) - 1)
                original_word = words[word_idx]
                
                # Preserve punctuation
                punctuation_suffix = ""
                for char in ['.', ',', '!', '?', ':', ';']:
                    if original_word.endswith(char):
                        punctuation_suffix = char
                        break
                
                if punctuation_suffix:
                    replaced_word = request.replacement_word + punctuation_suffix
                else:
                    replaced_word = request.replacement_word
                
                words[word_idx] = replaced_word
                replaced_text = " ".join(words)
                print(f"Position-based replacement: '{original_word}' → '{replaced_word}'")
                print(f"Replaced text: '{replaced_text}'")
            
            # Get the "after" attention data
            after_request = AttentionRequest(text=replaced_text, model_name=request.model_name)
            after_data = (await get_attention_matrices(after_request))["attention_data"]
            
            return {"before_attention": before_data, "after_attention": after_data}
        
    except Exception as e:
        print(f"RoBERTa Attention comparison error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 