const mongoose = require('mongoose');

const sabbathSchoolSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    lessonNumber: {
        type: Number,
        required: true
    },
    quarter: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
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
    ageGroup: {
        type: String,
        enum: ['children', 'youth', 'adult', 'all'],
        default: 'all'
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
sabbathSchoolSchema.index({ date: -1 });
sabbathSchoolSchema.index({ status: 1 });
sabbathSchoolSchema.index({ lessonNumber: 1 });
sabbathSchoolSchema.index({ quarter: 1, year: 1 });
sabbathSchoolSchema.index({ isFeatured: 1 });
sabbathSchoolSchema.index({ youtubeVideoId: 1 });

// Virtual for formatted date
sabbathSchoolSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for YouTube embed URL
sabbathSchoolSchema.virtual('youtubeEmbedUrl').get(function() {
    if (this.youtubeVideoId) {
        return `https://www.youtube.com/embed/${this.youtubeVideoId}`;
    }
    return null;
});

module.exports = mongoose.model('SabbathSchool', sabbathSchoolSchema); 