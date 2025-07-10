const mongoose = require('mongoose');

const musicMediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    artist: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['worship', 'hymn', 'gospel', 'praise', 'instrumental', 'choir', 'other'],
        default: 'other'
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    lyrics: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    // YouTube integration
    youtubeVideoId: {
        type: String,
        unique: true,
        sparse: true
    },
    youtubeUrl: {
        type: String
    },
    youtubeThumbnail: {
        type: String
    },
    youtubeDuration: {
        type: String
    },
    youtubeViewCount: {
        type: Number,
        default: 0
    },
    // Local media
    audioFile: {
        type: String
    },
    videoFile: {
        type: String
    },
    // Status and visibility
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    // Analytics
    viewCount: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    playCount: {
        type: Number,
        default: 0
    },
    // Metadata
    language: {
        type: String,
        default: 'English'
    },
    album: {
        type: String,
        trim: true
    },
    year: {
        type: Number
    },
    // Admin fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
musicMediaSchema.index({ date: -1 });
musicMediaSchema.index({ status: 1 });
musicMediaSchema.index({ artist: 1 });
musicMediaSchema.index({ category: 1 });
musicMediaSchema.index({ isFeatured: 1 });
musicMediaSchema.index({ youtubeVideoId: 1 });

// Virtual for formatted date
musicMediaSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for YouTube embed URL
musicMediaSchema.virtual('youtubeEmbedUrl').get(function() {
    if (this.youtubeVideoId) {
        return `https://www.youtube.com/embed/${this.youtubeVideoId}`;
    }
    return null;
});

module.exports = mongoose.model('MusicMedia', musicMediaSchema); 