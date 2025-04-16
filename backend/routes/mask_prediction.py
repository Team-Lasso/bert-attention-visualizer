from fastapi import APIRouter, HTTPException, Header
from routes.tokenize import tokenize_text
from classes import *
from helpers import *

router = APIRouter()



@router.post("", response_model=MaskPredictionResponse)
async def predict_masked_token(request: MaskPredictionRequest, x_token_to_mask: str = Header(None), x_explicit_masked_text: str = Header(None)):
    """Predict masked token using the specified model"""
    try:
        print(f"\n=== MASK PREDICTION REQUEST ===")
        print(f"Input text: '{request.text}'")
        print(f"Mask index: {request.mask_index}")
        print(f"Model: {request.model_name}")
        print(f"Token to mask header: '{x_token_to_mask}'")
        print(f"Explicit masked text header: '{x_explicit_masked_text}'")
        
        debug = request.debug if hasattr(request, 'debug') else False
        model, tokenizer = get_model_and_tokenizer(request.model_name, debug)
        
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
        tokenizer_response = await tokenize_text(TokenizeRequest(text=request.text, model_name=request.model_name, debug=debug))
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
