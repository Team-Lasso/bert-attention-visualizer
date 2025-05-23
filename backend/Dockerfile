FROM python:3.9-slim

WORKDIR /code

# Create a directory for model cache with appropriate permissions
RUN mkdir -p /code/model_cache && chmod -R 777 /code/model_cache

# Set environment variables for model caching
ENV HF_HOME=/code/model_cache
ENV TRANSFORMERS_CACHE=/code/model_cache
ENV HUGGINGFACE_HUB_CACHE=/code/model_cache

# Copy requirements and install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Download NLTK data during build
RUN python -m nltk.downloader punkt averaged_perceptron_tagger stopwords
RUN mkdir -p /usr/local/share/nltk_data && chmod -R 777 /usr/local/share/nltk_data

# Copy all files from backend to the root of the container
COPY . /code/

# List files to verify
RUN ls -la /code/

# Expose the port that the app will run on
EXPOSE 7860

# Run the application with the correct settings for HF Spaces
CMD ["python", "app_hf.py"]
