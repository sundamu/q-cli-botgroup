import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const login = async (password) => {
  try {
    const response = await api.post('/api/auth/login', { password });
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Sessions
export const getSessions = async () => {
  try {
    const response = await api.get('/api/sessions');
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const createSession = async () => {
  try {
    const response = await api.post('/api/sessions/create');
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const getSessionHistory = async (sessionId) => {
  try {
    const response = await api.get(`/api/sessions/${sessionId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session history:', error);
    throw error;
  }
};
