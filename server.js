// JT Mobamba Electronics - Main Server
// Express + MongoDB Backend Server

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./server/routes/auth');
const productRoutes = require('./server/routes/products');
const orderRoutes = require('./server/routes/orders');
const userRoutes = require('./server/routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jtmobamba';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'jt-mobamba-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 24 * 60 * 60, // Session TTL: 1 day
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// =============================================================================
// ROUTES
// =============================================================================

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Newsletter subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Send welcome email via Resend (if configured)
        if (process.env.RESEND_API_KEY) {
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
                from: `${process.env.EMAIL_FROM_NAME || 'JT Mobamba'} <${process.env.EMAIL_FROM || 'newsletter@jtmobamba.com'}>`,
                to: [email],
                subject: 'Welcome to JT Mobamba Newsletter!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #553624; padding: 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0;">JT Mobamba</h1>
                        </div>
                        <div style="padding: 30px; background-color: #FFF8F0;">
                            <h2 style="color: #1a1a1a;">Welcome to our Newsletter!</h2>
                            <p style="color: #666;">Thank you for subscribing. You'll now receive exclusive deals, new product announcements, and special offers.</p>
                            <a href="https://jtmobamba.com/deals.html" style="display: inline-block; background-color: #C4815D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Shop Deals</a>
                        </div>
                        <div style="background-color: #553624; padding: 15px; text-align: center;">
                            <p style="color: #E8C5B0; margin: 0; font-size: 12px;">&copy; 2026 JT Mobamba Electronics</p>
                        </div>
                    </div>
                `
            });
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
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

// Catch-all for HTML pages
app.get('*.html', (req, res) => {
    const page = req.path;
    res.sendFile(path.join(__dirname, page));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🛒 JT Mobamba Electronics Server                        ║
║                                                           ║
║   Server running at: http://localhost:${PORT}               ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

module.exports = app;
