import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { deliveryId, orderId } = await request.json();
  const db = getDb();

  if (deliveryId) {
    db.prepare("UPDATE driver_deliveries SET status = 'cancelled' WHERE id = ?").run(deliveryId);
  }

  // Release the real order back to unassigned so any driver can pick it up again
  if (orderId) {
    db.transaction(() => {
      // Default (seeded) restaurants have no owner — reset to 'ready' so the next driver
      // can pick up immediately without waiting for a non-existent owner to approve.
      const order = db.prepare(
        'SELECT restaurant_id FROM orders WHERE id = ?'
      ).get(orderId) as { restaurant_id: number } | undefined;
      const isOwned = order
        ? !!db.prepare('SELECT 1 FROM restaurant_owners WHERE restaurant_id = ?').get(order.restaurant_id)
        : false;
      const resetStatus = isOwned ? 'placed' : 'ready';

      db.prepare(
        `UPDATE orders SET status = ?, updated_at = datetime('now'), driver_user_id = NULL, dispatched_to = NULL, dispatch_expires_at = NULL, estimated_delivery_at = NULL WHERE id = ?`
      ).run(resetStatus, orderId);
      // Clear all per-driver decline/available records so every driver gets a fresh shot
      db.prepare('DELETE FROM driver_job_declines WHERE order_id = ?').run(orderId);
      db.prepare('DELETE FROM driver_available_jobs WHERE order_id = ?').run(orderId);
      // Clear chat so the next driver starts fresh
      db.prepare('DELETE FROM messages WHERE order_id = ?').run(orderId);
    })();
  }

  return Response.json({ ok: true });
}
