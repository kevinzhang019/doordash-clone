import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { UserRole } from '@/lib/types';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

// Determine which role owns this route
function roleForPath(pathname: string): UserRole {
  if (pathname.startsWith('/driver-dashboard') || pathname.startsWith('/api/driver')) return 'driver';
  if (
    pathname.startsWith('/restaurant-dashboard') ||
    pathname.startsWith('/api/restaurant-dashboard') ||
    pathname === '/restaurant-setup'
  ) return 'restaurant';
  return 'customer';
}

const PROTECTED_PAGES = [
  '/cart', '/checkout', '/orders',
  '/restaurant-dashboard', '/restaurant-setup',
  '/driver-dashboard',
  '/settings',
];

const PROTECTED_APIS = [
  '/api/cart', '/api/orders', '/api/reviews',
  '/api/restaurant-dashboard',
  '/api/driver',
  '/api/settings', '/api/messages', '/api/addresses',
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

  const routeRole = roleForPath(pathname);
  const token = request.cookies.get(`session_${routeRole}`)?.value;

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
    '/api/driver-ratings',
    '/api/driver-ratings/:path*',
  ],
};
