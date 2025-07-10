const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donor: {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        }
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    currency: {
        type: String,
        default: 'PHP'
    },
    donationType: {
        type: String,
        required: true,
        enum: ['tithe', 'offering', 'building-fund', 'mission', 'other']
    },
    frequency: {
        type: String,
        enum: ['one-time', 'weekly', 'monthly', 'quarterly'],
        default: 'one-time'
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'paypal', 'bank-transfer', 'qr-code', 'cash'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    stripePaymentIntentId: {
        type: String
    },
    paypalOrderId: {
        type: String
    },
    transactionId: {
        type: String,
        unique: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true
    },
    receiptSent: {
        type: Boolean,
        default: false
    },
    receiptSentAt: {
        type: Date
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Generate transaction ID
donationSchema.pre('save', function(next) {
    if (!this.transactionId) {
        this.transactionId = 'DON-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    next();
});

// Indexes for efficient queries
donationSchema.index({ createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ donationType: 1 });
donationSchema.index({ 'donor.email': 1 });
donationSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Donation', donationSchema); 