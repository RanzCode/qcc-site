const express = require('express');
const { body, validationResult } = require('express-validator');
const ChatConversation = require('../models/ChatConversation');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requirePermission('conversations'));

// List conversations (most recently active first), with optional status filter
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;

        const conversations = await ChatConversation.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('conversationId lastIntent status createdAt updatedAt contactRequestId')
            .populate('assignedTo', 'firstName lastName')
            .lean();

        const total = await ChatConversation.countDocuments(filter);

        res.json({
            conversations,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('List conversations error:', error);
        res.status(500).json({ error: 'Failed to load conversations' });
    }
});

router.get('/:conversationId', async (req, res) => {
    try {
        const conversation = await ChatConversation.findOne({ conversationId: req.params.conversationId })
            .populate('assignedTo', 'firstName lastName')
            .populate('contactRequestId');

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ conversation });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Failed to load conversation' });
    }
});

router.patch('/:conversationId/status', [
    body('status').isIn(['AI_HANDLED', 'NEEDS_HUMAN', 'CONTACT_REQUESTED', 'CONTACTED', 'RESOLVED']).withMessage('Valid status required'),
    body('assignedTo').optional({ nullable: true }).isMongoId()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const updates = { status: req.body.status };
        if (req.body.assignedTo !== undefined) updates.assignedTo = req.body.assignedTo || null;

        const conversation = await ChatConversation.findOneAndUpdate(
            { conversationId: req.params.conversationId },
            updates,
            { new: true }
        ).populate('assignedTo', 'firstName lastName');

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ message: 'Conversation updated', conversation });
    } catch (error) {
        console.error('Update conversation error:', error);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
});

module.exports = router;
