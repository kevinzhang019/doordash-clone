import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import type { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, phone, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Get settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
  return Response.json({ user });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, phone } = await request.json();

    const supabase = getSupabaseAdmin();
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, email, name')
      .eq('id', userId)
      .maybeSingle();

    if (!currentUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const newEmail = email?.toLowerCase().trim() || currentUser.email;
    const newName = name?.trim() || currentUser.name;

    if (!isValidEmail(newEmail)) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (phone && !isValidPhone(phone.trim())) {
      return Response.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }

    // Check email uniqueness for same role (excluding current user)
    if (newEmail !== currentUser.email) {
      const { data: conflict } = await supabase
        .from('users')
        .select('id')
        .eq('email', newEmail)
        .eq('role', currentUser.role)
        .neq('id', userId)
        .maybeSingle();
      if (conflict) return Response.json({ error: 'Email already in use' }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ name: newName, email: newEmail, phone: phone?.trim() || null })
      .eq('id', userId);

    // Handle unique constraint violation from concurrent email update race
    if (updateError) {
      if (updateError.code === '23505') {
        return Response.json({ error: 'Email already in use' }, { status: 409 });
      }
      throw updateError;
    }

    // Re-issue JWT with updated name/email — return token so client can update sessionStorage
    const token = await signToken({ userId, email: newEmail, name: newName, role: currentUser.role as UserRole });

    const { data: updated } = await supabase
      .from('users')
      .select('id, email, name, role, phone')
      .eq('id', userId)
      .single();

    return Response.json({ user: updated, token });
  } catch (error) {
    console.error('Update settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  try {
    // Atomic cascading delete via PostgreSQL function (prevents partial state on failure)
    const { data: result, error: rpcError } = await supabase.rpc('delete_user_account', { p_user_id: userId });

    if (rpcError) throw rpcError;
    if (result?.error) return Response.json({ error: result.error }, { status: 404 });

    // Session token is in per-tab sessionStorage — client clears it on logout/delete
    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
