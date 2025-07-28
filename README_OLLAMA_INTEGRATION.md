# Ollama AI Integration for Quezon Central Church

This document provides a complete guide to the Ollama AI integration for the Quezon Central Free Seventh Day Adventist Church chatbot.

## 🎯 Overview

The chatbot now integrates with Ollama AI to provide doctrinally sound, loving responses based on:
- **Holy Bible (King James Version)**
- **Writings of Ellen G. White (Spirit of Prophecy)**
- **Free Seventh Day Adventist beliefs**

## ✨ Features

### 🤖 AI-Powered Responses
- **Doctrinally Aligned**: All responses uphold FSDA beliefs
- **Biblical Foundation**: Based on Scripture and Spirit of Prophecy
- **Loving Tone**: Christ-centered, encouraging, respectful
- **Context-Aware**: Understands different types of questions

### 🛡️ Safety & Reliability
- **Fallback System**: Graceful handling when Ollama is unavailable
- **Response Filtering**: Automatic content filtering for appropriateness
- **Error Handling**: User-friendly error messages
- **Rate Limiting**: Prevents abuse and ensures stability

### 📚 Knowledge Areas
- **Bible Questions**: Clear explanations with Scripture references
- **Doctrinal Questions**: Accurate FSDA doctrine explanations
- **Prayer Requests**: Biblical comfort and encouragement
- **Health Principles**: Biblical health guidance
- **Church Information**: Helpful church-related information

## 🚀 Quick Start

### 1. Install Ollama
```bash
# Windows: Download from https://ollama.ai/download
# macOS/Linux:
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Install and Start Ollama
```bash
# Start Ollama service
ollama serve

# Pull a model (in new terminal)
ollama pull llama2
```

### 3. Configure Environment
```bash
cd backend
cp env.example .env
# Edit .env with your Ollama settings
```

### 4. Install Dependencies
```bash
cd backend
npm install
```

### 5. Start the Backend
```bash
npm run dev
```

### 6. Test Integration
```bash
npm run test-ollama
```

## 📋 Configuration

### Environment Variables
```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2  # or llama2:13b, llama2:70b
```

### Model Selection
- **llama2** (7B): Fast, good for basic responses
- **llama2:13b** (13B): Better quality, moderate speed
- **llama2:70b** (70B): Best quality, slower responses

## 🧪 Testing

### Automated Tests
```bash
# Test Ollama connection and responses
npm run test-ollama
```

### Manual Testing
1. Open your church website
2. Click the chat widget
3. Try these test questions:
   - "What is the Sabbath?"
   - "How do I know I'm saved?"
   - "Can you pray for me?"
   - "What does the Bible say about health?"

## 🔧 Troubleshooting

### Ollama Not Responding
```bash
# Check if Ollama is running
ollama serve

# Verify model is available
ollama list

# Test direct API call
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "Hello", "stream": false}'
```

### Backend Issues
```bash
# Check backend health
curl http://localhost:3001/api/chat/health

# Check server logs
npm run dev
```

### Performance Issues
- **Slow responses**: Try a smaller model (llama2 instead of llama2:70b)
- **Memory issues**: Ensure adequate RAM for your chosen model
- **High CPU**: Consider using a more powerful machine

## 📖 Doctrinal Alignment

### Core Beliefs Upheld
1. **Sabbath Observance**: Friday sunset to Saturday sunset
2. **Second Coming**: Literal, visible return of Christ
3. **State of the Dead**: Soul sleep (conditional immortality)
4. **Health Principles**: Biblical health and temperance
5. **Salvation**: By grace through faith in Christ
6. **Great Controversy**: Cosmic conflict theme
7. **Sanctuary Message**: Christ's heavenly ministry
8. **Three Angels' Messages**: End-time proclamation

### Response Guidelines
- **Biblical Foundation**: Always cite Scripture
- **Loving Tone**: Christ-like compassion and respect
- **Doctrinal Accuracy**: Aligned with FSDA beliefs
- **Practical Application**: Connect to daily Christian living
- **Encouragement**: Build up and inspire

## 🛡️ Safety Features

### Content Filtering
- **Inappropriate Language**: Automatic filtering and replacement
- **Response Length**: Limited to prevent overwhelming users
- **Doctrinal Checking**: Ensures alignment with FSDA beliefs

### Fallback System
When Ollama is unavailable:
- **Context-Aware Responses**: Based on question type
- **Graceful Degradation**: User-friendly error messages
- **Contact Information**: Direct users to church resources

### Error Handling
- **Network Issues**: Automatic retry with fallback
- **Model Errors**: Graceful degradation to fallback responses
- **Timeout Protection**: 10-second timeout for API calls

## 📊 Monitoring

### Health Checks
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check backend health
curl http://localhost:3001/api/chat/health
```

### Performance Metrics
- **Response Time**: Target < 5 seconds
- **Success Rate**: Target > 95%
- **User Satisfaction**: Monitor through feedback
- **Doctrinal Accuracy**: Regular review of responses

## 🔄 Continuous Improvement

### Response Quality
1. **Monitor Responses**: Track user satisfaction
2. **Update Prompts**: Refine based on feedback
3. **Add Examples**: Include more specific scenarios
4. **Expand Knowledge**: Add more biblical references

### Model Optimization
1. **Fine-tuning**: Consider custom model training
2. **Prompt Engineering**: Refine system prompts
3. **Temperature Tuning**: Adjust creativity vs accuracy
4. **Context Length**: Optimize for longer conversations

## 🚀 Advanced Features

### Custom Model Training
```bash
# Create custom Modelfile
FROM llama2
SYSTEM "You are a helpful AI assistant for the Quezon Central Free Seventh Day Adventist Church..."

# Build custom model
ollama create church-assistant -f Modelfile
```

### Multi-language Support
- **Current**: English
- **Future**: Filipino/Tagalog
- **Implementation**: Multiple language models

### Analytics Integration
- **Usage Tracking**: Monitor popular questions
- **Response Quality**: Track user satisfaction
- **Performance Metrics**: Monitor response times
- **Doctrinal Review**: Regular content audits

## 📚 Resources

### Documentation
- [Ollama Setup Guide](backend/OLLAMA_SETUP_GUIDE.md)
- [FSDA Prompt Design](backend/FSDA_PROMPT_DESIGN.md)
- [API Documentation](backend/routes/chat.js)

### Support
- **Ollama Issues**: https://ollama.ai/docs
- **Backend Issues**: Check server logs and API responses
- **Frontend Issues**: Check browser console for JavaScript errors

### Church Resources
- **SDA Fundamental Beliefs**: Official doctrinal statements
- **Sabbath School Lessons**: Weekly Bible study
- **Ellen G. White Writings**: Spirit of Prophecy
- **Church Manual**: Administrative guidelines

## 🤝 Contributing

### Improving Responses
1. **Test Questions**: Try different types of questions
2. **Feedback**: Report issues or suggest improvements
3. **Prompt Refinement**: Help improve system prompts
4. **Documentation**: Update guides and examples

### Development
1. **Fork Repository**: Create your own copy
2. **Make Changes**: Implement improvements
3. **Test Thoroughly**: Ensure doctrinal accuracy
4. **Submit Pull Request**: Share your improvements

## 📄 License

This integration is part of the Quezon Central Church website project. All responses are designed to uphold Free Seventh Day Adventist beliefs and provide loving, biblical guidance to users.

---

**Note**: This AI integration is designed to assist and encourage users in their spiritual journey. For complex theological questions or personal counseling, users are encouraged to consult with church leaders and pastors. 