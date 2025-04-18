const Session = require('../models/Session');
const { generateStreamingResponse } = require('./bedrockService');
const config = require('../config');

/**
 * Set up Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 */
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Only log connection ID for debugging purposes
    console.log(`Client connected: ${socket.id}`);

    // Handle client disconnection - no need to log every disconnect
    socket.on('disconnect', () => {});

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
        
        // 添加带时间戳的用户消息到会话
        const timestamp = new Date().toISOString();
        Session.addMessage(sessionId, {
          role: 'user',
          content: message,
          timestamp: timestamp
        });
        
        // 获取当前会话历史
        const history = Session.getHistory(sessionId);
        
        // 按顺序处理模型
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
        id: 'deepseek1',
        config: config.models.deepseek1,
        order: 1
      },
      {
        id: 'deepseek2',
        config: config.models.deepseek2,
        order: 2
      }
    ];
    
    // Process each model in sequence
    for (const model of models) {
      const modelResponse = await processModel(socket, sessionId, model, history);
      
      // Add model response to history for next model
      history.push({
        role: 'user',
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
      
      // 生成流式响应
      const response = await generateStreamingResponse(
        model.config.modelId,
        history,
        model.config.parameters,
        (chunk) => {
          // 发送每个块到客户端
          socket.emit('receive_message', {
            modelId: model.id,
            message: chunk,
            isComplete: false,
            sessionId,
            order: model.order,
            timestamp: new Date().toISOString() // 添加时间戳
          });
        }
      );
      
      completeResponse = response;
      
      // 检查响应是否为空或包含错误消息
      if (!completeResponse || completeResponse.trim() === '' || completeResponse.startsWith('Error:')) {
        console.warn(`Warning: Empty or error response from ${model.id}`);
        if (!completeResponse || completeResponse.trim() === '') {
          completeResponse = `No response was generated from ${model.id}. This could be due to an issue with the model configuration or the input provided.`;
          
          // 发送带有错误消息的手动块
          socket.emit('receive_message', {
            modelId: model.id,
            message: completeResponse,
            isComplete: false,
            sessionId,
            order: model.order,
            timestamp: new Date().toISOString() // 添加时间戳
          });
        }
      }
      
      // 发送最终消息表示完成
      socket.emit('receive_message', {
        modelId: model.id,
        message: '',
        isComplete: true,
        sessionId,
        order: model.order,
        timestamp: new Date().toISOString() // 添加时间戳
      });
      
      // 添加模型响应到会话
      const timestamp = new Date().toISOString();
      Session.addMessage(sessionId, {
        role: 'assistant',
        modelId: model.id,
        content: completeResponse,
        timestamp: timestamp // 添加时间戳
      });
      
      resolve(completeResponse);
    } catch (error) {
      console.error(`Error processing model ${model.id}:`, error);
      
      // 发送错误消息到客户端
      const errorMessage = `Error: ${error.message || 'An unknown error occurred'}`;
      const timestamp = new Date().toISOString();
      socket.emit('receive_message', {
        modelId: model.id,
        message: errorMessage,
        isComplete: false,
        sessionId,
        order: model.order,
        timestamp: timestamp // 添加时间戳
      });
      
      // 发送完成消息
      socket.emit('receive_message', {
        modelId: model.id,
        message: '',
        isComplete: true,
        sessionId,
        order: model.order,
        timestamp: new Date().toISOString() // 添加时间戳
      });
      
      // 使用错误消息解析，以便序列可以继续
      resolve(errorMessage);
    }
  });
};

module.exports = {
  setupSocketHandlers
};

