import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { UserRole } from '@/lib/types';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const protectedRoutes = ['/orders', '/restaurant-dashboard', '/driver-dashboard', '/restaurant-setup', '/settings'];
const protectedApiRoutes = ['/api/cart', '/api/orders', '/api/reviews', '/api/restaurant-dashboard', '/api/driver', '/api/settings', '/api/messages'];

// Pages that restaurant/driver roles should never see
const CUSTOMER_ONLY_PAGES = ['/', '/cart', '/checkout', '/orders'];

function dashboardFor(role: UserRole): string {
  if (role === 'restaurant') return '/restaurant-dashboard';
  if (role === 'driver') return '/driver-dashboard';
  return '/';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedRoutes.some(route => pathname.startsWith(route));
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isCustomerOnlyPage = CUSTOMER_ONLY_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'));

  const token = request.cookies.get('session')?.value;
  const existingGuestId = request.cookies.get('guest_id')?.value;
  const guestId = existingGuestId || crypto.randomUUID();

  // No session — only block protected routes
  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isProtectedPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-guest-id', guestId);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
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

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as { userId: number; role?: UserRole }).userId;
    const role = (payload as { userId: number; role?: UserRole }).role || 'customer';

    // Logged-in users should not see login/register
    if (isAuthPage) {
      return NextResponse.redirect(new URL(dashboardFor(role), request.url));
    }

    // Restaurant/driver roles must not see customer-only pages
    if (role !== 'customer' && isCustomerOnlyPage) {
      return NextResponse.redirect(new URL(dashboardFor(role), request.url));
    }

    // Role guards for restricted pages
    if (pathname.startsWith('/restaurant-dashboard') || pathname.startsWith('/api/restaurant-dashboard')) {
      if (role !== 'restaurant') {
        return NextResponse.redirect(new URL(dashboardFor(role), request.url));
      }
    }

    if (pathname.startsWith('/driver-dashboard') || pathname.startsWith('/api/driver')) {
      if (role !== 'driver') {
        return NextResponse.redirect(new URL(dashboardFor(role), request.url));
      }
    }

    if (pathname === '/restaurant-setup') {
      if (role !== 'restaurant') {
        return NextResponse.redirect(new URL(dashboardFor(role), request.url));
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId.toString());
    requestHeaders.set('x-user-role', role);
    if (existingGuestId) {
      requestHeaders.set('x-guest-id', existingGuestId);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isProtectedPage) {
      return NextResponse.redirect(new URL('/login', request.url));
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
  ],
};
