import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@/lib/types';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

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

/**
 * Extract and verify session from a Request's Authorization header.
 * Used by API route handlers that need to read the session directly
 * (e.g. /api/auth/me) rather than relying on x-user-id from the proxy.
 */
export async function getSessionFromHeader(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
