const AUTH_API_BASE_URL = (process.env.AUTH_API_BASE_URL ?? process.env.NEXT_API_BASE_URL)?.replace(/\/$/, '') ?? '/api';

export const AUTH_ENDPOINTS = {
  login: `${AUTH_API_BASE_URL}/login`,
  refresh: `${AUTH_API_BASE_URL}/refresh`,
  session: `${AUTH_API_BASE_URL}/session`,
  logout: `${AUTH_API_BASE_URL}/logout`,
  checkin: `${AUTH_API_BASE_URL}/checkin`,
  register: `${AUTH_API_BASE_URL}/register`,
  forgotPassword: `${AUTH_API_BASE_URL}/forgot-password`,
  confirmForgotPassword: `${AUTH_API_BASE_URL}/forgot-password/confirm`,
} as const;

export const REFRESH_LEAD_TIME_MS = 60_000;
export const MIN_REFRESH_DELAY_MS = 10_000;