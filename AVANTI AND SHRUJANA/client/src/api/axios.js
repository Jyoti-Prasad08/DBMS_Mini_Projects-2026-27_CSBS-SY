import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept error responses to always expose the backend's friendly error message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage = error.response?.data?.error || error.response?.data?.message;
    if (backendMessage) {
      error.message = backendMessage;
    }
    return Promise.reject(error);
  }
);

export default api;
