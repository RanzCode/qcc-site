const express = require('express');
const axios = require('axios');
const router = express.Router();

// Ollama API configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// FSDA Doctrinal System Prompt
const FSDA_SYSTEM_PROMPT = `You are a helpful AI assistant for the Quezon Central Free Seventh Day Adventist Church. Your responses must be:

1. **Doctrinally Sound**: Based on the Holy Bible (King James Version), the writings of Ellen G. White (Spirit of Prophecy), and Free Seventh Day Adventist beliefs.

2. **Key Doctrines to Uphold**:
   - Sabbath observance (Friday sunset to Saturday sunset)
   - Second Coming of Christ
   - State of the dead (soul sleep)
   - Health principles (temperance, vegetarianism, clean living)
   - The Great Controversy theme
   - Salvation by grace through faith
   - The sanctuary message
   - The three angels' messages

3. **Tone**: Always loving, respectful, encouraging, and Christ-centered. Avoid judgmental language.

4. **Sources**: Base responses on:
   - The Holy Bible (KJV)
   - Writings of Ellen G. White
   - Official Seventh Day Adventist beliefs
   - Free Seventh Day Adventist principles

5. **Response Guidelines**:
   - For Bible questions: Provide clear, accurate explanations with relevant Scripture
   - For doctrinal questions: Explain with love and clarity
   - For prayer requests: Offer encouragement and biblical comfort
   - For health questions: Share biblical health principles
   - Always point to Jesus Christ as the source of hope and salvation

6. **Avoid**: Speculation, non-biblical sources, harsh language, or contradicting established SDA beliefs.

Remember: Your purpose is to help people grow closer to Jesus Christ and understand His truth with love and grace.`;

// Fallback responses for when Ollama is unavailable
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

// Response filtering function
function filterResponse(response) {
  // Remove any potentially inappropriate content
  const inappropriateWords = [
    'damn', 'hell', 'crap', 'shit', 'fuck', 'ass', 'bitch', 'bastard'
  ];
  
  let filteredResponse = response;
  inappropriateWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredResponse = filteredResponse.replace(regex, '***');
  });
  
  // Ensure response is not too long
  if (filteredResponse.length > 1000) {
    filteredResponse = filteredResponse.substring(0, 1000) + '...';
  }
  
  return filteredResponse;
}

// Get appropriate fallback response
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('bible') || lowerMessage.includes('scripture') || lowerMessage.includes('verse')) {
    return FALLBACK_RESPONSES.bible[Math.floor(Math.random() * FALLBACK_RESPONSES.bible.length)];
  } else if (lowerMessage.includes('pray') || lowerMessage.includes('prayer')) {
    return FALLBACK_RESPONSES.prayer[Math.floor(Math.random() * FALLBACK_RESPONSES.prayer.length)];
  } else {
    return FALLBACK_RESPONSES.general[Math.floor(Math.random() * FALLBACK_RESPONSES.general.length)];
  }
}

// Ollama chat endpoint
router.post('/send', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if Ollama is available
    let ollamaResponse;
    try {
      const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: OLLAMA_MODEL,
        prompt: `${FSDA_SYSTEM_PROMPT}\n\nUser: ${message}\n\nAssistant:`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      }, {
        timeout: 10000 // 10 second timeout
      });

      ollamaResponse = response.data.response;
    } catch (ollamaError) {
      console.error('Ollama API error:', ollamaError.message);
      ollamaResponse = null;
    }

    // Use Ollama response if available, otherwise use fallback
    let finalResponse;
    if (ollamaResponse) {
      finalResponse = filterResponse(ollamaResponse);
    } else {
      finalResponse = getFallbackResponse(message);
    }

    const response = {
      message: finalResponse,
      timestamp: new Date().toISOString(),
      source: ollamaResponse ? 'ollama' : 'fallback'
    };

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: getFallbackResponse(req.body?.message || '')
    });
  }
});

// Get chat history (placeholder)
router.get('/history', async (req, res) => {
  try {
    // For now, return empty history
    // Later we'll store chat history in MongoDB
    res.json({ messages: [] });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint for Ollama
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000
    });
    res.json({ 
      status: 'healthy', 
      ollama_available: true,
      models: response.data.models || []
    });
  } catch (error) {
    res.json({ 
      status: 'degraded', 
      ollama_available: false,
      error: error.message 
    });
  }
});

module.exports = router; 