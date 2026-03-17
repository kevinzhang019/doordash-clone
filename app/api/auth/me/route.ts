import { NextRequest } from 'next/server';
import { getSessionFromHeader } from '@/lib/auth';
import getDb from '@/db/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromHeader(request);
    if (!session) {
      return Response.json({ user: null });
    }

    const db = getDb();
    const dbUser = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(session.userId) as
      | { avatar_url: string | null }
      | undefined;

    if (!dbUser) {
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
