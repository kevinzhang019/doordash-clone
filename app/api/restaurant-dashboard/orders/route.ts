import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const db = getDb();

  const orders = db.prepare(`
    SELECT o.id, o.status, o.subtotal, o.total, o.delivery_fee, o.placed_at, o.delivery_address,
           u.name as customer_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.restaurant_id = ? AND o.status IN ('placed', 'preparing', 'ready')
    ORDER BY o.placed_at DESC
  `).all(restaurantId) as {
    id: number; status: string; subtotal: number; total: number;
    delivery_fee: number; placed_at: string; delivery_address: string;
    customer_name: string;
  }[];

  const ordersWithItems = orders.map(order => {
    const items = db.prepare(
      'SELECT name, quantity, price FROM order_items WHERE order_id = ?'
    ).all(order.id) as { name: string; quantity: number; price: number }[];
    return { ...order, items };
  });

  return Response.json({ orders: ordersWithItems });
}
