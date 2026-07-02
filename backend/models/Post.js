const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true
    },
    platform: {
        type: String,
        enum: ['youtube', 'facebook', 'instagram'],
        required: true
    },
    embedUrl: {
        type: String,
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

postSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Post', postSchema);
