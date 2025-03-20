import React from 'react';
import { ChatProvider } from '../contexts/ChatContext';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import './ChatPage.css';

function ChatPage() {
  return (
    <ChatProvider>
      <div className="chat-page">
        <Sidebar />
        <ChatArea />
      </div>
    </ChatProvider>
  );
}

export default ChatPage;
