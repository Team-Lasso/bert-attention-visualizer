# Hugging Face Spaces entry point
import os
import uvicorn
from app import app

# This file gets copied to the root directory in the Docker container
# and serves as the entry point for Hugging Face Spaces

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 7860))
    # Start the app
    uvicorn.run(app, host="0.0.0.0", port=port) 