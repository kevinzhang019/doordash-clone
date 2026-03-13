import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { signToken, setSessionCookie } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const user = db.prepare('SELECT id, email, name, role, phone FROM users WHERE id = ?').get(userId) as
    | { id: number; email: string; name: string; role: UserRole; phone: string | null }
    | undefined;

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
  return Response.json({ user });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, phone } = await request.json();

    const db = getDb();
    const currentUser = db.prepare('SELECT role, email, name FROM users WHERE id = ?').get(userId) as
      | { role: UserRole; email: string; name: string }
      | undefined;
    if (!currentUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const newEmail = email?.toLowerCase().trim() || currentUser.email;
    const newName = name?.trim() || currentUser.name;

    // Check email uniqueness for same role (excluding current user)
    if (newEmail !== currentUser.email) {
      const conflict = db
        .prepare('SELECT id FROM users WHERE email = ? AND role = ? AND id != ?')
        .get(newEmail, currentUser.role, userId);
      if (conflict) return Response.json({ error: 'Email already in use' }, { status: 409 });
    }

    db.prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?').run(
      newName,
      newEmail,
      phone?.trim() || null,
      userId
    );

    // Re-issue JWT with updated name/email
    const token = await signToken({ userId, email: newEmail, name: newName, role: currentUser.role });
    await setSessionCookie(token);

    const updated = db.prepare('SELECT id, email, name, role, phone FROM users WHERE id = ?').get(userId);
    return Response.json({ user: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
