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
  const { data: deals } = await supabase
    .from('deals')
    .select('id, restaurant_id, menu_item_id, deal_type, discount_value, is_active, created_at, menu_items(name, price)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  // Flatten the joined menu_items data to match the original response shape
  const formattedDeals = (deals ?? []).map((d: Record<string, unknown>) => {
    const menuItem = d.menu_items as { name: string; price: number } | null;
    return {
      id: d.id,
      restaurant_id: d.restaurant_id,
      menu_item_id: d.menu_item_id,
      deal_type: d.deal_type,
      discount_value: d.discount_value,
      is_active: d.is_active,
      created_at: d.created_at,
      menu_item_name: menuItem?.name ?? null,
      menu_item_price: menuItem?.price ?? null,
    };
  });

  return Response.json({ deals: formattedDeals });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { menu_item_id, deal_type, discount_value } = await request.json();
  if (!menu_item_id || !deal_type) return Response.json({ error: 'Missing fields' }, { status: 400 });
  if (deal_type === 'percentage_off' && (!discount_value || discount_value <= 0 || discount_value >= 100)) {
    return Response.json({ error: 'Discount must be between 1 and 99' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify item belongs to this restaurant
  const { data: item } = await supabase.from('menu_items').select('id').eq('id', menu_item_id).eq('restaurant_id', restaurantId).maybeSingle();
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const normalizedDiscount = deal_type === 'percentage_off' ? discount_value : null;

  // Check if identical deal already exists
  let identicalQuery = supabase
    .from('deals')
    .select('id, is_active')
    .eq('menu_item_id', menu_item_id)
    .eq('deal_type', deal_type);

  if (normalizedDiscount === null) {
    identicalQuery = identicalQuery.is('discount_value', null);
  } else {
    identicalQuery = identicalQuery.eq('discount_value', normalizedDiscount);
  }

  const { data: identical } = await identicalQuery.maybeSingle();

  if (identical) {
    // Deactivate other active deals for this item
    const { data: deactivated } = await supabase
      .from('deals')
      .update({ is_active: false })
      .eq('menu_item_id', menu_item_id)
      .neq('id', identical.id)
      .eq('is_active', true)
      .select('id');

    const previousDeactivated = (deactivated?.length ?? 0) > 0;

    await supabase.from('deals').update({ is_active: true }).eq('id', identical.id);
    return Response.json({ dealId: identical.id, reactivated: true, previousDeactivated });
  }

  // Deactivate any existing active deal for this item, then create new one
  const { data: deactivated } = await supabase
    .from('deals')
    .update({ is_active: false })
    .eq('menu_item_id', menu_item_id)
    .eq('is_active', true)
    .select('id');

  const hadActive = (deactivated?.length ?? 0) > 0;

  const { data: newDeal } = await supabase
    .from('deals')
    .insert({
      restaurant_id: restaurantId,
      menu_item_id: menu_item_id,
      deal_type,
      discount_value: normalizedDiscount,
    })
    .select()
    .single();

  return Response.json({ dealId: newDeal?.id, previousDeactivated: hadActive });
}
