import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { createSession, getSessions, getSessionHistory } from '../services/api';

const ChatContext = createContext();

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponses, setCurrentResponses] = useState({
    deepseek: { content: '', isComplete: false },
    nova: { content: '', isComplete: false }
  });
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      query: { token }
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketInstance.on('receive_message', (data) => {
      const { modelId, message, isComplete, order } = data;
      
      setCurrentResponses(prev => ({
        ...prev,
        [modelId]: {
          content: prev[modelId].content + message,
          isComplete
        }
      }));
    });

    socketInstance.on('model_complete', (data) => {
      const { modelId } = data;
      console.log(`Model ${modelId} completed response`);
    });

    socketInstance.on('all_responses_complete', () => {
      setWaitingForResponse(false);
      
      // Add the completed responses to the messages array
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          modelId: 'deepseek',
          content: currentResponses.deepseek.content
        },
        {
          role: 'assistant',
          modelId: 'nova',
          content: currentResponses.nova.content
        }
      ]);
      
      // Reset current responses
      setCurrentResponses({
        deepseek: { content: '', isComplete: false },
        nova: { content: '', isComplete: false }
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token]);

  // Load sessions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessionsData = await getSessions();
      setSessions(sessionsData.sessions);
      
      // If there are sessions, set the first one as current
      if (sessionsData.sessions.length > 0) {
        await selectSession(sessionsData.sessions[0].id);
      } else {
        // If no sessions, create a new one
        await createNewSession();
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      setIsLoading(true);
      const response = await createSession();
      const newSession = {
        id: response.sessionId,
        createdAt: new Date().toISOString()
      };
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = async (sessionId) => {
    try {
      setIsLoading(true);
      const session = sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');
      
      setCurrentSession(session);
      
      // Load session history
      const history = await getSessionHistory(sessionId);
      setMessages(history.history);
      
      return session;
    } catch (error) {
      console.error('Failed to select session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = (message) => {
    if (!socket || !connected || !currentSession) {
      console.error('Cannot send message: socket not connected or no active session');
      return false;
    }
    
    // Add user message to the messages array
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Reset current responses
    setCurrentResponses({
      deepseek: { content: '', isComplete: false },
      nova: { content: '', isComplete: false }
    });
    
    // Send message to server
    socket.emit('send_message', {
      message,
      sessionId: currentSession.id
    });
    
    setWaitingForResponse(true);
    return true;
  };

  const value = {
    connected,
    sessions,
    currentSession,
    messages,
    currentResponses,
    waitingForResponse,
    isLoading,
    createNewSession,
    selectSession,
    sendMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
