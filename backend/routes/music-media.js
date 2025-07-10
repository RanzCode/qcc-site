const express = require('express');
const { google } = require('googleapis');
const { body, validationResult } = require('express-validator');
const MusicMedia = require('../models/MusicMedia');
const { authenticateToken, requirePermission, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Initialize YouTube API
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Get all music media (public)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, category, artist, status = 'published', featured } = req.query;
        const skip = (page - 1) * limit;

        const filter = { status, isPublic: true };
        if (category) filter.category = category;
        if (artist) filter.artist = artist;
        if (featured === 'true') filter.isFeatured = true;

        const music = await MusicMedia.find(filter)
            .populate('createdBy', 'firstName lastName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MusicMedia.countDocuments(filter);

        res.json({
            music,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get music media error:', error);
        res.status(500).json({ error: 'Failed to get music media' });
    }
});

// Get featured music media
router.get('/featured', async (req, res) => {
    try {
        const music = await MusicMedia.find({
            status: 'published',
            isPublic: true,
            isFeatured: true
        })
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1 })
        .limit(6);

        res.json({ music });
    } catch (error) {
        console.error('Get featured music media error:', error);
        res.status(500).json({ error: 'Failed to get featured music media' });
    }
});

// Get single music media (public)
router.get('/:id', async (req, res) => {
    try {
        const music = await MusicMedia.findOne({
            _id: req.params.id,
            status: 'published',
            isPublic: true
        }).populate('createdBy', 'firstName lastName');

        if (!music) {
            return res.status(404).json({ error: 'Music media not found' });
        }

        // Increment view count
        music.viewCount += 1;
        await music.save();

        res.json({ music });
    } catch (error) {
        console.error('Get music media error:', error);
        res.status(500).json({ error: 'Failed to get music media' });
    }
});

// Create music media (admin/editor only)
router.post('/', requireEditor, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('artist').trim().notEmpty().withMessage('Artist is required'),
    body('category').isIn(['worship', 'hymn', 'gospel', 'praise', 'instrumental', 'choir', 'other']).withMessage('Valid category is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('description').optional().trim(),
    body('lyrics').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const musicData = {
            ...req.body,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        };

        const music = new MusicMedia(musicData);
        await music.save();

        res.status(201).json({
            message: 'Music media created successfully',
            music
        });
    } catch (error) {
        console.error('Create music media error:', error);
        res.status(500).json({ error: 'Failed to create music media' });
    }
});

// Update music media (admin/editor only)
router.put('/:id', requireEditor, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            lastUpdatedBy: req.user._id
        };

        const music = await MusicMedia.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName');

        if (!music) {
            return res.status(404).json({ error: 'Music media not found' });
        }

        res.json({
            message: 'Music media updated successfully',
            music
        });
    } catch (error) {
        console.error('Update music media error:', error);
        res.status(500).json({ error: 'Failed to update music media' });
    }
});

// Delete music media (admin/editor only)
router.delete('/:id', requireEditor, async (req, res) => {
    try {
        const music = await MusicMedia.findByIdAndDelete(req.params.id);
        
        if (!music) {
            return res.status(404).json({ error: 'Music media not found' });
        }

        res.json({ message: 'Music media deleted successfully' });
    } catch (error) {
        console.error('Delete music media error:', error);
        res.status(500).json({ error: 'Failed to delete music media' });
    }
});

// Fetch music media from YouTube playlist
router.post('/fetch-youtube', requireEditor, async (req, res) => {
    try {
        const { maxResults = 50 } = req.body;
        const playlistId = process.env.YOUTUBE_MUSIC_PLAYLIST_ID;

        if (!playlistId) {
            return res.status(400).json({ error: 'Music playlist ID not configured' });
        }

        // Get videos from music playlist
        const playlistResponse = await youtube.playlistItems.list({
            part: 'snippet',
            playlistId: playlistId,
            maxResults: parseInt(maxResults)
        });

        const videos = playlistResponse.data.items;
        const newMusic = [];
        const updatedMusic = [];

        for (const video of videos) {
            const videoId = video.snippet.resourceId.videoId;
            const title = video.snippet.title;
            const description = video.snippet.description;
            const publishedAt = new Date(video.snippet.publishedAt);

            // Check if music already exists
            let music = await MusicMedia.findOne({ youtubeVideoId: videoId });

            if (music) {
                // Update existing music with new YouTube data
                music.youtubeViewCount = video.snippet.statistics?.viewCount || 0;
                music.youtubeThumbnail = video.snippet.thumbnails?.high?.url;
                music.lastUpdatedBy = req.user._id;
                await music.save();
                updatedMusic.push(music);
            } else {
                // Create new music
                const musicData = {
                    title,
                    description,
                    date: publishedAt,
                    artist: 'Unknown Artist', // Default, can be updated later
                    category: 'other', // Default, can be updated later
                    youtubeVideoId: videoId,
                    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    youtubeThumbnail: video.snippet.thumbnails?.high?.url,
                    status: 'draft', // Start as draft for review
                    createdBy: req.user._id,
                    lastUpdatedBy: req.user._id
                };

                music = new MusicMedia(musicData);
                await music.save();
                newMusic.push(music);
            }
        }

        res.json({
            message: 'Music media fetched successfully',
            newMusic: newMusic.length,
            updatedMusic: updatedMusic.length,
            totalProcessed: videos.length
        });
    } catch (error) {
        console.error('Fetch music media error:', error);
        res.status(500).json({ error: 'Failed to fetch music media' });
    }
});

// Get music media statistics (admin only)
router.get('/stats/overview', authenticateToken, requirePermission('musicMedia'), async (req, res) => {
    try {
        const stats = await MusicMedia.aggregate([
            {
                $group: {
                    _id: null,
                    totalMusic: { $sum: 1 },
                    publishedMusic: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                    draftMusic: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    totalViews: { $sum: '$viewCount' },
                    totalPlays: { $sum: '$playCount' }
                }
            }
        ]);

        const categoryStats = await MusicMedia.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const artistStats = await MusicMedia.aggregate([
            {
                $group: {
                    _id: '$artist',
                    count: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            overview: stats[0] || { totalMusic: 0, publishedMusic: 0, draftMusic: 0, totalViews: 0, totalPlays: 0 },
            categoryStats,
            artistStats
        });
    } catch (error) {
        console.error('Get music media stats error:', error);
        res.status(500).json({ error: 'Failed to get music media statistics' });
    }
});

// Get all music media for admin (admin only)
router.get('/admin/all', authenticateToken, requirePermission('musicMedia'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, category, artist } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (artist) filter.artist = artist;

        const music = await MusicMedia.find(filter)
            .populate('createdBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MusicMedia.countDocuments(filter);

        res.json({
            music,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get admin music media error:', error);
        res.status(500).json({ error: 'Failed to get music media' });
    }
});

module.exports = router; 