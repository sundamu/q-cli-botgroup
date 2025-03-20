import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import './MessageInput.css';

function MessageInput() {
  const [message, setMessage] = useState('');
  const { sendMessage, waitingForResponse, connected } = useChat();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || waitingForResponse || !connected) return;
    
    const success = sendMessage(message.trim());
    if (success) {
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          disabled={waitingForResponse || !connected}
          rows={1}
          className="message-textarea"
        />
        <button 
          type="submit" 
          disabled={!message.trim() || waitingForResponse || !connected}
          className="send-button"
        >
          {waitingForResponse ? 'Waiting...' : 'Send'}
        </button>
      </form>
      <div className="input-info">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}

export default MessageInput;
