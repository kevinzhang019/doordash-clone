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

  // Release the real order back to unassigned so another driver can pick it up
  if (orderId) {
    db.prepare(
      "UPDATE orders SET status = 'placed', driver_user_id = NULL, dispatched_to = NULL, dispatch_expires_at = NULL WHERE id = ?"
    ).run(orderId);
  }

  return Response.json({ ok: true });
}
