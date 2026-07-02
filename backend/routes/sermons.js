const express = require('express');
const { google } = require('googleapis');
const { body, validationResult } = require('express-validator');
const Sermon = require('../models/Sermon');
const { authenticateToken, requirePermission, requireEditor } = require('../middleware/auth');
const { detectPlatform } = require('../utils/embedUtils');

const router = express.Router();

// Initialize YouTube API
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Get all sermons (public)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, preacher, status = 'published', featured } = req.query;
        const skip = (page - 1) * limit;

        const filter = { status, isPublic: true };
        if (preacher) filter.preacher = preacher;
        if (featured === 'true') filter.isFeatured = true;

        const sermons = await Sermon.find(filter)
            .populate('createdBy', 'firstName lastName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Sermon.countDocuments(filter);

        res.json({
            sermons,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get sermons error:', error);
        res.status(500).json({ error: 'Failed to get sermons' });
    }
});

// Get featured sermons
router.get('/featured', async (req, res) => {
    try {
        const sermons = await Sermon.find({
            status: 'published',
            isPublic: true,
            isFeatured: true
        })
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1 })
        .limit(6);

        res.json({ sermons });
    } catch (error) {
        console.error('Get featured sermons error:', error);
        res.status(500).json({ error: 'Failed to get featured sermons' });
    }
});

// Get single sermon (public)
router.get('/:id', async (req, res) => {
    try {
        const sermon = await Sermon.findOne({
            _id: req.params.id,
            status: 'published',
            isPublic: true
        }).populate('createdBy', 'firstName lastName');

        if (!sermon) {
            return res.status(404).json({ error: 'Sermon not found' });
        }

        // Increment view count
        sermon.viewCount += 1;
        await sermon.save();

        res.json({ sermon });
    } catch (error) {
        console.error('Get sermon error:', error);
        res.status(500).json({ error: 'Failed to get sermon' });
    }
});

// Create sermon (admin/editor only)
router.post('/', authenticateToken, requireEditor, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('preacher').trim().notEmpty().withMessage('Preacher is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('description').optional().trim(),
    body('scripture').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const sermonData = {
            ...req.body,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        };

        if (sermonData.videoUrl) {
            sermonData.videoPlatform = detectPlatform(sermonData.videoUrl).platform;
        }

        const sermon = new Sermon(sermonData);
        await sermon.save();

        res.status(201).json({
            message: 'Sermon created successfully',
            sermon
        });
    } catch (error) {
        console.error('Create sermon error:', error);
        res.status(500).json({ error: 'Failed to create sermon' });
    }
});

// Update sermon (admin/editor only)
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            lastUpdatedBy: req.user._id
        };

        if (updates.videoUrl) {
            updates.videoPlatform = detectPlatform(updates.videoUrl).platform;
        }

        const sermon = await Sermon.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName');

        if (!sermon) {
            return res.status(404).json({ error: 'Sermon not found' });
        }

        res.json({
            message: 'Sermon updated successfully',
            sermon
        });
    } catch (error) {
        console.error('Update sermon error:', error);
        res.status(500).json({ error: 'Failed to update sermon' });
    }
});

// Delete sermon (admin/editor only)
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
    try {
        const sermon = await Sermon.findByIdAndDelete(req.params.id);
        
        if (!sermon) {
            return res.status(404).json({ error: 'Sermon not found' });
        }

        res.json({ message: 'Sermon deleted successfully' });
    } catch (error) {
        console.error('Delete sermon error:', error);
        res.status(500).json({ error: 'Failed to delete sermon' });
    }
});

// Fetch sermons from the Sermons YouTube playlist
router.post('/fetch-youtube', authenticateToken, requireEditor, async (req, res) => {
    try {
        const { maxResults = 50 } = req.body;
        const playlistId = process.env.YOUTUBE_SERMONS_PLAYLIST_ID;

        if (!playlistId) {
            return res.status(400).json({ error: 'Sermons playlist ID not configured' });
        }

        // Get videos from the Sermons playlist
        const playlistResponse = await youtube.playlistItems.list({
            part: 'snippet',
            playlistId: playlistId,
            maxResults: parseInt(maxResults)
        });

        const videos = playlistResponse.data.items;
        const newSermons = [];
        const updatedSermons = [];

        for (const video of videos) {
            const videoId = video.snippet.resourceId.videoId;
            const title = video.snippet.title;
            const description = video.snippet.description;
            const publishedAt = new Date(video.snippet.publishedAt);

            // Check if sermon already exists
            let sermon = await Sermon.findOne({ youtubeVideoId: videoId });

            if (sermon) {
                // Update existing sermon with new YouTube data
                sermon.youtubeViewCount = video.snippet.statistics?.viewCount || 0;
                sermon.youtubeThumbnail = video.snippet.thumbnails?.high?.url;
                sermon.lastUpdatedBy = req.user._id;
                await sermon.save();
                updatedSermons.push(sermon);
            } else {
                // Create new sermon
                const sermonData = {
                    title,
                    description,
                    date: publishedAt,
                    preacher: 'Pastor', // Default, can be updated later
                    youtubeVideoId: videoId,
                    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    youtubeThumbnail: video.snippet.thumbnails?.high?.url,
                    status: 'draft', // Start as draft for review
                    createdBy: req.user._id,
                    lastUpdatedBy: req.user._id
                };

                sermon = new Sermon(sermonData);
                await sermon.save();
                newSermons.push(sermon);
            }
        }

        res.json({
            message: 'YouTube videos fetched successfully',
            newSermons: newSermons.length,
            updatedSermons: updatedSermons.length,
            totalProcessed: videos.length
        });
    } catch (error) {
        console.error('Fetch YouTube videos error:', error);
        res.status(500).json({ error: 'Failed to fetch YouTube videos' });
    }
});

// Get sermon statistics (admin only)
router.get('/stats/overview', authenticateToken, requirePermission('sermons'), async (req, res) => {
    try {
        const stats = await Sermon.aggregate([
            {
                $group: {
                    _id: null,
                    totalSermons: { $sum: 1 },
                    publishedSermons: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                    draftSermons: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    totalViews: { $sum: '$viewCount' },
                    totalDownloads: { $sum: '$downloadCount' }
                }
            }
        ]);

        const preacherStats = await Sermon.aggregate([
            {
                $group: {
                    _id: '$preacher',
                    count: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const monthlyStats = await Sermon.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            overview: stats[0] || { totalSermons: 0, publishedSermons: 0, draftSermons: 0, totalViews: 0, totalDownloads: 0 },
            preacherStats,
            monthlyStats
        });
    } catch (error) {
        console.error('Get sermon stats error:', error);
        res.status(500).json({ error: 'Failed to get sermon statistics' });
    }
});

// Get all sermons for admin (admin only)
router.get('/admin/all', authenticateToken, requirePermission('sermons'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, preacher } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (preacher) filter.preacher = preacher;

        const sermons = await Sermon.find(filter)
            .populate('createdBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Sermon.countDocuments(filter);

        res.json({
            sermons,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get admin sermons error:', error);
        res.status(500).json({ error: 'Failed to get sermons' });
    }
});

module.exports = router; 