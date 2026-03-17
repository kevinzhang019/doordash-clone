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
  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  return Response.json({ items: items ?? [] });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const { name, category, description, price, image_url, is_available, allow_special_requests } = await request.json();

    if (!name?.trim() || !category?.trim() || price === undefined) {
      return Response.json({ error: 'name, category, and price are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: item } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurantId,
        name: name.trim(),
        category: category.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        image_url: image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        is_available: is_available !== false,
        allow_special_requests: !!allow_special_requests,
      })
      .select()
      .single();

    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Create menu item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
