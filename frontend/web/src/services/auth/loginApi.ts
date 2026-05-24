import { AUTH_ENDPOINTS } from "@/constants/auth";
import { postJson } from "@/lib/api/client";
import { readErrorMessage, readSuccessData } from "@/lib/api/response";
import { SessionPayload, StoredAuthSession } from "@/types/auth";
import { normalizeSessionPayload } from "./session";

export async function loginWithPassword(email: string, password: string): Promise<StoredAuthSession> {
  const response = await postJson(AUTH_ENDPOINTS.login, { email, password });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = await readSuccessData<SessionPayload>(response);
  const session = normalizeSessionPayload(payload);

  if (!session) {
    throw new Error('Login response is missing token data');
  }

  return session;
}