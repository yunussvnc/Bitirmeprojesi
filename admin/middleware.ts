import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_COOKIE = 'asemos_admin_access';
const REFRESH_COOKIE = 'asemos_admin_refresh';

function clearSession(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

function continueWithRefresh() {
  const response = NextResponse.next();
  response.cookies.delete(ACCESS_COOKIE);
  return response;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!token) {
    if (!refreshToken && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  try {
    const base64Url = token.split('.')[1];
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);
      const decoded = JSON.parse(jsonPayload);
      
      const isExpired = decoded.exp * 1000 < Date.now();
      const isAuthorized = decoded.role === 'admin' || decoded.role === 'venue';

      if (isExpired && refreshToken && !isLoginPage) {
        return continueWithRefresh();
      }

      if (isExpired || !isAuthorized) {
        if (!isLoginPage) {
          return clearSession(NextResponse.redirect(new URL('/login', request.url)));
        }
      } else {
        if (isLoginPage) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } else {
      if (!isLoginPage) {
        return refreshToken
          ? continueWithRefresh()
          : clearSession(NextResponse.redirect(new URL('/login', request.url)));
      }
    }
  } catch {
    if (!isLoginPage) {
      return refreshToken
        ? continueWithRefresh()
        : clearSession(NextResponse.redirect(new URL('/login', request.url)));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
