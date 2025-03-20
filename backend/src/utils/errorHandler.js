/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} status - HTTP status code
   */
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create an authentication error
 * @param {string} message - Error message
 * @returns {ApiError} - Authentication error
 */
const authError = (message = 'Authentication failed') => {
  return new ApiError(message, 'auth_failed', 401);
};

/**
 * Create a session error
 * @param {string} message - Error message
 * @returns {ApiError} - Session error
 */
const sessionError = (message = 'Invalid session') => {
  return new ApiError(message, 'invalid_session', 404);
};

/**
 * Create a model error
 * @param {string} message - Error message
 * @returns {ApiError} - Model error
 */
const modelError = (message = 'Model error occurred') => {
  return new ApiError(message, 'model_error', 500);
};

/**
 * Create a rate limit error
 * @param {string} message - Error message
 * @returns {ApiError} - Rate limit error
 */
const rateLimitError = (message = 'Rate limit exceeded') => {
  return new ApiError(message, 'rate_limited', 429);
};

module.exports = {
  ApiError,
  authError,
  sessionError,
  modelError,
  rateLimitError
};
