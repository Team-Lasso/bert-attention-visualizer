from transformers import BertForMaskedLM, RobertaForMaskedLM, AutoTokenizer, BertModel, RobertaModel, DistilBertForMaskedLM, DistilBertModel, AutoModelForMaskedLM
import nltk


# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('taggers/averaged_perceptron_tagger')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('averaged_perceptron_tagger')
    nltk.download('stopwords')

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
    },
    "distilbert-base-uncased": {
        "name": "DistilBERT Base Uncased",
        "model_class": DistilBertForMaskedLM,
        "tokenizer_class": AutoTokenizer,
        "base_model_class": DistilBertModel
    },
    "EdwinXhen/TinyBert_6Layer_MLM": {
        "name": "TinyBERT 6 Layer",
        "model_class": "custom",
        "tokenizer_class": AutoTokenizer,
        "base_model_class": BertModel
    }
}

models = {}
tokenizers = {}

def load_model(model_type, debug=False):
    if model_type.lower() == "custom" or model_type == "EdwinXhen/TinyBert_6Layer_MLM":
        # Load custom model from Hugging Face repository
        custom_repo = "EdwinXhen/TinyBert_6Layer_MLM"
        if debug:
            print(f"[DEBUG] Loading custom model from HuggingFace repository: {custom_repo}")
        tokenizer = AutoTokenizer.from_pretrained(custom_repo)
        model = AutoModelForMaskedLM.from_pretrained(custom_repo, output_attentions=True)
        return tokenizer, model
    # Handle other models with existing logic
    # This is a placeholder for the existing model loading logic
    return None, None
