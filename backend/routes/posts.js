const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { detectPlatform } = require('../utils/embedUtils');

const router = express.Router();

// Get active posts (public)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 });

        res.json({ posts });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// Get all posts (admin only)
router.get('/admin/all', authenticateToken, requirePermission('posts'), async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate('createdBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName')
            .sort({ order: 1, createdAt: -1 });

        res.json({ posts });
    } catch (error) {
        console.error('Get admin posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// Create post (admin only)
router.post('/', authenticateToken, requirePermission('posts'), [
    body('url').trim().notEmpty().withMessage('URL is required'),
    body('title').optional().trim(),
    body('order').optional().isNumeric().withMessage('Order must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { url, title, order, isActive } = req.body;
        const { platform, embedUrl } = detectPlatform(url);

        if (platform === 'unknown' || !embedUrl) {
            return res.status(400).json({ error: 'URL must be a valid YouTube, Facebook, or Instagram link' });
        }

        const post = new Post({
            url,
            platform,
            embedUrl,
            title,
            order,
            isActive,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        });

        await post.save();

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update post (admin only)
router.put('/:id', authenticateToken, requirePermission('posts'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            lastUpdatedBy: req.user._id
        };

        if (updates.url) {
            const { platform, embedUrl } = detectPlatform(updates.url);
            if (platform === 'unknown' || !embedUrl) {
                return res.status(400).json({ error: 'URL must be a valid YouTube, Facebook, or Instagram link' });
            }
            updates.platform = platform;
            updates.embedUrl = embedUrl;
        }

        const post = await Post.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName');

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({
            message: 'Post updated successfully',
            post
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post (admin only)
router.delete('/:id', authenticateToken, requirePermission('posts'), async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

module.exports = router;
