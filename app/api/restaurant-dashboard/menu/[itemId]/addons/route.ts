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

  // Verify ownership
  const { data: item } = await supabase.from('menu_items').select('id').eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId).maybeSingle();
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const { data: addons } = await supabase
    .from('menu_item_addons')
    .select('*')
    .eq('menu_item_id', parseInt(itemId))
    .order('id', { ascending: true });

  return Response.json({ addons: addons ?? [] });
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
    const { addons } = await request.json();
    if (!Array.isArray(addons)) return Response.json({ error: 'addons must be an array' }, { status: 400 });

    // Delete existing addons then insert new ones
    await supabase.from('menu_item_addons').delete().eq('menu_item_id', parseInt(itemId));

    const rows = addons
      .filter((addon: { name?: string }) => addon.name?.trim())
      .map((addon: { name: string; price?: number | string }) => ({
        menu_item_id: parseInt(itemId),
        name: addon.name.trim(),
        price: parseFloat(String(addon.price)) || 0,
      }));

    if (rows.length > 0) {
      await supabase.from('menu_item_addons').insert(rows);
    }

    const { data: updated } = await supabase
      .from('menu_item_addons')
      .select('*')
      .eq('menu_item_id', parseInt(itemId))
      .order('id', { ascending: true });

    return Response.json({ addons: updated ?? [] });
  } catch (error) {
    console.error('Update addons error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
