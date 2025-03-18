import requests
import json
import os

# Get the API URL from environment or use localhost
API_URL = os.environ.get("HF_SPACE_URL", "http://localhost:7860")

def test_models_endpoint():
    """Test the /models endpoint"""
    url = f"{API_URL}/models"
    print(f"Testing GET {url}")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("-" * 50)

def test_tokenize_endpoint():
    """Test the /tokenize endpoint"""
    url = f"{API_URL}/tokenize"
    print(f"Testing POST {url}")
    
    data = {
        "text": "I ate an apple.",
        "model_name": "bert-base-uncased"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("-" * 50)

def test_attention_endpoint():
    """Test the /attention endpoint"""
    url = f"{API_URL}/attention"
    print(f"Testing POST {url}")
    
    data = {
        "text": "I ate an apple.",
        "model_name": "bert-base-uncased"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            # Just print a sample since attention data is large
            result = response.json()
            print(f"Tokens: {result.get('tokens', [])}")
            print(f"Attention matrix shape: {len(result.get('attention', []))}x{len(result.get('attention', [])[0]) if result.get('attention', []) else 0}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("-" * 50)

if __name__ == "__main__":
    print(f"Testing API at {API_URL}")
    test_models_endpoint()
    test_tokenize_endpoint()
    test_attention_endpoint() 