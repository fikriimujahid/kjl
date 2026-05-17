import type { AuthUser, StoredAuthSession } from '@/features/auth/services/types';

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