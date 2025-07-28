const axios = require('axios');

// Test configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// FSDA System Prompt (same as in chat.js)
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

// Test questions
const testQuestions = [
  "What is the Sabbath?",
  "How do I know I'm saved?",
  "Can you pray for me?",
  "What does the Bible say about health?",
  "When is Jesus coming back?",
  "What happens when we die?",
  "How should I prepare for the Second Coming?",
  "What are the health principles in the Bible?"
];

async function testOllamaConnection() {
  console.log('🔍 Testing Ollama Connection...\n');
  
  try {
    // Test basic connection
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000
    });
    
    console.log('✅ Ollama is running!');
    console.log('📋 Available models:', response.data.models?.map(m => m.name) || ['No models found']);
    console.log('🎯 Using model:', OLLAMA_MODEL);
    console.log('');
    
    return true;
  } catch (error) {
    console.log('❌ Ollama connection failed:', error.message);
    console.log('💡 Make sure Ollama is running: ollama serve');
    console.log('💡 Check if model is installed: ollama pull llama2');
    return false;
  }
}

async function testSingleQuestion(question) {
  try {
    console.log(`🤔 Testing: "${question}"`);
    
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: `${FSDA_SYSTEM_PROMPT}\n\nUser: ${question}\n\nAssistant:`,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      }
    }, {
      timeout: 15000
    });

    const answer = response.data.response;
    console.log(`📝 Response: ${answer.substring(0, 200)}${answer.length > 200 ? '...' : ''}`);
    console.log(`⏱️  Time: ${response.data.eval_duration ? Math.round(response.data.eval_duration / 1000000) + 'ms' : 'N/A'}`);
    console.log('');
    
    return answer;
  } catch (error) {
    console.log(`❌ Error testing "${question}":`, error.message);
    console.log('');
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Ollama Integration Tests\n');
  
  // Test connection
  const isConnected = await testOllamaConnection();
  if (!isConnected) {
    console.log('❌ Cannot proceed without Ollama connection');
    return;
  }
  
  console.log('🧪 Running doctrinal response tests...\n');
  
  // Test each question
  let successCount = 0;
  for (const question of testQuestions) {
    const response = await testSingleQuestion(question);
    if (response) {
      successCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Successful responses: ${successCount}/${testQuestions.length}`);
  console.log(`📈 Success rate: ${Math.round((successCount / testQuestions.length) * 100)}%`);
  
  if (successCount === testQuestions.length) {
    console.log('\n🎉 All tests passed! Ollama integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check Ollama configuration and model availability.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testOllamaConnection, testSingleQuestion }; 