import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import type { Message } from '@/lib/types';

function getOrder(orderId: number) {
  const db = getDb();
  return db.prepare('SELECT user_id, driver_user_id FROM orders WHERE id = ?').get(orderId) as
    { user_id: number; driver_user_id: number | null } | undefined;
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

  const order = getOrder(orderId);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.user_id !== userId && order.driver_user_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM messages m
    JOIN users u ON u.id = m.sender_user_id
    WHERE m.order_id = ?
    ORDER BY m.sent_at ASC
  `).all(orderId) as Message[];

  return Response.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const userRole = request.headers.get('x-user-role') ?? '';
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId: orderIdStr } = await params;
  const orderId = parseInt(orderIdStr);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const order = getOrder(orderId);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
  if (order.user_id !== userId && order.driver_user_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { content } = await request.json();
  if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 });

  const senderRole = userRole === 'driver' ? 'driver' : 'customer';

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO messages (order_id, sender_user_id, sender_role, content) VALUES (?, ?, ?, ?)'
  ).run(orderId, userId, senderRole, content.trim());

  return Response.json({ id: result.lastInsertRowid });
}
