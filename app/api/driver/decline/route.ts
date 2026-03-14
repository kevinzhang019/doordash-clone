import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await request.json();
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  const db = getDb();

  db.transaction(() => {
    db.prepare(
      'INSERT OR IGNORE INTO driver_job_declines (driver_user_id, order_id) VALUES (?, ?)'
    ).run(userId, orderId);

    db.prepare(`
      UPDATE orders
      SET dispatched_to = NULL, dispatch_expires_at = NULL, declined_count = declined_count + 1
      WHERE id = ? AND dispatched_to = ?
    `).run(orderId, userId);

    db.prepare(
      'INSERT OR IGNORE INTO driver_available_jobs (driver_user_id, order_id) VALUES (?, ?)'
    ).run(userId, orderId);
  })();

  return Response.json({ ok: true });
}
