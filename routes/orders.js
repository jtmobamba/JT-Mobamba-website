const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Create new order
router.post('/', optionalAuth, [
    body('items').isArray({ min: 1 }),
    body('shippingAddress').isObject(),
    body('shippingAddress.firstName').notEmpty(),
    body('shippingAddress.lastName').notEmpty(),
    body('shippingAddress.street').notEmpty(),
    body('shippingAddress.city').notEmpty(),
    body('shippingAddress.state').notEmpty(),
    body('shippingAddress.zipCode').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            items,
            shippingAddress,
            billingAddress,
            paymentMethod = 'card',
            guestEmail
        } = req.body;

        // Validate and get product details
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findOne({ productId: item.productId });

            if (!product) {
                return res.status(400).json({
                    error: `Product not found: ${item.productId}`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name}`
                });
            }

            orderItems.push({
                product: product._id,
                productId: product.productId,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image
            });

            subtotal += product.price * item.quantity;

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Calculate totals
        const shipping = subtotal >= 50 ? 0 : 9.99;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        // Create order
        const order = new Order({
            user: req.user?._id,
            guestEmail: req.user ? undefined : guestEmail,
            items: orderItems,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            paymentMethod,
            subtotal,
            shipping,
            tax,
            total,
            status: 'pending',
            paymentStatus: 'pending',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        await order.save();

        // Clear user's cart if logged in
        if (req.user) {
            req.user.cart = [];
            await req.user.save();
        }

        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                orderNumber: order.orderNumber,
                total: order.total,
                estimatedDelivery: order.estimatedDelivery,
                status: order.status
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const orders = await Order.find({ user: req.user._id })
            .sort('-createdAt')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('items.product');

        const total = await Order.countDocuments({ user: req.user._id });

        res.json({
            orders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Track order by order number and email (for guests)
router.get('/track', async (req, res) => {
    try {
        const { orderNumber, email } = req.query;

        if (!orderNumber || !email) {
            return res.status(400).json({
                error: 'Order number and email are required'
            });
        }

        const order = await Order.findOne({
            orderNumber: orderNumber.toUpperCase(),
            $or: [
                { guestEmail: email.toLowerCase() },
                { 'shippingAddress.email': email.toLowerCase() }
            ]
        }).populate('items.product');

        if (!order) {
            // Try to find by user email
            const User = require('../models/User');
            const user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
                const userOrder = await Order.findOne({
                    orderNumber: orderNumber.toUpperCase(),
                    user: user._id
                }).populate('items.product');

                if (userOrder) {
                    return res.json({ order: userOrder });
                }
            }

            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ order });
    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).json({ error: 'Failed to track order' });
    }
});

// Get single order
router.get('/:orderNumber', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber.toUpperCase(),
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Cancel order (only if pending)
router.put('/:orderNumber/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber.toUpperCase(),
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({
                error: 'Cannot cancel order that has been shipped'
            });
        }

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        order.status = 'cancelled';
        order.paymentStatus = 'refunded';
        await order.save();

        res.json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

// Admin: Get all orders
router.get('/admin/all', auth, adminOnly, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            sort = '-createdAt'
        } = req.query;

        const query = {};
        if (status) query.status = status;

        const orders = await Order.find(query)
            .sort(sort)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('user', 'email firstName lastName')
            .populate('items.product');

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Admin: Update order status
router.put('/admin/:orderNumber/status', auth, adminOnly, [
    body('status').isIn(['pending', 'processing', 'shipped', 'in-transit', 'delivered', 'cancelled', 'returned'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status, trackingNumber, carrier, note } = req.body;

        const order = await Order.findOne({
            orderNumber: req.params.orderNumber.toUpperCase()
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = status;

        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (carrier) order.carrier = carrier;

        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        // Add to status history
        order.statusHistory.push({
            status,
            date: new Date(),
            note
        });

        await order.save();

        res.json({
            message: 'Order status updated',
            order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
