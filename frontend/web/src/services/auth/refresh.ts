import { AUTH_ENDPOINTS } from "@/constants/auth";
import { postJson } from "@/lib/api/client";
import { readErrorMessage, readSuccessData } from "@/lib/api/response";
import { SessionPayload, StoredAuthSession } from "@/types/auth";
import { normalizeSessionPayload } from "./session";

interface ExecuteAuthRefreshOptions {
  onAuthenticated: (session: StoredAuthSession) => void;
  onUnauthenticated: () => void;
}

export async function refreshAuthSession(): Promise<StoredAuthSession> { 
  const response = await postJson(AUTH_ENDPOINTS.refresh, {});

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = await readSuccessData<SessionPayload>(response);
  const session = normalizeSessionPayload(payload);

  if (!session) {
    throw new Error('Refresh response is missing token data');
  }

  return session;
}

export async function executeAuthRefresh({
  onAuthenticated,
  onUnauthenticated,
}: ExecuteAuthRefreshOptions): Promise<boolean> {
  try {
    const nextSession = await refreshAuthSession();
    onAuthenticated(nextSession);
    return true;
  } catch {
    onUnauthenticated();
    return false;
  }
}
