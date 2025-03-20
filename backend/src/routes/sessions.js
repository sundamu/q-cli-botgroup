const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all session routes
router.use(authenticateToken);

/**
 * @route GET /api/sessions
 * @desc Get all sessions
 * @access Private
 */
router.get('/', sessionController.getSessions);

/**
 * @route POST /api/sessions/create
 * @desc Create a new session
 * @access Private
 */
router.post('/create', sessionController.createSession);

/**
 * @route GET /api/sessions/:sessionId/history
 * @desc Get session history
 * @access Private
 */
router.get('/:sessionId/history', sessionController.getSessionHistory);

module.exports = router;
