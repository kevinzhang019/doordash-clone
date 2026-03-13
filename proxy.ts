import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { UserRole } from '@/lib/types';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const protectedRoutes = ['/cart', '/checkout', '/orders', '/restaurant-dashboard', '/driver-dashboard', '/restaurant-setup'];
const protectedApiRoutes = ['/api/cart', '/api/orders', '/api/reviews', '/api/addresses', '/api/restaurant-dashboard', '/api/driver'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedRoutes.some(route => pathname.startsWith(route));
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as { userId: number; role?: UserRole }).userId;
    const role = (payload as { userId: number; role?: UserRole }).role || 'customer';

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId.toString());
    requestHeaders.set('x-user-role', role);

    // Role guards
    if (pathname.startsWith('/restaurant-dashboard') || pathname.startsWith('/api/restaurant-dashboard')) {
      if (role !== 'restaurant') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/driver-dashboard') || pathname.startsWith('/api/driver')) {
      if (role !== 'driver') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname === '/restaurant-setup') {
      if (role !== 'restaurant') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
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
  ],
};
