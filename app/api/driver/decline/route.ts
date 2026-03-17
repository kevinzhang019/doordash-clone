import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await request.json();
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Insert decline record (ignore if already exists)
  await supabase
    .from('driver_job_declines')
    .upsert({ driver_user_id: userId, order_id: orderId }, { onConflict: 'driver_user_id,order_id', ignoreDuplicates: true });

  // Clear dispatch and increment declined count
  // First get the current order to check dispatched_to
  const { data: order } = await supabase
    .from('orders')
    .select('declined_count')
    .eq('id', orderId)
    .eq('dispatched_to', userId)
    .maybeSingle();

  if (order) {
    await supabase
      .from('orders')
      .update({
        dispatched_to: null,
        dispatch_expires_at: null,
        declined_count: (order.declined_count ?? 0) + 1,
      })
      .eq('id', orderId)
      .eq('dispatched_to', userId);
  }

  // Add to available jobs (ignore if already exists)
  await supabase
    .from('driver_available_jobs')
    .upsert({ driver_user_id: userId, order_id: orderId }, { onConflict: 'driver_user_id,order_id', ignoreDuplicates: true });

  return Response.json({ ok: true });
}
