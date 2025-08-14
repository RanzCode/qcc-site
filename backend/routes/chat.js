const express = require('express');
const axios = require('axios');
const router = express.Router();

// Ollama API configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest';

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

// Store conversation histories in memory (consider using a database for production)
const conversationHistories = new Map();

// Chat endpoint that maintains conversation history
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or initialize conversation history
        let history = conversationHistories.get(conversationId) || [];
        
        // Create a simpler prompt for faster processing
        const lastMessages = history.slice(-4); // Only keep last 2 exchanges (4 messages)
        let formattedPrompt = "You are a helpful church assistant. Be concise.\n\n";
        
        // Add recent conversation history
        for (const msg of lastMessages) {
            if (msg.role === 'user') {
                formattedPrompt += "Human: " + msg.content + "\n";
            } else if (msg.role === 'assistant') {
                formattedPrompt += "Assistant: " + msg.content + "\n";
            }
        }
        
        // Add the current message
        formattedPrompt += "Human: " + message + "\nAssistant:";

        // Configure axios request with timeout and error handling
        const axiosConfig = {
            timeout: 60000, // 60 second timeout
            validateStatus: function (status) {
                return status >= 200 && status < 300; // Only accept success status codes
            }
        };

        // Make request to Ollama
        const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
            model: OLLAMA_MODEL,
            prompt: formattedPrompt,
            stream: false
        }, axiosConfig);

        // Get the assistant's response
        const assistantMessage = response.data.response;

        // Update conversation history
        history = [
            ...history,
            { role: 'user', content: message },
            { role: 'assistant', content: assistantMessage }
        ];

        // Keep only the last 10 messages to prevent context from getting too long
        if (history.length > 20) {
            history = history.slice(history.length - 20);
        }

        // Store updated history
        conversationHistories.set(conversationId, history);

        // Send response back to client
        res.json({
            response: assistantMessage,
            conversationId: conversationId
        });

    } catch (error) {
        console.error('Chat error:', error);
        
        let errorMessage = 'An error occurred while processing your request.';
        let statusCode = 500;

        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to Ollama. Please make sure Ollama is running.';
            statusCode = 503;
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            errorMessage = 'The request took too long to process. Please try a shorter message or try again later.';
        const response = await axios.post(
            `${OLLAMA_BASE_URL}/api/generate`,
            {
                model: OLLAMA_MODEL,
                prompt: formattedPrompt,
                stream: false
            },
            axiosConfig
        });
    }
});

// Endpoint to clear conversation history
router.delete('/chat/:conversationId', (req, res) => {
    const { conversationId } = req.params;
    conversationHistories.delete(conversationId);
    res.json({ message: 'Conversation history cleared' });
});
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