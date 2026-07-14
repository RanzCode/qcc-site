const express = require('express');
const { body, validationResult } = require('express-validator');
const FeaturedEvent = require('../models/FeaturedEvent');
const { authenticateToken, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Get the featured event (public) - used by events.html to fill in the
// "Annual Church Camp" date and to point its two buttons at the admin-set links
router.get('/', async (req, res) => {
    try {
        const featuredEvent = await FeaturedEvent.findOne({});
        res.json({ featuredEvent });
    } catch (error) {
        console.error('Get featured event error:', error);
        res.status(500).json({ error: 'Failed to get featured event' });
    }
});

// Create or update the featured event (admin/editor only)
router.put('/', authenticateToken, requireEditor, [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('viewDetailsUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('View details link must be a valid URL'),
    body('registerUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Register link must be a valid URL')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { startDate, endDate, viewDetailsUrl, registerUrl } = req.body;

        const featuredEvent = await FeaturedEvent.findOneAndUpdate(
            {},
            { startDate, endDate, viewDetailsUrl, registerUrl, updatedBy: req.user._id },
            { new: true, upsert: true, runValidators: true }
        );

        res.json({ message: 'Featured event saved', featuredEvent });
    } catch (error) {
        console.error('Save featured event error:', error);
        res.status(500).json({ error: 'Failed to save featured event' });
    }
});

module.exports = router;
