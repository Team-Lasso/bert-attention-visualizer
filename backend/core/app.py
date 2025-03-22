from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the app instance to be exported
app = FastAPI(title="BERT Attention Visualizer Backend")

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)