from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.tokenize import router as tokenize_router
from routes.mask_prediction import router as mask_router
from routes.attention import router as attention_router
from routes.attention_comparison import router as attention_comparison_router
from routes.models import router as models_router

app = FastAPI(title="BERT Attention Visualizer Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tokenize_router, prefix="/tokenize")
app.include_router(mask_router, prefix="/predict_masked")
app.include_router(attention_router, prefix="/attention")
app.include_router(attention_comparison_router, prefix="/attention_comparison")
app.include_router(models_router, prefix="/models")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
