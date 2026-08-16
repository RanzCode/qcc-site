const mongoose = require('mongoose');

// Durable copy of chat widget conversations so admins can review them.
// routes/chat.js still keeps an in-memory Map as the fast path for building
// the next request's context (unchanged behavior); this collection is
// written alongside it purely for visibility/audit and never blocks a
// chat reply if the write fails.
const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    intent: {
        type: String
    }
}, {
    _id: false,
    timestamps: { createdAt: true, updatedAt: false }
});

const chatConversationSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true
    },
    messages: [chatMessageSchema],
    lastIntent: {
        type: String
    },
    status: {
        type: String,
        enum: ['AI_HANDLED', 'NEEDS_HUMAN', 'CONTACT_REQUESTED', 'CONTACTED', 'RESOLVED'],
        default: 'AI_HANDLED'
    },
    contactRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact'
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

chatConversationSchema.index({ updatedAt: -1 });
chatConversationSchema.index({ status: 1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
