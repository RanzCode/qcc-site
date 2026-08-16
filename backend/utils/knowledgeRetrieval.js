// Retrieval layer for the church chat AI: turns a user message + detected
// intent into a grounded "here are the verified facts" system message,
// instead of the AI relying on a giant hardcoded prompt or its own general
// knowledge for church-specific questions.
//
// Two sources are combined:
//   1. KnowledgeBase (admin-curated, mostly static facts - contact info,
//      donation methods, leadership, schedule, etc.)
//   2. Live Mongo queries (Event/FeaturedEvent) for anything time-sensitive,
//      so the AI never repeats a stale hardcoded event date.

const KnowledgeBase = require('../models/KnowledgeBase');
const Event = require('../models/Event');
const FeaturedEvent = require('../models/FeaturedEvent');
const { categoriesForIntent } = require('./intentDetection');

const MAX_RESULTS = 8;

async function retrieveKnowledge(message, intent) {
    const categories = categoriesForIntent(intent);
    const seen = new Map();

    if (categories.length) {
        const byCategory = await KnowledgeBase.find({
            category: { $in: categories },
            status: { $ne: 'DISABLED' }
        }).limit(MAX_RESULTS).lean();

        byCategory.forEach((doc) => seen.set(String(doc._id), doc));
    }

    // Fallback / supplement: full-text search across everything else so
    // GENERAL_QUESTION / UNKNOWN intents (or category misses) still have a
    // shot at finding a relevant FAQ-style entry instead of going in blind.
    if (seen.size < MAX_RESULTS && message && message.trim().length > 2) {
        try {
            const textMatches = await KnowledgeBase.find(
                { $text: { $search: message }, status: { $ne: 'DISABLED' } },
                { score: { $meta: 'textScore' } }
            ).sort({ score: { $meta: 'textScore' } }).limit(MAX_RESULTS).lean();

            textMatches.forEach((doc) => {
                if (!seen.has(String(doc._id))) seen.set(String(doc._id), doc);
            });
        } catch (err) {
            // $text requires the text index; ignore failures (e.g. during
            // tests against a fresh DB before indexes build) rather than
            // breaking the chat response.
            console.error('Knowledge text search failed:', err.message);
        }
    }

    return Array.from(seen.values()).slice(0, MAX_RESULTS);
}

// Live, non-hardcoded snapshot of upcoming events + the featured event
// (Annual Church Camp), so an outdated FeaturedEvent record is detected at
// query time rather than needing an admin to manually flag it.
async function getLiveEventsSnapshot() {
    const now = new Date();

    const [upcoming, featured] = await Promise.all([
        Event.find({ status: 'published', startDate: { $gte: now } })
            .sort({ startDate: 1 })
            .limit(5)
            .select('title category startDate endDate location requiresRegistration')
            .lean(),
        FeaturedEvent.findOne().sort({ updatedAt: -1 }).lean()
    ]);

    let featuredStatus = null;
    if (featured) {
        featuredStatus = {
            startDate: featured.startDate,
            endDate: featured.endDate,
            viewDetailsUrl: featured.viewDetailsUrl || null,
            registerUrl: featured.registerUrl || null,
            isPast: featured.endDate ? new Date(featured.endDate) < now : false
        };
    }

    return { upcoming, featured: featuredStatus };
}

function formatStructuredData(data) {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) return '';
    try {
        return `  Structured facts: ${JSON.stringify(data)}`;
    } catch {
        return '';
    }
}

function formatKnowledgeDoc(doc) {
    const lines = [`- [${doc.category}] ${doc.title} (status: ${doc.status}${doc.requiresVerification ? ', REQUIRES VERIFICATION' : ''})`];
    lines.push(`  ${doc.content}`);
    if (doc.status === 'CONFLICTING' && doc.conflictNotes) {
        lines.push(`  CONFLICT DETAILS: ${doc.conflictNotes}`);
    }
    const structured = formatStructuredData(doc.structuredData);
    if (structured) lines.push(structured);
    return lines.join('\n');
}

function formatLiveEvents({ upcoming, featured }) {
    const lines = ['[EVENT] Live event data (query at response time - always current):'];

    if (upcoming && upcoming.length) {
        lines.push('  Upcoming published events:');
        upcoming.forEach((ev) => {
            const start = ev.startDate ? new Date(ev.startDate).toDateString() : 'date TBA';
            lines.push(`    - ${ev.title} (${ev.category}) - ${start}${ev.location ? ' at ' + ev.location : ''}${ev.requiresRegistration ? ' [registration required]' : ''}`);
        });
    } else {
        lines.push('  No published upcoming events currently in the database.');
    }

    if (featured) {
        if (featured.isPast) {
            lines.push(`  Featured event (e.g. Annual Church Camp) on file is OUTDATED - its end date (${new Date(featured.endDate).toDateString()}) is in the past. Do NOT present it as upcoming.`);
        } else {
            lines.push(`  Featured event on file: ${new Date(featured.startDate).toDateString()} - ${new Date(featured.endDate).toDateString()}.`);
            if (featured.viewDetailsUrl) lines.push(`    View details: ${featured.viewDetailsUrl}`);
            if (featured.registerUrl) lines.push(`    Register: ${featured.registerUrl}`);
            if (!featured.viewDetailsUrl && !featured.registerUrl) lines.push('    No registration link is configured yet - do not invent one.');
        }
    } else {
        lines.push('  No featured event is currently configured.');
    }

    return lines.join('\n');
}

// Builds the system message injected into the OpenAI request for this turn.
async function buildRetrievedKnowledgeMessage(message, intent) {
    const docs = await retrieveKnowledge(message, intent);
    const parts = [];

    if (docs.length) {
        parts.push(docs.map(formatKnowledgeDoc).join('\n'));
    }

    if (intent === 'EVENT') {
        const liveEvents = await getLiveEventsSnapshot();
        parts.push(formatLiveEvents(liveEvents));
    }

    if (!parts.length) {
        return [
            'RETRIEVED CHURCH KNOWLEDGE: No verified knowledge base entries matched this question.',
            'Do not invent an answer. Say you do not currently have verified information about this, and offer to connect the user with the church (phone, email, or Messenger) if relevant.'
        ].join('\n');
    }

    return [
        'RETRIEVED CHURCH KNOWLEDGE (authoritative for this response - use ONLY these facts for church-specific details; never invent facts not listed here):',
        parts.join('\n\n'),
        '',
        'Rules for using the above:',
        '- status VERIFIED: state it directly and confidently, as your own answer - do not say "check the website" or "I have information that says".',
        '- status CONFLICTING: do NOT pick one of the conflicting values. Explain that the church\'s own sources currently disagree, and direct the user to confirm with the church directly (phone/email/Messenger).',
        '- status OUTDATED, or an event/date flagged outdated above: do NOT present it as current or upcoming. Say the on-file info looks outdated and offer to connect them with the church for the current details.',
        '- status UNVERIFIED: you may share it but note it has not been formally verified yet.',
        '- A temporary/personal donation method (e.g. GCash) must always be described as temporary, never as a permanent official church account.'
    ].join('\n');
}

module.exports = {
    retrieveKnowledge,
    getLiveEventsSnapshot,
    buildRetrievedKnowledgeMessage
};
