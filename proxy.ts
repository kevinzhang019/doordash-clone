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
  const isProtectedApi = PROTECTED_APIS.some(r => pathname === r || pathname.startsWith(r));
  const isApiRoute = pathname.startsWith('/api/');

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

  // Auth pages: always allow through
  if (isAuthPage) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-id', guestId);
    return withGuestCookie(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // For page navigations (non-API), let them through — client-side auth guards handle redirects.
  // The browser doesn't send Authorization headers on page navigation, so we can't authenticate here.
  if (!isApiRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-id', guestId);
    return withGuestCookie(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // --- API routes: read token from Authorization header ---
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Unprotected API (e.g. public restaurant listings) — pass as guest
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-id', guestId);
    return withGuestCookie(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as { userId: number; role?: UserRole }).userId;
    const role = (payload as { userId: number; role?: UserRole }).role || 'customer';

    // Enforce role-based access: reject if user's role doesn't match the route's expected role
    const requiredRole = roleForPath(pathname);
    if (requiredRole && role !== requiredRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId.toString());
    requestHeaders.set('x-user-role', role);
    if (existingGuestId) requestHeaders.set('x-guest-id', existingGuestId);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-id', guestId);
    return withGuestCookie(NextResponse.next({ request: { headers: requestHeaders } }));
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
