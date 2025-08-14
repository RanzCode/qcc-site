// const mongoose = require('mongoose');

// File intentionally left blank as Sabbath School Lessons model is removed.

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