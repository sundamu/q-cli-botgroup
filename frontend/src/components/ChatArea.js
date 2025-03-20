import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../contexts/ChatContext';
import './ChatArea.css';

function ChatArea() {
  const { currentSession, connected } = useChat();

  return (
    <div className="chat-area">
      {!connected && (
        <div className="connection-warning">
          Connecting to server...
        </div>
      )}
      
      {!currentSession ? (
        <div className="no-session">
          <p>No active session. Create a new chat to start.</p>
        </div>
      ) : (
        <>
          <div className="chat-header">
            <h2>Chat {currentSession.id.substring(0, 8)}</h2>
          </div>
          
          <MessageList />
          
          <MessageInput />
        </>
      )}
    </div>
  );
}

export default ChatArea;
