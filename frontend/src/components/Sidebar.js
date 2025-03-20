import React from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

function Sidebar() {
  const { logout } = useAuth();
  const { 
    sessions, 
    currentSession, 
    createNewSession, 
    selectSession, 
    isLoading 
  } = useChat();

  const handleNewSession = async () => {
    try {
      await createNewSession();
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const handleSelectSession = async (sessionId) => {
    try {
      await selectSession(sessionId);
    } catch (error) {
      console.error('Failed to select session:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>BotGroup</h1>
        <button 
          className="new-chat-button" 
          onClick={handleNewSession}
          disabled={isLoading}
        >
          New Chat
        </button>
      </div>

      <div className="sessions-list">
        {isLoading ? (
          <div className="loading">Loading sessions...</div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id}
              className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
              onClick={() => handleSelectSession(session.id)}
            >
              <div className="session-title">Chat {session.id.substring(0, 8)}</div>
              <div className="session-date">{formatDate(session.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
