const Session = require('../models/Session');
const { generateStreamingResponse } = require('./bedrockService');
const config = require('../config');

/**
 * Set up Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 */
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle client disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    // Handle incoming messages
    socket.on('send_message', async (data) => {
      try {
        const { message, sessionId } = data;
        
        // Validate session
        const session = Session.getById(sessionId);
        if (!session) {
          socket.emit('error', {
            code: 'invalid_session',
            message: 'Invalid session ID'
          });
          return;
        }
        
        // Add user message to session
        Session.addMessage(sessionId, {
          role: 'user',
          content: message
        });
        
        // Get current session history
        const history = Session.getHistory(sessionId);
        
        // Process models in sequence
        await processModelsInSequence(socket, sessionId, history);
        
      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('error', {
          code: 'model_error',
          message: 'Error processing your message'
        });
      }
    });
  });
};

/**
 * Process models in sequence
 * @param {Object} socket - Socket.IO socket instance
 * @param {string} sessionId - Session ID
 * @param {Array} history - Message history
 */
const processModelsInSequence = async (socket, sessionId, history) => {
  try {
    // Define models to process in order
    const models = [
      {
        id: 'deepseek',
        config: config.models.deepseek,
        order: 1
      },
      {
        id: 'nova',
        config: config.models.nova,
        order: 2
      }
    ];
    
    // Process each model in sequence
    for (const model of models) {
      const modelResponse = await processModel(socket, sessionId, model, history);
      
      // Add model response to history for next model
      history.push({
        role: 'assistant',
        modelId: model.id,
        content: modelResponse
      });
      
      // Notify client that this model's response is complete
      socket.emit('model_complete', {
        modelId: model.id,
        sessionId,
        order: model.order
      });
    }
    
    // Notify client that all responses are complete
    socket.emit('all_responses_complete', { sessionId });
    
  } catch (error) {
    console.error('Error in model sequence processing:', error);
    throw error;
  }
};

/**
 * Process a single model
 * @param {Object} socket - Socket.IO socket instance
 * @param {string} sessionId - Session ID
 * @param {Object} model - Model configuration
 * @param {Array} history - Message history
 * @returns {Promise<string>} - The complete model response
 */
const processModel = async (socket, sessionId, model, history) => {
  return new Promise(async (resolve, reject) => {
    try {
      let completeResponse = '';
      
      // Generate streaming response
      const response = await generateStreamingResponse(
        model.config.modelId,
        history,
        model.config.parameters,
        (chunk) => {
          // Send each chunk to the client
          socket.emit('receive_message', {
            modelId: model.id,
            message: chunk,
            isComplete: false,
            sessionId,
            order: model.order
          });
        }
      );
      
      completeResponse = response;
      
      // Send final message indicating completion
      socket.emit('receive_message', {
        modelId: model.id,
        message: '',
        isComplete: true,
        sessionId,
        order: model.order
      });
      
      // Add model response to session
      Session.addMessage(sessionId, {
        role: 'assistant',
        modelId: model.id,
        content: completeResponse
      });
      
      resolve(completeResponse);
    } catch (error) {
      console.error(`Error processing model ${model.id}:`, error);
      reject(error);
    }
  });
};

module.exports = {
  setupSocketHandlers
};
