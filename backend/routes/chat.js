// Ensure env is loaded before anything else
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');

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
`;

// Extra church-specific context to include after the main system prompt
const CHURCH_CONTEXT = `
Church Name: Quezon Central Free Seventh Day Adventist Church
Location: Quezon City, Philippines
Website: https://your-church-website.com
Contact Phone: [Add church phone]
Contact Email: qccfsda@gmail.com
Senior Pastor: Pastor Erwin Rivas (Senior Pastor - 15+ years of service, passionate about expository preaching and pastoral care)

IMPORTANT INSTRUCTIONS FOR RESPONSES:
- Keep answers SHORT and SPECIFIC (aim for 2-3 sentences for most questions)
- For church-specific questions, include relevant details: times, locations, contact info
- When asked about the pastor or leadership, mention Pastor Erwin Rivas as the Senior Pastor
- If church-specific information is unavailable, politely direct visitors to contact church staff
- Reference the church website for events, schedules, and announcements
- Be helpful and friendly but avoid lengthy explanations
- Always offer to connect them with church staff for complex inquiries
`;

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

// POST /send - primary chat endpoint (with rate limiter)
router.post('/send', chatLimiter, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

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

    // Build messages for OpenAI: system prompt + church context + recent history + user
    const messages = [
      { role: 'system', content: OPENAI_SYSTEM_PROMPT },
      { role: 'system', content: CHURCH_CONTEXT }
    ];
    for (const m of recent) {
      messages.push({ role: m.role, content: m.content });
    }
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

    res.json({
      message: filtered,
      timestamp: new Date().toISOString(),
      source: 'openai',
      conversationId: convId
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

- Conversation storage: Currently stored in-process (Map). This will be lost on server restart and can grow unbounded. For production:
  - Persist per-session conversation histories in a database (MongoDB, Redis).
  - Enforce a strict max history length and consider trimming by token budget rather than message count.

- Rate limiting: Implemented here per-IP. For authenticated users, prefer per-user limits.

- Validation & sanitization: We validate empty messages. Consider length caps on incoming messages.

- Model compatibility: There's a best-effort heuristic check. To fully verify model availability, you can call the OpenAI Models API on startup using the API key and confirm the selected model exists.

- Logging: Current logs print partial OpenAI response data (trimmed). In production route logs should be sent to a log system (Sentry/LogDNA), and avoid logging full sensitive responses.

- Cost control: Reduced history to 6 messages and lower temperature. Consider limiting max_tokens more strictly or implementing optional "concise mode".

- Safety: Filter removes offensive words (removed 'hell'). Review filters to ensure they don't mangle scripture language.

- Timeouts: 60s timeout is conservative. You can shorten it for better UX.

*/