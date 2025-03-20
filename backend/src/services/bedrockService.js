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
 * Format messages for DeepSeek models
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Formatted messages for DeepSeek
 */
const formatMessagesForDeepSeek = (messages) => {
  // DeepSeek has a specific format requirement
  return messages.map(message => {
    if (message.role === 'user') {
      return {
        role: 'user',
        content: message.content
      };
    } else if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: message.content
      };
    } else {
      return message;
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
    // Check if the model is DeepSeek R1
    else if (modelId.includes('deepseek.r1')) {
      // DeepSeek R1 specific format
      request = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: messages[messages.length - 1].content,
          max_tokens: parameters.maxTokens,
          temperature: parameters.temperature,
          stream: true
        })
      };
    }
    // Check if the model is DeepSeek Chat
    else if (modelId.includes('deepseek')) {
      const formattedMessages = formatMessagesForDeepSeek(messages);
      
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
        
        console.log(`Processing chunk for ${modelId}:`, JSON.stringify(parsedChunk, null, 2));
        
        if (modelId.includes('anthropic.claude') && parsedChunk.completion) {
          textChunk = parsedChunk.completion;
          console.log(`Claude chunk extracted: ${textChunk}`);
        } else if (modelId.includes('deepseek.r1')) {
          // DeepSeek R1 format
          if (parsedChunk.choices && parsedChunk.choices.length > 0) {
            textChunk = parsedChunk.choices[0].text || '';
            console.log(`DeepSeek R1 chunk from choices: ${textChunk}`);
          } else {
            console.log(`DeepSeek R1 chunk format not recognized:`, JSON.stringify(parsedChunk));
          }
        } else if (modelId.includes('deepseek')) {
          // Other DeepSeek models (chat models)
          if (parsedChunk.outputs && parsedChunk.outputs.length > 0) {
            textChunk = parsedChunk.outputs[0].text || '';
            console.log(`DeepSeek chat chunk from outputs: ${textChunk}`);
          } else if (parsedChunk.delta && parsedChunk.delta.text) {
            textChunk = parsedChunk.delta.text;
            console.log(`DeepSeek chat chunk from delta.text: ${textChunk}`);
          } else if (parsedChunk.text) {
            textChunk = parsedChunk.text;
            console.log(`DeepSeek chat chunk from text: ${textChunk}`);
          } else if (parsedChunk.content) {
            textChunk = parsedChunk.content;
            console.log(`DeepSeek chat chunk from content: ${textChunk}`);
          } else {
            console.log(`DeepSeek chat chunk format not recognized:`, JSON.stringify(parsedChunk));
          }
        } else if (modelId.includes('nova')) {
          // More detailed handling for Nova
          if (parsedChunk.contentBlockDelta && parsedChunk.contentBlockDelta.delta) {
            textChunk = parsedChunk.contentBlockDelta.delta.text || '';
            console.log(`Nova chunk from contentBlockDelta: ${textChunk}`);
          } else if (parsedChunk.delta && parsedChunk.delta.text) {
            textChunk = parsedChunk.delta.text;
            console.log(`Nova chunk from delta.text: ${textChunk}`);
          } else if (parsedChunk.text) {
            textChunk = parsedChunk.text;
            console.log(`Nova chunk from text: ${textChunk}`);
          } else if (parsedChunk.content) {
            textChunk = parsedChunk.content;
            console.log(`Nova chunk from content: ${textChunk}`);
          } else {
            console.log(`Nova chunk format not recognized:`, JSON.stringify(parsedChunk));
          }
        } else if (modelId.includes('titan') && parsedChunk.outputText) {
          textChunk = parsedChunk.outputText;
          console.log(`Titan chunk extracted: ${textChunk}`);
        } else if (parsedChunk.generation) {
          textChunk = parsedChunk.generation;
          console.log(`Generation chunk extracted: ${textChunk}`);
        } else if (parsedChunk.text) {
          textChunk = parsedChunk.text;
          console.log(`Text chunk extracted: ${textChunk}`);
        } else if (parsedChunk.delta && parsedChunk.delta.content) {
          textChunk = parsedChunk.delta.content;
          console.log(`Delta content chunk extracted: ${textChunk}`);
        } else if (parsedChunk.content) {
          textChunk = parsedChunk.content;
          console.log(`Content chunk extracted: ${textChunk}`);
        } else {
          console.log(`No recognized format for chunk from ${modelId}:`, JSON.stringify(parsedChunk));
        }
        
        if (textChunk) {
          completeResponse += textChunk;
          onChunk(textChunk);
          console.log(`Sending chunk from ${modelId}: "${textChunk}"`);
        } else {
          console.log(`Empty chunk from ${modelId}, not sending`);
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
  generateStreamingResponse,
  formatMessagesForDeepSeek,
  formatMessagesForNova
};
