import { API_BASE_URL } from './constants';

export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown };
    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
  } catch {
    // Ignore JSON parse errors and fallback to status text.
  }

  return response.statusText || 'Request failed';
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
