import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/db/database';

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Both fields are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as
      | { password_hash: string }
      | undefined;
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
