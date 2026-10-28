import api from './axios.js';

export const getTheaters = (params) => api.get('/theaters', { params });
export const getTheater = (id) => api.get(`/theaters/${id}`);
export const createTheater = (data) => api.post('/theaters', data);
export const updateTheater = (id, data) => api.put(`/theaters/${id}`, data);
export const deleteTheater = (id) => api.delete(`/theaters/${id}`);
