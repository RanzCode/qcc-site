const mongoose = require('mongoose');

const sabbathSchoolSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        default: 'Sabbath School Lesson'
    },
    slideUrl: {
        type: String,
        required: true,
        trim: true
    },
    embedUrl: {
        type: String,
        required: true
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

sabbathSchoolSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('SabbathSchool', sabbathSchoolSchema);
