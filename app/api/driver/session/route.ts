import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { DriverSession } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  const { data: session } = await supabase
    .from('driver_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) return Response.json({ session: null, activeDelivery: null });

  // Check for an active delivery in this session
  const { data: delivery } = await supabase
    .from('driver_deliveries')
    .select('id, order_id, is_simulated, restaurant_name, restaurant_address, restaurant_lat, restaurant_lng, delivery_address, customer_lat, customer_lng, pay_amount, tip, miles, estimated_minutes')
    .eq('session_id', session.id)
    .eq('status', 'accepted')
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!delivery || delivery.is_simulated || !delivery.restaurant_lat || !delivery.customer_lat) {
    return Response.json({ session, activeDelivery: null });
  }

  // Fetch order status separately
  let orderStatus: string | null = null;
  let deliveryInstructions: string | null = null;
  let handoffOption: string | null = null;
  if (delivery.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('status, delivery_instructions, handoff_option')
      .eq('id', delivery.order_id)
      .single();
    if (order) {
      orderStatus = order.status;
      deliveryInstructions = order.delivery_instructions;
      handoffOption = order.handoff_option;
    }
  }

  const phase = orderStatus === 'picked_up' ? 'job_accepted_deliver' : 'job_accepted_pickup';

  const job = {
    id: `order_${delivery.order_id}`,
    isSimulated: false,
    orderId: delivery.order_id ?? undefined,
    restaurantName: delivery.restaurant_name,
    restaurantAddress: delivery.restaurant_address,
    restaurantCoords: { lat: delivery.restaurant_lat, lng: delivery.restaurant_lng },
    deliveryAddress: delivery.delivery_address,
    customerCoords: { lat: delivery.customer_lat, lng: delivery.customer_lng },
    items: [] as string[],
    payAmount: delivery.pay_amount,
    tip: delivery.tip,
    estimatedMinutes: delivery.estimated_minutes,
    totalMiles: delivery.miles,
    deliveryInstructions: deliveryInstructions ?? null,
    handoffOption: handoffOption ?? 'hand_off',
  };

  return Response.json({
    session,
    activeDelivery: {
      deliveryId: delivery.id,
      job,
      phase,
      orderStatus,
    },
  });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { action } = await request.json();

  if (action === 'start') {
    // End any existing active sessions first
    await supabase
      .from('driver_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('ended_at', null);

    const { data: session } = await supabase
      .from('driver_sessions')
      .insert({ user_id: userId, total_earnings: 0, deliveries_completed: 0 })
      .select()
      .single();

    return Response.json({ session }, { status: 201 });
  }

  if (action === 'end') {
    await supabase
      .from('driver_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('ended_at', null);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
