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

    // Delete existing groups (cascade should delete options too, but delete explicitly to be safe)
    const { data: existingGroups } = await supabase
      .from('menu_item_option_groups')
      .select('id')
      .eq('menu_item_id', parseInt(itemId));

    if (existingGroups && existingGroups.length > 0) {
      const existingGroupIds = existingGroups.map(g => g.id);
      await supabase.from('menu_item_options').delete().in('group_id', existingGroupIds);
    }
    await supabase.from('menu_item_option_groups').delete().eq('menu_item_id', parseInt(itemId));

    // Insert new groups and options
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      if (!g.name?.trim()) continue;

      const { data: newGroup } = await supabase
        .from('menu_item_option_groups')
        .insert({
          menu_item_id: parseInt(itemId),
          name: g.name.trim(),
          required: !!g.required,
          max_selections: g.max_selections ?? null,
          sort_order: gi,
          selection_type: g.selection_type === 'quantity' ? 'quantity' : 'check',
        })
        .select()
        .single();

      if (!newGroup) continue;

      const opts = Array.isArray(g.options) ? g.options : [];
      const optRows = opts
        .filter((o: { name?: string }, oi: number) => o.name?.trim())
        .map((o: { name: string; price_modifier?: number | string }, oi: number) => ({
          group_id: newGroup.id,
          name: o.name.trim(),
          price_modifier: parseFloat(String(o.price_modifier)) || 0,
          sort_order: oi,
        }));

      if (optRows.length > 0) {
        await supabase.from('menu_item_options').insert(optRows);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update option groups error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
