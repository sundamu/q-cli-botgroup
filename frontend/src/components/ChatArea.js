import React from 'react';
import { useChat } from '../contexts/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatArea.css';

function ChatArea() {
  const { currentSession, isLoading } = useChat();

  return (
    <div className="chat-area">
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : currentSession ? (
        <>
          <MessageList />
          <MessageInput />
        </>
      ) : (
        <div className="no-session">No active session</div>
      )}
    </div>
  );
}

export default ChatArea;
