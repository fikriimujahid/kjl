import { AUTH_ENDPOINTS } from '@/constants/auth';
import { getJson } from '@/lib/api/client';
import { readSuccessData } from '@/lib/api/response';
import { AuthUser, SessionEnvelopePayload, SessionPayload, StoredAuthSession } from '@/types/auth';
import { getAuthUserFromIdToken } from './token';

export function normalizeSessionPayload(payload: SessionPayload): StoredAuthSession | null {
  if (typeof payload.accessToken !== 'string' || typeof payload.idToken !== 'string') {
    return null;
  }

  const tokenUser = getAuthUserFromIdToken(payload.idToken);
  const bodyUser = payload.user as Partial<AuthUser> | undefined;
  const user = tokenUser ?? {
    id: bodyUser?.id ?? '',
    email: bodyUser?.email ?? '',
    name: bodyUser?.name ?? bodyUser?.email ?? 'Pengguna',
    lastCheckinDate: bodyUser?.lastCheckinDate,
  };

  if (!user.id || !user.email) {
    return null;
  }

  return {
    accessToken: payload.accessToken,
    idToken: payload.idToken,
    refreshToken: typeof payload.refreshToken === 'string' ? payload.refreshToken : undefined,
    expiresIn: typeof payload.expiresIn === 'number' ? payload.expiresIn : undefined,
    tokenType: typeof payload.tokenType === 'string' ? payload.tokenType : undefined,
    user,
  };
}

export async function fetchAuthSession(): Promise<StoredAuthSession | null> {
  const response = await getJson(AUTH_ENDPOINTS.session);

  if (!response.ok) {
    return null;
  }

  try {
    const payload = await readSuccessData<SessionEnvelopePayload>(response);

    if (!payload?.authenticated || !payload.session) {
      return null;
    }

    return normalizeSessionPayload(payload.session);
  } catch {
    return null;
  }
}

interface InitializeAuthSessionOptions {
  isActive: () => boolean;
  onAuthenticated: (session: StoredAuthSession) => void;
  onUnauthenticated: () => void;
}

export async function initializeAuthSession({
  isActive,
  onAuthenticated,
  onUnauthenticated,
}: InitializeAuthSessionOptions): Promise<void> {
  const nextSession = await fetchAuthSession();

  if (!isActive()) {
    return;
  }

  if (!nextSession) {
    onUnauthenticated();
    return;
  }

  onAuthenticated(nextSession);
}
