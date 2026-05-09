import { getAuthUserFromIdToken } from './jwt';
import { AuthUser, SessionPayload, StoredAuthSession } from './types';

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
