const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const { sendDonationConfirmation } = require('../config/email');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Create payment intent for Stripe
router.post('/create-payment-intent', [
    body('amount').isNumeric().withMessage('Valid amount required'),
    body('donationType').isIn(['tithe', 'offering', 'building-fund', 'mission', 'other']).withMessage('Valid donation type required'),
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { amount, donationType, firstName, lastName, email, frequency = 'one-time' } = req.body;

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'php',
            metadata: {
                donationType,
                firstName,
                lastName,
                email,
                frequency
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Process donation after successful payment
router.post('/process', [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID required'),
    body('donor').isObject().withMessage('Donor information required'),
    body('amount').isNumeric().withMessage('Valid amount required'),
    body('donationType').isIn(['tithe', 'offering', 'building-fund', 'mission', 'other']).withMessage('Valid donation type required'),
    body('paymentMethod').isIn(['stripe', 'paypal', 'bank-transfer', 'qr-code', 'cash']).withMessage('Valid payment method required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { paymentIntentId, donor, amount, donationType, frequency, paymentMethod, notes } = req.body;

        // Verify payment with Stripe
        let paymentStatus = 'pending';
        if (paymentMethod === 'stripe') {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            paymentStatus = paymentIntent.status === 'succeeded' ? 'completed' : 'failed';
        }

        // Create donation record
        const donation = new Donation({
            donor,
            amount,
            donationType,
            frequency,
            paymentMethod,
            paymentStatus,
            stripePaymentIntentId: paymentMethod === 'stripe' ? paymentIntentId : undefined,
            notes,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await donation.save();

        // Send confirmation email
        if (paymentStatus === 'completed') {
            const emailResult = await sendDonationConfirmation(donor.email, {
                donationType,
                amount,
                frequency
            });

            if (!emailResult.success) {
                console.error('Donation confirmation email failed:', emailResult.error);
            }
        }

        res.status(201).json({
            message: 'Donation processed successfully',
            donation: {
                id: donation._id,
                transactionId: donation.transactionId,
                status: donation.paymentStatus
            }
        });
    } catch (error) {
        console.error('Process donation error:', error);
        res.status(500).json({ error: 'Failed to process donation' });
    }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                await handlePaymentSuccess(paymentIntent);
                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                await handlePaymentFailure(failedPayment);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
    try {
        const donation = await Donation.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (donation) {
            donation.paymentStatus = 'completed';
            await donation.save();

            // Send confirmation email
            const emailResult = await sendDonationConfirmation(donation.donor.email, {
                donationType: donation.donationType,
                amount: donation.amount,
                frequency: donation.frequency
            });

            if (!emailResult.success) {
                console.error('Donation confirmation email failed:', emailResult.error);
            }
        }
    } catch (error) {
        console.error('Handle payment success error:', error);
    }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
    try {
        const donation = await Donation.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (donation) {
            donation.paymentStatus = 'failed';
            await donation.save();
        }
    } catch (error) {
        console.error('Handle payment failure error:', error);
    }
}

// Get all donations (admin only)
router.get('/', authenticateToken, requirePermission('donations'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, donationType, startDate, endDate } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.paymentStatus = status;
        if (donationType) filter.donationType = donationType;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const donations = await Donation.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Donation.countDocuments(filter);

        res.json({
            donations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ error: 'Failed to get donations' });
    }
});

// Get donation statistics (admin only)
router.get('/stats/overview', authenticateToken, requirePermission('donations'), async (req, res) => {
    try {
        const stats = await Donation.aggregate([
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    completedAmount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0] } },
                    pendingAmount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0] } }
                }
            }
        ]);

        const donationTypeStats = await Donation.aggregate([
            {
                $group: {
                    _id: '$donationType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const monthlyStats = await Donation.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            overview: stats[0] || { totalDonations: 0, totalAmount: 0, completedAmount: 0, pendingAmount: 0 },
            donationTypeStats,
            monthlyStats
        });
    } catch (error) {
        console.error('Get donation stats error:', error);
        res.status(500).json({ error: 'Failed to get donation statistics' });
    }
});

// Get single donation (admin only)
router.get('/:id', authenticateToken, requirePermission('donations'), async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        res.json({ donation });
    } catch (error) {
        console.error('Get donation error:', error);
        res.status(500).json({ error: 'Failed to get donation' });
    }
});

// Update donation (admin only)
router.patch('/:id', authenticateToken, requirePermission('donations'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow updating critical fields
        delete updates.transactionId;
        delete updates.stripePaymentIntentId;

        const donation = await Donation.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        res.json({
            message: 'Donation updated successfully',
            donation
        });
    } catch (error) {
        console.error('Update donation error:', error);
        res.status(500).json({ error: 'Failed to update donation' });
    }
});

module.exports = router; 