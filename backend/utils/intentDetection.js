// Lightweight, deterministic intent classifier for the church chat AI.
// Keyword/regex based on purpose - the chatbot's content volume and query
// patterns don't justify a second LLM call or a vector classifier just to
// route a question to the right knowledge category.
//
// Order matters: more specific/high-priority intents are checked first so
// e.g. "I want to talk to someone about donating" resolves to CONTACT_STAFF
// (explicit human request) rather than DONATION.

const INTENT_PATTERNS = [
    {
        intent: 'CONTACT_STAFF',
        patterns: [
            /\btalk to (a |an )?(real )?(person|human|someone|staff|admin)\b/i,
            /\bspeak (with|to) (a |an )?(staff|someone|person|admin|human)\b/i,
            /\b(need|want) a (real )?(person|human)\b/i,
            /\bdon'?t want to talk to (an? )?ai\b/i,
            /\bcan (someone|an admin|a staff member) contact me\b/i,
            /\bcontact (the )?(church )?staff\b/i,
            /\bspeak (with|to) the pastor\b/i,
            /\bchurch office\b/i,
            /\bhuman (support|assistance|help)\b/i
        ]
    },
    {
        intent: 'PRAYER_REQUEST',
        patterns: [
            /\bprayer request\b/i,
            /\b(can you |please )?pray for me\b/i,
            /\bi (need|want|have) (a )?prayer\b/i,
            /\bneed prayer\b/i,
            /\bsubmit a prayer\b/i
        ]
    },
    {
        intent: 'DONATION',
        patterns: [
            /\bdonat(e|ion|ing)\b/i,
            /\bgiv(e|ing)\b.*\b(church|tithe|offering)\b/i,
            /\bhow (can|do) i give\b/i,
            /\btithe\b/i,
            /\boffering\b/i,
            /\bbank (account|transfer|details)\b/i,
            /\bgcash\b/i,
            /\bbdo\b/i,
            /\bbuilding fund\b/i,
            /\bmission (project|fund)s?\b/i,
            /\b(send|make) a donation\b/i,
            /\bpaypal|stripe\b/i
        ]
    },
    {
        intent: 'LIVESTREAM',
        patterns: [
            /\blive ?stream\b/i,
            /\bwatch (the |our )?(service|worship)( online)?\b/i,
            /\bwatch online\b/i,
            /\bis (it|the service) live\b/i
        ]
    },
    {
        intent: 'SERVICE_TIME',
        patterns: [
            /\bwhat time\b.*\b(sabbath school|worship|service|start)\b/i,
            /\b(worship|service) (time|schedule|hours)\b/i,
            /\bsabbath school\b.*\btime\b/i,
            /\bwhen (does|is) (worship|sabbath school|service)\b/i,
            /\bafternoon programs?\b/i
        ]
    },
    {
        intent: 'EVENT',
        patterns: [
            /\bevents?\b/i,
            /\bchurch camp\b/i,
            /\bupcoming\b/i,
            /\bcoming up\b/i,
            /\bregist(er|ration)\b/i,
            /\bcalendar\b/i,
            /\byouth fellowship\b/i,
            /\bbible study\b.*\bwhen\b/i
        ]
    },
    {
        intent: 'MINISTRY',
        patterns: [
            /\bministr(y|ies)\b/i,
            /\byouth (group|program)\b/i,
            /\bchildren'?s (ministry|program)\b/i,
            /\bbible study group\b/i,
            /\bprayer ministry\b/i
        ]
    },
    {
        intent: 'LEADERSHIP',
        patterns: [
            /\bwho is the pastor\b/i,
            /\bsenior pastor\b/i,
            /\bchurch elder\b/i,
            /\bhead deacon\b/i,
            /\bwho leads\b/i,
            /\bpastor'?s name\b/i
        ]
    },
    {
        intent: 'SOCIAL_MEDIA',
        patterns: [
            /\bfacebook\b/i,
            /\binstagram\b/i,
            /\byoutube\b/i,
            /\bsocial media\b/i,
            /\bfollow (you|the church)\b/i
        ]
    },
    {
        intent: 'LOCATION',
        patterns: [
            /\bwhere (is|are you|'?re you) located\b/i,
            /\bwhere is the church\b/i,
            /\baddress\b/i,
            /\bdirections\b/i,
            /\bhow (do|can) i get there\b/i,
            /\blocation\b/i
        ]
    },
    {
        intent: 'CHURCH_INFORMATION',
        patterns: [
            /\bwhen was.*(founded|established)\b/i,
            /\bmission\b/i,
            /\bvision\b/i,
            /\bcore values\b/i,
            /\bwhat do you believe\b/i,
            /\bbeliefs?\b/i,
            /\babout (the )?church\b/i,
            /\bwho are you\b/i,
            /\bphone( number)?\b/i,
            /\bemail( address)?\b/i,
            /\bmessenger\b/i,
            /\bcontact (info|information|number)\b/i,
            /\bhow (can|do) i contact\b/i
        ]
    }
];

const CATEGORY_BY_INTENT = {
    DONATION: ['DONATION'],
    CONTACT_STAFF: ['CONTACT'],
    LOCATION: ['CONTACT', 'CHURCH_INFORMATION'],
    SERVICE_TIME: ['WORSHIP_SCHEDULE'],
    LIVESTREAM: ['LIVESTREAM'],
    SOCIAL_MEDIA: ['SOCIAL_MEDIA'],
    LEADERSHIP: ['LEADERSHIP'],
    MINISTRY: ['MINISTRY'],
    EVENT: ['EVENT'],
    CHURCH_INFORMATION: ['CHURCH_INFORMATION', 'CONTACT', 'MISSION', 'VISION', 'VALUES', 'BELIEFS', 'SOCIAL_MEDIA'],
    PRAYER_REQUEST: [],
    GENERAL_QUESTION: [],
    UNKNOWN: []
};

function detectIntent(message) {
    const text = (message || '').trim();
    if (!text) return 'UNKNOWN';

    for (const group of INTENT_PATTERNS) {
        if (group.patterns.some((re) => re.test(text))) {
            return group.intent;
        }
    }

    return 'GENERAL_QUESTION';
}

function categoriesForIntent(intent) {
    return CATEGORY_BY_INTENT[intent] || [];
}

// Intents that mean "this needs a human, or the user asked for one" -
// used by chat.js to flag the conversation/response for escalation.
const ESCALATION_INTENTS = new Set(['CONTACT_STAFF', 'PRAYER_REQUEST']);

function requiresEscalation(intent) {
    return ESCALATION_INTENTS.has(intent);
}

module.exports = {
    detectIntent,
    categoriesForIntent,
    requiresEscalation
};
