import { API_BASE_URL } from './constants';

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

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
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

export async function postJson(path: string, payload: Record<string, unknown>): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function getJson(path: string): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });
}
