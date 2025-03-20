require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_key',
    authPassword: process.env.AUTH_PASSWORD || 'password123'
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  models: {
    deepseek: {
      modelId: process.env.DEEPSEEK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
      parameters: {
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '1000')
      }
    },
    nova: {
      modelId: process.env.NOVA_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
      parameters: {
        temperature: parseFloat(process.env.NOVA_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.NOVA_MAX_TOKENS || '1000')
      }
    }
  }
};
