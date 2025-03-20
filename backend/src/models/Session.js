const { v4: uuidv4 } = require('uuid');

/**
 * In-memory storage for sessions
 * In a production environment, this would be replaced with a database
 */
const sessions = new Map();

/**
 * Session model
 */
class Session {
  /**
   * Create a new session
   * @returns {Object} The created session
   */
  static create() {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      messages: []
    };
    
    sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get all sessions
   * @returns {Array} Array of sessions
   */
  static getAll() {
    return Array.from(sessions.values()).map(session => ({
      id: session.id,
      createdAt: session.createdAt
    }));
  }

  /**
   * Get a session by ID
   * @param {string} sessionId - The session ID
   * @returns {Object|null} The session or null if not found
   */
  static getById(sessionId) {
    return sessions.get(sessionId) || null;
  }

  /**
   * Add a message to a session
   * @param {string} sessionId - The session ID
   * @param {Object} message - The message to add
   * @returns {boolean} Success status
   */
  static addMessage(sessionId, message) {
    const session = sessions.get(sessionId);
    if (!session) return false;
    
    session.messages.push(message);
    return true;
  }

  /**
   * Get session history
   * @param {string} sessionId - The session ID
   * @returns {Array|null} Array of messages or null if session not found
   */
  static getHistory(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    return session.messages;
  }
}

module.exports = Session;
