const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendContactNotification, sendNewsletterConfirmation } = require('../config/email');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Submit contact form
router.post('/submit', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').isIn(['general', 'prayer', 'membership', 'volunteer', 'other']).withMessage('Valid subject is required'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, email, phone, subject, message } = req.body;

        // Create contact record
        const contact = new Contact({
            firstName,
            lastName,
            email,
            phone,
            subject,
            message,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await contact.save();

        // Send email notification to admin
        const emailResult = await sendContactNotification({
            firstName,
            lastName,
            email,
            phone,
            subject,
            message
        });

        if (!emailResult.success) {
            console.error('Email notification failed:', emailResult.error);
            // Still return success to user, but log the email failure
        }

        res.status(201).json({
            message: 'Contact form submitted successfully',
            contactId: contact._id
        });
    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ error: 'Failed to submit contact form' });
    }
});

// Newsletter subscription
router.post('/newsletter', [
    body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        // Send confirmation email
        const emailResult = await sendNewsletterConfirmation(email);

        if (!emailResult.success) {
            console.error('Newsletter confirmation email failed:', emailResult.error);
            return res.status(500).json({ error: 'Failed to send confirmation email' });
        }

        res.json({
            message: 'Successfully subscribed to newsletter'
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
});

// Get all contact submissions (admin only)
router.get('/', authenticateToken, requirePermission('contacts'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, subject } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (subject) filter.subject = subject;

        const contacts = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(filter);

        res.json({
            contacts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Failed to get contacts' });
    }
});

// Get single contact submission (admin only)
router.get('/:id', authenticateToken, requirePermission('contacts'), async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ contact });
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({ error: 'Failed to get contact' });
    }
});

// Update contact status (admin only)
router.patch('/:id/status', authenticateToken, requirePermission('contacts'), [
    body('status').isIn(['new', 'read', 'replied', 'archived']).withMessage('Valid status required'),
    body('adminNotes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status, adminNotes } = req.body;
        const updates = { status };

        if (status === 'read' && !req.body.isRead) {
            updates.isRead = true;
        }

        if (adminNotes !== undefined) {
            updates.adminNotes = adminNotes;
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({
            message: 'Contact status updated',
            contact
        });
    } catch (error) {
        console.error('Update contact status error:', error);
        res.status(500).json({ error: 'Failed to update contact status' });
    }
});

// Delete contact submission (admin only)
router.delete('/:id', authenticateToken, requirePermission('contacts'), async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// Get contact statistics (admin only)
router.get('/stats/overview', authenticateToken, requirePermission('contacts'), async (req, res) => {
    try {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
                    read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
                    replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } },
                    archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } }
                }
            }
        ]);

        const subjectStats = await Contact.aggregate([
            {
                $group: {
                    _id: '$subject',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const recentContacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName subject status createdAt');

        res.json({
            overview: stats[0] || { total: 0, new: 0, read: 0, replied: 0, archived: 0 },
            subjectStats,
            recentContacts
        });
    } catch (error) {
        console.error('Get contact stats error:', error);
        res.status(500).json({ error: 'Failed to get contact statistics' });
    }
});

module.exports = router; 