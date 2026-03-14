import { NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json().catch(() => ({ role: 'customer' }));
    const validRoles: UserRole[] = ['customer', 'restaurant', 'driver'];
    const targetRole: UserRole = validRoles.includes(role) ? role : 'customer';
    await clearSessionCookie(targetRole);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
