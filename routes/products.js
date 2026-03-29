const express = require('express');
const Product = require('../models/Product');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering, sorting, and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            minPrice,
            maxPrice,
            search,
            sort = '-createdAt',
            featured
        } = req.query;

        // Build query
        const query = { isActive: true };

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$text = { $search: search };
        }

        if (featured === 'true') {
            query.featured = true;
        }

        // Execute query with pagination
        const products = await Product.find(query)
            .sort(sort)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        res.json({
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get featured products
router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ isActive: true, featured: true })
            .limit(8)
            .sort('-createdAt');

        res.json({ products });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 12, sort = '-createdAt' } = req.query;

        const products = await Product.find({ category, isActive: true })
            .sort(sort)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await Product.countDocuments({ category, isActive: true });

        res.json({
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get category products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Search products
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.json({ products: [] });
        }

        // Use text search or regex for partial matching
        const products = await Product.find({
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ]
        }).limit(Number(limit));

        res.json({ products });
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get single product by productId
router.get('/:productId', async (req, res) => {
    try {
        const product = await Product.findOne({
            productId: req.params.productId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Get related products
router.get('/:productId/related', async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.productId });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find related products by category and tags
        const relatedProducts = await Product.find({
            isActive: true,
            productId: { $ne: product.productId },
            $or: [
                { category: product.category },
                { tags: { $in: product.tags } }
            ]
        }).limit(4);

        res.json({ products: relatedProducts });
    } catch (error) {
        console.error('Get related products error:', error);
        res.status(500).json({ error: 'Failed to fetch related products' });
    }
});

// Admin: Create product
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Admin: Update product
router.put('/:productId', auth, adminOnly, async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { productId: req.params.productId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Admin: Delete product (soft delete)
router.delete('/:productId', auth, adminOnly, async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { productId: req.params.productId },
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
