import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import './MessageInput.css';

function MessageInput() {
  const [message, setMessage] = useState('');
  const { sendMessage, waitingForResponse } = useChat();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !waitingForResponse) {
      console.log('Submitting message:', message);
      const success = sendMessage(message.trim());
      if (success) {
        setMessage('');
      }
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={waitingForResponse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <button 
        type="submit" 
        disabled={!message.trim() || waitingForResponse}
      >
        {waitingForResponse ? 'Waiting...' : 'Send'}
      </button>
    </form>
  );
}

export default MessageInput;
