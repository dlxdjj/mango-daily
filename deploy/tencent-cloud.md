# Tencent Cloud Deployment

Recommended server: Tencent Cloud Lighthouse, Ubuntu 22.04, 2C2G.

## 1. Install runtime

```bash
sudo apt update
sudo apt install -y git nginx build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Clone and build

```bash
cd /var/www
sudo git clone https://github.com/YOUR_NAME/mango-daily.git
sudo chown -R $USER:$USER /var/www/mango-daily
cd /var/www/mango-daily
npm ci
npm run build:server
```

## 3. Configure environment

```bash
cp packages/server/.env.example packages/server/.env
nano packages/server/.env
```

Production values:

```env
PORT=3001
DATABASE_PATH=/var/www/mango-daily/packages/server/data.db
UPLOAD_DIR=/var/www/mango-daily/packages/server/uploads
CORS_ORIGIN=https://YOUR_NAME.github.io
DEEPSEEK_API_KEY=...
OPENAI_API_KEY=...
```

## 4. Start API

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 5. Nginx reverse proxy

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/mango-daily-api
sudo nano /etc/nginx/sites-available/mango-daily-api
sudo ln -s /etc/nginx/sites-available/mango-daily-api /etc/nginx/sites-enabled/mango-daily-api
sudo nginx -t
sudo systemctl reload nginx
```

For HTTPS without buying a domain, this project can use nip.io:

```text
api.81.68.126.106.nip.io
```

That hostname automatically resolves to `81.68.126.106`, so GitHub Pages can call:

```text
https://api.81.68.126.106.nip.io
```

Install certbot and issue SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.81.68.126.106.nip.io
```

## 6. Update deployment

```bash
cd /var/www/mango-daily
git pull
npm ci
npm run build:server
pm2 restart mango-daily-api
```
