// JT Mobamba Newsletter Subscription API
// Serverless function for Vercel, Netlify, or similar platforms
// Uses Resend API for sending confirmation emails

// =============================================================================
// CONFIGURATION - Set your Resend API key as an environment variable
// =============================================================================
// Environment variable: RESEND_API_KEY
// Domain: jtmobamba.com (must be verified in Resend dashboard)

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'newsletter@jtmobamba.com';
const FROM_NAME = 'JT Mobamba Electronics';

// Email template for welcome/confirmation
function getWelcomeEmailHTML(email) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to JT Mobamba Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #FFF8F0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF8F0;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #553624; padding: 32px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">JT Mobamba</h1>
                            <p style="color: #E8C5B0; margin: 8px 0 0 0; font-size: 14px;">Premium Electronics</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Welcome to the Family!</h2>

                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                                Thank you for subscribing to the JT Mobamba newsletter! You're now part of an exclusive community that gets first access to:
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="width: 40px; vertical-align: top;">
                                                    <div style="width: 32px; height: 32px; background-color: #FFF8F0; border-radius: 8px; text-align: center; line-height: 32px;">
                                                        <span style="color: #C4815D; font-size: 16px;">%</span>
                                                    </div>
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    <p style="margin: 0; color: #1a1a1a; font-weight: 500;">Exclusive Deals & Discounts</p>
                                                    <p style="margin: 4px 0 0 0; color: #888888; font-size: 14px;">Up to 50% off on selected items</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="width: 40px; vertical-align: top;">
                                                    <div style="width: 32px; height: 32px; background-color: #FFF8F0; border-radius: 8px; text-align: center; line-height: 32px;">
                                                        <span style="color: #C4815D; font-size: 16px;">★</span>
                                                    </div>
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    <p style="margin: 0; color: #1a1a1a; font-weight: 500;">New Product Launches</p>
                                                    <p style="margin: 4px 0 0 0; color: #888888; font-size: 14px;">Be first to know about latest arrivals</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="width: 40px; vertical-align: top;">
                                                    <div style="width: 32px; height: 32px; background-color: #FFF8F0; border-radius: 8px; text-align: center; line-height: 32px;">
                                                        <span style="color: #C4815D; font-size: 16px;">⚡</span>
                                                    </div>
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    <p style="margin: 0; color: #1a1a1a; font-weight: 500;">Flash Sales & Limited Offers</p>
                                                    <p style="margin: 4px 0 0 0; color: #888888; font-size: 14px;">Time-sensitive deals just for subscribers</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 32px 0;">
                                <a href="https://jtmobamba.com/deals.html" style="display: inline-block; background-color: #C4815D; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                    Shop Current Deals
                                </a>
                            </div>

                            <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                                You're receiving this email because you subscribed with <strong>${email}</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #553624; padding: 24px 32px; text-align: center;">
                            <p style="color: #E8C5B0; font-size: 14px; margin: 0 0 8px 0;">
                                JT Mobamba Electronics
                            </p>
                            <p style="color: #E8C5B0; font-size: 12px; margin: 0;">
                                Premium electronics for modern living
                            </p>
                            <p style="color: #E8C5B0; font-size: 12px; margin: 16px 0 0 0;">
                                <a href="https://jtmobamba.com" style="color: #E8C5B0; text-decoration: underline;">Visit Website</a> |
                                <a href="https://jtmobamba.com/unsubscribe" style="color: #E8C5B0; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>

                <p style="color: #888888; font-size: 12px; margin-top: 24px;">
                    &copy; 2026 JT Mobamba Electronics. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// Plain text version
function getWelcomeEmailText(email) {
    return `
Welcome to JT Mobamba Newsletter!

Thank you for subscribing! You're now part of an exclusive community that gets first access to:

- Exclusive Deals & Discounts - Up to 50% off on selected items
- New Product Launches - Be first to know about latest arrivals
- Flash Sales & Limited Offers - Time-sensitive deals just for subscribers

Shop our current deals: https://jtmobamba.com/deals.html

You're receiving this email because you subscribed with ${email}

---
JT Mobamba Electronics
Premium electronics for modern living
https://jtmobamba.com

To unsubscribe: https://jtmobamba.com/unsubscribe
    `;
}

// Main handler function (works with Vercel, Netlify, etc.)
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { email } = req.body;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Get API key from environment
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            console.error('RESEND_API_KEY not configured');
            return res.status(500).json({ success: false, message: 'Email service not configured' });
        }

        // Send welcome email via Resend
        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [email],
                subject: 'Welcome to JT Mobamba Newsletter!',
                html: getWelcomeEmailHTML(email),
                text: getWelcomeEmailText(email),
            }),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Newsletter subscription successful:', email);
            return res.status(200).json({
                success: true,
                message: 'Subscription successful! Check your email for confirmation.',
                id: result.id
            });
        } else {
            console.error('Resend API error:', result);
            return res.status(500).json({
                success: false,
                message: result.message || 'Failed to send confirmation email'
            });
        }

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again later.'
        });
    }
}

// For Netlify Functions format
export async function netlifyHandler(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
    }

    try {
        const { email } = JSON.parse(event.body);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid email address' }) };
        }

        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Email service not configured' }) };
        }

        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [email],
                subject: 'Welcome to JT Mobamba Newsletter!',
                html: getWelcomeEmailHTML(email),
                text: getWelcomeEmailText(email),
            }),
        });

        const result = await response.json();

        if (response.ok) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Subscription successful!', id: result.id })
            };
        } else {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, message: result.message || 'Failed to send email' })
            };
        }

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'An error occurred' })
        };
    }
}
