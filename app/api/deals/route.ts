import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      id, restaurant_id, menu_item_id, deal_type, discount_value, is_active, created_at,
      restaurants!inner ( name, image_url ),
      menu_items!inner ( name, price )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get deals error:', error);
    return Response.json({ deals: [] });
  }

  // Flatten the joined data to match the original response shape
  const flatDeals = (deals || []).map((d: Record<string, unknown>) => {
    const restaurant = d.restaurants as { name: string; image_url: string };
    const menuItem = d.menu_items as { name: string; price: number };
    return {
      id: d.id,
      restaurant_id: d.restaurant_id,
      menu_item_id: d.menu_item_id,
      deal_type: d.deal_type,
      discount_value: d.discount_value,
      is_active: d.is_active,
      created_at: d.created_at,
      restaurant_name: restaurant.name,
      restaurant_image_url: restaurant.image_url,
      menu_item_name: menuItem.name,
      menu_item_price: menuItem.price,
    };
  });

  return Response.json({ deals: flatDeals });
}
