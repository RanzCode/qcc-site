const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        // Optional so the chatbot's "leave your info" panel can capture a
        // single name field without forcing a last name split.
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['general', 'prayer', 'membership', 'volunteer', 'other', 'chat-support'],
        default: 'general'
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'contacted', 'resolved', 'archived'],
        default: 'new'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    adminNotes: {
        type: String,
        trim: true
    },
    // Where this request came from - lets admins tell chatbot escalations
    // apart from the contact.html web form.
    source: {
        type: String,
        enum: ['website_form', 'chatbot'],
        default: 'website_form'
    },
    preferredContactMethod: {
        type: String,
        enum: ['email', 'phone', 'messenger', 'any'],
        default: 'any'
    },
    // Links back to the ChatConversation this request was raised from, when
    // source is 'chatbot'.
    conversationId: {
        type: String,
        trim: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ source: 1 });

module.exports = mongoose.model('Contact', contactSchema); 