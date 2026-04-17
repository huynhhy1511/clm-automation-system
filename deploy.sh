#!/bin/bash

# Script tu dong cap nhat Nginx va Docker cho ezliving.id.vn

echo "Dang cap nhat cấu hình Nginx..."

sudo tee /etc/nginx/sites-available/ezliving <<EOF
server {
    listen 80;
    server_name ezliving.id.vn www.ezliving.id.vn;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ezliving.id.vn www.ezliving.id.vn;

    ssl_certificate /etc/letsencrypt/live/ezliving.id.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ezliving.id.vn/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /n8n/ {
        proxy_pass http://localhost:8888/n8n/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 86400;
    }

    # Bắt các đường dẫn assets bị dính chữ cho n8n
    location ~ ^/(n8nassets|n8nstatic) {
        proxy_pass http://localhost:8888;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /n8n {
        return 301 \$scheme://\$host/n8n/;
    }
}
EOF

echo "Dang kiem tra va khoi dong lai Nginx..."
sudo nginx -t && sudo systemctl restart nginx

echo "Dang khoi dong lai n8n..."
docker compose up -d n8n

echo "Hoan tat! Hay thu truy cap https://ezliving.id.vn/n8n/"
