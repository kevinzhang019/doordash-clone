import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  // Fetch orders that are not delivered, with restaurant info and driver info
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, placed_at, total, estimated_delivery_at, delivered_at, restaurant_id, driver_user_id, restaurants(name, delivery_min, delivery_max)')
    .eq('user_id', userId)
    .not('status', 'eq', 'delivered')
    .order('placed_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Active orders error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Get driver names for orders with drivers
  const driverIds = [...new Set((orders || []).map(o => o.driver_user_id).filter(Boolean))];
  let driverMap: Record<number, string> = {};
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase
      .from('users')
      .select('id, name')
      .in('id', driverIds);
    if (drivers) {
      for (const d of drivers) {
        driverMap[d.id] = d.name;
      }
    }
  }

  // Get item counts for all orders
  const orderIds = (orders || []).map(o => o.id);
  let itemCountMap: Record<number, number> = {};
  if (orderIds.length > 0) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_id, quantity')
      .in('order_id', orderIds);
    if (orderItems) {
      for (const item of orderItems) {
        itemCountMap[item.order_id] = (itemCountMap[item.order_id] || 0) + item.quantity;
      }
    }
  }

  // Map to expected format
  const mappedOrders = (orders || []).map((o: Record<string, unknown>) => ({
    id: o.id,
    status: o.status,
    placed_at: o.placed_at,
    total: o.total,
    estimated_delivery_at: o.estimated_delivery_at,
    delivered_at: o.delivered_at,
    restaurant_name: (o.restaurants as Record<string, unknown>)?.name,
    delivery_min: (o.restaurants as Record<string, unknown>)?.delivery_min,
    delivery_max: (o.restaurants as Record<string, unknown>)?.delivery_max,
    driver_user_id: o.driver_user_id,
    driver_name: o.driver_user_id ? driverMap[o.driver_user_id as number] ?? null : null,
    item_count: itemCountMap[o.id as number] || 0,
  }));

  return Response.json({ orders: mappedOrders });
}
