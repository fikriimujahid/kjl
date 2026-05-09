import { AuthUser, JwtPayload } from './types';

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payloadJson = decodeBase64Url(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

export function isIdTokenExpired(idToken: string): boolean {
  const payload = parseJwtPayload(idToken);
  if (!payload?.exp) {
    return false;
  }

  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowEpochSeconds;
}

export function getAuthUserFromIdToken(idToken: string): AuthUser | null {
  const payload = parseJwtPayload(idToken);
  if (!payload) {
    return null;
  }

  const id = payload.sub ?? payload['cognito:username'] ?? '';
  const email = payload.email ?? '';
  const name = payload.name ?? payload.email ?? 'Pengguna';

  if (!id || !email) {
    return null;
  }

  return {
    id,
    email,
    name,
  };
}
