require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const playerRoutes = require('./routes/players');
const auctionRoutes = require('./routes/auction');
const { initializeSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // ✅ Socket.io performance optimizations
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// ✅ Compress all responses — reduces payload by 60-70%
app.use(compression());

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ✅ Security & caching headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.method === 'GET' && req.path.startsWith('/api/players')) {
    res.setHeader('Cache-Control', 'public, max-age=300'); // cache players for 5 mins
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auction', auctionRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io
initializeSocket(io);

// ✅ Add MongoDB indexes for faster queries
const addIndexes = async () => {
  try {
    const db = mongoose.connection;
    await db.collection('rooms').createIndex({ code: 1 }, { unique: true, background: true });
    await db.collection('rooms').createIndex({ 'teams.user': 1 }, { background: true });
    await db.collection('rooms').createIndex({ status: 1 }, { background: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true, background: true });
    await db.collection('players').createIndex({ position: 1 }, { background: true });
    await db.collection('players').createIndex({ rating: -1 }, { background: true });
    console.log('✅ Database indexes ready');
  } catch (err) {
    console.log('ℹ️ Index setup skipped:', err.message);
  }
};

// ✅ Keep-alive ping — prevents Render free tier from sleeping
const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production') return;
  const BACKEND_URL = process.env.RENDER_EXTERNAL_URL;
  if (!BACKEND_URL) return;

  setInterval(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) console.log('🏓 Keep-alive ping OK');
    } catch {
      console.log('⚠️ Keep-alive ping failed');
    }
  }, 10 * 60 * 1000); // every 10 minutes

  console.log('🏓 Keep-alive started →', BACKEND_URL);
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/football-auction', {
  // ✅ Connection pool for better performance
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('✅ MongoDB connected');
    await addIndexes();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      startKeepAlive();
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = { app, io };