import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase';

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

    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .maybeSingle();

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    // Optimistic lock: only update if password_hash hasn't changed since we read it
    // This prevents a concurrent password change from being silently overwritten
    const { data: updated } = await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('id', userId)
      .eq('password_hash', user.password_hash)
      .select('id')
      .maybeSingle();

    if (!updated) {
      return Response.json({ error: 'Password was changed by another session. Please try again.' }, { status: 409 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
