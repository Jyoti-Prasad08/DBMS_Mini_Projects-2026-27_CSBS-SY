import api from './axios.js';

export const getShows = (params) => api.get('/shows', { params });
export const getShow = (id) => api.get(`/shows/${id}`);
export const createShow = (data) => api.post('/shows', data);
export const updateShow = (id, data) => api.put(`/shows/${id}`, data);
export const deleteShow = (id) => api.delete(`/shows/${id}`);
