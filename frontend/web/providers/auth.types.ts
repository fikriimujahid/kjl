import type { AuthUser, StoredAuthSession } from '@/lib/auth/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  login: (session: StoredAuthSession) => void;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
}