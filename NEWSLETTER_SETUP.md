# JT Mobamba Newsletter Setup Guide

This guide explains how to set up the newsletter subscription system using Resend API.

## Overview

The newsletter system consists of:
- **Frontend** (`js/newsletter.js`): Handles form submissions and user notifications
- **Backend** (`api/subscribe.js`): Serverless function that sends emails via Resend API

## Step 1: Set Up Resend Account

1. Go to [Resend.com](https://resend.com) and create an account
2. Navigate to **API Keys** and create a new API key
3. Save your API key securely (you'll need it for deployment)

## Step 2: Verify Your Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain** and enter `jtmobamba.com`
3. Add the DNS records provided by Resend to your domain registrar:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT) - optional but recommended

4. Wait for verification (usually takes a few minutes to hours)

## Step 3: Deploy the API

### Option A: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to your project folder and run:
   ```bash
   vercel
   ```

3. Set the environment variable:
   ```bash
   vercel env add RESEND_API_KEY
   ```
   Enter your Resend API key when prompted.

4. Deploy:
   ```bash
   vercel --prod
   ```

### Option B: Deploy to Netlify

1. Create `netlify.toml` in your project root:
   ```toml
   [functions]
     directory = "api"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

2. Rename `api/subscribe.js` function export:
   ```javascript
   // Change the export at the bottom of the file
   export { netlifyHandler as handler };
   ```

3. Deploy to Netlify and add environment variable:
   - Go to Site Settings > Environment Variables
   - Add `RESEND_API_KEY` with your API key

### Option C: Deploy to Cloudflare Workers

1. Create a `wrangler.toml`:
   ```toml
   name = "jt-mobamba-newsletter"
   main = "api/subscribe.js"
   compatibility_date = "2024-01-01"

   [vars]
   # Don't put API key here - use secrets instead
   ```

2. Add your API key as a secret:
   ```bash
   wrangler secret put RESEND_API_KEY
   ```

3. Deploy:
   ```bash
   wrangler deploy
   ```

## Step 4: Update API Endpoint

After deploying, update the API endpoint in `js/newsletter.js`:

```javascript
// Change this line to your deployed API URL
this.apiEndpoint = 'https://your-deployment-url.com/api/subscribe';
```

For example:
- Vercel: `https://your-project.vercel.app/api/subscribe`
- Netlify: `https://your-site.netlify.app/.netlify/functions/subscribe`
- Cloudflare: `https://your-worker.workers.dev`

## Email Configuration

The system sends branded welcome emails that include:
- JT Mobamba branding with brown/cream color scheme
- Welcome message with benefits of subscribing
- Links to deals page and website
- Unsubscribe option

To customize the email template, edit the `getWelcomeEmailHTML()` function in `api/subscribe.js`.

## Testing

1. Open your website locally or deployed version
2. Enter an email in the newsletter form
3. Submit the form
4. Check for:
   - Success notification on the website
   - Welcome email in the inbox (check spam folder too)

## Troubleshooting

### "Email service not configured" error
- Ensure `RESEND_API_KEY` environment variable is set correctly

### Emails not being received
- Check if domain is verified in Resend dashboard
- Check spam/junk folder
- Verify the `from` email matches your verified domain

### CORS errors
- Ensure your API allows requests from your website domain
- Check the CORS headers in `api/subscribe.js`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Your Resend API key | Yes |

## Files Structure

```
JT-Mobamba website/
├── api/
│   └── subscribe.js      # Serverless API function
├── js/
│   ├── newsletter.js     # Frontend newsletter handler
│   └── shop.js           # Shop functionality
├── homepage.html         # Has newsletter form
├── deals.html           # Has newsletter form
└── NEWSLETTER_SETUP.md  # This file
```

## Support

For issues with:
- **Resend API**: Visit [Resend Documentation](https://resend.com/docs)
- **Vercel Deployment**: Visit [Vercel Docs](https://vercel.com/docs)
- **Netlify Deployment**: Visit [Netlify Docs](https://docs.netlify.com)
