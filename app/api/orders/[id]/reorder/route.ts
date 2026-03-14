import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const orderId = parseInt(idStr);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const db = getDb();

  // Verify order belongs to user
  const order = db.prepare('SELECT id, restaurant_id FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId) as
    { id: number; restaurant_id: number } | undefined;
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  // Fetch order items
  const orderItems = db.prepare(
    'SELECT menu_item_id, name, quantity FROM order_items WHERE order_id = ?'
  ).all(orderId) as { menu_item_id: number; name: string; quantity: number }[];

  if (orderItems.length === 0) return Response.json({ error: 'No items in order' }, { status: 400 });

  // Check availability for each item
  const available: { menu_item_id: number; quantity: number }[] = [];
  const skipped: string[] = [];

  for (const item of orderItems) {
    const menuItem = db.prepare(
      'SELECT id FROM menu_items WHERE id = ? AND is_available = 1'
    ).get(item.menu_item_id) as { id: number } | undefined;

    if (menuItem) {
      available.push({ menu_item_id: item.menu_item_id, quantity: item.quantity });
    } else {
      skipped.push(item.name);
    }
  }

  // Clear cart and re-add available items in a transaction
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    for (const item of available) {
      db.prepare(
        'INSERT INTO cart_items (user_id, restaurant_id, menu_item_id, quantity) VALUES (?, ?, ?, ?)'
      ).run(userId, order.restaurant_id, item.menu_item_id, item.quantity);
    }
  });

  txn();

  return Response.json({ added: available.length, skipped });
}
