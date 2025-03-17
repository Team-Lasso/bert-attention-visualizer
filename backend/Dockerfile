FROM python:3.9-slim

WORKDIR /code

# Copy requirements and install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy all files from backend to the root of the container
COPY . /code/

# Create an entry point script at the root
RUN echo 'from app import app' >/code/app_hf.py &&
    echo 'import uvicorn' >>/code/app_hf.py &&
    echo 'import os' >>/code/app_hf.py &&
    echo 'if __name__ == "__main__":' >>/code/app_hf.py &&
    echo '    port = int(os.environ.get("PORT", 7860))' >>/code/app_hf.py &&
    echo '    uvicorn.run(app, host="0.0.0.0", port=port)' >>/code/app_hf.py

# List files to verify
RUN ls -la /code/

# Expose the port that the app will run on
EXPOSE 7860

# Run the application with the correct settings for HF Spaces
CMD ["python", "app_hf.py"]
