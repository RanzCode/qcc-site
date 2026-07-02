const express = require('express');
const { body, validationResult } = require('express-validator');
const SabbathSchool = require('../models/SabbathSchool');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { normalizeGoogleSlidesUrl } = require('../utils/embedUtils');

const router = express.Router();

// Get active Sabbath School slides (public)
router.get('/', async (req, res) => {
    try {
        const lessons = await SabbathSchool.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 });

        res.json({ lessons });
    } catch (error) {
        console.error('Get Sabbath School lessons error:', error);
        res.status(500).json({ error: 'Failed to get Sabbath School lessons' });
    }
});

// Get all Sabbath School slides (admin only)
router.get('/admin/all', authenticateToken, requirePermission('sabbathSchool'), async (req, res) => {
    try {
        const lessons = await SabbathSchool.find({})
            .populate('createdBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName')
            .sort({ order: 1, createdAt: -1 });

        res.json({ lessons });
    } catch (error) {
        console.error('Get admin Sabbath School lessons error:', error);
        res.status(500).json({ error: 'Failed to get Sabbath School lessons' });
    }
});

// Create Sabbath School slide (admin only)
router.post('/', authenticateToken, requirePermission('sabbathSchool'), [
    body('slideUrl').trim().notEmpty().withMessage('Slide URL is required'),
    body('title').optional().trim(),
    body('order').optional().isNumeric().withMessage('Order must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { slideUrl, title, order, isActive } = req.body;
        const embedUrl = normalizeGoogleSlidesUrl(slideUrl);

        if (!embedUrl) {
            return res.status(400).json({ error: 'URL must be a valid Google Slides presentation link' });
        }

        const lesson = new SabbathSchool({
            slideUrl,
            embedUrl,
            title,
            order,
            isActive,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        });

        await lesson.save();

        res.status(201).json({
            message: 'Sabbath School slide created successfully',
            lesson
        });
    } catch (error) {
        console.error('Create Sabbath School lesson error:', error);
        res.status(500).json({ error: 'Failed to create Sabbath School lesson' });
    }
});

// Update Sabbath School slide (admin only)
router.put('/:id', authenticateToken, requirePermission('sabbathSchool'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            lastUpdatedBy: req.user._id
        };

        if (updates.slideUrl) {
            const embedUrl = normalizeGoogleSlidesUrl(updates.slideUrl);
            if (!embedUrl) {
                return res.status(400).json({ error: 'URL must be a valid Google Slides presentation link' });
            }
            updates.embedUrl = embedUrl;
        }

        const lesson = await SabbathSchool.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName');

        if (!lesson) {
            return res.status(404).json({ error: 'Sabbath School lesson not found' });
        }

        res.json({
            message: 'Sabbath School lesson updated successfully',
            lesson
        });
    } catch (error) {
        console.error('Update Sabbath School lesson error:', error);
        res.status(500).json({ error: 'Failed to update Sabbath School lesson' });
    }
});

// Delete Sabbath School slide (admin only)
router.delete('/:id', authenticateToken, requirePermission('sabbathSchool'), async (req, res) => {
    try {
        const lesson = await SabbathSchool.findByIdAndDelete(req.params.id);

        if (!lesson) {
            return res.status(404).json({ error: 'Sabbath School lesson not found' });
        }

        res.json({ message: 'Sabbath School lesson deleted successfully' });
    } catch (error) {
        console.error('Delete Sabbath School lesson error:', error);
        res.status(500).json({ error: 'Failed to delete Sabbath School lesson' });
    }
});

module.exports = router;
