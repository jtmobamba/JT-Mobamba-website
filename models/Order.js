const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productId: String,
    name: String,
    price: Number,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: String
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guestEmail: {
        type: String
    },
    items: [orderItemSchema],
    shippingAddress: {
        firstName: String,
        lastName: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'United States'
        },
        phone: String
    },
    billingAddress: {
        firstName: String,
        lastName: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'United States'
        }
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'paypal', 'apple-pay', 'google-pay'],
        default: 'card'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    subtotal: {
        type: Number,
        required: true
    },
    shipping: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'in-transit', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    notes: String,
    statusHistory: [{
        status: String,
        date: {
            type: Date,
            default: Date.now
        },
        note: String
    }]
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `JTM-${String(100000 + count + 1).slice(-6)}`;
    }

    // Add status to history if changed
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            date: new Date()
        });
    }

    next();
});

// Index for searching orders
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ guestEmail: 1 });

module.exports = mongoose.model('Order', orderSchema);
