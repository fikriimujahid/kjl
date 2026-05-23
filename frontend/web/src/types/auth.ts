export interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastCheckinDate?: string;
}

export interface StoredAuthSession {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  user: AuthUser;
}

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

export type JwtPayload = { 
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  ['cognito:username']?: string;
  ['custom:last_checkin_date']?: string;
};

export interface SessionPayload {
  accessToken?: unknown;
  idToken?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
  tokenType?: unknown;
  user?: unknown;
}

export interface SessionEnvelopePayload {
  authenticated?: boolean;
  session?: SessionPayload;
}

export interface PasswordResetCodeDelivery {
  attributeName?: string;
  deliveryMedium?: string;
  destination?: string;
}
