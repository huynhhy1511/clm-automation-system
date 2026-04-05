FROM python:3.11-slim

WORKDIR /app

# Khuyến nghị cài đặt các thư viện cần thiết trước để tận dụng cache của Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn vào image
COPY . .

# Expose port mặc định của FastAPI
EXPOSE 8000

# Lệnh dùng để khởi chạy backend (FastAPI chạy bằng uvicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
