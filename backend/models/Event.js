const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        trim: true
    },
    endTime: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    category: {
        type: String,
        enum: ['worship', 'bible-study', 'youth', 'community', 'mission', 'fellowship', 'prayer', 'other'],
        default: 'other'
    },
    type: {
        type: String,
        enum: ['single', 'recurring', 'series'],
        default: 'single'
    },
    recurrence: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        interval: {
            type: Number,
            default: 1
        },
        endAfter: {
            type: Number
        },
        endDate: {
            type: Date
        }
    },
    // Media
    image: {
        type: String
    },
    videoUrl: {
        type: String
    },
    // Registration
    requiresRegistration: {
        type: Boolean,
        default: false
    },
    maxAttendees: {
        type: Number
    },
    currentAttendees: {
        type: Number,
        default: 0
    },
    registrationDeadline: {
        type: Date
    },
    // Status and visibility
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
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
    // Contact information
    contactPerson: {
        name: String,
        email: String,
        phone: String
    },
    // Additional details
    tags: [{
        type: String,
        trim: true
    }],
    targetAudience: {
        type: String,
        enum: ['all', 'youth', 'adults', 'children', 'families', 'seniors'],
        default: 'all'
    },
    cost: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'PHP'
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
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isFeatured: 1 });
eventSchema.index({ 'startDate': 1, 'endDate': 1 });

// Virtual for formatted date range
eventSchema.virtual('formattedDateRange').get(function() {
    const start = this.startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    if (this.startDate.toDateString() === this.endDate.toDateString()) {
        return start;
    }
    
    const end = this.endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `${start} - ${end}`;
});

// Virtual for time range
eventSchema.virtual('formattedTimeRange').get(function() {
    if (!this.startTime && !this.endTime) return null;
    
    if (this.startTime && this.endTime) {
        return `${this.startTime} - ${this.endTime}`;
    }
    
    return this.startTime || this.endTime;
});

// Virtual for registration status
eventSchema.virtual('registrationStatus').get(function() {
    if (!this.requiresRegistration) return 'not-required';
    if (this.currentAttendees >= this.maxAttendees) return 'full';
    if (this.registrationDeadline && new Date() > this.registrationDeadline) return 'closed';
    return 'open';
});

module.exports = mongoose.model('Event', eventSchema); 