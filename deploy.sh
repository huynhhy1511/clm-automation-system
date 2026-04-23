# 1. Tu dong keo code moi tu Git
echo "Dang lay code moi tu Git..."
git pull

# 2. Cap nhat cấu hình Nginx
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
        proxy_pass http://localhost:5679;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Prefix /n8n;

        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 86400;
        proxy_buffering off;
    }

    # FIX LỖI TRANG TRẮNG: Bắt các file assets n8n gọi từ root
    location ~* ^/(assets|n8nassets|n8nstatic|n8nfavicon) {
        proxy_pass http://localhost:5679;
        proxy_set_header Host \$host;
    }

    location = /n8n {
        return 301 \$scheme://\$host/n8n/;
    }
}
EOF

echo "Dang kiem tra va khoi dong lai Nginx..."
sudo nginx -t && sudo systemctl restart nginx

# 3. Build va khoi dong lai Docker
echo "Dang build va khoi dong lai Docker containers..."
docker compose up -d --build

echo "Hoan tat! Hay thu truy cap: https://ezliving.id.vn/n8n/"
