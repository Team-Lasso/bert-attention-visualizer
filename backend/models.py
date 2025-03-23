from transformers import BertForMaskedLM, RobertaForMaskedLM, AutoTokenizer, BertModel, RobertaModel
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
    }
}

models = {}
tokenizers = {}
