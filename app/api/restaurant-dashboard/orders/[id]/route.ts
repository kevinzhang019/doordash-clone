import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const { status } = await request.json();
  if (status !== 'preparing' && status !== 'ready') {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    UPDATE orders SET status = ?, updated_at = datetime('now')
    WHERE id = ? AND restaurant_id = ? AND status NOT IN ('picked_up', 'delivered')
  `).run(status, orderId, restaurantId);

  if (result.changes === 0) {
    return Response.json({ error: 'Order not found or already completed' }, { status: 403 });
  }

  return Response.json({ ok: true });
}
