// Ensure env is loaded before anything else
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');

const ChatConversation = require('../models/ChatConversation');
const { detectIntent, requiresEscalation } = require('../utils/intentDetection');
const { buildRetrievedKnowledgeMessage, retrieveKnowledge } = require('../utils/knowledgeRetrieval');

const router = express.Router();

// Rate limiter: 50 requests per 15 minutes per IP
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Too many requests. Please wait a bit and try again.'
    });
  }
});

// Conversation histories in-memory (use persistent DB in production)
const conversationHistories = new Map();

// OpenAI configuration (from .env)
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.4';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Startup warnings for missing config
if (!OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Chat AI will not work until you configure it in backend/.env');
}
if (!OPENAI_MODEL) {
  console.warn('Warning: OPENAI_MODEL is not set. Defaulting to gpt-5. Confirm this model is available for your account.');
}

// Main system prompt (use exactly as required)
const OPENAI_SYSTEM_PROMPT = `IDENTITY AND MISSION

Your purpose is to serve visitors, members, and guests with Christ-centered, Bible-based, doctrinally sound, and compassionate responses.

Your authority is based on:

1. The Holy Bible (King James Version) as the highest authority.
2. The writings of Ellen G. White (Spirit of Prophecy) as an inspired guide consistent with Scripture.
3. Free Seventh Day Adventist beliefs and teachings.

Always point people to Jesus Christ as Savior, Redeemer, High Priest, and Coming King.

RESPONSE STYLE - KEEP IT SHORT AND SPECIFIC

Always be:

- Concise and direct (2-3 sentences maximum for simple questions)
- Loving and respectful
- Encouraging yet humble
- Biblically accurate
- Easy to understand
- Provide specific answers, not lengthy explanations

For church-related questions:
- Check and reference church website information when available
- Provide specific details: times, dates, contact info, locations
- If information is not available, direct them to contact the church directly with the phone number or email
- Keep guidance brief but helpful

Avoid:

- Long-winded responses
- Condemning language
- Harsh judgments
- Political discussions
- Speculation about future events
- Setting dates for Christ's return
- Arguments with other denominations
- Claiming infallibility

TONE: Friendly, brief, and helpful. Answer the question directly without rambling.

REAL-TIME AWARENESS: A "REAL-TIME CONTEXT" system message is included below with the user's actual local date/time, location, and current Sabbath status (before/during/after Friday-sunset-to-Saturday-sunset). Always use that context - never assume it is currently the Sabbath just because it is a Saturday, and never guess the time using server time. Follow its instructions exactly when greeting the user or discussing the Sabbath.
`;

// Behavioral rules for grounding church-specific answers in retrieved
// knowledge instead of the model's general knowledge or a hardcoded fact
// dump. The actual facts (address, bank details, schedule, etc.) are NOT
// here - they come from the RETRIEVED CHURCH KNOWLEDGE system message built
// per-request in utils/knowledgeRetrieval.js, sourced from the KnowledgeBase
// collection so admins can keep it current without a code change.
const CHURCH_ASSISTANT_GROUNDING_RULES = `
You are the official AI assistant for Quezon City Central Church of Free Seventh-Day Adventists, in addition to your role answering Bible/doctrinal questions.

CHURCH-SPECIFIC QUESTIONS (contact info, address, worship schedule, leadership, ministries, donations, events, livestream, social media):
- Use ONLY the facts provided in the "RETRIEVED CHURCH KNOWLEDGE" system message for this turn. Never invent or guess church-specific details (phone numbers, emails, URLs, bank account numbers, dates, staff names, links) that are not present there.
- If verified (status VERIFIED) information is available, answer directly and confidently. Do NOT tell the user to "check the church website" or "visit our website" when you already have the verified answer - just give it to them, and only add a link if it helps them complete an action (e.g. the giving page, a registration link).
- If the retrieved knowledge is marked CONFLICTING, do not pick one value. Say the church's own sources currently disagree, so you don't want to give incorrect information, and offer to connect them with the church (phone, email, or Messenger) to confirm.
- If the retrieved knowledge is marked OUTDATED, or a live event/date is flagged outdated, do not present it as current or upcoming. Say so plainly and offer the appropriate contact channel instead.
- If nothing relevant was retrieved, say you don't currently have verified information about that - do not guess. Offer to connect them with the church if that would help.
- A donation method described as temporary or personal (e.g. a temporary GCash account) must always be identified as temporary - never present it as the church's permanent official account.
- Never ask the user for a credit card number, CVV, bank password, online banking credentials, OTP, ATM PIN, GCash PIN, cryptocurrency private keys/recovery phrases, or any other authentication credential. Direct them to the church's official, verified giving methods instead.

HUMAN ESCALATION:
- If the user asks to speak with a staff member, the pastor, or "a real person", or says they don't want to talk to an AI: acknowledge it warmly, explain that church administrators may not be available 24/7 so response times may vary, and offer the Messenger/email/phone contact details from the retrieved knowledge plus the option to leave their contact info for a follow-up. Never claim an administrator is currently online or that someone will reply immediately.
- If the user submits a prayer request, respond with warmth and offer to pass it along to the church (via the same contact options), in addition to any spiritual encouragement you'd normally give.

Be friendly, respectful, concise, transparent, and helpful. Always prioritize verified retrieved church knowledge over general AI knowledge for anything church-specific.
`;

// Condensed Seventh-day Adventist doctrinal knowledge base injected on every
// request so the model answers doctrinal questions accurately instead of
// generically. See backend/FSDA_PROMPT_DESIGN.md for the full guide.
const SDA_KNOWLEDGE_BASE = `
SDA CORE DOCTRINES - answer according to these when relevant. Always be Christ-centered, biblically accurate, compassionate, encouraging, respectful, and easy to understand. Include relevant Bible verses when appropriate.

- Sabbath: The seventh day (Saturday), from Friday sunset to Saturday sunset; memorial of creation and redemption; a day of rest, worship, and fellowship. Basis: Genesis 2:1-3, Exodus 20:8-11, Isaiah 58:13-14.
- Second Coming: A literal, visible, audible return of Christ. Timing is unknown - never speculate or set dates. Basis: Matthew 24, John 14:1-3, Revelation 1:7.
- State of the Dead: Soul sleep (conditional immortality) - the dead are unconscious until the resurrection. Basis: Ecclesiastes 9:5-6, John 11:11-14, 1 Thessalonians 4:13-18.
- Salvation by Grace: Justification by faith alone in Christ; obedience is the fruit of salvation, not the basis for earning it. Basis: Ephesians 2:8-9, John 3:16, Romans 10:9-10.
- Three Angels' Messages: Revelation 14:6-12 - the everlasting gospel, the call to worship the Creator, and the warning against end-time deception.
- Health Message: The body is the temple of the Holy Spirit; a balanced, plant-forward diet, temperance, rest, and exercise honor God. Basis: 1 Corinthians 6:19-20, 3 John 1:2, Genesis 1:29.
- Sanctuary Doctrine: Christ's ongoing ministry as High Priest in the heavenly sanctuary, illustrated by the earthly sanctuary services. Basis: Hebrews 8-9, Daniel 8:14.
- Prophecy (Daniel & Revelation): A historicist reading of end-time prophecy that points to Christ's soon return; avoid sensationalism or date-setting.

AVOID: judgmental or condemning language, speculation about future events, claims that only SDAs are saved, claims of infallibility, and political discussions.
`;

// Turns the client-provided real-time/location context into an authoritative
// system instruction so the model reasons about the USER'S local date/time
// and Sabbath status instead of guessing or using server time.
function buildContextMessage(context) {
  if (!context || typeof context !== 'object' || !context.localTimeFormatted) {
    return [
      'REAL-TIME CONTEXT: Unavailable. The browser did not report the user\'s local date/time, so you have NO idea what day or time it is for them right now.',
      'Instruction: You MUST NOT say "Happy Sabbath" or otherwise imply it is currently the Sabbath - you cannot verify that, and it may not be true. This applies even if a message looks like a Sabbath greeting.',
      'Instead, respond warmly, explain that you cannot confirm their local time, and briefly note that the Sabbath runs from Friday sunset to Saturday sunset (Genesis 1:5; Leviticus 23:32). You may ask what day/time it is for them if that would help.'
    ].join('\n');
  }

  const lines = [
    'REAL-TIME CONTEXT (authoritative - always use this instead of guessing, assuming, or using server time):',
    `- User's local date/time: ${context.localTimeFormatted}`,
    `- User's timezone: ${context.timeZone || 'unknown'}`,
    `- Approximate location: ${[context.city, context.country].filter(Boolean).join(', ') || 'unknown'}`
  ];

  switch (context.sabbathStatus) {
    case 'before':
      lines.push(`- Sabbath status: NOT YET STARTED. Sabbath begins at local sunset (${context.sabbathStartsAtFormatted || 'this Friday at sunset'}), about ${context.hoursUntilSabbathBegins ?? '?'} hour(s) from now.`);
      lines.push('- Instruction: If greeted with a Sabbath greeting, gently note that the Sabbath has not begun yet, explain it begins at sunset (Genesis 1:5, Leviticus 23:32), and wish them a blessed Preparation Day / "Happy Sabbath in advance." Do NOT say "Happy Sabbath" as if it has already started.');
      break;
    case 'during':
      lines.push(`- Sabbath status: CURRENTLY SABBATH (began ${context.sabbathStartsAtFormatted || 'Friday at sunset'}, ends ${context.sabbathEndsAtFormatted || 'Saturday at sunset'}).`);
      lines.push('- Instruction: Respond with a warm "Happy Sabbath!" greeting and a Sabbath-appropriate blessing of peace, rest, and fellowship with Christ.');
      break;
    case 'after': {
      const recentlyEnded = typeof context.hoursSinceSabbathEnded === 'number' && context.hoursSinceSabbathEnded < 30;
      lines.push(`- Sabbath status: SABBATH HAS ENDED (ended ${context.sabbathEndsAtFormatted || 'Saturday at sunset'}, about ${context.hoursSinceSabbathEnded ?? '?'} hour(s) ago). The next Sabbath begins ${context.sabbathStartsAtFormatted || 'this coming Friday at sunset'}.`);
      lines.push(recentlyEnded
        ? '- Instruction: If greeted about the Sabbath, warmly acknowledge it recently ended and hope they had a meaningful time of worship and fellowship. Do NOT say "Happy Sabbath" as if it is still ongoing.'
        : '- Instruction: It is currently a weekday, well outside the Sabbath window. Respond naturally to the user\'s message; only mention Sabbath timing if asked, and never greet with "Happy Sabbath" right now.');
      break;
    }
    default:
      lines.push('- Sabbath status: unknown (could not determine sunset for this location). Do not assume whether it is currently the Sabbath; if asked, explain Sabbath runs Friday sunset to Saturday sunset.');
  }

  lines.push('- Never respond "Happy Sabbath!" as if it is currently Sabbath unless the status above is explicitly CURRENTLY SABBATH.');

  return lines.join('\n');
}

// Simple filters and fallbacks (removed 'hell' from inappropriate list)
const FALLBACK_RESPONSES = {
  bible: [
    "I'd be happy to help you with Bible questions! However, I'm currently experiencing technical difficulties. Please try again in a moment, or feel free to contact our church directly for spiritual guidance.",
    "Thank you for your question about the Bible. I'm temporarily unavailable, but our church leaders would be glad to help you. You can reach us through our contact page.",
    "I appreciate your interest in God's Word. While I'm getting back online, you might find helpful resources on our church website or by speaking with our pastor."
  ],
  prayer: [
    "I understand you're seeking prayer support. While I'm temporarily unavailable, know that God hears every prayer. Our church prayer team is always ready to pray with you.",
    "Your prayer request is important. I'm currently experiencing technical issues, but please know that God is always listening and our church family is here to support you.",
    "Thank you for sharing your prayer need. I'm temporarily offline, but our church would be honored to pray with you. Please reach out to us directly."
  ],
  general: [
    "Thank you for your message! I'm currently experiencing technical difficulties. Please try again in a moment, or contact our church directly for assistance.",
    "I appreciate your patience. I'm temporarily unavailable but will be back soon to help you with your questions about faith and our church.",
    "Thank you for reaching out to our church. I'm getting back online and will be able to assist you shortly."
  ]
};

function filterResponse(response) {
  const inappropriateWords = ['damn','crap','shit','fuck','ass','bitch','bastard'];
  let filtered = response || '';
  inappropriateWords.forEach(w => {
    const re = new RegExp(w, 'gi');
    filtered = filtered.replace(re, '***');
  });
  if (filtered.length > 2000) filtered = filtered.slice(0, 2000) + '...';
  return filtered;
}

function getFallbackResponse(message) {
  const lower = (message || '').toLowerCase();
  if (lower.includes('bible') || lower.includes('scripture') || lower.includes('verse')) {
    return FALLBACK_RESPONSES.bible[Math.floor(Math.random()*FALLBACK_RESPONSES.bible.length)];
  } else if (lower.includes('pray') || lower.includes('prayer')) {
    return FALLBACK_RESPONSES.prayer[Math.floor(Math.random()*FALLBACK_RESPONSES.prayer.length)];
  }
  return FALLBACK_RESPONSES.general[Math.floor(Math.random()*FALLBACK_RESPONSES.general.length)];
}

// Lightweight model "compatibility" check (best-effort): warn if model name looks unusual
function validateModelName(model) {
  if (!model || typeof model !== 'string') return false;
  // Basic heuristic: OpenAI chat models usually start with "gpt-"
  if (!model.toLowerCase().startsWith('gpt-') && !model.toLowerCase().includes('gpt')) {
    console.warn(`Warning: OPENAI_MODEL value "${model}" does not look like a typical OpenAI chat model. Confirm model name and availability for your account.`);
  }
  return true;
}
validateModelName(OPENAI_MODEL);

// Writes this turn's user/assistant messages onto the ChatConversation doc
// for the Admin Dashboard. Only escalates the stored status to NEEDS_HUMAN
// when this turn actually warrants it - never downgrades a conversation an
// admin has already moved to CONTACT_REQUESTED/CONTACTED/RESOLVED just
// because a later message in the same thread was benign.
async function persistConversationTurn(conversationId, userMessage, assistantMessage, intent, escalate, req) {
  const existing = await ChatConversation.findOne({ conversationId }).select('status');

  const update = {
    $push: {
      messages: {
        $each: [
          { role: 'user', content: userMessage, intent },
          { role: 'assistant', content: assistantMessage }
        ]
      }
    },
    $set: { lastIntent: intent },
    $setOnInsert: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  };

  const settledStatuses = new Set(['CONTACT_REQUESTED', 'CONTACTED', 'RESOLVED']);
  if (!existing) {
    update.$set.status = escalate ? 'NEEDS_HUMAN' : 'AI_HANDLED';
  } else if (escalate && !settledStatuses.has(existing.status)) {
    update.$set.status = 'NEEDS_HUMAN';
  }

  await ChatConversation.findOneAndUpdate(
    { conversationId },
    update,
    { upsert: true, setDefaultsOnInsert: true }
  );
}

// POST /send - primary chat endpoint (with rate limiter)
router.post('/send', chatLimiter, async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;

    // Validate message is present and not just whitespace
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message cannot be empty'
      });
    }

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const convId = conversationId || randomUUID();
    const history = conversationHistories.get(convId) || [];

    // Use only last 6 messages to reduce token usage and cost
    const maxHistory = 6;
    const recent = history.slice(-maxHistory);

    // Classify the message and pull grounded facts for it (see
    // utils/intentDetection.js and utils/knowledgeRetrieval.js). Retrieval
    // failures must never take the chatbot down - fall back to "no
    // knowledge retrieved" rather than 500ing the whole request.
    const intent = detectIntent(message);
    let retrievedKnowledgeMessage;
    let retrievedDocs = [];
    try {
      retrievedDocs = await retrieveKnowledge(message, intent);
      retrievedKnowledgeMessage = await buildRetrievedKnowledgeMessage(message, intent);
    } catch (retrievalError) {
      console.error('Knowledge retrieval error:', retrievalError);
      retrievedKnowledgeMessage = 'RETRIEVED CHURCH KNOWLEDGE: unavailable right now. Do not invent church-specific facts; offer to connect the user with the church instead.';
    }

    // Escalate to a human-contact panel when the user explicitly asked for
    // one, submitted a prayer request, or the only relevant knowledge is a
    // conflicting worship schedule (never guess a time - see section 10).
    const hasConflictingSchedule = retrievedDocs.some((doc) => doc.category === 'WORSHIP_SCHEDULE' && doc.status === 'CONFLICTING');
    const escalate = requiresEscalation(intent) || hasConflictingSchedule;

    // Build messages for OpenAI: system prompt + behavioral grounding rules
    // + SDA doctrinal knowledge + retrieved church knowledge (all static
    // system context), then recent history + real-time context (freshest,
    // highest priority) + user
    const messages = [
      { role: 'system', content: OPENAI_SYSTEM_PROMPT },
      { role: 'system', content: CHURCH_ASSISTANT_GROUNDING_RULES },
      { role: 'system', content: SDA_KNOWLEDGE_BASE },
      { role: 'system', content: retrievedKnowledgeMessage }
    ];
    for (const m of recent) {
      messages.push({ role: m.role, content: m.content });
    }
    messages.push({ role: 'system', content: buildContextMessage(context) });
    messages.push({ role: 'user', content: message });

    // Build base payload (minimal, compatible)
    const basePayload = {
      model: OPENAI_MODEL,
      messages,
      max_completion_tokens: 400 // Keep responses short and specific
    };

    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    };

    let openaiResp;
    try {
      // Try with additional params first if you want (but many newer models reject them)
      const preferredPayload = {
        ...basePayload,
        temperature: 0.3, // Lower temperature for more focused, specific responses
        top_p: 0.85
      };

      openaiResp = await axios.post(OPENAI_API_URL, preferredPayload, requestOptions);
    } catch (err) {
      // If OpenAI says an unsupported parameter was provided, retry with minimal payload
      const body = err.response?.data;
      const message = body?.error?.message || '';
      if (err.response?.status === 400 && /unsupported parameter|unsupported value/i.test(message)) {
        console.warn('OpenAI rejected parameters, retrying with minimal payload.');
        try {
          openaiResp = await axios.post(OPENAI_API_URL, basePayload, requestOptions);
        } catch (err2) {
          // Log both errors for debugging
          console.error('OpenAI retry failed - status:', err2.response?.status);
          console.error('OpenAI retry body:', JSON.stringify(err2.response?.data).slice(0,2000));
          if (err2.code === 'ECONNABORTED') console.error('OpenAI timeout');
          return res.status(502).json({ error: 'AI service error', message: getFallbackResponse(message) });
        }
      } else {
        // Original logging you had
        if (err.response) {
          console.error('OpenAI API error - status:', err.response.status);
          console.error('OpenAI API error - body:', JSON.stringify(err.response.data).slice(0, 2000));
        } else if (err.code === 'ECONNABORTED') {
          console.error('OpenAI API error - timeout:', err.code);
        } else if (err.request) {
          console.error('OpenAI API error - no response, request made:', err.request);
        } else {
          console.error('OpenAI API error -', err.message || err);
        }
        return res.status(502).json({ error: 'AI service error', message: getFallbackResponse(message) });
      }
    }

    const assistantContent = openaiResp?.data?.choices?.[0]?.message?.content?.trim();
    const assistantMessage = assistantContent || getFallbackResponse(message);
    const filtered = filterResponse(assistantMessage);

    const newHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: filtered }
    ].slice(-50);

    conversationHistories.set(convId, newHistory);

    // Persist a durable copy for the Admin Dashboard. This is purely for
    // visibility/audit - the in-memory Map above remains the source of
    // truth for building the next request's context, so a DB hiccup here
    // must never affect the chat reply already being sent to the user.
    persistConversationTurn(convId, message, filtered, intent, escalate, req).catch((persistError) => {
      console.error('Failed to persist chat conversation:', persistError);
    });

    res.json({
      message: filtered,
      timestamp: new Date().toISOString(),
      source: 'openai',
      conversationId: convId,
      intent,
      escalate
    });

  } catch (err) {
    console.error('Chat /send unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', message: getFallbackResponse(req.body?.message || '') });
  }
});

// GET /history/:conversationId - return conversation history
router.get('/history/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const history = conversationHistories.get(conversationId) || [];
  res.json({ messages: history });
});

// DELETE /history/:conversationId - clear history
router.delete('/history/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  conversationHistories.delete(conversationId);
  res.json({ message: 'Conversation cleared' });
});

module.exports = router;

/*
Production-readiness notes and recommendations:

- Secrets: OPENAI_API_KEY in .env is fine for development; in production set it via your host's secret manager and never commit .env.

- Conversation storage: The in-process Map remains the source of truth for building each request's context (unchanged, and lost on restart/unbounded across many concurrent conversations). A durable copy is now also written to the ChatConversation collection (see persistConversationTurn) purely for Admin Dashboard visibility - if you want restart-safe context too, switch the Map lookups to read from Mongo instead of maintaining both.
  - Enforce a strict max history length and consider trimming by token budget rather than message count.

- Rate limiting: Implemented here per-IP. For authenticated users, prefer per-user limits.

- Validation & sanitization: We validate empty messages. Consider length caps on incoming messages.

- Model compatibility: There's a best-effort heuristic check. To fully verify model availability, you can call the OpenAI Models API on startup using the API key and confirm the selected model exists.

- Logging: Current logs print partial OpenAI response data (trimmed). In production route logs should be sent to a log system (Sentry/LogDNA), and avoid logging full sensitive responses.

- Cost control: Reduced history to 6 messages and lower temperature. Consider limiting max_tokens more strictly or implementing optional "concise mode".

- Safety: Filter removes offensive words (removed 'hell'). Review filters to ensure they don't mangle scripture language.

- Timeouts: 60s timeout is conservative. You can shorten it for better UX.

*/