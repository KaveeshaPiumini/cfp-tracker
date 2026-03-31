# CFP Tracker — Setup Guide

## Stack Overview

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend & API | Next.js 15 (App Router) | Vercel (free) |
| Database | PostgreSQL (Supabase) | Supabase (free) |
| Identity Provider | WSO2 Thunder v0.30.0 | Oracle Cloud Always Free |

---

## Step 1 — Provision Oracle Cloud Always Free VM (for Thunder)

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) (Always Free, no charge after trial)
2. Create an **Ampere A1 ARM** VM instance:
   - Shape: `VM.Standard.A1.Flex` (2 OCPU, 12 GB RAM)
   - Image: Ubuntu 22.04 LTS
   - Assign a **public IP address**
3. In the VM's **Security List**, add an **Ingress Rule**:
   - Source: `0.0.0.0/0`
   - Protocol: TCP
   - Destination Port: `443`

## Step 2 — Install Docker + Nginx + Certbot on the VM

SSH into your VM and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Open firewall on the OS level
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
```

## Step 3 — Point a Free Domain to Your VM

Option A — Use a free subdomain from [nip.io](https://nip.io):
- Your domain will be `<vm-public-ip>.nip.io` (no DNS setup required)

Option B — Register a free subdomain at [freemyip.com](https://freemyip.com) or use Cloudflare with a free domain.

## Step 4 — Deploy Thunder via Docker Compose

```bash
# Download the Docker Compose file
curl -o docker-compose.yml \
  https://raw.githubusercontent.com/asgardeo/thunder/v0.30.0/install/quick-start/docker-compose.yml

# Start Thunder (runs setup + server)
docker compose up -d

# Check logs (note the Sample App ID in setup logs)
docker compose logs -f
```

Thunder starts on **port 8090** internally.

## Step 5 — Configure Nginx Reverse Proxy with TLS

Create `/etc/nginx/sites-available/thunder`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # Certbot will fill these in
    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass https://localhost:8090;
        proxy_ssl_verify off;          # Thunder uses self-signed cert internally
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and get a TLS cert:

```bash
sudo ln -s /etc/nginx/sites-available/thunder /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com   # Follow prompts
sudo systemctl reload nginx
```

## Step 6 — Register the CFP App in Thunder Console

1. Open `https://your-domain.com/console` and log in (`admin` / `admin`)
2. Navigate to **Applications → New Application**
3. Create an OAuth2 application:
   - **Name**: CFP Tracker
   - **Grant type**: Authorization Code
   - **PKCE**: Required
   - **Redirect URIs**:
     ```
     https://your-vercel-domain.vercel.app/api/auth/callback
     http://localhost:3000/api/auth/callback
     ```
4. Copy the **Client ID** from the application settings

> ⚠️ Change the admin password after the first login!

## Step 7 — Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and paste + run the contents of `supabase/schema.sql`
4. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

## Step 8 — Configure Environment Variables

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
THUNDER_BASE_URL=https://your-domain.com
THUNDER_CLIENT_ID=<from Thunder console>
THUNDER_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/auth/callback
NEXT_PUBLIC_THUNDER_BASE_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>

SESSION_SECRET=$(openssl rand -hex 32)
SESSION_COOKIE_NAME=cfp_session
```

## Step 9 — Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

> For local testing with Thunder on Oracle Cloud, set `THUNDER_REDIRECT_URI=http://localhost:3000/api/auth/callback` in `.env.local`. You'll need to add this redirect URI in the Thunder console too.

## Step 10 — Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In **Environment Variables**, add all keys from `.env.local`
4. Set `THUNDER_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Click **Deploy**

---

## Updating Thunder OIDC Issuer

Thunder's ID tokens are issued with the `iss` claim set to `THUNDER_BASE_URL`. The app validates this automatically. If you change the domain, update `THUNDER_BASE_URL` in your Vercel env vars and redeploy.
