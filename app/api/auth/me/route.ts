import { NextRequest } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth';
import getDb from '@/db/database';
import type { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role') as UserRole | null;
    const validRoles: UserRole[] = ['customer', 'restaurant', 'driver'];
    const role = roleParam && validRoles.includes(roleParam) ? roleParam : undefined;

    const session = await getSession(role);
    if (!session) {
      return Response.json({ user: null });
    }
    const db = getDb();
    const dbUser = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(session.userId) as
      | { avatar_url: string | null }
      | undefined;

    if (!dbUser) {
      if (session.role) await clearSessionCookie(session.role);
      return Response.json({ user: null });
    }

    return Response.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role || 'customer',
        avatar_url: dbUser.avatar_url ?? null,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return Response.json({ user: null });
  }
}
