
from classes import *
from helpers import *
from core.app import app
from routes import tokenize, predict_mask, attention, attention_comparison


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint that provides information about the API
    """
    return {
        "message": "BERT Attention Visualizer API",
        "version": "1.0",
        "endpoints": {
            "GET /models": "Get available models",
            "POST /tokenize": "Tokenize text",
            "POST /predict_masked": "Predict masked token",
            "POST /attention": "Get attention matrices",
            "POST /attention_comparison": "Compare attention before and after word replacement"
        },
        "docs": "/docs"  # Link to API documentation
    }


@app.get("/models")
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


app.include_router(tokenize.router);
app.include_router(predict_mask.router);
app.include_router(attention.router);
app.include_router(attention_comparison.router);

 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 