import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { sendDeliveryReceipt } from '@/lib/email';
import { Order, OrderItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { deliveryId, sessionId, orderId, isSimulated } = await request.json();

    const db = getDb();

    const txn = db.transaction(() => {
      // Mark delivery complete
      db.prepare("UPDATE driver_deliveries SET status = 'delivered', delivered_at = datetime('now') WHERE id = ?").run(deliveryId);

      // If real order, mark as delivered and clear chat
      if (!isSimulated && orderId) {
        db.prepare("UPDATE orders SET status = 'delivered', delivered_at = datetime('now') WHERE id = ?").run(orderId);
        db.prepare('DELETE FROM messages WHERE order_id = ?').run(orderId);
      }

      // Get delivery pay info
      const delivery = db.prepare('SELECT pay_amount, tip FROM driver_deliveries WHERE id = ?').get(deliveryId) as { pay_amount: number; tip: number } | undefined;
      const earned = (delivery?.pay_amount || 0) + (delivery?.tip || 0);

      // Update session earnings
      db.prepare('UPDATE driver_sessions SET total_earnings = total_earnings + ?, deliveries_completed = deliveries_completed + 1 WHERE id = ?').run(earned, sessionId);

      return earned;
    });

    const earned = txn();

    const session = db.prepare('SELECT * FROM driver_sessions WHERE id = ?').get(sessionId);

    // Fire-and-forget delivery receipt email
    if (!isSimulated && orderId) {
      const orderWithUser = db.prepare(`
        SELECT o.*, r.name as restaurant_name, u.email, u.name as user_name
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `).get(orderId) as (Order & { restaurant_name: string; email: string; user_name: string }) | undefined;
      if (orderWithUser) {
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];
        sendDeliveryReceipt(orderWithUser, items, orderWithUser.email, orderWithUser.user_name)
          .catch(err => console.error('Delivery receipt email failed:', err));
      }
    }

    return Response.json({ success: true, earned, session });
  } catch (error) {
    console.error('Complete delivery error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
