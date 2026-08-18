import { NextRequest, NextResponse } from 'next/server';

import {
  BACKEND_API_BASE_URL,
  BackendTokenResponse,
  clearSessionCookies,
  setSessionCookies,
} from '@/lib/server-session';

const ALLOWED_ROLES = new Set(['admin', 'venue']);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  const responseBody = await backendResponse.json().catch(() => ({ detail: 'Giriş servisi geçersiz yanıt verdi.' }));

  if (!backendResponse.ok) {
    const response = NextResponse.json(responseBody, { status: backendResponse.status });
    clearSessionCookies(response);
    return response;
  }

  const tokens = responseBody as BackendTokenResponse;
  if (!ALLOWED_ROLES.has(tokens.user?.role)) {
    const response = NextResponse.json({ detail: 'Bu panele erişim yetkiniz yok.' }, { status: 403 });
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.json({ user: tokens.user });
  setSessionCookies(response, tokens);
  return response;
}
