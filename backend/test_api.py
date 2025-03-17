import requests
import json
import sys

API_URL = "http://localhost:8000"

def test_models():
    """Test the models endpoint"""
    try:
        response = requests.get(f"{API_URL}/models")
        if response.status_code == 200:
            models = response.json()["models"]
            print(f"✅ Available models: {json.dumps(models, indent=2)}")
            return True
        else:
            print(f"❌ Failed to fetch models: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error fetching models: {str(e)}")
        return False

def test_tokenize(model_name="bert-base-uncased"):
    """Test the tokenize endpoint"""
    test_sentence = "The cat sat on the mat."
    try:
        response = requests.post(
            f"{API_URL}/tokenize",
            json={"text": test_sentence, "model_name": model_name}
        )
        if response.status_code == 200:
            tokens = response.json()["tokens"]
            print(f"✅ Tokenization for {model_name}:")
            for i, token in enumerate(tokens):
                print(f"  {i}: {token['text']}")
            return True
        else:
            print(f"❌ Failed to tokenize: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error tokenizing: {str(e)}")
        return False

def test_mask_prediction(model_name="bert-base-uncased"):
    """Test the mask prediction endpoint"""
    test_sentence = "The cat sat on the mat."
    mask_index = 1  # "cat" token
    try:
        response = requests.post(
            f"{API_URL}/predict_masked",
            json={
                "text": test_sentence,
                "mask_index": mask_index,
                "model_name": model_name,
                "top_k": 5
            }
        )
        if response.status_code == 200:
            predictions = response.json()["predictions"]
            print(f"✅ Mask predictions for {model_name}:")
            for i, pred in enumerate(predictions):
                print(f"  {i+1}. {pred['word']}: {pred['score'] * 100:.2f}%")
            return True
        else:
            print(f"❌ Failed to get predictions: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error getting predictions: {str(e)}")
        return False

def main():
    print("🧪 Testing PyTorch BERT/RoBERTa API...")
    
    # Test fetching models
    if not test_models():
        print("⚠️ Models endpoint failed, make sure the server is running")
        sys.exit(1)
    
    print("\n----------------------------\n")
    
    # Test BERT tokenization
    if not test_tokenize("bert-base-uncased"):
        print("⚠️ BERT tokenization failed")
    
    print("\n----------------------------\n")
    
    # Test RoBERTa tokenization
    if not test_tokenize("roberta-base"):
        print("⚠️ RoBERTa tokenization failed")
    
    print("\n----------------------------\n")
    
    # Test BERT mask prediction
    if not test_mask_prediction("bert-base-uncased"):
        print("⚠️ BERT mask prediction failed")
    
    print("\n----------------------------\n")
    
    # Test RoBERTa mask prediction
    if not test_mask_prediction("roberta-base"):
        print("⚠️ RoBERTa mask prediction failed")
    
    print("\n🎉 API tests completed!")

if __name__ == "__main__":
    main() 