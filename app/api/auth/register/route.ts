import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/db/database';
import { signToken, setSessionCookie } from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role = 'customer' } = await request.json();

    if (!email || !name || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const validRoles: UserRole[] = ['customer', 'restaurant', 'driver'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    const db = getDb();
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND role = ?').get(
      email.toLowerCase().trim(),
      role
    );
    if (existingUser) {
      return Response.json({ error: 'An account with this email already exists for this role' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(email.toLowerCase().trim(), name.trim(), passwordHash, role);

    const userId = result.lastInsertRowid as number;
    const token = await signToken({ userId, email: email.toLowerCase().trim(), name: name.trim(), role });
    await setSessionCookie(token, role);

    return Response.json({
      user: { id: userId, email: email.toLowerCase().trim(), name: name.trim(), role },
      needsRestaurantSetup: role === 'restaurant',
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
