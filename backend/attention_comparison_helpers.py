from fastapi import HTTPException
from classes import *
from helpers import *
from routes.attention import get_attention_matrices
from routes.tokenize import tokenize_text



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
