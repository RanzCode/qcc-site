const mongoose = require('mongoose');

// Structured, admin-editable facts the chat AI retrieves and grounds its
// answers in, instead of the church's information being baked into the
// system prompt. See backend/utils/knowledgeRetrieval.js for how this is
// queried per chat message, and backend/scripts/seed-knowledge-base.js for
// the initial verified content.
const knowledgeBaseSchema = new mongoose.Schema({
    // Stable slug used by the seed script for idempotent upserts and by
    // code that needs to reference a specific fact (e.g. the worship
    // schedule conflict banner in the admin dashboard).
    key: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'CHURCH_INFORMATION', 'CONTACT', 'SOCIAL_MEDIA', 'WORSHIP_SCHEDULE',
            'LEADERSHIP', 'MISSION', 'VISION', 'VALUES', 'BELIEFS', 'MINISTRY',
            'DONATION', 'EVENT', 'LIVESTREAM', 'FAQ', 'OTHER'
        ]
    },
    // Human-readable, ready-to-relay answer text. This is what gets fed to
    // the LLM as ground truth, so it should already contain any required
    // caveats (e.g. "this GCash account is temporary").
    content: {
        type: String,
        required: true,
        trim: true
    },
    // Machine-usable facts (phone numbers, URLs, bank details, etc.) kept
    // alongside the prose so admins/UIs can render them as structured
    // fields instead of parsing content.
    structuredData: {
        type: mongoose.Schema.Types.Mixed
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    source: {
        type: String,
        enum: ['ADMIN_VERIFIED', 'OFFICIAL_WEBSITE', 'OTHER_APPROVED_CHURCH_SOURCE'],
        default: 'ADMIN_VERIFIED'
    },
    sourceUrl: {
        type: String,
        trim: true
    },
    sourcePage: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['VERIFIED', 'UNVERIFIED', 'CONFLICTING', 'OUTDATED', 'DISABLED'],
        default: 'VERIFIED'
    },
    requiresVerification: {
        type: Boolean,
        default: false
    },
    // Populated when status is CONFLICTING - explains what differs across
    // sources so the AI (and admins) can explain the conflict instead of
    // guessing which value is right.
    conflictNotes: {
        type: String,
        trim: true
    },
    lastVerifiedAt: {
        type: Date
    },
    lastVerifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

knowledgeBaseSchema.index({ category: 1, status: 1 });
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
