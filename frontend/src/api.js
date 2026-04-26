/**
 * api.js — centralized Axios instance.
 *
 * Base URL resolution order:
 *   1. VITE_API_URL env variable (set in Vercel dashboard for production)
 *   2. '/api/v1' relative path (works locally via Vite proxy → Django :8000)
 *
 * Token is read from localStorage on every request via an interceptor
 * so the UI stays in sync after login without re-creating the instance.
 */

import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kyc_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
