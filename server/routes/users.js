const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Update user profile
router.put('/profile', auth, [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, phone } = req.body;
        const updates = {};

        if (firstName) updates.firstName = firstName;
        if (lastName) updates.lastName = lastName;
        if (phone !== undefined) updates.phone = phone;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        );

        res.json({
            message: 'Profile updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Add address
router.post('/addresses', auth, [
    body('street').notEmpty(),
    body('city').notEmpty(),
    body('state').notEmpty(),
    body('zipCode').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { street, city, state, zipCode, country, isDefault } = req.body;

        // If new address is default, unset other defaults
        if (isDefault) {
            req.user.addresses.forEach(addr => addr.isDefault = false);
        }

        req.user.addresses.push({
            street,
            city,
            state,
            zipCode,
            country: country || 'United States',
            isDefault: isDefault || req.user.addresses.length === 0
        });

        await req.user.save();

        res.status(201).json({
            message: 'Address added successfully',
            addresses: req.user.addresses
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Failed to add address' });
    }
});

// Update address
router.put('/addresses/:addressId', auth, async (req, res) => {
    try {
        const address = req.user.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        const { street, city, state, zipCode, country, isDefault } = req.body;

        if (isDefault) {
            req.user.addresses.forEach(addr => addr.isDefault = false);
        }

        if (street) address.street = street;
        if (city) address.city = city;
        if (state) address.state = state;
        if (zipCode) address.zipCode = zipCode;
        if (country) address.country = country;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await req.user.save();

        res.json({
            message: 'Address updated successfully',
            addresses: req.user.addresses
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Failed to update address' });
    }
});

// Delete address
router.delete('/addresses/:addressId', auth, async (req, res) => {
    try {
        req.user.addresses.pull(req.params.addressId);
        await req.user.save();

        res.json({
            message: 'Address deleted successfully',
            addresses: req.user.addresses
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

// Get wishlist
router.get('/wishlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json({ wishlist: user.wishlist });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});

// Add to wishlist
router.post('/wishlist/:productId', auth, async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.productId });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (!req.user.wishlist.includes(product._id)) {
            req.user.wishlist.push(product._id);
            await req.user.save();
        }

        const user = await User.findById(req.user._id).populate('wishlist');

        res.json({
            message: 'Added to wishlist',
            wishlist: user.wishlist
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

// Remove from wishlist
router.delete('/wishlist/:productId', auth, async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.productId });

        if (product) {
            req.user.wishlist.pull(product._id);
            await req.user.save();
        }

        const user = await User.findById(req.user._id).populate('wishlist');

        res.json({
            message: 'Removed from wishlist',
            wishlist: user.wishlist
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

// Get cart
router.get('/cart', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('cart.product');

        const cart = user.cart.map(item => ({
            product: item.product,
            quantity: item.quantity
        }));

        const total = cart.reduce((sum, item) => {
            return sum + (item.product?.price || 0) * item.quantity;
        }, 0);

        res.json({ cart, total });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add to cart
router.post('/cart', auth, [
    body('productId').notEmpty(),
    body('quantity').isInt({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { productId, quantity } = req.body;

        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if already in cart
        const existingItem = req.user.cart.find(
            item => item.product.toString() === product._id.toString()
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            req.user.cart.push({
                product: product._id,
                quantity
            });
        }

        await req.user.save();

        const user = await User.findById(req.user._id).populate('cart.product');

        res.json({
            message: 'Added to cart',
            cart: user.cart
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
router.put('/cart/:productId', auth, [
    body('quantity').isInt({ min: 0 })
], async (req, res) => {
    try {
        const { quantity } = req.body;
        const product = await Product.findOne({ productId: req.params.productId });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartItem = req.user.cart.find(
            item => item.product.toString() === product._id.toString()
        );

        if (!cartItem) {
            return res.status(404).json({ error: 'Item not in cart' });
        }

        if (quantity === 0) {
            req.user.cart.pull(cartItem._id);
        } else {
            cartItem.quantity = quantity;
        }

        await req.user.save();

        const user = await User.findById(req.user._id).populate('cart.product');

        res.json({
            message: 'Cart updated',
            cart: user.cart
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove from cart
router.delete('/cart/:productId', auth, async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.productId });

        if (product) {
            const cartItem = req.user.cart.find(
                item => item.product.toString() === product._id.toString()
            );
            if (cartItem) {
                req.user.cart.pull(cartItem._id);
                await req.user.save();
            }
        }

        const user = await User.findById(req.user._id).populate('cart.product');

        res.json({
            message: 'Removed from cart',
            cart: user.cart
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// Clear cart
router.delete('/cart', auth, async (req, res) => {
    try {
        req.user.cart = [];
        await req.user.save();

        res.json({
            message: 'Cart cleared',
            cart: []
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

module.exports = router;
