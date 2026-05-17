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

export interface PasswordResetCodeDelivery {
  attributeName?: string;
  deliveryMedium?: string;
  destination?: string;
}

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

export type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  ['cognito:username']?: string;
};
