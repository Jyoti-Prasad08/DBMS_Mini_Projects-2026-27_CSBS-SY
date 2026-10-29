import api from './axios.js';

export const getCoupons = (params) => api.get('/coupons', { params });
export const getCoupon = (id) => api.get(`/coupons/${id}`);
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);
