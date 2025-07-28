# Ollama Integration Setup Guide

This guide will help you set up Ollama AI integration for the Quezon Central Church chatbot.

## Prerequisites

- Node.js (v16 or higher)
- Ollama installed on your system
- A compatible AI model (recommended: llama2, llama2:13b, or llama2:70b)

## Step 1: Install Ollama

### Windows
1. Download Ollama from https://ollama.ai/download
2. Run the installer and follow the setup wizard
3. Open PowerShell and verify installation:
   ```powershell
   ollama --version
   ```

### macOS
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## Step 2: Install and Pull a Model

1. Start Ollama:
   ```bash
   ollama serve
   ```

2. Pull a model (recommended options):
   ```bash
   # For basic usage (faster, smaller)
   ollama pull llama3.2:1b
   
   # For balanced performance (recommended)
   ollama pull llama3.2:8b
   
   # For best responses (larger model)
   ollama pull llama3.2:70b
   ```

3. Verify the model is available:
   ```bash
   ollama list
   ```

## Step 3: Configure Environment Variables

1. Copy the environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and configure Ollama settings:
   ```env
   # Ollama Configuration
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   ```

## Step 4: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 5: Test Ollama Connection

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:3001/api/chat/health
   ```

Expected response:
```json
{
  "status": "healthy",
  "ollama_available": true,
  "models": ["llama2"]
}
```

## Step 6: Test Chat Integration

1. Open your church website
2. Click the chat widget
3. Send a test message like "What is the Sabbath?"
4. Verify you get a doctrinally sound response

## Troubleshooting

### Ollama Not Responding
1. Check if Ollama is running:
   ```bash
   ollama serve
   ```

2. Verify model is available:
   ```bash
   ollama list
   ```

3. Test direct API call:
   ```bash
   curl -X POST http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d '{"model": "llama3", "prompt": "Hello", "stream": false}'
   ```

### Backend Connection Issues
1. Check if backend is running on port 3001
2. Verify CORS settings in `server.js`
3. Check browser console for network errors

### Model Performance Issues
- For faster responses: Use `llama3.2:1b` (1B parameters)
- For balanced performance: Use `llama3.2:8b` (8B parameters)
- For best quality: Use `llama3.2:70b` (70B parameters)

## Advanced Configuration

### Custom Model Fine-tuning
You can create a custom model with church-specific training:

1. Create a Modelfile:
   ```
   FROM llama2
   SYSTEM "You are a helpful AI assistant for the Quezon Central Free Seventh Day Adventist Church..."
   ```

2. Build custom model:
   ```bash
   ollama create church-assistant -f Modelfile
   ```

3. Update `.env`:
   ```env
   OLLAMA_MODEL=church-assistant
   ```

### Response Filtering
The system includes automatic filtering for:
- Inappropriate language
- Response length limits
- Doctrinal alignment

### Fallback System
When Ollama is unavailable, the system provides:
- Context-aware fallback responses
- Graceful error handling
- User-friendly messages

## Security Considerations

1. **Rate Limiting**: Implement rate limiting to prevent abuse
2. **Input Validation**: All user inputs are sanitized
3. **Response Filtering**: Automatic filtering of inappropriate content
4. **Error Handling**: Graceful fallbacks when AI is unavailable

## Monitoring

Monitor the system health:
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check backend health
curl http://localhost:3001/api/chat/health
```

## Performance Optimization

1. **Model Selection**: Choose appropriate model size for your hardware
2. **Caching**: Consider implementing response caching for common questions
3. **Load Balancing**: For high traffic, consider multiple Ollama instances
4. **Memory Management**: Monitor system resources when using larger models

## Support

For issues with:
- **Ollama**: Check https://ollama.ai/docs
- **Backend**: Check server logs and API responses
- **Frontend**: Check browser console for JavaScript errors

## Next Steps

1. **Custom Training**: Consider fine-tuning the model with church-specific content
2. **Analytics**: Implement chat analytics to understand user needs
3. **Multi-language**: Add support for Filipino/Tagalog responses
4. **Integration**: Connect with church management systems 

## 📝 **Update Your Configuration**

### **1. Update Environment File**
Edit your `.env` file in the backend directory:
```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### **2. Update Backend Code**
You need to manually update line 6 in `backend/routes/chat.js`:
```javascript
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
```

### **3. Update Test File**
Also update line 4 in `backend/test-ollama.js`:
```javascript
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
```

## 🧪 **Test Your Configuration**

### **1. Start Ollama Service**
```bash
ollama serve
```

### **2. Test Direct API Call**
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3", "prompt": "Hello", "stream": false}'
```

### **3. Test Backend Integration**
```bash
cd backend
npm run test-ollama
```

## 📊 **Model Information**

Your `llama3:latest` model:
- **Size**: 4.7 GB (this is likely the 8B parameter version)
- **Performance**: Good balance of speed and quality
- **Compatibility**: Works with the current Ollama API

## 🔍 **Verify Model Details**

To get more details about your model:
```bash
ollama show llama3
```

This will show you the exact specifications of your model.

## ✅ **Next Steps**

1. **Update the configuration files** as shown above
2. **Start Ollama**: `ollama serve`
3. **Test the integration**: `npm run test-ollama`
4. **Start your backend**: `npm run dev`
5. **Test the chat widget** on your website

Let me know if you need help with any of these steps! 