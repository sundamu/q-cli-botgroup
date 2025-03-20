const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to authenticate API requests
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'auth_failed',
        message: 'Authentication token is required'
      }
    });
  }

  jwt.verify(token, config.server.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'auth_failed',
          message: 'Invalid or expired token'
        }
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware to authenticate WebSocket connections
 */
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.query.token;

  if (!token) {
    return next(new Error('Authentication token is required'));
  }

  jwt.verify(token, config.server.jwtSecret, (err, user) => {
    if (err) {
      return next(new Error('Invalid or expired token'));
    }

    socket.user = user;
    next();
  });
};

module.exports = {
  authenticateToken,
  authenticateSocket
};
