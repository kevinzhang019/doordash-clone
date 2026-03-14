import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/db/database';
import { signToken, setSessionCookie } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const db = getDb();
    const users = db.prepare('SELECT id, email, name, password_hash, role FROM users WHERE email = ?').all(
      email.toLowerCase().trim()
    ) as { id: number; email: string; name: string; password_hash: string; role: UserRole }[];

    if (users.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Multiple accounts for same email (different roles)
    if (users.length > 1 && !role) {
      // Verify password matches at least one account first
      let passwordValid = false;
      for (const u of users) {
        if (await bcrypt.compare(password, u.password_hash)) {
          passwordValid = true;
          break;
        }
      }
      if (!passwordValid) {
        return Response.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      return Response.json({
        requiresRoleSelection: true,
        availableRoles: users.map(u => u.role),
      });
    }

    // Find the right user (either by role or first match)
    const user = role ? users.find(u => u.role === role) : users[0];
    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    await setSessionCookie(token, user.role);

    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
