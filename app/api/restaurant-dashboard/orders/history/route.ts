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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  // Get total count
  const { count: total } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .in('status', ['delivered', 'picked_up']);

  const totalCount = total ?? 0;

  // Get paginated orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, subtotal, total, delivery_fee, placed_at, delivered_at, delivery_address, discount_saved, promo_discount, user_id')
    .eq('restaurant_id', restaurantId)
    .in('status', ['delivered', 'picked_up'])
    .order('placed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!orders || orders.length === 0) {
    return Response.json({ orders: [], total: totalCount, page, pages: Math.ceil(totalCount / limit) });
  }

  // Fetch customer names
  const userIds = [...new Set(orders.map(o => o.user_id))];
  const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
  const userMap = new Map((users ?? []).map(u => [u.id, u.name]));

  // Fetch order items
  const orderIds = orders.map(o => o.id);
  const { data: allItems } = await supabase
    .from('order_items')
    .select('order_id, name, quantity, price')
    .in('order_id', orderIds);

  const ordersWithItems = orders.map(order => {
    const items = (allItems ?? []).filter(item => item.order_id === order.id);
    const { user_id, ...rest } = order;
    return { ...rest, customer_name: userMap.get(user_id) ?? 'Unknown', items };
  });

  return Response.json({ orders: ordersWithItems, total: totalCount, page, pages: Math.ceil(totalCount / limit) });
}
