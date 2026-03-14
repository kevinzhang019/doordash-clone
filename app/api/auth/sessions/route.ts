import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import getDb from '@/db/database';
import type { UserRole } from '@/lib/types';

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

async function getSessionForRole(role: UserRole, cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<SessionUser | null> {
  const token = cookieStore.get(`session_${role}`)?.value;
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const [customer, driver, restaurant] = await Promise.all([
      getSessionForRole('customer', cookieStore),
      getSessionForRole('driver', cookieStore),
      getSessionForRole('restaurant', cookieStore),
    ]);
    return Response.json({ customer, driver, restaurant });
  } catch (error) {
    console.error('Sessions error:', error);
    return Response.json({ customer: null, driver: null, restaurant: null });
  }
}
