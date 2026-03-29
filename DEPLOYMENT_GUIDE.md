# JT Mobamba Website - GoDaddy Deployment Guide

This guide explains how to deploy the JT Mobamba website with MongoDB authentication to your jtmobamba.com domain on GoDaddy.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup MongoDB Atlas](#setup-mongodb-atlas)
3. [Deployment Options](#deployment-options)
4. [Option A: GoDaddy VPS Hosting](#option-a-godaddy-vps-hosting)
5. [Option B: Render + GoDaddy Domain](#option-b-render--godaddy-domain)
6. [Option C: Railway + GoDaddy Domain](#option-c-railway--godaddy-domain)
7. [Configure Resend Email](#configure-resend-email)
8. [Connect Your Domain](#connect-your-domain)
9. [SSL Certificate Setup](#ssl-certificate-setup)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GoDaddy account with jtmobamba.com domain
- [ ] Node.js 18+ installed locally
- [ ] Git installed
- [ ] MongoDB Atlas account (free tier available)
- [ ] Resend account for emails

---

## Setup MongoDB Atlas (Cloud Database)

MongoDB Atlas provides a free cloud database that works with any hosting provider.

### Step 1: Create MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project called "JT Mobamba"

### Step 2: Create a Cluster

1. Click **"Build a Database"**
2. Select **"M0 FREE"** tier
3. Choose a cloud provider (AWS recommended)
4. Select a region close to your users (e.g., London for UK)
5. Click **"Create Cluster"**

### Step 3: Configure Database Access

1. Go to **"Database Access"** in the sidebar
2. Click **"Add New Database User"**
3. Create a user:
   - Username: `jtmobamba_admin`
   - Password: Generate a secure password (save this!)
   - Role: "Read and write to any database"
4. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **"Network Access"** in the sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production: Add your server's specific IP address
5. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **"Database"** > Click **"Connect"**
2. Select **"Connect your application"**
3. Copy the connection string, it looks like:
   ```
   mongodb+srv://jtmobamba_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `mongodb+srv://...mongodb.net/jtmobamba?retryWrites=true&w=majority`

---

## Deployment Options

### Understanding GoDaddy Hosting Limitations

**Important:** GoDaddy's standard shared hosting does NOT support Node.js applications. You have three options:

| Option | Cost | Difficulty | Best For |
|--------|------|------------|----------|
| GoDaddy VPS | £10-50/month | Advanced | Full control, custom server |
| Render (free) + GoDaddy Domain | Free-£7/month | Easy | Recommended for beginners |
| Railway + GoDaddy Domain | Free-£5/month | Easy | Simple deployment |

---

## Option A: GoDaddy VPS Hosting

Use this if you have a GoDaddy VPS or dedicated server.

### Step 1: Purchase GoDaddy VPS

1. Go to [godaddy.com](https://godaddy.com)
2. Navigate to **Hosting** > **VPS Hosting**
3. Choose a plan (minimum 1GB RAM recommended)
4. Complete purchase

### Step 2: Connect to Your VPS

```bash
# SSH into your server
ssh root@your-server-ip
```

### Step 3: Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 5: Clone and Setup Project

```bash
# Create app directory
mkdir -p /var/www/jtmobamba
cd /var/www/jtmobamba

# Clone your repository (or upload files)
git clone https://github.com/yourusername/jt-mobamba.git .

# Install dependencies
npm install

# Create environment file
nano .env
```

Add your environment variables:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://jtmobamba_admin:yourpassword@cluster0.xxxxx.mongodb.net/jtmobamba
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=newsletter@jtmobamba.com
FRONTEND_URL=https://jtmobamba.com
```

### Step 6: Start Application with PM2

```bash
# Start the application
pm2 start server.js --name "jtmobamba"

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 7: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/jtmobamba
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name jtmobamba.com www.jtmobamba.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/jtmobamba /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Install SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d jtmobamba.com -d www.jtmobamba.com

# Auto-renewal is set up automatically
```

---

## Option B: Render + GoDaddy Domain (Recommended)

Render provides free Node.js hosting with easy deployment.

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Push Code to GitHub

```bash
# Initialize git repository
cd "C:\Users\mobam\Documents\Project development\JT-Mobamba website"
git init
git add .
git commit -m "Initial commit - JT Mobamba Website"

# Create GitHub repository and push
# Go to github.com, create new repo "jt-mobamba-website"
git remote add origin https://github.com/yourusername/jt-mobamba-website.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** > **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `jt-mobamba`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `MONGODB_URI` = `your-mongodb-connection-string`
   - `JWT_SECRET` = `your-jwt-secret`
   - `SESSION_SECRET` = `your-session-secret`
   - `RESEND_API_KEY` = `your-resend-api-key`
6. Click **"Create Web Service"**

Your app will be deployed at: `https://jt-mobamba.onrender.com`

### Step 4: Connect GoDaddy Domain

1. In Render dashboard, go to your service
2. Click **"Settings"** > **"Custom Domain"**
3. Add `jtmobamba.com`
4. Render will provide DNS records

In GoDaddy DNS settings, add:
```
Type: CNAME
Name: @
Value: jt-mobamba.onrender.com

Type: CNAME
Name: www
Value: jt-mobamba.onrender.com
```

---

## Option C: Railway + GoDaddy Domain

Railway offers simple deployment with generous free tier.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Deploy from GitHub

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway auto-detects Node.js

### Step 3: Add Environment Variables

In Railway dashboard:
1. Click on your service
2. Go to **"Variables"** tab
3. Add all environment variables from `.env.example`

### Step 4: Connect Domain

1. Go to **"Settings"** > **"Domains"**
2. Add custom domain: `jtmobamba.com`
3. Railway provides a CNAME target

In GoDaddy, update DNS:
```
Type: CNAME
Name: @
Value: [railway-provided-value].railway.app
```

---

## Configure Resend Email

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free account

### Step 2: Verify Domain

1. Go to **"Domains"**
2. Click **"Add Domain"**
3. Enter `jtmobamba.com`
4. Add the DNS records to GoDaddy:

In GoDaddy DNS Manager, add these records (provided by Resend):

```
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM Record
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

# Optional: DMARC
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

### Step 3: Get API Key

1. Go to **"API Keys"**
2. Click **"Create API Key"**
3. Copy the key (starts with `re_`)
4. Add to your environment variables

---

## Connect Your Domain

### In GoDaddy DNS Manager:

1. Log into GoDaddy
2. Go to **My Products** > **DNS**
3. Select `jtmobamba.com`

### For Render/Railway Deployment:

Remove existing A records and add:
```
Type: CNAME
Name: @
Value: [your-service].onrender.com (or railway.app)
TTL: 600

Type: CNAME
Name: www
Value: [your-service].onrender.com
TTL: 600
```

### For GoDaddy VPS:

```
Type: A
Name: @
Value: [your-vps-ip-address]
TTL: 600

Type: A
Name: www
Value: [your-vps-ip-address]
TTL: 600
```

---

## SSL Certificate Setup

### Render/Railway:
SSL is automatic and free!

### GoDaddy VPS:
Use Let's Encrypt (free):
```bash
sudo certbot --nginx -d jtmobamba.com -d www.jtmobamba.com
```

---

## Testing Your Deployment

### 1. Check API Health
```
https://jtmobamba.com/api/health
```
Should return:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 2. Test Authentication
- Register: POST to `/api/auth/register`
- Login: POST to `/api/auth/login`

### 3. Test Newsletter
- Subscribe via the website form
- Check for welcome email

---

## Troubleshooting

### MongoDB Connection Failed
- Check IP whitelist in MongoDB Atlas
- Verify connection string is correct
- Ensure password doesn't have special characters that need encoding

### Site Not Loading
- Check if DNS has propagated: [dnschecker.org](https://dnschecker.org)
- DNS changes can take up to 48 hours

### SSL Certificate Issues
- Ensure domain points to correct server before requesting SSL
- Try clearing browser cache

### Application Errors
```bash
# Check logs on VPS
pm2 logs jtmobamba

# Check logs on Render
# Go to dashboard > Logs tab
```

---

## Quick Reference

| Service | URL |
|---------|-----|
| MongoDB Atlas | [cloud.mongodb.com](https://cloud.mongodb.com) |
| Resend | [resend.com](https://resend.com) |
| Render | [render.com](https://render.com) |
| Railway | [railway.app](https://railway.app) |
| GoDaddy DNS | [dcc.godaddy.com](https://dcc.godaddy.com) |

---

## Environment Variables Checklist

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
SESSION_SECRET=your-secret
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=newsletter@jtmobamba.com
EMAIL_FROM_NAME=JT Mobamba Electronics
FRONTEND_URL=https://jtmobamba.com
```

---

## Support

- MongoDB Atlas Docs: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- Resend Docs: [resend.com/docs](https://resend.com/docs)
- Render Docs: [render.com/docs](https://render.com/docs)
- Railway Docs: [docs.railway.app](https://docs.railway.app)
