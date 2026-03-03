const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const frontendURL = process.env.FRONTEND_URL || 'https://sheon-ai-frontend.onrender.com';

// Ensure a JWT secret is available. In production you MUST set JWT_SECRET
// in your environment (Render/Heroku/etc). If it's missing we'll fall back
// to a temporary development secret to avoid runtime crashes — this is
// insecure and should only be relied on until you set the real env var.
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Warning: JWT_SECRET is not set. Using temporary fallback secret. Set JWT_SECRET in environment for production.');
  process.env.JWT_SECRET = 'dev_fallback_secret_sheon_ai_change_me';
}

const io = new Server(server, {
  cors: {
    origin: frontendURL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://sheon-ai-frontend.onrender.com',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Socket.io for real-time chat
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => socket.join(roomId));
  socket.on('send-message', (data) => io.to(data.roomId).emit('receive-message', data));
  socket.on('disconnect', () => {});
});

app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mothers', require('./routes/mothers'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/nurses', require('./routes/nurses'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/risk', require('./routes/risk'));
app.use('/api/community', require('./routes/community'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/gemini', require('./routes/gemini'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Sheon AI is running' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected');
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
  });

server.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);
