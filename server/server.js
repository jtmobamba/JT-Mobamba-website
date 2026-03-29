const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['*'];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for development
        }
    },
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const fileRoutes = require('./routes/files');
const databaseRoutes = require('./routes/database');
const sdkRoutes = require('./routes/sdk');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/sdk', sdkRoutes);

// Newsletter subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Send welcome email via Resend (if configured)
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_PASTE_YOUR_API_KEY_HERE') {
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
                from: `JT Mobamba <${process.env.EMAIL_FROM || 'newsletter@jtmobamba.com'}>`,
                to: [email],
                subject: 'Welcome to JT Mobamba Newsletter!',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

                            <!-- Header -->
                            <div style="background-color: #000000; padding: 30px 20px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">Welcome to JT Mobamba Newsletter!</h1>
                            </div>

                            <!-- Welcome Message -->
                            <div style="padding: 40px 30px; background-color: #FFE4EC;">
                                <h3 style="color: #000000; margin: 0 0 20px 0; font-size: 22px;">Thank You for Subscribing!</h3>
                                <p style="color: #333333; line-height: 1.8; margin: 0 0 20px 0; font-size: 15px;">
                                    Welcome to <strong>JT Mobamba</strong> - your premier destination for cutting-edge technology and premium electronics. We're thrilled to have you join our growing community of tech enthusiasts!
                                </p>
                                <p style="color: #333333; line-height: 1.8; margin: 0; font-size: 15px;">
                                    As a subscriber, you'll be the first to know about our latest products, exclusive deals, and special promotions.
                                </p>
                            </div>

                            <!-- What We Offer Section with Pexels Images -->
                            <div style="padding: 30px; background-color: #ffffff;">
                                <h3 style="color: #000000; margin: 0 0 25px 0; font-size: 20px; text-align: center;">What We Offer</h3>

                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px; text-align: center; width: 33%;">
                                            <div style="background-color: #FFC0CB; border-radius: 8px; padding: 15px; overflow: hidden;">
                                                <img src="https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=150&h=100&fit=crop" alt="Smartphones" style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                                                <p style="color: #000000; margin: 0; font-weight: bold; font-size: 13px;">Smartphones</p>
                                            </div>
                                        </td>
                                        <td style="padding: 10px; text-align: center; width: 33%;">
                                            <div style="background-color: #FFC0CB; border-radius: 8px; padding: 15px; overflow: hidden;">
                                                <img src="https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=150&h=100&fit=crop" alt="Laptops" style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                                                <p style="color: #000000; margin: 0; font-weight: bold; font-size: 13px;">Laptops</p>
                                            </div>
                                        </td>
                                        <td style="padding: 10px; text-align: center; width: 33%;">
                                            <div style="background-color: #FFC0CB; border-radius: 8px; padding: 15px; overflow: hidden;">
                                                <img src="https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=150&h=100&fit=crop" alt="Audio" style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                                                <p style="color: #000000; margin: 0; font-weight: bold; font-size: 13px;">Audio</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px; text-align: center; width: 33%;">
                                            <div style="background-color: #FFC0CB; border-radius: 8px; padding: 15px; overflow: hidden;">
                                                <img src="https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=150&h=100&fit=crop" alt="Wearables" style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                                                <p style="color: #000000; margin: 0; font-weight: bold; font-size: 13px;">Wearables</p>
                                            </div>
                                        </td>
                                        <td style="padding: 10px; text-align: center; width: 33%;">
                                            <div style="background-color: #FFC0CB; border-radius: 8px; padding: 15px; overflow: hidden;">
                                                <img src="https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=150&h=100&fit=crop" alt="Cameras" style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                                                <p style="color: #000000; margin: 0; font-weight: bold; font-size: 13px;">Cameras</p>
                                            </div>
                                        </td>
                                        <td style="padding: 10px; text-align: center; width: 33%;">
                                            <div style="background-color: #FFC0CB; border-radius: 8px; padding: 15px; overflow: hidden;">
                                                <img src="https://images.pexels.com/photos/1034812/pexels-photo-1034812.jpeg?auto=compress&cs=tinysrgb&w=150&h=100&fit=crop" alt="Smart Home" style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                                                <p style="color: #000000; margin: 0; font-weight: bold; font-size: 13px;">Smart Home</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <div style="padding: 30px; background-color: #FFE4EC; text-align: center;">
                                <a href="https://jtmobamba.com/deals.html" style="display: inline-block; background-color: #FF69B4; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                    Shop Now
                                </a>
                            </div>

                            <!-- Benefits Section -->
                            <div style="padding: 30px; background-color: #ffffff;">
                                <h3 style="color: #000000; margin: 0 0 20px 0; font-size: 18px;">As a Subscriber, You'll Receive:</h3>
                                <ul style="color: #333333; line-height: 2; margin: 0; padding-left: 20px; font-size: 14px;">
                                    <li>Early access to new product launches</li>
                                    <li>Exclusive subscriber-only discounts</li>
                                    <li>Weekly deals and flash sales alerts</li>
                                    <li>Tech tips and product guides</li>
                                    <li>Priority customer support</li>
                                </ul>
                            </div>

                            <!-- Footer -->
                            <div style="background-color: #000000; padding: 30px; text-align: center;">
                                <p style="color: #FFC0CB; margin: 0 0 15px 0; font-size: 14px;">
                                    <strong>JT Mobamba</strong>
                                </p>
                                <p style="color: #FFE4EC; margin: 0 0 15px 0; font-size: 12px;">
                                    Your Premium Technology Partner
                                </p>
                                <div style="margin: 20px 0;">
                                    <a href="https://jtmobamba.com" style="color: #FF69B4; text-decoration: none; margin: 0 10px; font-size: 13px;">Website</a>
                                    <span style="color: #FFC0CB;">|</span>
                                    <a href="https://jtmobamba.com/products.html" style="color: #FF69B4; text-decoration: none; margin: 0 10px; font-size: 13px;">Products</a>
                                    <span style="color: #FFC0CB;">|</span>
                                    <a href="https://jtmobamba.com/contact.html" style="color: #FF69B4; text-decoration: none; margin: 0 10px; font-size: 13px;">Contact</a>
                                </div>
                                <p style="color: #FFC0CB; margin: 20px 0 0 0; font-size: 11px;">
                                    &copy; 2026 JT Mobamba. All rights reserved.
                                </p>
                            </div>

                        </div>
                    </body>
                    </html>
                `
            });

            console.log(`Newsletter welcome email sent to: ${email}`);
        } else {
            console.log(`Newsletter subscription saved (email sending disabled): ${email}`);
        }

        res.json({ success: true, message: 'Successfully subscribed to newsletter!' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ success: false, message: 'Subscription failed. Please try again.' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'JT Mobamba API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve static files from parent directory (website root)
app.use(express.static(path.join(__dirname, '..')));

// Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'homepage.html'));
});

// Serve HTML pages
app.get('*.html', (req, res) => {
    const page = req.path;
    res.sendFile(path.join(__dirname, '..', page));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler for API routes only
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Route not found' });
    } else {
        res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
    }
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API available at http://localhost:${PORT}/api`);
    });
});
