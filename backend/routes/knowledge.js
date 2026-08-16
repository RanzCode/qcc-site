const express = require('express');
const { body, validationResult } = require('express-validator');
const KnowledgeBase = require('../models/KnowledgeBase');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = [
    'CHURCH_INFORMATION', 'CONTACT', 'SOCIAL_MEDIA', 'WORSHIP_SCHEDULE',
    'LEADERSHIP', 'MISSION', 'VISION', 'VALUES', 'BELIEFS', 'MINISTRY',
    'DONATION', 'EVENT', 'LIVESTREAM', 'FAQ', 'OTHER'
];
const STATUSES = ['VERIFIED', 'UNVERIFIED', 'CONFLICTING', 'OUTDATED', 'DISABLED'];
const SOURCES = ['ADMIN_VERIFIED', 'OFFICIAL_WEBSITE', 'OTHER_APPROVED_CHURCH_SOURCE'];

// All routes here are admin/editor-only - this is the church's ground-truth
// data for the chatbot, not public content.
router.use(authenticateToken, requirePermission('knowledge'));

// List / search knowledge entries
router.get('/', async (req, res) => {
    try {
        const { category, status, search, page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (search) filter.$text = { $search: search };

        const entries = await KnowledgeBase.find(filter)
            .sort(search ? { score: { $meta: 'textScore' } } : { category: 1, title: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('lastUpdatedBy', 'firstName lastName')
            .lean();

        const total = await KnowledgeBase.countDocuments(filter);

        res.json({
            entries,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('List knowledge error:', error);
        res.status(500).json({ error: 'Failed to load knowledge entries' });
    }
});

// Flag entries that need admin attention (conflicting/outdated/unverified) -
// backs the "needs verification" banner in the dashboard.
router.get('/needs-attention', async (req, res) => {
    try {
        const entries = await KnowledgeBase.find({
            status: { $in: ['CONFLICTING', 'OUTDATED', 'UNVERIFIED'] }
        }).sort({ status: 1, updatedAt: -1 }).lean();

        res.json({ entries });
    } catch (error) {
        console.error('Knowledge needs-attention error:', error);
        res.status(500).json({ error: 'Failed to load flagged knowledge entries' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const entry = await KnowledgeBase.findById(req.params.id).populate('lastUpdatedBy', 'firstName lastName');
        if (!entry) return res.status(404).json({ error: 'Knowledge entry not found' });
        res.json({ entry });
    } catch (error) {
        console.error('Get knowledge entry error:', error);
        res.status(500).json({ error: 'Failed to load knowledge entry' });
    }
});

const validateBody = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').isIn(CATEGORIES).withMessage('Valid category is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('status').optional().isIn(STATUSES),
    body('source').optional().isIn(SOURCES),
    body('requiresVerification').optional().isBoolean(),
    body('key').optional().trim()
];

router.post('/', validateBody, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { title, category, content, structuredData, tags, source, sourceUrl, sourcePage, status, requiresVerification, conflictNotes, key } = req.body;

        const entry = new KnowledgeBase({
            key: key || undefined,
            title, category, content, structuredData, tags, source, sourceUrl, sourcePage, conflictNotes,
            status: status || 'VERIFIED',
            requiresVerification: Boolean(requiresVerification),
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        });

        await entry.save();
        res.status(201).json({ message: 'Knowledge entry created', entry });
    } catch (error) {
        console.error('Create knowledge entry error:', error);
        if (error.code === 11000) return res.status(400).json({ error: 'An entry with that key already exists' });
        res.status(500).json({ error: 'Failed to create knowledge entry' });
    }
});

router.put('/:id', validateBody, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { title, category, content, structuredData, tags, source, sourceUrl, sourcePage, status, requiresVerification, conflictNotes, key } = req.body;

        const entry = await KnowledgeBase.findByIdAndUpdate(
            req.params.id,
            {
                title, category, content, structuredData, tags, source, sourceUrl, sourcePage, conflictNotes, status,
                requiresVerification: Boolean(requiresVerification),
                key: key || undefined,
                lastUpdatedBy: req.user._id
            },
            { new: true, runValidators: true }
        );

        if (!entry) return res.status(404).json({ error: 'Knowledge entry not found' });
        res.json({ message: 'Knowledge entry updated', entry });
    } catch (error) {
        console.error('Update knowledge entry error:', error);
        res.status(500).json({ error: 'Failed to update knowledge entry' });
    }
});

// Mark an entry as verified "as-is" - clears CONFLICTING/OUTDATED/UNVERIFIED
// once an admin has confirmed the current content is correct.
router.post('/:id/verify', async (req, res) => {
    try {
        const entry = await KnowledgeBase.findByIdAndUpdate(
            req.params.id,
            {
                status: 'VERIFIED',
                requiresVerification: false,
                conflictNotes: undefined,
                lastVerifiedAt: new Date(),
                lastVerifiedBy: req.user._id,
                lastUpdatedBy: req.user._id
            },
            { new: true }
        );
        if (!entry) return res.status(404).json({ error: 'Knowledge entry not found' });
        res.json({ message: 'Knowledge entry verified', entry });
    } catch (error) {
        console.error('Verify knowledge entry error:', error);
        res.status(500).json({ error: 'Failed to verify knowledge entry' });
    }
});

// Disable without deleting (keeps history, stops the AI from retrieving it)
router.post('/:id/disable', async (req, res) => {
    try {
        const entry = await KnowledgeBase.findByIdAndUpdate(
            req.params.id,
            { status: 'DISABLED', lastUpdatedBy: req.user._id },
            { new: true }
        );
        if (!entry) return res.status(404).json({ error: 'Knowledge entry not found' });
        res.json({ message: 'Knowledge entry disabled', entry });
    } catch (error) {
        console.error('Disable knowledge entry error:', error);
        res.status(500).json({ error: 'Failed to disable knowledge entry' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const entry = await KnowledgeBase.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).json({ error: 'Knowledge entry not found' });
        res.json({ message: 'Knowledge entry deleted' });
    } catch (error) {
        console.error('Delete knowledge entry error:', error);
        res.status(500).json({ error: 'Failed to delete knowledge entry' });
    }
});

module.exports = router;
