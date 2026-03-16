import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { sendDriverAccepted } from '@/lib/email';
import { Order } from '@/lib/types';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { jobId, sessionId, orderId, restaurantName, restaurantAddress, restaurantCoords, deliveryAddress, customerCoords, payAmount, tip, isSimulated, totalMiles, estimatedMinutes } = await request.json();

    const db = getDb();

    if (!isSimulated && orderId) {
      // For default (unowned) restaurants, always ensure status is 'ready' so the
      // driver can pick up without waiting for a non-existent owner.
      const orderRow = db.prepare(
        'SELECT restaurant_id FROM orders WHERE id = ?'
      ).get(orderId) as { restaurant_id: number } | undefined;
      const isOwned = orderRow
        ? !!db.prepare('SELECT 1 FROM restaurant_owners WHERE restaurant_id = ?').get(orderRow.restaurant_id)
        : false;

      const result = db.prepare(`
        UPDATE orders
        SET driver_user_id = ?,
            status = CASE
              WHEN ? = 0 THEN 'ready'
              WHEN status = 'ready' THEN 'ready'
              ELSE 'preparing'
            END,
            dispatched_to = NULL,
            dispatch_expires_at = NULL
        WHERE id = ? AND driver_user_id IS NULL
      `).run(userId, isOwned ? 1 : 0, orderId);

      if (result.changes === 0) {
        return Response.json({ error: 'already_taken' }, { status: 409 });
      }

      // Clean up available jobs entry if this came from the available list
      db.prepare(
        'DELETE FROM driver_available_jobs WHERE driver_user_id = ? AND order_id = ?'
      ).run(userId, orderId);
    }

    const result = db.prepare(`
      INSERT INTO driver_deliveries (session_id, order_id, is_simulated, restaurant_name, restaurant_address, restaurant_lat, restaurant_lng, delivery_address, customer_lat, customer_lng, pay_amount, tip, miles, estimated_minutes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted')
    `).run(sessionId, isSimulated ? null : orderId, isSimulated ? 1 : 0, restaurantName, restaurantAddress, restaurantCoords?.lat ?? null, restaurantCoords?.lng ?? null, deliveryAddress, customerCoords?.lat ?? null, customerCoords?.lng ?? null, payAmount, tip, totalMiles ?? 0, estimatedMinutes ?? 0);

    // Fire-and-forget: notify customer their driver is on the way
    if (!isSimulated && orderId) {
      const orderWithUser = db.prepare(`
        SELECT o.*, r.name as restaurant_name, u.email, u.name as user_name, du.name as driver_name
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        JOIN users u ON o.user_id = u.id
        LEFT JOIN users du ON du.id = o.driver_user_id
        WHERE o.id = ?
      `).get(orderId) as (Order & { restaurant_name: string; email: string; user_name: string }) | undefined;
      if (orderWithUser) {
        sendDriverAccepted(orderWithUser, orderWithUser.email, orderWithUser.user_name)
          .catch(err => console.error('Driver accepted email failed:', err));
      }
    }

    return Response.json({ deliveryId: result.lastInsertRowid });
  } catch (error) {
    console.error('Accept job error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
