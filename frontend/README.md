# BotGroup Frontend

This is the frontend implementation for the BotGroup multi-model chat application. It allows users to chat with multiple AI models (DeepSeek and Nova) simultaneously, with each model responding in sequence.

## Features

- Simple password authentication
- Real-time streaming of model responses via WebSocket
- Multiple chat sessions management
- Clean UI with distinct styling for different models
- Markdown rendering for model responses

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   │   ├── ChatArea.js  # Main chat interface
│   │   ├── LoginPage.js # Authentication page
│   │   ├── MessageList.js # Displays chat messages
│   │   ├── MessageInput.js # User input component
│   │   └── Sidebar.js   # Sessions management
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.js # Authentication state
│   │   └── ChatContext.js # Chat and WebSocket state
│   ├── services/        # API services
│   │   └── api.js       # API communication
│   ├── App.js           # Main application component
│   └── index.js         # Entry point
└── .env                 # Environment variables
```

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure the backend URL in `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:3001
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Login with the configured password
2. Create a new chat session or select an existing one
3. Type your message and send
4. View responses from both DeepSeek and Nova models in sequence

## Technologies Used

- React.js
- Socket.IO for WebSocket communication
- React Router for navigation
- Axios for HTTP requests
- React Markdown for rendering markdown content

## Notes

- The frontend expects the backend to be running at the URL specified in the `.env` file
- Authentication is handled via a simple password mechanism as specified in the design document
- WebSocket connection requires a valid authentication token
