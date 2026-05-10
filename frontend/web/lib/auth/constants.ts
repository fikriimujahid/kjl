const authApiBaseUrl = process.env.AUTH_API_BASE_URL ?? process.env.NEXT_API_BASE_URL ?? '/api';

export const API_BASE_URL = authApiBaseUrl.replace(/\/$/, '');

export const AUTH_ENDPOINTS = {
  login: '/login',
  refresh: '/refresh',
  session: '/session',
  logout: '/logout',
  register: '/register',
  forgotPassword: '/forgot-password',
  confirmForgotPassword: '/forgot-password/confirm',
} as const;
