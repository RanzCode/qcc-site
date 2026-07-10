const mongoose = require('mongoose');

const eventLinkSchema = new mongoose.Schema({
    eventTitle: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    facebookUrl: {
        type: String,
        required: true,
        trim: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EventLink', eventLinkSchema);
