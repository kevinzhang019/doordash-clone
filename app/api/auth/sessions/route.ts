import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import getDb from '@/db/database';
import type { UserRole } from '@/lib/types';

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

async function verifyRoleToken(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const session = await verifyToken(token);
    const db = getDb();
    const dbUser = db.prepare('SELECT id FROM users WHERE id = ?').get(session.userId);
    if (!dbUser) return null;
    return { id: session.userId, name: session.name, email: session.email, role: session.role };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Client sends per-role tokens as headers: x-token-customer, x-token-driver, x-token-restaurant
    const customerToken = request.headers.get('x-token-customer');
    const driverToken = request.headers.get('x-token-driver');
    const restaurantToken = request.headers.get('x-token-restaurant');

    const [customer, driver, restaurant] = await Promise.all([
      verifyRoleToken(customerToken),
      verifyRoleToken(driverToken),
      verifyRoleToken(restaurantToken),
    ]);

    return Response.json({ customer, driver, restaurant });
  } catch (error) {
    console.error('Sessions error:', error);
    return Response.json({ customer: null, driver: null, restaurant: null });
  }
}
