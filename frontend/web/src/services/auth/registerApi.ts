import { AUTH_ENDPOINTS } from "@/constants/auth";
import { postJson } from "@/lib/api/client";
import { readErrorMessage } from "@/lib/api/response";

export async function registerWithPassword(
  fullName: string,
  email: string,
  password: string,
): Promise<void> {
  const response = await postJson(AUTH_ENDPOINTS.register, {
    fullName,
    email,
    password,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}