import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/db/database';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = getDb();
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)'
    ).run(email.toLowerCase().trim(), name.trim(), passwordHash);

    const userId = result.lastInsertRowid as number;
    const token = await signToken({ userId, email: email.toLowerCase().trim(), name: name.trim() });
    await setSessionCookie(token);

    return Response.json({ user: { id: userId, email: email.toLowerCase().trim(), name: name.trim() } }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
