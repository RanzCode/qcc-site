const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { authenticateToken, requirePermission, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, category, status = 'published', upcoming } = req.query;
        const skip = (page - 1) * limit;

        const filter = { status, isPublic: true };
        if (category) filter.category = category;
        
        if (upcoming === 'true') {
            filter.startDate = { $gte: new Date() };
        }

        const events = await Event.find(filter)
            .populate('createdBy', 'firstName lastName')
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Event.countDocuments(filter);

        res.json({
            events,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to get events' });
    }
});

// Get featured events
router.get('/featured', async (req, res) => {
    try {
        const events = await Event.find({
            status: 'published',
            isPublic: true,
            isFeatured: true,
            startDate: { $gte: new Date() }
        })
        .populate('createdBy', 'firstName lastName')
        .sort({ startDate: 1 })
        .limit(6);

        res.json({ events });
    } catch (error) {
        console.error('Get featured events error:', error);
        res.status(500).json({ error: 'Failed to get featured events' });
    }
});

// Get single event (public)
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findOne({
            _id: req.params.id,
            status: 'published',
            isPublic: true
        }).populate('createdBy', 'firstName lastName');

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ event });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Failed to get event' });
    }
});

// Create event (admin/editor only)
router.post('/', requireEditor, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('category').isIn(['worship', 'bible-study', 'youth', 'community', 'mission', 'fellowship', 'prayer', 'other']).withMessage('Valid category is required'),
    body('type').isIn(['single', 'recurring', 'series']).withMessage('Valid type is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const eventData = {
            ...req.body,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        };

        const event = new Event(eventData);
        await event.save();

        res.status(201).json({
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Update event (admin/editor only)
router.put('/:id', requireEditor, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            lastUpdatedBy: req.user._id
        };

        const event = await Event.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName');

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Delete event (admin/editor only)
router.delete('/:id', requireEditor, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Get event statistics (admin only)
router.get('/stats/overview', authenticateToken, requirePermission('events'), async (req, res) => {
    try {
        const stats = await Event.aggregate([
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    publishedEvents: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                    draftEvents: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    upcomingEvents: { $sum: { $cond: [{ $gte: ['$startDate', new Date()] }, 1, 0] } }
                }
            }
        ]);

        const categoryStats = await Event.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const monthlyStats = await Event.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            overview: stats[0] || { totalEvents: 0, publishedEvents: 0, draftEvents: 0, upcomingEvents: 0 },
            categoryStats,
            monthlyStats
        });
    } catch (error) {
        console.error('Get event stats error:', error);
        res.status(500).json({ error: 'Failed to get event statistics' });
    }
});

// Get all events for admin (admin only)
router.get('/admin/all', authenticateToken, requirePermission('events'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, category } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;

        const events = await Event.find(filter)
            .populate('createdBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName')
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Event.countDocuments(filter);

        res.json({
            events,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get admin events error:', error);
        res.status(500).json({ error: 'Failed to get events' });
    }
});

// Register for event (public)
router.post('/:id/register', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const event = await Event.findById(req.params.id);
        
        if (!event || event.status !== 'published') {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!event.requiresRegistration) {
            return res.status(400).json({ error: 'Event does not require registration' });
        }

        if (event.currentAttendees >= event.maxAttendees) {
            return res.status(400).json({ error: 'Event is full' });
        }

        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Increment attendee count
        event.currentAttendees += 1;
        await event.save();

        res.json({
            message: 'Successfully registered for event',
            event: {
                id: event._id,
                title: event.title,
                currentAttendees: event.currentAttendees,
                maxAttendees: event.maxAttendees
            }
        });
    } catch (error) {
        console.error('Event registration error:', error);
        res.status(500).json({ error: 'Failed to register for event' });
    }
});

module.exports = router; 