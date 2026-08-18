import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { buildApiBaseUrl } from './api-base';
import type { SessionUser } from './session-types';

export const ACCESS_COOKIE = 'asemos_admin_access';
export const REFRESH_COOKIE = 'asemos_admin_refresh';
export const BACKEND_API_BASE_URL = buildApiBaseUrl(process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL);

export interface BackendTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: SessionUser;
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

function tokenMaxAge(token: string, fallbackSeconds: number): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { exp?: number };
    if (typeof payload.exp === 'number') {
      return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // The backend remains the source of truth for token validity.
  }
  return fallbackSeconds;
}

export function setSessionCookies(response: NextResponse, tokens: BackendTokenResponse): void {
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    ...cookieOptions,
    maxAge: tokenMaxAge(tokens.access_token, 30 * 60),
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...cookieOptions,
    maxAge: tokenMaxAge(tokens.refresh_token, 30 * 24 * 60 * 60),
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

export async function getSessionTokens(): Promise<{ accessToken?: string; refreshToken?: string }> {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_COOKIE)?.value,
    refreshToken: cookieStore.get(REFRESH_COOKIE)?.value,
  };
}

export async function refreshSession(refreshToken: string): Promise<BackendTokenResponse | null> {
  const response = await fetch(`${BACKEND_API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) return null;
  return (await response.json()) as BackendTokenResponse;
}
