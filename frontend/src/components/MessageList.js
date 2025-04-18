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
    deepseek1: { content: '', isComplete: false },
    deepseek2: { content: '', isComplete: false }
  });

  // Force re-render when messages change
  useEffect(() => {
    console.log("Messages updated:", messages);
    setDisplayMessages([...messages]);
    setKey(prevKey => prevKey + 1); // Force re-render
  }, [messages]);

  // Keep track of streamed responses to show them even after waitingForResponse becomes false
  useEffect(() => {
    if (currentResponses.deepseek1.content || currentResponses.deepseek2.content) {
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
                {message.modelId === 'deepseek1' ? 'DeepSeek 1' : message.modelId === 'deepseek2' ? 'DeepSeek 2' : message.modelId}
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
          {currentResponses.deepseek1.content && (
            <div className="message assistant-message">
              <div className="message-content assistant deepseek1">
                <div className="message-header">DeepSeek 1</div>
                <div className="message-text">
                  <ReactMarkdown>{currentResponses.deepseek1.content}</ReactMarkdown>
                  {!currentResponses.deepseek1.isComplete && (
                    <span className="typing-indicator">●●●</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {currentResponses.deepseek2.content && (
            <div className="message assistant-message">
              <div className="message-content assistant deepseek2">
                <div className="message-header">DeepSeek 2</div>
                <div className="message-text">
                  <ReactMarkdown>{currentResponses.deepseek2.content}</ReactMarkdown>
                  {!currentResponses.deepseek2.isComplete && (
                    <span className="typing-indicator">●●●</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Show transition messages during the brief period between completion and adding to history */}
      {!waitingForResponse && streamedResponses.deepseek1.content && 
       !displayMessages.some(m => m.modelId === 'deepseek1' && m.content === streamedResponses.deepseek1.content) && (
        <div className="message assistant-message">
          <div className="message-content assistant deepseek1">
            <div className="message-header">DeepSeek 1</div>
            <div className="message-text">
              <ReactMarkdown>{streamedResponses.deepseek1.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {!waitingForResponse && streamedResponses.deepseek2.content && 
       !displayMessages.some(m => m.modelId === 'deepseek2' && m.content === streamedResponses.deepseek2.content) && (
        <div className="message assistant-message">
          <div className="message-content assistant deepseek2">
            <div className="message-header">DeepSeek 2</div>
            <div className="message-text">
              <ReactMarkdown>{streamedResponses.deepseek2.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;