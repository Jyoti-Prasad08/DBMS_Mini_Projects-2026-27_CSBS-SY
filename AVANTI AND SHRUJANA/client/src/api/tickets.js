import api from './axios.js';

export const getTickets = (params) => api.get('/tickets', { params });
export const getTicket = (id) => api.get(`/tickets/${id}`);
export const createTicket = (data) => api.post('/tickets', data);
export const updateTicket = (id, data) => api.put(`/tickets/${id}`, data);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`);
export const applyCoupon = (id, couponId) => api.post(`/tickets/${id}/apply-coupon`, { couponId });
export const removeCoupon = (id, couponId) => api.delete(`/tickets/${id}/remove-coupon/${couponId}`);
