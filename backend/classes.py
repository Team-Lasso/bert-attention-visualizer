from typing import List
from pydantic import BaseModel


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