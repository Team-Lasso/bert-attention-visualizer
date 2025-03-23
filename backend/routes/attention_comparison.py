from fastapi import APIRouter
from classes import *
from helpers import *
from attention_comparison_helpers import *
router = APIRouter()


@router.post("", response_model=AttentionComparisonResponse)
async def get_attention_comparison(request: ComparisonRequest):
    """
    Dispatcher for attention comparison - routes to the appropriate model-specific implementation
    """
    # Log request details
    print(f"\n\n=== ATTENTION COMPARISON REQUEST ===")
    print(f"Text: '{request.text}'")
    print(f"Masked index: {request.masked_index}")
    print(f"Replacement word: '{request.replacement_word}'")
    print(f"Model: {request.model_name}")
    
    # Dispatch based on model type
    if "roberta" in request.model_name.lower():
        return await get_attention_comparison_roberta(request)
    else:
        return await get_attention_comparison_bert(request)


