const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const User = require('./models/User');

const products = [
    {
        productId: 'prod_001',
        name: 'Premium Wireless Earbuds',
        description: 'Experience crystal-clear audio with our premium wireless earbuds. Features active noise cancellation, 24-hour battery life, and IPX5 water resistance. Perfect for workouts, commuting, or everyday listening.',
        price: 89.99,
        originalPrice: 119.99,
        category: 'audio',
        image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 150,
        rating: 4.5,
        reviewCount: 128,
        tags: ['wireless', 'earbuds', 'bluetooth', 'noise-cancelling', 'audio'],
        specifications: {
            'Battery Life': '24 hours (with case)',
            'Connectivity': 'Bluetooth 5.2',
            'Water Resistance': 'IPX5',
            'Driver Size': '10mm',
            'Weight': '5g per earbud'
        },
        featured: true
    },
    {
        productId: 'prod_002',
        name: 'Smart Watch Pro X',
        description: 'Stay connected and track your fitness with the Smart Watch Pro X. Features heart rate monitoring, GPS tracking, sleep analysis, and 7-day battery life. Compatible with iOS and Android.',
        price: 299.99,
        category: 'wearables',
        image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 75,
        rating: 5,
        reviewCount: 256,
        tags: ['smartwatch', 'fitness', 'health', 'gps', 'wearable'],
        specifications: {
            'Display': '1.4" AMOLED',
            'Battery Life': '7 days',
            'Water Resistance': '5ATM',
            'Sensors': 'Heart rate, SpO2, GPS',
            'Compatibility': 'iOS 12+ / Android 8+'
        },
        featured: true
    },
    {
        productId: 'prod_003',
        name: 'Portable Bluetooth Speaker',
        description: 'Powerful 360-degree sound in a compact, portable design. Features 20-hour battery life, IPX7 waterproof rating, and built-in microphone for hands-free calls.',
        price: 59.99,
        originalPrice: 69.99,
        category: 'audio',
        image: 'https://images.pexels.com/photos/1279365/pexels-photo-1279365.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/1279365/pexels-photo-1279365.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 200,
        rating: 4.3,
        reviewCount: 89,
        tags: ['speaker', 'bluetooth', 'portable', 'waterproof', 'audio'],
        specifications: {
            'Output Power': '20W',
            'Battery Life': '20 hours',
            'Water Resistance': 'IPX7',
            'Connectivity': 'Bluetooth 5.0',
            'Weight': '540g'
        },
        featured: true
    },
    {
        productId: 'prod_004',
        name: 'MacBook Pro 16"',
        description: 'The ultimate laptop for professionals. Features M3 Pro chip, 18-hour battery life, stunning Liquid Retina XDR display, and advanced thermal system for sustained performance.',
        price: 2499.99,
        category: 'laptops',
        image: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 25,
        rating: 5,
        reviewCount: 512,
        tags: ['laptop', 'macbook', 'apple', 'professional', 'powerful'],
        specifications: {
            'Processor': 'Apple M3 Pro',
            'RAM': '18GB Unified Memory',
            'Storage': '512GB SSD',
            'Display': '16.2" Liquid Retina XDR',
            'Battery': 'Up to 18 hours'
        },
        featured: true
    },
    {
        productId: 'prod_005',
        name: 'iPhone 15 Pro Max',
        description: 'The most advanced iPhone ever. Features A17 Pro chip, titanium design, 48MP camera system, and Action button. Experience pro-level photography and gaming performance.',
        price: 1199.99,
        category: 'smartphones',
        image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 50,
        rating: 4.8,
        reviewCount: 342,
        tags: ['smartphone', 'iphone', 'apple', 'camera', '5g'],
        specifications: {
            'Processor': 'A17 Pro',
            'Display': '6.7" Super Retina XDR',
            'Camera': '48MP + 12MP + 12MP',
            'Storage': '256GB',
            'Battery': 'Up to 29 hours video'
        },
        featured: true
    },
    {
        productId: 'prod_006',
        name: 'Professional DSLR Camera',
        description: 'Capture stunning photos and 4K video with this professional-grade DSLR camera. Features 45.7MP full-frame sensor, advanced autofocus system, and weather-sealed body.',
        price: 2999.99,
        category: 'cameras',
        image: 'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 15,
        rating: 4.9,
        reviewCount: 67,
        tags: ['camera', 'dslr', 'photography', 'professional', '4k'],
        specifications: {
            'Sensor': '45.7MP Full-Frame',
            'Video': '4K 60fps',
            'ISO Range': '64-25600',
            'Autofocus': '153-point AF',
            'Body': 'Weather-sealed magnesium alloy'
        },
        featured: false
    },
    {
        productId: 'prod_007',
        name: 'Smart Home Hub',
        description: 'Control your entire smart home from one device. Compatible with 1000+ smart devices, features voice control, and provides centralized automation for lights, thermostats, and security.',
        price: 129.99,
        originalPrice: 149.99,
        category: 'smart-home',
        image: 'https://images.pexels.com/photos/4219883/pexels-photo-4219883.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/4219883/pexels-photo-4219883.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 100,
        rating: 4.4,
        reviewCount: 156,
        tags: ['smart-home', 'hub', 'automation', 'voice-control', 'iot'],
        specifications: {
            'Compatibility': 'Zigbee, Z-Wave, WiFi, Bluetooth',
            'Voice Assistants': 'Alexa, Google Assistant, Siri',
            'Devices': '1000+ compatible devices',
            'Display': '7" touchscreen',
            'Connectivity': 'WiFi 6, Ethernet'
        },
        featured: false
    },
    {
        productId: 'prod_008',
        name: 'Gaming Headset Pro',
        description: 'Immersive gaming audio with 7.1 surround sound, noise-cancelling microphone, and RGB lighting. Features memory foam ear cushions for extended comfort during long gaming sessions.',
        price: 149.99,
        originalPrice: 179.99,
        category: 'audio',
        image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [
            'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        stock: 80,
        rating: 4.6,
        reviewCount: 203,
        tags: ['headset', 'gaming', 'audio', 'rgb', 'surround-sound'],
        specifications: {
            'Audio': '7.1 Surround Sound',
            'Microphone': 'Detachable noise-cancelling',
            'Connectivity': 'USB / 3.5mm',
            'Lighting': 'RGB with 16.8M colors',
            'Compatibility': 'PC, PS5, Xbox, Switch'
        },
        featured: false
    }
];

const adminUser = {
    email: 'admin@jtmobamba.com',
    password: 'admin123456',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
};

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Product.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data');

        // Insert products
        const insertedProducts = await Product.insertMany(products);
        console.log(`Inserted ${insertedProducts.length} products`);

        // Create admin user
        const admin = new User(adminUser);
        await admin.save();
        console.log('Created admin user:', admin.email);

        console.log('\n✅ Database seeded successfully!');
        console.log('\nAdmin credentials:');
        console.log('Email:', adminUser.email);
        console.log('Password:', adminUser.password);

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();
