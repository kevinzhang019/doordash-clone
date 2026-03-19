import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import { sendOrderCancelledByRestaurant } from '@/lib/email';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
  return owner?.restaurant_id ?? null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const { status } = await request.json();
  if (status !== 'preparing' && status !== 'ready') {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Atomic compare-and-set: update only if order exists, belongs to restaurant, and isn't completed
  // This prevents race conditions from concurrent status updates
  const { data: updated } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '("picked_up","delivered")')
    .select('id')
    .maybeSingle();

  if (!updated) {
    return Response.json({ error: 'Order not found or already completed' }, { status: 403 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Fetch order — only allow cancelling if it belongs to this restaurant and hasn't been picked up
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_intent_id, user_id, total, subtotal, delivery_fee, tip, tax, delivery_address, placed_at, restaurant_id, driver_user_id')
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.status === 'cancelled') return Response.json({ error: 'Order already cancelled' }, { status: 409 });
  if (order.status === 'picked_up' || order.status === 'delivered') {
    return Response.json({ error: 'Cannot cancel an order that has already been picked up' }, { status: 409 });
  }

  // Cancel the order
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled', driver_user_id: null, dispatched_to: null })
    .eq('id', orderId);

  if (updateError) return Response.json({ error: 'Failed to cancel order' }, { status: 500 });

  // Remove from driver available jobs queue
  await supabase.from('driver_available_jobs').delete().eq('order_id', orderId);

  // Issue Stripe refund
  if (order.payment_intent_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.refunds.create({ payment_intent: order.payment_intent_id });
    } catch (err) {
      console.error('Stripe refund failed for order', orderId, err);
    }
  }

  // Send cancellation email to customer
  try {
    const { data: customer } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', order.user_id)
      .maybeSingle();

    const { data: items } = await supabase
      .from('order_items')
      .select('id, order_id, menu_item_id, name, price, quantity')
      .eq('order_id', orderId);

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', order.restaurant_id)
      .maybeSingle();

    if (customer && items && restaurant) {
      await sendOrderCancelledByRestaurant(
        { ...order, restaurant_name: restaurant.name },
        items,
        customer.email,
        customer.name
      );
    }
  } catch (err) {
    console.error('Failed to send cancellation email for order', orderId, err);
  }

  return Response.json({ ok: true });
}
