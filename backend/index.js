const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const autonomousAI = require('./services/aiAutonomous');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arc-real-estate';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
  });

// WebSocket connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// AI Agent endpoints
app.use('/api/ai', require('./routes/aiAgent'));

// Invoice endpoints
app.use('/api/invoices', require('./routes/invoices'));

// Property endpoints
app.use('/api/properties', require('./routes/properties'));

// Payment endpoints
app.use('/api/payments', require('./routes/payments'));

// Circle Wallet endpoints
app.use('/api/circle', require('./routes/circleWallet'));

// Wallet endpoints
app.use('/api/wallet', require('./routes/wallet'));

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini AI: gemini-2.5-flash`);
  console.log(`🔌 WebSocket enabled for real-time updates`);
  
  // Start autonomous AI agent
  console.log(`🤖 Starting Autonomous AI Agent...`);
  autonomousAI.start();
  console.log(`✅ Autonomous AI Agent is monitoring payments`);
});

