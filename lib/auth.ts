import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/types';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

export function sessionCookieName(role: UserRole): string {
  return `session_${role}`;
}

export async function signToken(payload: { userId: number; email: string; name: string; role: UserRole }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { userId: number; email: string; name: string; role: UserRole };
}

export async function getSession(role?: UserRole) {
  const cookieStore = await cookies();

  if (role) {
    const token = cookieStore.get(sessionCookieName(role))?.value;
    if (!token) return null;
    try {
      return await verifyToken(token);
    } catch {
      return null;
    }
  }

  // No role specified — check all three and return first valid session
  for (const r of ['customer', 'restaurant', 'driver'] as UserRole[]) {
    const token = cookieStore.get(sessionCookieName(r))?.value;
    if (!token) continue;
    try {
      return await verifyToken(token);
    } catch {
      continue;
    }
  }
  return null;
}

export async function setSessionCookie(token: string, role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(role), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearSessionCookie(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName(role));
}
