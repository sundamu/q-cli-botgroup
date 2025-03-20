const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Login controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = (req, res) => {
  try {
    const { password } = req.body;

    // Check if password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Validate password
    if (password !== config.server.authPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { authenticated: true },
      config.server.jwtSecret,
      { expiresIn: '24h' }
    );

    // Return success response with token
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during authentication'
    });
  }
};

module.exports = {
  login
};
