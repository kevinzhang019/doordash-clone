import { NextRequest } from 'next/server';
import getDb from '@/db/database';

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

  const db = getDb();
  const order = db.prepare(
    'SELECT status FROM orders WHERE id = ? AND driver_user_id = ?'
  ).get(orderId, userId) as { status: string } | undefined;

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

  const db = getDb();
  db.prepare(
    'UPDATE orders SET estimated_delivery_at = ? WHERE id = ? AND driver_user_id = ?'
  ).run(estimated_delivery_at, orderId, userId);

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

  const db = getDb();
  const result = db.prepare(
    "UPDATE orders SET status = 'picked_up', updated_at = datetime('now') WHERE id = ? AND status = 'ready' AND driver_user_id = ?"
  ).run(orderId, userId);

  if (result.changes === 0) {
    return Response.json({ error: 'Order not ready or not yours' }, { status: 409 });
  }

  return Response.json({ ok: true });
}
