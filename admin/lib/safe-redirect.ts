const ALLOWED_ROUTES = ['/', '/users', '/venues', '/content', '/ai/logs', '/system'];

export function getSafeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(value, 'https://admin.asemos.tr');
    const isAllowed = ALLOWED_ROUTES.some(
      (route) => parsed.pathname === route || (route !== '/' && parsed.pathname.startsWith(`${route}/`)),
    );

    return parsed.origin === 'https://admin.asemos.tr' && isAllowed
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
