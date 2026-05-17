#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/mango-daily"
REPO_URL="https://github.com/dlxdjj/mango-daily.git"
API_HOST="api.81.68.126.106.sslip.io"

echo "[1/7] Installing system packages"
sudo apt update
sudo apt install -y git nginx build-essential curl certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1; then
  echo "[2/7] Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "[2/7] Node.js already installed: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[3/7] Installing PM2"
  sudo npm install -g pm2
else
  echo "[3/7] PM2 already installed"
fi

echo "[4/7] Cloning/updating app"
sudo mkdir -p /var/www
sudo chown -R "$USER:$USER" /var/www
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git pull
fi

cd "$APP_DIR"
npm ci
npm run build:server

echo "[5/7] Preparing environment"
mkdir -p packages/server/uploads
if [ ! -f packages/server/.env ]; then
  cp packages/server/.env.example packages/server/.env
  echo ""
  echo "Created packages/server/.env"
  echo "Edit it now and fill DEEPSEEK_API_KEY and OPENAI_API_KEY."
  echo ""
  nano packages/server/.env
fi

echo "[6/7] Configuring PM2"
pm2 start ecosystem.config.cjs || pm2 restart mango-daily-api
pm2 save

echo "[7/7] Configuring Nginx"
sudo tee /etc/nginx/sites-available/mango-daily-api >/dev/null <<NGINX
server {
  listen 80;
  server_name ${API_HOST};

  client_max_body_size 20M;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/mango-daily-api /etc/nginx/sites-enabled/mango-daily-api
sudo nginx -t
sudo systemctl reload nginx

echo "Issuing HTTPS certificate for ${API_HOST}"
sudo certbot --nginx -d "$API_HOST"

echo ""
echo "Done. Test:"
echo "https://${API_HOST}/api/health"
