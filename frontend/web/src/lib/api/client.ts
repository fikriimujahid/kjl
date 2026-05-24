export async function postJson(path: string, payload: Record<string, unknown>): Promise<Response> {
  return fetch(`${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function getJson(path: string): Promise<Response> {
  return fetch(`${path}`, {
    method: 'GET',
    credentials: 'include',
  });
}