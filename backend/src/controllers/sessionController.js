const Session = require('../models/Session');

/**
 * Get all sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSessions = (req, res) => {
  try {
    const sessions = Session.getAll();
    res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to retrieve sessions'
      }
    });
  }
};

/**
 * Create a new session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSession = (req, res) => {
  try {
    const session = Session.create();
    res.status(201).json({
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to create session'
      }
    });
  }
};

/**
 * Get session history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSessionHistory = (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const history = Session.getHistory(sessionId);
    
    if (history === null) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'invalid_session',
          message: 'Session not found'
        }
      });
    }
    
    res.status(200).json({ history });
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'server_error',
        message: 'Failed to retrieve session history'
      }
    });
  }
};

module.exports = {
  getSessions,
  createSession,
  getSessionHistory
};
