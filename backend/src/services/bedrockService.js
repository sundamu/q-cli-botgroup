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
 * Format messages for chat-based models (DeepSeek)
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Formatted messages for chat models
 */
const formatMessagesForChat = (messages) => {
  return messages.map(message => {
    // Convert 'user' and 'assistant' roles to match expected format
    let role = message.role;
    if (role === 'assistant' && message.modelId) {
      // Add model identifier to assistant messages
      return {
        role: 'assistant',
        content: `[${message.modelId}]: ${message.content}`
      };
    } else {
      return {
        role: message.role,
        content: message.content
      };
    }
  });
};

/**
 * Format messages for Nova models
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Formatted messages for Nova
 */
const formatMessagesForNova = (messages) => {
  return messages.map(message => {
    if (message.role === 'assistant' && message.modelId) {
      return {
        role: 'assistant',
        content: [{
          text: `[${message.modelId}]: ${message.content}`
        }]
      };
    } else {
      return {
        role: message.role,
        content: [{
          text: message.content
        }]
      };
    }
  });
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
    let request;
    
    // Check if the model is Claude (Anthropic)
    if (modelId.includes('anthropic.claude')) {
      const formattedMessages = formatMessagesForClaude(messages);
      
      request = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens_to_sample: parameters.maxTokens,
          temperature: parameters.temperature,
          prompt: formattedMessages
        })
      };
    } 
    // Check if the model is DeepSeek
    else if (modelId.includes('deepseek')) {
      const formattedMessages = formatMessagesForChat(messages);
      
      request = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: formattedMessages,
          max_tokens: parameters.maxTokens,
          temperature: parameters.temperature,
          stream: true
        })
      };
    }
    // Check if the model is Nova
    else if (modelId.includes('nova')) {
      const formattedMessages = formatMessagesForNova(messages);
      
      // Format request according to Nova's schema
      request = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          schemaVersion: "messages-v1",
          messages: formattedMessages,
          inferenceConfig: {
            maxTokens: parameters.maxTokens,
            temperature: parameters.temperature,
            topP: 0.9,
            topK: 20
          }
        })
      };
    }
    // Check if the model is Titan
    else if (modelId.includes('titan')) {
      request = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: messages[messages.length - 1].content,
          textGenerationConfig: {
            maxTokenCount: parameters.maxTokens,
            temperature: parameters.temperature,
            stopSequences: []
          }
        })
      };
    }
    // Default case
    else {
      const formattedMessages = formatMessagesForClaude(messages);
      
      request = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: formattedMessages,
          max_tokens_to_sample: parameters.maxTokens,
          temperature: parameters.temperature
        })
      };
    }

    console.log(`Request for model ${modelId}:`, JSON.stringify(request.body, null, 2));

    // Create command for streaming response
    const command = new InvokeModelWithResponseStreamCommand(request);
    
    // Execute command and process streaming response
    const response = await bedrockClient.send(command);
    const stream = response.body;
    
    let completeResponse = '';
    
    for await (const chunk of stream) {
      if (chunk.chunk?.bytes) {
        const chunkData = Buffer.from(chunk.chunk.bytes).toString();
        let parsedChunk;
        
        try {
          parsedChunk = JSON.parse(chunkData);
          console.log(`Chunk from ${modelId}:`, JSON.stringify(parsedChunk, null, 2));
        } catch (e) {
          console.warn('Could not parse chunk as JSON:', chunkData);
          continue;
        }
        
        // Handle different response formats based on model
        let textChunk = '';
        
        if (modelId.includes('anthropic.claude') && parsedChunk.completion) {
          textChunk = parsedChunk.completion;
        } else if (modelId.includes('deepseek') && parsedChunk.outputs && parsedChunk.outputs.length > 0) {
          textChunk = parsedChunk.outputs[0].text || '';
        } else if (modelId.includes('nova') && parsedChunk.contentBlockDelta && parsedChunk.contentBlockDelta.delta) {
          // Handle Nova's response format
          textChunk = parsedChunk.contentBlockDelta.delta.text || '';
        } else if (modelId.includes('titan') && parsedChunk.outputText) {
          textChunk = parsedChunk.outputText;
        } else if (parsedChunk.generation) {
          textChunk = parsedChunk.generation;
        } else if (parsedChunk.text) {
          textChunk = parsedChunk.text;
        } else if (parsedChunk.delta && parsedChunk.delta.content) {
          textChunk = parsedChunk.delta.content;
        } else if (parsedChunk.content) {
          textChunk = parsedChunk.content;
        }
        
        if (textChunk) {
          completeResponse += textChunk;
          onChunk(textChunk);
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
