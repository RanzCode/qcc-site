const express = require('express');
const { google } = require('googleapis');
const { body, validationResult } = require('express-validator');
// const SabbathSchool = require('../models/SabbathSchool');
const { authenticateToken, requirePermission, requireEditor } = require('../middleware/auth');

const router = express.Router();

// Initialize YouTube API
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// File intentionally left blank as Sabbath School Lessons routes are removed.

// Get featured Sabbath School lessons
router.get('/featured', async (req, res) => {
    try {
        const lessons = await SabbathSchool.find({
            status: 'published',
            isPublic: true,
            isFeatured: true
        })
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1 })
        .limit(6);

        res.json({ lessons });
    } catch (error) {
        console.error('Get featured Sabbath School lessons error:', error);
        res.status(500).json({ error: 'Failed to get featured lessons' });
    }
});

// Get single Sabbath School lesson (public)
router.get('/:id', async (req, res) => {
    try {
        const lesson = await SabbathSchool.findOne({
            _id: req.params.id,
            status: 'published',
            isPublic: true
        }).populate('createdBy', 'firstName lastName');

        if (!lesson) {
            return res.status(404).json({ error: 'Sabbath School lesson not found' });
        }

        // Increment view count
        lesson.viewCount += 1;
        await lesson.save();

        res.json({ lesson });
    } catch (error) {
        console.error('Get Sabbath School lesson error:', error);
        res.status(500).json({ error: 'Failed to get Sabbath School lesson' });
    }
});

// Create Sabbath School lesson (admin/editor only)
router.post('/', requireEditor, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('lessonNumber').isNumeric().withMessage('Lesson number is required'),
    body('quarter').trim().notEmpty().withMessage('Quarter is required'),
    body('year').isNumeric().withMessage('Year is required'),
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

        const lessonData = {
            ...req.body,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        };

        const lesson = new SabbathSchool(lessonData);
        await lesson.save();

        res.status(201).json({
            message: 'Sabbath School lesson created successfully',
            lesson
        });
    } catch (error) {
        console.error('Create Sabbath School lesson error:', error);
        res.status(500).json({ error: 'Failed to create Sabbath School lesson' });
    }
});

// Update Sabbath School lesson (admin/editor only)
router.put('/:id', requireEditor, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            lastUpdatedBy: req.user._id
        };

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

// Delete Sabbath School lesson (admin/editor only)
router.delete('/:id', requireEditor, async (req, res) => {
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

// Fetch Sabbath School lessons from YouTube playlist
router.post('/fetch-youtube', requireEditor, async (req, res) => {
    try {
        const { maxResults = 50 } = req.body;
        const playlistId = process.env.YOUTUBE_SABBATH_SCHOOL_PLAYLIST_ID;

        if (!playlistId) {
            return res.status(400).json({ error: 'Sabbath School playlist ID not configured' });
        }

        // Get videos from Sabbath School playlist
        const playlistResponse = await youtube.playlistItems.list({
            part: 'snippet',
            playlistId: playlistId,
            maxResults: parseInt(maxResults)
        });

        const videos = playlistResponse.data.items;
        const newLessons = [];
        const updatedLessons = [];

        for (const video of videos) {
            const videoId = video.snippet.resourceId.videoId;
            const title = video.snippet.title;
            const description = video.snippet.description;
            const publishedAt = new Date(video.snippet.publishedAt);

            // Check if lesson already exists
            let lesson = await SabbathSchool.findOne({ youtubeVideoId: videoId });

            if (lesson) {
                // Update existing lesson with new YouTube data
                lesson.youtubeViewCount = video.snippet.statistics?.viewCount || 0;
                lesson.youtubeThumbnail = video.snippet.thumbnails?.high?.url;
                lesson.lastUpdatedBy = req.user._id;
                await lesson.save();
                updatedLessons.push(lesson);
            } else {
                // Create new lesson
                const lessonData = {
                    title,
                    description,
                    date: publishedAt,
                    lessonNumber: 1, // Default, can be updated later
                    quarter: 'Q1', // Default, can be updated later
                    year: new Date().getFullYear(),
                    youtubeVideoId: videoId,
                    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    youtubeThumbnail: video.snippet.thumbnails?.high?.url,
                    status: 'draft', // Start as draft for review
                    createdBy: req.user._id,
                    lastUpdatedBy: req.user._id
                };

                lesson = new SabbathSchool(lessonData);
                await lesson.save();
                newLessons.push(lesson);
            }
        }

        res.json({
            message: 'Sabbath School lessons fetched successfully',
            newLessons: newLessons.length,
            updatedLessons: updatedLessons.length,
            totalProcessed: videos.length
        });
    } catch (error) {
        console.error('Fetch Sabbath School lessons error:', error);
        res.status(500).json({ error: 'Failed to fetch Sabbath School lessons' });
    }
});

// Get Sabbath School statistics (admin only)
router.get('/stats/overview', authenticateToken, requirePermission('sabbathSchool'), async (req, res) => {
    try {
        const stats = await SabbathSchool.aggregate([
            {
                $group: {
                    _id: null,
                    totalLessons: { $sum: 1 },
                    publishedLessons: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                    draftLessons: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    totalViews: { $sum: '$viewCount' }
                }
            }
        ]);

        const quarterStats = await SabbathSchool.aggregate([
            {
                $group: {
                    _id: '$quarter',
                    count: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const yearStats = await SabbathSchool.aggregate([
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        res.json({
            overview: stats[0] || { totalLessons: 0, publishedLessons: 0, draftLessons: 0, totalViews: 0 },
            quarterStats,
            yearStats
        });
    } catch (error) {
        console.error('Get Sabbath School stats error:', error);
        res.status(500).json({ error: 'Failed to get Sabbath School statistics' });
    }
});

// Get all Sabbath School lessons for admin (admin only)
router.get('/admin/all', authenticateToken, requirePermission('sabbathSchool'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, quarter, year } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (quarter) filter.quarter = quarter;
        if (year) filter.year = parseInt(year);

        const lessons = await SabbathSchool.find(filter)
            .populate('createdBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await SabbathSchool.countDocuments(filter);

        res.json({
            lessons,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get admin Sabbath School lessons error:', error);
        res.status(500).json({ error: 'Failed to get Sabbath School lessons' });
    }
});

module.exports = router; 