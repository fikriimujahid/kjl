import { AUTH_ENDPOINTS } from "@/constants/auth";
import { postJson } from "@/lib/api/client";

export async function logoutAuthSession(): Promise<void> {
  await postJson(AUTH_ENDPOINTS.logout, {});
}