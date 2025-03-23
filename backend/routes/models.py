from fastapi import APIRouter
from models import MODEL_CONFIGS
router = APIRouter()


@router.get("/")
async def get_available_models():
    """Get list of available models"""
    return {
        "models": [
            {
                "id": model_id,
                "name": config["name"],
            } for model_id, config in MODEL_CONFIGS.items()
        ]
    }