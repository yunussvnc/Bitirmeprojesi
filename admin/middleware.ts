import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!token) {
    if (!isLoginPage) {
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

      if (isExpired || !isAuthorized) {
        if (!isLoginPage) {
          const response = NextResponse.redirect(new URL('/login', request.url));
          response.cookies.delete('admin_token');
          return response;
        }
      } else {
        if (isLoginPage) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } else {
      if (!isLoginPage) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('admin_token');
        return response;
      }
    }
  } catch (e) {
    if (!isLoginPage) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('admin_token');
      return response;
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
