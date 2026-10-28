import api from './axios.js';

export const getSnacks = (params) => api.get('/snacks', { params });
export const getSnack = (id) => api.get(`/snacks/${id}`);
export const createSnack = (data) => api.post('/snacks', data);
export const updateSnack = (id, data) => api.put(`/snacks/${id}`, data);
export const deleteSnack = (id) => api.delete(`/snacks/${id}`);
