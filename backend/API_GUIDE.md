# Quezon Central Church Backend API Guide

## 🚀 Quick Start

Your backend API is now running successfully at `http://localhost:3001`

### ✅ Server Status
- **Status**: Running
- **Port**: 3001
- **Base URL**: `http://localhost:3001`

## 📋 Available Endpoints

### Root Endpoint
```
GET http://localhost:3001/
```
Returns API information and available endpoints.

### Core API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api` | GET | API health check |
| `/api/chat` | POST | Chat with AI assistant |
| `/api/contact` | POST | Submit contact form |
| `/api/events` | GET | Get church events |
| `/api/sermons` | GET | Get sermons |

## 🔧 Testing Your API

### 1. Basic Health Check
```bash
curl http://localhost:3001/
```

### 2. API Status
```bash
curl http://localhost:3001/api
```

### 3. Chat Endpoint
```bash
curl -X POST http://localhost:3001/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can I help you?"}'
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation
```bash
cd backend
npm install
npm run dev
```

### Environment Variables
Create a `.env` file:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/quezon_central_church
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:latest
```

## 🤖 Chat API Usage

### Send Message
```javascript
// POST /api/chat/send
{
  "message": "What time is Sunday service?"
}
```

### Response Format
```javascript
{
  "message": "Sunday service starts at 10:00 AM",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "source": "ollama"
}
```

## 📊 API Features

### ✅ Implemented
- Chat with AI assistant
- Contact form submission
- Events management
- Sermons management
- Health monitoring
- Error handling
- CORS enabled

### 🔄 Fallback System
If Ollama AI is unavailable, the API automatically uses fallback responses to ensure continuous service.

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 3001
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

#### Cannot Connect to MongoDB
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database permissions

#### Ollama Not Available
- Install Ollama: https://ollama.ai
- Start Ollama service
- Pull required model: `ollama pull llama3:latest`

## 🔐 Security Notes

- API runs on localhost (development only)
- No authentication required for testing
- Production deployment requires HTTPS
- Environment variables for sensitive data

## 📱 Frontend Integration

### JavaScript Example
```javascript
// Send chat message
async function sendMessage(message) {
  const response = await fetch('http://localhost:3001/api/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  });
  
  const data = await response.json();
  return data.message;
}
```

### React Example
```jsx
const [response, setResponse] = useState('');

const handleSendMessage = async (message) => {
  try {
    const result = await fetch('http://localhost:3001/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const data = await result.json();
    setResponse(data.message);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3001/api/chat/health
```

### Response Format
```javascript
{
  "status": "healthy",
  "ollama_available": true,
  "models": ["llama3:latest"]
}
```

## 🎯 Next Steps

1. **Frontend Integration**: Connect your React/HTML frontend
2. **Database Setup**: Configure MongoDB collections
3. **Authentication**: Add user login system
4. **Deployment**: Deploy to production server
5. **SSL Certificate**: Enable HTTPS for production

## 📞 Support

- **Server Issues**: Check console logs in terminal
- **API Errors**: Review error messages in browser network tab
- **Database Problems**: Verify MongoDB connection
- **Chat Issues**: Ensure Ollama is running

---

**🎉 Your API is ready for development!**

Start building your frontend application and connect it to these endpoints.