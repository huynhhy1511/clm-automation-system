FROM python:3.12-slim

WORKDIR /app

# Install dependencies before copying the rest of the application
# This is to utilize Docker cache and speed up subsequent builds
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the API port
EXPOSE 8000

# Command to run the application using Uvicorn with hot reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
