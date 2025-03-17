FROM python:3.9-slim

WORKDIR /code

# Copy requirements and install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy all files from backend to the root of the container
COPY . /code/

# List files to verify
RUN ls -la /code/

# Expose the port that the app will run on
EXPOSE 7860

# Run the application with the correct settings for HF Spaces
CMD ["python", "app_hf.py"]
