import api from './axios.js';

export const getStats = () => api.get('/stats');
