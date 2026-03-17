import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: item, error } = await supabase
    .from('menu_items')
    .select(`
      id, name, price, image_url, is_available,
      restaurants!inner ( id, name )
    `)
    .eq('id', parseInt(itemId))
    .maybeSingle();

  if (error) {
    console.error('Get menu item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // Flatten to match original response shape
  const restaurant = item.restaurants as unknown as { id: number; name: string };
  const flatItem = {
    id: item.id,
    name: item.name,
    price: item.price,
    image_url: item.image_url,
    is_available: item.is_available,
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
  };

  return Response.json({ item: flatItem });
}
