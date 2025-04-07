from transformers import BertForMaskedLM, RobertaForMaskedLM, AutoTokenizer, BertModel, RobertaModel, DistilBertForMaskedLM, DistilBertModel
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
    "huawei-noah/TinyBERT_General_6L_768D": {
        "name": "TinyBERT (6 layers)",
        "model_class": BertForMaskedLM,
        "tokenizer_class": AutoTokenizer,
        "base_model_class": BertModel
    }
}

models = {}
tokenizers = {}
