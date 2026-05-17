const DEFAULT_ALLOWED_HOSTS = ['docs.google.com'];

export function isAllowedExternalUrl(value: string, allowedHosts: string[] = DEFAULT_ALLOWED_HOSTS): boolean {
  try {
    const parsed = new URL(value);
    return allowedHosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}