import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, rating } = await request.json();

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: order } = await supabase
      .from('orders')
      .select('id, user_id, driver_user_id, status')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'delivered') {
      return Response.json({ error: 'Order not yet delivered' }, { status: 400 });
    }
    if (!order.driver_user_id) {
      return Response.json({ error: 'No driver assigned to this order' }, { status: 400 });
    }

    const { error } = await supabase
      .from('driver_ratings')
      .insert({
        driver_user_id: order.driver_user_id,
        customer_user_id: userId,
        order_id: orderId,
        rating,
      });

    if (error) {
      // Unique constraint violation means already rated
      if (error.code === '23505') {
        return Response.json({ error: 'Already rated this delivery' }, { status: 409 });
      }
      throw error;
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Driver rating error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
