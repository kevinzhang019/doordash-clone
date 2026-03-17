import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .eq('driver_user_id', userId)
    .maybeSingle();

  if (!order) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ status: order.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const { estimated_delivery_at } = await request.json();

  const supabase = getSupabaseAdmin();
  await supabase
    .from('orders')
    .update({ estimated_delivery_at })
    .eq('id', orderId)
    .eq('driver_user_id', userId);

  return Response.json({ ok: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const { status } = await request.json();

  if (status !== 'picked_up') {
    return Response.json({ error: 'Invalid status transition' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: updated } = await supabase
    .from('orders')
    .update({ status: 'picked_up' })
    .eq('id', orderId)
    .eq('status', 'ready')
    .eq('driver_user_id', userId)
    .select('id')
    .maybeSingle();

  if (!updated) {
    return Response.json({ error: 'Order not ready or not yours' }, { status: 409 });
  }

  return Response.json({ ok: true });
}
