import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Only delete if it belongs to this user
  await supabase
    .from('user_addresses')
    .update({ is_active: false })
    .eq('id', parseInt(id))
    .eq('user_id', userId);

  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { delivery_instructions, handoff_option } = await request.json();

  const supabase = getSupabaseAdmin();

  const { data: address } = await supabase
    .from('user_addresses')
    .select('id')
    .eq('id', parseInt(id))
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!address) return Response.json({ error: 'Address not found' }, { status: 404 });

  await supabase
    .from('user_addresses')
    .update({
      delivery_instructions: delivery_instructions?.trim() || null,
      handoff_option: handoff_option || 'hand_off',
    })
    .eq('id', parseInt(id))
    .eq('user_id', userId);

  return Response.json({ success: true });
}
