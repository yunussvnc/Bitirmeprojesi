import { NextRequest, NextResponse } from 'next/server';

import { isAllowedAdminPath } from '@/lib/bff-path';
import {
  BACKEND_API_BASE_URL,
  clearSessionCookies,
  getSessionTokens,
  refreshSession,
  setSessionCookies,
} from '@/lib/server-session';

async function forward(request: NextRequest, path: string[], accessToken: string, body?: ArrayBuffer) {
  const relativePath = path.join('/');
  const target = new URL(`${BACKEND_API_BASE_URL}/${relativePath}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${accessToken}`);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = request.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? body : undefined,
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });
}

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!isAllowedAdminPath(path)) {
    return NextResponse.json({ detail: 'BFF rotası izinli değil.' }, { status: 404 });
  }

  const { accessToken, refreshToken } = await getSessionTokens();
  if (!accessToken && !refreshToken) {
    return NextResponse.json({ detail: 'Oturum bulunamadı.' }, { status: 401 });
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;
  let backendResponse = accessToken ? await forward(request, path, accessToken, body) : null;
  let refreshedTokens = null;

  if ((!backendResponse || backendResponse.status === 401) && refreshToken) {
    refreshedTokens = await refreshSession(refreshToken);
    if (refreshedTokens) backendResponse = await forward(request, path, refreshedTokens.access_token, body);
  }

  if (!backendResponse) {
    const response = NextResponse.json({ detail: 'Oturum geçersiz.' }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const response = new NextResponse(await backendResponse.arrayBuffer(), {
    status: backendResponse.status,
    headers: {
      'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
    },
  });

  if (refreshedTokens) setSessionCookies(response, refreshedTokens);
  if (backendResponse.status === 401) clearSessionCookies(response);
  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
