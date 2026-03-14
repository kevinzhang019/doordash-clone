import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  const orders = db.prepare(`
    SELECT o.id, o.status, o.placed_at, o.total, o.estimated_delivery_at,
           r.name as restaurant_name, r.delivery_min, r.delivery_max
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.user_id = ? AND o.status != 'delivered'
    ORDER BY o.placed_at DESC
  `).all(userId) as {
    id: number; status: string; placed_at: string; total: number;
    restaurant_name: string; delivery_min: number; delivery_max: number;
  }[];

  return Response.json({ orders });
}
