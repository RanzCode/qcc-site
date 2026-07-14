const mongoose = require('mongoose');

// Singleton document backing the "Featured Event" block on events.html
// (currently the Annual Church Camp card) — one record holds its dates
// and the two button links so admins can edit them without touching code.
const featuredEventSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    viewDetailsUrl: {
        type: String,
        trim: true
    },
    registerUrl: {
        type: String,
        trim: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FeaturedEvent', featuredEventSchema);
