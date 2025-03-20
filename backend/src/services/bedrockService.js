const { BedrockRuntimeClient, ConverseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');
const config = require('../config');

// Initialize AWS Bedrock client using default credential provider chain
const bedrockClient = new BedrockRuntimeClient({
  region: config.aws.region
});

/**
 * Format messages for Converse API
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Formatted messages for Converse API
 */
const formatMessagesForConverse = (messages) => {
  return messages.map(message => {
    if (message.role === 'user') {
      return {
        role: 'user',
        content: [
          {
            text: message.content
          }
        ]
      };
    } else if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: [
          {
            text: message.content
          }
        ]
      };
    } else {
      // Handle system messages or other types if needed
      return {
        role: 'user',
        content: [
          {
            text: message.content
          }
        ]
      };
    }
  });
};

/**
 * Generate streaming response using Converse API
 * @param {string} modelId - The model ID to use
 * @param {Array} messages - Array of message objects
 * @param {Object} parameters - Model parameters
 * @param {function} onChunk - Callback for each chunk of the response
 * @returns {Promise<string>} - The complete response
 */
const generateStreamingResponse = async (modelId, messages, parameters, onChunk) => {
  try {
    // Format messages for Converse API
    const formattedMessages = formatMessagesForConverse(messages);
    
    // Create request for Converse API
    const request = {
      modelId: modelId,
      messages: formattedMessages,
      inferenceConfig: {
        maxTokens: parameters.maxTokens,
        temperature: parameters.temperature,
        topP: 0.9
      }
    };
    
    // Create command for streaming response
    const command = new ConverseStreamCommand(request);
    
    // Execute command and process streaming response
    const response = await bedrockClient.send(command);
    const stream = response.stream;
    
    let completeResponse = '';
    
    for await (const chunk of stream) {
      if (chunk.message) {
        // Process message chunk
        const messageChunk = chunk.message;
        
        // Extract text from content blocks
        if (messageChunk.content && messageChunk.content.length > 0) {
          for (const contentBlock of messageChunk.content) {
            if (contentBlock.text) {
              completeResponse += contentBlock.text;
              onChunk(contentBlock.text);
            }
          }
        }
      } else if (chunk.contentBlockDelta) {
        // Process content block delta
        const delta = chunk.contentBlockDelta;
        
        if (delta.delta && delta.delta.text) {
          completeResponse += delta.delta.text;
          onChunk(delta.delta.text);
        }
      } else if (chunk.bytes) {
        // Process raw bytes (should not happen with Converse API)
        const chunkData = Buffer.from(chunk.bytes).toString();
        
        try {
          const parsedChunk = JSON.parse(chunkData);
          
          // Extract text based on model-specific formats
          let textChunk = '';
          
          if (parsedChunk.text) {
            textChunk = parsedChunk.text;
          } else if (parsedChunk.content) {
            textChunk = parsedChunk.content;
          }
          
          if (textChunk) {
            completeResponse += textChunk;
            onChunk(textChunk);
          }
        } catch (e) {
          console.warn('Could not parse chunk as JSON');
        }
      }
    }
    
    // Check if response is empty
    if (!completeResponse || completeResponse.trim() === '') {
      console.warn(`Warning: Empty response from ${modelId}`);
      completeResponse = `No response was generated from ${modelId}. This could be due to an issue with the model configuration or the input provided.`;
      onChunk(completeResponse);
    }
    
    return completeResponse;
  } catch (error) {
    console.error(`Error generating response from ${modelId}:`, error);
    const errorMessage = `Error: ${error.message || 'Unknown error occurred'}`;
    onChunk(errorMessage);
    return errorMessage;
  }
};

module.exports = {
  generateStreamingResponse,
  formatMessagesForConverse
};
