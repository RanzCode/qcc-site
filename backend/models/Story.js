const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    }
}, {
    timestamps: true
});

storySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
