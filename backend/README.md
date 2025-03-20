# BotGroup Backend

This is the backend implementation for the BotGroup multi-model chat application. It provides API endpoints and WebSocket functionality to support real-time chat with multiple AI models (DeepSeek and Nova) via AWS Bedrock.

## Features

- Simple password authentication with JWT
- WebSocket support for real-time streaming responses
- Integration with AWS Bedrock for AI model access
- Session management for chat history
- Sequential model responses with shared context

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration settings
│   ├── controllers/      # API route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   └── server.js         # Main application entry point
├── .env.example          # Example environment variables
└── package.json          # Project dependencies
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables:
   ```
   cp .env.example .env
   ```
4. Edit `.env` with your configuration
5. Start the server:
   ```
   npm start
   ```
   
## Environment Variables

- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret key for JWT token generation
- `AUTH_PASSWORD`: Password for authentication
- `AWS_REGION`: AWS region for Bedrock
- Model IDs and parameters for temperature and token limits

## AWS Credentials

The application uses the default AWS credential provider chain, which will automatically look for credentials in the following order:
1. Environment variables (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`)
2. Shared credentials file (`~/.aws/credentials`)
3. EC2 instance profile or IAM role (if running on AWS)

No explicit credential configuration is needed in the application.

## API Endpoints

### Authentication
- `POST /api/auth/login`: Authenticate with password

### Sessions
- `GET /api/sessions`: Get all sessions
- `POST /api/sessions/create`: Create a new session
- `GET /api/sessions/:sessionId/history`: Get session history

## WebSocket Events

### Client to Server
- `send_message`: Send a message to be processed by models

### Server to Client
- `receive_message`: Stream model response chunks
- `model_complete`: Notify when a model completes its response
- `all_responses_complete`: Notify when all models have responded
- `error`: Send error information to client

## AWS Bedrock Integration

The backend uses AWS Bedrock to access the AI models. It requires proper AWS credentials with permissions to access the Bedrock service and the specific models configured.

## Development

For development with auto-restart on file changes:
```
npm run dev
```
