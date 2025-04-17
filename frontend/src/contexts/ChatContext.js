import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { createSession, getSessionHistory } from '../services/api';

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
  const [finalResponses, setFinalResponses] = useState({
    deepseek: '',
    nova: ''
  });
  
  // Create a ref to store the latest finalResponses
  const finalResponsesRef = useRef({
    deepseek: '',
    nova: ''
  });

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socketInstance = io(process.env.REACT_APP_SOCKET_IO_URL || '', {
      query: { token },
      path: process.env.REACT_APP_SOCKET_IO_PATH || undefined
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
      const { modelId, message, isComplete } = data;
      
      console.log(`Received message from ${modelId}:`, message);
      
      // Update current responses for streaming display
      setCurrentResponses(prev => {
        const updatedContent = prev[modelId].content + message;
        console.log(`Updated ${modelId} content:`, updatedContent);
        return {
          ...prev,
          [modelId]: {
            content: updatedContent,
            isComplete
          }
        };
      });
      
      // Update final responses separately to avoid closure issues
      setFinalResponses(prevFinal => {
        const updatedFinal = {
          ...prevFinal,
          [modelId]: (prevFinal[modelId] || '') + message
        };
        
        // Also update the ref
        finalResponsesRef.current = {
          ...finalResponsesRef.current,
          [modelId]: updatedFinal[modelId]
        };
        
        console.log(`Updated final ${modelId}:`, updatedFinal[modelId]);
        return updatedFinal;
      });
    });

    socketInstance.on('model_complete', (data) => {
      const { modelId } = data;
      console.log(`Model ${modelId} completed response`);
    });

    socketInstance.on('all_responses_complete', () => {
      console.log('All responses complete.');
      
      // Use the current state directly from the finalResponses ref
      const currentFinalResponses = { ...finalResponsesRef.current };
      
      console.log('Final responses from ref:', currentFinalResponses);
      
      // Add the completed responses to the messages array
      if (currentFinalResponses.deepseek && currentFinalResponses.nova) {
        console.log('Adding messages to history');
        
        // Create new message objects with timestamps
        const deepseekMessage = {
          role: 'assistant',
          modelId: 'deepseek',
          content: currentFinalResponses.deepseek,
          timestamp: new Date().toISOString()
        };
        
        const novaMessage = {
          role: 'assistant',
          modelId: 'nova',
          content: currentFinalResponses.nova,
          timestamp: new Date().toISOString()
        };
        
        console.log('New messages to add:', [deepseekMessage, novaMessage]);
        
        // Update messages state
        setMessages(prevMessages => {
          const newMessages = [...prevMessages, deepseekMessage, novaMessage];
          console.log('New messages array:', newMessages);
          return newMessages;
        });
      } else {
        console.warn('Missing final content for one or both models');
      }
      
      // Wait a bit before resetting the state to ensure the UI has time to update
      setTimeout(() => {
        // Reset waiting state and current responses
        setWaitingForResponse(false);
        setCurrentResponses({
          deepseek: { content: '', isComplete: false },
          nova: { content: '', isComplete: false }
        });
        
        // Reset final responses
        setFinalResponses({
          deepseek: '',
          nova: ''
        });
        
        // Reset the ref
        finalResponsesRef.current = {
          deepseek: '',
          nova: ''
        };
      }, 500);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token]);

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
    
    console.log('Sending message:', message);
    
    // Add user message to the messages array
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: message,
      timestamp: new Date().toISOString()
    }]);
    
    // Reset current responses
    setCurrentResponses({
      deepseek: { content: '', isComplete: false },
      nova: { content: '', isComplete: false }
    });
    
    // Reset final responses
    setFinalResponses({
      deepseek: '',
      nova: ''
    });
    
    // Reset the ref
    finalResponsesRef.current = {
      deepseek: '',
      nova: ''
    };
    
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
    sendMessage,
    finalResponses
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
