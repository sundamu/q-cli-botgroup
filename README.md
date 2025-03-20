# BotGroup - Multi-Model Chat Application

BotGroup is a web application that allows users to chat with multiple large language models (LLMs) simultaneously. The application connects to AWS Bedrock to access DeepSeek and Nova models, which respond in sequence to user messages.

## Project Structure

The project consists of two main components:

- **Frontend**: React-based web application
- **Backend**: Node.js server with WebSocket support

```
/
├── frontend/           # React frontend application
└── backend/            # Node.js backend server
```

## Features

- **Multi-model Chat**: Chat with DeepSeek and Nova models in sequence
- **Shared Context**: Each model has access to the complete conversation history
- **Real-time Streaming**: Model responses are streamed in real-time
- **Session Management**: Create and switch between multiple chat sessions
- **Simple Authentication**: Password-based authentication

## Setup and Installation

### Prerequisites

- Node.js (v14+)
- npm or yarn
- AWS account with access to Bedrock
- AWS credentials with permissions for Bedrock models

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file and configure it:
   ```
   cp .env.example .env
   ```

4. Edit `.env` with your AWS credentials and configuration

5. Start the backend server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the backend URL (if different from default):
   ```
   # In .env file
   REACT_APP_API_URL=http://localhost:3001
   ```

4. Start the frontend development server:
   ```
   npm start
   ```

## Usage

1. Access the application in your browser (default: http://localhost:3000)
2. Log in using the configured password
3. Create a new chat session or select an existing one
4. Type your message and send
5. View responses from both DeepSeek and Nova models in sequence

## AWS Bedrock Configuration

The application uses AWS Bedrock to access AI models. You need to configure:

- AWS credentials with Bedrock access
- Model IDs for DeepSeek and Nova
- Model parameters (temperature, max tokens)

See the `.env.example` file in the backend directory for configuration options.

## Development

### Backend Development

```
cd backend
npm run dev
```

### Frontend Development

```
cd frontend
npm start
```

## License

[MIT License](LICENSE)
