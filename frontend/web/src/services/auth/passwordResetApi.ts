import { PasswordResetCodeDelivery } from "@/types/auth";
import { AUTH_ENDPOINTS } from "@/constants/auth";
import { postJson } from "@/lib/api/client";
import { readErrorMessage, readSuccessData } from "@/lib/api/response";

export async function requestPasswordReset(email: string): Promise<PasswordResetCodeDelivery | null> {
  const response = await postJson(`${AUTH_ENDPOINTS.forgotPassword}`, { email });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  try {
    const payload = await readSuccessData<{
      codeDeliveryDetails?: PasswordResetCodeDelivery;
    }>(response);

    return payload?.codeDeliveryDetails ?? null;
  } catch {
    return null;
  }
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  const response = await postJson(`${AUTH_ENDPOINTS.confirmForgotPassword}`, {
    email,
    code,
    newPassword,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}