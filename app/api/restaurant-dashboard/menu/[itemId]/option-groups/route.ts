import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
  return owner?.restaurant_id ?? null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: item } = await supabase.from('menu_items').select('id').eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId).maybeSingle();
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const { data: groups } = await supabase
    .from('menu_item_option_groups')
    .select('*')
    .eq('menu_item_id', parseInt(itemId))
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  const groupList = groups ?? [];

  let options: { id: number; group_id: number; name: string; price_modifier: number; sort_order: number }[] = [];
  if (groupList.length > 0) {
    const groupIds = groupList.map(g => g.id);
    const { data: opts } = await supabase
      .from('menu_item_options')
      .select('*')
      .in('group_id', groupIds)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    options = opts ?? [];
  }

  const grouped = groupList.map(g => ({
    ...g,
    options: options.filter(o => o.group_id === g.id),
  }));

  return Response.json({ groups: grouped });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: item } = await supabase.from('menu_items').select('id').eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId).maybeSingle();
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  try {
    const { groups } = await request.json();
    if (!Array.isArray(groups)) return Response.json({ error: 'groups must be an array' }, { status: 400 });

    // Atomic replace via PostgreSQL function (prevents partial state from concurrent reads)
    const groupsPayload = groups.map((g: { id?: number; name?: string; required?: boolean; max_selections?: number | null; selection_type?: string; options?: { id?: number; name?: string; price_modifier?: number | string }[] }, gi: number) => ({
      id: g.id ?? null,
      name: g.name?.trim() ?? '',
      required: !!g.required,
      max_selections: g.max_selections ?? null,
      selection_type: g.selection_type === 'quantity' ? 'quantity' : 'check',
      options: (Array.isArray(g.options) ? g.options : [])
        .filter((o: { name?: string }) => o.name?.trim())
        .map((o: { id?: number; name?: string; price_modifier?: number | string }, oi: number) => ({
          id: o.id ?? null,
          name: (o.name ?? '').trim(),
          price_modifier: parseFloat(String(o.price_modifier)) || 0,
        })),
    }));

    const { data: success, error: rpcError } = await supabase.rpc('replace_menu_item_option_groups', {
      p_menu_item_id: parseInt(itemId),
      p_restaurant_id: restaurantId,
      p_groups: groupsPayload,
    });

    if (rpcError) throw rpcError;
    if (success === false) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update option groups error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
