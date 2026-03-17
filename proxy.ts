import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { UserRole } from '@/lib/types';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

// Determine which role owns this route (null = shared page, no specific role)
function roleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith('/driver-dashboard') || pathname.startsWith('/driver-setup') || (pathname.startsWith('/api/driver') && !pathname.startsWith('/api/driver-ratings'))) return 'driver';
  if (
    pathname.startsWith('/restaurant-dashboard') ||
    pathname.startsWith('/api/restaurant-dashboard') ||
    pathname === '/restaurant-setup'
  ) return 'restaurant';
  if (pathname === '/cart' || pathname.startsWith('/cart/') ||
      pathname === '/checkout' || pathname.startsWith('/checkout/') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/api/cart') || pathname.startsWith('/api/orders') ||
      pathname.startsWith('/api/reviews') || pathname.startsWith('/api/promo') ||
      (pathname.startsWith('/api/stripe') && !pathname.startsWith('/api/stripe/connect'))) return 'customer';
  // Shared pages: /settings, /api/settings, /api/addresses, /api/messages, /, etc.
  return null;
}

const PROTECTED_PAGES = [
  '/cart', '/checkout', '/orders',
  '/restaurant-dashboard', '/restaurant-setup',
  '/driver-dashboard', '/driver-setup',
  '/settings',
];

const PROTECTED_APIS = [
  '/api/cart', '/api/orders', '/api/reviews',
  '/api/restaurant-dashboard',
  '/api/driver',
  '/api/settings', '/api/messages', '/api/addresses',
  '/api/stripe/connect',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProtectedPage = PROTECTED_PAGES.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isProtectedApi = PROTECTED_APIS.some(r => pathname === r || pathname.startsWith(r));

  const existingGuestId = request.cookies.get('guest_id')?.value;
  const guestId = existingGuestId || crypto.randomUUID();

  function withGuestCookie(response: NextResponse): NextResponse {
    if (!existingGuestId) {
      response.cookies.set('guest_id', guestId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }
    return response;
  }

  // Auth pages: always allow through — users may want to log into a different role
  if (isAuthPage) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-id', guestId);
    return withGuestCookie(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // For role-specific routes, use the path to determine which cookie to read.
  // For shared routes (settings, messages, etc.), use the x-session-role header
  // sent by the client (derived from per-tab sessionStorage, not a shared cookie).
  const sessionRoleHint = request.headers.get('x-session-role') as UserRole | null;
  const validHint = sessionRoleHint && ['customer', 'driver', 'restaurant'].includes(sessionRoleHint)
    ? sessionRoleHint : null;
  const pathRole = roleForPath(pathname);

  // Priority: explicit header hint > path-based role > 'customer'
  let routeRole: UserRole = validHint || pathRole || 'customer';
  let token = request.cookies.get(`session_${routeRole}`)?.value;

  // For shared pages, if the chosen cookie doesn't exist, try others
  if (!token && !pathRole) {
    for (const fallback of ['customer', 'driver', 'restaurant'] as UserRole[]) {
      if (fallback === routeRole) continue;
      const t = request.cookies.get(`session_${fallback}`)?.value;
      if (t) {
        token = t;
        routeRole = fallback;
        break;
      }
    }
  }

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isProtectedPage) {
      return NextResponse.redirect(new URL(`/login?role=${routeRole}`, request.url));
    }
    // Unprotected route (e.g. home, restaurant listings) — pass as guest
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-id', guestId);
    return withGuestCookie(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as { userId: number; role?: UserRole }).userId;
    const role = (payload as { userId: number; role?: UserRole }).role || 'customer';

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId.toString());
    requestHeaders.set('x-user-role', role);
    if (existingGuestId) requestHeaders.set('x-guest-id', existingGuestId);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isProtectedPage) {
      return NextResponse.redirect(new URL(`/login?role=${routeRole}`, request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/cart',
    '/checkout',
    '/orders/:path*',
    '/api/cart/:path*',
    '/api/orders/:path*',
    '/api/reviews',
    '/api/addresses',
    '/api/addresses/:path*',
    '/restaurant-dashboard/:path*',
    '/api/restaurant-dashboard/:path*',
    '/driver-dashboard/:path*',
    '/api/driver/:path*',
    '/restaurant-setup',
    '/settings',
    '/api/settings/:path*',
    '/api/messages/:path*',
    '/api/promo/:path*',
    '/api/stripe/:path*',
    '/driver-setup',
    '/stripe-return',
    '/stripe-refresh',
    '/api/driver-ratings',
    '/api/driver-ratings/:path*',
  ],
};
