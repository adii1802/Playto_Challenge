/**
 * api.js — centralized Axios instance.
 * Token is read from localStorage on every request via an interceptor
 * so the UI stays in sync after login without re-creating the instance.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kyc_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
