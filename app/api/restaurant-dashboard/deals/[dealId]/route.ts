import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
  return owner?.restaurant_id ?? null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { dealId } = await params;
  const { is_active } = await request.json();
  const supabase = getSupabaseAdmin();

  const { data: deal } = await supabase
    .from('deals')
    .select('id, menu_item_id')
    .eq('id', parseInt(dealId))
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (!deal) return Response.json({ error: 'Deal not found' }, { status: 404 });

  if (is_active) {
    const { data: conflict } = await supabase
      .from('deals')
      .select('id')
      .eq('menu_item_id', deal.menu_item_id)
      .eq('is_active', true)
      .neq('id', parseInt(dealId))
      .maybeSingle();

    if (conflict) return Response.json({ error: 'This item already has an active deal. Deactivate it before activating another.' }, { status: 409 });
  }

  const { error: updateError } = await supabase.from('deals').update({ is_active: !!is_active }).eq('id', parseInt(dealId));

  // Handle unique partial index violation from concurrent activation race
  if (updateError?.code === '23505') {
    return Response.json({ error: 'This item already has an active deal. Deactivate it before activating another.' }, { status: 409 });
  }
  if (updateError) throw updateError;

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { dealId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: deal } = await supabase.from('deals').select('id').eq('id', parseInt(dealId)).eq('restaurant_id', restaurantId).maybeSingle();
  if (!deal) return Response.json({ error: 'Deal not found' }, { status: 404 });

  await supabase.from('deals').delete().eq('id', parseInt(dealId));
  return Response.json({ ok: true });
}
