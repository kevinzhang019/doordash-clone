import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const protectedRoutes = ['/cart', '/checkout', '/orders'];
const protectedApiRoutes = ['/api/cart', '/api/orders', '/api/reviews', '/api/addresses'];

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
    const userId = (payload as { userId: number }).userId;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId.toString());

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
  matcher: ['/cart', '/checkout', '/orders/:path*', '/api/cart/:path*', '/api/orders/:path*', '/api/reviews', '/api/addresses', '/api/addresses/:path*'],
};
