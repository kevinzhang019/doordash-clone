import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, rating } = await request.json();

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const db = getDb();

    const order = db.prepare(`
      SELECT id, user_id, driver_user_id, status
      FROM orders
      WHERE id = ? AND user_id = ?
    `).get(orderId, userId) as { id: number; user_id: number; driver_user_id: number | null; status: string } | undefined;

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'delivered') {
      return Response.json({ error: 'Order not yet delivered' }, { status: 400 });
    }
    if (!order.driver_user_id) {
      return Response.json({ error: 'No driver assigned to this order' }, { status: 400 });
    }

    try {
      db.prepare(`
        INSERT INTO driver_ratings (driver_user_id, customer_user_id, order_id, rating)
        VALUES (?, ?, ?, ?)
      `).run(order.driver_user_id, userId, orderId, rating);
    } catch {
      return Response.json({ error: 'Already rated this delivery' }, { status: 409 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Driver rating error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
