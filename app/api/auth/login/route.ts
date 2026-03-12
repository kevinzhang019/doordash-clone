import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/db/database';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(
      email.toLowerCase().trim()
    ) as { id: number; email: string; name: string; password_hash: string } | undefined;

    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);

    return Response.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
