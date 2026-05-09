import { AUTH_ENDPOINTS } from './constants';
import { postJson, readErrorMessage } from './http';
import { normalizeSessionPayload } from './session';
import { PasswordResetCodeDelivery, SessionPayload, StoredAuthSession } from './types';

export async function loginWithPassword(email: string, password: string): Promise<StoredAuthSession> {
  const response = await postJson(AUTH_ENDPOINTS.login, { email, password });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as SessionPayload;
  const session = normalizeSessionPayload(payload);

  if (!session) {
    throw new Error('Login response is missing token data');
  }

  return session;
}

export async function logoutAuthSession(): Promise<void> {
  await postJson(AUTH_ENDPOINTS.logout, {});
}

export async function registerWithPassword(
  fullName: string,
  email: string,
  password: string,
): Promise<void> {
  const response = await postJson(AUTH_ENDPOINTS.register, {
    fullName,
    email,
    password,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function requestPasswordReset(email: string): Promise<PasswordResetCodeDelivery | null> {
  const response = await postJson(AUTH_ENDPOINTS.forgotPassword, { email });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  try {
    const payload = (await response.json()) as {
      codeDeliveryDetails?: PasswordResetCodeDelivery;
    };

    return payload?.codeDeliveryDetails ?? null;
  } catch {
    return null;
  }
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  const response = await postJson(AUTH_ENDPOINTS.confirmForgotPassword, {
    email,
    code,
    newPassword,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}
