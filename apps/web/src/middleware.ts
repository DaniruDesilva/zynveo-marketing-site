import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtHs256 } from './lib/jwtHelper';
import { canAccessRoute } from './lib/routeAccess';

const PUBLIC_FILE = /\.(.*)$/;
const COOKIE_NAME = 'zynveo_access_token';

function clearAuthCookieAndRedirect(request: NextRequest, url: URL): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0, sameSite: 'lax' });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isDemoDev =
    process.env.NODE_ENV !== 'production' &&
    (process.env.DEMO_MOCK_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true');
  const jwtSecret =
    process.env.SUPABASE_JWT_SECRET ||
    (isDemoDev ? 'zynveo-dev-jwt-secret-local-fallback' : undefined);

  const verifiedPayload = token ? await verifyJwtHs256(token, jwtSecret) : null;
  const isAuthenticated = Boolean(verifiedPayload);

  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return clearAuthCookieAndRedirect(request, new URL('/login', request.url));
  }

  if (pathname === '/login' || pathname.startsWith('/login/')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!verifiedPayload) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/dashboard') {
      loginUrl.searchParams.set('next', pathname);
    }
    return clearAuthCookieAndRedirect(request, loginUrl);
  }

  const rawRoles =
    verifiedPayload.app_metadata?.roles ||
    verifiedPayload.roles ||
    verifiedPayload.user_metadata?.roles ||
    ['VIEWER'];
  const roles = Array.isArray(rawRoles) ? rawRoles : [String(rawRoles)];

  if (!canAccessRoute(pathname, roles)) {
    const deniedUrl = new URL('/dashboard', request.url);
    deniedUrl.searchParams.set('denied', '1');
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
