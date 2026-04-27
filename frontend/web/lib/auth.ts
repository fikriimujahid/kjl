export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface StoredAuthSession {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  user: AuthUser;
}

export const AUTH_STORAGE_KEY = process.env.NEXT_PUBLIC_AUTH_STORAGE_KEY ?? '';

type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  ['cognito:username']?: string;
};

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

export function readStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!AUTH_STORAGE_KEY) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as StoredAuthSession;
    if (!parsed?.idToken || !parsed?.accessToken || !parsed?.user?.email) {
      return null;
    }

    if (isIdTokenExpired(parsed.idToken)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredAuthSession(session: StoredAuthSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!AUTH_STORAGE_KEY) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!AUTH_STORAGE_KEY) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
