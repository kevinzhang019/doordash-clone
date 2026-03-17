import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { OrderItem, OrderItemSelection, Review } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // IDOR prevention: WHERE id = ? AND user_id = ?
    const { data: orderRaw, error: orderError } = await supabase
      .from('orders')
      .select('*, restaurants(name, delivery_min, delivery_max)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!orderRaw) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get driver name if assigned
    let driverName: string | null = null;
    if (orderRaw.driver_user_id) {
      const { data: driver } = await supabase
        .from('users')
        .select('name')
        .eq('id', orderRaw.driver_user_id)
        .maybeSingle();
      driverName = driver?.name ?? null;
    }

    const order = {
      ...orderRaw,
      restaurant_name: orderRaw.restaurants?.name,
      delivery_min: orderRaw.restaurants?.delivery_min,
      delivery_max: orderRaw.restaurants?.delivery_max,
      driver_name: driverName,
      restaurants: undefined,
    };

    // Fetch order items
    const { data: rawOrderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    const orderItemIds = (rawOrderItems || []).map((i: OrderItem) => i.id);
    let allSelections: OrderItemSelection[] = [];

    if (orderItemIds.length > 0) {
      const { data: selections, error: selError } = await supabase
        .from('order_item_selections')
        .select('*, menu_item_options(group_id, menu_item_option_groups(name))')
        .in('order_item_id', orderItemIds);

      if (!selError && selections) {
        allSelections = selections.map((s: Record<string, unknown>) => {
          const { menu_item_options, ...rest } = s;
          const opts = menu_item_options as Record<string, unknown> | null;
          const grp = opts?.menu_item_option_groups as Record<string, unknown> | null;
          return {
            ...rest,
            group_name: grp?.name ?? null,
          };
        }) as unknown as OrderItemSelection[];
      }
    }

    const orderItems: OrderItem[] = (rawOrderItems || []).map((item: OrderItem) => ({
      ...item,
      selections: allSelections.filter((s: OrderItemSelection) => s.order_item_id === item.id),
    }));

    // Get existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    // Get existing driver rating
    let existingDriverRating: number | null = null;
    if (order.driver_user_id) {
      const { data: driverRating } = await supabase
        .from('driver_ratings')
        .select('rating')
        .eq('order_id', orderId)
        .maybeSingle();
      existingDriverRating = driverRating?.rating ?? null;
    }

    return Response.json({ order, orderItems, existingReview: existingReview || null, existingDriverRating });
  } catch (error) {
    console.error('Get order error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
