require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const contactRoutes = require('./routes/contact');
const donationsRoutes = require('./routes/donations');
const eventsRoutes = require('./routes/events');
const musicMediaRoutes = require('./routes/music-media');
const sabbathSchoolRoutes = require('./routes/sabbath-school');
const sermonsRoutes = require('./routes/sermons');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('📦 MongoDB Connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🏛️ Quezon Central Church API',
    status: 'running',
    endpoints: {
      api: '/api',
      chat: '/api/chat',
      contact: '/api/contact',
      events: '/api/events',
      sermons: '/api/sermons'
    }
  });
});

// Test route
app.get('/api', (req, res) => {
  res.json('🚀 API is working!');
});

// Mount routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/music-media', musicMediaRoutes);
app.use('/api/sabbath-school', sabbathSchoolRoutes);
app.use('/api/sermons', sermonsRoutes);

const PORT = process.env.PORT || 3001; // for example, use 3001
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
}); 