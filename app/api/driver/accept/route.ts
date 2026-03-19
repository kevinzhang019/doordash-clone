import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendDriverAccepted } from '@/lib/email';
import { Order } from '@/lib/types';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { jobId, sessionId, orderId, restaurantName, restaurantAddress, restaurantCoords, deliveryAddress, customerCoords, payAmount, tip, isSimulated, totalMiles, estimatedMinutes } = await request.json();

    const supabase = getSupabaseAdmin();

    if (!isSimulated && orderId) {
      // For default (unowned) restaurants, always ensure status is 'ready' so the
      // driver can pick up without waiting for a non-existent owner.
      const { data: orderRow } = await supabase
        .from('orders')
        .select('restaurant_id, status')
        .eq('id', orderId)
        .maybeSingle();

      if (orderRow?.status === 'cancelled') {
        return Response.json({ error: 'order_cancelled' }, { status: 409 });
      }

      let isOwned = false;
      if (orderRow) {
        const { data: ownerRow } = await supabase
          .from('restaurant_owners')
          .select('id')
          .eq('restaurant_id', orderRow.restaurant_id)
          .maybeSingle();
        isOwned = !!ownerRow;
      }

      const newStatus = !isOwned ? 'ready' : undefined;

      // Try to claim the order
      let updateQuery = supabase
        .from('orders')
        .update({
          driver_user_id: userId,
          ...(newStatus ? { status: newStatus } : {}),
          dispatched_to: null,
          dispatch_expires_at: null,
        })
        .eq('id', orderId)
        .is('driver_user_id', null)
        .neq('status', 'cancelled');

      const { data: updated } = await updateQuery.select('id').maybeSingle();

      if (!updated) {
        return Response.json({ error: 'already_taken' }, { status: 409 });
      }

      // If it's an owned restaurant and the status was already 'ready', keep it;
      // otherwise for owned restaurants we leave the status as-is (preparing/placed)
      // The update above only sets status to 'ready' for unowned restaurants.

      // Clean up available jobs entry if this came from the available list
      await supabase
        .from('driver_available_jobs')
        .delete()
        .eq('driver_user_id', userId)
        .eq('order_id', orderId);
    }

    const { data: deliveryData } = await supabase
      .from('driver_deliveries')
      .insert({
        session_id: sessionId,
        order_id: isSimulated ? null : orderId,
        is_simulated: isSimulated ? true : false,
        restaurant_name: restaurantName,
        restaurant_address: restaurantAddress,
        restaurant_lat: restaurantCoords?.lat ?? null,
        restaurant_lng: restaurantCoords?.lng ?? null,
        delivery_address: deliveryAddress,
        customer_lat: customerCoords?.lat ?? null,
        customer_lng: customerCoords?.lng ?? null,
        pay_amount: payAmount,
        tip,
        miles: totalMiles ?? 0,
        estimated_minutes: estimatedMinutes ?? 0,
        status: 'accepted',
      })
      .select('id')
      .single();

    // Fire-and-forget: notify customer their driver is on the way
    if (!isSimulated && orderId) {
      const { data: orderWithUser } = await supabase
        .from('orders')
        .select('*, restaurants(name), users!orders_user_id_fkey(email, name)')
        .eq('id', orderId)
        .single();

      if (orderWithUser) {
        const restaurant = orderWithUser.restaurants as unknown as { name: string };
        const user = orderWithUser.users as unknown as { email: string; name: string };
        const driverUserData = await supabase.from('users').select('name').eq('id', userId).single();
        const orderForEmail = { ...orderWithUser, restaurant_name: restaurant.name, driver_name: driverUserData.data?.name } as Order & { restaurant_name: string; driver_name: string };
        sendDriverAccepted(orderForEmail, user.email, user.name)
          .catch(err => console.error('Driver accepted email failed:', err));
      }
    }

    return Response.json({ deliveryId: deliveryData?.id });
  } catch (error) {
    console.error('Accept job error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
