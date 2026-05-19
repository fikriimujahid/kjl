import { isObject } from "@/utils/typeGuards";

type ApiErrorEnvelope = {
  error?: {
    message?: unknown;
  };
  message?: unknown;
};

type ApiSuccessEnvelope<TData> = {
  success?: unknown;
  data?: TData;
};


export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorEnvelope;
    const envelopeMessage = payload?.error?.message;

    if (typeof envelopeMessage === 'string' && envelopeMessage.trim().length > 0) {
      return envelopeMessage;
    }

    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
  } catch {
    // Ignore JSON parse errors and fallback to status text.
  }

  return response.statusText || 'Request failed';
}

export async function readSuccessData<TData>(response: Response): Promise<TData> {
  const payload = (await response.json()) as ApiSuccessEnvelope<TData> | TData;

  if (isObject(payload) && 'data' in payload) {
    return payload.data as TData;
  }

  return payload as TData;
}