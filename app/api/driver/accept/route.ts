import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { jobId, sessionId, orderId, restaurantName, restaurantAddress, deliveryAddress, payAmount, tip, isSimulated } = await request.json();

    const db = getDb();

    // If it's a real order, mark it as in_progress and assign driver
    if (!isSimulated && orderId) {
      db.prepare("UPDATE orders SET status = 'in_progress', driver_user_id = ? WHERE id = ? AND status = 'placed'").run(userId, orderId);
    }

    // Record the delivery
    const result = db.prepare(`
      INSERT INTO driver_deliveries (session_id, order_id, is_simulated, restaurant_name, restaurant_address, delivery_address, pay_amount, tip, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'accepted')
    `).run(sessionId, isSimulated ? null : orderId, isSimulated ? 1 : 0, restaurantName, restaurantAddress, deliveryAddress, payAmount, tip);

    return Response.json({ deliveryId: result.lastInsertRowid });
  } catch (error) {
    console.error('Accept job error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
