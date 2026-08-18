import { NextResponse } from 'next/server';

import {
  BACKEND_API_BASE_URL,
  clearSessionCookies,
  getSessionTokens,
  refreshSession,
  setSessionCookies,
} from '@/lib/server-session';

async function fetchCurrentUser(accessToken: string) {
  return fetch(`${BACKEND_API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
}

export async function GET() {
  const { accessToken, refreshToken } = await getSessionTokens();
  if (!accessToken && !refreshToken) {
    return NextResponse.json({ detail: 'Oturum bulunamadı.' }, { status: 401 });
  }

  let backendResponse = accessToken ? await fetchCurrentUser(accessToken) : null;
  let refreshedTokens = null;

  if ((!backendResponse || backendResponse.status === 401) && refreshToken) {
    refreshedTokens = await refreshSession(refreshToken);
    if (refreshedTokens) backendResponse = await fetchCurrentUser(refreshedTokens.access_token);
  }

  if (!backendResponse?.ok) {
    const response = NextResponse.json({ detail: 'Oturum geçersiz.' }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const user = await backendResponse.json();
  const response = NextResponse.json({ user });
  if (refreshedTokens) setSessionCookies(response, refreshedTokens);
  return response;
}
