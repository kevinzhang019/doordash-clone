import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Review } from '@/lib/types';

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
  const reviews = db.prepare(`
    SELECT * FROM reviews
    WHERE restaurant_id = ?
    ORDER BY created_at DESC
  `).all(restaurantId) as Review[];

  return Response.json({ reviews });
}
