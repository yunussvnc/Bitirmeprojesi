import type { NextRequest } from 'next/server.js';
import { NextResponse } from 'next/server.js';

const ACCESS_COOKIE = 'asemos_admin_access';
const REFRESH_COOKIE = 'asemos_admin_refresh';

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Cookie presence is only a navigation hint. Authorization remains the
  // backend's responsibility because proxy code cannot verify JWT signatures.
  if (!accessToken && !refreshToken && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set(
      'redirect',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (accessToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
