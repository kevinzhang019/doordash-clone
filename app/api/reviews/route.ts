import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, rating, comment } = await request.json();

    if (!orderId || !rating || !comment?.trim()) {
      return Response.json({ error: 'orderId, rating, and comment are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const db = getDb();

    // Verify the order belongs to this user and get restaurant_id
    const order = db.prepare(
      'SELECT id, restaurant_id, user_id FROM orders WHERE id = ? AND user_id = ?'
    ).get(orderId, userId) as { id: number; restaurant_id: number; user_id: number } | undefined;

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get reviewer name from user record
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string };
    const nameParts = user.name.trim().split(' ');
    const reviewerName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0];

    const result = db.prepare(`
      INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment, reviewer_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, order.restaurant_id, orderId, rating, comment.trim(), reviewerName);

    return Response.json({ reviewId: result.lastInsertRowid }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return Response.json({ error: 'You have already reviewed this order' }, { status: 409 });
    }
    console.error('Post review error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
