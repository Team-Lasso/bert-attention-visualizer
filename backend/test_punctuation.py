import requests
import json

API_URL = "http://localhost:8000"

def test_tokenize_with_punctuation():
    """Test tokenization with different punctuation cases"""
    test_cases = [
        "The cat sat on the mat.",
        "Hello, world! How are you?",
        "I'm using BERT: it's a great model.",
        "This sentence has commas, periods. And question marks?",
        "Multiple punctuation marks!?!?",
        "Parentheses (like these) should work.",
        "Email addresses like example@email.com should be handled."
    ]
    
    for model_name in ["bert-base-uncased", "roberta-base"]:
        print(f"\n\n=== Testing {model_name} tokenization with punctuation ===")
        
        for test_sentence in test_cases:
            print(f"\nSentence: \"{test_sentence}\"")
            
            try:
                response = requests.post(
                    f"{API_URL}/tokenize",
                    json={"text": test_sentence, "model_name": model_name}
                )
                
                if response.status_code == 200:
                    tokens = response.json()["tokens"]
                    print(f"Tokenized ({len(tokens)} tokens):")
                    for i, token in enumerate(tokens):
                        print(f"  {i}: {token['text']}")
                else:
                    print(f"❌ Failed to tokenize: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"❌ Error: {str(e)}")

def test_mask_prediction_with_punctuation():
    """Test mask prediction with sentences containing punctuation"""
    test_cases = [
        {"sentence": "The cat sat on the mat.", "mask_index": 1},  # "cat"
        {"sentence": "Hello, world! How are you?", "mask_index": 3},  # "how" 
        {"sentence": "I'm using BERT: it's a great model.", "mask_index": 2},  # "using"
        {"sentence": "This sentence has commas, periods.", "mask_index": 4}  # "commas"
    ]
    
    for model_name in ["bert-base-uncased", "roberta-base"]:
        print(f"\n\n=== Testing {model_name} mask prediction with punctuation ===")
        
        for test_case in test_cases:
            sentence = test_case["sentence"]
            
            # First tokenize to get the correct tokens
            try:
                tokenize_response = requests.post(
                    f"{API_URL}/tokenize",
                    json={"text": sentence, "model_name": model_name}
                )
                
                if tokenize_response.status_code != 200:
                    print(f"❌ Failed to tokenize: {tokenize_response.status_code}")
                    continue
                    
                tokens = tokenize_response.json()["tokens"]
                mask_index = test_case["mask_index"]
                
                if mask_index >= len(tokens):
                    print(f"❌ Invalid mask index {mask_index} for {len(tokens)} tokens")
                    continue
                    
                print(f"\nSentence: \"{sentence}\"")
                print(f"Masking token {mask_index}: \"{tokens[mask_index]['text']}\"")
                
                # Now try mask prediction
                response = requests.post(
                    f"{API_URL}/predict_masked",
                    json={
                        "text": sentence,
                        "mask_index": mask_index,
                        "model_name": model_name,
                        "top_k": 5
                    }
                )
                
                if response.status_code == 200:
                    predictions = response.json()["predictions"]
                    print(f"Top 5 predictions:")
                    for i, pred in enumerate(predictions[:5]):
                        print(f"  {i+1}. {pred['word']}: {pred['score'] * 100:.2f}%")
                else:
                    print(f"❌ Failed to get predictions: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🧪 Testing punctuation handling in the backend API")
    
    test_tokenize_with_punctuation()
    test_mask_prediction_with_punctuation()
    
    print("\n✅ Punctuation tests completed!") 