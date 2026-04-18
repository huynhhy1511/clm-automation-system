#!/bin/bash
set -e

echo "--- Initializing VPS Setup ---"

# 1. Update and install dependencies
apt-get update
apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx tar

# 2. Enable Docker and Nginx
systemctl enable --now docker
systemctl enable --now nginx

# 3. Create directory
mkdir -p /root/CLM
cd /root/CLM

# 4. Extract package (assuming it's in /root)
if [ -f "/root/clm_deploy.tar.gz" ]; then
    echo "--- Cleaning old files and extracting new package ---"
    rm -rf /root/CLM/*
    tar -xzf /root/clm_deploy.tar.gz -C /root/CLM
    rm /root/clm_deploy.tar.gz
fi

echo "--- Starting Docker Containers (with clean build) ---"
docker-compose down --remove-orphans || true
docker-compose up -d --build --force-recreate

# 6. Setup SSL for ezliving.id.vn
echo "--- Configuring SSL (Certbot) ---"
certbot --nginx -d ezliving.id.vn -d www.ezliving.id.vn --non-interactive --agree-tos -m admin@ezliving.id.vn || true

# 7. Apply Nginx Configuration from deploy.sh
echo "--- Fixing line endings and applying Nginx Multi-Service Config ---"
sed -i 's/\r$//' *.sh
chmod +x ./deploy.sh
./deploy.sh

echo "--- Setup Complete! ---"
docker ps
