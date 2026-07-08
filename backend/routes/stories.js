const express = require('express');
const { body, validationResult } = require('express-validator');
const Story = require('../models/Story');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Submit a stewardship story (public)
router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name is too long'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, message } = req.body;

        const story = new Story({ name, message });
        await story.save();

        res.status(201).json({
            message: 'Story submitted successfully',
            story
        });
    } catch (error) {
        console.error('Submit story error:', error);
        res.status(500).json({ error: 'Failed to submit story' });
    }
});

// Get all stories (public, visible to anyone visiting the Donate page)
router.get('/', async (req, res) => {
    try {
        const stories = await Story.find({}).sort({ createdAt: -1 });
        res.json({ stories });
    } catch (error) {
        console.error('Get stories error:', error);
        res.status(500).json({ error: 'Failed to get stories' });
    }
});

// Delete a story (admin only)
router.delete('/:id', authenticateToken, requirePermission('stories'), async (req, res) => {
    try {
        const story = await Story.findByIdAndDelete(req.params.id);

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({ error: 'Failed to delete story' });
    }
});

module.exports = router;
