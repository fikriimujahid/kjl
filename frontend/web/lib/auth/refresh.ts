import { AUTH_ENDPOINTS } from './constants';
import { getJson, postJson, readErrorMessage } from './http';
import { normalizeSessionPayload } from './session';
import { SessionEnvelopePayload, SessionPayload, StoredAuthSession } from './types';

export async function refreshAuthSession(): Promise<StoredAuthSession> {
  const response = await postJson(AUTH_ENDPOINTS.refresh, {});

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as SessionPayload;
  const session = normalizeSessionPayload(payload);

  if (!session) {
    throw new Error('Refresh response is missing token data');
  }

  return session;
}

export async function fetchAuthSession(): Promise<StoredAuthSession | null> {
  const response = await getJson(AUTH_ENDPOINTS.session);

  if (!response.ok) {
    return null;
  }

  try {
    const payload = (await response.json()) as SessionEnvelopePayload;

    if (!payload?.authenticated || !payload.session) {
      return null;
    }

    return normalizeSessionPayload(payload.session);
  } catch {
    return null;
  }
}
