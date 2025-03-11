import uvicorn

if __name__ == "__main__":
    print("Starting BERT Attention Visualizer Backend...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
    print("Server stopped.") 