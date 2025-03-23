from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import RedirectResponse
from routes.tokenize import router as tokenize_router
from routes.mask_prediction import router as mask_router
from routes.attention import router as attention_router
from routes.attention_comparison import router as attention_comparison_router
from routes.models import router as models_router

app = FastAPI(title="BERT Attention Visualizer Backend")

# Ensure the server correctly identifies forwarded HTTPS requests
@app.middleware("http")
async def force_https(request: Request, call_next):
    # Check if request is HTTP and needs to be upgraded to HTTPS
    forwarded_proto = request.headers.get("x-forwarded-proto")
    
    if forwarded_proto == "http":
        # Redirect to HTTPS if accessed via HTTP
        https_url = f"https://{request.headers['host']}{request.url.path}"
        if request.query_params:
            https_url += f"?{request.query_params}"
        return RedirectResponse(url=https_url, status_code=301)  # Permanent redirect
        
    # Continue with the request if already HTTPS or no proto header
    return await call_next(request)

# Restrict CORS to your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trust proxy headers for proper HTTPS handling
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Include routers
app.include_router(tokenize_router, prefix="/tokenize")
app.include_router(mask_router, prefix="/predict_masked")
app.include_router(attention_router, prefix="/attention")
app.include_router(attention_comparison_router, prefix="/attention_comparison")
app.include_router(models_router, prefix="/models")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
