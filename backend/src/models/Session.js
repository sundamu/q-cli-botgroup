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
      messages: [],
      messageIds: new Set() // 添加一个Set来跟踪消息ID，防止重复
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
   * 生成消息ID
   * @param {Object} message - 消息对象
   * @returns {string} 消息ID
   */
  static generateMessageId(message) {
    // 根据消息内容、角色和时间戳生成唯一ID
    const content = message.content || '';
    const role = message.role || '';
    const modelId = message.modelId || '';
    const timestamp = message.timestamp || new Date().toISOString();
    
    return `${role}-${modelId}-${content.substring(0, 20)}-${timestamp}`;
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
    
    // 确保消息有时间戳
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }
    
    // 生成消息ID
    const messageId = this.generateMessageId(message);
    
    // 检查消息是否已存在
    if (session.messageIds.has(messageId)) {
      console.log('消息已存在，跳过添加:', messageId);
      return true; // 消息已存在，但不视为错误
    }
    
    // 添加消息并记录ID
    session.messages.push(message);
    session.messageIds.add(messageId);
    
    console.log(`添加消息到会话 ${sessionId}:`, message);
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
    
    // 返回消息的深拷贝，防止外部修改
    return JSON.parse(JSON.stringify(session.messages));
  }
}

module.exports = Session;
