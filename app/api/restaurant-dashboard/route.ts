import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
  return owner?.restaurant_id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const supabase = getSupabaseAdmin();
  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
  return Response.json({ restaurant });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const body = await request.json();
    const { name, cuisine, image_url, address, lat, lng, is_accepting_orders } = body;

    const supabase = getSupabaseAdmin();

    // If only toggling is_accepting_orders
    if (is_accepting_orders !== undefined && Object.keys(body).length === 1) {
      await supabase.from('restaurants').update({ is_accepting_orders: !!is_accepting_orders }).eq('id', restaurantId);
      const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
      return Response.json({ restaurant });
    }

    const updateData: Record<string, unknown> = { name, cuisine, image_url, address };
    if (typeof lat === 'number' && typeof lng === 'number') {
      updateData.lat = lat;
      updateData.lng = lng;
    }

    await supabase.from('restaurants').update(updateData).eq('id', restaurantId);

    const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
    return Response.json({ restaurant });
  } catch (error) {
    console.error('Update restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
