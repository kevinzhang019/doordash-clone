import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const db = getDb();
  const hours = db.prepare('SELECT * FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week').all(restaurantId);

  // Return all 7 days — fill in defaults if not set
  const result = Array.from({ length: 7 }, (_, i) => {
    const existing = (hours as { day_of_week: number; open_time: string; close_time: string; is_closed: number }[]).find(h => h.day_of_week === i);
    return existing || { restaurant_id: restaurantId, day_of_week: i, open_time: '09:00', close_time: '21:00', is_closed: 0 };
  });

  return Response.json({ hours: result });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const { hours } = await request.json();
    if (!Array.isArray(hours)) return Response.json({ error: 'hours must be an array' }, { status: 400 });

    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(restaurant_id, day_of_week) DO UPDATE SET
        open_time = excluded.open_time,
        close_time = excluded.close_time,
        is_closed = excluded.is_closed
    `);

    const txn = db.transaction(() => {
      for (const h of hours) {
        upsert.run(restaurantId, h.day_of_week, h.open_time, h.close_time, h.is_closed ? 1 : 0);
      }
    });
    txn();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update hours error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
