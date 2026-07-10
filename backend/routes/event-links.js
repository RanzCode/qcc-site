const express = require('express');
const { body, validationResult } = require('express-validator');
const EventLink = require('../models/EventLink');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Get all event links (public) - used to point each event card's
// "View Details" button at the Facebook post the admin pasted for it
router.get('/', async (req, res) => {
    try {
        const links = await EventLink.find({});
        res.json({ links });
    } catch (error) {
        console.error('Get event links error:', error);
        res.status(500).json({ error: 'Failed to get event links' });
    }
});

// Create or update the link for an event title (admin/editor only)
router.put('/', authenticateToken, requireEditor, [
    body('eventTitle').trim().notEmpty().withMessage('Event title is required'),
    body('facebookUrl').trim().isURL().withMessage('Must be a valid URL')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { eventTitle, facebookUrl } = req.body;

        const link = await EventLink.findOneAndUpdate(
            { eventTitle },
            { eventTitle, facebookUrl, updatedBy: req.user._id },
            { new: true, upsert: true, runValidators: true }
        );

        res.json({ message: 'Event link saved', link });
    } catch (error) {
        console.error('Save event link error:', error);
        res.status(500).json({ error: 'Failed to save event link' });
    }
});

// Remove the link for an event title (admin/editor only)
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
    try {
        const link = await EventLink.findByIdAndDelete(req.params.id);
        if (!link) {
            return res.status(404).json({ error: 'Event link not found' });
        }
        res.json({ message: 'Event link deleted' });
    } catch (error) {
        console.error('Delete event link error:', error);
        res.status(500).json({ error: 'Failed to delete event link' });
    }
});

module.exports = router;
