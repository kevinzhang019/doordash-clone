import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  const orders = db.prepare(`
    SELECT o.id, o.status, o.placed_at, o.total, o.estimated_delivery_at, o.delivered_at,
           r.name as restaurant_name, r.delivery_min, r.delivery_max,
           o.driver_user_id, u.name as driver_name
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    LEFT JOIN users u ON u.id = o.driver_user_id
    WHERE o.user_id = ?
    ORDER BY o.placed_at DESC
    LIMIT 20
  `).all(userId) as {
    id: number; status: string; placed_at: string; total: number;
    estimated_delivery_at: string | null; delivered_at: string | null;
    restaurant_name: string; delivery_min: number; delivery_max: number;
    driver_user_id: number | null; driver_name: string | null;
  }[];

  return Response.json({ orders });
}
