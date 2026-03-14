import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { jobId, sessionId, orderId, restaurantName, restaurantAddress, restaurantCoords, deliveryAddress, customerCoords, payAmount, tip, isSimulated, totalMiles, estimatedMinutes } = await request.json();

    const db = getDb();

    if (!isSimulated && orderId) {
      const result = db.prepare(`
        UPDATE orders
        SET driver_user_id = ?,
            status = CASE WHEN status = 'ready' THEN 'ready' ELSE 'preparing' END,
            dispatched_to = NULL,
            dispatch_expires_at = NULL
        WHERE id = ? AND driver_user_id IS NULL
      `).run(userId, orderId);

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

    return Response.json({ deliveryId: result.lastInsertRowid });
  } catch (error) {
    console.error('Accept job error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
