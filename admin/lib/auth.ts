// lib/auth.ts

export interface DecodedToken {
  exp?: number;
  role?: string;
  [claim: string]: unknown;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const decoded: unknown = JSON.parse(jsonPayload);
    return decoded !== null && typeof decoded === 'object'
      ? (decoded as DecodedToken)
      : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded.exp !== 'number') return true;
  return decoded.exp * 1000 < Date.now();
}
