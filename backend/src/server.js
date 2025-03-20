const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const { authenticateSocket } = require('./middleware/auth');
const { setupSocketHandlers } = require('./services/socketService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());
app.use(express.json());

// Initialize Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Socket.IO middleware for authentication
io.use(authenticateSocket);

// Set up Socket.IO event handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'server_error',
      message: err.message || 'An unexpected error occurred'
    }
  });
});

// Start server
const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
