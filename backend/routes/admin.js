const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Contact = require('../models/Contact');
const Donation = require('../models/Donation');
const Sermon = require('../models/Sermon');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

// Dashboard overview (admin only)
router.get('/dashboard', requireAdmin, async (req, res) => {
    try {
        // Get recent activity counts
        const recentContacts = await Contact.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const recentDonations = await Donation.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const totalDonations = await Donation.aggregate([
            {
                $match: {
                    paymentStatus: 'completed',
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const upcomingEvents = await Event.countDocuments({
            startDate: { $gte: new Date() },
            status: 'published'
        });

        const draftSermons = await Sermon.countDocuments({
            status: 'draft'
        });

        // Get latest activity
        const latestContacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName subject status createdAt');

        const latestDonations = await Donation.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('donor amount donationType paymentStatus createdAt');

        const latestEvents = await Event.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title category status startDate createdAt');

        res.json({
            overview: {
                recentContacts,
                recentDonations,
                totalDonations: totalDonations[0]?.total || 0,
                upcomingEvents,
                draftSermons
            },
            latestActivity: {
                contacts: latestContacts,
                donations: latestDonations,
                events: latestEvents
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// System statistics (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Contact statistics
        const contactStats = await Contact.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
                    read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
                    replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } }
                }
            }
        ]);

        // Donation statistics
        const donationStats = await Donation.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    completed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } }
                }
            }
        ]);

        // Sermon statistics
        const sermonStats = await Sermon.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                    draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    totalViews: { $sum: '$viewCount' }
                }
            }
        ]);

        // Event statistics
        const eventStats = await Event.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                    draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    upcoming: { $sum: { $cond: [{ $gte: ['$startDate', new Date()] }, 1, 0] } }
                }
            }
        ]);

        // User statistics
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    admin: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
                    editor: { $sum: { $cond: [{ $eq: ['$role', 'editor'] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            contacts: contactStats[0] || { total: 0, new: 0, read: 0, replied: 0 },
            donations: donationStats[0] || { total: 0, totalAmount: 0, completed: 0, pending: 0 },
            sermons: sermonStats[0] || { total: 0, published: 0, draft: 0, totalViews: 0 },
            events: eventStats[0] || { total: 0, published: 0, draft: 0, upcoming: 0 },
            users: userStats[0] || { total: 0, active: 0, admin: 0, editor: 0 }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// System health check (admin only)
router.get('/health', requireAdmin, async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                email: process.env.EMAIL_HOST ? 'configured' : 'not configured',
                stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
                youtube: process.env.YOUTUBE_API_KEY ? 'configured' : 'not configured'
            },
            environment: process.env.NODE_ENV || 'development'
        };

        // Test database connection
        try {
            await Contact.countDocuments();
        } catch (error) {
            health.status = 'unhealthy';
            health.services.database = 'disconnected';
        }

        res.json(health);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: 'Health check failed' });
    }
});

// Backup data (admin only)
router.get('/backup', requireAdmin, async (req, res) => {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            contacts: await Contact.find().limit(1000),
            donations: await Donation.find().limit(1000),
            sermons: await Sermon.find().limit(1000),
            events: await Event.find().limit(1000),
            users: await User.find().select('-password').limit(1000)
        };

        res.json(backup);
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Backup failed' });
    }
});

// System settings (admin only)
router.get('/settings', requireAdmin, (req, res) => {
    const settings = {
        email: {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            user: process.env.EMAIL_USER ? 'configured' : 'not configured'
        },
        stripe: {
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not configured',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'not configured'
        },
        youtube: {
            apiKey: process.env.YOUTUBE_API_KEY ? 'configured' : 'not configured',
            channelId: process.env.YOUTUBE_CHANNEL_ID || 'not configured'
        },
        database: {
            uri: process.env.MONGODB_URI ? 'configured' : 'not configured'
        }
    };

    res.json(settings);
});

// Update system settings (admin only)
router.put('/settings', requireAdmin, (req, res) => {
    // Note: In a real application, you'd want to persist these settings
    // For now, we'll just return a success message
    res.json({
        message: 'Settings updated successfully',
        note: 'Environment variables need to be updated manually'
    });
});

// Get system logs (admin only)
router.get('/logs', requireAdmin, (req, res) => {
    // In a real application, you'd implement proper logging
    // For now, return a placeholder
    res.json({
        message: 'Logs endpoint',
        note: 'Implement proper logging system'
    });
});

module.exports = router; 