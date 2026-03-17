import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
  return owner?.restaurant_id ?? null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const supabase = getSupabaseAdmin();

  // Verify item belongs to this restaurant
  const { data: existing } = await supabase.from('menu_items').select('id').eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId).maybeSingle();
  if (!existing) return Response.json({ error: 'Item not found' }, { status: 404 });

  try {
    const { name, category, description, price, image_url, is_available, allow_special_requests } = await request.json();

    await supabase
      .from('menu_items')
      .update({
        name,
        category,
        description,
        price: parseFloat(price),
        image_url,
        is_available: !!is_available,
        allow_special_requests: !!allow_special_requests,
      })
      .eq('id', parseInt(itemId))
      .eq('restaurant_id', restaurantId);

    const { data: item } = await supabase.from('menu_items').select('*').eq('id', parseInt(itemId)).single();
    return Response.json({ item });
  } catch (error) {
    console.error('Update menu item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase.from('menu_items').select('id').eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId).maybeSingle();
  if (!existing) return Response.json({ error: 'Item not found' }, { status: 404 });

  const { is_available } = await request.json();
  await supabase.from('menu_items').update({ is_available: !!is_available }).eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId);

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase.from('menu_items').select('id').eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId).maybeSingle();
  if (!existing) return Response.json({ error: 'Item not found' }, { status: 404 });

  await supabase.from('menu_items').delete().eq('id', parseInt(itemId)).eq('restaurant_id', restaurantId);
  return Response.json({ success: true });
}
