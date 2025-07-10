const mongoose = require('mongoose');

const sermonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    preacher: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    scripture: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    summary: {
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
    transcript: {
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
    // Metadata
    language: {
        type: String,
        default: 'English'
    },
    series: {
        type: String,
        trim: true
    },
    sermonNumber: {
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
sermonSchema.index({ date: -1 });
sermonSchema.index({ status: 1 });
sermonSchema.index({ preacher: 1 });
sermonSchema.index({ tags: 1 });
sermonSchema.index({ isFeatured: 1 });
sermonSchema.index({ youtubeVideoId: 1 });

// Virtual for formatted date
sermonSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for YouTube embed URL
sermonSchema.virtual('youtubeEmbedUrl').get(function() {
    if (this.youtubeVideoId) {
        return `https://www.youtube.com/embed/${this.youtubeVideoId}`;
    }
    return null;
});

module.exports = mongoose.model('Sermon', sermonSchema); 