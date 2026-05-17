export interface JsonRequestInit extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function requestJson<TResponse>(url: string, init: JsonRequestInit = {}): Promise<TResponse> {
  const { body, headers, ...rest } = init;

  const response = await fetch(url, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(response.statusText || 'Request failed');
  }

  return response.json() as Promise<TResponse>;
}