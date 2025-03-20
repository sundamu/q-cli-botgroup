const { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');
const config = require('../config');

// Initialize AWS Bedrock client using default credential provider chain
// This will automatically use credentials from environment variables, shared credential files,
// or EC2 instance profiles/IAM roles
const bedrockClient = new BedrockRuntimeClient({
  region: config.aws.region
});

/**
 * Format messages for Claude models
 * @param {Array} messages - Array of message objects
 * @returns {string} - Formatted messages for Claude
 */
const formatMessagesForClaude = (messages) => {
  let formattedContent = '';
  
  for (const message of messages) {
    if (message.role === 'user') {
      formattedContent += `\n\nHuman: ${message.content}`;
    } else if (message.role === 'assistant') {
      formattedContent += `\n\nAssistant (${message.modelId}): ${message.content}`;
    }
  }
  
  formattedContent += '\n\nAssistant: ';
  return formattedContent;
};

/**
 * Generate streaming response from model
 * @param {string} modelId - The model ID to use
 * @param {Array} messages - Array of message objects
 * @param {Object} parameters - Model parameters
 * @param {function} onChunk - Callback for each chunk of the response
 * @returns {Promise<string>} - The complete response
 */
const generateStreamingResponse = async (modelId, messages, parameters, onChunk) => {
  try {
    const formattedMessages = formatMessagesForClaude(messages);
    
    // Prepare request based on model type
    const request = {
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: parameters.maxTokens,
        temperature: parameters.temperature,
        prompt: formattedMessages
      })
    };

    // Create command for streaming response
    const command = new InvokeModelWithResponseStreamCommand(request);
    
    // Execute command and process streaming response
    const response = await bedrockClient.send(command);
    const stream = response.body;
    
    let completeResponse = '';
    
    for await (const chunk of stream) {
      if (chunk.chunk?.bytes) {
        const parsedChunk = JSON.parse(Buffer.from(chunk.chunk.bytes).toString());
        
        if (parsedChunk.completion) {
          completeResponse += parsedChunk.completion;
          onChunk(parsedChunk.completion);
        }
      }
    }
    
    return completeResponse;
  } catch (error) {
    console.error(`Error generating response from ${modelId}:`, error);
    throw error;
  }
};

module.exports = {
  generateStreamingResponse
};
