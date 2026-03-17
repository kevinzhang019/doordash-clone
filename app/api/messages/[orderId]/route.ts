import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Message } from '@/lib/types';

async function getOrder(orderId: number) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('orders')
    .select('user_id, driver_user_id, status')
    .eq('id', orderId)
    .maybeSingle();
  return data as { user_id: number; driver_user_id: number | null; status: string } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId: orderIdStr } = await params;
  const orderId = parseInt(orderIdStr);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const order = await getOrder(orderId);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.user_id !== userId && order.driver_user_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (order.status === 'delivered') return Response.json({ messages: [] });

  const supabase = getSupabaseAdmin();
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users!sender_user_id(name)')
    .eq('order_id', orderId)
    .order('sent_at', { ascending: true });

  // Flatten sender_name from the join
  const formatted = (messages || []).map((m: Record<string, unknown>) => {
    const { sender, ...rest } = m;
    return {
      ...rest,
      sender_name: (sender as { name: string } | null)?.name ?? null,
    };
  }) as unknown as Message[];

  return Response.json({ messages: formatted });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId: orderIdStr } = await params;
  const orderId = parseInt(orderIdStr);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const order = await getOrder(orderId);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.user_id !== userId && order.driver_user_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { content } = await request.json();
  if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 });

  // Determine role from the order relationship, not the header
  const senderRole = userId === order.driver_user_id ? 'driver' : 'customer';

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('messages')
    .insert({ order_id: orderId, sender_user_id: userId, sender_role: senderRole, content: content.trim() })
    .select('id')
    .single();

  if (error) {
    console.error('Insert message error:', error);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
