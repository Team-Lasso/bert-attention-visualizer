import torch
from fastapi import HTTPException
from models import *
from nltk import pos_tag
from nltk.corpus import stopwords

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

# Helper function to map BERT and DistilBERT tokens to word positions
def map_bert_tokens_to_words(tokens, original_text):
    """
    Maps BERT/DistilBERT tokens to words in the original text.
    Returns a dictionary mapping token indices to word indices.
    """
    # Get the words from the original text
    words = original_text.split()
    print(f"Original words: {words}")
    
    # Filter out special tokens
    content_tokens = []
    for i, token in enumerate(tokens):
        if token["text"] not in ["[CLS]", "[SEP]", "[PAD]", "[UNK]"]:
            content_tokens.append((i, token["text"]))
    
    print(f"Content tokens: {[t for _, t in content_tokens]}")
    
    # Create the mapping
    token_to_word_map = {}
    
    # First approach: direct matching of tokens to words, handling WordPiece tokens
    word_idx = 0
    for token_idx, token_text in content_tokens:
        clean_token = token_text.lower().strip("##")
        
        # Check if this is a continuation token (starting with ##)
        if token_text.startswith("##"):
            # If it's a continuation, map it to the same word as the previous token
            if token_idx > 0 and (token_idx - 1) in token_to_word_map:
                token_to_word_map[token_idx] = token_to_word_map[token_idx - 1]
                print(f"Continuation token: '{token_text}' -> Word '{words[token_to_word_map[token_idx]]}'")
            continue
        
        # Try to find a match with words
        while word_idx < len(words):
            word_lower = words[word_idx].lower()
            if clean_token in word_lower:
                token_to_word_map[token_idx] = word_idx
                print(f"Match: Token '{token_text}' -> Word '{words[word_idx]}' at index {word_idx}")
                # Only advance to next word if this token is a complete word
                if clean_token == word_lower:
                    word_idx += 1
                break
            else:
                word_idx += 1
                
            # If we've gone through all words, break
            if word_idx >= len(words):
                break
    
    # Second approach: Position-based matching for any remaining tokens
    if len(token_to_word_map) < len(content_tokens):
        print("Using position-based matching for remaining tokens")
        
        # Assign unmapped tokens based on surrounding mapped tokens
        for token_idx, token_text in content_tokens:
            if token_idx not in token_to_word_map:
                # Look for the nearest mapped token before this one
                prev_idx = token_idx - 1
                while prev_idx >= 0 and prev_idx not in token_to_word_map:
                    prev_idx -= 1
                    
                # Look for the nearest mapped token after this one
                next_idx = token_idx + 1
                while next_idx < len(tokens) and next_idx not in token_to_word_map:
                    next_idx += 1
                
                # Assign to the closest mapped word
                if prev_idx >= 0 and prev_idx in token_to_word_map:
                    token_to_word_map[token_idx] = token_to_word_map[prev_idx]
                    print(f"Position match: Token '{token_text}' -> Word '{words[token_to_word_map[token_idx]]}' (based on previous)")
                elif next_idx < len(tokens) and next_idx in token_to_word_map:
                    token_to_word_map[token_idx] = token_to_word_map[next_idx]
                    print(f"Position match: Token '{token_text}' -> Word '{words[token_to_word_map[token_idx]]}' (based on next)")
                elif word_idx > 0:
                    # Fallback to the last word if no nearby tokens are mapped
                    token_to_word_map[token_idx] = min(word_idx - 1, len(words) - 1)
                    print(f"Fallback match: Token '{token_text}' -> Word '{words[token_to_word_map[token_idx]]}'")
    
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
