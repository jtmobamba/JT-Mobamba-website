# JT Mobamba Electronics - Backend Server

Node.js/Express backend server with MongoDB Atlas integration for the JT Mobamba Electronics e-commerce website.

## Features

- **User Authentication** - JWT-based authentication with registration and login
- **Product Management** - CRUD operations for products with search and filtering
- **Order Management** - Create, track, and manage orders
- **File Storage** - MongoDB GridFS for file uploads (up to 8GB cloud storage)
- **Shopping Cart & Wishlist** - Persistent cart and wishlist for logged-in users

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- MongoDB Atlas account (already configured)

## Quick Start

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Seed the database with initial data:**
   ```bash
   node seed.js
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/:productId` - Get single product
- `GET /api/products/:productId/related` - Get related products

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/track?orderNumber=XXX&email=XXX` - Track order
- `GET /api/orders/:orderNumber` - Get order details
- `PUT /api/orders/:orderNumber/cancel` - Cancel order

### User
- `PUT /api/users/profile` - Update profile
- `POST /api/users/addresses` - Add address
- `GET /api/users/wishlist` - Get wishlist
- `POST /api/users/wishlist/:productId` - Add to wishlist
- `GET /api/users/cart` - Get cart
- `POST /api/users/cart` - Add to cart

### Files (GridFS)
- `POST /api/files/upload` - Upload single file
- `POST /api/files/upload-multiple` - Upload multiple files
- `GET /api/files/:id` - Get file
- `GET /api/files/:id/download` - Download file
- `GET /api/files/storage/stats` - Get storage statistics
- `DELETE /api/files/:id` - Delete file (admin only)

### Health Check
- `GET /api/health` - Server health check

## Admin Credentials

After running the seed script:
- **Email:** admin@jtmobamba.com
- **Password:** admin123456

## Environment Variables

The `.env` file is already configured with:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode
- `FRONTEND_URL` - Frontend URL for CORS

## File Storage

MongoDB GridFS is used for file storage with:
- 8GB total cloud storage
- Supports images, PDFs, and common file types
- 10MB max file size per upload
- Storage statistics available via API

## Project Structure

```
server/
├── models/
│   ├── Product.js    # Product schema
│   ├── User.js       # User schema
│   └── Order.js      # Order schema
├── routes/
│   ├── auth.js       # Authentication routes
│   ├── products.js   # Product routes
│   ├── orders.js     # Order routes
│   ├── users.js      # User routes
│   └── files.js      # File upload routes
├── middleware/
│   └── auth.js       # JWT authentication middleware
├── server.js         # Express app entry point
├── seed.js           # Database seeder
├── package.json
└── .env              # Environment variables
```
