import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import ReactMarkdown from 'react-markdown';
import './MessageList.css';

function MessageList() {
  const { messages, currentResponses, waitingForResponse } = useChat();
  const messagesEndRef = useRef(null);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [key, setKey] = useState(0); // Force re-render key
  const [streamedResponses, setStreamedResponses] = useState({
    deepseek: { content: '', isComplete: false },
    nova: { content: '', isComplete: false }
  });

  // Force re-render when messages change
  useEffect(() => {
    console.log("Messages updated:", messages);
    setDisplayMessages([...messages]);
    setKey(prevKey => prevKey + 1); // Force re-render
  }, [messages]);

  // Keep track of streamed responses to show them even after waitingForResponse becomes false
  useEffect(() => {
    if (currentResponses.deepseek.content || currentResponses.nova.content) {
      setStreamedResponses(currentResponses);
    }
  }, [currentResponses]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    console.log("Display messages or responses updated:", { displayMessages, currentResponses });
    scrollToBottom();
  }, [displayMessages, currentResponses, key]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Debug render
  console.log("Rendering MessageList with key:", key, {
    displayMessages,
    messages,
    currentResponses,
    waitingForResponse,
    streamedResponses
  });

  return (
    <div className="message-list" key={key}>
      {/* Regular messages */}
      {displayMessages.map((message, index) => (
        <div 
          key={`${index}-${message.timestamp || index}`} 
          className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
        >
          {message.role === 'user' ? (
            <div className="message-content user">
              <div className="message-header">You</div>
              <div className="message-text">{message.content}</div>
            </div>
          ) : (
            <div className={`message-content assistant ${message.modelId}`}>
              <div className="message-header">
                {message.modelId === 'deepseek' ? 'DeepSeek' : 'Nova'}
              </div>
              <div className="message-text">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Current responses being streamed */}
      {waitingForResponse && (
        <>
          {currentResponses.deepseek.content && (
            <div className="message assistant-message">
              <div className="message-content assistant deepseek">
                <div className="message-header">DeepSeek</div>
                <div className="message-text">
                  <ReactMarkdown>{currentResponses.deepseek.content}</ReactMarkdown>
                  {!currentResponses.deepseek.isComplete && (
                    <span className="typing-indicator">●●●</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {currentResponses.nova.content && (
            <div className="message assistant-message">
              <div className="message-content assistant nova">
                <div className="message-header">Nova</div>
                <div className="message-text">
                  <ReactMarkdown>{currentResponses.nova.content}</ReactMarkdown>
                  {!currentResponses.nova.isComplete && (
                    <span className="typing-indicator">●●●</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Show transition messages during the brief period between completion and adding to history */}
      {!waitingForResponse && streamedResponses.deepseek.content && 
       !displayMessages.some(m => m.modelId === 'deepseek' && m.content === streamedResponses.deepseek.content) && (
        <div className="message assistant-message">
          <div className="message-content assistant deepseek">
            <div className="message-header">DeepSeek</div>
            <div className="message-text">
              <ReactMarkdown>{streamedResponses.deepseek.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {!waitingForResponse && streamedResponses.nova.content && 
       !displayMessages.some(m => m.modelId === 'nova' && m.content === streamedResponses.nova.content) && (
        <div className="message assistant-message">
          <div className="message-content assistant nova">
            <div className="message-header">Nova</div>
            <div className="message-text">
              <ReactMarkdown>{streamedResponses.nova.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
