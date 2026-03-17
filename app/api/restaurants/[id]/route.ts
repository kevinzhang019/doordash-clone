import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Restaurant, MenuItem, Deal } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id);
    if (isNaN(restaurantId)) {
      return Response.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restError) throw restError;
    if (!restaurant) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { data: ownerRow } = await supabase
      .from('restaurant_owners')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    const isOwned = !!ownerRow;

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('category')
      .order('name');

    if (menuError) throw menuError;

    // Group by category
    const menuByCategory: Record<string, MenuItem[]> = {};
    for (const item of (menuItems || [])) {
      if (!menuByCategory[item.category]) {
        menuByCategory[item.category] = [];
      }
      menuByCategory[item.category].push(item as MenuItem);
    }

    const { data: ownerDeals, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);

    if (dealsError) throw dealsError;

    return Response.json({ restaurant, menu: menuByCategory, isSeeded: !isOwned, ownerDeals: ownerDeals || [] });
  } catch (error) {
    console.error('Get restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
