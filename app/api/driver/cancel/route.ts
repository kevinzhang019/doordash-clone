import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendDriverCancellation } from '@/lib/email';
import { Order } from '@/lib/types';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { deliveryId, orderId } = await request.json();
  const supabase = getSupabaseAdmin();

  if (deliveryId) {
    await supabase
      .from('driver_deliveries')
      .update({ status: 'cancelled' })
      .eq('id', deliveryId);
  }

  // Release the real order back to unassigned so any driver can pick it up again
  if (orderId) {
    // Default (seeded) restaurants have no owner — reset to 'ready' so the next driver
    // can pick up immediately without waiting for a non-existent owner to approve.
    const { data: order } = await supabase
      .from('orders')
      .select('restaurant_id')
      .eq('id', orderId)
      .maybeSingle();

    let resetStatus = 'ready';
    if (order) {
      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('id')
        .eq('restaurant_id', order.restaurant_id)
        .maybeSingle();
      if (ownerRow) resetStatus = 'placed';
    }

    await supabase
      .from('orders')
      .update({
        status: resetStatus,
        driver_user_id: null,
        dispatched_to: null,
        dispatch_expires_at: null,
        estimated_delivery_at: null,
      })
      .eq('id', orderId);

    // Clear all per-driver decline/available records so every driver gets a fresh shot
    await supabase.from('driver_job_declines').delete().eq('order_id', orderId);
    await supabase.from('driver_available_jobs').delete().eq('order_id', orderId);

    // Add the order back to available jobs for the cancelling driver so it shows in their sidebar
    await supabase
      .from('driver_available_jobs')
      .upsert({ driver_user_id: userId, order_id: orderId }, { onConflict: 'driver_user_id,order_id', ignoreDuplicates: true });

    // Clear chat so the next driver starts fresh
    await supabase.from('messages').delete().eq('order_id', orderId);
  }

  // Fire-and-forget cancellation email (only for real orders)
  if (orderId) {
    const { data: orderWithUser } = await supabase
      .from('orders')
      .select('*, restaurants(name), users!orders_user_id_fkey(email, name)')
      .eq('id', orderId)
      .single();

    if (orderWithUser) {
      const restaurant = orderWithUser.restaurants as unknown as { name: string };
      const user = orderWithUser.users as unknown as { email: string; name: string };
      const orderForEmail = { ...orderWithUser, restaurant_name: restaurant.name } as Order & { restaurant_name: string };
      sendDriverCancellation(orderForEmail, user.email, user.name)
        .catch(err => console.error('Cancellation email failed:', err));
    }
  }

  return Response.json({ ok: true });
}
