import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Order, OrderItem, Review } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const db = getDb();

    // IDOR prevention: WHERE id = ? AND user_id = ?
    const order = db.prepare(`
      SELECT o.*, r.name as restaurant_name, r.delivery_min, r.delivery_max,
             u.name as driver_name, o.estimated_delivery_at
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN users u ON u.id = o.driver_user_id
      WHERE o.id = ? AND o.user_id = ?
    `).get(orderId, userId) as Order | undefined;

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderItems = db.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).all(orderId) as OrderItem[];

    const existingReview = db.prepare(
      'SELECT * FROM reviews WHERE order_id = ?'
    ).get(orderId) as Review | undefined;

    return Response.json({ order, orderItems, existingReview: existingReview || null });
  } catch (error) {
    console.error('Get order error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
