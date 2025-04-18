require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    jwtSecret: process.env.JWT_SECRET || '',
    authPassword: process.env.AUTH_PASSWORD || ''
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1'
    // No explicit credentials - will use default credential provider chain
  },
  models: {
    deepseek1: {
      modelId: process.env.DEEPSEEK1_MODEL_ID || 'us.deepseek.r1-v1:0',
      parameters: {
        temperature: parseFloat(process.env.DEEPSEEK1_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.DEEPSEEK1_MAX_TOKENS || '1000')
      }
    },
    deepseek2: {
      modelId: process.env.DEEPSEEK2_MODEL_ID || 'us.deepseek.r1-v1:0',
      parameters: {
        temperature: parseFloat(process.env.DEEPSEEK2_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.DEEPSEEK2_MAX_TOKENS || '1000')
      }
    }
  }
};