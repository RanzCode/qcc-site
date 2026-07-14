require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const contactRoutes = require('./routes/contact');
const donationsRoutes = require('./routes/donations');
const eventLinksRoutes = require('./routes/event-links');
const eventsRoutes = require('./routes/events');
const featuredEventRoutes = require('./routes/featured-event');
const musicMediaRoutes = require('./routes/music-media');
const postsRoutes = require('./routes/posts');
const sabbathSchoolRoutes = require('./routes/sabbath-school');
const sermonsRoutes = require('./routes/sermons');
const storiesRoutes = require('./routes/stories');

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

// Serve the static church website (same origin as the API)
app.use(express.static(path.join(__dirname, '..', 'quezon cental church')));

// Serve shared logo assets referenced via "../logo/..." from the website pages
app.use('/logo', express.static(path.join(__dirname, '..', 'logo')));

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
app.use('/api/event-links', eventLinksRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/featured-event', featuredEventRoutes);
app.use('/api/music-media', musicMediaRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/sabbath-school', sabbathSchoolRoutes);
app.use('/api/sermons', sermonsRoutes);
app.use('/api/stories', storiesRoutes);

const PORT = process.env.PORT || 3001; // for example, use 3001
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
}); 